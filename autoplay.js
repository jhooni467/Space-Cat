// Jugador automático: recorre el nivel completo en el simulador usando la física real del juego.
// Planifica probando "esperar → correr → saltar (¿doble?)" y escoge el primer plan que no pega con nada.
// Si en algún punto no existe plan, el nivel tiene un tramo imposible. Uso: node tests/autoplay.js [proyecto]
const { loadProject } = require('./lib');
const dir = process.argv[2] || '.';
const SC = loadProject(dir);
const C = SC.CONFIG, GY = C.GROUND_Y, dt = C.STEP;
const def = SC.LEVELS[0];
const L = new SC.Level(def);
const p = new SC.Player();
L.resetState();
p.reset(L.start.x, L.start.y);
for (let i = 0; i < 20; i++) p.update(dt, {}, L.nearSolids(p.x), L.width);

const stats = { time: 0, stars: 0, doubles: 0, jumps: 0, hits: 0, waited: 0 };
const IDLE = { left: false, right: false, jump: false, jumpPressed: false };

function snap() { return { p: Object.assign({}, p), time: L.time }; }
function restore(s) {
  Object.assign(p, s.p); L.time = s.time;
  L.movers.forEach(m => L.placeMover(m));
  L.asteroids.forEach(a => L.placeAsteroid(a, 0));
}
// un paso de simulación idéntico al del juego. Devuelve 'hit' | 'fall' | null
function step(inp) {
  L.update(dt, p);
  p.update(dt, inp, L.nearSolids(p.x), L.width);
  if (p.invuln <= 0 && L.hitHazard(p)) return 'hit';
  if (p.y > C.WORLD_H + 60) return 'fall';
  return null;
}

// Ejecuta un plan; si commit=false se usa solo para probar (luego se restaura el estado)
function runPlan(plan, commit) {
  const s0 = snap();
  let t = 0, res = { ok: false };
  const total = plan.wait + plan.d1 + 2.4;
  let t1 = null, t2 = null, jumpedOnce = false, dbl = false;
  const inp = { left: false, right: false, jump: false, jumpPressed: false };
  for (let n = 0; n * dt < total; n++) {
    t = n * dt;
    inp.jumpPressed = false;
    inp.right = t >= plan.wait;                       // espera quieto y luego corre
    if (t1 === null && t >= plan.wait + plan.d1) { if (plan.jump) { inp.jumpPressed = true; t1 = t; } }
    if (plan.second !== null && t1 !== null && t2 === null && t >= t1 + plan.second) { inp.jumpPressed = true; t2 = t; }
    inp.jump = (t1 !== null && t < t1 + 0.42) || (t2 !== null && t < t2 + 0.42);
    const e = step(inp);
    if (inp.jumpPressed) { if (t1 === t) jumpedOnce = true; }
    if (p.justDoubleJumped) dbl = true;
    if (commit) {
      const got = L.collectStars(p); stats.stars += got.length;
      if (p.justJumped) stats.jumps++;
      if (p.justDoubleJumped) stats.doubles++;
      stats.time += dt;
    }
    if (e) { res = { ok: false, why: e }; break; }
    // sin salto: solo comprobamos seguir con vida; con salto: éxito al aterrizar
    if (plan.jump && t1 !== null && t > t1 + 0.12 && p.onGround) { res = { ok: true, landed: p.groundObj }; break; }
    if (!plan.jump && n * dt >= plan.wait + plan.d1 + plan.walk) { res = { ok: true }; break; }
    if (L.reachedGoal(p)) { res = { ok: true, goal: true }; break; }
  }
  if (!commit) restore(s0);
  return res;
}

function walkSafe(secs) { return runPlan({ wait: 0, d1: 0, jump: false, second: null, walk: secs }, false).ok; }

const SECONDS = [null, 0.22, 0.30, 0.37, 0.45];
function findPlan() {
  for (let w = 0; w <= 7; w += 0.25) {
    for (const sec of SECONDS) {
      for (let d1 = 0; d1 <= 1.2; d1 += 0.05) {
        const plan = { wait: w, d1, jump: true, second: sec, walk: 0 };
        const r = runPlan(plan, false);
        if (r.ok) return plan;
      }
    }
  }
  return null;
}

let guard = 0;
const log = [];
while (!L.reachedGoal(p) && stats.time < 240) {
  if (++guard > 5000) { console.log('✗ el bot se atascó'); process.exit(1); }
  if (walkSafe(1.0)) {
    // avanzar un trocito caminando (0.25 s)
    const r = runPlan({ wait: 0, d1: 0, jump: false, second: null, walk: 0.25 }, true);
    if (!r.ok) { console.log('✗ choque caminando en x=' + p.x.toFixed(0), r.why); process.exit(1); }
    if (r.goal) break;
    continue;
  }
  const x0 = p.x;
  const plan = findPlan();
  if (!plan) { console.log('✗ SIN PLAN POSIBLE en x=' + x0.toFixed(0) + ' y=' + p.y.toFixed(0) + ' (t=' + stats.time.toFixed(1) + ' s)'); process.exit(1); }
  const r = runPlan(plan, true);
  stats.waited += plan.wait;
  log.push({ x: Math.round(x0), wait: plan.wait, d1: plan.d1, sec: plan.second, dbl: stats.doubles > (log.dblSeen || 0) && ((log.dblSeen = stats.doubles) > 0), land: r.landed && (r.landed.kind + (r.landed.x !== undefined ? '@' + Math.round(r.landed.x) : '')), landX: Math.round(p.x), landY: Math.round(p.y + p.h) });
  if (!r.ok) { console.log('✗ el plan falló en x=' + p.x.toFixed(0)); process.exit(1); }
}
console.log('Recorrido de ' + def.name + ':');
log.forEach(l => console.log('  salto en x=' + String(l.x).padStart(5) + (l.dbl ? '  DOBLE ' : '  simple ') + '(espera ' + l.wait.toFixed(2) + ' s, corre ' + l.d1.toFixed(2) + ' s antes de saltar) → aterriza en ' + l.land + ' (x=' + l.landX + ', pies y=' + l.landY + ')'));
const ok = L.reachedGoal(p);
console.log((ok ? '✓ META ALCANZADA' : '✗ no llegó') + ' en ' + stats.time.toFixed(1) + ' s simulados · estrellas ' + stats.stars + '/' + L.stars.length + ' · saltos ' + stats.jumps + ' (dobles ' + stats.doubles + ') · golpes ' + stats.hits + ' · tiempo de espera ' + stats.waited.toFixed(1) + ' s');
process.exit(ok ? 0 : 1);
