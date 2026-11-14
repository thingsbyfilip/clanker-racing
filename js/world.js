'use strict';
// World model: shared track/terrain arrays, height queries, rivers and bridges, buildLevelData().
// ---------- level system ----------
// Each level (dirt / city / snow) is a data + hooks object in LEVELS (defined further down). buildLevelData(id) refills the
// shared world arrays below in place, so the rest of the game keeps using the same names whichever level is active.
let TW=30, HALFW=TW/2;                                 // road width (a level can set its own with `tw`; reset in buildLevelFeatures)
const M=900;                                           // track samples
const N=176, CELL=6, HALF=N*CELL/2, NV=(N+1)*(N+1);     // terrain grid
const track=[], RIVERS=[], BRIDGES=[], GATES=[], JUMPS=[], LAKES=[];   // RIVERS entries with .lava are lava flows (see inLava)
const colliders=[];   // circles: [x,z,r,kind,deckY]  kind 0 = scenery, 2 = bridge rail (only solid at deck height deckY)
const rects=[];       // axis-aligned boxes (buildings): [cx,cz,halfX,halfZ]
// Every shape also gets .y0/.y1, the height of the scenery drawn over it (fitCollisionHeights, mesh.js, in loadLevel): a car above y1 or wholly
// below y0 passes (CAR_TOP, clearOf). A shape with .fix keeps the heights it was given (wallRun y0,y1; solidCone; Tibet's dzong tiers).
const walls=[];       // thin solid walls (fences, guard rails, bridge rails): line segments [x0,z0,x1,z1,r,kind,deckY,top0,top1], same kind/deckY meaning as colliders; top0/top1 (optional): the wall's height at each end, a car above that passes over it (the sides of a raised deck, LV.deckAt)
// y0,y1 (optional): the wall is solid only between these heights, and fitCollisionHeights (mesh.js) leaves it so; otherwise its height is
// measured from the scenery drawn over it. A continuous wall along the polyline pts ([[x,z],...]), thickness radius r. Never build fences and rails out of separate circle colliders:
// whatever the spacing there is a gap a car can slip through (and then it is stuck behind the wall).
function wallRun(pts,r,kind,deckY,y0,y1){ for(let k=0;k<pts.length-1;k++){ const w=[pts[k][0],pts[k][1],pts[k+1][0],pts[k+1][1],r,kind||0,deckY]; if(y0!==undefined){ w.y0=y0; w.y1=y1; w.fix=true; } walls.push(w); } }
const H=new Float32Array(NV), DIST=new Float32Array(NV), SPAR=new Float32Array(NV), RN=new Float32Array(NV), SPAN=new Uint8Array(NV);
let LV=null, THEME=null, TL=1, NG=7;
let TRACK_Y=null;     // optional per-sample road height (set by levels whose road crosses over itself): makes nearestTrack prefer the road at the car's own height
const wrapS=d=>d-Math.round(d);                        // wrap a track-position difference into [-.5,.5]

// a ramp ending at track position c: h high, its slope `len` long in track position (default .016; shorter is steeper)
function jumpAt(s,c,h,len){ let t=s-c; if(t<-.5)t+=1; if(t>.5)t-=1; len=len||.016;
  if(t>-len&&t<0) return h*smooth(0,1,(t+len)/len);
  if(t>=0&&t<0.003) return h*(1-t/0.003);
  return 0; }
function jumpsSum(s){ let h=0; for(const j of JUMPS) h+=jumpAt(s,j[0],j[1],j[2]); return h; }
function nearestTrack(x,z,y){ let bd=1e18, bi=0; const ty=y!==undefined?TRACK_Y:null;
  for(let i=0;i<M;i++){ const dx=track[i].x-x, dz=track[i].z-z; let d=dx*dx+dz*dz; if(ty){ const dy=ty[i]-y; d+=dy*dy*0.6; } if(d<bd){bd=d;bi=i;} }
  return {i:bi, d:ty?Math.hypot(track[bi].x-x,track[bi].z-z):Math.sqrt(bd)}; }
function trackIndexAt(s){ let i=0; while(i<M-1&&track[i].s<s) i++; return i; }
function idxOfS(s){ let lo=0,hi=M-1; while(lo<hi){ const mid=(lo+hi+1)>>1; if(track[mid].s<=s) lo=mid; else hi=mid-1; } return lo; }
function arrProfile(arr,s){ const i=idxOfS(s), j=(i+1)%M, s0=track[i].s, s1=j?track[j].s:1; return lerp(arr[i],arr[j],clamp((s-s0)/((s1-s0)||1),0,1)); }
function smoothArr(arr,w){ const out=new Float32Array(M); for(let i=0;i<M;i++){ let a=0; for(let k=-w;k<=w;k++) a+=arr[(i+k+M)%M]; out[i]=a/(2*w+1); } return out; }
// road height profile: the level's own shape, flattened to the deck height at bridges and to the ice level across frozen lakes
function trackHeight(s){
  let h=LV.profile(s);
  for(const B of BRIDGES){ const a=Math.abs(wrapS(s-B.s))*TL; h=lerp(h,B.deck,1-smooth(B.L/2+4,B.L/2+48,a)); }
  for(const L of LAKES){ if(L.s===undefined) continue;                    // (off-track lakes don't touch the road)
    const a=Math.abs(wrapS(s-L.s))*TL; h=lerp(h,L.level,1-smooth(L.r*0.9,L.r*1.6,a)); }
  return h; }

// closed polyline -> n equally spaced points
function resampleClosed(pts,n){
  const m=pts.length, cl=[0];
  for(let i=1;i<=m;i++){ const a=pts[i-1], b=pts[i%m]; cl.push(cl[i-1]+Math.hypot(b[0]-a[0],b[1]-a[1])); }
  const total=cl[m], out=[]; let j=0;
  for(let k=0;k<n;k++){ const d=total*k/n; while(j<m-1&&cl[j+1]<=d) j++;
    const a=pts[j], b=pts[(j+1)%m], t=(d-cl[j])/((cl[j+1]-cl[j])||1); out.push([lerp(a[0],b[0],t),lerp(a[1],b[1],t)]); }
  return out; }
// rectilinear polygon with every (90 degree) corner rounded by radius R
function roundedLoop(V,R,steps){
  const out=[], n=V.length;
  for(let k=0;k<n;k++){
    const P=V[(k+n-1)%n], C=V[k], Q=V[(k+1)%n];
    let ux=P[0]-C[0], uz=P[1]-C[1], wx=Q[0]-C[0], wz=Q[1]-C[1];
    const ul=Math.hypot(ux,uz), wl=Math.hypot(wx,wz); ux/=ul; uz/=ul; wx/=wl; wz/=wl;
    const t1=[C[0]+ux*R,C[1]+uz*R], t2=[C[0]+wx*R,C[1]+wz*R], cc=[C[0]+(ux+wx)*R,C[1]+(uz+wz)*R];
    const a1=Math.atan2(t1[1]-cc[1],t1[0]-cc[0]), a2=Math.atan2(t2[1]-cc[1],t2[0]-cc[0]);
    let da=a2-a1; while(da>Math.PI) da-=2*Math.PI; while(da<-Math.PI) da+=2*Math.PI;
    for(let s=0;s<=steps;s++){ const a=a1+da*s/steps; out.push([cc[0]+Math.cos(a)*R,cc[1]+Math.sin(a)*R]); }
  }
  return out; }
// rotate a point list so that it starts at the point nearest to (x,z)
function startNear(pts,x,z){ let bi=0,bd=1e18; pts.forEach((p,i)=>{ const d=Math.hypot(p[0]-x,p[1]-z); if(d<bd){bd=d;bi=i;} }); return pts.slice(bi).concat(pts.slice(0,bi)); }

// nearest point on a river's centreline: distance, half-width and water level there
function riverQuery(r,x,z){
  let bd=1e18,bw=0,bl=0; const P=r.p;
  for(let i=0;i<P.length-1;i++){
    const a=P[i], b=P[i+1], ex=b.x-a.x, ez=b.z-a.z;
    let t=((x-a.x)*ex+(z-a.z)*ez)/(ex*ex+ez*ez); t=t<0?0:t>1?1:t;
    const dx=x-a.x-ex*t, dz=z-a.z-ez*t, d=dx*dx+dz*dz;
    if(d<bd){ bd=d; bw=a.w+(b.w-a.w)*t; bl=a.level+(b.level-a.level)*t; } }
  return {d:Math.sqrt(bd),w:bw,level:bl}; }
// is the point in a river channel (and below the water surface)?
function inRiver(x,z,y){ for(const r of RIVERS){ if(r.lava) continue; const q=riverQuery(r,x,z); if(q.d<q.w*0.8&&y<q.level+0.6) return true; }
  return LV.sea!==undefined && y<LV.sea+0.8 && hAt(x,z)<LV.sea-0.05; }   // wading through the sea
// the water at (x,z), for the camera: {level,col}, or null where there is none (the highest, if two overlap)
function waterAt(x,z){ let L=null; const g=hAt(x,z);
  for(const r of RIVERS){ if(r.lava) continue; const q=riverQuery(r,x,z); if(q.d<q.w*.95&&g<q.level&&(!L||q.level>L.level)) L={level:q.level,col:(THEME.water||[[.19,.47,.83]])[0]}; }
  if(LV.sea!==undefined&&g<LV.sea&&(!L||LV.sea>L.level)) L={level:LV.sea,col:LV.seaCol||(THEME.water||[[.19,.47,.83]])[0]};
  return L; }
// is the point in lava (below the surface of a lava river, or in one of the level's lava pools)? Driving over a bridge doesn't count.
function inLava(x,z,y){
  for(const r of RIVERS) if(r.lava){ const q=riverQuery(r,x,z); if(q.d<q.w*0.85&&y<q.level+0.8) return true; }
  if(LV.lavaPools) for(const P of LV.lavaPools) if(Math.hypot(x-P.x,z-P.z)<P.r&&y<hAt(x,z)+1.2) return true;   // pools are draped on the ground
  return false; }

function hAt(x,z){
  let gx=x/CELL+N/2, gz=z/CELL+N/2;
  gx=clamp(gx,0,N-0.001); gz=clamp(gz,0,N-0.001);
  const ix=gx|0, iz=gz|0, fx=gx-ix, fz=gz-iz, W=N+1;
  const h00=H[iz*W+ix], h10=H[iz*W+ix+1], h01=H[(iz+1)*W+ix], h11=H[(iz+1)*W+ix+1];
  return fx>=fz ? h00+(h10-h00)*fx+(h11-h10)*fz : h00+(h11-h01)*fx+(h01-h00)*fz;
}

// Build everything the physics and the mesh builders need for level `id`
function buildLevelData(id){ buildLevelFeatures(id); buildLevelTerrain(); }
// steps 1-3: the track, jumps and gates, and the level's own features (rivers, bridges, lakes ...); the minimap needs nothing more
function buildLevelFeatures(id){
  LV=LEVELS[id]; THEME=LV.theme; TW=LV.tw||30; HALFW=TW/2;
  for(const a of [track,RIVERS,BRIDGES,GATES,JUMPS,LAKES,colliders,rects,walls]) a.length=0;
  fxReset();
  TRACK_Y=null;
  // 1. the track
  const pts=LV.trackPts(); let cum=0;
  for(let i=0;i<M;i++){
    const a=pts[i], b=pts[(i+1)%M], c=pts[(i+M-1)%M], tx=b[0]-c[0], tz=b[1]-c[1], l=Math.hypot(tx,tz);
    track.push({x:a[0],z:a[1],tx:tx/l,tz:tz/l,s:cum}); cum+=Math.hypot(b[0]-a[0],b[1]-a[1]); }
  for(const t of track) t.s/=cum;
  TL=cum;
  // 2. jumps and checkpoint gates (the finish line is the last gate)
  const lay=LV.layout(); for(const j of lay.jumps) JUMPS.push(j);
  for(const s of lay.gates){ const i=trackIndexAt(s), t=track[i]; GATES.push({s:t.s,i,x:t.x,z:t.z,tx:t.tx,tz:t.tz,y:0,prevA:0}); }
  NG=GATES.length;
  GATES.push({s:0,i:0,x:track[0].x,z:track[0].z,tx:track[0].tx,tz:track[0].tz,y:0,prevA:0});
  // 3. level features (rivers + bridges, lakes, road profile ...)
  if(LV.prepare) LV.prepare();
}
// step 4: terrain heights
function buildLevelTerrain(){
  RN.fill(1e9); SPAN.fill(0);
  for(let j=0;j<=N;j++) for(let i=0;i<=N;i++){
    const x=(i-N/2)*CELL, z=(j-N/2)*CELL, k=j*(N+1)+i;
    const nt=nearestTrack(x,z), d=nt.d, s=track[nt.i].s;
    DIST[k]=d; SPAR[k]=s;
    let h=LV.base(x,z,trackHeight(s),d);
    if(LV.shape) h=LV.shape(x,z,h,d,s,k);
    const e=Math.max(Math.abs(x),Math.abs(z));
    H[k]=h+smooth(HALF-130,HALF-6,e)*LV.rim;
  }
  for(const g of GATES){ const d=LV.deckAt?LV.deckAt(g.x,g.z):null; g.y=d!==null?d:hAt(g.x,g.z); }
}

// Bridges wherever a river (water or lava) crosses the track. Fills BRIDGES; `profile` is the level's road height function.
// The deck is flat at the road height where the river crosses and runs one terrain cell past each end of the span, so it covers
// the transition where the road meets the valley. Its visible top (B.top) sits slightly above the terrain so the two never share a plane.
const DECK_LIFT=0.12;
function findBridges(profile){
  for(const r of RIVERS) for(let i=0;i<r.p.length-1;i++){
    const a=r.p[i], b=r.p[i+1], rx=b.x-a.x, rz=b.z-a.z, rl=Math.hypot(rx,rz);
    for(let j=0;j<M;j++){
      const c=track[j], d=track[(j+1)%M], qx=d.x-c.x, qz=d.z-c.z, den=rx*qz-rz*qx;
      if(Math.abs(den)<1e-9) continue;
      const t=((c.x-a.x)*qz-(c.z-a.z)*qx)/den, u=((c.x-a.x)*rz-(c.z-a.z)*rx)/den;
      if(t<0||t>=1||u<0||u>=1) continue;
      const sNext=j+1<M?track[j+1].s:1, s=lerp(c.s,sNext,u);
      if(BRIDGES.some(B=>Math.abs(wrapS(B.s-s))<0.02)) continue;
      const sinT=Math.abs(rx*c.tz-rz*c.tx)/rl, w=lerp(a.w,b.w,t);
      BRIDGES.push({s,j,river:r,uc:lerp(a.u,b.u,t),w,L:2*(w/Math.max(sinT,0.6)+8),cx:a.x+rx*t,cz:a.z+rz*t});
    }
  }
  for(const B of BRIDGES){
    B.deck=profile(B.s); B.top=B.deck+DECK_LIFT;
    const half=B.L/2+9, idx=[];
    for(let k=-70;k<=70;k++){ const i=(B.j+k+M)%M, a=wrapS(track[i].s-B.s)*TL; if(Math.abs(a)<=half) idx.push(i); }
    B.i0=idx[0]; B.n=idx.length; B.R2=Math.pow(half+HALFW+6,2);
  }
}
// is this terrain point (distance d from the road, track position s) under a bridge span? (the river passes below the deck there)
function onBridgeSpan(d,s){ if(d<HALFW+14) for(const B of BRIDGES) if(Math.abs(wrapS(s-B.s))*TL<B.L/2) return true; return false; }

// bridge decks: flat slabs along the road. Only used when the car is at deck height (not down in the river)
function bridgeDeckAt(x,z){
  if(LV.deckAt){ const d=LV.deckAt(x,z); if(d!==null) return d; }        // a level's own solid raised ground (Toy Room's blocks), which may slope
  for(const B of BRIDGES){
    const dx=x-B.cx, dz=z-B.cz; if(dx*dx+dz*dz>B.R2) continue;
    let bd=1e18,bk=-1;
    for(let k=0;k<B.n;k++){ const t=track[(B.i0+k)%M], ex=t.x-x, ez=t.z-z, d=ex*ex+ez*ez; if(d<bd){bd=d;bk=k;} }
    if(bd>=(HALFW+0.8)*(HALFW+0.8)) continue;
    // the nearest sample is an end sample: reject points that lie beyond the end of the deck
    if(bk===0||bk===B.n-1){ const t=track[(B.i0+bk)%M], along=(x-t.x)*t.tx+(z-t.z)*t.tz; if(bk===0?along<-3:along>3) continue; }
    // an open bridge (London): B.leaf(a) is the deck height above B.top at a metres along the road from the bridge centre, or null over the gap
    if(B.leaf){ const t=track[(B.i0+bk)%M], h=B.leaf(wrapS(t.s-B.s)*TL+(x-t.x)*t.tx+(z-t.z)*t.tz); if(h===null) continue; return B.top+h; }
    return B.top; }
  return null; }
function hAtY(x,z,y){ const g=hAt(x,z), b=bridgeDeckAt(x,z); return (b!==null&&b>g&&y>b-1.2)?b:g; }
