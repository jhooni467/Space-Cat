/* SpaceCat — rendimiento: calidad gráfica automática.
 *
 * Mide cuánto tarda cada fotograma mientras juegas. Si el dispositivo no llega a ~45 fps de forma sostenida,
 * baja un nivel de calidad (menos píxeles y menos adornos). Nunca toca la jugabilidad ni el tamaño de nada.
 * El nivel elegido se recuerda para la próxima vez. Nunca sube solo (evita vaivenes).
 *
 *  Niveles:  0 = alta  ·  1 = media (80 % de resolución, sin pájaros ni luciérnagas)  ·  2 = baja (62 %, sin brillos extra)
 *  Para probar:   index.html?debug   muestra FPS y calidad  ·  index.html?q=2   fuerza un nivel  ·  tecla Q cambia de nivel */
(function (global) {
  'use strict';
  var SC = global.SpaceCat = global.SpaceCat || {};
  var KEY = 'spacecat.quality';
  var PRESETS = [
    { res: 1.0, fx: 2 },
    { res: 0.8, fx: 1 },
    { res: 0.62, fx: 0 }
  ];
  var WINDOW = 90;        // fotogramas por ventana de medición
  var SLOW_MS = 22.5;     // por encima de esto (< ~44 fps) la ventana cuenta como lenta
  var WARMUP = 150;       // se ignoran los primeros fotogramas (carga, JIT)

  function readStored() {
    try { var v = parseInt(global.localStorage.getItem(KEY), 10); return v >= 0 && v <= 2 ? v : 0; } catch (e) { return 0; }
  }
  function store(v) { try { global.localStorage.setItem(KEY, String(v)); } catch (e) { /* ok */ } }

  var search = (global.location && global.location.search) || '';
  var forced = /[?&]q=([0-2])/.exec(search);
  var acc = 0, n = 0, slow = 0, seen = 0, shown = 0, fpsAcc = 0, fpsN = 0;

  var Perf = SC.Perf = {
    debug: /[?&]debug\b/.test(search),
    forced: !!forced,
    level: forced ? parseInt(forced[1], 10) : readStored(),
    res: 1, fx: 2, fps: 0,

    apply: function () { var p = PRESETS[Perf.level]; Perf.res = p.res; Perf.fx = p.fx; },

    set: function (lvl, remember) {
      Perf.level = Math.max(0, Math.min(PRESETS.length - 1, lvl));
      Perf.apply();
      if (remember !== false && !Perf.forced) store(Perf.level);
      acc = n = slow = 0;
    },
    cycle: function () { Perf.set((Perf.level + 1) % PRESETS.length, false); },

    // Se llama cada fotograma con lo que tardó (ms). Devuelve true si cambió la calidad (hay que reajustar el lienzo).
    frame: function (ms, playing) {
      fpsAcc += ms; fpsN++;
      if (fpsAcc >= 500) { Perf.fps = Math.round(1000 * fpsN / fpsAcc); fpsAcc = 0; fpsN = 0; }
      if (!playing || Perf.forced || ms > 120) return false;      // pausas y tirones por cambiar de app no cuentan
      if (++seen < WARMUP) return false;
      acc += ms; n++;
      if (n < WINDOW) return false;
      var avg = acc / n;
      acc = 0; n = 0;
      slow = avg > SLOW_MS ? slow + 1 : 0;
      if (slow >= 2 && Perf.level < PRESETS.length - 1) {   // dos ventanas lentas seguidas: baja un nivel
        Perf.set(Perf.level + 1);
        slow = 0; seen = WARMUP - 30;
        return true;
      }
      return false;
    }
  };
  Perf.apply();
})(typeof window !== 'undefined' ? window : globalThis);
