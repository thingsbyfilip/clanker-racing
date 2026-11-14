'use strict';
// HUD text and bars plus the minimap.
const $=id=>document.getElementById(id);
document.documentElement.classList.toggle('simpleui',SIMPLIFY_INGAME_UI);   // on <html>, because setMode replaces the body's class (CSS in index.html); the touch controls turn it on too (touchUse)
const elTL=$('tl'), elTR=$('tr'), elMsg=$('msg'), elSub=$('sub'), elNitro=$('nitroBar'), elDmg=$('dmgBar'), elPop=$('pop'), elPos=$('pos');
// controls help at the lower left: a running line. Rebuilt whenever the bindings change.
function controlsHelp(){
  const pair=(a,b)=>keyName(binds[a].find(Boolean))+'/'+keyName(binds[b].find(Boolean));
  if(padActive) return [['STICK','steer'],['RT/LT','drive'],['A','nitrous'],['B','brake'],['Y','back on track'],['START','pause']];
  const rows=[[pair('accel','reverse')+' '+pair('left','right'),'drive'],[keyName(binds.nitro.find(Boolean)),'nitrous'],[keyName(binds.brake.find(Boolean)),'brake'],[keyName(binds.respawn.find(Boolean)),'back on track'],[keyName(binds.pause.find(Boolean)),'pause']];
  if(SAVE.mouseRace) rows[0]=['MOUSE','steer, buttons drive, wheel click nitrous'];
  return rows.map(r=>[r[0].toUpperCase(),r[1]]);
}
function refreshControlsHelp(){
  $('bl').classList.toggle('vert',CONTROLS_VERTICAL);   // CONTROLS_VERTICAL: one control per line (CSS in index.html)
  $('bl').innerHTML=controlsHelp().map(r=>'<span class="ctl">'+r[0]+' &nbsp;'+r[1]+'</span>').join(' ');
  // SIMPLIFY_INGAME_UI: in place of the controls help, nitrous and pause under the bars; the pause menu lists the rest (CSS in index.html)
  $('ctlPrompt').innerHTML='<div>'+promptKey('nitro').toUpperCase()+' &nbsp;nitrous</div><div>'+promptKey('pause').toUpperCase()+' &nbsp;pause &amp; controls</div>';
  refreshPauseControls();
}
// what drives an action in mouse racing, where the mouse does it (the rest stay on the keys)
const MOUSE_WAY={accel:'Left button',reverse:'Right button',left:'Mouse',right:'Mouse',nitro:'Wheel button'};
// every way to do an action, as shown to the player: the pad's button when the pad was used last, the mouse's way in mouse racing, else every key bound
function actionKeys(a){
  if(padActive) return [PAD_LABEL[a]];
  if(SAVE.mouseRace&&MOUSE_WAY[a]) return [MOUSE_WAY[a]];
  return binds[a].filter(Boolean).map(keyName);
}
const promptKey=a=>actionKeys(a)[0]||'-';      // the first of them (the primary key), for the short prompt and the Drive row
// the pause menu's overview of the race controls (#pctl): one row per control, each way to do it a key cap; follows the bindings and the device used last, like the hints.
// Drive is accelerate, reverse and steering together (as in the controls help), with their primary keys only; with SIMPLIFY_INGAME_UI nitrous comes before brake
function refreshPauseControls(){
  const cap=k=>'<kbd>'+k+'</kbd>', caps=ks=>ks.length?ks.map(cap).join(''):'<kbd class="none">-</kbd>';
  const drive=[...new Set(['accel','reverse','left','right'].map(promptKey))];      // (Set: the pad's Stick and the mouse steer both ways)
  const row=(n,a)=>[n,caps(actionKeys(a))], nitro=row('Nitrous','nitro'), brake=row('Brake','brake');
  const rows=[['Drive',caps(drive)],...(simpleUI()?[nitro,brake]:[brake,nitro]),row('Back on track','respawn'),row('Pause','pause')];
  $('pctl').innerHTML='<span class="pch">CONTROLS</span>'+rows.map(([n,k])=>'<span class="pcn">'+n+'</span><span class="pck">'+k+'</span>').join('');
}
const ord=n=>n+(['TH','ST','ND','RD'][(n%100>=11&&n%100<=13)?0:(n%10<4?n%10:0)]);
const placeName=n=>AIS.length&&n>AIS.length?'LAST':ord(n);   // the bottom of the field reads LAST, not 6TH

// ---- minimap (upper left, north up): road, rivers, bridges, jumps, checkpoint gates and the car ----
const mini=$('mini'), mctx=mini.getContext('2d'), MS=mini.width;
let mapBase=null;
function buildMinimap(){ mapBase=renderMinimap(document.createElement('canvas'),MS); }
// draws the static map of the level currently held in the shared world arrays onto `c` (square, `S` logical px, `res` real pixels: the menu preview
// draws the same picture at a higher resolution, line widths included); also used by the menu preview
function renderMinimap(c,S,res=S){
  let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;
  for(const t of track){ x0=Math.min(x0,t.x); x1=Math.max(x1,t.x); z0=Math.min(z0,t.z); z1=Math.max(z1,t.z); }
  const pad=70, sc=Math.min(S/(x1-x0+2*pad),S/(z1-z0+2*pad)), cx=(x0+x1)/2, cz=(z0+z1)/2;
  c.width=c.height=res; const g=c.getContext('2d'); g.scale(res/S,res/S);
  const X=x=>(x-cx)*sc+S/2, Z=z=>(z-cz)*sc+S/2, M_=THEME.map;
  g.fillStyle=M_.bg; g.fillRect(0,0,S,S);
  g.lineCap='round'; g.lineJoin='round';
  if(LV.mapBg) LV.mapBg(g,X,Z,sc);
  const road=(i0,n,col,w)=>{ g.beginPath(); for(let k=0;k<n;k++){ const t=track[(i0+k)%M]; k?g.lineTo(X(t.x),Z(t.z)):g.moveTo(X(t.x),Z(t.z)); } g.strokeStyle=col; g.lineWidth=w; g.stroke(); };
  road(0,M+1,M_.edge,TW*sc+3.5);
  road(0,M+1,M_.road,TW*sc);
  if(LV.mapFg) LV.mapFg(g,X,Z,sc,road);
  for(const j of JUMPS){ const t=track[trackIndexAt(j[0])]; g.fillStyle='#ff9020'; g.strokeStyle='#140d06'; g.lineWidth=1; g.beginPath(); g.arc(X(t.x),Z(t.z),2.6,0,7); g.fill(); g.stroke(); }
  // start / finish line (checker)
  const f=GATES[NG], hw=TW*sc/2+2, px=f.tz, pz=-f.tx;
  for(let i=0;i<6;i++){ g.strokeStyle=i&1?'#000':'#fff'; g.lineWidth=2.5; g.beginPath();
    g.moveTo(X(f.x)+px*(-hw+i*hw/3),Z(f.z)+pz*(-hw+i*hw/3)); g.lineTo(X(f.x)+px*(-hw+(i+1)*hw/3),Z(f.z)+pz*(-hw+(i+1)*hw/3)); g.stroke(); }
  return {c,X,Z,sc};
}
function drawMini(){
  const {c,X,Z,sc}=mapBase, hw=TW*sc/2+3;
  mctx.drawImage(c,0,0);
  for(let k=0;k<NG;k++){
    const g=GATES[k], nx=!DIFF.explore&&k===race.next, col=DIFF.explore?'#9fc0ff':k<race.next?'#58ff58':nx?'#ffe030':'#9fc0ff';   // (exploration: nothing to pass, all alike, as in the menu's preview)
    const px=g.tz, pz=-g.tx, x=X(g.x), z=Z(g.z);
    mctx.strokeStyle='#000'; mctx.lineWidth=5; mctx.beginPath(); mctx.moveTo(x-px*hw,z-pz*hw); mctx.lineTo(x+px*hw,z+pz*hw); mctx.stroke();
    mctx.strokeStyle=col; mctx.lineWidth=3; mctx.stroke();
    if(nx){ mctx.beginPath(); mctx.arc(x,z,7,0,7); mctx.lineWidth=2; mctx.stroke(); }
  }
  // opponents
  for(const a of AIS){ mctx.fillStyle=a.wreckT>0?'#777':a.def.css; mctx.strokeStyle='#000'; mctx.lineWidth=1.5; mctx.beginPath(); mctx.arc(clamp(X(a.x),4,MS-4),clamp(Z(a.z),4,MS-4),3.8,0,7); mctx.fill(); mctx.stroke(); }
  // car arrow (clamped to the map edge)
  const cx=clamp(X(car.x),6,MS-6), cz=clamp(Z(car.z),6,MS-6), fx=Math.sin(car.yaw), fz=Math.cos(car.yaw);
  mctx.fillStyle=car.wreckT>0?'#777':'#ff2a20'; mctx.strokeStyle='#fff'; mctx.lineWidth=2;
  mctx.beginPath(); mctx.moveTo(cx+fx*8,cz+fz*8); mctx.lineTo(cx-fx*5+fz*5,cz-fz*5-fx*5); mctx.lineTo(cx-fx*5-fz*5,cz-fz*5+fx*5); mctx.closePath(); mctx.fill(); mctx.stroke();
}
const WRECK_MESSAGES=[   // shown under REKT; one is picked per wreck
  'GOTTA BE MORE CAREFUL!',
  'THAT CAME OUT OF NOWHERE!',
  'THAT WAS TOTALLY ON PURPOSE.',
  'SHAKE IT OFF AND GO AGAIN!',
  "PRETEND THAT DIDN'T HAPPEN.",
  "LET'S TRY THIS ONE MORE TIME.",
  'WHO PUT THAT THING THERE?'];
const LAVA_WRECK_MESSAGES=[   // same, when the wreck came from driving in lava
  'THE FLOOR IS LAVA.',
  'HOT TAKE: THAT WAS A BAD IDEA.',
  "IT'S A HEATED COMPETITION.",
  "THAT WASN'T THE SHORTCUT!"];
const FIRE_WRECK_MESSAGES=[   // same, when the wreck came from driving through fire
  'YOU ARE ON FIRE. NOT IN THE GOOD WAY.',
  'FIRE INDEED HOT!',
  'IT BURNS! IT BURNS!',
  'FLAME JOB INCLUDED, FREE OF CHARGE.'];
const SHOCK_WRECK_MESSAGES=[   // same, when the wreck came from an electric shock
  'YOU BLEW A FUSE.',
  'SHOCKING PERFORMANCE.',
  'HAVE YOU TRIED TURNING IT OFF AND ON AGAIN?',
  'THAT WAS NOT A GROUNDED DECISION.'];
let wreckMsg='', wasWrecked=false;
function updateHud(spd){
  elTL.innerHTML=DIFF.explore?'EXPLORATION MODE':'LAP '+Math.min(race.lap,TOTAL_LAPS)+'/'+TOTAL_LAPS+'<br>TIME '+fmt(race.state==='finished'?race.finishT:race.t);
  drawMini();
  if(race.popT>0){ const [p1,p2]=race.popText.split('\n');
    elPop.innerHTML=p2?p1+'<br><span style="color:#fff;font-size:.65em">'+p2+'</span>':p1; elPop.style.color=race.popBad?'#ff6050':'#7dff7d'; elPop.style.opacity=Math.min(1,race.popT*2); }
  else if(race.wrongWay&&race.state==='race'){ elPop.textContent='WRONG WAY!'; elPop.style.color='#ff3020'; elPop.style.opacity=1; }
  else elPop.style.opacity=0;
  const place=race.state==='finished'?race.place:rank();
  elPos.textContent=DIFF.explore?'':placeName(place)+' PLACE';
  elTR.innerHTML=Math.round(spd*3.6)+' KM/H<br>'+LV.name+'<br><span class="trd">'+DIFF.name+' DIFFICULTY</span>';
  elNitro.style.width=(car.nitro*100)+'%'; elNitro.style.background=car.nitroLock&&!car.nitroOn?'#6e6256':'#ff8c00';   // greyed out while locked out
  elDmg.style.width=(car.damage*100)+'%'; elDmg.style.background='hsl('+Math.round(120*(1-car.damage))+',85%,45%)';
  let m='', s='';
  if(car.wreckT>0&&!wasWrecked){                                                                    // new wreck: pick a message once
    const pool=car.inLava||car.lavaWreck?LAVA_WRECK_MESSAGES:car.shockWreck?SHOCK_WRECK_MESSAGES:car.fireWreck?FIRE_WRECK_MESSAGES:WRECK_MESSAGES; wreckMsg=pool[(Math.random()*pool.length)|0];
  }
  wasWrecked=car.wreckT>0;
  const startMsg=LV.go||'GO!';                                                                      // the level's own word for the start; a respawn after a wreck always says GO!
  if(race.state==='countdown'){ m=race.countdown>0.2?String(Math.ceil(race.countdown-0.2)):startMsg; if(SHOW_LEVEL_SUB) s=LV.sub.toUpperCase(); }
  else if(car.wreckT>0){ m='REKT'; s=wreckMsg; }
  else if(race.state==='race'&&race.goFlash>0){ m='GO!'; }
  else if(race.state==='race'&&race.t<1.0){ m=startMsg; }
  else if(race.state==='finished'){ m=race.place===1?"YOU'RE WINNER !":'FINISHED IN '+placeName(race.place)+' PLACE!'; s='Time '+fmt(race.finishT)+(race.best!==null?'  -  Best lap '+fmt(race.best):''); }
  if(HOLD||uiTop()==='results'){ m=''; s=''; }
  if(SAVE.mouseRace) $('msteer').style.left=(50+mouseSteer()*50)+'%';
  elMsg.textContent=m; elMsg.classList.toggle('long',m.length>12); elSub.textContent=s; tutHud(); touchHud();
}
