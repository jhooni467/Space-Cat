// Valida un nivel: distancias entre obstáculos, alcance de plataformas (simple vs doble salto) y de estrellas.
// Uso: node tests/validate-level.js [carpeta-del-proyecto]
const { loadProject, simulate } = require('./lib');
const dir = process.argv[2] || '.';
const SC = loadProject(dir);
const C = SC.CONFIG, GY = C.GROUND_Y;
let errors = 0, warns = 0;
const err = m => { errors++; console.log('  ✗ ERROR  ' + m); };
const warn = m => { warns++; console.log('  ! aviso  ' + m); };
const ok = m => console.log('  ✓ ' + m);

SC.LEVELS.forEach((def, li) => {
  console.log('\n=== Nivel ' + li + ': ' + def.name + ' (ancho ' + def.width + ') ===');
  const L = new SC.Level(def);

  /* ---------- 1) distancias entre grupos de obstáculos ---------- */
  const iv = [];
  L.spikes.forEach(s => iv.push({ a: s.x, b: s.x + s.w, kind: 'cristal' }));
  for (let i = 0; i < L.ground.length - 1; i++) iv.push({ a: L.ground[i].x + L.ground[i].w, b: L.ground[i + 1].x, kind: 'hueco', gap: true });
  L.asteroids.forEach(a => {
    const ext = a.axis === 'x' ? a.range + a.r : a.r;
    iv.push({ a: a.x0 - ext, b: a.x0 + ext, kind: 'asteroide' });
  });
  iv.sort((p, q) => p.a - q.a);
  // se fusionan los que se solapan a propósito (combos: asteroide sobre un hueco / cristales)
  const groups = [];
  iv.forEach(i => {
    const g = groups[groups.length - 1];
    if (g && i.a <= g.b + 40) { g.b = Math.max(g.b, i.b); g.kinds.push(i.kind); g.gap = g.gap || i.gap; g.gapEnd = i.gap ? Math.max(g.gapEnd || 0, i.b) : g.gapEnd; }
    else groups.push({ a: i.a, b: i.b, kinds: [i.kind], gap: !!i.gap, gapEnd: i.gap ? i.b : 0 });
  });
  const MIN_GAP = 300;
  let minSep = Infinity;
  console.log('  Grupos de obstáculos (' + groups.length + '):');
  groups.forEach((g, k) => {
    const prev = groups[k - 1];
    const sep = prev ? g.a - prev.b : g.a - def.start.x;
    minSep = Math.min(minSep, sep);
    const tag = sep >= MIN_GAP ? '' : '   <-- demasiado juntos';
    console.log('    ' + String(Math.round(g.a)).padStart(5) + '–' + String(Math.round(g.b)).padEnd(5) + ' ' + g.kinds.join('+').padEnd(22) + ' separación previa: ' + String(Math.round(sep)).padStart(4) + ' px' + tag);
    if (sep < MIN_GAP) err('Obstáculos demasiado juntos en x≈' + Math.round(g.a) + ' (' + Math.round(sep) + ' px < ' + MIN_GAP + ')');
    if (prev && prev.gap && sep < 220) err('Obstáculo a menos de 220 px de un aterrizaje en x≈' + Math.round(g.a));
  });
  const lastG = groups[groups.length - 1];
  if (def.goal.x - lastG.b < 200) err('Último obstáculo demasiado cerca de la meta');
  if (!err.count) ok('separación mínima entre obstáculos: ' + Math.round(minSep) + ' px');

  /* ---------- 2) plataformas: ¿simple o doble salto? ---------- */
  const solids = L.solids.slice();
  const surfaces = L.ground.concat(L.platforms);      // (el mover se prueba aparte)
  const dt = C.STEP;

  function tryTransition(A, B, mode) {
    const dir = (B.x + B.w / 2) >= (A.x + A.w / 2) ? 1 : -1;
    const lo = Math.max(A.x, 0), hi = A.x + A.w - C.PLAYER_W;
    for (let x = lo; x <= hi + 0.5; x += 6) {
      for (const tau of (mode === 'double' ? [0.22, 0.30, 0.37, 0.45] : [null])) {
        const p = new SC.Player();
        p.reset(x, A.y - C.PLAYER_H);
        for (let k = 0; k < 12; k++) p.update(dt, { left: false, right: false, jump: false, jumpPressed: false }, solids, def.width); // asentar en el suelo
        p.vx = dir * C.MOVE_SPEED;
        const inp = { left: dir < 0, right: dir > 0, jump: true, jumpPressed: true };
        let t = 0, pressed2 = false, landed = false, holdUntil = 0.55;
        for (let n = 0; n < 240; n++) {
          t = n * dt;
          inp.jumpPressed = (n === 0);
          if (tau !== null && !pressed2 && t >= tau) { inp.jumpPressed = true; pressed2 = true; holdUntil = tau + 0.55; }
          inp.jump = t < holdUntil;
          p.update(dt, inp, solids, def.width);
          if (n > 5 && p.onGround) { landed = true; break; }
          if (p.y > GY + 150) break;
        }
        if (landed && p.groundObj === B) return true;
      }
    }
    return false;
  }

  function reach(mode) {
    const seen = new Set([L.ground[0]]);
    const queue = [L.ground[0]];
    while (queue.length) {
      const A = queue.shift();
      surfaces.forEach(B => {
        if (seen.has(B)) return;
        // descender por caída cuenta como alcanzable solo en el modelo "doble" para no ocultar fallos
        if (tryTransition(A, B, mode === 'double' ? 'double' : 'single') || (mode === 'double' && tryTransition(A, B, 'single'))) {
          seen.add(B); queue.push(B);
        }
      });
    }
    return seen;
  }

  // Alturas cómodas de cada plataforma sobre el suelo
  const maxSingle = 110, maxDouble = 213;
  const singleSet = reach('single');
  const doubleSet = reach('double');
  console.log('\n  Plataformas (altura sobre el suelo → ¿cómo se alcanza?):');
  L.platforms.forEach(p => {
    const h = GY - p.y;
    const s = singleSet.has(p), d = doubleSet.has(p);
    const how = s ? 'salto simple' : (d ? 'DOBLE salto' : 'INALCANZABLE');
    console.log('    x=' + String(p.x).padStart(5) + ' y=' + p.y + '  altura ' + String(h).padStart(3) + ' px → ' + how);
    if (!d) err('Plataforma inalcanzable en x=' + p.x);
    if (h > 190) warn('Plataforma muy alta (' + h + ' px) en x=' + p.x + ': el doble salto cómodo llega a ~190');
  });
  // Las plataformas "altas" (≥140 px) NO deben alcanzarse con salto simple (ni por escaleras)
  L.platforms.forEach(p => {
    const h = GY - p.y;
    if (h >= 140 && singleSet.has(p)) err('Plataforma alta (' + h + ' px) alcanzable SIN doble salto en x=' + p.x);
  });
  // tramos de suelo: todos alcanzables (con doble salto permitido; los huecos con mover se revisan aparte)
  L.ground.forEach((g, i) => {
    if (!doubleSet.has(g)) {
      warn('Tramo de suelo ' + i + ' [' + g.x + '–' + (g.x + g.w) + '] no se alcanza saltando desde el anterior (¿hueco con mover?)');
    }
  });

  // Huecos anchos: deben exigir doble salto (o un mover). Con salto simple no debe existir ningún despegue válido.
  for (let i = 0; i < L.ground.length - 1; i++) {
    const A = L.ground[i], B = L.ground[i + 1], w = B.x - (A.x + A.w);
    if (w >= 250 && w <= 300 && L.movers.every(m => m.baseX + m.w < A.x + A.w || m.baseX > B.x)) {
      if (tryTransition(A, B, 'single')) err('El hueco de ' + w + ' px en x=' + (A.x + A.w) + ' se cruza con salto simple (debería exigir doble)');
      else if (!tryTransition(A, B, 'double')) err('El hueco de ' + w + ' px en x=' + (A.x + A.w) + ' no se cruza ni con doble salto');
      else ok('hueco de ' + w + ' px en x=' + (A.x + A.w) + ': exige doble salto y es posible');
    }
  }

  /* ---------- 3) estrellas: altura necesaria ---------- */
  let nWalk = 0, nSingle = 0, nDouble = 0, nBad = 0;
  L.stars.forEach(s => {
    // superficie más alta bajo la estrella (ancho del gato incluido)
    let top = GY;
    surfaces.forEach(f => { if (s.x > f.x - 14 && s.x < f.x + f.w + 14 && f.y >= s.y - 10) top = Math.min(top, f.y); });
    const needed = top - (s.y + 46);             // altura que hay que ganar con los pies
    // la estrella no puede estar dentro de un sólido
    surfaces.forEach(f => { if (s.x > f.x && s.x < f.x + f.w && s.y > f.y - 12 && s.y < f.y + (f.h || 18) + 12) err('Estrella dentro de una plataforma en (' + s.x + ',' + s.y + ')'); });
    if (needed <= 0) nWalk++;
    else if (needed <= 98) nSingle++;
    else if (needed <= 190) nDouble++;
    else { nBad++; err('Estrella inalcanzable en (' + s.x + ',' + s.y + '), exige subir ' + Math.round(needed) + ' px'); }
  });
  console.log('\n  Estrellas: ' + L.stars.length + ' → caminando: ' + nWalk + ' · salto simple: ' + nSingle + ' · doble salto: ' + nDouble + ' · inalcanzables: ' + nBad);

  /* ---------- 4) comprobaciones sueltas ---------- */
  L.checkpoints.forEach(c => {
    const g = L.ground.find(g => c.x - 16 > g.x && c.x + 16 < g.x + g.w);
    if (!g) err('Farol en x=' + c.x + ' no está sobre suelo firme');
    else if (c.x - g.x < 80) warn('Farol en x=' + c.x + ' muy pegado al borde del suelo (' + Math.round(c.x - g.x) + ' px)');
    L.spikes.forEach(s => { if (Math.abs(s.x + s.w / 2 - c.x) < 150) err('Farol en x=' + c.x + ' demasiado cerca de unos cristales'); });
  });
  ok('faroles revisados: ' + L.checkpoints.length);
  console.log('\n  Resumen: ' + L.spikes.length + ' cristales · ' + L.asteroids.length + ' asteroides · ' + (L.ground.length - 1) + ' huecos · ' + L.movers.length + ' mover · ' + L.platforms.length + ' plataformas · ' + L.stars.length + ' estrellas');
});
console.log('\n' + (errors ? '✗ ' + errors + ' error(es)' : '✓ sin errores') + (warns ? ', ' + warns + ' aviso(s)' : ''));
process.exit(errors ? 1 : 0);
