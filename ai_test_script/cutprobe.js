// cutCorners: AI-only quality report for one level at w. Loaded into the game's scope after probe.js (see t9.js).
function cutTest(lvl,w,extra){
  loadLevel(lvl); const t1=Date.now(); const L=w?cutLine(w):null, planMs=Date.now()-t1;
  const save=Object.assign({},DIFF); Object.assign(DIFF,{behindBoost:0,aheadSlow:0,aggression:0,cutCorners:w},extra||{});
  startRace(); race.countdown=.01; race.state='race'; race.t=0; car.wreckT=1e9;
  let off=0,hits=0,wet=0,maxOffD=0,maxLand=0; const gp=AIS.map(()=>GATES.map(()=>0)), pa=AIS.map(c=>GATES.map(g=>(c.x-g.x)*g.tx+(c.z-g.z)*g.tz)), jump=AIS.map(()=>0), last=AIS.map(c=>c.idx);
  const h0=hurt; let dmg=0; hurt=function(c,a,k){ const b=c.damage; h0(c,a,k); if(c!==car) dmg+=c.damage-b; };
  const pu=[]; for(const c of AIS){ const p0=c.events.push; c.events.push=function(e){ if(e.t==='hit') hits++; if(e.t==='land') maxLand=Math.max(maxLand,e.v); return p0.call(this,e); }; pu.push(c); }
  for(let n=0;n<420*60&&!AIS.every(a=>a.fin);n++){ stepCar(1/60,{thr:0,brk:0,steer:0,hb:false,nitro:false}); stepAI(1/60); race.t+=1/60;
    AIS.forEach((c,k)=>{ if(c.fin) return; if(!c.onTrack) off+=1/60; if(c.inWater) wet+=1/60; maxOffD=Math.max(maxOffD,c.trackD-HALFW);
      let d=c.idx-last[k]; if(d>M/2) d-=M; if(d<-M/2) d+=M; jump[k]=Math.max(jump[k],d); last[k]=c.idx;
      GATES.forEach((g,q)=>{ const a=(c.x-g.x)*g.tx+(c.z-g.z)*g.tz, lat=(c.x-g.x)*g.tz-(c.z-g.z)*g.tx; if(pa[k][q]<0&&a>=0&&pa[k][q]>-15&&Math.abs(lat)<HALFW+7) gp[k][q]++; pa[k][q]=a; }); }); }
  hurt=h0; for(const c of pu) delete c.events.push; Object.assign(DIFF,save);
  const t=AIS.map(a=>a.fin?a.finT:420); let cutN=0,mx=0; if(L) for(let i=0;i<M;i++){ if(Math.abs(L.lat[i])>1) cutN++; mx=Math.max(mx,Math.abs(L.lat[i])); }
  return {lvl,w,mean:+(t.reduce((x,y)=>x+y,0)/5).toFixed(1),best:+Math.min(...t).toFixed(1),dnf:t.filter(x=>x>=420).length,resp:AIS.reduce((x,a)=>x+a.resp,0),hits:+(hits/5).toFixed(1),dmg:+(dmg/5).toFixed(2),off:+(off/5).toFixed(1),wet:+(wet/5).toFixed(1),land:Math.round(maxLand),
    gateMiss:gp.flat().filter(x=>x<3).length,idxJump:Math.max(...jump),offD:+maxOffD.toFixed(1),chords:L?cutBase.chords.length:0,cutShare:+(cutN/M).toFixed(2),maxLat:+mx.toFixed(1),planMs};
}
