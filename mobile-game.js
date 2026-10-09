(() => {
  if (!window.matchMedia('(max-width:820px), (pointer:coarse)').matches) return;
  const panel = document.querySelector('.game-panel');
  const stage = panel?.querySelector('.canvas-wrap');
  const family = document.getElementById('family');
  if (!panel || !stage || !document.querySelector('.touch-controls')) return;
  document.documentElement.classList.add('mobile-game-active');
  panel.classList.add('mobile-game-shell');
  stage.classList.add('mobile-game-stage');
  const toolbar = document.createElement('div');
  toolbar.className = 'mobile-game-toolbar';
  toolbar.setAttribute('aria-label', 'Ustawienia gry');
  const scores = document.getElementById('score-counters');
  const settings = document.getElementById('settings-toggle');
  if (scores) toolbar.append(scores);
  if (settings) toolbar.append(settings);
  if (document.documentElement.requestFullscreen) {
    const fullscreen = document.createElement('button');
    fullscreen.type = 'button';
    fullscreen.className = 'mobile-game-fullscreen';
    fullscreen.textContent = '⛶';
    fullscreen.setAttribute('aria-label', 'Pełny ekran');
    fullscreen.onclick = async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen({ navigationUI: 'hide' }); } catch {} };
    toolbar.append(fullscreen);
  }
  const touchPause = document.getElementById('touch-pause');
  if (touchPause) {
    touchPause.classList.add('mobile-toolbar-pause');
    toolbar.append(touchPause);
  }
  panel.prepend(toolbar);
  if (family) { family.classList.add('mobile-family-switcher'); stage.append(family); }
  const radioPanel = panel.querySelector('.radio-panel');
  if (radioPanel) {
    const radioToggle = document.createElement('button');
    radioToggle.type = 'button';
    radioToggle.id = 'mobile-radio-toggle';
    radioToggle.className = 'mobile-radio-toggle';
    radioToggle.textContent = '♫';
    radioToggle.disabled = true;
    radioToggle.setAttribute('aria-label', 'Otwórz sterowanie radiem');
    radioToggle.setAttribute('aria-expanded', 'false');
    radioToggle.onclick = () => {
      if (radioToggle.disabled) return;
      const open = radioPanel.classList.toggle('mobile-radio-open');
      radioToggle.setAttribute('aria-expanded', String(open));
      radioToggle.setAttribute('aria-label', open ? 'Zamknij sterowanie radiem' : 'Otwórz sterowanie radiem');
    };
    stage.append(radioToggle);
    window.updateRadioControls?.();
  }
  const setViewport = () => {
    const viewport = window.visualViewport;
    document.documentElement.style.setProperty('--mobile-height', `${Math.round(viewport?.height || window.innerHeight)}px`);
    window.resetTouchControls?.();
  };
  setViewport();
  window.addEventListener('resize', setViewport, { passive: true });
  window.visualViewport?.addEventListener('resize', setViewport, { passive: true });
})();
