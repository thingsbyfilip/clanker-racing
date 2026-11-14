// runs inside the game's global scope
var PROBE={};
const _stepCar=stepCar;
function gradeOf(c){ const v=Math.hypot(c.vx,c.vz)||1; return c.grounded?-(c.nx*c.vx+c.nz*c.vz)/(c.ny*v):0; }
function trackStats(){
  const spm=TL/M, cp=cornerProfile(1), gr=[]; let up=0,dn=0,fl=0,climb=0,sum=0,slow=0,minV=1e9;
  const N=M; let sharp=0;
  for(let i=0;i<N;i++){ const a=track[i], b=track[(i+4)%N], y0=TRACK_H(i), y1=TRACK_H((i+4)%N), g=(y1-y0)/(4*spm); gr.push(g);
    if(g>.04) up++; else if(g<-.04) dn++; else fl++; if(y1>y0) climb+=(y1-y0)/4; sum+=Math.abs(g); if(cp[i]<45) slow++; minV=Math.min(minV,cp[i]); }
  let gmax=0; for(const g of gr) gmax=Math.max(gmax,Math.abs(g));
  return {TL:Math.round(TL),tw:TW,up:+(up/N).toFixed(2),down:+(dn/N).toFixed(2),flat:+(fl/N).toFixed(2),climbPerLap:Math.round(climb),meanAbsGrade:+(sum/N).toFixed(3),maxGrade:+gmax.toFixed(3),cornerCappedShare:+(slow/N).toFixed(2),minCornerV:Math.round(minV),gates:GATES.length,jumps:JUMPS.length,phys:LV.phys};
}
function TRACK_H(i){ const t=track[i]; return t.y!==undefined?t.y:hAtY(t.x,t.z,1e4); }

// race with telemetry. o: {bot:'expert'|'pursuit', kc, pace, nitro, maxSec, tweak:{...DIFF fields}, noColl}
function probeRace(o){
  o=o||{}; const lvl=o.level; const save=Object.assign({},DIFF);
  if(o.tweak) Object.assign(DIFF,o.tweak);
  loadLevel(lvl); startRace(); race.countdown=.01;
  const prof=cornerProfile(o.kc||1.15), pace=o.pace||52;
  const tel={ctl:{full:0,nitro:0,cruiseCap:0,cornerCap:0,brake:0,air:0}, bins:{up:[0,0],flat:[0,0],down:[0,0]}, pbins:{up:[0,0],flat:[0,0],down:[0,0]}, vmul:0,vn:0,off:0,wall:0};
  stepCar=function(dt,ctl,cr){ cr=cr||car;
    const sp=Math.hypot(cr.vx,cr.vz), g=gradeOf(cr), b=g>.04?'up':g<-.04?'down':'flat';
    if(cr===car){ if(race.state==='race'&&!(race.state==='finished')){ tel.pbins[b][0]+=dt; tel.pbins[b][1]+=sp*dt; } }
    else if(race.state==='race'&&!cr.fin&&race.t>=DIFF.startDelay&&cr.wreckT<=0){
      tel.bins[b][0]+=dt; tel.bins[b][1]+=sp*dt; tel.vmul+=cr.vmul; tel.vn++; if(!cr.onTrack) tel.off+=dt;
      const vb=cornerSpeeds()[(cr.idx+2)%M]*DIFF.cornering;
      if(!cr.grounded) tel.ctl.air+=dt; else if(ctl.brk) tel.ctl.brake+=dt; else if(ctl.nitro&&ctl.thr) tel.ctl.nitro+=dt; else if(ctl.thr) tel.ctl.full+=dt; else if(sp>=vb*1.02) tel.ctl.cornerCap+=dt; else tel.ctl.cruiseCap+=dt;
    }
    return _stepCar(dt,ctl,cr);
  };
  race.state='race'; race.t=0; const maxN=(o.maxSec||360)*60; let wrecks=0;
  for(let n=0;n<maxN;n++){
    if(race.state==='finished'&&AIS.every(a=>a.fin)) break;
    if(race.t>(race.finishT||0)+60&&race.state==='finished') break;
    const sp=Math.hypot(car.vx,car.vz), t=track[(car.idx+12+Math.round(sp*0.1))%M], dd=angDiff(Math.atan2(t.x-car.x,t.z-car.z),car.yaw);
    let ctl;
    if(race.state==='finished') ctl={thr:0,brk:1,steer:0,hb:false,nitro:false,halt:true};
    else if(o.bot==='expert'){ const vt=prof[(car.idx+3)%M], go=!!o.nitro&&car.grounded&&car.onTrack&&car.nitro>0.3&&clearRun(car,sp);
      ctl={thr:sp<vt*1.02&&sp<pace||sp<20?1:0,brk:sp>vt*1.08?1:0,steer:clamp(-dd*2.5,-1,1),hb:false,nitro:go}; }
    else ctl={thr:sp<pace?1:0,brk:(sp>38&&Math.abs(dd)>0.35)?1:0,steer:clamp(-dd*2.5,-1,1),hb:false,nitro:false};
    stepCar(1/60,ctl); stepAI(1/60); updateRace(1/60); if(race.state==='finished') race.t+=1/60;
    for(const e of car.events) if(e.t==='wreck') wrecks++; car.events.length=0;
  }
  stepCar=_stepCar; Object.assign(DIFF,save);
  const tot=Object.values(tel.ctl).reduce((a,b)=>a+b,0)||1, pct={}; for(const k in tel.ctl) pct[k]=Math.round(100*tel.ctl[k]/tot);
  const mean=b=>{ const r={}; for(const k in b) r[k]=[Math.round(b[k][0]),b[k][0]?+(b[k][1]/b[k][0]).toFixed(1):0]; return r; };
  return {place:race.state==='finished'?race.place:rank(),time:race.state==='finished'?+race.finishT.toFixed(1):null,wrecks,dmg:+car.damage.toFixed(2),
    ai:AIS.map(a=>a.fin?+a.finT.toFixed(1):null),aiResp:AIS.map(a=>a.resp),ctl:pct,aiBins:mean(tel.bins),pBins:mean(tel.pbins),vmul:+(tel.vmul/Math.max(1,tel.vn)).toFixed(3),aiOff:+(tel.off/5).toFixed(1)};
}

// AI only: the player is frozen and non-colliding. Returns the mean AI finish time and the share of time per control state.
function aiOnly(lvl,tweak){
  const save=Object.assign({},DIFF); Object.assign(DIFF,tweak||{});
  loadLevel(lvl); startRace(); race.countdown=.01; race.state='race'; race.t=0; car.wreckT=1e9;
  const c0={full:0,nitro:0,cruiseCap:0,cornerCap:0,brake:0,air:0}, b={up:[0,0],flat:[0,0],down:[0,0]}; let off=0;
  stepCar=function(dt,ctl,cr){ cr=cr||car; if(cr!==car&&!cr.fin&&cr.wreckT<=0&&race.t>=DIFF.startDelay){ const sp=Math.hypot(cr.vx,cr.vz), g=gradeOf(cr), k=g>.04?'up':g<-.04?'down':'flat'; b[k][0]+=dt; b[k][1]+=sp*dt; if(!cr.onTrack) off+=dt;
      const vb=cornerSpeeds()[(cr.idx+2)%M]*DIFF.cornering; if(!cr.grounded) c0.air+=dt; else if(ctl.brk) c0.brake+=dt; else if(ctl.nitro&&ctl.thr) c0.nitro+=dt; else if(ctl.thr) c0.full+=dt; else if(DIFF.cornering>0&&sp>=vb*1.02) c0.cornerCap+=dt; else c0.cruiseCap+=dt; }
    return _stepCar(dt,ctl,cr); };
  for(let n=0;n<420*60&&!AIS.every(a=>a.fin);n++){ stepCar(1/60,{thr:0,brk:0,steer:0,hb:false,nitro:false}); stepAI(1/60); race.t+=1/60; }
  stepCar=_stepCar; Object.assign(DIFF,save);
  const t=AIS.map(a=>a.fin?a.finT:420), tot=Object.values(c0).reduce((x,y)=>x+y,0), pct={}; for(const k in c0) pct[k]=Math.round(100*c0[k]/tot);
  const ms={}; for(const k in b) ms[k]=b[k][0]?+(b[k][1]/b[k][0]).toFixed(1):0;
  return {mean:+(t.reduce((x,y)=>x+y,0)/5).toFixed(1),best:+Math.min(...t).toFixed(1),resp:AIS.reduce((x,a)=>x+a.resp,0),off:+(off/5).toFixed(1),ctl:pct,sp:ms};
}
// the player alone on the road (no opponents), driven by a bot. kc scales its corner speeds.
function solo(lvl,o){
  loadLevel(lvl); startRace(); AIS.length=0; race.countdown=.01; race.state='race'; race.t=0;
  const prof=cornerProfile(o.kc||1.15), pace=o.pace||60; let hits=0,off=0,wr=0;
  for(let n=0;n<420*60&&race.state!=='finished';n++){
    const sp=Math.hypot(car.vx,car.vz), t=track[(car.idx+12+Math.round(sp*0.1))%M], dd=angDiff(Math.atan2(t.x-car.x,t.z-car.z),car.yaw), vt=prof[(car.idx+3)%M], go=!!o.nitro&&car.grounded&&car.onTrack&&car.nitro>0.3&&clearRun(car,sp);
    stepCar(1/60,{thr:(sp<vt*1.02&&sp<pace)||sp<20?1:0,brk:sp>vt*1.08?1:0,steer:clamp(-dd*2.5,-1,1),hb:false,nitro:go}); updateRace(1/60);
    for(const e of car.events){ if(e.t==='hit') hits++; if(e.t==='wreck') wr++; } car.events.length=0; if(!car.onTrack) off+=1/60; }
  return {time:race.state==='finished'?+race.finishT.toFixed(1):null,hits,wrecks:wr,offT:+off.toFixed(1),dmg:+car.damage.toFixed(2)};
}

function soloHits(lvl,kc){
  loadLevel(lvl); startRace(); AIS.length=0; race.countdown=.01; race.state='race'; race.t=0;
  const prof=cornerProfile(kc), out=[]; let pv=0;
  for(let n=0;n<420*60&&race.state!=='finished';n++){
    const sp=Math.hypot(car.vx,car.vz), t=track[(car.idx+12+Math.round(sp*0.1))%M], dd=angDiff(Math.atan2(t.x-car.x,t.z-car.z),car.yaw), vt=prof[(car.idx+3)%M];
    stepCar(1/60,{thr:(sp<vt*1.02&&sp<60)||sp<20?1:0,brk:sp>vt*1.08?1:0,steer:clamp(-dd*2.5,-1,1),hb:false,nitro:false}); updateRace(1/60);
    for(const e of car.events) if(e.t==='hit') out.push({lap:race.lap,i:car.idx,s:+track[car.idx].s.toFixed(3),v:+e.v.toFixed(0),before:Math.round(pv),after:Math.round(Math.hypot(car.vx,car.vz)),off:+car.trackD.toFixed(1),grade:+gradeOf(car).toFixed(2),target:Math.round(vt)}); car.events.length=0; pv=sp; }
  const near=[]; 
  return {hits:out,colliders:colliders.length,walls:walls.length,rects:rects.length,HALFW};
}
// lap-by-lap entry speed vs profile by bend class: does the car hold the road at the profile speed, per grade
function bendProfile(lvl){ loadLevel(lvl); const cp=cornerProfile(1), spm=TL/M, r=[]; let inB=false,st=0;
  for(let i=0;i<M;i++){ const slow=cp[i]<40; if(slow&&!inB){inB=true;st=i;} if(!slow&&inB){inB=false; let mn=1e9,mi=st; for(let j=st;j<i;j++) if(cp[j]<mn){mn=cp[j];mi=j;} const g=(TRACK_H((mi+8)%M)-TRACK_H((mi-8+M)%M))/(16*spm); r.push([mi,Math.round(mn),+g.toFixed(2)]); } }
  return r; }

// ---- scenario 1: off-road. Bot held at a lateral offset (off-road when beyond HALFW) on a car with a chosen offMul
function offLine(lvl,lat,offMul,lim){
  loadLevel(lvl); startRace(); AIS.length=0; race.countdown=.01; race.state='race'; race.t=0; car.offMul=offMul; const prof=cornerProfile(1); let hits=0,offT=0,dist=0,wr=0,d0=0,upT=0,upV=0,upOff=0;
  const N=(lim||300)*60; let n=0, startIdx=car.idx, passed=0, last=car.idx;
  for(;n<N;n++){ const sp=Math.hypot(car.vx,car.vz), t=track[(car.idx+12+Math.round(sp*.1))%M], l=lat, tx=t.x+t.tz*l, tz=t.z-t.tx*l, dd=angDiff(Math.atan2(tx-car.x,tz-car.z),car.yaw), vt=prof[(car.idx+3)%M];
    stepCar(1/60,{thr:sp<vt*1.02||sp<20?1:0,brk:sp>vt*1.08?1:0,steer:clamp(-dd*2.5,-1,1),hb:false,nitro:false});
    let di=car.idx-last; if(di<-M/2) di+=M; if(di>M/2) di-=M; passed+=di; last=car.idx;
    for(const e of car.events){ if(e.t==='hit') hits++; if(e.t==='wreck') wr++; } car.events.length=0; if(!car.onTrack) offT+=1/60; if(passed>=M) {n++;break;} }
  car.offMul=undefined; return {t:+(n/60).toFixed(1),laps:+(passed/M).toFixed(2),offShare:+(offT/(n/60)).toFixed(2),hits,wr};
}
// off-road time of the AI by grade, and how far the AI really drives per lap
function aiRoute(lvl,tweak){
  const save=Object.assign({},DIFF); Object.assign(DIFF,{behindBoost:0,aheadSlow:0,aggression:0},tweak||{});
  loadLevel(lvl); startRace(); race.countdown=.01; race.state='race'; race.t=0; car.wreckT=1e9;
  const off={up:0,flat:0,down:0}, all={up:0,flat:0,down:0}; let dist=0,latSum=0,latN=0,inner=0,outer=0,offIn=0,offOut=0;
  for(let n=0;n<420*60&&!AIS.every(a=>a.fin);n++){ for(const a of AIS) a._p=[a.x,a.z]; stepCar(1/60,{thr:0,brk:0,steer:0,hb:false,nitro:false}); stepAI(1/60); race.t+=1/60;
    for(const a of AIS){ if(a.fin) continue; dist+=Math.hypot(a.x-a._p[0],a.z-a._p[1]); const g=gradeOf(a), k=g>.04?'up':g<-.04?'down':'flat'; all[k]++; if(!a.onTrack){ off[k]++;
        const t=track[a.idx], b=track[(a.idx+10)%M], turn=angDiff(Math.atan2(b.tx,b.tz),Math.atan2(t.tx,t.tz)), lat=(a.x-t.x)*t.tz-(a.z-t.z)*t.tx; if(turn*lat>0) offIn++; else offOut++; } 
      const t=track[a.idx]; latSum+=Math.abs((a.x-t.x)*t.tz-(a.z-t.z)*t.tx); latN++; } }
  Object.assign(DIFF,save);
  const r={}; for(const k in off) r[k]=+(100*off[k]/Math.max(1,all[k])).toFixed(1);
  return {offPctByGrade:r,distPerLap:Math.round(dist/15),TL:Math.round(TL),ratio:+(dist/15/TL).toFixed(3),meanAbsLat:+(latSum/latN).toFixed(1),offInsideBend:+(offIn/Math.max(1,offIn+offOut)).toFixed(2)};
}

// ---- scenario 3: nitro. Tank use, bursts and what blocks a burst while the tank is ready
function nitroUse(lvl){
  loadLevel(lvl); startRace(); race.countdown=.01; race.state='race'; race.t=0; car.wreckT=1e9;
  const save=Object.assign({},DIFF); Object.assign(DIFF,{behindBoost:0,aheadSlow:0,aggression:0});
  let on=0,bursts=0,ready=0; const why={bend:0,jump:0,obstacle:0,offroad:0,air:0,finalBan:0,clear:0}; const was=AIS.map(()=>false);
  for(let n=0;n<420*60&&!AIS.every(a=>a.fin);n++){ stepCar(1/60,{thr:0,brk:0,steer:0,hb:false,nitro:false}); stepAI(1/60); race.t+=1/60;
    AIS.forEach((c,i)=>{ if(c.fin||c.wreckT>0) return; if(c.nitroOn){ on+=1/60; if(!was[i]) bursts++; } was[i]=c.nitroOn;
      if(!c.nitroOn&&c.nitro>=DIFF.nitroStart){ ready+=1/60; const sp=Math.hypot(c.vx,c.vz), spm=TL/M, m=Math.max(10,Math.round(sp*1.6/spm)), t0=track[c.idx], h0=Math.atan2(t0.tx,t0.tz);
        let bend=false; for(const k of [m>>1,m]){ const t=track[(c.idx+k)%M]; if(Math.abs(angDiff(Math.atan2(t.tx,t.tz),h0))>.2) bend=true; }
        let jump=false; for(const j of JUMPS){ const a=wrapS(j[0]-t0.s)*TL; if(a>-15&&a<m*spm+40) jump=true; }
        let ob=false; if(LV.obstacles) for(const o of LV.obstacles){ const a=(((o[0]-c.idx)%M)+M)%M; if(a<m+20) ob=true; }
        if(!c.grounded) why.air+=1/60; else if(!c.onTrack) why.offroad+=1/60; else if(TOTAL_LAPS>1&&c.prog>=TOTAL_LAPS-1+GATES[5].s&&PREVENT_FINAL_BOOST) why.finalBan+=1/60; else if(jump) why.jump+=1/60; else if(ob) why.obstacle+=1/60; else if(bend) why.bend+=1/60; else why.clear+=1/60; } }); }
  const t=AIS.map(a=>a.fin?a.finT:420), mean=t.reduce((x,y)=>x+y,0)/5;
  Object.assign(DIFF,save); const w={}; for(const k in why) w[k]=Math.round(100*why[k]/Math.max(1e-6,ready));
  return {TL:Math.round(TL),mean:+mean.toFixed(1),nitroSec:+(on/5).toFixed(1),bursts:+(bursts/5).toFixed(1),readySec:+(ready/5).toFixed(0),blockedBy:w};
}
// AI with a relaxed nitro rule: only "grounded, on road, not at a jump", any bend
function aiLooseNitro(lvl,tweak){ const cr0=clearRun; clearRun=function(c,sp){ const s0=track[c.idx].s; for(const j of JUMPS){ const a=wrapS(j[0]-s0)*TL; if(a>-15&&a<60) return false; } return true; };
  const r=aiOnly(lvl,Object.assign({behindBoost:0,aheadSlow:0,aggression:0},tweak||{})); clearRun=cr0; return r; }

// ---- scenario 2: human-like routes
function headAt(i){ const t=track[(i+M)%M]; return Math.atan2(t.tx,t.tz); }
function lineCentre(){ return new Float32Array(M); }
function lineRacing(mg){ const L=new Float32Array(M), w=HALFW-mg;
  for(const s of [48,32,16,8,4,2]) for(let it=0;it<250;it++) for(let i=0;i<M;i++){ const a=track[i], p=track[(i-s+M)%M], q=track[(i+s)%M], lp=L[(i-s+M)%M], lq=L[(i+s)%M];
    const mx=(p.x+p.tz*lp+q.x+q.tz*lq)/2, mz=(p.z-p.tx*lp+q.z-q.tx*lq)/2, d=(mx-a.x)*a.tz-(mz-a.z)*a.tx; L[i]=clamp(L[i]+.6*(d-L[i]),-w,w); }
  return L; }
// edge line: stay at the outside of the next bend all the way, swing across only just before the apex
function lineEdge(mg,lead){ const cp=cornerProfile(1), w=HALFW-mg, anchors=[]; let i=0;
  while(i<M){ if(cp[i]<38){ let j=i; while(j<M&&cp[j]<38) j++; let mi=i; for(let k=i;k<j;k++) if(cp[k]<cp[mi]) mi=k; const turn=angDiff(headAt(j+4),headAt(i-4)), s=Math.sign(turn)||1;
      anchors.push([mi-lead,-s*w],[mi,s*w],[mi+lead,-s*w]); i=j; } else i++; }
  const L=new Float32Array(M); if(!anchors.length) return L;
  for(let k=0;k<anchors.length;k++){ const a=anchors[k], b=anchors[(k+1)%anchors.length]; let n=((b[0]-a[0])%M+M)%M; if(n===0) n=1; for(let q=0;q<=n;q++) L[(a[0]+q+M*2)%M]=a[1]+(b[1]-a[1])*q/n; }
  for(let p=0;p<3;p++){ const o=L.slice(); for(let q=0;q<M;q++) L[q]=(o[(q-2+M)%M]+o[(q-1+M)%M]+o[q]+o[(q+1)%M]+o[(q+2)%M])/5; }
  return L; }
function lineSpeeds(L,kc,dec){ const px=new Float32Array(M),pz=new Float32Array(M),v=new Float32Array(M),sg=new Float32Array(M),out=[];
  for(let i=0;i<M;i++){ const t=track[i]; px[i]=t.x+t.tz*L[i]; pz[i]=t.z-t.tx*L[i]; }
  let tot=0; for(let i=0;i<M;i++){ const j=(i+1)%M; sg[i]=Math.hypot(px[j]-px[i],pz[j]-pz[i]); tot+=sg[i]; }
  for(let i=0;i<M;i++){ const a=(i-4+M)%M,b=(i+4)%M, ax=px[a]-px[i],az=pz[a]-pz[i],bx=px[b]-px[i],bz=pz[b]-pz[i],cx=px[b]-px[a],cz=pz[b]-pz[a], cr=Math.abs(ax*bz-az*bx), R=cr<1e-3?1e5:Math.hypot(ax,az)*Math.hypot(bx,bz)*Math.hypot(cx,cz)/(2*cr); v[i]=Math.min(90,kc*20*(Math.sqrt(1+4*2.1*R/40)-1)); }
  for(let p=0;p<3;p++) for(let i=M*2-1;i>=0;i--){ const a=i%M,b=(i+1)%M; v[a]=Math.min(v[a],Math.sqrt(v[b]*v[b]+2*dec*sg[a])); }
  return {px,pz,v,len:tot}; }
function routeRun(lvl,o,withAI){
  if(lvl!==routeRun.l){ loadLevel(lvl); routeRun.l=lvl; }
  const save=Object.assign({},DIFF); startRace(); if(!withAI) AIS.length=0; race.countdown=.01; race.state='race'; race.t=0;
  const L=o.line==='racing'?lineRacing(o.mg||2.5):o.line==='edge'?lineEdge(o.mg||2.5,o.lead||14):lineCentre(), P=lineSpeeds(L,o.kc||1,o.dec||30);
  let hits=0,wr=0,off=0,nt=0,hb=0;
  for(let n=0;n<420*60&&race.state!=='finished';n++){ const sp=Math.hypot(car.vx,car.vz), k=(car.idx+(o.look||6)+Math.round(sp*(o.lookv||.1)))%M, dd=angDiff(Math.atan2(P.px[k]-car.x,P.pz[k]-car.z),car.yaw), vt=P.v[(car.idx+3)%M];
    let future=1e9; for(let q=3;q<30;q+=3) future=Math.min(future,P.v[(car.idx+q)%M]);
    const go=!!o.nitro&&car.grounded&&car.onTrack&&car.nitro>.02&&future>sp+6&&Math.abs(dd)<.2, h=!!o.hb&&Math.abs(dd)>.5&&sp>15&&sp<40;
    stepCar(1/60,{thr:(sp<vt*1.02&&sp<70)||sp<20?1:0,brk:sp>vt*1.08?1:0,steer:clamp(-dd*(o.gain||2.5),-1,1),hb:h,nitro:go}); if(withAI) stepAI(1/60); updateRace(1/60);
    if(car.nitroOn) nt+=1/60; if(h) hb+=1/60; if(!car.onTrack) off+=1/60; for(const e of car.events){ if(e.t==='hit') hits++; if(e.t==='wreck') wr++; } car.events.length=0; if(withAI) for(const a of AIS) a.events.length=0; }
  return {time:race.state==='finished'?+race.finishT.toFixed(1):null,place:withAI&&race.state==='finished'?race.place:undefined,len:Math.round(P.len),hits,wr,off:+off.toFixed(1),nitro:+nt.toFixed(1),hb:+hb.toFixed(1),dmg:+car.damage.toFixed(2)};
}
