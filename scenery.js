/* Space Cat — escenarios de ilustración digital 2D (capas con parallax).
 * Cada tema define colores y capas; el nivel elige uno con  theme: 'atardecer'.
 * Para un mundo nuevo, agrega otro tema a SC.Themes (cielo, sol/luna, colinas, bosque). */
(function (global) {
  'use strict';
  var SC = global.SpaceCat = global.SpaceCat || {};
  var C = SC.CONFIG, W = C.WIDTH, H = C.HEIGHT, TAU = Math.PI * 2;

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

  var stars = [];
  for (var i = 0; i < 46; i++) stars.push({ x: hash(i) * W, y: hash(i + 500) * H * 0.34, r: 0.6 + hash(i + 900) * 1.2, sp: 1 + hash(i + 1300) * 2, ph: hash(i + 1700) * TAU });
  var clouds = [];
  for (i = 0; i < 9; i++) clouds.push({ x: hash(i + 40) * (W + 300), y: 70 + hash(i + 80) * 190, s: 0.38 + hash(i + 120) * 0.5, v: 4 + hash(i + 160) * 7, par: i % 2 ? 0.05 : 0.09 });
  var birds = [];
  for (i = 0; i < 6; i++) birds.push({ x: hash(i + 200) * W, y: 70 + hash(i + 240) * 120, v: 22 + hash(i + 280) * 14, ph: hash(i + 320) * TAU });
  var motes = [];
  for (i = 0; i < 22; i++) motes.push({ x: hash(i + 400) * W, y: 200 + hash(i + 440) * 240, sp: 0.5 + hash(i + 480), ph: hash(i + 520) * TAU });

  function ridge(ctx, cam, L) {
    ctx.beginPath(); ctx.moveTo(0, H);
    for (var x = 0; x <= W; x += 12) {
      var wx = x + cam * L[0];
      ctx.lineTo(x, L[1] + Math.sin(wx * L[4] + L[6]) * L[2] + Math.sin(wx * L[5] + L[6] * 2) * L[2] * 0.5);
    }
    ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = L[3]; ctx.fill();
  }

  function pines(ctx, cam, T) { // siluetas de pinos que se repiten con parallax
    var step = 58, par = T[0], sc = T[2];
    ctx.fillStyle = T[3];
    ctx.fillRect(0, T[1] - 2, W, H);
    var first = Math.floor((cam * par) / step) - 1;
    for (var k = first; k < first + W / step + 3; k++) {
      var h = (46 + hash(k + par * 100) * 52) * sc, w = (15 + hash(k + 9) * 7) * sc;
      var x = k * step + hash(k + 3) * 20 - cam * par, y = T[1];
      for (var j = 0; j < 3; j++) {
        var yy = y - h * (0.32 * j), ww = w * (1.25 - j * 0.28);
        ctx.beginPath(); ctx.moveTo(x - ww, yy); ctx.lineTo(x, yy - h * 0.5); ctx.lineTo(x + ww, yy); ctx.closePath(); ctx.fill();
      }
      ctx.fillRect(x - 2, y - 4, 4, 6);
    }
  }

  function cloud(ctx, x, y, s, th) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    var parts = [[-44, 4, 22], [-16, -8, 28], [18, -4, 26], [46, 6, 19]];
    ctx.fillStyle = th.cloudLight; // borde luminoso (estilo ilustración)
    ctx.beginPath(); for (var i = 0; i < parts.length; i++) { ctx.moveTo(parts[i][0] + parts[i][2], parts[i][1] - 3); ctx.arc(parts[i][0], parts[i][1] - 3, parts[i][2], 0, TAU); } ctx.fill();
    ctx.fillStyle = th.cloudBody;
    ctx.beginPath(); for (i = 0; i < parts.length; i++) { ctx.moveTo(parts[i][0] + parts[i][2], parts[i][1]); ctx.arc(parts[i][0], parts[i][1], parts[i][2], 0, TAU); }
    ctx.ellipse(0, 9, 58, 15, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }

  SC.Scenery = {
    draw: function (ctx, cam, t, name) {
      var th = SC.Themes[name] || SC.Themes.atardecer, i;
      var g = ctx.createLinearGradient(0, 0, 0, H);
      for (i = 0; i < th.sky.length; i++) g.addColorStop(th.sky[i][0], th.sky[i][1]);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      for (i = 0; i < stars.length; i++) { // estrellas solo en lo alto del cielo
        var s = stars[i];
        ctx.globalAlpha = (0.65 - s.y / (H * 0.34) * 0.55) * (0.6 + 0.4 * Math.sin(t * s.sp + s.ph));
        ctx.fillStyle = '#fff6e6';
        ctx.fillRect(Math.round((((s.x - cam * 0.02) % W) + W) % W), Math.round(s.y), s.r > 1 ? 2 : 1, s.r > 1 ? 2 : 1);
      }
      ctx.globalAlpha = 1;

      var sx = th.sun.x - cam * 0.03, sy = th.sun.y;
      var rg = ctx.createRadialGradient(sx, sy, th.sun.r * 0.6, sx, sy, th.sun.r * 4.2);
      rg.addColorStop(0, 'rgba(' + th.sun.glow + ',0.55)'); rg.addColorStop(1, 'rgba(' + th.sun.glow + ',0)');
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = th.sun.color; ctx.beginPath(); ctx.arc(sx, sy, th.sun.r, 0, TAU); ctx.fill();

      for (i = 0; i < clouds.length; i++) {
        var c = clouds[i], span = W + 320;
        cloud(ctx, ((((c.x + t * c.v - cam * c.par) % span) + span) % span) - 160, c.y, c.s, th);
      }
      for (i = 0; i < birds.length; i++) {
        var b = birds[i], bx = ((((b.x + t * b.v - cam * 0.08) % (W + 80)) + W + 80) % (W + 80)) - 40, by = b.y + Math.sin(t * 0.8 + b.ph) * 6;
        var fl = Math.sin(t * 7 + b.ph) * 4;
        ctx.strokeStyle = '#4a2a5e'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(bx - 7, by - fl); ctx.quadraticCurveTo(bx - 3, by - 3, bx, by); ctx.quadraticCurveTo(bx + 3, by - 3, bx + 7, by - fl); ctx.stroke();
      }
      ridge(ctx, cam, th.layers[0]);
      pines(ctx, cam, th.trees[0]);
      ridge(ctx, cam, th.layers[1]);
      pines(ctx, cam, th.trees[1]);
    },
    // Partículas ambientales en pixel art (luciérnagas / motas de luz); se dibujan sobre el mundo.
    drawMotes: function (ctx, cam, t, name) {
      var th = SC.Themes[name] || SC.Themes.atardecer;
      ctx.fillStyle = th.motes;
      for (var i = 0; i < motes.length; i++) {
        var m = motes[i];
        ctx.globalAlpha = 0.3 + 0.5 * Math.max(0, Math.sin(t * m.sp + m.ph));
        ctx.fillRect(Math.round((((m.x + Math.sin(t * 0.4 + m.ph) * 20 - cam * 0.7) % W) + W) % W), Math.round(m.y + Math.cos(t * 0.5 + m.ph) * 14), 2, 2);
      }
      ctx.globalAlpha = 1;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
