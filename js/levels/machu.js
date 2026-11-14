'use strict';
// Level: Machu Picchu.
// ---------------- MACHU PICCHU (Andean cloud forest: a narrow road of hairpins climbs a terraced ridge to the Inca citadel and drops down the far side) ----------------
// plan: a valley road round the west foot of the ridge, then ten switchback legs up and ten down across the ridge, over the summit plateau in the middle
const MP_V=[[-250,-370,60],[-285,-190,90],[-245,0,90],[-285,190,90],[-250,370,60],[-80,370,40],
  [-80,290,24],[70,290,24],[70,236,24],[-70,236,24],[-70,182,24],[70,182,24],[70,128,24],[-70,128,24],[-70,78,24],[70,78,24],      // up: five legs
  [70,-78,28],                                                                                                                       // along the east side of the citadel
  [-70,-78,24],[-70,-128,24],[70,-128,24],[70,-182,24],[-70,-182,24],[-70,-236,24],[70,-236,24],[70,-290,24],[-70,-290,24],[-80,-370,40]];  // down: five legs
const MP_RIV=z=>-190+16*Math.sin(z/85+1);                          // the Urubamba in the gorge at the west foot of the ridge
function mpMount(x,z){ const a=1-smooth(40,420,Math.abs(z)), g=1-smooth(100,205,Math.abs(x)), hp=Math.max(0,1-Math.hypot(x-190,z+10)/92);   // ridge, and the sharp peak of Huayna Picchu
  return 152*a*g+135*Math.pow(hp,1.5); }
const mpTerrace=h=>{ const S=5, k=Math.floor(h/S), f=h/S-k; return (k+smooth(.55,.95,f))*S; };
// ---------- the citadel: Inca ruins in pale granite, mostly roofless, as they stand today ----------
const MP_STONE=[[.68,.66,.61],[.62,.6,.56],[.72,.7,.65]], MP_DARK=[.14,.13,.12], MP_THATCH=[[.66,.54,.28],[.58,.46,.24]];
// a trapezoid (doorway, window, niche: narrower at the top) on a wall: bottom centre (x,y,z), facing (nx,nz)
function mpTrap(m,x,y,z,nx,nz,wb,wt,h,col){ const tx=-nz, tz=nx; m.quad([x-tx*wb/2,y,z-tz*wb/2],[x+tx*wb/2,y,z+tz*wb/2],[x+tx*wt/2,y+h,z+tz*wt/2],[x-tx*wt/2,y+h,z-tz*wt/2],col||MP_DARK,[x-nx,y+h/2,z-nz]); }
// a stone gable: a triangular slab over an end wall, centred (cx,cz), spanning hs either way along (ux,uz), from y0 to the peak ph higher, t thick
function mpGable(m,cx,cz,ux,uz,hs,y0,ph,t,col){ const nx=-uz*t/2, nz=ux*t/2, A=k=>[cx-ux*hs+k*nx,y0,cz-uz*hs+k*nz], B=k=>[cx+ux*hs+k*nx,y0,cz+uz*hs+k*nz], P=k=>[cx+k*nx,y0+ph,cz+k*nz], o=[cx,y0+ph*.3,cz];
  m.tri(A(1),B(1),P(1),col,o); m.tri(A(-1),B(-1),P(-1),col,o); m.quad(A(1),P(1),P(-1),A(-1),col,o); m.quad(B(1),P(1),P(-1),B(-1),col,o); }
// an Inca house, (x,z) its centre, w x d, walls h high, ridge along x if alongX. As a ruin it has no roof, its end walls rise to stone gables (some
// fallen) and the tops of its walls are uneven; o.roof gives it back its thatch (the reconstructed houses). Trapezoid doorways (o.doors of them) on the
// side o.door (+1/-1), trapezoid niches inside, a window in each end wall. o.noRect: its collision comes from the compound round it
function incaHouse(m,rnd,x,z,w,d,h,alongX,o){
  o=o||{}; const f=footprint(x-w/2,z-d/2,x+w/2,z+d/2), y=f[0]-1, top=f[1]+h, st=MP_STONE[(rnd()*3)|0], t=.8, S=alongX?d:w, L=alongX?w:d;
  const ux=alongX?1:0, uz=alongX?0:1, vx=uz, vz=ux;                                                // u along the ridge, v across it
  for(const sg of [-1,1]){ const th=o.roof?top:top-(rnd()<.35?.6+rnd()*1.4:0), cx=x+vx*sg*(S/2-t/2), cz=z+vz*sg*(S/2-t/2);   // side walls
    m.box(cx,(y+th)/2,cz,alongX?L:t,th-y,alongX?t:L,st); }
  for(const sg of [-1,1]){ const cx=x+ux*sg*(L/2-t/2), cz=z+uz*sg*(L/2-t/2);                                                     // end walls with their gables
    m.box(cx,(y+top)/2,cz,alongX?t:S-2*t,top-y,alongX?S-2*t:t,st);
    if(!o.roof&&rnd()<.8) mpGable(m,cx,cz,vx,vz,S/2,top,S*.42,t,st);
    const g=hAt(cx+ux*sg*t,cz+uz*sg*t); if(top-g>4) mpTrap(m,cx+ux*sg*(t/2+.04),g+2.2,cz+uz*sg*(t/2+.04),ux*sg,uz*sg,.9,.7,1.1); }
  const ds=o.door||1, nd=o.doors||1;
  for(let k=0;k<nd;k++){ const a=nd>1?(k-(nd-1)/2)*L/nd:(rnd()-.5)*L*.3, px=x+ux*a, pz=z+uz*a;
    for(const [off,n] of [[S/2+.04,ds],[S/2-t-.04,-ds]]){ const qx=px+vx*ds*off, qz=pz+vz*ds*off; mpTrap(m,qx,hAt(qx,qz)-.2,qz,vx*n,vz*n,1.4,1.05,2.8); } }
  for(let k=0;k<3;k++){ const a=(k-1)*L*.28, px=x+ux*a-vx*ds*(S/2-t-.04), pz=z+uz*a-vz*ds*(S/2-t-.04); mpTrap(m,px,f[1]+1,pz,vx*ds,vz*ds,.7,.5,1); }   // niches on the far wall, inside
  if(o.roof) gable(m,x-w/2-.7,z-d/2-.7,x+w/2+.7,z+d/2+.7,top,S*.55,MP_THATCH[(rnd()*2)|0],alongX,st);
  if(!o.noRect) rects.push([x,z,w/2+.3,d/2+.3]); }
// a kancha: a walled compound of houses round a courtyard, one gateway on the side facing (gx,gz)
function kancha(m,rnd,x,z,W,D,gx){
  const f=footprint(x-W/2,z-D/2,x+W/2,z+D/2), y=f[0]-1, top=f[1]+2.4, st=MP_STONE[(rnd()*3)|0], t=.7;
  m.box(x,(y+top)/2,z-D/2+t/2,W,top-y,t,st); m.box(x,(y+top)/2,z+D/2-t/2,W,top-y,t,st);                 // north and south walls
  for(const sg of [-1,1]){ const wx=x+sg*(W/2-t/2);
    if(sg!==gx) m.box(wx,(y+top)/2,z,t,top-y,D-2*t,st);
    else { const g=2.6, l=(D-2*t-g)/2; for(const s2 of [-1,1]) m.box(wx,(y+top)/2,z+s2*(g/2+l/2),t,top-y,l,st);              // the gateway: double jambs, a lintel stone
      m.box(wx,top+.3,z,t+.4,.6,g+1.2,st); } }
  const hw=(W-2*t)/2-.6, hd=5.6;
  for(const sz of [-1,1]) for(const sx of [-1,1]){ if(rnd()<.15) continue; const hx=x+sx*(hw/2+.3), hz=z+sz*(D/2-t-hd/2-.2);
    incaHouse(m,rnd,hx,hz,hw,hd,2.6+rnd()*1.2,true,{door:-sz,roof:rnd()<.12,noRect:true}); }
  rects.push([x,z,W/2+.3,D/2+.3]); }
// Temple of the Sun: the curved tower on its granite outcrop, a window to the solstice, the royal tomb in the rock beneath, rooms beside it
function sunTemple(m,rnd,x,z){ const y=hAt(x,z)-1.5, st=[.7,.68,.63];
  m.rock(x,y+1.2,z,9.5,[.5,.5,.47],rnd); cylY(m,x,y+3.2,z,6.2,6.8,14,st,[.62,.6,.56]);
  for(const a of [.6,2.2]) mpTrap(m,x+Math.cos(a)*6.25,y+6.6,z+Math.sin(a)*6.25,Math.cos(a),Math.sin(a),1.1,.8,1.5);
  mpTrap(m,x,y+1.4,z-7.6,0,-1,3.4,2.2,2.6);                                                                  // the tomb: a dark cleft under the tower
  colliders.push([x,z,9]);
  incaHouse(m,rnd,x+15,z-3,9,7,3.2,false,{door:-1}); }
// Temple of the Three Windows: a hall open to the west on the Sacred Plaza, its back wall pierced by three great trapezoid windows
function threeWindows(m,x,z){ const y=hAt(x,z)-1, st=[.72,.7,.65], top=y+7.5;
  m.box(x,(y+top)/2,z,2.2,top-y,24,st); for(const sg of [-1,1]) m.box(x-4.5,(y+top-1)/2,z+sg*11.4,9,top-1-y,1.2,st);
  for(const k of [-7,0,7]) for(const n of [-1,1]) mpTrap(m,x+n*1.14,y+3,z+k,n,0,2.4,1.8,3.4);
  rects.push([x-4,z,5.6,12.6]); }
// the Main Temple: three walls round an open front, a row of niches inside the back wall and an altar stone
function mainTemple(m,x,z){ const y=hAt(x,z)-1, st=[.72,.7,.65], top=y+6.5;
  m.box(x,(y+top)/2,z+5,18,top-y,2,st); for(const sg of [-1,1]) m.box(x+sg*8.4,(y+top)/2,z-.5,1.2,top-y,9,st);
  for(let k=-3;k<=3;k++) mpTrap(m,x+k*2.2,y+3.4,z+3.96,0,-1,1,.7,1.6); m.box(x,y+1.6,z+2.6,6,1.4,2,[.6,.58,.54]);
  rects.push([x,z+.6,9.4,5.6]); }
// the Intihuatana: a carved stone on top of a stepped terraced hill, a steep stair up its west side
function intihuatana(m,x,z){ const y=lowGround(x,z,13)-1;
  let s=26; for(let k=0;k<4;k++){ m.box(x,y+k*2.2+1.1,z,s,2.2,s,k&1?[.62,.6,.56]:[.68,.66,.61]); s-=5.6; } const top=y+8.8;
  for(let k=0;k<12;k++){ const h=(k+1)*.74; m.box(x-13+(k+.5)*.69,y+h/2,z,.69,h,2.4,[.6,.58,.54]); }
  m.box(x,top+.5,z,3.6,1,2.6,[.72,.7,.66]); m.box(x+.4,top+1.6,z,.9,1.4,.9,[.74,.72,.68]); rects.push([x,z,13.2,13.2]); }
// a low terrace wall (main plaza): a stone step from (x0,z0) to (x1,z1), solid
function mpStep(m,x0,z0,x1,z1,h){ const y=Math.min(hAt(x0,z0),hAt(x1,z1),hAt((x0+x1)/2,(z0+z1)/2))-1; m.prism(x0,z0,x1,z1,.6,y,y+1+h,[.64,.62,.57]); wallRun([[x0,z0],[x1,z1]],.6); }
// a llama (or an alpaca): woolly body, long neck, small head with ears, four legs
function llama(m,x,z,yaw,col){
  const y=hAt(x,z), fx=Math.sin(yaw), fz=Math.cos(yaw), lx=fz, lz=-fx, dk=[col[0]*.6,col[1]*.6,col[2]*.6];
  orBox(m,x,z,2,.9,y+1.1,y+2,yaw,col); strut(m,[x+fx*.9,y+1.8,z+fz*.9],[x+fx*1.3,y+3,z+fz*1.3],.28,.2,col);
  orBox(m,x+fx*1.6,z+fz*1.6,.8,.38,y+2.85,y+3.3,yaw,dk); m.box(x+fx*1.3+lx*.18,y+3.45,z+fz*1.3+lz*.18,.1,.3,.1,col); m.box(x+fx*1.3-lx*.18,y+3.45,z+fz*1.3-lz*.18,.1,.3,.1,col);
  for(const a of [-.7,.7]) for(const sg of [-1,1]) m.box(x+fx*a+lx*sg*.3,y+.55,z+fz*a+lz*sg*.3,.18,1.1,.18,dk);
  colliders.push([x,z,1]); }
function andeanTree(m,rnd,x,y,z,s){ m.box(x,y+s*1.2,z,.5*s,2.4*s,.5*s,[.34,.26,.18]); m.cone(x,y+s*1.8,z,2.8*s,3.8*s,6,[.12,.34,.18]); m.cone(x,y+s*3.6,z,2*s,3.4*s,6,[.16,.4,.2]); colliders.push([x,z,.7*s]); }

LEVELS.machu={
  ai:['harderTurns'],                    // opponent adjustments on top of the difficulty (LEVEL_AI_MULTIPLIERS, config.js)
  id:'machu', seed:233, name:'MACHU PICCHU', sub:'Up the mountain and down again!',
  loc:'Machu Picchu, Peru', flag:'pe',
  blurb:"Enjoy the straight route before it turns into endless hairpin climbs towards the Inca citadel. There are llamas on the road—but to be fair, they're the least of your worries.",
  tw:22,
  theme:{
    skyTop:[0.34,0.56,0.9], skyHor:[0.92,0.95,0.96], fog:[0.84,0.90,0.92], fogN:70, fogF:620,
    amb:[.5,.5,.5], hemi:[.24,.27,.27], sun:[.62,.58,.46], light:[-.4,.8,.3], night:false, snow:false,
    body:{yaw:.9,y:.52,r:.05,col:[1,.96,.82]}, clouds:{col:[1,1,1],shade:[.8,.84,.92],amt:1},
    road:[.52,.44,.34], roadAlt:[.47,.4,.31], roadEdge:[.66,.62,.55], grass:[.3,.5,.22], grassAlt:[.36,.56,.26], lawn:[.46,.66,.3], forest:[.16,.34,.18], forestAlt:[.2,.4,.2], stone:[.6,.58,.52], rock:[.46,.46,.42], bed:[.34,.3,.24], sand:[.62,.56,.42], mud:[.34,.28,.2],
    dust:{road:[.7,.62,.5],off:[.5,.5,.36],ice:[.9,.95,1],a:.75,sz:1},
    map:{bg:'rgba(46,80,44,0.94)',road:'#efdcb0',edge:'#16130c'}
  },
  phys:{gripRoad:6.4,gripOff:4,gripIce:2,dragRoad:.14,dragOff:.55,dragIce:.05,maxOff:.72},
  rim:60,
  mt:mpMount,
  hills(x,z){ const m=mpMount(x,z);
    return m+(fbm(x*.03+9,z*.03)-.5)*9*(.35+smooth(0,60,m))+(fbm(x*.006+3,z*.006)-.5)*14*(1-smooth(10,60,m)); },
  trackPts(){ return startNear(resampleClosed(filletLoop(MP_V.map(v=>[v[0],v[1]]),MP_V.map(v=>v[2]),10),M),-255,0); },
  layout(){ const riv=[]; for(let z=-540;z<=540;z+=20) riv.push([MP_RIV(z),z]);
    return calmLayout([.06,.2,.34,.48,.62,.77,.92],[[.1,3,90],[.57,3,90]],.04,.07,crossingZones(riv,.05)); },
  prepare(){
    const dense=[]; for(let z=-540;z<=540;z+=6) dense.push([MP_RIV(z),z]);
    RIVERS.push(makeRiver('urubamba',dense,u=>13+3*Math.sin(u/90)));
    const raw=new Float32Array(M); for(let i=0;i<M;i++) raw[i]=mpMount(track[i].x,track[i].z)+.4; this.prof=smoothArr(smoothArr(raw,30),20);   // spread the climb evenly along the road, hairpins included
    findBridges(sp=>this.profile(sp)); levelRivers(3.2,0); },
  profile(s){ return arrProfile(this.prof,s)+jumpsSum(s); },
  base(x,z,th,d){
    let hm=this.hills(x,z); const w=smooth(HALFW+26,HALFW+56,d)*smooth(8,24,hm)*(1-smooth(150,175,hm));       // Inca terraces up the slopes (not on the summit plateau)
    hm=lerp(hm,mpTerrace(hm),w*.9); const far=smooth(HALFW+2,64,d); return th*(1-far)+hm*far; },
  shape(x,z,h,d,s,k){ return riverShape(x,z,h,d,s,k,h,50); },
  iceAt(){ return false; },
  color(c){
    const T=THEME;
    if(c.span) return T.bed;
    if(c.d<HALFW){
      if(c.s<0.0035||c.s>0.9985) return [.95,.95,.95];
      if(c.d>HALFW-2) return T.roadEdge;
      return vnoise(c.cx*.22,c.cz*.22)>.5?T.road:T.roadAlt; }
    if(c.rn<0.85) return T.bed;
    if(c.rn<1.5) return vnoise(c.cx*.1,c.cz*.1)>.5?T.sand:T.mud;
    if(Math.abs(c.cx)<72&&c.cz>-56&&c.cz<56&&c.hy>118) return vnoise(c.cx*.08,c.cz*.08)>.4?T.lawn:T.grassAlt;       // the plaza lawns of the citadel
    if(c.hy>150&&c.ny<.85) return T.rock;
    if(c.ny<.8) return vnoise(c.cx*.2,c.cz*.2)>.5?T.stone:T.rock;                                                    // terrace risers and cliffs
    if(c.hy<26) return vnoise(c.cx*.05,c.cz*.05)>.5?T.forest:T.forestAlt;
    return vnoise(c.cx*.04,c.cz*.04)>.5?T.grass:T.grassAlt; },
  decor(m,rnd){
    const free=(x,z,r)=>roadDist(x,z)>HALFW+r+3, gateNear=(x,z,r)=>GATES.some(g=>Math.hypot(g.x-x,g.z-z)<r);
    // the citadel on the summit plateau, as the ruins stand: the main plaza on terraced lawns, the sacred sector to the west (Sacred Plaza, Three Windows,
    // Main Temple, the Intihuatana hill, the Temple of the Sun over the royal tomb), walled compounds of the urban sector to the east, long halls
    // and rows of houses north and south, a thatched guardhouse on the south-west corner
    for(const sg of [-1,1]){ mpStep(m,-24,sg*17,-6,sg*17,.5); mpStep(m,0,sg*17,18,sg*17,.5); for(let k=0;k<4;k++){ const zz=sg*(17.6+k*.7), y=hAt(-3,zz); m.box(-3,y-.2+(k+1)*.15,zz,5,.6,.7,[.6,.58,.54]); } }
    mpStep(m,-26,-15,-26,-4,.6); mpStep(m,-26,4,-26,15,.6);
    threeWindows(m,-30,-4); mainTemple(m,-52,10); incaHouse(m,rnd,-48,-14,10,6,3.4,true,{door:1});        // the Sacred Plaza and the priest's house
    intihuatana(m,-55,36); sunTemple(m,rnd,-52,-38);
    incaHouse(m,rnd,-66,-54,8,6,3,true,{door:1,roof:true});                                             // the guardhouse
    for(const kz of [-47,-26,-5,16,37]) if(free(36,kz,13)) kancha(m,rnd,36,kz,23,18,-1);
    for(const [x,z,w,d,ax,o] of [[-6,48,28,8,true,{door:-1,doors:5}],[-6,-48,28,8,true,{door:1,doors:5}],                     // two kallanka halls
      [-30,30,9,6,true,{door:-1}],[-16,30,9,6,true,{door:-1,roof:true}],[0,30,10,6,true,{door:-1}],[14,30,9,6,true,{door:-1}],
      [-30,-30,9,6,true,{door:1}],[-16,-30,10,6,true,{door:1}],[0,-30,9,6,true,{door:1,roof:true}],[14,-30,9,6,true,{door:1}],
      [16,46,7,10,false,{door:-1}],[16,-46,7,10,false,{door:-1}],[-34,50,8,6,true,{door:-1}],[-30,-52,8,6,true,{door:1}]])
      if(free(x,z,Math.max(w,d)*.55)) incaHouse(m,rnd,x,z,w,d,3.2+rnd()*1.2,ax,o);
    for(let k=0;k<5;k++){ const x=-18+rnd()*32, z=-12+rnd()*24, a=rnd()*6.28; llama(m,x,z,a,k%2?[.9,.86,.78]:[.55,.42,.3]); }
    // llamas along the verge and on the terraces, trees in the valleys and on the lower slopes, boulders on the cliffs
    for(let i=0;i<M;i+=23){ const sg=((i/23)|0)&1?1:-1, [x,z]=roadside(i,sg,3+rnd()*5), t=track[i]; if(bendAt(i)>.01||gateNear(x,z,24)||roadDist(x,z)<HALFW+1.8) continue;
      for(let k=0;k<1+((rnd()*2)|0);k++) llama(m,x+k*2.2,z,Math.atan2(t.tx,t.tz)+(rnd()-.5)*1.6,[[.9,.86,.78],[.55,.42,.3],[.34,.27,.22],[.8,.7,.55]][(rnd()*4)|0]); }
    for(let i=0,placed=0;i<9000&&placed<520;i++){ const x=(rnd()-.5)*(HALF*2-60), z=(rnd()-.5)*(HALF*2-60), y=hAt(x,z);
      if(!free(x,z,3)||y>95||waterDist(x,z)<6||(Math.abs(x)<75&&Math.abs(z)<60&&y>110)) continue; const sl=Math.abs(hAt(x+4,z)-y);
      if(sl>5) { if(rnd()<.5) { const s=1.5+rnd()*2.6; m.rock(x,y,z,s,[.48,.47,.43],rnd); colliders.push([x,z,s*.85]); placed++; } continue; }
      andeanTree(m,rnd,x,y,z,.9+rnd()*1.1); placed++; }
    // retaining walls on the outside of every hairpin (the drop beyond them is a long one), stone markers along the road
    for(const A of sharpBends(.014,6)){ const n=Math.min(A.n+10,70); barrierRun(m,(A.a-5+M)%M,n,A.out,1.1,1.3,k=>(k&1)?[.62,.59,.53]:[.56,.53,.48],null,true); }
    roadPosts(m,14,1.3,1.5,[.58,.55,.5],[.7,.66,.6],false);
    bridgeDecor(m,{wood:[[.5,.4,.26],[.44,.34,.22]], rail:[.56,.46,.3], post:[.3,.22,.14], stone:[.6,.58,.52]});
    // a skyline of cloud-wrapped green peaks beyond the edge of the map
    for(let i=0;i<22;i++){ const a=i/22*Math.PI*2+rnd()*.2, s=130+rnd()*140, r=beyondPlayfield(a,s*.6)+rnd()*40, x=Math.cos(a)*r, z=Math.sin(a)*r;
      m.cone(x,-30,z,s*.6,s*1.6,7,[.2,.36,.22]); m.cone(x,s*.5,z,s*.33,s*1.1,7,[.3,.44,.3]); m.cone(x,s*1.3,z,s*.13,s*.5,6,[.55,.58,.55]); }
  },
  mapBg(g,X,Z,sc){ g.fillStyle='rgba(120,150,90,0.55)'; g.fillRect(X(-170),Z(-430),340*sc,860*sc); g.fillStyle='rgba(150,150,130,0.7)'; g.beginPath(); g.arc(X(190),Z(-10),70*sc,0,7); g.fill();
    g.beginPath(); for(let z=-540;z<=540;z+=30) z>-540?g.lineTo(X(MP_RIV(z)),Z(z)):g.moveTo(X(MP_RIV(z)),Z(z)); g.strokeStyle='#4a90d8'; g.lineWidth=Math.max(2,26*sc); g.stroke();
    g.fillStyle='#d8cfae'; g.fillRect(X(-62),Z(-46),124*sc,92*sc); },
  mapFg(g,X,Z,sc,road){ for(const B of BRIDGES) road(B.i0,B.n,'#a8845a',TW*sc); }
};
