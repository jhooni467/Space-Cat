/* SpaceCat — carga de imágenes opcionales.
 *
 * El juego ya se dibuja solo (sin imágenes). Si colocas un archivo con uno de estos
 * nombres dentro de assets/images/, el juego lo usa en lugar del dibujo por defecto.
 * Si el archivo no existe, no pasa nada: se usa el dibujo por defecto. */
(function (global) {
  'use strict';
  var SC = global.SpaceCat = global.SpaceCat || {};

  var MANIFEST = {
    cat: 'assets/images/cat.png',             // el gato (mirando a la derecha)
    star: 'assets/images/star.png',           // estrella coleccionable
    asteroid: 'assets/images/asteroid.png',   // obstáculo que flota
    goal: 'assets/images/goal.png',           // portal / meta del punto B
    background: 'assets/images/background.png' // fondo del cielo
  };

  var images = {};

  SC.Assets = {
    manifest: MANIFEST,

    load: function (done) {
      var names = Object.keys(MANIFEST);
      var left = names.length;
      var finished = false;
      function finish() {
        if (finished) return;
        finished = true;
        done();
      }
      function one() { left -= 1; if (left <= 0) finish(); }

      names.forEach(function (name) {
        var img = new global.Image();
        img.onload = function () { images[name] = img; one(); };
        img.onerror = one;
        img.src = MANIFEST[name];
      });
      // Por si algún archivo tarda demasiado, el juego arranca igual.
      global.setTimeout(finish, 2500);
    },

    get: function (name) {
      return images[name] || null;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
