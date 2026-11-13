/* tools/lead.mjs — the reader-led spine, flown in Node.
 *
 *     node tools/lead.mjs
 *
 * WHAT THIS REPLACES. regress.mjs's headline is "on-pace play never
 * touches a surface", which is a promise about a reader conforming to
 * OUR rate. Under design doc §1.7 there is no such reader, so a chapter
 * built on it cannot be checked by flying one perfect session. The
 * checks here are of the other kind: PROPERTIES THAT HOLD OVER A FAMILY
 * of reader behaviours, including the ones nobody would choose.
 *
 * THE ORDER IS THE PROJECT'S OWN RULE: prove the instrument, then trust
 * it. Every section has a control with a known answer and at least one
 * case that is REQUIRED TO FAIL, so a check that cannot fail is caught
 * here rather than believed.
 */
import { leader, superstructure, hasteOf, phaseGap,
         CALM_PERIOD, PANIC_PERIOD } from '../app/js/lead.js';
import { swim, inhaleAt, headY, floorY, bedY, bedAt, pearlStep, newPearl, siteAt,
         depthFrac, camYFor, SITES, PICK_SECS, PICK_REACH, V_MAX, Y_FLOAT,
         X_MIN, X_MAX, SURFACE_Y, HEAD_REACH, CAM_BACK, BED_CLEAR }
  from '../app/js/free-dive-breath.js';
import { rampLoopRef, rampOneRiser } from '../app/js/palette.js';

let fails = 0;
const ok = (name, cond, detail = '') => {
  console.log((cond ? '  ok    ' : '  FAIL  ') + name + (detail ? '  — ' + detail : ''));
  if(!cond) fails++;
};
const DT = 1 / 60;

/* a deterministic generator, so a failure reproduces */
function lcg(seed){ let x = seed >>> 0; return () => { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x / 4294967296; }; }

/* ---------- traces ---------- */
const sine = T => t => 0.5 - 0.4 * Math.cos(2 * Math.PI * t / T);
/* a box: rise, hold, fall, hold, each a quarter */
const box = T => t => {
  const u = (t % T) / T, q = x => x * x * (3 - 2 * x);
  if(u < 0.25) return 0.1 + 0.8 * q(u / 0.25);
  if(u < 0.50) return 0.9;
  if(u < 0.75) return 0.9 - 0.8 * q((u - 0.5) / 0.25);
  return 0.1;
};
function fly(fn, secs, L = leader()){
  for(let t = 0; t < secs; t += DT) L.step(DT, fn(t));
  return L;
}

console.log('1. the phase estimator — controls with known periods');
for(const T of [16, 8, 4, 2, 1]){
  const L = fly(sine(T), T * 6);
  const err = Math.abs(L.period - T) / T;
  ok(`sine, ${T} s`, L.measured && err < 0.04, `read ${L.period.toFixed(3)} s, ${(err * 100).toFixed(1)}% off`);
}
{
  const L = fly(box(16), 16 * 5);
  const err = Math.abs(L.period - 16) / 16;
  ok('4-4-4-4 box, holds and all', L.measured && err < 0.04, `read ${L.period.toFixed(2)} s`);
}
{
  /* a hand that shakes: the same 4 s breath with jitter well under the
     hysteresis. The count of turns is the real assertion — a derivative
     would have found dozens. */
  const r = lcg(7);
  const L = fly(t => sine(4)(t) + (r() - 0.5) * 0.06, 40);
  const err = Math.abs(L.period - 4) / 4;
  ok('4 s breath through a shaking hand', err < 0.06 && L.turns >= 18 && L.turns <= 21,
     `read ${L.period.toFixed(2)} s, ${L.turns} turns in ten cycles (20 expected)`);
}
{
  /* MUST REPORT NOTHING: a tremor that never retraces a turn's worth is
     not a breath. An estimator that finds a rate here finds one anywhere. */
  const r = lcg(11);
  const L = fly(() => 0.5 + (r() - 0.5) * 0.07, 30);
  ok('a tremor alone is not a rhythm', L.period === null && L.turns === 0,
     `period ${L.period}, turns ${L.turns}`);
}
{
  /* the erratic reader: every cycle a different length between 0.8 and
     1.6 s. There is no right answer, but there is a right RANGE, and the
     estimate must not vanish or run away. */
  const r = lcg(3); let t0 = 0, T = 1.2;
  const L = leader();
  for(let t = 0; t < 30; t += DT){
    if(t - t0 >= T){ t0 += T; T = 0.8 + 0.8 * r(); }
    L.step(DT, 0.5 - 0.4 * Math.cos(2 * Math.PI * (t - t0) / T));
  }
  ok('erratic 0.8–1.6 s reader stays inside their own range',
     L.period > 0.8 && L.period < 1.6, `read ${L.period.toFixed(2)} s`);
  ok('and reads as hurried', L.haste > 0.9, `haste ${L.haste.toFixed(2)}`);
}
{
  const L = fly(sine(16), 80);
  ok('a 16 s reader does not read as hurried', L.haste === 0, `haste ${L.haste}`);
  ok('haste is 0 at calm and 1 at panic, by definition',
     hasteOf(CALM_PERIOD) === 0 && hasteOf(PANIC_PERIOD) === 1 && hasteOf(4) > 0.4 && hasteOf(4) < 0.6);
}
{
  /* the first excursion: before any cycle exists, a fast hand must not
     be read as a slow one */
  const L = leader();
  for(let t = 0; t < 0.5; t += DT) L.step(DT, Math.min(1, t / 0.4));
  ok('a fast first move is read as fast before a cycle exists',
     L.period !== null && !L.measured && L.period < 2.0, `seed ${L.period && L.period.toFixed(2)} s`);
}
{
  /* stopping: the estimate lengthens from the moment it is true */
  const L = fly(sine(4), 24);
  const before = L.period;
  for(let t = 0; t < 9; t += DT) L.step(DT, 0.1);
  ok('a reader who stops is read as slowing, without waiting for a turn',
     Math.abs(before - 4) < 0.2 && L.period > 8, `${before.toFixed(2)} s, then ${L.period.toFixed(2)} s after nine still seconds`);
}

console.log('2. the superstructure — coupling, and the standing lag');
function couple(T, secs, opts){
  const L = leader(), S = superstructure(opts);
  let cycles = 0, last = 0, lagSum = 0, lagN = 0;
  const fn = sine(T);
  for(let t = 0; t < secs; t += DT){
    L.step(DT, fn(t)); S.step(DT, L);
    const p = S.phase;
    if(t > secs * 0.5){
      if(p < last - 0.5) cycles++;
      lagSum += phaseGap(L.phase, p); lagN++;
    }
    last = p;
  }
  return { L, S, freq: cycles / (secs * 0.5), lag: lagSum / lagN };
}
for(const T of [12, 6, 3]){
  const c = couple(T, T * 30);
  const fErr = Math.abs(c.freq - 1 / T) * T;
  ok(`locks to a ${T} s reader`, fErr < 0.03, `ran at ${(1 / c.freq).toFixed(2)} s`);
  ok(`  …and stands BEHIND them, not on them`, c.lag > 0.015 && c.lag < 0.12,
     `${(c.lag * 360).toFixed(0)}° behind (asin(0.08/0.30) = 15.5° expected)`);
  ok(`  …while preferring to be slower`, c.S.period > T * 1.04, `prefers ${c.S.period.toFixed(2)} s`);
}
{
  /* the world's own tempo when nobody is there */
  const S = superstructure();
  for(let t = 0; t < 60; t += DT) S.step(DT, null);
  ok('alone, it keeps its own time', Math.abs(S.period - 16) < 1e-6);
}
{
  /* MUST NOT LOCK: pin its preferred period far outside the lock range
     and it has to run free. A coupling test that passes for every
     detuning is measuring nothing. */
  const L = leader(), S = superstructure({ follow: 0, rest: 9 });
  let cycles = 0, last = 0; const T = 3, secs = 120, fn = sine(T);
  for(let t = 0; t < secs; t += DT){
    L.step(DT, fn(t)); S.step(DT, L);
    if(S.phase < last - 0.5) cycles++; last = S.phase;
  }
  const f = cycles / secs;
  ok('negative control: three octaves-ish off, it does not capture',
     Math.abs(f - 1 / T) * T > 0.3, `ran at ${(1 / f).toFixed(2)} s against a ${T} s reader`);
}
{
  let threw = false; try { superstructure({ K: 0.05, detune: 0.08 }); } catch(e){ threw = true; }
  ok('a coupling too weak to ever lock is refused at construction', threw);
}

console.log('3. §1.6a as a continuous invariant — no inhale under water, in any state');
{
  /* sweep every centre height and every attitude the body can take */
  let worst = 0, n = 0, above = 0;
  for(let y = -13; y <= Y_FLOAT + 1e-9; y += 0.01){
    for(let up = -1; up <= 1.0001; up += 0.05){
      const h = headY(y, up), a = inhaleAt(h); n++;
      if(h <= SURFACE_Y){ if(a > worst) worst = a; }
      else if(a > 0) above++;
    }
  }
  ok('inhale is EXACTLY zero for every head at or below the surface', worst === 0, `${n} states, worst ${worst}`);
  ok('and it is not vacuous: there are states where it is drawn', above > 0, `${above} states`);
  ok('floating upright, she is breathing', inhaleAt(headY(Y_FLOAT, 1)) === 1,
     `head at ${headY(Y_FLOAT, 1).toFixed(2)} m`);
  /* negative control: the mapping a careless version would write */
  const careless = y => Math.max(0, 1 + y / 2);          // "near the surface"
  let bad = 0;
  for(let y = -3; y < 0; y += 0.05) if(careless(y) > 0 && headY(y, 0) <= SURFACE_Y) bad++;
  ok('negative control: a depth-based inhale is caught by the same sweep', bad > 0, `${bad} violations`);
}
{
  /* and FLOWN: a thousand seconds of a reader doing random things, the
     inhale term sampled every frame against where the head really is */
  const r = lcg(99); const s = { x: 0, y: Y_FLOAT, vx: 0, vy: 0 };
  let target = null, hold = 0, viol = 0, minY = 0, maxSpeed = 0, inSand = 0, outOfBounds = 0;
  let ax = 0, ay = 1;
  for(let t = 0; t < 1000; t += DT){
    if((hold -= DT) <= 0){
      hold = 0.1 + r() * 3;
      target = r() < 0.2 ? null : { x: -16 + r() * 32, y: 3 - r() * 20 };   // deliberately beyond every edge
    }
    swim(s, target, DT);
    const sp = Math.hypot(s.vx, s.vy);
    const wx = sp > 0.25 ? s.vx / sp : 0, wy = sp > 0.25 ? s.vy / sp : 1;
    ax += (wx - ax) * 0.1; ay += (wy - ay) * 0.1;
    const m = Math.hypot(ax, ay) || 1;
    const h = headY(s.y, ay / m);
    if(h <= SURFACE_Y && inhaleAt(h) !== 0) viol++;
    minY = Math.min(minY, s.y); maxSpeed = Math.max(maxSpeed, sp);
    if(s.y < floorY(s.x) - 1e-9) inSand++;
    if(s.x < X_MIN - 1e-9 || s.x > X_MAX + 1e-9 || s.y > Y_FLOAT + 1e-9) outOfBounds++;
  }
  ok('flown: 1000 s of a random reader, no inhale under water', viol === 0);
  ok('flown: she never enters the sand or leaves the water', inSand === 0 && outOfBounds === 0,
     `deepest ${minY.toFixed(2)} m`);
  ok('flown: never faster than the body can swim', maxSpeed <= V_MAX + 1e-6, `${maxSpeed.toFixed(2)} of ${V_MAX} m/s`);
}

console.log('4. the body — it arrives, and it does not overshoot');
{
  const s = { x: 0, y: Y_FLOAT, vx: 0, vy: 0 };
  const goal = { x: 1.6, y: siteAt(0).y };
  let t = 0, over = 0, arrived = null;
  for(; t < 12; t += DT){
    swim(s, goal, DT);
    if(s.y < Math.max(goal.y, floorY(s.x)) - 0.02) over++;
    if(arrived === null && Math.hypot(s.x - goal.x, s.y - goal.y) < PICK_REACH) arrived = t;
  }
  ok('a straight dive to the first pearl reaches it', arrived !== null, `in ${arrived && arrived.toFixed(2)} s`);
  ok('…in about the four seconds the old chapter took', arrived > 3 && arrived < 5);
  ok('…without going past it', over === 0);
  const s2 = { x: 0, y: -8, vx: 0, vy: 0 };
  let tUp = 0; while(s2.y < Y_FLOAT - 0.05 && tUp < 60){ swim(s2, null, DT); tUp += DT; }
  ok('let go at eight metres and she comes up on her own', tUp < 14, `${tUp.toFixed(1)} s`);
}

console.log('5. the pearl — four seconds, kept if she leaves, nothing counted');
{
  const p = newPearl(), site = siteAt(0), at = { x: site.x, y: site.y };
  for(let t = 0; t < 2; t += DT) pearlStep(p, at, at.y, DT);
  const half = p.progress;
  /* away for a long time */
  for(let t = 0; t < 30; t += DT) pearlStep(p, { x: site.x, y: Y_FLOAT }, headY(Y_FLOAT, 1), DT);
  ok('half way is kept while she is at the surface', Math.abs(half - 0.5) < 0.01 && p.progress === half,
     `${half.toFixed(3)} → ${p.progress.toFixed(3)}`);
  let t = 0; while(!p.carrying && t < 10){ pearlStep(p, at, at.y, DT); t += DT; }
  ok(`and the rest takes the rest of ${PICK_SECS} s`, Math.abs(t - 2) < 0.05, `${t.toFixed(2)} s more`);
  pearlStep(p, { x: site.x, y: -3 }, -3 + HEAD_REACH, DT);
  ok('it is not let go under water', p.carrying && p.deliver === 0);
  for(let k = 0; k < 200; k++) pearlStep(p, { x: site.x, y: Y_FLOAT }, headY(Y_FLOAT, 1), DT);
  ok('at the surface it goes, and the next oyster wakes', !p.carrying && p.site === 1 && p.progress === 0);
  ok('the state has no tally in it', !Object.keys(p).some(k => /count|score|total|best|streak/i.test(k)),
     Object.keys(p).join(', '));
}
{
  let worst = 0;
  for(let i = 0; i < SITES.length; i++){
    const a = SITES[i], b = SITES[(i + 1) % SITES.length];
    worst = Math.max(worst, Math.abs(a - b));
  }
  ok('every next pearl is within 3.6 m of the last (in or at the edge of frame)', worst <= 3.6 + 1e-9, `worst ${worst.toFixed(1)} m`);
  ok('and every site is inside the water she can reach',
     SITES.every(x => x > X_MIN + 1 && x < X_MAX - 1 &&
       Math.hypot(0, siteAt(SITES.indexOf(x)).y - floorY(x)) < PICK_REACH));
}

console.log('6. the world — the lens stays out of the ground, the bed is smooth');
{
  let clear = Infinity, camClear = Infinity;
  for(let x = X_MIN; x <= X_MAX; x += 0.25){
    const cy = camYFor(floorY(x));
    /* the lens itself, and a metre either side of it */
    for(let dx = -1; dx <= 1; dx += 0.5) camClear = Math.min(camClear, cy - bedAt(x + dx, CAM_BACK));
    /* and the straight line from the lens to her, against the bed under it */
    for(let z = 0.5; z <= CAM_BACK; z += 0.25){
      const ly = floorY(x) + (cy - floorY(x)) * (z / CAM_BACK);
      clear = Math.min(clear, ly - bedAt(x, z));
    }
  }
  ok('the lens is well clear of the bed at her deepest, everywhere', camClear > 1.5, `least ${camClear.toFixed(2)} m`);
  ok('and the sight line to her never passes through sand', clear > 0.3, `least clearance ${clear.toFixed(2)} m`);
  /* refinement: a smooth field's second difference QUARTERS when the
     spacing halves. A kink would only halve it. */
  const d2 = h => { let m = 0; for(let x = -12; x <= 12; x += h) for(let z = -40; z <= 12; z += h)
    m = Math.max(m, Math.abs(bedAt(x + h, z) - 2 * bedAt(x, z) + bedAt(x - h, z)),
                    Math.abs(bedAt(x, z + h) - 2 * bedAt(x, z) + bedAt(x, z - h))); return m; };
  const r = d2(0.5) / d2(0.25);
  ok('the bed is smooth under refinement (ratio 4 = smooth, 2 = a kink)', r > 3.6 && r < 4.4, `ratio ${r.toFixed(2)}`);
  const kink = x => Math.abs(x);
  const k2 = h => { let m = 0; for(let x = -1; x <= 1; x += h) m = Math.max(m, Math.abs(kink(x + h) - 2 * kink(x) + kink(x - h))); return m; };
  ok('negative control: the same measure sees a kink', Math.abs(k2(0.5) / k2(0.25) - 2) < 0.2);
  ok('BED_CLEAR and depthFrac agree about where the bottom is',
     depthFrac(Y_FLOAT) === 0 && depthFrac(floorY(0)) > 0.9 && BED_CLEAR > 0 && bedY(0) < -9);
}

console.log('7. the ramp — one riser returns what five did');
{
  let worst = 0, n = 0;
  for(const w of [0.0015, 0.01, 0.1, 0.3, 0.5]){
    for(let s = 0; s <= 5.994; s += 0.0007){ worst = Math.max(worst, Math.abs(rampLoopRef(s, w) - rampOneRiser(s, w))); n++; }
  }
  ok('rampPickAA: single-riser form equals the five-riser loop', worst < 1e-12, `${n} samples, worst difference ${worst.toExponential(1)}`);
  ok('negative control: a riser width past 0.5 WOULD differ (so the clamp is load-bearing)',
     Math.abs(rampLoopRef(2.5, 0.9) - rampOneRiser(2.5, 0.9)) > 1e-3);
}

console.log(fails ? `\nLEAD FAILED — ${fails} check(s)` : '\nlead: every check passed');
process.exit(fails ? 1 : 0);
