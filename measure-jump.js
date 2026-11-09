// Mide alturas y alcances del salto simple y del doble salto.
const { loadProject, flatWorld, simulate } = require('./lib');
const dir = process.argv[2];
const SC = loadProject(dir);
const C = SC.CONFIG, GY = C.GROUND_Y;
const solids = flatWorld(SC);
const start = { x: 0, y: GY - C.PLAYER_H };
const feet = p => p.y + p.h;

function rise(script, T) {
  let min = Infinity;
  simulate(SC, solids, start, script, T, (t, p) => { min = Math.min(min, feet(p)); });
  return +(GY - min).toFixed(1);
}

// 1) salto simple: botón mantenido todo el ascenso
const hold = (t, p, i) => { if (t === 0) i.jumpPressed = true; i.jump = true; };
// 2) toque rápido: se pulsa un instante (el "latch" del input cuenta como mantenido JUMP_LATCH s)
const tap = (t, p, i) => { if (t === 0) i.jumpPressed = true; i.jump = t < C.JUMP_LATCH; };
console.log('Salto simple mantenido  :', rise(hold, 1.5), 'px');
console.log('Salto simple (toque)    :', rise(tap, 1.5), 'px');

// 3) doble salto pulsado en distintos instantes tras el primero (siempre mantenido)
function dbl(tau, holdAll) {
  return (t, p, i) => {
    if (t === 0) i.jumpPressed = true;
    i.jump = true;
    if (Math.abs(t - tau) < C.STEP / 2) i.jumpPressed = true;
  };
}
const rows = [];
for (const tau of [0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50, 0.60]) {
  rows.push(tau.toFixed(2) + 's→' + rise(dbl(tau), 2.5));
}
console.log('Doble salto (2º pulsado a los τ s):', rows.join('  '));
let best = 0, bestTau = 0;
for (let tau = 0.1; tau <= 0.7; tau += 0.01) { const r = rise(dbl(tau), 2.5); if (r > best) { best = r; bestTau = tau; } }
console.log('Doble salto MÁXIMO      :', best, 'px (τ=' + bestTau.toFixed(2) + ')');
let ok = 0, tot = 0; const thr = best - 15;
for (let tau = 0.05; tau <= 0.9; tau += 0.01) { tot++; if (rise(dbl(tau), 2.5) >= thr) ok++; }
console.log('Ventana con ≥ (máx−15px):', (ok * 10), 'ms');
console.log('Altura del gato:', C.PLAYER_H, 'px');
