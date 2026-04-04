// ===== Audio =====
let audioCtx=null, bgmGain=null, bgmPlaying=false;
let bgmVol=0.07, seVol=1.0;
function getAudio(){ if(!audioCtx) audioCtx=new(window.AudioContext||window.webkitAudioContext)(); return audioCtx; }
function playTone(freq,type,dur,vol,startFreq){
  try{
    const ac=getAudio(), osc=ac.createOscillator(), g=ac.createGain();
    osc.connect(g); g.connect(ac.destination); osc.type=type;
    if(startFreq){osc.frequency.setValueAtTime(startFreq,ac.currentTime);osc.frequency.exponentialRampToValueAtTime(freq,ac.currentTime+dur*0.5);}
    else osc.frequency.setValueAtTime(freq,ac.currentTime);
    const v=vol*seVol;
    g.gain.setValueAtTime(v,ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+dur);
    osc.start(ac.currentTime); osc.stop(ac.currentTime+dur);
  }catch(e){}
}
function sfxJump(){ if(seVol===0) return; playTone(600,'square',0.12,0.18,280); setTimeout(()=>playTone(900,'square',0.08,0.1),60); }
function sfxCoin(){ if(seVol===0) return; playTone(1200,'sine',0.08,0.15); setTimeout(()=>playTone(1600,'sine',0.1,0.12),50); setTimeout(()=>playTone(2000,'sine',0.12,0.1),110); }
function sfxStomp(){ if(seVol===0) return; playTone(220,'sine',0.1,0.2,440); }
function sfxDamage(){ if(seVol===0) return; playTone(150,'sawtooth',0.25,0.3,400); setTimeout(()=>playTone(100,'sawtooth',0.2,0.2,200),80); }
function sfxKick(){ if(seVol===0) return; playTone(300,'sawtooth',0.08,0.22,520); setTimeout(()=>playTone(160,'square',0.12,0.18),65); }
function sfxChain(){ if(seVol===0) return; playTone(800,'sine',0.06,0.2); setTimeout(()=>playTone(1100,'sine',0.06,0.15),50); setTimeout(()=>playTone(1400,'sine',0.08,0.12),100); }
function sfxStart(){ if(seVol===0) return; [600,800,1000,1300,1700,2200].forEach((f,i)=>{ setTimeout(()=>playTone(f,'sine',0.4,0.13),i*70); }); }
function setBGMVol(v){ bgmVol=v; if(bgmGain) bgmGain.gain.value=v; }
function setSEVol(v){ seVol=v; }
function resumeAudio(){
  if(audioCtx) audioCtx.resume();
  stopBGM();
  setTimeout(()=>{ if(bgmOn) startBGM(); },300);
}

const BGM_NOTES=[[523,.25],[659,.25],[784,.25],[880,.25],[784,.25],[659,.25],[523,.25],[523,.5],[587,.25],[698,.25],[784,.25],[880,.5],[784,.25],[698,.25],[587,.25],[523,.5],[659,.25],[784,.25],[988,.25],[1047,.25],[988,.25],[784,.25],[659,.25],[659,.5],[523,.25],[659,.25],[784,.25],[1047,.5],[784,.5],[659,.25],[523,1.0]];
function startBGM(){
  if(bgmPlaying) return;
  try{
    const ac=getAudio(); bgmGain=ac.createGain(); bgmGain.gain.value=0.07; bgmGain.connect(ac.destination); bgmPlaying=true; scheduleBGM(ac.currentTime);
  }catch(e){}
}
function scheduleBGM(st){
  if(!bgmPlaying) return;
  const ac=getAudio(); let t=st;
  const total=BGM_NOTES.reduce((s,[,d])=>s+d,0);
  BGM_NOTES.forEach(([f,d])=>{
    const o=ac.createOscillator(),e=ac.createGain(); o.connect(e); e.connect(bgmGain);
    o.type='triangle'; o.frequency.value=f;
    e.gain.setValueAtTime(0,t); e.gain.linearRampToValueAtTime(0.6,t+0.02); e.gain.setValueAtTime(0.6,t+d-0.05); e.gain.linearRampToValueAtTime(0,t+d);
    o.start(t); o.stop(t+d); t+=d;
  });
  const bass=[[130,.5],[165,.5],[196,.5],[220,.5],[196,.5],[165,.5],[130,.5],[130,.5],[147,.5],[175,.5],[196,.5],[220,.5],[196,.5],[175,.5],[147,.5],[130,1.0]];
  let bt=st; bass.forEach(([f,d])=>{
    const o=ac.createOscillator(),e=ac.createGain(); o.connect(e); e.connect(bgmGain);
    o.type='sine'; o.frequency.value=f;
    e.gain.setValueAtTime(0,bt); e.gain.linearRampToValueAtTime(0.4,bt+0.02); e.gain.linearRampToValueAtTime(0,bt+d*0.8);
    o.start(bt); o.stop(bt+d); bt+=bt+=d;
  });
  if(bgmPlaying) setTimeout(()=>scheduleBGM(ac.currentTime),(total-0.5)*1000);
}
function stopBGM(){ bgmPlaying=false; if(bgmGain){try{bgmGain.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+0.5);}catch(e){} bgmGain=null;} }
