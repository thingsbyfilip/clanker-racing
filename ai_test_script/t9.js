// cutCorners on every track, off against on, at one difficulty. Usage: node t9.js medium [w]
const {boot,run}=require('./h.js'), fs=require('fs');
const diff=process.argv[2]||'medium', W=process.argv[3]; const ctx=boot('?level=carrier&diff='+diff); run(ctx,fs.readFileSync(__dirname+'/cutprobe.js','utf8'));
const w=W!==undefined?+W:+run(ctx,'DIFF.cutCorners');
console.log('level        off   on    diff%  | on: hits dmg off resp miss idxJump offD land wet | off: hits resp off | chords share maxLat planMs');
for(const l of [...JSON.parse(run(ctx,'JSON.stringify(LEVEL_ORDER)')),'monsoon']){ try{
  const a=JSON.parse(run(ctx,`JSON.stringify(cutTest('${l}',0))`)), b=JSON.parse(run(ctx,`JSON.stringify(cutTest('${l}',${w}))`));
  console.log(l.padEnd(12),a.mean,b.mean,(100*(b.mean/a.mean-1)).toFixed(1).padStart(6),'|',b.hits,b.dmg,b.off,b.resp,b.gateMiss,b.idxJump,b.offD,b.land,b.wet,'|',a.hits,a.resp,a.off,'miss',a.gateMiss,'jump',a.idxJump,'|',b.chords,b.cutShare,b.maxLat,b.planMs); }catch(e){ console.log(l,'ERROR',e.stack.split('\n').slice(0,3).join(' | ')); } }
