// Low gravity AI diagnostics. Usage: node t12.js <diff> <level,level,...> ['{tweak json}']
const {boot,run}=require('./h.js'), fs=require('fs');
const diff=process.argv[2]||'medium', lv=(process.argv[3]||'moon,mars,titan').split(','), tw=process.argv[4]||'{}';
const ctx=boot('?level=moon&diff='+diff); run(ctx,fs.readFileSync(__dirname+'/lgprobe.js','utf8'));
for(const l of lv){ const t0=Date.now(); console.log(run(ctx,`JSON.stringify(lgTest('${l}','${diff}',${tw}))`),((Date.now()-t0)/1000).toFixed(0)+'s'); }
