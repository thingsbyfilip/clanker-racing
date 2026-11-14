'use strict';
// Tiny synth: engine drone and one-shot beeps / noise effects.
let AC=null, osc=null, gainN=null, muted=false;   // muted: no key toggles it any more; it is kept for the settings screen to come
function initAudio(){ if(AC) return;
  try{ AC=new (window.AudioContext||window.webkitAudioContext)(); osc=AC.createOscillator(); osc.type='sawtooth';
    const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=420; gainN=AC.createGain(); gainN.gain.value=0;
    osc.connect(f); f.connect(gainN); gainN.connect(AC.destination); osc.start(); }catch(e){ AC=null; } }


function beep(freq,dur,type,delay){
  if(!AC||muted) return;
  const o=AC.createOscillator(), g=AC.createGain(), t0=AC.currentTime+(delay||0);
  o.type=type||'square'; o.frequency.value=freq; g.gain.setValueAtTime(0.0001,t0); g.gain.exponentialRampToValueAtTime(0.12,t0+0.01); g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  o.connect(g); g.connect(AC.destination); o.start(t0); o.stop(t0+dur+0.02);
}
function sfx(kind){
  if(!AC||muted) return;
  const dur={boom:1.3,crash:0.4,splash:0.4,thud:0.25}[kind]||0.3, len=(AC.sampleRate*dur)|0;
  const b=AC.createBuffer(1,len,AC.sampleRate), d=b.getChannelData(0);
  for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2);
  const s=AC.createBufferSource(); s.buffer=b;
  const f=AC.createBiquadFilter(); f.type=kind==='splash'?'highpass':'lowpass';
  f.frequency.value={boom:260,crash:1000,splash:1400,thud:220}[kind]||500;
  const g=AC.createGain(); g.gain.value={boom:1.0,crash:0.6,splash:0.35,thud:0.7}[kind]||0.5;
  s.connect(f); f.connect(g); g.connect(AC.destination); s.start();
}

// The stadium horn of a level whose start word ends in .wav (Cape Town's VUVUZELA.WAV): a long flat B flat blare, well above every other sound.
function vuvuzela(){
  if(!AC||muted) return;
  const t0=AC.currentTime, dur=1.5, f0=233;
  const shape=AC.createWaveShaper(), curve=new Float32Array(1024);                       // hard clipping gives the harsh plastic buzz
  for(let i=0;i<1024;i++) curve[i]=Math.tanh(i/511.5*3.5-3.5);
  shape.curve=curve;
  const low=AC.createBiquadFilter(); low.type='highpass'; low.frequency.value=170;       // no bass: it is a thin horn
  const horn=AC.createBiquadFilter(); horn.type='peaking'; horn.frequency.value=1300; horn.Q.value=1.1; horn.gain.value=9;    // the nasal ring of the bell
  const top=AC.createBiquadFilter(); top.type='lowpass'; top.frequency.value=4200;
  const g=AC.createGain(); g.gain.setValueAtTime(0.0001,t0); g.gain.exponentialRampToValueAtTime(0.55,t0+0.06);
  g.gain.setValueAtTime(0.55,t0+dur-0.18); g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  const lim=AC.createDynamicsCompressor(); lim.threshold.value=-12; lim.knee.value=0; lim.ratio.value=20; lim.attack.value=0.002; lim.release.value=0.1;    // as loud as it gets without clipping the output
  const vol=AC.createGain(); vol.gain.value=0.8;                                         // overall loudness, after the limiter
  shape.connect(low); low.connect(horn); horn.connect(top); top.connect(g); g.connect(lim); lim.connect(vol); vol.connect(AC.destination);
  const wob=AC.createOscillator(), wobG=AC.createGain(); wob.frequency.value=5.3; wobG.gain.value=7;    // an unsteady breath, in cents
  wob.connect(wobG); wob.start(t0); wob.stop(t0+dur+0.02);
  for(const [det,lvl] of [[0,0.5],[9,0.3],[-13,0.3]]){                                   // three players, a little apart
    const o=AC.createOscillator(), a=AC.createGain(); o.type='sawtooth'; a.gain.value=lvl;
    o.frequency.setValueAtTime(f0*0.88,t0); o.frequency.exponentialRampToValueAtTime(f0,t0+0.09);     // the lips scoop up to the note
    o.detune.value=det; wobG.connect(o.detune);
    o.connect(a); a.connect(shape); o.start(t0); o.stop(t0+dur+0.02);
  }
}
