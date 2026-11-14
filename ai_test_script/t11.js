// real races (rubber band and aggression on) with the racing-line bot, cutCorners off against on. Usage: node t11.js difficulty
const {boot,run}=require('./h.js');
const diff=process.argv[2]||'medium'; const ctx=boot('?level=carrier&diff='+diff), w=+run(ctx,'DIFF.cutCorners');
const o={line:'racing',kc:1.15,dec:45,nitro:true};
console.log('level        OFF bot time place aiMean aiResp | ON bot time place aiMean aiResp');
run(ctx,`function realRace(l,w){ DIFF.cutCorners=w; const r=routeRun(l,${JSON.stringify(o)},true); DIFF.cutCorners=${w}; const t=AIS.filter(a=>a.fin).map(a=>a.finT); return [r.time,r.place,t.length?+(t.reduce((x,y)=>x+y,0)/t.length).toFixed(1):null,AIS.reduce((x,a)=>x+a.resp,0)].join(' '); }`);
for(const l of [...JSON.parse(run(ctx,'JSON.stringify(LEVEL_ORDER)')),'monsoon']){ try{ console.log(l.padEnd(12),run(ctx,`realRace('${l}',0)`),'|',run(ctx,`realRace('${l}',${w})`)); }catch(e){ console.log(l,'ERROR',e.message); } }
