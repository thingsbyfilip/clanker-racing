'use strict';
// Level: Rock Bottom.
// a yellow dump truck, nose along +z (wheels along x)
function dumpTruck(m,x,y,z){
  const yel=[.95,.75,.1], dk=[.16,.16,.18];
  m.box(x,y+1.5,z,3.0,0.8,7.2,dk);
  m.box(x,y+3.0,z-0.8,3.8,2.2,5.2,yel);                  // load bed
  m.box(x,y+2.8,z+3.6,3.0,2.6,2.2,yel);                  // cab
  m.box(x,y+3.2,z+4.75,2.4,1.2,0.12,[.45,.7,.85]);       // windscreen
  for(const sx of [-1.85,1.85]) for(const sz of [-2.2,2.6]) m.cylX(x+sx,y+1.1,z+sz,1.1,0.9,10,[.1,.1,.1],[.55,.55,.55]);
}
function excavator(m,x,y,z){
  const yel=[.95,.75,.1], dk=[.16,.16,.18];
  m.box(x-1.9,y+0.7,z,1.3,1.4,6,dk); m.box(x+1.9,y+0.7,z,1.3,1.4,6,dk);   // tracks
  m.box(x,y+2.2,z-0.3,4.4,1.8,4.6,yel);                                    // house
  m.box(x-0.9,y+3.7,z+1.2,1.8,1.4,1.8,yel); m.box(x-0.9,y+3.9,z+2.15,1.5,0.9,0.1,[.45,.7,.85]);
  m.box(x+0.9,y+3.8,z+4.2,0.7,0.7,6.5,yel);                                // boom
  m.box(x+0.9,y+2.6,z+7.1,0.6,3.2,0.6,yel); m.box(x+0.9,y+1.2,z+7.6,1.4,1.0,1.2,dk);   // stick + bucket
}
function conveyorTower(m,x,y,z){
  const dk=[.38,.38,.4], yel=[.95,.75,.1];
  for(const sx of [-1.8,1.8]) for(const sz of [-1.8,1.8]) m.box(x+sx,y+9,z+sz,.5,18,.5,dk);
  for(const hh of [5,11,17]){ m.box(x,y+hh,z-1.8,4.1,.4,.4,dk); m.box(x,y+hh,z+1.8,4.1,.4,.4,dk); m.box(x-1.8,y+hh,z,.4,.4,4.1,dk); m.box(x+1.8,y+hh,z,.4,.4,4.1,dk); }
  m.box(x,y+18.6,z+7,2.2,1,18,yel);                                        // conveyor belt out over the pit
}

// ---------------- 5. ROCK BOTTOM (day, terraced quarry pit, machinery, dust) ----------------
LEVELS.quarry={
  id:'quarry', seed:47, name:'ROCK BOTTOM', sub:'Between a rock and a hard place!', go:"LET'S ROCK!",
  loc:'Kalgoorlie, Australia', flag:'au',
  blurb:'Drop into a huge terraced quarry and race your way through loose gravel, abandoned haul roads, unwisely parked dump trucks, and clouds of dust.',
  theme:{
    skyTop:[0.42,0.52,0.66], skyHor:[0.82,0.81,0.77], fog:[0.78,0.77,0.73], fogN:100, fogF:620,
    amb:[.42,.42,.42], hemi:[.20,.20,.20], sun:[.60,.58,.52], light:[.5,.75,.4], night:false, snow:false,
    body:{yaw:-1.0,y:.70,r:.04,col:[1,.97,.88]},
    road:[.62,.58,.52], roadAlt:[.55,.51,.46], roadEdge:[.42,.39,.35], rock:[.58,.53,.47], rockAlt:[.50,.45,.40], wall:[.38,.34,.30], floor:[.45,.38,.28], strip:[.95,.75,.1],
    dust:{road:[.78,.74,.66],off:[.70,.65,.56],ice:[.9,.95,1],a:.85,sz:1.7},
    map:{bg:'rgba(46,42,36,0.9)',road:'#f0d890',edge:'#16130f'}
  },
  phys:{gripRoad:6.5,gripOff:4.5,gripIce:2,dragRoad:.14,dragOff:.38,dragIce:.05,maxOff:.8},
  rim:60,
  // a huge bowl whose height is quantised into flat terraces with steep faces between them
  hills(x,z){
    const r=Math.hypot(x,z), t=70*Math.pow(r/430,2)-55+(fbm(x*.004+3,z*.004)-.5)*40, q=8, f=t/q, fl=Math.floor(f);
    return (fl+smooth(0.78,1.0,f-fl))*q; },
  trackPts(){ const pts=[]; for(let i=0;i<M;i++){ const th=i/M*Math.PI*2, r=250+50*Math.sin(3*th+1)+30*Math.sin(5*th+2)+14*Math.sin(2*th); pts.push([r*Math.cos(th)*1.1,r*Math.sin(th)*0.9]); } return pts; },
  layout(){ return {gates:[.07,.20,.33,.46,.58,.73,.88], jumps:[[.13,6],[.40,8],[.65,7],[.82,6]]}; },
  prepare(){ const raw=new Float32Array(M); for(let i=0;i<M;i++){ const t=track[i], r=Math.hypot(t.x,t.z); raw[i]=70*Math.pow(r/430,2)-55+(fbm(t.x*.004+3,t.z*.004)-.5)*40; }
    const p=smoothArr(smoothArr(raw,16),8); for(let i=0;i<M;i++) p[i]*=0.95; this.prof=p; },     // the haul road ignores the terraces
  profile(s){ return arrProfile(this.prof,s)+jumpsSum(s); },
  base(x,z,th,d){ const far=smooth(HALFW+2,90,d); return th*(1-far)+this.hills(x,z)*far+((fbm(x*.04+9,z*.04)-.5)*3)*smooth(HALFW,HALFW+30,d); },
  iceAt(){ return false; },
  color(c){
    const T=THEME;
    if(c.d<HALFW){
      if(c.s<0.0035||c.s>0.9985) return [.95,.95,.95];
      if(c.d>HALFW-2.2) return T.roadEdge;
      return vnoise(c.cx*.2,c.cz*.2)>.5?T.road:T.roadAlt; }
    const steep=smooth(.9,.62,c.ny);
    const flat=vnoise(c.cx*.03,c.cz*.03)>.5?T.rock:T.rockAlt, floor=smooth(-35,-50,c.hy);
    const base=[lerp(flat[0],T.floor[0],floor),lerp(flat[1],T.floor[1],floor),lerp(flat[2],T.floor[2],floor)];
    return [lerp(base[0],T.wall[0],steep),lerp(base[1],T.wall[1],steep),lerp(base[2],T.wall[2],steep)]; },
  decor(m,rnd){
    // boulders and gravel piles
    for(let i=0,placed=0;i<4000&&placed<320;i++){ const x=(rnd()-.5)*(HALF*2-60), z=(rnd()-.5)*(HALF*2-60);
      if(nearestTrack(x,z).d<HALFW+9) continue; const y=hAt(x,z), r=rnd();
      if(r<.6){ const s=1.2+rnd()*3; m.rock(x,y,z,s,rnd()<.5?THEME.rock:THEME.rockAlt,rnd); colliders.push([x,z,s*.85]); }
      else m.cone(x,y,z,3+rnd()*4,2.5+rnd()*3,7,[.6,.56,.5]);
      placed++; }
    // parked machinery on level ground near (but not on) the road
    let trucks=0, diggers=0, towers=0;
    for(let i=0;i<9000&&(trucks<9||diggers<6||towers<3);i++){
      const x=(rnd()-.5)*(HALF*2-120), z=(rnd()-.5)*(HALF*2-120), d=nearestTrack(x,z).d;
      if(d<HALFW+16||d>110||!flatAt(x,z,1.0)) continue; const y=hAt(x,z)-0.3;
      if(trucks<9&&rnd()<.5){ dumpTruck(m,x,y,z); colliders.push([x,z,3.4],[x,z+3.2,2.6],[x,z-2.8,3]); trucks++; }
      else if(diggers<6&&rnd()<.5){ excavator(m,x,y,z); colliders.push([x,z,3.4],[x,z+4,2.2]); diggers++; }
      else if(towers<3&&d>30){ conveyorTower(m,x,y,z); colliders.push([x-1.8,z-1.8,.8],[x+1.8,z-1.8,.8],[x-1.8,z+1.8,.8],[x+1.8,z+1.8,.8]); towers++; } }
    roadPosts(m,8,1.3,2.8,[.95,.75,.1],[.1,.1,.1],true);
  },
  mapBg(g,X,Z,sc){ g.strokeStyle='#4a453d'; g.lineWidth=1.5; for(const r of [120,200,280,360,440]){ g.beginPath(); g.ellipse(X(0),Z(0),r*sc,r*sc,0,0,7); g.stroke(); } }
};
