'use strict';
// Level: Windmill Valley.
// ---------------- FARMLAND (day, rolling patchwork fields, windmills, a serpentine country lane) ----------------
const FM_FIELD=[[.40,.62,.22],[.90,.80,.26],[.55,.36,.24],[.46,.70,.28],[.62,.46,.76],[.36,.56,.20]];
const FM_TULIP=[[.88,.14,.18],[.98,.82,.18],[.92,.42,.62],[.98,.98,.94]];
const FM_BRICK=[[.66,.30,.22],[.72,.40,.28],[.80,.72,.56],[.9,.88,.82]];
// A Dutch smock mill: tapering whitewashed body, dark cap, four lattice sails turning in a vertical plane facing `yaw`
function windmill(m,rnd,x,z,yaw,s){
  const y=lowGround(x,z,6.5*s)-.6, H=18*s;
  frustum(m,x,y,z,6.4*s,4*s,H,8,[.93,.9,.82],[.3,.26,.24]);
  m.box(x,y+.8*s,z,13*s,1.6*s,13*s,[.42,.3,.22]);                                          // stone footing
  frustum(m,x,y+H,z,4.3*s,3.2*s,2.2*s,8,[.28,.22,.2],[.2,.17,.16]); m.cone(x,y+H+2.2*s,z,3.4*s,2.4*s,8,[.24,.2,.18]);
  const fx=Math.sin(yaw), fz=Math.cos(yaw), ux=-fz, uz=fx, hx=x+fx*4.4*s, hz=z+fz*4.4*s, hy=y+H-.4*s, a0=rnd()*Math.PI/2;
  m.box(hx-fx*1.2*s,hy,hz-fz*1.2*s,1.2*s,1.2*s,3.2*s,[.28,.22,.2]);
  for(let k=0;k<4;k++){ const a=a0+k*Math.PI/2, ca=Math.cos(a), sa=Math.sin(a);
    const P=(d,l)=>[hx+ux*(ca*d-sa*l),hy+sa*d+ca*l,hz+uz*(ca*d-sa*l)];        // d along the arm, l across it
    const L=17*s, o=[hx-fx*3,hy,hz-fz*3];
    m.quad(P(0,-.35*s),P(L,-.35*s),P(L,.35*s),P(0,.35*s),[.42,.3,.2],o);               // the arm
    for(let j=0;j<4;j++){ const d0=(4+j*3.2)*s, d1=d0+3*s; m.quad(P(d0,.5*s),P(d1,.5*s),P(d1,4.4*s),P(d0,4.4*s),j&1?[.96,.93,.86]:[.86,.8,.68],o); } }
  colliders.push([x,z,5.6*s]); }
// Every building stands on the lowest ground under it, so no end hangs in the air on a slope: where the ground rises across it, a stone plinth
// (built into the hillside, as bank barns are) carries it up to the high side. Returns the height its walls start from
const FM_PLINTH=[.56,.52,.46];
function fmBase(m,x0,z0,x1,z1){ const [lo,hi]=footprint(x0,z0,x1,z1); if(hi-lo<1) return lo-.6; m.box((x0+x1)/2,(lo-.6+hi-.3)/2,(z0+z1)/2,x1-x0+.3,hi-lo+.3,z1-z0+.3,FM_PLINTH); return hi-.4; }
function farmhouse(m,rnd,x,z,w,d,alongX,col){
  const y=fmBase(m,x-w/2,z-d/2,x+w/2,z+d/2), h=5.5+rnd()*2; m.box(x,y+h/2,z,w,h,d,col); gable(m,x-w/2-.8,z-d/2-.8,x+w/2+.8,z+d/2+.8,y+h,4,[.62,.26,.18],alongX,col);
  wallWindows(m,rnd,x-w/2,z-d/2,x+w/2,z+d/2,y+3,y+h-1,[[.22,.3,.4]],.8,3.6,3.6,.4,.5); m.box(x+w*.2,y+h+3.2,z,1.2,3,1.2,[.5,.28,.22]); rects.push([x,z,w/2+.4,d/2+.4]); }
function barn(m,rnd,x,z,alongX){ const w=alongX?22:13, d=alongX?13:22, y=fmBase(m,x-w/2,z-d/2,x+w/2,z+d/2), h=9; m.box(x,y+h/2,z,w,h,d,[.62,.2,.16]); gable(m,x-w/2-.6,z-d/2-.6,x+w/2+.6,z+d/2+.6,y+h,5.5,[.3,.3,.32],alongX,[.62,.2,.16]);
  { const dx=x+(alongX?0:w/2+.05), dz=z+(alongX?d/2+.05:0), g=Math.max(hAt(dx,dz),y+.3)-.3; m.box(dx,g+3,dz,alongX?5:.1,6,alongX?.1:5,[.92,.9,.86]); }   // the doors, from the ground at the door
  rects.push([x,z,w/2+.4,d/2+.4]); }
function silo(m,x,z){ const y=lowGround(x,z,3)-.6, h=16+hAt(x,z)-y-.6; cylY(m,x,y,z,3,h,10,[.74,.76,.78],[.6,.62,.64]); dome(m,x,y+h,z,3,[.56,.58,.6],10,3); colliders.push([x,z,3.2]); }
function church(m,x,z){ const y=fmBase(m,x-6,z-16,x+6,z+11); m.box(x,y+5,z,12,10,22,[.8,.74,.62]); gable(m,x-6.6,z-11.6,x+6.6,z+11.6,y+10,5,[.5,.28,.22],false,[.8,.74,.62]);
  m.box(x,y+10,z-13,6,20,6,[.78,.72,.6]); pyramid(m,x,y+20,z-13,3.6,3.6,13,[.3,.34,.38]); m.box(x,y+34,z-13,.25,3,.25,[.9,.8,.3]); rects.push([x,z-3,6.4,17]); }
function poplar(m,x,z,s){ const y=hAt(x,z); m.box(x,y+s,z,.5*s,2*s,.5*s,[.36,.28,.2]); m.cone(x,y+s*1.6,z,1.5*s,11*s,6,[.2,.42,.2]); colliders.push([x,z,.5*s]); }
function roundTree(m,rnd,x,z,s){ const y=hAt(x,z); m.box(x,y+s*2,z,.7*s,4*s,.7*s,[.36,.27,.18]); m.rock(x,y+s*4.4,z,3.2*s,[.26+rnd()*.12,.5+rnd()*.1,.2],rnd); colliders.push([x,z,.6*s]); }
function cow(m,x,z,yaw,rnd){ const y=hAt(x,z), c=rnd()<.5?[.92,.92,.9]:[.2,.18,.16];
  orBox(m,x,z,2.1,1,y+.7,y+1.7,yaw,c); orBox(m,x+Math.sin(yaw)*1.4,z+Math.cos(yaw)*1.4,.8,.7,y+1.1,y+1.8,yaw,c);
  for(const a of [-.7,.7]) for(const b of [-.3,.3]) orBox(m,x+Math.sin(yaw)*a+Math.cos(yaw)*b,z+Math.cos(yaw)*a-Math.sin(yaw)*b,.2,.2,y,y+.8,yaw,[.3,.3,.3]);
  if(rnd()<.5) m.box(x+Math.cos(yaw)*.2,y+1.45,z-Math.sin(yaw)*.2,.5,.1,.7,[.14,.12,.1]); }
function sheep(m,rnd,x,z){ const y=hAt(x,z); m.rock(x,y+.7,z,.9,[.95,.94,.9],rnd); m.box(x+.7,y+.8,z,.4,.4,.4,[.2,.18,.18]); }
function haystack(m,x,z){ const y=hAt(x,z); m.cone(x,y,z,2.2,3.4,7,[.86,.72,.3]); colliders.push([x,z,1.8]); }

LEVELS.farm={
  id:'farm', seed:139, name:'WINDMILL VALLEY', sub:'Round and round we go!',
  loc:'Lisse, Netherlands', flag:'nl',
  blurb:'Rolling farmland under a bright sky and a serpentine hilly lane through fields of tulips and windmills. No data centers in sight, just people racing in the moment.',
  theme:{
    skyTop:[0.26,0.52,0.94], skyHor:[0.84,0.92,0.97], fog:[0.82,0.90,0.95], fogN:110, fogF:640,
    amb:[.42,.42,.42], hemi:[.24,.24,.25], sun:[.62,.6,.52], light:[-.45,.8,.35], night:false, snow:false,
    body:{yaw:-2.4,y:.74,r:.042,col:[1,.97,.82]},
    road:[.40,.40,.42], roadAlt:[.36,.36,.39], roadEdge:[.66,.64,.58], verge:[.45,.58,.26], hedge:[.2,.38,.18], rock:[.55,.5,.42],
    dust:{road:[.8,.78,.7],off:[.7,.62,.4],ice:[.9,.95,1],soft:[.36,.27,.18],a:.7,sz:1},
    map:{bg:'rgba(70,96,44,0.92)',road:'#f4f0e0',edge:'#14180c'}
  },
  phys:{gripRoad:6.8,gripOff:4.6,gripIce:2,dragRoad:.12,dragOff:.5,dragIce:.05,maxOff:.78},
  rim:60,
  hills(x,z){ return (fbm(x*.0048+20,z*.0048)-.5)*80+5*Math.sin(x/70)*Math.cos(z/90); },
  trackPts(){
    const pts=[], f=th=>300+64*Math.sin(7*th+.5)+26*Math.sin(3*th+1.2)+6*Math.sin(11*th);
    for(let i=0;i<M;i++){ const th=i/M*Math.PI*2, r=f(th); pts.push([r*Math.cos(th),r*Math.sin(th)]); }
    const crs=i=>{ const a=pts[(i+M-6)%M], b=pts[i], c=pts[(i+6)%M]; return Math.abs((b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0])); };
    let bi=0,bb=1e9; for(let i=0;i<M;i++){ let cr=0; for(let k=-20;k<=10;k+=5) cr=Math.max(cr,crs((i+k+M)%M)); if(cr<bb){bb=cr;bi=i;} }   // start on the straightest stretch
    return pts.slice(bi).concat(pts.slice(0,bi)); },
  layout(){ return calmLayout([.06,.20,.34,.48,.63,.77,.91],[[.13,5],[.41,5.5],[.70,5]],.03,.065); },
  prepare(){ const raw=new Float32Array(M); for(let i=0;i<M;i++) raw[i]=this.hills(track[i].x,track[i].z); this.prof=smoothArr(smoothArr(raw,9),4);
    // mud on the lane: in the valleys (the lowest stretches of the road), away from checkpoints and jumps
    const prof=this.prof, cand=[]; for(let i=0;i<M;i+=3) cand.push(i); cand.sort((a,b)=>prof[a]-prof[b]);
    this.mud=[]; const bad=s=>GATES.some(g=>Math.abs(wrapS(g.s-s))<.03)||JUMPS.some(j=>{ const d=wrapS(s-j[0]); return d>-.04&&d<.09; });
    for(const i of cand){ const s=track[i].s; if(this.mud.length>=6) break; if(bad(s)||bad(s-.012)||bad(s+.012)||bendAt(i)>.02||this.mud.some(q=>Math.abs(wrapS(q[0]-s))<.1)) continue; this.mud.push([s,.009+((i*7)%10)/1400]); } },
  // soft ground: the muddy stretches of the lane slow the car down
  softAt(x,z,onTrack,nt){ if(!onTrack) return 0; const s=track[nt.i].s; for(const q of this.mud) if(Math.abs(wrapS(s-q[0]))<q[1]) return 1; return 0; },
  mudAmt(s){ let a=0; for(const q of this.mud){ const d=Math.abs(wrapS(s-q[0])); a=Math.max(a,smooth(q[1]+.006,q[1]-.004,d)); } return a; },
  profile(s){ return arrProfile(this.prof,s)+jumpsSum(s); },
  base(x,z,th,d){ const far=smooth(HALFW+2,80,d); return th*(1-far)+this.hills(x,z)*far; },
  iceAt(){ return false; },
  field(x,z){ const wx=x+vnoise(x*.012,z*.012)*70, wz=z+vnoise(x*.012+9,z*.012)*70, cx=Math.floor(wx/84), cz=Math.floor(wz/62), fx=wx/84-cx, fz=wz/62-cz;
    return {h:hash2(cx*7+3,cz*13+1),edge:fx<.04||fx>.96||fz<.05||fz>.95}; },
  color(c){
    const T=THEME;
    if(c.d<HALFW){
      if(c.s<0.0035||c.s>0.9985) return [.95,.95,.95];
      const mud=this.mudAmt(c.s); if(mud>0&&vnoise(c.cx*.13+7,c.cz*.13)<mud*1.1) return vnoise(c.cx*.35,c.cz*.35)>.62?[.2,.14,.09]:(vnoise(c.cx*.2,c.cz*.2)>.5?[.34,.25,.16]:[.29,.21,.13]);
      if(c.d>HALFW-1.8) return T.roadEdge;
      return vnoise(c.cx*.2,c.cz*.2)>.5?T.road:T.roadAlt; }
    if(c.d<HALFW+3){ const mud=this.mudAmt(c.s); return mud>.3&&vnoise(c.cx*.2,c.cz*.2)<mud?[.3,.22,.14]:T.verge; }
    if(c.ny<.82) return vnoise(c.cx*.05,c.cz*.05)>.6?T.rock:T.hedge;
    const F=this.field(c.cx,c.cz); if(F.edge) return T.hedge;
    const stripe=(Math.floor(c.cz/6)&1), h=F.h;
    if(h<.16) return FM_FIELD[0]; if(h<.32) return stripe?FM_FIELD[1]:[.86,.76,.22];
    if(h<.48) return FM_TULIP[(Math.floor(c.cz/6)+((h*100)|0))&3]; if(h<.62) return stripe?FM_FIELD[2]:[.48,.32,.2];
    if(h<.76) return FM_FIELD[3]; if(h<.88) return stripe?FM_FIELD[4]:[.55,.4,.7]; return FM_FIELD[5]; },
  decor(m,rnd){
    const free=(x,z,r)=>roadDist(x,z)>HALFW+r+4, pick=a=>a[(rnd()*a.length)|0], R=this;
    // the village in the middle of the map: houses round a church, with a windmill beside it
    church(m,0,0);
    for(let k=0;k<12;k++){ const a=k/12*Math.PI*2+rnd()*.2, r=38+rnd()*40, x=Math.cos(a)*r, z=Math.sin(a)*r; if(Math.hypot(x,z)>32) farmhouse(m,rnd,x,z,9+rnd()*5,8+rnd()*3,rnd()<.5,pick(FM_BRICK)); }
    windmill(m,rnd,-70,-100,.6,1.4);
    // windmills dotted over the hills and fields, all facing roughly into the wind
    for(let i=0,n=0;i<600&&n<16;i++){ const x=(rnd()-.5)*900, z=(rnd()-.5)*900; if(!free(x,z,18)||Math.hypot(x,z)<120||hAt(x,z)<hAt(x+40,z)-8&&rnd()<.7) continue; windmill(m,rnd,x,z,.6+(rnd()-.5)*.5,.9+rnd()*.5); n++; }
    // farms: house, barn, silo
    for(let i=0,n=0;i<400&&n<12;i++){ const x=(rnd()-.5)*880, z=(rnd()-.5)*880; if(!free(x,z,24)||Math.hypot(x,z)<110||!flatAt(x,z,2.2)) continue;
      { const [lo,hi]=footprint(x+13,z-7,x+35,z+15); if(hi-lo>4) continue; }                     // (the barn needs fairly level ground too)
      farmhouse(m,rnd,x,z,12,9,true,pick(FM_BRICK)); barn(m,rnd,x+24,z+4,rnd()<.5); silo(m,x+16,z-10); if(free(x-14,z+14,3)) haystack(m,x-14,z+14); n++; }
    // poplar rows and hedgerows, field trees, livestock
    for(let k=0;k<22;k++){ const x0=(rnd()-.5)*860, z0=(rnd()-.5)*860, a=rnd()*Math.PI, n=8+((rnd()*10)|0), poplars=rnd()<.6;
      for(let j=0;j<n;j++){ const x=x0+Math.cos(a)*j*(poplars?9:5), z=z0+Math.sin(a)*j*(poplars?9:5); if(!free(x,z,5)||Math.abs(x)>HALF-30||Math.abs(z)>HALF-30) continue; if(poplars) poplar(m,x,z,.9+rnd()*.5); else { const y=hAt(x,z); m.cone(x,y,z,2.2,2.2,6,[.2,.4,.18]); colliders.push([x,z,1.6]); } } }
    for(let i=0;i<70;i++){ const x=(rnd()-.5)*(HALF*2-80), z=(rnd()-.5)*(HALF*2-80); if(free(x,z,5)) roundTree(m,rnd,x,z,.9+rnd()*.6); }
    for(let k=0;k<14;k++){ const cx=(rnd()-.5)*800, cz=(rnd()-.5)*800, cows=rnd()<.6; if(!free(cx,cz,14)) continue;
      for(let j=0,n=3+((rnd()*4)|0);j<n;j++){ const x=cx+(rnd()-.5)*26, z=cz+(rnd()-.5)*26; if(!free(x,z,4)) continue; if(cows) cow(m,x,z,rnd()*6.28,rnd); else sheep(m,rnd,x,z); } }
    // wooden fences along both sides of the lane in places (solid, so they hurt)
    for(const sg of [1,-1]) for(let i=0;i<M;i+=3){ const f=hash2(((i/60)|0)*3+sg,11); if(f>.45) continue; const t=track[i], [x,z]=roadside(i,sg,2.2), y=hAt(x,z);
      if(GATES.some(g=>Math.hypot(g.x-x,g.z-z)<20)) continue;
      m.box(x,y+.8,z,.25,1.6,.25,[.5,.36,.22]); const t2=track[(i+3)%M], [x2,z2]=roadside(i+3,sg,2.2);
      for(const hy of [.6,1.2]) m.prism(x,z,x2,z2,.07,y+hy,y+hy+.18,[.62,.48,.3]);
      wallRun([[x,z],[x2,z2]],.5); }
    LEVELS.city.guidance(m);                                       // chevron boards on the bends
    // a distant church spire, windmills and hills on the horizon
    for(let i=0;i<20;i++){ const a=i/20*Math.PI*2+rnd()*.1, r=585+rnd()*50, x=Math.cos(a)*r, z=Math.sin(a)*r; if(i%5===0) windmill(m,rnd,x,z,.6,2.2); else { const R=60+rnd()*40, H=55+rnd()*40; m.cone(x,-20,z,R,H,6,[.4,.55,.35]); solidCone(x,-20,z,R*.93,H); } }   // (R*.93: the six-sided cone's flat faces)
  },
  marks(m){ for(let i=0;i<M;i++){ if(i%10<5&&this.mudAmt(track[i].s)<.5) markStrip(m,i,i+1,0,.14,[.92,.92,.9]); } },
  mapBg(g,X,Z,sc){ for(let gz=-420;gz<=420;gz+=84) for(let gx=-420;gx<=420;gx+=84){ const h=hash2(((gx/84)|0)*7+3,((gz/62)|0)*13+1); g.fillStyle=['#7aa63a','#d6c23c','#7a5632','#5f9a3a','#9a78c0','#4c7a2c'][Math.floor(h*6)]; g.globalAlpha=.55; g.fillRect(X(gx),Z(gz),80*sc,60*sc); } g.globalAlpha=1; }
};
