// Low gravity: AI-only diagnostics. Damage by cause, wrecks and where they happen, airtime, off-road time. Loaded after probe.js (see t12.js).
function lgTest(lvl,diff,tweak){
  const save=Object.assign({},DIFF); Object.assign(DIFF,DIFFICULTIES[diff],{behindBoost:0,aheadSlow:0,aggression:0},tweak||{});
  loadLevel(lvl); startRace(); race.countdown=.01; race.state='race'; race.t=0; car.wreckT=1e9; car.x=car.z=1e5;
  const cause={stuck:0,off:0,scen:0,land:0,car:0,fx:0}, wreckAt=[]; let air=0,off=0,live=0,lastCause='';
  const h0=hurt; hurt=function(c,a,k){ if(c===car) return; const b=c.damage, w=c.wreckT; h0(c,a,k); const d=c.damage-b; if(d<=0&&!(c.wreckT>0&&w<=0)) return;
    const st=new Error().stack.split('\n')[2]||''; let q=st.includes('aiDrive')?(a===AI_STUCK_DAMAGE/60?'stuck':'off'):st.includes('bump')?'scen':st.includes('racerCollide')?'car':st.includes('stepCar')?'land':'fx';
    cause[q]+=d; if(c.wreckT>0&&w<=0) wreckAt.push(q+'@'+track[c.idx].s.toFixed(2)+'#'+AIS.indexOf(c)+'L'+c.laps); };
  for(let n=0;n<420*60&&!AIS.every(a=>a.fin);n++){ stepAI(1/60); race.t+=1/60;
    for(const c of AIS){ if(c.fin||c.wreckT>0) continue; live+=1/60; if(!c.grounded) air+=1/60; if(!c.onTrack) off+=1/60; } }
  hurt=h0; Object.assign(DIFF,save);
  const t=AIS.map(a=>a.fin?a.finT:420); for(const k in cause) cause[k]=+(cause[k]/5).toFixed(2);
  return {lvl,diff,mean:+(t.reduce((x,y)=>x+y,0)/5).toFixed(1),best:+Math.min(...t).toFixed(1),dnf:t.filter(x=>x>=420).length,wrecks:wreckAt.length,air:+(air/live).toFixed(2),off:+(off/live).toFixed(2),cause,wreckAt:wreckAt.sort().join(' ')};
}
// one car's state every 0.1 s while it is between s0 and s1 on its first lap (laps>=0)
function lgTrace(lvl,diff,s0,s1,who,tweak,lapN){
  const save=Object.assign({},DIFF); Object.assign(DIFF,DIFFICULTIES[diff],{behindBoost:0,aheadSlow:0,aggression:0},tweak||{});
  loadLevel(lvl); startRace(); race.countdown=.01; race.state='race'; race.t=0; car.wreckT=1e9; car.x=car.z=1e5;
  const c=AIS[who], out=['JUMPS '+JSON.stringify(JUMPS.map(j=>j.map(v=>+(+v).toFixed(3))))+' HALFW '+HALFW,'t s gnd sp vy hgt lat trackD velHd yawHd dmg'];
  for(let n=0;n<300*60;n++){ stepAI(1/60); race.t+=1/60; const s=track[c.idx].s;
    if(c.laps===(lapN||0)&&s>s0&&s<s1&&n%6==0){ const t=track[c.idx], lat=(c.x-t.x)*t.tz-(c.z-t.z)*t.tx, sp=Math.hypot(c.vx,c.vz), hd=angDiff(Math.atan2(c.vx,c.vz),Math.atan2(t.tx,t.tz));
      out.push([race.t.toFixed(1),s.toFixed(3),c.wreckT>0?'W':c.grounded?'G':'A',sp.toFixed(0),c.vy.toFixed(1),(c.y-hAt(c.x,c.z)).toFixed(1),lat.toFixed(0),c.trackD.toFixed(0),hd.toFixed(2),angDiff(c.yaw,Math.atan2(t.tx,t.tz)).toFixed(2),c.damage.toFixed(2),c.onTrack?'on':'OFF'].join(' ')); }
    if(c.laps>(lapN||0)) break; }
  Object.assign(DIFF,save); return out.join('\n'); }
// where the low gravity caps bind: runs of samples below `below`, with their lowest cap
function lgCaps(lvl,below){ loadLevel(lvl); const t0=Date.now(), v=lowgCaps(), ms=Date.now()-t0; if(!v) return 'off'; const out=[]; let st=-1,mn=1e9;
  for(let i=0;i<=M;i++){ const b=i<M&&v[i]<below; if(b){ if(st<0){st=i;mn=1e9;} mn=Math.min(mn,v[i]); } else if(st>=0){ out.push(track[st].s.toFixed(3)+'-'+track[i-1].s.toFixed(3)+':'+mn.toFixed(0)); st=-1; } }
  return ms+'ms '+out.join(' '); }
// the racing-line bot alone, optionally braking for the low gravity caps too (a human who has learnt the jumps)
function botRun(lvl,useCaps){ const ls=lineSpeeds; if(useCaps) lineSpeeds=function(){ const P=ls.apply(null,arguments), c=lowgCaps(); if(c) for(let i=0;i<M;i++) P.v[i]=Math.min(P.v[i],c[i]); return P; };
  routeRun.l=null; const r=routeRun(lvl,{line:'racing',kc:1.15,dec:45,nitro:true},false); lineSpeeds=ls; return r; }
