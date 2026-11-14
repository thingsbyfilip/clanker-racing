'use strict';
// Level: Spaghetti Junction (an American interstate interchange).
// ---------------- SPAGHETTI JUNCTION (day, a trefoil of elevated ramps: the road crosses over and under itself three times) ----------------
// Every self-crossing of the track becomes an overpass: the first pass is the upper deck (a BRIDGES entry, flat at DH), the second runs
// beneath at ground level. TRACK_Y lets nearestTrack tell the two apart by height, and the terrain is held flat under each crossing.
const HW_K=115, HW_DH=14, HW_ZONE=86;
const HW_SIGN=[.04,.40,.20];
function selfCrossings(){
  const out=[];
  for(let i=0;i<M;i++){ const a=track[i], b=track[(i+1)%M];
    for(let j=i+12;j<M;j++){ if(i+M-j<12) continue; const c=track[j], d=track[(j+1)%M];
      const rx=b.x-a.x, rz=b.z-a.z, qx=d.x-c.x, qz=d.z-c.z, den=rx*qz-rz*qx; if(Math.abs(den)<1e-9) continue;
      const t=((c.x-a.x)*qz-(c.z-a.z)*qx)/den, u=((c.x-a.x)*rz-(c.z-a.z)*rx)/den;
      if(t>=0&&t<1&&u>=0&&u<1) out.push({x:a.x+rx*t,z:a.z+rz*t,ia:i+t,ib:j+u}); } }
  return out; }
const sOfIdx=f=>{ const i=Math.floor(f)%M, j=(i+1)%M, s0=track[i].s, s1=j?track[j].s:1; return lerp(s0,s1,f-Math.floor(f)); };
// green overhead sign gantry across the road, the boards facing oncoming drivers
function gantry(m,rnd,i){
  const t=track[i], yaw=Math.atan2(t.tx,t.tz), A=roadside(i,1,3), B=roadside(i,-1,3), y=Math.max(hAt(A[0],A[1]),hAt(B[0],B[1]),hAt(t.x,t.z));
  for(const p of [A,B]){ orBox(m,p[0],p[1],1.3,1.3,hAt(p[0],p[1])-1,y+10.4,yaw,[.62,.64,.68]); colliders.push([p[0],p[1],1.4]); }
  m.prism(A[0],A[1],B[0],B[1],.55,y+9,y+10.4,[.62,.64,.68]);
  const nx=-t.tx, nz=-t.tz, n=2+((rnd()*2)|0), bw=(TW+6)/n-1.4;
  for(let k=0;k<n;k++){ const off=((k+.5)/n-.5)*(TW+6), px=t.x+t.tz*off-t.tx*.3, pz=t.z-t.tx*off-t.tz*.3, py=y+12.3;
    wallPanel(m,px,py,pz,nx,nz,bw,4.2,HW_SIGN,[t.x,t.z]);
    m.em=true; wallQuad(m,px+nx*.06,py,pz+nz*.06,nx,nz,bw-.6,3.6,[.95,.95,.95]); wallQuad(m,px+nx*.1,py,pz+nz*.1,nx,nz,bw-1,3.2,HW_SIGN);
    for(let r=0;r<2;r++) wallQuad(m,px+nx*.14-nz*(rnd()-.5)*1.4,py+.8-r*1.3,pz+nz*.14+nx*(rnd()-.5)*1.4,nx,nz,2.2+rnd()*bw*.4,.55,[.97,.97,.97]);
    wallQuad(m,px+nx*.14+nz*bw*.3,py-1.5,pz+nz*.14-nx*bw*.3,nx,nz,.5,1,[.97,.97,.97]); m.em=false; } }
// a billboard on two posts
function billboard(m,rnd,x,z,yaw){
  const y=hAt(x,z), tx=Math.sin(yaw), tz=Math.cos(yaw), nx=-tz, nz=tx;
  for(const sg of [-1,1]){ const px=x+tx*sg*7, pz=z+tz*sg*7; orBox(m,px,pz,.9,.9,Math.min(y,hAt(px,pz))-1.5,y+17,yaw,[.4,.4,.44]); }
  const cols=[[.9,.2,.15],[.2,.4,.85],[.95,.8,.15],[.2,.65,.35],[.9,.9,.92]], c=cols[(rnd()*cols.length)|0];
  orBox(m,x,z,17,.6,y+12,y+20,yaw,[.25,.25,.28]); m.em=true;
  wallQuad(m,x+nx*.36,y+16,z+nz*.36,nx,nz,16,7.2,c); wallQuad(m,x+nx*.4,y+16.4,z+nz*.4,nx,nz,10,2.2,[.97,.97,.97]); wallQuad(m,x+nx*.4,y+14.3,z+nz*.4,nx,nz,6+rnd()*5,1.2,[.1,.1,.12]); m.em=false;
  colliders.push([x+tx*7,z+tz*7,1.2],[x-tx*7,z-tz*7,1.2]); }
function waterTower(m,x,z){ const y=footprint(x-4,z-4,x+4,z+4)[0]-1.5;
  for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]]) m.box(x+a*3,y+11,z+b*3,.5,22,.5,[.5,.52,.56]);
  cylY(m,x,y+22,z,6,8,12,[.88,.88,.86],[.7,.7,.7]); m.cone(x,y+30,z,6.3,3.6,12,[.62,.64,.68]); colliders.push([x,z,6.5]); }
function gasStation(m,rnd,x,z,yaw){
  const y=footprint(x-17,z-17,x+17,z+17)[0]-.3, fx=Math.sin(yaw), fz=Math.cos(yaw), lx=fz, lz=-fx;
  orBox(m,x,z,16,10,y+5.4,y+6.2,yaw,[.9,.9,.92]); orBox(m,x,z,16.2,10.2,y+5.4,y+5.8,yaw,[.8,.12,.1]);
  for(const [a,b] of [[-6,-3.5],[6,-3.5],[-6,3.5],[6,3.5]]){ orBox(m,x+lx*a+fx*b,z+lz*a+fz*b,.8,.8,y,y+5.4,yaw,[.85,.85,.88]); colliders.push([x+lx*a+fx*b,z+lz*a+fz*b,.9]); }
  for(const a of [-3,3]) orBox(m,x+lx*a,z+lz*a,1,1.4,y,y+1.7,yaw,[.8,.1,.1]);
  orBox(m,x+fx*14,z+fz*14,14,7,y,y+4,yaw,[.92,.88,.78]); rects.push([x+fx*14,z+fz*14,Math.abs(lx)*7+Math.abs(fx)*3.5+.5,Math.abs(lz)*7+Math.abs(fz)*3.5+.5]);
  const px=x+lx*12-fx*2, pz=z+lz*12-fz*2; m.box(px,y+9,pz,.6,18,.6,[.5,.5,.55]); m.em=true; m.box(px,y+17,pz,5,3.6,.5,[.95,.2,.15]); m.box(px,y+17,pz,4,1.4,.6,[.97,.97,.97]); m.em=false; colliders.push([px,pz,.8]); }
function suburbHouse(m,rnd,x0,z0,x1,z1){
  if(footprint(x0,z0,x1,z1).reduce((a,b)=>b-a)>3.2) return;                // too steep a site
  const y=footprint(x0-1,z0-1,x1+1,z1+1)[0]-.6, h=5+rnd()*2.5, cx=(x0+x1)/2, cz=(z0+z1)/2, wall=[[.9,.88,.8],[.8,.84,.9],[.9,.82,.7],[.78,.62,.52]][(rnd()*4)|0];
  m.box(cx,y+h/2,cz,x1-x0,h,z1-z0,wall); gable(m,x0-.8,z0-.8,x1+.8,z1+.8,y+h,3.4,[.38,.3,.28],(x1-x0)>(z1-z0),wall);
  wallWindows(m,rnd,x0,z0,x1,z1,y+3,y+h-1,[[.3,.42,.55],[.4,.52,.62]],.8,4.2,4,.45,.5);
  m.box(cx+(x1-x0)*.25,y+h+2.6,cz,1.2,3,1.2,[.45,.3,.25]);
  rects.push([cx,cz,(x1-x0)/2+.4,(z1-z0)/2+.4]); }
function oak(m,rnd,x,z,s){ const y=hAt(x,z); m.box(x,y+s*2,z,.7*s,4*s,.7*s,[.36,.26,.18]); m.rock(x,y+s*4.4,z,3.2*s,[.3+rnd()*.12,.5+rnd()*.1,.2],rnd); m.rock(x+s,y+s*3.6,z+.6*s,2.3*s,[.34,.52,.22],rnd); colliders.push([x,z,.6*s]); }
// a decorative viaduct carrying a cross street over the road (never part of the race): deck, rails, pillars, abutments
function flyover(m,i){
  const t=track[i], ux=t.tz, uz=-t.tx, yaw=Math.atan2(ux,uz), y=hAt(t.x,t.z)+15, L=130;
  const P=[]; for(let k=-L;k<=L;k+=10) P.push([t.x+ux*k,t.z+uz*k]);
  beam(m,P,10,y-1.1,y,k=>[.62,.62,.6]);
  for(const sg of [-1,1]) beam(m,P.map(p=>[p[0]+t.tx*sg*10.4,p[1]+t.tz*sg*10.4]),.35,y,y+1.2,()=>[.72,.72,.7]);
  for(const k of [-L+4,-90,-50,-HALFW-5,HALFW+5,50,90,L-4]) for(const sg of [-1,1]){ const px=t.x+ux*k+t.tx*sg*6, pz=t.z+uz*k+t.tz*sg*6, g=hAt(px,pz);
    orBox(m,px,pz,2.4,2.4,g-1,y-1.1,yaw,[.64,.64,.62]); colliders.push([px,pz,1.8]); }
  for(const sg of [-1,1]){ const ex=t.x+ux*sg*(L+3), ez=t.z+uz*sg*(L+3); orBox(m,ex,ez,8,22,hAt(ex,ez)-1,y,yaw,[.58,.58,.56]); colliders.push([ex,ez,6]); } }

LEVELS.junction={
  id:'junction', seed:131, name:'SPAGHETTI JUNCTION', sub:'Keep right except to pass!',
  loc:'Atlanta, Georgia', flag:'us',
  blurb:'Commuters spend years stuck on highways like these, but your job is to race around it for five minutes. And unlike them, if you win the race, you can never think about it again!',
  theme:{
    skyTop:[0.26,0.50,0.90], skyHor:[0.80,0.89,0.96], fog:[0.80,0.88,0.95], fogN:140, fogF:780,
    amb:[.42,.42,.44], hemi:[.24,.24,.26], sun:[.60,.58,.50], light:[.4,.8,.4], night:false, snow:false,
    body:{yaw:2.0,y:.78,r:.04,col:[1,.97,.8]},
    road:[.28,.28,.31], roadAlt:[.25,.25,.28], roadEdge:[.66,.64,.58], shoulder:[.5,.5,.5], grass:[.40,.55,.26], grassAlt:[.46,.58,.28], dry:[.64,.58,.36], slope:[.45,.5,.32], under:[.2,.2,.22],
    dust:{road:[.8,.78,.7],off:[.7,.68,.5],ice:[.9,.95,1],a:.7,sz:1},
    map:{bg:'rgba(50,74,40,0.9)',road:'#e8e8e0',edge:'#101010'}
  },
  phys:{gripRoad:7.8,gripOff:5,gripIce:2,dragRoad:.11,dragOff:.45,dragIce:.05,maxOff:.8},
  rim:50,
  hills(x,z){ return 5*Math.sin(x/190+.4)*Math.cos(z/220-.3)+2.4*Math.sin((x+z)/110+1)+(fbm(x*.01+9,z*.01)-.5)*8; },
  trackPts(){ const dense=[], N_=3000;
    for(let i=0;i<N_;i++){ const t=i/N_*Math.PI*2+0.9; dense.push([(Math.sin(t)+2*Math.sin(2*t))*HW_K,(Math.cos(t)-2*Math.cos(2*t))*HW_K]); }
    return startNear(resampleClosed(dense,M),-90,-300); },
  // crossings are found in layout() (the track exists by then): passes are numbered along the lap, even ones go over
  layout(){
    this.cross=selfCrossings();
    const passes=[]; this.cross.forEach((c,k)=>{ passes.push({s:sOfIdx(c.ia),k},{s:sOfIdx(c.ib),k}); });
    passes.sort((a,b)=>a.s-b.s); passes.forEach((p,n)=>p.over=(n%2===0));
    this.anchors=passes.map(p=>({s:p.s,h:p.over?HW_DH:0,flat:p.over?96:106,over:p.over,k:p.k}));
    return calmLayout([.07,.202,.33,.42,.535,.70,.869],[],.012,.07,this.anchors.map(a=>[a.s-.034,a.s+.034])); },
  elev(s){ const A=this.anchors; if(!A.length) return 0;
    let pi=-1; for(let i=0;i<A.length;i++) if(A[i].s<=s) pi=i; if(pi<0) pi=A.length-1;
    const P=A[pi], Q=A[(pi+1)%A.length], da=((s-P.s+1)%1)*TL, db=((Q.s-s+1)%1)*TL;
    if(da<=P.flat) return P.h; if(db<=Q.flat) return Q.h;
    const u=clamp((da-P.flat)/Math.max(1,da+db-P.flat-Q.flat),0,1); return lerp(P.h,Q.h,u*u*(3-2*u)); },
  // is (x,z) beneath (or right beside) one of the upper decks? ground-level colliders there would stop a car driving on the deck
  underDeck(x,z,pad){ for(const B of BRIDGES) for(let k=0;k<B.n;k+=3){ const t=track[(B.i0+k)%M]; if(Math.hypot(t.x-x,t.z-z)<HALFW+pad) return true; } return false; },
  nearPass(s){ let d=1e9; for(const a of this.anchors) d=Math.min(d,Math.abs(wrapS(s-a.s))*TL); return d; },
  profile(s){ return this.elev(s)+arrProfile(this.prof,s)*smooth(110,240,this.nearPass(s)); },
  prepare(){
    const raw=new Float32Array(M); for(let i=0;i<M;i++) raw[i]=this.hills(track[i].x,track[i].z); this.prof=smoothArr(smoothArr(raw,10),6);
    // upper decks: one BRIDGES entry per upper pass
    for(const a of this.anchors) if(a.over){ const c=this.cross[a.k], j=idxOfS(a.s), B={s:a.s,j,river:null,uc:0,w:0,L:2*(a.flat-11),cx:c.x,cz:c.z,deck:this.profile(a.s),level:0};
      B.top=B.deck+DECK_LIFT; const half=B.L/2+9, idx=[];
      for(let k=-90;k<=90;k++){ const i=(j+k+M)%M, d=wrapS(track[i].s-B.s)*TL; if(Math.abs(d)<=half) idx.push(i); }
      B.i0=idx[0]; B.n=idx.length; B.R2=Math.pow(half+HALFW+6,2); BRIDGES.push(B); }
    TRACK_Y=new Float32Array(M); for(let i=0;i<M;i++) TRACK_Y[i]=trackHeight(track[i].s);
    this.onDeck=new Uint8Array(M); for(const B of BRIDGES) for(let k=0;k<B.n;k++) this.onDeck[(B.i0+k)%M]=1; },
  base(x,z,th,d){ const g=this.hills(x,z), far=smooth(HALFW+2,HALFW+2+26+2.2*Math.max(0,th-g),d); return th*(1-far)+g*far; },
  shape(x,z,h,d,s,k){
    let w=0; for(const c of this.cross) w=Math.max(w,1-smooth(HW_ZONE-40,HW_ZONE,Math.hypot(x-c.x,z-c.z)));
    SPAN[k]=(w>.05&&d<HALFW+16)?1:0; return lerp(h,0,w); },
  iceAt(){ return false; },
  color(c){
    const T=THEME;
    if(c.d<HALFW){
      if(c.span) return T.under;
      if(c.s<0.0035||c.s>0.9985) return [.95,.95,.95];
      if(c.d>HALFW-1.6) return T.roadEdge;
      return vnoise(c.cx*.2,c.cz*.2)>.5?T.road:T.roadAlt; }
    if(c.span) return T.under;
    if(c.d<HALFW+3.5) return T.shoulder;
    if(c.ny<.93&&c.hy>1) return T.slope;
    const n=vnoise(c.cx*.02+4,c.cz*.02);
    return n>.55?(vnoise(c.cx*.1,c.cz*.1)>.5?T.dry:T.grassAlt):T.grass; },
  decor(m,rnd){
    const free=(x,z,r)=>roadDist(x,z)>HALFW+r+4, deck=this.onDeck;
    bridgeDecor(m,{wood:[[.29,.29,.32],[.26,.26,.29]], rail:[.76,.76,.74], post:[.62,.62,.6], stone:[.68,.68,.66]});
    // jersey barriers along the elevated stretches (the decks have their own rails)
    for(const sg of [1,-1]){ let i0=-1; for(let i=0;i<=M;i++){ const ok=i<M&&TRACK_Y[i]-hAt(track[i].x+track[i].tz*sg*(HALFW+9),track[i].z-track[i].tx*sg*(HALFW+9))>2&&!deck[i];
      if(ok&&i0<0) i0=i; else if(!ok&&i0>=0){ if(i-i0>3) barrierRun(m,i0,i-i0,sg,.9,1.25,k=>k&1?[.72,.72,.70]:[.66,.66,.64],null,true); i0=-1; } } }
    // overhead sign gantries and lamp posts
    for(let i=20;i<M;i+=75){ const t=track[i]; if(bendAt(i)>.006||deck[i]||GATES.some(g=>Math.hypot(g.x-t.x,g.z-t.z)<30)||this.nearPass(t.s)<130) continue; gantry(m,rnd,i); }
    for(let i=4;i<M;i+=18){ const sg=((i/18)|0)&1?1:-1, t=track[i]; if(deck[i]||GATES.some(g=>Math.hypot(g.x-t.x,g.z-t.z)<14)) continue; const [x,z]=roadside(i,sg,2.6), y=hAt(x,z); if(this.underDeck(x,z,3)) continue;
      m.box(x,y+6,z,.4,12,.4,[.55,.56,.6]); m.prism(x,z,x-t.tz*sg*3.4,z+t.tx*sg*3.4,.2,y+11.6,y+12.1,[.55,.56,.6]); m.em=true; m.box(x-t.tz*sg*3.4,y+11.4,z+t.tx*sg*3.4,1.6,.3,.9,[1,.95,.8]); m.em=false; colliders.push([x,z,.5]); }
    // viaducts of cross streets over the straighter ground-level stretches
    let nfly=0; for(let i=60;i<M&&nfly<3;i+=1){ const t=track[i]; if(bendAt(i)>.004||TRACK_Y[i]>1.5||this.nearPass(t.s)<170||GATES.some(g=>Math.hypot(g.x-t.x,g.z-t.z)<60)||i%110!==70) continue;
      let ok=true; for(let k=-120;k<=120;k+=15){ const x=t.x+t.tz*k, z=t.z-t.tx*k; if(Math.abs(k)>HALFW+10&&roadDist(x,z)<HALFW+14) ok=false; }
      if(ok){ flyover(m,i); nfly++; } }
    // roadside America: houses, shops, gas stations, water towers, billboards and trees
    for(let gz=-448;gz<=448;gz+=44) for(let gx=-448;gx<=448;gx+=44){
      const cx=gx+(rnd()-.5)*10, cz=gz+(rnd()-.5)*10, r=rnd(), dd=roadDist(cx,cz);
      if(dd<HALFW+14) continue;
      if(r<.34&&dd<170){ for(let k=0;k<2;k++) for(let l=0;l<2;l++){ const x=cx-18+k*36+(rnd()-.5)*4, z=cz-14+l*28+(rnd()-.5)*4, w=11+rnd()*5, d=9+rnd()*4; if(free(x,z,Math.max(w,d)*.6+4)&&rnd()<.8) suburbHouse(m,rnd,x-w/2,z-d/2,x+w/2,z+d/2); } }
      else if(r<.44){ if(free(cx,cz,16)) { const w=26+rnd()*14, d=18+rnd()*10, fp=footprint(cx-w/2-1,cz-d/2-1,cx+w/2+1,cz+d/2+1), y=fp[0]-.5, col=[[.78,.78,.8],[.7,.55,.4],[.6,.65,.72]][(rnd()*3)|0]; if(fp[1]-fp[0]>4.5) continue; m.box(cx,y+4.5,cz,w,9,d,col); m.box(cx,y+9.3,cz,w+.6,.6,d+.6,[.4,.42,.46]); rects.push([cx,cz,w/2+.4,d/2+.4]);
          for(let k=0;k<5;k++){ const px=cx+(rnd()-.5)*w, pz=cz+d/2+8+(k&1)*4; if(free(px,pz,3)) { vehicleProp(m,px,hAt(px,pz),pz,rnd()<.5?0:3.14,[[.8,.1,.1],[.2,.3,.7],[.85,.85,.85],[.1,.1,.12]][(rnd()*4)|0],'car'); colliders.push([px,pz,2.4]); } } } }
      else if(r<.5){ if(free(cx,cz,20)&&footprint(cx-17,cz-17,cx+17,cz+17).reduce((a,b)=>b-a)<5) gasStation(m,rnd,cx,cz,rnd()<.5?0:1.57); }
      else if(r<.54){ if(free(cx,cz,8)) waterTower(m,cx,cz); }
      else if(r<.64){ if(dd<120&&free(cx,cz,10)){ const near=nearestTrack(cx,cz).i, t=track[near], toRoad=Math.atan2(t.x-cx,t.z-cz); billboard(m,rnd,cx,cz,toRoad+Math.PI/2); } }
      else { for(let k=0;k<5;k++){ const x=cx+(rnd()-.5)*40, z=cz+(rnd()-.5)*40; if(free(x,z,5)) oak(m,rnd,x,z,.9+rnd()*.7); } }
    }
    // distant city skyline
    for(let i=0;i<30;i++){ const a=i/30*Math.PI*2+rnd()*.1, r=585+rnd()*60, x=Math.cos(a)*r, z=Math.sin(a)*r, w=26+rnd()*22, h=60+rnd()*140;
      windowedBox(m,rnd,x-w/2,z-w/2,x+w/2,z+w/2,-20,h,[.5+rnd()*.2,.56+rnd()*.15,.64],[[.34,.45,.6]],.5,6,6); rects.push([x,z,w/2,w/2]); }   // (towards the corners they stand inside the map)
  },
  marks(m){
    const deck=this.onDeck, yDeck=i=>{ if(!deck[i]) return null; for(const B of BRIDGES) if(((i-B.i0+M)%M)<B.n) return B.top; return null; };
    for(let i=0;i<M;i++){ const y=yDeck(i), y2=yDeck((i+1)%M);
      const strip=(off,w,col,dash)=>{ if(dash&&i%8>=4) return; markStrip(m,i,i+1,off,w,col,k=>(y===null||y2===null)?null:(k===i?y:y2)); };
      strip(-(HALFW-1.2),.22,[.95,.8,.15],false); strip(HALFW-1.2,.2,[.95,.95,.95],false); strip(-HALFW/3,.16,[.95,.95,.95],true); strip(HALFW/3,.16,[.95,.95,.95],true); } },
  mapBg(g,X,Z,sc){ g.fillStyle='rgba(120,130,70,0.3)'; for(let gz=-440;gz<=440;gz+=88) for(let gx=-440;gx<=440;gx+=88) if(((gx+gz)/88&1)) g.fillRect(X(gx)-22*sc,Z(gz)-22*sc,44*sc,44*sc); },
  mapFg(g,X,Z,sc,road){ for(const B of BRIDGES) road(B.i0,B.n,'#ffffff',TW*sc*.55); }
};
