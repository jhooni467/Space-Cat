/* SpaceCat — un nivel en juego: construye los objetos a partir de levels.js,
 * los mueve y revisa colisiones con peligros, estrellas, faroles y la meta. */
(function (global) {
  'use strict';
  var SC = global.SpaceCat = global.SpaceCat || {};
  var C = SC.CONFIG;
  var GY = C.GROUND_Y;
  var SH = C.SPIKE_H;

  function hash(n) {
    var x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  function Level(def) {
    this.name = def.name;
    this.width = def.width;
    this.start = { x: def.start.x, y: GY - C.PLAYER_H };
    this.goal = { x: def.goal.x, w: 80 };

    this.ground = def.ground.map(function (g) {
      return { x: g[0], y: GY, w: g[1] - g[0], h: C.HEIGHT - GY, kind: 'ground' };
    });
    this.platforms = def.platforms.map(function (p) {
      return { x: p[0], y: p[1], w: p[2], h: 18, oneWay: true, kind: 'platform' };
    });
    this.movers = def.movers.map(function (m, i) {
      return {
        x: m.x, y: m.y, baseX: m.x, baseY: m.y, w: m.w || 90, h: 18,
        axis: m.axis || 'x', range: m.range || 100, speed: m.speed || 1,
        phase: m.phase || 0, oneWay: true, kind: 'mover', id: i
      };
    });
    this.spikes = def.spikes.map(function (s) {
      return { x: s[0], w: s[1], y: GY - SH, h: SH };
    });
    this.asteroids = def.asteroids.map(function (a, i) {
      return {
        x0: a.x, y0: a.y, cx: a.x, cy: a.y, r: a.r || 22,
        axis: a.axis || 'y', range: a.range || 40, speed: a.speed || 1.2,
        phase: a.phase || i, rot: 0, spin: (i % 2 ? 1 : -1) * 0.8
      };
    });
    this.stars = def.stars.map(function (s, i) {
      return { x: s[0], y: s[1], taken: false, phase: i * 0.7 };
    });
    this.checkpoints = def.checkpoints.map(function (x) {
      return { x: x, active: false };
    });

    // Todo lo que se puede pisar (los movers comparten referencia: al moverse, se actualizan solos).
    this.solids = this.ground.concat(this.platforms, this.movers);
    this.decor = buildDecor(this);
    this.time = 0;
    this.resetState();
  }

  // Flores, hongos, faroles y pasto para que el mundo se vea acogedor.
  function buildDecor(L) {
    var out = [];
    var gx = 40;
    var i = 0;
    function inGround(x) {
      return L.ground.some(function (g) { return x > g.x + 24 && x < g.x + g.w - 24; });
    }
    while (gx < L.width - 20) {
      gx += 46 + hash(i + 11) * 64;
      i++;
      if (!inGround(gx)) continue;
      if (L.spikes.some(function (s) { return gx > s.x - 36 && gx < s.x + s.w + 36; })) continue;
      if (L.checkpoints.some(function (c) { return Math.abs(gx - c.x) < 30; })) continue;
      if (Math.abs(gx - L.start.x) < 70 || Math.abs(gx - 170) < 40) continue;
      if (Math.abs(gx - L.goal.x) < 90 || Math.abs(gx - (L.goal.x - 110)) < 40) continue;
      var k = hash(i + 77);
      out.push({
        x: Math.round(gx),
        kind: k < 0.40 ? 'flower' : k < 0.68 ? 'grass' : k < 0.88 ? 'mushroom' : 'lantern',
        r: hash(i + 5),
        c: Math.floor(hash(i + 31) * 4)
      });
    }
    return out;
  }

  Level.prototype.resetState = function () {
    var i;
    this.time = 0;
    for (i = 0; i < this.stars.length; i++) this.stars[i].taken = false;
    for (i = 0; i < this.checkpoints.length; i++) this.checkpoints[i].active = false;
    for (i = 0; i < this.movers.length; i++) this.placeMover(this.movers[i]);
    for (i = 0; i < this.asteroids.length; i++) this.placeAsteroid(this.asteroids[i], 0);
  };

  Level.prototype.placeMover = function (m) {
    var s = (Math.sin(this.time * m.speed + m.phase) + 1) / 2;
    if (m.axis === 'x') m.x = m.baseX + s * m.range;
    else m.y = m.baseY + s * m.range;
  };

  Level.prototype.placeAsteroid = function (a, dt) {
    var s = Math.sin(this.time * a.speed + a.phase) * a.range;
    if (a.axis === 'x') { a.cx = a.x0 + s; a.cy = a.y0; }
    else { a.cx = a.x0; a.cy = a.y0 + s; }
    a.rot += a.spin * dt;
  };

  Level.prototype.update = function (dt, player) {
    var i;
    this.time += dt;
    for (i = 0; i < this.movers.length; i++) {
      var m = this.movers[i];
      var px = m.x, py = m.y;
      this.placeMover(m);
      // Si el gato va encima, se mueve con la plataforma.
      if (player && player.groundObj === m) {
        player.x += m.x - px;
        player.y += m.y - py;
      }
    }
    for (i = 0; i < this.asteroids.length; i++) this.placeAsteroid(this.asteroids[i], dt);
  };

  // Devuelve 'spike', 'asteroid' o null.
  Level.prototype.hitHazard = function (p) {
    var bx = p.x + 4, by = p.y + 4, bw = p.w - 8, bh = p.h - 6; // caja un poco más chica = más justo
    var i;
    for (i = 0; i < this.spikes.length; i++) {
      var s = this.spikes[i];
      if (bx < s.x + s.w - 8 && bx + bw > s.x + 8 && by < s.y + s.h && by + bh > s.y + 14) return 'spike';
    }
    for (i = 0; i < this.asteroids.length; i++) {
      var a = this.asteroids[i];
      var dx = a.cx - clamp(a.cx, bx, bx + bw);
      var dy = a.cy - clamp(a.cy, by, by + bh);
      var rr = a.r - 3;
      if (dx * dx + dy * dy < rr * rr) return 'asteroid';
    }
    return null;
  };

  // Recoge estrellas cerca del gato. Devuelve las que recogió.
  Level.prototype.collectStars = function (p) {
    var got = [];
    var cx = p.x + p.w / 2, cy = p.y + p.h / 2;
    for (var i = 0; i < this.stars.length; i++) {
      var s = this.stars[i];
      if (s.taken) continue;
      var dx = cx - s.x, dy = cy - s.y;
      if (dx * dx + dy * dy < 26 * 26) { s.taken = true; got.push(s); }
    }
    return got;
  };

  // Activa los faroles que el gato ya pasó. Devuelve el último activado (o null).
  Level.prototype.touchCheckpoint = function (p) {
    var cx = p.x + p.w / 2;
    var last = null;
    for (var i = 0; i < this.checkpoints.length; i++) {
      var c = this.checkpoints[i];
      if (!c.active && cx >= c.x) { c.active = true; last = c; }
    }
    return last;
  };

  Level.prototype.reachedGoal = function (p) {
    var cx = p.x + p.w / 2;
    return Math.abs(cx - this.goal.x) < this.goal.w / 2 && p.y + p.h > GY - 170;
  };

  SC.Level = Level;
})(typeof window !== 'undefined' ? window : globalThis);
