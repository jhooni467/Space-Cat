/* Space Cat — escenarios de ilustración digital 2D (capas con parallax).
 * Cada tema define colores y capas; el nivel elige uno con  theme: 'atardecer'.
 * Para un mundo nuevo, agrega otro tema a SC.Themes (cielo, sol/luna, colinas, bosque).
 *
 * Beta 0.2 (rendimiento): lo que no cambia (degradado del cielo, brillo del sol, nubes) se dibuja UNA vez
 * en lienzos ocultos y después solo se copia con drawImage. Se vuelve a preparar si cambia el tamaño de pantalla. */
(function (global) {
  'use strict';
  var SC = global.SpaceCat = global.SpaceCat || {};
  var C = SC.CONFIG, View = SC.View, TAU = Math.PI * 2, WH = C.WORLD_H;
  var EXTRA = 140;   // las capas bajan más allá del mundo para cubrir la franja de suelo extra

  function hash(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  SC.Themes = {
    atardecer: {
      sky: [[0, '#5c3f9a'], [0.32, '#c95a95'], [0.6, '#ff8f6b'], [0.84, '#ffd37d']],
      sun: { x: 650, y: 318, r: 50, color: '#fff6b8', glow: '255,226,150' },
      cloudBody: '#f0749a', cloudLight: '#ffc27a',
      layers: [ // de lejos a cerca: [parallax, base, amplitud, color, f1, f2, fase]
        [0.10, 340, 26, 'rgba(214,112,150,0.75)', 0.005, 0.012, 1.3],
        [0.22, 385, 22, 'rgba(160,84,140,0.9)', 0.008, 0.019, 4.1]
      ],
      trees: [[0.40, 430, 1.0, '#8a4c86'], [0.62, 446, 1.35, '#5d3470']],
      motes: '#ffe9a8'
    }
  };

  // Posiciones guardadas en proporciones (0..1) para que se adapten a cualquier ancho de pantalla.
  var stars = [];
  for (var i = 0; i < 70; i++) stars.push({ u: hash(i), v: hash(i + 500), r: 0.6 + hash(i + 900) * 1.2, sp: 1 + hash(i + 1300) * 2, ph: hash(i + 1700) * TAU });
  var clouds = [];
  for (i = 0; i < 11; i++) clouds.push({ u: hash(i + 40), y: 70 + hash(i + 80) * 190, s: 0.38 + hash(i + 120) * 0.5, v: 4 + hash(i + 160) * 7, par: i % 2 ? 0.05 : 0.09 });
  var birds = [];
  for (i = 0; i < 6; i++) birds.push({ u: hash(i + 200), y: 70 + hash(i + 240) * 120, v: 22 + hash(i + 280) * 14, ph: hash(i + 320) * TAU });
  var motes = [];
  for (i = 0; i < 26; i++) motes.push({ u: hash(i + 400), y: 200 + hash(i + 440) * 240, sp: 0.5 + hash(i + 480), ph: hash(i + 520) * TAU });

  /* ---------- lienzos ocultos ---------- */
  function makeCanvas(w, h) {
    var cv = global.document.createElement('canvas');
    cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h));
    return cv;
  }

  var cache = { key: '', sky: null, sun: null, cloud: null, sunR: 0 };

  function build(th, name) {
    var key = name + '|' + View.w.toFixed(1) + '|' + View.h.toFixed(1) + '|' + View.k.toFixed(3);
    if (cache.key === key) return;
    cache.key = key;
    var k = View.k, W = View.w, H = View.h, oy = View.oy, j;

    // Cielo: el degradado se ancla al mundo (igual que antes); si la pantalla es más alta, el cielo de arriba sigue el color más oscuro.
    var sky = makeCanvas(W * k, H * k), c = sky.getContext('2d');
    c.setTransform(k, 0, 0, k, 0, 0);
    var g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, th.sky[0][1]);
    for (j = 0; j < th.sky.length; j++) g.addColorStop(Math.min(1, (oy + th.sky[j][0] * WH) / H), th.sky[j][1]);
    g.addColorStop(1, th.sky[th.sky.length - 1][1]);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    cache.sky = sky;

    // Sol con su resplandor: un solo sprite que luego se mueve con el parallax.
    var R = th.sun.r, box = R * 4.2 * 2;
    var sun = makeCanvas(box * k, box * k); c = sun.getContext('2d');
    c.setTransform(k, 0, 0, k, 0, 0);
    var rg = c.createRadialGradient(box / 2, box / 2, R * 0.6, box / 2, box / 2, R * 4.2);
    rg.addColorStop(0, 'rgba(' + th.sun.glow + ',0.55)'); rg.addColorStop(1, 'rgba(' + th.sun.glow + ',0)');
    c.fillStyle = rg; c.fillRect(0, 0, box, box);
    c.fillStyle = th.sun.color; c.beginPath(); c.arc(box / 2, box / 2, R, 0, TAU); c.fill();
    cache.sun = sun; cache.sunBox = box;

    // Nube (un sprite que se reutiliza a distintos tamaños).
    var cl = makeCanvas(140 * k, 70 * k); c = cl.getContext('2d');
    c.setTransform(k, 0, 0, k, 0, 0); c.translate(70, 42);
    var parts = [[-44, 4, 22], [-16, -8, 28], [18, -4, 26], [46, 6, 19]], p;
    c.fillStyle = th.cloudLight; c.beginPath();
    for (j = 0; j < parts.length; j++) { p = parts[j]; c.moveTo(p[0] + p[2], p[1] - 3); c.arc(p[0], p[1] - 3, p[2], 0, TAU); }
    c.fill();
    c.fillStyle = th.cloudBody; c.beginPath();
    for (j = 0; j < parts.length; j++) { p = parts[j]; c.moveTo(p[0] + p[2], p[1]); c.arc(p[0], p[1], p[2], 0, TAU); }
    c.ellipse(0, 9, 58, 15, 0, 0, TAU); c.fill();
    cache.cloud = cl;
  }

  /* ---------- capas que sí se mueven ---------- */
  function ridge(ctx, cam, L, W) {
    ctx.beginPath(); ctx.moveTo(0, WH + EXTRA);
    for (var x = 0; x <= W + 14; x += 14) {
      var wx = x + cam * L[0];
      ctx.lineTo(x, L[1] + Math.sin(wx * L[4] + L[6]) * L[2] + Math.sin(wx * L[5] + L[6] * 2) * L[2] * 0.5);
    }
    ctx.lineTo(W + 14, WH + EXTRA); ctx.closePath(); ctx.fillStyle = L[3]; ctx.fill();
  }

  function pines(ctx, cam, T, W) { // siluetas de pinos que se repiten con parallax (todas en un solo trazo)
    var step = 58, par = T[0], sc = T[2];
    ctx.fillStyle = T[3];
    ctx.fillRect(0, T[1] - 2, W, WH + EXTRA);
    var first = Math.floor((cam * par) / step) - 1;
    ctx.beginPath();
    for (var k = first; k < first + W / step + 3; k++) {
      var h = (46 + hash(k + par * 100) * 52) * sc, w = (15 + hash(k + 9) * 7) * sc;
      var x = k * step + hash(k + 3) * 20 - cam * par, y = T[1];
      for (var j = 0; j < 3; j++) {
        var yy = y - h * (0.32 * j), ww = w * (1.25 - j * 0.28);
        ctx.moveTo(x - ww, yy); ctx.lineTo(x, yy - h * 0.5); ctx.lineTo(x + ww, yy); ctx.closePath();
      }
      ctx.rect(x - 2, y - 4, 4, 6);
    }
    ctx.fill();
  }

  SC.Scenery = {
    draw: function (ctx, cam, t, name) {
      var th = SC.Themes[name] || SC.Themes.atardecer, i;
      var W = View.w, H = View.h, oy = View.oy, fx = SC.Perf ? SC.Perf.fx : 2;
      build(th, name);

      ctx.drawImage(cache.sky, 0, 0, W, H);

      // estrellas del cielo (solo en lo alto)
      var sh = oy + WH * 0.34;
      ctx.fillStyle = '#fff6e6';
      for (i = 0; i < stars.length; i++) {
        var s = stars[i], y = s.v * sh;
        var a = 0.65 - y / sh * 0.55;
        ctx.globalAlpha = fx > 0 ? a * (0.6 + 0.4 * Math.sin(t * s.sp + s.ph)) : a * 0.8;
        ctx.fillRect(Math.round((((s.u * W - cam * 0.02) % W) + W) % W), Math.round(y), s.r > 1 ? 2 : 1, s.r > 1 ? 2 : 1);
      }
      ctx.globalAlpha = 1;

      // sol
      var sx = th.sun.x / 960 * W - cam * 0.03, sy = th.sun.y + oy, box = cache.sunBox;
      ctx.drawImage(cache.sun, sx - box / 2, sy - box / 2, box, box);

      // nubes
      var span = W + 320, cs = cache.cloud;
      for (i = 0; i < clouds.length; i++) {
        var c = clouds[i];
        var cx = ((((c.u * span + t * c.v - cam * c.par) % span) + span) % span) - 160;
        ctx.drawImage(cs, cx - 70 * c.s, c.y + oy - 42 * c.s, 140 * c.s, 70 * c.s);
      }

      // pájaros (solo calidad media/alta)
      if (fx > 1) {
        ctx.strokeStyle = '#4a2a5e'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
        ctx.beginPath();
        for (i = 0; i < birds.length; i++) {
          var b = birds[i], bs = W + 80;
          var bx = ((((b.u * bs + t * b.v - cam * 0.08) % bs) + bs) % bs) - 40, by = b.y + oy + Math.sin(t * 0.8 + b.ph) * 6;
          var fl = Math.sin(t * 7 + b.ph) * 4;
          ctx.moveTo(bx - 7, by - fl); ctx.quadraticCurveTo(bx - 3, by - 3, bx, by); ctx.quadraticCurveTo(bx + 3, by - 3, bx + 7, by - fl);
        }
        ctx.stroke();
      }

      // colinas y pinos (anclados al suelo)
      ctx.save();
      ctx.translate(0, oy);
      ridge(ctx, cam, th.layers[0], W);
      pines(ctx, cam, th.trees[0], W);
      ridge(ctx, cam, th.layers[1], W);
      pines(ctx, cam, th.trees[1], W);
      ctx.restore();
    },

    // Partículas ambientales en pixel art (luciérnagas / motas de luz); se dibujan sobre el mundo.
    drawMotes: function (ctx, cam, t, name) {
      if (SC.Perf && SC.Perf.fx < 2) return;
      var th = SC.Themes[name] || SC.Themes.atardecer, W = View.w, oy = View.oy;
      ctx.fillStyle = th.motes;
      for (var i = 0; i < motes.length; i++) {
        var m = motes[i];
        ctx.globalAlpha = 0.3 + 0.5 * Math.max(0, Math.sin(t * m.sp + m.ph));
        ctx.fillRect(Math.round((((m.u * W + Math.sin(t * 0.4 + m.ph) * 20 - cam * 0.7) % W) + W) % W), Math.round(m.y + oy + Math.cos(t * 0.5 + m.ph) * 14), 2, 2);
      }
      ctx.globalAlpha = 1;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
