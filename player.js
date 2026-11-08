/* SpaceCat — el gato: movimiento, salto y colisiones. */
(function (global) {
  'use strict';
  var SC = global.SpaceCat = global.SpaceCat || {};
  var C = SC.CONFIG;
  var EPS = 0.01;

  function overlaps(a, s) {
    return a.x + EPS < s.x + s.w && a.x + a.w - EPS > s.x &&
           a.y + EPS < s.y + s.h && a.y + a.h - EPS > s.y;
  }

  function Player() {
    this.w = C.PLAYER_W;
    this.h = C.PLAYER_H;
    this.reset(0, 0);
  }

  Player.prototype.reset = function (x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.groundObj = null;
    this.coyote = 0;
    this.buffer = 0;
    this.facing = 1;
    this.invuln = 0;
    this.t = 0;
    this.justJumped = false;
    this.justLanded = false;
  };

  Player.prototype.update = function (dt, inp, solids, levelWidth) {
    var i, s;
    this.t += dt;
    this.justJumped = false;
    this.justLanded = false;
    if (this.invuln > 0) this.invuln -= dt;

    // Temporizadores de "margen" (hacen el salto más amable).
    this.coyote = this.onGround ? C.COYOTE_TIME : Math.max(0, this.coyote - dt);
    this.buffer = inp.jumpPressed ? C.JUMP_BUFFER : Math.max(0, this.buffer - dt);

    // Movimiento horizontal con aceleración suave.
    var dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    var accel = dir !== 0
      ? (this.onGround ? C.ACCEL_GROUND : C.ACCEL_AIR)
      : (this.onGround ? C.FRICTION_GROUND : C.FRICTION_AIR);
    var diff = dir * C.MOVE_SPEED - this.vx;
    var step = accel * dt;
    this.vx += Math.abs(diff) <= step ? diff : (diff > 0 ? step : -step);
    if (dir !== 0) this.facing = dir;

    // Salto.
    if (this.buffer > 0 && this.coyote > 0) {
      this.vy = -C.JUMP_SPEED;
      this.buffer = 0;
      this.coyote = 0;
      this.onGround = false;
      this.groundObj = null;
      this.justJumped = true;
    }

    // Gravedad (si sueltas el salto mientras subes, el salto se corta: control fino de la altura).
    var g = C.GRAVITY;
    if (this.vy < 0 && !inp.jump) g *= C.JUMP_CUT;
    this.vy = Math.min(this.vy + g * dt, C.MAX_FALL);

    // Mover en X y resolver.
    this.x += this.vx * dt;
    for (i = 0; i < solids.length; i++) {
      s = solids[i];
      if (s.oneWay || !overlaps(this, s)) continue;
      if (this.vx > 0) this.x = s.x - this.w;
      else if (this.vx < 0) this.x = s.x + s.w;
      this.vx = 0;
    }
    if (this.x < 0) { this.x = 0; this.vx = 0; }
    if (this.x > levelWidth - this.w) { this.x = levelWidth - this.w; this.vx = 0; }

    // Mover en Y y resolver.
    var wasGround = this.onGround;
    var prevBottom = this.y + this.h;
    this.onGround = false;
    this.groundObj = null;
    this.y += this.vy * dt;
    for (i = 0; i < solids.length; i++) {
      s = solids[i];
      if (!overlaps(this, s)) continue;
      if (this.vy > 0) {
        if (s.oneWay && prevBottom > s.y + 6) continue; // venía de abajo/dentro: la atraviesa
        this.y = s.y - this.h;
        this.vy = 0;
        this.onGround = true;
        this.groundObj = s;
        if (!wasGround) this.justLanded = true;
      } else if (this.vy < 0 && !s.oneWay) {
        this.y = s.y + s.h;
        this.vy = 0;
      }
    }
  };

  SC.Player = Player;
})(typeof window !== 'undefined' ? window : globalThis);
