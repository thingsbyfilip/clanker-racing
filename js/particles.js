'use strict';
// Particle system (soft sprites) and the car / explosion effects that feed it.
const MAXP=3200, parts=[], partArr=new Float32Array(MAXP*54), rr=(a,b)=>a+Math.random()*(b-a);
// o: {grow, grav, drag, a (peak alpha), to (colour at the end of its life), hot (fire: drawn over the smoke, stays bright at night)}
function emit(x,y,z,vx,vy,vz,life,size,col,o){
  if(parts.length>=MAXP) return; o=o||{};
  parts.push({x,y,z,vx,vy,vz,life,max:life,size,r:col[0],g:col[1],b:col[2],a:o.a===undefined?0.6:o.a,grow:o.grow||0,grav:o.grav||0,drag:o.drag||0,to:o.to||null,hot:!!o.hot}); }
function updateParts(dt){
  for(let i=parts.length-1;i>=0;i--){ const p=parts[i]; p.life-=dt;
    if(p.life<=0){ parts[i]=parts[parts.length-1]; parts.pop(); continue; }
    const d=Math.max(0,1-p.drag*dt); p.vx*=d; p.vy=p.vy*d-p.grav*dt; p.vz*=d;
    p.x+=p.vx*dt; p.y+=p.vy*dt; p.z+=p.vz*dt;
    const gy=hAtY(p.x,p.z,p.y+1)+0.1; if(p.y<gy){ p.y=gy; p.vy=Math.abs(p.vy)*0.2; } }
}
// particles use their own program: camera-facing quads, a round soft falloff and per-particle alpha
const partProg=program(`
attribute vec3 aP; attribute vec2 aUV; attribute vec4 aC;
uniform mat4 uVP; uniform float uFogNear, uFogFar;
varying vec2 vUV; varying vec4 vC; varying float vFog;
void main(){ gl_Position=uVP*vec4(aP,1.0); vUV=aUV; vC=aC; vFog=clamp((gl_Position.w-uFogNear)/(uFogFar-uFogNear),0.0,1.0); }`,`
precision mediump float;
varying vec2 vUV; varying vec4 vC; varying float vFog; uniform vec3 uFogCol;
void main(){
  float d=dot(vUV,vUV); if(d>1.0) discard;
  float a=vC.a*(1.0-smoothstep(0.2,1.0,d))*(1.0-vFog);
  vec3 c=mix(vC.rgb,uFogCol,vFog); c=floor(c*24.0+0.5)/24.0;
  gl_FragColor=vec4(c,a);
}`);
const pLoc={vp:gl.getUniformLocation(partProg,'uVP'),fn:gl.getUniformLocation(partProg,'uFogNear'),ff:gl.getUniformLocation(partProg,'uFogFar'),fc:gl.getUniformLocation(partProg,'uFogCol'),
  aP:gl.getAttribLocation(partProg,'aP'),aUV:gl.getAttribLocation(partProg,'aUV'),aC:gl.getAttribLocation(partProg,'aC')};
const partBuf=gl.createBuffer(), PQ=[[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]];
function drawParts(view,vp){
  if(!parts.length) return;
  const rx=view[0],ry=view[4],rz=view[8], ux=view[1],uy=view[5],uz=view[9], n=parts.length;
  const buf=partArr; let w=0;
  for(let pass=0;pass<2;pass++) for(let i=0;i<n;i++){ const p=parts[i], t=p.life/p.max; if(p.hot!==(pass===1)) continue;   // fire goes last, in front of the smoke
    const s=Math.max(0.01,p.size*(1+p.grow*(1-t))*Math.min(1,t*5)), al=p.a*Math.min(1,t*2.2), T=p.to, cr=T?p.r+(T[0]-p.r)*(1-t):p.r, cg=T?p.g+(T[1]-p.g)*(1-t):p.g, cb=T?p.b+(T[2]-p.b)*(1-t):p.b;
    for(let k=0;k<6;k++){ const u=PQ[k][0], v=PQ[k][1], o=(w++)*9;
      buf[o]=p.x+(rx*u+ux*v)*s; buf[o+1]=p.y+(ry*u+uy*v)*s; buf[o+2]=p.z+(rz*u+uz*v)*s;
      const pl=(THEME.night&&p.a<0.85&&!p.hot)?0.38:1;               // unlit particles (dust, smoke) look dim at night; fire stays bright
      buf[o+3]=u; buf[o+4]=v; buf[o+5]=cr*pl; buf[o+6]=cg*pl; buf[o+7]=cb*pl; buf[o+8]=al; } }
  gl.useProgram(partProg);
  gl.uniformMatrix4fv(pLoc.vp,false,vp); gl.uniform1f(pLoc.fn,THEME.fogN); gl.uniform1f(pLoc.ff,THEME.fogF); gl.uniform3fv(pLoc.fc,THEME.fog);
  gl.bindBuffer(gl.ARRAY_BUFFER,partBuf); gl.bufferData(gl.ARRAY_BUFFER,buf.subarray(0,n*54),gl.DYNAMIC_DRAW);
  for(const [a,sz,off] of [[pLoc.aP,3,0],[pLoc.aUV,2,3],[pLoc.aC,4,5]]){ gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a,sz,gl.FLOAT,false,36,off*4); }
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
  gl.drawArrays(gl.TRIANGLES,0,n*6);
  gl.depthMask(true); gl.disable(gl.BLEND);
  for(const a of [pLoc.aP,pLoc.aUV,pLoc.aC]) gl.disableVertexAttribArray(a);
  gl.useProgram(mainProg);
}

// what wheels throw up from liquid (puddles, rivers): pale water unless the level's theme.spray says otherwise (oil, liquid methane)
const sprayCol=()=>THEME.spray||[.8,.9,1];

// dust puff: small, soft, tinted by the surface, drifting up and back
function dust(x,y,z,vx,vy,vz,onTrack,big,ice){
  const D=THEME.dust, c=(ice===undefined?car.ice:ice)?D.ice:(ice===undefined&&car.soft>0&&D.soft)?D.soft:onTrack?D.road:D.off, j=rr(0.88,1.08);
  const vac=D.vac;                                                                  // no air: dust flies in low arcs under the level's own gravity
  emit(x,y,z,vx,vy,vz,rr(0.5,0.95)*(big?1.2:1)*(vac?1.7:1),rr(0.16,0.3)*(big?1.4:1)*D.sz,[Math.min(1,c[0]*j),Math.min(1,c[1]*j),Math.min(1,c[2]*j)],{grow:vac?0.3:1.7,drag:vac?0:1.6,grav:vac?-LV.phys.g:0,a:(big?0.65:0.55)*D.a});
}

// dust and splashes behind an opponent (only when it is close enough to be seen)
function aiFx(c,dt){
  if(c.wreckT>0||Math.hypot(c.x-car.x,c.z-car.z)>150) return;
  const fx0=Math.sin(c.yaw), fz0=Math.cos(c.yaw);                                   // smoke and fire from a damaged opponent, like the player's
  if(c.damage>0.45 && Math.random()<(c.damage-0.35)*dt*60*0.5)
    emit(c.x+fx0*1.3+rr(-.3,.3),c.y+1.2,c.z+fz0*1.3+rr(-.3,.3),c.vx*0.5+rr(-.5,.5),rr(3,5),c.vz*0.5+rr(-.5,.5),1.2,0.4,[.25,.25,.28],{grow:2.2,drag:1,a:0.55});
  if(c.damage>0.8 && Math.random()<dt*60*0.6)
    emit(c.x+fx0*1.3+rr(-.3,.3),c.y+1.1,c.z+fz0*1.3+rr(-.3,.3),c.vx*0.5+rr(-1,1),rr(3,6),c.vz*0.5+rr(-1,1),0.35,0.35,[1,rr(.4,.7),.1],{grow:-0.5,a:0.9});
  if(c.burn) burnFx(c);
  const spd=Math.hypot(c.vx,c.vz); if(!c.grounded||spd<6) return;
  const fx=Math.sin(c.yaw), fz=Math.cos(c.yaw), lx=fz, lz=-fx, k=Math.min(1,spd/45)*dt*60*0.55;
  if(c.nitroOn) for(let i=0;i<2;i++)                                                   // nitro flame
    emit(c.x-fx*2.2,c.y+0.85,c.z-fz*2.2,-fx*16+c.vx*0.4+rr(-1.5,1.5),rr(-1,1.5),-fz*16+c.vz*0.4+rr(-1.5,1.5),0.22,rr(0.25,0.4),[1,rr(.55,.9),.15],{grow:-0.6,a:0.9});
  if(c.inWater){ if(Math.random()<k) emit(c.x+rr(-1.2,1.2),c.y+0.3,c.z+rr(-1.2,1.2),c.vx*0.3+rr(-3,3),rr(4,9),c.vz*0.3+rr(-3,3),0.7,0.22,sprayCol(),{grav:26,a:0.8}); return; }
  if(c.puddle>0){ for(const sg of [-1,1]) if(Math.random()<k) emit(c.x-fx*1.2+lx*1.1*sg,c.y+0.25,c.z-fz*1.2+lz*1.1*sg,c.vx*0.2+rr(-2,2),rr(2.5,5.5),c.vz*0.2+rr(-2,2),0.5,0.14,sprayCol(),{grav:26,a:0.75}); return; }
  for(const sg of [-1,1]) if(Math.random()<k*0.5)
    dust(c.x-fx*1.4+lx*1.1*sg,c.y+0.2,c.z-fz*1.4+lz*1.1*sg,-c.vx*0.1+rr(-1,1),rr(0.5,1.8),-c.vz*0.1+rr(-1,1),c.onTrack,false,c.ice);
}

// per-step emitters (dust, splashes, nitro flame, smoke and fire from a damaged car)
function carFx(dt){
  if(THEME.trails) trailsUpdate();
  fxEmit(dt);
  if(car.wreckT>0) return;
  const spd=Math.hypot(car.vx,car.vz), fx=Math.sin(car.yaw), fz=Math.cos(car.yaw), lx=fz, lz=-fx;
  if(car.grounded && spd>4){
    const k=Math.min(1,spd/45)*(car.onTrack?1:1.3)*dt*60;
    if(car.inWater){
      if(Math.random()<k*1.2) emit(car.x+rr(-1.2,1.2),car.y+0.3,car.z+rr(-1.2,1.2),car.vx*0.3+rr(-3,3),rr(4,9),car.vz*0.3+rr(-3,3),0.7,0.22,sprayCol(),{grav:26,a:0.8});
    } else if(car.puddle>0){
      for(const sg of [-1,1]) if(Math.random()<k*0.9) emit(car.x-fx*1.2+lx*1.1*sg+rr(-.2,.2),car.y+0.25,car.z-fz*1.2+lz*1.1*sg+rr(-.2,.2),car.vx*0.2+rr(-2,2),rr(2.5,5.5),car.vz*0.2+rr(-2,2),0.5,0.14,sprayCol(),{grav:26,a:0.75});
    } else {
      for(const sg of [-1,1]){
        const px=car.x-fx*1.4+lx*1.1*sg, pz=car.z-fz*1.4+lz*1.1*sg;
        for(let i=0;i<2;i++) if(Math.random()<k*0.55)
          dust(px+rr(-.2,.2),car.y+0.2,pz+rr(-.2,.2),-car.vx*0.1+rr(-1,1),rr(0.5,1.8),-car.vz*0.1+rr(-1,1),car.onTrack,false);
      }
    }
  }
  if(car.inLava && Math.random()<dt*60*0.7){                          // embers and smoke while driving through lava
    emit(car.x+rr(-1.2,1.2),car.y+0.4,car.z+rr(-1.2,1.2),rr(-2,2),rr(5,9),rr(-2,2),0.7,0.2,[1,rr(.4,.7),.1],{grav:18,a:0.9});
    emit(car.x+rr(-1,1),car.y+1,car.z+rr(-1,1),rr(-1,1),rr(2,4),rr(-1,1),1.1,0.35,[.25,.22,.22],{grow:2,drag:1,a:0.5}); }
  if(car.burn) burnFx(car);
  if(THEME.leaves) for(let i=0;i<2;i++)                                // falling autumn leaves
    emit(car.x+fx*20+rr(-46,46),car.y+rr(6,20),car.z+fz*20+rr(-46,46),rr(-1.5,1.5)-1,-rr(1.2,2.6),rr(-1.5,1.5),5,0.13,FALL[(Math.random()*FALL.length)|0],{a:0.9});
  if(THEME.rain) for(let i=0;i<(THEME.rainN||4);i++)                                  // drizzle around the car
    emit(car.x+fx*16+rr(-40,40),car.y+rr(7,18),car.z+fz*16+rr(-40,40),-3,-rr(24,32),0,0.5,0.07,THEME.rainCol||[.78,.84,.95],{a:0.5});
  if(THEME.snow) for(let i=0;i<3;i++)                                  // falling snow around the car
    emit(car.x+fx*18+rr(-48,48),car.y+rr(9,24),car.z+fz*18+rr(-48,48),rr(-1.2,1.2)-2,-rr(3.5,6.5),rr(-1.2,1.2),3.4,0.11,[1,1,1],{a:0.85});
  if(car.nitroOn) for(let i=0;i<2;i++)
    emit(car.x-fx*2.2,car.y+0.85,car.z-fz*2.2,-fx*16+car.vx*0.4+rr(-1.5,1.5),rr(-1,1.5),-fz*16+car.vz*0.4+rr(-1.5,1.5),0.22,rr(0.25,0.4),[1,rr(.55,.9),.15],{grow:-0.6,a:0.9});
  if(car.damage>0.45 && Math.random()<(car.damage-0.35)*dt*60*0.5)
    emit(car.x+fx*1.3+rr(-.3,.3),car.y+1.2,car.z+fz*1.3+rr(-.3,.3),car.vx*0.5+rr(-.5,.5),rr(3,5),car.vz*0.5+rr(-.5,.5),1.2,0.4,[.25,.25,.28],{grow:2.2,drag:1,a:0.55});
  if(car.damage>0.8 && Math.random()<dt*60*0.6)
    emit(car.x+fx*1.3+rr(-.3,.3),car.y+1.1,car.z+fz*1.3+rr(-.3,.3),car.vx*0.5+rr(-1,1),rr(3,6),car.vz*0.5+rr(-1,1),0.35,0.35,[1,rr(.4,.7),.1],{grow:-0.5,a:0.9});
}
// a car on fire: a small version of the flames and smoke of a badly damaged car, moving with it
function burnFx(c){ if(c.shock){ shockFx(c); return; }
  const v=[c.vx*.75,c.vz*.75];
  for(let i=0;i<2;i++) emit(c.x+rr(-.8,.8),c.y+rr(.6,1.3),c.z+rr(-.8,.8),v[0]+rr(-.6,.6),rr(3,6),v[1]+rr(-.6,.6),.35,.32,[1,rr(.45,.75),.1],{grow:-.5,a:.95,hot:true});
  if(Math.random()<.3) emit(c.x+rr(-.5,.5),c.y+1.3,c.z+rr(-.5,.5),v[0],rr(2.5,4.5),v[1],.8,.3,[.25,.25,.28],{grow:1.8,drag:1,a:.5});
}
// the wreck explosion; k < 1 gives a smaller one (fewer, smaller, slower particles), as when a car's fire goes out
function explode(c,k){
  c=c||car; k=k||1; const x=c.x,y=c.y+1,z=c.z, S=Math.sqrt(k);
  for(let i=0;i<55*k;i++){ const a=rr(0,6.283), e=rr(0,1.2), sp=rr(6,22)*S;
    emit(x,y,z,Math.cos(a)*Math.cos(e)*sp+c.vx*(1-S),Math.sin(e)*sp*0.8+4*S,Math.sin(a)*Math.cos(e)*sp+c.vz*(1-S),rr(0.5,1.1),rr(1.0,2.0)*S,[1,rr(.5,.95),.1],{grow:1.2,drag:1.2,a:0.9,hot:true}); }
  for(let i=0;i<40*k;i++){ const a=rr(0,6.283);
    emit(x,y,z,Math.cos(a)*rr(1,8)*S+c.vx*(1-S),rr(4,11)*S,Math.sin(a)*rr(1,8)*S+c.vz*(1-S),rr(1.5,2.6)*S,rr(1.1,1.9)*S,[.2,.2,.22],{grow:2.5,drag:1,a:0.6}); }
  for(let i=0;i<26*k;i++){ const a=rr(0,6.283), sp=rr(8,20)*S;
    emit(x,y,z,Math.cos(a)*sp+c.vx*(1-S),rr(8,22)*S,Math.sin(a)*sp+c.vz*(1-S),rr(1.2,1.8)*S,rr(0.2,0.4)*S,i&1?[.8,.1,.1]:[.12,.12,.14],{grav:34,a:1}); }
}
