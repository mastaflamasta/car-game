'use strict';
// Separate pointer ownership lets the joystick and brake work together.
const mobilePanel=document.createElement('section');
mobilePanel.className='touch-controls';
mobilePanel.setAttribute('aria-label','Sterowanie dotykowe');
mobilePanel.innerHTML=`<div class="joystick-area"><div id="joystick" class="joystick" aria-label="Joystick: przeciągnij, aby chodzić lub kierować"><span class="joystick-arrows" aria-hidden="true">↑<br>←　→<br>↓</span><span id="joystick-knob" class="joystick-knob"></span></div><small id="touch-move-hint">Przeciągnij, żeby chodzić</small></div><div class="touch-actions"><button id="touch-interact" type="button">Wstań</button><div><button id="touch-brake" type="button" disabled>Hamulec</button><button id="touch-pause" type="button" aria-pressed="false">Ⅱ Pauza</button></div></div>`;
document.querySelector('.game-panel').append(mobilePanel);
const joystick=$('joystick'),knob=$('joystick-knob'),brakeButton=$('touch-brake');
let joystickPointer=null,brakePointer=null;
let lastControlState='';
function releaseCapture(element,id){if(id!==null&&element.hasPointerCapture(id))element.releasePointerCapture(id)}
function resetTouchControls(){
  const stickId=joystickPointer,brakeId=brakePointer;
  joystickPointer=brakePointer=null;touchKeys.clear();
  knob.style.transform='translate(0px,0px)';brakeButton.classList.remove('held');
  releaseCapture(joystick,stickId);releaseCapture(brakeButton,brakeId);
}
function moveJoystick(e){
  if(e.pointerId!==joystickPointer)return;
  const box=joystick.getBoundingClientRect(),radius=box.width*.3;
  let x=e.clientX-box.left-box.width/2,y=e.clientY-box.top-box.height/2;
  const length=Math.hypot(x,y),scale=length>radius?radius/length:1;x*=scale;y*=scale;
  knob.style.transform=`translate(${x}px,${y}px)`;
  for(const key of ['w','a','s','d'])touchKeys.delete(key);
  if(x>radius*.28)touchKeys.add('d');if(x<-radius*.28)touchKeys.add('a');
  if(y>radius*.28)touchKeys.add('s');if(y<-radius*.28)touchKeys.add('w');
}
joystick.addEventListener('pointerdown',e=>{
  if(paused||joystickPointer!==null||e.button!==0)return;
  e.preventDefault();joystickPointer=e.pointerId;joystick.setPointerCapture(e.pointerId);moveJoystick(e);
});
joystick.addEventListener('pointermove',moveJoystick);
function endJoystick(e){if(e.pointerId!==joystickPointer)return;joystickPointer=null;for(const key of ['w','a','s','d'])touchKeys.delete(key);knob.style.transform='translate(0px,0px)'}
for(const event of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(event,endJoystick);
brakeButton.addEventListener('pointerdown',e=>{
  if(paused||mode!=='driving'||brakePointer!==null||e.button!==0)return;
  e.preventDefault();brakePointer=e.pointerId;brakeButton.setPointerCapture(e.pointerId);touchKeys.add(' ');brakeButton.classList.add('held');
});
function endBrake(e){if(e.pointerId!==brakePointer)return;brakePointer=null;touchKeys.delete(' ');brakeButton.classList.remove('held')}
for(const event of ['pointerup','pointercancel','lostpointercapture'])brakeButton.addEventListener(event,endBrake);
$('touch-interact').onclick=interact;
$('touch-pause').onclick=togglePause;
function updateTouchControls(){
  const p=family[selected];
  const label=mode==='driving'?'Wróć do wnętrza':p.seated?'Wstań':p.y<-42?'Przejmij kierownicę':Math.hypot(p.x-p.seat.x,p.y-p.seat.y)<33?'Usiądź':'Interakcja';
  const state=[label,mode,paused,touchHint(true,false)].join('|');
  if(state===lastControlState)return;
  lastControlState=state;
  if($('touch-interact').textContent!==label)$('touch-interact').textContent=label;
  $('touch-interact').disabled=paused;brakeButton.disabled=paused||mode!=='driving';
  const pauseLabel=paused?'▶ Wznów':'Ⅱ Pauza';
  if($('touch-pause').textContent!==pauseLabel)$('touch-pause').textContent=pauseLabel;
  $('touch-pause').setAttribute('aria-pressed',String(paused));
  $('touch-move-hint').textContent=mode==='driving'?'↑ Gaz · ↓ Hamulec · ← → Skręt':'Przeciągnij, żeby chodzić';
  $('pause-overlay').querySelector('span').textContent=touchHint('Dotknij „Wznów”, żeby wrócić','Naciśnij P, żeby wrócić');
}
window.resetTouchControls=resetTouchControls;
window.updateTouchControls=updateTouchControls;
window.addEventListener('resize',resetTouchControls);
updateTouchControls();
