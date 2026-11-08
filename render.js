/* SpaceCat — todo el dibujo: fondo, mundo, gato, HUD y pantallas.
 * Todo se dibuja con formas (sin imágenes). Si hay imágenes en assets/images/, se usan en su lugar. */
(function (global) {
  'use strict';
  var SC = global.SpaceCat = global.SpaceCat || {};
  var C = SC.CONFIG;
  var COL = C.COLORS;
  var W = C.WIDTH, H = C.HEIGHT, GY = C.GROUND_Y, SH = C.SPIKE_H;
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

  function glow(ctx, x, y, r, rgb, a) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')');
    g.addColorStop(1, 'rgba(' + rgb + ',0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
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
  var bgStars = [];
  (function () {
    for (var i = 0; i < 120; i++) {
      bgStars.push({
        x: hash(i) * W, y: hash(i + 500) * H * 0.72,
        r: 0.6 + hash(i + 900) * 1.4, p: i % 2 ? 0.05 : 0.12,
        sp: 1 + hash(i + 1300) * 2, ph: hash(i + 1700) * TAU
      });
    }
  })();

  function hills(ctx, cam, par, base, amp, color, f1, f2, ph) {
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (var x = 0; x <= W; x += 10) {
      var wx = x + cam * par;
      ctx.lineTo(x, base + Math.sin(wx * f1 + ph) * amp + Math.sin(wx * f2 + ph * 2) * amp * 0.5);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function drawBackground(ctx, cam, t, theme) {
    var i;
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

  function drawDecor(ctx, d, t) {
    var i;
    if (d.kind === 'flower') {
      var h = 12 + d.r * 10;
      var sway = Math.sin(t * 1.5 + d.x) * 1.6;
      ctx.strokeStyle = '#6fcfae';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(d.x, GY + 2);
      ctx.quadraticCurveTo(d.x + sway, GY - h / 2, d.x + sway, GY - h);
      ctx.stroke();
      ctx.fillStyle = FLOWER_COLORS[d.c];
      for (i = 0; i < 5; i++) {
        var a = i * TAU / 5;
        ctx.beginPath();
        ctx.arc(d.x + sway + Math.cos(a) * 3.6, GY - h + Math.sin(a) * 3.6, 3.1, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = COL.cream;
      ctx.beginPath(); ctx.arc(d.x + sway, GY - h, 2.4, 0, TAU); ctx.fill();
    } else if (d.kind === 'grass') {
      ctx.strokeStyle = '#6fcfae';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      for (i = -1; i <= 1; i++) {
        var sw = Math.sin(t * 1.8 + d.x + i) * 1.5;
        ctx.beginPath();
        ctx.moveTo(d.x + i * 4, GY + 2);
        ctx.quadraticCurveTo(d.x + i * 5 + sw, GY - 7, d.x + i * 7 + sw, GY - 12 - Math.abs(i) * -2);
        ctx.stroke();
      }
    } else if (d.kind === 'mushroom') {
      ctx.fillStyle = COL.cream;
      rr(ctx, d.x - 3, GY - 8, 6, 10, 3); ctx.fill();
      ctx.fillStyle = '#ff9a9a';
      ctx.beginPath(); ctx.ellipse(d.x, GY - 8, 9, 7, 0, Math.PI, TAU); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.arc(d.x - 3, GY - 12, 1.7, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(d.x + 3, GY - 11, 1.3, 0, TAU); ctx.fill();
    } else if (d.kind === 'lantern') {
      ctx.fillStyle = COL.platBody;
      rr(ctx, d.x - 1.5, GY - 46, 3, 49, 1.5); ctx.fill();
      glow(ctx, d.x, GY - 52, 48, '255,217,138', 0.30 + 0.07 * Math.sin(t * 3 + d.x));
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
    drawSign(ctx, 170, 'A');
  }

  /* ---------- terreno ---------- */
  function drawGround(ctx, L, cam) {
    var i, j;
    for (i = 0; i < L.ground.length; i++) {
      var s = L.ground[i];
      if (s.x > cam + W + 40 || s.x + s.w < cam - 40) continue;
      var g = ctx.createLinearGradient(0, s.y, 0, H);
      g.addColorStop(0, COL.groundBody);
      g.addColorStop(1, COL.groundDeep);
      ctx.fillStyle = g;
      rr(ctx, s.x, s.y, s.w, s.h + 40, 18); ctx.fill();
      // piedritas decorativas
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      var from = Math.max(s.x + 20, Math.floor(cam / 70) * 70);
      for (j = from; j < Math.min(s.x + s.w - 20, cam + W + 70); j += 70) {
        var k = Math.round(j / 70);
        ctx.beginPath();
        ctx.ellipse(j + hash(k) * 30, s.y + 34 + hash(k + 9) * 40, 5 + hash(k + 3) * 6, 3 + hash(k + 4) * 3, 0, 0, TAU);
        ctx.fill();
      }
      // capa de pasto/polvo lunar
      ctx.fillStyle = COL.groundTop;
      rr(ctx, s.x, s.y, s.w, 16, 10); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      rr(ctx, s.x + 6, s.y + 3, Math.max(0, s.w - 12), 3, 2); ctx.fill();
    }
  }

  function drawPlatform(ctx, p, top, body, t) {
    if (p.kind === 'mover') {
      glow(ctx, p.x + p.w / 2, p.y + p.h + 10, p.w * 0.7, '159,232,208', 0.22);
    }
    ctx.fillStyle = body;
    rr(ctx, p.x, p.y, p.w, p.h, 9); ctx.fill();
    ctx.fillStyle = top;
    rr(ctx, p.x, p.y, p.w, 10, 9); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    rr(ctx, p.x + 8, p.y + 2, Math.max(0, p.w - 16), 2.5, 1.5); ctx.fill();
    if (p.kind === 'mover') {
      var a = 0.55 + 0.35 * Math.sin(t * 6);
      ctx.fillStyle = 'rgba(255,240,194,' + a + ')';
      ctx.beginPath(); ctx.arc(p.x + 16, p.y + p.h + 4, 3, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(p.x + p.w - 16, p.y + p.h + 4, 3, 0, TAU); ctx.fill();
    }
  }

  function drawSpikes(ctx, s) {
    var n = Math.max(1, Math.round(s.w / 30));
    var cw = s.w / n;
    glow(ctx, s.x + s.w / 2, GY - 12, s.w * 0.75, '255,140,140', 0.14);
    for (var i = 0; i < n; i++) {
      var x0 = s.x + i * cw;
      var h = SH - (i % 2) * 6;
      ctx.beginPath();
      ctx.moveTo(x0, GY + 1);
      ctx.lineTo(x0 + cw / 2, GY - h);
      ctx.lineTo(x0 + cw, GY + 1);
      ctx.closePath();
      ctx.fillStyle = COL.spike;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x0 + cw / 2, GY - h);
      ctx.lineTo(x0 + cw, GY + 1);
      ctx.lineTo(x0 + cw / 2, GY + 1);
      ctx.closePath();
      ctx.fillStyle = COL.spikeDark;
      ctx.fill();
      ctx.strokeStyle = COL.spikeLight;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x0 + cw * 0.28, GY - h * 0.42);
      ctx.lineTo(x0 + cw / 2 - 2, GY - h + 7);
      ctx.stroke();
    }
  }

  function drawAsteroid(ctx, a) {
    var img = SC.Assets.get('asteroid');
    ctx.save();
    ctx.translate(a.cx, a.cy);
    ctx.rotate(a.rot);
    if (img) {
      var d = a.r * 2.3;
      ctx.drawImage(img, -d / 2, -d / 2, d, d);
      ctx.restore();
      return;
    }
    glow(ctx, 0, 0, a.r * 2.2, '255,190,200', 0.14);
    ctx.beginPath();
    var pts = 9;
    for (var i = 0; i < pts; i++) {
      var ang = i * TAU / pts;
      var rad = a.r * (0.86 + 0.14 * hash(i + a.x0));
      var px = Math.cos(ang) * rad, py = Math.sin(ang) * rad;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    var g = ctx.createRadialGradient(-a.r * 0.35, -a.r * 0.35, 2, 0, 0, a.r * 1.1);
    g.addColorStop(0, '#d6bfcb');
    g.addColorStop(1, COL.asteroidDark);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.fillStyle = 'rgba(80,60,90,0.28)';
    ctx.beginPath(); ctx.arc(-a.r * 0.25, a.r * 0.2, a.r * 0.22, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(a.r * 0.32, -a.r * 0.1, a.r * 0.16, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(a.r * 0.05, a.r * 0.5, a.r * 0.12, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawStar(ctx, s, t) {
    var img = SC.Assets.get('star');
    var y = s.y + Math.sin(t * 3 + s.phase) * 3;
    var sc = 1 + Math.sin(t * 4 + s.phase) * 0.06;
    glow(ctx, s.x, y, 26, '255,217,138', 0.30);
    if (img) {
      ctx.drawImage(img, s.x - 16 * sc, y - 16 * sc, 32 * sc, 32 * sc);
      return;
    }
    starPath(ctx, s.x, y, 12 * sc, Math.sin(t * 2 + s.phase) * 0.12);
    var g = ctx.createLinearGradient(0, y - 12, 0, y + 12);
    g.addColorStop(0, COL.starLight);
    g.addColorStop(1, COL.star);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  /* ---------- el gato (la apariencia vive en js/skins.js) ---------- */
  function drawCat(ctx, p, t, state) {
    if (p.invuln > 0 && Math.floor(p.invuln * 12) % 2 === 0) return; // parpadeo tras un golpe
    var cx = p.x + p.w / 2, fy = p.y + p.h;
    var moving = Math.abs(p.vx) > 30 && p.onGround;
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
  function drawWorld(ctx, g, cam) {
    var L = g.level, t = g.t, i;
    var left = cam - 120, right = cam + W + 120;

    drawStart(ctx, L);
    drawGoal(ctx, L, t);
    for (i = 0; i < L.checkpoints.length; i++) {
      if (L.checkpoints[i].x > left && L.checkpoints[i].x < right) drawCheckpoint(ctx, L.checkpoints[i], t);
    }
    drawGround(ctx, L, cam);
    for (i = 0; i < L.decor.length; i++) {
      if (L.decor[i].x > left && L.decor[i].x < right) drawDecor(ctx, L.decor[i], t);
    }
    for (i = 0; i < L.platforms.length; i++) {
      var p = L.platforms[i];
      if (p.x + p.w > left && p.x < right) drawPlatform(ctx, p, COL.platTop, COL.platBody, t);
    }
    for (i = 0; i < L.movers.length; i++) {
      drawPlatform(ctx, L.movers[i], COL.moverTop, COL.moverBody, t);
    }
    for (i = 0; i < L.spikes.length; i++) {
      var s = L.spikes[i];
      if (s.x + s.w > left && s.x < right) drawSpikes(ctx, s);
    }
    for (i = 0; i < L.stars.length; i++) {
      var st = L.stars[i];
      if (!st.taken && g.state !== 'title' && st.x > left && st.x < right) drawStar(ctx, st, t);
    }
    for (i = 0; i < L.asteroids.length; i++) {
      var a = L.asteroids[i];
      if (a.cx > left && a.cx < right) drawAsteroid(ctx, a);
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

  /* ---------- interfaz ---------- */
  function drawHUD(ctx, g) {
    var i;
    // vidas
    pill(ctx, 16, 14, 118, 40);
    for (i = 0; i < C.LIVES; i++) {
      heartPath(ctx, 38 + i * 32, 24, 22);
      ctx.fillStyle = i < g.lives ? COL.heart : 'rgba(255,255,255,0.18)';
      ctx.fill();
    }
    // estrellas
    pill(ctx, 144, 14, 112, 40);
    starPath(ctx, 170, 34, 11, 0);
    ctx.fillStyle = COL.star;
    ctx.fill();
    text(ctx, g.collected + '/' + g.level.stars.length, 190, 35, 20, '800', COL.text, 'left');

    // progreso de A a B
    var bx = 310, bw = 340, by = 34;
    var L = g.level;
    var prog = (g.player.x - L.start.x) / (L.goal.x - L.start.x);
    prog = Math.max(0, Math.min(1, prog));
    ctx.fillStyle = 'rgba(24,22,64,0.42)';
    rr(ctx, bx - 30, 14, bw + 60, 40, 20); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.20)';
    rr(ctx, bx, by - 4, bw, 8, 4); ctx.fill();
    ctx.fillStyle = COL.mint;
    rr(ctx, bx, by - 4, Math.max(8, bw * prog), 8, 4); ctx.fill();
    text(ctx, 'A', bx - 15, by + 1, 16, '800', COL.text);
    text(ctx, 'B', bx + bw + 15, by + 1, 16, '800', COL.text);
    ctx.fillStyle = COL.cat;
    ctx.beginPath(); ctx.arc(bx + bw * prog, by, 8, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(bx + bw * prog, by, 8, 0, TAU); ctx.stroke();

    // tiempo
    pill(ctx, W - 176, 14, 100, 40);
    text(ctx, formatTime(g.elapsed), W - 126, 35, 20, '800', COL.text);

    if (g.toast) {
      var a = Math.min(1, g.toast.time * 2.5);
      ctx.globalAlpha = a;
      ctx.font = '700 20px ' + FONT;
      var tw = ctx.measureText(g.toast.text).width + 44;
      pill(ctx, W / 2 - tw / 2, 70, tw, 38);
      text(ctx, g.toast.text, W / 2, 90, 20, '700', COL.text);
      ctx.globalAlpha = 1;
    }
  }

  function dim(ctx, a) {
    ctx.fillStyle = 'rgba(24,22,64,' + a + ')';
    ctx.fillRect(0, 0, W, H);
  }

  function drawTitle(ctx, g) {
    dim(ctx, 0.5);
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
    text(ctx, 'Pulsa Enter o toca la pantalla para empezar', W / 2, 300, 24, '700', COL.text);
    ctx.globalAlpha = 1;
    text(ctx, '← → mover   ·   Espacio / ↑ saltar   ·   P pausa   ·   M sonido', W / 2, 500, 17, '600', 'rgba(255,246,230,0.8)');
    text(ctx, 'Beta ' + C.VERSION, W / 2, 262, 18, '700', 'rgba(255,246,230,0.75)');
    if (g.bestTime) {
      text(ctx, 'Mejor tiempo: ' + formatTime(g.bestTime), W / 2, 340, 18, '600', 'rgba(255,246,230,0.8)');
    }
  }

  function drawPause(ctx) {
    dim(ctx, 0.5); // el menú de pausa es HTML (ver index.html / css)
  }

  function drawWin(ctx, g) {
    dim(ctx, 0.5);
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
      text(ctx, 'Pulsa Enter o toca para jugar otra vez', W / 2, y + 262, 20, '700', COL.text);
      ctx.globalAlpha = 1;
    }
  }

  /* ---------- punto de entrada ---------- */
  function draw(ctx, g) {
    var k = ctx.canvas.width / W;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.clearRect(0, 0, W, H);

    drawBackground(ctx, g.cam, g.t, g.level.theme);
    ctx.save();
    ctx.translate(-Math.round(g.cam), 0);
    drawWorld(ctx, g, g.cam);
    ctx.restore();
    SC.Scenery.drawMotes(ctx, g.cam, g.t, g.level.theme);

    if (g.state !== 'title') drawHUD(ctx, g);
    if (g.state === 'title') drawTitle(ctx, g);
    else if (g.state === 'paused') drawPause(ctx);
    else if (g.state === 'win') drawWin(ctx, g);
  }

  SC.Render = { draw: draw };
})(typeof window !== 'undefined' ? window : globalThis);
