// Reaction delay (DIFF.reaction): AI-only race quality. Loaded after probe.js and lgprobe.js (see t16.js).
// rxTest(level,diff,tweak): lgTest's numbers plus how the AI steers: weave = mean |change of the steering command| per second,
// flips = steering reversals (a swing of more than 0.5 from one side to the other) per car per minute, scen = scenery damage per car, hits = scenery hits per car
function rxTest(lvl,diff,tweak){
  const st=new Map(); let hits=0;
  const sc=stepCar; stepCar=function(dt,ctl,cr){ cr=cr||car;
    if(cr!==car&&!cr.fin&&cr.wreckT<=0&&race.t>=DIFF.startDelay){ let s=st.get(cr); if(!s){ s={p:ctl.steer,w:0,n:0,ext:0,fl:0}; st.set(cr,s); }
      s.w+=Math.abs(ctl.steer-s.p); s.n++; s.p=ctl.steer;
      if(ctl.steer>0.25&&s.ext<=0){ if(s.ext<0) s.fl++; s.ext=1; } else if(ctl.steer<-0.25&&s.ext>=0){ if(s.ext>0) s.fl++; s.ext=-1; } }
    const r=sc(dt,ctl,cr); if(cr!==car) for(const e of cr.events) if(e.t==='hit') hits++; return r; };
  let r; try{ r=lgTest(lvl,diff,tweak); } finally { stepCar=sc; }
  let w=0,n=0,fl=0; for(const s of st.values()){ w+=s.w; n+=s.n; fl+=s.fl; }
  r.weave=+(w/Math.max(1,n)*60).toFixed(2); r.flips=+(fl/st.size/(n/st.size/3600)).toFixed(1); r.scen=r.cause.scen; return r;
}
// rxKick(level,diff,tweak,{every,dv}): AI-only race in which one AI after another gets a sideways shove of dv m/s every `every` seconds (as if rammed).
// dev = mean peak change of its offset from the road centre over the next 2 s; hits = scenery hits per car; wrecks; mean finish time
function rxKick(lvl,diff,tweak,o){
  o=o||{}; const save=Object.assign({},DIFF); Object.assign(DIFF,DIFFICULTIES[diff],{behindBoost:0,aheadSlow:0,aggression:0},tweak||{});
  loadLevel(lvl); startRace(); race.countdown=.01; race.state='race'; race.t=0; car.wreckT=1e9; car.x=car.z=1e5;
  let seed=7; const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
  const lat=c=>{ const t=track[c.idx]; return (c.x-t.x)*t.tz-(c.z-t.z)*t.tx; };
  const every=o.every||3, dv=o.dv||7, kicks=[]; let next=every, k=0, hits=0; const sc=stepCar; stepCar=function(dt,ctl,cr){ const r=sc(dt,ctl,cr); if(cr&&cr!==car) for(const e of cr.events) if(e.t==='hit') hits++; return r; };
  for(let n=0;n<420*60&&!AIS.every(a=>a.fin);n++){
    if(race.t>=next){ next+=every; const c=AIS[k++%5], side=rnd()<.5?-1:1;
      if(!c.fin&&c.wreckT<=0&&c.grounded){ c.vx+=side*dv*Math.cos(c.yaw); c.vz-=side*dv*Math.sin(c.yaw); c.yaw+=side*(o.yaw||0); kicks.push({c,t:race.t,l0:lat(c),mx:0,r0:c.resp}); } }
    stepAI(1/60); race.t+=1/60;
    for(const q of kicks) if(race.t-q.t<2&&q.c.resp===q.r0) q.mx=Math.max(q.mx,Math.abs(lat(q.c)-q.l0));
  }
  stepCar=sc; Object.assign(DIFF,save);
  const t=AIS.map(a=>a.fin?a.finT:420);
  return {lvl,mean:+(t.reduce((x,y)=>x+y,0)/5).toFixed(1),kicks:kicks.length,dev:+(kicks.reduce((a,q)=>a+q.mx,0)/kicks.length).toFixed(2),hits:+(hits/5).toFixed(1),wrecks:AIS.reduce((a,c)=>a+c.resp,0)};
}
