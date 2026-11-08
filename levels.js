/* SpaceCat — datos de los niveles.
 *
 * Para crear un nivel nuevo, copia el objeto de abajo y cambia los números.
 * Todas las posiciones están en píxeles. El suelo está en y = 450 (CONFIG.GROUND_Y).
 *
 *  ground:      tramos de suelo [desde_x, hasta_x]. Los huecos entre tramos son vacío (¡cuidado!).
 *  platforms:   plataformas flotantes [x, y, ancho]. Se pueden atravesar desde abajo.
 *  movers:      plataformas que se mueven {x, y, w, axis:'x'|'y', range, speed}.
 *  spikes:      cristales peligrosos sobre el suelo [x, ancho].
 *  asteroids:   asteroides que flotan {x, y, r, axis:'x'|'y', range, speed}.
 *  stars:       estrellas coleccionables [x, y] (abajo hay ayudas para hacer arcos).
 *  checkpoints: posiciones x de los faroles de punto de control.
 *  goal:        posición x del portal del punto B.
 */
(function (global) {
  'use strict';
  var SC = global.SpaceCat = global.SpaceCat || {};

  // Genera estrellas en forma de arco (ideal para marcar la trayectoria de un salto).
  function arc(x, y, n, gap, height) {
    var out = [];
    for (var i = 0; i < n; i++) {
      var t = n === 1 ? 0.5 : i / (n - 1);
      out.push([x + i * gap, Math.round(y - Math.sin(t * Math.PI) * height)]);
    }
    return out;
  }

  // Genera estrellas en línea recta.
  function row(x, y, n, gap) {
    var out = [];
    for (var i = 0; i < n; i++) out.push([x + i * gap, y]);
    return out;
  }

  SC.LEVELS = [
    {
      name: 'Jardín de Luna',
      width: 5400,
      start: { x: 90 },
      goal: { x: 5180 },

      ground: [
        [0, 900], [1020, 1700], [1860, 2600],
        [2760, 3500], [3700, 4500], [4640, 5400]
      ],

      platforms: [
        [380, 355, 140],
        [1180, 340, 120], [1360, 290, 110],
        [1745, 420, 70],
        [2330, 350, 120],
        [2655, 420, 60],
        [3040, 330, 120],
        [4535, 425, 70],
        [4800, 350, 110], [4960, 300, 100]
      ],

      movers: [
        { x: 3505, y: 430, w: 90, axis: 'x', range: 105, speed: 1.1 }
      ],

      spikes: [
        [560, 60], [1320, 70], [1500, 90], [2050, 60], [2250, 100],
        [2950, 60], [3150, 60], [3250, 60], [3900, 90], [4200, 60]
      ],

      asteroids: [
        { x: 780, y: 300, r: 20, axis: 'y', range: 50, speed: 1.2 },
        { x: 1780, y: 300, r: 20, axis: 'y', range: 40, speed: 1.6 },
        { x: 2440, y: 270, r: 22, axis: 'x', range: 80, speed: 1.2 },
        { x: 3600, y: 280, r: 22, axis: 'y', range: 50, speed: 1.5 },
        { x: 4080, y: 330, r: 22, axis: 'x', range: 55, speed: 1.3 },
        { x: 4900, y: 290, r: 24, axis: 'y', range: 70, speed: 1.1 }
      ],

      stars: [].concat(
        arc(380, 310, 4, 40, 25),
        arc(545, 375, 5, 36, 60),
        arc(905, 390, 4, 38, 70),
        row(1200, 305, 3, 40),
        row(1380, 255, 3, 40),
        arc(1490, 380, 6, 36, 70),
        arc(1700, 395, 5, 38, 60),
        arc(2040, 385, 5, 36, 60),
        arc(2240, 375, 7, 36, 80),
        row(2350, 315, 3, 40),
        arc(2610, 390, 5, 35, 60),
        arc(2940, 380, 4, 35, 60),
        row(3040, 295, 3, 40),
        arc(3140, 375, 8, 36, 70),
        row(3520, 350, 5, 38),
        arc(3880, 385, 5, 36, 70),
        arc(4180, 380, 5, 35, 60),
        arc(4500, 390, 5, 35, 60),
        row(4815, 310, 3, 36),
        row(4975, 260, 3, 36)
      ),

      checkpoints: [1100, 1960, 2850, 3800, 4700]
    }
  ];
})(typeof window !== 'undefined' ? window : globalThis);
