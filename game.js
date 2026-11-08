/* SpaceCat — lógica principal: estados (título, jugando, pausa, victoria), vidas, cámara. */
(function (global) {
  'use strict';
  var SC = global.SpaceCat = global.SpaceCat || {};
  var C = SC.CONFIG;
  var Input = SC.Input;
  var BEST_KEY = 'spacecat.best';

  function readBest() {
    try { return parseFloat(global.localStorage.getItem(BEST_KEY)) || 0; } catch (e) { return 0; }
  }
  function saveBest(v) {
    try { global.localStorage.setItem(BEST_KEY, String(v)); } catch (e) { /* sin almacenamiento: ok */ }
  }

  function Game(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.player = new SC.Player();
    this.particles = [];
    this.t = 0;
    this.state = 'title';
    this.toast = null;
    this.levelIndex = 0;
    this.bestTime = readBest();
    this.newRecord = false;
    this.winTimer = 0;
    this.loadLevel(0);
  }

  Game.prototype.loadLevel = function (i) {
    this.levelIndex = i;
    this.level = new SC.Level(SC.LEVELS[i]);
    this.restartRun();
  };

  Game.prototype.restartRun = function () {
    var L = this.level;
    L.resetState();
    this.lives = C.LIVES;
    this.collected = 0;
    this.elapsed = 0;
    this.winTimer = 0;
    this.newRecord = false;
    this.respawn = { x: L.start.x, y: L.start.y };
    this.player.reset(L.start.x, L.start.y);
    this.cam = 0;
    this.particles.length = 0;
  };

  // Pausa real: la simulación (físicas, animaciones del mundo, tiempo) no avanza en 'paused'.
  Game.prototype.pause = function () {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    Input.releaseAll(); // evita direcciones "pegadas" al volver
  };
  Game.prototype.resume = function () {
    if (this.state === 'paused') { this.state = 'playing'; Input.releaseAll(); }
  };
  Game.prototype.restartLevel = function () {
    this.restartRun();
    this.state = 'playing';
    Input.releaseAll();
    SC.Sfx.play('start');
  };

  Game.prototype.showToast = function (msg) {
    this.toast = { text: msg, time: 1.8 };
  };

  /* ---------- partículas ---------- */
  Game.prototype.burst = function (x, y, n, colors, speed, gravity, star) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2;
      var v = speed * (0.35 + Math.random() * 0.65);
      var life = 0.5 + Math.random() * 0.5;
      this.particles.push({
        x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * 0.3,
        g: gravity, life: life, max: life,
        size: 2 + Math.random() * 3, star: !!star,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  };

  Game.prototype.dust = function (x, y, n) {
    for (var i = 0; i < n; i++) {
      var life = 0.3 + Math.random() * 0.2;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 14, y: y - 1,
        vx: (Math.random() - 0.5) * 90, vy: -10 - Math.random() * 40,
        g: 0, life: life, max: life, size: 2 + Math.random() * 2.5,
        star: false, color: '#fff1d9'
      });
    }
  };

  Game.prototype.updateParticles = function (dt) {
    var list = this.particles;
    for (var i = list.length - 1; i >= 0; i--) {
      var q = list[i];
      q.life -= dt;
      if (q.life <= 0) { list.splice(i, 1); continue; }
      q.vy += q.g * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
    }
  };

  /* ---------- eventos del juego ---------- */
  Game.prototype.hurt = function (reason) {
    var p = this.player;
    var L = this.level;
    this.lives -= 1;
    SC.Sfx.play('hurt');
    this.burst(p.x + p.w / 2, p.y + p.h / 2, 14, ['#ff8fa3', '#ffc7b8', '#fff1d9'], 220, 500, false);

    if (this.lives <= 0) {
      // Sin vidas: se vuelve al inicio del nivel (sin castigo extra).
      this.lives = C.LIVES;
      this.collected = 0;
      this.elapsed = 0;
      L.resetState();
      this.respawn = { x: L.start.x, y: L.start.y };
      p.reset(L.start.x, L.start.y);
      p.invuln = C.INVULN_TIME;
      this.showToast('¡Otra vez! Tú puedes');
      return;
    }
    if (reason === 'fall') {
      p.reset(this.respawn.x, this.respawn.y);
      p.invuln = C.INVULN_TIME;
    } else {
      // Rebote suave hacia atrás.
      p.vy = -430;
      p.vx = -p.facing * 240;
      p.onGround = false;
      p.groundObj = null;
      p.invuln = C.INVULN_TIME;
    }
  };

  Game.prototype.win = function () {
    this.state = 'win';
    this.winTimer = 0;
    SC.Sfx.play('win');
    if (!this.bestTime || this.elapsed < this.bestTime) {
      this.bestTime = this.elapsed;
      this.newRecord = true;
      saveBest(this.elapsed);
    }
    var p = this.player;
    var cols = ['#ffd98a', '#9fe8d0', '#c3b3ff', '#ff8fa3', '#fff1d9'];
    for (var i = 0; i < 4; i++) this.burst(p.x + p.w / 2, p.y - 10, 18, cols, 340, 520, i % 2 === 0);
  };

  /* ---------- actualización por frame ---------- */
  Game.prototype.update = function (dt) {
    dt = Math.min(dt, 1 / 30);
    this.t += dt;

    if (Input.mutePressed) {
      this.showToast(SC.Sfx.toggle() ? 'Sonido apagado' : 'Sonido encendido');
    }
    if (this.toast) {
      this.toast.time -= dt;
      if (this.toast.time <= 0) this.toast = null;
    }

    switch (this.state) {
      case 'title':
        this.level.update(dt, null);
        this.cam = 0;
        if (Input.actionPressed) {
          this.restartRun();
          this.state = 'playing';
          SC.Sfx.play('start');
        }
        break;
      case 'playing':
        this.updatePlaying(dt);
        break;
      case 'paused':
        if (Input.pausePressed) this.resume(); // solo P/Esc o el menú reanudan
        break;
      case 'win':
        this.winTimer += dt;
        this.level.update(dt, null);
        this.updateParticles(dt);
        if (this.winTimer > 0.8 && Input.actionPressed) {
          this.restartRun();
          this.state = 'playing';
          SC.Sfx.play('start');
        }
        break;
    }
  };

  Game.prototype.updatePlaying = function (dt) {
    if (Input.pausePressed) { this.pause(); return; }

    var p = this.player;
    var L = this.level;
    var i;
    this.elapsed += dt;

    L.update(dt, p);
    p.update(dt, Input, L.solids, L.width);

    if (p.justJumped) {
      SC.Sfx.play('jump');
      this.dust(p.x + p.w / 2, p.y + p.h, 5);
    }
    if (p.justLanded) this.dust(p.x + p.w / 2, p.y + p.h, 6);

    var got = L.collectStars(p);
    for (i = 0; i < got.length; i++) {
      this.collected += 1;
      SC.Sfx.play('star');
      this.burst(got[i].x, got[i].y, 8, ['#ffd98a', '#fff0c2', '#ffffff'], 130, 0, true);
    }

    var cp = L.touchCheckpoint(p);
    if (cp) {
      this.respawn = { x: cp.x - p.w / 2, y: C.GROUND_Y - p.h - 1 };
      this.showToast('Punto de control');
      SC.Sfx.play('check');
      this.burst(cp.x, C.GROUND_Y - 78, 12, ['#ffe7a6', '#fff6e6', '#9fe8d0'], 150, 0, true);
    }

    if (p.invuln <= 0) {
      var hit = L.hitHazard(p);
      if (hit) this.hurt(hit);
    }
    if (p.y > C.HEIGHT + 60) this.hurt('fall');

    if (L.reachedGoal(p)) this.win();

    // Cámara que sigue al gato con suavidad.
    var target = p.x + p.w / 2 - C.WIDTH * 0.4;
    target = Math.max(0, Math.min(L.width - C.WIDTH, target));
    this.cam += (target - this.cam) * Math.min(1, dt * 6);

    this.updateParticles(dt);
  };

  SC.Game = Game;
})(typeof window !== 'undefined' ? window : globalThis);
