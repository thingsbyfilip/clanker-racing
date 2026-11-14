const {boot,run}=require('./h.js');
const loop=`(function(){ let t=1000, n=0; const mx=420*60; for(;n<mx&&race.state!=='finished'&&(!DIFF.explore||n<2000);n++){ t+=1000/60; frame(t); }
 for(let k=0;k<400;k++){ t+=1000/60; frame(t); }
 return JSON.stringify({level:LV.id,diff:DIFF.name,ai:AI_DRIVE,ops:OPPONENTS,nAIS:AIS.length,state:race.state,time:race.finishT&&+race.finishT.toFixed(1),place:race.place,dmg:+car.damage.toFixed(2),placeTxt:placeName(race.place||1),earned:race.earned,beaten:Object.keys(SAVE.beaten).length,vmul:car.vmul,grip:car.gripMul,off:car.offMul,aiFin:AIS.filter(a=>a.fin).length,idx:car.idx}); })()`;
for(const q of ['?level=carrier&ai&opponents=false&diff=medium','?level=carrier&ai&diff=medium','?level=machu&ai&opponents=false&diff=medium','?level=carrier&ai&opponents=false&diff=easy','?level=carrier&ai&opponents=false&diff=hard','?level=carrier&ai&opponents=false&diff=exploration','?ai&opponents=false&diff=medium','?level=carrier&ai=false&opponents=false&diff=medium&auto']){
  try{ const c=boot(q); console.log(q,'\n  ',run(c,loop)); }catch(e){ console.log(q,'ERROR',e.stack.split('\n').slice(0,4).join(' | ')); }
}
const c=boot('?level=carrier&diff=medium');
console.log('regression AI times (want 195.6, 215.7):',run(c,`aiOnly('carrier',{behindBoost:0,aheadSlow:0,aggression:0}).mean`),run(c,`aiOnly('machu',{behindBoost:0,aheadSlow:0,aggression:0}).mean`));
console.log('regression race (want 1, 185.9):',run(c,`(x=>x.place+' '+x.time)(probeRace({level:'carrier',bot:'expert',nitro:true}))`));
console.log('flags:',run(c,`[urlFlag('x',true)].join()`));
