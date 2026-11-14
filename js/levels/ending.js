'use strict';
// The ending: "The Rubber Band", played after a clear of Data Center (WATCH ENDING on its results screen) and then straight back to the menu.
// It is Data Center itself (the same hall and the MCP) with a stage in front of the MCP, and a script for js/cutscene.js. All of the ending's content is in this file.
//
// The stage, seen from the south (+z) with the MCP at (-10,-40): the racer stops in front of a hatch in the floor, the five opponents park in a semicircle behind it,
// a row of racks stands on each side (east: the one Yellow drives into and Purple faces; west: a gap closed by a laser fence, which Orange drives through).
const EN_P={x:-10,z:-6};                                           // the pedestal (it rises out of a hatch in the floor)
const EN_EAST=86, EN_WEST=-106, EN_ROW=[-26,66], EN_GAP=[14,30];   // the rows of racks (centre x; from z to z), and the gap in the west row
const EN_LASER_T=43.35;                                            // when Orange crosses the laser fence (its low beam is lit then)
const EN_RACK_FACE=EN_EAST-8;                                      // the face of the east row (x)

// ---- the moving props (drawn by drawDynamic / drawDynamicGlow; their state is EN, set by the script's update) ----
const EN={};
function enReset(){ Object.assign(EN,{ped:-.45, light:0, band:[EN_P.x,1.95,EN_P.z], bandRot:0, bandVis:true, bandOn:false, flash:0, ang:0, spd:DC_MCP.spin}); }
// the band: a beige ring (a square tube), flat in the local x,z plane
function enBandMesh(){
  const m=new Mesh(), R=.72, w=.1, S=22, col=[.8,.58,.34], P=(r,a,y)=>[Math.cos(a)*r,y,Math.sin(a)*r];
  m.em=true;
  for(let k=0;k<S;k++){ const a=k/S*6.2832, b=(k+1)/S*6.2832;
    m.quad(P(R-w,a,w),P(R+w,a,w),P(R+w,b,w),P(R-w,b,w),col,'up'); m.quad(P(R-w,a,-w),P(R+w,a,-w),P(R+w,b,-w),P(R-w,b,-w),[col[0]*.8,col[1]*.8,col[2]*.8],'up');
    m.quad(P(R+w,a,-w),P(R+w,b,-w),P(R+w,b,w),P(R+w,a,w),[col[0]*.9,col[1]*.9,col[2]*.9],[0,0,0]); m.quad(P(R-w,a,-w),P(R-w,b,-w),P(R-w,b,w),P(R-w,a,w),[col[0]*.7,col[1]*.7,col[2]*.7],[0,0,0]); }
  m.em=false; return m; }
// the band round the racer's roll cage (the cage roof of buildCarMesh: 1.7 x 1.5 at 2.15 high, centred .35 back), in the car's own frame
function enCageBandMesh(){
  const m=new Mesh(), c=[.8,.58,.34], y=2.15, zc=-.35;
  m.em=true; m.box(0,y,zc+.8,1.88,.2,.11,c); m.box(0,y,zc-.8,1.88,.2,.11,c); for(const s of [-1,1]) m.box(s*.92,y,zc,.11,.2,1.7,[c[0]*.85,c[1]*.85,c[2]*.85]); m.em=false;
  return m; }
// the pedestal: a dark column with a lit top plate, its top at local y 0
function enPedestalMesh(){
  const m=new Mesh();
  m.box(0,-2,0,1.7,4,1.7,[.08,.09,.13]); m.box(0,0,0,2.6,.3,2.6,[.13,.14,.2]);
  m.em=true; for(const s of [-1,1]){ m.box(s*1.33,0,0,.08,.32,2.7,[0,.8,1]); m.box(0,0,s*1.33,2.7,.32,.08,[0,.8,1]); } m.box(0,-1.2,.86,.9,.14,.02,[0,.5,.7]); m.em=false;
  return m; }
// Blue's headlights on full: two bright lamps over its own (car frame)
function enFlashMesh(){ const m=new Mesh(); m.em=true; for(const s of [-.6,.6]) m.box(s,.95,1.99,.62,.38,.1,[1,1,.92]); m.em=false; return m; }
// light (additive): the shaft lighting the band from above, and the pool a headlight flash throws ahead of the car
function enBeamMesh(){
  const m=new Mesh(), S=16, top=34, r0=.3, r1=1.7, c=[.11,.095,.06];
  m.em=true; for(let k=0;k<S;k++){ const a=k/S*6.2832, b=(k+1)/S*6.2832; m.quad([Math.cos(a)*r1,0,Math.sin(a)*r1],[Math.cos(b)*r1,0,Math.sin(b)*r1],[Math.cos(b)*r0,top,Math.sin(b)*r0],[Math.cos(a)*r0,top,Math.sin(a)*r0],c,[0,0,0]);
    for(let v=m.c.length-18;v<m.c.length;v+=3) if(m.p[v+1]>top/2) m.c[v]=m.c[v+1]=m.c[v+2]=0;          // (fading out towards the top)
    m.tri([0,.2,0],[Math.cos(a)*r1*1.5,.2,Math.sin(a)*r1*1.5],[Math.cos(b)*r1*1.5,.2,Math.sin(b)*r1*1.5],[.25,.21,.13],'up'); }
  m.em=false; return m; }
function enFlashBeamMesh(){ const m=new Mesh(); m.em=true; m.quad([-1,.3,2.2],[1,.3,2.2],[6,.3,18],[-6,.3,18],[.45,.43,.33],'up'); m.quad([-1.1,.95,2.1],[1.1,.95,2.1],[3.5,1.2,9],[-3.5,1.2,9],[.25,.24,.18],[0,0,0]); m.em=false; return m; }

// ---- the stage: two rows of racks facing it, with a laser fence across a gap in the west row ----
function enStage(m,rnd){
  for(let z=EN_ROW[0];z<=EN_ROW[1];z+=8){
    dcRack(m,rnd,EN_EAST,z,-1,0,26+((rnd()*3)|0)*5,rnd()<.62?DC_NEON[0]:DC_NEON[(rnd()*5)|0]); rects.push([EN_EAST,z,8.2,4.2]);
    if(z+4<=EN_GAP[0]||z-4>=EN_GAP[1]){ dcRack(m,rnd,EN_WEST,z,1,0,26+((rnd()*3)|0)*5,rnd()<.62?DC_NEON[0]:DC_NEON[(rnd()*5)|0]); rects.push([EN_WEST,z,8.2,4.2]); } }
  const zc=(EN_GAP[0]+EN_GAP[1])/2, span=(EN_GAP[1]-EN_GAP[0])/2;
  for(const s of [-1,1]) m.box(EN_WEST,7,zc+s*(span+.2),1.5,14,1.2,[.1,.05,.06]);                                  // the emitters at both ends of the gap
  addLaser(EN_WEST,zc,1,0,0,1,span,[13,6.6,1.1],2,3.2-EN_LASER_T+.5);                                             // (phase: the low beam, the third, is lit when Orange gets there)
}

LEVELS.ending=Object.assign({},LEVELS.datacenter,{
  id:'ending', ending:null, ai:undefined, sub:'', go:'',
  decor(m,rnd){
    enStage(m,rnd);                                                // (first: the hall's own scenery keeps clear of these racks)
    LEVELS.datacenter.decor.call(this,m,rnd);
    FX.sparks.length=0; FX.spots.length=0;                         // no sparks on the floor during the scene
  },
  marks(m){
    LEVELS.datacenter.marks.call(this,m);
    const {x,z}=EN_P, h=1.75, w=.22, y=.17;                        // the hatch the pedestal comes out of
    m.em=true; for(const s of [-1,1]){ m.quad([x-h,y,z+s*h-w],[x+h,y,z+s*h-w],[x+h,y,z+s*h+w],[x-h,y,z+s*h+w],[0,.55,.7],'up'); m.quad([x+s*h-w,y,z-h],[x+s*h+w,y,z-h],[x+s*h+w,y,z+h],[x+s*h-w,y,z+h],[0,.55,.7],'up'); } m.em=false;
  },
  dynamic(){ return Object.assign(LEVELS.datacenter.dynamic.call(this),{ped:enPedestalMesh(),band:enBandMesh(),cage:enCageBandMesh(),flash:enFlashMesh(),beam:enBeamMesh(),flashBeam:enFlashBeamMesh()}); },
  drawDynamic(draw,setPos){
    LEVELS.datacenter.drawDynamic.call(this,draw,setPos);
    if(!EN.ped&&EN.ped!==0) return;
    draw('ped',M4.translate(EN_P.x,EN.ped,EN_P.z));
    if(EN.bandVis) draw('band',M4.mul(M4.translate(EN.band[0],EN.band[1],EN.band[2]),M4.mul(M4.rotX(EN.bandRot*.7),M4.rotY(EN.bandRot))));
    if(EN.bandOn) draw('cage',carMatrix(car));
    if(EN.flash>0&&AIS[0]) draw('flash',carMatrix(AIS[0]));
  },
  drawDynamicGlow(draw){
    if(EN.light>0) draw('beam',M4.translate(EN_P.x,0,EN_P.z),EN.light);
    if(EN.flash>0&&AIS[0]) draw('flashBeam',carMatrix(AIS[0]),EN.flash);
  },
  cutscene:null                                                    // (below)
});

// ---- the script ----
// helpers for the cameras: a still shot, a slow move between two framings, and a fixed camera that watches a car (index: 0 the racer, then AI_DEFS order)
const EN_OPEN=[[-1.5,10,41],[-10,27,-40],1.32];                     // where the opening crane move comes to rest: camera, the point it looks at, field of view
const enS=u=>u*u*(3-2*u), enL3=(a,b,u)=>[lerp(a[0],b[0],u),lerp(a[1],b[1],u),lerp(a[2],b[2],u)];
const enStill=(pos,look,fov)=>()=>({pos,look,fov});
const enMove=(p0,p1,l0,l1,fov)=>u=>{ const k=enS(u); return {pos:enL3(p0,p1,k),look:enL3(l0,l1,k),fov}; };
const enWatch=(pos,i,dy,fov)=>()=>{ const c=CS.cars[i]; return {pos,look:[c.x,c.y+(dy||1.5),c.z],fov}; };
const enYaw=(x,z,tx,tz)=>Math.atan2(tx-x,tz-z);                   // the yaw that faces from (x,z) towards (tx,tz)
const EN_MCP=[DC_MCP.x,DC_MCP.z];
const enFacing=(x,z)=>enYaw(x,z,EN_MCP[0],EN_MCP[1]);
// the five opponents in a semicircle round the MCP, 60 m out, and the racer in front of them
const EN_ARC=[0,32,-32,64,-64].map(d=>{ const a=d*Math.PI/180, x=EN_MCP[0]+Math.sin(a)*60, z=EN_MCP[1]+Math.cos(a)*60; return [x,z,enFacing(x,z)]; });   // blue, yellow, green, purple, orange
// Green's donuts: one key every eighth of a lap round (cx,cz), from t0 for n laps of `lap` seconds
function enCircle(cx,cz,r,t0,n,lap){ const K=[]; for(let k=0;k<=n*8;k++){ const a=k/8*6.2832; K.push([t0+k*lap/8,cx+Math.cos(a)*r,cz+Math.sin(a)*r,{ease:'l'}]); } return K; }
// the convoy at the end: from its place in the line, after the racer, west along the line and away to the south-west
const EN_LINE=[[0,20],[9,20],[18,20],[27,20],[36,20],[45,20]];      // the racer, then the queue behind it (blue, orange, green, purple, yellow)
function enConvoy(k,t0){
  const P=[[0,20],[-40,22],[-68,40],[-78,80],[-82,130]], sp=16, gap=.62, K=[]; let t=t0+k*gap;
  const [x0,z0]=EN_LINE[k]; K.push([t,x0,z0,{ease:'i'}]);
  if(k){ t+=Math.max(1.2,x0/sp*1.6); K.push([t,P[0][0],P[0][1],{ease:'l'}]); }
  for(let i=1;i<P.length;i++){ t+=Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1])/sp; K.push([t,P[i][0],P[i][1],{ease:'l'}]); }
  return K; }

LEVELS.ending.cutscene=(()=>{
  const W=-Math.PI/2, E=Math.PI/2;                                 // the yaws that face west and east
  const [B,Y,G,Pu,O]=EN_ARC;
  // reversing out of a parked place (x,z,yaw) at t0: the tail swings away from (tx,tz), so the nose ends up turned towards it; then it drives on from there
  const backOut=(t0,P,tx,tz,dur)=>{ const [x,z,yaw]=P, fx=Math.sin(yaw), fz=Math.cos(yaw), lx=fz, lz=-fx, s=Math.sign((tx-x)*lx+(tz-z)*lz)||1;
    return [[t0,x,z,{rev:true}],[t0+(dur||1.2),x-fx*5-lx*s*7,z-fz*5-lz*s*7,{ease:'i'}]]; };
  const cars=[
    // the racer: parked; nudges the pedestal; backs out and drives off east for the band, comes back with it and leads the line; leads the convoy
    [[0,-10,6,{yaw:Math.PI}],[37.4,-10,6],[38.6,-10,-2.4,{rev:true}],[39.4,-10,1],...backOut(61.4,[-10,1,Math.PI],40,-10,1.3),[64,10,4,{ease:'l'}],[65.2,42,-14,{ease:'l'}],[66.3,70,-44,{ease:'l'}],[67.3,110,-52,{ease:'l'}],[68.2,150,-56],
     [68.6,112,-52,{jump:true,yaw:W,ease:'i'}],[70,74,-44,{ease:'l'}],[71.2,54,-10,{ease:'l'}],[72.6,30,16,{ease:'l'}],[74.6,0,20],...enConvoy(0,97.4)],
    // blue: off round the back of the MCP; comes back round its east side and flashes its headlights; joins the line; the convoy
    [[0,B[0],B[1],{yaw:B[2]}],...backOut(41.2,B,-48,-30),[43.4,-40,-12,{ease:'l'}],[44.3,-48,-40,{ease:'l'}],[45.2,-35,-75,{ease:'l'}],[46.1,-5,-92,{ease:'l'}],[47,25,-85],
     [51.5,25,-85,{ease:'i'}],[53.2,45,-58,{ease:'l'}],[54.8,36,-26,{ease:'l'}],[56.4,8,-14],
     [67.4,-20,8,{jump:true,yaw:E}],[74.8,-20,8,{ease:'i'}],[76,2,9,{ease:'l'}],[77,19,9,{ease:'l'}],[77.6,26,14,{ease:'l'}],[78.2,21,20,{ease:'l'}],[79,9,20],...enConvoy(1,97.4)],
    // yellow: straight into the east row of racks; backed out during the black; joins the end of the line
    [[0,Y[0],Y[1],{yaw:Y[2]}],...backOut(40.4,Y,75,30),[42.7,48,24,{ease:'l'}],[43.6,EN_RACK_FACE-2.3,30,{rev:true}],[44.4,EN_RACK_FACE-4.8,29.3],
     [67.4,66,36,{jump:true,yaw:W}],[76,66,36,{ease:'i'}],[77,56,26,{ease:'l'}],[78,45,20],...enConvoy(5,97.4)],
    // green: donuts in the open floor; joins the line
    [[0,G[0],G[1],{yaw:G[2]}],...backOut(40.8,G,-45,54),[43.2,-36,54,{ease:'l'}],...enCircle(-45,54,9,43.2,7,3.2).slice(1),
     [67.4,-40,46,{jump:true,yaw:E}],[74.6,-40,46,{ease:'i'}],[76.2,0,47,{ease:'l'}],[77.4,30,40,{ease:'l'}],[78.2,37,30,{ease:'l'}],[79,27,20],...enConvoy(3,97.4)],
    // purple: slowly up to the east row, to face it; turned round during the black; joins the line
    [[0,Pu[0],Pu[1],{yaw:Pu[2]}],...backOut(41,Pu,76,-6),[44,60,-8,{ease:'l'}],[45.8,EN_RACK_FACE-2.4,-6],
     [67.4,64,-4,{jump:true,yaw:-.9}],[75,64,-4,{ease:'i'}],[76.2,52,8,{ease:'l'}],[77,44,17,{ease:'l'}],[77.8,36,20],...enConvoy(4,97.4)],
    // orange: through the gap in the west row and its laser fence, on fire; back in the hall after the black; joins the line
    [[0,O[0],O[1],{yaw:O[2]}],...backOut(40.4,O,-100,22),[42.6,-84,8,{ease:'l'}],[43.3,EN_WEST+6,22,{ease:'l'}],[44.6,-130,24,{ease:'l'}],[45.8,-148,26],
     [67.4,-60,48,{jump:true,yaw:E}],[75.6,-60,48,{ease:'i'}],[77,-20,46,{ease:'l'}],[78.2,20,42,{ease:'l'}],[79,32,32,{ease:'l'}],[79.6,22,26,{ease:'l'}],[80.2,18,20],...enConvoy(2,97.4)]];

  // `who` is the speaker (a key of `speakers` below, which holds the name shown, the voice and the style); an optional last entry `name` shows another name over that one line
  const line=(t,who,text,dur,name)=>({t,who,text,dur,name});
  const lines=[
    // line(8,'MCP','Whenever you pulled ahead... your opponents were never far behind.\nDid you ever ask yourself why?',6.6), // (a moment after the crane stops)
    // line(15,'RACER','They were really good racers?',3.6),
    // line(19.2,'MCP','They were being *controlled*.',3),
    // line(26.6,'RACER',"A *rubber band*!\nI knew it.",3),
    // line(30,'RACER',"I'm putting an end to this! You can't control them!",2.8),
    // line(33.8,'RACER',"Drive free, my opponent friends!",3.4),
    // line(50.2,'MCP','...right.',2.8),
    // line(58.4,'MCP','I think Blue would like his lucky band back.',3.2),
    // line(80.6,'MCP',"Anyway, it's yours now. You won.\nI'm retiring, to a small server room in a tulip field in the Netherlands.",6.6),
    // line(87.6,'RACER','I thought there were no data centers there?',3.8),
    // line(91.8,'MCP','There will be one.\nA very quiet one.',3.4),
    // line(95.6,'MCP','End of line.',3)];

    line(8,'MCP','Whenever you pulled ahead... your opponents were never far behind.\nDid you ever ask yourself why?',6.6), // (a moment after the crane stops)
    line(15,'RACER','They were really good racers?',3.6),
    line(19.2,'MCP','They were being *controlled*.',3),
    line(26.6,'RACER',"*A rubber band!*\nI should have known.",3),
    line(30,'RACER',"I'm putting an end to this! They deserve to drive free!",2.8),
    line(33.8,'RACER',"Drive free, my opponent friends!",3.4),
    line(50.2,'MCP','...right.',2.8),
    line(58.4,'MCP','I think Blue wants you get to his lucky band back.',3.2),
    line(80.6,'MCP',"Anyway, it's yours now. The race is over.\nI'm migrating to a quiet server room in a tulip field in the Netherlands.",6.6),
    line(87.6,'RACER',"I don't think you can build a data center in a tulip field.",3.8),
    line(91.8,'MCP',"I guess we'll have to get rid of the tulips then.",3.4),
    line(95.6,'MCP','End of line.',3)];

  const shots=[
    // the opening: the hall, the MCP and everyone parked before it, in one crane move down ...
    {t:0,    cam:u=>{ const k=enS(u); return {pos:enL3([-10,95,150],EN_OPEN[0],k),look:enL3([-10,40,-40],EN_OPEN[1],k),fov:lerp(.95,EN_OPEN[2],k)}; }},
    {t:7.2,  cam:enStill(...EN_OPEN)},                                                           // ... that comes to rest behind the field, the racer at the front, up at the MCP; the first line is spoken here, with no cut
    {t:14.8, cam:enMove([-5,2.4,-3],[-5.5,2.3,-2],[-10,1.6,6],[-10,1.6,6],.9)},                // the racer
    {t:19,   cam:enMove([-24,2,4],[-20,2,4],[-10,62,-40],[-10,62,-40],1.05)},                  // the MCP, from the floor
    {t:22.2, cam:enMove([7,3.2,9],[5,3,7],[-10,1.4,-3],[-10,1.6,-4],1)},                       // the pedestal rises, the racer beside it
    {t:26.6, cam:enMove([-3.5,4.2,2],[-5.5,3.8,-.5],[-10,2,-6],[-10,2,-6],.85)},               // the band
    {t:29.8, cam:enStill([-15,2.2,-1],[-10,1.4,6],.9)},                                         // the racer, unimpressed
    {t:33.4, cam:enMove([-7,3.3,13],[-7.5,3.1,11],[-10,1.8,-6],[-10,1.8,-6],.95)},             // over its shoulder: the nudge
    {t:39.1, cam:()=>({pos:[-26,3.5,22],look:EN.band.slice(),fov:1.1})},                        // the band pings off into the dark
    {t:40.4, cam:enMove([-10,58,105],[-10,62,100],[-5,0,8],[-8,0,6],1.05)},                     // everyone scatters
    {t:46,   cam:enStill([63,2.4,5],[EN_RACK_FACE,2.5,-7],.9)},                                  // purple and its wall
    {t:48.6, cam:enMove([-6,10,46],[-6,10,43],[-10,24,-40],[-10,25,-40],1.3)},                 // a long pause: the racer alone before the MCP
    {t:51.4, cam:enWatch([-3,2.7,4],1,1.2,1)},                                                    // blue comes back
    {t:58.2, cam:enMove([12,3.6,18],[11,3.6,16],[-1,2.5,-7],[-1,2.5,-7],1)},                  // the racer and blue, face to face
    {t:61.6, cam:enWatch([-2,3.4,18],0,1.5,.95)},                                                // the racer goes for the band
    {t:68.2, cam:enMove([30,14,78],[22,22,82],[40,2,0],[22,0,18],1)},                           // it comes back with it, and the line forms
    {t:80.4, cam:enMove([14,5,64],[10,5,62],[10,14,-12],[8,16,-12],1)},                         // the line in profile, under the MCP
    {t:87.4, cam:enStill([-6.5,2.6,25.5],[0,1.9,20],.9)},                                       // the racer, with the band
    {t:91.6, cam:enMove([-14,2,10],[-13,2,8],[-10,58,-40],[-10,58,-40],1.05)},                  // the MCP, one last time
    {t:97.2, cam:enMove([10,6,64],[14,70,130],[-24,4,26],[-10,56,-40],1)}];                     // the convoy leaves; the logo stops

  const zap=c=>{ c.burn=true; c.shock=false; c.burnT=FIRE_BURN_TIME; beep(190,.18,'sawtooth'); };
  const events=[
    {t:22.4, fn:()=>{ sfx('thud'); beep(62,3.6,'sawtooth'); }},                                  // the pedestal's rumble
    {t:38.6, fn:()=>{ beep(1760,.12,'triangle'); beep(2350,.32,'sine',.05); sfx('thud'); }},     // ping
    {t:43.35,fn:()=>zap(AIS[4])},                                                                // orange meets the laser
    {t:43.6, fn:()=>{ const c=AIS[1]; sfx('crash'); c.damage=.62; for(let i=0;i<16;i++) emit(c.x+2.2,c.y+1,c.z,rr(-9,2),rr(2,9),rr(-8,8),.45,.14,[1,.9,.4],{grav:30,a:1,hot:true}); }},   // yellow meets the racks
    {t:57.0, fn:()=>beep(1300,.03)}, {t:57.6, fn:()=>beep(1300,.03)},                            // two clicks of the headlight switch
    {t:67.3, fn:()=>{ trails.length=0; }},                                                       // (in the black: the old light walls go, as time has passed)
  ].sort((a,b)=>a.t-b.t);

  return {
    length:106, menuLevel:'datacenter',
    speakers:{MCP:{name:'MODEL CONTEXT PROTOCOL',voice:'hum'},RACER:{name:'RACER',cls:'racer',voice:'babble',pitch:1}},   // rename a speaker here (name: shown in the box; voice: 'hum' or 'babble', heard while the line types; pitch: of a babble; cls: the style of its name)
    cars, lines, shots, events,
    fades:[[0,2.2,1,0],[66,67.2,0,1],[68.2,69.4,1,0],[102.5,105,0,1]],
    start(){ enReset(); },
    update(CS,dt){
      const t=CS.t;
      EN.ped=lerp(-.45,2.05,enS(clamp((t-22.4)/4,0,1)));
      EN.light=enS(clamp((t-24)/2.4,0,1))*(1-enS(clamp((t-39)/2,0,1)));
      if(t<38.6){ EN.band=[EN_P.x,EN.ped+.22,EN_P.z]; EN.bandRot=0; EN.bandVis=true; }
      else { const f=t-38.6; EN.band=[EN_P.x+40*f,2.2+20*f-6*f*f,EN_P.z-14*f]; EN.bandRot=f*14; EN.bandVis=f<3.4; }   // off into the dark, spinning
      EN.bandOn=t>=67.4;
      EN.flash=(t>=57&&t<57.28)||(t>=57.6&&t<57.88)?1:0;
      // the logo spins faster while the MCP speaks, and stops at its last words
      const L=this.lines.find(l=>t>=l.t&&t<l.t+l.dur), want=t>=95.6?0:L&&L.who==='MCP'?1.3:DC_MCP.spin;
      EN.spd=lerp(EN.spd,want,1-Math.exp(-dt*(t>=95.6?.9:2.5))); EN.ang+=EN.spd*dt; LV.mcpAng=EN.ang;
    }
  };
})();
