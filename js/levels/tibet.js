'use strict';
// Level: Top of the World.
// ---------------- TOP OF THE WORLD (a thin ribbon of road cut into the flank of a Himalayan massif: cliff above, drop below, prayer flags, chortens, a dzong, yaks) ----------------
const TB_FLAG=[[.2,.4,.9],[.95,.95,.95],[.9,.15,.12],[.2,.65,.3],[.95,.8,.1]];            // the five colours of prayer flags: blue, white, red, green, yellow
// a string of prayer flags between two points at height y0 / y1: a sagging line with a flag every ~1.3 units
function prayerFlags(m,ax,ay,az,bx,by,bz,sag){
  const L=Math.hypot(bx-ax,bz-az), n=Math.max(2,Math.round(L/1.5)), P=k=>{ const t=k/n; return [lerp(ax,bx,t),lerp(ay,by,t)-sag*4*t*(1-t),lerp(az,bz,t)]; };
  for(let k=0;k<n;k++){ const p=P(k), q=P(k+1); m.prism(p[0],p[2],q[0],q[2],.04,p[1]-.04,p[1]+.04,[.8,.78,.74]);
    if(k%2===0){ const c=TB_FLAG[(k/2)%5|0], mx=(p[0]+q[0])/2, mz=(p[2]+q[2])/2, my=(p[1]+q[1])/2, dx=(q[0]-p[0])/Math.max(.01,Math.hypot(q[0]-p[0],q[2]-p[2])), dz=(q[2]-p[2])/Math.max(.01,Math.hypot(q[0]-p[0],q[2]-p[2]));
      m.quad([mx-dx*.55,my-.04,mz-dz*.55],[mx+dx*.55,my-.04,mz+dz*.55],[mx+dx*.55,my-.95,mz+dz*.55],[mx-dx*.55,my-.95,mz-dz*.55],c,[mx,my+3,mz]); } } }
// a chorten (stupa): stepped white base, bell, golden spire
function chorten(m,x,z,s){ const y=hAt(x,z)-.4; m.box(x,y+.6*s,z,4*s,1.2*s,4*s,[.94,.94,.9]); m.box(x,y+1.6*s,z,3.2*s,1*s,3.2*s,[.92,.92,.88]); dome(m,x,y+2.1*s,z,1.9*s,[.96,.96,.94],10,4);
  m.box(x,y+4.4*s,z,.5*s,.8*s,.5*s,[.85,.1,.1]); frustum(m,x,y+4.8*s,z,.9*s,.15*s,2.4*s,8,[.9,.72,.2],[.95,.8,.3]); m.box(x,y+2.3*s,z+1.9*s,1*s,.7*s,.1,[.15,.15,.6]); colliders.push([x,z,2.3*s]); }
// a Tibetan house or hall: whitewashed, tapering walls, flat roof with a dark band, a few dark trapezoid windows
function tibetHouse(m,rnd,x,z,w,d,h){
  const f=footprint(x-w/2,z-d/2,x+w/2,z+d/2), y=f[0]-1; m.box(x,y+(h+1)/2,z,w,h+1,d,[.93,.92,.88]); m.box(x,y+h+1.25,z,w+.4,.5,d+.4,[.55,.15,.12]); m.box(x,y+h+1.7,z,w*.7,.4,d*.7,[.4,.1,.08]);
  for(let k=0;k<Math.floor(w/3);k++){ const wx=x+(k-(Math.floor(w/3)-1)/2)*3; vQuad(m,wx-.6,z+d/2+.05,wx+.6,z+d/2+.05,y+h*.45,y+h*.45+1.8,[.12,.1,.1]); }
  rects.push([x,z,w/2+.5,d/2+.5]); }
// the dzong: a fortress-monastery of stacked whitewashed tiers with a red palace and golden roofs on top (Potala-like), built into the hillside
function dzong(m,x,z,s){
  const y=footprint(x-34*s,z-14*s,x+34*s,z+14*s)[0]-3; let yy=y;
  // each tier is its own box, as tall as that tier: built into the hillside, the lower ones are buried behind, where a car drives over them
  const R=(cx,hx,hz,y0,y1)=>{ const r=[cx,z,hx,hz]; r.y0=y0; r.y1=y1; r.fix=true; rects.push(r); };
  for(const [w,d,h] of [[70,28,16],[60,24,14],[50,20,12],[40,16,10]]){ frustum4(m,x,yy,z,w*s,d*s,h*s,[.95,.94,.9]); R(x,w*s/2+.5,d*s/2+.5,yy,yy+h*s); for(let k=-2;k<=2;k++) vQuad(m,x+k*w*s*.16,z+d*s/2+.1,x+k*w*s*.16+1.1*s,z+d*s/2+.1,yy+h*s*.3,yy+h*s*.7,[.14,.12,.12]); yy+=h*s; }
  frustum4(m,x,yy,z,28*s,12*s,12*s,[.62,.12,.1]); m.box(x,yy+12.3*s,z,30*s,.8*s,14*s,[.9,.72,.2]); gable(m,x-15*s,z-7*s,x+15*s,z+7*s,yy+12.6*s,3*s,[.92,.74,.2],true,[.85,.65,.15]);
  for(const k of [-1,1]){ m.box(x+k*22*s,yy+4*s,z,10*s,8*s,10*s,[.96,.95,.92]); m.box(x+k*22*s,yy+8.4*s,z,11*s,.8*s,11*s,[.55,.15,.12]); R(x+k*22*s,5.5*s+.5,5.5*s+.5,yy,yy+8.8*s); }
  R(x,15*s+.5,7*s+.5,yy,yy+15.6*s); }
function frustum4(m,x,y,z,w,d,h,col){ m.box(x,y+h/2,z,w,h,d,col); }
function yak(m,x,z,yaw,s){
  const y=hAt(x,z), fx=Math.sin(yaw), fz=Math.cos(yaw), lx=fz, lz=-fx, dk=[.14,.1,.08], br=[.3,.2,.14];
  orBox(m,x,z,2.8*s,1.4*s,y+.9*s,y+2.1*s,yaw,dk); orBox(m,x,z,2.4*s,1.5*s,y+.45*s,y+1.1*s,yaw,br);                    // shaggy skirt
  orBox(m,x+fx*1.7*s,z+fz*1.7*s,.9*s,.8*s,y+1.2*s,y+2*s,yaw,dk); for(const sg of [-1,1]) m.box(x+fx*1.9*s+lx*sg*.5*s,y+2.2*s,z+fz*1.9*s+lz*sg*.5*s,.15*s,.5*s,.15*s,[.85,.82,.7]);
  for(const a of [-.9,.9]) for(const sg of [-1,1]) m.box(x+fx*a*s+lx*sg*.45*s,y+.3*s,z+fz*a*s+lz*sg*.45*s,.25*s,.6*s,.25*s,dk);
  colliders.push([x,z,1.4*s]); }
function cairn(m,x,z){ const y=hAt(x,z); m.box(x,y+.3,z,1.4,.6,1.2,[.5,.47,.42]); m.box(x+.1,y+.85,z,1,.5,.9,[.55,.52,.46]); m.box(x,y+1.25,z-.1,.6,.4,.6,[.6,.57,.5]); }

LEVELS.tibet={
  id:'tibet', seed:307, name:'TOP OF THE WORLD', sub:'Don\'t look down!',
  loc:'Himalayas, Tibet', flag:'tibet',
  blurb:"It will take all your skills and patience to win a race through this ribbon of a road carved into the Himalayan mountains. Remember to check controls for returning to track!",
  tw:16,
  theme:{
    skyTop:[0.12,0.36,0.88], skyHor:[0.72,0.86,0.98], fog:[0.70,0.82,0.94], fogN:140, fogF:980,
    amb:[.52,.52,.56], hemi:[.26,.28,.34], sun:[.82,.76,.62], light:[.3,.85,.2], night:false, snow:false,
    body:{yaw:.4,y:.7,r:.045,col:[1,.98,.9]}, clouds:{col:[1,1,1],shade:[.82,.86,.95],amt:.8},
    road:[.31,.30,.32], roadAlt:[.27,.27,.30], roadEdge:[.78,.76,.7], rock:[.52,.46,.40], rockAlt:[.46,.42,.38], dark:[.34,.31,.3], grass:[.54,.52,.34], grassAlt:[.6,.56,.38], snow:[.95,.96,1], snowAlt:[.88,.9,.97], shore:[.7,.66,.5],
    water:[[.2,.66,.72],[.16,.6,.68]],
    dust:{road:[.62,.58,.5],off:[.55,.5,.42],ice:[.9,.95,1],a:.7,sz:.9},
    map:{bg:'rgba(70,74,84,0.95)',road:'#fff2d0',edge:'#14130f'}
  },
  phys:{gripRoad:6.2,gripOff:4.2,gripIce:2,dragRoad:.14,dragOff:.55,dragIce:.05,maxOff:.7},
  rim:120,
  hills(x,z){ const r=Math.hypot(x,z), peak=250*Math.exp(-Math.pow(r/225,2)), crag=(30*ridged(x*.012+4,z*.012)+12*ridged(x*.03,z*.03+9))*smooth(40,280,r)*(1-smooth(330,470,r)*.5), valley=(fbm(x*.004+11,z*.004)-.5)*50;
    return peak+crag+valley*(.3+.7*smooth(200,420,r)); },
  trackPts(){ const pts=[]; for(let i=0;i<M;i++){ const th=i/M*Math.PI*2, r=250+46*Math.sin(2*th+.3)+28*Math.sin(3*th+2)+16*Math.sin(5*th+1)+20*Math.sin(9*th)+11*Math.sin(13*th+2); pts.push([r*Math.cos(th),r*Math.sin(th)]); } return startNear(pts,200,150); },
  layout(){ return calmLayout([.05,.19,.33,.47,.61,.76,.91],[[.12,3.5,70],[.55,3.5,70]],.04,.07); },
  prepare(){
    const raw=new Float32Array(M); for(let i=0;i<M;i++) raw[i]=this.hills(track[i].x,track[i].z)*.85-2; this.prof=smoothArr(limitGrade(smoothArr(raw,9),.2),3);
    // a turquoise glacial lake in the valley outside the ring road
    const rnd=mulberry32(5150); let best=null; for(let n=0;n<300;n++){ const a=rnd()*6.28, r=330+rnd()*110, x=Math.cos(a)*r, z=Math.sin(a)*r, R=46+rnd()*40; if(Math.abs(x)>470||Math.abs(z)>470||nearestTrack(x,z).d<R+HALFW+34) continue; const h=this.hills(x,z); if(!best||h<best.h) best={x,z,R,h}; }
    if(best) RIVERS.push(makeLake('lake',best.x,best.z,best.R,best.h-1.5)); },
  profile(s){ return arrProfile(this.prof,s)+jumpsSum(s); },
  base(x,z,th,d){ const far=smooth(HALFW+1.5,34,d); return th*(1-far)+this.hills(x,z)*far; },
  shape(x,z,h,d,s,k){ h=riverShape(x,z,h,d,s,k,h,60);
    // the valley noise carved a gully between the road and the mountain just after the first gate: fill it up to the road level (mountain side only)
    const w=smooth(.012,.03,s)*(1-smooth(.065,.09,s));
    if(w>0&&d<48){ const t=track[trackIndexAt(s)]; if(Math.hypot(x,z)<Math.hypot(t.x,t.z)) h=Math.max(h,lerp(h,trackHeight(s)-1.5,w*(1-smooth(30,48,d)))); }
    return h; },
  iceAt(){ return false; },
  color(c){
    const T=THEME;
    if(c.d<HALFW){
      if(c.s<0.0035||c.s>0.9985) return [.95,.95,.95];
      if(c.d>HALFW-1.6) return T.roadEdge;
      return vnoise(c.cx*.25,c.cz*.25)>.5?T.road:T.roadAlt; }
    if(c.rn<0.85) return T.bed||[.3,.5,.55];
    if(c.rn<1.4) return T.shore;
    if(c.hy>165) return c.ny>.7?(vnoise(c.cx*.1,c.cz*.1)>.5?T.snow:T.snowAlt):T.dark;
    if(c.ny<.78) return vnoise(c.cx*.14,c.cz*.14)>.5?T.rock:T.dark;
    const n=vnoise(c.cx*.04+3,c.cz*.04);
    if(c.hy>110&&n>.4) return T.snowAlt;
    return n>.55?T.grass:n>.35?T.grassAlt:(vnoise(c.cx*.12,c.cz*.12)>.5?T.rock:T.rockAlt); },
  decor(m,rnd){
    const free=(x,z,r)=>roadDist(x,z)>HALFW+r+3&&waterDist(x,z)>r+6, gateNear=(x,z,r)=>GATES.some(g=>Math.hypot(g.x-x,g.z-z)<r);
    // prayer flags: strings across the road on poles, and long strings along the verge
    for(let i=12;i<M;i+=34){ const t=track[i]; if(bendAt(i)>.014||gateNear(t.x,t.z,26)||JUMPS.some(j=>{ const d=((t.s-j[0]+1.5)%1)-.5; return d>-.04&&d<.09; })) continue;
      const a=roadside(i,1,1.2), b=roadside(i,-1,1.2), ya=hAt(a[0],a[1]), yb=hAt(b[0],b[1]), top=Math.max(ya,yb,hAt(t.x,t.z))+8.5;
      for(const [p,yv] of [[a,ya],[b,yb]]){ m.box(p[0],(yv+top)/2-.3,p[1],.35,top-yv+.6,.35,[.5,.36,.24]); colliders.push([p[0],p[1],.5]); }
      prayerFlags(m,a[0],top-.2,a[1],b[0],top-.2,b[1],1.1); }
    for(let i=0;i<M;i+=16){ const sg=((i/16)|0)&1?1:-1, a=roadside(i,sg,2.2), b=roadside(i+14,sg,2.2); if(bendAt(i)>.02||gateNear(a[0],a[1],20)||roadDist(a[0],a[1])<HALFW+1) continue;
      m.box(a[0],hAt(a[0],a[1])+1.6,a[1],.22,3.2,.22,[.5,.36,.24]); m.box(b[0],hAt(b[0],b[1])+1.6,b[1],.22,3.2,.22,[.5,.36,.24]); prayerFlags(m,a[0],hAt(a[0],a[1])+3.1,a[1],b[0],hAt(b[0],b[1])+3.1,b[1],.9); }
    // chortens beside the road, cairns along the drop, a few trucks pulled over
    for(let i=20;i<M;i+=90){ const sg=((i/90)|0)&1?1:-1, [x,z]=roadside(i,sg,5+rnd()*5); if(free(x,z,3)&&!gateNear(x,z,24)&&bendAt(i)>=0) chorten(m,x,z,.9+rnd()*.5); }
    for(let i=0;i<M;i+=9){ const t=track[i], sg=1, [x,z]=roadside(i,sg,.9); const [x2,z2]=roadside(i,-1,.9); if(gateNear(x,z,16)) continue; const outer=hAt(x,z)<hAt(x2,z2)?[x,z]:[x2,z2]; cairn(m,outer[0],outer[1]); }
    for(let i=40;i<M;i+=110){ const sg=rnd()<.5?-1:1, [x,z]=roadside(i,sg,8), t=track[i]; if(bendAt(i)>.012||gateNear(x,z,28)||roadDist(x,z)<HALFW+7) continue; semiTruck(m,x,hAt(x,z),z,Math.atan2(t.tx,t.tz),[.15,.4,.7],[.88,.82,.6]); { const fx=t.tx/Math.hypot(t.tx,t.tz), fz=t.tz/Math.hypot(t.tx,t.tz); wallRun([[x-fx*7.8,z-fz*7.8],[x+fx*9.2,z+fz*9.2]],1.3); } }   // (the truck's own length and width)
    // villages: clusters of whitewashed houses on the flat ground beside the road, the dzong on its hill
    for(let k=0;k<7;k++){ const i=((rnd()*M)|0), sg=rnd()<.5?-1:1, [cx,cz]=roadside(i,sg,26+rnd()*30); if(!free(cx,cz,12)||gateNear(cx,cz,34)||!flatAt(cx,cz,3.5)) continue;
      for(let q=0;q<5;q++){ const x=cx+(rnd()-.5)*34, z=cz+(rnd()-.5)*34, w=7+rnd()*5, d=6+rnd()*4; if(!free(x,z,8)||rects.some(r=>Math.abs(r[0]-x)<r[2]+w/2+2&&Math.abs(r[1]-z)<r[3]+d/2+2)) continue; tibetHouse(m,rnd,x,z,w,d,3.5+rnd()*2.5); } }
    { let placed=false;                                              // the dzong stands on a shoulder of the massif above the start straight, where every lap passes it
      for(let n=0;n<500&&!placed;n++){ const i=((rnd()-.5)*.3*M+M)%M|0, t=track[i], d=HALFW+40+rnd()*90, L=Math.hypot(t.x,t.z)||1, x=t.x-t.x/L*d+(rnd()-.5)*30, z=t.z-t.z/L*d+(rnd()-.5)*30;
        if(!free(x,z,36)||!flatAt(x,z,7)||hAt(x,z)>150) continue; dzong(m,x,z,.9); placed=true; } }
    // yaks on the slopes and on the road verge
    for(let k=0;k<20;k++){ const cx=(rnd()-.5)*800, cz=(rnd()-.5)*800; if(!free(cx,cz,8)||gateNear(cx,cz,24)||hAt(cx,cz)>150) continue; const a=rnd()*6.28; for(let q=0,n=2+((rnd()*3)|0);q<n;q++){ const x=cx+(rnd()-.5)*16, z=cz+(rnd()-.5)*16; if(free(x,z,2)) yak(m,x,z,a+(rnd()-.5),.9+rnd()*.3); } }
    // boulders and scree, and the white giants of the horizon
    for(let i=0,p=0;i<5000&&p<260;i++){ const x=(rnd()-.5)*960, z=(rnd()-.5)*960; if(!free(x,z,2)) continue; const s=.9+rnd()*rnd()*4; m.rock(x,hAt(x,z),z,s,[.5,.46,.42],rnd); if(s>1.4) colliders.push([x,z,s*.85]); p++; }
    for(let i=0;i<24;i++){ const a=i/24*Math.PI*2+rnd()*.15, s=170+rnd()*190, rad=s*.7, r=beyondPlayfield(a,rad)+rnd()*40, x=Math.cos(a)*r, z=Math.sin(a)*r; m.cone(x,-40,z,rad,s*1.7,7,[.4,.38,.38]); m.cone(x,s*.7,z,s*.36,s*.9,7,[.96,.97,1]); }
  },
  marks(m){ for(let i=0;i<M;i++){ if(i%10<5) markStrip(m,i,i+1,0,.14,[.9,.88,.8]); } },
  mapBg(g,X,Z,sc){ g.fillStyle='rgba(120,126,138,0.6)'; g.beginPath(); g.arc(X(0),Z(0),225*sc,0,7); g.fill(); g.fillStyle='rgba(235,238,248,0.6)'; g.beginPath(); g.arc(X(0),Z(0),110*sc,0,7); g.fill();
    for(const r of RIVERS) if(r.lake){ const q=r.p[0]; g.fillStyle='#3ab8c4'; g.beginPath(); g.arc(X(q.x),Z(q.z),q.w*sc,0,7); g.fill(); } }
};
