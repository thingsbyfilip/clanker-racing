'use strict';
// Helpers shared by the newer levels (market, junction, miami, london, refinery, farm, hellcreek, moon): track building from
// control points, picking calm stretches for gates and jumps, scatter helpers and a few generic props.

// ---------- track building ----------
// closed Catmull-Rom spline through control points [[x,z],...] -> n equally spaced points
function closedSpline(ctl,n){
  const m=ctl.length, dense=[];
  for(let i=0;i<m;i++) for(let k=0;k<20;k++){
    const t=k/20, a=ctl[(i+m-1)%m], b=ctl[i], c=ctl[(i+1)%m], d=ctl[(i+2)%m];
    dense.push([0,1].map(j=>0.5*(2*b[j]+(c[j]-a[j])*t+(2*a[j]-5*b[j]+4*c[j]-d[j])*t*t+(3*b[j]-a[j]-3*c[j]+d[j])*t*t*t))); }
  return resampleClosed(dense,n); }
// closed polygon with every corner rounded by a circular arc (R: one radius or one per vertex). Corners are rounded as much as the
// adjacent edges allow, so a tight corner between short edges ends up with a smaller radius.
function filletLoop(V,R,steps){
  const n=V.length, out=[]; steps=steps||8;
  for(let k=0;k<n;k++){
    const P=V[(k+n-1)%n], C=V[k], Q=V[(k+1)%n], r=Array.isArray(R)?R[k]:R;
    let ux=P[0]-C[0], uz=P[1]-C[1], wx=Q[0]-C[0], wz=Q[1]-C[1];
    const lu=Math.hypot(ux,uz), lw=Math.hypot(wx,wz); ux/=lu; uz/=lu; wx/=lw; wz/=lw;
    const th=Math.acos(clamp(ux*wx+uz*wz,-1,1));                        // interior angle at this vertex
    if(th>3.1){ out.push([C[0],C[1]]); continue; }
    const t=Math.min(r/Math.tan(th/2),0.48*lu,0.48*lw), rr=t*Math.tan(th/2), bx=ux+wx, bz=uz+wz, bl=Math.hypot(bx,bz);
    const cc=[C[0]+bx/bl*rr/Math.sin(th/2),C[1]+bz/bl*rr/Math.sin(th/2)];
    const a1=Math.atan2(C[1]+uz*t-cc[1],C[0]+ux*t-cc[0]), a2=Math.atan2(C[1]+wz*t-cc[1],C[0]+wx*t-cc[0]);
    let da=a2-a1; while(da>Math.PI) da-=2*Math.PI; while(da<-Math.PI) da+=2*Math.PI;
    const st=Math.max(3,Math.ceil(Math.abs(da)/(Math.PI/2)*steps));
    for(let s=0;s<=st;s++){ const a=a1+da*s/st; out.push([cc[0]+Math.cos(a)*rr,cc[1]+Math.sin(a)*rr]); } }
  return out; }
// cap the steepness of a closed road-height array (heights per track sample, in place): neighbouring samples differ by at most maxGrade * spacing
function limitGrade(arr,maxGrade){ const st=maxGrade*TL/M;
  for(let pass=0;pass<3;pass++){
    for(let i=1;i<2*M;i++){ const a=(i-1)%M, b=i%M; arr[b]=clamp(arr[b],arr[a]-st,arr[a]+st); }
    for(let i=2*M-1;i>0;i--){ const a=i%M, b=(i-1)%M; arr[b]=clamp(arr[b],arr[a]-st,arr[a]+st); } }
  return arr; }
// how sharply the road bends around sample i (radians per unit of length, measured over +-4 samples)
function bendAt(i){ const a=track[(i-4+M)%M], b=track[(i+4)%M];
  return Math.abs(angDiff(Math.atan2(b.tx,b.tz),Math.atan2(a.tx,a.tz)))/(8*TL/M); }
// the track position nearest s0 (within +-win) whose surroundings (+-len units) are straightest: gates and jumps go there.
// avoid = list of [from,to] track-position ranges (may wrap past 1) that are off limits.
function calmS(s0,win,len,avoid){
  const k=Math.ceil(len/(TL/M)), banned=s=>avoid&&avoid.some(([a,b])=>{ a=((a%1)+1)%1; b=((b%1)+1)%1; return a<=b?(s>=a&&s<=b):(s>=a||s<=b); });
  for(let w=win;w<=win*6+1e-9;w+=win){                                     // (if the whole window is off limits, look further afield)
    let best=null, bs=1e9;
    for(let d=-w;d<=w+1e-9;d+=0.003){
      const s=((s0+d)%1+1)%1, i=Math.round(s*M)%M; if(banned(s)) continue; let mx=0;
      for(let j=-k;j<=k;j+=3) mx=Math.max(mx,bendAt((i+j+M)%M));
      const sc=mx+Math.abs(d)*0.0009; if(sc<bs){ bs=sc; best=s; } }
    if(best!==null) return best; }
  return s0; }
// layout from rough fractions: jumps go to long straights (so the landing is straight and clear too), then the gates go to straights
// outside the jumps' take-off and landing zones. jumps = [[s,height,straightLen?],...]; `after` = how far (in track position) a jump flies.
function calmLayout(gates,jumps,win,after,avoid){
  win=win||0.03; after=after||0.07; avoid=avoid||[];
  const J=jumps.map(j=>[calmS(j[0],win,j[2]||170,avoid),j[1]]), zones=J.map(j=>[j[0]-0.03,j[0]+after]).concat(avoid);
  return {gates:gates.map(f=>calmS(f,win,45,zones)), jumps:J}; }
// track positions where the road crosses the line (x0,z0)-(x1,z1), each widened into a [from,to] range (for `avoid`)
function crossingZones(pts,pad){ const out=[]; if(!track.length) return out;
  for(let i=0;i<M;i++){ const a=track[i], b=track[(i+1)%M];
    for(let k=0;k<pts.length-1;k++){ const p=pts[k], q=pts[k+1], rx=q[0]-p[0], rz=q[1]-p[1], qx=b.x-a.x, qz=b.z-a.z, den=rx*qz-rz*qx; if(Math.abs(den)<1e-9) continue;
      const t=((a.x-p[0])*qz-(a.z-p[1])*qx)/den, u=((a.x-p[0])*rz-(a.z-p[1])*rx)/den;
      if(t>=0&&t<1&&u>=0&&u<1){ const s=a.s+(((b.s-a.s)+1.5)%1-.5)*u; out.push([s-pad,s+pad]); } } }
  return out; }
// distance from (x,z) to the road, read from the terrain grid (cheap; good to a few units; valid once the terrain is built, i.e. in decor/marks)
function roadDist(x,z){ const gx=clamp(Math.round(x/CELL+N/2),0,N), gz=clamp(Math.round(z/CELL+N/2),0,N); return DIST[gz*(N+1)+gx]; }
// lowest and highest ground under the rectangle (x0,z0)-(x1,z1), sampled on a 5x5 grid: buildings sit on the lowest point (so none hangs in the air on a slope)
function footprint(x0,z0,x1,z1){ let lo=1e9,hi=-1e9; for(let a=0;a<=4;a++) for(let b=0;b<=4;b++){ const h=hAt(lerp(x0,x1,a/4),lerp(z0,z1,b/4)); lo=Math.min(lo,h); hi=Math.max(hi,h); } return [lo,hi]; }
// the lowest ground under a round thing of radius r at (x,z): its centre and twelve points round its edge (stand round props on it, so no side hangs over a slope)
function lowGround(x,z,r){ let y=hAt(x,z); for(let k=0;k<12;k++){ const a=k/12*6.283; y=Math.min(y,hAt(x+Math.cos(a)*r,z+Math.sin(a)*r)); } return y; }
// a solid cone (a hill drawn with m.cone): a stack of circles, outermost and lowest first, each as tall as the cone where the next one starts,
// so a car meets the slope about where it is drawn (to within one step) and can drive over the parts lower than itself. Only the part above
// the lowest ground under the cone's foot, up to 40 m above it (no car flies higher out there), gets circles; nothing beyond the map's edge.
function solidCone(x,y,z,R,H){ const g=Math.max(y,lowGround(x,z,R)), top=Math.min(y+H,g+40), n=Math.max(1,Math.ceil((top-g)/2.5));
  for(let i=0;i<n;i++){ const h0=g+(top-g)*i/n, h1=g+(top-g)*(i+1)/n, r=R*(1-(h0-y)/H); if(Math.abs(x)-r>HALF||Math.abs(z)-r>HALF) continue;
    const c=[x,z,Math.max(.5,r-1.2)]; c.y0=y; c.y1=h1; c.fix=true; colliders.push(c); } }
// the outline of an orBox (len along the heading yaw, wid across) as one closed wall of radius r just inside its faces
function wallBox(x,z,len,wid,yaw,r){ const fx=Math.sin(yaw), fz=Math.cos(yaw), a=len/2-r, b=wid/2-r, P=[[a,b],[-a,b],[-a,-b],[a,-b],[a,b]].map(([u,v])=>[x+fx*u+fz*v,z+fz*u-fx*v]); wallRun(P,r); }
// the part of the road a wall [x0,z0,x1,z1,r] covers, as LV.obstacles entries [track index, lateral centre, half width] every second sample
// (lateral as in roadside: + is the t.tz,-t.tx side), so the AI and the bots steer round it; nothing is added for a wall clear of the road
function roadObstacles(w,out){
  const ex=w[2]-w[0], ez=w[3]-w[1], l2=ex*ex+ez*ez||1, R=w[4]+2.5, near=(x,z)=>{ const u=clamp(((x-w[0])*ex+(z-w[1])*ez)/l2,0,1); return Math.hypot(x-w[0]-ex*u,z-w[1]-ez*u)<R; };
  for(let i=0;i<M;i+=2){ const t=track[i]; if(Math.hypot(t.x-(w[0]+w[2])/2,t.z-(w[1]+w[3])/2)>Math.sqrt(l2)/2+R+HALFW) continue; let lo=1e9,hi=-1e9;
    for(let q=-HALFW-1;q<=HALFW+1;q+=.5) if(near(t.x+t.tz*q,t.z-t.tx*q)){ lo=Math.min(lo,q); hi=Math.max(hi,q); }
    if(hi>=lo) out.push([i,(lo+hi)/2,(hi-lo)/2]); } }
const clearOfRoad=(x,z,pad)=>roadDist(x,z)>HALFW+pad+3;
// a point beside the road: track index i, side sg (+1 / -1), distance off the road edge
function roadside(i,sg,off){ const t=track[(i+M)%M], o=HALFW+off; return [t.x+t.tz*sg*o,t.z-t.tx*sg*o]; }

// ---------- generic props ----------
// a box with its own heading: centre (x,z), length along yaw, width, from y0 to y1
function orBox(m,x,z,len,wid,y0,y1,yaw,col){ const fx=Math.sin(yaw)*len/2, fz=Math.cos(yaw)*len/2; m.prism(x-fx,z-fz,x+fx,z+fz,wid/2,y0,y1,col); }
// vertical cylinder (tanks, columns, towers)
function cylY(m,cx,y0,cz,r,h,seg,col,topCol){
  const o=[cx,y0+h/2,cz], ring=[];
  for(let i=0;i<seg;i++){ const a=i/seg*Math.PI*2; ring.push([cx+Math.cos(a)*r,cz+Math.sin(a)*r]); }
  for(let i=0;i<seg;i++){ const p=ring[i], q=ring[(i+1)%seg], c=i&1?col:[col[0]*.9,col[1]*.9,col[2]*.9];
    m.quad([p[0],y0,p[1]],[q[0],y0,q[1]],[q[0],y0+h,q[1]],[p[0],y0+h,p[1]],c,o);
    m.tri([cx,y0+h,cz],[p[0],y0+h,p[1]],[q[0],y0+h,q[1]],topCol||col,'up'); } }
// truncated cone (r0 at the bottom, r1 at the top), `cap` = colour of the top
function frustum(m,cx,y0,cz,r0,r1,h,seg,col,cap){
  const o=[cx,y0+h/2,cz], A=[], B=[];
  for(let i=0;i<seg;i++){ const a=i/seg*Math.PI*2, c=Math.cos(a), s=Math.sin(a); A.push([cx+c*r0,y0,cz+s*r0]); B.push([cx+c*r1,y0+h,cz+s*r1]); }
  for(let i=0;i<seg;i++){ const j=(i+1)%seg, cc=i&1?col:[col[0]*.9,col[1]*.9,col[2]*.9];
    m.quad(A[i],A[j],B[j],B[i],cc,o); if(cap) m.tri([cx,y0+h,cz],B[i],B[j],cap,'up'); } }
// ridge roof over the rectangle (x0,z0)-(x1,z1) at height y (ridge `h` higher); the ridge runs along x if alongX. gc = gable end colour
function gable(m,x0,z0,x1,z1,y,h,col,alongX,gc){
  const cx=(x0+x1)/2, cz=(z0+z1)/2, A=[x0,y,z0], B=[x1,y,z0], C=[x1,y,z1], D=[x0,y,z1], o=[cx,y+h*.3,cz]; gc=gc||col;
  if(alongX){ const R0=[x0,y+h,cz], R1=[x1,y+h,cz]; m.quad(A,B,R1,R0,col,o); m.quad(C,D,R0,R1,col,o); m.tri(A,D,R0,gc,o); m.tri(B,C,R1,gc,o); }
  else { const R0=[cx,y+h,z0], R1=[cx,y+h,z1]; m.quad(B,C,R1,R0,col,o); m.quad(D,A,R0,R1,col,o); m.tri(A,B,R0,gc,o); m.tri(C,D,R1,gc,o); } }
// a flat quad in a vertical plane: from p0 to p1 on the ground plane, between heights y0 and y1 (banners, blades, billboards)
function vQuad(m,x0,z0,x1,z1,y0,y1,col,o){ m.quad([x0,y0,z0],[x1,y0,z1],[x1,y1,z1],[x0,y1,z0],col,o||[(x0+x1)/2,(y0+y1)/2,(z0+z1)/2]); }
// small standing figure (market crowds, spectators)
function person(m,x,y,z,col,rnd){ const h=rnd?1.5+rnd()*.35:1.7;
  m.box(x,y+h*.35,z,.55,h*.7,.4,col); m.box(x,y+h*.82,z,.38,.38,.38,[.85,.66,.5]); }
// a parked car, van or bus (static scenery). kind: 'car' | 'van' | 'bus' | 'truck' (box truck)
function vehicleProp(m,x,y,z,yaw,col,kind){
  const L={car:4.4,van:5.4,bus:11,truck:8}[kind||'car'], Wd={car:2,van:2.2,bus:2.6,truck:2.5}[kind||'car'], Ht={car:1.0,van:2.5,bus:5.2,truck:3.4}[kind||'car'];
  const A=kind==='bus'?[-.36,.34]:[-.3,.3], Y=slopeFrame(x,y,z,yaw,L*A[0],L*A[1],Wd*.5), box=(a,l,len,wid,d0,d1,c)=>slopeBox(m,x,z,yaw,Y,a,l,len,wid,d0,d1,c);
  box(0,0,L,Wd,.45,.45+Ht,col);
  if(kind==='car'||!kind){ box(-.2,0,2.4,Wd*.9,1.45,2.1,[.14,.18,.26]); }
  else if(kind==='bus'){ box(0,0,L*.96,Wd*1.01,1.7,2.6,[.16,.2,.26]); box(0,0,L*.96,Wd*1.01,3.9,4.7,[.16,.2,.26]); }
  else if(kind==='van'){ box(L*.32,0,1.4,Wd*1.01,1.5,2.4,[.14,.18,.26]); }
  for(const a of A) for(const sg of [-1,1]) box(L*a,sg*Wd*.5,1.1,.4,0,.9,[.08,.08,.09]); }
// Parked vehicles follow the slope they stand on: slopeFrame gives the height of the ground line along the heading (a = metres ahead of
// (x,z)), through the lower side of the rear axle (at aR) and of the front one (aF, half track hw), so no wheel hangs in the air. A y away
// from the ground (on a deck) keeps the vehicle level at y. slopeBox is orBox on that line: a box from a-len/2 to a+len/2, l to the side.
function slopeFrame(x,y,z,yaw,aR,aF,hw){
  if(Math.abs(y-hAt(x,z))>.5) return ()=>y;
  const fx=Math.sin(yaw), fz=Math.cos(yaw), ax=a=>Math.min(hAt(x+fx*a+fz*hw,z+fz*a-fx*hw),hAt(x+fx*a-fz*hw,z+fz*a+fx*hw)), yr=ax(aR), k=(ax(aF)-yr)/(aF-aR);
  return a=>yr+k*(a-aR); }
function slopeBox(m,x,z,yaw,Y,a,l,len,wid,d0,d1,col){ const fx=Math.sin(yaw), fz=Math.cos(yaw), px=x+fz*l, pz=z-fx*l, a0=a-len/2, a1=a+len/2;
  slantPrism(m,px+fx*a0,pz+fz*a0,px+fx*a1,pz+fz*a1,wid/2,Y(a0)+d0,Y(a0)+d1,Y(a1)+d0,Y(a1)+d1,col); }
// a semi truck: cab, long trailer, wheels (static)
function semiTruck(m,x,y,z,yaw,cabCol,trailCol){
  const Y=slopeFrame(x,y,z,yaw,-5.25,7.25,1.2), box=(a,l,len,wid,d0,d1,c)=>slopeBox(m,x,z,yaw,Y,a,l,len,wid,d0,d1,c);
  box(7.5,0,3.4,2.6,.8,3.6,cabCol); box(8.2,0,1.8,2.5,2.6,3.4,[.14,.18,.26]);
  box(-1.5,0,12.5,2.7,1,4.2,trailCol);
  for(const a of [-6,-4.5,6.5,8]) for(const sg of [-1,1]) box(a,sg*1.2,1.1,.5,0,1.1,[.07,.07,.08]); }
// a box from (ax,az) to (bx,bz), half width hw, from ya0 to ya1 high at the a end and yb0 to yb1 at the b end (a prism that follows a slope)
function slantPrism(m,ax,az,bx,bz,hw,ya0,ya1,yb0,yb1,col){
  const dx=bx-ax, dz=bz-az, l=Math.hypot(dx,dz)||1, nx=-dz/l*hw, nz=dx/l*hw, o=[(ax+bx)/2,(ya0+ya1+yb0+yb1)/4,(az+bz)/2];
  const v=[[ax+nx,ya0,az+nz],[ax-nx,ya0,az-nz],[bx-nx,yb0,bz-nz],[bx+nx,yb0,bz+nz],[ax+nx,ya1,az+nz],[ax-nx,ya1,az-nz],[bx-nx,yb1,bz-nz],[bx+nx,yb1,bz+nz]];
  for(const q of [[0,1,2,3],[7,6,5,4],[0,4,5,1],[3,2,6,7],[0,3,7,4],[1,5,6,2]]) m.quad(v[q[0]],v[q[1]],v[q[2]],v[q[3]],col,o); }
// a street / road lamp on a post with an emissive head (steady light)
function lampPost(m,x,z,h,post,lamp){ const y=hAt(x,z); m.box(x,y+h/2,z,.3,h,.3,post); m.em=true; m.box(x,y+h+.15,z,1.1,.35,1.1,lamp); m.em=false; colliders.push([x,z,.4]); }
// a run of strip-lit road markings: a strip of width 2w at lateral offset `off` from sample i0 to i1 (draped on the ground, or at yFn(i) on a deck)
function markStrip(m,i0,i1,off,w,col,yFn,lift){                // lift: height above the ground (default .16; a strip driven on as the road itself wants it small, or the tyres sink into it)
  const a=track[i0%M], b=track[i1%M], L=lift===undefined?0.16:lift;
  const P=(t,sg,i)=>{ const x=t.x+t.tz*(off+sg*w), z=t.z-t.tx*(off+sg*w), y=yFn?yFn(i):null; return [x,(y!==null&&y!==undefined?y:hAt(x,z))+L,z]; };
  m.quad(P(a,-1,i0),P(a,1,i0),P(b,1,i1),P(b,-1,i1),col,'up'); }
// a guard rail / jersey barrier along the road edge from sample i0 for n samples: beam, posts, and (if solid) a continuous wall collider
function barrierRun(m,i0,n,sg,off,h,col,yFn,solid){
  const E=[]; for(let k=0;k<n;k++){ const i=(i0+k)%M, t=track[i], x=t.x+t.tz*sg*(HALFW+off), z=t.z-t.tx*sg*(HALFW+off), y=yFn?yFn(i):null; E.push([x,z,y!==null&&y!==undefined?y:hAt(x,z)]); }
  for(let k=0;k<n-1;k++){ const a=E[k], b=E[k+1], c=col(k), o=[(a[0]+b[0])/2,a[2]+h/2,(a[1]+b[1])/2];
    const w=0.35, nx=-(b[1]-a[1]), nz=(b[0]-a[0]), l=Math.hypot(nx,nz)||1, ox=nx/l*w, oz=nz/l*w;
    const A0=[a[0]+ox,a[2],a[1]+oz], A1=[a[0]-ox,a[2],a[1]-oz], B0=[b[0]+ox,b[2],b[1]+oz], B1=[b[0]-ox,b[2],b[1]-oz];
    const U=v=>[v[0],v[1]+h,v[2]];
    m.quad(U(A0),U(A1),U(B1),U(B0),c,'up'); m.quad(A0,B0,U(B0),U(A0),c,o); m.quad(A1,U(A1),U(B1),B1,c,o); }
  if(solid) wallRun(E,.5); }

// ferris wheel standing in the plane x=const (ring radius R, axle at height y+R); gondolas alternate between the colours in `gc`
function ferrisWheel(m,x,y,z,R,gc){
  const N_=16, ring=[];
  for(let i=0;i<N_;i++){ const a=i/N_*Math.PI*2; ring.push([x,y+R+Math.sin(a)*R,z+Math.cos(a)*R]); }
  for(let i=0;i<N_;i++){ const p=ring[i], q=ring[(i+1)%N_];
    const a=[p[0]-.4,p[1],p[2]], b=[q[0]-.4,q[1],q[2]], c=[q[0]+.4,q[1],q[2]], dd=[p[0]+.4,p[1],p[2]];
    m.quad(a,b,c,dd,[.95,.95,.95],[x,y+R,z]);
    m.quad([x-.15,y+R,z],[p[0]-.15,p[1],p[2]],[p[0]+.15,p[1],p[2]],[x+.15,y+R,z],[.85,.85,.9],[x,y+R,z+5]);       // spokes
    m.em=true; m.box(p[0],p[1]-.9,p[2],1.2,1.2,1.4,gc[i%gc.length]); m.em=false; }
  for(const sg of [-1,1]){ m.prism(x+sg*1.2,z-R*.5,x,z,.35,y,y+R,[.9,.9,.94]); m.prism(x+sg*1.2,z+R*.5,x,z,.35,y,y+R,[.9,.9,.94]); } }


// a full sphere (storage spheres, domes with a base)
function ball(m,x,y,z,r,col,seg,rings){
  const o=[x,y,z], P=(a,b)=>[x+Math.cos(a)*Math.cos(b)*r,y+Math.sin(b)*r,z+Math.sin(a)*Math.cos(b)*r];
  for(let j=0;j<rings;j++){ const b0=-Math.PI/2+j/rings*Math.PI, b1=-Math.PI/2+(j+1)/rings*Math.PI;
    for(let i=0;i<seg;i++){ const a0=i/seg*Math.PI*2, a1=(i+1)/seg*Math.PI*2; m.quad(P(a0,b0),P(a1,b0),P(a1,b1),P(a0,b1),col,o); } } }
// stretches of the road that bend sharply: [{a: first sample, n: samples, l: +1 left / -1 right, out: side (+1 / -1) of the outside of the bend}]
function sharpBends(thr,minSamples){
  const turn=i=>angDiff(Math.atan2(track[(i+4)%M].tx,track[(i+4)%M].tz),Math.atan2(track[(i-4+M)%M].tx,track[(i-4+M)%M].tz)), arcs=[];
  let s0=0; while(s0<M&&bendAt(s0)>thr) s0++;
  let cur=null;
  for(let k=1;k<=M;k++){ const i=(s0+k)%M, on=bendAt(i)>thr, l=turn(i)>0?1:-1;
    if(on&&cur&&cur.l===l) cur.n++; else { if(cur&&cur.n>=minSamples) arcs.push(cur); cur=on?{a:i,n:1,l,out:-l}:null; } }
  if(cur&&cur.n>=minSamples) arcs.push(cur);
  return arcs; }

// daytime windows (dark glass, not lit) on the four walls of the box (x0,z0)-(x1,z1): like wallWindows (mesh.js) but plain geometry. cols = [glass, frame?]
function dayWindows(m,rnd,x0,z0,x1,z1,yFirst,yMax,gx,gy,glass,prob,sw,sh){
  prob=prob===undefined?.85:prob; sw=sw||.5; sh=sh||.55; const cx=(x0+x1)/2, cz=(z0+z1)/2, w=gx*sw, h=gy*sh, em=m.em; m.em=false;
  for(const [nx,nz] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const half=(nx?z1-z0:x1-x0)/2, n=Math.max(1,Math.floor(half*2/gx)), wx=nx?(nx>0?x1:x0):cx, wz=nz?(nz>0?z1:z0):cz;
    for(let c=0;c<n;c++){ const off=(c-(n-1)/2)*gx, px=wx+nx*0.1-nz*off, pz=wz+nz*0.1+nx*off, g=Math.max(hAt(px,pz),hAt(px-nz*w/2,pz+nx*w/2),hAt(px+nz*w/2,pz-nx*w/2));
      for(let f=0;yFirst+f*gy<=yMax;f++){ const y=yFirst+f*gy; if(y-h/2<g+1.0||rnd()>prob) continue; wallQuad(m,px,y,pz,nx,nz,w,h,glass[(rnd()*glass.length)|0]); } } }
  m.em=em; }

// the distance from the map centre, along bearing `a`, at which a round backdrop object of base radius `rad` lies entirely outside the area the cars can reach
// (they are held to |x|,|z| <= HALF-8). Distant mountains have no colliders, so they must never reach into that square: they could be driven through.
function beyondPlayfield(a,rad){ const B=HALF-8, c=Math.cos(a), s=Math.sin(a); let r=B;
  for(;;r+=4) if(Math.hypot(Math.max(Math.abs(c*r)-B,0),Math.max(Math.abs(s*r)-B,0))>=rad+8) return r; }

// ---------- puddles on the road (as in london.js): [x,z,half length along the road,half width,heading] ----------
function makePuddles(seed,count,maxOff){ const list=[], prng=mulberry32(seed);
  for(let i=30,tries=0;i<M&&list.length<count&&tries<400;i+=1+((prng()*34)|0),tries++){ const t=track[i];
    if(bendAt(i)>.02||BRIDGES.some(B=>Math.abs(wrapS(t.s-B.s))*TL<B.L/2+14)||GATES.some(g=>Math.hypot(g.x-t.x,g.z-t.z)<28)||JUMPS.some(j=>{ const d=((t.s-j[0]+1.5)%1)-.5; return d>-.04&&d<.08; })) continue;
    const off=(prng()-.5)*2*(maxOff||HALFW*.7), len=3+prng()*4;
    list.push([t.x+t.tz*off,t.z-t.tx*off,len,2+prng()*2.4,Math.atan2(t.tx,t.tz)]); }
  return list; }
function puddleHit(list,x,z){ for(const p of list){ if(Math.abs(x-p[0])>p[2]+2||Math.abs(z-p[1])>p[2]+2) continue;
    const dx=x-p[0], dz=z-p[1], c=Math.cos(p[4]), s=Math.sin(p[4]), a=(dx*s+dz*c)/p[2], b=(dx*c-dz*s)/p[3]; if(a*a+b*b<1) return 1; } return 0; }
function drawPuddles(m,list,col){ for(const [px,pz,len,wd,yaw] of list){ const c=Math.cos(yaw), sn=Math.sin(yaw), ring=[];
    for(let k=0;k<14;k++){ const a=k/14*Math.PI*2, u=Math.cos(a)*len, v=Math.sin(a)*wd, x=px+u*sn+v*c, z=pz+u*c-v*sn; ring.push([x,hAt(x,z)+.17,z]); }
    const ce=[px,hAt(px,pz)+.17,pz]; for(let k=0;k<14;k++) m.tri(ce,ring[k],ring[(k+1)%14],col,'up'); } }

// ---------- rivers and lakes (see dirt.js for the long hand-written version) ----------
// a river along the polyline dense=[[x,z],...], resampled every 6 units, with width wFn(distance along it). Water levels come from levelRivers.
function makeRiver(name,dense,wFn){
  const cl=[0]; for(let i=1;i<dense.length;i++) cl.push(cl[i-1]+Math.hypot(dense[i][0]-dense[i-1][0],dense[i][1]-dense[i-1][1]));
  const total=cl[cl.length-1], n=Math.max(2,Math.round(total/6)), p=[]; let j=0;
  for(let k=0;k<=n;k++){ const d=total*k/n; while(j<cl.length-2&&cl[j+1]<d) j++; const t=(d-cl[j])/((cl[j+1]-cl[j])||1);
    p.push({x:lerp(dense[j][0],dense[j+1][0],t),z:lerp(dense[j][1],dense[j+1][1],t),u:d,w:wFn(d),level:0}); }
  return {name,p}; }
// a round lake: a one-point "river" of radius r (drawn as a disc by buildWaterMesh); the level is fixed
function makeLake(name,x,z,r,level){ return {name,lake:true,p:[{x,z,u:0,w:r,level},{x:x+.01,z,u:.01,w:r,level}]}; }
// water levels: after findBridges, each river sits `drop` below the deck at its bridges and always flows downhill; a river without bridges
// starts at `top` and falls. Also sets B.level on every bridge.
function levelRivers(drop,top){
  const lvl=(cons,u)=>{ if(u<=cons[0][0]) return cons[0][1]+0.03*(cons[0][0]-u);
    for(let i=0;i<cons.length-1;i++) if(u<=cons[i+1][0]){ const t=(u-cons[i][0])/(cons[i+1][0]-cons[i][0]); return lerp(cons[i][1],cons[i+1][1],(1-Math.cos(Math.PI*t))/2); }
    const L=cons[cons.length-1]; return L[1]-0.02*(u-L[0]); };
  for(const r of RIVERS){ if(r.lake) continue; const mc=[]; let prev=1e9;
    for(const B of BRIDGES.filter(B=>B.river===r).sort((a,b)=>a.uc-b.uc)){ const l=Math.min(B.deck-drop,prev-2); mc.push([B.uc,l]); prev=l; }
    if(!mc.length) mc.push([0,top]);
    for(const q of r.p) q.level=lvl(mc,q.u);
    for(const B of BRIDGES) if(B.river===r) B.level=lvl(mc,B.uc); } }
// the terrain around the rivers and lakes: bed, banks and a flood plain blending back into h over `reach` units. Use inside a level's shape();
// h = the height so far, hRoad = the road height to blend back to near the road. Fills RN (distance to water / width) and SPAN (under a bridge).
function riverShape(x,z,h,d,s,k,hRoad,reach){
  let rn=1e9;
  for(const r of RIVERS){ const q=riverQuery(r,x,z), ground=q.level+0.5+0.05*Math.max(0,q.d-q.w)-2.4*(1-smooth(q.w*0.2,q.w,q.d));
    h=lerp(h,ground,1-smooth(q.w*1.6,q.w*1.6+(reach||100),q.d)); rn=Math.min(rn,q.d/q.w); }
  RN[k]=rn; const span=onBridgeSpan(d,s); SPAN[k]=span?1:0;
  return span?h:lerp(h,hRoad,1-smooth(HALFW,HALFW+14,d)); }
// distance from (x,z) to the nearest river or lake edge (negative inside the water); cheap enough for scatter loops
function waterDist(x,z){ let b=1e9; for(const r of RIVERS){ const q=riverQuery(r,x,z); b=Math.min(b,q.d-q.w); } return b; }

// ---------- painted lettering (adverts, signs): a 5x7 pixel font built from quads, one per run of lit pixels ----------
const PIXEL_FONT={A:'0E11111F111111',B:'1E11111E11111E',C:'0E11101010110E',D:'1E11111111111E',E:'1F10101E10101F',F:'1F10101E101010',G:'0E11101711110F',H:'1111111F111111',I:'0E04040404040E',J:'0702020202120C',K:'11121418141211',L:'1010101010101F',M:'111B1515111111',N:'11191513111111',O:'0E11111111110E',P:'1E11111E101010',Q:'0E11111115120D',R:'1E11111E141211',S:'0F10100E01011E',T:'1F040404040404',U:'1111111111110E',V:'11111111110A04',W:'11111115151B11',X:'11110A040A1111',Y:'11110A04040404',Z:'1F01020408101F',
  0:'0E11131519110E',1:'040C040404040E',2:'0E11010204081F',3:'1F02040201110E',4:'02060A121F0202',5:'1F101E0101110E',6:'0608101E11110E',7:'1F010204080808',8:'0E11110E11110E',9:'0E11110F01020C','-':'0000001F000000','!':'04040404040004','.':'00000000000404'};
// lettering in the plane through the centre c, seen by a viewer looking along f: u = the reader's right, v = the reader's up (3-vectors); px = pixel size
function pixelText(m,str,c,u,v,px,col,away){
  const adv=6, W=str.length*adv-1, X0=-W/2;
  for(let i=0;i<str.length;i++){ const g=PIXEL_FONT[str[i]]; if(!g) continue;
    for(let r=0;r<7;r++){ const bits=parseInt(g.substr(r*2,2),16); let b=0;
      while(b<5){ if(!(bits&(16>>b))){ b++; continue; } let e=b; while(e<5&&(bits&(16>>e))) e++;
        const x0=(X0+i*adv+b)*px, x1=(X0+i*adv+e)*px, y0=(3.5-r-1)*px, y1=(3.5-r)*px, P=(a,d)=>[c[0]+u[0]*a+v[0]*d,c[1]+u[1]*a+v[1]*d,c[2]+u[2]*a+v[2]*d];
        m.quad(P(x0,y0),P(x1,y0),P(x1,y1),P(x0,y1),col,away); b=e; } } } }
// lettering on a wall: centre (x,y,z), read by someone looking along (fx,fz)
function wallText(m,str,x,y,z,fx,fz,px,col){ pixelText(m,str,[x,y,z],[-fz,0,fx],[0,1,0],px,col,[x+fx,y,z+fz]); }

// a tapering square-section strut from point a to point b (radius r0 at a, r1 at b): limbs, horns, necks, tails
function strut(m,a,b,r0,r1,col){
  const dx=b[0]-a[0], dy=b[1]-a[1], dz=b[2]-a[2], l=Math.hypot(dx,dy,dz)||1, ax=dx/l, ay=dy/l, az=dz/l;
  let px,py,pz; if(Math.abs(ay)<.9){ px=-az; py=0; pz=ax; } else { px=1; py=0; pz=0; }
  const pl=Math.hypot(px,py,pz); px/=pl; py/=pl; pz/=pl;
  const qx=ay*pz-az*py, qy=az*px-ax*pz, qz=ax*py-ay*px, S=[[1,1],[-1,1],[-1,-1],[1,-1]], o=[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2];
  const A=S.map(([u,v])=>[a[0]+(px*u+qx*v)*r0,a[1]+(py*u+qy*v)*r0,a[2]+(pz*u+qz*v)*r0]), B=S.map(([u,v])=>[b[0]+(px*u+qx*v)*r1,b[1]+(py*u+qy*v)*r1,b[2]+(pz*u+qz*v)*r1]);
  for(let i=0;i<4;i++){ const j=(i+1)%4; m.quad(A[i],A[j],B[j],B[i],i&1?col:[col[0]*.9,col[1]*.9,col[2]*.9],o); }
  m.quad(A[0],A[1],A[2],A[3],col,o); if(r1>.05) m.quad(B[0],B[1],B[2],B[3],col,o); }
