// Reaction delay sweep, AI only (no rubber band, no aggression). Usage: node t16.js <diff> [levels|all] ['[{tweak},...]']
const {boot,run}=require('./h.js'), fs=require('fs');
const diff=process.argv[2]||'medium', tws=JSON.parse(process.argv[4]||'[{}]');
const ctx=boot('?level=moon&diff='+diff); for(const f of ['lgprobe.js','reactprobe.js']) run(ctx,fs.readFileSync(__dirname+'/'+f,'utf8'));
const lv=process.argv[3]&&process.argv[3]!=='all'?process.argv[3].split(','):JSON.parse(run(ctx,'JSON.stringify(LEVEL_ORDER)'));
const sum=tws.map(()=>({t:0,wr:0,sc:0,wv:0,fl:0,off:0,n:0}));
for(const l of lv){ const row=[l.padEnd(10)];
  tws.forEach((tw,k)=>{ const r=JSON.parse(run(ctx,`JSON.stringify(rxTest('${l}','${diff}',${JSON.stringify(tw)}))`)), s=sum[k];
    s.t+=r.mean; s.wr+=r.wrecks; s.sc+=r.scen; s.wv+=r.weave; s.fl+=r.flips; s.off+=r.off; s.n++;
    row.push(`| ${r.mean} wr${r.wrecks} sc${r.scen} off${r.off} wv${r.weave} fl${r.flips}`); });
  console.log(row.join(' ')); }
console.log('TOTAL'); tws.forEach((tw,k)=>{ const s=sum[k]; console.log(JSON.stringify(tw),'time',s.t.toFixed(1),'wrecks',s.wr,'scen/car',s.sc.toFixed(2),'off',(s.off/s.n).toFixed(3),'weave',(s.wv/s.n).toFixed(2),'flips/min',(s.fl/s.n).toFixed(1)); });
