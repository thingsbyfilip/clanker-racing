// Real races (rubber band and aggression on) with the racing-line bot as the player. Usage: node t18.js <diff> <levels|all> '[{tweak},...]'
// per tweak: bot place and time, damage the bot took from car contacts, number of contacts with the player, AI mean finish time
const {boot,run}=require('./h.js');
const diff=process.argv[2]||'medium', tws=JSON.parse(process.argv[4]||'[{}]');
const ctx=boot('?level=carrier&diff='+diff);
run(ctx,`var RX={n:0,d:0}; const _hurt=hurt; hurt=function(c,a,k){ if(c===car){ const s=new Error().stack; if(s.includes('racerCollide')){ RX.n++; const b=c.damage; _hurt(c,a,k); RX.d+=c.damage-b; return; } } return _hurt(c,a,k); };
function realRace(l,tw){ const save=Object.assign({},DIFF); Object.assign(DIFF,tw); RX.n=0; RX.d=0; const r=routeRun(l,{line:'racing',kc:1.15,dec:45,nitro:true},true); Object.assign(DIFF,save);
  const t=AIS.filter(a=>a.fin).map(a=>a.finT); return {time:r.time,place:r.place,contacts:RX.n,cdmg:+RX.d.toFixed(2),ai:t.length?+(t.reduce((x,y)=>x+y,0)/t.length).toFixed(1):null,wr:r.wr}; }`);
const lv=process.argv[3]&&process.argv[3]!=='all'?process.argv[3].split(','):JSON.parse(run(ctx,'JSON.stringify(LEVEL_ORDER)'));
const S=tws.map(()=>({pl:0,c:0,d:0,ai:0,wr:0,n:0}));
for(const l of lv){ const row=[l.padEnd(10)]; tws.forEach((tw,k)=>{ const r=JSON.parse(run(ctx,`JSON.stringify(realRace('${l}',${JSON.stringify(tw)}))`)), s=S[k];
  s.pl+=r.place||6; s.c+=r.contacts; s.d+=r.cdmg; s.ai+=r.ai||0; s.wr+=r.wr; s.n++; row.push(`| P${r.place} ${r.time} c${r.contacts} d${r.cdmg} ai${r.ai}`); }); console.log(row.join(' ')); }
tws.forEach((tw,k)=>{ const s=S[k]; console.log(JSON.stringify(tw),'meanPlace',(s.pl/s.n).toFixed(2),'contacts',s.c,'contactDmg',s.d.toFixed(2),'aiMeanSum',s.ai.toFixed(1),'botWrecks',s.wr); });
