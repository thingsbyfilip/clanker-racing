'use strict';
// The saved game: one IndexedDB record holding progress, settings and key bindings. IndexedDB works on file:// (cookies do not, in Chrome).
// SAVE is the live copy: code reads and changes it, then calls saveGame(). `beaten` maps a level id to the hardest difficulty it was
// cleared on (an index into DIFFICULTY_ORDER), `unlockAll` is the Unlock All Tracks button. Binds of actions that are missing keep the defaults.
// With COOKIE_WARNING nothing is created or written until the player says yes (`consent`, askSaving in menu.js); until then SAVE lives only in memory.
const SAVE_DB='clanker_racing', SAVE_STORE='save', SAVE_KEY='game';
const SAVE={beaten:{},unlockAll:false,difficulty:null,mouseRace:false,binds:null,consent:false};
let saveDb=null, saveFailed=false;                    // saveFailed: this browser cannot store anything (the settings screen says so)
let saveAsked=false;                                  // the player was asked this session (a no is not stored anywhere, so the next session asks again)
let saveDue=false;                                    // a track was cleared this session: ask on the way back to the menu
const canSave=()=>!COOKIE_WARNING||SAVE.consent;
// create false: an existing database or null. Opening a database that is not there creates it, and aborting that upgrade takes it away again.
function openSave(create){
  return new Promise((ok,no)=>{
    const r=indexedDB.open(SAVE_DB,1);
    r.onupgradeneeded=()=>{ if(create) r.result.createObjectStore(SAVE_STORE); else r.transaction.abort(); };
    r.onsuccess=()=>ok(r.result); r.onerror=()=>create?no(r.error):ok(null); r.onblocked=()=>no(new Error('blocked'));
  });
}
// reads the record into SAVE; always resolves, with the defaults if nothing can be read (private windows may refuse, and a hung database must not hold up the menu)
function loadSave(){
  const read=(async()=>{
    const db=await openSave(!COOKIE_WARNING);
    if(!db) return;
    saveDb=db;
    const rec=await new Promise((ok,no)=>{ const r=saveDb.transaction(SAVE_STORE).objectStore(SAVE_STORE).get(SAVE_KEY); r.onsuccess=()=>ok(r.result); r.onerror=()=>no(r.error); });
    if(rec) Object.assign(SAVE,rec);
  })().catch(()=>{ saveFailed=true; });
  return Promise.race([read,new Promise(ok=>setTimeout(()=>{ if(!saveDb&&!COOKIE_WARNING) saveFailed=true; ok(); },1500))]);
}
function saveGame(){
  if(!canSave()) return;
  if(!saveDb){ saveFailed=true; return; }
  try{ const t=saveDb.transaction(SAVE_STORE,'readwrite'); t.objectStore(SAVE_STORE).put(JSON.parse(JSON.stringify(SAVE)),SAVE_KEY); t.onerror=t.onabort=()=>{ saveFailed=true; }; }
  catch(e){ saveFailed=true; }
}
// the player said yes: creates the database and stores everything so far
function acceptSaving(){
  return (saveDb?Promise.resolve(saveDb):openSave(true)).then(db=>{ saveDb=db; SAVE.consent=true; saveGame(); }).catch(()=>{ saveFailed=true; });
}
// removes the whole database, and with it the consent: the question comes again on the next occasion
function deleteSave(){
  SAVE.consent=false; saveAsked=false; saveDue=false;      // (only a new clear or a settings change brings the question back)
  if(saveDb){ saveDb.close(); saveDb=null; }
  indexedDB.deleteDatabase(SAVE_DB);
}

// ---------- level progression ----------
// LEVEL_TABLE (level_registry.js) says how many cleared tracks open each level.
const beatenCount=()=>Object.keys(SAVE.beaten).length;
const allBeaten=()=>LEVEL_ORDER.every(l=>SAVE.beaten[l]!==undefined);
const tracksNeeded=i=>LEVEL_TABLE[i][1];
const isLocked=i=>!SAVE.unlockAll&&beatenCount()<tracksNeeded(i);
// a finished race: top 3 clears the track. Returns what it earned, for the results screen (`won`: this clear completed the game).
function recordFinish(id,place){
  const res={cleared:place<=CLEAR_PLACE,unlocked:[],better:false,won:false};
  if(!res.cleared) return res;
  saveDue=true;
  const was=LEVEL_ORDER.map((_,i)=>isLocked(i)), wonBefore=allBeaten(), d=DIFFICULTY_ORDER.indexOf(difficulty), prev=SAVE.beaten[id];
  if(prev===undefined||d>prev){ SAVE.beaten[id]=d; res.better=prev!==undefined; saveGame(); }
  LEVEL_ORDER.forEach((l,i)=>{ if(was[i]&&!isLocked(i)) res.unlocked.push(l); });
  res.won=!wonBefore&&allBeaten();
  return res;
}
