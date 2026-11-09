/* SpaceCat — arranque: tamaño de pantalla, bucle del juego, controles táctiles. */
(function () {
  'use strict';
  var SC = window.SpaceCat;
  var C = SC.CONFIG;
  var Input = SC.Input;
  var View = SC.View;
  var Perf = SC.Perf;

  var canvas = document.getElementById('game');
  var touchUI = document.getElementById('touch');
  var pauseBtn = document.getElementById('pauseBtn');
  var safeProbe = document.getElementById('safe');
  var game = null;
  var last = 0;

  // Zonas seguras (muescas de cámara, barras del sistema): el CSS las conoce, aquí se leen para el HUD.
  function readSafe() {
    if (!safeProbe || !window.getComputedStyle) return {};
    var cs = window.getComputedStyle(safeProbe);
    return {
      t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0,
      b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0
    };
  }

  // El lienzo ocupa TODA la pantalla. La vista se adapta (ver view.js): no se estira, se ve más escenario o más cielo.
  function resize() {
    var vv = window.visualViewport;
    var vw = Math.max(1, Math.round(vv && vv.width ? vv.width : window.innerWidth));
    var vh = Math.max(1, Math.round(vv && vv.height ? vv.height : window.innerHeight));
    View.update(vw, vh, Perf.res, readSafe());
    canvas.style.width = vw + 'px';
    canvas.style.height = vh + 'px';
    // Cambiar width/height borra el lienzo: solo se hace si de verdad cambió.
    if (canvas.width !== View.pxW) canvas.width = View.pxW;
    if (canvas.height !== View.pxH) canvas.height = View.pxH;
  }

  var pauseMenu = document.getElementById('pauseMenu');
  var portraitMQ = window.matchMedia ? window.matchMedia('(orientation: portrait)') : null;
  var shown = '';

  function isPortrait() {
    return portraitMQ ? portraitMQ.matches : window.innerHeight > window.innerWidth;
  }

  // Mantiene los botones HTML (pausa / menú) acordes al estado del juego.
  function syncUI() {
    if (shown === game.state) return;
    shown = game.state;
    pauseMenu.classList.toggle('hidden', shown !== 'paused');
    pauseBtn.classList.toggle('hidden', shown !== 'playing');
  }

  function frame(ts) {
    if (isPortrait()) {            // en vertical: se pausa y no se gasta batería
      game.pause();
      Input.releaseAll();
      syncUI();
      last = 0;
      window.requestAnimationFrame(frame);
      return;
    }
    if (!last) last = ts;
    var raw = ts - last;
    var dt = raw / 1000;
    last = ts;
    // Calidad automática: si el dispositivo va justo, baja resolución y adornos (nunca la jugabilidad).
    if (Perf.frame(raw, game.state === 'playing')) resize();
    Input.poll();
    game.update(dt);
    SC.Render.draw(game.ctx, game);
    Input.endFrame();
    syncUI();
    window.requestAnimationFrame(frame);
  }

  function boot() {
    var isTouch = ('ontouchstart' in window) ||
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    SC.touch = !!isTouch;
    if (isTouch) touchUI.classList.remove('hidden');

    resize();
    window.addEventListener('resize', resize);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
    window.addEventListener('orientationchange', function () { Input.releaseAll(); setTimeout(resize, 150); });
    document.addEventListener('fullscreenchange', function () { setTimeout(resize, 80); });
    document.addEventListener('webkitfullscreenchange', function () { setTimeout(resize, 80); });

    Input.init(canvas);
    game = new SC.Game(canvas);
    SC.game = game; // útil para depurar desde la consola del navegador

    // Si cambias de pestaña o app, el juego se pausa solo.
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) game.pause();
      last = 0;
    });

    // Teclas de ayuda: F = pantalla completa, Q = cambiar calidad gráfica (para probar en equipos lentos).
    window.addEventListener('keydown', function (e) {
      if (e.repeat) return;
      if (e.code === 'KeyF' && SC.Fullscreen) SC.Fullscreen.toggle();
      else if (e.code === 'KeyQ') {
        Perf.cycle(); resize();
        game.showToast('Calidad gráfica: ' + ['alta', 'media', 'baja'][Perf.level]);
      }
    });

    // Botones del menú de pausa.
    pauseMenu.addEventListener('click', function (e) {
      var act = e.target && e.target.getAttribute && e.target.getAttribute('data-menu');
      if (act === 'resume') game.resume();
      else if (act === 'restart') game.restartLevel();
    });

    window.requestAnimationFrame(frame);
  }

  SC.Assets.load(boot);
})();
