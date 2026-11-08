/* Space Cat — skins del gato. Cada skin es un objeto con draw(ctx, pose, t).
 * Origen (0,0) = pies, centro del gato; mira a la DERECHA (+x). Alto aprox. 52 px.
 * Para añadir una skin: SC.Skins.register('nombre', { colors:{...}, draw:function(...){} }).
 * Poses: idle, walk, run, jump, fall, celebrate. (Pendientes: land, hurt) */
(function (global) {
  'use strict';
  var SC = global.SpaceCat = global.SpaceCat || {};
  var TAU = Math.PI * 2;
  var skins = {};

  function ell(ctx, x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); }

  var DEFAULT = {
    name: 'Space Cat',
    colors: { fur: '#3b3b41', furDark: '#2c2c32', line: '#6f6f7d', eye: '#f7b538', pupil: '#14141a', white: '#fff6e6' },
    draw: function (ctx, pose, t) {
      var K = this.colors;
      var moving = pose === 'walk' || pose === 'run';
      var air = pose === 'jump' || pose === 'fall';
      var f = pose === 'run' ? 20 : 13;
      var sw = moving ? Math.sin(t * f) : 0;
      var bob = moving ? Math.abs(sw) * 2 : pose === 'celebrate' ? -Math.abs(Math.sin(t * 8)) * 9 : Math.sin(t * 3) * 0.7;
      ctx.translate(0, -bob);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.strokeStyle = K.line; ctx.lineWidth = 1.6; ctx.fillStyle = K.fur;

      // cola gruesa y levantada (con penacho)
      var sway = Math.sin(t * (moving ? 9 : 2.6)) * (air ? 2 : 5);
      var tx = -22 + sway, ty = air ? -44 : -38;
      ctx.beginPath();
      ctx.moveTo(-8, -6);
      ctx.bezierCurveTo(-26, -2, -30, -22, tx, ty);
      ctx.lineTo(tx + 6, ty + 3);
      ctx.bezierCurveTo(-18, -20, -14, -12, -4, -14);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx - 4, ty + 6); ctx.lineTo(tx + 3, ty + 4); ctx.lineTo(tx + 1, ty + 10);
      ctx.strokeStyle = K.furDark; ctx.stroke(); ctx.strokeStyle = K.line;

      // patas
      var a = air ? (pose === 'jump' ? -5 : 4) : sw * 5;
      ctx.fillStyle = K.furDark;
      ell(ctx, -7 - a, -3, 5.5, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = K.fur;
      ell(ctx, 8 + a, -3, 5.5, 4); ctx.fill(); ctx.stroke();

      // cuerpo compacto
      ell(ctx, 0, -14, 12.5, 13); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-3, -9); ctx.lineTo(-4, -2); ctx.moveTo(5, -10); ctx.lineTo(6, -3);
      ctx.strokeStyle = K.furDark; ctx.stroke(); ctx.strokeStyle = K.line;

      // cabeza grande, orejas puntiagudas y mechón
      var hx = 3, hy = -30 + (pose === 'idle' ? Math.sin(t * 3) * 0.5 : 0);
      var back = pose === 'fall' ? 2 : 0; // orejas hacia atrás al caer
      ctx.beginPath();
      ctx.moveTo(hx - 13, hy - 4); ctx.lineTo(hx - 12 - back, hy - 21); ctx.lineTo(hx - 4, hy - 11);
      ctx.lineTo(hx - 1, hy - 14); ctx.lineTo(hx + 2, hy - 11);
      ctx.lineTo(hx + 8, hy - 11); ctx.lineTo(hx + 17 + back, hy - 22); ctx.lineTo(hx + 17, hy - 6);
      ctx.lineTo(hx + 20, hy + 1); ctx.lineTo(hx + 14, hy + 3); ctx.lineTo(hx + 14, hy + 8);
      ctx.lineTo(hx + 6, hy + 11); ctx.lineTo(hx - 6, hy + 10); ctx.lineTo(hx - 13, hy + 5);
      ctx.closePath(); ctx.fillStyle = K.fur; ctx.fill(); ctx.stroke();

      // ojos grandes amarillos con pupila vertical
      var blink = (Math.floor(t * 10) % 37 === 0) ? 0.15 : 1;
      var look = pose === 'jump' ? -1.5 : 0;
      var eyes = [[hx - 3, hy - 1], [hx + 10, hy - 1]];
      for (var i = 0; i < 2; i++) {
        ctx.fillStyle = K.eye; ell(ctx, eyes[i][0], eyes[i][1] + look, 5.6, 6.4 * blink); ctx.fill();
        ctx.fillStyle = K.pupil; ell(ctx, eyes[i][0] + 0.8, eyes[i][1] + look, 1.2, 4.6 * blink); ctx.fill();
      }
      ctx.strokeStyle = K.line; ctx.lineWidth = 1.2; // sonrisita
      ctx.beginPath(); ctx.moveTo(hx + 3, hy + 8); ctx.quadraticCurveTo(hx + 6, hy + 10, hx + 9, hy + 8); ctx.stroke();
    }
  };

  SC.Skins = {
    register: function (id, skin) { skins[id] = skin; },
    get: function (id) { return skins[id] || skins['default']; },
    current: 'default',   // futuro: leer de la progresión guardada
    poseOf: function (p, state) {
      if (state === 'win') return 'celebrate';
      if (!p.onGround) return p.vy < 0 ? 'jump' : 'fall';
      var s = Math.abs(p.vx);
      return s > 200 ? 'run' : s > 30 ? 'walk' : 'idle';
    }
  };
  SC.Skins.register('default', DEFAULT);
})(typeof window !== 'undefined' ? window : globalThis);
