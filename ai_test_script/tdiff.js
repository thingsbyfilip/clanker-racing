// Difficulty rows: old against new, and the per-level LEVEL_AI_MULTIPLIERS adjustments on and off.
// Usage: node tdiff.js <level> [configs]   configs: comma list of names below (default: all that apply to the level). One JSON line per run.
//   ai   = AI-only race (lgTest: rubber band and aggression off): mean and best AI time, wrecks
//   race = real race with the racing-line bot as the player (rubber band and aggression on): bot place and time, AI mean and best time
const {boot,run}=require('./h.js');
const lvl=process.argv[2]||'carrier';
const OLD={
  easy:  {speed:1.00, aggression:0.0, cornering:0, cutCorners:0, roadHold:1.00, offRoad:1.00, recovery:2.5, nitroStart:9, nitroKeep:0, startDelay:0.4, reaction:0.25,
          behindBoost:0.06, behindRange:170, aheadSlow:0.10, aheadRange:105},
  medium:{speed:1.03, aggression:0.5, cornering:0.95, cutCorners:0.5, roadHold:1.12, offRoad:0.65, recovery:1.8, nitroStart:0.95, nitroKeep:0.45, startDelay:0.2, reaction:0.20,
          behindBoost:0.15, behindRange:140, aheadSlow:0.08, aheadRange:130},
};
// name: [difficulty row, tweak, level adjustments on?]
const CFG={
  oldEasy:['easy',OLD.easy,false], oldMedium:['medium',OLD.medium,false],
  newEasy:['easy',{},true], newMedium:['medium',{},true], hard:['hard',{},true],
  newEasyNoLvl:['easy',{},false], newMediumNoLvl:['medium',{},false], hardNoLvl:['hard',{},false],
};
const ctx=boot('?level='+lvl+'&diff=medium'); run(ctx,require('fs').readFileSync(__dirname+'/lgprobe.js','utf8'));
const tagged=JSON.parse(run(ctx,`JSON.stringify(LEVELS['${lvl}'].ai||[])`)).length>0;
let names=process.argv[3]?process.argv[3].split(','):Object.keys(CFG).filter(n=>tagged||!n.endsWith('NoLvl'));
run(ctx,`var LAI_SAVE=JSON.parse(JSON.stringify(LEVEL_AI_MULTIPLIERS));
function lvlAI(on){ for(const k in LEVEL_AI_MULTIPLIERS){ for(const d in LEVEL_AI_MULTIPLIERS[k]) delete LEVEL_AI_MULTIPLIERS[k][d]; if(on) Object.assign(LEVEL_AI_MULTIPLIERS[k],JSON.parse(JSON.stringify(LAI_SAVE[k]))); } }
function realRace2(l,diff,tw){ const save=Object.assign({},DIFF); Object.assign(DIFF,DIFFICULTIES[diff],tw);
  const r=routeRun(l,{line:'racing',kc:1.15,dec:45,nitro:true},true); const aid=AID; Object.assign(DIFF,save);
  const t=AIS.map(a=>a.fin?a.finT:420);
  return {time:r.time,place:r.place,ai:+(t.reduce((x,y)=>x+y,0)/t.length).toFixed(1),aiBest:+Math.min(...t).toFixed(1),wr:r.wr,
    aid:{cutCorners:aid.cutCorners,cornering:+aid.cornering.toFixed(3),nitroStart:aid.nitroStart,reaction:+aid.reaction.toFixed(3)}}; }`);
for(const n of names){ const [d,tw,on]=CFG[n];
  run(ctx,`lvlAI(${on})`);
  const a=JSON.parse(run(ctx,`JSON.stringify(lgTest('${lvl}','${d}',${JSON.stringify(Object.assign({},tw,{behindBoost:0,aheadSlow:0,aggression:0}))}))`));
  const r=JSON.parse(run(ctx,`JSON.stringify(realRace2('${lvl}','${d}',${JSON.stringify(tw)}))`));
  console.log(JSON.stringify({lvl,cfg:n,ai:{mean:a.mean,best:a.best,dnf:a.dnf,wrecks:a.wrecks,off:a.off},race:r}));
}
