'use strict';
// Mesh builder and the generic terrain / water / decor mesh builders (levels supply colours and scenery).
// ---------- mesh builder ----------
class Mesh{
  constructor(){ this.p=[]; this.n=[]; this.c=[]; this.em=false; }   // em: emissive (unlit) geometry, e.g. windows
  tri(a,b,c,col,away){
    const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
    let nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx;
    const l=Math.hypot(nx,ny,nz)||1; nx/=l; ny/=l; nz/=l;
    let flip;
    if(away==='up') flip=ny<0;
    else { const mx=(a[0]+b[0]+c[0])/3-away[0], my=(a[1]+b[1]+c[1])/3-away[1], mz=(a[2]+b[2]+c[2])/3-away[2]; flip=nx*mx+ny*my+nz*mz<0; }
    if(flip){nx=-nx;ny=-ny;nz=-nz;}
    this.p.push(a[0],a[1],a[2],b[0],b[1],b[2],c[0],c[1],c[2]);
    for(let i=0;i<3;i++){ if(this.em) this.n.push(0,0,0); else this.n.push(nx,ny,nz); this.c.push(col[0],col[1],col[2]); }
  }
  quad(a,b,c,d,col,away){ this.tri(a,b,c,col,away); this.tri(a,c,d,col,away); }
  box(cx,cy,cz,sx,sy,sz,col){
    const x0=cx-sx/2,x1=cx+sx/2,y0=cy-sy/2,y1=cy+sy/2,z0=cz-sz/2,z1=cz+sz/2, o=[cx,cy,cz];
    const v=[[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]];
    const f=[[0,1,2,3],[5,4,7,6],[4,0,3,7],[1,5,6,2],[3,2,6,7],[4,5,1,0]];
    for(const q of f) this.quad(v[q[0]],v[q[1]],v[q[2]],v[q[3]],col,o);
  }
  // slab from (ax,az) to (bx,bz), hw = half thickness perpendicular to that direction, from y0 to y1
  prism(ax,az,bx,bz,hw,y0,y1,col){
    const dx=bx-ax, dz=bz-az, l=Math.hypot(dx,dz)||1, nx=-dz/l*hw, nz=dx/l*hw, o=[(ax+bx)/2,(y0+y1)/2,(az+bz)/2];
    const v=[[ax+nx,y0,az+nz],[ax-nx,y0,az-nz],[bx-nx,y0,bz-nz],[bx+nx,y0,bz+nz],[ax+nx,y1,az+nz],[ax-nx,y1,az-nz],[bx-nx,y1,bz-nz],[bx+nx,y1,bz+nz]];
    for(const q of [[0,1,2,3],[7,6,5,4],[0,4,5,1],[3,2,6,7],[0,3,7,4],[1,5,6,2]]) this.quad(v[q[0]],v[q[1]],v[q[2]],v[q[3]],col,o);
  }
  cone(cx,cy,cz,r,h,seg,col){
    const ap=[cx,cy+h,cz], ce=[cx,cy,cz], o=[cx,cy+h*0.3,cz], ring=[];
    for(let i=0;i<seg;i++){ const a=i/seg*Math.PI*2; ring.push([cx+Math.cos(a)*r,cy,cz+Math.sin(a)*r]); }
    for(let i=0;i<seg;i++){ const p=ring[i], q=ring[(i+1)%seg]; this.tri(ap,p,q,col,o); this.tri(ce,p,q,col,o); }
  }
  cylX(cx,cy,cz,r,w,seg,col,hub){
    const o=[cx,cy,cz], a0=cx-w/2, a1=cx+w/2, ring=[];
    for(let i=0;i<seg;i++){ const a=i/seg*Math.PI*2; ring.push([cy+Math.cos(a)*r, cz+Math.sin(a)*r]); }
    for(let i=0;i<seg;i++){ const p=ring[i], q=ring[(i+1)%seg];
      this.quad([a0,p[0],p[1]],[a1,p[0],p[1]],[a1,q[0],q[1]],[a0,q[0],q[1]], i&1?col:[col[0]*.8,col[1]*.8,col[2]*.8], o);
      this.tri([a0,cy,cz],[a0,p[0],p[1]],[a0,q[0],q[1]],hub,o);
      this.tri([a1,cy,cz],[a1,p[0],p[1]],[a1,q[0],q[1]],hub,o); }
  }
  rock(cx,cy,cz,r,col,rnd){
    const top=[cx+(rnd()-.5)*r*.3,cy+r*.75,cz+(rnd()-.5)*r*.3], bot=[cx,cy-r*.3,cz], o=[cx,cy+r*.2,cz], ring=[];
    for(let i=0;i<7;i++){ const a=i/7*Math.PI*2+rnd()*.4, rr=r*(.7+rnd()*.4); ring.push([cx+Math.cos(a)*rr,cy+r*(.1+rnd()*.2),cz+Math.sin(a)*rr]); }
    for(let i=0;i<7;i++){ const p=ring[i], q=ring[(i+1)%7], sh=.85+rnd()*.25;
      const cc=[col[0]*sh,col[1]*sh,col[2]*sh]; this.tri(top,p,q,cc,o); this.tri(bot,p,q,cc,o); }
  }
  upload(gl){
    const mk=(arr)=>{ const b=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,b); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(arr),gl.STATIC_DRAW); return b; };
    return {pb:mk(this.p), nb:mk(this.n), cb:mk(this.c), count:this.p.length/3};
  }
}

// ---------- world meshes (generic; the level supplies colours and scenery) ----------
function buildTerrainMesh(){
  const m=new Mesh(), W=N+1, rnd=mulberry32(77);
  const V=(i,j)=>[(i-N/2)*CELL, H[j*W+i], (j-N/2)*CELL];
  const faceColor=(ids,a,b,c)=>{
    const d=(DIST[ids[0]]+DIST[ids[1]]+DIST[ids[2]])/3, s=SPAR[ids[0]];
    const cx=(a[0]+b[0]+c[0])/3, cz=(a[2]+b[2]+c[2])/3, hy=(a[1]+b[1]+c[1])/3;
    const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];   // steepness of this face
    let ny=uz*vx-ux*vz; const nl=Math.hypot(uy*vz-uz*vy,ny,ux*vy-uy*vx)||1; ny=Math.abs(ny)/nl;
    const sh=0.9+rnd()*0.2;
    const col=LV.color({d,s,cx,cz,hy,ny,rn:(RN[ids[0]]+RN[ids[1]]+RN[ids[2]])/3,span:SPAN[ids[0]]|SPAN[ids[1]]|SPAN[ids[2]],rnd});
    return [col[0]*sh,col[1]*sh,col[2]*sh];
  };
  // optional LV.clipTerrain(x,z): null inside the level's outline, else the nearest point [x,z] on it. Triangles wholly outside are dropped and the rest end
  // exactly on the outline, so a level can have a sharp-edged slab of ground of any shape (the carrier's flight deck), finer than the grid
  const clip=LV.clipTerrain, cut=v=>{ const q=clip(v[0],v[2]); return q?[q[0],v[1],q[1]]:v; }, tri=(ids,a,b,c)=>{
    if(clip){ if(clip(a[0],a[2])&&clip(b[0],b[2])&&clip(c[0],c[2])) return; a=cut(a); b=cut(b); c=cut(c); }
    m.tri(a,b,c,faceColor(ids,a,b,c),'up'); };
  for(let j=0;j<N;j++) for(let i=0;i<N;i++){
    const a=V(i,j), b=V(i+1,j), c=V(i+1,j+1), d=V(i,j+1);
    const ia=j*W+i, ib=j*W+i+1, ic=(j+1)*W+i+1, id=(j+1)*W+i;
    tri([ia,ib,ic],a,b,c);
    tri([ia,ic,id],a,c,d);
  }
  return m;
}
// The ground beyond the level (EXPAND_TERRAIN_AROUND_LEVEL). Two parts, both built once per level:
// - buildSkirtMesh: square rings round the map, each further out and coarser than the last, positions only. The first ring meets every vertex of the map's edge, so no
//   cracks. Each ring takes the heights of the edge, averaged over more of it the further out, so hills carry on for a while and then settle into a plain. Land and
//   seabed (below LV.sea) are averaged apart: a mix of the two would lift the seabed out of the water.
// - buildSkirtTexture: every triangle of the terrain, already lit, as one texel. The skirt shader (gl.js) rebuilds the 6 m triangle grid per pixel and looks its
//   colours up here, so the ground outside is made of the level's own triangles, firelight included, at no cost in geometry.
const SKIRT_RINGS=[[0,1,0],[40,1,3],[110,2,8],[240,4,20],[480,8,50],[1000,16,120],[2400,32,250],[6000,64,352],[29500,64,352]];   // [metres past the edge, one vertex in every n of the edge, half width of the average]
const SKIRT_BAND=24;                                           // cells next to the edge that the ground outside is taken from
const SKIRT_PATCH=[32,6,44];                                   // past the first band: patch size, roughness of its outline and largest offset, in cells
const SKIRT_INNER=66;                                          // past the first band, a level with no sea reads the middle of the map, this many cells from the centre: the rim is a slope, and copying its shading onto flat ground draws stripes. (A sea level keeps the band: its middle is the island, not the seabed)
function buildSkirtMesh(){
  const P=4*N, W=N+1, edge=k=>{ const s=Math.floor(k/N), t=k-s*N; return s===0?[t,0]:s===1?[N,t]:s===2?[N-t,N]:[0,N-t]; };   // k round the map: grid i, j
  const Y=new Float64Array(P), pos=[]; for(let k=0;k<P;k++){ const [i,j]=edge(k); Y[k]=H[j*W+i]; }
  const wet=k=>LV.sea!==undefined&&Y[k]<LV.sea, sums=(A,cls)=>{ const s=new Float64Array(3*P+1); for(let k=0;k<3*P;k++) s[k+1]=s[k]+(wet(k%P)===cls?A[k%P]:0); return s; };
  const ONE=new Float64Array(P).fill(1), SUM=[false,true].map(cls=>({n:sums(ONE,cls),y:sums(Y,cls)}));
  const span=(s,k,w)=>s[P+k+w+1]-s[P+k-w], avg=(k,w)=>{ const S=SUM[wet(k)?1:0]; return span(S.y,k,w)/span(S.n,k,w); };   // (P to 3P in the running sums: the average wraps round the map; w stays below P)
  const place=(r,k)=>{ const [i,j]=edge(k%P), out=(1+SKIRT_RINGS[r][0]/HALF)*CELL; return [(i-N/2)*out,avg(k%P,SKIRT_RINGS[r][2]),(j-N/2)*out]; };
  for(let r=1;r<SKIRT_RINGS.length;r++){ const s0=SKIRT_RINGS[r-1][1], s1=SKIRT_RINGS[r][1];
    for(let k=0;k<P;k+=s1){ const far0=place(r,k), far1=place(r,k+s1);
      for(let t=k;t<k+s1;t+=s0) pos.push(...far0,...place(r-1,t+s0),...place(r-1,t));   // a fan from the coarser ring onto the finer one
      pos.push(...far0,...far1,...place(r-1,k+s1)); } }
  return new Float32Array(pos);
}
// the terrain mesh m after any baking, lit the way the main shader lights it: 2N x N texels, a cell's two triangles side by side
function buildSkirtTexture(m){
  const T=THEME, d=new Uint8Array(4*2*N*N), tn=2*N*N, W=N+1, rnd=mulberry32(99), road=new Uint8Array(tn);
  for(let t=0;t<tn;t++){ const v=t*9, nx=m.n[v],ny=m.n[v+1],nz=m.n[v+2], l=Math.max(nx*LIGHT[0]+ny*LIGHT[1]+nz*LIGHT[2],0), j=Math.floor(t/(2*N)), i=(t>>1)%N;
    for(let q=0;q<3;q++) d[t*4+q]=clamp(m.c[v+q]*(T.amb[q]+T.hemi[q]*(.5+.5*ny)+T.sun[q]*l),0,1)*255+.5;
    d[t*4+3]=255; if(Math.min(DIST[j*W+i],DIST[j*W+i+1],DIST[(j+1)*W+i],DIST[(j+1)*W+i+1])<HALFW+9) road[t]=1; }
  for(const r of RIVERS) for(const q of r.p){ const c=Math.ceil((q.w+14)/CELL), ci=Math.round(q.x/CELL+N/2), cj=Math.round(q.z/CELL+N/2);   // nor must a river bed
    for(let j=Math.max(0,cj-c);j<=Math.min(N-1,cj+c);j++) for(let i=Math.max(0,ci-c);i<=Math.min(N-1,ci+c);i++) road[2*(j*N+i)]=road[2*(j*N+i)+1]=1; }
  for(let t=0;t<tn;t++) if(road[t]) for(let a=0;a<400;a++){ const r=4+a*.2, j=clamp(Math.floor(t/(2*N))+Math.round((rnd()-.5)*r),0,N-1), i=clamp(((t>>1)%N)+Math.round((rnd()-.5)*r),0,N-1), o=2*(j*N+i)+(rnd()<.5?1:0);
    if(!road[o]){ for(let q=0;q<3;q++) d[t*4+q]=d[o*4+q]; break; } }   // a road by the edge must not be copied outwards: ground from nearby instead
  return d;
}
// Water never leaves the map: every triangle of a Mesh is cut to the square |x|,|z| <= HALF. Whatever lies beyond comes from buildSkirtWater.
function clipToMap(src){
  const m=new Mesh(), cut=(P,ax,sg)=>{ const out=[]; for(let i=0;i<P.length;i++){ const a=P[i], b=P[(i+1)%P.length], da=HALF-sg*a[ax], db=HALF-sg*b[ax];
      if(da>=0) out.push(a); if((da>=0)!==(db>=0)){ const t=da/(da-db); out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]); } } return out; };
  for(let v=0;v<src.p.length;v+=9){ const p=src.p, n=src.n.slice(v,v+3), c=src.c.slice(v,v+3); let P=[0,3,6].map(k=>[p[v+k],p[v+k+1],p[v+k+2]]);
    for(const [ax,sg] of [[0,1],[0,-1],[2,1],[2,-1]]) if(P.length) P=cut(P,ax,sg);
    for(let i=1;i+1<P.length;i++) for(const q of [P[0],P[i],P[i+1]]){ m.p.push(q[0],q[1],q[2]); m.n.push(n[0],n[1],n[2]); m.c.push(c[0],c[1],c[2]); } }
  return m;
}
// The sea beyond the map (expansion only): water at sea level on every skirt triangle that reaches below it, so the shore is where the skirt's ground crosses the water. A level with no skirt gets a plain sheet out to the same distance.
// Colour: LV.seaCol, or LV.seaAt(x,z) at the nearest point of the map's edge, so shallows run on alongside a coast that leaves the map.
function buildSkirtWater(m,pos){
  if(LV.sea===undefined||!LV.seaCol) return; const y=LV.sea, c=LV.seaCol, at=(x,z)=>LV.seaAt?LV.seaAt(clamp(x,-HALF,HALF),clamp(z,-HALF,HALF)):c;
  const put=(A,B,C)=>{ const col=[A,B,C].map(v=>at(v[0],v[2])), d=(p,q)=>Math.hypot(p[0]-q[0],p[2]-q[2]), ab=d(A,B), bc=d(B,C), ca=d(C,A);   // a triangle across a colour band is halved down to the size of the map's water squares, or the band's outline zigzags over the big outer triangles
    if(col[0]+''===col[1]+''&&col[1]+''===col[2]+''||Math.max(ab,bc,ca)<=24){ m.tri(A,B,C,at((A[0]+B[0]+C[0])/3,(A[2]+B[2]+C[2])/3),'up'); return; }
    const [p,q,r]=ab>=bc&&ab>=ca?[A,B,C]:bc>=ca?[B,C,A]:[C,A,B], mid=[(p[0]+q[0])/2,y,(p[2]+q[2])/2]; put(p,mid,r); put(mid,q,r); };
  if(pos){ for(let i=0;i<pos.length;i+=9) if(Math.min(pos[i+1],pos[i+4],pos[i+7])<y) put([pos[i],y,pos[i+2]],[pos[i+3],y,pos[i+5]],[pos[i+6],y,pos[i+8]]); }
  else { const E=HALF, F=HALF+SKIRT_RINGS[SKIRT_RINGS.length-1][0]; for(const [x0,z0,x1,z1] of [[-F,-F,-E,F],[E,-F,F,F],[-E,-F,E,-E],[-E,E,E,F]]) m.quad([x0,y,z0],[x1,y,z0],[x1,y,z1],[x0,y,z1],c,'up'); }
  if(LV.oceanFar) LV.oceanFar(m);
}
function buildWaterMesh(skirt){
  const m=new Mesh();
  for(const r of RIVERS){ if(r.lava) continue; const P=r.p;               // (lava flows are built by the level, unlit, in the decor mesh)
    if(r.lake){ const q=P[0], seg=32, W=THEME.water||[[.19,.47,.83]], ring=[];       // a lake is a round one-point "river": drawn as a disc
      for(let i=0;i<seg;i++){ const a=i/seg*Math.PI*2; ring.push([q.x+Math.cos(a)*q.w*0.97,q.level,q.z+Math.sin(a)*q.w*0.97]); }
      for(let i=0;i<seg;i++) m.tri([q.x,q.level,q.z],ring[i],ring[(i+1)%seg],W[(i>>1)&1&&W.length>1?1:0],'up');
      continue; }
    const edge=(i,sg)=>{ const a=P[Math.max(0,i-1)], b=P[Math.min(P.length-1,i+1)], dx=b.x-a.x, dz=b.z-a.z, l=Math.hypot(dx,dz)||1;
      return [P[i].x+(-dz/l)*sg*P[i].w*0.95, P[i].level, P[i].z+(dx/l)*sg*P[i].w*0.95]; };
    for(let i=0;i<P.length-1;i++){
      const W=THEME.water||[[.19,.47,.83],[.14,.40,.76]], col=W[(i>>1)&1];     // (a level can tint its rivers: Titan's are liquid methane)
      m.quad(edge(i,-1),edge(i,1),edge(i+1,1),edge(i+1,-1),col,'up'); } }
  if(LV.ocean) LV.ocean(m);
  const w=clipToMap(m);
  if(EXPAND_TERRAIN_AROUND_LEVEL) buildSkirtWater(w,skirt);
  return w;
}
// The start/finish arch look - red posts, black & white checkered beam - used for the finish line and every checkpoint.
// Posts stand on the ground on each side of the road; the beam sits level above the higher of the two. (Glows at night.)
function addArch(m,g){
  const lx=g.tz, lz=-g.tx, px=HALFW+1.2, span=TW+2.4;
  const posts=[1,-1].map(sg=>{ const x=g.x+lx*px*sg, z=g.z+lz*px*sg; return {x,z,h:hAt(x,z)}; });
  const base=Math.min(posts[0].h,posts[1].h)-1, yb=Math.max(posts[0].h,posts[1].h,g.y);
  m.em=!!THEME.night;
  for(const p of posts){
    m.prism(p.x-g.tx*0.7,p.z-g.tz*0.7,p.x+g.tx*0.7,p.z+g.tz*0.7,0.7,base,yb+11,[.85,.1,.1]);
    colliders.push([p.x,p.z,1.2]);
  }
  for(let i=0;i<12;i++){
    const o0=(i-6)*span/12, o1=(i-5)*span/12;
    const ax=g.x+lx*o0, az=g.z+lz*o0, bx=g.x+lx*o1, bz=g.z+lz*o1;
    m.prism(ax,az,bx,bz,0.9,yb+10.2,yb+11.4,i&1?[.95,.95,.95]:[.1,.1,.1]);   // deeper than the posts (half width .7), so no face of the beam is level with theirs
    m.prism(ax,az,bx,bz,0.9,yb+9.0,yb+10.2,i&1?[.1,.1,.1]:[.95,.95,.95]);
  }
  m.em=false;
}
// The height of every collision shape (colliders, walls, rects), measured from the scenery built over it: s.y0 / s.y1 are the lowest and
// highest point of the given meshes inside the shape's footprint, grown by FIT_PAD. stepCar lets a car pass over a shape it is above,
// and under one whose bottom is higher than the car (CAR_TOP: wings, overhangs). A shape with nothing drawn over it keeps no height and
// stays solid at every height, as all shapes used to be. A shape with s.fix keeps the y0 / y1 it was given (wallRun's y0,y1). Called by loadLevel once
// the scenery is built (10-150 ms in Chrome on the densest levels).
const FIT_PAD=0.5, FIT_CELL=8;
function fitCollisionHeights(meshes){
  const n=Math.ceil(2*HALF/FIT_CELL)+1, ci=v=>Math.max(0,Math.min(n-1,Math.floor((v+HALF)/FIT_CELL)));
  // the footprints: convex polygons as half planes a*x+b*z<=c, with their bounding boxes
  const S=[];
  for(const c of colliders){ if(c.fix) continue; const R=c[2]+FIT_PAD, H=[];
    for(let k=0;k<12;k++){ const a=k/12*Math.PI*2, ca=Math.cos(a), sa=Math.sin(a); H.push([ca,sa,ca*c[0]+sa*c[1]+R/Math.cos(Math.PI/12)]); }   // a 12-gon round the circle
    S.push([c,H,c[0]-R*1.04,c[1]-R*1.04,c[0]+R*1.04,c[1]+R*1.04]); }
  for(const r of rects){ if(r.fix) continue; const hx=r[2]+FIT_PAD, hz=r[3]+FIT_PAD;
    S.push([r,[[1,0,r[0]+hx],[-1,0,-r[0]+hx],[0,1,r[1]+hz],[0,-1,-r[1]+hz]],r[0]-hx,r[1]-hz,r[0]+hx,r[1]+hz]); }
  for(const w of walls){ if(w.fix) continue; const R=w[4]+FIT_PAD, ex=w[2]-w[0], ez=w[3]-w[1], l=Math.hypot(ex,ez)||1, dx=ex/l, dz=ez/l, nx=-dz, nz=dx;
    S.push([w,[[nx,nz,nx*w[0]+nz*w[1]+R],[-nx,-nz,-(nx*w[0]+nz*w[1])+R],[dx,dz,dx*w[2]+dz*w[3]+R],[-dx,-dz,-(dx*w[0]+dz*w[1])+R]],
      Math.min(w[0],w[2])-R,Math.min(w[1],w[3])-R,Math.max(w[0],w[2])+R,Math.max(w[1],w[3])+R]); }
  const used=new Uint8Array(n*n);
  for(const e of S) for(let i=ci(e[2]);i<=ci(e[4]);i++) for(let j=ci(e[3]);j<=ci(e[5]);j++) used[j*n+i]=1;
  // the triangles, each listed in the cells it touches (only cells some footprint uses)
  const cells=new Array(n*n), TP=[], TT=[], TB=[];
  for(const m of meshes){ const p=m.p;
    for(let t=0;t<p.length;t+=9){
      const x0=Math.min(p[t],p[t+3],p[t+6]), x1=Math.max(p[t],p[t+3],p[t+6]), z0=Math.min(p[t+2],p[t+5],p[t+8]), z1=Math.max(p[t+2],p[t+5],p[t+8]);
      if(x1<-HALF||z1<-HALF||x0>HALF||z0>HALF) continue;
      const i0=ci(x0), i1=ci(x1), j0=ci(z0), j1=ci(z1); let k=-1;
      for(let i=i0;i<=i1;i++) for(let j=j0;j<=j1;j++){ const c=j*n+i; if(!used[c]) continue; if(k<0){ k=TP.length; TP.push(p); TT.push(t); TB.push(x0,z0,x1,z1); } (cells[c]||(cells[c]=[])).push(k); }
    } }
  const stamp=new Int32Array(TP.length).fill(-1);
  // the lowest and highest y of the part of triangle k inside the footprint H
  const clipY=(k,H,out)=>{ const p=TP[k], t=TT[k]; let all=true;
    for(const [a,b,c] of H) if(a*p[t]+b*p[t+2]>c||a*p[t+3]+b*p[t+5]>c||a*p[t+6]+b*p[t+8]>c){ all=false; break; }
    if(all){ for(let v=1;v<9;v+=3){ const y=p[t+v]; if(y<out[0]) out[0]=y; if(y>out[1]) out[1]=y; } return; }       // (wholly inside)
    let P=[[p[t],p[t+1],p[t+2]],[p[t+3],p[t+4],p[t+5]],[p[t+6],p[t+7],p[t+8]]];
    for(const [a,b,c] of H){ const Q=[];
      for(let i=0;i<P.length;i++){ const u=P[i], v=P[(i+1)%P.length], du=a*u[0]+b*u[2]-c, dv=a*v[0]+b*v[2]-c;
        if(du<=0) Q.push(u); if((du<0)!==(dv<0)&&du!==dv){ const s=du/(du-dv); Q.push([u[0]+(v[0]-u[0])*s,u[1]+(v[1]-u[1])*s,u[2]+(v[2]-u[2])*s]); } }
      P=Q; if(!P.length) return; }
    for(const q of P){ if(q[1]<out[0]) out[0]=q[1]; if(q[1]>out[1]) out[1]=q[1]; } };
  S.forEach(([s,H,bx0,bz0,bx1,bz1],id)=>{ const out=[1e9,-1e9];
    for(let i=ci(bx0);i<=ci(bx1);i++) for(let j=ci(bz0);j<=ci(bz1);j++){ const L=cells[j*n+i]; if(L) for(const k of L){
      if(stamp[k]===id) continue; stamp[k]=id; const q=k*4; if(TB[q]>bx1||TB[q+2]<bx0||TB[q+1]>bz1||TB[q+3]<bz0) continue; clipY(k,H,out); } }
    if(out[1]>=out[0]){ s.y0=out[0]; s.y1=out[1]; } else { delete s.y0; delete s.y1; } });
}
// is a car at height y (its wheels) clear of shape s, above it or wholly under it?
const CAR_TOP=2.25;
function clearOf(s,y){ return s.y1!==undefined&&(y>s.y1-0.25||y+CAR_TOP<s.y0); }
// debug (SHOW_COLLIDERS_IN_GAME): every collision shape as an unlit solid from its y0 to its y1, coloured by kind (see config.js)
const SHOW_COLLIDERS=DEBUG_MODE&&SHOW_COLLIDERS_IN_GAME;
function buildColliderMesh(){
  const m=new Mesh(); m.em=true;
  const span=(s,x,z)=>s.y1!==undefined?[s.y0,s.y1,s.fix?[1,1,.2]:null]:[hAt(x,z)-.5,hAt(x,z)+40,[1,.12,.1]];
  const cyl=(x,z,r,y0,y1,col,seg)=>{ for(let k=0;k<seg;k++){ const a=k/seg*6.283, b=(k+1)/seg*6.283, p=[x+Math.cos(a)*r,z+Math.sin(a)*r], q=[x+Math.cos(b)*r,z+Math.sin(b)*r];
    m.quad([p[0],y0,p[1]],[q[0],y0,q[1]],[q[0],y1,q[1]],[p[0],y1,p[1]],col,[x,(y0+y1)/2,z]); m.tri([x,y1,z],[p[0],y1,p[1]],[q[0],y1,q[1]],col,'up'); } };
  for(const c of colliders){ const [y0,y1,k]=span(c,c[0],c[1]); cyl(c[0],c[1],c[2],y0,y1,k||[1,.55,.1],c[2]>6?20:10); }
  for(const w of walls){ let [y0,y1,k]=span(w,(w[0]+w[2])/2,(w[1]+w[3])/2); if(w[7]!==undefined){ y0=Math.min(hAt(w[0],w[1]),hAt(w[2],w[3]))-.5; y1=Math.max(w[7],w[8]); }
    m.prism(w[0],w[1],w[2],w[3],w[4],y0,y1,k||[.1,.9,1]); }
  for(const r of rects){ const [y0,y1,k]=span(r,r[0],r[1]); m.box(r[0],(y0+y1)/2,r[1],r[2]*2,y1-y0,r[3]*2,k||[1,.2,.8]); }
  return m; }
// one of a car's collision circles, as tall as a car (drawn at each CAR_DISCS offset)
function buildCarDiscMesh(){ const m=new Mesh(), seg=12; m.em=true; for(let k=0;k<seg;k++){ const a=k/seg*6.283, b=(k+1)/seg*6.283, p=[Math.cos(a)*CAR_R,Math.sin(a)*CAR_R], q=[Math.cos(b)*CAR_R,Math.sin(b)*CAR_R];
  m.quad([p[0],0,p[1]],[q[0],0,q[1]],[q[0],CAR_TOP,q[1]],[p[0],CAR_TOP,p[1]],[.2,1,.3],[0,1,0]); m.tri([0,CAR_TOP,0],[p[0],CAR_TOP,p[1]],[q[0],CAR_TOP,q[1]],[.2,1,.3],'up'); } return m; }
function buildDecorMesh(){
  const m=new Mesh(), rnd=mulberry32(4242+LV.seed);
  LV.decor(m,rnd);
  for(const g of GATES) addArch(m,g);
  return m;
}
function buildMarksMesh(){ const m=new Mesh(); if(LV.marks) LV.marks(m); return m; }
function buildGlowMesh(){ const m=new Mesh(); m.em=true; if(LV.glow) LV.glow(m); return m; }
// a flat disc draped over the terrain (light pools)
function groundDisc(m,x,z,r,col,seg,lift){
  const c=[x,hAt(x,z)+lift,z], ring=[];
  for(let i=0;i<seg;i++){ const a=i/seg*Math.PI*2, px=x+Math.cos(a)*r, pz=z+Math.sin(a)*r; ring.push([px,hAt(px,pz)+lift,pz]); }
  for(let i=0;i<seg;i++) m.tri(c,ring[i],ring[(i+1)%seg],col,'up');
}
// a lit window (or neon strip) on a wall, centred at p, facing (nx,nz)
function wallQuad(m,px,py,pz,nx,nz,w,h,col){
  const tx=-nz, tz=nx, a=[px-tx*w/2,py-h/2,pz-tz*w/2], b=[px+tx*w/2,py-h/2,pz+tz*w/2], c=[px+tx*w/2,py+h/2,pz+tz*w/2], d=[px-tx*w/2,py+h/2,pz-tz*w/2];
  m.quad(a,b,c,d,col,[0,0,0]);
}
// Lit windows on the four walls of the box (x0,z0)-(x1,z1): columns gx apart and rows gy apart, the first row centred at yFirst and the
// last at or below yMax; each is present with probability prob. A window is only placed if its bottom edge is clearly above the ground
// at its own spot, so nothing is ever generated at or below ground level on a sloping site. sw/sh: window size as a fraction of the cell.
function wallWindows(m,rnd,x0,z0,x1,z1,yFirst,yMax,winCols,prob,gx,gy,sw,sh){
  sw=sw||0.5; sh=sh||0.55; const cx=(x0+x1)/2, cz=(z0+z1)/2, w=gx*sw, h=gy*sh;
  m.em=true;
  for(const [nx,nz] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const half=(nx?z1-z0:x1-x0)/2, n=Math.max(1,Math.floor(half*2/gx)), wx=nx?(nx>0?x1:x0):cx, wz=nz?(nz>0?z1:z0):cz;
    for(let c=0;c<n;c++){
      const off=(c-(n-1)/2)*gx, px=wx+nx*0.12-nz*off, pz=wz+nz*0.12+nx*off;
      const g=Math.max(hAt(px,pz),hAt(px-nz*w/2,pz+nx*w/2),hAt(px+nz*w/2,pz-nx*w/2));
      for(let f=0; yFirst+f*gy<=yMax; f++){
        const y=yFirst+f*gy; if(y-h/2<g+1.0) continue;
        if(rnd()>prob) continue;
        wallQuad(m,px,y,pz,nx,nz,w,h,rnd()<0.85?winCols[0]:winCols[(rnd()*winCols.length)|0]);
      }
    }
  }
  m.em=false;
}
// a plain box building with lit windows on its four walls
function windowedBox(m,rnd,x0,z0,x1,z1,base,top,col,winCols,prob,gx,gy){
  m.box((x0+x1)/2,(base+top)/2,(z0+z1)/2,x1-x0,top-base,z1-z0,col);
  wallWindows(m,rnd,x0,z0,x1,z1,base+4,top-2,winCols,prob,gx,gy);
}
