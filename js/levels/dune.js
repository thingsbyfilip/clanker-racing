'use strict';
// Level: Dune Derby (Saudi Arabia).
// ---------------- DUNE DERBY (the Empty Quarter: a sand piste winding between huge dunes with steep slip faces; soft sand everywhere off the track) ----------------
const DK_SAND=[.88,.56,.30], DK_PAN=[.9,.84,.7];
// crescent dune field: long sinuous crests with a gentle windward side and a steep slip face, crest height varying across the field
function dkDunes(x,z){
  const wx=x+36*Math.sin(z/110+1.3)+14*Math.sin(z/37), wz=z+30*Math.sin(x/120), A=(.6+.6*vnoise(x*.004+3,z*.004))*60,
    u=(wx*.82+wz*.57)/170+(fbm(x*.01,z*.01)-.5)*.3, f=u-Math.floor(u), prof=f<.78?Math.pow(f/.78,1.5):Math.pow(1-(f-.78)/.22,.9);
  const pan=1-smooth(60,125,Math.hypot(x+130,z-250));                                       // a flat salt pan in one corner
  return (A*prof+9*ridged(x*.02+5,z*.02)*(1-.5*prof))*(1-.92*pan)+(fbm(x*.08,z*.08)-.5)*1.2; }
function camel(m,x,z,yaw,s,col){
  const y=hAt(x,z), fx=Math.sin(yaw), fz=Math.cos(yaw), lx=fz, lz=-fx, dk=[col[0]*.7,col[1]*.7,col[2]*.7];
  orBox(m,x,z,3.4*s,1.3*s,y+1.8*s,y+3.1*s,yaw,col); orBox(m,x-fx*.3*s,z-fz*.3*s,1.1*s,1*s,y+3.1*s,y+3.9*s,yaw,col);
  strut(m,[x+fx*1.5*s,y+2.8*s,z+fz*1.5*s],[x+fx*2.4*s,y+4.6*s,z+fz*2.4*s],.4*s,.28*s,col); orBox(m,x+fx*2.9*s,z+fz*2.9*s,1.1*s,.5*s,y+4.4*s,y+5*s,yaw,dk);
  for(const a of [-1.2,1.2]) for(const sg of [-1,1]){ const px=x+fx*a*s+lx*sg*.5*s, pz=z+fz*a*s+lz*sg*.5*s, g=Math.min(y,hAt(px,pz))-.1; m.box(px,(g+y+1.9*s)/2,pz,.28*s,y+1.9*s-g,.28*s,dk); }   // each leg down to its own ground
  m.box(x-fx*1.8*s,y+2.5*s,z-fz*1.8*s,.15*s,1.1*s,.15*s,dk); colliders.push([x,z,1.5*s]); }
// a nodding-donkey pumpjack: base, A-frame, walking beam with the horse head, counterweight, engine
function pumpjack(m,x,z,yaw){
  const y=hAt(x,z), fx=Math.sin(yaw), fz=Math.cos(yaw), lx=fz, lz=-fx, g=[.35,.38,.42], r=[.8,.22,.12];
  orBox(m,x,z,9,3,y,y+.7,yaw,g); for(const sg of [-1,1]) strut(m,[x+lx*sg*1.2,y+.7,z+lz*sg*1.2],[x,y+6.5,z],.3,.3,g);
  strut(m,[x-fx*4.5,y+7.4,z-fz*4.5],[x+fx*4.2,y+5.6,z+fz*4.2],.4,.4,r); orBox(m,x+fx*4.6,z+fz*4.6,1,.5,y+3,y+6.3,yaw,r); orBox(m,x-fx*4.6,z-fz*4.6,1.4,1.2,y+5.8,y+7.8,yaw,g);
  orBox(m,x-fx*1.2,z-fz*1.2,1.6,1.8,y+.7,y+2.4,yaw,[.8,.75,.2]); m.box(x+fx*4.6,y+.8,z+fz*4.6,.5,1.6,.5,[.2,.2,.22]); colliders.push([x,z,3.2]); }
// a rally tent: canvas walls and a low pitched roof; a black Bedouin tent has a flat dark roof
function tent(m,rnd,x,z,w,d,col,alongX){ const y=footprint(x-w/2,z-d/2,x+w/2,z+d/2)[0]-.3; m.box(x,y+1.1,z,w,2.2,d,col); gable(m,x-w/2-.3,z-d/2-.3,x+w/2+.3,z+d/2+.3,y+2.2,1.3,[col[0]*.9,col[1]*.9,col[2]*.9],alongX,col); rects.push([x,z,w/2+.4,d/2+.4]); }
// a rally truck / 4x4 in team colours, tilted into the sand (wrecks) or parked straight
function rallyCar(m,rnd,x,z,yaw,col,big){ const fx=Math.sin(yaw), fz=Math.cos(yaw), y=Math.min(...[-1.4,1.4].flatMap(a=>[-1,1].map(sg=>hAt(x+fx*a+fz*sg*1.15,z+fz*a-fx*sg*1.15))));   // (the lowest wheel: it sits into the sand)
  if(big){ orBox(m,x,z,8,2.8,y+.8,y+3.6,yaw,col); orBox(m,x+fx*3.6,z+fz*3.6,2.4,2.6,y+.8,y+4.4,yaw,[.95,.95,.95]); orBox(m,x-fx*.5,z-fz*.5,5,2.9,y+3.6,y+4.2,yaw,[.9,.9,.9]); colliders.push([x,z,2.2],[x+fx*3,z+fz*3,2],[x-fx*3,z-fz*3,2]); }
  else { orBox(m,x,z,4.4,2.1,y+.7,y+1.9,yaw,col); orBox(m,x-fx*.3,z-fz*.3,2.2,1.9,y+1.9,y+2.7,yaw,[.14,.18,.26]); orBox(m,x-fx*1.2,z-fz*1.2,1.6,1.9,y+2.7,y+2.9,yaw,[.9,.9,.9]); colliders.push([x,z,2.3]); }
  for(const a of [-1.4,1.4]) for(const sg of [-1,1]) orBox(m,x+fx*a+fz*sg*1.15,z+fz*a-fx*sg*1.15,1.2,.55,y,y+1.1,yaw,[.08,.08,.09]); }
// a far sandstone massif: a sand apron and two to five flat-topped towers with a darker band, some undercut by the wind into a mushroom
function dkMassif(m,rnd,x,z,R){
  const SAND=[[.74,.44,.3],[.68,.4,.27],[.78,.5,.34]][(rnd()*3)|0], DARK=[SAND[0]*.75,SAND[1]*.72,SAND[2]*.72], TOP=[SAND[0]*1.08,SAND[1]*1.08,SAND[2]*1.06];
  frustum(m,x,-20,z,R*1.2,R*.75,24+rnd()*10,9,[.84,.52,.3],[.8,.5,.3]);
  for(let k=0,n=2+((rnd()*4)|0);k<n;k++){ const a=rnd()*6.28, d=(k?.25+rnd()*.3:0)*R, cx=x+Math.cos(a)*d, cz=z+Math.sin(a)*d, w=R*(k?.2+rnd()*.25:.35+rnd()*.15), h=(k?45:70)+rnd()*70, seg=6+((rnd()*3)|0);
    const y0=-12, b1=y0+h*(.3+rnd()*.25), bh=h*(.05+rnd()*.04), b2=b1+bh, top=y0+h;
    frustum(m,cx,y0,cz,w*1.12,w,b1-y0,seg,SAND); frustum(m,cx,b1,cz,w,w*.97,bh,seg,DARK);
    if(rnd()<.25){ const nk=b2+(top-b2)*.55; frustum(m,cx,b2,cz,w*.97,w*.5,nk-b2,seg,SAND); frustum(m,cx,nk,cz,w*.5,w*1.05,top-nk,seg,TOP,TOP); }
    else frustum(m,cx,b2,cz,w*.97,w*(.75+rnd()*.15),top-b2,seg,SAND,TOP); } }
// waypoint pole with an orange pennant (route book markers)
function waypoint(m,x,z,yaw,col){ const y=hAt(x,z); m.box(x,y+2.2,z,.16,4.4,.16,[.9,.9,.9]); vQuad(m,x,z,x+Math.cos(yaw)*1.6,z-Math.sin(yaw)*1.6,y+3,y+4.3,col,[x,y+3,z]); }

LEVELS.dune={
  id:'dune', seed:269, name:'DUNE DERBY', sub:'Stay on the piste!',
  loc:'Empty Quarter, Saudi Arabia', flag:'sa',
  blurb:"Take part in a challenging desert rally which doesn't infringe on any patents or copyright laws and is not named after any European or African cities it doesn't even include! *Cough.*",
  tw:26,
  theme:{
    skyTop:[0.34,0.58,0.92], skyHor:[0.98,0.90,0.74], fog:[0.96,0.82,0.62], fogN:100, fogF:760,
    amb:[.58,.5,.42], hemi:[.26,.24,.2], sun:[.82,.66,.42], light:[.55,.55,.3], night:false, snow:false,
    body:{yaw:-1.5,y:.42,r:.055,col:[1,.94,.74]},
    road:[.90,.80,.60], roadAlt:[.84,.73,.54], roadEdge:[.72,.6,.42], track:[.6,.45,.28], dune:[.84,.45,.22], duneAlt:[.78,.4,.2], duneLight:[.92,.6,.34], rock:[.58,.4,.3], pan:[.9,.84,.7], panAlt:[.84,.77,.62], camp:[.7,.62,.45],
    dust:{road:[.92,.74,.5],off:[.9,.62,.36],ice:[.9,.95,1],soft:[.94,.7,.42],a:.75,sz:1},
    map:{bg:'rgba(220,150,80,0.95)',road:'#fff0c0',edge:'#5a3014'}
  },
  phys:{gripRoad:5.4,gripOff:3.4,gripIce:2,dragRoad:.15,dragOff:.6,dragIce:.05,maxOff:.6},
  rim:60,
  trackPts(){ const pts=[]; for(let i=0;i<M;i++){ const th=i/M*Math.PI*2, r=262+78*Math.sin(2*th+.7)+42*Math.sin(3*th+2)+24*Math.sin(5*th+1)+16*Math.sin(8*th+.3)+22*Math.sin(11*th+1)+14*Math.sin(15*th+2.2); pts.push([r*Math.cos(th),r*Math.sin(th)]); } return startNear(pts,-200,-170); },
  layout(){ return calmLayout([.06,.2,.34,.48,.62,.77,.92],[[.12,4.5],[.42,4.5],[.7,4.5]],.04,.07); },
  // soft fesh-fesh sand drifts across the piste in a few stretches (and everywhere off it)
  softAt(x,z,onTrack,nt){ if(!onTrack) return 1; const s=track[nt.i].s; for(const [a,b] of this.drifts) if(s>a&&s<b) return .5; return 0; },
  prepare(){ const raw=new Float32Array(M); for(let i=0;i<M;i++) raw[i]=dkDunes(track[i].x,track[i].z)*.62+2; this.prof=smoothArr(limitGrade(smoothArr(smoothArr(raw,7),5),.2),3);
    this.drifts=[[.17,.215],[.55,.6],[.83,.87]]; const t0=track[0]; this.pad={x:t0.x+t0.tz*58,z:t0.z-t0.tx*58,r:46}; },
  profile(s){ return arrProfile(this.prof,s)+jumpsSum(s); },
  base(x,z,th,d){ const far=smooth(HALFW+2,52,d); let h=th*(1-far)+dkDunes(x,z)*far; const P=this.pad, pm=1-smooth(P.r*.95,P.r*1.6,Math.hypot(x-P.x,z-P.z)); return lerp(h,th,pm); },
  iceAt(){ return false; },
  color(c){
    const T=THEME;
    if(c.d<HALFW){
      if(c.s<0.0035||c.s>0.9985) return [.95,.95,.9];
      for(const [a,b] of this.drifts) if(c.s>a&&c.s<b) return vnoise(c.cx*.2,c.cz*.2)>.5?T.duneLight:T.dune;
      if(c.d>HALFW-2.2) return T.roadEdge;
      return vnoise(c.cx*.2,c.cz*.2)>.5?T.road:T.roadAlt; }
    const P=this.pad; if(Math.hypot(c.cx-P.x,c.cz-P.z)<P.r*1.1) return T.camp;
    if(Math.hypot(c.cx+130,c.cz-250)<85&&c.hy<14) return vnoise(c.cx*.1,c.cz*.1)>.5?T.pan:T.panAlt;
    if(c.ny<.62) return vnoise(c.cx*.15,c.cz*.15)>.5?T.rock:T.dune;                                                  // the steepest slip faces show darker, packed sand
    const n=vnoise(c.cx*.06+4,c.cz*.06), k=smooth(.3,.8,c.ny);
    const b=n>.55?T.duneAlt:T.dune; return [lerp(b[0],T.duneLight[0],(1-k)*.0+(n>.7?.35:0)),lerp(b[1],T.duneLight[1],(n>.7?.35:0)),lerp(b[2],T.duneLight[2],(n>.7?.35:0))]; },
  decor(m,rnd){
    const free=(x,z,r)=>roadDist(x,z)>HALFW+r+3, gateNear=(x,z,r)=>GATES.some(g=>Math.hypot(g.x-x,g.z-z)<r), P=this.pad;
    // the bivouac by the start: rows of tents, support trucks, a generator and flags
    for(let r=0;r<3;r++) for(let k=0;k<6;k++){ const x=P.x+(k-2.5)*13+(rnd()-.5)*2, z=P.z+(r-1)*15+(rnd()-.5)*2; if(Math.hypot(x-P.x,z-P.z)>P.r*.95||!free(x,z,6)) continue;
      tent(m,rnd,x,z,7+rnd()*3,5+rnd()*2,[[.94,.94,.9],[.9,.6,.2],[.3,.5,.78],[.9,.9,.82]][(rnd()*4)|0],true); }
    for(let k=0;k<4;k++){ const x=P.x+(k-1.5)*16, z=P.z-33; if(!free(x,z,8)) continue; const yaw=1.57+(rnd()-.5)*.3, fx=Math.sin(yaw), fz=Math.cos(yaw);
      semiTruck(m,x,hAt(x,z),z,yaw,[.9,.9,.9],[.9,.5,.15]); wallRun([[x-fx*7.8,z-fz*7.8],[x+fx*9.2,z+fz*9.2]],1.3); }
    // camels in small herds on the dunes, along the verge and near the camp; Bedouin tents with their own
    for(let k=0;k<22;k++){ const cx=(rnd()-.5)*880, cz=(rnd()-.5)*880; if(!free(cx,cz,10)||Math.hypot(cx-P.x,cz-P.z)<50) continue; const a=rnd()*6.28, n=2+((rnd()*3)|0);
      for(let q=0;q<n;q++){ const x=cx+rnd()*14-7, z=cz+rnd()*14-7; if(free(x,z,4)&&!gateNear(x,z,20)) camel(m,x,z,a+(rnd()-.5)*.6,.9+rnd()*.3,[[.78,.62,.4],[.7,.54,.34],[.84,.7,.5]][(rnd()*3)|0]); } }
    for(let k=0;k<4;k++){ const x=(rnd()-.5)*700, z=(rnd()-.5)*700; if(!free(x,z,14)||Math.hypot(x-P.x,z-P.z)<60) continue; tent(m,rnd,x,z,12,7,[.16,.14,.13],true); camel(m,x+10,z+4,rnd()*6.28,1,[.74,.58,.38]); }
    // pumpjacks and a pipeline-marker trail out in the sand, a few wrecked rally cars half in the dunes, route-book waypoint poles along the piste
    for(let k=0;k<7;k++){ const x=(rnd()-.5)*860, z=(rnd()-.5)*860; if(free(x,z,14)&&hAt(x,z)<28&&Math.hypot(x-P.x,z-P.z)>70) pumpjack(m,x,z,rnd()*3.14); }
    for(let k=0;k<12;k++){ const t=track[(rnd()*M)|0], sg=rnd()<.5?-1:1, [x,z]=roadside((rnd()*M)|0,sg,10+rnd()*30); if(!free(x,z,7)||gateNear(x,z,24)||Math.hypot(x-P.x,z-P.z)<56) continue;
      rallyCar(m,rnd,x,z,rnd()*6.28,[[.9,.15,.1],[.15,.4,.85],[.95,.75,.1],[.2,.6,.3],[.95,.4,.1]][(rnd()*5)|0],rnd()<.35); }
    for(let i=6;i<M;i+=20){ const sg=((i/20)|0)&1?1:-1, [x,z]=roadside(i,sg,2.2), t=track[i]; if(bendAt(i)>.02||gateNear(x,z,14)) continue; waypoint(m,x,z,Math.atan2(t.tx,t.tz),(i%40<20)?[.98,.55,.1]:[.95,.95,.9]); }
    for(let k=0;k<5;k++){ const i=(k*180+60)%M, t=track[i], sg=k&1?1:-1, [x,z]=roadside(i,sg,14+rnd()*8); if(!free(x,z,6)||gateNear(x,z,26)||bendAt(i)>.01) continue;      // parked 4x4s
      vehicleProp(m,x,hAt(x,z),z,rnd()*6.28,[.92,.92,.88],'van'); colliders.push([x,z,2.6]); for(let q=0;q<20;q++) rnd(); }   // the draws keep all later scenery where it was
    // sandstone buttes (Jebel formations) standing out of the dunes, mushroom-shaped by the wind, and scattered rocks
    for(let k=0;k<18;k++){ const a=rnd()*6.28, r=330+rnd()*170, x=Math.cos(a)*r, z=Math.sin(a)*r; if(!free(x,z,16)||Math.abs(x)>490||Math.abs(z)>490) continue; const h=26+rnd()*34, w=8+rnd()*8, y=lowGround(x,z,w*1.5)-1;
      frustum(m,x,y,z,w*1.5,w*.8,h*.7,8,[.66,.38,.26],[.5,.32,.22]); frustum(m,x,y+h*.7,z,w*.9,w*1.5,h*.3,8,[.74,.44,.3],[.6,.4,.28]); colliders.push([x,z,w*1.3]); }
    for(let i=0,p=0;i<4000&&p<150;i++){ const x=(rnd()-.5)*960, z=(rnd()-.5)*960; if(!free(x,z,3)) continue; const s=.8+rnd()*2.4; m.rock(x,hAt(x,z),z,s,[.62,.4,.3],rnd); if(s>1.4) colliders.push([x,z,s*.85]); p++; }
    // far sandstone massifs outside the map (the Hisma / AlUla kind: sheer towers on a sand apron), between low rounded dune swells
    for(let i=0;i<20;i++){ const a=i/20*Math.PI*2+rnd()*.12, R=45+rnd()*55, r=beyondPlayfield(a,R*1.3)+rnd()*70; dkMassif(m,rnd,Math.cos(a)*r,Math.sin(a)*r,R); }
    for(let i=0;i<26;i++){ const a=i/26*Math.PI*2+rnd()*.15, s=60+rnd()*60, r=beyondPlayfield(a,s*1.6)+rnd()*50, x=Math.cos(a)*r, z=Math.sin(a)*r;
      frustum(m,x,-20,z,s*1.6,s*1.1,s*.4,9,[.84,.5,.26]); frustum(m,x,-20+s*.4,z,s*1.1,s*.45,s*.3,9,[.88,.55,.29],[.9,.58,.3]); }
  },
  marks(m){ for(let i=0;i<M;i++){ markStrip(m,i,i+1,-4.4,.5,[.7,.55,.34]); markStrip(m,i,i+1,4.4,.5,[.7,.55,.34]); } },
  mapBg(g,X,Z,sc){ g.fillStyle='#f0e6c8'; g.beginPath(); g.arc(X(-130),Z(250),85*sc,0,7); g.fill(); g.strokeStyle='rgba(140,70,20,0.35)'; g.lineWidth=Math.max(3,26*sc); g.lineCap='butt';
    for(let k=-6;k<=6;k++){ g.beginPath(); g.moveTo(X(-520),Z(k*120-300)); g.lineTo(X(520),Z(k*120+300)); g.stroke(); } g.lineCap='round'; }
};
