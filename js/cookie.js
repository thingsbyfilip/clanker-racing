'use strict';
// The spinning cookie of the save question: a low-poly, flat-shaded model rasterised by hand into a tiny canvas (no second WebGL context for one
// dialog), one canvas pixel about the size of a game pixel, so it matches the race view. Model space: the cookie's flat faces look along +z and -z.
const COOKIE_RES=32, COOKIE_SPIN=1.3;                 // canvas pixels a side, radians per second
const COOKIE_DOUGH=[222,158,84], COOKIE_CRUST=[186,118,56], COOKIE_CHIP=[74,42,26];
const COOKIE_LIGHT=[-.37,.56,.74];                    // unit vector
const COOKIE_TRIS=(()=>{
  const N=12, tris=[], tri=(a,b,c,col)=>tris.push([a,b,c,col]);
  const rings=[[0,.27],[.56,.25],[.86,.19],[1,.07],[1,-.07],[.86,-.19],[.56,-.25],[0,-.27]];   // radius, z: the profile from the front face round the edge to the back
  const wobble=i=>1+.05*Math.sin(i*2.4)+.03*Math.sin(i*5.1);                                     // not a perfect circle: it was made by hand
  const pt=(r,z,i)=>{ const a=i/N*Math.PI*2, w=r*wobble(i%N); return [w*Math.cos(a),w*Math.sin(a),z]; };
  for(let k=0;k<rings.length-1;k++) for(let i=0;i<N;i++){
    const [r0,z0]=rings[k], [r1,z1]=rings[k+1], a=pt(r0,z0,i), b=pt(r0,z0,i+1), c=pt(r1,z1,i+1), d=pt(r1,z1,i);
    const edge=k>=2&&k<=4, col=edge?COOKIE_CRUST:COOKIE_DOUGH, m=1+.07*Math.sin(i*3.7+k*2.1), shade=col.map(v=>v*m);    // (patchy, as baked)
    if(r0>0) tri(a,b,c,shade);
    if(r1>0) tri(a,c,d,shade);
  }
  // chocolate chips: little pyramids sunk into both faces
  const chip=(x,y,s)=>{ const top=[x,y,s*.4], base=[0,1,2,3,4,5].map(i=>{ const a=i/6*Math.PI*2+x; return [x+.2*Math.cos(a),y+.2*Math.sin(a),s*.2]; });
    base.forEach((p,i)=>tri(top,p,base[(i+1)%6],COOKIE_CHIP)); };
  [[-.42,.3],[.34,.42],[.05,-.08],[-.3,-.46],[.5,-.32]].forEach(([x,y])=>{ chip(x,y,1); chip(-y,x,-1); });
  return tris;
})();
function drawCookie(ang){
  const cv=$('dcookie'), S=COOKIE_RES, g=cv.getContext('2d'), im=g.createImageData(S,S), d=im.data, zb=new Float32Array(S*S).fill(-1e9);
  const cy=Math.cos(ang), sy=Math.sin(ang), T1=COOKIE_ROTATION_ANGLE*Math.PI/180, cx=Math.cos(T1), sx=Math.sin(T1), R=S*.46, C=(S-1)/2;
  const turn=p=>{ const x=p[0]*cy+p[2]*sy, z=p[2]*cy-p[0]*sy; return [x,p[1]*cx-z*sx,p[1]*sx+z*cx]; };      // spin about the vertical axis, then lean towards the viewer
  for(const [A,B,D,col] of COOKIE_TRIS){
    const a=turn(A), b=turn(B), c=turn(D);
    let nx=(b[1]-a[1])*(c[2]-a[2])-(b[2]-a[2])*(c[1]-a[1]), ny=(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]), nz=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
    const len=Math.hypot(nx,ny,nz)||1, f=nz<0?-1/len:1/len;      // whichever side the viewer sees (the z-buffer hides the far faces)
    const lit=.5+.65*Math.max(0,(nx*COOKIE_LIGHT[0]+ny*COOKIE_LIGHT[1]+nz*COOKIE_LIGHT[2])*f);
    const px=p=>[C+p[0]*R,C-p[1]*R], [ax,ay]=px(a), [bx,by]=px(b), [ex,ey]=px(c), area=(bx-ax)*(ey-ay)-(by-ay)*(ex-ax);
    if(Math.abs(area)<1e-6) continue;
    const x0=Math.max(0,Math.floor(Math.min(ax,bx,ex))), x1=Math.min(S-1,Math.ceil(Math.max(ax,bx,ex))), y0=Math.max(0,Math.floor(Math.min(ay,by,ey))), y1=Math.min(S-1,Math.ceil(Math.max(ay,by,ey)));
    for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){
      const w1=((x-ax)*(ey-ay)-(y-ay)*(ex-ax))/area, w2=((bx-ax)*(y-ay)-(by-ay)*(x-ax))/area, w0=1-w1-w2;
      if(w0<0||w1<0||w2<0) continue;
      const z=w0*a[2]+w1*b[2]+w2*c[2], k=y*S+x;
      if(z<=zb[k]) continue;
      zb[k]=z; for(let n=0;n<3;n++) d[k*4+n]=Math.min(255,col[n]*lit); d[k*4+3]=255;
    }
  }
  g.putImageData(im,0,0);
}
// shown from opening the question until the player answers; it only runs while the dialog is on top, and stands still with reduced motion
let cookieOn=false;
function showCookie(on){
  const was=cookieOn; cookieOn=on; $('dialog').classList.toggle('cookie',on);
  if(!on||was) return;
  drawCookie(.7);
  if(matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const t0=performance.now(), spin=t=>{ if(!cookieOn) return; drawCookie(.7+(t-t0)/1000*COOKIE_SPIN); requestAnimationFrame(spin); };
  requestAnimationFrame(spin);
}
