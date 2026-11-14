// Shove test (rxKick) for several reaction settings. Usage: node t17.js <diff> <levels|all> '[{tweak},...]' [dv]
const {boot,run}=require('./h.js'), fs=require('fs');
const diff=process.argv[2]||'medium', tws=JSON.parse(process.argv[4]||'[{}]'), dv=+(process.argv[5]||7);
const ctx=boot('?level=moon&diff='+diff); for(const f of ['lgprobe.js','reactprobe.js']) run(ctx,fs.readFileSync(__dirname+'/'+f,'utf8'));
const lv=process.argv[3]&&process.argv[3]!=='all'?process.argv[3].split(','):JSON.parse(run(ctx,'JSON.stringify(LEVEL_ORDER)'));
const S=tws.map(()=>({t:0,dev:0,h:0,w:0}));
for(const l of lv){ const row=[l.padEnd(10)]; tws.forEach((tw,k)=>{ const r=JSON.parse(run(ctx,`JSON.stringify(rxKick('${l}','${diff}',${JSON.stringify(tw)},{dv:${dv},yaw:${+(process.argv[6]||0)}}))`));
  S[k].t+=r.mean; S[k].dev+=r.dev/lv.length; S[k].h+=r.hits; S[k].w+=r.wrecks; row.push(`| ${r.mean} dev${r.dev} hits${r.hits} wr${r.wrecks}`); }); console.log(row.join(' ')); }
tws.forEach((tw,k)=>console.log(JSON.stringify(tw),'time',S[k].t.toFixed(1),'dev',S[k].dev.toFixed(2),'hits/car',S[k].h.toFixed(1),'wrecks',S[k].w));
