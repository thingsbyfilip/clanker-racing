'use strict';
// Level: Refinery Rush.
// ---------------- REFINERY RUSH (a maze of tank farms and process towers, hairpins and tight chicanes, ablaze at nightfall under one enormous cloud of smoke) ----------------
const RF_V=[[-380,-300,40],[-250,-240,50],[-120,-300,40],[-120,-170,36],[-30,-110,45],[80,-170,36],[80,-300,40],[205,-240,50],[330,-300,50],[385,-120,45],[205,-45,45],[365,60,38],[340,190,45],[385,310,50],[240,285,50],[120,310,40],[60,150,34],[-40,210,45],[-120,150,34],[-180,305,40],[-290,285,50],[-385,310,50],[-385,150,40],[-200,20,40],[-385,-110,40]];
const RF_PIPE=[[.64,.66,.7],[.55,.34,.22],[.82,.78,.62],[.3,.5,.36],[.76,.52,.16]];
let RF_SITES=null, RF_SMOG=1;
const RF_FALLEN=[];                                            // the toppled columns as walls [x0,z0,x1,z1,r]: one of them lies across the road (see roadObstacles)                                  // the fire collects the tanks and columns here, to set them alight, and darkens the smog
// vertical storage tank: shell, roof (cone or flat), rim, ladder
// the base of a round plant item of radius r: the lowest ground under it, so no side of it hangs over a slope
function rfFoot(x,z,r){ return lowGround(x,z,r)-.5; }
function tank(m,x,z,r,h,col,cone){
  const y=rfFoot(x,z,r); cylY(m,x,y,z,r,h,12,col,[col[0]*.8,col[1]*.8,col[2]*.8]);
  if(cone) m.cone(x,y+h,z,r*1.02,r*.14,12,[col[0]*.85,col[1]*.85,col[2]*.85]);
  m.box(x+r*.98,y+h*.5,z,.4,h,.9,[.35,.35,.38]); m.box(x,y+h+.5,z,r*2.05,.35,.35,[.3,.3,.32]);
  colliders.push([x,z,r*.92]); if(RF_SITES) RF_SITES.push({k:'tank',x,z,r,y:y+h}); }
// distillation column: tall slim tower with platform rings and a ladder
function column(m,x,z,r,h){
  const y=rfFoot(x,z,r); cylY(m,x,y,z,r,h,10,[.64,.66,.7],[.56,.58,.62]); m.cone(x,y+h,z,r*.9,r*1.6,10,[.5,.52,.56]);
  for(let f=.2;f<.95;f+=.2){ m.box(x,y+h*f,z,r*2+2.6,.35,r*2+2.6,[.3,.3,.33]); }
  m.box(x+r+.5,y+h*.5,z,.4,h,.8,[.25,.25,.28]);
  for(const a of [0,1.6,3.2,4.8]) m.box(x+Math.cos(a)*r,y+h*.45,z+Math.sin(a)*r,.9,h*.9,.9,[.7,.2,.15]);
  colliders.push([x,z,r*1.15]); if(RF_SITES) RF_SITES.push({k:'column',x,z,r,y:y+h}); }
// red / white banded smokestack with a plume of smog
function smokestack(m,rnd,x,z,h){
  const y=rfFoot(x,z,6), n=5; for(let k=0;k<n;k++){ const r0=lerp(6,3.6,k/n), r1=lerp(6,3.6,(k+1)/n); frustum(m,x,y+k*h/n,z,r0,r1,h/n,10,k&1?[.88,.86,.82]:[.78,.14,.1],[.3,.3,.32]); }
  for(let k=0;k<6;k++) m.rock(x+k*4,y+h+3+k*3.2,z+k*1.6,3+k*1.5,[(.52-k*.02)*RF_SMOG,(.5-k*.02)*RF_SMOG,(.48-k*.02)*RF_SMOG],rnd);
  colliders.push([x,z,6.4]); }
// flare stack: a lattice mast with a steady flame on top
function flare(m,x,z,h){
  const y=rfFoot(x,z,1.4); for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]]) m.box(x+a*1.2,y+h/2,z+b*1.2,.35,h,.35,[.45,.46,.5]);
  for(let f=0;f<h;f+=8) m.box(x,y+f,z,3,.25,3,[.4,.4,.44]);
  m.em=true; m.cone(x,y+h,z,2.2,8,6,[1,.45,.08]); m.cone(x,y+h+.5,z,1.2,5,6,[1,.8,.25]); m.em=false;
  colliders.push([x,z,2.6]); if(RF_SITES) addFireLight(x,y+h,z,50,.35); }
// cooling tower with a plume of steam
function coolingTower(m,rnd,x,z){ const y=hAt(x,z)-.5; frustum(m,x,y,z,15,10,26,12,[.8,.8,.78],[.5,.5,.5]); frustum(m,x,y+26,z,10,11,6,12,[.8,.8,.78]);
  for(let k=0;k<4;k++) m.rock(x+k*1.5,y+36+k*4,z+k,5+k*1.8,[.92*RF_SMOG,.92*RF_SMOG,.94*RF_SMOG],rnd); colliders.push([x,z,15]); }
// storage sphere on legs
function sphereTank(m,x,z,r){ const y=hAt(x,z)-.5; ball(m,x,y+r+3,z,r,[.88,.88,.86],12,6);
  for(let k=0;k<6;k++){ const a=k/6*Math.PI*2; m.box(x+Math.cos(a)*r*.75,y+(r+3)/2,z+Math.sin(a)*r*.75,.7,r+3,.7,[.55,.55,.58]); } colliders.push([x,z,r*.95]); }
// metal shed with a corrugated gable roof
function shed(m,rnd,x,z,w,d,h,alongX){ const y=hAt(x,z)-.5, col=[[.52,.58,.64],[.6,.5,.4],[.5,.6,.52]][(rnd()*3)|0];
  m.box(x,y+h/2,z,w,h,d,col); gable(m,x-w/2-.5,z-d/2-.5,x+w/2+.5,z+d/2+.5,y+h,h*.3,[.34,.36,.4],alongX,col);
  m.box(x+(alongX?0:w/2+.05),y+3,z+(alongX?d/2+.05:0),alongX?5:.1,6,alongX?.1:5,[.2,.22,.26]); rects.push([x,z,w/2+.4,d/2+.4]); }
// a run of pipes on posts, running from (x,z) along yaw
function pipeRack(m,x,z,len,yaw,y0){
  const fx=Math.sin(yaw), fz=Math.cos(yaw), h=hAt(x,z);
  for(let a=0;a<=len;a+=12){ const px=x+fx*a, pz=z+fz*a, hy=hAt(px,pz); orBox(m,px,pz,.8,3.4,hy-.5,h+y0,yaw+Math.PI/2,[.35,.36,.4]); colliders.push([px,pz,.9]); }
  for(let k=0;k<3;k++) orBox(m,x+fx*len/2,z+fz*len/2,len,.9,h+y0+k*1.2,h+y0+k*1.2+.9,yaw,RF_PIPE[(k+((x*7)|0)%3+3)%4]); }

// a round pipe from a to b (8-sided tube with end caps)
function tube(m,a,b,r,col){
  const dx=b[0]-a[0], dy=b[1]-a[1], dz=b[2]-a[2], l=Math.hypot(dx,dy,dz)||1, ux=dx/l, uy=dy/l, uz=dz/l, hx=Math.abs(uy)<.9?0:1, hy=Math.abs(uy)<.9?1:0;
  let px=uy*0-uz*hy, py=uz*hx-ux*0, pz=ux*hy-uy*hx; const pl=Math.hypot(px,py,pz)||1; px/=pl; py/=pl; pz/=pl;
  const qx=uy*pz-uz*py, qy=uz*px-ux*pz, qz=ux*py-uy*px, n=8, A=[], B=[], o=[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2];
  for(let i=0;i<n;i++){ const t=i/n*Math.PI*2, c=Math.cos(t)*r, s=Math.sin(t)*r, ox=px*c+qx*s, oy=py*c+qy*s, oz=pz*c+qz*s; A.push([a[0]+ox,a[1]+oy,a[2]+oz]); B.push([b[0]+ox,b[1]+oy,b[2]+oz]); }
  for(let i=0;i<n;i++){ const j=(i+1)%n, cc=i&1?col:[col[0]*.9,col[1]*.9,col[2]*.9]; m.quad(A[i],A[j],B[j],B[i],cc,o); m.tri(a,A[j],A[i],cc,o); m.tri(b,B[i],B[j],cc,o); } }
// a pipe gate over the road: two pipes come along the roadside at ground level, rise on one side, cross high above the road and come down
// on the other side to run on. (x,z) is the road centre at the gate, (tx,tz) the road direction, run = length of the ground pipes on each side.
function pipeGate(m,rnd,i,run){
  const t=track[i], lx=t.tz, lz=-t.tx, base=Math.max(hAt(t.x,t.z),hAt(t.x+lx*(HALFW+6),t.z+lz*(HALFW+6)),hAt(t.x-lx*(HALFW+6),t.z-lz*(HALFW+6)));
  const cols=[RF_PIPE[(rnd()*5)|0],RF_PIPE[(rnd()*5)|0]], rad=[1.1,.75];
  for(let k=0;k<2;k++){ const L=HALFW+2.7+k*2.6, H=base+9.4+k*1.9, r=rad[k], c=cols[k];
    for(const sg of [1,-1]){
      const step=4, nseg=Math.max(3,Math.round(run/(step*TL/M))), S_=q=>track[(i+(sg>0?-1:1)*q*step+M*4)%M], Pq=(q,y)=>{ const u=S_(q); return [u.x+u.tz*sg*L,y,u.z-u.tx*sg*L]; };
      const y0=n=>hAt(...(([a,,b])=>[a,b])(Pq(n,0)))+r+.5; let prev=Pq(nseg,y0(nseg));
      for(let q=nseg-1;q>=0;q--){ const cur=Pq(q,y0(q)); tube(m,prev,cur,r,c);
        const u=S_(q); orBox(m,cur[0],cur[2],1,r*2+1,cur[1]-r-.5,cur[1]-r+.1,Math.atan2(u.tx,u.tz),[.35,.35,.38]);
        colliders.push([cur[0],cur[2],r+.5]); prev=cur; }
      const up=Pq(0,y0(0)), top=Pq(0,H);
      tube(m,up,top,r,c); ball(m,top[0],H,top[2],r*1.3,c,8,4); ball(m,up[0],up[1],up[2],r*1.3,c,8,4);
      m.box(up[0],up[1]+(H-up[1])*.5,up[2],r*2+.6,.3,r*2+.6,[.3,.3,.33]); }
    tube(m,[t.x+lx*L,H,t.z+lz*L],[t.x-lx*L,H,t.z-lz*L],r,c);
    for(const f of [-.3,.3]) m.box(t.x+lx*L*f*2,H-r-.4,t.z+lz*L*f*2,.5,.6,.5,[.3,.3,.33]);
    for(const f of [-.3,0,.3]){ const qx=t.x+lx*L*f*2,qz=t.z+lz*L*f*2; m.box(qx,H+r*.9,qz,.6,.25,r*2.6,[.28,.28,.3]); } } }
// a pump skid / transformer bay at the roadside: a low block with pipes and a valve wheel (solid)
function skid(m,rnd,x,z,yaw){
  const y=hAt(x,z)-.3, fx=Math.sin(yaw), fz=Math.cos(yaw), lx=fz, lz=-fx;
  orBox(m,x,z,6,3.6,y,y+2.2,yaw,[.5,.54,.58]); orBox(m,x,z,6.4,4,y+2.2,y+2.5,yaw,[.3,.3,.33]);
  tube(m,[x-fx*2,y+3.3,z-fz*2],[x+fx*2,y+3.3,z+fz*2],.45,RF_PIPE[(rnd()*5)|0]); for(const a of [-2,2]) tube(m,[x+fx*a,y+2.4,z+fz*a],[x+fx*a,y+3.3,z+fz*a],.45,[.6,.6,.64]);
  cylY(m,x+lx*1.2+fx*.8,y+2.5,z+lz*1.2+fz*.8,.8,1.5,8,[.8,.2,.15],[.3,.3,.3]);
  for(const a of [-2.2,0,2.2]) colliders.push([x+fx*a,z+fz*a,2.2]); }
const RF_BURNT=[[.42,.38,.36],[.30,.28,.28],[.5,.42,.36]];
// a column that has fallen over: the stump, the long body lying across the ground, its platforms, rubble round the foot
function rfToppled(m,rnd,x,z,yaw,len,r){
  const y=hAt(x,z)-.5, fx=Math.sin(yaw), fz=Math.cos(yaw), col=RF_BURNT[(rnd()*3)|0], foot=[x,y+7,z], tip=[x+fx*len,hAt(x+fx*len,z+fz*len),z+fz*len];   // (the tip on the ground where it lies, not at the height of the stump)
  frustum(m,x,y,z,r*1.1,r*.8,8,10,[.2,.19,.19],[.05,.05,.05]);
  tube(m,foot,tip,r,col);
  for(let f=.2;f<.95;f+=.2){ const p=[lerp(foot[0],tip[0],f),lerp(foot[1],tip[1],f),lerp(foot[2],tip[2],f)]; tube(m,[p[0]-fx*.4,p[1],p[2]-fz*.4],[p[0]+fx*.4,p[1],p[2]+fz*.4],r+1.1,[.22,.22,.24]); }
  wallRun([[x,z],[tip[0],tip[2]]],r+.6); RF_FALLEN.push([x,z,tip[0],tip[2],r+.6]);                                    // the whole body is solid, from the stump to the tip
  for(let k=0;k<14;k++){ const a=rnd()*6.283, d=r+rnd()*16; m.rock(x+Math.cos(a)*d,y+.5,z+Math.sin(a)*d,1+rnd()*2.6,[.16,.15,.15],rnd); }
  colliders.push([x,z,r*1.1]); }
// a tank that has split open: a torn ring of wall with the roof fallen in
function rfRuptured(m,rnd,x,z,r,h){
  const y=rfFoot(x,z,r), seg=14; for(let i=0;i<seg;i++){ if(i%5===2) continue; const a0=i/seg*6.283, a1=(i+1)/seg*6.283, hh=h*(.45+rnd()*.55);
    m.quad([x+Math.cos(a0)*r,y,z+Math.sin(a0)*r],[x+Math.cos(a1)*r,y,z+Math.sin(a1)*r],[x+Math.cos(a1)*r,y+hh,z+Math.sin(a1)*r],[x+Math.cos(a0)*r,y+hh,z+Math.sin(a0)*r],RF_BURNT[i%3],[x,y,z]); }
  colliders.push([x,z,r]); }
LEVELS.refinery={
  id:'refinery', seed:127, name:'REFINERY RUSH', sub:'What air defense doing?',
  loc:'Moscow, Russia', flag:'ru',
  blurb:"Due to long-range sanctions imposed on invaders, the refinery track may be more challenging than expected. Avoid fire and debris on your way to the finish line!",
  theme:{
    skyTop:[.012,.008,.012], skyHor:[.13,.045,.03], fog:[.05,.024,.024], fogN:60, fogF:620,
    amb:[.62,.58,.62], hemi:[.08,.08,.1], sun:[.14,.1,.1], light:[.5,.35,.3], night:true, snow:false, body:null, embers:1, spray:[.05,.045,.05],
    clouds:{col:[.6,.2,.06],shade:[.012,.009,.012],pillars:[.7,.34,.16, 2.95,.29,.13, 4.95,.37,.17]},   // three pillars of smoke, light at the foot, dark at the top: [bearing, height, width] each
    firelight:{dark:[.5,.44,.56],far:[.16,.12,.19],farAt:120,deep:[.75,.13,.04],mid:[1.3,.5,.13],hot:[1.9,1.25,.6],gain:1,decor:.62,marks:1.7,car:.6,pool:[.1,.04,.01]},   // (see fx.js)
    fireSmoke:[.6,.28,.12],                                    // the smoke leaves the flames lit from below, and blackens as it rises
    road:[.2,.19,.2], roadAlt:[.18,.17,.18], roadEdge:[.5,.46,.42], stain:[.1,.09,.1], conc:[.36,.33,.31], concAlt:[.3,.28,.27], gravel:[.36,.31,.26], rust:[.38,.22,.14],
    dust:{road:[.32,.28,.26],off:[.3,.25,.2],ice:[.9,.95,1],a:.8,sz:1},
    map:{bg:'rgba(30,14,8,0.95)',road:'#ffc070',edge:'#100604'}
  },
  tankCols:[[.44,.42,.42],[.36,.36,.38],[.46,.26,.2],[.5,.46,.4],[.32,.32,.34]],
  phys:{gripRoad:7.0,gripOff:4.6,gripIce:2,dragRoad:.12,dragOff:.42,dragIce:.05,maxOff:.83},
  rim:45,
  hills(x,z){ return 3.4*Math.sin(x/150+.2)*Math.cos(z/170+.5)+1.6*Math.sin((x-z)/80); },
  trackPts(){ return startNear(resampleClosed(filletLoop(RF_V.map(p=>[p[0]*.92,p[1]*.92]),RF_V.map(p=>p[2]),10),M),-220,-276); },
  layout(){ return calmLayout([.06,.19,.33,.47,.62,.77,.91],[[.12,5],[.55,5.5]],.03,.065); },
  plantPrepare(){ const raw=new Float32Array(M); for(let i=0;i<M;i++) raw[i]=this.hills(track[i].x,track[i].z); this.prof=smoothArr(raw,6); },
  prepare(){ this.plantPrepare(); this.oil=makePuddles(173,20,HALFW*.72).filter(p=>Math.hypot(p[0]-track[0].x,p[1]-track[0].z)>130); },   // (none on the starting grid)
  profile(s){ return arrProfile(this.prof,s)+jumpsSum(s); },
  base(x,z,th,d){ const far=smooth(HALFW+2,60,d); return th*(1-far)+this.hills(x,z)*far; },
  iceAt(){ return false; },
  puddleAt(x,z){ return puddleHit(this.oil,x,z); },
  color(c){
    const T=THEME;
    if(c.d<HALFW){
      if(c.s<0.0035||c.s>0.9985) return [.95,.95,.95];
      if(c.d>HALFW-2) return T.roadEdge;
      return vnoise(c.cx*.25,c.cz*.25)>.55?T.roadAlt:vnoise(c.cx*.09+3,c.cz*.09)>.8?T.stain:T.road; }
    if(c.d<HALFW+6) return T.conc;
    const n=vnoise(c.cx*.03,c.cz*.03);
    return n>.62?T.gravel:n>.4?(vnoise(c.cx*.12,c.cz*.12)>.5?T.conc:T.concAlt):(vnoise(c.cx*.07,c.cz*.07)>.7?T.rust:T.gravel); },
  plantDecor(m,rnd){
    const free=(x,z,r)=>roadDist(x,z)>HALFW+r+6, pick=a=>a[(rnd()*a.length)|0];
    // the plant: every 64x64 cell holds one kind of installation
    for(let gz=-448;gz<=448;gz+=64) for(let gx=-448;gx<=448;gx+=64){
      const cx=gx+(rnd()-.5)*10, cz=gz+(rnd()-.5)*10, r=rnd();
      if(r<.28){ for(let k=0,n=3+((rnd()*3)|0);k<n;k++){ const x=cx+(k%2-.5)*30+(rnd()-.5)*6, z=cz+((k>>1)-.5)*30+(rnd()-.5)*6, rad=8+rnd()*5; if(free(x,z,rad)) tank(m,x,z,rad,9+rnd()*8,pick(this.tankCols),rnd()<.5); } }
      else if(r<.45){ for(let k=0;k<3;k++){ const x=cx+(k-1)*14, z=cz+(rnd()-.5)*10; if(free(x,z,6)) column(m,x,z,2.6+rnd()*1.6,40+rnd()*36); }
        if(free(cx,cz+22,3)) pipeRack(m,cx-18,cz+22,40,Math.PI/2,6); }
      else if(r<.56){ if(free(cx,cz,10)) smokestack(m,rnd,cx,cz,60+rnd()*30); }
      else if(r<.64){ if(free(cx,cz,3)) flare(m,cx,cz,60+rnd()*25); }
      else if(r<.72){ if(free(cx,cz,16)) coolingTower(m,rnd,cx,cz); }
      else if(r<.80){ for(let k=0;k<3;k++){ const x=cx+(k-1)*24, z=cz+(rnd()-.5)*8, rad=8+rnd()*3; if(free(x,z,rad)) sphereTank(m,x,z,rad); } }
      else if(r<.90){ const w=22+rnd()*14, d=16+rnd()*10; if(free(cx,cz,Math.max(w,d)*.62)) shed(m,rnd,cx,cz,w,d,7+rnd()*5,rnd()<.5); }
      // else: empty yard (gravel, a few drums)
      for(let k=0;k<4;k++){ const x=cx+(rnd()-.5)*50, z=cz+(rnd()-.5)*50; if(free(x,z,2)&&rnd()<.5){ const y=hAt(x,z); cylY(m,x,y,z,.7,1.4,6,rnd()<.5?[.7,.2,.12]:[.2,.35,.6],[.3,.3,.3]); colliders.push([x,z,.8]); } }
    }
    // pipelines running along the road, raised on posts so the road passes under the crossings
    for(let i=0;i<M;i+=60){ const sg=(i/60|0)&1?1:-1, a=roadside(i,sg,5), b=roadside(i+40,sg,5);
      if(!free(a[0],a[1],1)||!free(b[0],b[1],1)||GATES.some(g=>Math.hypot(g.x-a[0],g.z-a[1])<20)) continue;
      pipeRack(m,a[0],a[1],Math.hypot(b[0]-a[0],b[1]-a[1]),Math.atan2(b[0]-a[0],b[1]-a[1]),2.5); }
    // pipe gates: pipework running along the road rises, crosses high above it and comes down again (the old bridges are gone)
    const usedG=[]; this.pipeGates=[];
    for(let i=30;i<M&&usedG.length<7;i+=3){ const t=track[i]; if(usedG.some(j=>Math.abs(wrapS(track[j].s-t.s))<.075)||GATES.some(g=>Math.hypot(g.x-t.x,g.z-t.z)<40)||JUMPS.some(j=>{ const d=((t.s-j[0]+1.5)%1)-.5; return d>-.05&&d<.1; })) continue;
      let ok=true; for(let k=-3;k<=3;k++) if(bendAt((i+k*3+M)%M)>.026) ok=false; if(!ok) continue;
      if(![-3,-1.5,0,1.5,3].every(k=>{ const u=track[(i+Math.round(k*4)+M)%M]; return roadDist(u.x+u.tz*(HALFW+7),u.z-u.tx*(HALFW+7))>HALFW+5.5&&roadDist(u.x-u.tz*(HALFW+7),u.z+u.tx*(HALFW+7))>HALFW+5.5; })) continue;
      usedG.push(i); this.pipeGates.push(+t.s.toFixed(3)); pipeGate(m,rnd,i,40); }
    // pump skids and valve bays crowding the verge, alternating sides
    for(let i=25;i<M;i+=38){ const sg=((i/38)|0)&1?1:-1, t=track[i], [x,z]=roadside(i,sg,3.6+rnd()*2.4); if(bendAt(i)>.012||GATES.some(g=>Math.hypot(g.x-x,g.z-z)<24)||usedG.some(j=>Math.abs(wrapS(track[j].s-t.s))*TL<70)||roadDist(x,z)<HALFW+2.6) continue;
      skid(m,rnd,x,z,Math.atan2(t.tx,t.tz)); }
    // hazard barriers on the outside of every sharp bend
    for(const A of sharpBends(.012,8)){ const n=Math.min(A.n+8,90); barrierRun(m,(A.a-4+M)%M,n,A.out,1.4,1.1,k=>(k%6<3)?[.95,.78,.1]:[.1,.1,.12],null,true); }
    LEVELS.city.guidance(m);                                   // chevron boards on the bends
    // trucks and forklifts parked in the yards
    for(let i=15;i<M;i+=70){ const sg=((i/70)|0)&1?1:-1, [x,z]=roadside(i,sg,9), t=track[i]; if(!free(x,z,5)) continue; semiTruck(m,x,hAt(x,z),z,Math.atan2(t.tx,t.tz),[.9,.7,.1],[.82,.82,.84]); { const fx=t.tx/Math.hypot(t.tx,t.tz), fz=t.tz/Math.hypot(t.tx,t.tz); wallRun([[x-fx*7.8,z-fz*7.8],[x+fx*9.2,z+fz*9.2]],1.3); } }   // (the truck's own length and width)
    // distant plant outside the playing area
    this.distantPlant(m,rnd);
  },
  decor(m,rnd){
    RF_SITES=[]; RF_SMOG=.3; this.plantDecor(m,rnd); RF_SMOG=1;
    const S=RF_SITES; RF_SITES=null; this.obstacles=[];
    // part of the plant is alight: tanks burn at the roof, columns at the top. High up, so they only have to be looked at
    S.forEach((q,k)=>{ if(q.k==='tank'&&k%3===0) addFire(q.x,q.y,q.z,q.r*.85,q.r*2.6,{hurt:false,big:true,smoke:.3,far:560,reach:62+q.r*3,lum:1.1});
      else if(q.k==='column'&&k%4===0) addFire(q.x,q.y,q.z,4,18,{hurt:false,smoke:0,far:420,reach:50,lum:.6}); });
    // the oil on the road: every puddle burns, the opponents steer round them
    const burnOil=p=>{ addFire(p[0],hAt(p[0],p[1])+.2,p[1],(p[2]+p[3])/2,4.2,{e:[p[2],p[3],p[4]],smoke:0,reach:48,lum:2.2});
      const nt=nearestTrack(p[0],p[1]), t=track[nt.i], lat=(p[0]-t.x)*t.tz-(p[1]-t.z)*t.tx; this.obstacles.push([nt.i,lat||.5,p[3]+.8]); };
    this.oil.forEach(burnOil);
    for(const w of RF_FALLEN) roadObstacles(w,this.obstacles);            // a column fallen across the road: everyone steers round its tip
    // debris on some stretches: flat rubble that can be driven over, with a burning spill of oil towards the road edge
    const clear=i=>{ const t=track[i]; return Math.hypot(t.x-track[0].x,t.z-track[0].z)>130&&bendAt(i)<.012&&!GATES.some(g=>Math.hypot(g.x-t.x,g.z-t.z)<40)&&!JUMPS.some(j=>{ const d=((t.s-j[0]+1.5)%1)-.5; return d>-.05&&d<.1; })&&!this.pipeGates.some(s=>Math.abs(wrapS(s-t.s))<.02)&&!this.oil.some(p=>Math.hypot(p[0]-t.x,p[1]-t.z)<20); };
    let n=0; for(let i=40;i<M&&n<11;i+=62+((rnd()*30)|0)){ if(!clear(i)) continue; n++; const t=track[i], sg=n&1?1:-1, lat=sg*(HALFW-5.5-rnd()*2), x=t.x+t.tz*lat, z=t.z-t.tx*lat, spill=[x,z,4+rnd()*2.5,2.4+rnd(),Math.atan2(t.tx,t.tz)];
      for(let k=0;k<26;k++){ const a=(rnd()-.5)*44, b=(rnd()-.5)*HALFW*1.6, px=t.x+t.tx*a+t.tz*b, pz=t.z+t.tz*a-t.tx*b, py=hAt(px,pz); if(rnd()<.6) m.box(px,py+.1,pz,.5+rnd()*1.6,.16,.5+rnd()*1.6,[.2,.19,.2]); else orBox(m,px,pz,1.5+rnd()*2,.25,py+.03,py+.2,rnd()*6.28,[.4,.27,.18]); }
      this.oil.push(spill); burnOil(spill); }
  },
  // beyond the plant: towers lying where they fell, split tanks, each with a fire the size of a building under a column of black smoke
  distantPlant(m,rnd){
    RF_FALLEN.length=0;
    for(let i=0;i<16;i++){ const a=i/16*6.283+rnd()*.12, r=450+rnd()*60, x=Math.cos(a)*r, z=Math.sin(a)*r, k=i%4, yaw=a+Math.PI+(rnd()-.5)*1.4;
      if(k===0||k===2){ rfToppled(m,rnd,x,z,yaw,86+rnd()*30,6+rnd()*2); addFire(x+Math.sin(yaw)*34,hAt(x,z),z+Math.cos(yaw)*34,30,100+rnd()*40,{hurt:false,smoke:2,far:1150,reach:230,lum:2}); }
      else if(k===1){ rfRuptured(m,rnd,x,z,28,34); addFire(x,hAt(x,z)+6,z,24,80+rnd()*40,{hurt:false,smoke:2,far:1150,reach:210,lum:2}); }
      else { smokestack(m,rnd,x,z,110); addFire(x,hAt(x,z),z,14,34,{hurt:false,big:true,smoke:1,far:900,reach:150,lum:1.5}); } } },
  plantMarks(m){ for(let i=0;i<M;i++){ if(i%8<4) markStrip(m,i,i+1,0,.2,[.95,.8,.2]); markStrip(m,i,i+1,HALFW-1.6,.15,[.92,.92,.9]); markStrip(m,i,i+1,-(HALFW-1.6),.15,[.92,.92,.9]); } },
  marks(m){ this.plantMarks(m); drawPuddles(m,this.oil,[.025,.022,.025]); },
  mapBg(g,X,Z,sc){ g.fillStyle='rgba(90,70,50,0.45)'; for(let gz=-448;gz<=448;gz+=64) for(let gx=-448;gx<=448;gx+=64) if(((gx+gz)/64&1)) g.fillRect(X(gx)-12*sc,Z(gz)-12*sc,24*sc,24*sc); }
};
