'use strict';
// Level: Fistful of Gravel.
// ---------------- FISTFUL OF GRAVEL (day, rivers and wooden bridges) ----------------
LEVELS.dirt={
  id:'dirt', seed:0, name:'FISTFUL OF GRAVEL', sub:"Off the beaten track!",
  loc:'Copper Canyon, Mexico', flag:'mx',
  blurb:"Five big jumps, three wooden bridges, and one rolling canyon road. If you don't know when to speed up and when to slow down, this route will help you figure it out.",
  theme:{
    skyTop:[0.25,0.45,0.85], skyHor:[0.95,0.78,0.58], fog:[0.95,0.78,0.58], fogN:120, fogF:640,
    amb:[.38,.38,.38], hemi:[.22,.22,.22], sun:[.62,.62,.62], light:[.5,.8,.35], night:false, snow:false, body:{yaw:2.6,y:.78,r:.04,col:[1,.93,.7]},
    track:[0.64,0.43,0.25], trackAlt:[0.55,0.36,0.20], scrub:[0.42,0.50,0.22], dry:[0.66,0.58,0.32], rock:[0.52,0.45,0.40], sand:[0.76,0.67,0.44], bed:[0.40,0.36,0.30],
    dust:{road:[.88,.75,.57],off:[.66,.72,.46],ice:[.9,.95,1],a:1,sz:1},
    map:{bg:'rgba(28,44,20,0.82)',road:'#e3bd7f',edge:'#140d06'}
  },
  phys:{gripRoad:7.5,gripOff:5,gripIce:2,dragRoad:.12,dragOff:.4,dragIce:.05,maxOff:.82},
  rim:70,
  trackPts(){
    const pts=[];
    for(let i=0;i<M;i++){ const th=i/M*Math.PI*2, r=310+80*Math.sin(2*th+.5)+55*Math.sin(3*th+2)+18*Math.sin(4*th+1); pts.push([r*Math.cos(th),r*Math.sin(th)]); }
    return pts; },
  layout(){ return {gates:[.14,.30,.46,.54,.66,.78,.93], jumps:[[.08,4],[.22,7],[.40,9],[.61,7],[.86,7.5]]}; },
  profile(s){ const a=s*Math.PI*2; return 5*Math.sin(a*3+.7)+3*Math.sin(a*7+2)+1.5*Math.sin(a*11)+jumpsSum(s); },
  // A main river runs north->south through the middle of the map and a tributary joins it from the west.
  // Paths were chosen so every crossing with the track is near-perpendicular, on a straight, clear of jumps.
  prepare(){
    const mainX=z=>-67.10+28.41*Math.sin(z/151.66+5.7801)+15.45*Math.sin(z/61.30+2.8522);
    const tribZ=x=>209.62+31.44*Math.sin(x/111.86+5.5089)+11.84*Math.sin(x/61.14+5.7094);
    const resample=(pts,sp)=>{
      const cl=[0]; for(let i=1;i<pts.length;i++) cl.push(cl[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));
      const total=cl[cl.length-1], n=Math.max(2,Math.round(total/sp)), out=[]; let j=0;
      for(let k=0;k<=n;k++){ const d=total*k/n; while(j<cl.length-2&&cl[j+1]<d) j++;
        const t=(d-cl[j])/((cl[j+1]-cl[j])||1); out.push([lerp(pts[j][0],pts[j+1][0],t),lerp(pts[j][1],pts[j+1][1],t),d]); }
      return out; };
    const makeRiver=(name,dense,wFn)=>({name,p:resample(dense,6).map(q=>({x:q[0],z:q[1],u:q[2],w:wFn(q[2]),level:0}))});
    const mainD=[],tribD=[];
    for(let z=-480;z<=480;z+=4) mainD.push([mainX(z),z]);
    for(let x=-480;x<=-61;x+=4) tribD.push([x,tribZ(x)]);
    const main=makeRiver('main',mainD,u=>12.5+2.5*Math.sin(u/70+1));
    const trib=makeRiver('tributary',tribD,u=>8+1.5*Math.sin(u/55+2));
    const e=trib.p[trib.p.length-1]; let best=null,bd=1e18;                // snap the tributary onto the main river so they join
    for(const q of main.p){ const d=Math.hypot(q.x-e.x,q.z-e.z); if(d<bd){bd=d;best=q;} }
    e.x=best.x; e.z=best.z; trib.join=best;
    RIVERS.push(main,trib);
    findBridges(sp=>this.profile(sp));                 // bridges wherever a river crosses the track
    // water levels: each river sits 3.5 below the deck at its bridges, and always flows downhill
    const lvl=(cons,u)=>{
      if(u<=cons[0][0]) return cons[0][1]+0.03*(cons[0][0]-u);
      for(let i=0;i<cons.length-1;i++) if(u<=cons[i+1][0]){ const t=(u-cons[i][0])/(cons[i+1][0]-cons[i][0]); return lerp(cons[i][1],cons[i+1][1],(1-Math.cos(Math.PI*t))/2); }
      const L=cons[cons.length-1]; return L[1]-0.02*(u-L[0]); };
    const mc=[]; let prev=1e9;
    for(const B of BRIDGES.filter(B=>B.river===main).sort((a,b)=>a.uc-b.uc)){ const l=Math.min(B.deck-3.5,prev-2); mc.push([B.uc,l]); prev=l; }
    for(const q of main.p) q.level=lvl(mc,q.u);
    const jl=trib.join.level, tc=[];
    for(const B of BRIDGES.filter(B=>B.river===trib)) tc.push([B.uc,Math.max(B.deck-3.5,jl+0.6)]);
    tc.sort((a,b)=>a[0]-b[0]); tc.push([trib.p[trib.p.length-1].u,jl]);
    for(const q of trib.p) q.level=lvl(tc,q.u);
    for(const B of BRIDGES) B.level=lvl(B.river===main?mc:tc,B.uc);
  },
  base(x,z,th,d){
    const hills=(fbm(x*0.0045,z*0.0045)-0.5)*90, rough=(fbm(x*0.035+50,z*0.035)-0.5)*7, far=smooth(HALFW+2,80,d);
    return th*(1-far)+hills*far*far+hills*0.12*far+rough*smooth(HALFW*0.8,HALFW+25,d); },
  // river valleys: bed, banks and a gently rising flood plain that blends back into the hills
  shape(x,z,h,d,s,k){
    const hRoad=h; let rn=1e9;
    for(const r of RIVERS){
      const q=riverQuery(r,x,z);
      const ground=q.level+0.5+0.05*Math.max(0,q.d-q.w)-2.4*(1-smooth(q.w*0.2,q.w,q.d));
      h=lerp(h,ground,1-smooth(q.w*1.6,q.w*1.6+110,q.d));
      rn=Math.min(rn,q.d/q.w); }
    RN[k]=rn;
    // the road keeps its height except under a bridge span (there the river passes below the deck)
    const span=onBridgeSpan(d,s);
    SPAN[k]=span?1:0;
    return span?h:lerp(h,hRoad,1-smooth(HALFW,HALFW+14,d)); },
  iceAt(){ return false; },
  color(c){
    const T=THEME;
    if(c.span) return T.bed;
    if(c.d<HALFW){
      let col=vnoise(c.cx*.2,c.cz*.2)>.5?T.track:T.trackAlt;
      if(c.s<0.0035||c.s>0.9985) col=[.95,.95,.95];
      else if(c.d>HALFW-2.2) col=[T.trackAlt[0]*.75,T.trackAlt[1]*.75,T.trackAlt[2]*.75];
      return col;
    }
    const k=smooth(.35,.65,vnoise(c.cx*.02+9,c.cz*.02));
    let col=[lerp(T.scrub[0],T.dry[0],k),lerp(T.scrub[1],T.dry[1],k),lerp(T.scrub[2],T.dry[2],k)];
    const rk=Math.max(smooth(.88,.7,c.ny), smooth(40,90,c.hy));
    col=[lerp(col[0],T.rock[0],rk),lerp(col[1],T.rock[1],rk),lerp(col[2],T.rock[2],rk)];
    if(c.d<HALFW+3) col=[col[0]*.8+T.trackAlt[0]*.2,col[1]*.8+T.trackAlt[1]*.2,col[2]*.8+T.trackAlt[2]*.2];
    const sk=smooth(1.9,1.25,c.rn);                                          // sand on the banks, mud right at the water
    if(sk>0) col=[lerp(col[0],T.sand[0],sk),lerp(col[1],T.sand[1],sk),lerp(col[2],T.sand[2],sk)];
    if(c.rn<0.8) col=T.bed;
    return col;
  },
  decor(m,rnd){
    let placed=0, tries=0;
    while(placed<650 && tries<6000){
      tries++;
      const x=(rnd()-.5)*(HALF*2-60), z=(rnd()-.5)*(HALF*2-60);
      if(nearestTrack(x,z).d<HALFW+9) continue;
      if(RIVERS.some(rv=>{ const q=riverQuery(rv,x,z); return q.d<q.w+12; })) continue;
      const y=hAt(x,z), r=rnd();
      if(r<0.55){
        const s=.8+rnd()*1.1;
        m.box(x,y+s*1.2,z,.7*s,2.4*s,.7*s,[.38,.24,.12]);
        m.cone(x,y+s*1.6,z,2.6*s,4.2*s,6,[.17,.38,.16]);
        m.cone(x,y+s*3.6,z,2.0*s,3.8*s,6,[.2,.44,.18]);
        m.cone(x,y+s*5.6,z,1.3*s,3.2*s,6,[.24,.5,.2]);
        colliders.push([x,z,.9*s]);
      } else if(r<0.85){
        const s=1.2+rnd()*2.4;
        m.rock(x,y,z,s,THEME.rock,rnd); colliders.push([x,z,s*.85]);
      } else {
        const s=.8+rnd()*1.0;
        m.cone(x,y,z,1.7*s,1.5*s,5,[.45,.5,.2]);
      }
      placed++;
    }
    bridgeDecor(m,{wood:[[.52,.35,.2],[.44,.29,.16]], rail:[.62,.5,.32], post:[.3,.2,.12], stone:[.58,.54,.48]});
  },
  mapBg(g,X,Z,sc){
    for(const r of RIVERS){ g.beginPath(); r.p.forEach((q,i)=>i?g.lineTo(X(q.x),Z(q.z)):g.moveTo(X(q.x),Z(q.z)));
      g.strokeStyle='#3f86d8'; g.lineWidth=Math.max(2,r.p[Math.floor(r.p.length/2)].w*2*sc); g.stroke(); } },
  mapFg(g,X,Z,sc,road){ for(const B of BRIDGES) road(B.i0,B.n,'#9a6330',TW*sc); }
};
