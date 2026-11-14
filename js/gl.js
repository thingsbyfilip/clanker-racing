'use strict';
// WebGL setup: shaders, uniforms, mesh drawing, car meshes, level upload (loadLevel) and the low-res framebuffer.
const canvas=document.getElementById('gl');
const gl=canvas.getContext('webgl',{antialias:false,alpha:false});
if(!gl){ document.body.innerHTML='<h1 style="color:#fff;padding:20px">WebGL is not available in this browser.</h1>'; throw new Error('no webgl'); }
function compile(type,src){ const s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
function program(vs,fs){ const p=gl.createProgram(); gl.attachShader(p,compile(gl.VERTEX_SHADER,vs)); gl.attachShader(p,compile(gl.FRAGMENT_SHADER,fs));
  gl.linkProgram(p); if(!gl.getProgramParameter(p,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p; }

const mainProg=program(`
attribute vec3 aPos, aNor, aCol;
uniform mat4 uVP, uM; uniform vec3 uLight, uAmb, uHemi, uSun; uniform float uFogNear, uFogFar;
varying vec3 vCol; varying float vFog;
void main(){
  vec4 wp = uM*vec4(aPos,1.0);
  vec3 lit;
  if(dot(aNor,aNor)<0.25){ lit=vec3(1.0); }              // emissive geometry (windows, lamps, signs): ignores the lighting
  else {
    vec3 n = normalize((uM*vec4(aNor,0.0)).xyz);
    float l = max(dot(n,uLight),0.0);
    lit = uAmb + uHemi*(0.5+0.5*n.y) + uSun*l;
  }
  vCol = aCol*lit;
  gl_Position = uVP*wp;
  vFog = (gl_Position.w-uFogNear)/(uFogFar-uFogNear);      // clamped per pixel: the triangles beyond the level's edge are huge, and w is linear across a triangle
}`,`
precision mediump float;
varying vec3 vCol; varying float vFog; uniform vec3 uFogCol; uniform float uAlpha;
void main(){
  vec3 c = mix(vCol,uFogCol,clamp(vFog,0.0,1.0));
  c = floor(c*24.0+0.5)/24.0;
  gl_FragColor = vec4(c,uAlpha);
}`);
const skyProg=program(`
attribute vec2 aP; varying float vY;
void main(){ vY=aP.y*0.5+0.5; gl_Position=vec4(aP,0.999,1.0); }`,`
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying float vY; uniform vec3 uTop, uHor, uBodyCol, uBody2Col; uniform vec4 uBody, uBody2; uniform vec2 uRes; uniform float uYaw, uFovH, uStars; uniform vec2 uCloud; uniform vec3 uCloudCol, uCloudShade, uPil[3];
float h21(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
float h31(vec3 p){ p=fract(p*0.3183+0.1)*17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float n3(vec3 p){                                            // value noise on a 3D lattice, for the Earth's coasts and clouds
  vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fb3(vec3 p){ float a=0.5, s=0.0; for(int i=0;i<3;i++){ s+=a*n3(p); p=p*2.03+vec3(1.7,9.2,3.1); a*=0.5; } return s; }
float bl(vec2 a,float x,float y,float w,float h){ return length((a-vec2(x,y))/vec2(w,h)); }   // an oval in degrees: below 1 inside
void main(){
  float t=clamp((vY-0.40)/0.60,0.0,1.0); t=floor(t*7.0)/7.0;
  vec3 c=mix(uHor,uTop,t);
  vec2 uv=gl_FragCoord.xy/uRes;
  if(uStars>0.5 && vY>0.4){                                  // fixed stars: small squares in world-yaw cells
    vec2 q=vec2((uYaw-(uv.x-0.5)*uFovH)*38.0, gl_FragCoord.y/5.0); vec2 cell=floor(q), f=fract(q); float h=h21(cell);
    if(h>0.975 && f.x<0.17 && f.y<0.22) c+=vec3(0.35+0.65*h21(cell+7.0));
  }
  if(uBody.w>0.5){
    float dy=mod(uYaw-uBody.x+3.14159,6.28318)-3.14159;
    float sx=0.5+dy/uFovH;
    float d=length(vec2((uv.x-sx)*uRes.x/uRes.y,uv.y-uBody.y));
    float disc=smoothstep(uBody.z,uBody.z*0.85,d);
    float halo=smoothstep(uBody.z*4.5,uBody.z,d)*0.22;
    c=mix(c,uBodyCol,disc)+uBodyCol*halo*(1.0-disc);
  }
  if(uBody2.w>0.5){                                          // second body; mode 2 = the Earth (oceans, land, cloud, polar caps, night side)
    float dy=mod(uYaw-uBody2.x+3.14159,6.28318)-3.14159;
    float sx=0.5+dy/uFovH;
    vec2 p=vec2((uv.x-sx)*uRes.x/uRes.y,uv.y-uBody2.y)/uBody2.z; float d=length(p), disc=smoothstep(1.0,0.92,d);
    vec3 col=uBody2Col;
    if(uBody2.w>1.5 && uBody2.w<2.5){
      // ovals of land on a sphere facing Africa and Europe, roughened by noise, under thin noise clouds; soft edges and shading
      vec3 n=vec3(p,sqrt(max(1.0-d*d,0.0))); col=vec3(0.10,0.30,0.74);
      if(d<1.0){
        const float T0=0.16, L0=17.0;                        // the latitude (radians) and longitude (degrees) in the middle of the disc
        vec3 g=vec3(n.x,n.y*cos(T0)+n.z*sin(T0),n.z*cos(T0)-n.y*sin(T0));
        vec2 a=vec2(atan(g.x,g.z)*57.3+L0,asin(clamp(g.y,-1.0,1.0))*57.3); float w=fb3(g*3.6)-0.44;
        float e=min(min(bl(a,12.0,20.0,30.0,15.0),bl(a,22.0,0.0,18.0,18.0)),min(bl(a,27.0,-20.0,11.0,15.0),bl(a,44.0,5.0,8.0,6.0)));     // Africa
        e=min(e,min(min(bl(a,15.0,50.0,26.0,10.0),bl(a,18.0,64.0,9.0,9.0)),bl(a,47.0,-19.0,3.0,6.0)));                                 // Europe, Scandinavia, Madagascar
        e=min(e,min(min(bl(a,46.0,23.0,9.0,10.0),bl(a,85.0,50.0,48.0,24.0)),bl(a,78.0,18.0,8.0,10.0)));                                // Arabia, Asia, India
        e=min(e,min(bl(a,-58.0,-12.0,15.0,24.0),bl(a,-42.0,72.0,10.0,8.0)));                                                           // South America, Greenland
        float y=a.y+w*20.0; col=mix(col,mix(vec3(0.26,0.52,0.24),vec3(0.80,0.67,0.40),smoothstep(11.0,15.0,y)*smoothstep(35.0,31.0,y)),smoothstep(1.05,0.95,e+w*0.9));                             // land, the desert belt in tan
        col=mix(col,vec3(0.95),smoothstep(71.0,77.0,abs(a.y)+w*25.0));                                                                               // polar ice
        col=mix(col,vec3(0.95),smoothstep(0.45,0.53,fb3(g*vec3(1.9,3.4,1.9)+fb3(g*2.4+4.0)*2.5))*0.8);                                                    // clouds
        col=mix(col,vec3(0.48,0.70,1.0),smoothstep(0.75,1.0,d)*0.4);                                                                               // the atmosphere at the rim
        col*=0.22+0.78*smoothstep(-0.8,0.5,dot(n.xy,vec2(0.8,0.1)));                                                                      // the shading of the old Earth, dark towards the left
      }
    }
    if(uBody2.w>2.5){                                        // mode 3 = Saturn: banded globe and a tilted ring system with the Cassini division; seen through the haze
      float ca=cos(0.38), sa=sin(0.38); vec2 q=vec2(p.x*ca+p.y*sa,-p.x*sa+p.y*ca);
      float e=length(vec2(q.x,q.y/0.26));
      float ring=step(1.3,e)*step(e,2.2);
      float band=floor((0.5+0.5*sin(q.y*7.0+1.0))*2.0)/2.0;
      float lit=0.55+0.45*smoothstep(-1.0,0.7,dot(p,vec2(-0.7,0.5)));
      vec3 gc=mix(vec3(0.72,0.56,0.34),vec3(0.92,0.80,0.58),band)*lit;
      vec3 rc=mix(vec3(0.70,0.58,0.40),vec3(0.92,0.82,0.62),step(1.75,e));
      float globe=smoothstep(1.0,0.93,d), front=step(q.y,0.0);
      if(ring>0.5 && front<0.5 && globe<0.5) c=mix(c,rc,0.5);               // the far half of the rings, hidden behind the globe
      c=mix(c,mix(gc,c,0.45),globe);
      if(ring>0.5 && front>0.5) c=mix(c,rc,0.5);                           // the near half of the rings, in front of it
    } else c=mix(c,col,disc)+vec3(0.35,0.5,1.0)*smoothstep(1.4,1.0,d)*0.10*(1.0-disc);
  }
  if(uCloud.y>1.5){                                          // pillars of smoke (theme.clouds.pillars): a stack of big flat circles, each its own dark tone with a lighter crescent underneath; only the lowest glow.
    // Painted from the top down, so a lower circle covers the one above and the shapes stay readable
    float zf=uFovH/1.72, wy=(uv.y-uCloud.x)*zf+0.05, ang=uYaw-(uv.x-0.5)*uFovH, asp=(uRes.x/uRes.y)/1.72, lit=-1.0;
    for(int P=0;P<3;P++){
      vec3 q=uPil[P]; float dx=(mod(ang-q.x+3.14159,6.28318)-3.14159)*asp, fl=float(P)*2.7+1.0;
      if(abs(dx)>q.z*4.0||wy<-0.06) continue;
      for(int k=8;k>=0;k--){
        float f=float(k)/8.0, h1=h21(vec2(float(k),fl)), h2=h21(vec2(fl,float(k)+4.0)), h3=h21(vec2(float(k)+9.0,fl+2.0));
        float cx=(h1-0.5)*q.z*(0.6+1.4*f), r=q.z*(0.55+0.35*h2+0.6*f); vec2 dd=vec2(dx-cx,wy-f*q.y);
        if(dot(dd,dd)<r*r) lit=(1.0-f)*(1.0-f)*(1.0-f)*0.9+0.05+0.13*h3+(dd.y<-r*0.35?0.08+0.25*(1.0-f):0.0);
      }
    }
    if(lit>=0.0) c=mix(uCloudShade,uCloudCol,lit);
  } else if(uCloud.y>0.5){                                   // cumulus bank: rounded puffs on world-fixed cells, lit from above, resting on the horizon
    float zf=uFovH/1.72, wx=(uYaw-(uv.x-0.5)*uFovH)*(uRes.x/uRes.y)/1.72, wy=(uv.y-uCloud.x)*zf+0.05, lit=-1.0;   // world angle and height above the horizon, in fixed units, so a zoom (the speed-based FOV) magnifies the clouds instead of scrolling them
    float top=0.085+0.035*sin(wx*8.0+1.0)+0.025*sin(wx*21.0+3.0);               // the solid base of the bank, so the puffs sit on a continuous cloud floor
    if(wy<top) lit=clamp(0.25+wy/top*0.7,0.0,1.0);
    for(int L=0;L<2;L++){
      float cs=(L==0)?0.26:0.9, fl=float(L);
      float ci0=floor(wx/cs);
      for(int k=-1;k<=1;k++){
        float ci=ci0+float(k), h1=h21(vec2(ci,3.1+fl)), h2=h21(vec2(ci,7.7+fl)), h3=h21(vec2(ci,1.3+fl)), h4=h21(vec2(ci,9.9+fl));
        if(h4<((L==0)?0.06:0.6)) continue;
        float cx=(ci+0.1+0.8*h1)*cs, r, cy;
        if(L==0){ r=0.07+0.12*h3; cy=0.02+0.11*h2+0.1*h3*h3; } else { r=0.04+0.05*h3; cy=0.27+0.1*h2; }
        vec2 dd=vec2((wx-cx)/((L==0)?1.0:1.5),(wy-cy)*((L==0)?1.1:1.9));
        float nd=length(dd)/r;
        if(nd<1.0 && wy>-0.01){ float l=clamp((wy-cy)/r*0.55+0.72-nd*0.2,0.0,1.0); lit=max(lit,l); }
      }
    }
    if(lit>=0.0){ lit=floor(lit*3.0+0.5)/3.0; c=mix(uCloudShade,uCloudCol,lit); }
  }
  gl_FragColor=vec4(c,1.0);
}`);

// the tint over the part of the screen that is under water (drawUnderwater, render.js): uPlane gives the depth at each screen position, and it is negative above the waterline
const underProg=program(`
attribute vec2 aP; uniform vec3 uPlane; varying float vD;
void main(){ vD=dot(uPlane,vec3(aP,1.0)); gl_Position=vec4(aP,0.0,1.0); }`,`
precision mediump float;
varying float vD; uniform vec4 uCol;
void main(){ if(vD<0.0) discard; gl_FragColor=uCol; }`);
const underLoc={plane:gl.getUniformLocation(underProg,'uPlane'), col:gl.getUniformLocation(underProg,'uCol'), aP:gl.getAttribLocation(underProg,'aP')};

// the ground beyond the level (see buildSkirtMesh): flat coarse rings, painted per pixel with the level's own 6 m triangles
const skirtProg=program(`
attribute vec3 aP; uniform mat4 uVP; uniform float uFogNear, uFogFar, uCell; varying vec2 vC; varying float vFog;
void main(){ vC=aP.xz/uCell; gl_Position=uVP*vec4(aP,1.0); vFog=(gl_Position.w-uFogNear)/(uFogFar-uFogNear); }`,`
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vC; varying float vFog; uniform sampler2D uTex; uniform vec3 uFogCol; uniform vec2 uMap; uniform vec3 uPatch; uniform float uInner;   // uMap: half the grid in cells, cells in the band. uPatch: patch size, roughness of its outline, largest offset (all in cells). uInner: half the source square in the middle of the map, 0 to use the band
float fold(float c){ float a=abs(c)-uMap.x; if(a<=0.0) return c; a=mod(a,2.0*uMap.y); if(a>uMap.y) a=2.0*uMap.y-a; return sign(c)*(uMap.x-a); }   // mirror back and forth inside the band, so it joins the edge exactly
float inner(float c){ float t=mod(c+uInner,4.0*uInner); if(t>2.0*uInner) t=4.0*uInner-t; return t-uInner; }   // mirror into the middle of the map
float h1(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
void main(){
  float k=clamp(vFog,0.0,1.0); vec3 c=uFogCol;
  if(k<1.0){ vec2 w=vC, cell=floor(w), a=abs(w)-uMap.x; float d=max(a.x,a.y);
    // past the first band (which joins the edge) each irregular patch reads the band from its own whole-cell offset: every triangle stays a real one, with no blending
    if(d>uMap.y+(h1(cell+7.0)-0.5)*uPatch.y){ vec2 id=floor((w+(vec2(h1(cell),h1(cell+3.0))-0.5)*uPatch.y)/uPatch.x);
      vec2 o=floor(vec2(h1(id+11.0),h1(id+29.0))*2.0*uPatch.z-uPatch.z);
      if(uInner>0.0) w=vec2(inner(w.x+o.x*5.0),inner(w.y+o.y*5.0)); else w+=o; }
    vec2 p=vec2(fold(w.x),fold(w.y))+uMap.x, q=floor(p), f=p-q;
    c=mix(texture2D(uTex,vec2((2.0*q.x+(f.x>f.y?0.5:1.5))/(4.0*uMap.x),(q.y+0.5)/(2.0*uMap.x))).rgb,uFogCol,k); }
  c=floor(c*24.0+0.5)/24.0;
  gl_FragColor=vec4(c,1.0);
}`);
const skirtLoc={}; for(const n of ['uVP','uFogNear','uFogFar','uFogCol','uCell','uMap','uPatch','uInner','uTex']) skirtLoc[n]=gl.getUniformLocation(skirtProg,n);
const skirtAP=gl.getAttribLocation(skirtProg,'aP');
const skirtTex=gl.createTexture(); let skirtBuf=null, skirtCount=0;
function uploadSkirt(pos,tex){
  if(!skirtBuf) skirtBuf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,skirtBuf); gl.bufferData(gl.ARRAY_BUFFER,pos,gl.STATIC_DRAW); skirtCount=pos.length/3;
  gl.bindTexture(gl.TEXTURE_2D,skirtTex); gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,2*N,N,0,gl.RGBA,gl.UNSIGNED_BYTE,tex);
  for(const [k,v] of [[gl.TEXTURE_MIN_FILTER,gl.NEAREST],[gl.TEXTURE_MAG_FILTER,gl.NEAREST],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D,k,v);
}
function drawSkirt(vp,T){
  gl.useProgram(skirtProg); gl.uniformMatrix4fv(skirtLoc.uVP,false,vp); gl.uniform1f(skirtLoc.uFogNear,T.fogN); gl.uniform1f(skirtLoc.uFogFar,T.fogF); gl.uniform3fv(skirtLoc.uFogCol,T.fog);
  gl.uniform1f(skirtLoc.uCell,CELL); gl.uniform2f(skirtLoc.uMap,N/2,SKIRT_BAND); gl.uniform3f(skirtLoc.uPatch,SKIRT_PATCH[0],SKIRT_PATCH[1],SKIRT_PATCH[2]); gl.uniform1f(skirtLoc.uInner,LV.sea===undefined?SKIRT_INNER:0); gl.uniform1i(skirtLoc.uTex,0); gl.bindTexture(gl.TEXTURE_2D,skirtTex);
  gl.bindBuffer(gl.ARRAY_BUFFER,skirtBuf); gl.enableVertexAttribArray(skirtAP); gl.vertexAttribPointer(skirtAP,3,gl.FLOAT,false,0,0);
  gl.drawArrays(gl.TRIANGLES,0,skirtCount); gl.disableVertexAttribArray(skirtAP);
}

const loc={}; for(const n of ['uVP','uM','uLight','uAmb','uHemi','uSun','uFogNear','uFogFar','uFogCol','uAlpha']) loc[n]=gl.getUniformLocation(mainProg,n);
const aPos=gl.getAttribLocation(mainProg,'aPos'), aNor=gl.getAttribLocation(mainProg,'aNor'), aCol=gl.getAttribLocation(mainProg,'aCol');
const skyLoc={top:gl.getUniformLocation(skyProg,'uTop'), hor:gl.getUniformLocation(skyProg,'uHor'), yaw:gl.getUniformLocation(skyProg,'uYaw'), body:gl.getUniformLocation(skyProg,'uBody'), bodyCol:gl.getUniformLocation(skyProg,'uBodyCol'), res:gl.getUniformLocation(skyProg,'uRes'), body2:gl.getUniformLocation(skyProg,'uBody2'), body2Col:gl.getUniformLocation(skyProg,'uBody2Col'), stars:gl.getUniformLocation(skyProg,'uStars'), cloud:gl.getUniformLocation(skyProg,'uCloud'), cloudCol:gl.getUniformLocation(skyProg,'uCloudCol'), cloudShade:gl.getUniformLocation(skyProg,'uCloudShade'), pil:gl.getUniformLocation(skyProg,'uPil'), fovH:gl.getUniformLocation(skyProg,'uFovH'), aP:gl.getAttribLocation(skyProg,'aP')};
const skyBuf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,skyBuf); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,-1,1,1,-1,1]),gl.STATIC_DRAW);

function drawMesh(mesh,model,alpha){
  gl.uniformMatrix4fv(loc.uM,false,model); gl.uniform1f(loc.uAlpha,alpha===undefined?1:alpha);
  gl.bindBuffer(gl.ARRAY_BUFFER,mesh.pb); gl.vertexAttribPointer(aPos,3,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ARRAY_BUFFER,mesh.nb); gl.vertexAttribPointer(aNor,3,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ARRAY_BUFFER,mesh.cb); gl.vertexAttribPointer(aCol,3,gl.FLOAT,false,0,0);
  gl.drawArrays(gl.TRIANGLES,0,mesh.count);
}

// level meshes are (re)built whenever a level is loaded
let terrainGL=null, decorGL=null, waterGL=null, marksGL=null, glowGL=null, colliderGL=null, curLevel=null;
// a level's moving meshes: LV.dynamic() returns {name: Mesh}, uploaded here once per level; LV.drawDynamic(draw,setPos) draws them every frame with draw(name, model matrix, alpha),
// and setPos(name, Float32Array) may first replace a mesh's vertex positions (same count) (the spinning logos on Data Center's MCP, wrapped round its curve)
let dynGL={};
const RACER_COLORS=[[.82,.09,.08],[.15,.38,.88],[.95,.78,.10],[.20,.68,.25],[.62,.25,.78],[.95,.50,.10]];   // player first
const carGLs=RACER_COLORS.map(c=>buildCarMesh(c).upload(gl));
const wheelGL=buildWheelMesh().upload(gl);
// dynamic meshes: blob shadow (5x5 grid draped on terrain) and the night headlight cone
const shadowBufs={pb:gl.createBuffer(),nb:gl.createBuffer(),cb:gl.createBuffer(),count:0};
const lightBufs={pb:gl.createBuffer(),nb:gl.createBuffer(),cb:gl.createBuffer(),count:0};
function freeMesh(m){ if(m){ gl.deleteBuffer(m.pb); gl.deleteBuffer(m.nb); gl.deleteBuffer(m.cb); } }
function loadLevel(id){
  for(const m of [terrainGL,decorGL,waterGL,marksGL,glowGL,colliderGL,...Object.values(dynGL)]) freeMesh(m); colliderGL=null; dynGL={};
  parts.length=0;
  buildLevelData(id);
  const terrainM=buildTerrainMesh(), decorM=buildDecorMesh(), marksM=buildMarksMesh();   // (decor must come before the glow mesh: lamp positions are collected here)
  const glowM=buildGlowMesh();
  fitCollisionHeights([decorM,marksM,glowM]);                                         // (every shape gets the height of what is drawn over it)
  if(THEME.firelight) bakeFirelight(terrainM,decorM,marksM);                            // (after decor: that is where the fires are registered)
  const l=THEME.light, n=Math.hypot(l[0],l[1],l[2]); LIGHT=[l[0]/n,l[1]/n,l[2]/n];
  const skirt=EXPAND_TERRAIN_AROUND_LEVEL&&!LV.clipTerrain?buildSkirtMesh():null;      // (a clipped level is a slab with an edge of its own: the carrier stands in the sea, which buildSkirtWater still extends)
  skirtCount=0; if(skirt) uploadSkirt(skirt,buildSkirtTexture(terrainM));
  terrainGL=terrainM.upload(gl);
  decorGL=decorM.upload(gl);
  waterGL=buildWaterMesh(skirt).upload(gl);
  marksGL=marksM.upload(gl);
  glowGL=glowM.upload(gl);
  if(LV.dynamic){ const d=LV.dynamic(); for(const k in d) dynGL[k]=d[k].upload(gl); }
  if(SHOW_COLLIDERS) colliderGL=buildColliderMesh().upload(gl);                        // debug: the collision shapes (SHOW_COLLIDERS_IN_GAME)
  buildMinimap();
  curLevel=id;
}

const NEAR_PLANE=1;

// ---------- resize (low-res retro framebuffer) ----------
const RENDER_H=240; let aspect=16/9;
function resize(){ aspect=innerWidth/innerHeight; canvas.height=RENDER_H; canvas.width=Math.round(RENDER_H*aspect); gl.viewport(0,0,canvas.width,canvas.height); }
addEventListener('resize',resize); resize();
