/* Space Cat — elementos en PIXEL ART (portal, etc.). Se generan en una cuadrícula pequeña
 * y se escalan SIN suavizado para conservar píxeles definidos. */
(function (global) {
  'use strict';
  var SC = global.SpaceCat = global.SpaceCat || {};
  var PW = 24, PH = 36, FRAMES = 8, SCALE = 4;
  var PAL = ['#071a2e', '#0b2f50', '#0f4a7a', '#1670b4', '#2a9be6', '#7cd0ff']; // del centro al borde
  var frames = [];

  function build(f) {
    var cv = global.document.createElement('canvas');
    cv.width = PW; cv.height = PH;
    var c = cv.getContext('2d'), ph = f / FRAMES * Math.PI * 2;
    for (var y = 0; y < PH; y++) for (var x = 0; x < PW; x++) {
      var u = (x + 0.5 - PW / 2) / (PW / 2), v = (y + 0.5 - PH / 2) / (PH / 2);
      var a = Math.atan2(v, u), r = Math.sqrt(u * u + v * v);
      var edge = 0.94 - 0.05 * Math.sin(a * 3 + ph) - 0.03 * Math.sin(a * 5 - ph * 2);
      if (r > edge) continue;
      var k = r / edge + 0.07 * Math.sin(a + r * 4 - ph); // remolino suave
      var idx = k < 0.22 ? 0 : k < 0.42 ? 1 : k < 0.62 ? 2 : k < 0.8 ? 3 : k < 0.93 ? 4 : 5;
      c.fillStyle = PAL[idx]; c.fillRect(x, y, 1, 1);
    }
    return cv;
  }

  SC.Pixel = {
    // Dibuja el portal con la base en (cx, baseY). t = tiempo en segundos.
    drawPortal: function (ctx, cx, baseY, t) {
      if (!frames.length) for (var i = 0; i < FRAMES; i++) frames.push(build(i));
      var f = frames[Math.floor(t * 7) % FRAMES];
      var was = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(f, Math.round(cx - PW * SCALE / 2), Math.round(baseY - PH * SCALE), PW * SCALE, PH * SCALE);
      ctx.imageSmoothingEnabled = was;
      ctx.fillStyle = '#7cd0ff'; // chispas orbitando (pixeles)
      for (var j = 0; j < 6; j++) {
        var a = t * 1.4 + j * 1.05, rx = 50 + (j % 2) * 8;
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 3 + j);
        ctx.fillRect(Math.round(cx + Math.cos(a) * rx / 4) * 4 - 2 + 0, Math.round(baseY - PH * SCALE / 2 + Math.sin(a) * 60 / 4) * 4, 4, 4);
      }
      ctx.globalAlpha = 1;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
