'use strict';
// Level: Volcanic Island.
// ---------------- VOLCANIC ISLAND (day, ocean, volcano, wading through shallows) ----------------

// leaning palm tree: 3 trunk slabs and 6 drooping fronds
function palm(m,x,y,z,s,rnd){
  const lean=rnd()*6.283, lx=Math.cos(lean)*0.55*s, lz=Math.sin(lean)*0.55*s, seg=2*s;
  let px=x, pz=z, py=y;
  for(let i=0;i<3;i++){ m.prism(px,pz,px+lx,pz+lz,0.32*s,py,py+seg,[.46,.33,.2]); px+=lx; pz+=lz; py+=seg; }
  const g1=[.13,.46,.17], g2=[.2,.58,.22];
  for(let k=0;k<6;k++){ const a=k/6*6.283+rnd()*.3, c=Math.cos(a), sn=Math.sin(a);
    m.prism(px,pz,px+c*2.3*s,pz+sn*2.3*s,0.4*s,py,py+0.18*s,k&1?g1:g2);
    m.prism(px+c*2.3*s,pz+sn*2.3*s,px+c*3.9*s,pz+sn*3.9*s,0.34*s,py-0.9*s,py-0.72*s,k&1?g2:g1); }
  m.box(px,py-0.3*s,pz,0.5*s,0.5*s,0.5*s,[.3,.2,.1]);
}

LEVELS.volcanic={
  id:'volcanic', seed:31, name:'VOLCANIC ISLAND', sub:"Don't forget the sunscreen!",
  loc:'Anak Krakatau, Indonesia', flag:'id',
  blurb:'Why cross a river of water when you can cross a river of *lava*? Nothing says off-roading more than racing around a volcanic island and trying to avoid burning to a crisp.',
  sea:0, seaCol:[.05,.38,.76],
  theme:{
    skyTop:[0.20,0.52,0.95], skyHor:[0.80,0.93,1.0], fog:[0.74,0.90,0.98], fogN:130, fogF:720,
    amb:[.46,.46,.48], hemi:[.24,.24,.26], sun:[.66,.62,.54], light:[.5,.8,.3], night:false, snow:false,
    body:{yaw:.6,y:.80,r:.045,col:[1,.96,.75]},
    road:[.74,.64,.44], roadAlt:[.68,.58,.40], roadEdge:[.56,.46,.30], sand:[.95,.88,.62], wet:[.76,.68,.46], foam:[.95,.97,1], bed:[.80,.74,.52],
    grass:[.22,.52,.20], grassAlt:[.30,.60,.25], jungle:[.14,.40,.16], rock:[.24,.20,.22], lava:[.95,.35,.1], scorch:[.13,.10,.11], scorchAlt:[.20,.15,.14],
    dust:{road:[.97,.92,.72],off:[.97,.92,.72],ice:[.9,.95,1],a:.8,sz:1.2},
    map:{bg:'rgba(20,92,150,0.92)',road:'#fff2c0',edge:'#2a2010'}
  },
  phys:{gripRoad:6.0,gripOff:3.8,gripIce:2,dragRoad:.15,dragOff:.5,dragIce:.05,maxOff:.75},
  rim:0,
  hills(x,z){
    const r=Math.hypot(x,z);
    return -8+34*Math.exp(-Math.pow(r/265,2))                       // the island
      +84*Math.exp(-Math.pow(r/92,2))-34*Math.exp(-Math.pow(r/26,2)) // volcano with a crater
      +(fbm(x*.01+5,z*.01)-.5)*14*(1-smooth(150,330,r)*.6); },       // dunes and headlands
  trackPts(){ const pts=[]; for(let i=0;i<M;i++){ const th=i/M*Math.PI*2, r=262+50*Math.sin(3*th+.6)+28*Math.sin(5*th+1.4)+14*Math.sin(2*th); pts.push([r*Math.cos(th),r*Math.sin(th)]); } return pts; },
  layout(){ return {gates:[.07,.21,.35,.49,.63,.77,.92], jumps:[[.14,5],[.42,6],[.70,5],[.86,6]]}; },
  prepare(){ const raw=new Float32Array(M); for(let i=0;i<M;i++) raw[i]=this.hills(track[i].x,track[i].z);
    const p=smoothArr(raw,6); for(let i=0;i<M;i++) p[i]=Math.max(p[i],-1.0); this.prof=p;    // causeways dip at most 1 unit under water
    this.lavaPools=[{x:0,z:0,r:22}];                                                          // the lava lake in the crater
    // A lava river spills over the crater rim, runs down the slope, passes under a bridge where it crosses the road (a straight, clear
    // of jumps and gates) and flows out onto the beach, stopping short of the water. The path is straight through the crossing so it meets the road square.
    const ground=q=>{ const nt=nearestTrack(q.x,q.z); return this.base(q.x,q.z,trackHeight(track[nt.i].s),nt.d); };
    let pts=splinePath([[0,18],[3,48],[14,100],[29,151],[2,226],[-18,282],[-39,339],[-50,392]],6);
    const iEnd=pts.findIndex(q=>q[2]>300&&ground({x:q[0],z:q[1]})<1.6);            // the flow stops on the beach, short of the water
    pts=pts.slice(0,iEnd<0?pts.length:iEnd+1); const U=pts[pts.length-1][2];
    const lava={name:'lava',lava:true,p:pts.map(q=>({x:q[0],z:q[1],u:q[2],w:(9+1.2*Math.sin(q[2]/45))*(0.35+0.65*smooth(0,60,U-q[2])),level:0}))};
    RIVERS.push(lava);
    findBridges(sp=>this.profile(sp));
    // lava level: the ground along the path (a little below it), never rising again, and 3.5 below the deck at the bridge
    const T=lava.p.map(ground), n=T.length; let run=1e9; const L0=[];
    for(let i=0;i<n;i++){ let a=0,c=0; for(let k=-2;k<=2;k++){ a+=T[clamp(i+k,0,n-1)]; c++; } run=Math.min(run,a/c-1); L0.push(run); }
    const B=BRIDGES[0], at=u=>{ let i=0; while(i<n-2&&lava.p[i+1].u<u) i++; const a=lava.p[i], b=lava.p[i+1]; return lerp(L0[i],L0[i+1],(u-a.u)/((b.u-a.u)||1)); };
    const D=Math.max(0,at(B.uc)-(B.deck-3.5));
    lava.p.forEach((q,i)=>{ q.level=Math.max(1.0,L0[i]-D*smooth(B.uc-90,B.uc-5,q.u)); });
    B.level=at(B.uc)-D; },
  // the lava channel: cut into the slope (through the crater rim), banks rising back to the ground; the road keeps its height except under the span
  shape(x,z,h,d,s,k){
    const hRoad=h; let rn=1e9;
    for(const r of RIVERS){
      const q=riverQuery(r,x,z);
      h=Math.min(h,q.level+0.6+0.9*Math.max(0,q.d-q.w*1.25)-1.3*(1-smooth(q.w*0.75,q.w*1.25,q.d)));   // shallow bed: a car sinks in part way, not out of sight
      rn=Math.min(rn,q.d/q.w); }
    RN[k]=rn;
    const span=onBridgeSpan(d,s); SPAN[k]=span?1:0;
    return span?h:lerp(h,hRoad,1-smooth(HALFW,HALFW+14,d)); },
  profile(s){ return arrProfile(this.prof,s)+jumpsSum(s); },
  base(x,z,th,d){ const far=smooth(HALFW+2,120,d); return th*(1-far)+this.hills(x,z)*far; },
  iceAt(){ return false; },
  color(c){
    const T=THEME, h=c.hy;
    if(c.span) return T.scorch;
    if(c.d<HALFW){
      if(c.s<0.0035||c.s>0.9985) return [.95,.95,.95];
      if(c.d>HALFW-2.2) return T.roadEdge;
      return vnoise(c.cx*.2,c.cz*.2)>.5?T.road:T.roadAlt; }
    if(c.rn<2.1+vnoise(c.cx*.07,c.cz*.07)*1.3) return c.rn<1.05?T.scorch:vnoise(c.cx*.13,c.cz*.13)>.5?T.scorch:T.scorchAlt;   // a wide scar of cooled black crust around the lava river
    if(h<-0.3) return T.bed;
    if(h<0.4) return T.foam;
    if(h<1.6) return T.wet;
    if(h<5.5) return vnoise(c.cx*.05,c.cz*.05)>.5?T.sand:[T.sand[0]*.96,T.sand[1]*.96,T.sand[2]*.9];
    const dd=Math.hypot(c.cx,c.cz);
    if(dd<34&&h>40) return T.lava;                                  // lava in the volcano's crater
    if(h>46||c.ny<.62) return T.rock;                               // volcanic rock on the steep upper slopes
    const g=vnoise(c.cx*.03,c.cz*.03), k=smooth(10,26,h);           // grass, then jungle higher up
    const base=g>.5?T.grass:T.grassAlt;
    return [lerp(base[0],T.jungle[0],k),lerp(base[1],T.jungle[1],k),lerp(base[2],T.jungle[2],k)]; },
  decor(m,rnd){
    const nearLava=(x,z,pad)=>RIVERS.some(r=>{ const q=riverQuery(r,x,z); return q.d<q.w*3.4+pad; });
    let placed=0,tries=0;
    while(placed<170&&tries<6000){ tries++;
      const x=(rnd()-.5)*700, z=(rnd()-.5)*700, y=hAt(x,z), r=Math.hypot(x,z);
      if(y<1.7||y>34||r<60) continue;
      if(nearestTrack(x,z).d<HALFW+8||nearLava(x,z,10)) continue;
      const s=.8+rnd()*.6; palm(m,x,y,z,s,rnd); colliders.push([x,z,.55*s]); placed++; }
    // jungle bushes and black volcanic boulders
    for(let i=0;i<220;i++){ const x=(rnd()-.5)*760, z=(rnd()-.5)*760, y=hAt(x,z);
      if(y<1||nearestTrack(x,z).d<HALFW+8||nearLava(x,z,8)) continue;
      if(rnd()<.6){ if(y>8&&y<40){ const s=1+rnd()*1.6; m.cone(x,y,z,2*s,2.2*s,6,[.13,.4,.16]); } }
      else { const s=1.2+rnd()*2.4; m.rock(x,y,z,s,[.16,.14,.16],rnd); colliders.push([x,z,s*.85]); } }
    // rocks standing in the shallows
    for(let i=0;i<40;i++){ const a=rnd()*6.283, rr=300+rnd()*70, x=Math.cos(a)*rr, z=Math.sin(a)*rr, y=hAt(x,z);
      if(y>1||y<-6||nearestTrack(x,z).d<HALFW+8||nearLava(x,z,12)) continue; const s=1.5+rnd()*2.5; m.rock(x,0,z,s,[.2,.18,.2],rnd); colliders.push([x,z,s*.85]); }
    // beach huts and umbrellas just off the road
    for(let i=0;i<M&&placed<400;i+=47){ const t=track[i], sg=(i/47|0)&1?1:-1, x=t.x+t.tz*sg*(HALFW+12), z=t.z-t.tx*sg*(HALFW+12), y=hAt(x,z);
      if(y<1.5||nearLava(x,z,10)) continue;
      if(i%94===0){ m.box(x,y+1.6,z,4.4,3.2,4.4,[.75,.55,.32]); m.cone(x,y+3.2,z,4.2,2.4,4,[.8,.62,.25]); colliders.push([x,z,3]); }
      else { m.box(x,y+1.5,z,.18,3,.18,[.9,.9,.9]); m.cone(x,y+3.1,z,2.2,.9,8,i&2?[.95,.2,.25]:[.2,.5,.95]); } }
    // lava glowing in the crater (unlit, steady)
    m.em=true; const cy=hAt(0,0); groundDisc(m,0,0,22,[1,.38,.08],16,0.15); groundDisc(m,0,0,11,[1,.72,.2],14,0.3); m.em=false;
    roadPosts(m,10,1.2,2.2,[.95,.95,.95],[.9,.25,.1],false);
    // the lava river (unlit, steady): one strip with a bright core, built with shared vertices so nothing overlaps
    m.em=true;
    for(const r of RIVERS) if(r.lava){ const P=r.p;
      const at=(i,f)=>{ const a=P[Math.max(0,i-1)], b=P[Math.min(P.length-1,i+1)], dx=b.x-a.x, dz=b.z-a.z, l=Math.hypot(dx,dz)||1;
        return [P[i].x+(-dz/l)*f*P[i].w*0.95, P[i].level+0.05, P[i].z+(dx/l)*f*P[i].w*0.95]; };
      const FS=[-1,-.5,.5,1], cols=[[.86,.26,.05],[1,.5,.1],[.86,.26,.05]];
      for(let i=0;i<P.length-1;i++){ const k=(i>>1)&1;
        for(let b=0;b<3;b++){ const c=b===1?(k?[1,.74,.2]:[1,.62,.14]):(k?[.95,.34,.07]:cols[b]);
          m.quad(at(i,FS[b]),at(i,FS[b+1]),at(i+1,FS[b+1]),at(i+1,FS[b]),c,'up'); } } }
    m.em=false;
    bridgeDecor(m,{wood:[[.30,.26,.28],[.26,.22,.24]], rail:[.52,.46,.44], post:[.2,.17,.18], stone:[.34,.30,.30]});
    // burning rocks scattered over the black scar: solid, and the flames reach a little past them, so brushing one burns too
    const lava=RIVERS[0], B=BRIDGES[0];
    for(let i=2;i<lava.p.length;i+=2){ const q=lava.p[i], a=lava.p[Math.max(0,i-1)], b=lava.p[Math.min(lava.p.length-1,i+1)], dx=b.x-a.x, dz=b.z-a.z, l=Math.hypot(dx,dz)||1, sg=rnd()<.5?1:-1, o=q.w*(1.3+rnd()*1.3), x=q.x-dz/l*sg*o, z=q.z+dx/l*sg*o;
      if(roadDist(x,z)<HALFW+4||hAt(x,z)<1.6||rnd()<.25) continue; const y=hAt(x,z), s=1.1+rnd()*1.1;
      m.rock(x,y,z,s,[.12,.1,.11],rnd); m.em=true; m.rock(x,y+.1,z,s*.6,[.9,.3,.06],rnd); m.em=false; colliders.push([x,z,s*.85]); addFire(x,y+.3,z,s+.8,4+s*1.6,{smoke:0,rate:.8,far:300}); }
    // lava rocks thrown down on the approaches to the bridge: solid and burning, a few on the road, never on the deck. The opponents steer round those
    // [distance from the middle of the bridge along the road, offset across it]: well clear of the deck, and at least about 40 units from each other so they never bunch up
    this.obstacles=[]; const spm=TL/M;
    for(const [off,lat] of [[-172,-17],[-130,17],[-96,-9],[-52,7],[40,-7],[84,9],[120,-17]]){ const i=(B.j+Math.round(off/spm)+M)%M, t=track[i], x=t.x+t.tz*lat, z=t.z-t.tx*lat, y=hAt(x,z), s=1.5+rnd()*.7;
      m.rock(x,y,z,s*1.2,[.13,.11,.12],rnd); m.em=true; m.rock(x,y+.2,z,s*.75,[.95,.34,.07],rnd); m.em=false; colliders.push([x,z,s*.85]); addFire(x,y+.4,z,s+.7,4,{smoke:0,rate:.8,far:300}); if(Math.abs(lat)<HALFW) this.obstacles.push([i,lat,s+1.4]); }
  },
  ocean(m){
    const col=(x,z)=>{ const r=Math.hypot(x,z); return r<340?[.22,.84,.86]:r<420?[.1,.62,.86]:[.05,.38,.76]; };
    const S=20, E=480;
    for(let ix=-E;ix<E;ix+=S) for(let iz=-E;iz<E;iz+=S){ const c=col(ix+S/2,iz+S/2), k=((ix+iz)/S&1)?0.96:1;
      m.quad([ix,0,iz],[ix+S,0,iz],[ix+S,0,iz+S],[ix,0,iz+S],[c[0]*k,c[1]*k,c[2]*k],'up'); }
    const F=HALF, d=this.seaCol;
    for(const [x0,z0,x1,z1] of [[-F,-F,F,-E],[-F,E,F,F],[-F,-E,-E,E],[E,-E,F,E]]) m.quad([x0,-.05,z0],[x1,-.05,z0],[x1,-.05,z1],[x0,-.05,z1],d,'up');
  },
  mapBg(g,X,Z,sc){ g.fillStyle='#e8d89a'; g.beginPath(); g.arc(X(0),Z(0),330*sc,0,7); g.fill(); g.fillStyle='#3d8f3a'; g.beginPath(); g.arc(X(0),Z(0),270*sc,0,7); g.fill(); g.fillStyle='#8a3a1a'; g.beginPath(); g.arc(X(0),Z(0),34*sc,0,7); g.fill();
    g.fillStyle='#ff7a1a'; g.beginPath(); g.arc(X(0),Z(0),22*sc,0,7); g.fill();
    for(const r of RIVERS){ g.beginPath(); r.p.forEach((q,i)=>i?g.lineTo(X(q.x),Z(q.z)):g.moveTo(X(q.x),Z(q.z)));
      g.strokeStyle='#ff7a1a'; g.lineWidth=Math.max(2,r.p[Math.floor(r.p.length/3)].w*2*sc); g.stroke(); } },
  mapFg(g,X,Z,sc,road){ for(const B of BRIDGES) road(B.i0,B.n,'#6a4a40',TW*sc); }
};
