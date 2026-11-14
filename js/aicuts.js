'use strict';
// cutCorners (difficulty): opponents take shortcuts. For a level, cutLine(w) plans a line round the whole track from straight chords between two
// points of the road, each one clear of everything a car can hit, and returns how far that line sits from the road centre at every track sample,
// plus the speed the line allows there. stepAI only reads the two arrays, so the cost is one plan at the start of a race and nothing while racing.
// w (0..1) is how far the AI goes from the road centre towards that line; more is not faster, because its steering already cuts inside whatever it aims at. Tuned with ai_test_script.
const CUT_CELL=2, CUT_MARGIN=1.4;      // the blocked map's cell size, and the room kept on top of the car's own radius
const CUT_STEP=2.5;                    // metres between the points tested along a chord
const CUT_MIN=6, CUT_MAX=150, CUT_J=2; // chords span this many track samples, tried every CUT_J samples
const CUT_GRADE=.34;                   // steepest ground a chord may cross (a car stalls on more, and a drop launches it)
const CUT_OFF_DIST=11;                 // how far past the road edge a chord may go
const CUT_OFF_LEN=55;                  // the longest unbroken off-road run on a chord (metres), well inside what the AI's off-road rule punishes
const CUT_GATE=4;                      // a chord must pass a checkpoint this far past the road edge at most (the player's limit is 7)
const CUT_PENALTY=.12;                 // seconds a chord must save to be worth taking: leaving and rejoining the road costs something
const CUT_SMOOTH=7;                    // samples of smoothing where chords join the road
// how far the AI cuts and how hard it pushes both follow the room outside the bends (cutRoom): where a mistake only runs wide it takes the line, aims further ahead and may beat the road's
// bend speed; between walls it does none of that and drives as it would with cutCorners off. Without this rule a track of walled streets got slower and Machu Picchu's walls got hit
const CUT_TUNE={look:4,road:.15,from:0,to:4,ahead:45};   // extra lookahead samples, extra speed over the road's (fraction), room (m) that counts as none and as plenty, samples ahead that must have it
let cutBase=null, cutBaseLV=null;
const cutLines=new Map();

function cutBlocked(){
  const n=Math.ceil(2*HALF/CUT_CELL), g=new Uint8Array(n*n);
  const disc=(x,z,r)=>{ const a=Math.max(0,((x-r+HALF)/CUT_CELL)|0), b=Math.min(n-1,((x+r+HALF)/CUT_CELL)|0), c=Math.max(0,((z-r+HALF)/CUT_CELL)|0), d=Math.min(n-1,((z+r+HALF)/CUT_CELL)|0);
    for(let j=c;j<=d;j++) for(let i=a;i<=b;i++){ const px=(i+.5)*CUT_CELL-HALF, pz=(j+.5)*CUT_CELL-HALF; if((px-x)*(px-x)+(pz-z)*(pz-z)<=r*r) g[j*n+i]=1; } };
  const R=1.5+CUT_MARGIN+CUT_CELL*.7;   // (a cell's centre stands for the whole cell)
  const over=(s,x,z)=>s.y0!==undefined&&s.y0>hAt(x,z)+CAR_TOP;            // high enough to drive under (a wing, an overpass): no obstacle
  for(const c of colliders) if(!over(c,c[0],c[1])) disc(c[0],c[1],c[2]+R);
  for(const w of walls){ const l=Math.hypot(w[2]-w[0],w[3]-w[1]), k=Math.max(1,Math.ceil(l/CUT_CELL)); for(let q=0;q<=k;q++){ const x=lerp(w[0],w[2],q/k), z=lerp(w[1],w[3],q/k); if(!over(w,x,z)) disc(x,z,w[4]+R); } }
  for(const r of rects){ if(over(r,r[0],r[1])) continue; const hx=r[2]+R, hz=r[3]+R, a=Math.max(0,((r[0]-hx+HALF)/CUT_CELL)|0), b=Math.min(n-1,((r[0]+hx+HALF)/CUT_CELL)|0), c=Math.max(0,((r[1]-hz+HALF)/CUT_CELL)|0), d=Math.min(n-1,((r[1]+hz+HALF)/CUT_CELL)|0);
    for(let j=c;j<=d;j++) for(let i=a;i<=b;i++) g[j*n+i]=1; }
  for(const f of FX.fires) if(f.hurt) disc(f.x,f.z,(f.e?f.e[0]:f.r)+R+1);
  for(const p of FX.spots) disc(p[0],p[1],8+R);
  if(LV.lavaPools) for(const P of LV.lavaPools) disc(P.x,P.z,P.r+R);
  if(LV.obstacles) for(const o of LV.obstacles){ const t=track[(o[0]+M)%M]; for(let k=-3;k<=3;k++) disc(t.x+t.tz*o[1]+t.tx*k*3,t.z-t.tx*o[1]+t.tz*k*3,o[2]+R); }
  return {g,n};
}
// the track sample nearest to each point of a coarse map: says which stretch of road a point belongs to
function cutNearest(){
  const S=12, n=Math.ceil(2*HALF/S), a=new Int16Array(n*n);
  for(let j=0;j<n;j++) for(let i=0;i<n;i++){ const x=(i+.5)*S-HALF, z=(j+.5)*S-HALF; let b=1e18,bi=0; for(let k=0;k<M;k+=2){ const t=track[k], q=(t.x-x)*(t.x-x)+(t.z-z)*(t.z-z); if(q<b){ b=q; bi=k; } } a[j*n+i]=bi; }
  return {a,n,S};
}
function cutRoadY(i){ const k=(i+M)%M, t=track[k]; return TRACK_Y?TRACK_Y[k]:hAtY(t.x,t.z,hAt(t.x,t.z)+40); }
// the track sample nearest to (x,z), searched only from i0 for n samples
function cutNear(x,z,i0,n){ let b=1e18,bi=i0; for(let k=0;k<=n;k+=2){ const t=track[(i0+k)%M], q=(t.x-x)*(t.x-x)+(t.z-z)*(t.z-z); if(q<b){ b=q; bi=(i0+k)%M; } } return {i:bi,d:Math.sqrt(b)}; }
// walks a list of points from track sample i0 to i0+n: can a car drive it? Returns the metres on and off the road and the height at the end, or null when it cannot
function cutWalk(B,pts,i0,n,y0){
  const lim=HALF-10, c=cutBase.near; let y=y0,on=0,off=0,run=0,px=null,pz=0;
  for(let k=0;k<pts.length;k+=2){ const x=pts[k], z=pts[k+1]; if(Math.abs(x)>lim||Math.abs(z)>lim||B.g[(((z+HALF)/CUT_CELL)|0)*B.n+(((x+HALF)/CUT_CELL)|0)]) return null; }   // (the cheap test first: it ends most chords)
  for(let k=0;k<pts.length;k+=2){ const x=pts[k], z=pts[k+1];
    const ds=px===null?0:Math.hypot(x-px,z-pz), h=hAtY(x,z,y);
    if(ds>0&&Math.abs(h-y)>ds*CUT_GRADE+.3) return null;
    const a=c.a[clamp(((z+HALF)/c.S)|0,0,c.n-1)*c.n+clamp(((x+HALF)/c.S)|0,0,c.n-1)], rel=((a-i0)%M+M)%M;
    if(rel>n+10&&rel<M-10) return null;                                                 // nearer some other stretch of road: this line would skip a leg
    const nt=cutNear(x,z,(i0-6+M)%M,n+12), road=nt.d<HALFW+.5||(LV.pavedAt?LV.pavedAt(x,z):false);
    if(road){ run=0; on+=ds; }
    else { if(nt.d>HALFW+CUT_OFF_DIST) return null; run+=ds; off+=ds; if(run>CUT_OFF_LEN) return null;
      if(LV.softAt&&LV.softAt(x,z,false,nt)>.3) return null;
      if(LV.iceAt(x,z,nt)) return null;
      if(LV.shockAt&&LV.shockAt({x,z,y:h,trackD:nt.d})) return null;
      if(inRiver(x,z,h)||inLava(x,z,h)) return null; }
    y=h; px=x; pz=z; }
  return {on,off,y};
}
function cutChord(B,i,j,spm){                                                           // i..j in unwrapped samples
  const a=track[i%M], b=track[j%M], len=Math.hypot(b.x-a.x,b.z-a.z);
  if(len<8||len>(j-i)*spm) return null;
  const ya=cutRoadY(i), yb=cutRoadY(j); if(Math.abs(yb-ya)>len*CUT_GRADE) return null;
  for(const J of JUMPS){ const q=((idxOfS(((J[0]%1)+1)%1)-i%M)%M+M)%M; if(q<(j-i)+25||q>M-25) return null; }   // ramps are driven, never skirted
  const ux=(b.x-a.x)/len, uz=(b.z-a.z)/len;
  for(const G of GATES){ const q=((G.i-i%M)%M+M)%M; if(q>0&&q<j-i){ const l=(G.x-a.x)*ux+(G.z-a.z)*uz; if(Math.hypot(a.x+ux*l-G.x,a.z+uz*l-G.z)>HALFW+CUT_GATE) return null; } }
  const k=Math.max(2,Math.ceil(len/CUT_STEP)), pts=new Float32Array((k+1)*2);
  for(let q=0;q<=k;q++){ pts[q*2]=lerp(a.x,b.x,q/k); pts[q*2+1]=lerp(a.z,b.z,q/k); }
  const r=cutWalk(B,pts,i%M,j-i,ya); if(!r||Math.abs(r.y-yb)>2) return null;            // (a different height at the end: another level of the road)
  return {len,on:r.on,off:r.off};
}
// the speed allowed along a path given at every track sample: cornerProfile's method on the path itself
function cutSpeeds(px,pz){
  const v=new Float32Array(M), sg=new Float32Array(M);
  for(let i=0;i<M;i++){ const j=(i+1)%M; sg[i]=Math.hypot(px[j]-px[i],pz[j]-pz[i]); }
  const hd=i=>{ const a=(i+M)%M, b=(a+1)%M; return Math.atan2(px[b]-px[a],pz[b]-pz[a]); };
  for(let i=0;i<M;i++){ let L=0; for(let k=-3;k<3;k++) L+=sg[(i+k+M)%M]; const R=L/Math.max(Math.abs(angDiff(hd(i+2),hd(i-3))),1e-4); v[i]=Math.min(90,20*(Math.sqrt(1+4*2.1*R/40)-1)); }
  for(let p=0;p<3;p++) for(let i=M*2-1;i>=0;i--){ const a=i%M, b=(i+1)%M; v[a]=Math.min(v[a],Math.sqrt(v[b]*v[b]+2*30*sg[a])); }
  return v;
}
// the chords of a whole lap: the fastest way round by dynamic programming, each step being one sample of road or one chord
function cutPlan(){
  if(cutBaseLV===LV&&cutBase.TL===TL) return cutBase;
  cutBase={TL,near:cutNearest(),chords:[]}; const B=cutBlocked(); cutBase.B=B; cutBaseLV=LV; cutLines.clear();
  const spm=TL/M, road=cornerSpeeds(), vOn=44, vOff=44*Math.min(LV.phys.maxOff,.85);
  let st=0; for(let i=0;i<M;i++) if(road[i]>road[st]) st=i;                             // the lap starts on the fastest part of the road, where no chord needs to cross the seam
  const T=new Float64Array(M+1).fill(1e18), from=new Int32Array(M+1).fill(-1); T[0]=0;
  for(let a=0;a<M;a++){ if(T[a]>=1e18) continue;
    const t=T[a]+spm/Math.min(road[(st+a)%M],vOn); if(t<T[a+1]){ T[a+1]=t; from[a+1]=a; }
    for(let n=CUT_MIN;n<=CUT_MAX&&a+n<=M;n+=CUT_J){ const c=cutChord(B,st+a,st+a+n,spm); if(!c) continue;
      const t2=T[a]+c.on/vOn+c.off/vOff+CUT_PENALTY; if(t2<T[a+n]){ T[a+n]=t2; from[a+n]=a; } } }
  for(let b=M;b>0;){ const a=from[b]; if(a<0) break; if(b-a>1) cutBase.chords.push([(st+a)%M,b-a]); b=a; }
  cutBase.chords.reverse(); return cutBase;
}
// the offset from the road centre of chord c at sample offset q along it
function cutChordLat(c,q){
  const t=track[(c[0]+q)%M], a=track[c[0]], b=track[(c[0]+c[1])%M], ex=b.x-a.x, ez=b.z-a.z, nx=t.tz, nz=-t.tx, den=ex*nz-ez*nx;
  return Math.abs(den)<1e-6?0:(ex*(t.z-a.z)-ez*(t.x-a.x))/den; }
// the room to run wide, 0..1 at each sample: the free ground on the outside of every bend over the next stretch of road (the inside does not matter: nobody slides that way)
function cutRoom(B){
  const free=[new Float32Array(M),new Float32Array(M)], out=new Float32Array(M), hd=i=>{ const t=track[(i+M)%M]; return Math.atan2(t.tx,t.tz); };
  for(let i=0;i<M;i++){ const t=track[i];
    for(let e=0;e<2;e++){ const sd=e*2-1; let d=0; for(;d<CUT_TUNE.to+2;d+=1){ const x=t.x+t.tz*sd*(HALFW+d), z=t.z-t.tx*sd*(HALFW+d); if(Math.abs(x)>=HALF-1||Math.abs(z)>=HALF-1||B.g[(((z+HALF)/CUT_CELL)|0)*B.n+(((x+HALF)/CUT_CELL)|0)]) break; } free[e][i]=d; } }
  for(let i=0;i<M;i++){ let m=99;
    for(let k=0;k<CUT_TUNE.ahead;k+=3){ const j=i+k, turn=angDiff(hd(j+4),hd(j-4)); if(Math.abs(turn)>.1) m=Math.min(m,free[turn>0?0:1][j%M]); }
    out[i]=smooth(CUT_TUNE.from,CUT_TUNE.to,m); }
  return out;
}
// the line at w: the chords' offsets, smoothed where they meet the road, then tested again as a whole (a chord that fails is pulled in, and dropped if it still fails)
function cutLine(w){
  const base=cutPlan(); let L=cutLines.get(w); if(L) return L;
  const scale=base.chords.map(()=>1), px=new Float32Array(M), pz=new Float32Array(M), road=cornerSpeeds(), room=cutRoom(base.B), ease=smoothArr(room,CUT_SMOOTH); let lat=null;
  for(let round=0;round<6;round++){
    const raw=new Float32Array(M);
    base.chords.forEach((c,k)=>{ for(let q=0;q<=c[1];q++) { const i=(c[0]+q)%M; raw[i]=cutChordLat(c,q)*scale[k]*w*ease[i]; } });
    lat=smoothArr(smoothArr(raw,CUT_SMOOTH),CUT_SMOOTH);
    for(let i=0;i<M;i++){ const t=track[i]; px[i]=t.x+t.tz*lat[i]; pz[i]=t.z-t.tx*lat[i]; }
    let bad=false;
    base.chords.forEach((c,k)=>{ if(scale[k]===0) return;
      const n=c[1]+2*CUT_SMOOTH, i0=(c[0]-CUT_SMOOTH+M)%M, pts=new Float32Array((n+1)*2);
      for(let q=0;q<=n;q++){ const i=(i0+q)%M; pts[q*2]=px[i]; pts[q*2+1]=pz[i]; }
      if(!cutWalk(base.B,pts,i0,n,cutRoadY(i0))){ bad=true; scale[k]=round>=4?0:scale[k]*.65; } });
    if(!bad) break; }
  const v=cutSpeeds(px,pz); for(let i=0;i<M;i++) v[i]=Math.min(v[i],road[i]*(1+CUT_TUNE.road*room[i]));
  L={lat,v,room}; cutLines.set(w,L); return L;
}
