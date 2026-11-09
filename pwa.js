/* SpaceCat — PWA: instalación, modo sin conexión y pantalla completa.
 *
 *  - Registra el Service Worker (sw.js): guarda el juego en el dispositivo y lo abre sin Internet.
 *  - Pantalla completa: se activa con el primer toque (los navegadores solo la permiten tras un gesto del jugador)
 *    y se reintenta si se sale de ella. En PC se alterna con la tecla F.
 *  - Instalado como app (pantalla de inicio) ya abre sin barras del navegador: ver manifest.webmanifest. */
(function (global) {
  'use strict';
  var SC = global.SpaceCat = global.SpaceCat || {};
  var doc = global.document, nav = global.navigator;

  var standalone = !!((global.matchMedia && (global.matchMedia('(display-mode: standalone)').matches ||
    global.matchMedia('(display-mode: fullscreen)').matches)) || nav.standalone);
  var ua = nav.userAgent || '';
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);

  /* ---------- pantalla completa ---------- */
  var root = doc.documentElement;
  var reqFn = root.requestFullscreen || root.webkitRequestFullscreen || root.msRequestFullscreen;
  var exitFn = doc.exitFullscreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

  function active() { return !!(doc.fullscreenElement || doc.webkitFullscreenElement); }

  function lockLandscape() {
    try {
      var so = global.screen && global.screen.orientation;
      if (so && so.lock) so.lock('landscape').catch(function () { /* no permitido: la orientación se pide en el manifest */ });
    } catch (e) { /* sin soporte */ }
  }

  var Fullscreen = SC.Fullscreen = {
    supported: !!reqFn,
    active: active,
    enter: function () {
      if (!reqFn || active()) return;
      try {
        var p = reqFn.call(root, { navigationUI: 'hide' });
        if (p && p.then) p.then(lockLandscape, function () { /* el navegador lo rechazó: se reintenta con el próximo toque */ });
        else lockLandscape();
      } catch (e) { /* sin soporte */ }
    },
    exit: function () { if (exitFn && active()) exitFn.call(doc); },
    toggle: function () { if (active()) Fullscreen.exit(); else Fullscreen.enter(); }
  };

  // En pantallas táctiles, el primer toque (y cada toque tras salir) pide pantalla completa.
  // Instalado como app ya está a pantalla completa, así que no hace falta.
  function onGesture() {
    if (SC.touch && !standalone && !active()) Fullscreen.enter();
  }
  doc.addEventListener('pointerup', onGesture, true);
  doc.addEventListener('touchend', onGesture, true);

  /* ---------- instalación y sin conexión ---------- */
  var secure = global.location.protocol === 'https:' ||
    /^(localhost|127\.0\.0\.1|\[::1\])$/.test(global.location.hostname);

  SC.PWA = {
    standalone: standalone,
    isIOS: isIOS,
    // iPhone/iPad no permiten pantalla completa desde la web: hay que "Añadir a pantalla de inicio".
    needsHomeScreen: isIOS && !standalone,
    offlineReady: false
  };

  if ('serviceWorker' in nav && secure) {
    global.addEventListener('load', function () {
      nav.serviceWorker.register('sw.js', { scope: './' }).then(function (reg) {
        // El juego ya está guardado cuando el Service Worker queda activo.
        if (reg.active) SC.PWA.offlineReady = true;
        reg.addEventListener('updatefound', function () {
          var w = reg.installing;
          if (!w) return;
          w.addEventListener('statechange', function () { if (w.state === 'activated') SC.PWA.offlineReady = true; });
        });
      }).catch(function () { /* sin Service Worker el juego funciona igual, solo que sin modo offline */ });
    });
  }
})(window);
