// AI-only (lgTest) times for one level and difficulty under a list of AID tweaks, with LEVEL_AI_MULTIPLIERS switched off: node tlai.js <level> <diff> '[{..},..]'
const {boot,run}=require('./h.js');
const [lvl,diff]=[process.argv[2],process.argv[3]], tws=JSON.parse(process.argv[4]||'[{}]');
const ctx=boot('?level='+lvl+'&diff='+diff); run(ctx,require('fs').readFileSync(__dirname+'/lgprobe.js','utf8'));
run(ctx,`for(const k in LEVEL_AI_MULTIPLIERS) for(const d in LEVEL_AI_MULTIPLIERS[k]) delete LEVEL_AI_MULTIPLIERS[k][d];`);
for(const tw of tws){ const a=JSON.parse(run(ctx,`JSON.stringify(lgTest('${lvl}','${diff}',${JSON.stringify(tw)}))`)); console.log(lvl,diff,JSON.stringify(tw),'mean',a.mean,'best',a.best,'wrecks',a.wrecks,'off',a.off,'dnf',a.dnf); }
