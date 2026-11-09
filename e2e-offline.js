// Fase "prime": abre el juego con conexión y deja que el Service Worker lo guarde.
// Fase "offline": (con el servidor APAGADO) vuelve a abrirlo con el mismo perfil y comprueba que arranca y se juega.
const { chromium } = require('playwright');
const PROFILE = '/tmp/pw-spacecat-profile';
const BASE = process.env.BASE || 'http://127.0.0.1:8080/index.html';
const phase = process.argv[2];
(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, { viewport: { width: 1280, height: 720 } });
  const p = ctx.pages()[0] || await ctx.newPage();
  const errs = [], failed = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('requestfailed', r => failed.push(r.url().replace(/^https?:\/\/[^/]+/, '')));
  if (phase === 'prime') {
    await p.goto(BASE);
    const info = await p.evaluate(async () => {
      const reg = await navigator.serviceWorker.ready;
      await new Promise(r => setTimeout(r, 1500));
      const names = await caches.keys();
      const cache = await caches.open(names[0]);
      const keys = (await cache.keys()).map(r => new URL(r.url).pathname);
      return { scope: reg.scope, active: !!reg.active, caches: names, nArchivos: keys.length, archivos: keys };
    });
    console.log('Service Worker activo:', info.active, '· alcance:', info.scope);
    console.log('Cachés:', info.caches.join(', '), '· archivos guardados:', info.nArchivos);
    const need = ['/index.html', '/style.css', '/manifest.webmanifest', '/render.js', '/levels.js', '/icons/icon-512.png'];
    console.log('Archivos clave guardados:', need.every(n => info.archivos.includes(n)) ? 'sí' : 'FALTAN ' + need.filter(n => !info.archivos.includes(n)));
    // manifest e iconos accesibles
    const mf = await p.evaluate(async () => { const m = await (await fetch('manifest.webmanifest')).json(); const res = []; for (const i of m.icons) { const r = await fetch(i.src); res.push(i.src + ' ' + r.status); } return { name: m.name, short: m.short_name, display: m.display, override: m.display_override, orient: m.orientation, start: m.start_url, icons: res }; });
    console.log('Manifest:', JSON.stringify(mf));
  } else {
    await p.goto(BASE + '?debug');             // con parámetros, también debe salir de la caché
    await p.waitForTimeout(1500);
    const boot = await p.evaluate(() => ({ juego: !!(window.SpaceCat && SpaceCat.game), estado: SpaceCat.game && SpaceCat.game.state, version: SpaceCat.CONFIG.VERSION }));
    console.log('SIN SERVIDOR → arranque:', JSON.stringify(boot));
    await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    await p.keyboard.down('ArrowRight'); await p.keyboard.down('Space'); await p.waitForTimeout(1800); await p.keyboard.up('Space'); await p.keyboard.up('ArrowRight');
    const play = await p.evaluate(() => ({ estado: SpaceCat.game.state, x: Math.round(SpaceCat.game.player.x), estrellas: SpaceCat.game.collected, fps: SpaceCat.Perf.fps }));
    console.log('SIN SERVIDOR → jugando:', JSON.stringify(play));
    // el lienzo tiene que tener contenido (no estar vacío)
    const px = await p.evaluate(() => { const c = document.getElementById('game'); const d = c.getContext('2d').getImageData(c.width / 2, c.height / 2, 1, 1).data; return Array.from(d); });
    console.log('Píxel central del lienzo:', JSON.stringify(px));
    await p.screenshot({ path: 'shots/offline.png' });
    const real = failed.filter(u => !/assets\/images\//.test(u));
    console.log('Peticiones fallidas (sin contar las imágenes opcionales):', JSON.stringify(real));
  }
  console.log('Errores de página:', JSON.stringify(errs));
  await ctx.close();
})();
