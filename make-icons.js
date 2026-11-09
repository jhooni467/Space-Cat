// Genera los iconos de la app (carpeta icons/) dibujando el gato real del juego (skins.js) con Playwright.
// Uso:  NODE_PATH=<ruta a playwright> node tools/make-icons.js
// Cuando cambies el diseño del gato (Beta 0.3), vuelve a ejecutarlo para actualizar los iconos.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');

const PAGE = `<!doctype html><meta charset=utf-8><body style="margin:0"><canvas id=c></canvas>
<script src="file://${root}/config.js"></script><script src="file://${root}/skins.js"></script>
<script>
function icon(S, safe) {            // safe: fracción del icono que ocupa el contenido (maskable = más pequeño)
  var cv = document.getElementById('c'); cv.width = cv.height = S;
  var c = cv.getContext('2d'), C = SpaceCat.CONFIG.COLORS, TAU = Math.PI * 2;
  var g = c.createLinearGradient(0, 0, 0, S);
  g.addColorStop(0, '#5c3f9a'); g.addColorStop(0.42, '#c95a95'); g.addColorStop(0.72, '#ff8f6b'); g.addColorStop(1, '#ffd37d');
  c.fillStyle = g; c.fillRect(0, 0, S, S);
  // estrellitas
  c.fillStyle = '#fff6e6';
  [[.14,.16,3],[.82,.12,4],[.62,.2,2.5],[.3,.3,2],[.9,.34,2.5],[.08,.42,2]].forEach(function (s) { c.globalAlpha = .8; c.beginPath(); c.arc(s[0]*S, s[1]*S, s[2]*S/256*1.6, 0, TAU); c.fill(); });
  c.globalAlpha = 1;
  // sol
  var cx = S * .5, cy = S * (.52), R = S * .27 * safe / .8;
  var rg = c.createRadialGradient(cx, cy, R * .5, cx, cy, R * 2.4);
  rg.addColorStop(0, 'rgba(255,226,150,.55)'); rg.addColorStop(1, 'rgba(255,226,150,0)');
  c.fillStyle = rg; c.fillRect(0, 0, S, S);
  c.fillStyle = '#fff6b8'; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill();
  // colina / suelo
  var gy = S * (0.5 + 0.5 * safe * .62);
  c.fillStyle = C.groundBody; c.beginPath(); c.ellipse(S / 2, gy + S * .55, S * .95, S * .6, 0, 0, TAU); c.fill();
  c.save(); c.beginPath(); c.ellipse(S / 2, gy + S * .55, S * .95, S * .6, 0, 0, TAU); c.clip();
  c.fillStyle = C.groundTop; c.fillRect(0, gy - S * .045, S, S * .06); c.restore();
  // el gato (skin real del juego: ~52 px de alto, pies en el origen, mira a la derecha)
  var s = (S * safe * .66) / 52;
  c.save(); c.translate(S * .47, gy + S * .01); c.scale(s, s);
  SpaceCat.Skins.get('default').draw(c, 'idle', 0.4);
  c.restore();
  return cv.toDataURL('image/png');
}
</script>`;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const tmp = path.join(__dirname, '.icons-tmp.html');   // un archivo real (setContent no puede cargar scripts file://)
  fs.writeFileSync(tmp, PAGE);
  await p.goto('file://' + tmp);
  await p.waitForFunction('window.SpaceCat && SpaceCat.Skins');
  const out = {
    'icon-192.png': [192, .8], 'icon-512.png': [512, .8],
    'icon-maskable-512.png': [512, .6],      // contenido dentro de la zona segura (el sistema recorta los bordes)
    'apple-touch-icon.png': [180, .78], 'favicon-32.png': [32, .86]
  };
  fs.mkdirSync(path.join(root, 'icons'), { recursive: true });
  for (const [name, [S, safe]] of Object.entries(out)) {
    const url = await p.evaluate(([S, safe]) => icon(S, safe), [S, safe]);
    fs.writeFileSync(path.join(root, 'icons', name), Buffer.from(url.split(',')[1], 'base64'));
    console.log('icons/' + name);
  }
  await b.close();
  fs.unlinkSync(tmp);
})();
