'use strict';
// Level: London Calling.
// ---------------- LONDON (overcast and drizzling, wet streets, terraced houses, the Thames with two bridges, Big Ben, a roundabout with Nelson's column) ----------------
const LON_BRICK=[[.58,.28,.20],[.64,.36,.24],[.52,.26,.20],[.70,.62,.42],[.66,.58,.40],[.86,.82,.74],[.80,.76,.70]];     // brick, yellow stock, white stucco
const LON_ROOF=[[.30,.30,.36],[.34,.30,.30],[.28,.28,.32]];
const LON_V=[[-330,-250],[-150,-264],[-30,-196],[120,-255],[215,-268],[335,-235],[238,-160],[300,-96],[300,120],[235,215],[150,264],[60,198],[-30,262],[-130,212],[-215,268],[-335,235],[-250,180],[-300,100],[-285,-60],[-312,-150]];
const LON_R=[48,60,55,60,45,34,35,45,45,45,40,38,40,40,45,34,35,45,40,48];
const thamesZ=x=>-10+30*Math.sin(x/140+1);
// pitched roof over a rotated box: ridge along the tangent (tx,tz); (x,z) = centre
function roofOr(m,x,z,tx,tz,len,dep,y,h,col,gc){
  const sx=-tz, sz=tx, P=(a,b,yy)=>[x+tx*a+sx*b,yy,z+tz*a+sz*b], o=[x,y+h*.3,z], hl=len/2, hd=dep/2+.5;
  m.quad(P(-hl,-hd,y),P(hl,-hd,y),P(hl,0,y+h),P(-hl,0,y+h),col,o); m.quad(P(-hl,hd,y),P(hl,hd,y),P(hl,0,y+h),P(-hl,0,y+h),col,o);
  m.tri(P(-hl,-hd,y),P(-hl,hd,y),P(-hl,0,y+h),gc||col,o); m.tri(P(hl,-hd,y),P(hl,hd,y),P(hl,0,y+h),gc||col,o); }
// a terraced house: (x,z) = centre, (tx,tz) along the street, (nx,nz) the facade normal (towards the road)
// solid collider for a box that is not aligned with the axes (rects only hold axis-aligned boxes, whose bounding box would stick out of a house on a diagonal
// street as an invisible wall): a row of touching circles along its longer side, each as wide as the shorter side. (ux,uz) = unit vector along length L, W = width
function obbCircles(x,z,ux,uz,L,W){
  if(W>L){ [L,W]=[W,L]; [ux,uz]=[-uz,ux]; }
  const r=W/2, n=Math.max(1,Math.ceil((L-W)/r)+1);
  for(let k=0;k<n;k++){ const a=n>1?(k/(n-1)-.5)*(L-W):0; colliders.push([x+ux*a,z+uz*a,r]); } }
function terrace(m,rnd,x,z,tx,tz,nx,nz,len,dep,y,h){
  const yaw=Math.atan2(tx,tz), pick=a=>a[(rnd()*a.length)|0], col=pick(LON_BRICK), stucco=col[0]>.8;
  orBox(m,x,z,len,dep,y,y+h,yaw,col);
  roofOr(m,x,z,tx,tz,len,dep,y+h,3.2+rnd()*1.5,pick(LON_ROOF));
  for(const a of [-.3,.25]) orBox(m,x+tx*len*a,z+tz*len*a,1.4,1.4,y+h,y+h+3.6+rnd(),yaw,[.5,.26,.2]);       // chimney stacks
  orBox(m,x,z,len+.4,dep+.4,y+h-.6,y+h,yaw,[.9,.88,.84]);                                                       // cornice
  const fx=x+nx*(dep/2), fz=z+nz*(dep/2), n=Math.max(1,Math.floor(len/3.4));
  for(let c=0;c<n;c++){ const off=(c-(n-1)/2)*3.4, px=fx+tx*off, pz=fz+tz*off;
    for(let yy=y+(c%3===1?6.4:2.6),f=0;yy<y+h-2;yy+=3.9,f++){
      if(f===0&&c%3===1){ wallPanel(m,px+nx*.1,y+1.6,pz+nz*.1,nx,nz,1.6,3.2,[.1,.18,.3],[x,y+1.6,z]); continue; }   // front door
      m.em=true; wallQuad(m,px+nx*.12,yy+1.0,pz+nz*.12,nx,nz,1.8,2.3,[.94,.94,.9]); wallQuad(m,px+nx*.16,yy+1.0,pz+nz*.16,nx,nz,1.3,1.9,rnd()<.2?[.55,.55,.35]:[.2,.27,.38]); m.em=false; } }
}
// Elizabeth Tower: stone shaft with clock faces, belfry and a spire; plus the long Parliament range beside it
function bigBen(m,x,y,z,yaw){
  const tx=Math.sin(yaw), tz=Math.cos(yaw), st=[.72,.64,.46], dk=[.5,.44,.3];
  orBox(m,x,z,11,11,y,y+8,yaw,st); orBox(m,x,z,9,9,y+8,y+58,yaw,st); orBox(m,x,z,10.4,10.4,y+58,y+64,yaw,dk);
  for(let k=0;k<4;k++){ const a=yaw+k*Math.PI/2, nx=Math.sin(a), nz=Math.cos(a);
    m.em=true; wallQuad(m,x+nx*5.1,y+52,z+nz*5.1,nx,nz,6.6,6.6,[.96,.94,.82]); wallQuad(m,x+nx*5.14,y+52,z+nz*5.14,nx,nz,4.6,4.6,[.2,.2,.18]); m.em=false;
    for(const sg of [-1,1]) for(let j=0;j<3;j++) wallPanel(m,x+nx*4.7-nz*sg*2.4,y+14+j*10,z+nz*4.7+nx*sg*2.4,nx,nz,1.2,5,[.34,.28,.2],[x,y+20,z]); }
  pyramid(m,x,y+64,z,5.4,5.4,22,[.34,.44,.36]); m.box(x,y+87,z,.3,4,.3,[.9,.8,.3]);
  colliders.push([x,z,7]); }
function parliament(m,rnd,x,y,z,yaw,len){
  const tx=Math.sin(yaw), tz=Math.cos(yaw), st=[.74,.68,.52];
  orBox(m,x,z,len,13,y,y+22,yaw,st); roofOr(m,x,z,tx,tz,len,13,y+22,5,[.34,.4,.42]);
  for(let k=-len/2+6;k<len/2;k+=11){ const px=x+tx*k, pz=z+tz*k; orBox(m,px,pz,3,15,y,y+27,yaw,[.7,.62,.46]); m.cone(px,y+27,pz,2,6,4,[.38,.44,.4]); }
  for(const sg of [-1,1]){ const nx=Math.cos(yaw)*sg, nz=-Math.sin(yaw)*sg; for(let k=-len/2+4;k<len/2-2;k+=3.2) for(const yy of [6,12,18]){ m.em=true; wallQuad(m,x+tx*k+nx*6.6,y+yy,z+tz*k+nz*6.6,nx,nz,1.3,2.4,[.22,.28,.36]); m.em=false; } }
  const ex=Math.cos(yaw), ez=-Math.sin(yaw); rects.push([x,z,Math.abs(tx)*len/2+Math.abs(ex)*7,Math.abs(tz)*len/2+Math.abs(ez)*7]); }
function phoneBox(m,x,z,yaw){ const y=hAt(x,z); orBox(m,x,z,1.2,1.2,y,y+2.8,yaw,[.82,.1,.1]); orBox(m,x,z,1,1.01,y+.9,y+2.3,yaw,[.78,.86,.9]); m.cone(x,y+2.8,z,.8,.35,6,[.82,.1,.1]); colliders.push([x,z,.8]); }
function pillarBox(m,x,z){ const y=hAt(x,z); cylY(m,x,y,z,.55,1.6,8,[.82,.1,.1],[.7,.08,.08]); colliders.push([x,z,.6]); }
// a plane tree: tall pale-barked trunk and a round green crown
function planeTree(m,rnd,x,y,z,s,leaf){ m.box(x,y+s*2.7,z,.7*s,5.4*s,.7*s,[.5,.46,.38]); m.rock(x,y+s*6,z,3.8*s,leaf,rnd); m.rock(x+1.5*s,y+s*5,z+.8*s,2.8*s,leaf,rnd); colliders.push([x,z,.55*s]); }
// Nelson's column on a stepped plinth, four lions, two fountains
function nelsonSquare(m,rnd,x,z,R){
  const y=hAt(x,z), st=[.74,.72,.66];
  m.box(x,y+.4,z,15,.8,15,st); m.box(x,y+1.2,z,12,.8,12,st); m.box(x,y+4,z,8,6,8,[.7,.68,.62]); m.box(x,y+23,z,2.8,34,2.8,[.78,.76,.7]); m.box(x,y+41,z,4.4,2.2,4.4,[.5,.46,.4]); m.box(x,y+43.6,z,1.2,3,1.2,[.34,.4,.34]);
  for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ m.box(x+a*5,y+2.4,z+b*5,1.6,1.8,3,[.2,.18,.14]); m.box(x+a*5,y+3.6,z+b*5,1,1,1,[.2,.18,.14]); }
  colliders.push([x,z,7.5]);
  const f=Math.min(R*.7,34); for(const sg of [-1,1]){ const fx=x+sg*f*.7, fz=z+f*.5, fy=hAt(fx,fz);
    const fr=Math.min(7,R*.2); cylY(m,fx,fy,fz,fr,1.1,12,[.7,.68,.62],[.3,.5,.8]); cylY(m,fx,fy+1.1,fz,1.2,2.4,8,[.7,.68,.62],[.7,.8,.9]); colliders.push([fx,fz,fr+.2]); } }

// the London Eye: a double rim with a hub and spokes, 32 glass capsules, and a cantilevered A-frame. The wheel stands in the plane z = const (parallel to the river).
function londonEye(m,x,y,z,R){
  const hy=y+R+6, w=[.92,.93,.95], bl=[.55,.72,.92], rim=(a,dz,r)=>[x+Math.cos(a)*r,hy+Math.sin(a)*r,z+dz];
  const N_=48;
  for(const dz of [-1.5,1.5]) for(let i=0;i<N_;i++){ const a0=i/N_*Math.PI*2, a1=(i+1)/N_*Math.PI*2;
    strut(m,rim(a0,dz,R),rim(a1,dz,R),.42,.42,w); strut(m,rim(a0,dz,R-2.6),rim(a1,dz,R-2.6),.3,.3,w); }
  for(let i=0;i<N_;i++){ const a=i/N_*Math.PI*2; strut(m,rim(a,-1.5,R),rim(a,1.5,R),.22,.22,w); }                     // rim cross ties
  for(let i=0;i<32;i++){ const a=(i+.5)/32*Math.PI*2; for(const dz of [-1.5,1.5]) strut(m,[x,hy,z+dz*.4],rim(a,dz,R-2.6),.14,.12,[.8,.82,.86]); }   // spokes
  for(let i=0;i<32;i++){ const a=i/32*Math.PI*2, px=x+Math.cos(a)*(R+2.4), py=hy+Math.sin(a)*(R+2.4);                       // capsules hang off the outside of the rim
    m.box(px,py,z,2.6,2.6,3.4,[.88,.93,.98]); m.em=true; m.box(px,py,z,2.7,1.1,3.5,bl); m.em=false; strut(m,rim(a,0,R),[px,py,z],.2,.2,w); }
  m.box(x,hy,z,5,5,6,[.7,.72,.76]); m.box(x,hy,z+4.5,2.4,2.4,9,[.62,.64,.7]);                                            // hub and axle
  for(const sx of [-1,1]){ strut(m,[x+sx*.8,hy+2,z+5],[x+sx*17,y,z+36],1.5,2.1,[.9,.9,.93]); strut(m,[x+sx*.8,hy-2,z+5],[x+sx*17,y,z+36],1.2,2.1,[.86,.86,.9]); colliders.push([x+sx*17,z+36,3.2]); }
  strut(m,[x,hy+3,z+2],[x,y,z+70],.45,.45,[.5,.52,.56]);                                                                  // back stay
  m.box(x,y+.6,z,18,1.2,9,[.55,.55,.58]); m.box(x,y+4.2,z-3.6,12,.3,1,[.9,.9,.92]);                                      // boarding platform
  for(let a=-1;a<=1;a++) colliders.push([x+a*4.5,z,3.2]);
  // the queue hall and a pair of kiosks
  m.box(x-26,y+3,z+14,16,6,11,[.62,.6,.56]); m.box(x-26,y+6.3,z+14,17,.6,12,[.35,.35,.38]); rects.push([x-26,z+14,8.4,5.9]);
  m.box(x+27,y+2,z+12,9,4,7,[.8,.7,.55]); m.box(x+27,y+4.3,z+12,10,.5,8,[.5,.2,.15]); rects.push([x+27,z+12,5.2,4]); }
// framed sash windows (a pale frame and dark glass, as on the street terraces) on the four walls of the box (x0,z0)-(x1,z1), columns gx and floors gy apart,
// from yFirst to yMax; only where the window clears the ground at its own spot. door: one door on the ground floor of the side facing (dnx,dnz), if given
const LON_GLASS=[[.2,.27,.38],[.22,.3,.4],[.55,.55,.35]];
function lonWindows(m,rnd,x0,z0,x1,z1,yFirst,yMax,gx,gy,prob,door){
  const cx=(x0+x1)/2, cz=(z0+z1)/2;
  for(const [nx,nz] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const half=(nx?z1-z0:x1-x0)/2, n=Math.max(1,Math.floor(half*2/gx)), wx=nx?(nx>0?x1:x0):cx, wz=nz?(nz>0?z1:z0):cz, dc=door&&door[0]===nx&&door[1]===nz?(n>>1):-1;
    for(let c=0;c<n;c++){ const off=(c-(n-1)/2)*gx, px=wx+nx*.1-nz*off, pz=wz+nz*.1+nx*off, g=Math.max(hAt(px,pz),hAt(px-nz*.9,pz+nx*.9),hAt(px+nz*.9,pz-nx*.9));
      if(c===dc&&g<yFirst-1.6){ wallPanel(m,px,g+1.5,pz,nx,nz,1.8,3,[.12,.16,.22],[cx,g+1.5,cz]); }
      for(let f=0;yFirst+f*gy<=yMax;f++){ const y=yFirst+f*gy; if(y-1.2<g+1||rnd()>prob) continue;
        m.em=true; wallQuad(m,px,y,pz,nx,nz,gx*.52,gy*.6,[.9,.9,.86]); wallQuad(m,px+nx*.05,y,pz+nz*.05,nx,nz,gx*.38,gy*.48,LON_GLASS[rnd()<.85?(rnd()*2)|0:2]); m.em=false; } } } }
// a row of terraced houses filling the plot (x0,z0)-(x1,z1) along its long side, fronts towards the nearer road: each house is a street terrace (door, windows,
// cornice, chimneys) with its own brick and height, and windows at the back too
function lonRow(m,rnd,x0,z0,x1,z1,y){
  const alongX=x1-x0>=z1-z0, L=alongX?x1-x0:z1-z0, D=alongX?z1-z0:x1-x0, cx=(x0+x1)/2, cz=(z0+z1)/2, tx=alongX?1:0, tz=alongX?0:1;
  const f1=alongX?[cx,z1]:[x1,cz], f0=alongX?[cx,z0]:[x0,cz], sg=roadDist(f1[0],f1[1])<roadDist(f0[0],f0[1])?1:-1, nx=alongX?0:sg, nz=alongX?sg:0;
  const n=Math.max(2,Math.round(L/(7+rnd()*3))), hl=L/n;
  for(let k=0;k<n;k++){ const a=-L/2+hl*(k+.5), hx=cx+tx*a, hz=cz+tz*a, h=10+rnd()*7;
    terrace(m,rnd,hx,hz,tx,tz,nx,nz,hl,D,y,h);
    for(let yy=y+4.2;yy<y+h-2;yy+=3.9){ const px=hx-nx*(D/2+.1), pz=hz-nz*(D/2+.1); if(yy-1<hAt(px,pz)+1) continue;      // back windows
      m.em=true; for(const o of hl>6.5?[-hl/4,hl/4]:[0]) wallQuad(m,px+tx*o,yy,pz+tz*o,-nx,-nz,1.5,2.1,LON_GLASS[(rnd()*2)|0]); m.em=false; } } }
// the city away from the streets, as detailed as along them: terrace rows, flat-roofed blocks and shops, warehouses, the odd council tower
function fillerBlock(m,rnd,x0,z0,x1,z1,y,kind){
  const cx=(x0+x1)/2, cz=(z0+z1)/2, w=x1-x0, d=z1-z0, pick=a=>a[(rnd()*a.length)|0], toRoad=()=>{ const c=[[1,0],[-1,0],[0,1],[0,-1]].map(([a,b])=>[a,b,roadDist(cx+a*w/2,cz+b*d/2)]); c.sort((p,q)=>p[2]-q[2]); return c[0]; };
  if(kind===0) lonRow(m,rnd,x0,z0,x1,z1,y);                                                                                                           // terrace rows
  else if(kind===1){ const h=9+rnd()*10, c=[[.58,.55,.52],[.5,.5,.52],[.64,.6,.54],[.7,.62,.48]][(rnd()*4)|0]; m.box(cx,y+h/2,cz,w,h,d,c); m.box(cx,y+h+.3,cz,w+.5,.6,d+.5,[.36,.36,.38]);   // flat-roofed block
    const dr=toRoad(); lonWindows(m,rnd,x0,z0,x1,z1,y+5.6,y+h-1.8,3.4,3.5,.9,dr);
    if(rnd()<.5){ const nx=dr[0], nz=dr[1], ln=nx?d:w, px=nx?(nx>0?x1:x0):cx, pz=nz?(nz>0?z1:z0):cz;                                                          // a parade of shops on the ground floor
      m.em=true; wallQuad(m,px+nx*.12,y+3.2,pz+nz*.12,nx,nz,ln*.9,2,[.2,.24,.3]); m.em=false; orBox(m,px+nx*.9,pz+nz*.9,nx?ln*.9:1.6,nx?1.6:ln*.9,y+4.4,y+4.7,0,pick([[.6,.12,.12],[.14,.34,.24],[.16,.2,.42]])); }
    m.box(cx+(rnd()-.5)*w*.4,y+h+1.4,cz+(rnd()-.5)*d*.4,3.5+rnd()*2,2,3+rnd()*2,[.5,.5,.52]); }                                                      // plant room on the roof
  else if(kind===2){ const h=5+rnd()*3, c=[[.55,.5,.44],[.5,.32,.24],[.46,.46,.48]][(rnd()*3)|0]; m.box(cx,y+h/2,cz,w,h,d,c); gable(m,x0-.3,z0-.3,x1+.3,z1+.3,y+h,2.2,[.34,.36,.4],w>d,c);   // shed / warehouse
    const ex=w>d?1:0, ez=w>d?0:1, gx=cx+ex*(w/2+.12), gz=cz+ez*(d/2+.12), g=hAt(gx,gz); wallPanel(m,gx,Math.max(g,y)+2,gz,ex,ez,Math.min(w,d)*.5,4,[.3,.32,.34],[cx,y+2,cz]);   // loading door at the gable end
    for(const sg of [-1,1]){ const L=w>d?w:d, nn=Math.max(1,Math.floor(L/5)); for(let k=0;k<nn;k++){ const o=(k-(nn-1)/2)*5, px=cx+ez*sg*(w/2+.12)+ex*o, pz=cz+ex*sg*(d/2+.12)+ez*o;
      if(y+h-1.6<hAt(px,pz)+1.2) continue; m.em=true; wallQuad(m,px,y+h-1.4,pz,ez*sg,ex*sg,2.6,1.1,[.62,.68,.72]); m.em=false; } } }
  else { const h=24+rnd()*20, c=[.64,.62,.58]; m.box(cx,y+h/2,cz,w*.7,h,d*.7,c); m.box(cx,y+h+.4,cz,w*.7+.5,.8,d*.7+.5,[.4,.4,.42]);                    // council tower
    for(let f=y+6.8;f<y+h-2;f+=6.6) m.box(cx,f,cz,w*.7+.3,.35,d*.7+.3,[.74,.72,.68]);                                                                  // floor bands
    lonWindows(m,rnd,cx-w*.35,cz-d*.35,cx+w*.35,cz+d*.35,y+5,y+h-2,3.6,3.3,.85,toRoad()); m.box(cx,y+h+2,cz,w*.3,2.4,d*.3,[.5,.5,.52]);
    rects.push([cx,cz,w*.35+.4,d*.35+.4]); return; }
  rects.push([cx,cz,w/2+.4,d/2+.4]); }
// ---------- open bridges: both Thames bridges are raised, so the road jumps them ----------
// Tower Bridge (LON_TB): two bascule leaves raised towards each other between the towers, a gap of 2G between their tips; P = the pivots.
// The other bridge (LON_SB): one steel leaf lifted from a0 to its tip at a1 by an overhead counterweight portal, then a gap to the fixed span at a2, which sits lower than the tip.
// (a: metres along the road from the bridge's centre, in the race direction; k: slope of the leaves)
const LON_TB={G:4.5,P:15.5,k:.28}, LON_SB={a0:-15,a1:2,a2:13,k:.2};
function lonLeaves(B,tower){
  if(tower){ const {G,P,k}=LON_TB; B.leaf=a=>{ const u=Math.abs(a); return u<G?null:u<P?(P-u)*k:0; }; B.leafY=a=>B.top+(P-clamp(Math.abs(a),G,P))*k; }
  else { const {a0,a1,a2,k}=LON_SB; B.leaf=a=>a<a0||a>=a2?0:a<a1?(a-a0)*k:null; B.leafY=a=>B.top+(a>a0&&a<=a1+.01?(Math.min(a,a1)-a0)*k:0); }
  B.tower=tower; B.e0=wrapS(track[B.i0].s-B.s)*TL; B.e1=wrapS(track[(B.i0+B.n-1)%M].s-B.s)*TL; }
// the road a metres along an open bridge from its centre, between the track samples: position and direction
function lonBrAt(B,a){ let s=B.s+a/TL; s-=Math.floor(s); const i=idxOfS(s), j=(i+1)%M, t0=track[i], t1=track[j], u=clamp((s-t0.s)/(((j?t1.s:1)-t0.s)||1),0,1);
  return {x:lerp(t0.x,t1.x,u),z:lerp(t0.z,t1.z,u),tx:lerp(t0.tx,t1.tx,u),tz:lerp(t0.tz,t1.tz,u)}; }
const lonSide=(B,a,lat)=>{ const p=lonBrAt(B,a); return [p.x+p.tz*lat,p.z-p.tx*lat]; };
// a closed strip along an open bridge from a0 to a1: centred lat to the side of the road, half width hw, from yb(a) to yt(a) (one strip, so no touching boxes flicker)
function lonStrip(m,B,a0,a1,lat,hw,yb,yt,col){
  const n=Math.max(1,Math.ceil(Math.abs(a1-a0)/2.5)), L=[], R=[], A=[], C=[];
  for(let k=0;k<=n;k++){ const a=lerp(a0,a1,k/n), p=lonBrAt(B,a), cx=p.x+p.tz*lat, cz=p.z-p.tx*lat; L.push([cx+p.tz*hw,cz-p.tx*hw]); R.push([cx-p.tz*hw,cz+p.tx*hw]); A.push(a); C.push([cx,cz]); }
  const V=(q,y)=>[q[0],y,q[1]], cl=k=>typeof col==='function'?col(k):col;
  for(let k=0;k<n;k++){ const b0=yb(A[k]),b1=yb(A[k+1]),t0=yt(A[k]),t1=yt(A[k+1]), o=[(C[k][0]+C[k+1][0])/2,(b0+b1+t0+t1)/4,(C[k][1]+C[k+1][1])/2], c=cl(k);
    m.quad(V(L[k],t0),V(R[k],t0),V(R[k+1],t1),V(L[k+1],t1),c,o);
    m.quad(V(L[k],b0),V(L[k+1],b1),V(L[k+1],t1),V(L[k],t0),c,o); m.quad(V(R[k],b0),V(R[k+1],b1),V(R[k+1],t1),V(R[k],t0),c,o);
    m.quad(V(L[k],b0),V(R[k],b0),V(R[k+1],b1),V(L[k+1],b1),c,o); }
  for(const [k,j] of [[0,1],[n,n-1]]){ const o=[(C[k][0]*3+C[j][0])/4,(yb(A[k])+yt(A[k]))/2,(C[k][1]*3+C[j][1])/4];
    m.quad(V(L[k],yb(A[k])),V(R[k],yb(A[k])),V(R[k],yt(A[k])),V(L[k],yt(A[k])),cl(0),o); } }
// one open bridge: deck sections [a0,a1,isLeaf], girders, rails and their walls, a wall across every free end (B.ends: a car that falls short meets it)
function lonOpenBridge(m,B,secs,pal){
  const Y=B.leafY, HW=HALFW+.8;
  for(const [a0,a1,leaf] of secs){
    lonStrip(m,B,a0,a1,0,HW,a=>Y(a)-.9,Y,leaf?pal.leaf:pal.deck);
    for(const sg of [-1,1]){
      lonStrip(m,B,a0,a1,sg*(HALFW+.45),.32,a=>Y(a)-1.5,a=>Y(a)+.35,pal.girder);                       // side girder
      lonStrip(m,B,a0,a1,sg*(HALFW+.55),.1,a=>Y(a)+.95,a=>Y(a)+1.2,pal.rail); lonStrip(m,B,a0,a1,sg*(HALFW+.55),.08,a=>Y(a)+.4,a=>Y(a)+.6,pal.rail);
      const np=Math.max(1,Math.round((a1-a0)/3)); for(let q=0;q<=np;q++){ const a=lerp(a0,a1,q/np), [x,z]=lonSide(B,a,sg*(HALFW+.55)); m.box(x,Y(a)+.7,z,.3,1.4,.3,pal.post); }
      const E=[], ne=Math.max(1,Math.ceil((a1-a0)/2.5)); for(let q=0;q<=ne;q++) E.push(lonSide(B,lerp(a0,a1,q/ne),sg*(HALFW+.55))); wallRun(E,.4,2,B.top); } }
  for(const [a,y] of B.ends) wallRun([lonSide(B,a,-HW),lonSide(B,a,HW)],.5,0,undefined,y-3,y-1.2);   // free ends: a car above y-1.45 drives on over them
}
function lonPier(m,B,a,w,col){ const p=lonBrAt(B,a), o=HALFW+1.6; m.prism(p.x-p.tz*o,p.z+p.tx*o,p.x+p.tz*o,p.z-p.tx*o,w,B.level-3,B.leafY(a)-.95,col); }
LEVELS.london={
  id:'london', seed:107, name:'LONDON CALLING', sub:'Mind the gap!',
  loc:'London, England', flag:'gb',
  blurb:'With six vehicles competing, this race has fewer participants than the UK had prime ministers in the past 10 years. Celebrate this bit of trivia by racing through tiny London!',
  theme:{
    skyTop:[0.50,0.53,0.58], skyHor:[0.76,0.78,0.80], fog:[0.70,0.72,0.74], fogN:60, fogF:520, rain:true,
    amb:[.54,.54,.58], hemi:[.20,.20,.23], sun:[.28,.28,.30], light:[.3,.8,.35], night:false, snow:false,
    road:[.24,.24,.28], roadAlt:[.21,.21,.25], roadEdge:[.40,.40,.42], walk:[.55,.55,.56], paving:[.46,.46,.48], pavingAlt:[.41,.41,.44], park:[.22,.38,.20], parkAlt:[.27,.43,.23], stone:[.58,.57,.54], bed:[.26,.24,.22],
    dust:{road:[.7,.72,.75],off:[.6,.62,.62],ice:[.9,.95,1],a:.5,sz:.8},
    map:{bg:'rgba(46,52,60,0.92)',road:'#e8e4d8',edge:'#0a0a0e'}
  },
  phys:{gripRoad:5.4,gripOff:4.0,gripIce:2,dragRoad:.13,dragOff:.4,dragIce:.05,maxOff:.82},
  rim:50,
  hills(x,z){ return 2.4*Math.sin(x/160+.7)*Math.cos(z/190)+1.4*Math.sin((x+z)/90); },
  trackPts(){ return startNear(resampleClosed(filletLoop(LON_V,LON_R,10),M),-240,-259); },
  layout(){ const riv=[]; for(let x=-540;x<=540;x+=20) riv.push([x,thamesZ(x)]);
    return calmLayout([.06,.20,.34,.49,.63,.78,.92],[[.13,6],[.56,6]],.03,.065,crossingZones(riv,.06)); },
  prepare(){
    const raw=new Float32Array(M); for(let i=0;i<M;i++) raw[i]=this.hills(track[i].x,track[i].z); this.prof=smoothArr(raw,6);
    // the Thames: a wide river flowing west to east, crossing the road twice at near-right angles
    const dense=[]; for(let x=-540;x<=540;x+=4) dense.push([x,thamesZ(x)]);
    const cl=[0]; for(let i=1;i<dense.length;i++) cl.push(cl[i-1]+Math.hypot(dense[i][0]-dense[i-1][0],dense[i][1]-dense[i-1][1]));
    const n=Math.round(cl[cl.length-1]/6), pts=[]; let j=0;
    for(let k=0;k<=n;k++){ const d=cl[cl.length-1]*k/n; while(j<cl.length-2&&cl[j+1]<d) j++; const t=(d-cl[j])/((cl[j+1]-cl[j])||1);
      pts.push({x:lerp(dense[j][0],dense[j+1][0],t),z:lerp(dense[j][1],dense[j+1][1],t),u:d,w:21+3*Math.sin(d/60),level:0}); }
    const thames={name:'thames',p:pts}; RIVERS.push(thames);
    findBridges(sp=>this.profile(sp));
    const lvl=(cons,u)=>{ if(u<=cons[0][0]) return cons[0][1]+0.012*(cons[0][0]-u);
      for(let i=0;i<cons.length-1;i++) if(u<=cons[i+1][0]){ const t=(u-cons[i][0])/(cons[i+1][0]-cons[i][0]); return lerp(cons[i][1],cons[i+1][1],(1-Math.cos(Math.PI*t))/2); }
      const L=cons[cons.length-1]; return L[1]-0.012*(u-L[0]); };
    const mc=[]; let prev=1e9;
    for(const B of BRIDGES.slice().sort((a,b)=>a.uc-b.uc)){ const l=Math.min(B.deck-3.5,prev-1.5); mc.push([B.uc,l]); prev=l; }
    for(const q of thames.p) q.level=lvl(mc,q.u);
    for(const B of BRIDGES) B.level=lvl(mc,B.uc);
    { const Bs=BRIDGES.slice().sort((a,b)=>a.uc-b.uc); lonLeaves(Bs[Bs.length-1],true); lonLeaves(Bs[0],false); }   // both bridges are open: jump them
    this.eye={x:-95,z:thamesZ(-95)+34};
    // Trafalgar Square in the pocket of the upper-right hairpin: the largest free circle between the two legs of the turn
    { const hp=[LON_V[4],LON_V[5],LON_V[6]], sd=(a,b,c)=>(a[0]-c[0])*(b[1]-c[1])-(b[0]-c[0])*(a[1]-c[1]); let bd=0,bx=0,bz=0;
      for(let x=200;x<=350;x+=3) for(let z=-290;z<=-120;z+=3){ const p=[x,z], d1=sd(p,hp[0],hp[1]), d2=sd(p,hp[1],hp[2]), d3=sd(p,hp[2],hp[0]);
        if((d1<0||d2<0||d3<0)&&(d1>0||d2>0||d3>0)) continue;
        let md=1e9; for(let k=0;k<M;k+=2) md=Math.min(md,Math.hypot(track[k].x-x,track[k].z-z)); if(md>bd){ bd=md; bx=x; bz=z; } }
      this.plaza={x:bx,z:bz,r:Math.max(8,bd-HALFW-3)}; }
    // puddles on the road (small ellipses, mostly off the racing line): [x,z,half length along the road,half width,heading]
    this.puddles=[]; { const prng=mulberry32(88); let tries=0;
      for(let i=40;i<M&&this.puddles.length<34;i+=1+((prng()*24)|0)){ const t=track[i]; tries++;
        if(bendAt(i)>.02||BRIDGES.some(B=>Math.abs(wrapS(t.s-B.s))*TL<B.L/2+14)||GATES.some(g=>Math.hypot(g.x-t.x,g.z-t.z)<28)||JUMPS.some(j=>{ const d=((t.s-j[0]+1.5)%1)-.5; return d>-.04&&d<.08; })) continue;
        const off=(prng()-.5)*20, len=3+prng()*3.4;
        this.puddles.push([t.x+t.tz*off,t.z-t.tx*off,len,2+prng()*2,Math.atan2(t.tx,t.tz)]); } } },
  puddleAt(x,z){ for(const p of this.puddles){ if(Math.abs(x-p[0])>p[2]+2||Math.abs(z-p[1])>p[2]+2) continue;
      const dx=x-p[0], dz=z-p[1], c=Math.cos(p[4]), s=Math.sin(p[4]), a=(dx*s+dz*c)/p[2], b=(dx*c-dz*s)/p[3]; if(a*a+b*b<1) return 1; } return 0; },
  profile(s){ return arrProfile(this.prof,s)+jumpsSum(s); },
  base(x,z,th,d){ const far=smooth(HALFW+2,60,d); return th*(1-far)+this.hills(x,z)*far; },
  shape(x,z,h,d,s,k){
    const hRoad=h; let rn=1e9;
    for(const r of RIVERS){ const q=riverQuery(r,x,z);
      const ground=q.level+0.5+0.05*Math.max(0,q.d-q.w)-2.4*(1-smooth(q.w*0.2,q.w,q.d));
      h=lerp(h,ground,1-smooth(q.w*1.15,q.w*1.15+16,q.d)); rn=Math.min(rn,q.d/q.w); }
    RN[k]=rn; const span=onBridgeSpan(d,s); SPAN[k]=span?1:0;
    return span?h:lerp(h,hRoad,1-smooth(HALFW,HALFW+14,d)); },
  iceAt(){ return false; },
  color(c){
    const T=THEME;
    if(c.span) return T.bed;
    if(c.d<HALFW){
      if(c.s<0.0035||c.s>0.9985) return [.92,.92,.92];
      if(c.d>HALFW-2) return T.roadEdge;
      return vnoise(c.cx*.2,c.cz*.2)>.5?T.road:T.roadAlt; }
    if(c.rn<0.85) return T.bed;
    if(c.rn<1.7) return T.stone;
    if(Math.hypot(c.cx-this.plaza.x,c.cz-this.plaza.z)<this.plaza.r) return T.walk;
    if(c.d<HALFW+5) return T.walk;
    const g=vnoise(c.cx*.02+5,c.cz*.02);
    if(g>.62) return vnoise(c.cx*.1,c.cz*.1)>.5?T.park:T.parkAlt;
    return vnoise(c.cx*.15,c.cz*.15)>.5?T.paving:T.pavingAlt; },
  decor(m,rnd){
    const thames=RIVERS[0], nearRiver=(x,z,pad)=>{ const q=riverQuery(thames,x,z); return q.d<q.w*1.6+pad; };
    // terraced streets: a house every ~12 units on both sides of the road
    const turnAt=i=>angDiff(Math.atan2(track[(i+8)%M].tx,track[(i+8)%M].tz),Math.atan2(track[(i-8+M)%M].tx,track[(i-8+M)%M].tz));
    for(const sg of [1,-1]) for(let i=2;i<M;){
      const off=9+rnd()*1.5, len=9+rnd()*5, dep=12+rnd()*3, adv=Math.max(2,Math.round(len/(TL/M))), im=(i+(adv>>1))%M, tt=track[im];
      const [x,z]=roadside(im,sg,off+dep/2), nx=-tt.tz*sg, nz=tt.tx*sg;
      const skip=nearRiver(x,z,12)||Math.hypot(x-this.plaza.x,z-this.plaza.z)<this.plaza.r+10||rnd()<.06||(bendAt(im)>.012&&(sg>0)===(turnAt(im)>0));   // (no houses on the inside of a tight bend)
      i+=adv; if(skip) continue;
      const hs=[hAt(x,z),hAt(x+tt.tx*len/2,z+tt.tz*len/2),hAt(x-tt.tx*len/2,z-tt.tz*len/2),hAt(x-nx*dep/2,z-nz*dep/2)], gy=Math.min(...hs)-1.5;
      terrace(m,rnd,x,z,tt.tx,tt.tz,nx,nz,len,dep,gy,15+rnd()*7+(rnd()<.14?10:0));
      obbCircles(x,z,tt.tx,tt.tz,len+.8,dep+.8); }
    // the rest of the city: blocks on a loose grid wherever there is room (parks stay open and get trees), detailed whatever their distance from the road
    const park=(x,z)=>vnoise(x*.02+5,z*.02)>.62, Ey=this.eye, Q0=this.plaza;
    for(let gz=-470;gz<=470;gz+=27) for(let gx=-470;gx<=470;gx+=27){
      const x=gx+(rnd()-.5)*8, z=gz+(rnd()-.5)*8, w=15+rnd()*9, d=15+rnd()*9, x0=x-w/2, x1=x+w/2, z0=z-d/2, z1=z+d/2, kr=rnd();
      if(rnd()<.1||park(x,z)||nearRiver(x,z,26)||Math.hypot(x-Q0.x,z-Q0.z)<Q0.r+18||(Math.abs(x-Ey.x)<70&&z>Ey.z-30&&z<Ey.z+88)||(x<-340&&Math.abs(z-thamesZ(x)+20)<80)) continue;
      if([[x0,z0],[x1,z0],[x0,z1],[x1,z1],[x,z]].some(([px,pz])=>roadDist(px,pz)<HALFW+27)) continue;
      if(rects.some(r=>Math.abs(r[0]-x)<r[2]+w/2+2&&Math.abs(r[1]-z)<r[3]+d/2+2)) continue;
      const mid=1-Math.hypot(x,z)/520, kind=kr<.34?0:kr<.64?1:kr<.86?2:(rnd()<.5+mid*.4?3:1);
      fillerBlock(m,rnd,x0,z0,x1,z1,footprint(x0,z0,x1,z1)[0]-1.2,kind); }
    for(let gz=-470;gz<=470;gz+=20) for(let gx=-470;gx<=470;gx+=20){ const x=gx+(rnd()-.5)*12, z=gz+(rnd()-.5)*12;
      if(!park(x,z)||rnd()<.35||nearRiver(x,z,6)||roadDist(x,z)<HALFW+6||Math.hypot(x-Q0.x,z-Q0.z)<Q0.r+4||(Math.abs(x-Ey.x)<46&&z>Ey.z-12&&z<Ey.z+82)||rects.some(r=>Math.abs(r[0]-x)<r[2]+2&&Math.abs(r[1]-z)<r[3]+2)) continue;
      planeTree(m,rnd,x,hAt(x,z),z,.8+rnd()*.6,rnd()<.5?[.26,.44,.22]:[.32,.48,.24]); }
    // landmarks
    const Q=this.plaza; nelsonSquare(m,rnd,Q.x,Q.z,Q.r);
    const bank=(x,dz)=>({x,z:thamesZ(x)+dz});
    { const p=bank(-395,-58); bigBen(m,p.x,hAt(p.x,p.z)-1.5,p.z,Math.PI/2); parliament(m,rnd,p.x+8,hAt(p.x+8,p.z+30)-1.5,p.z+30,0,56); }
    const EYE=this.eye; londonEye(m,EYE.x,hAt(EYE.x,EYE.z)-.3,EYE.z,40);
    // the open bridges: Tower Bridge (twin bascules between two towers, high walkways, suspension chains to the banks) and a red steel lifting bridge (one leaf, counterweight portal)
    for(const B of BRIDGES){ const e0=B.e0, e1=B.e1, H=B.top;
      if(B.tower){ const {G,P}=LON_TB; B.ends=[[-G,B.leafY(G)],[G,B.leafY(G)]];
        lonOpenBridge(m,B,[[e0,-P,0],[-P,-G,1],[G,P,1],[P,e1,0]],{deck:[.26,.26,.3],leaf:[.3,.32,.36],girder:[.3,.5,.78],rail:[.2,.5,.8],post:[.92,.92,.9]});
        for(const a of [-P,P]) lonPier(m,B,a,2.6,[.58,.57,.54]);
        const TA=P+3.4, o=HALFW+4.2;
        for(const a of [-TA,TA]){ const p=lonBrAt(B,a), yaw=Math.atan2(p.tx,p.tz);
          for(const sg of [-1,1]){ const [x,z]=lonSide(B,a,sg*o);
            orBox(m,x,z,6.5,6.5,B.level-3,H+34,yaw,[.64,.62,.58]); orBox(m,x,z,7,7,H+6,H+7,yaw,[.56,.54,.5]); orBox(m,x,z,7,7,H+33,H+34.6,yaw,[.56,.54,.5]);
            pyramid(m,x,H+34.6,z,3.6,3.6,10,[.3,.42,.58]); for(const [c,d] of [[-1,-1],[1,-1],[-1,1],[1,1]]) m.cone(x+Math.cos(yaw)*c*2.7+Math.sin(yaw)*d*2.7,H+34.6,z-Math.sin(yaw)*c*2.7+Math.cos(yaw)*d*2.7,.9,4,5,[.3,.42,.58]);
            for(const yy of [12,19,26]){ m.em=true; wallQuad(m,x+p.tz*sg*3.3,H+yy,z-p.tx*sg*3.3,p.tz*sg,-p.tx*sg,1.2,2.4,[.86,.84,.66]); m.em=false; }
            colliders.push([x,z,3.8,2,H]);
            // suspension chain from the tower top down to the bank end of the bridge
            const out=Math.sign(a), C=[]; for(let q=0;q<=8;q++){ const u=q/8, aa=a+out*u*((e1-e0)/2-TA-2), [cx,cz]=lonSide(B,aa,sg*(HALFW+2.6)); C.push([cx,H+24-21*Math.sqrt(u)+2*u*u,cz]); }
            for(let q=0;q<8;q++) strut(m,C[q],C[q+1],.35,.35,[.3,.5,.78]); }
          const [ax,az]=lonSide(B,a,-o), [bx,bz]=lonSide(B,a,o); m.prism(ax,az,bx,bz,2.4,H+25,H+27,[.3,.5,.78]); }   // the arch head over the road
        for(const sg of [-1,1]){ const [ax,az]=lonSide(B,-TA,sg*o), [bx,bz]=lonSide(B,TA,sg*o);                       // high-level walkways between the towers
          m.prism(ax,az,bx,bz,1.6,H+28,H+31,[.3,.5,.78]); m.prism(ax,az,bx,bz,1.7,H+31,H+31.4,[.86,.86,.84]); } }
      else { const {a0,a1,a2}=LON_SB, tip=B.leafY(a1); B.ends=[[a1,tip],[a2,H]];
        const red=[.62,.16,.12];
        lonOpenBridge(m,B,[[e0,a0,0],[a0,a1,1],[a2,e1,0]],{deck:[.26,.26,.3],leaf:[.32,.3,.3],girder:red,rail:[.18,.18,.2],post:[.18,.18,.2]});
        lonPier(m,B,a0,2.2,[.58,.57,.54]); lonPier(m,B,a2,2.2,[.58,.57,.54]);
        // the portal over the hinge: two pylons, a cross beam with the counterweight on top, lifting rods to the corners of the leaf's tip
        const o=HALFW+2.4, p=lonBrAt(B,a0-1.5), yaw=Math.atan2(p.tx,p.tz);
        for(const sg of [-1,1]){ const [x,z]=lonSide(B,a0-1.5,sg*o); orBox(m,x,z,2.4,2.4,B.level-3,H+17,yaw,red); colliders.push([x,z,1.7,0,H]);
          const [tx,tz]=lonSide(B,a1-.3,sg*(HALFW+.5)); strut(m,[x,H+16,z],[tx,tip+.4,tz],.16,.16,[.2,.2,.22]); }
        const [ax,az]=lonSide(B,a0-1.5,-o-1.2), [bx,bz]=lonSide(B,a0-1.5,o+1.2); m.prism(ax,az,bx,bz,1.3,H+15.2,H+17.4,red);
        const [cx,cz]=lonSide(B,a0-4,0); orBox(m,cx,cz,4.5,HALFW*1.4,H+17.4,H+21.5,yaw,[.34,.34,.36]);
        // lamps on the fixed spans
        for(const [b0,b1] of [[e0+3,a0-5],[a2+3,e1-3]]) for(let a=b0;a<=b1;a+=9) for(const sg of [-1,1]){ const [x,z]=lonSide(B,a,sg*(HALFW+.55)), y=B.leafY(a);
          m.box(x,y+3,z,.22,6,.22,[.18,.18,.2]); m.em=true; m.box(x,y+6.2,z,.8,.5,.8,[1,.9,.6]); m.em=false; } } }
    // street furniture: lamps, phone boxes, pillar boxes, parked cabs and buses, plane trees, a few park trees inside the loop
    for(let i=5;i<M;i+=14){ const sg=((i/14)|0)&1?1:-1, [x,z]=roadside(i,sg,2.2); if(nearRiver(x,z,0)||BRIDGES.some(B=>Math.abs(wrapS(track[i].s-B.s))*TL<B.L/2+10)||GATES.some(g=>Math.hypot(g.x-x,g.z-z)<14)) continue;
      lampPost(m,x,z,6.4,[.1,.28,.2],[1,.9,.6]); }
    for(let i=30;i<M;i+=60){ const sg=((i/60)|0)&1?1:-1, [x,z]=roadside(i,sg,5), t=track[i]; if(nearRiver(x,z,0)||this.plaza&&Math.hypot(x-this.plaza.x,z-this.plaza.z)<this.plaza.r+6) continue;
      const r=rnd(); if(r<.3) phoneBox(m,x,z,Math.atan2(t.tx,t.tz)); else if(r<.45) pillarBox(m,x,z);
      else if(r<.75){ vehicleProp(m,x,hAt(x,z),z,Math.atan2(t.tx,t.tz),[.06,.06,.07],'car'); colliders.push([x,z,2.4]); }
      else { vehicleProp(m,x,hAt(x,z),z,Math.atan2(t.tx,t.tz),[.82,.08,.08],'bus'); colliders.push([x,z,3.4],[x+Math.sin(Math.atan2(t.tx,t.tz))*4,z+Math.cos(Math.atan2(t.tx,t.tz))*4,3.4],[x-Math.sin(Math.atan2(t.tx,t.tz))*4,z-Math.cos(Math.atan2(t.tx,t.tz))*4,3.4]); } }
    for(let i=0;i<M;i+=11){ const sg=((i/11)|0)&1?1:-1, [x,z]=roadside(i,sg,3.6); if(nearRiver(x,z,2)||BRIDGES.some(B=>Math.abs(wrapS(track[i].s-B.s))*TL<B.L/2+14)||GATES.some(g=>Math.hypot(g.x-x,g.z-z)<14)) continue; if(rnd()<.55) planeTree(m,rnd,x,hAt(x,z),z,.8+rnd()*.4,rnd()<.5?[.28,.46,.22]:[.34,.5,.24]); }
    // skyline outside the playing area: the Shard, the Gherkin and plain towers
    { const sx=470,sz=-520; m.cone(sx,-20,sz,22,300,4,[.66,.78,.86]); solidCone(sx,-20,sz,22*.85,300); }
    { const gx=-460,gz=-540; frustum(m,gx,-20,gz,18,18,70,10,[.6,.74,.78],[.6,.74,.78]); frustum(m,gx,50,gz,18,9,50,10,[.62,.76,.8],[.62,.76,.8]); frustum(m,gx,100,gz,9,1,30,10,[.64,.78,.82]); }
    for(let i=0;i<26;i++){ const a=i/26*Math.PI*2+rnd()*.1, r=575+rnd()*60, x=Math.cos(a)*r, z=Math.sin(a)*r, w=26+rnd()*20, h=50+rnd()*90;
      windowedBox(m,rnd,x-w/2,z-w/2,x+w/2,z+w/2,-20,h,[.5+rnd()*.15,.5,.52],[[.3,.36,.44]],.5,6,6); rects.push([x,z,w/2,w/2]); }   // (towards the corners they stand inside the map)
  },
  marks(m){
    for(const [px,pz,len,wd,yaw] of this.puddles){ const c=Math.cos(yaw), sn=Math.sin(yaw), ring=[]; for(let k=0;k<14;k++){ const a=k/14*Math.PI*2, u=Math.cos(a)*len, v=Math.sin(a)*wd, x=px+u*sn+v*c, z=pz+u*c-v*sn; ring.push([x,hAt(x,z)+.17,z]); }
      const ce=[px,hAt(px,pz)+.17,pz]; for(let k=0;k<14;k++) m.tri(ce,ring[k],ring[(k+1)%14],[.42,.5,.6],'up'); }
    for(let i=0;i<M;i++){ if(BRIDGES.some(B=>B.leaf&&Math.abs(wrapS(track[i].s-B.s))*TL<B.L/2+10)) continue; if(i%10<5) markStrip(m,i,i+1,0,.16,[.92,.92,.92]);
      for(const sg of [-1,1]){ markStrip(m,i,i+1,sg*(HALFW-1.6),.12,[.92,.8,.2]); markStrip(m,i,i+1,sg*(HALFW-2.2),.12,[.92,.8,.2]); } } },
  mapBg(g,X,Z,sc){ for(const r of RIVERS){ g.beginPath(); r.p.forEach((q,i)=>i?g.lineTo(X(q.x),Z(q.z)):g.moveTo(X(q.x),Z(q.z)));
      g.strokeStyle='#3f7fc0'; g.lineWidth=Math.max(2,r.p[Math.floor(r.p.length/2)].w*2*sc); g.stroke(); }
    g.fillStyle='rgba(120,160,110,0.5)'; g.beginPath(); g.arc(X(this.plaza.x),Z(this.plaza.z),this.plaza.r*sc,0,7); g.fill(); },
  mapFg(g,X,Z,sc,road){ for(const B of BRIDGES) road(B.i0,B.n,'#4a78b0',TW*sc); }
};
