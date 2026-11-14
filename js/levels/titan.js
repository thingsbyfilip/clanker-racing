'use strict';
// Level: Vid Flumina (on Titan, the big moon of Saturn).
// ---------------- VID FLUMINA (orange haze, hydrocarbon dunes and ice bedrock, rivers and lakes of liquid methane, methane rain, low gravity) ----------------
// the Dragonfly rotorcraft lander: foil-wrapped body, a nuclear battery at the back, four arms with a pair of rotors each, skids
function dragonfly(m,x,z,yaw){
  const y=hAt(x,z), fx=Math.sin(yaw), fz=Math.cos(yaw), lx=fz, lz=-fx, ga=[.82,.82,.88], gold=[.86,.66,.24], dk=[.2,.2,.24];
  orBox(m,x,z,5.6,2.4,y+1.4,y+3.4,yaw,ga); orBox(m,x,z,5.7,2.5,y+1,y+1.6,yaw,gold); orBox(m,x+fx*2.2,z+fz*2.2,1.8,2.1,y+2.4,y+3.1,yaw,[.12,.2,.3]);
  cylY(m,x-fx*3.6,y+1.8,z-fz*3.6,.9,2.2,8,[.5,.5,.55],[.3,.3,.34]);
  for(const [a,b] of [[1,1],[-1,1],[1,-1],[-1,-1]]){ const px=x+(fx*a+lx*b)*5.2, pz=z+(fz*a+lz*b)*5.2;
    m.prism(x+(fx*a+lx*b)*1.6,z+(fz*a+lz*b)*1.6,px,pz,.22,y+3,y+3.3,dk); cylY(m,px,y+3.3,pz,2.7,.22,10,[.16,.16,.2],[.22,.22,.26]); cylY(m,px,y+3.8,pz,2.7,.22,10,[.2,.2,.24],[.26,.26,.3]); m.box(px,y+3.3,pz,.3,.6,.3,dk); }
  for(const sg of [-1,1]) orBox(m,x+lx*sg*1.9,z+lz*sg*1.9,5,.3,y+.15,y+.5,yaw,dk);
  wallBox(x,z,5.7,4.4,yaw,.4); colliders.push([x-fx*3.6,z-fz*3.6,1]); }   // the body and its skids (the rotors are higher than a car), and the battery
// the Huygens probe where it landed in 2005: a scorched dish, a collapsed parachute
function huygens(m,x,z){ const y=hAt(x,z); frustum(m,x,y,z,3.4,.8,1,10,[.6,.5,.42],[.5,.4,.34]); dome(m,x,y+1,z,2.4,[.78,.72,.64],10,3); m.box(x,y+3.4,z,.2,2,.2,[.5,.5,.5]);
  for(let k=0;k<6;k++){ const a=k/6*6.28; m.prism(x,z,x+Math.cos(a)*7,z+Math.sin(a)*7,.15,y+.15,y+.25,[.9,.9,.88]); } m.rock(x+9,y,z+4,3.6,[.92,.9,.84],()=>.5); colliders.push([x,z,3.6]); }
// an ice boulder: rounded, pale orange-grey
function iceBoulder(m,rnd,x,z,s){ m.rock(x,hAt(x,z),z,s,[[.72,.56,.4],[.62,.46,.32],[.8,.66,.5]][(rnd()*3)|0],rnd); if(s>1.3) colliders.push([x,z,s*.85]); }

LEVELS.titan={
  id:'titan', seed:293, name:'VID FLUMINA', sub:"It's raining methane!", go:'LIFTOFF!',
  loc:'Titan, Moon of Saturn', flag:'saturn',
  blurb:"Why did NASA name a hydrocarbon river on Saturn's largest moon after a mythical stream of venom flowing into the Gaping Abyss? You're not sure, but you'll find out!",
  tw:26,
  theme:{
    skyTop:[0.34,0.20,0.09], skyHor:[0.82,0.52,0.22], fog:[0.66,0.42,0.19], fogN:50, fogF:430,
    amb:[.46,.34,.22], hemi:[.2,.15,.1], sun:[.4,.3,.2], light:[.3,.8,.2], night:false, snow:false, rain:true, rainCol:[.86,.58,.28],
    body2:{yaw:-.6,y:.84,r:.15,mode:3},                                                              // Saturn, ringed, hanging in the haze above the start straight
    road:[.30,.24,.20], roadAlt:[.26,.21,.18], roadEdge:[.52,.4,.28], ice:[.62,.46,.3], iceAlt:[.54,.4,.27], sand:[.31,.21,.14], sandAlt:[.36,.25,.16], shore:[.66,.50,.30], bed:[.50,.38,.25], rock:[.46,.34,.24], pale:[.74,.58,.38],
    water:[[.055,.075,.07],[.04,.055,.052]], spray:[.08,.1,.095],
    dust:{road:[.44,.32,.2],off:[.3,.2,.12],ice:[.9,.95,1],a:.7,sz:1},
    map:{bg:'rgba(92,56,24,0.95)',road:'#ffd890',edge:'#1a0e06'}
  },
  phys:{g:-5.5,gripRoad:5.2,gripOff:3.6,gripIce:2,dragRoad:.14,dragOff:.5,dragIce:.05,maxOff:.72},
  rim:70,
  hills(x,z){ const dune=Math.pow(.5+.5*Math.sin((x*.34+z*.94)/21+fbm(x*.008,z*.008)*7),1.6)*(1-smooth(.35,.6,fbm(x*.004+30,z*.004)))*16;
    return (fbm(x*.0045+60,z*.0045)-.5)*80+10*ridged(x*.012+8,z*.012)+dune; },
  trackPts(){ const pts=[]; for(let i=0;i<M;i++){ const th=i/M*Math.PI*2, r=258+64*Math.sin(2*th+.4)+34*Math.sin(3*th+1.7)+22*Math.sin(5*th)+14*Math.sin(7*th+1)+10*Math.sin(11*th); pts.push([r*Math.cos(th),r*Math.sin(th)]); } return startNear(pts,230,-30); },
  layout(){
    // two methane rivers run out of the middle of the map and across the road on straight stretches (a lake at the head of each, the two lakes joined by a channel: linkLakes)
    this.riv=[]; for(const s0 of [.27,.72]){ const s=calmS(s0,.04,70), t=track[idxOfS(s)], nx=t.tz, nz=-t.tx, pts=[];
      for(let u=-175;u<=540;u+=8){ const w=smooth(0,110,Math.abs(u)), off=(Math.sin(u/70+s*20)*30+Math.sin(u/31+s*9)*9)*w, x=t.x+nx*u+t.tx*off, z=t.z+nz*u+t.tz*off; if(Math.abs(x)>520||Math.abs(z)>520) break; pts.push([x,z]); }
      this.riv.push(pts); }
    const zones=[]; for(const p of this.riv) zones.push(...crossingZones(p,.05));
    return calmLayout([.05,.18,.32,.46,.6,.76,.9],[[.12,7,260],[.52,7,260],[.84,7,260]],.03,.15,zones); },
  prepare(){
    const raw=new Float32Array(M); for(let i=0;i<M;i++) raw[i]=this.hills(track[i].x,track[i].z)*.8+1; this.prof=smoothArr(limitGrade(smoothArr(raw,8),.17),3);
    this.riv.forEach((pts,k)=>RIVERS.push(makeRiver('methane'+k,pts,u=>11+3*Math.sin(u/60+k*2)+u*.006)));
    // the road drives straight through the methane (fords, no bridges). The road dips under the surface in the middle and comes up out of it before the river's edges, like a beach
    // on each side, so the liquid always ends by sinking into the road (ford()). For that the surface must be level all the way across the road.
    this.fords=[]; findBridges(sp=>this.profile(sp)); levelRivers(1.2,0);
    for(const B of BRIDGES){ for(const q of B.river.p) q.level=lerp(B.level,q.level,smooth(HALFW+6,HALFW+70,Math.abs(q.u-B.uc)));
      this.fords.push({s:B.s,h:B.level-.5,rise:1,w:B.w,half:B.w*1.15+8,i0:B.i0,n:B.n}); } BRIDGES.length=0;
    // the lakes: one at the head of each river, plus a few more in depressions well away from the road
    const lakes=[]; for(const r of RIVERS){ const q=r.p[0]; lakes.push({x:q.x,z:q.z,r:42,river:r}); }
    const rnd=mulberry32(4711), cand=[]; for(let n=0;n<500;n++){ const x=(rnd()-.5)*880, z=(rnd()-.5)*880; cand.push({x,z,r:38+rnd()*55,h:this.hills(x,z)}); } cand.sort((a,b)=>a.h-b.h); lakes.push(...cand.slice(0,40));
    for(const L of lakes){ if(nearestTrack(L.x,L.z).d<L.r+HALFW+26||lakes.some(o=>o!==L&&o.ok&&Math.hypot(o.x-L.x,o.z-L.z)<o.r+L.r+30)||RIVERS.some(r=>!r.lake&&r!==L.river&&riverQuery(r,L.x,L.z).d<L.r+riverQuery(r,L.x,L.z).w+20)) continue;
      L.ok=true; const lvl=L.river?L.river.p[0].level+.4:this.hills(L.x,L.z)-2.5; if(L.river){ L.river.p[0].level=lvl; L.river.p[1].level=lvl; }
      RIVERS.push(makeLake('lake',L.x,L.z,L.r,lvl)); }
    for(const L of lakes.slice(0,2)) if(L.ok) this.riseToLake(L.river,L.r,RIVERS.find(q=>q.lake&&q.p[0].x===L.x).p[0].level);
    this.linkLakes(lakes[0],lakes[1]);
    this.puddles=makePuddles(612,16,10); },
  // a river leaves its lake at the lake's own level (just under the disc), then eases back down to the levels that levelRivers gave it
  riseToLake(r,R,lvl){ const at=r.p.reduce((b,q)=>Math.abs(q.u-R)<Math.abs(b.u-R)?q:b), rise=lvl-.15-at.level; for(const q of r.p) q.level=q.u<R?lvl-.15:q.level+rise*(1-smooth(R,R+60,q.u)); },
  // a channel between the two head lakes, so the rivers are one system: the upper lake spills into the lower one. It goes in RIVERS before the lakes, so that riverShape lets
  // the lakes have the last word on their own shores. Its ends dip under the lake discs, so no water surface lies on top of or level with a lake.
  linkLakes(A,B){ if(!A.ok||!B.ok) return; const lvA=RIVERS.find(r=>r.lake&&r.p[0].x===A.x).p[0].level, lvB=RIVERS.find(r=>r.lake&&r.p[0].x===B.x).p[0].level;
    if(lvA<lvB) [A,B]=[B,A]; const hi=Math.max(lvA,lvB), lo=Math.min(lvA,lvB), L=Math.hypot(B.x-A.x,B.z-A.z), tx=(B.x-A.x)/L, tz=(B.z-A.z)/L, pts=[];
    for(let u=0;u<=L;u+=8){ const w=smooth(0,A.r+30,u)*smooth(0,B.r+30,L-u), off=(Math.sin(u/44+1)*17+Math.sin(u/19)*5)*w; pts.push([A.x+tx*u-tz*off,A.z+tz*u+tx*off]); }
    const r=makeRiver('methaneLink',pts,u=>11+3*Math.sin(u/60+4)), T=r.p[r.p.length-1].u, dip=.15;
    for(const q of r.p) q.level=lerp(hi-dip,lo+dip,clamp((q.u-A.r)/(T-A.r-B.r),0,1))-dip*2*smooth(T-B.r,T-B.r+12,q.u);
    RIVERS.splice(RIVERS.findIndex(q=>q.lake),0,r); },
  puddleAt(x,z){ return puddleHit(this.puddles,x,z); },
  ford(s){ let w=0,h=0; for(const f of this.fords||[]){ const d=Math.abs(wrapS(s-f.s))*TL, k=1-smooth(f.half,f.half+45,d); if(k>w){ w=k; h=f.h+f.rise*smooth(f.w*.3,f.w*.92,d); } } return [w,h]; },
  profile(s){ const base=arrProfile(this.prof,s), [w,h]=this.ford(s); return lerp(base,h,w)+jumpsSum(s); },
  base(x,z,th,d){ const far=smooth(HALFW+2,64,d); return th*(1-far)+this.hills(x,z)*far; },
  // Every river is given its own banks again after riverShape. Down: the lakes' wide shores would bury its first stretch. Up: a big lake's flood plain sinks the ground below a
  // neighbouring river, which would leave the liquid hanging in the air. Raising stops at the lake shores (no ridges inside a lake) and at the road's edge (the fords).
  // The map's rim is added to the terrain after this, so water out there is cut free of it in advance: gorges and basins, closed just short of the end of the grid.
  shape(x,z,h,d,s,k){ h=riverShape(x,z,h,d,s,k,h,90); const far=smooth(HALFW,HALFW+14,d), up=smooth(HALFW+.5,HALFW+5,d), e=Math.max(Math.abs(x),Math.abs(z));
    const bankOf=q=>q.level+.5+.05*Math.max(0,q.d-q.w)-2.4*(1-smooth(q.w*.2,q.w,q.d));
    let lk=1e9, cut=0; for(const r of RIVERS){ const q=riverQuery(r,x,z); cut=Math.max(cut,1-smooth(q.w*1.6,q.w*1.6+60,q.d));
      if(r.lake){ lk=Math.min(lk,q.d/q.w); h=lerp(h,bankOf(q),far*(1-smooth(q.w*1.1,q.w*1.45,q.d))); } }                 // (each lake keeps its own basin, whatever a later neighbour's flood plain did to it)
    for(const r of RIVERS){ if(r.lake) continue; const q=riverQuery(r,x,z); if(q.d>=q.w*3.2) continue;
      const bank=bankOf(q), a=1-smooth(q.w*1.4,q.w*3.2,q.d);
      h=h>bank?lerp(h,bank,far*a):lerp(h,bank,up*a*smooth(1,1.3,lk)); }
    return h-smooth(HALF-130,HALF-6,e)*this.rim*cut*(1-smooth(HALF-40,HALF-8,e)); },
  iceAt(){ return false; },
  color(c){
    const T=THEME;
    if(c.span) return T.bed;
    if(c.d<HALFW){
      if(c.s<0.0035||c.s>0.9985) return [.92,.9,.86];
      if(c.d>HALFW-2.2) return T.roadEdge;
      return vnoise(c.cx*.22,c.cz*.22)>.5?T.road:T.roadAlt; }
    // as on Fistful of Gravel: the ground under the liquid is ordinary damp ground, never dark, so faces that stand clear of the surface do not show. The liquid draws the shoreline.
    if(c.rn<0.8) return T.bed;
    const n=vnoise(c.cx*.04+7,c.cz*.04);
    let col=c.ny<.82||c.hy>40?(vnoise(c.cx*.12,c.cz*.12)>.5?T.rock:T.ice):n>.6?(vnoise(c.cx*.15,c.cz*.15)>.5?T.ice:T.iceAlt):(vnoise(c.cx*.09,c.cz*.09)>.5?T.sand:T.sandAlt);
    const sk=smooth(2.1,1.2,c.rn);                                                                               // pale evaporite crust round the liquid, fading into the ground
    return sk>0?[lerp(col[0],T.shore[0],sk),lerp(col[1],T.shore[1],sk),lerp(col[2],T.shore[2],sk)]:col; },
  decor(m,rnd){
    const free=(x,z,r)=>roadDist(x,z)>HALFW+r+3&&waterDist(x,z)>r+4, gateNear=(x,z,r)=>GATES.some(g=>Math.hypot(g.x-x,g.z-z)<r);
    // Dragonfly on a flat spot just off the start straight, the Huygens probe a long way round
    { const t=track[idxOfS(.97)], [x,z]=roadside(idxOfS(.97),1,22); dragonfly(m,x,z,Math.atan2(t.tx,t.tz)+.5); }
    { let best=null,bd=1e9; for(let k=0;k<60;k++){ const i=(M*.4+k*6)%M|0, [x,z]=roadside(i,-1,30); if(free(x,z,6)&&!gateNear(x,z,30)){ best=[x,z]; break; } } if(!best){ const [x,z]=roadside((M*.45)|0,1,40); best=[x,z]; } huygens(m,best[0],best[1]); }
    // ice boulders, scattered and in groups
    for(let i=0,p=0;i<7000&&p<380;i++){ const x=(rnd()-.5)*(HALF*2-60), z=(rnd()-.5)*(HALF*2-60); if(!free(x,z,3)) continue; iceBoulder(m,rnd,x,z,.8+rnd()*rnd()*5); p++; }
    // tall ice spires and rounded hills of bedrock in the distance, a cryovolcano with its crater
    for(let i=0;i<26;i++){ const a=i/26*Math.PI*2+rnd()*.15, s=80+rnd()*120, r=beyondPlayfield(a,s*.8)+rnd()*40, x=Math.cos(a)*r, z=Math.sin(a)*r; m.cone(x,-30,z,s*.8,s*1.1,6,[.5,.36,.24]); m.cone(x,s*.55,z,s*.36,s*.8,6,[.66,.5,.34]); }
    { const ca=Math.atan2(-560,-420), cr=beyondPlayfield(ca,250), x=Math.cos(ca)*cr, z=Math.sin(ca)*cr, y=-30; frustum(m,x,y,z,250,60,200,12,[.52,.38,.26],[.3,.22,.16]); frustum(m,x,y+200,z,60,40,12,12,[.44,.32,.22],[.1,.08,.06]); }
    // wind-blown frost ridges along the verge: low pale mounds
    for(let i=0;i<M;i+=14){ const sg=rnd()<.5?-1:1, [x,z]=roadside(i,sg,6+rnd()*12); if(!free(x,z,2)||gateNear(x,z,22)||bendAt(i)>.012) continue; m.rock(x,hAt(x,z),z,1.2+rnd()*1.5,THEME.pale,rnd); }
    roadPosts(m,16,1.4,2.4,[.86,.82,.76],[.95,.5,.12],true);
  },
  marks(m){ for(let i=0;i<M;i++){ markStrip(m,i,i+1,HALFW-1.6,.14,[.74,.64,.46]); markStrip(m,i,i+1,-(HALFW-1.6),.14,[.74,.64,.46]); }
    drawPuddles(m,this.puddles,[.06,.07,.06]); },
  mapBg(g,X,Z,sc){ g.fillStyle='#0c0b09'; for(const r of RIVERS){ if(r.lake){ const q=r.p[0]; g.beginPath(); g.arc(X(q.x),Z(q.z),q.w*sc,0,7); g.fill(); } else { g.beginPath(); r.p.forEach((q,i)=>i?g.lineTo(X(q.x),Z(q.z)):g.moveTo(X(q.x),Z(q.z))); g.strokeStyle='#0c0b09'; g.lineWidth=Math.max(2,r.p[Math.floor(r.p.length/2)].w*2*sc); g.stroke(); } } },
  mapFg(g,X,Z,sc,road){ for(const f of this.fords) road((f.i0+M)%M,f.n,'#2a1e12',TW*sc*.7); }
};
