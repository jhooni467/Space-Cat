// Mide cuánto cuesta dibujar un fotograma (ms) en distintos puntos del nivel. Menos = mejor.
const { chromium } = require('playwright');
const targets = [['ORIGINAL', 'http://127.0.0.1:8081/index.html'], ['NUEVO   ', 'http://127.0.0.1:8080/index.html']];
const configs = [[1024, 768, 1], [1024, 768, 2], [1280, 720, 1]];
(async () => {
  const b = await chromium.launch();
  for (const [w, h, dpr] of configs) {
    console.log(`\n=== Pantalla ${w}x${h} con densidad ${dpr}x ===`);
    for (const [name, url] of targets) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: true });
      const p = await ctx.newPage();
      await p.goto(url + (name.startsWith('NUEVO') ? '?q=0' : '')); await p.waitForTimeout(1500);
      await p.keyboard.press('Enter'); await p.waitForTimeout(300);
      const res = await p.evaluate(() => {
        const SC = SpaceCat, g = SC.game, ctx = g.ctx, V = SC.View;
        const viewW = V ? V.w : SC.CONFIG.WIDTH;
        const maxCam = g.level.width - viewW;
        const out = [];
        for (const f of [0, 0.25, 0.5, 0.75]) {
          g.cam = maxCam * f; g.player.x = g.cam + viewW * 0.4; g.player.y = 410; g.state = 'playing';
          for (let i = 0; i < 20; i++) { SC.Render.draw(ctx, g); ctx.getImageData(0, 0, 1, 1); }        // calentar
          const N = 150, t0 = performance.now();
          for (let i = 0; i < N; i++) { g.t += 1 / 60; SC.Render.draw(ctx, g); ctx.getImageData(0, 0, 1, 1); }   // 1 píxel leído por fotograma: obliga a rasterizar TODO el fotograma
          out.push((performance.now() - t0) / N);
        }
        // coste de la física + lógica
        g.cam = 0; g.player.reset(600, 410); g.state = 'playing'; SC.Input.right = true; SC.Input.jump = false;
        const t1 = performance.now();
        for (let i = 0; i < 2000; i++) { g.update(1 / 60); if (g.player.x > 4000) g.player.reset(600, 410); }
        const upd = (performance.now() - t1) / 2000;
        return { out, upd, px: SC.game.canvas.width + 'x' + SC.game.canvas.height };
      });
      const avg = res.out.reduce((a, c) => a + c, 0) / res.out.length;
      console.log(`${name} lienzo ${res.px.padEnd(10)} dibujo por fotograma: ${res.out.map(x => x.toFixed(2)).join(' / ')} ms  → media ${avg.toFixed(2)} ms (${(1000 / avg).toFixed(0)} fps teóricos) · lógica+física ${res.upd.toFixed(3)} ms`);
      await ctx.close();
    }
  }
  await b.close();
})();
