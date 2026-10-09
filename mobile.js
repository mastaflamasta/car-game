(() => {
  if (!window.matchMedia('(max-width:820px), (any-pointer:coarse)').matches) return;
  const panel = document.querySelector('.game-panel');
  if (!panel) return;
  const controls = document.createElement('section');
  controls.className = 'touch-controls';
  controls.setAttribute('aria-label', 'Sterowanie dotykowe');
  controls.innerHTML = `<div class="joystick-area"><div class="joystick" id="joystick" role="button" aria-label="Joystick ruchu"><span class="joystick-arrows">▲<br>◀&nbsp;&nbsp;▶<br>▼</span><span class="joystick-knob"></span></div></div><div class="touch-actions"><button id="touch-interact" type="button">Wstań</button><div><button id="touch-brake" type="button">Hamulec</button><button id="touch-pause" type="button">Ⅱ Pauza</button></div></div>`;
  panel.append(controls);
  const joystick = document.getElementById('joystick');
  const knob = joystick.querySelector('.joystick-knob');
  const interactButton = document.getElementById('touch-interact');
  const brakeButton = document.getElementById('touch-brake');
  const pauseButton = document.getElementById('touch-pause');
  let joystickPointer = null, brakePointer = null;
  const joystickKeys = new Set();
  function clearJoystick() { joystickKeys.forEach(key => touchKeys.delete(key)); joystickKeys.clear(); knob.style.transform = 'translate(0px, 0px)'; joystickPointer = null; }
  function setJoystick(event) {
    const box = joystick.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (event.clientX - box.left - box.width / 2) / (box.width / 2)));
    const y = Math.max(-1, Math.min(1, (event.clientY - box.top - box.height / 2) / (box.height / 2)));
    joystickKeys.forEach(key => touchKeys.delete(key)); joystickKeys.clear();
    if (Math.abs(x) > .24) joystickKeys.add(x > 0 ? 'd' : 'a');
    if (Math.abs(y) > .24) joystickKeys.add(y > 0 ? 's' : 'w');
    joystickKeys.forEach(key => touchKeys.add(key));
    knob.style.transform = `translate(${Math.round(x * 27)}px, ${Math.round(y * 27)}px)`;
  }
  joystick.addEventListener('pointerdown', event => { if (paused || joystickPointer !== null || event.button !== 0) return; event.preventDefault(); joystickPointer = event.pointerId; joystick.setPointerCapture?.(event.pointerId); setJoystick(event); });
  joystick.addEventListener('pointermove', event => { if (event.pointerId === joystickPointer) setJoystick(event); });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) joystick.addEventListener(type, event => { if (event.pointerId === joystickPointer) clearJoystick(); });
  function releaseBrake(event) { if (event.pointerId !== brakePointer) return; touchKeys.delete(' '); brakeButton.classList.remove('held'); brakePointer = null; }
  brakeButton.addEventListener('pointerdown', event => { if (paused || brakeButton.disabled || brakePointer !== null || event.button !== 0) return; event.preventDefault(); brakePointer = event.pointerId; brakeButton.setPointerCapture?.(event.pointerId); touchKeys.add(' '); brakeButton.classList.add('held'); });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) brakeButton.addEventListener(type, releaseBrake);
  window.resetTouchControls = () => { clearJoystick(); touchKeys.delete(' '); brakePointer = null; brakeButton.classList.remove('held'); };
  window.updateTouchControls = () => { interactButton.textContent = interactionLabel(); interactButton.disabled = paused || interactionUnavailable(); brakeButton.disabled = mode !== 'driving' || paused; pauseButton.textContent = paused ? '▶ Wznów' : 'Ⅱ Pauza'; };
  interactButton.onclick = interact;
  pauseButton.onclick = togglePause;
  window.addEventListener('resize', window.resetTouchControls, { passive: true });
  window.addEventListener('orientationchange', window.resetTouchControls, { passive: true });
  window.updateTouchControls();
})();
