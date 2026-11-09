/* SpaceCat — todo el dibujo: fondo, mundo, gato, HUD y pantallas.
 * Todo se dibuja con formas (sin imágenes). Si hay imágenes en assets/images/, se usan en su lugar. */
(function (global) {
  'use strict';
  var SC = global.SpaceCat = global.SpaceCat || {};
  var C = SC.CONFIG;
  var COL = C.COLORS;
  var View = SC.View;
  var WH = C.WORLD_H, GY = C.GROUND_Y, SH = C.SPIKE_H;
  var W = C.VIEW_W, H = WH, OY = 0, K = 1;   // se actualizan en cada draw() según la pantalla
  var TAU = Math.PI * 2;
  var FONT = '"Nunito","Trebuchet MS","Segoe UI",system-ui,sans-serif';

  /* ---------- utilidades ---------- */
  function hash(n) {
    var x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function rr(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* ---------- sprites en caché ----------
   * Los degradados y formas que se repiten cada fotograma se dibujan una sola vez en un lienzo oculto
   * y después solo se copian (drawImage). Se vacían cuando cambia la escala de pantalla. */
  var cache = { glows: {}, star: null, plats: {}, ast: [] };

  function makeCanvas(w, h) {
    var cv = global.document.createElement('canvas');
    cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h));
    return cv;
  }

  function glowSprite(rgb) {
    var sp = cache.glows[rgb];
    if (sp) return sp;
    sp = makeCanvas(96, 96);
    var c = sp.getContext('2d');
    var g = c.createRadialGradient(48, 48, 0, 48, 48, 48);
    g.addColorStop(0, 'rgba(' + rgb + ',1)');
    g.addColorStop(1, 'rgba(' + rgb + ',0)');
    c.fillStyle = g; c.fillRect(0, 0, 96, 96);
    return (cache.glows[rgb] = sp);
  }

  // Mismo resultado que un degradado radial de transparencia 'a' en el centro, pero sin crearlo cada fotograma.
  function glow(ctx, x, y, r, rgb, a) {
    if (a <= 0.01) return;
    var pa = ctx.globalAlpha;
    ctx.globalAlpha = pa * Math.min(1, a);
    ctx.drawImage(glowSprite(rgb), x - r, y - r, r * 2, r * 2);
    ctx.globalAlpha = pa;
  }

  function ellipse(ctx, x, y, rx, ry) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  }

  function starPath(ctx, x, y, r, rot) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var rad = i % 2 === 0 ? r : r * 0.5;
      var a = rot - Math.PI / 2 + i * Math.PI / 5;
      var px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function heartPath(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.35);
    ctx.bezierCurveTo(x, y - s * 0.1, x - s * 0.5, y - s * 0.1, x - s * 0.5, y + s * 0.2);
    ctx.bezierCurveTo(x - s * 0.5, y + s * 0.55, x, y + s * 0.75, x, y + s * 0.95);
    ctx.bezierCurveTo(x, y + s * 0.75, x + s * 0.5, y + s * 0.55, x + s * 0.5, y + s * 0.2);
    ctx.bezierCurveTo(x + s * 0.5, y - s * 0.1, x, y - s * 0.1, x, y + s * 0.35);
    ctx.closePath();
  }

  function text(ctx, str, x, y, size, weight, color, align) {
    ctx.font = weight + ' ' + size + 'px ' + FONT;
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color || COL.text;
    ctx.fillText(str, x, y);
  }

  function pill(ctx, x, y, w, h) {
    ctx.fillStyle = 'rgba(24,22,64,0.42)';
    rr(ctx, x, y, w, h, h / 2);
    ctx.fill();
  }

  function formatTime(sec) {
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  /* ---------- fondo ---------- */
  function drawBackground(ctx, cam, t, theme) {
    var img = SC.Assets.get('background');
    if (img) {
      var scale = H / img.height;
      var iw = img.width * scale;
      var off = -((cam * 0.15) % iw);
      for (var bx = off; bx < W; bx += iw) ctx.drawImage(img, bx, 0, iw + 1, H);
      return;
    }
    SC.Scenery.draw(ctx, cam, t, theme);
  }

  /* ---------- decoración ---------- */
  var FLOWER_COLORS = ['#ffb3c7', '#ffe08a', '#c9bcff', '#a6ecd6'];

  function drawDecor(ctx, d, t, fx) {
    var i;
    if (d.kind === 'flower') {
      var h = 12 + d.r * 10;
      var sway = fx > 0 ? Math.sin(t * 1.5 + d.x) * 1.6 : 0;
      ctx.strokeStyle = '#6fcfae';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(d.x, GY + 2);
      ctx.quadraticCurveTo(d.x + sway, GY - h / 2, d.x + sway, GY - h);
      ctx.stroke();
      ctx.fillStyle = FLOWER_COLORS[d.c];
      ctx.beginPath();
      for (i = 0; i < 5; i++) {
        var a = i * TAU / 5, px = d.x + sway + Math.cos(a) * 3.6, py = GY - h + Math.sin(a) * 3.6;
        ctx.moveTo(px + 3.1, py); ctx.arc(px, py, 3.1, 0, TAU);
      }
      ctx.fill();
      ctx.fillStyle = COL.cream;
      ctx.beginPath(); ctx.arc(d.x + sway, GY - h, 2.4, 0, TAU); ctx.fill();
    } else if (d.kind === 'grass') {
      ctx.strokeStyle = '#6fcfae';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (i = -1; i <= 1; i++) {
        var sw = fx > 0 ? Math.sin(t * 1.8 + d.x + i) * 1.5 : 0;
        ctx.moveTo(d.x + i * 4, GY + 2);
        ctx.quadraticCurveTo(d.x + i * 5 + sw, GY - 7, d.x + i * 7 + sw, GY - 12 - Math.abs(i) * -2);
      }
      ctx.stroke();
    } else if (d.kind === 'mushroom') {
      ctx.fillStyle = COL.cream;
      rr(ctx, d.x - 3, GY - 8, 6, 10, 3); ctx.fill();
      ctx.fillStyle = '#ff9a9a';
      ctx.beginPath(); ctx.ellipse(d.x, GY - 8, 9, 7, 0, Math.PI, TAU); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.arc(d.x - 3, GY - 12, 1.7, 0, TAU); ctx.moveTo(d.x + 4.3, GY - 11); ctx.arc(d.x + 3, GY - 11, 1.3, 0, TAU); ctx.fill();
    } else if (d.kind === 'lantern') {
      ctx.fillStyle = COL.platBody;
      rr(ctx, d.x - 1.5, GY - 46, 3, 49, 1.5); ctx.fill();
      if (fx > 0) glow(ctx, d.x, GY - 52, 48, '255,217,138', 0.30 + 0.07 * Math.sin(t * 3 + d.x));
      ctx.fillStyle = '#ffe9b0';
      ctx.beginPath(); ctx.arc(d.x, GY - 52, 6.5, 0, TAU); ctx.fill();
    }
  }

  function drawSign(ctx, x, letter) {
    ctx.fillStyle = COL.platBody;
    rr(ctx, x - 3, GY - 60, 6, 64, 3); ctx.fill();
    ctx.fillStyle = '#ffe9c7';
    rr(ctx, x - 24, GY - 96, 48, 38, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(142,124,216,0.55)';
    ctx.lineWidth = 2;
    rr(ctx, x - 24, GY - 96, 48, 38, 10); ctx.stroke();
    text(ctx, letter, x, GY - 76, 28, '800', COL.ink);
  }

  function drawCheckpoint(ctx, cp, t) {
    var x = cp.x, cy = GY - 78;
    ctx.fillStyle = COL.platBody;
    rr(ctx, x - 2, GY - 70, 4, 72, 2); ctx.fill();
    ctx.fillStyle = '#6a58b8';
    rr(ctx, x - 9, GY - 4, 18, 6, 3); ctx.fill();
    if (cp.active) glow(ctx, x, cy, 62, '255,217,138', 0.45 + 0.1 * Math.sin(t * 4));
    ctx.fillStyle = cp.active ? '#ffe7a6' : '#cfe9e3';
    ctx.beginPath(); ctx.arc(x, cy, 9, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, cy, 9, 0, TAU); ctx.stroke();
  }

  function drawGoal(ctx, L, t) {
    var gx = L.goal.x;
    var img = SC.Assets.get('goal');
    if (img) {
      ctx.drawImage(img, gx - 60, GY - 160, 120, 160);
      return;
    }
    // base de ilustración + brillo suave + portal en pixel art
    ctx.fillStyle = COL.platBody;
    rr(ctx, gx - 54, GY - 6, 108, 10, 5); ctx.fill();
    ctx.fillStyle = COL.platTop;
    rr(ctx, gx - 54, GY - 6, 108, 5, 5); ctx.fill();
    glow(ctx, gx, GY - 70, 130, '90,190,255', 0.28 + Math.sin(t * 2.4) * 0.04);
    SC.Pixel.drawPortal(ctx, gx, GY - 4, t);
    drawSign(ctx, gx - 110, 'B');
  }

  function drawStart(ctx, L) {
    ctx.fillStyle = 'rgba(159,232,208,0.55)';
    ellipse(ctx, L.start.x + 16, GY + 1, 38, 5); ctx.fill();
    drawSign(ctx, L.start.x - 110, 'A');
  }

  /* ---------- terreno ---------- */
  var groundGrad = null;

  function drawGround(ctx, L, cam) {
    var i, j;
    if (!groundGrad) {
      groundGrad = ctx.createLinearGradient(0, GY, 0, WH);
      groundGrad.addColorStop(0, COL.groundBody);
      groundGrad.addColorStop(1, COL.groundDeep);
    }
    var vl = cam - 24, vr = cam + W + 24;
    for (i = 0; i < L.ground.length; i++) {
      var s = L.ground[i];
      if (s.x > vr || s.x + s.w < vl) continue;
      // solo se dibuja la parte visible (los tramos de suelo pueden medir miles de píxeles)
      var x0 = Math.max(s.x, vl), x1 = Math.min(s.x + s.w, vr), w = x1 - x0;
      ctx.fillStyle = groundGrad;
      rr(ctx, x0, s.y, w, s.h + 40 + C.BOTTOM_RESERVE + 20, 18); ctx.fill();
      // piedritas decorativas (un solo trazo)
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      for (j = Math.max(Math.ceil((s.x + 20) / 70) * 70, Math.floor(vl / 70) * 70); j < Math.min(s.x + s.w - 20, vr + 70); j += 70) {
        var k = Math.round(j / 70);
        var ex = j + hash(k) * 30, ey = s.y + 34 + hash(k + 9) * 40, rx = 5 + hash(k + 3) * 6;
        ctx.moveTo(ex + rx, ey);
        ctx.ellipse(ex, ey, rx, 3 + hash(k + 4) * 3, 0, 0, TAU);
      }
      ctx.fill();
      // borde con volumen (3D): sombra bajo el labio, labio frontal más oscuro y cara superior clara
      ctx.fillStyle = 'rgba(10,20,15,0.34)';
      rr(ctx, x0, s.y + 15, w, 14, 7); ctx.fill();
      ctx.fillStyle = '#78b257';
      rr(ctx, x0, s.y + 6, w, 13, 8); ctx.fill();
      ctx.fillStyle = COL.groundTop;
      rr(ctx, x0, s.y, w, 11, 8); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.34)';
      rr(ctx, x0 + 6, s.y + 2, Math.max(0, w - 12), 3, 2); ctx.fill();
      // paredes laterales: oscurecen el borde donde el suelo termina (los huecos se ven profundos)
      if (x0 === s.x) drawEdge(ctx, s.x, s.y, 1);
      if (x1 === s.x + s.w) drawEdge(ctx, s.x + s.w, s.y, -1);
    }
  }

  var edgeSpr = null;
  function drawEdge(ctx, x, y, dir) {
    if (!edgeSpr) {
      edgeSpr = makeCanvas(16, 4);
      var c = edgeSpr.getContext('2d'), g = c.createLinearGradient(0, 0, 16, 0);
      g.addColorStop(0, 'rgba(8,12,10,0.55)'); g.addColorStop(1, 'rgba(8,12,10,0)');
      c.fillStyle = g; c.fillRect(0, 0, 16, 4);
    }
    if (dir > 0) ctx.drawImage(edgeSpr, x, y + 10, 22, 150);
    else {         // el sprite oscurece su lado izquierdo: en el borde derecho se espeja
      ctx.save(); ctx.translate(x, 0); ctx.scale(-1, 1);
      ctx.drawImage(edgeSpr, 0, y + 10, 22, 150);
      ctx.restore();
    }
  }

  // Cada tamaño de plataforma se dibuja una vez y luego se copia.
  function platSprite(w, kind) {
    var key = kind + w;
    var sp = cache.plats[key];
    if (sp) return sp;
    var mover = kind === 'mover';
    var top = mover ? COL.moverTop : COL.platTop, body = mover ? COL.moverBody : COL.platBody;
    sp = makeCanvas((w + 4) * K, 22 * K);
    var c = sp.getContext('2d');
    c.setTransform(K, 0, 0, K, 0, 0);
    c.translate(2, 2);
    c.fillStyle = body;                              // frente de la losa
    rr(c, 0, 0, w, 18, 9); c.fill();
    var sh = c.createLinearGradient(0, 4, 0, 18);    // el frente se oscurece hacia abajo (volumen)
    sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(30,10,50,0.42)');
    c.fillStyle = sh; rr(c, 0, 0, w, 18, 9); c.fill();
    c.fillStyle = top;                               // cara de arriba, más clara
    rr(c, 0, 0, w, 10, 9); c.fill();
    c.fillStyle = 'rgba(60,20,50,0.22)';             // arista entre la cara de arriba y el frente
    c.fillRect(6, 9.5, Math.max(0, w - 12), 1.4);
    c.fillStyle = 'rgba(255,255,255,0.42)';
    rr(c, 8, 1.6, Math.max(0, w - 16), 2.6, 1.3); c.fill();
    return (cache.plats[key] = sp);
  }

  // Sombra suave sobre el suelo, justo debajo de la plataforma (solo si hay suelo debajo).
  function platShadow(ctx, p, L) {
    if (p._sh === undefined) {
      var cx = p.x + p.w / 2;
      p._sh = L.ground.some(function (g) { return cx > g.x + 10 && cx < g.x + g.w - 10; });
    }
    if (!p._sh) return;
    var hgt = GY - p.y, a = Math.max(0.10, 0.34 - hgt * 0.0008);
    var pa = ctx.globalAlpha; ctx.globalAlpha = pa * a;
    ctx.drawImage(glowSprite('20,10,50'), p.x - p.w * 0.1, GY - 3, p.w * 1.2, 13);
    ctx.globalAlpha = pa;
  }

  function drawPlatform(ctx, p, t, fx) {
    if (p.kind === 'mover' && fx > 0) {
      glow(ctx, p.x + p.w / 2, p.y + p.h + 10, p.w * 0.7, '159,232,208', 0.22);
    }
    ctx.drawImage(platSprite(p.w, p.kind), p.x - 2, p.y - 2, p.w + 4, 22);
    if (p.kind === 'mover') {
      var a = 0.55 + 0.35 * Math.sin(t * 6);
      ctx.fillStyle = 'rgba(255,240,194,' + a + ')';
      ctx.beginPath();
      ctx.arc(p.x + 16, p.y + p.h + 4, 3, 0, TAU);
      ctx.moveTo(p.x + p.w - 13, p.y + p.h + 4); ctx.arc(p.x + p.w - 16, p.y + p.h + 4, 3, 0, TAU);
      ctx.fill();
    }
  }

  function drawSpikes(ctx, s, fx) {
    var n = Math.max(1, Math.round(s.w / 30));
    var cw = s.w / n, i, x0, h;
    if (fx > 0) {
      glow(ctx, s.x + s.w / 2, GY - 12, s.w * 0.75, '255,140,140', 0.14);
      var pa0 = ctx.globalAlpha; ctx.globalAlpha = pa0 * 0.45;      // sombra de contacto en el suelo
      ctx.drawImage(glowSprite('20,10,50'), s.x - 8, GY - 3, s.w + 16, 11);
      ctx.globalAlpha = pa0;
    }
    // tres trazos en total (cuerpo, sombra, brillo) en vez de uno por triángulo
    ctx.beginPath();
    for (i = 0; i < n; i++) {
      x0 = s.x + i * cw; h = SH - (i % 2) * 6;
      ctx.moveTo(x0, GY + 1); ctx.lineTo(x0 + cw / 2, GY - h); ctx.lineTo(x0 + cw, GY + 1); ctx.closePath();
    }
    ctx.fillStyle = COL.spike; ctx.fill();
    ctx.beginPath();
    for (i = 0; i < n; i++) {
      x0 = s.x + i * cw; h = SH - (i % 2) * 6;
      ctx.moveTo(x0 + cw / 2, GY - h); ctx.lineTo(x0 + cw, GY + 1); ctx.lineTo(x0 + cw / 2, GY + 1); ctx.closePath();
    }
    ctx.fillStyle = COL.spikeDark; ctx.fill();
    ctx.strokeStyle = COL.spikeLight;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (i = 0; i < n; i++) {
      x0 = s.x + i * cw; h = SH - (i % 2) * 6;
      ctx.moveTo(x0 + cw * 0.28, GY - h * 0.42); ctx.lineTo(x0 + cw / 2 - 2, GY - h + 7);
    }
    ctx.stroke();
  }

  // El asteroide (forma, degradado y cráteres) se dibuja una vez por asteroide; después solo se gira y se copia.
  function asteroidSprite(a) {
    if (a._spr && a._sprK === K) return a._spr;
    var pad = 2, d = a.r * 2 + pad * 2;
    var sp = makeCanvas(d * K, d * K), c = sp.getContext('2d');
    c.setTransform(K, 0, 0, K, 0, 0);
    c.translate(d / 2, d / 2);
    c.beginPath();
    var pts = 9;
    for (var i = 0; i < pts; i++) {
      var ang = i * TAU / pts;
      var rad = a.r * (0.86 + 0.14 * hash(i + a.x0));
      var px = Math.cos(ang) * rad, py = Math.sin(ang) * rad;
      if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.closePath();
    var g = c.createRadialGradient(-a.r * 0.35, -a.r * 0.35, 2, 0, 0, a.r * 1.1);
    g.addColorStop(0, '#d6bfcb');
    g.addColorStop(1, COL.asteroidDark);
    c.fillStyle = g;
    c.fill();
    var g2 = c.createRadialGradient(-a.r * 0.5, -a.r * 0.5, a.r * 0.3, -a.r * 0.2, -a.r * 0.2, a.r * 1.5);
    g2.addColorStop(0, 'rgba(30,15,50,0)'); g2.addColorStop(1, 'rgba(30,15,50,0.6)');
    c.fillStyle = g2; c.fill();                        // lado en sombra (volumen de esfera)
    c.strokeStyle = 'rgba(255,225,240,0.35)'; c.lineWidth = 1.2; c.stroke();   // brillo del borde
    c.fillStyle = 'rgba(80,60,90,0.28)';
    c.beginPath();
    c.arc(-a.r * 0.25, a.r * 0.2, a.r * 0.22, 0, TAU);
    c.moveTo(a.r * 0.32 + a.r * 0.16, -a.r * 0.1); c.arc(a.r * 0.32, -a.r * 0.1, a.r * 0.16, 0, TAU);
    c.moveTo(a.r * 0.05 + a.r * 0.12, a.r * 0.5); c.arc(a.r * 0.05, a.r * 0.5, a.r * 0.12, 0, TAU);
    c.fill();
    a._spr = sp; a._sprK = K; a._sprD = d;
    return sp;
  }

  function drawAsteroid(ctx, a, fx) {
    var img = SC.Assets.get('asteroid');
    if (img) {
      ctx.save();
      ctx.translate(a.cx, a.cy);
      ctx.rotate(a.rot);
      var dd = a.r * 2.3;
      ctx.drawImage(img, -dd / 2, -dd / 2, dd, dd);
      ctx.restore();
      return;
    }
    if (fx > 0) glow(ctx, a.cx, a.cy, a.r * 2.2, '255,190,200', 0.14);
    var sp = asteroidSprite(a), d = a._sprD;
    ctx.save();
    ctx.translate(a.cx, a.cy);
    ctx.rotate(a.rot);
    ctx.drawImage(sp, -d / 2, -d / 2, d, d);
    ctx.restore();
  }

  function starSprite() {
    if (cache.star) return cache.star;
    var sp = makeCanvas(40 * K, 40 * K), c = sp.getContext('2d');
    c.setTransform(K, 0, 0, K, 0, 0);
    starPath(c, 20, 20, 12, 0);                       // base
    c.fillStyle = COL.star; c.fill();
    var i, a1, a2, a3, R = 12, r = 6;                 // caras: por cada punta, una mitad clara y otra oscura
    for (i = 0; i < 5; i++) {
      a1 = -Math.PI / 2 + i * TAU / 5;                // punta
      a2 = a1 - Math.PI / 5; a3 = a1 + Math.PI / 5;   // vértices interiores
      c.beginPath(); c.moveTo(20, 20); c.lineTo(20 + Math.cos(a1) * R, 20 + Math.sin(a1) * R); c.lineTo(20 + Math.cos(a2) * r, 20 + Math.sin(a2) * r); c.closePath();
      c.fillStyle = COL.starLight; c.fill();
      c.beginPath(); c.moveTo(20, 20); c.lineTo(20 + Math.cos(a1) * R, 20 + Math.sin(a1) * R); c.lineTo(20 + Math.cos(a3) * r, 20 + Math.sin(a3) * r); c.closePath();
      c.fillStyle = '#f2b45c'; c.fill();
    }
    starPath(c, 20, 20, 12, 0);
    c.strokeStyle = 'rgba(255,255,255,0.75)';
    c.lineWidth = 1.3; c.lineJoin = 'round';
    c.stroke();
    return (cache.star = sp);
  }

  function drawStar(ctx, s, t, fx) {
    var img = SC.Assets.get('star');
    var y = s.y + Math.sin(t * 3 + s.phase) * 3;
    var sc = 1 + Math.sin(t * 4 + s.phase) * 0.06;
    glow(ctx, s.x, y, 26, '255,217,138', 0.30);
    if (img) {
      ctx.drawImage(img, s.x - 16 * sc, y - 16 * sc, 32 * sc, 32 * sc);
      return;
    }
    var sp = starSprite();
    if (fx > 1) {      // pequeño balanceo (solo calidad alta)
      ctx.save();
      ctx.translate(s.x, y);
      ctx.rotate(Math.sin(t * 2 + s.phase) * 0.12);
      ctx.drawImage(sp, -20 * sc, -20 * sc, 40 * sc, 40 * sc);
      ctx.restore();
    } else {
      ctx.drawImage(sp, s.x - 20 * sc, y - 20 * sc, 40 * sc, 40 * sc);
    }
  }

  /* ---------- el gato (la apariencia vive en skins.js) ---------- */
  function drawCat(ctx, p, t, state) {
    if (p.invuln > 0 && Math.floor(p.invuln * 12) % 2 === 0) return; // parpadeo tras un golpe
    var cx = p.x + p.w / 2, fy = p.y + p.h;
    var air = !p.onGround;

    if (p.onGround) {
      ctx.fillStyle = 'rgba(20,10,50,0.22)';
      ellipse(ctx, cx, fy + 1, 15, 4); ctx.fill();
    }

    var stretch = Math.min(Math.abs(p.vy) / 900, 0.12);
    var sx = air ? 1 - stretch * 0.7 : 1;
    var sy = air ? 1 + stretch : 1;

    ctx.save();
    ctx.translate(cx, fy);
    ctx.scale(p.facing * sx, sy);
    if (p.spin > 0) { // voltereta del doble salto
      ctx.translate(0, -22);
      ctx.rotate((1 - p.spin) * TAU);
      ctx.translate(0, 22);
    }
    var img = SC.Assets.get('cat');
    if (img) {
      var size = C.CAT_SPRITE;
      ctx.drawImage(img, -size / 2, -size + 4, size, size);
    } else {
      var skin = SC.Skins.get(SC.Skins.current);
      skin.draw(ctx, SC.Skins.poseOf(p, state), t);
    }
    ctx.restore();
  }

  /* ---------- partículas ---------- */
  function drawParticles(ctx, list) {
    for (var i = 0; i < list.length; i++) {
      var q = list[i];
      ctx.globalAlpha = Math.max(0, q.life / q.max);
      ctx.fillStyle = q.color;
      if (q.star) {
        starPath(ctx, q.x, q.y, q.size, q.life * 4);
        ctx.fill();
      } else {
        var sz = Math.max(2, Math.round(q.size / 2) * 2);
        ctx.fillRect(Math.round(q.x), Math.round(q.y), sz, sz); // partícula pixelada
      }
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- mundo completo ---------- */
  // Las listas del nivel están ordenadas por x: con búsqueda binaria se salta todo lo que queda fuera de pantalla.
  function drawWorld(ctx, g, cam) {
    var L = g.level, t = g.t, i, n, fx = SC.Perf.fx;
    var left = cam - 120, right = cam + W + 120;
    var lb = SC.lowerBound;

    if (L.start.x + 60 > left && L.start.x - 170 < right) drawStart(ctx, L);
    if (L.goal.x + 120 > left && L.goal.x - 160 < right) drawGoal(ctx, L, t);
    for (i = 0; i < L.checkpoints.length; i++) {
      if (L.checkpoints[i].x > left && L.checkpoints[i].x < right) drawCheckpoint(ctx, L.checkpoints[i], t);
    }
    drawGround(ctx, L, cam);
    for (n = L.decor.length, i = lb(L.decor, left); i < n; i++) {
      if (L.decor[i].x > right) break;
      drawDecor(ctx, L.decor[i], t, fx);
    }
    for (n = L.platforms.length, i = lb(L.platforms, left - L.maxPlatW); i < n; i++) {
      var p = L.platforms[i];
      if (p.x > right) break;
      if (fx > 0) platShadow(ctx, p, L);
      drawPlatform(ctx, p, t, fx);
    }
    for (i = 0; i < L.movers.length; i++) {
      drawPlatform(ctx, L.movers[i], t, fx);
    }
    for (n = L.spikes.length, i = lb(L.spikes, left - 120); i < n; i++) {
      var s = L.spikes[i];
      if (s.x > right) break;
      drawSpikes(ctx, s, fx);
    }
    if (g.state !== 'title') {
      for (n = L.stars.length, i = lb(L.stars, left); i < n; i++) {
        var st = L.stars[i];
        if (st.x > right) break;
        if (!st.taken) drawStar(ctx, st, t, fx);
      }
    }
    for (i = 0; i < L.asteroids.length; i++) {
      var a = L.asteroids[i];
      if (a.cx > left && a.cx < right) drawAsteroid(ctx, a, fx);
    }
    for (i = 0; i < g.rings.length; i++) { // anillos del doble salto
      var rg = g.rings[i], k = rg.age / 0.4;
      ctx.globalAlpha = 0.7 * (1 - k);
      ctx.strokeStyle = '#fff6e6';
      ctx.lineWidth = 3 * (1 - k) + 1;
      ctx.beginPath(); ctx.ellipse(rg.x, rg.y, 10 + k * 30, 4 + k * 8, 0, 0, TAU); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    drawParticles(ctx, g.particles);
    drawCat(ctx, g.player, g.t, g.state);
  }

  /* ---------- primer plano (profundidad) ----------
   * Hojas oscuras en el borde inferior que se mueven MÁS rápido que el suelo: da sensación de profundidad 3D.
   * Quedan por debajo de la línea del suelo, nunca tapan al gato. */
  function drawForeground(ctx, cam) {
    var par = 1.35, step = 58, first = Math.floor(cam * par / step) - 1, n = Math.ceil(W / step) + 3, k, j;
    var base = H + 3;
    ctx.fillStyle = 'rgba(14,26,22,0.92)';
    ctx.beginPath();
    for (k = first; k < first + n; k++) {
      var x = k * step + hash(k + 21) * 30 - cam * par, h = 22 + hash(k + 5) * 30, lean = (hash(k + 8) - 0.5) * 18;
      for (j = 0; j < 3; j++) {
        var bx = x + j * 9, bh = h * (1 - j * 0.22);
        ctx.moveTo(bx - 5, base); ctx.quadraticCurveTo(bx - 1, base - bh * 0.6, bx + lean, base - bh); ctx.quadraticCurveTo(bx + 2, base - bh * 0.5, bx + 5, base);
      }
    }
    ctx.fill();
  }

  /* ---------- interfaz ---------- */
  // La parte fija del HUD (cápsulas, corazones, textos) se prepara en un lienzo oculto y solo se vuelve a dibujar
  // cuando cambia algo (vidas, estrellas, segundos o tamaño). Cada fotograma solo se pinta la barra de progreso.
  var hud = { cv: null, key: '', bx: 0, bw: 0, by: 34 };

  function renderHudChrome(g) {
    var hw = Math.ceil(W), hh = 70;
    if (!hud.cv) hud.cv = makeCanvas(1, 1);
    if (hud.cv.width !== Math.ceil(hw * K) || hud.cv.height !== Math.ceil(hh * K)) {
      hud.cv.width = Math.ceil(hw * K); hud.cv.height = Math.ceil(hh * K);
    }
    var c = hud.cv.getContext('2d'), i;
    c.setTransform(K, 0, 0, K, 0, 0);
    c.clearRect(0, 0, hw, hh);
    var x0 = 16 + View.sl, y0 = 14 + View.st;      // zonas seguras: no quedar bajo muescas ni barras

    // vidas
    pill(c, x0, y0, 118, 40);
    for (i = 0; i < C.LIVES; i++) {
      heartPath(c, x0 + 22 + i * 32, y0 + 10, 22);
      c.fillStyle = i < g.lives ? COL.heart : 'rgba(255,255,255,0.18)';
      c.fill();
    }
    // estrellas
    pill(c, x0 + 128, y0, 112, 40);
    starPath(c, x0 + 154, y0 + 20, 11, 0);
    c.fillStyle = COL.star;
    c.fill();
    text(c, g.collected + '/' + g.level.stars.length, x0 + 174, y0 + 21, 20, '800', COL.text, 'left');

    // progreso de A a B (el fondo; el relleno se dibuja cada fotograma)
    var bw = Math.min(460, Math.max(300, W * 0.3)), bx = W / 2 - bw / 2, by = y0 + 20;
    hud.bx = bx; hud.bw = bw; hud.by = by;
    c.fillStyle = 'rgba(24,22,64,0.42)';
    rr(c, bx - 30, y0, bw + 60, 40, 20); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.20)';
    rr(c, bx, by - 4, bw, 8, 4); c.fill();
    text(c, 'A', bx - 15, by + 1, 16, '800', COL.text);
    text(c, 'B', bx + bw + 15, by + 1, 16, '800', COL.text);

    // tiempo (a la izquierda del botón de pausa)
    var tr = W - View.pauseReserve;
    pill(c, tr - 100, y0, 100, 40);
    text(c, formatTime(g.elapsed), tr - 50, y0 + 21, 20, '800', COL.text);
  }

  function drawHUD(ctx, g) {
    var key = g.lives + '|' + g.collected + '|' + Math.floor(g.elapsed) + '|' + W.toFixed(1) + '|' + K.toFixed(3) + '|' + View.sl.toFixed(1) + '|' + View.st.toFixed(1) + '|' + View.pauseReserve.toFixed(1);
    if (key !== hud.key) { renderHudChrome(g); hud.key = key; }
    ctx.drawImage(hud.cv, 0, 0, hud.cv.width / K, hud.cv.height / K);

    var L = g.level, y0 = 14 + View.st, by = y0 + 20;
    var prog = (g.player.x - L.start.x) / (L.goal.x - L.start.x);
    prog = Math.max(0, Math.min(1, prog));
    ctx.fillStyle = COL.mint;
    rr(ctx, hud.bx, by - 4, Math.max(8, hud.bw * prog), 8, 4); ctx.fill();
    ctx.fillStyle = COL.cat;
    ctx.beginPath(); ctx.arc(hud.bx + hud.bw * prog, by, 8, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(hud.bx + hud.bw * prog, by, 8, 0, TAU); ctx.stroke();

    if (g.toast) {
      var a = Math.min(1, g.toast.time * 2.5);
      ctx.globalAlpha = a;
      ctx.font = '700 20px ' + FONT;
      var tw = ctx.measureText(g.toast.text).width + 44;
      pill(ctx, W / 2 - tw / 2, y0 + 56, tw, 38);
      text(ctx, g.toast.text, W / 2, y0 + 76, 20, '700', COL.text);
      ctx.globalAlpha = 1;
    }
  }

  function drawDebug(ctx) {
    var P = SC.Perf;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(View.sl + 16, H - 52 - View.sb, 300, 40);
    text(ctx, P.fps + ' fps · calidad ' + P.level + ' · ' + View.pxW + 'x' + View.pxH + ' px', View.sl + 26, H - 31 - View.sb, 15, '700', '#9fe8d0', 'left');
  }

  function dim(ctx, a) {
    ctx.fillStyle = 'rgba(24,22,64,' + a + ')';
    ctx.fillRect(0, 0, W, H);
  }

  function drawTitle(ctx, g) {
    dim(ctx, 0.5);
    ctx.save();
    ctx.translate(0, Math.round(OY * 0.5)); // en pantallas altas el contenido queda centrado
    glow(ctx, W / 2, 190, 280, '255,200,160', 0.22);
    ctx.font = '800 96px ' + FONT;
    text(ctx, 'Space Cat', W / 2 + 4, 154, 96, '800', 'rgba(30,20,70,0.55)');
    var gr = ctx.createLinearGradient(0, 110, 0, 200);
    gr.addColorStop(0, '#fff3d6');
    gr.addColorStop(1, '#ffb98a');
    text(ctx, 'Space Cat', W / 2, 150, 96, '800', gr);
    text(ctx, 'Lleva al gato del punto A al punto B', W / 2, 224, 24, '600', 'rgba(255,246,230,0.95)');
    var pulse = 0.65 + 0.35 * Math.sin(g.t * 3);
    ctx.globalAlpha = pulse;
    text(ctx, SC.touch ? 'Toca la pantalla para empezar' : 'Pulsa Enter o toca la pantalla para empezar', W / 2, 300, 24, '700', COL.text);
    ctx.globalAlpha = 1;
    if (!SC.touch) text(ctx, '← → mover   ·   Espacio / ↑ saltar (dos veces = doble salto)   ·   P pausa   ·   M sonido   ·   F pantalla completa', W / 2, 500, 17, '600', 'rgba(255,246,230,0.8)');
    else text(ctx, 'Toca ▲ dos veces en el aire para el doble salto', W / 2, 500, 17, '600', 'rgba(255,246,230,0.8)');
    if (SC.PWA && SC.PWA.needsHomeScreen) text(ctx, 'Para pantalla completa: Compartir → Añadir a pantalla de inicio', W / 2, 468, 16, '600', 'rgba(255,246,230,0.8)');
    text(ctx, 'Beta ' + C.VERSION, W / 2, 262, 18, '700', 'rgba(255,246,230,0.75)');
    if (g.bestTime) {
      text(ctx, 'Mejor tiempo: ' + formatTime(g.bestTime), W / 2, 340, 18, '600', 'rgba(255,246,230,0.8)');
    }
    ctx.restore();
  }

  function drawPause(ctx) {
    dim(ctx, 0.5); // el menú de pausa es HTML (ver index.html / css)
  }

  function drawWin(ctx, g) {
    dim(ctx, 0.5);
    ctx.save();
    ctx.translate(0, Math.round(OY * 0.5));
    var x = W / 2 - 270, y = 120;
    ctx.fillStyle = 'rgba(34,30,84,0.82)';
    rr(ctx, x, y, 540, 300, 28); ctx.fill();
    ctx.strokeStyle = 'rgba(255,235,200,0.35)';
    ctx.lineWidth = 2;
    rr(ctx, x, y, 540, 300, 28); ctx.stroke();
    text(ctx, '¡Llegaste al punto B!', W / 2, y + 56, 38, '800', '#ffe9c7');
    starPath(ctx, W / 2 - 92, y + 130, 16, 0);
    ctx.fillStyle = COL.star;
    ctx.fill();
    text(ctx, g.collected + ' / ' + g.level.stars.length + ' estrellas', W / 2 - 64, y + 131, 24, '700', COL.text, 'left');
    text(ctx, 'Tiempo: ' + formatTime(g.elapsed), W / 2, y + 180, 24, '700', COL.text);
    if (g.bestTime) {
      var rec = g.newRecord ? '¡Nuevo récord!' : 'Mejor tiempo: ' + formatTime(g.bestTime);
      text(ctx, rec, W / 2, y + 216, 20, '700', g.newRecord ? COL.mint : 'rgba(255,246,230,0.8)');
    }
    if (g.winTimer > 0.8) {
      ctx.globalAlpha = 0.65 + 0.35 * Math.sin(g.t * 3);
      text(ctx, SC.touch ? 'Toca para jugar otra vez' : 'Pulsa Enter o toca para jugar otra vez', W / 2, y + 262, 20, '700', COL.text);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  /* ---------- punto de entrada ---------- */
  var lastK = 0;

  function draw(ctx, g) {
    W = View.w; H = View.h; OY = View.oy; K = ctx.canvas.width / W;
    if (Math.abs(K - lastK) > 0.0005) {     // cambió la escala: se vacían los sprites para redibujarlos nítidos
      cache.plats = {}; cache.star = null;
      for (var i = 0; i < g.level.asteroids.length; i++) g.level.asteroids[i]._spr = null;
      lastK = K;
    }
    ctx.setTransform(K, 0, 0, K, 0, 0);

    drawBackground(ctx, g.cam, g.t, g.level.theme);   // cubre toda la pantalla: no hace falta borrarla antes
    ctx.save();
    ctx.translate(-Math.round(g.cam * K) / K, OY);    // alineado a píxeles reales: sin temblor en el borde de los objetos
    drawWorld(ctx, g, g.cam);
    ctx.restore();
    if (SC.Perf.fx > 0) drawForeground(ctx, g.cam);
    SC.Scenery.drawMotes(ctx, g.cam, g.t, g.level.theme);

    if (g.state !== 'title') drawHUD(ctx, g);
    if (g.state === 'title') drawTitle(ctx, g);
    else if (g.state === 'paused') drawPause(ctx);
    else if (g.state === 'win') drawWin(ctx, g);
    if (SC.Perf.debug) drawDebug(ctx);
  }

  SC.Render = { draw: draw };
})(typeof window !== 'undefined' ? window : globalThis);
