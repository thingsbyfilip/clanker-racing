'use strict';
// Level: Red Planet.
// ---------------- RED PLANET (Mars: low gravity, craters, an outpost) ----------------
LEVELS.mars={
  id:'mars', seed:59, name:'RED PLANET', sub:'Stuck the landing!', go:'LIFTOFF!',
  loc:'Jezero Crater, Mars', flag:'mars',
  blurb:"For those who can't get enough of low gravity. Floaty jumps across craters and research outposts full of scientists jealous of your high-octane space racer lifestyle.",
  theme:{
    skyTop:[0.20,0.08,0.10], skyHor:[0.92,0.60,0.44], fog:[0.82,0.52,0.38], fogN:100, fogF:620,
    amb:[.46,.38,.36], hemi:[.20,.14,.12], sun:[.62,.52,.44], light:[.4,.65,.5], night:false, snow:false,
    body:{yaw:2.2,y:.72,r:.03,col:[1,.95,.85]},
    road:[.44,.30,.26], roadAlt:[.38,.26,.22], roadEdge:[.30,.20,.17], reg:[.64,.31,.20], regAlt:[.56,.27,.17], dune:[.74,.42,.27], dark:[.30,.17,.14],
    dust:{road:[.86,.54,.40],off:[.80,.48,.34],ice:[.9,.95,1],a:.8,sz:1.35},
    map:{bg:'rgba(62,26,18,0.9)',road:'#f4cfa8',edge:'#2a0e08'}
  },
  phys:{g:-15,gripRoad:6.8,gripOff:5.2,gripIce:2,dragRoad:.12,dragOff:.35,dragIce:.05,maxOff:.85},
  rim:55,
  hills(x,z){ return (fbm(x*.0042+30,z*.0042+9)-.5)*70+10*ridged(x*.011,z*.011)-4; },
  trackPts(){ const pts=[]; for(let i=0;i<M;i++){ const th=i/M*Math.PI*2, r=300+60*Math.sin(2*th+.9)+40*Math.sin(3*th+2.2)+22*Math.sin(5*th+.3); pts.push([r*Math.cos(th),r*Math.sin(th)]); } return pts; },
  layout(){ return {gates:[.05,.25,.31,.43,.60,.70,.94], jumps:[[.10,6],[.37,8],[.64,6],[.88,8]]}; },
  prepare(){
    const raw=new Float32Array(M); for(let i=0;i<M;i++) raw[i]=this.hills(track[i].x,track[i].z);
    this.prof=smoothArr(smoothArr(raw,10),6);
    // craters: three the road runs straight through, plus scenery craters off the road
    this.craters=[]; const rnd=mulberry32(777);
    for(const s0 of [.18,.52,.80]){ const t=track[trackIndexAt(s0)]; this.craters.push({x:t.x,z:t.z,R:55,D:7,rim:2.5}); }
    for(let i=0;i<18;i++){ const x=(rnd()-.5)*880, z=(rnd()-.5)*880, R=16+rnd()*40;
      if(nearestTrack(x,z).d<R+HALFW+14) continue; this.craters.push({x,z,R,D:R*.16,rim:R*.07}); }
  },
  profile(s){ return arrProfile(this.prof,s)+jumpsSum(s); },
  base(x,z,th,d){ const far=smooth(HALFW+2,110,d); return th*(1-far)+this.hills(x,z)*far+((fbm(x*.035+7,z*.035)-.5)*4)*smooth(HALFW,HALFW+30,d); },
  shape(x,z,h){
    for(const c of this.craters){ const dd=Math.hypot(x-c.x,z-c.z); if(dd>c.R*2.3) continue; const u=dd/c.R;
      h+=u<1?-c.D*(1-u*u)+c.rim*u*u:c.rim*Math.exp(-Math.pow((dd-c.R)/(c.R*.35),2)); }
    return h; },
  iceAt(){ return false; },
  color(c){
    const T=THEME;
    if(c.d<HALFW){
      if(c.s<0.0035||c.s>0.9985) return [.95,.95,.95];
      if(c.d>HALFW-2.2) return T.roadEdge;
      return vnoise(c.cx*.2,c.cz*.2)>.5?T.road:T.roadAlt; }
    const k=smooth(.35,.65,vnoise(c.cx*.015+4,c.cz*.015)), dn=vnoise(c.cx*.04,c.cz*.04)>.55?T.dune:T.reg;
    const base=[lerp(T.regAlt[0],dn[0],k),lerp(T.regAlt[1],dn[1],k),lerp(T.regAlt[2],dn[2],k)], rk=smooth(.88,.66,c.ny);
    return [lerp(base[0],T.dark[0],rk),lerp(base[1],T.dark[1],rk),lerp(base[2],T.dark[2],rk)]; },
  decor(m,rnd){
    for(let i=0,placed=0;i<5000&&placed<330;i++){ const x=(rnd()-.5)*(HALF*2-60), z=(rnd()-.5)*(HALF*2-60);
      if(nearestTrack(x,z).d<HALFW+9) continue; const y=hAt(x,z), r=rnd();
      if(r<.7){ const s=1+rnd()*2.8; m.rock(x,y,z,s,rnd()<.5?[.34,.19,.15]:[.42,.23,.17],rnd); colliders.push([x,z,s*.85]); }
      else { const s=1+rnd(); m.cone(x,y,z,2.2*s,(8+rnd()*12)*s/2,5,[.38,.21,.16]); colliders.push([x,z,1.4*s]); }          // rock spires
      placed++; }
    // research outpost beside the start: domes, solar arrays and a radio mast
    const t=track[0], px=t.tz, pz=-t.tx;
    for(const [off,along,r] of [[75,-30,13],[75,10,9],[100,-5,7]]){
      const x=t.x+px*off+t.tx*along, z=t.z+pz*off+t.tz*along, y=hAt(x,z)-1;
      dome(m,x,y,z,r,[.88,.88,.9],12,4); m.box(x,y+1,z,r*.5,2,r*.5,[.4,.4,.45]); colliders.push([x,z,r*.85]); }
    for(let i=0;i<4;i++){ const x=t.x+px*(60+i*9)+t.tx*45, z=t.z+pz*(60+i*9)+t.tz*45, y=hAt(x,z);
      m.box(x,y+2.6,z,7,.25,5,[.14,.2,.45]); m.box(x,y+1.3,z,.4,2.6,.4,[.5,.5,.55]); colliders.push([x,z,1]); }
    { const x=t.x+px*120+t.tx*30, z=t.z+pz*120+t.tz*30, y=hAt(x,z); m.box(x,y+13,z,.7,26,.7,[.7,.7,.74]); m.box(x,y+25,z,4,.3,.3,[.7,.7,.74]);
      m.em=true; m.box(x,y+26.6,z,.7,.7,.7,[1,.2,.15]); m.em=false; colliders.push([x,z,1]); }
    roadPosts(m,10,1.2,2.2,[.92,.92,.95],[.9,.2,.15],false);
  },
  mapBg(g,X,Z,sc){ g.fillStyle='rgba(30,10,6,0.5)'; for(const c of this.craters){ g.beginPath(); g.arc(X(c.x),Z(c.z),Math.max(2,c.R*sc),0,7); g.fill(); } }
};
