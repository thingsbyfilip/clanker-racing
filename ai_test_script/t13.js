// AI (no rubber band) against the racing-line bot alone, per level. Usage: node t13.js <diff> [levels] [tweak json]
const {boot,run}=require('./h.js'), fs=require('fs');
const diff=process.argv[2]||'medium', tw=process.argv[4]||'{}'; const ctx=boot('?level=moon&diff='+diff); run(ctx,fs.readFileSync(__dirname+'/lgprobe.js','utf8'));
const lv=process.argv[3]?process.argv[3].split(','):JSON.parse(run(ctx,'JSON.stringify(LEVEL_ORDER)'));
for(const l of lv){ const a=JSON.parse(run(ctx,`JSON.stringify(lgTest('${l}','${diff}',${tw}))`));
  const b=JSON.parse(run(ctx,`routeRun.l=null; Object.assign(DIFF,DIFFICULTIES['${diff}']); JSON.stringify(routeRun('${l}',{line:'racing',kc:1.15,dec:45,nitro:true},false))`));
  console.log(l.padEnd(10),'g',run(ctx,'LV.phys.g||G'),'ai',a.mean,'bot',b.time,'ratio',(a.mean/b.time).toFixed(3),'aiWrecks',a.wrecks,'air',a.air,'botWr',b.wr,'botOff',b.off); }
