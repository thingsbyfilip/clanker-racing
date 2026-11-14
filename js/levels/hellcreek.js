'use strict';
// Level: Hell Creek (Montana, 66 million years ago).
// ---------------- HELL CREEK (late Cretaceous floodplain: warm, humid, no grass, no volcanoes; dawn redwoods, swamp cypress, ferns, palms; dinosaurs) ----------------
// Hell Creek Formation facts used here: a low coastal plain with meandering rivers and moist soils; warm, humid, subtropical to warm temperate;
// forest dominated by flowering plants (broad-leaved, sycamore- and katsura-like trees) with dawn redwoods (Metasequoia) and swamp cypress
// (Glyptostrobus), tree ferns, ground ferns, horsetails, a few cycads and palms; grasses were not yet widespread, so there are no meadows.
// Fauna: Tyrannosaurus, Triceratops, Edmontosaurus, Ankylosaurus, Pachycephalosaurus, Thescelosaurus.
const hcRiverZ=x=>-10+34*Math.sin(x/120+.5);
const HC_V=[[-300,-150],[-300,-60],[-300,60],[-300,150],[-240,250],[-120,310],[0,240],[120,310],[240,250],[300,150],[300,60],[300,-60],[300,-150],[240,-250],[120,-195],[0,-300],[-120,-205],[-240,-255]];
const HC_FERN=[[.18,.44,.2],[.24,.52,.22],[.14,.38,.2]];
// a body part placed in a creature's own frame: a = forward, b = left, h = up
const HC_DINOS=[];   // where the creatures stand (for debugging screenshots)
function dinoFrame(x,z,yaw,s){ HC_DINOS.push([Math.round(x),Math.round(z),+yaw.toFixed(2),s]); const y0=hAt(x,z), fx=Math.sin(yaw), fz=Math.cos(yaw), lx=fz, lz=-fx; return (a,b,h)=>[x+(fx*a+lx*b)*s,y0+h*s,z+(fz*a+lz*b)*s]; }
function dinoSolid(x,z,yaw,s,list){ const fx=Math.sin(yaw), fz=Math.cos(yaw); for(const [a,r] of list) colliders.push([x+fx*a*s,z+fz*a*s,r*s]); }
function trex(m,x,z,yaw,s,col){
  const P=dinoFrame(x,z,yaw,s), belly=[col[0]*1.25,col[1]*1.25,col[2]*1.1];
  strut(m,P(-3.5,0,6.1),P(2.8,0,7.3),1.5,1.35,col); strut(m,P(-1,0,5.4),P(1.8,0,6.0),1.3,1.1,belly);
  strut(m,P(-3.5,0,6.2),P(-8,0,5.5),1.3,.7,col); strut(m,P(-8,0,5.5),P(-12.5,0,4.6),.7,.12,col);
  for(const sg of [-1,1]){
    strut(m,P(-1,sg*1.5,6.0),P(.4,sg*1.5,3.3),1.15,.85,col); strut(m,P(.4,sg*1.5,3.3),P(-.7,sg*1.5,.9),.7,.5,col); strut(m,P(-.7,sg*1.5,.5),P(1.9,sg*1.5,.4),.5,.45,[col[0]*.8,col[1]*.8,col[2]*.8]);
    strut(m,P(2.6,sg*1,6.5),P(3.5,sg*1.05,5.5),.25,.2,col);
    for(let k=0;k<4;k++){ const a=5.6+k*.6; strut(m,P(a,sg*.55,8.5),P(a,sg*.55,7.7),.16,.02,[.95,.94,.88]); } }
  strut(m,P(2.6,0,7.2),P(4.7,0,9.1),1.1,.95,col); strut(m,P(4.5,0,9.3),P(7.8,0,9.1),1.3,.8,col); strut(m,P(5,0,8.5),P(7.6,0,8.4),.55,.35,belly);
  m.em=false; m.box(...P(5.7,.9,9.7),.4*s,.4*s,.4*s,[.9,.75,.2]); m.box(...P(5.7,-.9,9.7),.4*s,.4*s,.4*s,[.9,.75,.2]);
  for(const sg of [-1,1]){ const a=P(-.9,sg*1.5,0), b=P(2,sg*1.5,0); wallRun([[a[0],a[2]],[b[0],b[2]]],.6*s); } }   // only the legs are solid: the tail and the head are high enough to drive under
function triceratops(m,x,z,yaw,s,col){
  const P=dinoFrame(x,z,yaw,s), frill=[.62,.4,.3];
  strut(m,P(-3.6,0,3.7),P(3,0,3.9),2.0,1.9,col); strut(m,P(-3.6,0,3.7),P(-7.2,0,2.6),1.0,.15,col);
  for(const sg of [-1,1]) for(const a of [-2.4,1.9]) strut(m,P(a,sg*1.6,2.6),P(a,sg*1.6,0),.8,.65,[col[0]*.85,col[1]*.85,col[2]*.85]);
  strut(m,P(3,0,3.7),P(6.4,0,3.0),1.3,.85,col); strut(m,P(6.3,0,2.9),P(7.5,0,2.5),.5,.2,[.7,.62,.4]);
  orBox(m,...(()=>{ const p=P(3.6,0,5.6); return [p[0],p[2]]; })(),.6*s,5.4*s,P(3.6,0,3.3)[1],P(3.6,0,7.9)[1],yaw,frill);
  for(const sg of [-1,1]){ strut(m,P(5.2,sg*.9,4.2),P(8.2,sg*1.3,6.0),.4,.05,[.93,.9,.8]); for(let k=-2;k<=2;k++) strut(m,P(3.4,k*1.0,7.7),P(3.4,k*1.05,8.4),.28,.05,[.85,.8,.7]); }
  strut(m,P(6.6,0,3.3),P(7.6,0,4.4),.35,.05,[.93,.9,.8]);
  dinoSolid(x,z,yaw,s,[[-5,.7],[-2.5,2.1],[0.5,2.3],[3.5,2],[6,1.1]]); }
function edmontosaurus(m,x,z,yaw,s,col){
  const P=dinoFrame(x,z,yaw,s), dk=[col[0]*.7,col[1]*.7,col[2]*.7];
  strut(m,P(-2,0,4.3),P(3,0,4.9),1.25,1.1,col); strut(m,P(-2,0,4.6),P(-9.5,0,3),1,.15,col); strut(m,P(-3,0,5.2),P(2,0,5.6),.4,.4,dk);
  for(const sg of [-1,1]){ strut(m,P(-1,sg*1.1,4.2),P(.2,sg*1.1,2.3),.9,.6,col); strut(m,P(.2,sg*1.1,2.3),P(-.5,sg*1.1,.4),.5,.4,col); strut(m,P(2.5,sg*.9,4.3),P(2.8,sg*.9,.5),.4,.3,col); }
  strut(m,P(3,0,5.0),P(5,0,6.6),.8,.6,col); strut(m,P(4.8,0,6.9),P(7.7,0,6.0),.7,.45,col); strut(m,P(5.4,0,7.4),P(5.5,0,8.4),.2,.05,dk);
  dinoSolid(x,z,yaw,s,[[-6,.8],[-2.5,1.5],[0.5,1.8],[3.5,1.2]]); }
function ankylosaurus(m,x,z,yaw,s,col){
  const P=dinoFrame(x,z,yaw,s), arm=[col[0]*1.3,col[1]*1.25,col[2]*1.2];
  strut(m,P(-3,0,1.9),P(3.2,0,2.0),2.1,2.0,col); strut(m,P(-3,0,1.9),P(-8,0,1.5),1.2,.5,col); strut(m,P(-8,0,1.5),P(-9.8,0,1.5),1.4,1.4,[.5,.44,.38]);
  for(const sg of [-1,1]){ for(const a of [-2.2,2]) strut(m,P(a,sg*1.7,1.4),P(a,sg*1.7,0),.65,.55,col);
    for(let a=-3;a<=3;a+=1.5) strut(m,P(a,sg*2.1,2.0),P(a,sg*3.4,2.6),.35,.05,arm); }
  strut(m,P(3.2,0,1.9),P(5.6,0,1.3),1.05,.75,col);
  for(let a=-2.5;a<=2.5;a+=1.25) for(const b of [-.9,.9]) strut(m,P(a,b,3.9),P(a,b,4.7),.4,.05,arm);
  dinoSolid(x,z,yaw,s,[[-8.5,1.2],[-4,2.2],[0,2.6],[3.5,2],[5,1]]); }
function pachycephalosaurus(m,x,z,yaw,s,col){
  const P=dinoFrame(x,z,yaw,s);
  strut(m,P(-1.5,0,2.5),P(1,0,2.7),.8,.7,col); strut(m,P(-1.5,0,2.5),P(-4.6,0,1.8),.6,.1,col);
  for(const sg of [-1,1]) strut(m,P(-.4,sg*.6,2.4),P(-.3,sg*.6,0),.4,.3,col);
  strut(m,P(1,0,2.8),P(1.9,0,3.7),.4,.35,col); const h=P(2.4,0,3.9); ball(m,h[0],h[1],h[2],.85*s,[.62,.5,.36],8,4); colliders.push([x,z,1.8*s]); }
function dinoNest(m,rnd,x,z){ const y=hAt(x,z); for(let k=0;k<6;k++){ const a=k/6*6.283, r=k?1.1:0; ball(m,x+Math.cos(a)*r,y+.5,z+Math.sin(a)*r,.5,[.92,.9,.8],6,3); } m.cone(x,y,z,2.2,.5,8,[.3,.24,.16]); }
// ---- plants ----
function dawnRedwood(m,rnd,x,z,s){ const y=hAt(x,z); m.box(x,y+s*2,z,.9*s,4*s,.9*s,[.4,.28,.2]); m.cone(x,y+s*3,z,3.6*s,22*s,8,[.24,.5,.22]); m.cone(x,y+s*10,z,2.6*s,14*s,8,[.3,.56,.24]); colliders.push([x,z,.8*s]); }
function swampCypress(m,rnd,x,z,s){ const y=hAt(x,z); frustum(m,x,y,z,1.6*s,.8*s,5*s,7,[.42,.32,.24],[.4,.3,.22]); m.rock(x,y+s*6.5,z,3.4*s,[.28,.46,.24],rnd);
  for(let k=0;k<4;k++){ const a=k/4*6.28+rnd(); m.cone(x+Math.cos(a)*2.4*s,y,z+Math.sin(a)*2.4*s,.35*s,.9*s,4,[.4,.3,.22]); } colliders.push([x,z,1.2*s]); }
function broadleaf(m,rnd,x,z,s){ const y=hAt(x,z); m.box(x,y+s*2.2,z,.9*s,4.4*s,.9*s,[.5,.44,.34]); const c=[.2+rnd()*.12,.46+rnd()*.12,.2];
  m.rock(x,y+s*6,z,4.2*s,c,rnd); m.rock(x+2*s,y+s*5,z+1*s,3*s,[c[0]+.05,c[1]+.04,c[2]],rnd); m.rock(x-1.8*s,y+s*5.2,z-.9*s,3*s,c,rnd); colliders.push([x,z,.7*s]); }
function fanPalm(m,rnd,x,z,s){ const y=hAt(x,z); m.box(x,y+s*2,z,.7*s,4*s,.7*s,[.46,.36,.26]);
  for(let k=0;k<9;k++){ const a=k/9*6.283+rnd()*.2, c=Math.cos(a), sn=Math.sin(a); m.prism(x,z,x+c*3.4*s,z+sn*3.4*s,.9*s,y+s*4,y+s*4.2,[.2,.5,.22]); m.prism(x+c*3.4*s,z+sn*3.4*s,x+c*4.6*s,z+sn*4.6*s,.7*s,y+s*3.2,y+s*3.4,[.16,.42,.2]); } colliders.push([x,z,.6*s]); }
function cycad(m,rnd,x,z,s){ const y=hAt(x,z); m.box(x,y+s*.6,z,.9*s,1.2*s,.9*s,[.34,.26,.2]); for(let k=0;k<8;k++){ const a=k/8*6.283, c=Math.cos(a), sn=Math.sin(a); m.prism(x,z,x+c*3*s,z+sn*3*s,.35*s,y+s*1.2,y+s*1.35,[.16,.4,.18]); } colliders.push([x,z,.8*s]); }
function fernClump(m,rnd,x,z,s){ const y=hAt(x,z), c=HC_FERN[(rnd()*3)|0]; for(let k=0;k<6;k++){ const a=k/6*6.283+rnd()*.4, cc=Math.cos(a), sn=Math.sin(a); m.prism(x,z,x+cc*2.2*s,z+sn*2.2*s,.45*s,y+.9*s,y+1*s,c); m.prism(x+cc*2.2*s,z+sn*2.2*s,x+cc*3*s,z+sn*3*s,.35*s,y+.3*s,y+.4*s,c); } }
function treeFern(m,rnd,x,z,s){ const y=hAt(x,z); m.box(x,y+s*1.5,z,.5*s,3*s,.5*s,[.32,.24,.18]); for(let k=0;k<7;k++){ const a=k/7*6.283, c=Math.cos(a), sn=Math.sin(a); m.prism(x,z,x+c*3*s,z+sn*3*s,.5*s,y+s*3,y+s*3.15,HC_FERN[k%3]); m.prism(x+c*3*s,z+sn*3*s,x+c*4*s,z+sn*4*s,.35*s,y+s*2.3,y+s*2.45,HC_FERN[k%3]); } colliders.push([x,z,.5*s]); }
function horsetails(m,rnd,x,z){ const y=hAt(x,z); for(let k=0;k<7;k++){ const px=x+(rnd()-.5)*3, pz=z+(rnd()-.5)*3, h=3+rnd()*2.5; for(let j=0;j<4;j++) m.box(px,y+j*h/4+h/8,pz,.14,h/4*.9,.14,j&1?[.3,.5,.26]:[.36,.56,.3]); } }

LEVELS.hellcreek={
  id:'hellcreek', seed:149, name:'HELL CREEK', sub:'Something is watching you!', go:'GO... BACK IN TIME!',
  loc:'East Laramidia, Late Cretaceous', flag:'earth',
  blurb:'A floodplain with trees and ferns, steep ridges, a ford through the creak, and plenty of dinosaurs. Not the best place to get stuck in when your time machine short circuits.',
  theme:{
    skyTop:[0.34,0.58,0.86], skyHor:[0.88,0.90,0.76], fog:[0.76,0.85,0.72], fogN:70, fogF:540,
    amb:[.42,.42,.38], hemi:[.22,.24,.2], sun:[.62,.58,.46], light:[.35,.8,.3], night:false, snow:false,
    body:{yaw:.5,y:.8,r:.05,col:[1,.96,.8]},
    road:[.46,.34,.22], roadAlt:[.40,.30,.20], roadEdge:[.32,.23,.15], mud:[.36,.28,.2], fern:[.20,.42,.20], fernAlt:[.26,.48,.22], moss:[.3,.4,.2], sandbar:[.7,.62,.44], bed:[.30,.26,.2], ford:[.9,.84,.62], foam:[.95,.97,1], rock:[.5,.44,.34],
    dust:{road:[.66,.52,.36],off:[.5,.42,.28],ice:[.9,.95,1],a:.8,sz:1},
    map:{bg:'rgba(36,64,30,0.92)',road:'#e6c690',edge:'#1a1208'}
  },
  phys:{gripRoad:6.2,gripOff:4.2,gripIce:2,dragRoad:.14,dragOff:.5,dragIce:.05,maxOff:.78},
  rim:75,
  hills(x,z){ return (fbm(x*.005+40,z*.005)-.5)*92+10*ridged(x*.011+3,z*.011)-3; },
  trackPts(){ return startNear(closedSpline(HC_V,M),-300,110); },
  layout(){ const riv=[]; for(let x=-540;x<=540;x+=20) riv.push([x,hcRiverZ(x)]);
    return calmLayout([.07,.2,.34,.48,.62,.77,.91],[[.14,5],[.63,5.5]],.03,.065,crossingZones(riv,.055)); },
  prepare(){
    HC_DINOS.length=0;
    const raw=new Float32Array(M); for(let i=0;i<M;i++) raw[i]=this.hills(track[i].x,track[i].z); this.prof=smoothArr(smoothArr(raw,9),5);
    const dense=[]; for(let x=-540;x<=540;x+=4) dense.push([x,hcRiverZ(x)]);
    const cl=[0]; for(let i=1;i<dense.length;i++) cl.push(cl[i-1]+Math.hypot(dense[i][0]-dense[i-1][0],dense[i][1]-dense[i-1][1]));
    const n=Math.round(cl[cl.length-1]/6), pts=[]; let j=0;
    for(let k=0;k<=n;k++){ const d=cl[cl.length-1]*k/n; while(j<cl.length-2&&cl[j+1]<d) j++; const t=(d-cl[j])/((cl[j+1]-cl[j])||1);
      pts.push({x:lerp(dense[j][0],dense[j+1][0],t),z:lerp(dense[j][1],dense[j+1][1],t),u:d,w:15+3*Math.sin(d/70),level:0}); }
    const creek={name:'creek',p:pts}; RIVERS.push(creek);
    // fords: where the road crosses the creek it dips into the water (the crossing is a shallow stretch of the road itself, no bridge)
    this.fords=[]; findBridges(()=>0);
    const cross=BRIDGES.slice().sort((a,b)=>a.uc-b.uc); BRIDGES.length=0;
    const lvl=(cons,u)=>{ if(u<=cons[0][0]) return cons[0][1]+0.03*(cons[0][0]-u);
      for(let i=0;i<cons.length-1;i++) if(u<=cons[i+1][0]){ const t=(u-cons[i][0])/(cons[i+1][0]-cons[i][0]); return lerp(cons[i][1],cons[i+1][1],(1-Math.cos(Math.PI*t))/2); }
      const L=cons[cons.length-1]; return L[1]-0.02*(u-L[0]); };
    const mc=[]; let prev=1e9;
    for(const B of cross){ const l=Math.min(arrProfile(this.prof,B.s)+.5,prev-1.5); mc.push([B.uc,l]); prev=l; this.fords.push({s:B.s,h:l-.45,half:B.w*1.15+8}); }
    for(const q of creek.p) q.level=lvl(mc,q.u); },
  // the road follows the hills but dips to the creek bed at each ford
  ford(s){ let w=0,h=0; for(const f of this.fords){ const d=Math.abs(wrapS(s-f.s))*TL, k=1-smooth(f.half,f.half+55,d); if(k>w){ w=k; h=f.h; } } return [w,h]; },
  profile(s){ const base=arrProfile(this.prof,s), [w,h]=this.ford(s); return lerp(base,h,w)+jumpsSum(s); },
  base(x,z,th,d){ const mound=Math.max(0,(fbm(x*.017+7,z*.017+3)-.34)*52)*smooth(HALFW+3,HALFW+30,d)*(1-smooth(70,150,d)),   // humps and ridges crowding the road
      hills=this.hills(x,z)+mound+(fbm(x*.035+50,z*.035)-.5)*5*smooth(HALFW,HALFW+25,d), far=smooth(HALFW+2,80,d); return th*(1-far)+hills*far; },
  shape(x,z,h,d,s,k){
    const hRoad=h; let rn=1e9;
    for(const r of RIVERS){ const q=riverQuery(r,x,z);
      const ground=q.level+0.5+0.05*Math.max(0,q.d-q.w)-2.4*(1-smooth(q.w*0.2,q.w,q.d));
      h=lerp(h,ground,1-smooth(q.w*1.6,q.w*1.6+90,q.d)); rn=Math.min(rn,q.d/q.w); }
    RN[k]=rn; const span=onBridgeSpan(d,s); SPAN[k]=span?1:0;
    return span?h:lerp(h,hRoad,1-smooth(HALFW,HALFW+14,d)); },
  iceAt(){ return false; },
  color(c){
    const T=THEME;
    if(c.span) return T.bed;
    if(c.d<HALFW+3&&c.rn<1.2) return c.rn<.9?T.ford:T.foam;   // the fords, as on Volcanic Island: a pale bed seen through the water, foam where the road meets it
    if(c.d<HALFW){
      if(c.s<0.0035||c.s>0.9985) return [.92,.9,.85];
      if(c.d>HALFW-2.2) return T.roadEdge;
      return vnoise(c.cx*.2,c.cz*.2)>.5?T.road:T.roadAlt; }
    if(c.rn<0.8) return T.bed;
    if(c.rn<1.5) return vnoise(c.cx*.1,c.cz*.1)>.5?T.sandbar:T.mud;
    if(c.ny<.8||c.hy>46) return vnoise(c.cx*.06,c.cz*.06)>.5?T.rock:T.mud;
    const n=vnoise(c.cx*.03+2,c.cz*.03), k=vnoise(c.cx*.1,c.cz*.1);
    return n>.6?T.moss:n>.35?(k>.5?T.fern:T.fernAlt):(k>.55?T.mud:T.fernAlt); },
  decor(m,rnd){
    const free=(x,z,r)=>roadDist(x,z)>HALFW+r+4, creek=RIVERS[0], river=(x,z)=>riverQuery(creek,x,z), pick=a=>a[(rnd()*a.length)|0];
    const wet=(x,z)=>{ const q=river(x,z); return q.d<q.w*1.15; };
    // the dinosaurs, standing about close to the road where the driver can see them (a clear line of sight from the road, level ground, no trees in the way)
    const clear=[], seen=(x,z,i)=>{ const t=track[i], ey=hAt(t.x,t.z)+2.6, ty=hAt(x,z)+5; for(let k=1;k<12;k++){ const f=k/12, px=lerp(t.x,x,f), pz=lerp(t.z,z,f); if(hAt(px,pz)>lerp(ey,ty,f)-.4) return false; } return true; };
    const spot=(minR,maxR,tries,fn)=>{ for(let t=0;t<tries;t++){ const i=(rnd()*M)|0, sg=rnd()<.5?1:-1, [x,z]=roadside(i,sg,minR+rnd()*(maxR-minR));
        if(bendAt(i)>.02||!free(x,z,minR-6)||wet(x,z)||!flatAt(x,z,3.4)||Math.abs(x)>HALF-60||Math.abs(z)>HALF-60||GATES.some(g=>Math.hypot(g.x-x,g.z-z)<40)||clear.some(c=>Math.hypot(c[0]-x,c[1]-z)<c[2]+25)||!seen(x,z,i)) continue;
        if(fn(x,z,i)){ clear.push([x,z,20]); return true; } } return false; };
    const faceRoad=(x,z,i,j)=>Math.atan2(track[i].x-x,track[i].z-z)+j;
    const tc=[[.46,.56,.4],[.62,.48,.28],[.46,.5,.58]], hc=[[.72,.56,.3],[.42,.54,.36],[.66,.5,.4]];
    for(let k=0;k<5;k++) spot(15,46,300,(x,z,i)=>{ const yaw0=faceRoad(x,z,i,(rnd()-.5)*1.6); triceratops(m,x,z,yaw0,1.5,pick(tc));
      for(let j=1;j<3;j++){ const ox=x+(rnd()-.5)*34, oz=z+(rnd()-.5)*34; if(free(ox,oz,10)&&flatAt(ox,oz,3.4)&&!wet(ox,oz)&&seen(ox,oz,i)) triceratops(m,ox,oz,yaw0+(rnd()-.5),j===2?1:1.3,pick(tc)); } return true; });
    for(let k=0;k<4;k++) spot(18,52,300,(x,z,i)=>{ trex(m,x,z,faceRoad(x,z,i,(rnd()-.5)*1.2),1.6,pick([[.36,.46,.28],[.5,.38,.24],[.3,.38,.32]])); return true; });
    for(let k=0;k<3;k++) spot(15,46,300,(x,z,i)=>{ const yaw0=faceRoad(x,z,i,(rnd()-.5)*1.5); for(let j=0;j<4;j++){ const ox=x+(rnd()-.5)*30, oz=z+(rnd()-.5)*30; if(free(ox,oz,8)&&flatAt(ox,oz,3.4)&&!wet(ox,oz)&&seen(ox,oz,i)) edmontosaurus(m,ox,oz,yaw0+(rnd()-.5)*.6,1.4,pick(hc)); } return true; });
    for(let k=0;k<2;k++) spot(15,42,300,(x,z)=>{ ankylosaurus(m,x,z,rnd()*6.28,1.4,[.4,.34,.3]); return true; });
    for(let k=0;k<2;k++) spot(14,40,300,(x,z)=>{ for(let j=0;j<3;j++) pachycephalosaurus(m,x+j*7,z+(rnd()-.5)*7,rnd()*6.28,1.4,[.5,.4,.3]); return true; });
    for(let k=0;k<3;k++) spot(14,40,300,(x,z)=>{ dinoNest(m,rnd,x,z); return true; });
    // the forest: dawn redwoods and broadleaf trees on the slopes, swamp cypress and horsetails along the creek, ferns and tree ferns everywhere
    for(let i=0,n=0;i<9000&&n<760;i++){ const x=(rnd()-.5)*(HALF*2-50), z=(rnd()-.5)*(HALF*2-50);
      if(!free(x,z,5)||wet(x,z)||clear.some(c=>Math.hypot(c[0]-x,c[1]-z)<c[2])) continue; const q=river(x,z), nearCreek=q.d<q.w+60, y=hAt(x,z), r=rnd(), s=.8+rnd()*.7;
      if(nearCreek&&r<.4) swampCypress(m,rnd,x,z,s);
      else if(nearCreek&&r<.55) horsetails(m,rnd,x,z);
      else if(r<.2) dawnRedwood(m,rnd,x,z,s);
      else if(r<.42) broadleaf(m,rnd,x,z,s);
      else if(r<.5) fanPalm(m,rnd,x,z,s);
      else if(r<.56) cycad(m,rnd,x,z,s);
      else if(r<.64) treeFern(m,rnd,x,z,s);
      else fernClump(m,rnd,x,z,.9+rnd()*.8);
      n++; }
    // boulders (weathered sandstone) and fallen logs
    for(let i=0;i<60;i++){ const x=(rnd()-.5)*(HALF*2-60), z=(rnd()-.5)*(HALF*2-60); if(!free(x,z,5)||wet(x,z)||clear.some(c=>Math.hypot(c[0]-x,c[1]-z)<c[2])) continue; const y=hAt(x,z);
      if(rnd()<.6){ const s=1.2+rnd()*2.4; m.rock(x,y,z,s,[.52,.46,.36],rnd); colliders.push([x,z,s*.85]); }
      else { const a=rnd()*Math.PI, dx=Math.cos(a)*4, dz=Math.sin(a)*4; m.prism(x-dx,z-dz,x+dx,z+dz,.8,y,y+1.6,[.38,.28,.2]); colliders.push([x-dx*.6,z-dz*.6,1],[x+dx*.6,z+dz*.6,1]); } }
    // distant Laramide highlands on the western horizon, and low hills elsewhere
    for(let i=0;i<30;i++){ const a=i/30*Math.PI*2+rnd()*.1, r=600+rnd()*60, x=Math.cos(a)*r, z=Math.sin(a)*r, west=Math.max(0,-Math.cos(a)), s=60+rnd()*50+west*90;
      m.cone(x,-30,z,s*1.2,s+west*50,6,[.42,.5,.46]); solidCone(x,-30,z,s*1.2*.93,s+west*50); }   // (their feet reach inside the map)
    roadPosts(m,14,1.3,2.0,[.5,.38,.24],[.9,.84,.7],false);
    // ford markers: timber depth poles on both banks
    for(const f of this.fords){ const i=idxOfS(f.s), t=track[i];
      for(const a of [-1,1]) for(const sg of [-1,1]){ const k=Math.round(a*f.half/(TL/M)), u=track[(i+k+M)%M], x=u.x+u.tz*sg*(HALFW+1.6), z=u.z-u.tx*sg*(HALFW+1.6), y=hAt(x,z);
        m.box(x,y+2,z,.35,4.4,.35,[.36,.26,.17]); for(let h=1;h<=3;h++) m.box(x,y+h*1.1,z,.7,.14,.5,[.9,.84,.7]); colliders.push([x,z,.5]); } }
  },
  mapBg(g,X,Z,sc){ for(const r of RIVERS){ g.beginPath(); r.p.forEach((q,i)=>i?g.lineTo(X(q.x),Z(q.z)):g.moveTo(X(q.x),Z(q.z))); g.strokeStyle='#4a86c0'; g.lineWidth=Math.max(2,r.p[Math.floor(r.p.length/2)].w*2*sc); g.stroke(); } },
  mapFg(g,X,Z,sc,road){ for(const f of this.fords){ const i=idxOfS(f.s); road((i-8+M)%M,16,'#6aa8d8',TW*sc*.7); } }
};
