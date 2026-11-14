// real races (rubber band, aggression, player bot on the racing line, cap-aware or not). Usage: node t15.js <diff> <levels>
const {boot,run}=require('./h.js'), fs=require('fs'); const diff=process.argv[2]; const ctx=boot('?level=moon&diff='+diff); run(ctx,fs.readFileSync(__dirname+'/lgprobe.js','utf8'));
run(ctx,`function realRace(l,caps){ const ls=lineSpeeds; if(caps) lineSpeeds=function(){ const P=ls.apply(null,arguments), c=lowgCaps(); if(c) for(let i=0;i<M;i++) P.v[i]=Math.min(P.v[i],c[i]); return P; };
  routeRun.l=null; let wr=0; const h0=hurt; hurt=function(c,a,k){ const w=c.wreckT; h0(c,a,k); if(c!==car&&c.wreckT>0&&w<=0) wr++; };
  const r=routeRun(l,{line:'racing',kc:1.15,dec:45,nitro:true},true); hurt=h0; lineSpeeds=ls; const t=AIS.filter(a=>a.fin).map(a=>a.finT);
  return 'player '+r.time+' place '+r.place+' aiMean '+(t.length?(t.reduce((x,y)=>x+y,0)/t.length).toFixed(1):'-')+' aiWrecks '+wr; }`);
for(const l of process.argv[3].split(',')) console.log(l.padEnd(7),diff,'| plain bot:',run(ctx,`realRace('${l}',false)`),'| cap bot:',run(ctx,`realRace('${l}',true)`));
