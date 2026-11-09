// Prueba del salto en el navegador real: mide la altura con teclado de verdad.
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:8080/index.html';
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE); await p.waitForTimeout(1200);
  await p.keyboard.press('Enter'); await p.waitForTimeout(300);

  // Registrador: en cada fotograma guarda (t, altura de los pies, en suelo?, saltos dobles)
  await p.evaluate(() => {
    window.__rec = []; window.__t0 = performance.now(); window.__dbl = 0; window.__jumps = 0;
    (function loop() {
      const g = SpaceCat.game, pl = g.player;
      window.__rec.push([performance.now() - window.__t0, 450 - (pl.y + pl.h), pl.onGround ? 1 : 0, pl.airJumps]);
      requestAnimationFrame(loop);
    })();
  });
  const stats = async () => p.evaluate(() => { const r = window.__rec; window.__rec = []; return { max: Math.max(...r.map(x => x[1])), grounded: r[r.length - 1][2], airJumps: r[r.length - 1][3] }; });
  const settle = async () => { await p.keyboard.up('Space'); await p.waitForTimeout(900); await stats(); };

  // Colocar al gato en un tramo llano y libre (x=600) sin tocar nada más
  await p.evaluate(() => { const g = SpaceCat.game; g.player.reset(600, 410); g.cam = 0; });
  await settle();

  // 1) salto simple (botón mantenido)
  await p.keyboard.down('Space'); await p.waitForTimeout(450); await p.keyboard.up('Space'); await p.waitForTimeout(800);
  const s1 = await stats();
  // 2) toque rápido
  await p.keyboard.down('Space'); await p.waitForTimeout(40); await p.keyboard.up('Space'); await p.waitForTimeout(800);
  const s2 = await stats();
  // 3) doble salto: pulsar, y de nuevo cerca del punto más alto (~0.35 s), manteniendo
  await p.keyboard.down('Space'); await p.waitForTimeout(330); await p.keyboard.up('Space'); await p.keyboard.down('Space'); await p.waitForTimeout(420); await p.keyboard.up('Space'); await p.waitForTimeout(1000);
  const s3 = await stats();
  // 4) tres pulsaciones seguidas en el aire: solo cuentan dos saltos
  await p.evaluate(() => { SpaceCat.game.player.reset(600, 410); });
  await settle();
  await p.keyboard.down('Space'); await p.waitForTimeout(250); await p.keyboard.up('Space');
  await p.keyboard.down('Space'); await p.waitForTimeout(100); await p.keyboard.up('Space');
  await p.keyboard.down('Space'); await p.waitForTimeout(100); await p.keyboard.up('Space'); await p.waitForTimeout(1000);
  const s4 = await stats();
  // 5) reinicio al aterrizar: otro doble salto completo inmediatamente después de caer
  await p.keyboard.down('Space'); await p.waitForTimeout(330); await p.keyboard.up('Space'); await p.keyboard.down('Space'); await p.waitForTimeout(420); await p.keyboard.up('Space'); await p.waitForTimeout(1000);
  const s5 = await stats();
  // 6) latencia al aterrizar: con el botón mantenido, ¿cuántos ms pasan en el suelo antes del siguiente salto?
  await p.evaluate(() => { SpaceCat.game.player.reset(600, 410); });
  await settle();
  await p.keyboard.down('Space'); await p.waitForTimeout(2200); await p.keyboard.up('Space');
  const rec = await p.evaluate(() => window.__rec);
  let groundMs = [], start = null;
  rec.forEach(([t, h, g]) => { if (g && start === null) start = t; if (!g && start !== null) { groundMs.push(t - start); start = null; } });

  console.log('Salto simple (mantenido): ', s1.max.toFixed(0), 'px  (objetivo ≈110)');
  console.log('Salto simple (toque 40ms):', s2.max.toFixed(0), 'px  (objetivo ≈60-70)');
  console.log('Doble salto               :', s3.max.toFixed(0), 'px  (objetivo ≈200-213)');
  console.log('Tres pulsaciones en aire  :', s4.max.toFixed(0), 'px  (debe ser ≈ un doble salto, no un triple)');
  console.log('Doble salto tras aterrizar:', s5.max.toFixed(0), 'px  (el doble salto se reinicia al tocar suelo)');
  console.log('Tiempo en suelo entre saltos con botón mantenido (ms):', groundMs.map(x => x.toFixed(0)).join(', '));
  console.log('Errores de página:', JSON.stringify(errs));
  await b.close();
})();
