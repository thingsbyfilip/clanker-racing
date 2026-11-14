'use strict';
// Level effects: fire, smoke, electric sparks and laser beams. A level's decor registers them with addFire / addSmoke / addSparkSpots /
// addLaser (the lists are emptied by buildLevelFeatures).
// Fire and the beams flagged `hurts` set every car alight, active sparks damage it (fxHurt, from stepCar; amounts in config.js). Smoke is purely visual.
// hazStep runs in every simulation (stepAI), fxEmit only where things are drawn (carFx), so ?bench stays fast.
const FX={fires:[],smokes:[],lasers:[],sparks:[],spots:[],lights:[],t:0};
function fxReset(){ FX.fires.length=FX.smokes.length=FX.lasers.length=FX.sparks.length=FX.spots.length=FX.lights.length=0; FX.t=0; }

// a fire at the ground point (x,y,z): r = radius of the base, h = flame height.
// o: hurt (false: only to look at, e.g. high on a tank), smoke (smoke amount, 0 none), rate (flame particles, 1 = normal), far (no particles beyond this distance),
//    big (treat as a large fire: long plume of smoke; default r>10), e ([half length, half width, heading]: an elliptical fire, a burning puddle; r is then ignored for the damage test),
//    reach, lum (the light it casts on a level with theme.firelight: see addFireLight; no reach, no light)
function addFire(x,y,z,r,h,o){ o=o||{};
  const big=o.big!==undefined?o.big:r>10; FX.fires.push({x,y,z,r,h,hurt:o.hurt!==false,smoke:o.smoke===undefined?(big?1.5:.5):o.smoke,far:o.far||(big?1000:320),rate:o.rate||1,e:o.e||null,acc:0,sacc:0,big}); if(o.reach) addFireLight(x,y+Math.min(h*.7,26),z,o.reach,o.lum); }
// a source of light for theme.firelight: (x,y,z) is where the light comes from, reach = how far it gets, lum = its strength (1: a burning puddle)
function addFireLight(x,y,z,reach,lum){ FX.lights.push({x,y,z,R:reach,R2:reach*reach,lum:lum===undefined?1:lum,ph:FX.lights.length*2.4,disc:null}); }
// a column of smoke. o: rate (per second), life (seconds), size, rise (speed), col, to (colour at the end of its life), a (alpha), grow, far, wind ([x,z] drift speed)
function addSmoke(x,y,z,r,o){ FX.smokes.push(Object.assign({x,y,z,r,rate:4,life:6,size:3,rise:5,col:[.3,.3,.32],to:[.5,.5,.52],a:.3,grow:2.5,far:400,wind:[2,1],acc:0},o||{})); }
// electric sparks: `n` sparkers that come on every now and then, each at another of the `spots` ([[x,z],...]), near the player when they can. A short crackle warns of each one.
function addSparkSpots(spots,n,r){ for(const p of spots) FX.spots.push(p); for(let i=0;i<n;i++) FX.sparks.push({x:0,z:0,y:0,r:r||7,st:0,t:i*.4+.5,hx:0,arcs:[]}); }
// a set of laser beams across the road at (x,z): (lx,lz) = unit vector across, span = half length, tx,tz = along the road, heights = [y, ...] lit one after the other,
// hurts = index of the beam that reaches the cars (-1: none), ph = phase of the cycle in seconds
function addLaser(x,z,tx,tz,lx,lz,span,heights,hurts,ph){ FX.lasers.push({x,z,tx,tz,lx,lz,span,heights,hurts,ph,b:heights.map(()=>0)}); }

// how lit a beam is: on for LASER_ON seconds, then LASER_GAP dark before the next one lights, with soft edges (never a hard flash)
function laserLevel(L,k){ const slot=LASER_ON+LASER_GAP, n=L.heights.length, T=slot*n, t=(((FX.t+L.ph-k*slot)%T)+T)%T; return t>LASER_ON?0:Math.min(1,t/LASER_FADE,(LASER_ON-t)/LASER_FADE); }

// the clock of the lasers and sparks
function hazStep(dt){
  FX.t+=dt;
  for(const L of FX.lasers) for(let k=0;k<L.b.length;k++) L.b[k]=laserLevel(L,k);
  for(const S of FX.sparks){ S.t-=dt; if(S.t>0) continue;
    if(S.st===0){ if(!FX.spots.length){ S.t=9; continue; }
      let p=null; for(let k=0;k<14;k++){ const q=FX.spots[(Math.random()*FX.spots.length)|0]; p=q; if(Math.hypot(q[0]-car.x,q[1]-car.z)<240) break; }
      S.x=p[0]; S.z=p[1]; S.y=hAt(p[0],p[1]); S.st=1; S.t=SPARK_WARN; }
    else if(S.st===1){ S.st=2; S.t=rr(.8,1.4); }
    else { S.st=0; S.t=rr(.7,3); } }
}
// damage from fire, sparks and lasers for one car, once per step
function fxHurt(c,dt){
  c.zap=Math.max(0,(c.zap||0)-dt); c.fireSafe=Math.max(0,(c.fireSafe||0)-dt); c.fireWreck=false; c.shockWreck=false; c.lavaWreck=false;
  if(c.burn){ c.burnT-=dt;                                                  // alight: when the time is up the fire goes out with one hit, then the car is immune for a moment
    if(c.burnT<=0){ c.burn=false; c.fireSafe=FIRE_IMMUNE_TIME; hurt(c,FIRE_HIT_DAMAGE*(isHuman(c)?1:FIRE_OPPONENT_FACTOR),1); c.fireWreck=c.wreckT>0&&!c.shock&&!c.lavaFire; c.shockWreck=c.wreckT>0&&c.shock; c.lavaWreck=c.wreckT>0&&c.lavaFire; c.events.push({t:'firehit',shock:c.shock,lava:c.lavaFire}); } }
  else if(c.fireSafe<=0&&c.inv<=0&&race.state==='race'&&!c.fin){
    // the flames are tested at each of the car's collision circles (CAR_DISCS, along its length), not only at its centre: a fire built round
    // a solid prop (Volcanic Island's burning rocks) stops the nose 2.4 m from the centre, so a head-on hit never reached the centre's test
    const hx=Math.sin(c.yaw), hz=Math.cos(c.yaw), L=CAR_DISCS.reduce((a,o)=>Math.max(a,Math.abs(o)),0);
    for(const f of FX.fires){ if(!f.hurt) continue;
      const R=(f.e?f.e[0]+1:f.r+1)+L;
      if(Math.abs(c.x-f.x)>R||Math.abs(c.z-f.z)>R||c.y>f.y+f.h*.8||c.y<f.y-3) continue;
      let inside=false;
      for(const o of CAR_DISCS){ const dx=c.x+hx*o-f.x, dz=c.z+hz*o-f.z;
        if(f.e){ const cy=Math.cos(f.e[2]), sy=Math.sin(f.e[2]), a=(dx*sy+dz*cy)/f.e[0], b=(dx*cy-dz*sy)/f.e[1]; inside=a*a+b*b<1; }
        else inside=dx*dx+dz*dz<(f.r+.8)*(f.r+.8);
        if(inside) break; }
      if(inside){ c.burn=true; c.shock=false; c.lavaFire=false; c.burnT=FIRE_BURN_TIME; break; } } }
  if(!c.burn&&c.fireSafe<=0&&c.inv<=0&&race.state==='race'&&!c.fin){
    const lava=c.inLava, beam=!lava&&inLaser(c), shock=!lava&&!beam&&LV.shockAt&&LV.shockAt(c);                 // a shock is the same status as fire (same timing, damage and slowdown), with sparks for flames and its own messages
    if(lava||beam||shock){ c.burn=true; c.shock=!!shock; c.lavaFire=lava; c.burnT=FIRE_BURN_TIME; } }
  if(c.zap>0) return;
  for(const S of FX.sparks) if(S.st===2&&Math.hypot(c.x-S.x,c.z-S.z)<S.r&&Math.abs(c.y-S.y)<5){ zapCar(c,SPARK_DAMAGE); return; }
}
// is the car in a lit beam that reaches the cars?
function inLaser(c){
  for(const L of FX.lasers){ const k=L.hurts; if(k<0||L.b[k]<.5) continue;
    const dx=c.x-L.x, dz=c.z-L.z, a=dx*L.tx+dz*L.tz, l=dx*L.lx+dz*L.lz;
    if(Math.abs(a)<2.6&&Math.abs(l)<L.span&&Math.abs(c.y+.8-L.heights[k])<1.6) return true; }
  return false; }
// sparks on a shocked car (the same as the sparks on the floor, moving with the car), in place of burnFx's flames
function shockFx(c){ if(Math.random()<.6) emit(c.x+rr(-1.8,1.8),c.y+rr(.3,2.2),c.z+rr(-1.8,1.8),c.vx*.75+rr(-7,7),rr(2,9),c.vz*.75+rr(-7,7),rr(.25,.5),.13,[.85,.95,1],{to:[.2,.5,1],grav:26,a:1,hot:true}); }
function zapCar(c,amount){ hurt(c,amount); c.zap=ZAP_COOLDOWN; c.events.push({t:'zap'}); }

// ---------- particles ----------
function fireParts(f,dt,lod){
  const big=f.big, s=big?clamp(f.r*.95,4,30):clamp(f.r*.55,.45,15), life=big?1.5:.75;
  f.acc+=(big?26:clamp(8+f.r*3,9,26))*f.rate*lod*dt;
  while(f.acc>=1){ f.acc-=1;
    let px,pz; const a=rr(0,6.283), d=Math.sqrt(Math.random());
    if(f.e){ const cy=Math.cos(f.e[2]), sy=Math.sin(f.e[2]), u=Math.cos(a)*d*f.e[0], v=Math.sin(a)*d*f.e[1]; px=f.x+u*sy+v*cy; pz=f.z+u*cy-v*sy; }
    else { px=f.x+Math.cos(a)*d*f.r; pz=f.z+Math.sin(a)*d*f.r; }
    const up=f.h/life*rr(.6,1.15);
    if(Math.random()<.45) emit(px,f.y+.2,pz,rr(-.4,.4),up*.7,rr(-.4,.4),life*.6,s*rr(.5,.8),[1,.92,.5],{to:[1,.55,.1],grow:-.5,a:.95,hot:true});
    else emit(px,f.y+.2,pz,rr(-.8,.8)-(big?3:0),up,rr(-.8,.8),life*rr(.8,1.15),s*rr(.7,1.1),[1,.6,.12],{to:[.62,.1,.03],grow:-.45,a:.92,hot:true}); }
  if(f.smoke>0&&parts.length<900){ f.sacc+=(big?2.2:1.2)*f.smoke*lod*dt;   // (smoke lives long: it may not fill the budget and starve the flames)
    while(f.sacc>=1){ f.sacc-=1; const k=rr(.8,1.2), sl=big?rr(9,14):rr(1.6,2.6);
      emit(f.x+rr(-f.r,f.r)*.6,f.y+f.h*.7,f.z+rr(-f.r,f.r)*.6,big?rr(2,6):rr(-.5,.5),(big?13:4.5)*k,big?rr(.5,3):rr(-.5,.5),sl,big?Math.min(9,s*1.4):s*1.2,THEME.fireSmoke||[.16,.1,.07],{to:[.05,.05,.06],grow:big?2.6:2.2,drag:big?.05:.5,a:big?.72:.4}); } }
}
// per-step emitters: only what is near enough to the car to be seen
function fxEmit(dt){
  if(FIRE_SMOKE_PARTICLES) for(const f of FX.fires){ const d=Math.hypot(f.x-car.x,f.z-car.z); if(d<f.far) fireParts(f,dt,Math.max(.18,1-smooth(f.far*.3,f.far,d))); }
  if(FIRE_SMOKE_PARTICLES) for(const S of FX.smokes){ const d=Math.hypot(S.x-car.x,S.z-car.z); if(d>S.far) continue;
    S.acc+=S.rate*dt;
    while(S.acc>=1){ S.acc-=1; const k=rr(.75,1.25);
      emit(S.x+rr(-S.r,S.r),S.y,S.z+rr(-S.r,S.r),S.wind[0]*k,S.rise*k,S.wind[1]*k,S.life*k,S.size*k,S.col,{to:S.to,grow:S.grow,drag:.04,a:S.a}); } }
  for(const S of FX.sparks){ if(S.st===0||Math.hypot(S.x-car.x,S.z-car.z)>320) continue;
    if(S.st===1){ if(Math.random()<dt*5) emit(S.x+rr(-1.5,1.5),S.y+.3,S.z+rr(-1.5,1.5),rr(-2,2),rr(2,5),rr(-2,2),.3,.1,[.7,.9,1],{grav:24,a:1,hot:true}); continue; }
    if(Math.random()<dt*9) emit(S.x+rr(-S.r,S.r)*.6,S.y+rr(.3,2.5),S.z+rr(-S.r,S.r)*.6,rr(-7,7),rr(2,9),rr(-7,7),rr(.25,.5),.13,[.85,.95,1],{to:[.2,.5,1],grav:26,a:1,hot:true}); }
  if(THEME.embers) for(let n=0;n<dt*60*THEME.embers;n++)                 // embers carried on the hot air round the car
    emit(car.x+rr(-60,60),car.y+rr(.5,26),car.z+rr(-60,60),rr(-5,-1),rr(1,5),rr(-2,3),rr(1.5,3),rr(.09,.17),[1,rr(.45,.8),.12],{to:[.7,.12,.03],a:.95,hot:true});
}
// fill the air before the first frame, so a race does not start with every plume of smoke still on the ground
function fxPrewarm(){ if(!FIRE_SMOKE_PARTICLES||(!FX.fires.length&&!FX.smokes.length)) return;
  for(let i=0;i<70;i++){ fxEmit(1/10); updateParts(1/10); } }

// ---------- laser and arc meshes (additive, like the light trails) ----------
const fxBufs={pb:gl.createBuffer(),nb:gl.createBuffer(),cb:gl.createBuffer(),count:0};
function updateFxMesh(){
  const pos=[], col=[];
  const q=(a,b,c,d,k)=>{ for(const p of [a,b,c,a,c,d]){ pos.push(p[0],p[1],p[2]); col.push(k[0],k[1],k[2]); } };
  const rib=(a,b,w,k)=>{ q([a[0],a[1]-w,a[2]],[b[0],b[1]-w,b[2]],[b[0],b[1]+w,b[2]],[a[0],a[1]+w,a[2]],k);     // two crossed ribbons: visible from any side
    const dx=b[0]-a[0], dz=b[2]-a[2], l=Math.hypot(dx,dz)||1, nx=-dz/l*w, nz=dx/l*w;
    q([a[0]-nx,a[1],a[2]-nz],[b[0]-nx,b[1],b[2]-nz],[b[0]+nx,b[1],b[2]+nz],[a[0]+nx,a[1],a[2]+nz],k); };
  for(const L of FX.lasers){ if(Math.hypot(L.x-car.x,L.z-car.z)>620) continue;
    L.heights.forEach((y,k)=>{ const b=L.b[k], sp=L.span, A=[L.x-L.lx*sp,y,L.z-L.lz*sp], B=[L.x+L.lx*sp,y,L.z+L.lz*sp];
      for(const sg of [-1,1]){ const px=L.x+L.lx*sp*sg, pz=L.z+L.lz*sp*sg, on=.16+.84*b;                 // the lamp of this beam on each emitter: dim while off, so the sequence can be read from far away
        q([px-L.tx*.5,y-.4,pz-L.tz*.5],[px+L.tx*.5,y-.4,pz+L.tz*.5],[px+L.tx*.5,y+.4,pz+L.tz*.5],[px-L.tx*.5,y+.4,pz-L.tz*.5],[on,.04*on,.03*on]); }
      if(b<=0) return;
      rib(A,B,.14,[b,.12*b,.08*b]); rib(A,B,.5,[.34*b,.02*b,.02*b]); }); }
  for(const S of FX.sparks){ if(S.st!==2||Math.hypot(S.x-car.x,S.z-car.z)>420) continue;
    const seed=Math.floor(FX.t*9);                                                                        // a new shape 9 times a second: small and thin, so it crackles rather than flashes
    if(S.hx!==seed){ S.hx=seed; S.arcs=[]; for(let k=0;k<2;k++){ const a=Math.random()*6.283, arc=[[S.x,S.y+rr(2,4),S.z]]; const n=3;
        for(let i=1;i<=n;i++){ const f=i/n; arc.push([S.x+Math.cos(a)*S.r*f+rr(-1,1),S.y+(1-f)*rr(2,4)+.1,S.z+Math.sin(a)*S.r*f+rr(-1,1)]); } S.arcs.push(arc); } }
    for(const arc of S.arcs) for(let i=1;i<arc.length;i++) rib(arc[i-1],arc[i],.09,[.55,.8,1]); }
  for(const c of [car,...AIS]){ if(!c.burn||!c.shock||c.wreckT>0||Math.hypot(c.x-car.x,c.z-car.z)>420) continue;          // arcs from a shocked car to the ground: kept relative to the car, which moves between shapes
    const seed=Math.floor(FX.t*9);
    if(c.arcHx!==seed){ c.arcHx=seed; c.arcs=[]; for(let k=0;k<3;k++){ const a=Math.random()*6.283, arc=[[0,rr(1,2.2),0]]; const n=3;
        for(let i=1;i<=n;i++){ const f=i/n; arc.push([Math.cos(a)*3.4*f+rr(-.5,.5),(1-f)*rr(1,2.2)+.1,Math.sin(a)*3.4*f+rr(-.5,.5)]); } c.arcs.push(arc); } }
    const at=p=>[c.x+p[0],c.y+p[1],c.z+p[2]];
    for(const arc of c.arcs) for(let i=1;i<arc.length;i++) rib(at(arc[i-1]),at(arc[i]),.07,[.55,.8,1]); }
  gl.bindBuffer(gl.ARRAY_BUFFER,fxBufs.pb); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(pos),gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER,fxBufs.nb); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(pos.length),gl.DYNAMIC_DRAW);    // zero normals: emissive
  gl.bindBuffer(gl.ARRAY_BUFFER,fxBufs.cb); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(col),gl.DYNAMIC_DRAW);
  fxBufs.count=pos.length/3;
}

// ---------- firelight (theme.firelight) ----------
// Lighting that comes from the fires, not from the sky. bakeFirelight multiplies the vertex colours of the static meshes (loadLevel, once the fires are registered): near a light
// they get its colour, by a ramp from deep red at the edge of its reach through orange to yellow-white, on the side that faces it; elsewhere they fall to the darkness, which
// deepens with the distance from the road, so the road stays readable and the scenery beyond it sinks. Emissive geometry is left alone. Cars cannot be baked: carFirelight sets
// their ambient light each frame. drawFireGlow adds a pool of light that breathes round each fire near the car, each at its own pace.
// theme.firelight: dark (darkness at the road), far (darkness away from it), farAt (distance from the road where `far` is reached), deep, mid, hot (the ramp), gain, decor and marks (how much of the darkness scenery and road markings keep: unlit scenery sinks further, markings stay readable), car (ambient kept on a car), pool (the breathing pool's colour)
const FL_CELL=40, FL_N=36, flGrid=[], flRamp=[0,0,0];
function flIndex(x,z){ const i=Math.floor(x/FL_CELL+FL_N/2), j=Math.floor(z/FL_CELL+FL_N/2); return i<0||j<0||i>=FL_N||j>=FL_N?-1:j*FL_N+i; }
function flBuild(){ flGrid.length=0; for(let i=0;i<FL_N*FL_N;i++) flGrid.push([]);
  for(const L of FX.lights) for(let z=L.z-L.R-FL_CELL;z<=L.z+L.R+FL_CELL;z+=FL_CELL) for(let x=L.x-L.R-FL_CELL;x<=L.x+L.R+FL_CELL;x+=FL_CELL){ const k=flIndex(x,z); if(k>=0&&flGrid[k][flGrid[k].length-1]!==L) flGrid[k].push(L); } }
// light falling on a point; with a normal (nx,ny,nz) only as much as that surface faces it
function flEnergy(x,y,z,nx,ny,nz){ const k=flIndex(x,z); if(k<0) return 0; let e=0; const list=flGrid[k];
  for(let i=0;i<list.length;i++){ const L=list[i], dx=L.x-x, dy=L.y-y, dz=L.z-z, d2=dx*dx+dy*dy+dz*dz; if(d2>=L.R2) continue;
    const q=1-d2/L.R2; let a=q*q*L.lum; if(nx!==undefined) a*=clamp(.42+.58*(dx*nx+dy*ny+dz*nz)/(Math.sqrt(d2)||1),0,1); e+=a; }
  return e; }
function flColour(e,F){ const t=1-Math.exp(-e*F.gain), a=F.deep, b=F.mid, c=F.hot, u=clamp(t*2,0,1), v=clamp(t*2-1,0,1);
  for(let i=0;i<3;i++) flRamp[i]=(a[i]+(b[i]-a[i])*u+(c[i]-b[i])*v)*t; return flRamp; }
function bakeFirelight(terrain,decor,marks){ const F=THEME.firelight; flBuild();
  for(const [m,keep] of [[terrain,1],[decor,F.decor],[marks,F.marks]]){ const P=m.p, No=m.n, C=m.c;
    for(let i=0;i<P.length;i+=3){ const nx=No[i], ny=No[i+1], nz=No[i+2]; if(nx*nx+ny*ny+nz*nz<.25) continue;
      const x=P[i], z=P[i+2], w=smooth(HALFW+4,F.farAt,roadDist(x,z)), L=flColour(flEnergy(x,P[i+1],z,nx,ny,nz),F);
      for(let k=0;k<3;k++) C[i+k]*=(F.dark[k]+(F.far[k]-F.dark[k])*w)*keep+L[k]; } } }
const flBreath=(L,t)=>.5+.3*Math.sin(t*3.1+L.ph)+.2*Math.sin(t*7.3+L.ph*1.7);      // slow and soft: a fire moves, it must not strobe
function carFirelight(c){ const F=THEME.firelight, L=flColour(flEnergy(c.x,c.y+1.5,c.z),F), A=THEME.amb, k=F.car;
  gl.uniform3f(loc.uAmb,A[0]*k+L[0]*.3,A[1]*k+L[1]*.3,A[2]*k+L[2]*.3); }
const flBufs={pb:gl.createBuffer(),nb:gl.createBuffer(),cb:gl.createBuffer(),count:0};
function drawFireGlow(I){ const t=performance.now()/1000, pos=[], col=[], SEG=10, F=THEME.firelight, G=F.pool;
  for(const L of FX.lights){ const R=L.R*.7; if(Math.hypot(L.x-car.x,L.z-car.z)>260+R) continue;
    if(!L.disc){ L.disc=[]; for(const f of [.04,.5,1]) for(let i=0;i<SEG;i++){ const a=i/SEG*6.283, x=L.x+Math.cos(a)*R*f, z=L.z+Math.sin(a)*R*f; L.disc.push([x,hAt(x,z)+.3,z]); } }
    const b=flBreath(L,t)*Math.min(1,L.lum), D=L.disc, K=[G[0]*b,G[1]*b,G[2]*b], H=[K[0]*.45,K[1]*.45,K[2]*.45], Z=[0,0,0];
    const tri=(p,a,q,c,r,e)=>{ pos.push(...p,...q,...r); col.push(...a,...c,...e); };
    for(let i=0;i<SEG;i++){ const j=(i+1)%SEG, a=D[i], b2=D[j], c=D[SEG+i], d=D[SEG+j], e=D[SEG*2+i], g=D[SEG*2+j];
      tri(a,K,c,H,d,H); tri(a,K,d,H,b2,K); tri(c,H,e,Z,g,Z); tri(c,H,g,Z,d,H); } }
  gl.bindBuffer(gl.ARRAY_BUFFER,flBufs.pb); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(pos),gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER,flBufs.nb); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(pos.length),gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER,flBufs.cb); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(col),gl.DYNAMIC_DRAW);
  flBufs.count=pos.length/3; drawMesh(flBufs,I,1); }
