// Utilidades de prueba: carga los módulos del juego en un sandbox de Node (sin navegador).
const fs = require('fs'), path = require('path'), vm = require('vm');

function loadProject(dir, files) {
  const sandbox = { console, Math, Date, performance: { now: () => 0 } };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  (files || ['config.js', 'levels.js', 'level.js', 'player.js']).forEach(f => {
    vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), sandbox, { filename: f });
  });
  return sandbox.SpaceCat;
}

// Entrada simulada (mismo contrato que SC.Input).
function makeInput() { return { left: false, right: false, jump: false, jumpPressed: false }; }

// Suelo plano infinito a GROUND_Y.
function flatWorld(SC) {
  const C = SC.CONFIG;
  return [{ x: -5000, y: C.GROUND_Y, w: 20000, h: 200, kind: 'ground' }];
}

// Mide alturas del salto. script(t, p, inp) decide la entrada en cada paso.
function simulate(SC, solids, start, script, maxT, hook) {
  const C = SC.CONFIG, dt = C.STEP;
  const p = new SC.Player();
  p.reset(start.x, start.y);
  const inp = makeInput();
  const trace = [];
  let t = 0;
  // asentar en el suelo
  for (let i = 0; i < 20; i++) p.update(dt, inp, solids, 1e6);
  p.justLanded = false;
  t = 0;
  for (let n = 0; n * dt < maxT; n++) {
    t = n * dt;
    inp.jumpPressed = false;
    script(t, p, inp);
    p.update(dt, inp, solids, 1e6);
    trace.push({ t, x: p.x, y: p.y, vy: p.vy, onGround: p.onGround, dbl: p.justDoubleJumped, jumped: p.justJumped, landed: p.justLanded });
    if (hook && hook(t, p) === 'stop') break;
  }
  return { p, trace };
}

module.exports = { loadProject, makeInput, flatWorld, simulate };
