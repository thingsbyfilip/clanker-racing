'use strict';
// Level: Midnight Circuit.
// ---------------- MIDNIGHT CIRCUIT (Montreal by night, street grid over rolling hills) ----------------
const CITY_V=[[-360,-240],[0,-240],[0,-360],[360,-360],[360,-120],[240,-120],[240,120],[360,120],[360,360],[-120,360],[-120,120],[-360,120]];
const cityPark=(bx,bz)=>hash2(bx*7+3,bz*13+5)<0.16;
const cityGM=v=>{ const q=((v%120)+120)%120; return Math.min(q,120-q); };         // distance to the nearest street centre line (streets every 120 units)

// ---- building parts ----
const WALLS=[[1,0],[-1,0],[0,1],[0,-1]];
// One cool, restrained palette for the whole city (no bright orange, pink or yellow), so every building has the same vibe.
// The same window colours are used on the shop fronts and on the upper floors, so the two sections don't contrast.
const SHOP_PAL=[[.42,.43,.48],[.37,.38,.44],[.46,.46,.50],[.33,.22,.23],[.37,.24,.23]];  // lower sections: greystone and brick
const APT_PAL=[[.34,.28,.30],[.32,.29,.30],[.28,.31,.37],[.34,.31,.30]];              // apartment towers
const AWNINGS=[[.18,.34,.42],[.20,.30,.50],[.16,.38,.40]];
const WINDOW_LIGHT=[[.70,.90,1],[.55,.80,1],[.85,.95,1]];                             // windows, shop windows, doors
const NEON=[[.30,.75,1],[.35,.90,.95],[.50,.65,1]];                                   // sign strips, neon signs, tower crowns
// a flat, lit (not emissive) panel on a wall facing (nx,nz); c = building centre, so the normal points away from the building
function wallPanel(m,px,py,pz,nx,nz,w,h,col,c){
  const tx=-nz, tz=nx;
  m.quad([px-tx*w/2,py-h/2,pz-tz*w/2],[px+tx*w/2,py-h/2,pz+tz*w/2],[px+tx*w/2,py+h/2,pz+tz*w/2],[px-tx*w/2,py+h/2,pz-tz*w/2],col,[c[0],py,c[1]]);
}
// Ground floor: along every wall, a run of shop fronts (lit window, sign strip, awning), doors and the odd garage door. Everything is placed
// relative to the ground at its own spot, so on a slope the shops follow it. Windows start well above the pavement, never at ground level.
function storefronts(m,rnd,x0,z0,x1,z1,pTop){
  const c=[(x0+x1)/2,(z0+z1)/2]; let garages=0;
  for(const [nx,nz] of WALLS){
    const len=nx?z1-z0:x1-x0, wx=nx?(nx>0?x1:x0):c[0], wz=nz?(nz>0?z1:z0):c[1], tx=-nz, tz=nx;
    let a=-len/2+2.5;
    while(a<len/2-2.5){
      const uw=Math.min(5.5+rnd()*4, len/2-2.5-a); if(uw<3.5) break;
      const off=a+uw/2, px=wx+tx*off, pz=wz+tz*off, ox=nx*0.12, oz=nz*0.12;
      const g=Math.max(hAt(px,pz),hAt(px+tx*uw/2,pz+tz*uw/2),hAt(px-tx*uw/2,pz-tz*uw/2)), k=rnd();
      if(g+5.6<pTop){
        if(k<0.2&&garages<2){                                              // garage door: slatted panel with a lit strip above
          garages++; const gw=Math.min(uw*0.85,6.5);
          [[.36,.37,.42],[.29,.30,.35],[.36,.37,.42]].forEach((col,i)=>wallPanel(m,px+ox,g+0.7+i*1.4,pz+oz,nx,nz,gw,1.4,col,c));
          m.em=true; wallQuad(m,px+nx*0.14,g+4.5,pz+nz*0.14,nx,nz,gw*0.9,0.4,WINDOW_LIGHT[1]); m.em=false;
        } else if(k<0.8){                                                  // shop: big lit window, sign strip, awning
          m.em=true;
          wallQuad(m,px+ox,g+2.7,pz+oz,nx,nz,uw*0.8,2.8,WINDOW_LIGHT[(rnd()*WINDOW_LIGHT.length)|0]);
          if(rnd()<0.7){ wallQuad(m,px+nx*0.14,g+5.0,pz+nz*0.14,nx,nz,uw*0.84,1.2,NEON[(rnd()*NEON.length)|0]); rnd(); }   // (that spare rnd() keeps the city's layout: the blocks are chosen from the same stream)
          m.em=false;
          if(rnd()<0.65) m.box(px+nx*0.95,g+4.25,pz+nz*0.95,nx?1.8:uw*0.9,0.3,nz?1.8:uw*0.9,AWNINGS[(rnd()*AWNINGS.length)|0]);
        } else {                                                           // door with a lamp over it
          wallPanel(m,px+ox,g+1.5,pz+oz,nx,nz,1.8,3,[.08,.08,.1],c);
          m.em=true; wallQuad(m,px+nx*0.14,g+3.4,pz+nz*0.14,nx,nz,1.2,0.35,WINDOW_LIGHT[0]); m.em=false;
        }
      }
      a+=uw+0.5+rnd()*1.5;
    }
  }
}
// rooftop clutter: air-conditioning units, a water tank, sometimes a mast with a red lamp
function roofProps(m,rnd,x0,z0,x1,z1,y){
  const w=x1-x0, d=z1-z0, rx=()=>x0+2.5+rnd()*(w-5), rz=()=>z0+2.5+rnd()*(d-5);
  for(let i=0,n=2+((rnd()*3)|0);i<n;i++) m.box(rx(),y+0.6,rz(),1.8,1.2,1.3,[.34,.35,.4]);
  if(rnd()<0.4){ const x=rx(), z=rz();
    for(const [ax,az] of [[-1,-1],[1,-1],[-1,1],[1,1]]) m.box(x+ax*.9,y+.8,z+az*.9,.2,1.6,.2,[.2,.2,.24]);
    m.box(x,y+2.7,z,2.6,2.2,2.6,[.34,.25,.18]); m.cone(x,y+3.8,z,1.9,1,8,[.28,.2,.15]); }
  if(rnd()<0.5){ const x=rx(), z=rz(); m.box(x,y+1.5,z,.5,3,.5,[.2,.2,.24]); m.em=true; m.box(x,y+3.2,z,.7,.7,.7,[1,.1,.1]); m.em=false; }
}

// ---- signs (emissive plates on posts, with flat symbols floated in front) ----
// symbols are lists of triangles in the plate's own (u,v) coordinates: u along the plate (to the right of someone facing it), v up
const SYM_CHEVRON=[[[-1,1.3],[-.1,1.3],[.3,0]],[[-.1,1.3],[1.2,0],[.3,0]],[[.3,0],[1.2,0],[-.1,-1.3]],[[.3,0],[-.1,-1.3],[-1,-1.3]]];
function signBoard(m,x,z,nx,nz,w,h,plate,syms,symCol,flip,lit){
  const g=hAt(x,z), s=flip?-1:1, ux=nz*s, uz=-nx*s, cy=g+2.2+h/2, th=0.3, f=th/2+0.3;
  for(const o of [-w*0.3,w*0.3]) m.box(x+ux*o-nx*0.3,(g-0.6+cy)/2,z+uz*o-nz*0.3,0.28,cy-g+0.6,0.28,[.12,.12,.15]);
  m.em=!!lit; m.prism(x-ux*w/2,z-uz*w/2,x+ux*w/2,z+uz*w/2,th/2,cy-h/2,cy+h/2,plate); m.em=true;
  for(const t of syms){ const P=([u,v])=>[x+nx*f+ux*u,cy+v,z+nz*f+uz*u]; m.tri(P(t[0]),P(t[1]),P(t[2]),symCol,[0,0,0]); }
  m.em=false;
}

// ---- Montreal ----
// The look of downtown Montreal, the same throughout the level: low brick and greystone terraces with iron stairs along every street, towers rising straight
// behind them, stone churches with tin spires, and copper roofs.
// Brick and greystone are muted so the moonlight keeps the level's blue-violet look; windows and neon keep the cool colours above.
const MTL_BRICK=[[.37,.23,.22],[.33,.21,.23],[.40,.27,.24],[.30,.22,.26],[.36,.26,.27]];
const MTL_GREY=[[.42,.43,.48],[.37,.38,.44],[.46,.46,.50]];                           // Montreal greystone
const MTL_TRIM=[[.50,.50,.56],[.17,.21,.24],[.21,.30,.28],[.34,.20,.22]];             // painted cornices
const MTL_SLATE=[[.16,.18,.24],[.20,.22,.29],[.30,.33,.38]];                          // false mansards
const MTL_IRON=[.08,.08,.12], MTL_GLASS=[.06,.07,.11], MTL_COPPER=[.24,.44,.40], MTL_TIN=[.56,.60,.68], MTL_STONE=[.54,.53,.59];
// plots: w = plot width, depth, fh = floor height, yard = strip in front of the wall (the block's collision box still ends at the pavement)
const MTL_PLEX={w:10.5,depth:17,fh:4.2,yard:3.6,floors:[2,3,3],span:3,cols:[-.27,.27],lit:.6,ww:1.7,wh:2.7,stairs:true,mansard:.34,shop:.2,tree:.3,pal:MTL_BRICK,grey:.4};
const MTL_STONE_ROW={w:19,depth:23,fh:4.6,yard:.9,floors:[4,4,5],span:1,cols:[-.32,0,.32],lit:.5,ww:1.8,wh:2.9,stairs:false,mansard:0,hip:true,shop:.3,tree:0,pal:MTL_GREY,grey:1};
const mtlPick=(rnd,a)=>a[(rnd()*a.length)|0];
// a vertical band between two points (stair rails and stringers); no culling here, so it shows from both sides
function mtlBand(m,a,b,y0,y1,col){ m.quad([a[0],a[1]+y0,a[2]],[b[0],b[1]+y0,b[2]],[b[0],b[1]+y1,b[2]],[a[0],a[1]+y1,a[2]],col,[(a[0]+b[0])/2+.1,(a[1]+b[1])/2,(a[2]+b[2])/2+.07]); }
// The exterior iron staircase, the signature of a Montreal street: one straight flight of solid steps on a beam along the wall, from a to b. a is the far end of a landing
// level with the deck (a[1] = the deck's top), LL long, reached through the opening in the deck's railing. hw = half its width, (nx,nz) = out from the wall; one railing, on the outer side
const MTL_LANDING=2.3;
function mtlStair(m,a,b,hw,nx,nz,col){ const LL=MTL_LANDING, H=Math.hypot(b[0]-a[0],b[2]-a[2]), ux=(b[0]-a[0])/H, uz=(b[2]-a[2])/H, n=clamp(Math.round((a[1]-b[1])/1.15),4,9), L=(H-LL)/n*1.12, tread=[col[0]+.13,col[1]+.13,col[2]+.15], At=(d,y)=>[a[0]+ux*d,y,a[2]+uz*d], top=a[1];
  { const c=At(LL/2,top-.23); m.box(c[0],c[1],c[2],nx?hw*2:LL,.46,nx?LL:hw*2,tread); }                                                  // the landing
  for(let i=1;i<=n;i++){ const c=At(LL+(H-LL)*(i-.5)/n,lerp(top,b[1],i/n)-.23); m.box(c[0],c[1],c[2],nx?hw*2:L,.46,nx?L:hw*2,tread); }
  strut(m,At(0,top-.72),At(LL,top-.72),.26,.26,col); strut(m,At(LL-.12,top-.72),[b[0],b[1]-.55,b[2]],.3,.3,col);                      // the beam under the steps runs into a flat one under the landing, so no end hangs free
  const E=(p,up)=>[p[0]+nx*(hw-.26),p[1]+up,p[2]+nz*(hw-.26)], R=[At(.22,top),At(LL-.22,top),At(H-.3,b[1])];     // set in from the edge, so its posts stand on the steps
  for(let i=0;i<2;i++) strut(m,E(R[i],1.15),E(R[i+1],1.15),.08,.08,col); for(const p of R) strut(m,E(p,-.08),E(p,1.15),.08,.08,col); }
// one plot: a plex, an old stone warehouse or a brick mill, its front at (px,pz) facing (nx,nz). T = the terrace it belongs to, near = worth the detail
function mtlPlot(m,rnd,S,px,pz,nx,nz,w,T,near){
  const tx=-nz, tz=nx, D=S.depth, ax=px-tx*w/2, az=pz-tz*w/2, bx=px+tx*w/2-nx*D, bz=pz+tz*w/2-nz*D;
  const [lo,hi]=footprint(Math.min(ax,bx),Math.min(az,bz),Math.max(ax,bx),Math.max(az,bz));
  const g=hAt(px,pz), y0=hi+.3, top=y0+T.floors*S.fh+.6, cx=px-nx*D/2, cz=pz-nz*D/2, sx=nx?D:w, sz=nx?w:D, F=(a,n)=>[px+tx*a+nx*n,pz+tz*a+nz*n];
  m.box(cx,(lo-1.5+top)/2,cz,sx,top-lo+1.5,sz,T.wall);
  const [cox,coz]=F(0,.1); m.box(cox,top+.25,coz,nx?1.5:w+.12,.8,nx?w+.12:1.5,T.trim);                     // the projecting cornice
  if(near){ const [dx,dz]=F(0,.13); wallPanel(m,dx,top-.5,dz,nx,nz,w-.2,.7,[T.trim[0]*.6,T.trim[1]*.6,T.trim[2]*.6],[cx,cz]); }
  // storeys, counted down from the roof so that a slope only makes the lowest one taller
  const shop=T.shop&&near, doors=S.stairs&&near;
  for(let f=T.floors-1;f>=0;f--){ const y=y0+(f+.5)*S.fh; if(shop&&f===0) continue;
    for(const k of S.cols){ const [wx,wz]=F(k*w,.12), wg=hAt(wx,wz); if(y-S.wh/2<wg+1.2) continue;
      if(rnd()<S.lit){ m.em=true; wallQuad(m,wx,y,wz,nx,nz,S.ww,S.wh,mtlPick(rnd,WINDOW_LIGHT)); m.em=false; }
      else if(near) wallPanel(m,wx,y,wz,nx,nz,S.ww,S.wh,MTL_GLASS,[cx,cz]);
      if(near){ const [lx,lz]=F(k*w,.16); wallPanel(m,lx,y+S.wh/2+.25,lz,nx,nz,S.ww+.5,.32,T.trim,[cx,cz]); } }
    if(doors&&f>0){ const [wx,wz]=F(0,.14); wallPanel(m,wx,y-.55,wz,nx,nz,1.1,2.9,T.door,[cx,cz]); } }
  if(S.hip){ const rh=4.2+rnd()*1.6; gable(m,cx-sx/2-.3,cz-sz/2-.3,cx+sx/2+.3,cz+sz/2+.3,top+.6,rh,T.roof,!!nz,T.wall);
    if(near) for(const k of [-.25,.25]){ const [dx,dz]=F(k*w,-3); m.box(dx,top+2.3,dz,nx?1.9:2,1.8,nx?2:1.9,T.roof); const [ex,ez]=F(k*w,-1.9); m.em=true; wallQuad(m,ex,top+2.3,ez,nx,nz,1,1.1,WINDOW_LIGHT[0]); m.em=false; }
    m.box(cx-tx*w/2,top+rh*.7,cz-tz*w/2,nx?D*.4:.8,rh*1.4,nx?.8:D*.4,T.wall); }                               // firewall chimney between the roofs
  if(T.mansard){ const a=[...F(-w/2,.2)], b=[...F(w/2,.2)], c=[...F(w/2,-1.5)], d=[...F(-w/2,-1.5)], ym=top+.6, yt=ym+3.2, o=[cx,top-3,cz];   // a false mansard: one steep slate slope on a flat roof
    m.quad([a[0],ym,a[1]],[b[0],ym,b[1]],[c[0],yt,c[1]],[d[0],yt,d[1]],T.roof,o);
    const q=F(0,-1.5-(D-1.5)/2); m.box(q[0],(ym+yt)/2,q[1],nx?D-1.5:w,yt-ym,nx?w:D-1.5,[.17,.17,.21]);
    for(const [e,f] of [[a,d],[b,c]]) m.tri([e[0],ym,e[1]],[f[0],ym,f[1]],[f[0],yt,f[1]],T.roof,o);
    if(near){ const [dx,dz]=F(0,-.2), dy=ym+1.6; m.box(dx,dy,dz,nx?1.6:2,1.9,nx?2:1.6,T.trim); const [ex,ez]=F(0,.65); m.em=rnd()<.6; (m.em?wallQuad:wallPanelGlass)(m,ex,dy,ez,nx,nz,1.2,1.2,WINDOW_LIGHT[1]); m.em=false; } }
  if(shop){ const [sx0,sz0]=F(0,.12), sg=g+.0, h0=Math.max(sg+3.1,y0-2.2), col=mtlPick(rnd,NEON), yS=h0+2.1;
    m.em=true; wallQuad(m,sx0,h0-.3,sz0,nx,nz,w*.8,3.1,mtlPick(rnd,WINDOW_LIGHT));
    wallQuad(m,sx0+nx*.04,yS+.08,sz0+nz*.04,nx,nz,w*.92,2.3,col); rnd();
    m.em=false;
    const [ax3,az3]=F(0,.95); m.box(ax3,h0+1.2,az3,nx?1.8:w*.9,.3,nx?w*.9:1.8,mtlPick(rnd,AWNINGS)); }
  if(!doors) return;
  // ground floor door, galleries on the upper floors, and the stair from the first gallery down to the pavement
  const yB=y0+S.fh-.15; if(yB<g+2.6) return;
  const [dx,dz]=F(0,.12); if(y0+.5>g+.3&&!shop){ const dh=Math.min(3,yB-g-.3); wallPanel(m,dx,g+dh/2,dz,nx,nz,1.3,dh,T.door,[cx,cz]); }
  for(let f=1;f<T.floors;f++){ const y=y0+f*S.fh-.15, [bx1,bz1]=F(0,1.1);             // a solid deck, with one railing along its outer edge
    m.box(bx1,y-.15,bz1,nx?2.2:w-.5,.4,nx?w-.5:2.2,T.trim);
    const r0=-T.stairSide*(w/2-.25), r1=f===1?T.stairSide*(w*.44-MTL_LANDING+.22):-r0, [qx,qz]=F((r0+r1)/2,2.1), rl=Math.abs(r1-r0); m.box(qx,y+1.2,qz,nx?.14:rl,.16,nx?rl:.14,T.iron);   // (on the first floor the railing stops where the stair's rail bends, and gets a post)
    if(f===1){ const [ex,ez]=F(r1,2.1); m.box(ex,y+.6,ez,.14,1.2,.14,T.iron); } }
  const sgn=T.stairSide, ts=sgn*(w*.44-.22), corner=F(ts,2.1), rail=F(ts,2.2+2*T.stairW-.26);
  for(const k of [-sgn*.46*w,ts]){ const [qx,qz]=F(k,2.1), qg=hAt(qx,qz); m.box(qx,(yB+1.2+qg)/2,qz,.18,yB+1.2-qg,.18,T.iron); }
  strut(m,[corner[0],yB+1.2,corner[1]],[rail[0],yB+1.2,rail[1]],.08,.08,T.iron);                                // the short rail closing the landing's far end, from the deck's corner post to the stair's rail
  const a=F(sgn*w*.44,2.2+T.stairW), b=F(-sgn*w*.42,2.2+T.stairW);
  mtlStair(m,[a[0],yB+.05,a[1]],[b[0],hAt(b[0],b[1])+.46,b[1]],T.stairW,nx,nz,T.iron);
}
const wallPanelGlass=(m,x,y,z,nx,nz,w,h)=>wallPanel(m,x,y,z,nx,nz,w,h,MTL_GLASS,[x-nx,z-nz]);
// a street tree on the pavement, just past the yard and at the low end of the stairs, so its crown passes over the bottom steps and clears the rails and decks.
// No collider: the block's collision box stops a car before it gets this close
function mtlTree(m,x,z,s){ const y=hAt(x,z); m.box(x,y+2.5*s,z,.32*s,5*s,.32*s,[.2,.15,.12]); ball(m,x,y+5.8*s,z,1.5*s,[.13,.27,.18],5,3); }
// the Metro's sign: a blue plate with a white arrow pointing down, on a post
function mtlMetro(m,x,z,nx,nz){ const y=hAt(x,z), ux=nz, uz=-nx, P=(u,v)=>[x+nx*.2+ux*u,y+v,z+nz*.2+uz*u];
  m.box(x,y+2.3,z,.22,4.6,.22,[.14,.14,.18]); m.em=true; wallQuad(m,x+nx*.13,y+4.9,z+nz*.13,nx,nz,2,2,[.08,.28,.86]);
  m.quad(P(-.2,5.5),P(.2,5.5),P(.2,4.8),P(-.2,4.8),[1,1,1],[0,0,0]); m.tri(P(-.6,4.8),P(.6,4.8),P(0,4.2),[1,1,1],[0,0,0]); m.em=false; }

// ---- towers and stone landmarks, scattered evenly over the level (simplified and unnamed: the silhouette is what counts) ----
function mtlSlab(m,rnd,x0,z0,x1,z1,y0,y1,col,prob,gx,gy,sw,sh,glow){ m.box((x0+x1)/2,(y0+y1)/2,(z0+z1)/2,x1-x0,y1-y0,z1-z0,col); wallWindows(m,rnd,x0,z0,x1,z1,y0+4,y1-2,glow||[WINDOW_LIGHT[0],WINDOW_LIGHT[1]],prob,gx,gy,sw,sh); }
// A tower with half widths (hx,hz) from y0 to y1, in one of the shapes of the skyline:
// 0 pale office block; 1 stepped, under a copper pyramid; 2 corners notched back near the top; 3 dark slab with green-blue glass; 4 pale stone, in three tiers; 5 cross-shaped in plan
function mtlTower(m,rnd,cx,cz,hx,hz,y0,y1,kind){
  const S=(a,b,c,d,col,p,gx,gy,sw,sh,glow)=>mtlSlab(m,rnd,cx-a,cz-b,cx+a,cz+b,c,d,col,p,gx,gy,sw,sh,glow), band=(a,b,y,col)=>{ m.em=true; m.box(cx,y,cz,a*2+.4,.6,b*2+.4,col); m.em=false; }, h=y1-y0;
  if(kind===1){ const col=[.40,.40,.48], c=y0+h*.8; S(hx,hz,y0,c,col,.72,4,4.6,.6,.6); S(hx*.74,hz*.74,c,y1,col,.72,4,4.6,.6,.6); band(hx*.74,hz*.74,y1+.3,NEON[1]);
    const r=Math.hypot(hx,hz)*.74; m.cone(cx,y1+.6,cz,r,r*.86,4,MTL_COPPER); m.box(cx,y1+r*.86+3,cz,.6,8,.6,[.3,.3,.35]); }
  else if(kind===2){ const col=[.48,.44,.46], a=y0+h*.8, b=y0+h*.92; S(hx,hz,y0,a,col,.75,3.6,4.2,.55,.6); S(hx*.78,hz*.78,a,b,col,.75,3.6,4.2,.55,.6); S(hx*.52,hz*.52,b,y1,col,.75,3.6,4.2,.55,.6); band(hx*.52,hz*.52,y1+.3,NEON[2]); }
  else if(kind===3){ S(hx,hz*.5,y0,y1,[.10,.13,.17],.55,3,3.4,.8,.5,[[.50,.86,.86],WINDOW_LIGHT[1]]); }
  else if(kind===4){ let y=y0; [[1,.55],[.8,.84],[.56,1]].forEach(([r,e],i)=>{ const ax=hx*r, az=hz*r, t=y0+h*e; S(ax,az,y,t,MTL_STONE,.58,4.2,4.6,.5,.62,[WINDOW_LIGHT[0]]); m.box(cx,t+.5,cz,ax*2+1.6,1,az*2+1.6,[.56,.55,.6]); y=t; }); }
  else if(kind===5){ const L=Math.max(hx,hz), W=L*.36, col=[.46,.47,.54]; for(const [a,b] of [[L,W],[W,L]]){ S(a,b,y0,y1,col,.82,4,4.8,.72,.6); band(a,b,y1+.5,NEON[0]); } m.em=true; m.box(cx,y1+4,cz,3,8,3,[.85,.95,1]); m.em=false; }
  else { S(hx,hz,y0,y1,[.42,.42,.50],.74,3.6,4.2,.62,.6); band(hx,hz,y1+.3,NEON[0]); }
}
// a whole block for one tall tower on a podium of shops
function mtlPlazaTower(m,rnd,x0,z0,x1,z1,kind,h){ const cx=(x0+x1)/2, cz=(z0+z1)/2, [lo,hi]=footprint(x0,z0,x1,z1), a=hi+12;
  m.box(cx,(lo-1.5+a)/2,cz,x1-x0,a-lo+1.5,z1-z0,MTL_GREY[(rnd()*3)|0]); storefronts(m,rnd,x0,z0,x1,z1,a); wallWindows(m,rnd,x0,z0,x1,z1,hi+8.6,a-1.6,[WINDOW_LIGHT[0]],.6,4.6,4,.5,.68);
  m.box(cx,a+.4,cz,x1-x0+1.4,.8,z1-z0+1.4,[.50,.50,.56]); mtlTower(m,rnd,cx,cz,27,27,a+.8,hi+h,kind); rects.push([cx,cz,(x1-x0)/2+.4,(z1-z0)/2+.4]); }
// a copper dome on a drum, over a stone nave
function mtlDome(m,rnd,x0,z0,x1,z1){ const cx=(x0+x1)/2, cz=(z0+z1)/2, [lo,hi]=footprint(cx-24,cz-31,cx+24,cz+31), y=hi+20;
  m.box(cx,(lo-1.5+y)/2,cz,48,y-lo+1.5,62,MTL_STONE); gable(m,cx-24.5,cz-31.5,cx+24.5,cz+31.5,y,9,MTL_COPPER,false,MTL_STONE);
  wallWindows(m,rnd,cx-24,cz-31,cx+24,cz+31,hi+9,y-3,[WINDOW_LIGHT[1]],.8,6.5,8,.42,.72);
  cylY(m,cx,y,cz,14,15,12,MTL_STONE,MTL_STONE); ball(m,cx,y+15,cz,15.5,MTL_COPPER,12,10); cylY(m,cx,y+29,cz,2.4,6,8,MTL_STONE); m.cone(cx,y+35,cz,2.6,4,8,MTL_COPPER); m.box(cx,y+41,cz,.5,4,.5,[.7,.7,.74]); m.box(cx,y+41.5,cz,1.8,.5,.5,[.7,.7,.74]);
  rects.push([cx,cz,24.6,31.6]); }
// a stone church on its own small square: two square towers with silver tin spires, a triple portal, a rose window, a copper roof. Its front faces the nearer road
function mtlChurch(m,rnd,x0,z0,x1,z1){ const cx=(x0+x1)/2, sg0=roadDist(cx,z0-3)<roadDist(cx,z1+3)?-1:1, f=sg0<0?z0+14:z1-14, b=sg0<0?z1-1:z0+1, zc=(f+b)/2, len=Math.abs(b-f), [lo,hi]=footprint(x0,z0,x1,z1), W=21, fz=f+sg0*1.65, g=hAt(cx,fz+sg0), wy=g+31, ty=g+62, stone=[.56,.55,.60], rib=[.40,.40,.46];
  m.box(cx,(lo-1.5+wy)/2,zc,W*2,wy-lo+1.5,len,stone); gable(m,cx-W-.5,zc-len/2,cx+W+.5,zc+len/2,wy,14,MTL_COPPER,false,stone);
  for(const sg of [-1,1]){ const tx=cx+sg*(W-5.5), tz=f-sg0*5; m.box(tx,(lo-1.5+ty)/2,tz,13,ty-lo+1.5,13,stone); m.box(tx,ty+.6,tz,14.4,1.2,14.4,[.60,.59,.63]);
    m.cone(tx,ty+1.2,tz,6.6,27,8,MTL_TIN); m.box(tx,ty+30,tz,.4,4,.4,[.7,.7,.74]); m.box(tx,ty+30.4,tz,1.5,.4,.4,[.7,.7,.74]);
    for(const y of [g+30.8,g+47]){ m.em=true; wallQuad(m,tx,y,fz-sg0*.04,0,sg0,3,9,[.42,.55,.95]); m.em=false; wallPanel(m,tx,y-5.6,fz-sg0*.0,0,sg0,4.6,.6,[.5,.5,.54],[tx,tz]); } }
  m.box(cx,(lo-1.5+g+37.4)/2,f+sg0*.7,18,g+38.9-lo,.8,stone);
  for(const y of [g+12,g+24.5,g+37]) m.box(cx,y,f+sg0*1.5,44,.8,.9,rib); for(const a of [-20.6,-8,8,20.6]) m.box(cx+a,(lo+g+37)/2,f+sg0*1.5,1.3,g+37-lo,.9,rib);   // the stone frame stops below the gable, which rises behind it
  for(const sg of [-1,0,1]){ const px=cx+sg*14.3, py=g+4.4; wallPanel(m,px,g+5.3,fz,0,sg0,5.4,10.6,rib,[px,f]); m.em=true; wallQuad(m,px,py,fz+sg0*.05,0,sg0,3.6,7,[.85,.95,1]); m.tri([px-1.8,py+3.5,fz+sg0*.05],[px+1.8,py+3.5,fz+sg0*.05],[px,py+6,fz+sg0*.05],[.85,.95,1],[0,0,0]); m.em=false; }
  m.em=true; const r=[], rz=fz+sg0*.05; for(let i=0;i<12;i++){ const a=i/12*Math.PI*2; r.push([cx+Math.cos(a)*3.4,g+18.2+Math.sin(a)*3.4,rz]); } for(let i=0;i<12;i++) m.tri([cx,g+18.2,rz],r[i],r[(i+1)%12],i&1?[.42,.55,.95]:[.60,.72,1],[0,0,0]); m.em=false;
  wallWindows(m,rnd,cx-W,zc-len/2,cx+W,zc+len/2,g+15,wy-5,[[.42,.55,.95]],.85,7.5,12,.34,.78);
  rects.push([cx,zc,W+.4,len/2+.4]); }

LEVELS.city={
  id:'city', seed:11, name:'MIDNIGHT CIRCUIT', sub:'Rush hour, midnight edition!',
  loc:'Montreal, Quebec', flag:'ca',
  blurb:'Why go off-roading when you can race through a lit-up downtown after dark? Just pay attention to where the track goes and try not to hit any lampposts.',
  theme:{
    skyTop:[0.01,0.02,0.08], skyHor:[0.20,0.09,0.30], fog:[0.07,0.05,0.16], fogN:80, fogF:700,
    amb:[.46,.50,.74], hemi:[.12,.14,.22], sun:[.26,.30,.50], light:[-.4,.7,.5], night:true, snow:false, body:{yaw:-.8,y:.80,r:.035,col:[.8,.9,1]},
    street:[.30,.30,.36], walk:[.50,.50,.57], plaza:[.34,.34,.39], park:[.12,.30,.16],
    dust:{road:[.62,.62,.68],off:[.55,.55,.6],ice:[.9,.95,1],a:.55,sz:.8},
    map:{bg:'rgba(14,14,26,0.88)',road:'#ffd36a',edge:'#050508'}
  },
  phys:{gripRoad:8,gripOff:6,gripIce:2,dragRoad:.12,dragOff:.3,dragIce:.05,maxOff:.9},
  rim:40,
  hills(x,z){ return 13*Math.sin(x/210+0.6)*Math.cos(z/260-0.4)+8*Math.sin((x+z)/170+1)+3*Math.sin(x/70)*Math.sin(z/90); },
  trackPts(){ return startNear(resampleClosed(roundedLoop(CITY_V,56,10),M),-360,-60); },
  layout(){
    const sAt=(x,z)=>track[nearestTrack(x,z).i].s;
    const mid=(a,b,f)=>{ const A=CITY_V[a], B=CITY_V[b]; return sAt(lerp(A[0],B[0],f),lerp(A[1],B[1],f)); };
    return {gates:[mid(0,1,.5),mid(2,3,.5),mid(3,4,.5),mid(5,6,.5),mid(8,9,.5),mid(9,10,.5),mid(10,11,.5)],
            jumps:[[mid(0,1,.25),5],[mid(2,3,.75),6],[mid(7,8,.5),6],[mid(8,9,.2),7]]}; },
  prepare(){ const raw=new Float32Array(M); for(let i=0;i<M;i++) raw[i]=this.hills(track[i].x,track[i].z); this.prof=smoothArr(raw,5); this.lamps=[]; },
  profile(s){ return arrProfile(this.prof,s)+jumpsSum(s); },
  base(x,z,th,d){ const far=smooth(HALFW+2,70,d); return th*(1-far)+this.hills(x,z)*far; },
  iceAt(){ return false; },
  color(c){
    const T=THEME, street=Math.min(cityGM(c.cx),cityGM(c.cz));
    if(c.d<HALFW){ return (c.s<0.0035||c.s>0.9985)?[.92,.92,.92]:T.street; }
    if(street<HALFW+1) return T.street;
    if(street<HALFW+7) return T.walk;
    return cityPark(Math.floor(c.cx/120),Math.floor(c.cz/120))?T.park:T.plaza;
  },
  decor(m,rnd){
    const pal=[[.20,.22,.34],[.26,.22,.36],[.18,.28,.32],[.32,.26,.26],[.24,.26,.30],[.15,.18,.28]];
    const winSets=[WINDOW_LIGHT], coolSet=WINDOW_LIGHT, pick=a=>a[(rnd()*a.length)|0];
    // keep building corners off the road (rounded corners cut into the neighbouring block)
    const fit=(x0,z0,x1,z1)=>{
      for(let it=0;it<3;it++){ let moved=false;
        for(const [cx,cz,sx,sz] of [[x0,z0,1,1],[x1,z0,-1,1],[x0,z1,1,-1],[x1,z1,-1,-1]])
          if(nearestTrack(cx,cz).d<HALFW+5){ if(sx>0)x0+=8; else x1-=8; if(sz>0)z0+=8; else z1-=8; moved=true; break; }
        if(!moved) break; }
      return (x1-x0>14&&z1-z0>14)?[x0,z0,x1,z1]:null; };
    // A building has a lower section (shops, a garage, doors, awnings; brick or concrete) and a different, set-back upper section:
    // an apartment block, a glassy office tower or a stepped tower. Small ones are low-rise shops with just the lower section.
    const building=(x0,z0,x1,z1,hgt)=>{
      const f=fit(x0,z0,x1,z1); if(!f) return; [x0,z0,x1,z1]=f;
      const cx=(x0+x1)/2, cz=(z0+z1)/2, w=x1-x0, d=z1-z0;
      const hs=[hAt(x0,z0),hAt(x1,z0),hAt(x0,z1),hAt(x1,z1),hAt(cx,cz),hAt(cx,z0),hAt(cx,z1),hAt(x0,cz),hAt(x1,cz)];
      const gmin=Math.min(...hs), gmax=Math.max(...hs), base=gmin-1.5, low=hgt<26;
      const pTop=gmax+(low?6+rnd()*3.5:5.8+rnd()*5), top=low?pTop:Math.max(gmax+hgt,pTop+12);
      m.box(cx,(base+pTop)/2,cz,w,pTop-base,d,pick(SHOP_PAL));
      storefronts(m,rnd,x0,z0,x1,z1,pTop);
      const lip=[.45,.45,.5];                                              // projecting parapet round the lower roof
      m.box(cx,pTop+0.4,z0,w+1,0.8,0.8,lip); m.box(cx,pTop+0.4,z1,w+1,0.8,0.8,lip); m.box(x0,pTop+0.4,cz,0.8,0.8,d+1,lip); m.box(x1,pTop+0.4,cz,0.8,0.8,d+1,lip);
      if(pTop>=gmax+9) wallWindows(m,rnd,x0,z0,x1,z1,gmax+7.2,pTop-1.5,pick(winSets),0.5,5,3.2);   // a second row of windows where the wall is tall (downhill side)
      let rx0=x0, rz0=z0, rx1=x1, rz1=z1, roofY=pTop+0.8, sign=[x0,z0,x1,z1,base,pTop];
      if(!low){
        const ins=()=>1.5+rnd()*3.5, kind=rnd();
        let a0=x0+ins(), a1=x1-ins(), b0=z0+ins(), b1=z1-ins();
        if(kind<0.4){                                                      // apartments: warm brick, dense windows, balconies on one wall
          m.box((a0+a1)/2,(pTop+top)/2,(b0+b1)/2,a1-a0,top-pTop,b1-b0,pick(APT_PAL));
          wallWindows(m,rnd,a0,b0,a1,b1,pTop+3.5,top-2,pick(winSets),0.62,4.4,4.0,0.45,0.5);
          const side=rnd()<.5?1:-1;
          for(let y=pTop+2.2;y<top-3;y+=8) if(rnd()<.7) m.box((a0+a1)/2,y,side>0?b1+0.6:b0-0.6,(a1-a0)*0.8,0.25,1.4,[.5,.5,.55]);
        } else if(kind<0.7){                                               // office tower: continuous bands of glass, neon trim on the crown
          const tc=pick(pal);
          m.box((a0+a1)/2,(pTop+top)/2,(b0+b1)/2,a1-a0,top-pTop,b1-b0,tc);
          wallWindows(m,rnd,a0,b0,a1,b1,pTop+3.2,top-2,coolSet,0.8,3.2,3.4,0.9,0.6);
          m.em=true; m.box((a0+a1)/2,top-0.6,(b0+b1)/2,a1-a0+0.5,0.5,b1-b0+0.5,pick(NEON)); m.em=false;
        } else {                                                           // stepped: a wide lower tier and a narrower crown
          const y1=pTop+(top-pTop)*0.55, c0=a0+(a1-a0)*0.18, c1=a1-(a1-a0)*0.18, e0=b0+(b1-b0)*0.18, e1=b1-(b1-b0)*0.18;
          m.box((a0+a1)/2,(pTop+y1)/2,(b0+b1)/2,a1-a0,y1-pTop,b1-b0,pick(APT_PAL));
          wallWindows(m,rnd,a0,b0,a1,b1,pTop+3.5,y1-2,pick(winSets),0.6,4.4,4.0,0.45,0.5);
          m.box((c0+c1)/2,(y1+top)/2,(e0+e1)/2,c1-c0,top-y1,e1-e0,pick(pal));
          wallWindows(m,rnd,c0,e0,c1,e1,y1+3.2,top-2,pick(winSets),0.7,3.8,3.6,0.5,0.55);
          a0=c0; a1=c1; b0=e0; b1=e1;
        }
        rx0=a0; rx1=a1; rz0=b0; rz1=b1; roofY=top; sign=[a0,b0,a1,b1,pTop,top];
      }
      roofProps(m,rnd,rx0,rz0,rx1,rz1,roofY);
      if(rnd()<.38){                                                       // neon sign on one wall
        const [sx0,sz0,sx1,sz1,yb,yt]=sign, scx=(sx0+sx1)/2, scz=(sz0+sz1)/2;
        const [nx,nz]=pick(WALLS), len=Math.min(sx1-sx0,sz1-sz0)*.6, col=pick(NEON);
        const px=nx?(nx>0?sx1:sx0)+nx*.3:scx, pz=nz?(nz>0?sz1:sz0)+nz*.3:scz, py=yb+(yt-yb)*(.45+rnd()*.4);
        m.em=true; m.box(px,py,pz,nx?.5:len,3.4,nz?.5:len,col); m.em=false; }
      rects.push([cx,cz,w/2+.4,d/2+.4]);
    };
    // A block of terraces: rows round the four sides with a lane (ruelle) and often a tower in the middle, so the towers rise straight behind the low brick and stone fronts
    const rowBlock=(x0,z0,x1,z1,S)=>{
      const y=S.yard, D=S.depth;
      for(const [nx,nz,a,b,f] of [[0,-1,x0,x1,z0+y],[0,1,x0,x1,z1-y],[-1,0,z0+y+D,z1-y-D,x0+y],[1,0,z0+y+D,z1-y-D,x1-y]]){
        const L=b-a, n=Math.max(1,Math.round(L/S.w)), w=L/n, tx=-nz, tz=nx; let T=null, lo=1e9, hi=-1e9, out=0;
        // one collision box per run of plots: from the back wall to the front wall, or to the pavement where the plots have their stairs in the yard
        const flush=()=>{ if(hi>lo){ const cA=(lo+hi)/2, hA=(hi-lo)/2+.4, cN=f+(nx+nz)*(out-D)/2, hN=(D+out)/2+.4; rects.push(nx?[cN,cA,hN,hA]:[cA,cN,hA,hN]); } lo=1e9; hi=-1e9; };
        for(let i=0;i<n;i++){
          if(i%S.span===0||!T){ const stone=rnd()<S.grey, wall=pick(stone?MTL_GREY:S.pal), v=.94+rnd()*.12;
            T={wall:[wall[0]*v,wall[1]*v,wall[2]*v],trim:pick(MTL_TRIM),roof:pick(MTL_SLATE),door:pick([[.10,.13,.16],[.14,.20,.20],[.22,.12,.13]]),floors:pick(S.floors),mansard:rnd()<S.mansard,stairSide:rnd()<.5?1:-1,stairW:rnd()<.28?.68:.78,iron:rnd()<.72?MTL_IRON:[.22,.25,.28]}; }
          const c=a+(i+.5)*w, px=nx?f:c, pz=nx?c:f, ex=px+nx*y, ez=pz+nz*y;
          if([-1,1].some(s=>nearestTrack(ex+tx*s*w/2,ez+tz*s*w/2).d<HALFW+5)||nearestTrack(px-nx*D,pz-nz*D).d<HALFW+5){ flush(); continue; }
          const near=roadDist(ex,ez)<78, T2={...T,shop:rnd()<S.shop}, o=S.stairs&&near?y:0;
          if(o!==out){ flush(); out=o; }
          mtlPlot(m,rnd,S,px,pz,nx,nz,w,T2,near); lo=Math.min(lo,c-w/2); hi=Math.max(hi,c+w/2);
          if(S.tree&&near&&!T2.shop&&rnd()<S.tree){ const q=-T.stairSide*w*.3, ax=ex+nx*1.2+tx*q, az=ez+nz*1.2+tz*q, s=.8+rnd()*.3; if(roadDist(ax,az)>=HALFW+6) mtlTree(m,ax,az,s); }
          if(near&&S.stairs&&rnd()<.012) mtlMetro(m,ex-nx*.9-tx*w/2,ez-nz*.9-tz*w/2,nx,nz);
        }
        flush();
      }
      if(rnd()<.62){ const cx=(x0+x1)/2, cz=(z0+z1)/2, hw=(x1-x0)/2-y-D-1.5, [t0,t1]=footprint(cx-hw,cz-hw,cx+hw,cz+hw);          // the tower behind
        const top=t1+55+rnd()*60, kind=pick([0,0,1,2,3,4]); mtlTower(m,rnd,cx,cz,hw,hw,t0-1.5,top,kind); rects.push([cx,cz,hw+.4,(kind===3?hw*.5:hw)+.4]); }   // (kind 3 is a slab half as deep)
    };
    // about one block in four, spread evenly, is a tall tower, a church or a dome
    const FEATURES=[(a,b,c,d)=>mtlPlazaTower(m,rnd,a,b,c,d,1,150),(a,b,c,d)=>mtlChurch(m,rnd,a,b,c,d),(a,b,c,d)=>mtlPlazaTower(m,rnd,a,b,c,d,5,135),(a,b,c,d)=>mtlPlazaTower(m,rnd,a,b,c,d,4,105),
      (a,b,c,d)=>mtlDome(m,rnd,a,b,c,d),(a,b,c,d)=>mtlPlazaTower(m,rnd,a,b,c,d,2,145),(a,b,c,d)=>mtlChurch(m,rnd,a,b,c,d),(a,b,c,d)=>mtlPlazaTower(m,rnd,a,b,c,d,3,120)];
    let fi=0;
    for(let bz=-4;bz<4;bz++) for(let bx=-4;bx<4;bx++){
      const x0=bx*120+23, x1=(bx+1)*120-23, z0=bz*120+23, z1=(bz+1)*120-23, mx=(x0+x1)/2, mz=(z0+z1)/2;
      if(Math.max(Math.abs(mx),Math.abs(mz))>440) continue;
      if(cityPark(bx,bz)){                                                 // a park of round maples
        for(let i=0;i<11;i++){ const x=x0+6+rnd()*(x1-x0-12), z=z0+6+rnd()*(z1-z0-12);
          if(nearestTrack(x,z).d<HALFW+6) continue; const y=hAt(x,z), s=.9+rnd()*.7;
          m.box(x,y+1.6*s,z,.6*s,3.2*s,.6*s,[.25,.17,.1]); ball(m,x,y+5.2*s,z,3.3*s,[.12,.3,.16],6,4); colliders.push([x,z,.9*s]); }
        continue; }
      if(((bx+4)*3+(bz+4)*5)%4===0&&fit(x0,z0,x1,z1)&&[[x0,z0],[x1,z0],[x0,z1],[x1,z1]].every(([x,z])=>nearestTrack(x,z).d>=HALFW+5)){ FEATURES[fi++%FEATURES.length](x0,z0,x1,z1); continue; }
      const r=rnd(), g=6, hg=()=>30+rnd()*46;
      if(r<.56) rowBlock(x0,z0,x1,z1,MTL_PLEX);                            // brick and greystone plexes with their iron stairs
      else if(r<.82) rowBlock(x0,z0,x1,z1,MTL_STONE_ROW);                  // taller greystone commercial rows with steep roofs and dormers
      else if(r<.92) building(x0+rnd()*3,z0+rnd()*3,x1-rnd()*3,z1-rnd()*3,hg()+15);
      else { building(x0,z0,mx-g/2,z1,hg()); building(mx+g/2,z0,x1,z1,hg()); }
    }
    // the horizon: a lower outer city
    for(let i=0;i<46;i++){
      const a=i/46*Math.PI*2+rnd()*.1, rad=560+rnd()*70, x=Math.cos(a)*rad, z=Math.sin(a)*rad, w=30+rnd()*25, d=30+rnd()*25, top=70+rnd()*110;
      windowedBox(m,rnd,x-w/2,z-d/2,x+w/2,z+d/2,-30,top,pal[(rnd()*pal.length)|0],winSets[(rnd()*winSets.length)|0],0.3,7,7);
      rects.push([x,z,w/2,d/2]);                                             // (towards the corners the ring stands inside the map, where a car can reach it)
    }
    // street lamps along the road (alternating sides), skipping the gates
    for(let i=3;i<M;i+=9){
      const t=track[i], side=((i/9)|0)&1?1:-1, x=t.x+t.tz*side*(HALFW+2.4), z=t.z-t.tx*side*(HALFW+2.4);
      if(GATES.some(g=>Math.hypot(g.x-x,g.z-z)<14)) continue;
      const y=hAt(x,z);
      m.box(x,y+3.6,z,.35,7.2,.35,[.16,.16,.2]);
      m.em=true; m.box(x,y+7.3,z,1.4,.4,1.4,[1,.82,.45]); m.em=false;
      colliders.push([x,z,.45]);
      this.lamps.push([t.x+t.tz*side*7,t.z-t.tx*side*7]);
    }
    this.guidance(m);
  },
  // Helping the player see where to drive: the corners have chevron boards on the outside of the bend.
  guidance(m){
    // find the bends along the track (runs of samples turning the same way)
    const hd=i=>{ const t=track[(i+M)%M]; return Math.atan2(t.tx,t.tz); }, turn=i=>angDiff(hd(i+1),hd(i));
    const lab=i=>{ const v=turn(i); return v>0.012?1:v<-0.012?-1:0; };     // +1: bending left, -1: right
    let s0=0; while(lab(s0)!==0) s0++;
    const arcs=[]; let cur=null;
    for(let k=1;k<=M;k++){ const i=(s0+k)%M, l=lab(i);
      if(l!==0&&cur&&cur.l===l){ cur.b=i; cur.sum+=turn(i); }
      else { if(cur&&cur.b-cur.a!==0&&Math.abs(cur.sum)>0.7) arcs.push(cur); cur=l!==0?{a:i,b:i,l,sum:turn(i)}:null; } }
    if(cur&&Math.abs(cur.sum)>0.7) arcs.push(cur);
    for(const A of arcs){
      const len=((A.b-A.a)+M)%M;
      for(const f of [0.18,0.5,0.82]){                                       // chevron boards on the outside of the bend, facing the road
        const t=track[(A.a+Math.round(len*f))%M], ox=-t.tz*A.l, oz=t.tx*A.l;   // outside = right of the track when bending left
        const x=t.x+ox*(HALFW+3.2), z=t.z+oz*(HALFW+3.2), nx=-ox, nz=-oz, ux=nz, uz=-nx;
        signBoard(m,x,z,nx,nz,4.4,3.8,[.8,.62,.08],SYM_CHEVRON,[.04,.04,.04],ux*t.tx+uz*t.tz<0,true);
        const px=nz*4.4*0.3, pz=-nx*4.4*0.3; wallRun([[x-px-nx*.3,z-pz-nz*.3],[x+px-nx*.3,z+pz-nz*.3]],.3);   // one wall from post to post: the board above is too low to drive under
      }
    }
  },
  // road markings: dashed yellow centre line and solid white edge lines, draped over the road
  marks(m){
    const strip=(i0,i1,off,w,col)=>{
      const a=track[i0%M], b=track[i1%M];
      const P=(t,sg)=>{ const x=t.x+t.tz*(off+sg*w), z=t.z-t.tx*(off+sg*w); return [x,hAt(x,z)+0.16,z]; };
      m.quad(P(a,-1),P(a,1),P(b,1),P(b,-1),col,'up'); };
    for(let i=0;i<M;i++){
      if(i%8<4) strip(i,i+1,0,.35,[.95,.82,.2]);
      strip(i,i+1,HALFW-1.6,.18,[.9,.9,.9]); strip(i,i+1,-(HALFW-1.6),.18,[.9,.9,.9]);
    }
  },
  glow(m){ for(const [x,z] of this.lamps){ groundDisc(m,x,z,10.5,[.13,.10,.05],14,0.25); groundDisc(m,x,z,5.5,[.16,.12,.06],12,0.27); } },
  mapBg(g,X,Z,sc){
    g.strokeStyle='#2a2a3a'; g.lineWidth=Math.max(3,26*sc); g.lineCap='butt';
    for(let k=-4;k<=4;k++){ g.beginPath(); g.moveTo(X(k*120),Z(-480)); g.lineTo(X(k*120),Z(480)); g.stroke(); g.beginPath(); g.moveTo(X(-480),Z(k*120)); g.lineTo(X(480),Z(k*120)); g.stroke(); }
    g.lineCap='round'; }
};
