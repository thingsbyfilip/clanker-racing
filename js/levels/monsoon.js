'use strict';
// Level: Monsoon Challenge.
// ---------------- MONSOON CHALLENGE (the Goa rainforest in the monsoon: a laterite road that gives way to mud, ruts and river fords, under trees 60 metres tall and in heavy rain) ----------------
const MS_V=[[-380,120],[-400,-60],[-330,-230],[-190,-320],[-40,-270],[70,-350],[230,-340],[360,-230],[390,-70],[300,40],[380,190],[310,340],[140,350],[30,240],[-100,320],[-260,350]];
// the stretches where the road has given way to natural ground (track positions): more than half of the lap
const MS_WILD=[[.16,.52],[.62,.90]];
const msWild=s=>{ let k=0; for(const [a,b] of MS_WILD) k=Math.max(k,smooth(a-.012,a+.012,s)*(1-smooth(b-.012,b+.012,s))); return k; };
const msRiverZ=x=>30+46*Math.sin(x/135+.9)+18*Math.sin(x/61);
const msRiverX=z=>-20+40*Math.sin(z/90+.4);
// a third river, a stream cutting across the second natural stretch of the track from the map's edge: a gentle wiggle through the road at track position .76
function msStream(){ const t=track[trackIndexAt(.76)], nx=t.tz, nz=-t.tx, pts=[]; const sg=(t.x*nx+t.z*nz)>0?1:-1; for(let u=-46;u<=320;u+=4){ const w=14*Math.sin(u/43); pts.push([t.x+nx*sg*u+t.tx*w,t.z+nz*sg*u+t.tz*w]); } return pts; }
const MS_GREEN=[[.1,.3,.13],[.13,.36,.15],[.08,.26,.14],[.17,.4,.14]], MS_FERN=[[.16,.42,.16],[.2,.48,.18],[.12,.36,.16]];
// a rainforest giant: tall bare trunk on buttress roots, the crown far overhead, lianas hanging from it
function msGiant(m,rnd,x,z,s){
  const y=hAt(x,z)-.4, h=(38+rnd()*30)*s, r=1.5*s, bark=[.34+rnd()*.08,.29,.22];
  frustum(m,x,y,z,r,r*.5,h,6,bark); m.cone(x,y,z,r*2.8,6*s,6,[bark[0]*.8,bark[1]*.8,bark[2]*.8]);
  for(let k=0;k<4;k++){ const a=rnd()*6.283, d=rnd()*7*s, c=MS_GREEN[(rnd()*4)|0]; m.rock(x+Math.cos(a)*d,y+h+(rnd()-.3)*5*s,z+Math.sin(a)*d,(9+rnd()*6)*s,c,rnd); }
  for(let k=0;k<3;k++){ const a=rnd()*6.283, d=(3+rnd()*5)*s, L=(10+rnd()*20)*s; m.box(x+Math.cos(a)*d,y+h-L/2,z+Math.sin(a)*d,.18,L,.18,[.16,.24,.12]); }
  colliders.push([x,z,r+.3]); }
function msUnderTree(m,rnd,x,z,s){ const y=hAt(x,z); m.box(x,y+4*s,z,.6*s,8*s,.6*s,[.3,.25,.18]); m.rock(x,y+9*s,z,4.5*s,MS_GREEN[(rnd()*4)|0],rnd); m.rock(x+2*s,y+7.5*s,z+1*s,3*s,MS_GREEN[(rnd()*4)|0],rnd); colliders.push([x,z,.6*s]); }
function msFern(m,rnd,x,z,s){ const y=hAt(x,z), c=MS_FERN[(rnd()*3)|0]; for(let k=0;k<6;k++){ const a=k/6*6.283+rnd()*.5, cc=Math.cos(a), sn=Math.sin(a); m.prism(x,z,x+cc*2*s,z+sn*2*s,.45*s,y+.8*s,y+.95*s,c); m.prism(x+cc*2*s,z+sn*2*s,x+cc*3*s,z+sn*3*s,.3*s,y+.2*s,y+.35*s,c); } }
function msBamboo(m,rnd,x,z){ const y=hAt(x,z); for(let k=0;k<9;k++){ const px=x+(rnd()-.5)*5, pz=z+(rnd()-.5)*5, h=12+rnd()*10; m.box(px,y+h/2,pz,.26,h,.26,k&1?[.42,.56,.22]:[.36,.5,.2]); m.cone(px,y+h-3,pz,1.5,5,4,[.25,.5,.18]); } colliders.push([x,z,1.8]); }
// a white Goan chapel near the road: nave under a tiled roof with a round apse behind, stepped gable front with two little domed towers, and no religious symbols
function msChapel(m,x,z,yaw){ const y=hAt(x,z)-.5, W=[.92,.9,.84], fx=Math.sin(yaw), fz=Math.cos(yaw), lx=fz, lz=-fx;
  orBox(m,x,z,16,9,y,y+8,yaw,W); orBox(m,x+fx*8.6,z+fz*8.6,1.2,12,y,y+12,yaw,W);
  for(const sg of [-1,1]) orBox(m,x+fx*8.6+lx*sg*5,z+fz*8.6+lz*sg*5,2.2,2.2,y,y+15,yaw,W);
  orBox(m,x+fx*9.3,z+fz*9.3,.2,2.4,y,y+4.5,yaw,[.2,.32,.5]);
  orBox(m,x,z,16,6,y+8,y+9.6,yaw,[.62,.28,.18]); colliders.push([x,z,7],[x+fx*6,z+fz*6,6],[x-fx*6,z-fz*6,6]);
  // the details, all inside those colliders. a = along the nave (+ is the front), b = across it, heights from y
  const TR=[.8,.64,.34], BL=[.2,.32,.5], DK=[.13,.16,.22], TL_=[.62,.28,.18], V=(a,b,h)=>[x+fx*a+lx*b,y+h,z+fz*a+lz*b],
        B=(a,b,len,wid,y0,y1,col)=>orBox(m,x+fx*a+lx*b,z+fz*a+lz*b,len,wid,y+y0,y+y1,yaw,col);
  B(0,0,16.2,9.2,0,1,TR);                                                                                       // plinth
  B(0,0,16.8,10.6,7.7,8.1,TR);                                                                                  // eaves cornice
  for(const sg of [-1,1]) m.quad(V(-8.4,sg*5.2,8.1),V(8,sg*5.2,8.1),V(8,0,12.4),V(-8.4,0,12.4),TL_,V(0,0,8));   // tiled roof
  m.tri(V(-8.4,-5.2,8.1),V(-8.4,5.2,8.1),V(-8.4,0,12.4),W,V(0,0,8)); B(0,0,16.8,.4,12.2,12.6,[.5,.22,.14]);     // rear gable, ridge
  for(const sg of [-1,1]){ for(const a of [-5,0,5]){ B(a,sg*4.55,1.7,.3,2.6,6.6,TR); B(a,sg*4.65,1.1,.3,3,6.2,BL); }     // tall windows along the nave
    for(const a of [-7.5,-2.5,2.5]) B(a,sg*5,1,1.2,0,6.2,W); }                                                  // buttresses
  { const [ax,az]=[x-fx*8,z-fz*8]; cylY(m,ax,y,az,3.6,7.2,10,W); m.cone(ax,y+7.2,az,4,3,10,TL_); }              // round apse behind the nave
  B(9.3,-1.5,.5,.5,0,5,TR); B(9.3,1.5,.5,.5,0,5,TR); B(9.3,0,.5,3.5,4.6,5.3,TR);                                // door frame
  B(9.3,0,.5,7.8,5.9,6.3,TR); B(8.6,0,1.5,7.8,11.7,12.1,TR);                                                    // bands across the front
  strut(m,V(9.1,0,8.8),V(9.45,0,8.8),1.15,1.15,TR); strut(m,V(9.1,0,8.8),V(9.6,0,8.8),.8,.8,BL);                // round window
  B(8.6,0,1.2,7.6,12.1,13.4,W); B(8.6,0,1.5,7.8,13.3,13.6,TR); B(8.6,0,1.2,4,13.6,14.9,W); B(8.6,0,1.5,4.2,14.8,15.1,TR);   // stepped gable above the front wall
  B(8.6,0,1,1.2,15.1,15.6,W); ball(m,...V(8.6,0,16.1),.6,TR,8,5);                                               // a stone ball where the cross stood
  for(const sg of [-1,1]){ const [px,py,pz]=V(8.6,sg*5,15);
    B(8.6,sg*5,2.4,1,11.4,13.8,DK); B(8.6,sg*5,1,2.4,11.4,13.8,DK); B(8.6,sg*5,2.5,2.5,14.7,15.1,TR);           // bell openings, tower cornice
    dome(m,px,py+.1,pz,1.15,BL,8,3); ball(m,px,py+1.5,pz,.28,TR,6,4); } }
LEVELS.monsoon={
  id:'monsoon', seed:233, name:'MONSOON CHALLENGE', sub:'Bring a snorkel!', go:'CHALO!',
  loc:'Goa, India', flag:'in',
  blurb:"During monsoon season, roads turn into mud, rivers become brown, and trees are obscured by rainfall. It's the best time for a challenging race through the rainforest!",
  tw:26,
  theme:{
    skyTop:[0.40,0.45,0.46], skyHor:[0.66,0.71,0.68], fog:[0.56,0.62,0.58], fogN:45, fogF:400, rain:true, rainN:11, rainCol:[.74,.8,.84],
    amb:[.50,.53,.50], hemi:[.20,.23,.20], sun:[.26,.27,.24], light:[.3,.8,.35], night:false, snow:false,
    water:[[.45,.32,.19],[.39,.27,.16]],
    road:[.27,.27,.28], roadAlt:[.24,.24,.25], roadEdge:[.5,.27,.16], mud:[.42,.23,.13], mudAlt:[.35,.19,.11], rut:[.26,.15,.09], moss:[.25,.38,.15], floor:[.15,.3,.13], floorAlt:[.19,.34,.14], bank:[.38,.26,.15], bed:[.3,.21,.13], rock:[.34,.32,.3],
    dust:{road:[.5,.4,.32],off:[.42,.26,.16],soft:[.46,.27,.15],ice:[.9,.95,1],a:.75,sz:1},
    map:{bg:'rgba(20,50,28,0.94)',road:'#e8b078',edge:'#1a0f08'}
  },
  phys:{gripRoad:5.5,gripOff:3.6,gripIce:2,dragRoad:.15,dragOff:.6,dragIce:.05,maxOff:.7},           // the same grip and drag as Snowy Mountain
  rim:60,
  hills(x,z){ return (fbm(x*.0055+11,z*.0055+4)-.5)*96+9*ridged(x*.013+6,z*.013)-2; },
  trackPts(){ return startNear(closedSpline(MS_V.map(p=>[p[0]*.87,p[1]*.87]),M),-340,-20); },
  layout(){ const riv=[]; for(let x=-540;x<=540;x+=20) riv.push([x,msRiverZ(x)]); for(let z=-540;z<=20;z+=20) riv.push([msRiverX(z),z]);
    return calmLayout([.07,.26,.36,.44,.6,.69,.84],[[.11,5],[.57,5]],.02,.06,crossingZones(riv,.03).concat(crossingZones(msStream(),.03))); },
  prepare(){
    const raw=new Float32Array(M); for(let i=0;i<M;i++){ const t=track[i], k=msWild(t.s); raw[i]=this.hills(t.x,t.z)*(1+.25*k); }
    const p=smoothArr(smoothArr(raw,9),5);
    for(let i=0;i<M;i++){ const t=track[i]; p[i]+=msWild(t.s)*(Math.sin(t.s*340)*.55+Math.sin(t.s*129+1)*.8); }    // the ground is rough where the road has gone
    this.prof=limitGrade(p,.21);
    const mk=(name,fn,a,b,w0)=>{ const dense=[]; for(let u=a;u<=b;u+=4) dense.push(fn(u)); return makeRiver(name,dense,d=>w0+3*Math.sin(d/64)); };
    RIVERS.push(mk('mandovi',x=>[x,msRiverZ(x)],-540,540,17),mk('tributary',z=>[msRiverX(z),z],-540,msRiverZ(-10)-8,11),makeRiver('stream',msStream(),d=>12+2*Math.sin(d/50)));
    // every crossing on the natural ground is a ford (the track itself dips into the river); on the road the river gets a bridge
    this.fords=[]; findBridges(()=>0); const cross=BRIDGES.slice(); BRIDGES.length=0;
    for(const r of RIVERS){ const mc=[]; let prev=1e9;
      for(const B of cross.filter(c=>c.river===r).sort((a,b)=>a.uc-b.uc)){ const base=arrProfile(this.prof,B.s), wild=msWild(B.s)>.5, l=Math.min(wild?base+.4:base-5,prev-1.5); mc.push([B.uc,l]); prev=l;
        if(wild) this.fords.push({s:B.s,h:l-.5,half:B.w*1.15+8}); else { B.deck=base; B.top=base+DECK_LIFT; B.level=l; BRIDGES.push(B); } }
      const lvl=u=>{ if(!mc.length) return 2; if(u<=mc[0][0]) return mc[0][1]+.03*(mc[0][0]-u);
        for(let i=0;i<mc.length-1;i++) if(u<=mc[i+1][0]){ const t=(u-mc[i][0])/(mc[i+1][0]-mc[i][0]); return lerp(mc[i][1],mc[i+1][1],(1-Math.cos(Math.PI*t))/2); }
        const L=mc[mc.length-1]; return L[1]-.02*(u-L[0]); };
      for(const q of r.p) q.level=lvl(q.u); }
    this.puddles=makePuddles(61,24,HALFW*.72); },
  ford(s){ let w=0,h=0; for(const f of this.fords){ const d=Math.abs(wrapS(s-f.s))*TL, k=1-smooth(f.half,f.half+55,d); if(k>w){ w=k; h=f.h; } } return [w,h]; },
  profile(s){ const base=arrProfile(this.prof,s), [w,h]=this.ford(s); return lerp(base,h,w)+jumpsSum(s); },
  base(x,z,th,d){ const hills=this.hills(x,z)+(fbm(x*.04+50,z*.04)-.5)*6*smooth(HALFW,HALFW+25,d), far=smooth(HALFW+2,90,d); return th*(1-far)+hills*far; },
  shape(x,z,h,d,s,k){ return riverShape(x,z,h,d,s,k,h,90); },
  iceAt(){ return false; },
  puddleAt(x,z){ return puddleHit(this.puddles,x,z); },
  softAt(x,z,onTrack,nt){ return onTrack?msWild(track[nt.i].s)*.55:.8; },                       // mud: on the natural ground, and everywhere off the track
  color(c){
    const T=THEME;
    if(c.span) return T.bed;
    if(c.d<HALFW+1){ const w=msWild(c.s);
      if(c.s<0.0035||c.s>0.9985) return [.9,.88,.82];
      if(w>.5){ const n=vnoise(c.cx*.09,c.cz*.09); if(c.d>HALFW-4&&n>.5) return T.moss; if(c.d>2&&c.d<6) return T.rut; return n>.45?T.mud:T.mudAlt; }
      if(c.d>HALFW-2.2) return T.roadEdge;
      return vnoise(c.cx*.2,c.cz*.2)>.5?T.road:T.roadAlt; }
    if(c.rn<.85) return T.bed;
    if(c.rn<1.5) return vnoise(c.cx*.1,c.cz*.1)>.5?T.bank:T.mudAlt;
    if(c.d<HALFW+7) return vnoise(c.cx*.1,c.cz*.1)>.5?T.mud:T.moss;
    if(c.ny<.8) return vnoise(c.cx*.06,c.cz*.06)>.5?T.rock:T.mud;
    return vnoise(c.cx*.04+2,c.cz*.04)>.5?T.floor:T.floorAlt; },
  decor(m,rnd){
    const W=HALF-24, free=(x,z,r)=>roadDist(x,z)>HALFW+r, wet=(x,z,p)=>waterDist(x,z)<p;
    // the forest: giants a little way back from the road, smaller trees, bamboo and ferns filling in between. The tall trunks closest to the road frame it like a tunnel
    for(let i=0,n=0;i<7000&&n<310;i++){ const x=(rnd()-.5)*2*W, z=(rnd()-.5)*2*W; if(!free(x,z,7)||wet(x,z,4)) continue; msGiant(m,rnd,x,z,.85+rnd()*.5); n++; }
    for(let i=0,n=0;i<5000&&n<300;i++){ const x=(rnd()-.5)*2*W, z=(rnd()-.5)*2*W; if(!free(x,z,5)||wet(x,z,3)) continue; if(rnd()<.3) msBamboo(m,rnd,x,z); else msUnderTree(m,rnd,x,z,.8+rnd()*.6); n++; }
    for(let i=0,n=0;i<6000&&n<420;i++){ const x=(rnd()-.5)*2*W, z=(rnd()-.5)*2*W; if(!free(x,z,1.5)||wet(x,z,0)) continue; msFern(m,rnd,x,z,.8+rnd()*1); n++; }
    // boulders and fallen trunks along the natural ground
    for(let i=4;i<M;i+=9){ const t=track[i]; if(msWild(t.s)<.6) continue; const sg=rnd()<.5?1:-1, [x,z]=roadside(i,sg,2+rnd()*5); if(wet(x,z,2)) continue;
      if(rnd()<.7){ const s=.9+rnd()*1.8; m.rock(x,hAt(x,z),z,s,THEME.rock,rnd); colliders.push([x,z,s*.8]); }
      else { const a=rnd()*3.14, y=hAt(x,z); orBox(m,x,z,10,1.1,y,y+1.1,a,[.28,.2,.13]); colliders.push([x,z,1.2],[x+Math.sin(a)*3.5,z+Math.cos(a)*3.5,1.2],[x-Math.sin(a)*3.5,z-Math.cos(a)*3.5,1.2]); } }
    // the steepest climb of the natural ground: 4x4s parked at the top and cones and tape along the edge
    let best=-1,bg=0; for(let i=0;i<M;i++){ const g=Math.abs(this.prof[(i+10)%M]-this.prof[(i-10+M)%M]); if(msWild(track[i].s)>.8&&g>bg&&!GATES.some(q=>Math.abs(wrapS(q.s-track[i].s))<.02)){ bg=g; best=i; } }
    this.climb=best;
    const hi=this.prof[(best+10)%M]>this.prof[(best-10+M)%M]?1:-1, top=(best+hi*12+M)%M;
    for(const sg of [1,-1]){
      for(let k=-14;k<=14;k+=4){ const i=(top+k+M)%M, [x,z]=roadside(i,sg,1.4), y=hAt(x,z); m.cone(x,y,z,.45,1.1,6,[.95,.4,.08]); m.box(x,y+.55,z,.5,.12,.5,[.95,.95,.92]); }
      for(let k=-12;k<=12;k+=3){ const i=(top+k+M)%M, [x,z]=roadside(i,sg,5+rnd()*2.5); if(wet(x,z,2)) continue; rnd(); rnd(); }   // the draws keep all later scenery where it was
      for(let k=-10;k<=10;k+=10){ const i=(top+k+M)%M, t=track[i], [x,z]=roadside(i,sg,13); if(!free(x,z,5)) continue; vehicleProp(m,x,hAt(x,z),z,Math.atan2(t.tx,t.tz)+(rnd()-.5)*.6,[[.8,.8,.82],[.55,.56,.6],[.2,.25,.3],[.75,.2,.15]][(rnd()*4)|0],'van'); colliders.push([x,z,3.2]); } }
    // the people of the road section: a chapel, milestones and white-banded kerb stones
    for(let i=0;i<M;i+=14){ if(msWild(track[i].s)>.2) continue; for(const sg of [1,-1]){ const [x,z]=roadside(i,sg,1.1); if(BRIDGES.some(B=>Math.abs(wrapS(track[i].s-B.s))*TL<B.L/2+8)) continue; const y=hAt(x,z); m.box(x,y+.35,z,.5,.7,.5,i%28?[.92,.92,.88]:[.8,.25,.12]); } }
    for(let i=60;i<M;i+=7){ if(msWild(track[i].s)>.05) continue; const t=track[i], [x,z]=roadside(i,1,16); if(free(x,z,12)&&!wet(x,z,10)&&flatAt(x,z,3)){ msChapel(m,x,z,Math.atan2(t.tx,t.tz)+Math.PI/2); break; } }
    bridgeDecor(m,{wood:[[.36,.28,.2],[.3,.23,.16]], rail:[.42,.34,.24], post:[.3,.23,.16], stone:[.4,.36,.32]});
  },
  marks(m){ drawPuddles(m,this.puddles,[.36,.27,.18]); for(let i=0;i<M;i++){ if(msWild(track[i].s)<.03&&i%10<5) markStrip(m,i,i+1,0,.16,[.86,.84,.7]); } },
  mapBg(g,X,Z,sc){ for(const r of RIVERS){ g.beginPath(); r.p.forEach((q,i)=>i?g.lineTo(X(q.x),Z(q.z)):g.moveTo(X(q.x),Z(q.z))); g.strokeStyle='#8a6a44'; g.lineWidth=Math.max(2,r.p[0].w*2*sc); g.stroke(); } },
  mapFg(g,X,Z,sc,road){ for(const f of this.fords){ const i=trackIndexAt(f.s); road((i-6+M)%M,12,'#8a6a44',TW*sc); } for(const B of BRIDGES) road(B.i0,B.n,'#6a5240',TW*sc); }
};
