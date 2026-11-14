'use strict';
// Level: Carrier Wave.
// ---------------- AIRCRAFT CARRIER (traced from a photo of a real carrier, bow to the west, island on the north edge) ----------------
// The deck is a real outline, not a rectangle: a narrow bow, the angled landing deck jutting out to port (south), the port elevator sponson at the stern.
// The buildings stand on the edges and the ship's centre line is full of parked jets, so the road winds round them: down the angled deck (the long straight),
// round the bow with a line of jets between the lanes, in and out of the centre-line groups, through the gap under the island, round the stern and out onto the elevator.
const CV={Y:14};                                               // deck height above the sea
const CV_ROAD_LIFT=.03;                                        // the road and the painted digits above the deck (see marks)
const CV_DECK=[[-490,-46],[-250,-84],[-212,-128],[-193,-131],[95,-131],[395,-131],[479,-92],[496,-78],[492,53],[395,84],[395,125],[-179,130],[-265,72],[-490,52]];
// the road: corners [x,z,radius] in driving order, starting at the east end of the angled deck
const CV_V=[[322,8,18],[118,42,20],[78,98,20],[8,98,20],[-24,64,20],[-195,104,24],[-300,30,46],[-474,22,18],[-474,-20,18],[-232,-34,26],[-186,-102,20],[-122,-102,20],[-36,26,18],[22,26,18],[66,-58,20],[262,-52,20],[292,-108,20],[398,-108,22],[468,-52,24],[468,24,24],[388,44,22],[345,104,22],[226,104,17],[226,70,17],[322,58,18]];
// Tie-down lines: low solid kerbs on the deck that the jets are chained along. On a flat deck a road can be cut anywhere, so these close the middle of the loop
// (the centre line from the bow to the stern, with a branch into every finger of it) and the two bays outside it: the only way round is the road.
const CV_KERBS=[
  [[-459,0],[-300,0],[-150,-24],[-58,34],[0,47],[46,43],[100,10],[230,-8],[345,-30],[456,-12]],   // the centre line
  [[46,43],[46,84]],                                           // a stub that breaks up the long angled straight
  [[-150,-24],[-152,-88]],                                     // forces the road up to the starboard side
  [[-6,-129],[-6,12]],                                           // and a rank right across the deck forces it back down, round the end of the rank
  [[345,-30],[348,-94]],                                       // the bulge north of the stern
  [[345,-30],[352,42],[333,85],[240,87]],                      // the finger between the lanes of the elevator hairpin
  [[309,32],[205,50],[200,129]],
  [[-6,-74],[118,-74]]];                                       // closes the dead-end bay between the rank and the island                              // the finger between the U-turn's lanes, closed down to the port rail
const CV_ELEV=[[252,84,396,126],[270,-132,396,-96]];           // the aircraft elevators, on the terrain grid: [x0,z0,x1,z1]
// parked jets: [x,z,yaw] (yaw 0 = nose to +z). jetLine sets them along a polyline, every `pitch` units, turned by `turn` from its direction, `off` to the side
const CV_JETS=[];
function jetLine(pts,pitch,off,turn){ let d=pitch/2;
  for(let k=0;k<pts.length-1;k++){ const a=pts[k], b=pts[k+1], ex=b[0]-a[0], ez=b[1]-a[1], l=Math.hypot(ex,ez), ux=ex/l, uz=ez/l;
    for(;d<l;d+=pitch) CV_JETS.push([a[0]+ux*d+uz*off,a[1]+uz*d-ux*off,Math.atan2(ux,uz)+turn]);
    d-=l; } }
for(const K of CV_KERBS) jetLine(K,33,0,0);                    // nose to tail along the tie-down lines (moved beside them in decor)
const CV_KERB_JETS=CV_JETS.length, CV_KERB_SIDE=[6,8,10];             // (the jets before this index belong to a kerb, and are parked CV_KERB_SIDE to one side of it, see decor)
jetLine([[-180,-116],[0,-116]],36,0,.55); jetLine([[14,-116],[110,-116]],36,0,.55);   // herringbone along the starboard edge, as in the photo
jetLine([[270,-122],[400,-122]],36,0,.55);
jetLine([[-168,112],[190,112]],36,0,-.55);                     // and along the port edge under the angled deck
jetLine([[-130,20],[-90,44]],26,0,1.2); jetLine([[90,14],[130,14]],28,0,-1);
jetLine([[400,0],[440,20]],26,0,1); jetLine([[380,-60],[430,-50]],26,0,-.8);
function cvInside(x,z){ let c=false; const P=CV_DECK; for(let i=0,j=P.length-1;i<P.length;j=i++){ const a=P[i], b=P[j]; if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0]) c=!c; } return c; }
// the nearest point of the deck's outline: [x,z,distance]
function cvEdge(x,z){ let best=null, bd=1e18; const P=CV_DECK; for(let i=0;i<P.length;i++){ const a=P[i], b=P[(i+1)%P.length], ex=b[0]-a[0], ez=b[1]-a[1], u=clamp(((x-a[0])*ex+(z-a[1])*ez)/(ex*ex+ez*ez),0,1), px=a[0]+ex*u, pz=a[1]+ez*u, d=Math.hypot(x-px,z-pz); if(d<bd){ bd=d; best=[px,pz,d]; } } return best; }
// half width of the hull at the waterline: the deck overhangs it, and the bow comes to a point
function cvHullW(x){ return x<-340?lerp(10,62,smooth(-500,-340,x)):x<-180?lerp(62,88,smooth(-340,-180,x)):x<360?88:lerp(88,58,smooth(360,500,x)); }
// a naval fighter parked on the deck, heading yaw, s times the size of the old model: fuselage, nose, canopy, swept wings, twin tail fins, stabilisers, undercarriage
function jet(m,x,z,yaw,col,s){
  s=s||1.5; const y=CV.Y, fx=Math.sin(yaw)*s, fz=Math.cos(yaw)*s, lx=Math.cos(yaw)*s, lz=-Math.sin(yaw)*s, g=[.58,.6,.65], dark=[.14,.15,.18];
  orBox(m,x,z,12*s,1.9*s,y+1.1*s,y+2.9*s,yaw,col);
  strut(m,[x+fx*6,y+2*s,z+fz*6],[x+fx*10.2,y+1.95*s,z+fz*10.2],.95*s,.12*s,col);
  orBox(m,x+fx*2.6,z+fz*2.6,3.4*s,1.1*s,y+2.9*s,y+3.7*s,yaw,[.1,.2,.32]);
  for(const sg of [-1,1]){
    m.prism(x+fx*1.6+lx*sg*.9,z+fz*1.6+lz*sg*.9,x-fx*3.4+lx*sg*7,z-fz*3.4+lz*sg*7,1.5*s,y+1.5*s,y+1.85*s,g);                     // wings
    m.prism(x-fx*5.3+lx*sg*.9,z-fz*5.3+lz*sg*.9,x-fx*6.6+lx*sg*3.6,z-fz*6.6+lz*sg*3.6,.9*s,y+1.7*s,y+2*s,g);                       // stabilisers
    orBox(m,x-fx*4.6+lx*sg*1.3,z-fz*4.6+lz*sg*1.3,2.8*s,.26*s,y+2.8*s,y+6.2*s,yaw,col);                                            // tail fins
    orBox(m,x-fx*5.5+lx*sg*1.1,z-fz*5.5+lz*sg*1.1,2.2*s,.9*s,y+1.1*s,y+2.2*s,yaw,dark);                                             // exhausts
    orBox(m,x+fx*1.6+lx*sg*1.9,z+fz*1.6+lz*sg*1.9,3*s,.9*s,y+.9*s,y+2.1*s,yaw,g); }                                                  // intakes
  for(const [a,l] of [[4.5,0],[-1.5,-1.6],[-1.5,1.6]]) m.box(x+fx*a+lx*l,y+.45*s,z+fz*a+lz*l,.5*s,.9*s,.5*s,dark);
  // the outline of what reaches down to the deck (nose, intakes, undercarriage, exhausts) is one closed wall; the wings and the tail
  // planes are higher than a car, which drives under them
  const H=CV_JET_SOLID.map(([a,l])=>[x+fx*a+lx*l,z+fz*a+lz*l]); wallRun(H.concat([H[0]]),.3); }
// a jet's solid outline and the tips of its wings and stabilisers (which a car passes under), in model units: [forward, left]
const CV_JET_SOLID=[[10.3,0],[6,1],[3.1,2.4],[-1.8,2.4],[-4.4,1.6],[-6.7,1.6],[-6.7,-1.6],[-4.4,-1.6],[-1.8,-2.4],[3.1,-2.4],[6,-1]];
const CV_JET_TIPS=[[-4.5,7.8],[-4.5,-7.8],[-7.2,3.6],[-7.2,-3.6]];
// parked close to the road: the solid outline at least CV_NEAR.solid off the road's edge, the wing tips at most CV_NEAR.wing over it.
// A loose jet whose outline is within CV_NEAR.reach of the edge, with no kerb between it and the road, is pushed towards the road until one of the two binds.
// Two of the starboard and port rows stay where they are (stay): pushed in, they took ground the opponents use to swing wide, and slowed them.
const CV_NEAR={solid:2,wing:2.5,reach:22,stay:[[-90,-116],[102,112]]};
// jets parked on the outside of bends, with no fence: [x,z,yaw]. Each was checked against the opponents' planned line (cutLine, aicuts.js), which must not change:
// a jet where they swing wide or cut across makes them drive round it, so move one only after checking again.
const CV_BEND_JETS=[[84,48,-.07],[-199,72,.96],[-255,-57,1.63],[264,-106,2.65],[445,-31,3.14],[20,74,1.57],[-169,-77,5.24]];
// a utility helicopter with its rotor turning (blades are thin flat slabs)
function heli(m,x,y,z,yaw,col){
  const fx=Math.sin(yaw), fz=Math.cos(yaw);
  orBox(m,x,z,5.6,2.2,y+.9,y+3.2,yaw,col); orBox(m,x+fx*2,z+fz*2,2,2.1,y+1.6,y+3.1,yaw,[.1,.2,.3]);
  orBox(m,x-fx*5.2,z-fz*5.2,5.6,.6,y+2.4,y+3,yaw,col); orBox(m,x-fx*7.7,z-fz*7.7,.4,.5,y+2.6,y+4.6,yaw,col);
  m.box(x,y+3.5,z,.5,.6,.5,[.2,.2,.22]);
  for(let k=0;k<4;k++){ const a=yaw+k*Math.PI/2+.5; m.prism(x,z,x+Math.sin(a)*7.2,z+Math.cos(a)*7.2,.3,y+3.75,y+3.82,[.12,.12,.14]); }
  for(const sg of [-1,1]) orBox(m,x+fz*sg*1.1,z-fx*sg*1.1,4.4,.25,y+.2,y+.45,yaw,[.2,.2,.22]);
  colliders.push([x,z,2.6],[x-fx*4,z-fz*4,1.2]); }
// a yellow deck tractor, a fuel truck or a crate stack
function deckTractor(m,x,y,z,yaw){ orBox(m,x,z,3.2,1.9,y+.5,y+1.5,yaw,[.95,.8,.1]); orBox(m,x-Math.sin(yaw)*.3,z-Math.cos(yaw)*.3,1.4,1.7,y+1.5,y+2.5,yaw,[.95,.8,.1]); orBox(m,x,z,3.2,2,y,y+.5,yaw,[.1,.1,.12]); colliders.push([x,z,1.9]); }
function fuelTruck(m,x,y,z,yaw){ const fx=Math.sin(yaw), fz=Math.cos(yaw);
  orBox(m,x-fx*1.2,z-fz*1.2,6,2.4,y+.7,y+2.9,yaw,[.82,.84,.86]); orBox(m,x+fx*3.3,z+fz*3.3,2,2.4,y+.5,y+2.8,yaw,[.2,.55,.3]); orBox(m,x,z,8.4,2.4,y,y+.7,yaw,[.1,.1,.12]);
  colliders.push([x-fx*2.4,z-fz*2.4,1.8],[x+fx*.4,z+fz*.4,1.8],[x+fx*3.3,z+fz*3.3,1.6]); }
function crates(m,rnd,x,y,z){ const cols=[[.35,.42,.3],[.5,.38,.2],[.3,.34,.42]]; for(let k=0;k<3;k++){ const cx=x+(k-1)*2.9, h=1.6+((rnd()*2)|0)*1.5; m.box(cx,y+h/2,z,2.6,h,2.6,cols[(rnd()*3)|0]); colliders.push([cx,z,1.8]); } }
// the island: the tower on the starboard edge - tiered bridge, glass bands, mast, radar and a funnel, s times the base size
function carrierIsland(m,x,z,s){
  const y=CV.Y, G=[.62,.65,.7], G2=[.55,.58,.63], glass=[.12,.2,.28];
  m.box(x,y+8*s,z,56*s,16*s,17*s,G); m.box(x+5*s,y+19*s,z,38*s,6*s,15*s,G2); m.box(x+8*s,y+26*s,z,24*s,8*s,12*s,G);
  for(const sg of [-1,1]){ m.box(x+5*s,y+19.5*s,z+sg*7.6*s,36*s,2.2*s,.3,glass); m.box(x+8*s,y+26.3*s,z+sg*6.1*s,22*s,2.6*s,.3,glass); m.box(x-10*s,y+9*s,z+sg*8.7*s,30*s,2*s,.3,glass); }
  m.box(x+20*s,y+19.5*s,z,.3,2.2*s,14.8*s,glass);
  cylY(m,x-18*s,y+16*s,z,3.6*s,9*s,8,[.5,.52,.56],[.2,.2,.22]);                                                         // funnel
  m.box(x+8*s,y+36*s,z,s,12*s,s,[.7,.7,.74]); m.box(x+8*s,y+42.5*s,z,14*s,.6*s,.8*s,[.7,.7,.74]); m.box(x+8*s,y+40*s,z,.5*s,.5*s,10*s,[.7,.7,.74]);   // mast and yards
  m.box(x-6*s,y+31*s,z+2*s,7*s,.8*s,.6*s,[.74,.76,.8]); m.box(x-6*s,y+29*s,z+2*s,s,3*s,s,[.5,.5,.55]);                   // radar
  m.box(x-12*s,y+34*s,z-3*s,2.2*s,6*s,2.2*s,[.8,.8,.84]); dome(m,x-12*s,y+37*s,z-3*s,2.4*s,[.92,.92,.94],8,3);
  rects.push([x,z,28*s,8.8*s]); }
// a tie-down kerb along the polyline K: low, striped, one solid strip
function cvKerb(m,K){ const h=CV.Y+1.3, w=.5, Y=[.95,.8,.1], D=[.14,.14,.15]; wallRun(K,.5);
  for(let i=0;i<K.length-1;i++){ const a=K[i], b=K[i+1], ex=b[0]-a[0], ez=b[1]-a[1], l=Math.hypot(ex,ez), n=Math.max(1,Math.round(l/7)), nx=-ez/l*w, nz=ex/l*w, o=[(a[0]+b[0])/2,CV.Y-20,(a[1]+b[1])/2];
    for(let k=0;k<n;k++){ const x0=a[0]+ex*k/n, z0=a[1]+ez*k/n, x1=a[0]+ex*(k+1)/n, z1=a[1]+ez*(k+1)/n, c=k&1?D:Y;
      m.quad([x0+nx,h,z0+nz],[x1+nx,h,z1+nz],[x1-nx,h,z1-nz],[x0-nx,h,z0-nz],c,'up');
      for(const sg of [-1,1]) m.quad([x0+nx*sg,CV.Y,z0+nz*sg],[x1+nx*sg,CV.Y,z1+nz*sg],[x1+nx*sg,h,z1+nz*sg],[x0+nx*sg,h,z0+nz*sg],c,[(x0+x1)/2-nx*sg,h/2,(z0+z1)/2-nz*sg]); } } }
// a distant escort ship on the sea (just scenery)
function frigate(m,x,z,yaw,col){
  const fx=Math.sin(yaw), fz=Math.cos(yaw), y=0, g=col||[.55,.58,.62];
  orBox(m,x,z,92,13,y-2,y+5,yaw,g); strut(m,[x+fx*46,y+1.5,z+fz*46],[x+fx*62,y+3,z+fz*62],6.5,1.5,g);
  orBox(m,x-fx*4,z-fz*4,34,9,y+5,y+13,yaw,[.64,.67,.7]); orBox(m,x-fx*4,z-fz*4,20,9.2,y+13,y+17,yaw,[.5,.54,.6]);
  m.box(x-fx*4,y+25,z-fz*4,1.2,16,1.2,[.7,.7,.74]); cylY(m,x-fx*18,y+13,z-fz*18,3,6,8,[.45,.47,.5],[.2,.2,.22]);
  orBox(m,x+fx*28,z+fz*28,6,5,y+5,y+8,yaw,[.5,.52,.56]); m.box(x+fx*34,y+8.5,z+fz*34,.8,.8,9,[.4,.4,.44]); }
// a line of seven-segment digits painted flat on the deck, reading along +x with the top towards -z (north on the map)
function paintDigits(m,x,z,txt,s,col){
  const SEG={'6':'afgedc','8':'abcdefg','0':'abcdef'}, w=s*.52, h=s, t=s*.15, adv=s*.82;
  const R=(cx,cz,u0,u1,v0,v1)=>{ const P=(u,v)=>[cx+u,hAt(cx+u,cz-v)+CV_ROAD_LIFT,cz-v]; m.quad(P(u0,v0),P(u1,v0),P(u1,v1),P(u0,v1),col,'up'); };
  [...txt].forEach((ch,k)=>{ const cx=x+(k-(txt.length-1)/2)*adv, on=SEG[ch]||'';
    const S={a:[-w/2,w/2,h/2-t,h/2],d:[-w/2,w/2,-h/2,-h/2+t],g:[-w/2,w/2,-t/2,t/2],f:[-w/2,-w/2+t,0,h/2],b:[w/2-t,w/2,0,h/2],e:[-w/2,-w/2+t,-h/2,0],c:[w/2-t,w/2,-h/2,0]};
    for(const k2 of on) R(cx,z,...S[k2]); }); }

LEVELS.carrier={
  ai:['easierTurns'],                    // opponent adjustments on top of the difficulty (LEVEL_AI_MULTIPLIERS, config.js)
  id:'carrier', seed:211, name:'CARRIER WAVE', sub:'Mind the jets!', go:'TAKEOFF!',
  loc:'Indian Ocean', flag:'earthio',
  blurb:"Deployed for months aboard an aircraft carrier, you may experience weird ideas—like \"What if we recreated the Ultimate Racetrack ad in real life?\" Turns out it's actually pretty fun.",
  tw:20, sea:0, seaCol:[.06,.22,.52],
  theme:{
    skyTop:[0.20,0.46,0.88], skyHor:[0.80,0.90,0.98], fog:[0.72,0.86,0.96], fogN:240, fogF:1250,
    amb:[.52,.52,.56], hemi:[.26,.28,.32], sun:[.70,.64,.52], light:[.35,.8,.3], night:false, snow:false,
    body:{yaw:-.5,y:.62,r:.05,col:[1,.97,.85]}, clouds:{col:[1,1,1],shade:[.78,.82,.92],amt:1},
    road:[.17,.18,.21], roadAlt:[.15,.16,.19], deck:[.36,.39,.44], deckAlt:[.34,.37,.42], bed:[.08,.22,.42],
    dust:{road:[.7,.7,.72],off:[.66,.68,.7],ice:[.9,.95,1],a:.55,sz:.9},
    map:{bg:'rgba(30,96,160,0.95)',road:'#f2f2f2',edge:'#10151c'}
  },
  phys:{gripRoad:7.2,gripOff:4.6,gripIce:2,dragRoad:.12,dragOff:.45,dragIce:.05,maxOff:.85},
  hitMul:1.35,                                                 // parked aircraft are expensive
  rim:0,
  trackPts(){ return startNear(resampleClosed(filletLoop(CV_V.map(v=>[v[0],v[1]]),CV_V.map(v=>v[2]),10),M),170,38); },
  layout(){ return calmLayout([.13,.24,.34,.47,.6,.72,.86],[[.1,3.5,50]],.02,.03); },
  prepare(){},
  profile(s){ return CV.Y+jumpsSum(s); },
  base(x,z,th,d){ const far=smooth(HALFW+2,30,d); return (cvInside(x,z)||cvEdge(x,z)[2]<9)?th*(1-far)+CV.Y*far:-8; },
  clipTerrain(x,z){ return cvInside(x,z)?null:cvEdge(x,z); },
  iceAt(){ return false; },
  color(c){                                                     // (the road itself is drawn exactly, in marks: on a diagonal the terrain cells would give it a saw-tooth edge)
    const T=THEME, E=CV_ELEV.find(e=>c.cx>=e[0]&&c.cx<=e[2]&&c.cz>=e[1]&&c.cz<=e[3]);
    if(E) return (c.cx<E[0]+6||c.cx>E[2]-6||c.cz<E[1]+6||c.cz>E[3]-6)?[.5,.5,.42]:[.41,.44,.48];
    return ((Math.floor(c.cx/12)+Math.floor(c.cz/12))&1)?T.deck:T.deckAlt; },
  decor(m,rnd){
    const Y=CV.Y, P=CV_DECK, n=P.length;
    const free=(x,z,r)=>roadDist(x,z)>HALFW+r+2, gateNear=(x,z,r)=>GATES.some(g=>Math.hypot(g.x-x,g.z-z)<r);
    // the deck's edge is a solid rail all the way round; below it the skirt, the underside of the overhang and the narrower hull
    wallRun(P.concat([P[0]]),.6);
    const hull=[.46,.5,.55], under=[.3,.33,.37], red=[.5,.16,.14], skirt=[.38,.42,.47];
    for(let i=0;i<n;i++){ const a=P[i], b=P[(i+1)%n];
      m.prism(a[0],a[1],b[0],b[1],.5,Y,Y+1.8,[.62,.64,.68]); m.prism(a[0],a[1],b[0],b[1],.56,Y+1.8,Y+2.1,[.95,.8,.1]);
      const l=Math.hypot(b[0]-a[0],b[1]-a[1]), k=Math.max(1,Math.round(l/12));
      for(let j=0;j<k;j++){ const u0=j/k, u1=(j+1)/k, x0=lerp(a[0],b[0],u0), z0=lerp(a[1],b[1],u0), x1=lerp(a[0],b[0],u1), z1=lerp(a[1],b[1],u1), w0=cvHullW(x0), w1=cvHullW(x1), hz0=clamp(z0,-w0,w0), hz1=clamp(z1,-w1,w1), ax0=Math.max(x0,-500), ax1=Math.max(x1,-500);
        m.quad([x0,Y-3.5,z0],[x1,Y-3.5,z1],[x1,Y,z1],[x0,Y,z0],skirt,[0,Y,0]);
        m.quad([x0,Y-3.5,z0],[x1,Y-3.5,z1],[ax1,Y-3.5,hz1],[ax0,Y-3.5,hz0],under,[0,Y+9,0]);
        m.quad([ax0,Y-3.5,hz0],[ax1,Y-3.5,hz1],[ax1,1.6,hz1],[ax0,1.6,hz0],hull,[0,Y,0]);
        m.quad([ax0,1.6,hz0],[ax1,1.6,hz1],[ax1,-3,hz1],[ax0,-3,hz0],red,[0,Y,0]); } }
    // the island with its radar and mast
    carrierIsland(m,170,-86,1.9);
    const G=[.5,.53,.58]; m.box(170,Y+5,-117,150,10,28,G); rects.push([170,-117,75,14]);                  // its base runs out to the deck edge: the road passes right under it
    // the tie-down lines and the jets chained along them
    for(const K of CV_KERBS) cvKerb(m,K);
    const colA=[[.56,.6,.66],[.5,.54,.6],[.62,.64,.68]], parked=[];
    const JS=1.9, fits=(x,z,yaw)=>[[10.5,0],[-4.5,7.8],[-4.5,-7.8],[-7.2,3],[-7.2,-3],[0,0]].every(([a,l])=>{ const px=x+(Math.sin(yaw)*a+Math.cos(yaw)*l)*JS, pz=z+(Math.cos(yaw)*a-Math.sin(yaw)*l)*JS; return roadDist(px,pz)>HALFW+4&&cvInside(px,pz)&&cvEdge(px,pz)[2]>2.5; });
    const kerbD=(x,z)=>{ let b=1e9; for(const K of CV_KERBS) for(let i=0;i<K.length-1;i++){ const p=K[i], q=K[i+1], ex=q[0]-p[0], ez=q[1]-p[1], u=clamp(((x-p[0])*ex+(z-p[1])*ez)/(ex*ex+ez*ez),0,1); b=Math.min(b,Math.hypot(x-p[0]-ex*u,z-p[1]-ez*u)); } return b; };
    // jets close to the road (CV_NEAR): exact distance to the road's centre line, and the nearest point on it
    const roadAt=(x,z)=>{ let b=1e9, bx=0, bz=0; for(let i=0;i<M;i++){ const a=track[i], q=track[(i+1)%M], ex=q.x-a.x, ez=q.z-a.z, u=clamp(((x-a.x)*ex+(z-a.z)*ez)/(ex*ex+ez*ez),0,1), px=a.x+ex*u, pz=a.z+ez*u, d=Math.hypot(x-px,z-pz); if(d<b){ b=d; bx=px; bz=pz; } } return [b,bx,bz]; };
    const jetPts=(x,z,yaw,L)=>L.map(([a,l])=>[x+(Math.sin(yaw)*a+Math.cos(yaw)*l)*JS,z+(Math.cos(yaw)*a-Math.sin(yaw)*l)*JS]);
    const onDeck=p=>cvInside(p[0],p[1])&&cvEdge(p[0],p[1])[2]>2.5&&GATES.every(g=>Math.hypot(g.x-p[0],g.z-p[1])>HALFW+6)&&!rects.some(q=>Math.abs(q[0]-p[0])<q[2]+1&&Math.abs(q[1]-p[1])<q[3]+1)&&colliders.every(c=>Math.hypot(c[0]-p[0],c[1]-p[1])>c[2]+3);
    const bodyFree=(x,z,yaw)=>{ for(let a=-6.7;a<=10.3;a+=1) for(let l=-2.4;l<=2.4;l+=.8) if(kerbD(x+(Math.sin(yaw)*a+Math.cos(yaw)*l)*JS,z+(Math.cos(yaw)*a-Math.sin(yaw)*l)*JS)<1.4) return false; return true; };   // no kerb under the fuselage
    const nearOk=(x,z,yaw)=>bodyFree(x,z,yaw)&&!parked.some(p=>Math.hypot(p[0]-x,p[1]-z)<26)
      &&jetPts(x,z,yaw,CV_JET_SOLID).every(p=>onDeck(p)&&kerbD(p[0],p[1])>1.5&&roadAt(p[0],p[1])[0]>HALFW+CV_NEAR.solid)
      &&jetPts(x,z,yaw,CV_JET_TIPS).every(p=>onDeck(p)&&roadAt(p[0],p[1])[0]>HALFW-CV_NEAR.wing);
    const cross=(a,b,c,d)=>{ const s=(p,q,r)=>Math.sign((q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0])); return s(a,b,c)!==s(a,b,d)&&s(c,d,a)!==s(c,d,b); };
    const fenced=(a,b)=>CV_KERBS.some(K=>K.some((p,i)=>i>0&&cross(a,b,K[i-1],p)));
    // push a jet straight towards the nearest road until it is as close as CV_NEAR allows; one too far away, or with a kerb in between, stays put
    const hug=(x,z,yaw)=>{ if(Math.min(...jetPts(x,z,yaw,CV_JET_SOLID).map(p=>roadAt(p[0],p[1])[0]))>HALFW+CV_NEAR.reach) return [x,z];
      const [d,rx,rz]=roadAt(x,z); if(fenced([x,z],[rx,rz])) return [x,z];
      const ux=(rx-x)/d, uz=(rz-z)/d; let t=0; while(t<d&&nearOk(x+ux*(t+.5),z+uz*(t+.5),yaw)) t+=.5; return [x+ux*t,z+uz*t]; };
    CV_BEND_JETS.forEach(([x,z,yaw],k)=>{ if(nearOk(x,z,yaw)){ jet(m,x,z,yaw,colA[k%3],JS); parked.push([x,z]); } });   // (colours not from rnd, so the props placed after them stay where they were)
    // a jet of a tie-down line is parked beside its kerb, not on it: moved sideways by the first of CV_KERB_SIDE that fits, to the side away from the road, so the kerb stands between them
    const beside=(x,z,yaw)=>{ let best=null; for(const off of CV_KERB_SIDE) for(const sg of [-1,1]){ if(best&&off>best[3]) break; const px=x+Math.cos(yaw)*sg*off, pz=z-Math.sin(yaw)*sg*off, S=jetPts(px,pz,yaw,CV_JET_SOLID);
        if(!fits(px,pz,yaw)||gateNear(px,pz,20)||parked.some(p=>Math.hypot(p[0]-px,p[1]-pz)<24)||!bodyFree(px,pz,yaw)||!S.every(onDeck)) continue;
        const r=Math.min(...S.map(p=>roadAt(p[0],p[1])[0])); if(!best||r>best[2]) best=[px,pz,r,off]; } return best; };
    for(let k=0;k<CV_JETS.length;k++){ let [x,z,yaw]=CV_JETS[k]; if(!fits(x,z,yaw)||gateNear(x,z,20)) continue; const col=colA[(rnd()*3)|0];
      if(k<CV_KERB_JETS){ const b=beside(x,z,yaw); if(!b) continue; [x,z]=b; } else { if(!CV_NEAR.stay.some(p=>Math.hypot(p[0]-x,p[1]-z)<1)) [x,z]=hug(x,z,yaw); if(!bodyFree(x,z,yaw)){ const b=beside(x,z,yaw); if(!b) continue; [x,z]=b; } }
      jet(m,x,z,yaw,col,JS); parked.push([x,z]); }
    // tractors, trucks, crates, helicopters and loose planes fill what is left; never on the road or a kerb
    const spot=(x,z,r)=>cvInside(x,z)&&cvEdge(x,z)[2]>r+2&&free(x,z,r)&&kerbD(x,z)>r+1&&!parked.some(p=>Math.hypot(p[0]-x,p[1]-z)<r+11)&&!gateNear(x,z,r+8)&&!rects.some(q=>Math.abs(q[0]-x)<q[2]+r&&Math.abs(q[1]-z)<q[3]+r);
    for(const [x,z,yaw] of [[-405,26,.4],[60,-100,-.5],[255,-68,1.1],[-60,104,1.4],[-250,50,.7],[140,92,2],[-350,-58,.2]]) if(spot(x,z,8)) heli(m,x,Y,z,yaw,[.34,.4,.36]);
    for(let k=0,L=0;k<60&&L<12;k++){ const x=-470+rnd()*940, z=-125+rnd()*250, yaw=rnd()*6.28; if(spot(x,z,16)&&fits(x,z,yaw)){ const [hx,hz]=hug(x,z,yaw); jet(m,hx,hz,yaw,colA[(rnd()*3)|0],JS); parked.push([hx,hz]); L++; } }
    const small=[];
    for(let k=0;k<260;k++){ const x=-480+rnd()*960, z=-128+rnd()*256; if(!spot(x,z,5)||!free(x,z,13)||small.some(p=>Math.hypot(p[0]-x,p[1]-z)<13)) continue;
      small.push([x,z]); const r=rnd(); if(r<.45) deckTractor(m,x,Y,z,rnd()*6.28); else if(r<.8) fuelTruck(m,x,Y,z,rnd()*6.28); else crates(m,rnd,x,Y,z); }
    // on the edges: gun and missile mounts, and masts on the outside of the rail
    for(const [x,z] of [[-430,-44],[-440,40],[-232,-92],[-120,122],[-20,120],[415,-112],[455,-92],[480,-60],[478,44],[405,70]]) if(free(x,z,3.5)){ m.box(x,Y+1.6,z,5,3.2,5,[.6,.63,.68]); dome(m,x,Y+3.2,z,2.3,[.93,.93,.95],8,3); m.box(x,Y+5,z,.7,3,.7,[.5,.5,.55]); colliders.push([x,z,3.2]); }
    for(let i=0;i<n;i++){ const a=P[i], b=P[(i+1)%n], l=Math.hypot(b[0]-a[0],b[1]-a[1]), ox=(b[1]-a[1])/l*1.6, oz=-(b[0]-a[0])/l*1.6, sg=cvInside((a[0]+b[0])/2+ox,(a[1]+b[1])/2+oz)?-1:1;
      for(let d=30;d<l-10;d+=95){ const x=a[0]+(b[0]-a[0])*d/l+ox*sg, z=a[1]+(b[1]-a[1])*d/l+oz*sg; m.box(x,Y+5,z,.6,10,.6,[.7,.7,.74]); m.box(x,Y+10.4,z,3.2,.9,1.2,[.82,.82,.86]); m.box(x,Y-2,z,6,2.6,6*.4,[.9,.45,.1]); } }
    // escort ships and the distant fleet on the sea
    for(const [x,z,yaw] of [[-300,-300,.05],[200,330,-.03],[-120,440,.1],[390,-420,0],[-440,300,-.08]]) frigate(m,x,z,yaw);
  },
  wake(m,k0,k1){ for(const sg of [-1,1]) for(let k=k0;k<k1;k++){ const x0=504+k*24, w=8-k*.6, z=40+k*2; m.quad([x0,.04,sg*z],[x0+20,.04,sg*(z+2)],[x0+20,.04,sg*(z+2+w)],[x0,.04,sg*(z+w)],[.9,.95,1],'up'); } },
  oceanFar(m){ this.wake(m,1,9); },
  ocean(m){
    const S=24, E=528;
    for(let ix=-E;ix<E;ix+=S) for(let iz=-E;iz<E;iz+=S){ const k=((ix+iz)/S&1)?.96:1, d=cvInside(ix+12,iz+12)?0:cvEdge(ix+12,iz+12)[2], c=d<26?[.13,.36,.68]:d<80?[.08,.27,.58]:[.06,.22,.52];
      m.quad([ix,0,iz],[ix+S,0,iz],[ix+S,0,iz+S],[ix,0,iz+S],[c[0]*k,c[1]*k,c[2]*k],'up'); }
    // the wake astern (the part past the map's edge is in oceanFar) and the bow wave
    this.wake(m,0,1);
    for(const sg of [-1,1]){
      m.quad([-505,.04,sg*2],[-420,.04,sg*40],[-400,.04,sg*48],[-500,.04,sg*7],[.86,.93,1],'up'); } },
  marks(m){
    // the road as side-by-side strips, so no two of them share a plane: edge line, surface, centre dashes, surface, edge line
    // (lifted only .03 above the deck, not markStrip's usual .16: the cars stand on the deck, so a higher road hides the bottom of their tyres; the polygon offset of the marks keeps it from flickering)
    const W=HALFW, E=W-1.3, C=.24, line=[.95,.95,.9], wires=[[20,24],[30,34],[40,44],[50,54]], L=CV_ROAD_LIFT;
    for(let i=0;i<M;i++){ const j=i+1, tar=(i%24<12)?THEME.road:THEME.roadAlt, wire=wires.some(([a,b])=>i>=a&&i<b)&&(i&1), start=i<3||i>M-3, c=start?[.95,.95,.95]:wire?[.05,.05,.06]:tar;
      markStrip(m,i,j,E+(W-E)/2,(W-E)/2,line,null,L); markStrip(m,i,j,-E-(W-E)/2,(W-E)/2,line,null,L);
      markStrip(m,i,j,(E+C)/2,(E-C)/2,c,null,L); markStrip(m,i,j,-(E+C)/2,(E-C)/2,c,null,L);
      markStrip(m,i,j,0,C,(i%10<5||start)?line:c,null,L); }
    paintDigits(m,-195,38,'68',36,[.92,.92,.92]); },
  mapBg(g,X,Z,sc){ g.fillStyle='#59626b'; g.beginPath(); CV_DECK.forEach((p,i)=>i?g.lineTo(X(p[0]),Z(p[1])):g.moveTo(X(p[0]),Z(p[1]))); g.closePath(); g.fill();
    g.strokeStyle='#d8b820'; g.lineWidth=1; for(const K of CV_KERBS){ g.beginPath(); K.forEach((p,i)=>i?g.lineTo(X(p[0]),Z(p[1])):g.moveTo(X(p[0]),Z(p[1]))); g.stroke(); }
    g.fillStyle='#b4bec8'; for(const J of CV_JETS){ g.beginPath(); g.arc(X(J[0]),Z(J[1]),1.1,0,7); g.fill(); }
    g.fillStyle='#20262c'; g.fillRect(X(95),Z(-131),150*sc,62*sc); }
};
