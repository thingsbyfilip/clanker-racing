'use strict';
// The buggy model (also used for the AI cars, in other colours) and its wheel.
function buildCarMesh(body){
  const m=new Mesh(), red=body||[.82,.09,.08], dark=[.14,.14,.16], white=[.95,.95,.95], skin=[.9,.7,.5];
  m.box(0,.75,0,1.9,.5,3.8,red);
  m.box(0,1.0,1.25,1.6,.35,1.3,[Math.min(1,red[0]*1.1),Math.min(1,red[1]*1.1),Math.min(1,red[2]*1.1)]);
  m.box(0,.55,0,1.5,.3,3.4,dark);
  m.box(0,1.25,-.45,1.2,.2,1.3,dark);               // seat
  m.box(0,1.75,-.5,.5,.5,.5,skin);                  // head
  m.box(0,1.95,-.5,.62,.28,.62,white);              // helmet
  for(const sx of [-.75,.75]) for(const sz of [.3,-1.0]) m.box(sx,1.55,sz,.12,1.2,.12,dark); // cage posts
  m.box(0,2.15,-.35,1.7,.12,1.5,dark);              // cage roof
  m.box(0,1.8,-1.85,2.0,.1,.6,white);               // wing
  for(const sx of [-.6,.6]) m.box(sx,1.35,-1.8,.1,.9,.1,dark);
  m.box(0,.55,2.05,2.1,.25,.35,dark);               // bumper
  m.em=true;                                        // lights
  for(const sx of [-.6,.6]){ m.box(sx,.95,1.93,.4,.22,.1,[1,.95,.7]); m.box(sx,.85,-1.93,.4,.18,.1,[1,.12,.1]); }
  m.em=false;
  return m;
}
function buildWheelMesh(){ const m=new Mesh(); m.cylX(0,0,0,.62,.6,10,[.1,.1,.1],[.6,.6,.62]); return m; }
const WHEELS=[[1.1,.62,1.35,true],[-1.1,.62,1.35,true],[1.1,.62,-1.3,false],[-1.1,.62,-1.3,false]];
