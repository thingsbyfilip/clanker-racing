'use strict';
// Level: Ancient Rome.
// ---------------- ANCIENT ROME (cobbled roads round a ruined Colosseum, aqueducts, temples) ----------------
const STONE=[.80,.72,.58], STONE2=[.70,.62,.50], MARBLE=[.93,.91,.86];
// an aqueduct crossing the road at track position s0; the road runs through one huge arch
function aqueduct(m,s0){
  const t=track[trackIndexAt(s0)], Tx=t.tx, Tz=t.tz, Lx=t.tz, Lz=-t.tx, out=(t.x*Lx+t.z*Lz)>0?1:-1;
  const top=hAt(t.x,t.z)+22, gap=HALFW+4, P=(u,v)=>[t.x+Lx*out*u+Tx*v, t.z+Lz*out*u+Tz*v];
  const u0=-45, u1=210, a=P(u0,0), b=P(u1,0);
  m.prism(a[0],a[1],b[0],b[1],3,top-5,top,STONE);                       // the arched lintel
  m.prism(a[0],a[1],b[0],b[1],2.2,top,top+1.3,[.62,.72,.78]);           // water channel on top
  const pier=(u,w)=>{ const p=P(u,0), g=hAt(p[0],p[1]);
    m.prism(p[0]-Tx*3,p[1]-Tz*3,p[0]+Tx*3,p[1]+Tz*3,w,g-1,top-5,STONE2);
    colliders.push([p[0]+Tx*1.6,p[1]+Tz*1.6,w+.6],[p[0]-Tx*1.6,p[1]-Tz*1.6,w+.6]); };
  for(let u=u0+8;u<=u1;u+=16) if(Math.abs(u)>gap+8) pier(u,2);
  pier(-gap,2.6); pier(gap,2.6);                                        // the two big piers framing the road
  return [a,b];
}
// a colonnade: n columns along the road on one side, joined by an entablature
function colonnade(m,i0,side,n,off){
  const cols=[];
  for(let k=0;k<n;k++){ const t=track[(i0+k*4)%M], x=t.x+t.tz*side*(HALFW+off), z=t.z-t.tx*side*(HALFW+off), y=hAt(x,z);
    m.box(x,y+.4,z,2.4,.8,2.4,STONE2); m.box(x,y+5.4,z,1.5,9.2,1.5,MARBLE); m.box(x,y+10.2,z,2.3,.8,2.3,STONE2);
    colliders.push([x,z,1.1]); cols.push([x,z,y]); }
  for(let k=0;k<cols.length-1;k++){ const a=cols[k], b=cols[k+1]; m.prism(a[0],a[1],b[0],b[1],1.1,a[2]+10.6,a[2]+12,MARBLE); }
}
// the Colosseum: three tiers of arcades round an ellipse, ruined on one side, with a sandy arena
function colosseum(m,rnd){
  const A=74, B=60, N=44, H=10.5, y0=hAt(0,0), dark=[.22,.16,.10];
  const P=a=>[Math.cos(a)*A,Math.sin(a)*B];
  for(let i=0;i<N;i++){
    const a0=i/N*Math.PI*2, a1=(i+1)/N*Math.PI*2, am=(a0+a1)/2, p0=P(a0), p1=P(a1), pm=P(am);
    const nl=Math.hypot(B*Math.cos(am),A*Math.sin(am)), nx=B*Math.cos(am)/nl, nz=A*Math.sin(am)/nl, len=Math.hypot(p1[0]-p0[0],p1[1]-p0[1]);
    const ruined=am>2.2&&am<3.6, tiers=ruined?(am>2.7&&am<3.1?1:2):3;
    for(let t=0;t<tiers;t++){
      const col=t===0?[.82,.72,.55]:t===1?[.86,.76,.58]:[.80,.70,.52], yb=t===0?y0-1:y0+t*H, yt=y0+(t+1)*H;
      m.prism(p0[0],p0[1],p1[0],p1[1],2.4,yb,yt,col);
      wallQuad(m,pm[0]+nx*2.55,y0+t*H+5.2,pm[1]+nz*2.55,nx,nz,len*.5,6.6,dark);          // arch opening
    }
    colliders.push([pm[0],pm[1],5.6]);
  }
  groundDisc(m,0,0,50,[.9,.8,.56],20,.3);                                                    // arena sand
  for(let i=0;i<14;i++){ const a=2.3+rnd()*1.2, r=1.04+rnd()*.25, x=Math.cos(a)*A*r, z=Math.sin(a)*B*r; m.rock(x,hAt(x,z),z,1.5+rnd()*2.2,STONE,rnd); }   // rubble
}
LEVELS.rome={
  id:'rome', seed:83, name:'ANCIENT ROME', sub:'Potius sero quam numquam!', go:'AURIGATE!',
  loc:'Roma, Imperium Romanum', flag:'spqr',
  blurb:'Saepene de Imperio Romano cogitas? Nunc per vias eius currere potes, circum amphitheatrum flavium, quod etiam colosseum vocatur, cursum faciens!',
  theme:{
    skyTop:[0.30,0.52,0.88], skyHor:[0.93,0.91,0.83], fog:[0.89,0.87,0.79], fogN:130, fogF:680,
    amb:[.46,.44,.42], hemi:[.22,.22,.22], sun:[.66,.60,.50], light:[.45,.8,.35], night:false, snow:false,
    body:{yaw:3.4,y:.78,r:.04,col:[1,.95,.8]},
    road:[.68,.64,.58], roadAlt:[.62,.58,.52], roadEdge:[.84,.82,.78], grass:[.74,.68,.40], grassAlt:[.64,.62,.34], olive:[.46,.50,.27], clay:[.72,.50,.34], rock:[.64,.60,.52], sand:[.88,.78,.55],
    dust:{road:[.86,.82,.74],off:[.76,.70,.46],ice:[.9,.95,1],a:.6,sz:1},
    map:{bg:'rgba(92,82,50,0.92)',road:'#f8f0de',edge:'#2a2418'}
  },
  phys:{gripRoad:7.2,gripOff:4.8,gripIce:2,dragRoad:.12,dragOff:.3,dragIce:.05,maxOff:.85},
  rim:55,
  hills(x,z){ const r=Math.hypot(x,z), h=(fbm(x*.0045+11,z*.0045+4)-.5)*55+6*ridged(x*.01,z*.01); return lerp(3,h,smooth(80,190,r)); },   // flat ground round the Colosseum
  trackPts(){ const pts=[]; for(let i=0;i<M;i++){ const th=i/M*Math.PI*2, r=268+48*Math.sin(2*th+.8)+34*Math.sin(3*th+2)+22*Math.sin(5*th+.5)+18*Math.sin(8*th+1.1); pts.push([r*Math.cos(th),r*Math.sin(th)]); } return pts; },
  layout(){ return {gates:[.05,.20,.34,.48,.58,.73,.92], jumps:[[.12,5],[.40,6],[.66,5],[.86,6]]}; },
  prepare(){ const raw=new Float32Array(M); for(let i=0;i<M;i++) raw[i]=this.hills(track[i].x,track[i].z); this.prof=smoothArr(smoothArr(raw,6),4); this.aqs=[]; },
  profile(s){ return arrProfile(this.prof,s)+jumpsSum(s); },
  base(x,z,th,d){ const far=smooth(HALFW+2,100,d); return th*(1-far)+this.hills(x,z)*far+((fbm(x*.04+2,z*.04)-.5)*3)*smooth(HALFW,HALFW+30,d); },
  iceAt(){ return false; },
  color(c){
    const T=THEME;
    if(c.d<HALFW){
      if(c.s<0.0035||c.s>0.9985) return [.2,.12,.1];
      if(c.d>HALFW-2.2) return T.roadEdge;
      return vnoise(c.cx*.5,c.cz*.5)>.5?T.road:T.roadAlt; }
    if(Math.hypot(c.cx,c.cz)<62) return T.sand;                                         // the arena
    const a=vnoise(c.cx*.05,c.cz*.05), b=vnoise(c.cx*.02+5,c.cz*.02);
    let col=a>.55?T.grass:T.grassAlt;
    col=b>.62?T.olive:(b<.25?T.clay:col);
    const rk=smooth(.86,.64,c.ny);
    return [lerp(col[0],T.rock[0],rk),lerp(col[1],T.rock[1],rk),lerp(col[2],T.rock[2],rk)]; },
  // paving courses: thin dark lines across the road and light kerb stones along its edges
  marks(m){
    const line=(i,u0,u1,w,col)=>{ const t=track[i%M], P=(u,s)=>{ const x=t.x+t.tz*u+t.tx*s, z=t.z-t.tx*u+t.tz*s; return [x,hAt(x,z)+.16,z]; };
      m.quad(P(u0,-w),P(u1,-w),P(u1,w),P(u0,w),col,'up'); };
    for(let i=0;i<M;i+=2) line(i,-HALFW+2.2,HALFW-2.2,.13,[.48,.45,.40]);
  },
  decor(m,rnd){
    colosseum(m,rnd);
    this.aqs.push(aqueduct(m,.27),aqueduct(m,.78));
    // colonnades beside the road
    for(const [s0,side] of [[.16,1],[.52,-1],[.44,1],[.90,-1]]) colonnade(m,trackIndexAt(s0)+6,side,8,9);
    // cypress rows along the road
    for(let i=2;i<M;i+=13){ const t=track[i], sg=((i/13)|0)&1?1:-1, x=t.x+t.tz*sg*(HALFW+4), z=t.z-t.tx*sg*(HALFW+4), y=hAt(x,z);
      if(GATES.some(g=>Math.hypot(g.x-x,g.z-z)<16)) continue;
      m.box(x,y+.8,z,.4,1.6,.4,[.3,.2,.12]); m.cone(x,y+1,z,1.5,12,6,[.13,.30,.16]); colliders.push([x,z,.6]); }
    // villas, temples, statues, olive trees and umbrella pines on open ground
    const open=(x,z,r)=>Math.hypot(x,z)>100&&nearestTrack(x,z).d>HALFW+r;
    let v=0,te=0,st=0,ol=0,pn=0;
    for(let i=0;i<9000&&(v<22||te<6||st<14||ol<150||pn<45);i++){
      const x=(rnd()-.5)*(HALF*2-90), z=(rnd()-.5)*(HALF*2-90), r=rnd();
      if(r<.18&&v<22&&open(x,z,16)&&flatAt(x,z,2.2)){ const y=hAt(x,z)-.5, hx=5+rnd()*3, hz=4+rnd()*3;
        m.box(x,y+3,z,hx*2,6,hz*2,rnd()<.5?[.92,.88,.78]:[.88,.74,.5]); pyramid(m,x,y+6,z,hx+.8,hz+.8,3,[.74,.32,.18]); rects.push([x,z,hx+.4,hz+.4]); v++; }
      else if(r<.26&&te<6&&open(x,z,20)&&flatAt(x,z,2)){ const y=hAt(x,z)-.5;
        m.box(x,y+.6,z,16,1.2,22,STONE2); m.box(x,y+5.6,z,12,8.8,17,MARBLE); pyramid(m,x,y+10,z,8.2,11.2,3.6,[.74,.32,.18]);
        for(let k=-2;k<=2;k++){ m.box(x+k*2.8,y+5.6,z+11.6,1.3,8.8,1.3,MARBLE); colliders.push([x+k*2.8,z+11.6,1]); } rects.push([x,z,6.4,8.8]); te++; }
      else if(r<.34&&st<14&&open(x,z,10)){ const y=hAt(x,z);
        m.box(x,y+1.4,z,2.2,2.8,2.2,STONE2); m.box(x,y+4.4,z,1.1,3.4,1.1,MARBLE); m.box(x,y+6.6,z,.9,.9,.9,MARBLE); m.box(x+.9,y+4.8,z,.8,.35,.35,MARBLE); colliders.push([x,z,1.4]); st++; }
      else if(r<.62&&ol<150&&open(x,z,8)){ const y=hAt(x,z), s=.8+rnd()*.5;
        m.box(x,y+s*1.3,z,.7*s,2.6*s,.7*s,[.4,.34,.26]); m.rock(x,y+s*2.8,z,2*s,[.46,.52,.34],rnd); colliders.push([x,z,.6*s]); ol++; }
      else if(pn<45&&open(x,z,8)){ const y=hAt(x,z), s=.9+rnd()*.5;
        m.box(x,y+3.6*s,z,.8*s,7.2*s,.8*s,[.38,.28,.2]); dome(m,x,y+7.2*s,z,4.6*s,[.22,.42,.18],7,2); colliders.push([x,z,.7*s]); pn++; } }
    roadPosts(m,14,1.3,1.8,[.9,.88,.82],[.7,.66,.6],false);
  },
  mapBg(g,X,Z,sc){ g.fillStyle='#d9c49a'; g.beginPath(); g.ellipse(X(0),Z(0),74*sc,60*sc,0,0,7); g.fill();
    g.strokeStyle='#9a9a9a'; g.lineWidth=2; for(const [a,b] of this.aqs){ g.beginPath(); g.moveTo(X(a[0]),Z(a[1])); g.lineTo(X(b[0]),Z(b[1])); g.stroke(); } }
};
