'use strict';
const radioPanel=document.createElement('section');
radioPanel.className='radio-panel';radioPanel.setAttribute('aria-label','Radio samochodowe');
radioPanel.innerHTML=`<div class="radio-display"><span>♪ RADIO RODZINNE</span><strong id="radio-track"></strong><small id="radio-access"></small></div><div class="radio-buttons"><button id="radio-prev" type="button" aria-label="Poprzedni utwór">◀</button><button id="radio-power" type="button" aria-pressed="false">Włącz radio</button><button id="radio-next" type="button" aria-label="Następny utwór">▶</button></div>`;
document.querySelector('.game-panel').append(radioPanel);
let lastRadioState='';
function operateRadio(action){
  if(paused||!atPassengerSeat())return;
  if(action==='power')gameAudio.toggleRadio();else gameAudio.changeTrack(action==='next'?1:-1);
  updateRadioControls();
}
$('radio-prev').onclick=()=>operateRadio('prev');
$('radio-next').onclick=()=>operateRadio('next');
$('radio-power').onclick=()=>operateRadio('power');
window.addEventListener('keydown',e=>{
  if(e.target instanceof HTMLInputElement||!['r','[',']'].includes(e.key.toLowerCase()))return;
  if(!atPassengerSeat()||paused)return;
  e.preventDefault();if(e.repeat)return;
  operateRadio(e.key.toLowerCase()==='r'?'power':e.key==='['?'prev':'next');
});
function updateRadioControls(){
  const radio=gameAudio.radioState(),access=atPassengerSeat()&&!paused&&radio.available;
  const state=JSON.stringify([radio,access,paused]);if(state===lastRadioState)return;lastRadioState=state;
  $('radio-track').textContent=`${String(radio.index+1).padStart(2,'0')} / ${radio.count} · ${radio.name}`;
  $('radio-access').textContent=!radio.available?'Dźwięk niedostępny w tej przeglądarce.':paused?'Podróż i muzyka zatrzymane.':!access?'Podejdź do przedniego prawego fotela i usiądź (E / Interakcja).':radio.muted?'Dźwięk wyciszony — włącz go w nagłówku.':radio.on?'Gra · możesz zmienić utwór lub wyłączyć radio.':'Radio wyłączone · wybierz utwór i włącz muzykę.';
  $('radio-power').textContent=radio.on?'Wyłącz radio':'Włącz radio';
  $('radio-power').setAttribute('aria-pressed',String(radio.on));
  for(const id of ['radio-prev','radio-power','radio-next'])$(id).disabled=!access;
  radioPanel.classList.toggle('playing',radio.on&&!radio.muted&&!paused);
}
window.updateRadioControls=updateRadioControls;
updateRadioControls();
