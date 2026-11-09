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
 *
 * GUÍA DE DISTANCIAS (Beta 0.2) — medidas con el salto actual (ver config.js):
 *  - Salto simple: sube ~110 px. Doble salto: sube hasta ~213 px (cómodo hasta ~190).
 *  - Plataformas que se alcanzan con salto simple: hasta ~85 px sobre su superficie (y ≥ 365 sobre el suelo).
 *  - Plataformas / puentes que EXIGEN doble salto: entre 160 y 185 px sobre el suelo (y entre 265 y 290).
 *  - Huecos: salto simple cómodo hasta ~150 px · con doble salto cómodo hasta ~240 px · más: usa un mover.
 *  - Entre un grupo de obstáculos y el siguiente deja ≥ 300 px; tras un aterrizaje ≥ 220 px libres.
 *  Comprueba el nivel con:  node tests/validate-level.js
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
      name: 'Colinas del Atardecer',
      theme: 'atardecer',
      width: 8440,
      start: { x: 340 },     // el gato empieza algo adentro: así los botones táctiles no lo tapan
      goal: { x: 8240 },

      //            G1          hueco 1 (con piedra)   G2           hueco 2      G3
      ground: [
        [0, 1560], [1790, 3320], [3470, 5300],
        // hueco 3 (280 px: exige doble salto)  G4       hueco 4 (mover)   G5a          hueco 5     G6
        [5580, 6220], [6540, 7390], [7530, 8440]
      ],

      platforms: [
        [700, 372, 140],            // primera plataforma baja (salto simple)
        [1630, 428, 70],            // piedra en medio del hueco 1
        // Primera plataforma ALTA: solo se alcanza con doble salto
        [2610, 285, 150],
        // Puente de estrellas: tres plataformas altas seguidas
        [4330, 275, 120], [4520, 275, 120], [4710, 275, 120],
        // Plataforma alta cerca del final
        [7640, 285, 140]
      ],

      movers: [
        { x: 6290, y: 430, w: 100, axis: 'x', range: 130, speed: 1.1 }
      ],

      spikes: [
        [1160, 60], [2150, 90], [3900, 60], [6920, 90], [7940, 60]
      ],

      asteroids: [
        { x: 3395, y: 290, r: 20, axis: 'y', range: 45, speed: 1.1 },   // sobre el hueco 2
        { x: 3930, y: 300, r: 20, axis: 'y', range: 40, speed: 1.4 },   // sobre los cristales
        { x: 6965, y: 295, r: 22, axis: 'x', range: 60, speed: 1.2 },
        { x: 7970, y: 300, r: 22, axis: 'y', range: 45, speed: 1.3 }
      ],

      stars: [].concat(
        arc(400, 400, 5, 42, 55),
        row(720, 330, 3, 44),
        arc(930, 400, 5, 42, 55),
        arc(1190, 395, 5, 36, 65),      // sobre los primeros cristales
        arc(1490, 395, 6, 42, 70),      // hueco 1
        arc(1950, 400, 5, 40, 55),
        arc(2125, 395, 5, 36, 70),      // cristales anchos
        // camino de estrellas que guía el doble salto hacia la plataforma alta (trayectoria medida con el simulador)
        [[2402, 420], [2448, 352], [2494, 321], [2540, 254], [2586, 222]],
        row(2640, 243, 4, 36),
        arc(3290, 395, 8, 32, 80),      // hueco 2
        arc(3700, 400, 5, 40, 55),
        arc(3880, 395, 5, 36, 70),
        row(4345, 233, 3, 40), row(4535, 233, 3, 40), row(4725, 233, 3, 40),   // puente de estrellas
        arc(4400, 405, 6, 44, 35),
        arc(5000, 400, 5, 40, 55),
        // camino de estrellas que guía el doble salto sobre el hueco 3 (280 px: el salto simple no llega)
        [[5270, 350], [5325, 310], [5380, 262], [5430, 224], [5480, 232], [5530, 290], [5585, 380]],
        row(5680, 400, 4, 44),
        row(6640, 400, 4, 44),
        arc(6905, 395, 5, 36, 70),
        arc(7100, 400, 5, 40, 55),
        arc(7370, 395, 6, 36, 70),      // hueco 5
        row(7655, 243, 4, 36),
        arc(7910, 395, 5, 36, 70),
        row(8070, 400, 4, 44)
      ),

      checkpoints: [1880, 3580, 5690, 6640, 7640]
    }
  ];
})(typeof window !== 'undefined' ? window : globalThis);
