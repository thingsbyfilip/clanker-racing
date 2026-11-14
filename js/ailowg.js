'use strict';
// DIFFICULTY_LOW_GRAVITY_ADJUSTMENT (config.js): the opponents' driving on levels with less gravity than Earth's (Moon, Mars, Titan).
// The AI's speeds were all tuned on Earth gravity. With less of it a car leaves the ground on every crest and ramp and flies much further, and in the air it can
// neither brake nor turn: a jump taken flat out before a bend sends it far off the road, where its off-road rule wrecks it (Titan: 25 wrecks a race). So on these
// levels the AI works out, from the level's own gravity, how fast it may leave the ground at each point of the road and still come down on the road (lowgCaps),
// and brakes for that ahead of time, as it does for bends. It still takes every jump, only no faster than it can land.
// Whether a car takes off at a lip is decided within a frame: stepCar keeps a grounded car on the ground unless it ends a step more than 7 cm above it, and a car
// that stays down one frame longer is turned onto the far slope and rolls down it. So the plan does not drive a ghost (that only finds out what one phase of the
// frames does): it slides a car along the road on a rail, and wherever stepCar's take-off test could pass, it flies that flight and judges where it comes down.
// Planned at startRace (like cutLine), so aiDrive only reads an array. Tuned with ai_test_script/t12.js.
const LOWG_FROM=.8;          // the adjustment applies where the level's gravity is below this share of Earth's
const LOWG_EDGE=3;           // a landing must be at least this far inside the road's edge (m) ...
const LOWG_ANGLE=.3;         // ... with the road's direction there at most this far (radians) from the direction of flight,
const LOWG_TURN=.5;          // ... plus this much per second in the air (the car can turn its nose in the air, at 0.7 rad/s, and lands pointing that way)
const LOWG_HOP=.25;          // shorter flights than this (s) are bumps, not jumps: they are not checked
const LOWG_DECEL=26;         // braking assumed when slowing down for a jump (m/s per s; the brakes give 55, but a car in low gravity is often in the air)
const LOWG_VMIN=14, LOWG_VMAX=90, LOWG_STEP=2;   // the speeds tried (m/s)
const LOWG_SAFE=2;           // the cap stays this far below the slowest speed that landed badly
const LOWG_LANES=[-5,0,5];   // lanes tried (m from the road centre, on a road of standard width)
const LOWG_SUB=8;            // rail points per track sample
let lowgArr=null, lowgLV=null, lowgTL=0, lowgW=0;

function lowgOn(){ return DIFFICULTY_LOW_GRAVITY_ADJUSTMENT && (LV.phys.g||G)>G*LOWG_FROM; }   // (gravities are negative)
// the rail: points along the road, lane metres from its centre (same sign as the AI's lanes), with the ground's height there (groundInfo, as stepCar has it),
// the climb per metre of a car on it, and the distance along the rail
function lowgRail(lane){
  const N=M*LOWG_SUB, r={x:new Float32Array(N),z:new Float32Array(N),yaw:new Float32Array(N),h:new Float32Array(N),sl:new Float32Array(N),d:new Float64Array(N+1)};
  for(let p=0;p<N;p++){ const i=Math.floor(p/LOWG_SUB), k=p/LOWG_SUB-i, a=track[i], b=track[(i+1)%M], tx=lerp(a.tx,b.tx,k), tz=lerp(a.tz,b.tz,k), l=Math.hypot(tx,tz)||1;
    const x=lerp(a.x,b.x,k)+tz/l*lane, z=lerp(a.z,b.z,k)-tx/l*lane, yaw=Math.atan2(tx,tz), gi=groundInfo(x,z,yaw,1e4);
    r.x[p]=x; r.z[p]=z; r.yaw[p]=yaw; r.h[p]=gi.h; r.sl[p]=-(gi.nx*tx/l+gi.nz*tz/l)/gi.ny; }
  for(let p=0;p<N;p++){ const q=(p+1)%N; r.d[p+1]=r.d[p]+Math.hypot(r.x[q]-r.x[p],r.z[q]-r.z[p]); }
  return r;
}
// a flight from rail point p at horizontal speed v: straight on along the road's direction there, under the level's gravity, until it is down (stepCar's test).
// true if it is a hop or comes down well, false if it lands badly. info (debug) collects every flight
function lowgFlight(r,p,v,g,info){
  const spm=TL/M, dt=1/60, i0=Math.floor(p/LOWG_SUB), yaw=r.yaw[p], fx=Math.sin(yaw), fz=Math.cos(yaw);
  let x=r.x[p], z=r.z[p], y=r.h[p], vy=v*r.sl[p], T=0;
  for(;;){ vy+=g*dt; x+=fx*v*dt; z+=fz*v*dt; y+=vy*dt; T+=dt;
    if(y-groundInfo(x,z,yaw,y).h<=0) break;
    if(T>10||Math.abs(x)>HALF||Math.abs(z)>HALF) return false; }
  if(T<LOWG_HOP) return true;
  // where it comes down, against the road just ahead of the take-off (a window, so another stretch of road never counts), and pointing which way
  const w=Math.ceil(v*T/spm)+40; let bd=1e18, bj=i0;
  for(let k=0;k<w;k++){ const j=(i0+k)%M, q=track[j], d=(q.x-x)*(q.x-x)+(q.z-z)*(q.z-z); if(d<bd){ bd=d; bj=j; } }
  const q=track[bj], lat=Math.sqrt(bd), dth=Math.abs(angDiff(Math.atan2(q.tx,q.tz),yaw)), ok=lat<=HALFW-LOWG_EDGE&&dth<=LOWG_ANGLE+LOWG_TURN*T;
  if(info) info.push({s:+track[i0].s.toFixed(3),v,T:+T.toFixed(2),lat:+lat.toFixed(1),dth:+dth.toFixed(2),ok});
  return ok;
}
// every take-off at speed v along a rail that lands badly: the track samples it leaves from. stepCar's test: after one step (gravity, then the move) the car is
// more than 7 cm above the ground there. Tried at every rail point, so whichever frame a car happens to reach the lip on, its take-off is among them. cap: samples
// already capped below v are skipped
function lowgFails(r,v,g,cap,info){
  const N=M*LOWG_SUB, dt=1/60, out=[], len=r.d[N], D=k=>k<N?r.d[k]:len+r.d[k-N]; let q=0;
  for(let p=0;p<N;p++){
    const want=r.d[p]+v*dt; while(D(q+1)<want) q++;                    // the ground one step further on (round the lap's end too)
    const h1=lerp(r.h[q%N],r.h[(q+1)%N],(want-D(q))/((D(q+1)-D(q))||1));
    if(r.h[p]+(v*r.sl[p]+g*dt)*dt-h1<.07) continue;                     // it stays on the ground here (the rail stands in for the straight step: they differ by mm)
    const i=Math.floor(p/LOWG_SUB); if(cap&&cap[i]<v) continue;          // (capped below this speed already: no need to know)
    if(!lowgFlight(r,p,v,g,info)) out.push(i); }
  return out;
}
// the speed cap at every track sample (null when the adjustment does not apply): the fastest take-off that still lands well, then braked for ahead of time
function lowgCaps(){
  if(!lowgOn()) return null;
  if(lowgLV===LV&&lowgTL===TL&&lowgW===HALFW) return lowgArr;
  const g=LV.phys.g||G, spm=TL/M, v=new Float32Array(M).fill(LOWG_VMAX);
  // from slow upwards, so a bad landing at one speed caps that take-off below it, whatever faster speeds do (a very long flight can come down on a later stretch of road and look fine)
  for(const l of LOWG_LANES){ const r=lowgRail(l*Math.min(1,HALFW/15));                      // (the lanes shrink on narrow roads, as the AI's do)
    for(let s=LOWG_VMIN;s<=LOWG_VMAX;s+=LOWG_STEP) for(const i of lowgFails(r,s,g,v)) for(let k=-1;k<=1;k++){ const j=(i+k+M)%M; v[j]=Math.min(v[j],Math.max(LOWG_VMIN,s-LOWG_STEP-LOWG_SAFE)); } }
  for(let pass=0;pass<3;pass++) for(let i=M*2-1;i>=0;i--){ const a=i%M, b=(i+1)%M; v[a]=Math.min(v[a],Math.sqrt(v[b]*v[b]+2*LOWG_DECEL*spm)); }
  lowgLV=LV; lowgTL=TL; lowgW=HALFW; lowgArr=v; return v;
}
