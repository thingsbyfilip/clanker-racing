'use strict';
// Level: Toy Room.
// ---------------- TOY ROOM (the cars are toys too: a giant nursery with a play-mat road under the bed, through a cardboard tunnel and round building blocks) ----------------
const TY_COL=[[.9,.15,.12],[.15,.4,.92],[.96,.8,.1],[.2,.72,.3],[.96,.5,.1],[.7,.3,.84],[.96,.46,.62]];
// the room each toy took when the scatter below was laid out (its old circle colliders, now walls that fit it): the layout stays as it was
const TY_SPACE=[];
const TY_W=526;                                                         // the walls stand at +-TY_W
const TY_S=.88, TY_BED={x:-339,z:44};                                  // the road is scaled to this much of the room; the bed stands on its west straight
const TY_V0=[[-340,-385,45],[-60,-400,40],[80,-300,45],[250,-410,40],[420,-330,45],[430,-100,50],[290,20,40],[420,160,45],[360,390,45],[120,430,40],[40,280,45],[-130,410,40],[-350,395,45],[-385,230,45],[-385,-130,45]];
const TY_V=TY_V0.map(v=>[v[0]*TY_S,v[1]*TY_S,v[2]]);
function tyRug(x,z){                                                    // colour of the rugs on the parquet, or null
  const a=Math.hypot((x-0)/195,(z+70)/145);
  if(a<1){ if(a>.88) return [.96,.8,.2]; if(a>.8) return [.85,.2,.2]; if(a<.3) return [.96,.6,.2]; return (Math.floor(x/26)+Math.floor(z/26)&1)?[.2,.36,.74]:[.16,.3,.66]; }
  const b=Math.hypot(x+130,z-250);
  if(b<115){ if(b>100) return [.95,.95,.9]; return (Math.floor(Math.atan2(z-250,x+130)*6/Math.PI)&1)?[.88,.2,.24]:[.96,.92,.86]; }
  return null; }
function tyBlock(m,x,z,s,col,y0){ const y=hAt(x,z)+(y0||0), w=[.97,.97,.94], c2=[col[2]*.8+.1,col[0]*.8+.1,col[1]*.8+.1];
  m.box(x,y+s/2,z,s,s,s,col); for(const [nx,nz] of [[1,0],[-1,0],[0,1],[0,-1]]){ wallQuad(m,x+nx*(s/2+.08),y+s/2,z+nz*(s/2+.08),nx,nz,s*.56,s*.56,w); wallQuad(m,x+nx*(s/2+.12),y+s/2,z+nz*(s/2+.12),nx,nz,s*.3,s*.3,c2); }
  m.box(x,y+s+.06,z,s*.56,.12,s*.56,w); }
function tyTower(m,rnd,x,z,s,n){ for(let k=0;k<n;k++) tyBlock(m,x+(rnd()-.5)*s*.18*k,z+(rnd()-.5)*s*.18*k,s*(1-k*.06),TY_COL[(rnd()*7)|0],k*s*.95); rects.push([x,z,s/2+.5,s/2+.5]); }
// a teddy bear (about 120 high at s=1). Every part pokes out of the one it joins (no two faces share a plane, which would z-fight); y0 raises it (a bear on the bed: no floor colliders then)
function tyBear(m,x,z,yaw,s,y0){
  const fx=Math.sin(yaw), fz=Math.cos(yaw), lx=fz, lz=-fx, y=hAt(x,z)+(y0||0), br=[.62,.4,.22], lt=[.8,.62,.42], dk=[.1,.08,.07], P=(a,b)=>[x+(fx*a+lx*b)*s,z+(fz*a+lz*b)*s];
  const B=(a,b,h0,h1,L,W,c)=>{ const p=P(a,b); orBox(m,p[0],p[1],L*s,W*s,y+h0*s,y+h1*s,yaw,c); };
  B(0,0,24,76,36,48,br); B(9,0,28,66,22,34,lt); B(-19,0,30,42,6,6,lt);                              // body, belly, tail
  for(const sg of [-1,1]){ B(13,sg*15,0,27,30,22,br); B(20,sg*15,0,10,20,18,lt); B(0,sg*30,36,70,14,14,br); }   // legs, soles, arms
  B(4,0,74,114,38,40,br); B(18,0,78,94,14,18,lt); B(26,0,86,92,4,6,dk);                              // head, snout, nose
  for(const sg of [-1,1]){ B(23,sg*8,96,102,1.6,4,dk); B(0,sg*16,110,122,8,12,br); B(5,sg*16,112,118,2,8,lt); }   // eyes, ears, inner ears
  B(19,0,64,76,4,26,[.85,.12,.12]);                                                                  // bow tie
  if(!y0) for(const sg of [-1,1]) colliders.push([P(17,sg*15)[0],P(17,sg*15)[1],13*s]); }   // solid only where it touches the floor (legs and feet): the body, arms and head are high enough to drive under
function tyDuck(m,x,z,yaw,s){ const y=hAt(x,z), fx=Math.sin(yaw), fz=Math.cos(yaw);
  ball(m,x,y+20*s,z,21*s,[.98,.84,.12],10,6); ball(m,x+fx*13*s,y+44*s,z+fz*13*s,13*s,[.98,.84,.12],8,5); orBox(m,x+fx*26*s,z+fz*26*s,12*s,12*s,y+39*s,y+43*s,yaw,[.96,.5,.1]);
  m.box(x+fx*20*s+fz*8*s,y+48*s,z+fz*20*s-fx*8*s,3*s,3*s,3*s,[.1,.1,.1]); m.box(x+fx*20*s-fz*8*s,y+48*s,z+fz*20*s+fx*8*s,3*s,3*s,3*s,[.1,.1,.1]);
  m.tri([x-fx*20*s,y+26*s,z-fz*20*s],[x-fx*32*s,y+34*s,z-fz*32*s],[x-fx*18*s,y+34*s,z-fz*18*s],[.96,.78,.1],[x,y+60,z]); colliders.push([x,z,tyUnder(21*s,20*s)]); TY_SPACE.push([x,z,22*s]); }
function tyCar(m,x,z,yaw,col,s){ const y=hAt(x,z), fx=Math.sin(yaw), fz=Math.cos(yaw), lx=fz, lz=-fx;
  orBox(m,x,z,4.4*s,2*s,y+.45*s,y+1.45*s,yaw,col); orBox(m,x-fx*.2*s,z-fz*.2*s,2.4*s,1.8*s,y+1.45*s,y+2.1*s,yaw,[.5,.7,.9]); orBox(m,x,z,4.5*s,.3*s,y+.9*s,y+1.1*s,yaw,[.95,.95,.95]);
  for(const a of [-.3,.3]) for(const sg of [-1,1]) orBox(m,x+fx*(a*4.4*s)+lx*sg*1.05*s,z+fz*(a*4.4*s)+lz*sg*1.05*s,1.1*s,.4*s,y,y+.9*s,yaw,[.08,.08,.09]);
  m.em=true; for(const sg of [-1,1]) m.box(x+fx*2.2*s+lx*sg*.7*s,y+.95*s,z+fz*2.2*s+lz*sg*.7*s,.3*s,.3*s,.3*s,[1,.95,.6]); m.em=false;
  wallRun([[x-fx*1.5*s,z-fz*1.5*s],[x+fx*1.5*s,z+fz*1.5*s]],1.05*s); for(const a of [-1.4,0,1.4]) TY_SPACE.push([x+fx*a*s,z+fz*a*s,1.5*s]); }   // (the body and the wheels: 4.4 long, 2.1 wide)
// a ball of radius R with its centre C above the floor is only as wide as a car is tall down there: the radius of the collider that a car under its curve meets
function tyUnder(R,C){ return Math.max(1,Math.sqrt(Math.max(0,R*R-Math.pow(C-CAR_TOP,2)))-1); }
function tyBall(m,rnd,x,z,r){ const y=hAt(x,z)+r, seg=12, rings=6, cols=[[.9,.15,.12],[.96,.92,.9],[.15,.4,.92],[.96,.8,.1]], P=(a,b)=>[x+Math.cos(a)*Math.cos(b)*r,y+Math.sin(b)*r,z+Math.sin(a)*Math.cos(b)*r];
  for(let j=0;j<rings;j++){ const b0=-Math.PI/2+j/rings*Math.PI, b1=-Math.PI/2+(j+1)/rings*Math.PI; for(let i=0;i<seg;i++){ const a0=i/seg*Math.PI*2, a1=(i+1)/seg*Math.PI*2; m.quad(P(a0,b0),P(a1,b0),P(a1,b1),P(a0,b1),cols[i%4],[x,y,z]); } } colliders.push([x,z,tyUnder(r,r)]); TY_SPACE.push([x,z,r*.95]); }
// a die with proper pips (opposite faces add up to 7): every pip sits on its face, in a 3x3 grid of positions a quarter of the die's size apart
const TY_PIPS={1:[[0,0]],2:[[-1,-1],[1,1]],3:[[-1,-1],[0,0],[1,1]],4:[[-1,-1],[1,-1],[-1,1],[1,1]],5:[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],6:[[-1,-1],[-1,0],[-1,1],[1,-1],[1,0],[1,1]]};
function tyDice(m,x,z,s){ const y=hAt(x,z), d=s*.17, dk=[.08,.08,.1], g=s*.25; m.box(x,y+s/2,z,s,s,s,[.96,.96,.94]);
  for(const [u,v] of TY_PIPS[5]) m.box(x+u*g,y+s+.05,z+v*g,d,.1,d,dk);                                                  // top: 5
  for(const [nx,nz,n] of [[1,0,1],[-1,0,6],[0,1,3],[0,-1,4]]) for(const [u,v] of TY_PIPS[n]){                         // sides: 1, 6, 3, 4
    const tx=-nz, tz=nx; wallQuad(m,x+nx*(s/2+.06)+tx*u*g,y+s/2+v*g,z+nz*(s/2+.06)+tz*u*g,nx,nz,d,d,dk); }
  rects.push([x,z,s/2+.4,s/2+.4]); }
function tyCrayon(m,x,z,yaw,len,col){ const y=hAt(x,z), fx=Math.sin(yaw), fz=Math.cos(yaw);
  orBox(m,x,z,len,8,y,y+8,yaw,col); orBox(m,x+fx*len*.1,z+fz*len*.1,len*.35,8.2,y+.4,y+7.6,yaw,[.97,.95,.88]);
  strut(m,[x+fx*len/2,y+4,z+fz*len/2],[x+fx*(len/2+14),y+4,z+fz*(len/2+14)],4,.4,col); wallRun([[x-fx*(len/2-4),z-fz*(len/2-4)],[x+fx*len/2,z+fz*len/2]],4); wallRun([[x+fx*len/2,z+fz*len/2],[x+fx*(len/2+9),z+fz*(len/2+9)]],2); for(let a=-len/2+4;a<=len/2+10;a+=9) TY_SPACE.push([x+fx*a,z+fz*a,4.2]); }   // the body, then the sharpened tip
function tyBrick(m,x,z,w,d,col){ const y=hAt(x,z), h=24; m.box(x,y+h/2,z,w,h,d,col); for(let a=0;a<w/20;a++) for(let b=0;b<d/20;b++) cylY(m,x+(a-(w/20-1)/2)*20,y+h,z+(b-(d/20-1)/2)*20,5.5,5,8,[col[0]*.92,col[1]*.92,col[2]*.92],col); rects.push([x,z,w/2+.5,d/2+.5]); }
function tyDominoes(m,x,z,yaw,n){ const fx=Math.sin(yaw), fz=Math.cos(yaw); for(let k=0;k<n;k++){ const px=x+fx*k*13, pz=z+fz*k*13, y=hAt(px,pz); orBox(m,px,pz,5,16,y,y+32,yaw,[.96,.96,.94]); orBox(m,px,pz,5.4,15,y+15,y+17,yaw,[.1,.1,.12]); wallBox(px,pz,5,16,yaw,.5); TY_SPACE.push([px,pz,5]); } }
function tySoldier(m,x,z,yaw){ const y=hAt(x,z), s=1, g=[.3,.46,.2]; orBox(m,x,z,22,22,y,y+3,yaw,g); orBox(m,x,z,8,6,y+3,y+22,yaw,g); m.box(x,y+25,z,6,6,6,g); m.box(x,y+29,z,8,3,8,[.22,.36,.15]); orBox(m,x+Math.sin(yaw)*6,z+Math.cos(yaw)*6,2,2,y+10,y+24,yaw,[.15,.2,.12]); wallBox(x,z,22,22,yaw,.5); TY_SPACE.push([x,z,7]); }   // (the square base, taller than a car)
function tyTop(m,x,z,col){ const y=hAt(x,z); frustum(m,x,y,z,1,15,22,10,col,[col[0]*.7,col[1]*.7,col[2]*.7]); cylY(m,x,y+22,z,15,3,10,[.95,.9,.3],[.9,.85,.25]); m.box(x,y+32,z,2,12,2,[.85,.85,.85]); colliders.push([x,z,14*CAR_TOP/22]); TY_SPACE.push([x,z,15]); }   // (the cone is narrow at the floor: where it is as high as a car)
// a toy train on its rails: a locomotive and two carriages running along x
function tyTrain(m,x,z){ const y=hAt(x,z);
  for(let a=-150;a<=150;a+=7) m.box(x+a,y+.8,z,3,1.6,34,[.5,.32,.18]); for(const sg of [-1,1]) m.box(x,y+2.2,z+sg*12,310,2,2.4,[.6,.6,.64]);
  const cols=[[.15,.4,.9],[.9,.15,.12],[.2,.7,.3]];
  m.cylX(x-30,y+22,z,12,60,10,cols[0],[.85,.85,.9]); m.box(x-70,y+26,z,26,34,28,cols[0]); m.box(x-70,y+45,z,30,3,32,[.9,.9,.9]); cylY(m,x+-8,y+34,z,5,18,8,[.2,.2,.24],[.1,.1,.12]);
  for(const a of [-60,-30,0]) for(const sg of [-1,1]) m.cylX(x+a-20+0,y+9,z+sg*15,9,3,8,[.14,.14,.16],[.7,.7,.7]);
  for(let k=0;k<2;k++){ const cx=x-120-k*64; m.box(cx,y+20,z,56,24,28,cols[k+1]); m.box(cx,y+33,z,58,3,30,[.9,.9,.9]); for(const a of [-18,18]) for(const sg of [-1,1]) m.cylX(cx+a,y+8,z+sg*15,8,3,8,[.14,.14,.16],[.7,.7,.7]); }
  for(let a=-210;a<=60;a+=22) colliders.push([x+a,z,17]);
  for(const sg of [-1,1]) wallRun([[x-155,z+sg*12],[x+155,z+sg*12]],1.2); }   // the rails, which stand higher than a toy car's wheels
// the bed: a mattress high on posts, so that the play-mat road runs underneath; panels at the head and foot sit above the road
function tyBed(m,x,z){
  const y=hAt(x,z), L=210, Wd=150, blue=[.3,.45,.85], wood=[.62,.42,.24];
  m.box(x,y+51,z,Wd,14,L,[.96,.94,.88]); m.box(x,y+57.5,z,Wd-4,3,L-4,blue);                                              // mattress and duvet
  m.box(x,y+40,z,Wd+2,8,L+2,wood);                                                                                              // the frame
  for(const sx of [-1,1]) for(const sz of [-1,1]){ m.box(x+sx*(Wd/2-3),y+19,z+sz*(L/2-3),12,38,12,wood); colliders.push([x+sx*(Wd/2-3),z+sz*(L/2-3),6.5]); }
  m.box(x,y+95,z-L/2+3,Wd,70,6,wood); m.box(x,y+75,z-L/2+3,Wd+4,6,8,[.5,.32,.18]);                                         // headboard
  m.box(x,y+72,z+L/2-3,Wd,24,6,wood);
  m.box(x,y+66,z-L/2+36,Wd*.62,10,44,[.98,.98,1]); m.box(x,y+70,z-L/2+34,Wd*.4,4,28,[.96,.7,.8]);                           // pillow
  for(let k=0;k<5;k++) m.box(x-50+k*25,y+57+k%2,z+L/2-26,18,.6,.6,[.96,.8,.2]);
  m.box(x,y+57.8,z+20,Wd-30,.4,70,[.2,.34,.7]);
  tyBear(m,x+20,z-20,.3,.5,59);                                                                                                    // a bear asleep on the bed
  // dust bunnies, a lost sock and a marble under it
  const rn=mulberry32(77); for(let k=0;k<7;k++){ const px=x+(rn()-.5)*Wd*.8, pz=z+(rn()-.5)*L*.8; if(Math.abs(px-x)<HALFW+3) continue; m.rock(px,y,pz,4+rn()*4,[.8,.78,.75],rn); }
  m.box(x+45,y+.6,z+60,16,1.2,8,[.9,.2,.2]); ball(m,x+50,y+4,z-40,4,[.3,.7,.9],6,4); }
// the cardboard tunnel: a long box lying on its side, open at both ends, running along the road
function tyTunnel(m,i){
  const t=track[i], yaw=Math.atan2(t.tx,t.tz), y=hAt(t.x,t.z), L=110, W=22, card=[.74,.56,.36], card2=[.66,.5,.31], fx=t.tx, fz=t.tz, lx=t.tz, lz=-t.tx;
  for(const sg of [-1,1]){ orBox(m,t.x+lx*sg*W,t.z+lz*sg*W,L,2.4,y,y+56,yaw,card); orBox(m,t.x+lx*sg*W,t.z+lz*sg*W,L*.9,2.6,y+30,y+33,yaw,[.9,.78,.5]);
    wallRun([-L/2+2,L/2-2].map(a=>[t.x+fx*a+lx*sg*(W+1.2),t.z+fz*a+lz*sg*(W+1.2)]),1.6); }
  orBox(m,t.x,t.z,L,2*W+4,y+56,y+58.4,yaw,card2);
  for(const e of [-1,1]) for(const sg of [-1,1]){ const px=t.x+fx*e*(L/2)+lx*sg*(W+14), pz=t.z+fz*e*(L/2)+lz*sg*(W+14); orBox(m,px,pz,2,24,y,y+40,yaw+e*sg*.5,card2); }   // torn flaps at the mouths
  m.box(t.x+lx*(W+2),y+36,t.z+lz*(W+2),.1,.1,.1,[0,0,0]); }
// big furniture against the walls
function tyWardrobe(m,x,z,sx,sz){ const y=0; m.box(x,130,z,sx,260,sz,[.55,.36,.2]); const nx=sx>sz?0:(x>0?-1:1), nz=sx>sz?(z>0?-1:1):0, w=sx>sz?sx:sz;
  for(const s of [-1,1]) wallQuad(m,x+nx*(sx/2+.1),130,z+nz*(sz/2+.1),nx,nz,w*.44,230,[.5,.32,.18]); for(const s of [-1,1]) m.box(x+nx*(sx/2+1.2)+(nx?0:s*8),130,z+nz*(sz/2+1.2)+(nz?0:s*8),nx?2:4,24,nz?2:4,[.9,.8,.3]); rects.push([x,z,sx/2+.5,sz/2+.5]); }
function tyShelf(m,rnd,x,z,sx,sz){ m.box(x,120,z,sx,240,sz,[.7,.5,.3]); const nx=sx>sz?0:(x>0?-1:1), nz=sx>sz?(z>0?-1:1):0;
  for(let k=0;k<5;k++){ const hy=22+k*44; m.box(x+nx*(sx/2-1),hy,z+nz*(sz/2-1),nx?3:sx-4,5,nz?3:sz-4,[.56,.38,.22]);
    for(let b=0;b<14;b++){ const w=(sx>sz?sx:sz)-12, u=(b/13-.5)*w; m.box(x+nx*(sx/2+.2)+(nx?0:u),hy+14,z+nz*(sz/2+.2)+(nz?0:u),nx?5:5,28,nz?5:5,TY_COL[(rnd()*7)|0]); } } rects.push([x,z,sx/2+.5,sz/2+.5]); }
function tyDesk(m,x,z,w,d){ m.box(x,100,z,w,6,d,[.84,.66,.4]); for(const sx of [-1,1]) for(const sz of [-1,1]){ m.box(x+sx*(w/2-5),48,z+sz*(d/2-5),8,96,8,[.6,.42,.24]); colliders.push([x+sx*(w/2-5),z+sz*(d/2-5),4.5]); TY_SPACE.push([x+sx*(w/2-5),z+sz*(d/2-5),7]); }
  cylY(m,x-w/3,106,z,10,3,8,[.2,.2,.3],[.25,.25,.35]); m.box(x-w/3,125,z,2,36,2,[.3,.3,.35]); m.em=true; m.box(x-w/3+8,146,z,26,6,16,[1,.95,.7]); m.em=false;
  m.box(x+w/4,112,z,40,14,30,[.2,.5,.8]); m.box(x+w/8,108,z+10,20,6,28,[.9,.3,.3]); }
function tyChest(m,x,z,yaw){ orBox(m,x,z,90,52,0,50,yaw,[.8,.3,.2]); orBox(m,x,z,92,54,50,58,yaw,[.9,.75,.25]); orBox(m,x+Math.sin(yaw)*0,z,24,56,24,48,yaw+Math.PI/2,[.95,.85,.3]); wallBox(x,z,92,54,yaw,.5); for(let a=-40;a<=40;a+=14) TY_SPACE.push([x+Math.cos(yaw)*a,z-Math.sin(yaw)*a,22]); }   // (along its length: orBox runs along the heading)

// ---------------- the block run: a road section built of toys, up a ramp of wedges, over letter blocks, round a bend and down again ----------------
// It stands on the south-west bend, the corner of the room furthest from the desk and the tunnel. It is solid: LV.deckAt gives its height (see bridgeDeckAt),
// its sides are walls for a car on the floor, and it is wider than a checkpoint is (HALFW+7), so the checkpoint on top can only be reached by driving up.
const TY_RUN={H:16,S:16,HW:24,upL:90,downL:72,rowsA:2,rowsB:5,gateRow:2.5,
  wordsA:['ABC','TOY'], wordsB:['CAR','RUN','FUN','ZOO','XYZ']};                // three letter blocks across, each row read by the driver coming up the ramp
function tyRampH(u){ const b=.2, k=1/(1-b), f=u<b?k*u*u/(2*b):u>1-b?1-k*(1-u)*(1-u)/(2*b):k*(u-b/2); return .3+(TY_RUN.H-.3)*f; }   // the height along a ramp: straight, rounded at both ends (0.3 at the toe, so that it never shares a plane with the road)
function tyRunBuild(){
  const {H,S,HW,upL,downL,rowsA,rowsB}=TY_RUN, V=TY_V[11], Pa=TY_V[10], Pb=TY_V[12], unit=(a,b)=>{ const x=b[0]-a[0], z=b[1]-a[1], l=Math.hypot(x,z); return [x/l,z/l]; };
  const ua=unit(Pa,V), ub=unit(V,Pb), th=Math.acos(ua[0]*ub[0]+ua[1]*ub[1]), e=HW*Math.tan(th/2), na=[ua[1],-ua[0]], nb=[ub[1],-ub[0]], q=na[0]*ub[0]+na[1]*ub[1]>0?1:-1;
  const at=(u,d)=>[V[0]+u[0]*d,V[1]+u[1]*d], lenA=rowsA*S, lenB=rowsB*S, part=(o,u,n,L,h,kind)=>({x:o[0],z:o[1],ux:u[0],uz:u[1],nx:n[0],nz:n[1],L,h,kind});
  const P=[V[0]-ua[0]*e+na[0]*q*HW,V[1]-ua[1]*e+na[1]*q*HW];                   // the inner corner of the bend: its top is a slice round it
  const parts=[part(at(ua,-(e+lenA+upL)),ua,na,upL,a=>tyRampH(a/upL),'ramp'),part(at(ua,-(e+lenA)),ua,na,lenA,()=>H,'A'),part(at(ub,e),ub,nb,lenB,()=>H,'B'),part(at(ub,e+lenB),ub,nb,downL,a=>tyRampH(1-a/downL),'ramp')];
  let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9; for(const p of parts) for(const a of [0,p.L]) for(const b of [-HW,HW]){ const x=p.x+p.ux*a+p.nx*b, z=p.z+p.uz*a+p.nz*b; x0=Math.min(x0,x); x1=Math.max(x1,x); z0=Math.min(z0,z); z1=Math.max(z1,z); }
  return {parts,P,ua,ub,q,R:2*HW,x0:x0-30,x1:x1+30,z0:z0-30,z1:z1+30,gate:at(ub,e+TY_RUN.gateRow*S)}; }
// one face of an alphabet block: a frame round a square with the letter on it, all in one colour family, in one plane and without any overlap (so nothing can flicker).
// c: centre, u: the face's width towards the reader's right, v: its height towards the reader's up. Cells of a 9x9 grid, merged into runs along each row
function tyFace(m,c,u,v,ch,frame,fill,ink,away){ const g=PIXEL_FONT[ch], W=[];
  for(let r=0;r<9;r++){ const row=[], bits=r>0&&r<8&&g?parseInt(g.substr((r-1)*2,2),16):0; for(let k=0;k<9;k++) row.push(r===0||r===8||k===0||k===8?0:(k>=2&&k<=6&&(bits&(16>>(k-2))))?2:1); W.push(row); }
  const Q=(a,b)=>[c[0]+u[0]*(a/9-.5)+v[0]*(.5-b/9),c[1]+u[1]*(a/9-.5)+v[1]*(.5-b/9),c[2]+u[2]*(a/9-.5)+v[2]*(.5-b/9)];
  for(let r=0;r<9;r++){ let a=0; while(a<9){ let b=a; while(b<9&&W[r][b]===W[r][a]) b++; m.quad(Q(a,r),Q(b,r),Q(b,r+1),Q(a,r+1),[frame,fill,ink][W[r][a]],away); a=b; } } }
function tyRunDecor(m,D){
  const {H,S,HW}=TY_RUN, AZ='ABCDEFGHIJKLMNOPQRSTUVWXYZ'; let n=0;
  const tone=(c,k)=>[c[0]*k,c[1]*k,c[2]*k], lanes=[[.9,.15,.12],[.96,.8,.1],[.15,.4,.92]];   // red, yellow, blue from the deck's -n side to its +n side: wedges, blocks and bend line up
  for(const p of D.parts){ const f=[p.ux,p.uz], R=[-p.uz,p.ux], O=(a,b,y)=>[p.x+p.ux*a+p.nx*b,y,p.z+p.uz*a+p.nz*b], mid=[p.x+p.ux*p.L/2,H/2,p.z+p.uz*p.L/2];
    if(p.kind==='ramp'){ const N=18;                 // three wooden wedges side by side
      for(let l=0;l<3;l++) for(let k=0;k<N;k++){ const a0=k/N*p.L, a1=(k+1)/N*p.L, b0=-HW+l*S, b1=b0+S, c=tone(lanes[l],k&1?.9:1);
        m.quad(O(a0,b0,p.h(a0)),O(a0,b1,p.h(a0)),O(a1,b1,p.h(a1)),O(a1,b0,p.h(a1)),c,'up'); }
      for(const sg of [-1,1]) for(let k=0;k<N;k++){ const a0=k/N*p.L, a1=(k+1)/N*p.L, b=sg*HW, c=tone(sg>0?lanes[2]:lanes[0],k&1?.72:.82); m.quad(O(a0,b,0),O(a1,b,0),O(a1,b,p.h(a1)),O(a0,b,p.h(a0)),c,mid); }
      continue; }
    const rows=p.L/S|0, words=p.kind==='A'?TY_RUN.wordsA:TY_RUN.wordsB;
    for(let r=0;r<rows;r++){ const a=(r+.5)*S;
      for(let k=0;k<3;k++){ const b=(1-k)*S, col=tone(lanes[2-k],r&1?.9:1);                        // k=0 is the driver's left: the left-hand side of the deck is +n
        tyFace(m,O(a,b,H),[R[0]*S,0,R[1]*S],[f[0]*S,0,f[1]*S],words[r%words.length][k],tone(col,.86),col,tone(col,.68),'up'); }
      for(const sg of [-1,1]){ const col=tone(sg>0?lanes[2]:lanes[0],r&1?.72:.82), ch=AZ[n++%26], nx=p.nx*sg, nz=p.nz*sg;  // the outer faces, letters upright
        tyFace(m,O(a,sg*HW,H/2),[nz*S,0,-nx*S],[0,S,0],ch,tone(col,.86),col,tone(col,.68),mid); } } }
  // the bend: a slice round the inner corner, in the same three lanes
  const bands=D.q<0?lanes:[lanes[2],lanes[1],lanes[0]], sq=D.q, nA=[D.ua[1]*-sq,-D.ua[0]*-sq], nB=[D.ub[1]*-sq,-D.ub[0]*-sq], a0=Math.atan2(nA[1],nA[0]), a1=a0+Math.atan2(nA[0]*nB[1]-nA[1]*nB[0],nA[0]*nB[0]+nA[1]*nB[1]), N=8, Pt=(r,a,y)=>[D.P[0]+Math.cos(a)*r,y,D.P[1]+Math.sin(a)*r];
  for(let b=0;b<3;b++) for(let k=0;k<N;k++){ const r0=b/3*D.R, r1=(b+1)/3*D.R, u=lerp(a0,a1,k/N), w=lerp(a0,a1,(k+1)/N), c=tone(bands[b],k&1?.9:1);
    if(b) m.quad(Pt(r0,u,H),Pt(r1,u,H),Pt(r1,w,H),Pt(r0,w,H),c,'up'); else m.tri(Pt(0,u,H),Pt(r1,u,H),Pt(r1,w,H),c,'up'); }
  for(let k=0;k<N;k++){ const u=lerp(a0,a1,k/N), w=lerp(a0,a1,(k+1)/N); m.quad(Pt(D.R,u,0),Pt(D.R,w,0),Pt(D.R,w,H),Pt(D.R,u,H),tone(bands[2],k&1?.72:.82),[D.P[0],H/2,D.P[1]]); }
  // the sides are solid to a car on the floor: every edge of the outline, its top height at each end (see the wall loop in stepCar)
  const side=(a,b,ta,tb)=>walls.push([a[0],a[1],b[0],b[1],.2,0,undefined,ta,tb]);
  for(const p of D.parts){ const K=p.kind==='ramp'?12:1; for(const sg of [-1,1]) for(let k=0;k<K;k++){ const a=k/K*p.L, c=(k+1)/K*p.L, b=sg*HW; side([p.x+p.ux*a+p.nx*b,p.z+p.uz*a+p.nz*b],[p.x+p.ux*c+p.nx*b,p.z+p.uz*c+p.nz*b],p.h(a),p.h(c)); } }
  for(let k=0;k<N;k++){ const A=Pt(D.R,lerp(a0,a1,k/N),0), B=Pt(D.R,lerp(a0,a1,(k+1)/N),0); side([A[0],A[2]],[B[0],B[2]],H,H); } }

LEVELS.toyroom={
  id:'toyroom', seed:331, name:'TOY ROOM', sub:"It's my turn to race!", go:'PLAYTIME!',
  loc:'The Nursery Floor', flag:'teddy',
  blurb:"The size of your car is a matter of perspective. Put the pedal to the plastic and race under the bed, through a cardboard tunnel and up a ramp of letter blocks!",
  theme:{
    skyTop:[0.96,0.90,0.78], skyHor:[0.94,0.86,0.72], fog:[0.92,0.84,0.7], fogN:300, fogF:1250,
    amb:[.56,.5,.44], hemi:[.3,.27,.24], sun:[.66,.6,.5], light:[.2,.9,.4], night:false, snow:false,
    road:[.28,.29,.34], roadAlt:[.25,.26,.3], roadEdge:[.95,.88,.3], wood:[.78,.58,.36], woodAlt:[.7,.5,.3], woodDark:[.62,.44,.26], under:[.22,.16,.12],
    dust:{road:[.8,.74,.66],off:[.8,.72,.6],ice:[.9,.95,1],a:.5,sz:.8},
    map:{bg:'rgba(176,132,80,0.95)',road:'#f4f4f8',edge:'#14141a'}
  },
  phys:{gripRoad:7.4,gripOff:5.6,gripIce:2,dragRoad:.12,dragOff:.3,dragIce:.05,maxOff:.92},
  rim:0,
  trackPts(){ return startNear(resampleClosed(filletLoop(TY_V.map(v=>[v[0],v[1]]),TY_V.map(v=>v[2]),10),M),-90,-350); },
  layout(){ const bs=track[nearestTrack(TY_BED.x,TY_BED.z).i].s; this.tunS=track[nearestTrack(425*TY_S,-215*TY_S).i].s;
    const L=calmLayout([.04,.16,.3,.44,.58,.72,.88],[[.1,3.5,100],[.5,3.5,100],[.8,3.5,100]],.03,.07,[[bs-.07,bs+.07],[this.tunS-.05,this.tunS+.05]]);
    if(this===LEVELS.toyroom){ this.run=tyRunBuild(); L.gates[4]=track[nearestTrack(this.run.gate[0],this.run.gate[1]).i].s; }   // the fifth checkpoint stands on top of the blocks
    return L; },
  prepare(){},
  // the block run's height at (x,z), null outside it
  deckAt(x,z){ const D=this.run; if(x<D.x0||x>D.x1||z<D.z0||z>D.z1) return null;
    for(const p of D.parts){ const dx=x-p.x, dz=z-p.z, a=dx*p.ux+dz*p.uz; if(a<-.01||a>p.L+.01) continue; const b=dx*p.nx+dz*p.nz; if(b>-TY_RUN.HW&&b<TY_RUN.HW) return p.h(clamp(a,0,p.L)); }
    const dx=x-D.P[0], dz=z-D.P[1]; if(dx*dx+dz*dz<D.R*D.R&&dx*D.ua[0]+dz*D.ua[1]>-.01&&dx*D.ub[0]+dz*D.ub[1]<.01) return TY_RUN.H;
    return null; },
  pavedAt(x,z){ return this.deckAt(x,z)!==null; },                                  // all of the top counts as road
  profile(s){ return jumpsSum(s); },
  base(x,z,th,d){ const far=smooth(HALFW+2,30,d); return th*(1-far); },
  iceAt(){ return false; },
  color(c){
    const T=THEME;
    if(c.d<HALFW){
      if(c.s<0.0035||c.s>0.9985) return [.95,.95,.95];
      if(c.d>HALFW-1.8) return T.roadEdge;
      return vnoise(c.cx*.25,c.cz*.25)>.55?T.roadAlt:T.road; }
    if(Math.abs(c.cx-TY_BED.x)<82&&c.cz>TY_BED.z-108&&c.cz<TY_BED.z+108) return T.under;                                        // the dark under the bed
    const r=tyRug(c.cx,c.cz); if(r) return r;
    return ((Math.floor(c.cz/11))&1)?(vnoise(c.cx*.05,c.cz*.2)>.5?T.wood:T.woodAlt):(vnoise(c.cx*.04,c.cz*.2+5)>.5?T.woodAlt:T.woodDark); },
  decor(m,rnd){
    const clearRun=(x,z,r)=>{ for(let a=0;a<8;a++) if(this.deckAt(x+Math.cos(a*.785)*(r+8),z+Math.sin(a*.785)*(r+8))!==null) return false; return this.deckAt(x,z)===null; };
    TY_SPACE.length=0;
    const W=TY_W, free=(x,z,r)=>roadDist(x,z)>HALFW+r+3&&clearRun(x,z,r), gateNear=(x,z,r)=>GATES.some(g=>Math.hypot(g.x-x,g.z-z)<r), pick=a=>a[(rnd()*a.length)|0];
    // the room: striped wallpaper, skirting boards, a window with curtains, a door, pictures
    const stripe=[[.98,.93,.8],[.9,.85,.95]], walls=[[-W,-W,-W,W,[-900,0,0]],[W,-W,W,W,[900,0,0]],[-W,-W,W,-W,[0,0,-900]],[-W,W,W,W,[0,0,900]]];
    for(const [x0,z0,x1,z1,away] of walls){ const n=44, dx=(x1-x0)/n, dz=(z1-z0)/n; for(let k=0;k<n;k++) vQuad(m,x0+dx*k,z0+dz*k,x0+dx*(k+1),z0+dz*(k+1),0,340,stripe[k&1],[away[0]?away[0]:x0+dx*k,150,away[2]?away[2]:z0+dz*k]);
      m.prism(x0,z0,x1,z1,3,0,22,[.96,.96,.94]); m.prism(x0,z0,x1,z1,3.4,150,153,[.8,.4,.5]); m.prism(x0,z0,x1,z1,3.2,330,340,[.96,.96,.94]); }
    m.em=true; vQuad(m,-170,-W+1,90,-W+1,110,280,[.74,.9,1],[0,150,-900]); m.em=false;                                      // the window
    for(const [a,b,c,d] of [[-174,-W+2,94,-W+2],[-174,-W+2,-170,-W+2],[90,-W+2,94,-W+2]]) m.prism(a,b,c,d,3,104,290,[.96,.96,.96]); m.prism(-170,-W+2,90,-W+2,2,191,194,[.96,.96,.96]); m.prism(-40,-W+2,-36,-W+2,2,110,282,[.96,.96,.96]);
    for(const sx of [-1,1]) m.box(sx>0?112:-192,200,-W+8,30,200,12,[.84,.18,.22]);
    vQuad(m,W-1,-60,W-1,40,0,220,[.6,.4,.22],[900,100,0]); m.box(W-4,110,28,4,10,10,[.9,.8,.3]);                                   // the door
    for(const [x,z,w,col] of [[-300,W-1,90,[.2,.5,.8]],[-120,W-1,70,[.9,.4,.3]],[180,W-1,100,[.3,.7,.4]],[400,W-1,80,[.9,.8,.2]]]) { vQuad(m,x-w/2,z,x+w/2,z,170,240,col,[x,200,900]); m.prism(x-w/2,z-1,x+w/2,z-1,2,166,170,[.5,.3,.15]); }
    // furniture along the walls
    tyWardrobe(m,-W+36,-300,72,130); tyShelf(m,rnd,-W+22,300,44,160); tyDesk(m,300,-W+50,200,90); tyShelf(m,rnd,W-22,-250,44,170); tyWardrobe(m,W-36,260,72,120); tyChest(m,-120,W-45,0); tyChest(m,480,-130,1.57);
    // the bed and the cardboard tunnel sit on the road
    tyBed(m,TY_BED.x,TY_BED.z); tyTunnel(m,idxOfS(this.tunS)); tyRunDecor(m,this.run);
    // the train, and the hero toys
    tyTrain(m,150,-150);
    for(const [x,z,yaw,s] of [[330,100,2.4,1.1],[60,-340,.5,.9],[-250,-230,.9,.8]]) if(free(x,z,40)) tyBear(m,x,z,yaw,s);
    for(const [x,z,yaw,s] of [[-60,130,.5,1.6],[190,190,-1,1.2],[60,-120,2,1.3]]) if(free(x,z,s*24+10)) tyDuck(m,x,z,yaw,s);
    // building-block towers beside and across the road forming the chicanes
    for(let i=20;i<M;i+=55){ const sg=((i/55)|0)&1?1:-1, [x,z]=roadside(i,sg,6+rnd()*20); if(!free(x,z,18)||gateNear(x,z,40)||bendAt(i)>.012) continue; tyTower(m,rnd,x,z,26+rnd()*20,2+((rnd()*4)|0)); }
    // the rest of the toys, scattered over the floor and the rugs (never on the road)
    for(let k=0,p=0;k<4000&&p<300;k++){ const x=(rnd()-.5)*(W*2-100), z=(rnd()-.5)*(W*2-100), r=rnd(); if(!free(x,z,30)||gateNear(x,z,40)||(Math.abs(x-TY_BED.x)<130&&Math.abs(z-TY_BED.z)<150)||rects.some(q=>Math.abs(q[0]-x)<q[2]+22&&Math.abs(q[1]-z)<q[3]+22)||colliders.some(q=>Math.hypot(q[0]-x,q[1]-z)<q[2]+22)||TY_SPACE.some(q=>Math.hypot(q[0]-x,q[1]-z)<q[2]+22)) continue;
      if(r<.16){ const s=22+rnd()*22; tyBlock(m,x,z,s,pick(TY_COL)); rects.push([x,z,s/2+.3,s/2+.3]); }
      else if(r<.26) tyTower(m,rnd,x,z,24+rnd()*18,2+((rnd()*3)|0));
      else if(r<.38) tyCar(m,x,z,rnd()*6.28,pick(TY_COL),5+rnd()*3);
      else if(r<.48) tyBall(m,rnd,x,z,16+rnd()*14);
      else if(r<.56) tyDice(m,x,z,24+rnd()*10);
      else if(r<.66){ const yw=rnd()*6.28, len=80+rnd()*50; if(![-.5,0,.5].every(f=>free(x+Math.sin(yw)*len*f,z+Math.cos(yw)*len*f,10))) continue; tyCrayon(m,x,z,yw,len,pick(TY_COL)); }
      else if(r<.76) tyBrick(m,x,z,[40,60,80][(rnd()*3)|0],[40,60][(rnd()*2)|0],pick(TY_COL));
      else if(r<.84){ const yw=rnd()*6.28, n=5+((rnd()*4)|0); if(![0,.5,1].every(f=>free(x+Math.sin(yw)*n*13*f,z+Math.cos(yw)*n*13*f,10))) continue; tyDominoes(m,x,z,yw,n); }
      else if(r<.92) tySoldier(m,x,z,rnd()*6.28);
      else tyTop(m,x,z,pick(TY_COL));
      p++; }
    // hazard-free fun along the verge: little crayon fences and star stickers are in the marks; a ceiling lamp
    m.em=true; for(const sx of [-1,1]) m.box(sx*200,326,0,8,3,8,[1,.95,.8]); m.em=false;
  },
  marks(m){
    for(let i=0;i<M;i++){ if(this.deckAt(track[i].x,track[i].z)!==null||this.deckAt(track[(i+1)%M].x,track[(i+1)%M].z)!==null) continue;   // (none under the block run: they would show through its thin toe)
      if(i%8<4) markStrip(m,i,i+1,0,.5,[.96,.96,.92]); markStrip(m,i,i+1,HALFW-2,.4,[.95,.88,.3]); markStrip(m,i,i+1,-(HALFW-2),.4,[.95,.88,.3]); }
    // zebra and arrow stickers printed on the play-mat road at a few places
    for(let i=60;i<M;i+=150){ const t=track[i]; if(bendAt(i)>.01) continue; for(let k=-3;k<=3;k++){ const o=k*3.6; const a=[t.x+t.tz*(o-1),hAt(t.x,t.z)+.17,t.z-t.tx*(o-1)], b=[t.x+t.tz*(o+1),a[1],t.z-t.tx*(o+1)], c=[b[0]+t.tx*4,a[1],b[2]+t.tz*4], d=[a[0]+t.tx*4,a[1],a[2]+t.tz*4]; m.quad(a,b,c,d,[.95,.95,.95],'up'); } } },
  mapBg(g,X,Z,sc){ g.fillStyle='#2a4aa0'; g.beginPath(); g.ellipse(X(0),Z(-70),195*sc,145*sc,0,0,7); g.fill(); g.fillStyle='#e04050'; g.beginPath(); g.arc(X(-130),Z(250),115*sc,0,7); g.fill();
    g.fillStyle='#f0e8d8'; g.fillRect(X(TY_BED.x-75),Z(TY_BED.z-105),150*sc,210*sc); },
  mapFg(g,X,Z,sc,road){ const D=this.run, a=nearestTrack(D.parts[0].x,D.parts[0].z).i, p=D.parts[3], b=nearestTrack(p.x+p.ux*p.L,p.z+p.uz*p.L).i; road(a,b-a+1,'#ffc830',TW*sc*.6); }   // the block run
};
