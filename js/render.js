'use strict';
// Per-frame rendering: shadows, headlight, sky, world and cars.
let LIGHT=[0.5,0.8,0.35];
const HEADLIGHT_AIR_GAP=1.5;                                   // metres above the ground over which the headlight goes from draped on it to carried by the car
function updateShadow(c){
  const cxs=c.x, czs=c.z, sy=Math.sin(c.yaw), cy=Math.cos(c.yaw), pos=[], nor=[], col=[];
  const g=[]; for(let j=0;j<=4;j++) for(let i=0;i<=4;i++){
    const a=(i/4-.5)*2*1.5, b=(j/4-.5)*2*2.2;                      // local x (lateral), z (forward)
    const wx=cxs+cy*a+sy*b, wz=czs-sy*a+cy*b;
    g.push([wx, hAtY(wx,wz,c.y)+0.18, wz]); }
  for(let j=0;j<4;j++) for(let i=0;i<4;i++){
    const q=[g[j*5+i],g[j*5+i+1],g[(j+1)*5+i+1],g[(j+1)*5+i]];
    for(const t of [[0,1,2],[0,2,3]]) for(const v of t){ pos.push(...q[v]); nor.push(0,1,0); col.push(0,0,0); } }
  gl.bindBuffer(gl.ARRAY_BUFFER,shadowBufs.pb); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(pos),gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER,shadowBufs.nb); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(nor),gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER,shadowBufs.cb); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(col),gl.DYNAMIC_DRAW);
  shadowBufs.count=pos.length/3;
}
// how far the headlight has left the ground: 0 on the road (and on a small hop), 1 once the car is clear of it
function headlightAir(){
  if(car.grounded) return 0;
  const k=clamp((car.y-hAtY(car.x,car.z,car.y))/HEADLIGHT_AIR_GAP,0,1); return k*k*(3-2*k);
}
// night: a warm cone of light draped on the road ahead of the car, fading with distance (drawn additively).
// In the air (air>0) it turns into a rigid sheet carried by the car, in the car's own pitch and roll, that never sinks below the ground
function updateHeadlight(air){
  const sy=Math.sin(car.yaw), cy=Math.cos(car.yaw), NZ=6, NX=3, g=[], pos=[], nor=[], col=[], m=air>0?carMatrix(car):null;
  for(let j=0;j<=NZ;j++) for(let i=0;i<=NX;i++){
    const f=j/NZ, len=2+f*32, half=1.4+f*8, a=(i/NX-.5)*2*half, wx=car.x+sy*len+cy*a, wz=car.z+cy*len-sy*a;
    const wy=hAtY(wx,wz,car.y)+0.22;
    if(!m){ g.push([wx,wy,wz,1-f]); continue; }
    const px=m[0]*a+m[4]*.17+m[8]*len+m[12], pz=m[2]*a+m[6]*.17+m[10]*len+m[14],      // (.17: the cone's .22 over the ground, less the .05 carMatrix lifts the car)
          py=Math.max(m[1]*a+m[5]*.17+m[9]*len+m[13],hAtY(px,pz,car.y)+0.22);
    g.push([lerp(wx,px,air),lerp(wy,py,air),lerp(wz,pz,air),1-f]); }
  for(let j=0;j<NZ;j++) for(let i=0;i<NX;i++){
    const q=[g[j*(NX+1)+i],g[j*(NX+1)+i+1],g[(j+1)*(NX+1)+i+1],g[(j+1)*(NX+1)+i]];
    for(const t of [[0,1,2],[0,2,3]]) for(const v of t){ const p=q[v], k=0.34*p[3]*p[3]; pos.push(p[0],p[1],p[2]); nor.push(0,0,0); col.push(k,k*.9,k*.62); } }
  gl.bindBuffer(gl.ARRAY_BUFFER,lightBufs.pb); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(pos),gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER,lightBufs.nb); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(nor),gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER,lightBufs.cb); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(col),gl.DYNAMIC_DRAW);
  lightBufs.count=pos.length/3;
}

// Underwater: the near plane is the lens, so a pixel is under water when its point on the near plane is. Over those two metres the surface is one flat plane, and the
// near plane is flat too, so the depth is a linear function of the screen (uPlane) and the waterline is an exact straight line, whatever the camera's angle. It is the same
// line where the water mesh itself meets the near plane, so it joins that mesh's horizon in a half-sunk view; rays seen below it keep the tint even after they leave the water.
function drawUnderwater(view,T){
  if(!UNDERWATER_TINT) return;
  const e=cam.pos, n=NEAR_PLANE, ty=Math.tan(cam.fov/2)*n, tx=ty*aspect, cx=e[0]-view[2]*n, cy=e[1]-view[6]*n, cz=e[2]-view[10]*n,    // the middle of the near plane
        ax=view[4]*tx, ay=view[5]*ty, spread=Math.abs(ax)+Math.abs(ay);                       // world height gained per unit of screen x and y
  let W=null;
  for(const [a,b] of [[0,0],[-1,-1],[1,-1],[-1,1],[1,1]]){ const q=waterAt(cx+view[0]*tx*a+view[1]*ty*b,cz+view[8]*tx*a+view[9]*ty*b); if(q&&(!W||q.level>W.level)) W=q; }
  if(!W||W.level<=cy-spread) return;                                                         // no water here, or the whole near plane is above it
  const L=LIGHT[1], lit=[0,1,2].map(i=>Math.min(1,T.amb[i]+T.hemi[i]+T.sun[i]*Math.max(L,0)));   // lit like the surface itself, so it does not glow at night
  gl.useProgram(underProg); gl.uniform3f(underLoc.plane,-ax,-ay,W.level-cy);
  gl.uniform4f(underLoc.col,W.col[0]*lit[0],W.col[1]*lit[1],W.col[2]*lit[2],UNDERWATER_TINT);
  gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.bindBuffer(gl.ARRAY_BUFFER,skyBuf); gl.enableVertexAttribArray(underLoc.aP); gl.vertexAttribPointer(underLoc.aP,2,gl.FLOAT,false,0,0);
  gl.drawArrays(gl.TRIANGLES,0,6); gl.disableVertexAttribArray(underLoc.aP); gl.disable(gl.BLEND);
}

let carDiscGL=null;                                          // (debug: one collision circle of a car, built on first use)
function render(){
  const T=THEME;
  gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.disable(gl.CULL_FACE);
  gl.clearColor(T.fog[0],T.fog[1],T.fog[2],1); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  const target=cam.target||[car.x+Math.sin(cam.yaw)*5, car.y+2.0, car.z+Math.cos(cam.yaw)*5];   // (cam.target: a point the camera looks at instead, set by a cutscene or ?look)
  const view=M4.lookAt(cam.pos,target,[0,1,0]);
  const vp=M4.mul(M4.persp(cam.fov,aspect,NEAR_PLANE,EXPAND_TERRAIN_AROUND_LEVEL?60000:900),view);

  // sky
  gl.useProgram(skyProg); gl.uniform3fv(skyLoc.top,T.skyTop); gl.uniform3fv(skyLoc.hor,T.skyHor);
  gl.uniform1f(skyLoc.yaw,cam.yaw);
  gl.uniform2f(skyLoc.res,canvas.width,canvas.height); gl.uniform1f(skyLoc.fovH,2*Math.atan(Math.tan(cam.fov/2)*aspect));
  if(T.body){ gl.uniform4f(skyLoc.body,T.body.yaw,T.body.y,T.body.r,1); gl.uniform3fv(skyLoc.bodyCol,T.body.col); } else gl.uniform4f(skyLoc.body,0,0,0,0);
  if(T.body2){ gl.uniform4f(skyLoc.body2,T.body2.yaw,T.body2.y,T.body2.r,T.body2.mode||1); gl.uniform3fv(skyLoc.body2Col,T.body2.col||[1,1,1]); } else gl.uniform4f(skyLoc.body2,0,0,0,0);
  gl.uniform1f(skyLoc.stars,T.stars?1:0);
  if(T.clouds){                                                // large round clouds over the horizon (screen height of the horizon is projected from the camera)
    const hx=cam.pos[0]+Math.sin(cam.yaw)*4000, hz=cam.pos[2]+Math.cos(cam.yaw)*4000, w=vp[3]*hx+vp[7]*cam.pos[1]+vp[11]*hz+vp[15], yy=vp[1]*hx+vp[5]*cam.pos[1]+vp[9]*hz+vp[13];
    gl.uniform2f(skyLoc.cloud,clamp(yy/w*0.5+0.5,0,1),T.clouds.pillars?2:(T.clouds.amt||1)); gl.uniform3fv(skyLoc.cloudCol,T.clouds.col); gl.uniform3fv(skyLoc.cloudShade,T.clouds.shade);
    if(T.clouds.pillars) gl.uniform3fv(skyLoc.pil,T.clouds.pillars);
  } else gl.uniform2f(skyLoc.cloud,0,0);
  gl.bindBuffer(gl.ARRAY_BUFFER,skyBuf); gl.enableVertexAttribArray(skyLoc.aP); gl.vertexAttribPointer(skyLoc.aP,2,gl.FLOAT,false,0,0);
  gl.drawArrays(gl.TRIANGLES,0,6); gl.disableVertexAttribArray(skyLoc.aP);

  gl.enable(gl.DEPTH_TEST); if(skirtCount) drawSkirt(vp,T);
  gl.useProgram(mainProg);
  for(const a of [aPos,aNor,aCol]) gl.enableVertexAttribArray(a);
  gl.uniformMatrix4fv(loc.uVP,false,vp); gl.uniform3fv(loc.uLight,LIGHT);
  gl.uniform3fv(loc.uAmb,T.amb); gl.uniform3fv(loc.uHemi,T.hemi); gl.uniform3fv(loc.uSun,T.sun);
  gl.uniform1f(loc.uFogNear,T.fogN); gl.uniform1f(loc.uFogFar,T.fogF); gl.uniform3fv(loc.uFogCol,T.fog);
  const I=M4.ident(), beamAir=T.night&&car.wreckT<=0?headlightAir():0;
  drawMesh(terrainGL,I); drawMesh(decorGL,I);
  if(LV.drawDynamic) LV.drawDynamic((k,mt,a)=>drawMesh(dynGL[k],mt,a),(k,pos)=>{ gl.bindBuffer(gl.ARRAY_BUFFER,dynGL[k].pb); gl.bufferData(gl.ARRAY_BUFFER,pos,gl.DYNAMIC_DRAW); });   // the level's moving meshes (gl.js); the second function replaces a mesh's vertex positions
  gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-2,-8); drawMesh(marksGL,I); gl.disable(gl.POLYGON_OFFSET_FILL);   // road markings

  // river water + car shadow (alpha blended)
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
  drawMesh(waterGL,I,0.72);
  for(const c of [car,...AIS]) if(c.wreckT<=0&&Math.hypot(c.x-car.x,c.z-car.z)<220){ updateShadow(c); drawMesh(shadowBufs,I,0.38); }
  if(T.trails){ updateTrailMesh(); gl.blendFunc(gl.SRC_ALPHA,gl.ONE); drawMesh(trailBufs,I,0.95); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA); }   // light trails
  if(FX.lasers.length||FX.sparks.length){ updateFxMesh(); gl.blendFunc(gl.SRC_ALPHA,gl.ONE); drawMesh(fxBufs,I,.95); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA); }   // laser beams and electric arcs
  // night: lamp light pools and the headlight cone (additive)
  if(T.night){
    gl.blendFunc(gl.ONE,gl.ONE);
    drawMesh(glowGL,I,1); if(T.firelight) drawFireGlow(I);
    if(LV.drawDynamicGlow){ gl.blendFunc(gl.SRC_ALPHA,gl.ONE); LV.drawDynamicGlow((k,mt,a)=>drawMesh(dynGL[k],mt,a)); gl.blendFunc(gl.ONE,gl.ONE); }   // a level's moving light (additive, alpha = strength): the ending's beams
    if(car.wreckT<=0&&!beamAir){ updateHeadlight(0); drawMesh(lightBufs,I,1); }
  }
  gl.depthMask(true); gl.disable(gl.BLEND);

  // cars (the player blinks while invulnerable after a respawn and is hidden while wrecked)
  const drawCar=(c,mesh)=>{
    if(T.firelight) carFirelight(c); const cm=carMatrix(c); drawMesh(mesh,cm);
    for(const w of WHEELS){
      let m=M4.mul(cm,M4.translate(w[0],w[1],w[2]));
      if(w[3]) m=M4.mul(m,M4.rotY(-c.steer*0.5));
      m=M4.mul(m,M4.rotX(c.spin));
      drawMesh(wheelGL,m);
    }
  };
  const blink=((performance.now()/90)|0)%2;
  if(car.wreckT<=0 && !((car.inv>0||car.fireSafe>0) && blink)) drawCar(car,carGLs[0]);
  AIS.forEach((c,k)=>{ if(c.wreckT<=0&&!(c.fireSafe>0&&blink)&&Math.hypot(c.x-car.x,c.z-car.z)<700) drawCar(c,carGLs[k+1]); });
  if(beamAir){                                                 // off the ground the cone may hang over other cars, so it goes after them
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE,gl.ONE); gl.depthMask(false);
    updateHeadlight(beamAir); drawMesh(lightBufs,I,1);
    gl.depthMask(true); gl.disable(gl.BLEND);
  }
  if(colliderGL){                                              // debug (SHOW_COLLIDERS_IN_GAME): the collision shapes and every car's collision circles, see-through
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    drawMesh(colliderGL,I,.3); if(!carDiscGL) carDiscGL=buildCarDiscMesh().upload(gl);
    for(const c of [car,...AIS]) if(c.wreckT<=0){ const hx=Math.sin(c.yaw), hz=Math.cos(c.yaw); for(const o of CAR_DISCS) drawMesh(carDiscGL,M4.translate(c.x+hx*o,c.y,c.z+hz*o),.4); }
    gl.depthMask(true); gl.disable(gl.BLEND);
  }
  if(T.firelight) gl.uniform3fv(loc.uAmb,T.amb); drawParts(view,vp);
  for(const a of [aPos,aNor,aCol]) gl.disableVertexAttribArray(a);
  drawUnderwater(view,T);
}
