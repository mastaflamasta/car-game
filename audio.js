'use strict';

// All sounds are generated locally; no audio files or downloads are needed.
const gameAudio=(()=>{
  let context,master,engine,engineGain,streetGain,noiseBuffer;
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
  function update(dt,state){
    const switched=state.mode!==lastMode;
    const seatChanged=state.seats.some((seat,i)=>seat!==lastSeats[i]);
    lastMode=state.mode;lastSeats=[...state.seats];
    if(!context)return;
    const active=!muted&&!state.paused&&!document.hidden;
    master.gain.setTargetAtTime(active?volume/100*2.5:0,context.currentTime,.045);
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
  button.onclick=()=>{muted=!muted;buttonState();if(!muted)start();else if(master)master.gain.setTargetAtTime(0,context.currentTime,.03)};
  slider.oninput=()=>{volume=Number(slider.value);volumeState();try{localStorage.setItem('roadfamily-volume',String(volume))}catch{};start()};
  // Browsers allow playback only after an explicit user gesture.
  window.addEventListener('pointerdown',start);
  window.addEventListener('keydown',start);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&master)master.gain.setTargetAtTime(0,context.currentTime,.03)});
  buttonState();return {update};
})();
