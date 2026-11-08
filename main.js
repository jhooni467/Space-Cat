/* SpaceCat — arranque: tamaño de pantalla, bucle del juego, controles táctiles. */
(function () {
  'use strict';
  var SC = window.SpaceCat;
  var C = SC.CONFIG;
  var Input = SC.Input;

  var canvas = document.getElementById('game');
  var touchUI = document.getElementById('touch');
  var pauseBtn = document.getElementById('pauseBtn');
  var game = null;
  var last = 0;

  // Ajusta el lienzo a la pantalla manteniendo 16:9 y nitidez en pantallas retina.
  function resize() {
    var vw = window.innerWidth, vh = window.innerHeight;
    var scale = Math.min(vw / C.WIDTH, vh / C.HEIGHT);
    var cssW = Math.max(1, Math.floor(C.WIDTH * scale));
    var cssH = Math.max(1, Math.floor(C.HEIGHT * scale));
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }

  function frame(ts) {
    if (!last) last = ts;
    var dt = (ts - last) / 1000;
    last = ts;
    Input.poll();
    game.update(dt);
    SC.Render.draw(game.ctx, game);
    Input.endFrame();
    window.requestAnimationFrame(frame);
  }

  function boot() {
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', function () { setTimeout(resize, 150); });

    var isTouch = ('ontouchstart' in window) ||
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    if (isTouch) {
      touchUI.classList.remove('hidden');
      pauseBtn.classList.remove('hidden');
    }

    Input.init(canvas);
    game = new SC.Game(canvas);
    SC.game = game; // útil para depurar desde la consola del navegador

    // Si cambias de pestaña o app, el juego se pausa solo.
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && game.state === 'playing') game.state = 'paused';
      last = 0;
    });

    window.requestAnimationFrame(frame);
  }

  SC.Assets.load(boot);
})();
