'use strict';
// Level: Dicer Town.
// ---------------- DICER TOWN (a city bowl of narrow, steep streets under Table Mountain; blind corners between pastel Bo-Kaap houses) ----------------
const CT_V=[[-340,-320,30],[230,-320,30],[230,-235,22],[100,-235,22],[100,-150,22],[300,-150,22],[300,-50,22],[170,-50,22],[170,60,24],[300,110,26],[210,210,28],[50,190,24],[60,100,22],[-80,110,22],[-90,210,26],[-250,220,28],[-250,110,22],[-150,60,22],[-300,0,24],[-160,-60,22],[-160,-140,22],[-300,-170,22],[-250,-250,26]];
const CT_PASTEL=[[.96,.52,.62],[.98,.82,.34],[.30,.78,.80],[.60,.84,.38],[.96,.60,.28],[.74,.54,.86],[.92,.92,.86],[.48,.64,.96],[.9,.42,.36]];
const CT_SEA=-352;                                              // the quay edge: north of this is the harbour
function ctLand(x,z){
  const slope=2+smooth(-340,260,z)*66, rolling=5*Math.sin(x/80+1)*Math.sin(z/70)+(fbm(x*.01+5,z*.01)-.5)*10,
    mount=(190+(fbm(x*.012,z*.012)-.5)*50)*smooth(285,440,z), signal=130*Math.exp(-(Math.pow(x+440,2)+Math.pow(z-110,2))/(120*120)), side=70*smooth(420,520,Math.abs(x));
  return lerp(-8,slope+rolling*smooth(-330,-150,z),smooth(CT_SEA-8,CT_SEA+16,z))+mount+signal+side; }
// a building: kind 0 pastel Bo-Kaap house (flat roof with parapet), 1 white Cape Dutch house with a stepped gable, 2 glass tower, 3 red-brick Victorian with a pitched roof
function ctBuilding(m,rnd,x0,z0,x1,z1,h,kind){
  const y0=footprint(x0,z0,x1,z1)[0]-1.5, cx=(x0+x1)/2, cz=(z0+z1)/2, top=y0+h, glass=[[.2,.28,.38],[.16,.22,.32],[.24,.32,.42]];
  if(kind===2){ const c=[[.5,.66,.78],[.62,.7,.76],[.44,.56,.68]][(rnd()*3)|0]; m.box(cx,(y0+top)/2,cz,x1-x0,h,z1-z0,c); m.box(cx,top+1,cz,(x1-x0)*.8,2,(z1-z0)*.8,[.4,.44,.5]);
    dayWindows(m,rnd,x0,z0,x1,z1,y0+4,top-1.5,3,3.4,[[.14,.2,.3],[.2,.28,.4]],1,.85,.7); }
  else if(kind===3){ const c=[[.62,.34,.26],[.58,.3,.24]][(rnd()*2)|0]; m.box(cx,(y0+top)/2,cz,x1-x0,h,z1-z0,c); gable(m,x0-.5,z0-.5,x1+.5,z1+.5,top,Math.min(x1-x0,z1-z0)*.35,[.4,.2,.16],(x1-x0)>(z1-z0),c);
    dayWindows(m,rnd,x0,z0,x1,z1,y0+4,top-1.5,4,3.6,[[.82,.82,.78],[.16,.2,.28]],.8); }
  else { const pc=CT_PASTEL[(rnd()*CT_PASTEL.length)|0], c=kind===1?[.94,.93,.88]:pc;
    m.box(cx,(y0+top)/2,cz,x1-x0,h,z1-z0,c); m.box(cx,top+.4,cz,x1-x0+.5,.8,z1-z0+.5,[c[0]*.82,c[1]*.82,c[2]*.82]);
    if(kind===1){ const gw=Math.min(x1-x0,z1-z0)*.5; for(let k=0;k<3;k++) m.box(cx,top+1+k*1.1,z1+.05,gw*(1-k*.28),1.1,.5,c); }
    dayWindows(m,rnd,x0,z0,x1,z1,y0+3.4,top-1.5,3.6,3.3,glass,.88,.42,.55);
    m.box(cx,y0+1.6,z1+.1,1.5,3,.3,[.3,.2,.14]); if(rnd()<.5) m.box(cx,y0+h*.55,z1+.7,(x1-x0)*.5,.35,1.4,[c[0]*.7,c[1]*.7,c[2]*.7]); }       // door, balcony
  rects.push([cx,cz,(x1-x0)/2,(z1-z0)/2]); }
function containerStack(m,rnd,x,y,z,yaw){ const cols=[[.8,.2,.15],[.15,.4,.7],[.9,.7,.1],[.2,.5,.3],[.85,.85,.85],[.5,.3,.2]]; const n=1+((rnd()*3)|0);
  for(let k=0;k<n;k++) orBox(m,x,z,6.2,2.5,y+k*2.55,y+k*2.55+2.5,yaw,cols[(rnd()*6)|0]); colliders.push([x,z,2.2]); }
function portalCrane(m,x,y,z){ const c=[.9,.45,.1], g=[.5,.5,.55]; for(const dx of [-9,9]) for(const dz of [-6,6]){ const b=Math.min(y,hAt(x+dx,z+dz))-.3; m.box(x+dx,(b+y+26)/2,z+dz,1,y+26-b,1,g); }   // each leg down to its own ground (the quay edge drops away)
  m.box(x,y+26,z,22,1.4,14,c); m.box(x,y+30,z-18,3,8,52,c); colliders.push([x-9,z-6,1.6],[x+9,z-6,1.6],[x-9,z+6,1.6],[x+9,z+6,1.6]); }
function cruiseShip(m,x,z,L){ const y=0; m.box(x,y+4,z,L,9,26,[.12,.2,.4]); for(let k=0;k<4;k++) m.box(x-L*.03,y+11+k*3.4,z,L*.82-k*L*.04,3.2,24-k*2,[.96,.96,.98]);
  m.box(x,y+25,z,L*.3,4,14,[.9,.9,.94]); cylY(m,x-L*.12,y+24,z,3.4,9,8,[.9,.5,.15],[.3,.3,.3]); m.tri([x+L/2,y,z-13],[x+L/2,y+9,z],[x+L/2+20,y+9,z],[.96,.96,.98],[x,y+5,z+30]); m.tri([x+L/2,y,z+13],[x+L/2,y+9,z],[x+L/2+20,y+9,z],[.96,.96,.98],[x,y+5,z-30]); }
function penguin(m,x,z,yaw){ const y=hAt(x,z), fx=Math.sin(yaw), fz=Math.cos(yaw); orBox(m,x,z,.7,.5,y,y+.9,yaw,[.08,.08,.1]); orBox(m,x+fx*.12,z+fz*.12,.5,.38,y+.1,y+.7,yaw,[.95,.95,.95]); m.box(x,y+1.05,z,.35,.3,.35,[.08,.08,.1]); }
function jacaranda(m,x,z,s){ const y=hAt(x,z); m.box(x,y+s*1.4,z,.4*s,2.8*s,.4*s,[.34,.26,.2]); m.rock(x,y+s*3,z,2.1*s,[.62,.44,.82],()=>.5); colliders.push([x,z,.5*s]); }

LEVELS.capetown={
  ai:['narrowRoad'],                     // opponent adjustments on top of the difficulty (LEVEL_AI_MULTIPLIERS, config.js)
  id:'capetown', seed:251, name:'DICER TOWN', sub:'Mind the corners!', go:'VUVUZELA.WAV',
  loc:'Cape Town, South Africa', flag:'za',
  blurb:'From the harbor into the narrow streets with blinds corners everywhere—this race provides the perfect balance of opportunity versus risk of slamming into a wall.',
  tw:20, sea:0, seaCol:[.1,.42,.74],
  theme:{
    skyTop:[0.20,0.46,0.92], skyHor:[0.84,0.92,1.0], fog:[0.76,0.86,0.96], fogN:90, fogF:760,
    amb:[.54,.52,.5], hemi:[.26,.27,.3], sun:[.76,.68,.52], light:[-.5,.7,-.3], night:false, snow:false,
    body:{yaw:2.4,y:.6,r:.05,col:[1,.97,.85]}, clouds:{col:[1,1,1],shade:[.8,.84,.94],amt:1},
    road:[.30,.30,.33], roadAlt:[.27,.27,.30], roadEdge:[.84,.84,.8], walk:[.64,.6,.56], walkAlt:[.58,.55,.52], ground:[.56,.52,.46], lawn:[.34,.58,.28], lawnAlt:[.4,.64,.3], fynbos:[.44,.5,.3], fynbosAlt:[.5,.5,.32], rock:[.58,.5,.42], cliff:[.4,.38,.37], sand:[.92,.84,.64], quay:[.62,.62,.64], quayAlt:[.55,.55,.58],
    dust:{road:[.72,.7,.66],off:[.7,.62,.5],ice:[.9,.95,1],a:.65,sz:.9},
    map:{bg:'rgba(180,170,150,0.95)',road:'#ffffff',edge:'#20201c'}
  },
  phys:{gripRoad:7.2,gripOff:5,gripIce:2,dragRoad:.12,dragOff:.45,dragIce:.05,maxOff:.8},
  rim:0,
  trackPts(){ return startNear(resampleClosed(filletLoop(CT_V.map(v=>[v[0],v[1]]),CT_V.map(v=>v[2]),10),M),-250,-320); },
  layout(){ return calmLayout([.05,.17,.3,.45,.6,.75,.9],[[.1,3,60],[.52,3,60]],.04,.07); },
  prepare(){ const raw=new Float32Array(M); for(let i=0;i<M;i++) raw[i]=ctLand(track[i].x,track[i].z)+.3; this.prof=smoothArr(raw,7); },
  profile(s){ return arrProfile(this.prof,s)+jumpsSum(s); },
  base(x,z,th,d){ const far=smooth(HALFW+2,40,d); return th*(1-far)+ctLand(x,z)*far; },
  iceAt(){ return false; },
  color(c){
    const T=THEME;
    if(c.d<HALFW){
      if(c.s<0.0035||c.s>0.9985) return [.95,.95,.95];
      if(c.d>HALFW-1.6) return T.roadEdge;
      return vnoise(c.cx*.25,c.cz*.25)>.55?T.roadAlt:T.road; }
    if(c.cz<CT_SEA-2) return c.hy<-1?[.1,.3,.5]:T.sand;
    if(c.cz<CT_SEA+16) return ((Math.floor(c.cx/6)+Math.floor(c.cz/6))&1)?T.quay:T.quayAlt;
    if(c.cz>290){ if(c.ny<.78) return vnoise(c.cx*.1,c.cz*.1)>.5?T.cliff:T.rock; return vnoise(c.cx*.05,c.cz*.05)>.5?T.fynbos:T.fynbosAlt; }
    if(Math.hypot((c.cx+25)/80,(c.cz+140)/85)<1) return vnoise(c.cx*.06,c.cz*.06)>.4?T.lawn:T.lawnAlt;                    // the park round the stadium
    if(c.hy>90&&c.cx<-330) return vnoise(c.cx*.05,c.cz*.05)>.5?T.fynbos:T.rock;
    if(c.d<HALFW+4) return T.walk;
    return ((Math.floor(c.cx/7)+Math.floor(c.cz/7))&1)?T.ground:T.walkAlt; },
  decor(m,rnd){
    const gateNear=(x,z,r)=>GATES.some(g=>Math.hypot(g.x-x,g.z-z)<r), inPark=(x,z)=>Math.hypot((x+25)/85,(z+140)/92)<1.05, usable=(x,z)=>z>CT_SEA+22&&z<255&&!inPark(x,z)&&Math.abs(x)<470;
    const centre=(x,z)=>Math.max(0,1-Math.hypot(x*.7,z+40)/330);
    // rows of houses along both sides of every street, so the road runs through a canyon with the corners hidden behind the walls
    for(const sg of [1,-1]) for(let i=0;i<M;){
      const w0=13+rnd()*11, d0=13+rnd()*10, adv=Math.max(2,Math.round((w0+2)/(TL/M))), im=(i+(adv>>1))%M, t=track[im]; i+=adv;
      const alongX=Math.abs(t.tx)>Math.abs(t.tz);
      for(const [w,dd,gap] of [[w0,d0,2.6],[w0*.55,d0*.7,2.6],[7,7,2.4]]){                             // inside a bend the full-size house doesn't fit: try a smaller one
        const [cx,cz]=roadside(im,sg,gap+dd/2), ww=alongX?w:dd, hd=alongX?dd:w, x0=cx-ww/2, x1=cx+ww/2, z0=cz-hd/2, z1=cz+hd/2;
        if(!usable(cx,cz)||[[x0,z0],[x1,z0],[x0,z1],[x1,z1]].some(([px,pz])=>nearestTrack(px,pz).d<HALFW+1.9)||rects.some(r=>Math.abs(r[0]-cx)<r[2]+ww/2+.3&&Math.abs(r[1]-cz)<r[3]+hd/2+.3)||gateNear(cx,cz,22)) continue;
        const k=rnd(), tall=centre(cx,cz); ctBuilding(m,rnd,x0,z0,x1,z1,11+rnd()*14+tall*(rnd()<.45?34:8),tall>.5&&k<.35?2:k<.12?1:k<.3?3:0); break; } }
    // the blocks behind them
    for(let gz=-330;gz<=250;gz+=42) for(let gx=-460;gx<=460;gx+=42){
      const x=gx+(rnd()-.5)*8, z=gz+(rnd()-.5)*8, w=18+rnd()*10, dd=18+rnd()*10, x0=x-w/2, x1=x+w/2, z0=z-dd/2, z1=z+dd/2, k=rnd();
      if(rnd()<.1||!usable(x,z)||[[x0,z0],[x1,z0],[x0,z1],[x1,z1],[x,z]].some(([px,pz])=>roadDist(px,pz)<HALFW+9)||rects.some(r=>Math.abs(r[0]-x)<r[2]+w/2+2&&Math.abs(r[1]-z)<r[3]+dd/2+2)) continue;
      const tall=centre(x,z); ctBuilding(m,rnd,x0,z0,x1,z1,13+rnd()*14+tall*(rnd()<.5?40:10),tall>.4&&k<.4?2:k<.2?3:k<.3?1:0); }
    // the stadium in the park: a white bowl with an open roof ring
    { const sx=-25, sz=-140, y=hAt(sx,sz), ring=[]; for(let k=0;k<24;k++){ const a=k/24*6.283, a2=(k+1)/24*6.283, r=34, p=[sx+Math.cos(a)*r*1.1,sz+Math.sin(a)*r], q=[sx+Math.cos(a2)*r*1.1,sz+Math.sin(a2)*r];
        m.prism(p[0],p[1],q[0],q[1],2.6,Math.min(y,hAt(p[0],p[1]),hAt(q[0],q[1]),hAt((p[0]+q[0])/2,(p[1]+q[1])/2))-1,y+14,k&1?[.94,.94,.96]:[.86,.88,.92]); m.prism(p[0],p[1],q[0],q[1],4.2,y+14,y+15.2,[.7,.74,.8]); ring.push(p); }
      wallRun(ring.concat([ring[0]]),2.6); }                                  // the wall itself is solid: the same 24 segments, as thick as it is drawn
    // street trees and lamps on the pavements, parked cars and minibus taxis at the kerb
    for(let i=0;i<M;i+=7){ const sg=((i/7)|0)&1?1:-1, [x,z]=roadside(i,sg,1.3), t=track[i]; if(!usable(x,z)||bendAt(i)>.02||gateNear(x,z,20)||roadDist(x,z)<HALFW+.9) continue;
      const r=rnd(); if(r<.3) jacaranda(m,x,z,.9+rnd()*.5); else if(r<.55) lampPost(m,x,z,6.5,[.3,.3,.34],[.96,.9,.7]); }
    for(let i=11;i<M;i+=31){ const sg=((i/31)|0)&1?1:-1, [x,z]=roadside(i,sg,2.4), t=track[i]; if(!usable(x,z)||bendAt(i)>.012||gateNear(x,z,24)||roadDist(x,z)<HALFW+1.6||rects.some(r=>Math.abs(r[0]-x)<r[2]+2.2&&Math.abs(r[1]-z)<r[3]+2.2)) continue;
      vehicleProp(m,x,hAt(x,z),z,Math.atan2(t.tx,t.tz),rnd()<.35?[.96,.96,.96]:CT_PASTEL[(rnd()*9)|0],rnd()<.35?'van':'car'); colliders.push([x,z,2.3]); }
    // the harbour: quay with container stacks and gantry cranes, a cruise liner, yachts, a lighthouse, and penguins by the start line
    for(let x=-420;x<=380;x+=14) for(let r=0;r<2;r++){ const z=CT_SEA+6+r*8; if(rnd()<.35||roadDist(x,z)<HALFW+3||gateNear(x,z,24)) continue; containerStack(m,rnd,x,hAt(x,z),z,rnd()<.5?0:Math.PI/2); }
    for(const x of [-160,40,200]) portalCrane(m,x,hAt(x,CT_SEA+10),CT_SEA+10);
    cruiseShip(m,60,-430,170); m.box(-380,0,-420,12,.6,8,[.9,.9,.9]);
    { const lx=-330, lz=CT_SEA-8, y=hAt(lx,lz)-1; for(let k=0;k<3;k++) frustum(m,lx,y+k*8,lz,4.2-k*.5,3.7-k*.5,8,8,k&1?[.95,.95,.95]:[.85,.15,.12],[.5,.5,.5]); m.em=true; m.box(lx,y+25,lz,3,2,3,[1,.95,.6]); m.em=false; m.cone(lx,y+27,lz,2.6,2,8,[.85,.15,.12]); colliders.push([lx,lz,4.5]); }
    for(let k=0;k<9;k++) penguin(m,-300+rnd()*30,CT_SEA+16+rnd()*5,rnd()*6.28);
    // Table Mountain: the tablecloth of cloud spilling over the edge, the cable car above the city
    for(let k=0;k<34;k++){ const x=-500+k*30+rnd()*12, z=420+rnd()*40, y=236+rnd()*26-(z>440?12:0); m.rock(x,y,z,12+rnd()*16,[.97,.97,.99],rnd); }
    { const a=[40,hAt(40,290)+6,285], b=[70,hAt(70,430)+2,435]; strut(m,a,b,.2,.2,[.2,.2,.22]); const f=.55, cx=lerp(a[0],b[0],f), cy=lerp(a[1],b[1],f)-3, cz=lerp(a[2],b[2],f); m.box(cx,cy,cz,6,4,6,[.9,.2,.18]); m.box(cx,cy+2.4,cz,1,1.4,1,[.2,.2,.22]); }
    // yachts in the harbour
    for(let k=0;k<7;k++){ const x=-380+k*95+rnd()*40, z=CT_SEA-40-rnd()*80; if(Math.hypot(x-60,z+430)<120) continue; orBox(m,x,z,10,3.2,.2,1.6,rnd()*3,[.96,.96,.96]); m.box(x,6,z,.2,10,.2,[.9,.9,.9]); }
  },
  ocean(m){
    const S=24, E=528;
    for(let ix=-E;ix<E;ix+=S) for(let iz=-E;iz<CT_SEA+30;iz+=S){ const k=((ix+iz)/S&1)?.96:1, d=CT_SEA-iz, c=d<30?[.34,.74,.84]:d<110?[.16,.56,.8]:[.1,.42,.74];
      m.quad([ix,0,iz],[ix+S,0,iz],[ix+S,0,iz+S],[ix,0,iz+S],[c[0]*k,c[1]*k,c[2]*k],'up'); } },
  marks(m){ for(let i=0;i<M;i++){ if(i%8<4) markStrip(m,i,i+1,0,.2,[.95,.85,.25]); markStrip(m,i,i+1,HALFW-1.4,.14,[.92,.92,.9]); markStrip(m,i,i+1,-(HALFW-1.4),.14,[.92,.92,.9]); } },
  mapBg(g,X,Z,sc){ g.fillStyle='#4a8fc0'; g.fillRect(X(-540),Z(-540),1080*sc,(540+CT_SEA)*sc); g.fillStyle='#9a8a74'; g.fillRect(X(-540),Z(290),1080*sc,250*sc);
    g.fillStyle='rgba(90,160,80,0.7)'; g.beginPath(); g.ellipse(X(-25),Z(-140),85*sc,92*sc,0,0,7); g.fill(); g.fillStyle='#f0f0f4'; g.beginPath(); g.ellipse(X(-25),Z(-140),38*sc,34*sc,0,0,7); g.fill();
    g.fillStyle='rgba(120,100,90,0.35)'; for(let gz=-330;gz<=250;gz+=42) for(let gx=-460;gx<=460;gx+=42) if(((gx+gz)/42&1)) g.fillRect(X(gx),Z(gz),22*sc,22*sc); }
};
