'use strict';
// Math helpers (matrices, clamp/lerp, angles), seeded RNG and value noise.
// ---------- math ----------
const M4 = {
  ident(){ return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]); },
  mul(a,b){ const o=new Float32Array(16);
    for(let c=0;c<4;c++) for(let r=0;r<4;r++){ let s=0; for(let k=0;k<4;k++) s+=a[k*4+r]*b[c*4+k]; o[c*4+r]=s; }
    return o; },
  persp(fov,asp,n,f){ const t=1/Math.tan(fov/2), o=new Float32Array(16);
    o[0]=t/asp; o[5]=t; o[10]=(f+n)/(n-f); o[11]=-1; o[14]=2*f*n/(n-f); return o; },
  lookAt(e,c,u){
    let zx=e[0]-c[0], zy=e[1]-c[1], zz=e[2]-c[2]; let l=Math.hypot(zx,zy,zz); zx/=l; zy/=l; zz/=l;
    let xx=u[1]*zz-u[2]*zy, xy=u[2]*zx-u[0]*zz, xz=u[0]*zy-u[1]*zx; l=Math.hypot(xx,xy,xz); xx/=l; xy/=l; xz/=l;
    const yx=zy*xz-zz*xy, yy=zz*xx-zx*xz, yz=zx*xy-zy*xx;
    const o=new Float32Array(16);
    o[0]=xx;o[1]=yx;o[2]=zx; o[4]=xy;o[5]=yy;o[6]=zy; o[8]=xz;o[9]=yz;o[10]=zz;
    o[12]=-(xx*e[0]+xy*e[1]+xz*e[2]); o[13]=-(yx*e[0]+yy*e[1]+yz*e[2]); o[14]=-(zx*e[0]+zy*e[1]+zz*e[2]); o[15]=1; return o; },
  translate(x,y,z){ const o=M4.ident(); o[12]=x;o[13]=y;o[14]=z; return o; },
  rotX(a){ const o=M4.ident(),c=Math.cos(a),s=Math.sin(a); o[5]=c;o[6]=s;o[9]=-s;o[10]=c; return o; },
  rotY(a){ const o=M4.ident(),c=Math.cos(a),s=Math.sin(a); o[0]=c;o[2]=-s;o[8]=s;o[10]=c; return o; },
  basis(l,u,f,p){ return new Float32Array([l[0],l[1],l[2],0, u[0],u[1],u[2],0, f[0],f[1],f[2],0, p[0],p[1],p[2],1]); }
};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{ const t=clamp((x-a)/(b-a),0,1); return t*t*(3-2*t); };
const angDiff=(a,b)=>{ let d=a-b; while(d>Math.PI) d-=2*Math.PI; while(d<-Math.PI) d+=2*Math.PI; return d; };
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

// ---------- value noise ----------
const SEED=1996;
function hash2(x,y){ let h=Math.imul(x,374761393)+Math.imul(y,668265263)+Math.imul(SEED,144665)|0;
  h=Math.imul(h^(h>>>13),1274126177); h^=h>>>16; return (h>>>0)/4294967296; }
function vnoise(x,y){ const xi=Math.floor(x), yi=Math.floor(y), xf=x-xi, yf=y-yi;
  const u=xf*xf*(3-2*xf), v=yf*yf*(3-2*yf);
  const a=hash2(xi,yi), b=hash2(xi+1,yi), c=hash2(xi,yi+1), d=hash2(xi+1,yi+1);
  const t0=a+(b-a)*u, t1=c+(d-c)*u; return t0+(t1-t0)*v; }
function fbm(x,y){ return vnoise(x,y)*0.6+vnoise(x*2.1+11,y*2.1+7)*0.28+vnoise(x*4.3+3,y*4.3+19)*0.12; }
