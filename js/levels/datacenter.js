'use strict';
// Level: Data Center.
// ---------------- DATA CENTER (a cyberspace-style server hall: neon-edged road between walls of server racks, and every car leaves a wall of coloured light behind it) ----------------
const DC_S=.76;
const DC_V0=[[-400,-380],[-100,-380],[-100,-260],[100,-260],[100,-380],[400,-380],[400,-140],[260,-140],[260,-20],[400,-20],[400,300],[140,300],[140,180],[-20,180],[-20,360],[-400,360],[-400,120],[-240,120],[-240,-20],[-400,-20]];
const DC_V=DC_V0.map(v=>[v[0]*DC_S,v[1]*DC_S]);
const DC_UBENDS=[[1],[6],[11],[16]];                         // the first of the four vertices of each U-shaped bend (in, across, across, out)
const DC_NEON=[[0,.9,1],[1,.55,.1],[.9,.2,1],[.2,1,.5],[1,.9,.2]];                          // LED colours (cyan is the main one)
// a server rack at (x,z) facing direction (fx,fz) (towards the road): black cabinet, rows of status LEDs on the front, a glowing side strip
function dcRack(m,rnd,x,z,fx,fz,h,col){
  const y=hAt(x,z), lx=fz, lz=-fx, along=Math.abs(fx)>.5?0:1, bw=along?8:16, bd=along?16:8;     // (the cabinet is 8 wide along the road and 16 deep, axis-aligned)
  m.box(x,y+h/2,z,fx?16:8,h,fz?16:8,[.07,.08,.11]); m.box(x,y+h+.3,z,fx?16.4:8.4,.6,fz?16.4:8.4,[.12,.13,.18]);
  const px=x+fx*8.08, pz=z+fz*8.08, cols=4, rows=Math.floor((h-4)/2.2);
  m.em=true;
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){ if(rnd()<.4) continue; const u=(c-(cols-1)/2)*1.7, k=rnd()<.8?col:DC_NEON[(rnd()*5)|0], b=.55+rnd()*.45;
    wallQuad(m,px+lx*u,y+2.6+r*2.2,pz+lz*u,fx,fz,.9,.55,[k[0]*b,k[1]*b,k[2]*b]); }
  wallQuad(m,x+fx*8.1,y+h-1,z+fz*8.1,fx,fz,7,.5,col);                                                 // the glowing strip along the top
  m.em=false; }
// a portal frame over the road: two posts, a beam with glowing strips and a few hanging cables (a decorative gantry; the posts are solid)
function dcGantry(m,rnd,i,col){
  const t=track[i], lx=t.tz, lz=-t.tx, yaw=Math.atan2(t.tx,t.tz), y=Math.max(hAt(t.x,t.z),hAt(t.x+lx*HALFW,t.z+lz*HALFW),hAt(t.x-lx*HALFW,t.z-lz*HALFW)), o=HALFW+3, top=y+26;
  for(const sg of [-1,1]){ const px=t.x+lx*sg*o, pz=t.z+lz*sg*o; m.box(px,y+13,pz,2.4,26,2.4,[.1,.11,.15]); colliders.push([px,pz,1.6]); m.em=true; wallQuad(m,px-t.tx*1.25,y+13,pz-t.tz*1.25,-t.tx,-t.tz,.4,24,col); m.em=false; }
  orBox(m,t.x,t.z,3,2*o+4,top,top+2.4,yaw,[.1,.11,.15]); m.em=true; for(const s of [-1,1]) m.box(t.x+t.tx*s*1.6,top+1.2,t.z+t.tz*s*1.6,.3,.3,2*o,col); m.em=false;
  for(let k=-3;k<=3;k++){ const px=t.x+lx*k*(o*.3), pz=t.z+lz*k*(o*.3), hh=3+rnd()*5; m.box(px,top-hh/2,pz,.35,hh,.35,[.05,.05,.07]); m.em=true; m.box(px,top-hh,pz,.7,.7,.7,DC_NEON[(rnd()*5)|0]); m.em=false; } }
// a floating data cube (decor in the void above the floor)
function dcCube(m,x,y,z,s,col){ m.em=true; m.box(x,y,z,s,s,s,[col[0]*.55,col[1]*.55,col[2]*.55]); const e=.18, c=col; for(const [dx,dz] of [[1,1],[1,-1],[-1,1],[-1,-1]]) m.box(x+dx*s/2,y,z+dz*s/2,e,s,e,c); for(const dy of [-1,1]) for(const a of [0,1]) m.box(x,y+dy*s/2,z,a?s:e,e,a?e:s,c); m.em=false; }

// ---- the MCP: its pillar in the middle of the hall, a round glowing red column that ends below in a short point
// over a round plinth, with the gold logo of its AI company on four sides instead of a face. The logos spin and follow the curve of the column, so they are a mesh
// of their own, rebuilt every frame (drawDynamic).
const DC_MCP={x:-10,z:-40, tip:7,y0:24,y1:128, r0:19,r1:21, logoY:56,logoR:13, spin:.45, plinth:27};   // (tip: the bottom of the point, y0: where it meets the column; plinth: its radius, also its collision circle)
const DC_MCP_SEG=48;
// the radius of the column at height y
const dcMcpR=y=>lerp(DC_MCP.r0,DC_MCP.r1,(y-DC_MCP.y0)/(DC_MCP.y1-DC_MCP.y0));
// a round band from y0 to y1 (radius r0 below, r1 above), nr rows up, coloured per corner by col(th,v) (th: the angle round, v: 0..1 up); cap: colour of the top
function dcBand(m,cx,cz,y0,y1,r0,r1,nr,col,cap){
  const o=[cx,(y0+y1)/2,cz], S=DC_MCP_SEG;
  for(let r=0;r<nr;r++) for(let s=0;s<S;s++){ const v0=r/nr, v1=(r+1)/nr, a0=s/S*6.2832, a1=(s+1)/S*6.2832;
    const q=[[a0,v0],[a1,v0],[a1,v1],[a0,v1]].map(([a,v])=>{ const R=lerp(r0,r1,v); return [[cx+Math.cos(a)*R,lerp(y0,y1,v),cz+Math.sin(a)*R],col(a,v)]; });
    for(const T of [[0,1,2],[0,2,3]]){ m.tri(q[T[0]][0],q[T[1]][0],q[T[2]][0],[0,0,0],o); const L=m.c.length-9; for(let k=0;k<3;k++) for(let j=0;j<3;j++) m.c[L+k*3+j]=q[T[k]][1][j]; } }   // (each corner its own colour)
  if(cap) for(let s=0;s<S;s++){ const a=s/S*6.2832, b=(s+1)/S*6.2832; m.tri([cx,y1,cz],[cx+Math.cos(a)*r1,y1,cz+Math.sin(a)*r1],[cx+Math.cos(b)*r1,y1,cz+Math.sin(b)*r1],cap,'up'); } }
// the pillar itself (static decor; the logos are dcLogoMesh)
function dcMcp(m){
  const {x,z,tip,y0,y1,r0,r1}=DC_MCP, dark=[.09,.1,.15], top=[.12,.13,.18], P=DC_MCP.plinth;
  dcBand(m,x,z,0,4,P,P,1,()=>dark,top);                                                                    // the plinth
  m.em=true; dcBand(m,x,z,3.6,4.1,P+.15,P+.15,1,()=>[0,.75,.9]);                                         // its glowing rim
  // the column: red, hottest down the middle under each logo, dimmer between them and towards both ends
  const red=(a,v)=>{ const d=Math.abs(((a+.7854)%1.5708+1.5708)%1.5708-.7854)/.7854, hot=Math.pow(1-d,1.6), up=.55+.45*Math.sin(Math.PI*Math.min(1,v*1.25)), k=hot*up;
    return [.36+.6*k+.1*up,.02+.32*k*k,.03+.2*k*k]; };
  dcBand(m,x,z,y0,y1,r0,r1,14,(a,v)=>red(a,v*.9+.1));
  dcBand(m,x,z,tip,y0,.6,r0,3,(a,v)=>red(a,v*.1));                                                         // the short point underneath
  m.em=false;
  dcBand(m,x,z,y1,y1+5,r1+1.5,r1+1.5,1,()=>dark,top);                                                      // the crown
  m.em=true; dcBand(m,x,z,y1+1.6,y1+2.4,r1+1.65,r1+1.65,1,()=>[1,.5,.12]); m.box(x,y1+9,z,4,8,4,[0,.9,1]); m.em=false;
  colliders.push([x,z,P]); }
// one logo, flat in the local x,y plane, centred on 0: a thin gold ring round seven tapered gold arms of different lengths and widths, set a little unevenly
// round a ring in the middle, open in the centre (the AI-company logo style). One copy; dcLogoGeom puts it on the column
const DC_LOGO_ARMS=[[0,1,1],[.95,.58,.8],[1.78,.86,1.1],[2.74,.64,.75],[3.62,.95,.95],[4.55,.52,.85],[5.4,.78,.9]];   // [angle, length, width] of each arm
const DC_LOGO_HOLE=DC_MCP.logoR*.17;                             // the radius of the open centre
function dcLogoMesh(){
  const m=new Mesh(), R=DC_MCP.logoR, gold=[1,.76,.12], ring=[.95,.64,.08], P=(r,a,z)=>[Math.cos(a)*r,Math.sin(a)*r,z];
  m.em=true;
  for(let k=0;k<40;k++){ const a=k/40*6.2832, b=(k+1)/40*6.2832; m.quad(P(R*.94,a,0),P(R,a,0),P(R,b,0),P(R*.94,b,0),ring,[0,0,-1]); }    // the ring
  for(const [a,len,wd] of DC_LOGO_ARMS){ const L=R*.78*len, r0=R*.22, w0=R*.13*wd, w1=w0*.62;     // (from the ring, never into the hole)
    const pt=(t,s)=>{ const r=lerp(r0,L,t), w=lerp(w0,w1,t); return [Math.cos(a)*r-Math.sin(a)*w*s,Math.sin(a)*r+Math.cos(a)*w*s,.05]; };
    const S=4; for(let i=0;i<S;i++) m.quad(pt(i/S,-1),pt((i+1)/S,-1),pt((i+1)/S,1),pt(i/S,1),gold,[0,0,-1]);
    const tip=L+w1*.9, A=pt(1,-1), B=pt(1,1), T=s=>[Math.cos(a)*tip-Math.sin(a)*w1*.45*s,Math.sin(a)*tip+Math.cos(a)*w1*.45*s,.05];   // the bevelled tip
    m.quad(A,B,T(1),T(-1),gold,[0,0,-1]); }
  for(let k=0;k<24;k++){ const a=k/24*6.2832, b=(k+1)/24*6.2832; m.quad(P(DC_LOGO_HOLE,a,.08),P(R*.27,a,.08),P(R*.27,b,.08),P(DC_LOGO_HOLE,b,.08),gold,[0,0,-1]); }   // the ring in the middle the arms grow from, open in the centre (the column shows through)
  m.em=false; return m; }
// the drawn logos: four copies of dcLogoMesh (the vertices are placed every frame by dcLogoGeom)
function dcLogosMesh(){ const one=dcLogoMesh(), m=new Mesh(); for(let k=0;k<4;k++){ m.p.push(...one.p); m.n.push(...one.n); m.c.push(...one.c); } m.base=one.p; return m; }
// the positions of the four logos turned by ang in their own plane, then wrapped round the column (a local x becomes an arc, z the height off the surface),
// facing +x, +z, -x and -z, written into out
function dcLogoGeom(base,ang,out){
  const {x,z,logoY}=DC_MCP, c=Math.cos(ang), s=Math.sin(ang), n=base.length;
  for(let f=0;f<4;f++){ const ph=f*1.5708;
    for(let i=0;i<n;i+=3){ const lx=base[i]*c-base[i+1]*s, ly=base[i]*s+base[i+1]*c, y=logoY+ly, R=dcMcpR(y)+.35+base[i+2], th=ph-lx/R;
      out[f*n+i]=x+Math.cos(th)*R; out[f*n+i+1]=y; out[f*n+i+2]=z+Math.sin(th)*R; } }
  return out; }

LEVELS.datacenter={
  ai:['easierTurns'],                    // opponent adjustments on top of the difficulty (LEVEL_AI_MULTIPLIERS, config.js)
  id:'datacenter', seed:347, name:'DATA CENTER', sub:'End of line.', go:'END OF LINE',
  loc:'New Carlisle, Indiana', flag:'us',
  ending:'ending',                       // a clear offers WATCH ENDING on the results screen (js/levels/ending.js)
  blurb:"Discover what's truly happening inside the polluting noisy boy by racing in between the server racks! Does MCP really stand for Model Context Protocol or... something else?",
  tw:28, trails:true,
  theme:{
    skyTop:[0,0,0], skyHor:[0.056,0.135,0.215], fog:[0.07,0.19,0.235], fogN:70, fogF:760,
    amb:[.42,.46,.62], hemi:[.14,.16,.26], sun:[.14,.2,.3], light:[.3,.8,.4], night:true, snow:false, trails:true,
    road:[.075,.10,.175], roadAlt:[.068,.092,.16], roadEdge:[.1,.7,.9], floor:[.045,.055,.1], floorAlt:[.04,.05,.09], pad:[.06,.07,.12],
    dust:{road:[.12,.5,.7],off:[.1,.3,.5],ice:[.9,.95,1],a:.5,sz:.8},
    map:{bg:'rgba(4,8,20,0.97)',road:'#22d8ff',edge:'#02101a'}
  },
  phys:{gripRoad:7.2,gripOff:5.8,gripIce:2,dragRoad:.12,dragOff:.3,dragIce:.05,maxOff:.92},
  rim:0,
  trackPts(){ return startNear(resampleClosed(filletLoop(DC_V,28,10),M),-60,-289); },
  // The four U-bends (the notches at the top, east and west and the inverted U in the south) each get a checkpoint on their bottom straight, so none can be
  // cut: the one that holds the finish line needs none. The remaining checkpoints go in the biggest gaps between those, the ramps on calm straights clear of
  // all of it. (this.uBends = [from, to] track-position ranges, for reference)
  layout(){
    const tp=P=>{ const q=nearestTrack(P[0],P[1]); return track[q.i].s; }, inR=(a,b,x)=>a<=b?(x>=a&&x<=b):(x>=a||x<=b), gapOf=(a,b)=>((b-a)%1+1)%1;
    const U=DC_UBENDS.map(([k])=>{ const A=DC_V[k], B=DC_V[k+1], C=DC_V[k+2], D=DC_V[k+3]; return {a:tp(A),b:tp(D),c:tp([(B[0]+C[0])/2,(B[1]+C[1])/2])}; });
    this.uBends=U.map(u=>[u.a,u.b]);
    const near=(x,w)=>[x-w,x+w], keep=U.map(u=>near(u.c,.05)).concat([[-.04,.04]]);                              // no ramp near a U-bend's checkpoint or the finish
    const jumps=[[.1,3.5],[.5,3.5],[.8,3.5]].map(([f,h])=>[calmS(f,.04,100,keep),h]), jz=jumps.map(j=>[j[0]-.03,j[0]+.07]);
    const anchors=[0], gates=[];
    for(const u of U){ if(inR(u.a,u.b,0)||inR(u.a,u.b,.999)) continue; const g=calmS(u.c,.03,45,jz); gates.push(g); anchors.push(g); }       // (a U-bend that holds the finish line needs no checkpoint)
    while(gates.length<7){                                                                                    // fill the biggest gaps between what is already there
      const A=anchors.slice().sort((x,y)=>x-y); let bi=0,bg=-1; for(let i=0;i<A.length;i++){ const g=gapOf(A[i],i+1<A.length?A[i+1]:1); if(g>bg){ bg=g; bi=i; } }
      const mid=A[bi]+bg/2, g=calmS(mid,.025,45,jz.concat(U.map(u=>[u.a,u.b]))); gates.push(g); anchors.push(g); }
    return {gates:gates.sort((x,y)=>x-y), jumps:jumps.sort((x,y)=>x[0]-y[0])}; },
  prepare(){},
  profile(s){ return jumpsSum(s); },
  base(x,z,th,d){ const far=smooth(HALFW+2,30,d); return th*(1-far); },
  iceAt(){ return false; },
  shockAt(c){ return DATACENTER_OFFROAD_SHOCK&&c.trackD>HALFW+DATACENTER_OFFROAD_MARGIN; },     // (from fxHurt: off the grid the floor is live)
  color(c){
    const T=THEME;
    if(c.d<HALFW){
      if(c.s<0.0035||c.s>0.9985) return [.9,.95,1];
      if(c.d>HALFW-1.5) return T.roadEdge;
      return vnoise(c.cx*.25,c.cz*.25)>.6?T.roadAlt:T.road; }
    return ((Math.floor(c.cx/12)+Math.floor(c.cz/12))&1)?T.floor:T.floorAlt; },
  decor(m,rnd){
    const W=526, gateNear=(x,z,r)=>GATES.some(g=>Math.hypot(g.x-x,g.z-z)<r), free=(x,z,r)=>roadDist(x,z)>HALFW+r+3, jumpNear=s=>JUMPS.some(j=>{ const d=((s-j[0]+1.5)%1)-.5; return d>-.05&&d<.09; });
    // the walls of server racks along both sides of every straight: each rack is drawn separately, a whole run is one solid box
    const racked=[new Uint8Array(M),new Uint8Array(M)];                                                       // (which samples have racks: the lasers go between them)
    for(const sg of [1,-1]){ let run=null;
      const flush=()=>{ if(run){ const cx=(run.a[0]+run.b[0])/2, cz=(run.a[1]+run.b[1])/2; rects.push(run.fx?[cx,cz,8.2,Math.abs(run.b[1]-run.a[1])/2+4.2]:[cx,cz,Math.abs(run.b[0]-run.a[0])/2+4.2,8.2]); } run=null; };
      for(let i=0;i<M;i+=3){ const t=track[i], [x,z]=roadside(i,sg,2.5+8), straight=bendAt(i)<.003&&bendAt((i+9)%M)<.003&&bendAt((i+M-9)%M)<.003;
        if(!straight||gateNear(x,z,28)||jumpNear(t.s)||roadDist(x,z)<HALFW+3||Math.abs(x)>W-16||Math.abs(z)>W-16){ flush(); continue; }
        const fxr=-t.tz*sg, fzr=t.tx*sg, fx=Math.abs(fxr)>.5?Math.sign(fxr):0, fz=Math.abs(fzr)>.5?Math.sign(fzr):0;       // the way the rack faces: towards the road
        if(run&&(run.fx!==fx||run.fz!==fz)) flush();
        dcRack(m,rnd,x,z,fx,fz,26+((rnd()*3)|0)*5,rnd()<.62?DC_NEON[0]:DC_NEON[(rnd()*5)|0]); for(let q=0;q<3;q++) racked[sg>0?0:1][(i+q)%M]=1;
        if(!run) run={a:[x,z],b:[x,z],n:0,fx,fz}; run.b=[x,z]; run.n++; }
      flush(); }
    // a second, taller row of racks behind the first, and the dead-end blocks between the roads (cooling units: dark blocks with glowing grilles)
    for(const sg of [1,-1]) for(let i=0;i<M;i+=5){ const t=track[i], [x,z]=roadside(i,sg,2.5+8+18); if(bendAt(i)>.003||gateNear(x,z,30)||roadDist(x,z)<HALFW+16||Math.abs(x)>W-20||Math.abs(z)>W-20||rnd()<.35) continue;
      const fxr=-t.tz*sg, fzr=t.tx*sg, fxs=Math.abs(fxr)>.5?Math.sign(fxr):0, fzs=Math.abs(fzr)>.5?Math.sign(fzr):0;
      if(nearestTrack(x+fxs*-30,z+fzs*-30).d<22) continue; dcRack(m,rnd,x,z,fxs,fzs,34+((rnd()*3)|0)*6,DC_NEON[(rnd()*5)|0]);
      rects.push(fxs?[x,z,8.2,4.2]:[x,z,4.2,8.2]); }                                                         // (every rack is solid, single ones and the second row too)
    // laser fences: halfway between checkpoints, in the closed stretches between two walls of racks. Each bank is three fences lit in step (two in a short stretch): high, then middle, then low;
    // only the low beam can reach a car, and it sets the car alight. You can watch the sequence step down from far along the corridor (every fence also has a lamp per beam on its emitters), and a jump clears it
    this.laserAt=[];
    for(let i=0,st=-1;i<=M;i++){ const on=i<M&&racked[0][i]&&racked[1][i]; if(on&&st<0) st=i; if(on||st<0) continue;
      const n=i-st, bi=st+(n>>1); st=-1; if(n<10||GATES.some(q=>Math.hypot(q.x-track[bi].x,q.z-track[bi].z)<50)) continue;     // a closed stretch: racks on both sides, clear of the checkpoints
      this.laserAt.push(bi); const ph=this.laserAt.length*1.37;
      for(const k of n<22?[-3,3]:[-7,0,7]){ const i=(bi+k+M)%M, t=track[i], lx=t.tz, lz=-t.tx, y=hAt(t.x,t.z), sp=HALFW+2.5;
        addLaser(t.x,t.z,t.tx,t.tz,lx,lz,sp,[y+13,y+6.6,y+1.1],2,ph);
        for(const s of [-1,1]){ const px=t.x+lx*s*(sp+.15), pz=t.z+lz*s*(sp+.15); m.box(px,y+7,pz,1.2,14,1.5,[.1,.05,.06]); } } }
    // electric sparks crackle at random spots on the open grid, wherever the floor is free
    { const spots=[]; for(let x=-500;x<=500;x+=18) for(let z=-500;z<=500;z+=18){ if(roadDist(x,z)>HALFW+5&&!rects.some(r=>Math.abs(r[0]-x)<r[2]+6&&Math.abs(r[1]-z)<r[3]+6)) spots.push([x,z]); } addSparkSpots(spots,14,8); }
    // portal gantries across the road on the long straights
    for(let i=45;i<M;i+=61){ const t=track[i]; if(bendAt(i)>.003||bendAt((i+14)%M)>.003||bendAt((i+M-14)%M)>.003||gateNear(t.x,t.z,45)||jumpNear(t.s)) continue; dcGantry(m,rnd,i,DC_NEON[((i/61)|0)%2?1:0]); }
    // the MCP in the middle of the hall (its logos are drawn by drawDynamic)
    dcMcp(m);
    // floating data cubes high in the dark, and ventilation fans set into the floor
    for(let k=0;k<70;k++){ const x=(rnd()-.5)*(W*2-60), z=(rnd()-.5)*(W*2-60), y=45+rnd()*110; if(roadDist(x,z)<HALFW+10) continue; dcCube(m,x,y,z,3+rnd()*6,DC_NEON[(rnd()*5)|0]); }
    for(let k=0;k<26;k++){ const x=(rnd()-.5)*(W*2-100), z=(rnd()-.5)*(W*2-100); if(!free(x,z,34)||rects.some(r=>Math.abs(r[0]-x)<r[2]+24&&Math.abs(r[1]-z)<r[3]+24)) continue;
      const y=hAt(x,z); cylY(m,x,y,z,16,.3,16,[.02,.025,.04],[.03,.035,.06]); m.em=true; for(let a=0;a<8;a++){ const an=a/8*6.28; m.prism(x,z,x+Math.cos(an)*15,z+Math.sin(an)*15,.35,y+.4,y+.5,[0,.35,.5]); } m.em=false; }
  },
  marks(m){
    m.em=true;
    for(let i=0;i<M;i++){ markStrip(m,i,i+1,HALFW-1.2,.8,[0,.85,1]); markStrip(m,i,i+1,-(HALFW-1.2),.8,[0,.85,1]); }
    // faint grid lines on the floor (not across the road)
    const P=(x,z)=>[x,hAt(x,z)+.15,z];
    for(let a=-504;a<=504;a+=48) for(let b=-516;b<516;b+=12){
      if(roadDist(a,b+6)>HALFW+4) m.quad(P(a-.25,b),P(a+.25,b),P(a+.25,b+12),P(a-.25,b+12),[0,.16,.24],'up');
      if(roadDist(b+6,a)>HALFW+4) m.quad(P(b,a-.25),P(b+12,a-.25),P(b+12,a+.25),P(b,a+.25),[0,.16,.24],'up'); }
    m.em=false;
    // thin lines across the road, as in rome.js, between the neon edges and clear of the start line
    const line=(i,u0,u1,w,col)=>{ const t=track[i%M], P=(u,s)=>{ const x=t.x+t.tz*u+t.tx*s, z=t.z-t.tx*u+t.tz*s; return [x,hAt(x,z)+.16,z]; };
      m.quad(P(u0,-w),P(u1,-w),P(u1,w),P(u0,w),col,'up'); };
    for(let i=0;i<M;i+=2){ const s=track[i].s; if(s>=.0035&&s<=.9985) line(i,-HALFW+2,HALFW-2,.13,[.105,.14,.24]); } },
  // a soft wash of light on the floor along both neon edges (additive, night only)
  glow(m){ for(let i=0;i<M;i++){ markStrip(m,i,i+1,HALFW+1.5,2.2,[0,.1,.14]); markStrip(m,i,i+1,-(HALFW+1.5),2.2,[0,.1,.14]); markStrip(m,i,i+1,HALFW-3,1.8,[0,.05,.07]); markStrip(m,i,i+1,-(HALFW-3),1.8,[0,.05,.07]); }
    // a red glow on the floor round the MCP's plinth, fading outwards
    for(let r=0;r<5;r++){ const k=(5-r)/5*.16, r0=DC_MCP.plinth+.3+r*3.4, r1=r0+3.4; for(let e=0;e<48;e++){ const a=e/48*6.2832, b=(e+1)/48*6.2832, P=(R,t)=>[DC_MCP.x+Math.cos(t)*R,.14,DC_MCP.z+Math.sin(t)*R];
      m.quad(P(r0,a),P(r1,a),P(r1,b),P(r0,b),[k,k*.08,k*.06],'up'); } } },
  // the spinning logos on the MCP (dcLogosMesh, uploaded by loadLevel, its vertices moved every frame); mcpAng, when set, is the angle the ending gives them
  dynamic(){ const m=dcLogosMesh(); this.logoBase=m.base; this.logoPos=new Float32Array(m.p.length); return {logo:m}; },
  drawDynamic(draw,setPos){ const a=this.mcpAng!==undefined?this.mcpAng:FX.t*DC_MCP.spin; setPos('logo',dcLogoGeom(this.logoBase,-a,this.logoPos)); draw('logo',M4.ident()); },
  mapBg(g,X,Z,sc){ g.strokeStyle='rgba(30,120,160,0.28)'; g.lineWidth=1; for(let a=-504;a<=504;a+=48){ g.beginPath(); g.moveTo(X(a),Z(-520)); g.lineTo(X(a),Z(520)); g.stroke(); g.beginPath(); g.moveTo(X(-520),Z(a)); g.lineTo(X(520),Z(a)); g.stroke(); }
    g.fillStyle='rgba(255,70,50,0.7)'; g.beginPath(); g.arc(X(DC_MCP.x),Z(DC_MCP.z),DC_MCP.plinth*sc,0,7); g.fill(); }   // the MCP
};
