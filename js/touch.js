'use strict';
// On-screen touch controls for the race (phones and tablets). Shown while the last input was a finger (or on a touch-only device from the start), and always with
// DEBUG_MOBILE_CONTROLS (config.js), where the mouse plays the finger. They turn the simplified HUD on (everything at the top) and hide the controls help.
// Left half: a floating stick. It appears where the thumb lands and follows the thumb past its rim a little (TSTICK_LEASH, within stickZone), so the thumb never has to find it; sideways steers
// (analog, with a dead zone), holding it drives (TOUCH_AUTO_THROTTLE; else push up), pulling it down reverses.
// Right: NITROUS (large, its rim is the tank) and BRAKE (the handbrake). A button's hit area is larger than its circle, and a thumb slides from one to the other.
// Top right, under the bars: BACK ON TRACK and PAUSE (taps). The race reads all of it through touchState in inp() (input.js), like the pad.
let touchOn=false;                                     // the controls are in use (html.tctl)
const touchState={thr:false,brk:false,hb:false,nitro:false,steer:0};
const TSTICK_DEAD=0.12, TSTICK_FULL=0.8, TSTICK_DOWN=0.45;   // fractions of the stick's radius: dead zone, full lock, how far down reverses
const elTouch=$('touch');
let TLAY=null;                                          // the layout in CSS px (touchLayout)
const tPtr=new Map();                                  // pointerId > {k:'stick'|'btn', ...}
const tStick={id:null,ox:0,oy:0,ax:0,ay:0,x:0,y:0};

// the brake: a disc with its holes and a red calliper, in the style of the tutorial's symbols (TUT_ICONS)
const BRAKE_ART='<circle cx="16" cy="16" r="13" fill="#cfd4dc"/><circle cx="16" cy="16" r="13" fill="none" stroke="#9aa3b0" stroke-width="2"/><circle cx="16" cy="16" r="5" fill="#6b7480"/>'+
  [0,72,144,216,288].map(a=>'<circle cx="'+(16+9*Math.cos(a*Math.PI/180)).toFixed(2)+'" cy="'+(16+9*Math.sin(a*Math.PI/180)).toFixed(2)+'" r="1.4" fill="#6b7480"/>').join('')+
  '<path d="M6.500 6.500A13.400 13.400 0 0 1 25.500 6.500L22 10A8.500 8.500 0 0 0 10 10Z" fill="#e8322a"/><path d="M8.300 8.300A11 11 0 0 1 23.700 8.300L22 10A8.500 8.500 0 0 0 10 10Z" fill="#b81f1a"/>';
const tIcon=(a)=>'<svg class="ti" viewBox="-2 -2 36 36"><g class="ol">'+a+'</g>'+a+'</svg>';

function buildTouch(){
  if(elTouch.firstChild) return;
  elTouch.innerHTML='<div id="tstick"><div id="tknob"></div><svg class="tarr" viewBox="0 0 100 100"><path class="up" d="M40 15L50 5L60 15"/><path class="dn" d="M40 85L50 95L60 85"/><path d="M15 40L5 50L15 60M85 40L95 50L85 60"/></svg></div>'+
    '<div id="tbrake" class="tbtn"><div class="tin">'+tIcon(BRAKE_ART)+'</div></div><div id="tnitro" class="tbtn"><div class="tin">'+TUT_ICONS.flame.svg(true)+'</div></div>'+
    '<div id="ttop"><div id="trespawn" class="ttb" role="button" aria-label="Back on track">'+TUT_ICONS.drop.svg(true)+'</div>'+
    '<div id="tpause" class="ttb" role="button" aria-label="Pause"><svg viewBox="0 0 32 32"><rect x="8" y="6" width="6" height="20" fill="#fff"/><rect x="18" y="6" width="6" height="20" fill="#fff"/></svg></div></div>';
  const tap=(id,fn)=>{ const b=$(id); b.addEventListener('pointerdown',e=>{ e.stopPropagation(); e.preventDefault(); b.classList.add('on'); });
    b.addEventListener('pointerup',e=>{ e.stopPropagation(); if(b.classList.contains('on')){ b.classList.remove('on'); fn(); } }); b.addEventListener('pointerleave',()=>b.classList.remove('on')); };
  tap('tpause',()=>{ touchRelease(); openPause(); }); tap('trespawn',()=>respawn());
  touchLayout();
}
// sizes follow the screen's short side; positions keep clear of the notch and the home indicator (the safe areas, read from #touch's padding)
function touchLayout(){
  if(!elTouch.firstChild) return;
  const cs=getComputedStyle(elTouch), sl=parseFloat(cs.paddingLeft)||0, sr=parseFloat(cs.paddingRight)||0, sb=parseFloat(cs.paddingBottom)||0;
  const W=innerWidth, H=innerHeight, m=Math.min(W,H), cl=(v,a,b)=>Math.max(a,Math.min(b,v));
  const R=cl(m*0.17,52,92), rn=cl(m*0.13,40,68), rb=cl(m*0.095,30,50), g=cl(m*0.05,14,40);
  const nx=W-sr-g-rn, ny=H-sb-g-rn, d=rn+rb+cl(m*0.035,10,26), a=155*Math.PI/180;
  TLAY={W,H,R,sx:sl+g+R,sy:H-sb-g-R,btn:[{k:'nitro',x:nx,y:ny,r:rn,el:$('tnitro')},{k:'hb',x:nx+d*Math.cos(a),y:ny-d*Math.sin(a),r:rb,el:$('tbrake')}]};
  for(const b of TLAY.btn) Object.assign(b.el.style,{left:(b.x-b.r)+'px',top:(b.y-b.r)+'px',width:2*b.r+'px',height:2*b.r+'px'});
  const st=$('tstick').style; st.width=st.height=2*R+'px'; $('tknob').style.width=$('tknob').style.height=(0.9*R)+'px';
  if(tStick.id===null) stickDraw();
}
function stickDraw(){
  const s=tStick, on=s.id!==null, ox=on?s.ox:TLAY.sx, oy=on?s.oy:TLAY.sy, R=TLAY.R;
  const el=$('tstick'); el.style.left=(ox-R)+'px'; el.style.top=(oy-R)+'px'; el.classList.toggle('on',on);
  el.classList.toggle('fwd',on&&touchState.thr); el.classList.toggle('back',on&&touchState.brk);
  $('tknob').style.transform='translate(-50%,-50%) translate('+(on?s.x-s.ox:0)+'px,'+(on?s.y-s.oy:0)+'px)';
}
// the stick's zone, for its base's centre: the left half, in the lower half of the screen, whole on the screen
const stickZone=()=>{ const R=TLAY.R; return {x0:R+4,x1:TLAY.W/2-R,y0:Math.max(R+4,TLAY.H*0.5),y1:TLAY.H-R-4}; };
const TSTICK_LEASH=1;                                  // how far (in radii) the base may be dragged from where the thumb landed
// the stick's pointer moved: drag the base along when the thumb goes past the rim (on a short leash, never out of its zone), then read steering and pedals from the knob
function stickMove(x,y){
  const s=tStick, R=TLAY.R, z=stickZone(); let dx=x-s.ox, dy=y-s.oy; const l=Math.hypot(dx,dy);
  if(l>R){ let ox=x-dx/l*R, oy=y-dy/l*R; const lx=ox-s.ax, ly=oy-s.ay, ll=Math.hypot(lx,ly), m=R*TSTICK_LEASH;
    if(ll>m){ ox=s.ax+lx/ll*m; oy=s.ay+ly/ll*m; }
    s.ox=clamp(ox,z.x0,z.x1); s.oy=clamp(oy,z.y0,z.y1); dx=x-s.ox; dy=y-s.oy; }
  const k=Math.min(1,R/Math.max(1e-6,Math.hypot(dx,dy))); dx*=k; dy*=k;          // the knob stays on the rim when the thumb is further out
  s.x=s.ox+dx; s.y=s.oy+dy;
  const u=dx/R, au=Math.abs(u);
  touchState.steer=au<TSTICK_DEAD?0:Math.sign(u)*Math.min(1,(au-TSTICK_DEAD)/(TSTICK_FULL-TSTICK_DEAD));
  const back=dy/R>TSTICK_DOWN&&dy>Math.abs(dx)*0.8;                      // down, within about 50 degrees of straight down
  touchState.brk=back; touchState.thr=!back&&(TOUCH_AUTO_THROTTLE||-dy/R>TSTICK_DEAD);
  stickDraw();
}
function stickEnd(){ tStick.id=null; touchState.steer=0; touchState.thr=touchState.brk=false; stickDraw(); }
// which button a finger on the right is on: the nearest one, within a margin around its circle
function btnAt(x,y){ let best=null, bd=1e9; for(const b of TLAY.btn){ const d=Math.hypot(x-b.x,y-b.y); if(d<b.r*1.45+8&&d-b.r<bd){ bd=d-b.r; best=b; } } return best; }
function btnsUpdate(){
  const on={nitro:false,hb:false}; for(const p of tPtr.values()) if(p.k==='btn'&&p.b) on[p.b.k]=true;
  for(const b of TLAY.btn){ if(on[b.k]&&!touchState[b.k]&&navigator.vibrate) try{ navigator.vibrate(8); }catch(e){}      // a tick under the thumb where the phone can (not on iOS)
    touchState[b.k]=on[b.k]; b.el.classList.toggle('on',on[b.k]); }
}
function touchRelease(){ tPtr.clear(); stickEnd(); btnsUpdate(); }

function tDown(e){
  e.preventDefault(); initAudio(); if(!TLAY||!touchOn||tPtr.has(e.pointerId)) return;
  const x=e.clientX, y=e.clientY;
  if(x<TLAY.W/2&&tStick.id===null&&!btnAt(x,y)){
    const s=tStick, z=stickZone(); s.id=e.pointerId; s.ox=s.ax=clamp(x,z.x0,z.x1); s.oy=s.ay=clamp(y,z.y0,z.y1); s.x=s.ox; s.y=s.oy;      // (ax, ay: where it landed, the leash's anchor)
    tPtr.set(e.pointerId,{k:'stick'}); stickMove(x,y);
  } else { tPtr.set(e.pointerId,{k:'btn',b:btnAt(x,y)}); btnsUpdate(); }
}
elTouch.addEventListener('pointerdown',tDown);
// moves and lifts are followed on the window, wherever the finger is (a finger stays with the element it landed on, which for the one that brought the controls up is not #touch)
addEventListener('pointermove',e=>{
  const p=tPtr.get(e.pointerId); if(!p) return;
  if(p.k==='stick') stickMove(e.clientX,e.clientY); else { const b=btnAt(e.clientX,e.clientY); if(b!==p.b){ p.b=b; btnsUpdate(); } }
},true);
const tUp=e=>{ const p=tPtr.get(e.pointerId); if(!p) return; tPtr.delete(e.pointerId); if(p.k==='stick') stickEnd(); else btnsUpdate(); };
addEventListener('pointerup',tUp,true); addEventListener('pointercancel',tUp,true);
elTouch.addEventListener('mousedown',e=>e.stopPropagation());       // the debug mouse on the controls must not count as a mouse button (input.js)
addEventListener('blur',touchRelease);
addEventListener('resize',()=>{ touchLayout(); });

// on or off: a finger turns the controls on, a key, the pad or (without DEBUG_MOBILE_CONTROLS) a mouse button turns them off
function touchUse(on){
  on=DEBUG_MOBILE_CONTROLS||on;
  if(on===touchOn) return; touchOn=on;
  if(on) buildTouch(); else touchRelease();
  document.documentElement.classList.toggle('tctl',on);
  document.documentElement.classList.toggle('simpleui',SIMPLIFY_INGAME_UI||on);
  if(on) touchLayout();
  if(typeof refreshControlsHelp==='function') refreshControlsHelp();
}
const simpleUI=()=>SIMPLIFY_INGAME_UI||touchOn;           // the simplified HUD: by the setting, or with the touch controls
addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'){ touchUse(false); return; }
  const was=touchOn; touchUse(true);
  if(!was&&touchOn&&(race.state==='race'||race.state==='countdown')&&!uiTop()&&!document.body.classList.contains('cine')) tDown(e);           // the finger that brings the controls up already works them (the layer was not there to get it)
},true);
addEventListener('keydown',()=>touchUse(false),true);
touchUse(!!(window.matchMedia&&matchMedia('(hover:none) and (pointer:coarse)').matches));
// a phone that leaves the browser (a call, the home screen) pauses the race
document.addEventListener('visibilitychange',()=>{ if(document.hidden&&touchOn&&(race.state==='race'||race.state==='countdown')) openPause(); });
// every drawn frame (from updateHud): the tank on the nitrous rim, and nothing held once the race is over
function touchHud(){
  if(!touchOn||!TLAY) return;
  if(race.state!=='race'&&race.state!=='countdown'&&tPtr.size) touchRelease();
  const n=$('tnitro'), lock=car.nitroLock&&!car.nitroOn;
  n.style.setProperty('--tank',(car.nitro*100).toFixed(1)+'%'); n.classList.toggle('lock',lock);
  elTouch.classList.toggle('done',race.state==='finished');
}
