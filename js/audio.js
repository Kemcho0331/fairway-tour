/* Fairway Tour · Generated music, tension music, and sound effects */
'use strict';
/* ---------- Audio: generated music + effects ---------- */
const Sound = (() => {
  let ac=null, master, musicBus, sfxBus, delay, noiseBuf, nextT=0, step=0, mel=4;
  let muted = save.muted;
  const MOODS = {
    spring:{bpm:88,  wave:'triangle', oct:0,  density:.48, chords:[{root:41,notes:[53,57,60,64]},{root:38,notes:[50,53,57,60]},{root:43,notes:[55,58,62,65]},{root:36,notes:[52,55,58,60]}], scale:[60,62,65,67,69,72,74,77,79,81]},
    summer:{bpm:100, wave:'triangle', oct:0,  density:.6,  chords:[{root:36,notes:[52,55,59,62]},{root:45,notes:[52,57,60,64]},{root:38,notes:[53,57,60,62]},{root:43,notes:[53,55,59,62]}], scale:[60,62,64,67,69,72,74,76,79,81]},
    fall:  {bpm:78,  wave:'triangle', oct:0,  density:.38, chords:[{root:45,notes:[55,57,60,64]},{root:41,notes:[53,57,60,64]},{root:38,notes:[50,53,57,60]},{root:40,notes:[52,55,59,62]}], scale:[57,60,62,64,67,69,72,74,76,79]},
    winter:{bpm:70,  wave:'sine',     oct:12, density:.42, chords:[{root:39,notes:[55,58,62,63]},{root:36,notes:[51,55,58,62]},{root:44,notes:[56,60,63,67]},{root:46,notes:[53,58,62,65]}], scale:[63,65,67,70,72,75,77,79,82,84]},
  };
  let mood=MOODS.spring, EIGHTH=60/mood.bpm/2, tension=false;
  const mtof = m => 440*Math.pow(2,(m-69)/12);
  function env(g,t,vol,a,d){ g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+a); g.gain.exponentialRampToValueAtTime(0.0001,t+a+d); }
  function tone(f,t,dur,type,vol,dest,a=0.004,fEnd){ const o=ac.createOscillator(), g=ac.createGain(); o.type=type; o.frequency.setValueAtTime(f,t); if(fEnd) o.frequency.exponentialRampToValueAtTime(fEnd,t+dur); env(g,t,vol,a,dur); o.connect(g); g.connect(dest); o.start(t); o.stop(t+a+dur+0.05); }
  function noise(t,dur,vol,type,f,q,dest,fEnd,a=0.004){ const s=ac.createBufferSource(); s.buffer=noiseBuf; const fl=ac.createBiquadFilter(); fl.type=type; fl.frequency.setValueAtTime(f,t); if(fEnd) fl.frequency.exponentialRampToValueAtTime(fEnd,t+dur); fl.Q.value=q; const g=ac.createGain(); env(g,t,vol,a,dur); s.connect(fl); fl.connect(g); g.connect(dest); s.start(t, Math.random()*1.5); s.stop(t+a+dur+0.05); }
  function pad(f,t,dur){ [-6,6].forEach(dt=>{ const o=ac.createOscillator(), g=ac.createGain(), lp=ac.createBiquadFilter(); o.type='triangle'; o.frequency.value=f; o.detune.value=dt; lp.type='lowpass'; lp.frequency.value=900; g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.03,t+0.6); g.gain.setValueAtTime(0.03,t+dur-0.4); g.gain.exponentialRampToValueAtTime(0.0001,t+dur+0.3); o.connect(lp); lp.connect(g); g.connect(musicBus); o.start(t); o.stop(t+dur+0.4); }); }
  function pluck(f,t){ const o=ac.createOscillator(), g=ac.createGain(); o.type=mood.wave; o.frequency.value=f; env(g,t,mood.wave==='sine'?0.09:0.075,0.005,mood.wave==='sine'?0.9:0.5); o.connect(g); g.connect(musicBus); g.connect(delay); o.start(t); o.stop(t+0.6); }
  function playStep(s,t){
    if(tension) return tenseStep(s,t);
    const bar=Math.floor(s/8), pos=s%8, ch=mood.chords[bar];
    if(pos===0) ch.notes.forEach(m=>pad(mtof(m),t,EIGHTH*8));
    if(pos===0||pos===4){ tone(mtof(ch.root),t,EIGHTH*2.6,'sine',0.17,musicBus,0.01); tone(110,t,0.16,'sine',0.16,musicBus,0.003,42); }
    if(pos===6) tone(mtof(ch.root+7),t,EIGHTH*1.4,'sine',0.11,musicBus,0.01);
    if(pos%2===1) noise(t,0.035,0.022,'highpass',7000,0.7,musicBus);
    if(pos===2||pos===6) noise(t,0.07,0.04,'bandpass',1900,1.2,musicBus);
    if(Math.random() < (pos%2===0 ? mood.density : mood.density*0.42)){ mel=clamp(mel+[-2,-1,-1,1,1,2][Math.random()*6|0],0,mood.scale.length-1); pluck(mtof(mood.scale[mel]+mood.oct),t); }
  }
  // final hole of a major: the season's own chords and voice, but held, pulsing, with a heartbeat underneath
  function tenseStep(s,t){
    const bar=Math.floor(s/8)%2, pos=s%8, ch=mood.chords[bar];
    if(pos===0) ch.notes.forEach(m=>pad(mtof(m),t,EIGHTH*8));
    tone(mtof(ch.root),t,EIGHTH*0.8,'triangle',0.06,musicBus,0.01);
    if(pos===0||pos===1) tone(pos?62:72,t,0.16,'sine',pos?0.26:0.34,musicBus,0.003,38);
    if(pos%2===1) noise(t,0.03,0.012,'highpass',8000,0.7,musicBus);
    if(pos===4) tone(mtof(ch.notes[3]+12),t,EIGHTH*3.5,mood.wave,0.035,musicBus,0.2);
    if(pos%2===0 && Math.random()<mood.density*0.45){ mel=clamp(mel+[-1,-1,1,1,2][Math.random()*5|0],0,mood.scale.length-1); pluck(mtof(mood.scale[mel]+mood.oct),t); }
  }
  function schedule(){ if(!ac) return; while(nextT < ac.currentTime+0.25){ playStep(step,nextT); nextT+=EIGHTH; step=(step+1)%32; } }
  function init(){
    if(ac){ if(ac.state==='suspended') ac.resume(); return; }
    const AC = window.AudioContext||window.webkitAudioContext; if(!AC) return;
    try{ ac=new AC(); }catch(e){ ac=null; return; }
    master=ac.createGain(); master.gain.value=muted?0:0.9;
    const comp=ac.createDynamicsCompressor(); master.connect(comp); comp.connect(ac.destination);
    musicBus=ac.createGain(); musicBus.gain.value=0.6;
    const lp=ac.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=3400; musicBus.connect(lp); lp.connect(master);
    delay=ac.createDelay(1.5); delay.delayTime.value=EIGHTH*1.5;
    const fb=ac.createGain(); fb.gain.value=0.3; const wet=ac.createGain(); wet.gain.value=0.3;
    delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(lp);
    sfxBus=ac.createGain(); sfxBus.gain.value=1; sfxBus.connect(master);
    noiseBuf=ac.createBuffer(1, ac.sampleRate*2, ac.sampleRate); const d=noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
    nextT=ac.currentTime+0.15; setInterval(schedule,40);
  }
  const now = () => ac.currentTime+0.01;
  return {
    init,
    setTension(on){ on=!!on; if(on===tension) return; tension=on; EIGHTH=60/(mood.bpm*(tension?1.18:1))/2; },
    setSeason(id){ mood=MOODS[id]||MOODS.spring; EIGHTH=60/(mood.bpm*(tension?1.18:1))/2; if(ac&&delay) delay.delayTime.setTargetAtTime(EIGHTH*1.5, ac.currentTime, 0.3); },
    get muted(){ return muted; },
    setMuted(m){ muted=m; if(ac) master.gain.setTargetAtTime(m?0:0.9, ac.currentTime, 0.05); },
    suspend(){ if(ac && ac.state==='running') ac.suspend(); },
    resume(){ if(ac && ac.state==='suspended') ac.resume(); },
    swing(p){ if(!ac) return; noise(now(),0.2,0.08+0.2*p,'bandpass',500,1.4,sfxBus,2600,0.02); },
    hit(){ if(!ac) return; const t=now()+0.06; noise(t,0.03,0.5,'highpass',2500,0.8,sfxBus); tone(620,t,0.06,'triangle',0.28,sfxBus,0.002,300); },
    putt(p){ if(!ac) return; const t=now(); tone(1050,t,0.07,'triangle',0.12+0.12*p,sfxBus,0.002); tone(2100,t,0.04,'sine',0.06,sfxBus,0.002); },
    land(type){ if(!ac) return; const t=now();
      if(type===SAND||type===POT||type===WASTE) noise(t,0.28,0.3,'bandpass',900,0.9,sfxBus,400);
      else if(type===ROUGH) noise(t,0.12,0.18,'lowpass',600,0.7,sfxBus);
      else tone(150,t,0.09,'sine',0.25,sfxBus,0.002,90); },
    cup(){ if(!ac) return; const t=now(); [1400,1100,1650,1250].forEach((f,i)=>tone(f,t+i*0.065,0.14,'sine',0.17,sfxBus,0.002)); tone(220,t+0.28,0.2,'sine',0.2,sfxBus,0.002,120); },
    lip(){ if(!ac) return; tone(1300,now(),0.08,'sine',0.14,sfxBus,0.002,900); },
    splash(){ if(!ac) return; const t=now(); noise(t,0.7,0.45,'lowpass',1600,0.6,sfxBus,250,0.01); for(let i=0;i<6;i++) tone(300+Math.random()*400,t+0.15+i*0.07,0.08,'sine',0.07,sfxBus,0.004,700); },
    thunk(){ if(!ac) return; const t=now(); tone(95,t,0.16,'sine',0.4,sfxBus,0.002,60); noise(t,0.1,0.22,'lowpass',380,0.8,sfxBus); },
    cheer(level=1){ if(!ac) return; const t=now(); noise(t,2.2,0.22*level,'bandpass',1400,0.5,sfxBus,900,0.35); for(let i=0;i<Math.round(16*level);i++) noise(t+0.15+Math.random()*1.6,0.03,0.18*level,'highpass',1200,0.8,sfxBus); },
    coin(){ if(!ac) return; const t=now(); tone(1320,t,0.08,'square',0.06,sfxBus,0.002); tone(1760,t+0.08,0.22,'square',0.06,sfxBus,0.002); },
    tick(){ if(!ac) return; tone(880,now(),0.05,'sine',0.07,sfxBus,0.002); },
  };
})();
