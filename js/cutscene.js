'use strict';
// Cutscenes: a level with a `cutscene` script instead of a race (the ending, js/levels/ending.js, holds all of its own content). This file only plays a script:
//   length   seconds; at the end (or BACK TO MENU in the pause menu) the game goes back to the main menu, with no screen in between
//   cars     [player keys, then one list of keys per opponent (AI_DEFS order: blue, yellow, green, purple, orange)]. A key is [t, x, z, o]: the car is at (x,z) at time t,
//            between keys it follows a smooth curve and faces the way it moves. o (optional): yaw (where it faces when it stands still: only needed on the first key),
//            rev (this stretch, up to the next key, is driven in reverse), ease ('io' default: starts and stops; 'i' starts, 'o' stops, 'l' steady), jump (no drive: it appears here)
//   shots    [{t, cam(u,t)}]: from time t until the next shot the camera is cam(u,t) = {pos, look, fov?, shake?}, u going 0..1 over the shot
//   lines    [{t, who, text, dur, name}]: the dialogue box from t for dur seconds, typed out; `who` is the speaker's role, a key of `speakers` ({name, cls, voice: 'hum' or 'babble', pitch}),
//            and `name` (optional) the name shown over that line, else the speaker's `name`, else the role; *word* is emphasis
//   events   [{t, fn(CS)}]: one-off actions (sounds, effects); fades [[t0, t1, from, to]]: the opacity of black over the picture
//   start(CS) and update(CS,dt): the level's own state (props, flames, the MCP's logo)
// The cars do not drive themselves: no physics, no damage, nothing collides. Their trails (CUTSCENE_TRAILS in config.js), flames and smoke still work (trailsUpdate, aiFx), and so do the level's lasers (hazStep).
const CS={on:false, S:null, t:0, acc:0, cars:[], shown:-1, lineI:-1, events:0};
const CS_CPS=38;                                                          // characters per second of the typed lines
const CS_LINE_PAUSE=.35;                                                  // seconds a new line's box shows the name alone, silent, before the text starts typing

// the cutscene of level `id`, from the results screen: a black screen while the level loads, then it fades in
function startCutscene(id){
  closeAll(); race.state='loading'; setMode('loading'); elLoading.textContent='';
  setTimeout(()=>{ loadLevel(id); csBegin(); setMode('play cine'); },40);
}
function csBegin(){
  const S=LV.cutscene; CS.S=S; CS.on=true; CS.t=0; CS.acc=0; CS.lineI=-1; CS.shown=-1; CS.events=0;
  AIS.length=0;
  AI_DEFS.forEach(d=>{ const c=makeRacer(); c.def=d; c.fin=false; AIS.push(c); });
  CS.cars=[car,...AIS];
  for(const c of CS.cars) Object.assign(c,{damage:0,inv:0,wreckT:0,burn:false,burnT:0,fireSafe:0,shock:false,nitroOn:false,inWater:false,grounded:true,onTrack:true,ux:0,uy:1,uz:0,steer:0,vx:0,vy:0,vz:0,events:[]});
  trails.length=0; parts.length=0; FX.t=0;
  race.state='cutscene'; race.popT=0; cam.fov=1;
  if(S.start) S.start(CS);
  csPlace(0,0);
  $('cbox').classList.remove('on'); $('cfade').style.opacity=1;
  $('cine').classList.toggle('inpic',CUTSCENE_TEXT_IN_PICTURE);          // (where the dialogue box sits: config.js)
}
// back to the main menu (at the end, or BACK TO MENU in the pause menu), with Data Center selected on track select
function csEnd(){
  CS.on=false; csHum(false); cam.target=null; AIS.length=0; trails.length=0;
  if(USE_MAIN_PAGE) goIntro(); else showMenu(Math.max(0,LEVEL_ORDER.indexOf(CS.S.menuLevel)));
}

// ---- the cars: where each one is at time t (its keys), so that it moves smoothly and faces the way it goes ----
function csSeg(K,t){ let i=0; while(i<K.length-2&&t>=K[i+1][0]) i++; return i; }
// y0: the car's yaw when it set off on this stretch: a car that starts from rest leaves the way it faces (backwards in reverse), then bends towards the next key
function csKeyPos(K,t,y0){
  if(t<=K[0][0]) return [K[0][1],K[0][2]];
  const n=K.length; if(t>=K[n-1][0]) return [K[n-1][1],K[n-1][2]];
  const i=csSeg(K,t);
  const A=K[i], B=K[i+1], o=A[3]||{}, P=k=>K[clamp(k,0,n-1)];
  if((B[3]||{}).jump) return [A[1],A[2]];                                   // (it appears at B when B's time comes)
  let u=(t-A[0])/(B[0]-A[0]); const e=o.ease||'io';
  u=e==='l'?u:e==='i'?u*u:e==='o'?1-(1-u)*(1-u):u*u*(3-2*u);
  // Hermite curve: no tangent at a stop (an end of the list, a jump, a neighbour at the same place, a turn back, or a change between forward and reverse), otherwise Catmull-Rom
  const still=k=>{ if(k<=0||k>=n-1||(K[k][3]||{}).jump||(K[k+1][3]||{}).jump) return true;
    const ax=K[k][1]-K[k-1][1], az=K[k][2]-K[k-1][2], bx=K[k+1][1]-K[k][1], bz=K[k+1][2]-K[k][2];
    return Math.hypot(ax,az)<.01||Math.hypot(bx,bz)<.01||ax*bx+az*bz<0||!!(K[k-1][3]||{}).rev!==!!(K[k][3]||{}).rev; };
  const tan=k=>still(k)?[0,0]:[(P(k+1)[1]-P(k-1)[1])/2,(P(k+1)[2]-P(k-1)[2])/2], L=Math.hypot(B[1]-A[1],B[2]-A[2])*(o.rev?-1:1);
  const yS=o.yaw!==undefined?o.yaw:y0;                                     // (a key's own yaw, as after a jump, comes first)
  const m0=still(i)&&yS!==undefined?[Math.sin(yS)*L,Math.cos(yS)*L]:tan(i), m1=tan(i+1), u2=u*u, u3=u2*u, h00=2*u3-3*u2+1, h10=u3-2*u2+u, h01=-2*u3+3*u2, h11=u3-u2;
  return [h00*A[1]+h10*m0[0]+h01*B[1]+h11*m1[0], h00*A[2]+h10*m0[1]+h01*B[2]+h11*m1[1]];
}
function csRev(K,t){ let i=0; while(i<K.length-1&&t>=K[i+1][0]) i++; return !!(K[i][3]||{}).rev; }
// put every car where its keys say at time t (dt>0: a step of the cutscene, so speeds, wheels and steering follow)
function csPlace(t,dt){
  CS.S.cars.forEach((K,k)=>{ const c=CS.cars[k]; if(!K||!K.length) return;
    if(dt===0){ c.yaw=(K[0][3]||{}).yaw||0; c.segI=-1; }
    const si=csSeg(K,t); if(si!==c.segI){ c.segI=si; c.segYaw=c.yaw; }                     // (the yaw it had when it set off on this stretch)
    const p=csKeyPos(K,t,c.segYaw), q=csKeyPos(K,t+.06,csSeg(K,t+.06)===si?c.segYaw:c.yaw), d=Math.hypot(q[0]-p[0],q[1]-p[1]), rev=csRev(K,t);
    const jumped=Math.hypot(p[0]-c.x,p[1]-c.z)>6;                           // (a jump key: no speed, no steering)
    if(d>.004){ const want=Math.atan2(q[0]-p[0],q[1]-p[1])+(rev?Math.PI:0), lim=Math.hypot(p[0]-c.x,p[1]-c.z)/3.5+.002,   // (a car turns no tighter than about 3.5 m: no turning on the spot)
        dy=jumped||dt===0?angDiff(want,c.yaw):clamp(angDiff(want,c.yaw)*Math.min(1,dt*10),-lim,lim);
      c.steer=dt>0&&!jumped?clamp(lerp(c.steer,-dy/dt*.35*(rev?-1:1),.2),-1,1):0; c.yaw+=dy; }
    else { c.steer*=.9; const J=K.find(k2=>Math.abs(k2[0]-t)<.02&&(k2[3]||{}).yaw!==undefined); if(J) c.yaw=J[3].yaw; }
    const vx=dt>0&&!jumped?(p[0]-c.x)/dt:0, vz=dt>0&&!jumped?(p[1]-c.z)/dt:0;
    c.vx=vx; c.vz=vz; c.x=p[0]; c.z=p[1]; c.y=hAt(c.x,c.z); c.idx=nearestTrack(c.x,c.z).i;
    c.spin+=(vx*Math.sin(c.yaw)+vz*Math.cos(c.yaw))/0.62*dt; });
}

// ---- one frame of the cutscene (called from `frame` in index.html instead of the race) ----
function csFrame(dt){
  const STEP=1/60, S=CS.S;
  if(!HOLD) CS.acc+=dt;
  while(CS.acc>=STEP){ CS.acc-=STEP; csStep(STEP); if(!CS.on) return; }
  if(!HOLD) updateParts(dt);
  csCamera(); render(); csHud();
  if(AC&&osc){ const sp=Math.hypot(car.vx,car.vz); osc.frequency.value=38+sp*2.4; gainN.gain.value=muted?0:.03+Math.min(.04,sp*.003); }
  if(CS.t>=S.length) csEnd();
}
function csStep(dt){
  const S=CS.S; CS.t+=dt;
  while(CS.events<S.events.length&&S.events[CS.events].t<=CS.t) S.events[CS.events++].fn(CS);
  csPlace(CS.t,dt);
  hazStep(dt); if(CUTSCENE_TRAILS) trailsUpdate(); fxEmit(dt);           // (light trails only with CUTSCENE_TRAILS, config.js)
  for(const c of CS.cars){                                                    // fire, as in a race: it burns for FIRE_BURN_TIME, goes out with a small bang, then the car flashes
    c.fireSafe=Math.max(0,c.fireSafe-dt);
    if(c.burn&&(c.burnT-=dt)<=0){ c.burn=false; c.fireSafe=FIRE_IMMUNE_TIME; explode(c,.22); sfx('crash'); } }
  if(car.burn) burnFx(car);
  for(const a of AIS) aiFx(a,dt);
  if(S.update) S.update(CS,dt);
}
// the camera of the current shot
function csCamera(){
  const S=CS.S; let i=0; while(i<S.shots.length-1&&CS.t>=S.shots[i+1].t) i++;
  const sh=S.shots[i], end=i+1<S.shots.length?S.shots[i+1].t:S.length, u=clamp((CS.t-sh.t)/Math.max(.01,end-sh.t),0,1), v=sh.cam(u,CS.t);
  const k=v.shake||0, j=()=>(Math.random()-.5)*k;
  cam.pos=[v.pos[0]+j(),v.pos[1]+j(),v.pos[2]+j()]; cam.target=v.look; cam.fov=v.fov||1;
  cam.yaw=Math.atan2(v.look[0]-v.pos[0],v.look[2]-v.pos[2]);
}
// the dialogue box (typed out) and the fade
function csHud(){
  const S=CS.S, t=CS.t; let li=-1;
  for(let i=0;i<S.lines.length;i++){ const L=S.lines[i]; if(t>=L.t&&t<L.t+L.dur) li=i; }
  const box=$('cbox');
  if(li!==CS.lineI){ CS.lineI=li; CS.shown=-1; CS.said=0; box.classList.toggle('on',li>=0);
    if(li>=0){ const L=S.lines[li], sp=S.speakers[L.who]; $('cwho').textContent=L.name??sp.name??L.who; $('cwho').className=sp.cls||''; } }
  // the voices last as long as the typing, which starts CS_LINE_PAUSE after the line: n is the number of characters typed so far, plain the line as typed (no asterisks)
  const L=li>=0?S.lines[li]:null, sp=L&&S.speakers[L.who], plain=L?L.text.replace(/\*/g,''):'', u=L?t-L.t-CS_LINE_PAUSE:-1, n=u>0?Math.floor(u*CS_CPS):0;
  csHum(!!L&&sp.voice==='hum'&&u>=0&&n<plain.length);
  if(L&&sp.voice==='babble'){ const to=Math.min(n,plain.length);
    for(let i=Math.max(CS.said,to-2);i<to;i++) csBlip(plain,i,sp.pitch||1);       // (at most the last two after a jump, such as a ?cutscene seek)
    CS.said=Math.max(CS.said,to); }
  if(L&&n!==CS.shown&&CS.shown<L.text.length){ CS.shown=n; $('cline').innerHTML=csTyped(L.text,n); }
  let op=0; for(const f of S.fades){ if(t>=f[1]) op=f[3]; else if(t>=f[0]){ op=lerp(f[2],f[3],(t-f[0])/(f[1]-f[0])); break; } }
  $('cfade').style.opacity=op;
}
// the first n characters of a line as HTML, *word* in emphasis (the asterisks are not counted); the rest is kept, invisible, so the words do not jump when a line wraps
// Each half opens and closes its own <em>: a tag left open in the typed half and closed inside the hidden span would make the parser end the span there,
// showing the rest of the line before it is typed
function csTyped(text,n){
  const esc=c=>c==='<'?'&lt;':c==='>'?'&gt;':c==='&'?'&amp;':c;
  let vis='', hid='', k=0, em=false, emV=false, emH=false;
  for(const ch of text){ if(ch==='*'){ em=!em; continue; }
    if(k<n){ if(emV!==em){ vis+=em?'<em>':'</em>'; emV=em; } vis+=esc(ch); }
    else { if(emH!==em){ hid+=em?'<em>':'</em>'; emH=em; } hid+=esc(ch); }
    k++; }
  if(emV) vis+='</em>'; if(emH) hid+='</em>';
  return vis+(hid?'<span style="visibility:hidden">'+hid+'</span>':'');
}
// a humming voice (voice:'hum', the MCP's): a low hum from every rack in the hall while its line is being typed (detuned saws, filtered dark), faded in and out
let csHumN=null;
function csHum(on){
  if(!AC) return;
  if(on&&!csHumN&&!muted){ const g=AC.createGain(), f=AC.createBiquadFilter(), t0=AC.currentTime; f.type='lowpass'; f.frequency.value=240;
    g.gain.setValueAtTime(.0001,t0); g.gain.exponentialRampToValueAtTime(.07,t0+.06);   // (short fades: a short line types in a quarter of a second)
    const os=[55,82.6,110.4].map(fr=>{ const o=AC.createOscillator(); o.type='sawtooth'; o.frequency.value=fr; o.connect(f); o.start(); return o; });
    f.connect(g); g.connect(AC.destination); csHumN={g,os}; }
  else if(!on&&csHumN){ const {g,os}=csHumN, t0=AC.currentTime; g.gain.cancelScheduledValues(t0); g.gain.setValueAtTime(Math.max(g.gain.value,.0001),t0); g.gain.exponentialRampToValueAtTime(.0001,t0+.1);
    for(const o of os) o.stop(t0+.12); csHumN=null; }
}
// a babbling voice (voice:'babble'): one short chirp per syllable as the line is typed, on every other letter, its pitch picked by the letter (so a line always
// sounds the same) and sliding down, rising on the last word before a '?'; pitch scales the whole voice. Nothing keeps playing, so a pause silences it at once.
function csBlip(text,i,pitch){
  if(!AC||muted) return;
  const ch=text[i]; if(!/\p{L}/u.test(ch)||i%2) return;
  const vowel=/[aeiouy]/i.test(ch), q=/^[^.!\n]*\?/.test(text.slice(i))&&!/\s/.test(text.slice(i,text.indexOf('?',i)));
  const step=[0,3,5,7,10,12,15][ch.toLowerCase().charCodeAt(0)%7], f=330*pitch*Math.pow(2,step/12)*(vowel?1.12:1)*(q?1.35:1);
  const o=AC.createOscillator(), bp=AC.createBiquadFilter(), g=AC.createGain(), t0=AC.currentTime, d=.065;
  o.type='square'; o.frequency.setValueAtTime(f*(q?.85:1.08),t0); o.frequency.exponentialRampToValueAtTime(f*(q?1.15:.9),t0+d);
  bp.type='bandpass'; bp.frequency.value=f*2.2; bp.Q.value=1.4;
  g.gain.setValueAtTime(.0001,t0); g.gain.exponentialRampToValueAtTime(.09,t0+.008); g.gain.exponentialRampToValueAtTime(.0001,t0+d);
  o.connect(bp); bp.connect(g); g.connect(AC.destination); o.start(t0); o.stop(t0+d+.02);
}
// debug: ?cutscene=<level id>[,<seconds>] plays that cutscene at once, from the given time (with ?hold: a still of that moment)
function csDebugStart(id,at){
  loadLevel(id); csBegin(); setMode('play cine');
  while(CS.t<at-1e-6) csStep(1/60);
  for(let k=0;k<120;k++) updateParts(1/60);
  csCamera(); csHud();
}
