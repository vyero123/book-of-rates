/* tools/sozu.mjs — Bamboo Rain's water-tipper, flown without a picture.
 *
 * The chapter is reader-led, so there is no schedule to fly and
 * regress.mjs's "on-pace play" cannot cover it. These are the promises
 * its header makes, as properties over a family of readers:
 *
 *   1. it TURNS, fast — the phase boundary is a turn, not an ease
 *   2. the exhale is longer than the inhale, at every rate the reader picks
 *   3. it caps: holding longer than full buys nothing
 *   4. it cannot be failed: left alone nothing happens, mashed nothing happens
 *   5. a longer breath reaches further, monotonically
 *
 * and one case that is required to fail, so the instrument is known to
 * be able to.
 */
import { flyOne, newSozu, step, reachOf, T_FULL, POUR_RATIO, BOWL_AT, DOWN }
  from '../app/js/sozu-breath.js';

let failed = 0;
const fail = m => { failed++; console.log('  FAIL  ' + m); };
const ok = m => console.log('  ok    ' + m);

/* ---- 1. the turn ---- */
const turn = flyOne(2).turnUp;
if(!(turn > 0 && turn < 0.30)) fail(`the mouth takes ${turn} s to come up under the trickle; the bar is 0.30`);
else ok(`the tube turns in ${turn.toFixed(3)} s`);

/* ---- 2. out is longer than in, across the reader's whole range ---- */
const ratioOk = r => r > 1.12 && r < 1.45;
let worstLo = 9, worstHi = 0;
for(let h = 1.0; h <= T_FULL + 1e-9; h += 0.25){
  const r = flyOne(h).ratio;
  worstLo = Math.min(worstLo, r); worstHi = Math.max(worstHi, r);
  if(!ratioOk(r)) fail(`holding ${h.toFixed(2)} s pours for ${r} times as long; wanted about ${POUR_RATIO}`);
}
ok(`the pour is ${worstLo.toFixed(2)}–${worstHi.toFixed(2)} times the fill, from 1 s to ${T_FULL} s`);
/* the negative control: a ratio of exactly 1 must be refused */
if(ratioOk(1.0)) fail('negative control: an exhale no longer than the inhale was ACCEPTED');
else ok('negative control: an exhale no longer than the inhale is rejected');

/* ---- 3. the cap ---- */
const full = flyOne(T_FULL + 0.4), long = flyOne(T_FULL + 9);
if(long.filled > 1 + 1e-9) fail(`held past full, the tube holds ${long.filled}`);
if(long.pour > full.pour + 0.3) fail(`holding 9 s longer than full bought ${(long.pour - full.pour).toFixed(2)} s more pour`);
if(long.reach !== full.reach) fail('holding past full reaches a different bowl');
ok(`held ${T_FULL + 9} s it pours ${long.pour} s against ${full.pour} s at full: nothing bought`);
const cycle = T_FULL + full.pour;
if(60 / cycle < 4.8) fail(`the slowest breath it leads to is ${(60 / cycle).toFixed(2)} a minute; the floor is 4.8`);
else ok(`its slowest breath is ${(60 / cycle).toFixed(2)} a minute`);

/* ---- 4. cannot be failed ---- */
{
  const s = newSozu();
  for(let i = 0; i < 60 * 120; i++) step(s, false, 1 / 60);
  if(s.fill !== 0 || s.flow !== 0 || Math.abs(s.angle - DOWN) > 1e-6 || Math.max(...s.bowl) !== 0)
    fail('left alone for two minutes, something happened');
  else ok('left alone, nothing happens');
}
{
  const s = newSozu(); let lit = 0, fill = 0;
  for(let i = 0; i < 60 * 30; i++){
    step(s, Math.floor(i / 7.5) % 2 === 0, 1 / 60);       // four presses a second
    lit = Math.max(lit, ...s.bowl); fill = Math.max(fill, s.fill);
  }
  if(lit > 0.02) fail(`mashing lit a bowl to ${lit.toFixed(2)}`);
  else ok(`mashing at 4 a second lights nothing (fill ${fill.toFixed(3)})`);
}

/* ---- 5. further for longer, never the other way ---- */
{
  let prev = -1, mono = true;
  for(let h = 0.2; h <= T_FULL + 2; h += 0.1){ const r = flyOne(h).reach; if(r < prev) mono = false; prev = r; }
  if(!mono) fail('a longer hold reached fewer bowls than a shorter one');
  if(reachOf(1) !== BOWL_AT.length) fail('a full tube does not reach the last bowl');
  if(flyOne(1.25).reach !== 1) fail(`a 1.25 s hold reaches ${flyOne(1.25).reach} bowls, not one`);
  if(mono) ok(`reach is monotone, one bowl at 1.25 s and all ${BOWL_AT.length} when full`);
}

if(failed){ console.log(`sozu: ${failed} failure(s)`); process.exit(1); }
console.log('sozu: all properties hold');
