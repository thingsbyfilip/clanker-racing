'use strict';
// Scenery helpers shared by several levels.
// is the ground roughly level around (x,z)? (for parking machinery, huts ...)
function flatAt(x,z,tol){ const h=hAt(x,z); tol=tol||1.2; return Math.abs(hAt(x+6,z)-h)<tol&&Math.abs(hAt(x-6,z)-h)<tol&&Math.abs(hAt(x,z+6)-h)<tol&&Math.abs(hAt(x,z-6)-h)<tol; }
// half sphere
function dome(m,x,y,z,r,col,seg,rings){
  const o=[x,y,z], P=(a,b)=>[x+Math.cos(a)*Math.cos(b)*r,y+Math.sin(b)*r,z+Math.sin(a)*Math.cos(b)*r];
  for(let j=0;j<rings;j++){ const b0=j/rings*Math.PI/2, b1=(j+1)/rings*Math.PI/2;
    for(let i=0;i<seg;i++){ const a0=i/seg*Math.PI*2, a1=(i+1)/seg*Math.PI*2; m.quad(P(a0,b0),P(a1,b0),P(a1,b1),P(a0,b1),col,o); } }
}

// reflector / hazard marker posts along both sides of the road
function roadPosts(m,every,off,h,colA,colB,tip){
  for(let i=0;i<M;i+=every){ const t=track[i];
    for(const sg of [-1,1]){ const x=t.x+t.tz*sg*(HALFW+off), z=t.z-t.tx*sg*(HALFW+off), y=hAt(x,z);
      m.box(x,y+h/2,z,.26,h,.26,colA); m.box(x,y+h*(tip?1.05:.7),z,.28,h*(tip?.25:.3),.28,colB); } }
}
const ridged=(x,z)=>{ const n=fbm(x,z), r=1-Math.abs(2*n-1); return r*r; };

// square-based pyramid (roofs)
function pyramid(m,cx,y,cz,hx,hz,h,col){
  const c=[[cx-hx,y,cz-hz],[cx+hx,y,cz-hz],[cx+hx,y,cz+hz],[cx-hx,y,cz+hz]], ap=[cx,y+h,cz], o=[cx,y+h*.3,cz];
  for(let i=0;i<4;i++) m.tri(c[i],c[(i+1)%4],ap,col,o);
}

// Catmull-Rom spline through control points [[x,z],...], resampled every ~sp units -> [[x,z,distance along the path],...]
function splinePath(ctl,sp){
  const n=ctl.length, P=i=>ctl[clamp(i,0,n-1)], dense=[];
  for(let i=0;i<n-1;i++) for(let k=0;k<24;k++){
    const t=k/24, a=P(i-1), b=P(i), c=P(i+1), d=P(i+2);
    dense.push([0,1].map(j=>0.5*(2*b[j]+(c[j]-a[j])*t+(2*a[j]-5*b[j]+4*c[j]-d[j])*t*t+(3*b[j]-a[j]-3*c[j]+d[j])*t*t*t))); }
  dense.push(ctl[n-1]);
  const cl=[0]; for(let i=1;i<dense.length;i++) cl.push(cl[i-1]+Math.hypot(dense[i][0]-dense[i-1][0],dense[i][1]-dense[i-1][1]));
  const total=cl[cl.length-1], cnt=Math.max(2,Math.round(total/sp)), out=[]; let j=0;
  for(let k=0;k<=cnt;k++){ const d=total*k/cnt; while(j<cl.length-2&&cl[j+1]<d) j++;
    const t=(d-cl[j])/((cl[j+1]-cl[j])||1); out.push([lerp(dense[j][0],dense[j+1][0],t),lerp(dense[j][1],dense[j+1][1],t),d]); }
  return out; }
// A beam along a polyline P=[[x,z],...]: half width hw, from y0 to y1, colour col(k) per segment. It is built as one strip with
// shared vertices (top, both sides, bottom, end caps) instead of one box per segment. Boxes that touch end to end have coincident
// faces whose edge pixels tie in the depth test, which shows up as dashes that jump around whenever the camera moves.
function beam(m,P,hw,y0,y1,col){
  const n=P.length, L=[], R=[];
  for(let i=0;i<n;i++){
    const a=P[Math.max(0,i-1)], b=P[Math.min(n-1,i+1)], dx=b[0]-a[0], dz=b[1]-a[1], l=Math.hypot(dx,dz)||1, nx=-dz/l*hw, nz=dx/l*hw;
    L.push([P[i][0]+nx,P[i][1]+nz]); R.push([P[i][0]-nx,P[i][1]-nz]); }
  const V=(p,y)=>[p[0],y,p[1]];
  for(let k=0;k<n-1;k++){
    const c=col(k), o=[(P[k][0]+P[k+1][0])/2,(y0+y1)/2,(P[k][1]+P[k+1][1])/2];
    m.quad(V(L[k],y1),V(R[k],y1),V(R[k+1],y1),V(L[k+1],y1),c,'up');
    m.quad(V(L[k],y0),V(L[k+1],y0),V(L[k+1],y1),V(L[k],y1),c,o);
    m.quad(V(R[k],y0),V(R[k+1],y0),V(R[k+1],y1),V(R[k],y1),c,o);
    m.quad(V(L[k],y0),V(R[k],y0),V(R[k+1],y0),V(L[k+1],y0),c,o);
  }
  for(const [i,k] of [[0,0],[n-1,n-2]]){
    const o=[P[i][0],(y0+y1)/2,P[i][1]];
    m.quad(V(L[i],y0),V(R[i],y0),V(R[i],y1),V(L[i],y1),col(k),o); }
}
// Bridges (see findBridges): a deck following the road (not for open bridges, B.leaf), rails, posts and piers down to the river bed.
// pal: {wood:[plankA,plankB], rail, post, stone}
function bridgeDecor(m,pal){
  for(const B of BRIDGES){ if(B.leaf) continue;                // (open bridges are built by their level: London)
    const S=[]; for(let k=0;k<B.n;k++) S.push(track[(B.i0+k)%M]);
    const tp=B.top;
    beam(m,S.map(t=>[t.x,t.z]),HALFW+0.8,tp-0.9,tp,k=>pal.wood[k&1]);
    for(const sg of [-1,1]){
      const E=S.map(t=>[t.x+t.tz*sg*(HALFW+0.55), t.z-t.tx*sg*(HALFW+0.55)]);
      beam(m,E,0.1,tp+0.95,tp+1.2,()=>pal.rail);
      beam(m,E,0.08,tp+0.4,tp+0.6,()=>pal.rail);
      for(let k=0;k<E.length;k+=3) m.box(E[k][0],tp+0.7,E[k][1],0.3,1.4,0.3,pal.post);
      wallRun(E,0.4,2,tp);
    }
    for(const f of [0.28,0.72]){
      const t=S[Math.round((S.length-1)*f)];
      m.prism(t.x-t.tz*(HALFW+0.4),t.z+t.tx*(HALFW+0.4),t.x+t.tz*(HALFW+0.4),t.z-t.tx*(HALFW+0.4),1.2,B.level-3,tp-0.95,pal.stone);
    }
  }
}

// autumn leaf colours (forest trees and the falling-leaf particles)
const FALL=[[.93,.42,.08],[.82,.16,.08],[.96,.74,.14],[.62,.32,.10],[.88,.55,.12]];      // autumn leaf colours
