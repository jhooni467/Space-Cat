const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:8080/index.html';
(async () => {
  const b = await chromium.launch();
  const sizes = [[1280,720,'desk',false],[1024,768,'tablet43',true],[1280,800,'tablet1610',true],[844,390,'phone',true],[923,415,'phone2',true]];
  for (const [w,h,name,touch] of sizes) {
    const ctx = await b.newContext({ viewport:{width:w,height:h}, hasTouch: touch, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    const errs = [];
    p.on('console', m => { if (m.type()==='error' && !/404/.test(m.text())) errs.push(m.text()); });
    p.on('pageerror', e => errs.push('PAGEERROR '+e.message));
    await p.goto(BASE);
    await p.waitForTimeout(1500);
    await p.screenshot({ path: `shots/new_title_${name}.png` });
    await p.keyboard.press('Enter');
    await p.waitForTimeout(500);
    const info = await p.evaluate(() => { const c=document.getElementById('game'); const V=SpaceCat.View; return {cw:c.width,ch:c.height,css:c.style.width+'x'+c.style.height, view:V.w.toFixed(0)+'x'+V.h.toFixed(0), oy:V.oy.toFixed(0), k:V.k.toFixed(3), state:SpaceCat.game.state}; });
    await p.screenshot({ path: `shots/new_${name}.png` });
    console.log(name, JSON.stringify(info), 'errores:', JSON.stringify(errs));
    await ctx.close();
  }
  await b.close();
})();
