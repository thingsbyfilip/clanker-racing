'use strict';
// Level: Coconut Beach (Miami beach at sunset).
// ---------------- MIAMI BEACH (sunset; the west side of the map is a beach road right along the sea, the east side is a city with streets between art deco hotels) ----------------
const MIAMI_PASTEL=[[.96,.62,.72],[.55,.88,.80],[.98,.92,.74],[.98,.74,.56],[.62,.80,.96],[.88,.70,.96],[.99,.99,.94]];
const MIAMI_NEON=[[1,.25,.65],[.2,.95,.95],[1,.6,.2]];
// the shoreline: x of the water's edge at depth z. miamiU = how far inland (+) or out to sea (-) a point is
const MI_COAST=z=>-345+14*Math.sin(z/190+.4);
const miamiU=(x,z)=>x-MI_COAST(z);
// the sand ends here: beyond it (east) the promenade and the city begin
const MI_SAND=z=>-200+12*Math.sin(z/55+1);
// loop: start on the coast road (heading north on a dead straight x = -285 up to the middle of the map), north street (east), east avenue with a bay, south street with a notch (west) and back to the coast
const MI_V=[[-272,-385,100],[-70,-385,100],[60,-325,100],[190,-385,100],[400,-385,80],[400,-80,60],[270,-80,60],[270,70,60],[400,70,60],[400,385,80],[120,385,60],[120,250,60],[-100,250,60],[-100,385,60],
  [-285,385,100],[-285,0,150],[-268,-130,150],[-292,-270,150]];
// flamingo lawn ornament
function flamingo(m,x,y,z){ const p=[1,.45,.62];
  m.box(x-.12,y+.7,z,.06,1.4,.06,[.95,.4,.55]); m.box(x+.12,y+.7,z,.06,1.4,.06,[.95,.4,.55]);
  m.box(x,y+1.6,z,.3,.5,.9,p); m.box(x,y+2.2,z+.55,.12,1.0,.12,p); m.box(x,y+2.7,z+.65,.2,.2,.4,p); m.box(x,y+2.62,z+.9,.07,.07,.3,[.2,.2,.2]); }
// life guard tower: pastel hut on stilts with a ramp and a flag
function lifeguardTower(m,x,y,z,col){
  for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]]) m.box(x+a*1.1,y+1.4,z+b*1.1,.25,2.8,.25,[.9,.9,.88]);
  m.box(x,y+3.0,z,3.2,.25,3.2,[.9,.9,.88]); m.box(x,y+4.0,z,2.6,1.8,2.6,col);
  pyramid(m,x,y+4.9,z,1.8,1.8,.9,[.98,.98,.96]); m.box(x,y+5.5,z-2.2,.1,1.2,.1,[.9,.9,.9]); m.box(x+.5,y+6.2,z-2.2,1,.5,.05,[.95,.2,.2]);
  m.prism(x,z+1.6,x,z+4.2,.7,y+.05,y+.25,[.85,.78,.62]); colliders.push([x,z,2]); }
// sun umbrella with two loungers
function beachSet(m,x,y,z,col,yaw){
  m.box(x,y+1.4,z,.12,2.8,.12,[.95,.95,.95]); m.cone(x,y+2.7,z,2.2,.8,8,col);
  for(const sg of [-1,1]) orBox(m,x+sg*1.3,z,2,.8,y+.3,y+.55,yaw,[.98,.98,.96]);
  colliders.push([x,z,.5]); }
// art deco hotel: pastel block with a stepped top, horizontal eyebrows, a neon sign band, a spire on the taller ones. far: fewer windows
function deco(m,rnd,x0,z0,x1,z1,y,h,far){
  const cx=(x0+x1)/2, cz=(z0+z1)/2, w=x1-x0, d=z1-z0, pick=a=>a[(rnd()*a.length)|0], col=pick(MIAMI_PASTEL);
  m.box(cx,y+h/2,cz,w,h,d,col);
  const lo=[col[0]*.92,col[1]*.92,col[2]*.92];
  wallWindows(m,rnd,x0,z0,x1,z1,y+5,y+h-2,[[.22,.46,.56],[.3,.55,.62]],far?.7:.85,far?6.8:3.6,far?6.8:3.4,.55,.5);
  for(let f=y+3.4;f<y+h-1;f+=6.8){ m.box(cx,f,cz,w+1.6,.35,d+1.6,[.98,.98,.96]); }            // eyebrows
  m.box(cx,y+h+.5,cz,w+.8,1,d+.8,[.99,.99,.96]);
  if(h>26){ m.box(cx,y+h+3,cz,w*.6,5,d*.6,lo); m.box(cx,y+h+7.5,cz,1.2,4,1.2,[.95,.95,.9]); m.em=true; m.box(cx,y+h+10,cz,.7,.7,.7,[1,.3,.6]); m.em=false; }
  const neon=pick(MIAMI_NEON); m.em=true;
  m.box(cx,y+h-3,z0-.25,w*.6,.5,.2,neon); m.box(cx,y+h-3,z1+.25,w*.6,.5,.2,neon); m.box(x0-.25,y+4.6,cz,.2,.5,d*.5,neon); m.box(x1+.25,y+4.6,cz,.2,.5,d*.5,neon); m.em=false;
  rects.push([cx,cz,w/2+.4,d/2+.4]); }
// a small beach house: pastel clapboard box with a pitched roof, a door, a couple of windows and a little porch on the road side (west)
function beachHouse(m,rnd,x,z){
  const w=7+rnd()*2.5, d=6+rnd()*2, x0=x-w/2, x1=x+w/2, z0=z-d/2, z1=z+d/2, y=footprint(x0-3,z0,x1,z1)[0]-.4, h=3.4, col=MIAMI_PASTEL[(rnd()*7)|0], roof=[[.78,.3,.26],[.3,.52,.62],[.9,.9,.86]][(rnd()*3)|0];
  m.box(x,y+h/2,z,w,h,d,col); gable(m,x0-.5,z0-.5,x1+.5,z1+.5,y+h,2.2,roof,false,col);
  m.box(x0-1.6,y+.35,z,3.2,.3,d*.7,[.88,.8,.66]); for(const sg of [-1,1]) m.box(x0-2.9,y+1.6,z+sg*d*.3,.18,2.6,.18,[.95,.95,.92]);   // porch deck and posts
  m.box(x0-1.6,y+3.0,z,3.4,.2,d*.8,[.95,.95,.92]);
  m.em=true; wallQuad(m,x0-.1,y+1.9,z+d*.2,-1,0,1.3,1.3,[1,.8,.45]); wallQuad(m,x0-.1,y+1.9,z-d*.2,-1,0,1.3,1.3,[1,.8,.45]); m.em=false; wallQuad(m,x0-.1,y+1.3,z,-1,0,1.1,2.4,[.4,.25,.2]);
  rects.push([x,z,w/2+.4,d/2+.4]); }
// a sailing yacht: tapered white hull with a raked bow and a coloured stripe, a low cabin, a tall mast with a billowing mainsail and jib
// (some carry a coloured spinnaker instead of the jib), a boom and a stern rail
function sailYacht(m,rnd,x,z,yaw,L,col,spin){
  const fx=Math.sin(yaw), fz=Math.cos(yaw), lx=fz, lz=-fx, W=L*.28, W2=W/2, y0=-.5, y1=1.1, P=(a,b,y)=>[x+fx*a*L+lx*b,y,z+fz*a*L+lz*b], o=[x,.6,z], white=[.97,.97,.95], cream=[.99,.98,.93];
  orBox(m,x-fx*L*.1,z-fz*L*.1,L*.8,W,y0,y1,yaw,white); orBox(m,x-fx*L*.1,z-fz*L*.1,L*.8,W+.12,y0+.65,y0+.95,yaw,col);
  const a0=.3, tip=.5;
  m.tri(P(a0,-W2,y1),P(a0,W2,y1),P(tip,0,y1+.4),white,o);
  for(const sg of [-1,1]) m.quad(P(a0,sg*W2,y0),P(a0,sg*W2,y1),P(tip,0,y1+.4),P(tip,0,y0+.8),white,o);
  m.tri(P(a0,-W2,y0),P(a0,W2,y0),P(tip,0,y0+.8),[.3,.3,.34],o);
  orBox(m,x-fx*L*.18,z-fz*L*.18,L*.3,W*.6,y1,y1+.9,yaw,cream); orBox(m,x-fx*L*.18,z-fz*L*.18,L*.31,W*.62,y1+.35,y1+.7,yaw,[.14,.2,.28]);
  const H=L*1.15, mastA=.08, top=P(mastA,0,y1+H), base=P(mastA,0,y1+.4), boom=P(-.42,0,y1+1.2), bow=P(tip-.02,0,y1+.5), belly=.9+L*.05;
  m.box(x+fx*mastA*L,y1+H/2+.2,z+fz*mastA*L,.22,H,.22,[.86,.86,.9]);
  orBox(m,x-fx*L*.17,z-fz*L*.17,L*.5,.2,y1+1.05,y1+1.25,yaw,[.86,.86,.9]);                                     // boom
  const sail=(A,B,C,col)=>{ const cx=(A[0]+B[0]+C[0])/3, cy=(A[1]+B[1]+C[1])/3, cz=(A[2]+B[2]+C[2])/3, D=[cx+lx*belly,cy,cz+lz*belly];
    m.tri(A,B,D,col,[cx-lx*3,cy,cz-lz*3]); m.tri(B,C,D,col,[cx-lx*3,cy,cz-lz*3]); m.tri(C,A,D,col,[cx-lx*3,cy,cz-lz*3]);
    m.tri(A,B,C,[col[0]*.9,col[1]*.9,col[2]*.92],[cx+lx*3,cy,cz+lz*3]); };
  sail(base,top,boom,white);                                                                                      // mainsail
  if(spin) sail(P(mastA+.02,0,y1+H*.82),bow,P(tip-.12,0,y1+.7),spin); else sail(P(mastA+.04,0,y1+H*.92),bow,P(mastA+.04,0,y1+.45),cream);   // jib / spinnaker
  for(let k=-1;k<=1;k++) colliders.push([x+fx*k*L*.3,z+fz*k*L*.3,W*.62]); }
// a static vehicle left on the road, facing along it (skew = optional yaw offset). kind: car | van | truck | semi
const LITTER_HL={car:2.2,van:2.7,truck:4,semi:9.5}, LITTER_W={car:1.1,van:1.2,truck:1.3,semi:1.4};
function litterVehicle(m,rnd,i,kind,lat,skew){
  const t=track[i], x=t.x+t.tz*lat, z=t.z-t.tx*lat, yaw=Math.atan2(t.tx,t.tz)+skew, y=hAt(x,z), fx=Math.sin(yaw), fz=Math.cos(yaw), hl=LITTER_HL[kind];
  const col=[[.9,.1,.12],[.2,.4,.85],[.95,.8,.15],[.9,.9,.9],[.12,.12,.14],[.2,.65,.4],[.96,.55,.2],[.6,.3,.7]][(rnd()*8)|0];
  if(kind==='semi') semiTruck(m,x,y,z,yaw,col,[.86,.86,.88]);
  else vehicleProp(m,x,y,z,yaw,col,kind);
  const sc=kind==='semi'?.5:0; for(let a=-hl+1.2;a<=hl-1.1;a+=2.4) colliders.push([x+fx*(a+sc),z+fz*(a+sc),LITTER_W[kind]]); }

LEVELS.miami={
  id:'miami', seed:97, name:'COCONUT BEACH', sub:'When in doubt, use nitrous!',
  loc:'Miami, Florida', flag:'us',
  blurb:'A scenic drive on a lovely beach by the ocean, somewhat ruined by the need to dodge other vehicles and *out run* your rivals. When in doubt—use nitrous!',
  sea:0, seaCol:[.10,.46,.80],
  theme:{
    skyTop:[0.22,0.30,0.74], skyHor:[1.0,0.66,0.52], fog:[0.99,0.72,0.62], fogN:150, fogF:780,
    amb:[.54,.46,.52], hemi:[.24,.20,.26], sun:[.62,.52,.40], light:[-.5,.55,-.4], night:false, snow:false,
    body:{yaw:.9,y:.40,r:.07,col:[1,.86,.52]}, clouds:{col:[1,1,1],shade:[.80,.80,.92],amt:1},
    road:[.36,.36,.42], roadAlt:[.33,.33,.39], roadEdge:[.90,.88,.80], sand:[.98,.88,.68], sandAlt:[.94,.82,.62], wet:[.84,.74,.56], foam:[.98,.98,1], bed:[.82,.74,.58],
    grass:[.28,.62,.34], grassAlt:[.34,.68,.38], plaza:[.92,.82,.74], plazaAlt:[.88,.78,.70], paving:[.74,.68,.66], pavingAlt:[.70,.64,.64],
    dust:{road:[.96,.88,.76],off:[.97,.90,.70],ice:[.9,.95,1],soft:[.97,.88,.68],a:.7,sz:1},
    map:{bg:'rgba(22,100,170,0.94)',road:'#fff1c8',edge:'#2a1a2a'}
  },
  phys:{gripRoad:7.4,gripOff:4.6,gripIce:2,dragRoad:.12,dragOff:.45,dragIce:.05,maxOff:.8},
  rim:0,
  trackPts(){ return startNear(resampleClosed(filletLoop(MI_V.map(v=>[v[0],v[1]]),MI_V.map(v=>v[2]),10),M),-285,215); },
  layout(){ return calmLayout([.07,.21,.36,.50,.64,.78,.92],[[.14,5],[.57,5.5]],.03,.06); },
  // the beach is deep sand: everything off the road on the sand slows the car down
  softAt(x,z,onTrack){ return !onTrack&&x<MI_SAND(z)&&hAt(x,z)>.3?1:0; },
  land(x,z){ const u=miamiU(x,z), inl=smooth(30,150,u), e=Math.max(Math.abs(x),Math.abs(z));
    return lerp(-8,4.6,smooth(-10,22,u))+(fbm(x*.012+4,z*.012)-.5)*2.4*inl+1.1*Math.sin(x/75+.5)*Math.sin(z/95)*inl+smooth(HALF-130,HALF-6,e)*34*smooth(20,120,u); },
  prepare(){ const raw=new Float32Array(M); for(let i=0;i<M;i++){ const t=track[i]; raw[i]=this.land(t.x,t.z)+.55; }
    this.prof=smoothArr(raw,6); },
  profile(s){ return arrProfile(this.prof,s)+jumpsSum(s); },
  base(x,z,th,d){ const far=smooth(HALFW+2,80,d); return th*(1-far)+this.land(x,z)*far; },
  iceAt(){ return false; },
  color(c){
    const T=THEME, h=c.hy;
    if(c.d<HALFW){
      if(c.s<0.0035||c.s>0.9985) return [.95,.95,.95];
      if(c.d>HALFW-1.8) return T.roadEdge;
      return vnoise(c.cx*.2,c.cz*.2)>.5?T.road:T.roadAlt; }
    if(h<-0.4) return T.bed;
    if(h<0.5) return T.foam;
    if(h<1.8) return T.wet;
    if(c.cx<MI_SAND(c.cz)) return vnoise(c.cx*.05,c.cz*.05)>.5?T.sand:T.sandAlt;                 // the beach: sand on both sides of the coast road
    if(c.d<HALFW+9) return T.plaza;
    return vnoise(c.cx*.03,c.cz*.03)>.72?T.grassAlt:(((Math.floor(c.cx/8)+Math.floor(c.cz/8))&1)?T.paving:T.pavingAlt); },
  decor(m,rnd){
    const city=x=>x>-150, gateNear=(x,z,r)=>GATES.some(g=>Math.hypot(g.x-x,g.z-z)<r);
    // palms in a row along both sides of the road, alternating sides (close to the kerb in the city)
    for(let i=0;i<M;i+=6){ const sg=((i/6)|0)&1?1:-1, t=track[i], cty=city(t.x), [x,z]=roadside(i,sg,cty?3.2:7+rnd()*2), y=hAt(x,z);
      if(y<2.5||gateNear(x,z,22)||roadDist(x,z)<HALFW+2) continue; const s=.95+rnd()*.5; palm(m,x,y,z,s,rnd); colliders.push([x,z,.55*s]); }
    // the city: rows of hotels along both sides of every street, so the road runs through a canyon of pastel walls
    for(const sg of [1,-1]) for(let i=0;i<M;){
      const w=20+rnd()*9, dd=18+rnd()*10, adv=Math.max(2,Math.round((w+3)/(TL/M))), im=(i+(adv>>1))%M, t=track[im];
      i+=adv; if(!city(t.x)||bendAt(im)>.0035) continue;
      const alongX=Math.abs(t.tx)>Math.abs(t.tz), [cx,cz]=roadside(im,sg,9+dd/2), ww=alongX?w:dd, hd=alongX?dd:w, x0=cx-ww/2, x1=cx+ww/2, z0=cz-hd/2, z1=cz+hd/2;
      if(x0<-185||[[x0,z0],[x1,z0],[x0,z1],[x1,z1]].some(([px,pz])=>roadDist(px,pz)<HALFW+7)||rects.some(r=>Math.abs(r[0]-cx)<r[2]+ww/2+1&&Math.abs(r[1]-cz)<r[3]+hd/2+1)||gateNear(cx,cz,26)) continue;
      const mid=1-Math.hypot(cx-150,cz*.6)/420;
      deco(m,rnd,x0,z0,x1,z1,footprint(x0,z0,x1,z1)[0]-1.5,12+rnd()*18+Math.max(0,mid)*(rnd()<.4?30:6),false); }
    // more hotels filling the blocks behind (taller towards the middle); the strip of sand east of the coast road stays free
    for(let gz=-420;gz<=420;gz+=46) for(let gx=-150;gx<=420;gx+=46){
      const x=gx+(rnd()-.5)*8, z=gz+(rnd()-.5)*8, w=20+rnd()*10, dd=20+rnd()*10, x0=x-w/2, x1=x+w/2, z0=z-dd/2, z1=z+dd/2;
      if(rnd()<.12||x0<MI_SAND(z)+30||[[x0,z0],[x1,z0],[x0,z1],[x1,z1],[x,z]].some(([px,pz])=>roadDist(px,pz)<HALFW+12)) continue;
      if(rects.some(r=>Math.abs(r[0]-x)<r[2]+w/2+2&&Math.abs(r[1]-z)<r[3]+dd/2+2)) continue;
      const mid=1-Math.hypot(x-150,z*.6)/420, tall=Math.max(0,mid)*(rnd()<.4?36:8);
      deco(m,rnd,x0,z0,x1,z1,footprint(x0,z0,x1,z1)[0]-1.5,12+rnd()*20+tall,roadDist(x,z)>HALFW+40); }
    // beach life: on the shore umbrellas with loungers, life guard towers, volleyball nets; on the sand strip east of the road umbrellas and nets
    const beach=(x,z,west)=>{ const y=hAt(x,z); if(y<1.8||y>6||roadDist(x,z)<HALFW+10) return;
      const r=rnd(); if(r<.55) beachSet(m,x,y,z,MIAMI_PASTEL[(rnd()*5)|0],0);
      else if(west&&r<.72) lifeguardTower(m,x,y,z,MIAMI_PASTEL[(rnd()*5)|0]);
      else { m.box(x-3,y+1.2,z,.2,2.4,.2,[.9,.9,.9]); m.box(x+3,y+1.2,z,.2,2.4,.2,[.9,.9,.9]); m.box(x,y+2,z,6,1,.05,[.95,.95,.95]); colliders.push([x-3,z,.4],[x+3,z,.4]); } };
    for(let z=-500;z<=500;z+=11) beach(MI_COAST(z)+12+rnd()*16,z,true);
    for(let z=-500;z<=500;z+=15){ const x=MI_SAND(z)-8-rnd()*40; if(x>-250) beach(x,z,false); }
    // small beach houses, only on the strip of sand east of the coast road (between the beach road and the city)
    for(let z=-330;z<=330;z+=24){ const zz=z+(rnd()-.5)*8, x=MI_SAND(zz)-16-rnd()*10; if(rnd()<.15||roadDist(x,zz)<HALFW+14||roadDist(x-6,zz)<HALFW+12||hAt(x,zz)<2.5) continue; beachHouse(m,rnd,x,zz); }
    // more palms on the east side of the beach road: clusters of two or three on the sand
    for(let i=0;i<M;i+=3){ const t=track[i]; if(t.x>-150||t.z>340||t.z<-340) continue;
      for(let k=0,n=1+((rnd()*2)|0);k<n;k++){ const [x,z]=roadside(i,-1,4+rnd()*20), y=hAt(x,z); if(y<2.5||x>MI_SAND(z)-3||gateNear(x,z,22)||roadDist(x,z)<HALFW+2.5||rects.some(r=>Math.abs(r[0]-x)<r[2]+2&&Math.abs(r[1]-z)<r[3]+2)) continue; const sc=.9+rnd()*.6; palm(m,x,y,z,sc,rnd); colliders.push([x,z,.55*sc]); } }
    // flamingos on the sand strip
    for(let i=0;i<24;i++){ const z=(rnd()-.5)*880, x=MI_SAND(z)-6-rnd()*34, y=hAt(x,z); if(roadDist(x,z)<HALFW+10||y<2.5) continue; flamingo(m,x,y,z); }
    // a red convertible next to the start line
    { const t=track[3], [x,z]=roadside(3,1,5); vehicleProp(m,x,hAt(x,z),z,Math.atan2(t.tx,t.tz),[.9,.1,.12],'car'); colliders.push([x,z,2.4]); }
    // parked cars at the kerb
    for(let i=20;i<M;i+=34){ const t=track[i], sg=((i/34)|0)&1?1:-1, [x,z]=roadside(i,sg,city(t.x)?4.6:5); if(hAt(x,z)<2.5||bendAt(i)>.004||gateNear(x,z,20)||roadDist(x,z)<HALFW+2.5) continue;
      vehicleProp(m,x,hAt(x,z),z,Math.atan2(t.tx,t.tz),MIAMI_PASTEL[(rnd()*7)|0],rnd()<.25?'van':'car'); colliders.push([x,z,2.4]); }
    // abandoned vehicles littering the road: about 20 cars, vans and trucks (and a semi), parked straight on one side of the lane, facing along the road
    // (the AI steers round them through LV.obstacles = [track index, lateral offset, half width])
    this.obstacles=[]; this.litter=[];
    const kinds=['car','van','car','truck','car','car','truck','car','van','car','semi','car','truck','car','car','van','van','car','truck','car'], nk=kinds.length;
    const jumpNear=s=>JUMPS.some(j=>{ const d=((s-j[0]+1.5)%1)-.5; return d>-.04&&d<.09; });
    const ok=[]; for(let i=0;i<M;i++){ const t=track[i]; if(t.s<.025||t.s>.985||bendAt(i)>.012||bendAt((i+8)%M)>.012||bendAt((i+M-8)%M)>.012||gateNear(t.x,t.z,26)||jumpNear(t.s)) continue; ok.push(i); }
    for(let k=0;k<nk;k++){ const tgt=Math.round((k+.5)*M/nk), kind=kinds[k], hl=LITTER_HL[kind], sg=k%2?1:-1, skew=0;
      const half=Math.abs(Math.sin(skew))*hl+Math.abs(Math.cos(skew))*LITTER_W[kind]+.4, lat=sg*clamp(half+5+rnd()*2.5,6,HALFW-half+2);
      let bi=-1,bd=1e9; for(const q of ok){ if(this.litter.some(l=>Math.abs(l-q)<13)) continue; const d=Math.min(Math.abs(q-tgt),M-Math.abs(q-tgt)); if(d<bd){ bd=d; bi=q; } }
      if(bi<0) continue; litterVehicle(m,rnd,bi,kind,lat,skew); this.obstacles.push([bi,lat,half]); this.litter.push(bi); }
    // sailing yachts out on the water along the whole west coast
    const stripes=[[.1,.2,.45],[.55,.1,.15],[.1,.4,.45],[.12,.12,.14]], spins=[[.95,.35,.6],[.25,.55,.95],[.98,.75,.2],null,null,null], boats=[];
    for(let tries=0;tries<300&&boats.length<16;tries++){ const z=-480+rnd()*960, L=12+rnd()*10, x=MI_COAST(z)-45-rnd()*150; if(x<-505||boats.some(b=>Math.hypot(b[0]-x,b[1]-z)<38)) continue;
      boats.push([x,z]); sailYacht(m,rnd,x,z,(rnd()<.5?0:Math.PI)+(rnd()-.5)*.8,L,stripes[(rnd()*4)|0],spins[(rnd()*6)|0]); }
    roadPosts(m,12,1.2,1.6,[.95,.95,.95],[1,.3,.6],false);
  },
  seaAt(x,z){ const u=miamiU(x,z); return u>-90?[.38,.92,.86]:u>-160?[.16,.70,.86]:this.seaCol; },
  ocean(m){
    const S=24, E=HALF;
    for(let ix=-E;ix<E;ix+=S) for(let iz=-E;iz<E;iz+=S){ const u=miamiU(ix+S/2,iz+S/2); if(u>50) continue; const k=((ix+iz)/S&1)?0.96:1, c=this.seaAt(ix+S/2,iz+S/2);
      m.quad([ix,0,iz],[ix+S,0,iz],[ix+S,0,iz+S],[ix,0,iz+S],[c[0]*k,c[1]*k,c[2]*k],'up'); } },
  marks(m){
    for(let i=0;i<M;i++){ if(i%8<4) markStrip(m,i,i+1,0,.3,[.98,.84,.2]); markStrip(m,i,i+1,HALFW-1.5,.17,[.95,.95,.95]); markStrip(m,i,i+1,-(HALFW-1.5),.17,[.95,.95,.95]); } },
  mapBg(g,X,Z,sc){ g.fillStyle='#e9d29a'; g.beginPath(); g.moveTo(X(MI_COAST(-540)),Z(-540)); for(let z=-540;z<=540;z+=30) g.lineTo(X(MI_COAST(z)),Z(z)); g.lineTo(X(MI_SAND(540)),Z(540)); for(let z=540;z>=-540;z-=30) g.lineTo(X(MI_SAND(z)),Z(z)); g.closePath(); g.fill();
    g.fillStyle='#a8908a'; g.beginPath(); g.moveTo(X(MI_SAND(-540)),Z(-540)); for(let z=-540;z<=540;z+=30) g.lineTo(X(MI_SAND(z)),Z(z)); g.lineTo(X(540),Z(540)); g.lineTo(X(540),Z(-540)); g.closePath(); g.fill();
    g.fillStyle='rgba(60,30,50,0.25)'; for(let gz=-420;gz<=420;gz+=54) for(let gx=-150;gx<=480;gx+=54) g.fillRect(X(gx),Z(gz),24*sc,24*sc); }
};
