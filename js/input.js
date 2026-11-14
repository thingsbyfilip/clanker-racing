'use strict';
// Input: every device ends up as named actions. The race reads actions (inp()) and the menus get navigation words (uiNav in menu.js), never raw keys.
// A binding is a KeyboardEvent code or 'Mouse0'..'Mouse4'. Each action has BIND_SLOTS slots (DEFAULT_BINDS in config.js); the gamepad is a fixed extra source.
const keys={};
const binds={};
const ACTIONS=[['accel','Accelerate'],['reverse','Reverse'],['left','Steer left'],['right','Steer right'],['brake','Brake'],['nitro','Nitrous'],['respawn','Back on track'],['pause','Pause'],
  ['confirm','Confirm'],['cancel','Cancel']];
const UI_ACTIONS=['confirm','cancel'];                // menu actions: a key may be used here and for driving at once. Keys only, because mouse clicks already work the menus.
const PAD_LABEL={accel:'RT',reverse:'LT',left:'Stick',right:'Stick',brake:'B',nitro:'A',respawn:'Y',pause:'Start',confirm:'A',cancel:'B'};
const REFUSED_KEYS=['F5','F11','F12','MetaLeft','MetaRight','ContextMenu'];   // the browser or the system owns these
const resetBinds=()=>{ for(const a in DEFAULT_BINDS) binds[a]=DEFAULT_BINDS[a].slice(); };
resetBinds();
// html.touch: the last input was a finger, so nothing has keyboard focus to show (index.html). A mouse, a key or the pad takes it off.
const setTouch=on=>document.documentElement.classList.toggle('touch',on&&MOBILE_MENU), isTouch=()=>document.documentElement.classList.contains('touch');
setTouch(!!(window.matchMedia&&matchMedia('(hover:none)').matches));
addEventListener('pointerdown',e=>setTouch(e.pointerType!=='mouse'),true);
// Settings shows the keyboard and mouse options only if the browser reports a mouse or trackpad (a keyboard cannot be detected)
const hasMouse=()=>!MOBILE_MENU||!window.matchMedia||matchMedia('(any-pointer:fine)').matches;
const held=a=>binds[a].some(c=>c&&keys[c]);
const sameGroup=(a,b)=>UI_ACTIONS.includes(a)===UI_ACTIONS.includes(b);
const isBound=c=>ACTIONS.some(([a])=>binds[a].includes(c));
const KEY_NAMES={ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→',Space:'Space',Enter:'Enter',Escape:'Esc',Backspace:'Backspace',Tab:'Tab',
  ShiftLeft:'Left Shift',ShiftRight:'Right Shift',ControlLeft:'Left Ctrl',ControlRight:'Right Ctrl',AltLeft:'Left Alt',AltRight:'Right Alt',CapsLock:'Caps Lock',Delete:'Delete',
  Mouse0:'Left Mouse',Mouse1:'Wheel Click',Mouse2:'Right Mouse',Mouse3:'Mouse 4',Mouse4:'Mouse 5'};
const keyName=c=>!c?'-':KEY_NAMES[c]||c.replace(/^Key|^Digit/,'').replace(/^Numpad/,'Num ');
// the key to show for an action in the hints: the first one bound, or the pad's button if the pad was used last
const hintKey=a=>padActive?PAD_LABEL[a]:keyName(binds[a].find(Boolean));

// a key or mouse button went down. Menus first, then the two one-shot race actions.
function pressCode(code,rep){
  initAudio();
  if(captureCode(code,rep)) return;
  const mouse=code.startsWith('Mouse');
  if(uiTop()){ if(!mouse) uiNav(navOf(code),rep,code); return; }
  if(race.state==='menu'||race.state==='loading') return;
  if(binds.pause.includes(code)||(code==='Escape'&&!isBound(code))){ if(!rep) openPause(); return; }
  if(binds.respawn.includes(code)) respawn();
  if(DEBUG_MODE&&race.state==='race'){
    if(code==='KeyV'&&!DIFF.explore){                                       // as if every checkpoint and lap were done: cross the finish line, keeping the current place
      const place=rank(); race.lap=TOTAL_LAPS; race.next=NG; passGate(NG); race.place=place;
    }
    if(code==='KeyL'){ car.inv=0; hurt(car,1); }
  }
}
// menu navigation word of a key. Arrows, WASD, Enter, Space and Esc always work, so nobody can lock themselves out of the menus.
function navOf(code){
  if(binds.confirm.includes(code)) return 'confirm';
  if(binds.cancel.includes(code)) return 'cancel';
  return {ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',KeyW:'up',KeyS:'down',KeyA:'left',KeyD:'right',
    Enter:'confirm',Space:'confirm',Escape:'cancel',Home:'home',End:'end',Tab:'tab',Delete:'clear'}[code]||null;
}
// keys the browser would act on must not reach it (scrolling, focus moves, Alt opening the window menu, Backspace going back ...). Shortcuts with Ctrl or Cmd stay the browser's.
function swallow(e){
  if(e.metaKey||(e.ctrlKey&&!e.code.startsWith('Control'))) return;
  if(capturing()||isBound(e.code)||navOf(e.code)||e.code.startsWith('Alt')) e.preventDefault();
}
addEventListener('keydown',e=>{ swallow(e); padActive=false; setTouch(false); keys[e.code]=true; pressCode(e.code,e.repeat); });
addEventListener('keyup',e=>{ swallow(e); keys[e.code]=false; });
addEventListener('mousedown',e=>{ if(e.button>0) e.preventDefault(); const c='Mouse'+e.button; padActive=false; keys[c]=true; pressCode(c,false); });   // (the wheel button would start autoscroll)
addEventListener('mouseup',e=>{ if(e.button>0) e.preventDefault(); keys['Mouse'+e.button]=false; });
addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('blur',()=>{ for(const k in keys) keys[k]=false; });       // a key let go in another window must not stay down
let mouseX=innerWidth/2;
addEventListener('mousemove',e=>{ mouseX=e.clientX; });
const AUTO=/[?&]auto/.test(location.search);
// debug switches: ?name or ?name=true, ?name=false or ?name=0; def when absent
const urlFlag=(name,def)=>{ const m=new RegExp('[?&]'+name+'(?:=([^&]*))?(?:&|$)').exec(location.search); return m?!/^(false|0|no|off)$/i.test(m[1]||''):def; };
const AI_DRIVE=urlFlag('ai',false), OPPONENTS=urlFlag('opponents',true);
const noUI=!urlFlag('ui',true); if(noUI) document.documentElement.classList.add('noui');   // debug: ?ui=false hides the in-game UI (HUD, minimap, ...) but not the menus (CSS in index.html)
const LEVEL_PARAM=(/[?&]level=(\w+)/.exec(location.search)||[])[1];   // debug: ?level=dirt|city|snow

// ---------- mouse racing (the setting): the cursor's side of the screen steers, left button accelerates, right reverses, both brake, wheel click is nitro ----------
const MOUSE_STEER_RANGE=0.3, MOUSE_STEER_DEAD=0.04;   // as fractions of the window width from the middle: full lock, and the dead zone
function mouseSteer(){ const d=(mouseX-innerWidth/2)/innerWidth; return Math.abs(d)<MOUSE_STEER_DEAD?0:clamp((d-Math.sign(d)*MOUSE_STEER_DEAD)/(MOUSE_STEER_RANGE-MOUSE_STEER_DEAD),-1,1); }

// ---------- gamepad (standard mapping; polled once per frame from the main loop) ----------
const PAD={A:0,B:1,X:2,Y:3,LB:4,RB:5,LT:6,RT:7,BACK:8,START:9,UP:12,DOWN:13,LEFT:14,RIGHT:15}, PAD_DEAD=0.18, PAD_TRIGGER=0.15;
let padActive=false, padWas={}, padNav=null, padNavT=0, padState=null;
function getPad(){ if(!navigator.getGamepads) return null; for(const p of navigator.getGamepads()) if(p&&p.connected) return p; return null; }
function pollPad(dt){
  const p=getPad(); padState=null; if(!p) return;
  const btn=i=>{ const b=p.buttons[i]; return !!b&&(b.pressed||b.value>0.5); }, val=i=>{ const b=p.buttons[i]; return b?b.value:0; };
  const ax=Math.abs(p.axes[0]||0)>PAD_DEAD?p.axes[0]:0, ay=Math.abs(p.axes[1]||0)>0.5?p.axes[1]:0, dpad=(btn(PAD.RIGHT)?1:0)-(btn(PAD.LEFT)?1:0);
  padState={steer:dpad||ax,thr:val(PAD.RT)>PAD_TRIGGER,brk:val(PAD.LT)>PAD_TRIGGER,hb:btn(PAD.B),nitro:btn(PAD.A)};
  const edge=i=>{ const on=btn(i), was=padWas[i]; padWas[i]=on; return on&&!was; };
  const a=edge(PAD.A), b=edge(PAD.B), y=edge(PAD.Y), start=edge(PAD.START), lb=edge(PAD.LB), rb=edge(PAD.RB);
  if(a||b||y||start||lb||rb||ax||ay||dpad||btn(PAD.UP)||btn(PAD.DOWN)||padState.thr||padState.brk){ if(!padActive){ padActive=true; setTouch(false); touchUse(false); refreshHints(); } }
  if(capturing()) return;
  if(uiTop()){
    if(a) uiNav('confirm',false); if(b) uiNav('cancel',false); if(lb||rb) uiNav('tab',false);
    if(start) uiNav(uiTop()==='pause'?'cancel':'confirm',false);
    // stick and D-pad move in menus, with a key-like repeat when held
    const nav=btn(PAD.UP)||ay<-0.5?'up':btn(PAD.DOWN)||ay>0.5?'down':dpad<0||ax<-0.5?'left':dpad>0||ax>0.5?'right':null;
    if(nav!==padNav){ padNav=nav; padNavT=0.35; if(nav) uiNav(nav,false); }
    else if(nav&&(padNavT-=dt)<=0){ padNavT=0.12; uiNav(nav,true); }
  } else if(race.state!=='menu'&&race.state!=='loading'){
    if(start) openPause();
    if(y) respawn();
  }
}
function inp(){
  const P=padState||{};
  let thr=held('accel')||AUTO||P.thr, brk=held('reverse')||P.brk, hb=held('brake')||P.hb, nitro=held('nitro')||P.nitro, steer=(held('right')?1:0)-(held('left')?1:0)||P.steer||0;
  if(touchOn){ const T=touchState; thr=thr||T.thr; brk=brk||T.brk; hb=hb||T.hb; nitro=nitro||T.nitro; steer=steer||T.steer; }     // the on-screen controls (js/touch.js)
  else if(SAVE.mouseRace){
    const L=keys.Mouse0, R=keys.Mouse2;
    if(L&&R) hb=true; else { thr=thr||L; brk=brk||R; }
    nitro=nitro||keys.Mouse1; steer=steer||mouseSteer();
  }
  if(hb){ thr=false; brk=false; }                       // the brake beats accelerate and reverse (steering still works)
  return {thr:thr?1:0, brk:brk?1:0, steer, hb:!!hb, nitro:!!nitro};
}
