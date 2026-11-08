/* SpaceCat — configuración general.
 * Aquí se ajusta la "sensación" del juego (física, vidas) y la paleta de colores.
 * Todos los demás archivos leen estos valores, así que casi todo se cambia desde aquí. */
(function (global) {
  'use strict';
  var SC = global.SpaceCat = global.SpaceCat || {};

  SC.CONFIG = {
    // Tamaño lógico del juego (formato horizontal 16:9). Se escala solo a la pantalla.
    WIDTH: 960,
    HEIGHT: 540,
    GROUND_Y: 450,          // altura (y) de la superficie del suelo
    SPIKE_H: 34,            // altura de los cristales peligrosos

    // Física (sensación "luna": saltos altos y suaves)
    GRAVITY: 1450,
    MAX_FALL: 860,
    MOVE_SPEED: 270,
    ACCEL_GROUND: 2600,
    ACCEL_AIR: 1500,
    FRICTION_GROUND: 3000,
    FRICTION_AIR: 600,
    JUMP_SPEED: 640,
    JUMP_CUT: 2.2,          // al soltar el salto antes, se corta la altura
    COYOTE_TIME: 0.10,      // margen para saltar justo después de salir del borde
    JUMP_BUFFER: 0.12,      // margen para pulsar salto un poco antes de aterrizar

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
      groundTop: '#8fe0c0',
      groundBody: '#4c4286',
      groundDeep: '#38306b',
      platTop: '#c3b3ff',
      platBody: '#8e7cd8',
      moverTop: '#9fe8d0',
      moverBody: '#55b8a0',
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
