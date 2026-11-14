'use strict';
// Level: Snowy Mountain.
// ---------------- SNOWY MOUNTAIN (climb round a peak, frozen lakes, ice) ----------------
const ICE_ROAD=[[.145,.175],[.545,.57],[.82,.85]];
LEVELS.snow={
  id:'snow', seed:23, name:'SNOWY MOUNTAIN', sub:"It's a long way down!",
  loc:'Matterhorn, Switzerland', flag:'ch',
  blurb:"The terrain never seems so bad for the *other* drivers. Drive on a road which climbs and falls around a snowy peak. Don't lose control over your vehicle in the middle of a frozen lake!",
  theme:{
    skyTop:[0.50,0.68,0.93], skyHor:[0.87,0.92,0.98], fog:[0.86,0.91,0.97], fogN:90, fogF:560,
    amb:[.52,.56,.70], hemi:[.18,.20,.26], sun:[.55,.52,.46], light:[.45,.7,.5], night:false, snow:true, body:{yaw:1.9,y:.74,r:.04,col:[1,1,.9]},
    road:[.64,.68,.77], roadAlt:[.58,.62,.72], roadEdge:[.5,.54,.64], drift:[.94,.96,1.0], driftAlt:[.84,.89,.98], rock:[.40,.40,.46], ice:[.60,.84,.96], iceAlt:[.50,.76,.92],
    dust:{road:[.96,.98,1],off:[.96,.98,1],ice:[.85,.95,1],a:.75,sz:1.3},
    map:{bg:'rgba(30,42,62,0.86)',road:'#f2f6ff',edge:'#18202e'}
  },
  phys:{gripRoad:5.5,gripOff:3.6,gripIce:1.5,dragRoad:.15,dragOff:.6,dragIce:.05,maxOff:.7},
  rim:75,
  hills(x,z){ const peak=150*Math.exp(-(x*x+z*z)/(240*240)), n=fbm(x*0.0032+7,z*0.0032+3), r=1-Math.abs(2*n-1); return peak+95*r*r-40; },
  trackPts(){
    const pts=[]; for(let i=0;i<M;i++){ const th=i/M*Math.PI*2, r=290+55*Math.sin(3*th+1.2)+38*Math.sin(5*th+.4)+16*Math.sin(2*th); pts.push([r*Math.cos(th),r*Math.sin(th)]); }
    return pts; },
  layout(){ return {gates:[.06,.19,.35,.50,.65,.81,.96], jumps:[[.12,6],[.41,8],[.58,7],[.90,6.5]]}; },
  prepare(){
    const raw=new Float32Array(M); for(let i=0;i<M;i++) raw[i]=this.hills(track[i].x,track[i].z);
    const p=smoothArr(smoothArr(raw,14),10); for(let i=0;i<M;i++) p[i]*=0.9; this.prof=p;
    for(const s0 of [.27,.73]){ const t=track[trackIndexAt(s0)]; LAKES.push({s:t.s,x:t.x,z:t.z,r:58,level:this.profile(t.s)}); }
    // frozen lakes away from the road (no .s: they don't touch the road height). Spots picked on the flattest ground off-track (the last three are up on the summit plateau); the level is the ground there.
    for(const [x,z,r] of [[-308,-364,46],[98,364,42],[308,-280,52],[50,-20,34],[-60,50,28],[-60,-90,28]]){ const nt=nearestTrack(x,z); LAKES.push({x,z,r,level:this.base(x,z,trackHeight(track[nt.i].s),nt.d)}); }
  },
  profile(s){ return arrProfile(this.prof,s)+jumpsSum(s); },
  base(x,z,th,d){ const far=smooth(HALFW+2,150,d); return th*(1-far)+this.hills(x,z)*far+((fbm(x*0.03+50,z*0.03)-0.5)*5)*smooth(HALFW,HALFW+40,d); },
  shape(x,z,h){
    for(const L of LAKES){ const dd=Math.hypot(x-L.x,z-L.z); h=lerp(h,L.level,1-smooth(L.r*0.85,L.r*1.55,dd)); h-=0.6*(1-smooth(0,L.r*0.8,dd)); }
    return h; },
  iceAt(x,z,nt){
    for(const L of LAKES) if(Math.hypot(x-L.x,z-L.z)<L.r*0.88) return true;
    if(nt.d<HALFW){ const s=track[nt.i].s; for(const [a,b] of ICE_ROAD) if(s>=a&&s<=b) return true; }
    return false; },
  color(c){
    const T=THEME;
    for(const L of LAKES) if(Math.hypot(c.cx-L.x,c.cz-L.z)<L.r*0.9) return vnoise(c.cx*.15,c.cz*.15)>.55?T.ice:T.iceAlt;
    if(c.d<HALFW){
      if(c.s<0.0035||c.s>0.9985) return [.85,.12,.1];
      for(const [a,b] of ICE_ROAD) if(c.s>=a&&c.s<=b) return T.ice;
      if(c.d>HALFW-2.2) return T.roadEdge;
      return vnoise(c.cx*.2,c.cz*.2)>.5?T.road:T.roadAlt; }
    const rk=smooth(.84,.62,c.ny), base=vnoise(c.cx*.03+4,c.cz*.03)>.5?T.drift:T.driftAlt;
    return [lerp(base[0],T.rock[0],rk),lerp(base[1],T.rock[1],rk),lerp(base[2],T.rock[2],rk)]; },
  decor(m,rnd){
    let placed=0, tries=0;
    while(placed<560 && tries<7000){
      tries++;
      const x=(rnd()-.5)*(HALF*2-60), z=(rnd()-.5)*(HALF*2-60);
      if(nearestTrack(x,z).d<HALFW+10) continue;
      if(LAKES.some(L=>Math.hypot(x-L.x,z-L.z)<L.r*1.15)) continue;
      const y=hAt(x,z), r=rnd();
      if(r<.6){                                                        // snow-laden pine
        const s=.9+rnd()*1.2, g=[[.10,.28,.17],[.12,.32,.19],[.14,.35,.21]];
        m.box(x,y+s*1.2,z,.7*s,2.4*s,.7*s,[.30,.2,.12]);
        [[1.6,4.4,2.8],[3.7,3.8,2.2],[5.8,3.2,1.5]].forEach(([h,ht,rad],i)=>{
          m.cone(x,y+s*h,z,rad*s,ht*s,7,g[i]); m.cone(x,y+s*(h+ht*.34),z,rad*s*.72,ht*s*.66,7,[.96,.98,1]); });
        colliders.push([x,z,.9*s]);
      } else if(r<.85){
        const s=1.3+rnd()*2.6;
        m.rock(x,y,z,s,THEME.rock,rnd); m.rock(x,y+s*.5,z,s*.75,[.95,.97,1],rnd); colliders.push([x,z,s*.85]);
      } else if(r<.93){                                                // snowman
        const w=[.96,.98,1];
        m.rock(x,y+.7,z,1.5,w,rnd); m.rock(x,y+2.3,z,1.1,w,rnd); m.rock(x,y+3.6,z,.8,w,rnd);
        m.box(x,y+4.5,z,1.0,.18,1.0,[.1,.1,.12]); m.box(x,y+4.9,z,.65,.6,.65,[.1,.1,.12]); m.box(x+.15,y+3.7,z+.8,.2,.2,.6,[.95,.5,.1]);
        colliders.push([x,z,1.3]);
      } else { m.cone(x,y,z,2.4+rnd()*1.6,1.3,6,[.95,.97,1]); }      // snow drift
      placed++;
    }
    // roadside marker poles (orange, black tip) on both sides of the road
    for(let i=0;i<M;i+=8){ const t=track[i];
      for(const sg of [-1,1]){ const x=t.x+t.tz*sg*(HALFW+1.3), z=t.z-t.tx*sg*(HALFW+1.3), y=hAt(x,z);
        m.box(x,y+1.7,z,.26,3.4,.26,[.95,.5,.1]); m.box(x,y+3.6,z,.28,.8,.28,[.1,.1,.12]); } }
  },
  mapBg(g,X,Z,sc){ for(const L of LAKES){ g.fillStyle='#8fd0f0'; g.beginPath(); g.arc(X(L.x),Z(L.z),L.r*sc*0.9,0,7); g.fill(); } }
};
