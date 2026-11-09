/* SpaceCat — la VISTA: qué porción del mundo se ve y cómo llena la pantalla.
 *
 * Beta 0.2: el lienzo ocupa TODA la pantalla (sin barras negras) y no se estira nada.
 * El mundo siempre mide WORLD_H de alto. Lo que se ve es VIEW_W de ancho (más que antes: 960):
 *  - pantalla ancha (teléfonos, 16:9): se ve más escenario a los lados.
 *  - pantalla más cuadrada (tablet 4:3): se ve algo menos de ancho (para no llenar todo de cielo) y más cielo arriba.
 *    El suelo queda un poco por encima del borde inferior, para que los botones táctiles no tapen al gato.
 * Todo se dibuja con la misma escala en X e Y, así el gato y las plataformas conservan sus proporciones. */
(function (global) {
  'use strict';
  var SC = global.SpaceCat = global.SpaceCat || {};
  var C = SC.CONFIG;

  var View = SC.View = {
    w: C.VIEW_W,          // ancho lógico visible
    h: C.WORLD_H,         // alto lógico visible (>= WORLD_H)
    oy: 0,                // desplazamiento vertical del mundo
    lift: 0,              // franja de suelo extra bajo el mundo (queda debajo de los botones táctiles)
    zoom: 1,              // píxeles CSS por unidad lógica
    cssW: 0, cssH: 0,     // tamaño del lienzo en píxeles CSS
    pxW: 0, pxH: 0,       // tamaño real del lienzo en píxeles
    k: 1,                 // píxeles reales por unidad lógica
    sl: 0, sr: 0, st: 0, sb: 0,   // zonas seguras (notch, barras) en unidades lógicas
    pauseReserve: 76      // espacio que ocupa el botón de pausa arriba a la derecha (lógico)
  };

  // cssW/cssH: tamaño de la pantalla; resScale: 1 = nítido, <1 = menos píxeles (más rápido).
  // safe: {l,r,t,b} en píxeles CSS (opcional).
  View.update = function (cssW, cssH, resScale, safe) {
    var aspect = Math.max(1.2, cssW / Math.max(1, cssH));
    var h = Math.min(C.MAX_VIEW_H, Math.max(C.WORLD_H, C.VIEW_W / aspect));
    var w = h * aspect;
    View.w = w; View.h = h;
    View.lift = Math.min(h - C.WORLD_H, C.BOTTOM_RESERVE);   // sobra altura: el suelo sube un poco
    View.oy = h - C.WORLD_H - View.lift;
    View.zoom = cssH / h;
    View.cssW = cssW; View.cssH = cssH;

    // Resolución real del lienzo: se limita para no ahogar a tablets antiguas con pantallas de muchos píxeles.
    var dpr = Math.min(global.devicePixelRatio || 1, 2) * (resScale || 1);
    var px = cssW * dpr, py = cssH * dpr;
    if (px * py > C.MAX_PIXELS) dpr *= Math.sqrt(C.MAX_PIXELS / (px * py));
    View.pxW = Math.max(1, Math.round(cssW * dpr));
    View.pxH = Math.max(1, Math.round(cssH * dpr));
    View.k = View.pxW / w;

    safe = safe || {};
    View.sl = (safe.l || 0) / View.zoom;
    View.sr = (safe.r || 0) / View.zoom;
    View.st = (safe.t || 0) / View.zoom;
    View.sb = (safe.b || 0) / View.zoom;
    var pb = Math.min(64, Math.max(40, 0.09 * Math.min(cssW, cssH)));   // mismo cálculo que el CSS de #pauseBtn
    View.pauseReserve = (pb + 24) / View.zoom + View.sr;
    return View;
  };
})(typeof window !== 'undefined' ? window : globalThis);
