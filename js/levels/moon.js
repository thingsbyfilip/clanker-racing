'use strict';
// Level: Tranquility Base (the Moon).
// ---------------- MOON (airless, stars, Earth in the sky, a flag and lander in the middle, gentle ramps in low gravity) ----------------
// the American flag on its pole (with the horizontal rod the Apollo flags had), facing direction (fx,fz); the plane is double sided
function moonFlag(m,x,y,z,fx,fz){
  const ux=-fz, uz=fx, H=36, W=22, Hh=14, yt=y+H-1.2;
  m.box(x,y+H/2,z,.5,H,.5,[.82,.82,.86]); m.em=false;
  m.box(x,y+H+.2,z,1.1,1.1,1.1,[.95,.85,.3]);
  // Two faces a little apart (front and back), each lit by its own outward normal, the stars raised just off the canton on both: a single
  // sheet with the stars in its plane z-fought and its normals (taken from a point in the plane itself) came out random from quad to quad
  const S=13, cy1=yt, cy0=yt-Hh*7/S;                                // 13 stripes, red on top; blue canton with a grid of white stars
  for(const sd of [1,-1]){ const ox=fx*sd*.05, oz=fz*sd*.05, sx=fx*sd*.12, sz=fz*sd*.12, Q=(a,b,y0,y1,col,o)=>vQuad(m,x+ux*a+o[0],z+uz*a+o[1],x+ux*b+o[0],z+uz*b+o[1],y0,y1,col,[x+ux*(a+b)/2-fx*sd,(y0+y1)/2,z+uz*(a+b)/2-fz*sd]);
    for(let k=0;k<S;k++){ const y1=yt-k*Hh/S, y0=y1-Hh/S; Q(k<7?W*.42:0,W,y0,y1,k&1?[.96,.96,.96]:[.78,.10,.14],[ox,oz]); }
    Q(0,W*.42,cy0,cy1,[.12,.2,.58],[ox,oz]);
    for(let r=0;r<4;r++) for(let c=0;c<5;c++){ const u=W*.42*(c+.7)/5.4, v=cy0+(cy1-cy0)*(r+.65)/4.3; Q(u-.35,u+.35,v-.35,v+.35,[.98,.98,.98],[sx,sz]); } }
  m.box(x+ux*W/2,yt+.15,z+uz*W/2,Math.abs(ux)*W+.3,.3,Math.abs(uz)*W+.3,[.82,.82,.86]);   // the rod
}
// the Apollo lunar module: gold descent stage with four legs and a ladder, grey ascent stage, antenna dish
function lunarLander(m,x,y,z){
  const gold=[.86,.68,.26], gold2=[.78,.6,.2], grey=[.74,.74,.78];
  cylY(m,x,y+2.2,z,3.7,2.6,8,gold,gold2);
  for(let k=0;k<4;k++){ const a=k*Math.PI/2+Math.PI/4, c=Math.cos(a), s=Math.sin(a);
    m.prism(x+c*3,z+s*3,x+c*6.4,z+s*6.4,.28,y+.2,y+2.4,[.7,.7,.72]); m.box(x+c*6.6,y+.15,z+s*6.6,1.6,.3,1.6,[.8,.8,.82]); }
  cylY(m,x,y+4.8,z,2.9,3.2,8,grey,[.66,.66,.7]);
  m.box(x+2.9,y+5.2,z,.5,1.6,1.4,[.2,.2,.24]);
  m.box(x,y+4,z+3.9,.3,3.6,.3,[.8,.8,.84]); m.box(x,y+7.2,z-1,.2,2.2,.2,[.8,.8,.84]);       // ladder rail and antenna
  dome(m,x-.6,y+8,z+1.6,1.3,[.9,.9,.92],8,3);
  colliders.push([x,z,5.6]);
}
// the lunar rover: wire wheels, seats, mesh dish
function lunarRover(m,x,y,z,yaw){
  const fx=Math.sin(yaw), fz=Math.cos(yaw), lx=fz, lz=-fx;
  orBox(m,x,z,3.2,1.8,y+.7,y+1.0,yaw,[.75,.75,.78]);
  for(const a of [-1.1,1.1]) for(const sg of [-1,1]) orBox(m,x+fx*a+lx*sg*1.05,z+fz*a+lz*sg*1.05,1.1,.35,y,y+1.1,yaw,[.5,.5,.52]);
  orBox(m,x-fx*.4,z-fz*.4,.8,1.4,y+1.0,y+1.9,yaw,[.9,.9,.92]);
  m.box(x+fx*1.1,y+2.1,z+fz*1.1,.1,1.8,.1,[.8,.8,.84]); dome(m,x+fx*1.1,y+2.7,z+fz*1.1,.9,[.95,.95,.97],6,2);
  colliders.push([x,z,1.8]);
}
LEVELS.moon={
  id:'moon', seed:83, name:'TRANQUILITY BASE', sub:'One small step for a buggy!', go:'LIFTOFF!',
  loc:'Sea of Tranquility, the Moon', flag:'moon',
  blurb:"Racing on the Moon? It's been done in 1972, but we might as well try it again. Make giant leaps for mankind in low gravity—but don't miss any checkpoints on your way down!",
  theme:{
    skyTop:[0,0,0.01], skyHor:[0.02,0.02,0.04], fog:[0.01,0.01,0.02], fogN:520, fogF:1500, stars:true,
    amb:[.17,.17,.20], hemi:[.07,.07,.10], sun:[1.0,.97,.90], light:[-.7,.42,.45], night:false, snow:false,
    body:{yaw:-1.0,y:.40,r:.032,col:[1,.98,.92]},
    body2:{yaw:-.25,y:.74,r:.12,mode:2},
    road:[.30,.30,.34], roadAlt:[.27,.27,.31], roadEdge:[.21,.21,.24], reg:[.52,.52,.54], regAlt:[.44,.44,.47], bright:[.70,.70,.72], dark:[.28,.28,.31], mare:[.36,.36,.40],
    dust:{road:[.62,.62,.64],off:[.58,.58,.60],ice:[.9,.95,1],a:.7,sz:.9,vac:true},
    map:{bg:'rgba(30,30,36,0.92)',road:'#e6e6f0',edge:'#050508'}
  },
  phys:{g:-6.5,gripRoad:6.4,gripOff:5.2,gripIce:2,dragRoad:.12,dragOff:.4,dragIce:.05,maxOff:.88},
  rim:75,
  hills(x,z){ return (fbm(x*.004+70,z*.004)-.5)*34+9*Math.exp(-Math.pow(Math.hypot(x,z)/70,2)); },
  trackPts(){ const pts=[]; for(let i=0;i<M;i++){ const th=i/M*Math.PI*2, r=285+40*Math.sin(2*th+.7)+22*Math.sin(3*th+2)+10*Math.sin(5*th+1.3); pts.push([r*Math.cos(th),r*Math.sin(th)]); } return pts; },
  layout(){ return calmLayout([.05,.22,.31,.50,.59,.80,.92],[[.12,4.5],[.40,3.5],[.68,5]],.03,.075); },
  prepare(){
    const raw=new Float32Array(M); for(let i=0;i<M;i++) raw[i]=this.hills(track[i].x,track[i].z);
    this.prof=smoothArr(smoothArr(raw,14),10);                                    // long, gentle swells: nothing launches the car by accident
    this.craters=[]; const rnd=mulberry32(9090);
    for(let i=0;i<40&&this.craters.length<22;i++){ const x=(rnd()-.5)*900, z=(rnd()-.5)*900, R=14+rnd()*rnd()*46;
      if(nearestTrack(x,z).d<R+HALFW+20||Math.hypot(x,z)<70) continue; this.craters.push({x,z,R,D:R*.17,rim:R*.06}); } },
  profile(s){ return arrProfile(this.prof,s)+jumpsSum(s); },
  base(x,z,th,d){ const far=smooth(HALFW+2,100,d); return th*(1-far)+this.hills(x,z)*far+((fbm(x*.03+7,z*.03)-.5)*2.4)*smooth(HALFW,HALFW+30,d); },
  shape(x,z,h){
    for(const c of this.craters){ const dd=Math.hypot(x-c.x,z-c.z); if(dd>c.R*2.2) continue; const u=dd/c.R;
      h+=u<1?-c.D*(1-u*u)+c.rim*u*u:c.rim*Math.exp(-Math.pow((dd-c.R)/(c.R*.35),2)); }
    return h; },
  iceAt(){ return false; },
  color(c){
    const T=THEME;
    if(c.d<HALFW){
      if(c.s<0.0035||c.s>0.9985) return [.95,.95,.95];
      if(c.d>HALFW-2.2) return T.roadEdge;
      return vnoise(c.cx*.25,c.cz*.25)>.5?T.road:T.roadAlt; }
    let ej=0; for(const k of this.craters){ const u=Math.hypot(c.cx-k.x,c.cz-k.z)/k.R; if(u<2.3) ej=Math.max(ej,smooth(2.3,1.1,u)); }
    const n=vnoise(c.cx*.03+3,c.cz*.03), base=n>.5?T.reg:T.regAlt;
    let col=[lerp(base[0],T.bright[0],ej*.7),lerp(base[1],T.bright[1],ej*.7),lerp(base[2],T.bright[2],ej*.7)];
    const dk=smooth(.9,.7,c.ny); return [lerp(col[0],T.dark[0],dk),lerp(col[1],T.dark[1],dk),lerp(col[2],T.dark[2],dk)]; },
  decor(m,rnd){
    // boulders and small rocks, none near the road
    for(let i=0,placed=0;i<4000&&placed<360;i++){ const x=(rnd()-.5)*(HALF*2-60), z=(rnd()-.5)*(HALF*2-60);
      if(!clearOfRoad(x,z,7)||Math.hypot(x,z)<36) continue; const y=hAt(x,z), big=rnd()<.15, s=big?2.6+rnd()*3.4:.8+rnd()*1.6;
      m.rock(x,y,z,s,rnd()<.5?[.46,.46,.5]:[.36,.36,.4],rnd); if(s>1.4) colliders.push([x,z,s*.85]); placed++; }
    // the landing site in the middle: flag, lander, rover, a Surveyor probe and a trail of footprints
    const cy=hAt(0,0), t0=track[0], ang=Math.atan2(t0.x,t0.z);
    moonFlag(m,0,cy,0,Math.sin(ang),Math.cos(ang)); colliders.push([0,0,.9]);
    lunarLander(m,-17,hAt(-17,-9),-9);
    lunarRover(m,19,hAt(19,13),13,.7);
    { const x=24, z=-20, y=hAt(x,z); m.box(x,y+1.4,z,.2,2.8,.2,[.7,.7,.74]); m.box(x,y+2.9,z,1.4,1,1.4,[.8,.8,.84]); for(const a of [0,2.1,4.2]) m.prism(x,z,x+Math.cos(a)*1.8,z+Math.sin(a)*1.8,.08,y+.3,y+1.4,[.7,.7,.74]); colliders.push([x,z,1.5]); }
    for(let i=0;i<16;i++){ const f=i/15, x=-17+f*(0+17)+((i&1)?.5:-.5), z=-9+f*(9)+0, y=hAt(x,z)+.08; m.box(x+2,y,z+2.5,.7,.06,1.6,[.2,.2,.23]); }
    // a distant mountain range outside the playing area (low, grey, airless)
    for(let i=0;i<34;i++){ const a=i/34*Math.PI*2+rnd()*.1, r=640+rnd()*90, x=Math.cos(a)*r, z=Math.sin(a)*r, s=60+rnd()*90;
      m.cone(x,-20,z,s*1.1,s*.9,6,[.40,.40,.44]); m.cone(x,-20,z,s*.6,s*.9+30,6,[.5,.5,.54]); }
    roadPosts(m,12,1.3,2.2,[.92,.92,.95],[.2,.4,1],false);
  },
  mapBg(g,X,Z,sc){ g.fillStyle='rgba(10,10,14,0.5)'; for(const c of this.craters){ g.beginPath(); g.arc(X(c.x),Z(c.z),Math.max(2,c.R*sc),0,7); g.fill(); }
    g.fillStyle='#f2f2ff'; g.beginPath(); g.arc(X(0),Z(0),3,0,7); g.fill(); }
};
