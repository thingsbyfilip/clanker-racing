'use strict';
// Level: Autumn Breeze.
// a maple / oak (bushy autumn crown), a birch (pale trunk, yellow crown) or an evergreen pine
function fallTree(m,rnd,x,y,z,s){
  const r=rnd();
  if(r<.18){
    m.box(x,y+s*1.2,z,.7*s,2.4*s,.7*s,[.3,.2,.12]);
    m.cone(x,y+s*1.6,z,2.5*s,4.4*s,6,[.10,.30,.16]); m.cone(x,y+s*3.8,z,1.9*s,3.8*s,6,[.12,.34,.18]); m.cone(x,y+s*5.8,z,1.2*s,3.2*s,6,[.14,.38,.20]);
  } else if(r<.32){
    m.box(x,y+s*2.4,z,.5*s,4.8*s,.5*s,[.9,.88,.8]);
    m.rock(x,y+s*5.2,z,2.5*s,[.96,.80,.20],rnd); m.rock(x+.8*s,y+s*4.2,z+.5*s,1.8*s,[.90,.70,.15],rnd);
  } else {
    const c=FALL[(rnd()*FALL.length)|0], c2=FALL[(rnd()*FALL.length)|0];
    m.box(x,y+s*2.15,z,.9*s,4.3*s,.9*s,[.34,.22,.13]);
    m.rock(x,y+s*5.0,z,4.4*s,c,rnd); m.rock(x+1.6*s,y+s*4.0,z-.9*s,3.2*s,c2,rnd); m.rock(x-1.4*s,y+s*4.4,z+1.1*s,3.0*s,c,rnd);
  }
  colliders.push([x,z,.6*s]);
}

// ---------------- 7. AUTUMN BREEZE (dense woodland, falling leaves, low sun) ----------------
LEVELS.forest={
  id:'forest', seed:71, name:'AUTUMN BREEZE', sub:"Don't fall behind!",
  loc:'Bialowieza Forest, Poland', flag:'pl',
  blurb:"You're not just auto racing—you're *autumn* racing. Don't get *stumped* by this scenic woodland route and try not to *fall* behind whoever *leaves* first!",
  theme:{
    skyTop:[0.45,0.55,0.72], skyHor:[0.97,0.78,0.52], fog:[0.88,0.72,0.52], fogN:70, fogF:480,
    amb:[.44,.39,.34], hemi:[.20,.17,.14], sun:[.66,.54,.38], light:[.6,.5,.4], night:false, snow:false, leaves:true,
    body:{yaw:-2.3,y:.60,r:.05,col:[1,.80,.50]},
    road:[.50,.36,.22], roadAlt:[.58,.30,.14], roadEdge:[.38,.27,.16], litter:[.55,.32,.14], litterAlt:[.70,.38,.12], moss:[.40,.38,.18], bark:[.38,.40,.30],
    dust:{road:[.75,.60,.40],off:[.70,.50,.28],ice:[.9,.95,1],a:.7,sz:1.1},
    map:{bg:'rgba(74,42,14,0.92)',road:'#f4dca6',edge:'#241408'}
  },
  phys:{gripRoad:6.5,gripOff:4.6,gripIce:2,dragRoad:.14,dragOff:.4,dragIce:.05,maxOff:.8},
  rim:60,
  hills(x,z){ return (fbm(x*.005+60,z*.005)-.5)*80+8*ridged(x*.012,z*.012); },
  trackPts(){ const pts=[]; for(let i=0;i<M;i++){ const th=i/M*Math.PI*2, r=285+55*Math.sin(2*th+.3)+38*Math.sin(3*th+1.9)+20*Math.sin(5*th+.8)+24*Math.sin(7*th+.4); pts.push([r*Math.cos(th),r*Math.sin(th)]); } return pts; },
  layout(){ return {gates:[.07,.21,.35,.49,.63,.77,.92], jumps:[[.14,5],[.42,6],[.70,5],[.86,6]]}; },
  prepare(){ const raw=new Float32Array(M); for(let i=0;i<M;i++) raw[i]=this.hills(track[i].x,track[i].z); this.prof=smoothArr(smoothArr(raw,8),5); },
  profile(s){ return arrProfile(this.prof,s)+jumpsSum(s); },
  base(x,z,th,d){ const far=smooth(HALFW+2,100,d); return th*(1-far)+this.hills(x,z)*far+((fbm(x*.04+20,z*.04)-.5)*4)*smooth(HALFW,HALFW+30,d); },
  iceAt(){ return false; },
  color(c){
    const T=THEME;
    if(c.d<HALFW){
      if(c.s<0.0035||c.s>0.9985) return [.95,.95,.95];
      if(c.d>HALFW-2.2) return T.roadEdge;
      return vnoise(c.cx*.35,c.cz*.35)>.72?T.roadAlt:(vnoise(c.cx*.2,c.cz*.2)>.5?T.road:[T.road[0]*.92,T.road[1]*.92,T.road[2]*.92]); }
    const a=vnoise(c.cx*.06,c.cz*.06), b=vnoise(c.cx*.02+8,c.cz*.02), base=a>.55?T.litterAlt:(a>.35?T.litter:T.moss);
    const rk=smooth(.86,.64,c.ny), k=smooth(.3,.7,b);
    const col=[lerp(base[0],T.litter[0]*.8,k*.4),lerp(base[1],T.litter[1]*.8,k*.4),lerp(base[2],T.litter[2]*.8,k*.4)];
    return [lerp(col[0],T.bark[0],rk),lerp(col[1],T.bark[1],rk),lerp(col[2],T.bark[2],rk)]; },
  decor(m,rnd){
    // the forest: ~1400 trees, kept off the road and a little apart from each other
    const grid=new Map(), cs=6, key=(x,z)=>Math.floor(x/cs)+','+Math.floor(z/cs);
    const clear=(x,z)=>{ const cx=Math.floor(x/cs), cz=Math.floor(z/cs); for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++){ const a=grid.get((cx+i)+','+(cz+j)); if(a) for(const p of a) if(Math.hypot(p[0]-x,p[1]-z)<4.4) return false; } return true; };
    let placed=0, tries=0;
    while(placed<1900&&tries<26000){ tries++;
      let x,z;
      if(rnd()<.6){ const t=track[(rnd()*M)|0], sg=rnd()<.5?1:-1, off=HALFW+4+rnd()*rnd()*70; x=t.x+t.tz*sg*off; z=t.z-t.tx*sg*off; }   // most trees crowd the road
      else { x=(rnd()-.5)*(HALF*2-50); z=(rnd()-.5)*(HALF*2-50); }
      if(Math.abs(x)>HALF-30||Math.abs(z)>HALF-30||nearestTrack(x,z).d<HALFW+4||!clear(x,z)) continue;
      const y=hAt(x,z), s=.85+rnd()*.7;
      fallTree(m,rnd,x,y,z,s);
      const k=key(x,z); if(!grid.has(k)) grid.set(k,[]); grid.get(k).push([x,z]); placed++; }
    const free=(x,z,r)=>nearestTrack(x,z).d>=HALFW+r;
    // undergrowth, mossy boulders, mushrooms, pumpkins, fallen logs, stumps
    for(let i=0;i<500;i++){ const x=(rnd()-.5)*(HALF*2-50), z=(rnd()-.5)*(HALF*2-50); if(!free(x,z,5)) continue;
      const y=hAt(x,z), r=rnd();
      if(r<.45){ const s=.8+rnd()*1.2; m.cone(x,y,z,1.6*s,1.5*s,5,FALL[(rnd()*FALL.length)|0]); }
      else if(r<.62){ const s=1+rnd()*2.2; m.rock(x,y,z,s,[.36,.38,.28],rnd); colliders.push([x,z,s*.85]); }
      else if(r<.80){ m.box(x,y+.45,z,.25,.9,.25,[.92,.9,.82]); m.cone(x,y+.8,z,.9,.5,6,[.78,.15,.1]); }
      else if(r<.90){ const s=.6+rnd()*.5; m.rock(x,y+.3,z,s,[.95,.5,.08],rnd); m.box(x,y+s*.9,z,.12,.3,.12,[.25,.4,.1]); }
      else if(r<.96){ const a=rnd()*Math.PI, dx=Math.cos(a)*3.2, dz=Math.sin(a)*3.2; m.prism(x-dx,z-dz,x+dx,z+dz,.7,y,y+1.4,[.35,.23,.14]); colliders.push([x-dx*.6,z-dz*.6,.9],[x+dx*.6,z+dz*.6,.9]); }
      else { m.box(x,y+.4,z,1.2,.8,1.2,[.4,.27,.16]); colliders.push([x,z,.9]); } }
    // a log cabin near the start, with a woodpile
    const t=track[0], x=t.x+t.tz*58+t.tx*30, z=t.z-t.tx*58+t.tz*30, y=hAt(x,z);
    m.box(x,y+2,z,10,4,8,[.46,.31,.18]); pyramid(m,x,y+4,z,6.2,5.2,3.4,[.34,.2,.12]); m.box(x+3,y+5.2,z-1.5,1.2,3,1.2,[.4,.38,.36]);
    m.box(x,y+1.4,z+4.05,1.6,2.8,.1,[.22,.14,.08]); rects.push([x,z,5.4,4.4]);
    m.box(x+8,y+.8,z+1,3,1.6,1.4,[.4,.26,.14]); colliders.push([x+8,z+1,1.8]);
    roadPosts(m,12,1.3,2.4,[.55,.38,.2],[.9,.9,.85],false);
  }
};
