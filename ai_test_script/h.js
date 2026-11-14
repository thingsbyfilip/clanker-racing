// Read-only balance harness: loads the real game scripts in a vm with stubbed DOM/GL. Nothing is written to the project.
const fs=require('fs'), vm=require('vm'), path=require('path');
const ROOT=path.resolve(__dirname,'..');   // the game's folder
function stub(){
  const store=new Map();
  const f=function(){ return p; };
  const p=new Proxy(f,{
    get(t,k){ if(k===Symbol.iterator) return function*(){}; if(k===Symbol.toPrimitive) return ()=>0; if(k==='length') return 0; if(k==='then') return ()=>p; if(k==='style'&&!store.has(k)) store.set(k,stub());
      if(store.has(k)) return store.get(k); if(typeof k==='symbol') return undefined; return p; },
    set(t,k,v){ store.set(k,v); return true; }, apply(){ return p; }, construct(){ return p; }, has(){ return true; }});
  return p;
}
function boot(search){
  const html=fs.readFileSync(ROOT+'/index.html','utf8');
  const srcs=[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]);
  const inline=html.slice(html.lastIndexOf('<script>')+8,html.lastIndexOf('</script>'));
  const doc=stub();
  const g={console,setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,performance:{now:()=>0},requestAnimationFrame(){},cancelAnimationFrame(){},
    location:{search,href:'file:///x'+search,protocol:'file:',pathname:'/x'},document:doc,navigator:stub(),localStorage:stub(),indexedDB:stub(),matchMedia:()=>({matches:false,addEventListener(){}}),
    addEventListener(){},removeEventListener(){},innerWidth:960,innerHeight:540,devicePixelRatio:1,getComputedStyle:()=>stub(),Image:function(){return stub();},AudioContext:undefined,
    ResizeObserver:function(){return stub();},URLSearchParams};
  g.window=g; g.self=g; g.globalThis=g;
  const ctx=vm.createContext(g);
  for(const s of srcs) vm.runInContext(fs.readFileSync(ROOT+'/'+s,'utf8'),ctx,{filename:s});
  vm.runInContext(inline,ctx,{filename:'inline.js'});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'probe.js'),'utf8'),ctx,{filename:'probe.js'});
  return ctx;
}
module.exports={boot,run:(ctx,code)=>vm.runInContext(code,ctx)};
