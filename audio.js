'use strict';

// All sounds are generated locally; no audio files or downloads are needed.
const gameAudio=(()=>{
  let context,master,engine,engineGain,streetGain,noiseBuffer,musicGain;
  const tracks=[
    {name:'Poranna trasa',bpm:104,type:'triangle',melody:[72,76,79,76,74,77,81,77,76,79,83,79,74,77,79,71],bass:[48,53,55,55]},
    {name:'Słoneczne kilometry',bpm:128,type:'square',melody:[69,0,72,76,74,72,69,67,65,69,72,69,67,71,74,76],bass:[45,41,48,43]},
    {name:'Noc za oknem',bpm:76,type:'sine',melody:[76,0,79,83,81,0,79,76,74,0,77,81,79,0,74,71],bass:[40,45,41,47]}
  ];
  let radioOn=false,trackIndex=0,musicStep=0,nextMusicTime=0,musicActive=false;
  const musicVoices=new Set();
  let muted=false,typingIn=0,lastMode='interior',lastSeats=[true,true,true];
  const button=document.getElementById('audio-toggle');
  const slider=document.getElementById('audio-volume');
  const volumeLabel=document.getElementById('volume-value');
  let volume=80;
  try{const saved=localStorage.getItem('roadfamily-volume');if(saved!==null&&Number.isFinite(Number(saved)))volume=Math.max(0,Math.min(100,Number(saved)))}catch{}
  function volumeState(){slider.value=volume;volumeLabel.textContent=volume+'%';slider.setAttribute('aria-valuetext',volume+'%')}
  volumeState();
  function buttonState(){
    button.textContent=muted?'♪ Dźwięk: wył.':'♪ Dźwięk: wł.';
    button.setAttribute('aria-pressed',String(!muted));
    button.title=muted?'Włącz dźwięki':'Wycisz dźwięki (uruchamiają się po kliknięciu lub naciśnięciu klawisza)';
  }
  function start(){
    if(muted)return;
    try{
      if(!context){
        const Audio=window.AudioContext||window.webkitAudioContext;
        if(!Audio){button.disabled=true;button.textContent='Dźwięk niedostępny';return}
        context=new Audio();
        master=context.createGain();master.gain.value=0;
        // Keep louder effects from producing sharp peaks at high volume.
        const limiter=context.createDynamicsCompressor();
        limiter.threshold.value=-6;limiter.knee.value=3;limiter.ratio.value=12;
        limiter.attack.value=.003;limiter.release.value=.12;
        master.connect(limiter);limiter.connect(context.destination);
        musicGain=context.createGain();musicGain.gain.value=.28;musicGain.connect(master);
        noiseBuffer=context.createBuffer(1,context.sampleRate*2,context.sampleRate);
        const data=noiseBuffer.getChannelData(0);
        for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
        engineGain=context.createGain();engineGain.gain.value=.12;
        const engineFilter=context.createBiquadFilter();engineFilter.type='lowpass';engineFilter.frequency.value=230;
        engine=context.createOscillator();engine.type='sawtooth';engine.frequency.value=48;
        engine.connect(engineFilter);engineFilter.connect(engineGain);engineGain.connect(master);engine.start();
        const rumble=context.createOscillator();rumble.type='sine';rumble.frequency.value=7;
        const modulation=context.createGain();modulation.gain.value=.025;
        rumble.connect(modulation);modulation.connect(engineGain.gain);rumble.start();
        const street=context.createBufferSource();street.buffer=noiseBuffer;street.loop=true;
        const streetFilter=context.createBiquadFilter();streetFilter.type='lowpass';streetFilter.frequency.value=750;
        streetGain=context.createGain();streetGain.gain.value=.018;
        street.connect(streetFilter);streetFilter.connect(streetGain);streetGain.connect(master);street.start();
      }
      if(context.state==='suspended')context.resume().catch(()=>{});
    }catch(error){button.disabled=true;button.textContent='Dźwięk niedostępny';}
  }
  function tone(frequency,offset=0){
    const t=context.currentTime+offset,osc=context.createOscillator(),gain=context.createGain();
    osc.type='triangle';osc.frequency.setValueAtTime(frequency,t);
    gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.12,t+.008);gain.gain.exponentialRampToValueAtTime(.001,t+.16);
    osc.connect(gain);gain.connect(master);osc.start(t);osc.stop(t+.18);
    osc.onended=()=>{osc.disconnect();gain.disconnect()};
  }
  function keyClick(){
    const t=context.currentTime,source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
    source.buffer=noiseBuffer;filter.type='bandpass';filter.frequency.value=1100+Math.random()*1700;filter.Q.value=1.5;
    gain.gain.setValueAtTime(.045,t);gain.gain.exponentialRampToValueAtTime(.001,t+.035);
    source.connect(filter);filter.connect(gain);gain.connect(master);source.start(t,Math.random(),.04);
    source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect()};
  }
  function stopMusic(){
    if(context)for(const voice of musicVoices){
      voice.gain.gain.cancelScheduledValues(context.currentTime);
      voice.gain.gain.setTargetAtTime(0,context.currentTime,.008);
      voice.osc.stop(context.currentTime+.04);
    }
    musicVoices.clear();musicActive=false;
  }
  function musicNote(note,t,duration,type,level){
    if(!note)return;
    const osc=context.createOscillator(),gain=context.createGain(),voice={osc,gain};
    osc.type=type;osc.frequency.value=440*Math.pow(2,(note-69)/12);
    gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(level,t+.015);
    gain.gain.exponentialRampToValueAtTime(.001,t+duration);
    osc.connect(gain);gain.connect(musicGain);musicVoices.add(voice);
    osc.onended=()=>{osc.disconnect();gain.disconnect();musicVoices.delete(voice)};
    osc.start(t);osc.stop(t+duration+.02);
  }
  function updateMusic(active){
    if(!active||!radioOn){if(musicActive)stopMusic();return}
    const track=tracks[trackIndex],stepDuration=60/track.bpm/2;
    if(!musicActive){nextMusicTime=context.currentTime+.025;musicActive=true}
    // Schedule a short horizon on the audio clock, independent of frame rate.
    if(nextMusicTime<context.currentTime)nextMusicTime=context.currentTime+.025;
    while(nextMusicTime<context.currentTime+.12){
      const step=musicStep%16,bass=track.bass[Math.floor(step/4)];
      musicNote(track.melody[step],nextMusicTime,stepDuration*.85,track.type,track.type==='square'?.045:.11);
      if(step%2===0)musicNote(bass,nextMusicTime,stepDuration*1.6,'triangle',.16);
      if(step%4===0){musicNote(bass+12,nextMusicTime,stepDuration*3,'sine',.055);musicNote(bass+19,nextMusicTime,stepDuration*3,'sine',.035)}
      musicStep++;nextMusicTime+=stepDuration;
    }
  }
  function toggleRadio(){radioOn=!radioOn;stopMusic();if(radioOn){musicStep=0;start()}return radioOn}
  function changeTrack(direction){trackIndex=(trackIndex+direction+tracks.length)%tracks.length;musicStep=0;stopMusic();if(radioOn)start()}
  function radioState(){return {on:radioOn,index:trackIndex,count:tracks.length,name:tracks[trackIndex].name,muted,available:!!(window.AudioContext||window.webkitAudioContext)}}
  function update(dt,state){
    const switched=state.mode!==lastMode;
    const seatChanged=state.seats.some((seat,i)=>seat!==lastSeats[i]);
    lastMode=state.mode;lastSeats=[...state.seats];
    if(!context)return;
    const active=!muted&&!state.paused&&!document.hidden;
    master.gain.setTargetAtTime(active?volume/100*2.5:0,context.currentTime,.045);
    updateMusic(active&&context.state==='running');
    if(!active||context.state!=='running')return;
    const speed=Math.min(Math.abs(state.speed)/100,1);
    engine.frequency.setTargetAtTime(38+speed*95,context.currentTime,.12);
    engineGain.gain.setTargetAtTime((state.mode==='interior'?.09:.14)+speed*.045,context.currentTime,.12);
    streetGain.gain.setTargetAtTime((state.mode==='interior'?.012:.027)+speed*.024,context.currentTime,.2);
    if(switched){tone(state.mode==='driving'?440:660);tone(state.mode==='driving'?660:440,.12)}
    else if(seatChanged)tone(280);
    typingIn-=dt;
    if(typingIn<=0){
      const workers=state.seats.filter(Boolean).length;
      typingIn=.09+Math.random()*.28;
      if(state.mode==='interior'&&workers&&Math.random()<workers/3)keyClick();
    }
  }
  button.onclick=()=>{muted=!muted;buttonState();if(!muted)start();else{stopMusic();if(master)master.gain.setTargetAtTime(0,context.currentTime,.03)}};
  slider.oninput=()=>{volume=Number(slider.value);volumeState();try{localStorage.setItem('roadfamily-volume',String(volume))}catch{};start()};
  // Browsers allow playback only after an explicit user gesture.
  window.addEventListener('pointerdown',start);
  window.addEventListener('keydown',start);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stopMusic();if(master)master.gain.setTargetAtTime(0,context.currentTime,.03)}});
  buttonState();return {update,toggleRadio,changeTrack,radioState};
})();
