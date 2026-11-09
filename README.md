# Space Cat 😼 — Beta 0.2

Juego de plataformas 2D (HTML5 canvas). Sin dependencias ni instalación: abre `index.html` desde un servidor web (GitHub Pages sirve).

## Qué trae la Beta 0.2
- **Sin conexión + PWA**: `sw.js` guarda el juego; `manifest.webmanifest` + `icons/` permiten instalarlo (Space Cat, standalone/pantalla completa, horizontal).
- **Rendimiento**: dibujo con cachés, descarte de lo que no se ve, colisiones solo con lo cercano, calidad automática (`perf.js`).
- **Vista**: pantalla completa sin barras negras y área visible más ancha (`view.js`, valores en `config.js`).
- **Salto**: simple ≈110 px; el segundo salto suma 1,5 veces el primero (doble ≈276 px). Se ajusta con `JUMP_SPEED` / `JUMP2_SPEED` en `config.js`.
- **Botones táctiles** más grandes (CSS `.btn`) y **aspecto 3D** (volumen, sombras, primer plano con parallax) dibujado con sprites en caché. Nivel rediseñado con más espacio entre obstáculos y zonas que exigen doble salto.

## ⚠ Al cambiar archivos
Sube `VERSION` en `sw.js` (si no, los dispositivos seguirán con la versión guardada). Si agregas un `.js`, añádelo a `CORE` en `sw.js` y a `index.html`.

## Probar rápido en el dispositivo
- `index.html?debug` muestra FPS, calidad y resolución. `?q=0|1|2` fuerza la calidad. Tecla **Q** cambia calidad, **F** pantalla completa.

## Pruebas (Node; las de navegador necesitan Playwright)
`node tests/validate-level.js .` · `node tests/autoplay.js .` · `node tests/measure-jump.js .` · `node tests/measure-range.js .`
Navegador (con el juego servido): `tests/smoke.js`, `e2e-jump.js`, `e2e-offline.js`, `bench-render.js`.
Iconos: `node tools/make-icons.js` (regenerar cuando cambie el diseño del gato).
