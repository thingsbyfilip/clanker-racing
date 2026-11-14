'use strict';
// Every menu screen and how they connect: intro > track select > race > results, intro or pause > settings > controls. One stack of open screens (uiStack) decides
// who gets the input: uiNav() receives navigation words (up, down, left, right, confirm, cancel, tab, home, end, clear) from the keyboard or the gamepad (input.js).
// Track select: on the left every track in miniature, 6 columns x 4 rows (more tracks: the grid scrolls by whole rows, with a rail beside it); on the right one framed panel of the same height: the number and name of the selected
// track, its large map preview (the square map in the middle of a blurred copy of itself), and under it the numbers and the description (side by side).
// UP from the top row reaches the difficulty bar (LEFT/RIGHT change it), UP again the BACK button. Mouse: a click on a miniature selects that track, a click on the selected one again starts the race.
// Phones and tablets rearrange the same elements (the #mobileCss stylesheet in index.html, removed when MOBILE_MENU in config.js is off) and add a RACE button (#mrace); a swipe over the preview browses the tracks.
// The page markup and CSS are in index.html, the saved game and the unlock rule in save.js.
const elLoading=$('loading'), elStage=$('stage');
if(!MOBILE_MENU){ $('mobileCss').remove(); document.querySelector('meta[name=viewport]').content='width=device-width,initial-scale=1'; }
let sel=0;
// ---------- difficulty (the settings themselves are in config.js) ----------
// Chosen on the bar above the miniatures and kept in the saved game. ?diff=exploration|easy|medium|hard picks one for testing (not remembered).
const DIFF_PARAM=(/[?&]diff=(\w+)/.exec(location.search)||[])[1];
let difficulty=DIFFICULTIES[DIFF_PARAM]?DIFF_PARAM:DEFAULT_DIFFICULTY;
let DIFF=DIFFICULTIES[difficulty];
function setDifficulty(d){
  if(!DIFFICULTIES[d]) return;
  difficulty=d; DIFF=DIFFICULTIES[d];
  SAVE.difficulty=d; saveGame();
  refreshMenu();
}
const stepDifficulty=d=>{ const k=DIFFICULTY_MENU.indexOf(difficulty)+d; if(k>=0&&k<DIFFICULTY_MENU.length) setDifficulty(DIFFICULTY_MENU[k]); };   // stops at both ends

const setMode=m=>{ document.body.className=m; };

// ---------- state ----------
const MENU_L=240, THUMB_L=120;                        // the maps are drawn at these logical sizes (like the minimap) and scaled up to real pixels
const PREFERS_REDUCED=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
const REDUCED=!MENU_ANIM||PREFERS_REDUCED;            // no movement at all in the preview and the texts (MENU_ANIM is in config.js)
const SWIPE_MIN=40;                                   // px a finger must travel over the preview to change the track
const GRID_COLS=6, GRID_ROWS=4, GRID_PEEK=.4;         // the miniatures: 6 columns, 4 rows in view; with more rows than that, this much of a row (under .5) shows beyond them (see #grid in index.html)
const gridRows=Math.ceil(LEVEL_ORDER.length/GRID_COLS), gridOver=Math.max(0,gridRows-GRID_ROWS);      // rows of tracks, and how many of them do not fit
const slides=[], statsOf=[];                          // per level: the big preview (built the first time it is shown) and the numbers under the description
let shown=-1;                                         // the level whose slide is on screen

// ---------- slides ----------
// Only the cheap part of a level is built for the preview (track, gates, rivers/bridges, not the terrain). The big previews are made on demand,
// because every one is a large canvas; the small ones in the grid are all made when the menu is built.
const levelStats=()=>[[(TL/1000).toFixed(1)+' KM','<i class="ln"></i>LENGTH'],[BRIDGES.length,'<i class="br"></i>BRIDGES'],[NG,'<i class="cp"></i>CHECKPOINTS'],[JUMPS.length,'<i></i>JUMPS']];
function ensureSlide(i){
  if(slides[i]) return slides[i];
  const id=LEVEL_ORDER[i];
  buildLevelFeatures(id);
  const px=Math.round(clamp(innerHeight*.35*(devicePixelRatio||1),300,900));      // (the map is a square of about half the window height)
  const cv=document.createElement('canvas'), m=renderMinimap(cv,MENU_L,px);
  // the checkpoint gates, drawn like the in-race minimap does (a bar across the road), on top of the map
  const g=cv.getContext('2d'), hw=TW*m.sc/2+3;
  g.lineCap='butt';           // (the context still carries the scale set by renderMinimap, so the logical coordinates of m.X/m.Z apply)
  for(let k=0;k<NG;k++){ const q=GATES[k], gx=m.X(q.x), gz=m.Z(q.z), dx=q.tz*hw, dz=-q.tx*hw;
    g.strokeStyle='#000'; g.lineWidth=5; g.beginPath(); g.moveTo(gx-dx,gz-dz); g.lineTo(gx+dx,gz+dz); g.stroke();
    g.strokeStyle='#9fc0ff'; g.lineWidth=3; g.stroke(); }
  statsOf[i]=levelStats();
  const bk=document.createElement('canvas'); bk.width=bk.height=48; bk.className='sback';   // a tiny copy of the map, blurred by CSS, fills the sides of the stage
  const bg=bk.getContext('2d'); bg.fillStyle='#04070f'; bg.fillRect(0,0,48,48); bg.drawImage(cv,0,0,48,48);
  const el=document.createElement('div'); el.className='slide';
  const box=document.createElement('div'); box.className='mapbox'; box.appendChild(cv);
  el.appendChild(bk); el.appendChild(box); $('slides').appendChild(el);
  return slides[i]={el,t:0};
}
// bring slide `to` on and the slide of level `from` off; dir=+1: the new track comes in from the right, -1: from the left, 0: no movement
function swapSlide(from,to,dir){
  const a=slides[from], b=to.el;
  if(REDUCED){                                        // instant: no transition at all
    for(const x of [a,to]) if(x){ clearTimeout(x.t); x.el.style.transition='none'; x.el.style.transform=''; x.el.classList.remove('out'); }
    if(a&&a!==to) a.el.classList.remove('cur');
    b.classList.add('cur'); void b.offsetWidth;
    for(const x of [a,to]) if(x) x.el.style.transition='';
    return;
  }
  if(a&&a!==to){
    clearTimeout(a.t); a.el.classList.remove('cur'); a.el.classList.add('out');
    a.el.style.transform=dir?'translateX('+(-dir*18)+'%) scale(.95)':'';
    a.t=setTimeout(()=>{ a.el.classList.remove('out'); a.el.style.transform=''; },320);
  }
  clearTimeout(to.t); b.classList.remove('out');
  if(dir&&!REDUCED){                                  // start off to the side without a transition, then let the CSS transition run to rest
    b.style.transition='none'; b.style.opacity='0'; b.style.transform='translateX('+(dir*18)+'%) scale(.95)';
    void b.offsetWidth;
    b.style.transition=''; b.style.opacity=''; b.style.transform='';
  }
  b.classList.add('cur');
}
// ---------- building and refreshing the page ----------
function buildMenu(){
  paintBackdrop(); buildScreens();
  // every track in miniature (the minimap of the level, as in the race), 6 columns x 4 rows
  const grid=$('grid'); grid.classList.toggle('anim',MENU_THUMB_ANIM&&!PREFERS_REDUCED);          // MENU_THUMB_ANIM (config.js): the selected miniature grows and its frame fades in
  const res=Math.round(clamp(innerHeight/540*70*(devicePixelRatio||1),96,200));     // (a miniature is 70 px wide at 960x540)
  LEVEL_ORDER.forEach((id,i)=>{
    buildLevelFeatures(id); statsOf[i]=levelStats();
    const cv=document.createElement('canvas'); renderMinimap(cv,THUMB_L,res); cv.className='tmap';
    const bk=document.createElement('canvas'); bk.width=bk.height=24; bk.className='tback'; bk.getContext('2d').drawImage(cv,0,0,24,24);      // a tiny copy of the map, blurred by CSS, fills the cell round it
    const b=document.createElement('div'); b.className='thumb'; b.title=LEVELS[id].name; b.setAttribute('role','button'); b.setAttribute('aria-label',LEVELS[id].name);
    b.appendChild(bk); b.appendChild(cv);
    b.insertAdjacentHTML('beforeend',STAR_SVG+'<div class="tlock">'+LOCK_SVG+'<span>'+tracksNeeded(i)+'</span></div>');
    b.addEventListener('click',()=>{ const again=i===sel&&zone==='grid'&&!isTouch(); setZone('grid'); if(again) startSel(); else goTrack(i,i>sel?1:-1); });      // a click selects the track; a click on the selected one starts the race (not a tap: fingers double-tap by accident, and RACE is right there)
    grid.appendChild(b);
  });
  $('dprev').addEventListener('click',()=>stepDifficulty(-1)); $('dnext').addEventListener('click',()=>stepDifficulty(1));
  $('mback').addEventListener('click',leftButton); $('msettings').addEventListener('click',rightButton); $('mrace').addEventListener('click',startSel);
  headButton('mback',USE_MAIN_PAGE?'&larr; BACK':'SETTINGS',USE_MAIN_PAGE?'Back':'Settings',USE_MAIN_PAGE?BACK_ICON:GEAR_ICON);
  headButton('msettings',USE_MAIN_PAGE?'SETTINGS':'CREDITS',USE_MAIN_PAGE?'Settings':'Credits',USE_MAIN_PAGE?GEAR_ICON:INFO_ICON);
  $('msettings').style.display=RIGHT_BUTTON?'':'none';
  $('slock').innerHTML=LOCK_SVG+'<span id="slockn"></span>';
  elStage.addEventListener('click',()=>{ if(!isTouch()) startSel(); });      // a click on the preview starts the race (not a tap: a finger on the preview is swiping, and RACE is right there)
  // mouse wheel / trackpad over the preview browses the tracks too
  wheelSteps(elStage,d=>goTrack(sel+d,d));
  // a swipe over the preview does the same on a touch screen
  let swipeX=null, swipeY=0;
  if(MOBILE_MENU) elStage.addEventListener('touchstart',e=>{ swipeX=e.touches.length===1?e.touches[0].clientX:null; swipeY=e.touches[0].clientY; },{passive:true});
  if(MOBILE_MENU) elStage.addEventListener('touchend',e=>{ if(swipeX===null) return; const t=e.changedTouches[0], dx=t.clientX-swipeX, dy=t.clientY-swipeY; swipeX=null;
    if(Math.abs(dx)>=SWIPE_MIN&&Math.abs(dx)>Math.abs(dy)*1.5) goTrack(sel+(dx<0?1:-1),dx<0?1:-1); },{passive:true});
  buildGridScroll();
  refreshMenu();
  addEventListener('resize',()=>{ fitName(); paintBar(); snapFlag(); });
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(()=>refreshMenu());   // text widths change when the fonts arrive
}
// a mouse wheel or trackpad over `el`: fn(+1 or -1) once per notch, however fine the events are
function wheelSteps(el,fn){
  let acc=0, last=0;
  el.addEventListener('wheel',e=>{ e.preventDefault(); acc+=(Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY)*(e.deltaMode?30:1);      // (deltaMode: Firefox counts lines or pages)
    if(Math.abs(acc)>=30&&e.timeStamp-last>140){ fn(acc>0?1:-1); last=e.timeStamp; acc=0; } },{passive:false});
}
// ---------- the grid with more rows than fit (.many): it scrolls a row at a time, instantly like the rest of the menu ----------
// Stop r shows rows r..r+3 whole. The last stop is GRID_PEEK short of a whole row, so its bottom row is level with the panel.
// The rail is our own element and not a styled browser scrollbar: it looks the same in every browser and stays visible on touch screens. A finger drags the grid itself (CSS scroll snap).
const gridMax=()=>{ const g=$('grid'); return g.scrollHeight-g.clientHeight; };
const rowHeight=()=>gridMax()/(gridOver-GRID_PEEK);
const topRow=()=>Math.round($('grid').scrollTop/rowHeight());
const toRow=r=>{ $('grid').scrollTop=Math.min(clamp(r,0,gridOver)*rowHeight(),gridMax()); };
function paintBar(){
  if(!gridOver) return;
  const g=$('grid'), top=g.scrollTop, max=gridMax();
  $('gthumb').style.top=clamp(top/max,0,1)*(1-GRID_ROWS/gridRows)*100+'%';
  g.classList.toggle('up',top>=max-1); g.classList.toggle('down',top<max-1);      // the cut row fades out, at the bottom, or at the top at the last stop (at the other stops the top row is whole)
}
// the selected track's row comes into view, at the nearest end of the grid
function revealSel(){
  if(!gridOver) return;
  const r=Math.floor(sel/GRID_COLS), t=topRow();
  if(r<t) toRow(r); else if(r>=t+GRID_ROWS) toRow(r-GRID_ROWS+1);
  paintBar();
}
function buildGridScroll(){
  const grid=$('grid'), bar=$('gbar'), thumb=$('gthumb'), part=GRID_ROWS/gridRows;
  grid.style.setProperty('--rows',Math.max(GRID_ROWS,gridRows));
  if(!gridOver) return;
  $('menu').classList.add('many'); grid.style.setProperty('--peek',GRID_PEEK); thumb.style.height=part*100+'%';
  grid.addEventListener('scroll',paintBar,{passive:true});
  const wheel=d=>toRow(topRow()+d); wheelSteps(grid,wheel); wheelSteps(bar,wheel);
  // the rail: the thumb can be dragged, and a press beside it brings the thumb there first
  let grab=null;
  const drag=e=>{ const b=bar.getBoundingClientRect(); toRow(Math.round(clamp((e.clientY-b.top)/b.height-grab,0,1-part)/(1-part)*gridOver)); };
  bar.addEventListener('pointerdown',e=>{ const b=bar.getBoundingClientRect(), t=thumb.getBoundingClientRect();
    grab=e.target===thumb?(e.clientY-t.top)/b.height:part/2; bar.setPointerCapture(e.pointerId); bar.classList.add('drag'); drag(e); });
  bar.addEventListener('pointermove',e=>{ if(grab!==null) drag(e); });
  for(const n of ['pointerup','pointercancel']) bar.addEventListener(n,()=>{ grab=null; bar.classList.remove('drag'); });
}
// a button of the row under the title: its text, or just an icon where the row is narrow (portrait)
function headButton(id,text,label,icon){ const b=$(id); b.innerHTML='<span class="btxt">'+text+'</span>'+icon; b.setAttribute('aria-label',label); }
// the level at index `i` becomes the selection; dir is the direction of the slide animation
function goTrack(i,dir){
  const n=LEVEL_ORDER.length;
  if(i<0||i>=n||i===sel) return;                      // stops at both ends (no wrap-around)
  sel=i; refreshMenu(dir); revealSel();
  clearTimeout(goTrack.pre);                          // make the neighbouring slides while the player looks at this one
  goTrack.pre=setTimeout(()=>{ if(race.state==='menu'){ if(sel+1<n) ensureSlide(sel+1); if(sel>0) ensureSlide(sel-1); } },450);
}
// one step on the miniature grid: dx -1/+1 = previous / next track (also across the rows), dy -1/+1 = the same column one row up / down
// (down from a column that has no track in the last row goes to the last track)
function moveSel(dx,dy){
  const n=LEVEL_ORDER.length; let j=sel+dx+dy*GRID_COLS;
  if(dy>0&&j>=n&&Math.floor(sel/GRID_COLS)<Math.floor((n-1)/GRID_COLS)) j=n-1;
  j=clamp(j,0,n-1);
  goTrack(j,j>sel?1:-1);
}
// the track name is as big as its box allows, on one line (measured, so it follows whichever font is actually loaded), but never bigger than
// the name of NAME_REF_LEVEL would be, so the short names do not shout
const NAME_REF_LEVEL='volcanic';                         // VOLCANIC ISLAND
function fitName(){
  const el=$('sname'); el.style.fontSize='';
  if(!el.clientWidth) return;                         // menu not on screen
  const text=el.textContent, tooWide=()=>el.scrollWidth/el.clientWidth;
  el.textContent=LEVELS[NAME_REF_LEVEL]?LEVELS[NAME_REF_LEVEL].name:text; const cap=tooWide(); el.textContent=text;
  const over=Math.max(cap,tooWide()); if(over>1) el.style.fontSize='calc('+getComputedStyle(el).fontSize+' / '+(over*1.02).toFixed(3)+')';
}
// the flag beside the location, on whole device pixels: centred with the text it starts on a fraction of a pixel, and at this size that shifts it a pixel to one side
function snapFlag(){
  const f=$('sloc').firstChild; if(!f||!f.getBoundingClientRect().width) return;      // menu not on screen
  f.style.width=f.style.height=f.style.left=f.style.top='';
  const px=devicePixelRatio||1, snap=v=>Math.round(v*px)/px, a=f.getBoundingClientRect();
  f.style.width=snap(a.width)+'px'; f.style.height=snap(a.height)+'px';
  const b=f.getBoundingClientRect();
  f.style.left=snap(b.left)-b.left+'px'; f.style.top=snap(b.top)-b.top+'px';
}
function refreshMenu(dir=0){
  const n=LEVEL_ORDER.length, L=LEVELS[LEVEL_ORDER[sel]], s=ensureSlide(sel), changed=shown!==sel;
  if(changed){ swapSlide(shown,s,dir); shown=sel; }
  // the panel: number, name, numbers and description
  const lock=isLocked(sel), need=tracksNeeded(sel);
  $('snum').textContent='TRACK '+String(sel+1).padStart(2,'0')+' / '+String(n).padStart(2,'0');
  $('sblurb').innerHTML=lock?'Reach 1st, 2nd or 3rd place in '+need+' level'+(need===1?'':'s')+' in order to unlock access to this track.':L.blurb.replace(/\*([^*]+)\*/g,'<em>$1</em>');      // *word*: emphasis
  elStage.classList.toggle('locked',lock); $('slockn').textContent=need;
  $('sstats').innerHTML=statsOf[sel].map(x=>'<div class="stat"><b>'+x[0]+'</b><span>'+x[1]+'</span></div>').join('');
  $('sname').textContent=L.name; fitName();
  $('sloc').innerHTML=flagSvg(L.flag||'earth')+'<span>'+(L.loc||'Earth')+'</span>';      // a level without loc / flag shows the placeholder
  snapFlag();
  $('mrace').innerHTML=lock?LOCK_SVG+'LOCKED':DIFF.explore?'EXPLORE':'RACE';$('mrace').classList.toggle('locked',lock); $('mrace').setAttribute('aria-disabled',lock);
  if(changed&&dir&&!REDUCED&&$('info').animate){
    const mv=[{opacity:0,transform:'translateX('+(dir*26)+'px)'},{opacity:1,transform:'none'}], o={duration:240,easing:'cubic-bezier(.16,1,.3,1)'};
    $('info').animate(mv,o); $('sname').animate(mv,o); $('sloc').animate(mv,o); }
  [...$('grid').children].forEach((b,i)=>{ const st=SAVE.beaten[LEVEL_ORDER[i]], lk=isLocked(i);
    b.classList.toggle('sel',i===sel); b.setAttribute('aria-current',i===sel); b.classList.toggle('locked',lk);
    b.classList.remove('s0','s1','s2'); if(st!==undefined) b.classList.add('s'+st);
    b.title=LEVELS[LEVEL_ORDER[i]].name+(lk?' (locked)':st!==undefined?' (cleared)':''); });
  const di=DIFFICULTY_MENU.indexOf(difficulty);
  $('dval').textContent=DIFF.name; $('rtext').classList.toggle('long',DIFF.name.length>6);
  $('dprev').classList.toggle('on',di>0); $('dnext').classList.toggle('on',di<DIFFICULTY_MENU.length-1);      // an arrow with nothing that way is greyed out
  refreshHints();
}
// everything that shows a key name: called when the bindings or the device change
const kbd=(...k)=>k.map(x=>'<kbd>'+x+'</kbd>').join(''), hintGroup=h=>'<span class="hg">'+h+'</span>';      // a group of a hint never wraps in the middle
function refreshHints(){
  const ok=kbd(hintKey('confirm')), no=kbd(hintKey('cancel')), ud=kbd('&uarr;','&darr;'), lr=kbd('&larr;','&rarr;');
  const line=(word,...rest)=>{ const b=hintGroup(no+' '+word), r=rest.join(''); return HINT_BACK_FIRST?b+r:r+b; };      // HINT_BACK_FIRST (config.js): where the back / resume key goes
  const go=(k,t)=>hintGroup(kbd(k)+' '+t), L='&larr;', R='&rarr;', D='&darr;', tracks=go(D,'tracks');       // the row under the title: where each arrow goes from here
  const leftName=USE_MAIN_PAGE?'back button':'settings', rightName=USE_MAIN_PAGE?'settings':'credits', track=(...r)=>USE_MAIN_PAGE?line('back',...r):r.join('');      // (without the intro screen there is nothing to go back to)
  const barOn=RIGHT_BUTTON&&!DIFFICULTY_NEEDS_SELECT;              // (without the select step BACK and SETTINGS are neighbours: the arrows on the bar change it)
  $('mhint').innerHTML=zone==='grid'?track(hintGroup(lr+ud+' choose'),hintGroup(ok+(DIFF.explore?' explore':' race'))):
    zone==='back'?(barOn?go(R,rightName)+go(D,'difficulty'):hintGroup(kbd(R,D)+' difficulty'))+hintGroup(ok+(USE_MAIN_PAGE?' back to main menu':' settings')):
    zone==='set'?(DIFFICULTY_NEEDS_SELECT?hintGroup(kbd(L,D)+' difficulty'):go(L,leftName)+go(D,'difficulty'))+hintGroup(ok+' '+rightName):
    diffOpen||!DIFFICULTY_NEEDS_SELECT?hintGroup(lr+' change difficulty')+tracks+hintGroup(ok+' done'):
    track(go(L,leftName),RIGHT_BUTTON?go(R,rightName):'',tracks,hintGroup(ok+' select difficulty'));
  $('chint').innerHTML=hintGroup(no+ok+' back to menu');
  $('shint').innerHTML=line('back',hintGroup(ud+' choose'),hintGroup(ok+' select'));      // (no row of settings has values to change with LEFT/RIGHT)
  refreshKHint();
  $('phint').innerHTML=line('resume',hintGroup(ud+' choose'),hintGroup(ok+' select'));
  refreshControlsHelp();
}
// the controls hint follows the focused row: a binding is rebound or cleared, the MOUSE RACING switch is switched
function refreshKHint(){
  const ok=kbd(hintKey('confirm')), line=(...r)=>{ const b=hintGroup(kbd(hintKey('cancel'))+' back'), s=r.join(''); return HINT_BACK_FIRST?b+s:s+b; };
  $('khint').innerHTML=kRow===K_MOUSE?line(hintGroup(kbd('&larr;','&rarr;')+ok+' switch')):line(hintGroup(ok+' rebind'),hintGroup(kbd('DELETE')+' clear'));
}
function refreshIntro(){ const n=beatenCount(); $('iprog').textContent=n?n+' OF '+LEVEL_ORDER.length+' TRACKS CLEARED':''; }
// the selected track: starts it, or says no
function startSel(){
  if(!isLocked(sel)){ startLevel(LEVEL_ORDER[sel]); return; }
  beep(140,0.3,'sawtooth');
  if(!PREFERS_REDUCED&&$('desc').animate) $('desc').animate([0,-6,6,-4,4,0].map(x=>({transform:'translateX('+x+'px)'})),{duration:260});
}
function showMenu(i){ closeAll(); if(i!==undefined) sel=i; race.state='menu'; setMode('menu'); car.wreckT=0; parts.length=0; openScreen('tracks'); setZone('grid'); refreshMenu(); revealSel(); askOnMenu(); }
function goIntro(){ closeAll(); race.state='menu'; setMode('intro'); refreshIntro(); openScreen('intro'); }
function startLevel(id){
  const go=()=>{ closeAll(); race.state='loading'; setMode('loading'); elLoading.textContent='LOADING '+LEVELS[id].name+' ...';
    setTimeout(()=>{ loadLevel(id); startRace(); setMode('play'); },40); };   // let the loading screen paint first
  if(COOKIE_WHEN_FIRST_STARTING_RACE) askSaving(go); else go();
}

// ---------- track select: where the keyboard is (the miniatures, the difficulty bar or the BACK button) ----------
// the buttons at both ends of the row under the title: BACK and SETTINGS, or SETTINGS and CREDITS without the intro screen (USE_MAIN_PAGE in config.js)
const RIGHT_BUTTON=SETTINGS_IN_TRACK_SELECT||!USE_MAIN_PAGE;
const leftButton=()=>{ if(USE_MAIN_PAGE) goIntro(); else openSettings(); }, rightButton=()=>{ if(USE_MAIN_PAGE) openSettings(); else openScreen('credits'); };
let zone='grid', diffOpen=false;                      // diffOpen: the difficulty bar is selected, so LEFT/RIGHT change it (DIFFICULTY_NEEDS_SELECT in config.js)
function setDiffOpen(on){ diffOpen=on; $('rdiff').classList.toggle('open',on); refreshHints(); }
function setZone(z){ zone=z; $('rdiff').classList.toggle('foc',z==='diff'); $('mback').classList.toggle('foc',z==='back'); $('msettings').classList.toggle('foc',z==='set'); $('grid').classList.toggle('away',z!=='grid'); setDiffOpen(false); }
function tracksNav(nav,rep){
  if(nav==='cancel'){ if(rep) return; if(diffOpen) setDiffOpen(false); else if(USE_MAIN_PAGE) goIntro(); return; }
  if(nav==='tab'){ if(!rep) setDifficulty(DIFFICULTY_MENU[(DIFFICULTY_MENU.indexOf(difficulty)+1)%DIFFICULTY_MENU.length]); return; }
  if(zone==='grid'){
    if(nav==='left'||nav==='right') moveSel(nav==='right'?1:-1,0);
    else if(nav==='down') moveSel(0,1);
    else if(nav==='up'){ if(sel>=GRID_COLS) moveSel(0,-1); else if(!rep) setZone('diff'); }
    else if(nav==='home') goTrack(0,-1);
    else if(nav==='end') goTrack(LEVEL_ORDER.length-1,1);
    else if(nav==='confirm'&&!rep) startSel();                                 // (a key repeat never starts a race: holding the key on the pause menu must not start one at once)
  } else if(zone==='diff'){
    const closed=DIFFICULTY_NEEDS_SELECT&&!diffOpen;
    if((nav==='left'||nav==='right')&&!closed) stepDifficulty(nav==='right'?1:-1);
    else if(rep) return;
    else if(nav==='left') setZone('back');
    else if(nav==='right'){ if(RIGHT_BUTTON) setZone('set'); }
    else if(nav==='up') setZone('back');
    else if(nav==='down') setZone('grid');
    else if(nav==='confirm'){ if(closed) setDiffOpen(true); else if(diffOpen) setDiffOpen(false); else setZone('grid'); }
  } else if(rep) return;
  else if(zone==='set'){
    if(nav==='down') setZone('diff');
    else if(nav==='left') setZone(DIFFICULTY_NEEDS_SELECT?'diff':'back');      // (without the select step LEFT/RIGHT on the bar change it, so the row skips it)
    else if(nav==='confirm') rightButton();
  } else {
    if(nav==='down') setZone('diff');
    else if(nav==='right') setZone(!DIFFICULTY_NEEDS_SELECT&&RIGHT_BUTTON?'set':'diff');
    else if(nav==='confirm') leftButton();
  }
}

// ---------- the stack of open screens ----------
const uiStack=[];
const uiTop=()=>uiStack[uiStack.length-1]||null;
const OVERLAYS=['intro','credits','settings','controls','dialog','results','pause'];
function syncScreens(){ for(const n of OVERLAYS) $(n).classList.toggle('show',uiStack.includes(n)); paused=uiStack.includes('pause'); }
function openScreen(n){ uiStack.push(n); syncScreens(); if(LISTS[n]) refreshList(n); }
function closeScreen(){ uiStack.pop(); syncScreens(); const t=uiTop(); if(t&&LISTS[t]) refreshList(t); }
function closeAll(){ uiStack.length=0; syncScreens(); }

// ---------- option lists: intro, settings, pause, results and the confirmation dialog share one behaviour ----------
// An item: {t:label, act, change(d):LEFT/RIGHT handler, val():value shown beside the label, cls}. Mouse: hovering focuses, a click is confirm.
const LISTS={};
// focus follows the mouse only when it really moves: a resting cursor that a new screen appears under must not take the focus from the keyboard (the browser sends it synthetic events with no movement)
const onHover=(el,fn)=>el.addEventListener('mousemove',e=>{ if(e.movementX||e.movementY) fn(); });
function setList(name,host,items,cancel,row){                     // row: the options stand side by side (LEFT/RIGHT move between them)
  const L=LISTS[name]=LISTS[name]||{i:0}, el=$(host); L.items=items; L.cancel=cancel; L.row=row; L.el=el; L.i=clamp(L.i,0,items.length-1); el.innerHTML='';
  items.forEach((it,i)=>{ const o=document.createElement('div'); o.className='popt '+(it.cls||''); o.setAttribute('role','button');
    if(it.val) o.innerHTML='<span>'+it.t+'</span><span class="pval">&lsaquo; '+it.val()+' &rsaquo;</span>'; else o.textContent=it.t;
    onHover(o,()=>{ L.i=i; refreshList(name); }); o.addEventListener('click',()=>{ L.i=i; refreshList(name); if(it.act) it.act(); }); el.appendChild(o); });
  refreshList(name);
}
function refreshList(name){ const L=LISTS[name]; [...L.el.children].forEach((o,i)=>o.classList.toggle('foc',i===L.i)); }
function listNav(name,nav,rep){
  const L=LISTS[name], it=L.items[L.i];
  if(L.row&&(nav==='left'||nav==='right')) nav=nav==='right'?'down':'up';
  if(nav==='up'||nav==='down'){ L.i=L.i<0?(nav==='down'?L.items.length-1:0):clamp(L.i+(nav==='down'?1:-1),0,L.items.length-1); refreshList(name); }      // (stops at both ends; i -1: nothing is focused yet, so this picks the first or the last)
  else if(rep) return;
  else if(nav==='left'||nav==='right'){ if(it.change) it.change(nav==='right'?1:-1); }
  else if(nav==='confirm'){ if(it&&it.act) it.act(); }
  else if(nav==='cancel'&&L.cancel) L.cancel();
}
function uiNav(nav,rep,code){
  const t=uiTop();
  if(t==='pause'&&!rep&&binds.pause.includes(code)){ closeScreen(); return; }
  if(!nav) return;
  if(t==='tracks') tracksNav(nav,rep);
  else if(t==='controls') controlsNav(nav,rep);
  else if(t) listNav(t,nav,rep);
}
const STAR_SVG='<svg class="tstar" viewBox="0 0 24 24"><path d="M12 1.6l3.2 6.9 7.5.9-5.6 5.1 1.5 7.4-6.6-3.7-6.6 3.7 1.5-7.4-5.6-5.1 7.5-.9z"/></svg>';
const BACK_ICON='<svg class="bico" viewBox="0 0 24 24"><path d="M20 12H5M11 5l-7 7 7 7"/></svg>';
const GEAR_ICON='<svg class="bico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.4"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.8 2.8M16.2 16.2 19 19M19 5l-2.8 2.8M7.8 16.2 5 19"/></svg>';
const INFO_ICON='<svg class="bico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5"/><path d="M12 11v6M12 7v1.5"/></svg>';
const LOCK_SVG='<svg viewBox="0 0 24 24"><path fill="currentColor" d="M6 10V7a6 6 0 0 1 12 0v3h2v12H4V10h2zm3 0h6V7a3 3 0 0 0-6 0v3z"/></svg>';

function buildScreens(){
  setList('intro','ilist',[{t:'NEW GAME',act:()=>showMenu()},{t:'SETTINGS',act:()=>openSettings()},{t:'CREDITS',act:()=>openScreen('credits')}]);
  setList('credits','clist',[{t:'BACK',act:closeScreen}],closeScreen);
  $('clines').innerHTML=CREDITS.map(([h,...t])=>'<span class="chead">'+h+'</span><span>'+t.join('<br>')+'</span>').join('');
  $('iver').textContent=$('mver').textContent='VERSION '+GAME_VERSION; $('mver').style.display=VERSION_ON_TRACK_SELECT?'':'none';
  setPauseList(false);
  buildSettings(); buildControls();
  $('mouseBtns').addEventListener('mousedown',e=>e.stopPropagation());      // a click here must not count as the accelerate button
  $('mPause').addEventListener('click',openPause); $('mRespawn').addEventListener('click',respawn);
}

// ---------- credits ----------
const CREDITS=[
  ['CODED BY','Claude Opus 5.5, by Anthropic'],
  ['BASED ON VIBES BY','Filip Skwarski'],
  ['INSPIRED BY','Big Red Racing (1996), by Big Red Software / Domark','OutRun (1986), by Sega','Midtown Madness (1999), by Angel Studios / Microsoft','Wacky Races (1968), by Hanna-Barbera','Tron (1982), by Walt Disney Productions','Ultimate Racetrack (2014), by BMW Canada'],
  ['FONTS (SIL OFL)','Kanit, by The Kanit Project Authors','Titillium Web, by Accademia di Belle Arti di Urbino']];

// ---------- settings ----------
function buildSettings(){
  setList('settings','slist',[
    ...(hasMouse()?[{t:'CONTROLS',act:openControls}]:[]),      // (MOUSE RACING is a row of the controls screen)
    ...(DEBUG_MODE?[{t:SAVE.unlockAll?'ALL TRACKS UNLOCKED':'UNLOCK ALL TRACKS',cls:SAVE.unlockAll?'off':'',act:SAVE.unlockAll?null:()=>openDialog('UNLOCK ALL TRACKS?','Every track becomes playable. Stars are not awarded.','UNLOCK ALL',()=>{ SAVE.unlockAll=true; progressChanged(); })}]:[]),
    deleteItem(),
    {t:'RETURN TO MENU',cls:'gap',act:closeSettings}],closeSettings);      // (only the menus open settings: the pause menu has CONTROLS instead)
  $('snote').textContent=saveFailed?'This browser is not storing data, so progress will be lost when the page closes.':COOKIE_WARNING&&saveAsked&&!SAVE.consent?'Progress is not being saved across sessions.':'';
}
// the delete row. A database goes with the cookie (and the question comes again); without one only this session's progress can be reset, and the answer and the controls stay.
function deleteItem(){
  const file=COOKIE_WARNING&&saveDb, rejected=COOKIE_WARNING&&saveAsked&&!saveDb, label=rejected?'DELETE PROGRESS':'DELETE SAVED DATA';     // (rejected: said no to the question)
  if(!saveDb&&!beatenCount()&&!SAVE.unlockAll) return {t:rejected?'NO PROGRESS SAVED':'NO DATA SAVED',cls:'off',act:null};
  return {t:label,cls:'danger',act:()=>openDialog(label+'?',file?'All progress and settings will be lost, and any local files removed from your device.\nThis cannot be undone!':'All stars and unlocked tracks will be lost. This cannot be undone. Your controls are kept.','DELETE',()=>{ SAVE.beaten={}; SAVE.unlockAll=false; if(file) deleteSave(); settingsBase=settingsKey(); progressChanged(); },'danger')};
}
function openControls(){ kRow=0; kCol=0; kNote(''); refreshControls(); openScreen('controls'); }
function openSettings(){
  const open=()=>{ buildSettings(); openScreen('settings'); };
  if(COOKIE_WHEN_FIRST_ENTERING_SETTINGS&&race.state==='menu') askSaving(open); else open();     // (never during a race)
}
function closeSettings(){ closeScreen(); if(race.state==='menu') askOnMenu(); }
function progressChanged(){ saveGame(); buildSettings(); refreshIntro(); if(race.state==='menu') refreshMenu(); }     // (refreshMenu may rebuild a level's track, so never during a race)
function applyMouseRace(){ document.documentElement.classList.toggle('mouserace',SAVE.mouseRace); refreshControlsHelp(); }
function toggleMouseRace(){ SAVE.mouseRace=!SAVE.mouseRace; saveGame(); applyMouseRace(); refreshControls(); }
function openDialog(title,text,okLabel,fn,cls){
  $('dtitle').textContent=title; $('dtext').textContent=text;
  setList('dialog','dlist',[{t:'CANCEL',act:closeScreen},{t:okLabel,cls,act:()=>{ closeScreen(); fn(); }}],closeScreen); LISTS.dialog.i=0;
  openScreen('dialog');
}
// what the settings screens can change, to tell on the way back to the menu whether anything differs from how the session began
const settingsKey=()=>JSON.stringify([SAVE.mouseRace,SAVE.unlockAll,binds]);
let settingsBase='';
function askOnMenu(){ if(saveDue&&COOKIE_AFTER_FINISHING_RACE||COOKIE_WHEN_SETTINGS_CHANGED&&settingsKey()!==settingsBase) askSaving(); }
// the cookie question (COOKIE_WARNING): once a session, only in the menus, and only a yes stores anything. `then` runs after the answer, or at once if there is nothing to ask.
function askSaving(then){
  if(!COOKIE_WARNING||SAVE.consent||saveAsked){ if(then) then(); return; }
  saveAsked=true;
  const decide=yes=>{ showCookie(false); closeScreen(); (yes?acceptSaving():Promise.resolve()).then(()=>{ buildSettings(); if(then) then(); }); };
  $('dtitle').textContent='THE HUMBLE COOKIE POPUP';
  $('dtext').textContent="Since the game runs in a browser, to save your progress or settings, it will require a non-tracking cookie. It doesn't collect any data and you can clear it at any time by going into Settings. If you reject cookies, nothing is stored and your progress is lost if you quit.\n\nTrack progress across sessions?";
  setList('dialog','dlist',[{t:'NO, DON\'T SAVE MY PROGRESS',act:()=>decide(false)},{t:'YES, REMEMBER MY PROGRESS',act:()=>decide(true)}],()=>decide(false),true); LISTS.dialog.i=-1;      // no default: the player has to pick one
  showCookie(true); openScreen('dialog');
}

// ---------- controls: every action with its two slots, then MOUSE RACING (one wide slot, ON/OFF), then RESET TO DEFAULTS and BACK ----------
let kRow=0, kCol=0, cap=null, dropClick=false;        // cap: the slot waiting for a key. kRow: an action, then K_MOUSE, then K_BTNS
const K_MOUSE=ACTIONS.length, K_BTNS=ACTIONS.length+1;
const CAPTURE_TIME=5;                                 // seconds a slot waits for a key
const kNote=t=>{ $('knote').textContent=t; };
const capturing=()=>!!cap;
function buildControls(){
  const tb=$('ktable'); tb.innerHTML='<span></span><span class="khead">PRIMARY</span><span class="khead">SECONDARY</span><span class="khead">PAD</span>';
  ACTIONS.forEach(([a,label],r)=>{
    tb.insertAdjacentHTML('beforeend','<span class="kname">'+label+'</span>');
    for(let s=0;s<BIND_SLOTS;s++){ const o=document.createElement('div'); o.className='kslot'; o.id='k'+r+'_'+s; o.setAttribute('role','button');
      onHover(o,()=>{ if(!cap){ kRow=r; kCol=s; refreshControls(); } }); o.addEventListener('click',()=>{ kRow=r; kCol=s; startCapture(); }); tb.appendChild(o); }
    tb.insertAdjacentHTML('beforeend','<span class="kpad">'+PAD_LABEL[a]+'</span>');
  });
  tb.insertAdjacentHTML('beforeend','<span class="kname kgap">Mouse racing</span><div class="kslot kgap" id="kmouse" role="button"></div><span class="kpad kgap"></span>');
  onHover($('kmouse'),()=>{ if(!cap){ kRow=K_MOUSE; refreshControls(); } }); $('kmouse').addEventListener('click',()=>{ cancelCapture(); kRow=K_MOUSE; toggleMouseRace(); });
  [['kreset',0],['kback',1]].forEach(([id,c])=>{ onHover($(id),()=>{ if(!cap){ kRow=K_BTNS; kCol=c; refreshControls(); } }); });
  $('kreset').addEventListener('click',resetControls); $('kback').addEventListener('click',()=>{ cancelCapture(); closeScreen(); });
  addEventListener('click',e=>{ if(dropClick){ dropClick=false; e.stopPropagation(); e.preventDefault(); } },true);      // the click of a mouse button that was just bound must not press anything
  addEventListener('mousedown',()=>{ dropClick=false; },true);
}
function refreshControls(){
  ACTIONS.forEach(([a],r)=>{ for(let s=0;s<BIND_SLOTS;s++){ const o=$('k'+r+'_'+s), on=cap&&cap.a===a&&cap.s===s;
    o.textContent=on?'Press... '+cap.left:keyName(binds[a][s]); o.classList.toggle('foc',r===kRow&&s===kCol); o.classList.toggle('wait',!!on); o.classList.toggle('none',!on&&!binds[a][s]); } });
  $('kmouse').innerHTML='&lsaquo; '+(SAVE.mouseRace?'ON':'OFF')+' &rsaquo;'; $('kmouse').classList.toggle('foc',kRow===K_MOUSE);
  $('kreset').classList.toggle('foc',kRow===K_BTNS&&kCol===0); $('kback').classList.toggle('foc',kRow===K_BTNS&&kCol===1);
  refreshKHint();
}
function startCapture(){
  const a=ACTIONS[kRow][0]; cancelCapture();
  cap={a,s:kCol,left:CAPTURE_TIME}; kNote(UI_ACTIONS.includes(a)?'Press a key':'Press a key or mouse button');
  cap.timer=setInterval(()=>{ if(--cap.left<=0){ cancelCapture(); kNote(''); } else refreshControls(); },1000);
  refreshControls();
}
function cancelCapture(){ if(cap){ clearInterval(cap.timer); cap=null; refreshControls(); } }
// called with every key or mouse button while a slot waits; true: the press was used here
function captureCode(code,rep){
  if(!cap) return false;
  if(rep) return true;
  const mouse=code.startsWith('Mouse');
  if(mouse) dropClick=true;
  if(mouse&&UI_ACTIONS.includes(cap.a)){ cancelCapture(); kNote(''); return true; }      // a click cancels: confirm and cancel take keys only
  if(REFUSED_KEYS.includes(code)){ kNote(keyName(code)+' belongs to the browser. Press another key.'); return true; }
  const {a,s}=cap, gone=[]; cancelCapture();
  for(const [b,label] of ACTIONS) if(sameGroup(a,b)) binds[b].forEach((c,j)=>{ if(c===code&&!(b===a&&j===s)){ binds[b][j]=null; if(b!==a) gone.push(label); } });
  binds[a][s]=code; storeBinds();
  kNote(gone.length?keyName(code)+' moved here from '+gone.join(', ')+', which lost that key.':'');
  return true;
}
function storeBinds(){ SAVE.binds=binds; saveGame(); refreshControls(); refreshHints(); }
function resetControls(){ cancelCapture(); resetBinds(); kNote('Controls reset to defaults.'); storeBinds(); }
function controlsNav(nav,rep){
  const n=ACTIONS.length;
  if(nav==='up'||nav==='down'){ kRow=clamp(kRow+(nav==='down'?1:-1),0,K_BTNS); refreshControls(); return; }
  if((nav==='left'||nav==='right')&&kRow===K_MOUSE){ if(!rep) toggleMouseRace(); return; }      // (an ON/OFF switch: LEFT and RIGHT both flip it, as in the settings lists)
  if(nav==='left'||nav==='right'){ kCol=nav==='right'?1:0; refreshControls(); return; }
  if(rep) return;
  if(nav==='cancel') closeScreen();
  else if(nav==='clear'&&kRow<n){ binds[ACTIONS[kRow][0]][kCol]=null; kNote(''); storeBinds(); }
  else if(nav==='confirm'){ if(kRow<n) startCapture(); else if(kRow===K_MOUSE) toggleMouseRace(); else if(kCol===0) resetControls(); else closeScreen(); }
}

// ---------- results: a moment after the finish, over the race scene ----------
function openResults(){
  const e=race.earned||{cleared:false,unlocked:[]}, next=LEVEL_ORDER.findIndex((_,i)=>i>sel&&!isLocked(i));
  $('rplace').textContent=placeName(race.place)+' PLACE';
  $('rclear').textContent=e.cleared?'TRACK CLEARED':'Finish in the top 3 to clear this track';
  $('rclear').classList.toggle('ok',e.cleared);
  $('rtime').textContent='Time '+fmt(race.finishT)+'  \u2022  '+DIFF.name+' DIFFICULTY';
  $('runlock').textContent=e.unlocked.length?'NEW TRACK'+(e.unlocked.length>1?'S':'')+' UNLOCKED: '+e.unlocked.map(l=>LEVELS[l].name).join(', '):'';
  $('rwin').style.display=e.won?'':'none';
  const nx={t:'NEXT TRACK',act:()=>showMenu(next)}, again={t:'RETRY RACE',act:()=>{ closeAll(); startRace(); }}, back={t:'BACK TO MENU',act:()=>showMenu()};     // NEXT TRACK: back to track select with the next track selected
  // the last track (Data Center): every clear offers WATCH ENDING in place of NEXT TRACK, which plays the ending at once (js/levels/ending.js)
  const ending=e.cleared&&LEVELS[LEVEL_ORDER[sel]].ending, watch={t:'WATCH ENDING',act:()=>startCutscene(ending)};
  const offerNext=SUGGEST_NEXT_TRACK&&next>=0, items=ending?[watch,again,back]:e.cleared?(offerNext?[nx,again,back]:[back,again]):offerNext?[again,nx,back]:[again,back];
  LISTS.results=LISTS.results||{i:0}; LISTS.results.i=0;
  setList('results','rlist',items,back.act);
  openScreen('results');
}

// ---------- background: a dark navy-to-black gradient (CSS) under faint Perlin noise, painted once and not animated ----------
const PERM=(()=>{ const p=[...Array(256).keys()]; let s=1337; const r=()=>(s=(s*1664525+1013904223)>>>0)/4294967296;
  for(let i=255;i>0;i--){ const j=(r()*(i+1))|0; [p[i],p[j]]=[p[j],p[i]]; } return p.concat(p); })();
function perlin(x,y){                                 // classic 2D gradient noise, about -1..1
  const xi=Math.floor(x), yi=Math.floor(y), X=xi&255, Y=yi&255, xf=x-xi, yf=y-yi;
  const fade=t=>t*t*t*(t*(t*6-15)+10), grad=(h,x,y)=>{ switch(h&3){ case 0:return x+y; case 1:return y-x; case 2:return x-y; default:return -x-y; } };
  const aa=PERM[PERM[X]+Y], ab=PERM[PERM[X]+Y+1], ba=PERM[PERM[X+1]+Y], bb=PERM[PERM[X+1]+Y+1], u=fade(xf), v=fade(yf);
  return lerp(lerp(grad(aa,xf,yf),grad(ba,xf-1,yf),u), lerp(grad(ab,xf,yf-1),grad(bb,xf-1,yf-1),u), v);
}
function paintBackdrop(){
  const cv=document.createElement('canvas'), W=cv.width=320, H=cv.height=180, g=cv.getContext('2d'), im=g.createImageData(W,H), d=im.data;
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    let n=0, a=.5, f=4/W;
    for(let o=0;o<4;o++){ n+=a*perlin(x*f+7.3,y*f+2.9); a*=.5; f*=2; }
    const v=clamp(n*1.4+.5,0,1), k=(y*W+x)*4;
    d[k]=92; d[k+1]=124; d[k+2]=205; d[k+3]=Math.round(255*(0.015+0.12*v*v+0.012*Math.random()));   // cool blue-grey cloud, at most ~14% opaque
  }
  g.putImageData(im,0,0);
  document.documentElement.style.setProperty('--noise','url('+cv.toDataURL()+')');      // every menu screen wears it as a background layer
}

// ---------- pause menu: the pause key during a race (the countdown, the race or after the finish) ----------
// The simulation stands still while it is open (see `paused` in the frame loop). Its options are built in buildScreens.
let paused=false;
// a cutscene (js/cutscene.js) has only RESUME and BACK TO MENU (there is no skip button; BACK TO MENU ends it the way its end does)
let pauseCine=null;
function setPauseList(cine){
  if(pauseCine===cine) return; pauseCine=cine; $('pause').classList.toggle('ctl',PAUSE_MENU_CONTROLS&&!cine);      // PAUSE_MENU_CONTROLS: the race controls beside the options (never in a cutscene's pause)
  // CONTROLS rather than settings: nothing else there matters during a race. Without a mouse it is hidden, as in settings
  setList('pause','plist',cine?[{t:'RESUME',act:closeScreen},{t:'BACK TO MENU',act:()=>{ closeAll(); csEnd(); }}]
    :[{t:'RETURN TO GAME',act:closeScreen},{t:'RESTART RACE',act:()=>{ closeAll(); startRace(); }},...(hasMouse()?[{t:'CONTROLS',act:openControls}]:[]),{t:'BACK TO MENU',act:()=>showMenu()}],closeScreen);
}
function openPause(){ if(uiTop()||race.state==='menu'||race.state==='loading') return; const cine=race.state==='cutscene'; setPauseList(cine); LISTS.pause.i=0;
  if(!cine){ LISTS.pause.el.children[1].textContent=DIFF.explore?'RESTART LEVEL':'RESTART RACE'; refreshPauseControls(); } openScreen('pause'); }
