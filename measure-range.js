// Para cada ancho de hueco: ¿cuántos px de margen hay para despegar y cruzarlo? (simple vs doble salto)
const { loadProject, simulate } = require('./lib');
const SC = loadProject(process.argv[2]);
const C = SC.CONFIG, GY = C.GROUND_Y;

function tryGap(G, takeoffDist, mode) {
  const E = 2000; // el borde del suelo está lejos del límite izquierdo del mundo (x=0)
  const solids = [{ x: 0, y: GY, w: E, h: 200 }, { x: E + G, y: GY, w: 9000, h: 200 }];
  let t1 = null, t2 = null;
  const res = simulate(SC, solids, { x: E - 400, y: GY - C.PLAYER_H }, (t, p, i) => {
    i.right = true;
    if (t1 === null && p.x + p.w >= E - takeoffDist) { i.jumpPressed = true; t1 = t; }
    if (mode === 'double' && t1 !== null && t2 === null && t >= t1 + 0.37) { i.jumpPressed = true; t2 = t; }
    // el botón se mantiene solo durante la subida de cada salto (sin saltos en cadena al aterrizar)
    i.jump = (t1 !== null && t < t1 + 0.40) || (t2 !== null && t < t2 + 0.40);
  }, 3, (t, p) => {
    if (t1 === null) return;
    if (p.onGround && t > t1 + 0.1) return 'stop';       // aterrizó
    if (p.y > GY + 100) return 'stop';                    // cayó al hueco
  });
  const p = res.p;
  return p.onGround && p.x + p.w / 2 > E + G;
}
console.log('hueco | ventana simple (px) | ventana doble (px)');
for (let G = 100; G <= 460; G += 20) {
  const win = mode => { let n = 0; for (let d = -30; d <= 260; d += 2) if (tryGap(G, d, mode)) n += 2; return n; };
  console.log(String(G).padStart(5), '|', String(win('single')).padStart(8), '        |', String(win('double')).padStart(8));
}
