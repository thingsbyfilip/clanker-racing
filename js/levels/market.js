'use strict';
// Level: Dragon Market.
// ---------------- DRAGON MARKET (Hong Kong after dark, Mong Kok style: street stalls at the foot of tenement towers, neon signs along the road, red taxis, trams, the Peak and the harbour skyline behind) ----------------
const MK_V=[[-360,-270],[-120,-270],[-120,-150],[60,-150],[60,-270],[330,-270],[330,-60],[210,-60],[210,60],[330,60],[330,270],[90,270],[90,150],[-90,150],[-90,270],[-360,270]];
const MK_WALL=[[.52,.5,.46],[.62,.58,.5],[.46,.48,.5],[.58,.46,.38],[.68,.66,.6],[.42,.4,.42],[.54,.5,.42]];   // weathered concrete and tile
const MK_NEON=[[1,.12,.3],[.15,.9,1],[1,.85,.15],[.2,1,.45],[1,.3,.1],[.85,.2,1]];
const MK_TILE=[[.22,.42,.36],[.30,.30,.34],[.58,.28,.18],[.18,.34,.30]];
const MK_AWN=[[[.85,.12,.1],[.95,.92,.85]],[[.95,.75,.15],[.8,.12,.1]],[[.15,.4,.75],[.95,.95,.9]],[[.2,.6,.3],[.95,.95,.9]],[[.9,.4,.1],[.95,.9,.7]]];
const MK_GOODS=[[.95,.5,.1],[.85,.15,.12],[.35,.7,.25],[.95,.8,.2],[.6,.25,.6],[.9,.9,.85]];
const MK_GOLD=[1,.78,.28];
// the town has two levels: the upper town in the south (z>0) stands MK_UP above the lower town in the north. The road climbs gently (MK_RAMP either side of z=0: the west straight and the east chicane), the ground between the two more steeply (MK_BANK)
// five steep ramps (position, height, slope length), each right at the end of a straight, so that the car comes down in the turn
const MK_RAMPS=[[.1056,6,.0105],[.2944,6,.0105],[.5433,6,.0105],[.7567,6,.0105],[.9367,6,.0105]];
// back alleys across the mouths of the two U-shaped bends: a shorter way round than the road, but on rubble (softAt: slow, little grip) with low bumps and debris to steer round.
// There are no checkpoints inside those bends, or the alleys would be no use. [x0,x1,z]: runs along z from x0 to x1, MK_AW either side of it
const MK_SOFT=.9, MK_FIRM=60;   // how soft the rubble is, and how much firm ground each end of an alley has
const MK_ALLEYS=[[-150,80,-270],[-120,110,270]], MK_ENTRIES=[0,1], MK_GAP=5, MK_CARTGAP=44, MK_CARTLAT=3.4, MK_ROW=19, MK_AW=6.5, mkInAlley=(x,z)=>MK_ALLEYS.some(a=>x>a[0]&&x<a[1]&&Math.abs(z-a[2])<MK_AW), mkNearAlley=(x,z,p)=>MK_ALLEYS.some(a=>x>a[0]-p&&x<a[1]+p&&Math.abs(z-a[2])<MK_AW+p);
const mkRubble=(x,z)=>MK_ALLEYS.some(a=>x>a[0]+MK_FIRM&&x<a[1]-MK_FIRM&&Math.abs(z-a[2])<MK_AW);
const MK_UP=18, MK_RAMP=75, MK_BANK=36;
const mkRoadLevel=z=>MK_UP*smooth(-MK_RAMP,MK_RAMP,z), mkGroundLevel=z=>MK_UP*smooth(-MK_BANK,MK_BANK,z);
// the overpass: leaves a tower on the bank below the upper town and runs north above the lower town, crossing the road once. Its
// edges are walls at the deck's height, so a car that jumps into it bounces off rather than passing through, and its deck (LV.slabAt) can be landed on
// It is low (about 11 clear of the road), so nothing tall may stand near it: see MK_OVCLEAR
const MK_OV=[[122,-5],[122,-60],[150,-170],[158,-270],[136,-380],[104,-500],[90,-600]], MK_OVW=11, MK_OVTOP=13.5, MK_OVCLEAR=MK_OVW+45, MK_OVX0=90-MK_OVW, MK_OVX1=158+MK_OVW;   // (MK_OVX0/1: a quick test before the distance, for slabAt)
function mkOverpass(m,rnd){
  let P=MK_OV; for(let n=0;n<3;n++){ const Q=[P[0]]; for(let i=0;i<P.length-1;i++){ const a=P[i], b=P[i+1]; Q.push([lerp(a[0],b[0],.25),lerp(a[1],b[1],.25)],[lerp(a[0],b[0],.75),lerp(a[1],b[1],.75)]); } Q.push(P[P.length-1]); P=Q; }
  const dist=(x,z)=>{ let b=1e9; for(let i=0;i<P.length-1;i++){ const a=P[i], c=P[i+1], dx=c[0]-a[0], dz=c[1]-a[1], t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1),0,1); b=Math.min(b,Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t)); } return b; };
  const off=sg=>P.map((p,i)=>{ const a=P[Math.max(0,i-1)], b=P[Math.min(P.length-1,i+1)], dx=b[0]-a[0], dz=b[1]-a[1], l=Math.hypot(dx,dz)||1; return [p[0]-dz/l*sg,p[1]+dx/l*sg]; });
  const top=MK_OVTOP, grey=[.33,.32,.35];
  beam(m,P,MK_OVW,top-2.6,top,()=>grey);
  for(const sg of [-1,1]){ const E=off(sg*(MK_OVW-.3)); beam(m,E,.3,top,top+1.1,()=>[.42,.41,.44]); wallRun(E,.4,0,undefined,top-2.6,top+1.1); m.em=true; beam(m,off(sg*(MK_OVW+.08)),.08,top-1,top-.7,()=>sg>0?[1,.2,.35]:[.15,.8,1]); m.em=false; }
  // piers every 32 m, one each side of the road, never close enough to it to stand among the stalls
  const R=HALFW+10; let acc=99, lamp=0, side=1;
  for(let i=1;i<P.length;i++){ const a=P[i-1], b=P[i], l=Math.hypot(b[0]-a[0],b[1]-a[1]), yaw=Math.atan2(b[0]-a[0],b[1]-a[1]);
    for(let f=0;f<l;f+=2){ const t=f/l, x=lerp(a[0],b[0],t), z=lerp(a[1],b[1],t), d=roadDist(x,z), gy=hAt(x,z); acc+=2; lamp+=2;
      if(lamp>=38&&gy<top){ lamp=0; side=-side; const px=x+Math.cos(yaw)*side*(MK_OVW-.9), pz=z-Math.sin(yaw)*side*(MK_OVW-.9); m.box(px,top+3.5,pz,.3,7,.3,[.3,.3,.33]); m.em=true; m.box(px,top+7.1,pz,1.1,.4,1.1,[1,.86,.55]); m.em=false; }
      if(d<R||(acc<32&&roadDist(x+Math.sin(yaw)*4,z+Math.cos(yaw)*4)>=R)||gy>top-6) continue;
      acc=0; m.box(x,(gy-2+top-2.6)/2,z,3.2,top-.6-gy,3.2,[.3,.29,.32]); orBox(m,x,z,3.4,MK_OVW*2-1,top-4.8,top-2.6,yaw,[.28,.27,.3]); colliders.push([x,z,2.5]); } }
  const [ex,ez]=P[0]; shophouse(m,rnd,ex-14,ez-12,ex+14,ez+12,hAt(ex,ez)-3,62,true);                          // the tower at its south end
  const e=P[P.length-1]; windowedBox(m,rnd,e[0]-18,e[1]-18,e[0]+18,e[1]+18,-20,210,[.1,.12,.2],[[.6,.8,1],[1,.85,.5],[1,.4,.6]],.55,7,8);   // and one in the skyline at its north end
  return dist; }
// a gold "glyph" made of a few random strokes on a wall plate (stands in for Chinese characters)
function glyphs(m,rnd,px,py,pz,nx,nz,n,cell){
  m.em=true;
  for(let k=0;k<n;k++){ const cy=py-(k-(n-1)/2)*cell;
    for(let s=0,c=2+((rnd()*2)|0);s<c;s++){ const horiz=rnd()<.55, w=horiz?cell*.8:cell*.14, h=horiz?cell*.14:cell*.8, ox=(rnd()-.5)*cell*.5, oy=(rnd()-.5)*cell*.5;
      wallQuad(m,px-nz*ox+nx*.04,cy+oy,pz+nx*ox+nz*.04,nx,nz,w,h,MK_GOLD); } }
  m.em=false; }
// a vertical shop sign hanging out from a wall: red lit plate with glyphs on both faces
function hangingSign(m,rnd,x,y,z,nx,nz){
  const n=2+((rnd()*3)|0), h=n*1.9+.8; m.em=true;
  for(const f of [1,-1]){ wallQuad(m,x+nx*f*.12,y,z+nz*f*.12,nx*f,nz*f,2.2,h,[.8,.1,.1]); glyphs(m,rnd,x+nx*f*.1,y,z+nz*f*.1,nx*f,nz*f,n,1.7); } m.em=false; }
// a market stall: posts, striped awning, counter with goods, a lantern and a vendor. (x,z) = centre, T = along the street, N = towards the road
function stall(m,rnd,x,z,tx,tz,nx,nz,w,d){
  const y=hAt(x,z), yaw=Math.atan2(tx,tz), aw=MK_AWN[(rnd()*MK_AWN.length)|0], wood=[.5,.34,.2];
  for(const a of [-1,1]) for(const b of [-1,1]){ const px=x+tx*a*w/2+nx*b*d/2, pz=z+tz*a*w/2+nz*b*d/2, g=Math.min(y,hAt(px,pz))-.2; m.box(px,(g+y+3.4)/2,pz,.28,y+3.4-g,.28,wood); }   // each post down to its own ground
  const nS=4; for(let k=0;k<nS;k++){ const off=(k-(nS-1)/2)*w/nS; orBox(m,x+tx*off+nx*.3,z+tz*off+nz*.3,w/nS,d+1.4,y+3.3,y+3.6,yaw,aw[k&1]); }
  { const cx=x+nx*d*.3, cz=z+nz*d*.3, g=Math.min(y,...[-1,1].flatMap(a=>[-1,1].map(b=>hAt(cx+tx*a*w*.46+nx*b*d*.225,cz+tz*a*w*.46+nz*b*d*.225))))-.2; orBox(m,cx,cz,w*.92,d*.45,g,y+1.2,yaw,wood); }
  for(let k=0;k<4;k++){ const off=(k-1.5)*w/4.4, col=MK_GOODS[(rnd()*MK_GOODS.length)|0];
    if(rnd()<.5) m.box(x+tx*off+nx*d*.3,y+1.5,z+tz*off+nz*d*.3,.9,.6,.8,col); else m.cone(x+tx*off+nx*d*.3,y+1.2,z+tz*off+nz*d*.3,.55,.7,6,col); }
  m.em=true; m.box(x+nx*(d/2+.5),y+2.7,z+nz*(d/2+.5),.55,.75,.55,[1,.2,.12]); m.em=false;
  colliders.push([x,z,Math.min(w,d+2)*.5+.8]); }
// an abandoned fruit cart: two big wheels, a wooden bed heaped with fruit, a sagging canopy, fruit spilled around. (x,z) = centre; tipped = lying on its side
function fruitCart(m,rnd,x,z,yaw,tipped){
  const y=hAt(x,z), fx=Math.sin(yaw), fz=Math.cos(yaw), lx=fz, lz=-fx, wood=[.46,.31,.18], dark=[.3,.2,.12], F=MK_GOODS;
  if(tipped){
    orBox(m,x,z,3.4,1.9,y+.2,y+1.3,yaw+.45,wood); orBox(m,x+lx*.9,z+lz*.9,3.4,.3,y+1.3,y+2.4,yaw+.45,wood);   // bed on its side, one board up
    for(const sg of [-1,1]) orBox(m,x+fx*1.1+lx*sg*1.6,z+fz*1.1+lz*sg*1.6,.3,2.2,y,y+2.2,yaw,dark);               // wheels (one lying, one up)
    orBox(m,x-fx*3.4,z-fz*3.4,3,.25,y+.1,y+.4,yaw-.2,wood); }
  else {
    orBox(m,x,z,3.4,1.9,y+1.1,y+1.5,yaw,wood);
    for(const sg of [-1,1]){ orBox(m,x+lx*sg*.95,z+lz*sg*.95,3.4,.18,y+1.5,y+2.2,yaw,wood);                    // low sides
      orBox(m,x+lx*sg*1.15,z+lz*sg*1.15,.4,2.2,y,y+2.2,yaw,dark);                                               // wheels
      orBox(m,x-fx*3.2+lx*sg*.8,z-fz*3.2+lz*sg*.8,3.4,.22,y+1.1,y+1.35,yaw,wood); }                              // handles
    for(let k=0;k<7;k++){ const a=(k%4-1.5)*.7, b=(k>>2)*1.0-.5, col=F[(rnd()*F.length)|0];
      m.rock(x+fx*a+lx*b*.7,y+1.7,z+fz*a+lz*b*.7,.55+rnd()*.2,col,rnd); }
    // a canopy gone slack: one pole standing, the cloth sagging down to the bed
    const cx=x+fx*1.3, cz=z+fz*1.3;
    m.box(cx+lx*.9,y+2.4,cz+lz*.9,.22,2.6,.22,wood);
    m.quad([cx+lx*.9,y+3.7,cz+lz*.9],[cx-fx*2.5+lx*.9,y+3.0,cz-fz*2.5+lz*.9],[cx-fx*2.5-lx*.9,y+1.8,cz-fz*2.5-lz*.9],[cx+lx*.9-lx*1.9,y+2.2,cz+lz*.9-lz*1.9],[.82,.2,.16],'up'); }
  for(let k=0;k<9;k++){ const a=(rnd()-.5)*8, b=(rnd()-.5)*6, px=x+fx*a+lx*b, pz=z+fz*a+lz*b;
    m.rock(px,hAt(px,pz)+.15,pz,.28+rnd()*.15,F[(rnd()*F.length)|0],rnd); }
  colliders.push([x,z,2.1]); }
// a Hong Kong tenement tower: a tall slab of stained concrete with rows of small lit windows, air-conditioning boxes on the street faces, a shop podium and water tanks on the roof
function shophouse(m,rnd,x0,z0,x1,z1,y,h,near){
  const cx=(x0+x1)/2, cz=(z0+z1)/2, w=x1-x0, d=z1-z0, pick=a=>a[(rnd()*a.length)|0], wall=pick(MK_WALL);
  m.box(cx,y+h/2,cz,w,h,d,wall);
  wallWindows(m,rnd,x0,z0,x1,z1,y+12,y+h-2,[[1,.86,.6],[.75,.9,1],[1,.7,.4]],near?.42:.3,near?5:9,near?4.6:9,.5,.55);
  m.box(cx,y+5,cz,w+.6,10,d+.6,[.24,.22,.24]);                                               // the podium of shops, under its neon
  if(near){ m.em=true; for(const [nx,nz] of [[1,0],[-1,0],[0,1],[0,-1]]){ const c=pick(MK_NEON); wallQuad(m,cx+nx*(w/2+.4),y+9.4,cz+nz*(d/2+.4),nx,nz,(nx?d:w)*.9,.5,c); } m.em=false;
    for(let k=0;k<14;k++){ const side=k&3, nx=side===0?1:side===1?-1:0, nz=side===2?1:side===3?-1:0, f=rnd()-.5, py=y+12+rnd()*(h-14); m.box(cx+(nx?nx*(w/2+.4):f*w),py,cz+(nz?nz*(d/2+.4):f*d),nx?.9:1.3,.8,nz?.9:1.3,[.72,.72,.7]); } }
  m.box(cx,y+h+.3,cz,w+.4,.6,d+.4,[.3,.29,.3]);
  if(rnd()<.5) cylY(m,cx+w*.2,y+h+.6,cz,1.8,2.6,6,[.5,.52,.54]);
  rects.push([cx,cz,w/2+.4,d/2+.4]); }
// the neon sign of a Hong Kong street: one lit board on a short steel arm reaching towards the road from behind the stalls, with a few gold glyphs. (x,z) = the foot of the arm, (nx,nz) = out over the road, T = along the road
function neonSign(m,rnd,x,z,nx,nz,tx,tz,y,reach){
  const n=1+((rnd()*2)|0), h=n*2.6+1, c=MK_NEON[(rnd()*MK_NEON.length)|0], ex=x+nx*reach, ez=z+nz*reach;
  m.prism(x,z,ex,ez,.12,y+h/2-.1,y+h/2+.1,[.2,.2,.22]);
  m.em=true; for(const f of [1,-1]){ wallQuad(m,ex+tx*f*.14,y,ez+tz*f*.14,tx*f,tz*f,3.4,h,[c[0]*.72,c[1]*.72,c[2]*.72]); glyphs(m,rnd,ex+tx*f*.2,y,ez+tz*f*.2,tx*f,tz*f,n,2.2); } m.em=false; }
// a red Hong Kong taxi (white roof, roof sign) and a green double-decker tram, both parked at the kerb
function hkTaxi(m,x,z,yaw){ const y=hAt(x,z); vehicleProp(m,x,y,z,yaw,[.78,.08,.08],'car'); orBox(m,x,z,2.2,1.8,y+2.1,y+2.2,yaw,[.92,.92,.9]); m.em=true; m.box(x,y+2.4,z,.9,.3,.4,[1,.9,.5]); m.em=false; colliders.push([x,z,2.2]); }
function hkTram(m,x,z,yaw){ const y=hAt(x,z), fx=Math.sin(yaw), fz=Math.cos(yaw); vehicleProp(m,x,y,z,yaw,[.1,.42,.26],'bus'); orBox(m,x,z,8,1.6,y+5.7,y+6,yaw,[.92,.92,.88]); m.em=true; orBox(m,x,z,10.2,2.66,y+1.9,y+2.4,yaw,[1,.86,.55]); orBox(m,x,z,10.2,2.66,y+4.1,y+4.5,yaw,[1,.86,.55]); m.em=false; colliders.push([x+fx*3.5,z+fz*3.5,2.3],[x-fx*3.5,z-fz*3.5,2.3]); }
// multi-tier pagoda
function pagoda(m,rnd,x,y,z,s){
  const col=MK_WALL[(rnd()*3)|0]; let yy=y;
  for(let t=0;t<5;t++){ const w=(9-t*1.3)*s; m.box(x,yy+2.5*s,z,w,5*s,w,t&1?[.84,.62,.3]:col);
    m.box(x,yy+5.1*s,z,w+4*s,.7*s,w+4*s,[.5,.1,.08]); pyramid(m,x,yy+5.4*s,z,(w+3.6*s)/2,(w+3.6*s)/2,2*s,MK_TILE[0]); yy+=5.8*s; }
  m.cone(x,yy,z,.8*s,6*s,6,MK_GOLD); colliders.push([x,z,6*s]); }
// paifang: a ceremonial gate over the street
function paifang(m,i){
  const t=track[i], ux=t.tz, uz=-t.tx, yaw=Math.atan2(t.tx,t.tz), o=HALFW+2.6, tile=MK_TILE[0];
  for(const sg of [-1,1]){ const x=t.x+ux*sg*o, z=t.z+uz*sg*o, y=hAt(x,z); orBox(m,x,z,1.8,1.8,y-1,y+13,yaw,[.72,.1,.08]); orBox(m,x,z,2.6,2.6,y-1,y+1,yaw,[.8,.78,.7]); colliders.push([x,z,1.5]); }
  const yb=Math.max(hAt(t.x+ux*o,t.z+uz*o),hAt(t.x-ux*o,t.z-uz*o),hAt(t.x,t.z));
  m.prism(t.x+ux*(o+1.4),t.z+uz*(o+1.4),t.x-ux*(o+1.4),t.z-uz*(o+1.4),.9,yb+11,yb+12.6,[.72,.1,.08]);
  m.prism(t.x+ux*(o+2.6),t.z+uz*(o+2.6),t.x-ux*(o+2.6),t.z-uz*(o+2.6),1.9,yb+12.6,yb+13.2,[.85,.7,.2]);
  for(const [k,wd] of [[0,2.8],[1,1.6]]){ m.prism(t.x+ux*(o+2.8-k*1.5),t.z+uz*(o+2.8-k*1.5),t.x-ux*(o+2.8-k*1.5),t.z-uz*(o+2.8-k*1.5),wd,yb+13.2+k*1.5,yb+14.2+k*1.5,tile); }
  m.em=true; wallQuad(m,t.x+t.tx*1.2,yb+9.4,t.z+t.tz*1.2,t.tx,t.tz,5,1.2,[.85,.1,.08]); wallQuad(m,t.x-t.tx*1.2,yb+9.4,t.z-t.tz*1.2,-t.tx,-t.tz,5,1.2,[.85,.1,.08]); m.em=false;
  m.em=true; glyphs(m,rnd0,t.x+t.tx*1.3,yb+9.4,t.z+t.tz*1.3,t.tx,t.tz,3,1.0); glyphs(m,rnd0,t.x-t.tx*1.3,yb+9.4,t.z-t.tz*1.3,-t.tx,-t.tz,3,1.0); m.em=false; }
const rnd0=mulberry32(5);
// a string of red lanterns hung across the street between two poles
function lanternString(m,rnd,i){
  const t=track[i], A=roadside(i,1,2.6), B=roadside(i,-1,2.6), ya=hAt(A[0],A[1]), yb=hAt(B[0],B[1]), yt=Math.max(ya,yb,t.y||0)+11.5;
  for(const [p,y] of [[A,ya],[B,yb]]){ m.box(p[0],(y+yt)/2,p[1],.4,yt-y,.4,[.45,.1,.08]); colliders.push([p[0],p[1],.5]); }
  m.prism(A[0],A[1],B[0],B[1],.07,yt-.1,yt+.1,[.2,.12,.1]);
  const n=7; for(let k=0;k<n;k++){ const f=(k+.5)/n, x=lerp(A[0],B[0],f), z=lerp(A[1],B[1],f), sag=Math.sin(f*Math.PI)*.8, col=k%3===1?[1,.72,.2]:[1,.16,.1];
    m.em=true; m.box(x,yt-1.2-sag,z,1,1.3,1,col); m.box(x,yt-.4-sag,z,.5,.3,.5,MK_GOLD); m.box(x,yt-2-sag,z,.3,.3,.3,MK_GOLD); m.em=false; } }
// a dragon coiling along the ground: a chain of red/gold scale blobs rising and falling, with a head and horns
function dragon(m,rnd,x,z,dirX,dirZ,len){
  const n=Math.round(len/3.2), ux=-dirZ, uz=dirX;
  for(let k=0;k<n;k++){ const f=k/n, px=x+dirX*f*len+ux*Math.sin(f*9)*5, pz=z+dirZ*f*len+uz*Math.sin(f*9)*5, py=hAt(px,pz)+2.5+Math.max(0,Math.sin(f*Math.PI*4))*3.2, r=2.6-f*1.1;
    m.rock(px,py,pz,r,k&1?[.8,.1,.1]:[.86,.68,.2],rnd); m.cone(px,py+r*.5,pz,.45,1.2,4,MK_GOLD); }
  const hx=x-dirX*3, hz=z-dirZ*3, hy=hAt(hx,hz)+5.5;
  m.rock(hx,hy,hz,3.3,[.8,.1,.1],rnd); m.box(hx-dirX*2.8,hy-.7,hz-dirZ*2.8,2.4,1.5,2.4,[.84,.14,.1]);
  for(const sg of [-1,1]){ m.cone(hx+ux*sg*1.5,hy+2.6,hz+uz*sg*1.5,.35,2.4,4,MK_GOLD); m.em=true; m.box(hx-dirX*1.6+ux*sg*1.2,hy+.7,hz-dirZ*1.6+uz*sg*1.2,.5,.5,.5,[1,.9,.2]); m.em=false; }
  colliders.push([x,z,4]); }

LEVELS.market={
  id:'market', seed:113, name:'DRAGON MARKET', sub:'Watch out for toppled carts!', go:'ADD OIL!',
  loc:'Mong Kok, Hong Kong', flag:'hkb',
  blurb:'Street racing through street markets! Keep an eye out for any dark narrow alleyways which could serve as a shortcut, but be careful—they may be tricky to navigate.',
  theme:{
    skyTop:[0.05,0.05,0.16], skyHor:[0.36,0.20,0.40], fog:[0.20,0.13,0.28], fogN:110, fogF:640,
    amb:[.58,.50,.62], hemi:[.16,.13,.20], sun:[.22,.18,.26], light:[-.5,.45,.4], night:true, snow:false,
    road:[.24,.23,.26], roadAlt:[.21,.2,.23], roadEdge:[.52,.46,.2], walk:[.42,.39,.4], walkAlt:[.37,.34,.36], plaza:[.46,.42,.42],
    dust:{road:[.46,.42,.46],off:[.42,.38,.4],ice:[.9,.95,1],soft:[.4,.32,.25],a:.6,sz:.85},
    map:{bg:'rgba(16,12,34,0.94)',road:'#ff9ac0',edge:'#08040f'}
  },
  phys:{gripRoad:7.2,gripOff:5.2,gripIce:2,dragRoad:.12,dragOff:.45,dragIce:.05,maxOff:.78},
  rim:40,
  hills(x,z){ return 2.8*Math.sin(x/190+.3)*Math.cos(z/230)+1.6*Math.sin((x+z)/110); },
  trackPts(){ return startNear(resampleClosed(filletLoop(MK_V,42,10),M),-240,-270); },
  layout(){ const zones=MK_RAMPS.map(j=>[j[0]-.018,j[0]+.055]).concat([[.165,.225],[.02,.17],[.56,.70]]); return {gates:[.20,.34,.46,.72,.83,.90].map(f=>calmS(f,.03,45,zones)), jumps:MK_RAMPS.map(j=>j.slice())}; },
  prepare(){ const raw=new Float32Array(M); for(let i=0;i<M;i++) raw[i]=this.hills(track[i].x,track[i].z)+mkRoadLevel(track[i].z); this.prof=limitGrade(smoothArr(raw,6),.2); },
  profile(s){ return arrProfile(this.prof,s)+jumpsSum(s); },
  base(x,z,th,d){ const far=smooth(HALFW+2,60,d); return th*(1-far)+(this.hills(x,z)+mkGroundLevel(z))*far+(mkRubble(x,z)?.45*Math.sin(x/4.2)*Math.cos(z/5)*smooth(HALFW+2,30,d):0); },
  iceAt(){ return false; },
  softAt(x,z,onTrack){ return !onTrack&&mkInAlley(x,z)?MK_SOFT:0; },
  pavedAt(x,z){ return mkInAlley(x,z)&&!mkRubble(x,z); },
  color(c){
    const T=THEME;
    if(c.d>=HALFW&&mkRubble(c.cx,c.cz)) return vnoise(c.cx*.3,c.cz*.3)>.5?[.2,.16,.13]:[.27,.21,.16];
    if(c.d>=HALFW&&mkInAlley(c.cx,c.cz)) return ((Math.floor(c.cx/6)+Math.floor(c.cz/6))&1)?[.19,.18,.2]:[.16,.155,.17];
    if(c.d<HALFW){
      if(c.s<0.0035||c.s>0.9985) return [.95,.9,.85];
      if(c.d>HALFW-2.2) return T.roadEdge;
      return ((Math.floor(c.cx/6)+Math.floor(c.cz/6))&1)?T.road:T.roadAlt; }
    if(c.d<HALFW+9) return ((Math.floor(c.cx/5)+Math.floor(c.cz/5))&1)?T.walk:T.walkAlt;
    return vnoise(c.cx*.06,c.cz*.06)>.5?T.plaza:T.walkAlt; },
  decor(m,rnd){
    const near=(x,z)=>roadDist(x,z)<HALFW+26, gateNear=(x,z,r)=>GATES.some(g=>Math.hypot(g.x-x,g.z-z)<r);
    const ovDist=mkOverpass(m,rnd);
    this.slabAt=(x,z)=>x>MK_OVX0&&x<MK_OVX1&&ovDist(x,z)<MK_OVW?MK_OVTOP:null;   // its deck is solid from above: a car landing on it stays up there
    // the alleys run between unbroken rows of tenements
    for(const [ax0,ax1,zc] of MK_ALLEYS) for(const sg of [-1,1]) for(let x=ax0;x<ax1;){ const w=18+rnd()*6, z0=zc+sg*(MK_AW+.5), z1=z0+sg*18, a=Math.min(z0,z1), b=Math.max(z0,z1);
      if([[x,a],[x+w,a],[x,b],[x+w,b]].some(p=>roadDist(p[0],p[1])<HALFW+10)){ x+=6; continue; }
      shophouse(m,rnd,x,a,x+w,b,Math.min(hAt(x,a),hAt(x+w,a),hAt(x,b),hAt(x+w,b))-1.5,30+rnd()*30,true); x+=w+.8; }
    // shophouses on a loose grid everywhere the road and the overpass leave room; the taller ones towards the middle of the map
    for(let gz=-430;gz<=430;gz+=28.5) for(let gx=-430;gx<=430;gx+=28.5){
      const cx=gx+(rnd()-.5)*5, cz=gz+(rnd()-.5)*5, w=17+rnd()*7, d=17+rnd()*7, x0=cx-w/2, x1=cx+w/2, z0=cz-d/2, z1=cz+d/2;
      let ok=true; for(const [px,pz] of [[x0,z0],[x1,z0],[x0,z1],[x1,z1],[cx,cz]]) if(roadDist(px,pz)<HALFW+10){ ok=false; break; }
      if(!ok||rnd()<.08||ovDist(cx,cz)<MK_OVW+Math.max(w,d)/2+4||mkNearAlley(cx,cz,Math.max(w,d)/2+MK_ROW+1)) continue;
      const y=Math.min(hAt(x0,z0),hAt(x1,z0),hAt(x0,z1),hAt(x1,z1))-1.5, mid=1-Math.hypot(cx,cz)/520, big=rnd()<.03&&roadDist(cx,cz)>50;
      if(big){ pagoda(m,rnd,cx,y,cz,1+rnd()*.5); continue; }                          // (a temple or two survives between the towers)
      shophouse(m,rnd,x0,z0,x1,z1,y,34+rnd()*34+Math.max(0,mid)*rnd()*34,near(cx,cz)); }
    // two toppled carts inside each alley, on opposite sides of the rubble, so it has to be driven as a slalom
    for(const [x0,x1,zc] of MK_ALLEYS){ const mid=(x0+x1)/2; for(const sg of [-1,1]){ const x=mid+sg*MK_CARTGAP/2, z=zc+sg*MK_CARTLAT; fruitCart(m,rnd,x,z,1.57+(rnd()-.5)*.6,true); } }
    // a row of carts along the outside of the road hides each entrance, with one small gap in it: at a glance the way on is the road
    MK_ENTRIES.forEach(k=>{ const zc=MK_ALLEYS[k][2], [x0,x1]=MK_ALLEYS[k]; let bi=-1,bd=1e9; for(let i=0;i<M;i++){ const [x,z]=roadside(i,1,4), e=Math.abs(z-zc); if(x>x0&&x<x1&&e<bd&&(k?x>0:x<0)){ bd=e; bi=i; } }
      const at=q=>{ const f=Math.floor(q), A=roadside(((bi+f)%M+M)%M,1,4), B=roadside(((bi+f+1)%M+M)%M,1,4); return [lerp(A[0],B[0],q-f),lerp(A[1],B[1],q-f)]; };
      for(const dir of [-1,1]){ let last=null; for(let q=0;q<16;q+=.1){ const [x,z]=at(dir*q); if(Math.abs(z-zc)<MK_GAP/2+2.1||(last&&Math.hypot(x-last[0],z-last[1])<4.4)) continue; fruitCart(m,rnd,x,z,rnd()*6.28,true); last=[x,z]; } } });
    // abandoned fruit carts: scattered beside the street, and a few left standing in the roadway
    const jumpNear=s=>JUMPS.some(j=>{ const d=((s-j[0]+1.5)%1)-.5; return d>-.04&&d<.09; });
    this.carts=[]; let nc=0; for(let i=18;i<M&&nc<14;i+=1+((rnd()*26)|0)){
      const t=track[i], onRoad=nc%4===1, sg=rnd()<.5?1:-1, off=onRoad?-(5+rnd()*3):2.5+rnd()*5;
      if(bendAt(i)>.004||gateNear(t.x,t.z,onRoad?40:22)||jumpNear(t.s)) continue;
      const [x,z]=roadside(i,sg,off); if(mkNearAlley(x,z,6)||colliders.some(c=>Math.hypot(c[0]-x,c[1]-z)<c[2]+3.4)) continue;
      const yaw=Math.atan2(t.tx,t.tz)+(onRoad?(rnd()-.5)*1.4:(rnd()<.5?1.57:0)+(rnd()-.5)*.5);
      fruitCart(m,rnd,x,z,yaw,nc%5===3); this.carts.push([Math.round(x),Math.round(z),onRoad]); nc++; }
    // carts toppled over in the roadway, towards alternate edges so a lane stays open; the opponents steer round them
    this.obstacles=[]; for(let i=40,n=0;i<M-30&&n<9;i+=2){ const t=track[i], sg=n&1?1:-1, off=-(4.5+rnd()*3), lat=sg*(HALFW+off), [x,z]=roadside(i,sg,off);
      if(bendAt(i)>.004||gateNear(t.x,t.z,40)||jumpNear(t.s)||this.carts.some(c=>Math.hypot(c[0]-x,c[1]-z)<30)||colliders.some(c=>Math.hypot(c[0]-x,c[1]-z)<c[2]+3.4)) continue;
      fruitCart(m,rnd,x,z,Math.atan2(t.tx,t.tz)+(rnd()-.5)*1.4,true); this.carts.push([Math.round(x),Math.round(z),true]); this.obstacles.push([i,lat,3.2]); n++; i+=30+((rnd()*24)|0); }
    // up to nine in all: the rest on the straights, each as far as it can be from the other toppled carts
    for(let n=this.obstacles.length;n<9;n++){ const sg=n&1?-1:1, off=-(4.5+rnd()*3), lat=sg*(HALFW+off); let bi=-1,bd=15;
      for(let i=0;i<M;i+=2){ const t=track[i], [x,z]=roadside(i,sg,off), d=Math.min(...this.obstacles.map(o=>{ const a=Math.abs(o[0]-i); return Math.min(a,M-a); }));
        if(d<=bd||bendAt(i)>.003||bendAt((i+10)%M)>.003||bendAt((i+M-10)%M)>.003||gateNear(t.x,t.z,40)||JUMPS.some(j=>{ const e=((t.s-j[0]+1.5)%1)-.5; return e>-.02&&e<.05; })||this.carts.some(c=>Math.hypot(c[0]-x,c[1]-z)<12)||colliders.some(c=>Math.hypot(c[0]-x,c[1]-z)<c[2]+3.4)) continue;
        bi=i; bd=d; }
      if(bi<0) continue; const t=track[bi], [x,z]=roadside(bi,sg,off);
      fruitCart(m,rnd,x,z,Math.atan2(t.tx,t.tz)+(rnd()-.5)*1.4,true); this.carts.push([Math.round(x),Math.round(z),true]); this.obstacles.push([bi,lat,3.2]); }
    // stalls on both sides of the street
    for(const sg of [1,-1]) for(let i=1;i<M;){
      const w=6+rnd()*2.4, adv=Math.max(2,Math.round((w+1.4)/(TL/M))), im=(i+(adv>>1))%M, tt=track[im], d=3.6, [x,z]=roadside(im,sg,2+d/2);
      i+=adv; if(rnd()<.2||gateNear(x,z,18)||roadDist(x,z)<HALFW+.8||mkNearAlley(x,z,w/2+1)||this.carts.some(c=>Math.hypot(c[0]-x,c[1]-z)<8)) continue;
      if(bendAt(im)>.008&&(sg>0)===(angDiff(Math.atan2(track[(im+8)%M].tx,track[(im+8)%M].tz),Math.atan2(track[(im-8+M)%M].tx,track[(im-8+M)%M].tz))>0)) continue;   // the inside of a corner stays open
      stall(m,rnd,x,z,tt.tx,tt.tz,-tt.tz*sg,tt.tx*sg,w,d); }
    // overhead lantern strings, paifang gates and big hanging signs
    for(let i=6;i<M;i+=10){ const t=track[i]; if(gateNear(t.x,t.z,22)||bendAt(i)>.007||ovDist(t.x,t.z)<MK_OVCLEAR) continue; if(((i/10)|0)%2===0) lanternString(m,rnd,i); }
    const gatesAt=[]; for(let i=0;i<M;i+=2) if(bendAt(i)<.003&&!gateNear(track[i].x,track[i].z,40)&&ovDist(track[i].x,track[i].z)>=MK_OVCLEAR&&gatesAt.every(j=>Math.abs(wrapS(track[j].s-track[i].s))>.1)&&i%75===30) gatesAt.push(i);
    for(const i of gatesAt.slice(0,5)) paifang(m,i);
    for(let i=0;i<M;i+=22){ const sg=((i/22)|0)&1?1:-1, [x,z]=roadside(i,sg,12.5), t=track[i]; if(bendAt(i)>.008||mkNearAlley(x,z,3)||roadDist(x,z)<HALFW+8||ovDist(x,z)<MK_OVW+8) continue; hangingSign(m,rnd,x,hAt(x,z)+9,z,-t.tz*sg,t.tx*sg); }
    // the neon: signs on posts behind the stalls along calm stretches, alternating sides, leaning towards the road but not over it (all well above the cars)
    for(let i=3,n=0;i<M;i+=9,n++){ if(bendAt(i)>.012||gateNear(track[i].x,track[i].z,20)) continue; const t=track[i];
      for(const sg of [n&1?1:-1]){ const [x,z]=roadside(i,sg,6); if(mkNearAlley(x,z,3)||roadDist(x,z)<HALFW+4||ovDist(x,z)<MK_OVW+8) continue; const y0=hAt(x,z), reach=1.5+rnd()*2.5, nx=-t.tz*sg, nz=t.tx*sg;
        for(let k=0,lv=8.5+rnd()*3;k<1+((rnd()*2)|0);k++){ neonSign(m,rnd,x,z,nx,nz,t.tx,t.tz,y0+lv,reach); lv+=7+rnd()*4; }
        m.box(x,y0+15,z,.5,30,.5,[.2,.2,.22]); colliders.push([x,z,.6]); } }
    // red taxis at the kerb and the odd tram waiting by the road
    for(let i=11,n=0;i<M;i+=23,n++){ const t=track[i], sg=n&1?1:-1, [x,z]=roadside(i,sg,1.6), yaw=Math.atan2(t.tx,t.tz); if(bendAt(i)>.006||gateNear(x,z,24)||mkNearAlley(x,z,6)||colliders.some(c=>Math.hypot(c[0]-x,c[1]-z)<c[2]+4)||roadDist(x,z)<HALFW) continue; if(n%5===4) hkTram(m,x,z,yaw); else hkTaxi(m,x,z,yaw); }
    // a dragon coiling in the plaza at the heart of the map
    dragon(m,rnd,-60,-20,1,.2,70);
    // the view past the towers: Victoria Peak dark behind, the harbour skyline of glass towers in front of it, each lit from top to bottom
    for(let i=0;i<14;i++){ const a=-2.6+i*.32, rad=170+rnd()*90, r=beyondPlayfield(a,rad)+20, x=Math.cos(a)*r, z=Math.sin(a)*r; m.cone(x,-10,z,rad,120+rnd()*80,8,[.06,.08,.1]); }
    for(let i=0;i<46;i++){ const a=i/46*Math.PI*2+rnd()*.08, r=beyondPlayfield(a,30)+rnd()*40, x=Math.cos(a)*r, z=Math.sin(a)*r, w=20+rnd()*18, h=110+rnd()*220;
      windowedBox(m,rnd,x-w/2,z-w/2,x+w/2,z+w/2,-20,h,[.1,.12,.2],[[.6,.8,1],[1,.85,.5],[1,.4,.6]],.55,7,8);
      if(i%5===0){ m.cone(x,h,z,w*.5,w*1.5,4,[.3,.34,.46]); m.em=true; m.box(x,h+w*1.6,z,1.2,20,1.2,[1,.3,.4]); m.em=false; } }
  },
  marks(m){ for(let i=0;i<M;i++){ if(i%6<3) markStrip(m,i,i+1,0,.2,[.86,.78,.52]); markStrip(m,i,i+1,HALFW-1.3,.14,[.9,.74,.2]); markStrip(m,i,i+1,-(HALFW-1.3),.14,[.9,.74,.2]); } },
  // neon on the wet-looking tarmac: long soft washes of pink and blue down both sides of the street
  glow(m){ for(let i=0;i<M;i++){ const c=((i>>4)&1)?[.1,.015,.05]:[.015,.06,.1]; markStrip(m,i,i+1,HALFW*.55,3.4,c); markStrip(m,i,i+1,-HALFW*.55,3.4,[c[2],c[1],c[0]]); } },
  mapBg(g,X,Z,sc){ g.fillStyle='rgba(120,70,160,0.3)'; for(let gz=-430;gz<=430;gz+=54) for(let gx=-430;gx<=430;gx+=54) g.fillRect(X(gx),Z(gz),22*sc,22*sc);
    g.fillStyle='rgba(255,170,60,0.22)'; for(const [x0,x1,z] of MK_ALLEYS) for(let x=x0+24;x<x1-24;x+=26) g.fillRect(X(x),Z(z-3),14*sc,6*sc); }
};
