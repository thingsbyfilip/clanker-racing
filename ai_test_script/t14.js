// AI time against the bot, plain and cap-aware. Usage: node t14.js <diff> <levels>
const {boot,run}=require('./h.js'), fs=require('fs'); const diff=process.argv[2]; const ctx=boot('?level=moon&diff='+diff); run(ctx,fs.readFileSync(__dirname+'/lgprobe.js','utf8'));
for(const l of process.argv[3].split(',')){ const a=JSON.parse(run(ctx,`JSON.stringify(lgTest('${l}','${diff}'))`)); run(ctx,`Object.assign(DIFF,DIFFICULTIES['${diff}'])`);
  const b=JSON.parse(run(ctx,`JSON.stringify(botRun('${l}',false))`)), c=JSON.parse(run(ctx,`JSON.stringify(botRun('${l}',true))`));
  console.log(l.padEnd(8),diff,'ai',a.mean,'wrecks',a.wrecks,'| bot',b.time,'off',b.off,'ratio',(a.mean/b.time).toFixed(3),'| capbot',c.time,'off',c.off,'ratio',(a.mean/c.time).toFixed(3)); }
