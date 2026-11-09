/* SpaceCat — configuración general.
 * Aquí se ajusta la "sensación" del juego (física, vidas) y la paleta de colores.
 * Todos los demás archivos leen estos valores, así que casi todo se cambia desde aquí. */
(function (global) {
  'use strict';
  var SC = global.SpaceCat = global.SpaceCat || {};

  SC.CONFIG = {
    VERSION: '0.2',
    // Mundo y vista (Beta 0.2). El mundo mide siempre WORLD_H de alto; la vista se adapta a la pantalla:
    //  - VIEW_W: ancho del mundo que se ve de lado a lado (antes 960). La pantalla se llena SIN estirar nada:
    //    si es más ancha de lo normal se ve más escenario; si es más cuadrada (tablet 4:3) se ve más cielo.
    //  - MAX_PIXELS: tope de píxeles del lienzo. Evita pantallas retina enormes que ahogan tablets antiguas.
    WORLD_H: 540,
    VIEW_W: 1200,
    MAX_VIEW_H: 820,        // alto máximo de la vista: en pantallas muy cuadradas no se llena todo de cielo vacío
    BOTTOM_RESERVE: 64,     // en pantallas altas el suelo se eleva un poco para quedar sobre los botones táctiles
    MAX_PIXELS: 1600000,
    GROUND_Y: 450,          // altura (y) de la superficie del suelo
    SPIKE_H: 34,            // altura de los cristales peligrosos

    // Física: salto ligero y ágil (todos estos valores se pueden ajustar).
    // Beta 0.2: el salto normal se redujo (antes ~180 px) para que el doble salto tenga sentido.
    STEP: 1 / 120,          // paso fijo de simulación: mismo salto en 30, 60, 120 o 144 fps
    GRAVITY: 1650,
    FALL_MULT: 1.3,         // al caer la gravedad es mayor: se siente más ligero y preciso
    MAX_FALL: 920,
    MOVE_SPEED: 290,
    ACCEL_GROUND: 3200,
    ACCEL_AIR: 2200,
    FRICTION_GROUND: 3200,
    FRICTION_AIR: 700,

    // Salto
    JUMP_SPEED: 610,        // salto desde el suelo (~110 px de altura, unas 2,7 veces el alto del gato)
    JUMP2_SPEED: 747,       // segundo salto en el aire: sube 1,5 veces lo que sube el primero (~166 px más; con doble salto llega a ~277 px)
    AIR_JUMPS: 1,           // saltos extra en el aire (1 = doble salto)
    JUMP_MIN: 0.62,         // un toque rápido sube al menos esta fracción de la velocidad
    JUMP_CUT: 1.6,          // gravedad extra si sueltas el botón mientras subes
    JUMP_LATCH: 0.07,       // un toque cuenta como "mantenido" al menos este tiempo (s)
    DOUBLE_GAP: 0.08,       // mínimo entre el 1.º y el 2.º salto (evita eventos duplicados)
    COYOTE_TIME: 0.12,      // margen para saltar justo después de salir del borde
    JUMP_BUFFER: 0.16,      // margen para pulsar salto un poco antes de aterrizar
    FLIP_TIME: 0.42,        // duración de la voltereta del doble salto

    // Jugador
    PLAYER_W: 32,
    PLAYER_H: 40,
    CAT_SPRITE: 72,         // tamaño al dibujar cat.png (si lo agregas)
    LIVES: 3,
    INVULN_TIME: 1.6,       // segundos de invulnerabilidad tras un golpe

    // Paleta: colores vivos pero suaves (nada saturado al máximo)
    COLORS: {
      skyTop: '#222a5e',
      skyMid: '#4a4590',
      skyLow: '#c98fb0',
      hillFar: '#6d5ba6',
      hillMid: '#5a4b95',
      groundTop: '#9ccf6a',
      groundBody: '#35503a',
      groundDeep: '#22362b',
      platTop: '#ffc98a',
      platBody: '#b8607c',
      moverTop: '#ffe3a0',
      moverBody: '#d8828a',
      spike: '#ff8c8c',
      spikeDark: '#e0687a',
      spikeLight: '#ffc7b8',
      asteroid: '#b59aa8',
      asteroidDark: '#8e7790',
      star: '#ffd98a',
      starLight: '#fff0c2',
      cat: '#ffb067',
      catDark: '#e58a46',
      cream: '#fff1d9',
      mint: '#7be0c3',
      heart: '#ff8fa3',
      ink: '#2a2356',
      text: '#fff6e6'
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
