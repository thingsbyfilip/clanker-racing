'use strict';
// Tips for the first played level (FIRST_LEVEL_TUTORIAL in config.js): large lines at the bottom of the screen (#tut), between the car and the controls help, clear of the
// checkpoint messages (#pop) and the big race text (#msg, #sub). One tip at a time; each waits for its trigger, for the previous one to be gone and for the car not to be wrecked.
// A trigger is the number of checkpoints passed since the start (every lap counts NG checkpoints plus the finish line), so the tips are paced by the track:
// three early, then a pause, one, a pause, and the last four from the first completed lap. Keys are named as bound (hintKey), so the pad and rebinding are followed.
// Debug: ?tut=<1..8> shows that tip for good, on any race (works with ?hold, for screenshots).

// the first played level: a race while no track has been cleared yet. Never in exploration, never for the debug bots.
const firstLevel=()=>!DIFF.explore&&!AI_DRIVE&&beatenCount()===0&&!/[?&](bench=|warm=|ftest)/.test(location.search);

// what to press, as the tip names it: the bound key, the pad's button, or in mouse racing the mouse's own way of doing it
function tutKey(a){
  if(touchOn) return '<span class="k">'+{nitro:'THE FLAME BUTTON',brake:'THE BRAKE BUTTON',respawn:'THE ARROW BUTTON'}[a]+'</span>';      // the on-screen controls (js/touch.js), by their symbols
  const mouse=!padActive&&SAVE.mouseRace&&{nitro:'THE MOUSE WHEEL',brake:'BOTH MOUSE BUTTONS',respawn:'BACK ON TRACK'}[a];
  return '<span class="k">'+(mouse||hintKey(a).toUpperCase())+'</span>';
}
const L1=()=>NG+1;                                                     // checkpoints passed by the end of the first lap

// The symbols on both sides of a tip: our own vector art (as in flags.js) instead of emoji, which the system fonts draw badly or not at all.
// Flat colours with a little shading, drawn twice: first every shape in the HUD's navy, thicker (the .ol rules in index.html), which leaves a bold
// outline round the silhouette only, then the art itself. The red offset shadow of the tip text is a CSS drop-shadow. All on a 32 x 32 grid.
// The art faces right. mir: the left-hand copy is mirrored, so both face away from the text (the cars); mir:'right' mirrors the right-hand one instead (the flag). Two copies are on screen at once, so ids inside the art must be the same in both.
const TUT_ICONS=(()=>{
  const n=x=>+x.toFixed(2), rad=Math.PI/180, NV='#0b1638';
  const R=(x,y,w,h,f)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+f+'"/>';
  const C=(x,y,r,f)=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+f+'"/>';
  const P=(d,f,e='')=>'<path d="'+d+'" fill="'+f+'" '+e+'/>';
  const S=(d,c,w,e='')=>'<path d="'+d+'" fill="none" stroke="'+c+'" stroke-width="'+w+'" '+e+'/>';
  const pol=(cx,cy,r,a)=>n(cx+r*Math.cos(a*rad))+' '+n(cy+r*Math.sin(a*rad));
  const ring=(cx,cy,r)=>'M'+(cx-r)+' '+cy+'a'+r+' '+r+' 0 1 0 '+2*r+' 0a'+r+' '+r+' 0 1 0 '+(-2*r)+' 0Z';
  // a gear of `k` teeth, with a hole (even-odd)
  const gear=(cx,cy,ro,ri,k,hole)=>{ let d=''; const h=360/k;
    for(let i=0;i<k;i++){ const a=i*h-90; d+=(i?'L':'M')+pol(cx,cy,ri,a-h*.3)+'L'+pol(cx,cy,ro,a-h*.17)+'L'+pol(cx,cy,ro,a+h*.17)+'L'+pol(cx,cy,ri,a+h*.3); }
    return d+'Z'+ring(cx,cy,hole); };
  // the player's red buggy from the side, facing right, wheels on y = 28.3: the black roll cage with a plain roof and its window, the body, a headlight, two wheels
  const BUGGY=P('M12.500 16.500L14.500 9.400H21.800L24.800 17Z','#1b1e2a')+P('M15.300 16L16.400 11.900H20.700L22.500 16Z','#8fd0ff')+
    P('M16.400 11.900H18.200L16.900 16H15.300Z','#c9ecff')+
    P('M9.500 18.500C9.500 17 10.500 16 12 16H21.500L26.500 18H29.500C30.800 18 31.500 19 31.500 20.200V22.500C31.500 23.300 31 23.800 30.200 23.800H10.800C10 23.800 9.500 23.300 9.500 22.500Z','#e8322a')+
    P('M9.500 21.300H31.500V22.500C31.500 23.300 31 23.800 30.200 23.800H10.800C10 23.800 9.500 23.300 9.500 22.500Z','#b81f1a')+
    R(29.800,19,1.700,1.600,'#ffd400')+
    C(14,24,4.300,'#1b1e2a')+C(14,24,1.800,'#bcc5d3')+C(27,24,4.300,'#1b1e2a')+C(27,24,1.800,'#bcc5d3');
  const art={
    // nitrous comes back with time
    hourglass:{a:P('M9 7H23C23 12 18 14 17.200 16C18 18 23 20 23 25H9C9 20 14 18 14.800 16C14 14 9 12 9 7Z','#cdeeff')+
      P('M11.500 9.500H20.500C19.500 12.500 17 14 16 15.500C15 14 12.500 12.500 11.500 9.500Z','#ffc940')+R(15.400,15,1.200,5.500,'#ffc940')+
      P('M10.300 24.500C11.300 21 14 20 16 19.500C18 20 20.700 21 21.700 24.500Z','#ffc940')+P('M16 19.500C18 20 20.700 21 21.700 24.500H16Z','#e0a020')+
      S('M11 8.500C11.300 11 12.800 12.600 13.800 13.600','#fff',1.200,'stroke-linecap="round"')+
      R(6,2.500,20,4.500,'#b5651d')+R(6,25,20,4.500,'#b5651d')+R(6,5.500,20,1.500,'#8a4a14')+R(6,28,20,1.500,'#8a4a14')},
    // nitrous: a flame of overlapping round puffs, like the in-game fire particles: red outside, then orange, a yellow core, each layer one shape
    flame:{a:[[16,22,9],[8.500,19.500,5],[23.500,18.500,5],[12,14.500,6],[20,13,6],[15.500,7.500,4.500],[22,6.500,2.800],[9,9.500,3],[18.500,2.300,2.300]].map(c=>C(...c,'#e8322a')).join('')+
      [[16,23,7],[10.800,20,3.600],[21.200,19.300,3.600],[13.500,16.500,4.400],[19,15.500,4.200],[16,10.500,3],[20.500,9.800,1.800]].map(c=>C(...c,'#ff8a00')).join('')+
      [[16,24.500,4.600],[13.800,19.500,3],[18.300,18.800,2.800],[16,15,1.800]].map(c=>C(...c,'#ffd400')).join('')},
    // sharp turn: a yellow road sign with a bend arrow
    turn:{a:P('M16 1L31 16L16 31L1 16Z','#ffc400')+P('M16 1L31 16L16 31Z','#e9a800')+S('M16 3.800L28.200 16L16 28.200L3.800 16Z',NV,1)+
      S('M12.500 24V18C12.500 13.800 14.500 12 18 12',NV,3.400)+P('M17.300 7.600L23.300 12L17.300 16.400Z',NV)},
    // repairs: an open-ended spanner
    wrench:{a:'<g transform="rotate(-45 16 16)">'+R(6.500,13.600,19,4.800,'#cfd4dc')+R(6.500,16.200,19,2.200,'#9aa3b0')+
      P('M1.420 13.800L7 13.800L7 18.200L1.420 18.200A6 6 0 1 0 1.420 13.800Z','#cfd4dc')+P('M30.580 13.800L25 13.800L25 18.200L30.580 18.200A6 6 0 1 1 30.580 13.800Z','#cfd4dc')+
      P('M7 18.200L1.420 18.200A6 6 0 0 0 12.900 17Z','#9aa3b0')+P('M25 18.200L30.580 18.200A6 6 0 0 1 19.100 17Z','#9aa3b0')+'</g>'},
    // settings
    gear:{a:P(gear(16,16,14.500,10.800,8,4.300),'#cfd4dc','fill-rule="evenodd"')+P(ring(16,16,7.600)+ring(16,16,4.300),'#9aa3b0','fill-rule="evenodd"')},
    // go: the chequered flag, laid over with its pole pointing outwards and the cloth towards the text, so the right-hand copy is the mirrored one
    flag:{mir:'right',a:'<g transform="translate(16 16.500) rotate(-55) scale(.92) translate(-17 -16.500)">'+'<clipPath id="tutchq"><path d="M8 5C12.500 2 16.500 8 21 5S27 3.500 29.500 5V19C27 17.500 25 17.500 21 19S12.500 16 8 19Z"/></clipPath>'+
      R(5,3,3,27,'#8a5a2b')+R(6.700,3,1.300,27,'#5e3a17')+P('M8 5C12.500 2 16.500 8 21 5S27 3.500 29.500 5V19C27 17.500 25 17.500 21 19S12.500 16 8 19Z','#fff')+
      '<g clip-path="url(#tutchq)">'+[...Array(30)].map((_,i)=>{ const c=i%6, r=i/6|0; return (c+r)%2?'':R(n(8+c*3.6),n(1+r*3.6),3.6,3.6,'#1b1e2a'); }).join('')+'</g>'+
      C(6.500,3,2.200,'#ffd400')+'</g>'},
    // a bigger boost: the player's red buggy speeding to the right, a jagged flame and the orange squares of the in-game effect behind it.
    nitro:{mir:true,a:S('M-1 8.800H6M-1 12.600H4.500','#fff',1.500,'stroke-linecap="round"')+
      R(-3.400,16,2.100,2.100,'#ff8a00')+R(-2.600,22.200,1.500,1.500,'#ffd400')+R(1.200,24.400,1.800,1.800,'#ffb000')+
      P('M10.500 15.200L4 16.500L6 18L-1.800 19.900L6 21.800L4 23.300L10.500 24.600Z','#ff6a00')+
      P('M10.500 16.900L5.800 17.900L7.300 19L2.200 19.900L7.300 20.800L5.800 21.900L10.500 22.900Z','#ffa000')+
      P('M10.500 18.400L8.200 19.100L5.800 19.900L8.200 20.700L10.500 21.400Z','#ffe14d')+BUGGY},
    // back on track: a big down arrow over a smaller buggy, being dropped back onto the road
    drop:{a:
      P('M13 -1.500H19V5.500H24.500L16 13.500L7.500 5.500H13Z','#ffd400')+P('M16 -1.500H19V5.500H24.500L16 13.500Z','#e9a800')+
      '<g transform="translate(-1.300 7.200) scale(.85)">'+BUGGY+'</g>'},
  };
  for(const k in art) art[k].svg=(right)=>'<svg class="ti" viewBox="-2 -2 36 36">'+((art[k].mir==='right'?right:!right)&&art[k].mir?'<g transform="matrix(-1 0 0 1 32 0)">':'<g>')+
    '<g class="ol">'+art[k].a+'</g>'+art[k].a+'</g></svg>';
  return art;
})();

const TUT_TIPS=[   // at: checkpoints passed (the first: also TUT_FIRST seconds after GO!); text: a function, so the key names are read when shown; e: the symbol on both sides (TUT_ICONS)
  {at:()=>0,              e:'flame',     text:()=>'HOLD '+tutKey('nitro')+' FOR A NITROUS BOOST'},
  {at:()=>1,              e:'hourglass', text:()=>'YOUR NITROUS REGENERATES OVER TIME <span class="nw">(BAR IN '+(simpleUI()?'UPPER':'LOWER')+'-RIGHT)</span>'},   // the simplified HUD (SIMPLIFY_INGAME_UI or the touch controls) moves the bars to the upper right
  {at:()=>2,              e:'nitro',     text:()=>'THE MORE YOU BUILD UP NITROUS, THE BIGGER THE BOOST'},
  {at:()=>4,              e:'turn',      text:()=>'TO MAKE SHARP TURNS AT MAX SPEED, HOLD '+tutKey('brake')+' TO BRAKE WHILE TURNING'},
  {at:()=>TOTAL_LAPS>1?L1():5,   e:'wrench', text:()=>'COMPLETING A LAP REPAIRS SOME CAR DAMAGE'},
  {at:()=>TOTAL_LAPS>1?L1()+2:6, e:'drop',   text:()=>'IF YOU FALL OFF THE TRACK, PRESS '+tutKey('respawn')+' TO GET DROPPED BACK'},
  {at:()=>TOTAL_LAPS>1?L1()+4:7, e:'gear',   text:()=>'AND LAST BUT NOT LEAST: YOU CAN CHANGE DIFFICULTY ON THE TRACK SELECTION SCREEN'},
  {at:()=>TOTAL_LAPS>1?L1()+5:7, e:'flag',   text:()=>'NOW STEP ON IT!'},
];
const TUT_FIRST=2.5, TUT_GAP=1.5, TUT_FADE=0.35, TUT_POP=0.4;          // seconds: first tip after GO!, least time between two tips, fade in and out, the symbols' pop-in
const tutTime=s=>3+s.replace(/<[^>]+>/g,'').length*0.065;                                    // how long a tip stays: longer for longer ones (about 5.5 to 7.5 s)
const tutSeen=new Set();                                               // levels whose tips were shown this session (by id): the next race there gets none
const TUT_FORCE=+((/[?&]tut=(\d+)/.exec(location.search)||[])[1]||0);
const tut={on:false,next:0,cur:-1,t:0,dur:0,gap:0,html:null};
const elTut=$('tut');

function tutStart(){
  const row=LEVEL_TABLE.find(l=>l[0]===LV.id);                          // only tracks open from the start (0 tracks needed in level_registry.js)
  tut.on=FIRST_LEVEL_TUTORIAL&&firstLevel()&&!!row&&row[1]===0&&!tutSeen.has(LV.id); tut.next=0; tut.cur=-1; tut.t=0; tut.gap=0;
}
// from updateRace, while racing (not during the countdown, the pause or after the finish)
function tutStep(dt){
  if(!tut.on) return;
  if(tut.cur>=0){ tut.t+=dt; if(tut.t>=tut.dur){ tut.cur=-1; tut.gap=TUT_GAP; } return; }
  tut.gap-=dt;
  if(tut.gap>0||tut.next>=TUT_TIPS.length||car.wreckT>0) return;
  const passed=(race.lap-1)*(NG+1)+race.next;
  if(passed<TUT_TIPS[tut.next].at()||(tut.next===0&&race.t<TUT_FIRST)) return;
  tut.cur=tut.next++; tut.t=0; tut.dur=tutTime(TUT_TIPS[tut.cur].text()); tutSeen.add(LV.id);
}
// from updateHud, every drawn frame
function tutHud(){
  let i=tut.on&&race.state==='race'?tut.cur:-1, op=0;
  if(i>=0) op=Math.min(1,tut.t/TUT_FADE,(tut.dur-tut.t)/TUT_FADE);
  if(HOLD||uiTop()==='results') i=-1;
  if(TUT_FORCE&&race.state!=='menu'){ i=Math.min(TUT_FORCE,TUT_TIPS.length)-1; op=1; }
  if(i<0){ elTut.style.opacity=0; return; }
  const T=TUT_TIPS[i], I=TUT_ICONS[T.e], h=I.svg(false)+'<span class="tt">'+T.text()+'</span>'+I.svg(true);
  if(h!==tut.html){ elTut.innerHTML=h; tut.html=h;
    // a wrapped (balanced) line keeps its box at the full max-width: shrink it to its widest line, so the symbols sit against the text
    const sp=elTut.querySelector('.tt'), rg=document.createRange(); rg.selectNodeContents(sp);
    const w=Math.max(...[...rg.getClientRects()].map(r=>r.right))-Math.min(...[...rg.getClientRects()].map(r=>r.left));
    if(w>0) sp.style.width=Math.ceil(w+2)+'px'; }
  elTut.style.opacity=op;
  // the symbols pop in with a small overshoot as the tip appears, and shrink as it fades
  const u=TUT_FORCE?1:Math.min(1,tut.t/TUT_POP), back=1+2.2*Math.pow(u-1,3)+1.2*Math.pow(u-1,2);
  elTut.style.setProperty('--tip',(TUT_FORCE?1:Math.min(back,.4+.6*Math.min(1,(tut.dur-tut.t)/TUT_FADE))).toFixed(3));
}
addEventListener('resize',()=>{ tut.html=null; });                     // the font follows the window: measure the tip again
