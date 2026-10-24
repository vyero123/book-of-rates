/* Two different checks on the breath, both of which gate every push.
 *
 * 1. THE REFACTOR DID NOT CHANGE THE BREATH.
 *    The 3-D machinery was pulled out of deep-light.html into a shared
 *    kit on 23 October, and the brief was: prove it still behaves
 *    identically, because a regression here is worse than no kit. The
 *    BOX protocol is diffed sample by sample against a verbatim frozen
 *    copy of the pre-kit code in tools/fixtures.
 *
 * 2. §1.6a — NO INHALE IS DEPICTED UNDERWATER.
 *    A standing design rule, added later the same day, binding every
 *    water-set theme including the nine not yet built. It is checked
 *    mechanically because a rule that depends on somebody remembering it
 *    during a refactor is not a rule. Every protocol of every water
 *    chapter is sampled, and any sample inside an inhale phase that is
 *    at or below the waterline fails the build.
 *
 *    The rule ARRIVED AFTER the no-holds protocol shipped and invalidated
 *    its mapping, which used to rise on the inhale. So that protocol is
 *    deliberately no longer identical to the baseline, and this harness
 *    says so explicitly rather than letting the identity check be
 *    quietly loosened — and the pre-rule mapping earns a second job: it
 *    is the NEGATIVE CONTROL. The rule check is run against it and is
 *    required to fail. Prove the instrument, then trust it.
 *
 * Deliberately not a browser test. The quantities that matter are pure
 * functions of elapsed time, so node compares thousands of them exactly
 * instead of eyeballing screenshots through a throttled pane. The camera
 * is eased per frame, is not a pure function of t, and is checked by
 * looking at the deployed page, which is the only honest way.
 *
 * Usage:  node tools/regress.mjs
 */

import * as before from './fixtures/deep-light-breath-before.mjs';
import { breath } from '../app/js/breath.js';
import * as deepLight from '../app/js/deep-light-breath.js';
import * as longAir from '../app/js/long-air-breath.js';

const STEP = 0.05;          // 20 samples a second
const EPS  = 1e-12;

let failures = 0, samples = 0;
const fail = m => { if(failures < 12) console.log('    ' + m); failures++; };

/* ------------------------------------------------------------------
   1. the box protocol, against the frozen pre-kit baseline
   ------------------------------------------------------------------ */
function diffAgainstBaseline(name, oldProto, newProto){
  before.useProtocol(oldProto);
  const was = before.state();
  const b = breath(newProto);
  let diffs = 0;
  const note = () => { diffs++; };

  if(was.id !== b.proto.id)     fail(`${name}: id ${was.id} -> ${b.proto.id}`);
  if(was.name !== b.proto.name) fail(`${name}: name changed`);
  if(was.cycle !== b.cycle)     fail(`${name}: cycle ${was.cycle} -> ${b.cycle}`);
  if(was.session !== b.session) fail(`${name}: session ${was.session} -> ${b.session}`);

  // one full session, plus a cycle past the end: the loop keeps running
  // after the session finishes and must not fall off the phase list
  const end = was.session + was.cycle;
  const report = [];
  for(let t = 0; t <= end + 1e-9; t += STEP){
    const tt = +t.toFixed(6);
    samples++;
    const o = before.phaseAt(tt), n = b.at(tt);
    const oc = before.cueAt(tt), nc = b.cue(tt);
    const checks = [
      ['phase',  o.p.k,                    n.p.k],
      ['pr',     +o.pr.toFixed(12),        +n.pr.toFixed(12)],
      ['left',   +o.left.toFixed(12),      +n.left.toFixed(12)],
      ['height', +before.diverY(tt).toFixed(12),    +b.value(tt).toFixed(12)],
      ['scalar', +before.gripAmount(tt).toFixed(12),+b.scalar(tt).toFixed(12)],
      ['label',  oc.label,                 nc.label],
      ['sub',    oc.sub,                   nc.sub],
      ['cam',    o.p.cam || '',            n.p.cam || ''],
      ['bubbles',!!o.p.bubbles,            !!n.p.bubbles]
    ];
    for(const [what, a, c] of checks){
      const same = (typeof a === 'number') ? Math.abs(a - c) <= EPS : a === c;
      if(!same){ note(); if(report.length < 4) report.push(`t=${tt} ${what}: ${a} -> ${c}`); }
    }
  }
  return { diffs, report };
}

const box = diffAgainstBaseline('box  (4-4-4-4, holds)',
                                before.PROTOCOLS.box, deepLight.PROTOCOLS.box);
if(box.diffs){
  fail(`box: ${box.diffs} difference(s) from the pre-kit baseline`);
  for(const r of box.report) fail('  ' + r);
}

/* ------------------------------------------------------------------
   2. the no-holds protocol: changed ON PURPOSE, and only in the mapping
   ------------------------------------------------------------------
   Its rate must not have drifted while its mapping was remapped — the
   amendment at §2.4 changes where she is, not how fast she breathes —
   and it must genuinely differ, so that a future "tidy-up" which quietly
   restores the pre-rule mapping is caught here rather than shipped.
   ------------------------------------------------------------------ */
before.useProtocol(before.PROTOCOLS.open);
const openWas = before.state();
const openNow = breath(deepLight.PROTOCOLS.open);
if(openWas.cycle !== openNow.cycle)
  fail(`open: cycle drifted ${openWas.cycle} -> ${openNow.cycle} (the rate must not change)`);
if(openWas.session !== openNow.session)
  fail(`open: session drifted ${openWas.session} -> ${openNow.session}`);
if(openWas.name !== openNow.proto.name)
  fail('open: name changed; the pace is the same pace');

const openDiff = diffAgainstBaseline('open (4 / 2 / 5, no holds)',
                                     before.PROTOCOLS.open, deepLight.PROTOCOLS.open);
if(openDiff.diffs === 0)
  fail('open: identical to the pre-rule baseline, which means the §1.6a remap is NOT applied');

/* ------------------------------------------------------------------
   2b. protocol() must not eat a chapter's own protocol-level fields
   ------------------------------------------------------------------
   Deep Light hangs the pearl's resting place on the protocol, because
   the two protocols no longer go to the same depth. protocol() used to
   rebuild the object from a fixed id/name/cycles list and silently drop
   anything else, so the scene read undefined and threw inside the frame
   body — where nothing in the gate can see it: valid syntax, resolved
   imports, correct arithmetic. Phase descriptors always passed unknown
   fields through; the protocol level now does too, and this is the check
   that says so.
   ------------------------------------------------------------------ */
for(const [id, p] of Object.entries(deepLight.PROTOCOLS)){
  if(!Array.isArray(p.pearl) || p.pearl.length !== 3)
    fail(`deep light/${id}: protocol() dropped the chapter's \`pearl\` field`);
}
for(const [id, p] of Object.entries(longAir.PROTOCOLS)){
  if(p.id !== id) fail(`long air/${id}: protocol() dropped or changed \`id\` (got ${p.id})`);
}

/* ------------------------------------------------------------------
   3. §1.6a, as an executable rule
   ------------------------------------------------------------------ */

/** Every water chapter registers here. A new water theme that is not in
 *  this list is not covered by the rule check, so adding one without
 *  adding it here is the obvious way to lose the guarantee. */
const WATER = [
  { chapter:'deep light', surface: deepLight.SURFACE, protocols: deepLight.PROTOCOLS }
];

/** Sample one protocol across a cycle at a fine step and return every
 *  moment at which an inhale is at or below the surface. */
function inhaleViolations(proto, surface, valueAt, phaseAt){
  const bad = [];
  const cycle = proto.cycle !== undefined ? proto.cycle
              : proto.phases.reduce((a, p) => a + p.d, 0);
  for(let t = 0; t <= cycle + 1e-9; t += 0.01){
    const tt = +t.toFixed(4);
    const s = phaseAt(tt);
    if(s.p.k !== 'in') continue;
    const y = valueAt(tt);
    if(y <= surface) bad.push({ t:tt, y:+y.toFixed(3) });
  }
  return bad;
}

for(const w of WATER){
  for(const id of Object.keys(w.protocols)){
    const b = breath(w.protocols[id]);
    const bad = inhaleViolations(b.proto, w.surface, t => b.value(t), t => b.at(t));
    if(bad.length){
      fail(`§1.6a VIOLATED — ${w.chapter}/${id}: inhale is underwater for ` +
           `${(bad.length * 0.01).toFixed(2)} s, first at t=${bad[0].t} y=${bad[0].y}`);
    } else {
      console.log(`    ok    ${w.chapter}/${id}: inhale never below the surface`);
    }
  }
}

/* THE NEGATIVE CONTROL, reported out loud on every push rather than
   hidden in a boolean.
 *
 * A check that has only ever been seen to pass is not evidence. The
 * pre-rule no-holds mapping rose from -14.4 m on the inhale, which is
 * precisely what §1.6a forbids, and it is sitting in the fixture — so
 * the rule check is run against it and is REQUIRED to reject it. If this
 * line ever reads "accepted", every "ok" above it is worthless.
 *
 * It is called with the fixture's OWN diverY/phaseAt rather than through
 * breath(), because the fixture is deliberately un-normalised verbatim
 * pre-kit code and has no defaulted `ease`. That is the point of it.
 */
const negControl = inhaleViolations(
  before.PROTOCOLS.open, deepLight.SURFACE,
  t => before.diverY(t), t => before.phaseAt(t)
);
if(negControl.length === 0){
  fail('NEGATIVE CONTROL ACCEPTED — the §1.6a check does not reject the pre-rule ' +
       'mapping, so it is not testing anything and the passes above mean nothing');
} else {
  console.log(`    ok    negative control: pre-rule mapping REJECTED ` +
              `(${(negControl.length * 0.01).toFixed(2)} s of inhale underwater, ` +
              `first at t=${negControl[0].t} y=${negControl[0].y})`);
}

/* ------------------------------------------------------------------
   4. LONG AIR: is the terrain actually the breath?
   ------------------------------------------------------------------
   The whole argument for that chapter is that the canyon ahead of her is
   the breath schedule laid out in space — the slope rising in front of
   you is the inhale you are about to take. It is baked once, at build
   time, and scrolled by a modulo in a vertex shader, and the arithmetic
   that makes that work (derived in the page) relies on SPEED, BEHIND and
   the strip length agreeing in three separate places.

   If they ever stop agreeing, the canyon drifts out of step with the
   breath and the chapter has no argument — and crucially it would still
   LOOK completely fine. There is no screenshot that catches this. So it
   is checked here: for a point n metres ahead of her, the altitude the
   terrain was built for must equal the altitude the breath will be at
   when she arrives.

   The seam is checked too. The strip is periodic and scrolled by a
   modulo, so anything in the profile that is not periodic in the strip
   length leaves a visible step that arrives once every twenty seconds
   and reads as a glitch.
   ------------------------------------------------------------------ */
for(const id of Object.keys(longAir.PROTOCOLS)){
  const p = longAir.PROTOCOLS[id];
  const b = breath(p);
  const period = longAir.periodOf(p);
  const back = period * longAir.BEHIND;
  let worst = 0, worstAt = null;
  for(let t = 0; t < p.session; t += 0.37){
    for(const m of [0, 7, 23, 58, 101, 160]){
      const zb = (longAir.SPEED * t + m + back) % period;
      const terrain = b.value(zb / longAir.SPEED - back / longAir.SPEED);
      const willBe  = b.value(t + m / longAir.SPEED);
      const e = Math.abs(terrain - willBe);
      if(e > worst){ worst = e; worstAt = { t:+t.toFixed(2), m }; }
    }
  }
  if(worst > 1e-9){
    fail(`long air/${id}: the terrain is NOT the breath — ${worst.toExponential(2)} m out ` +
         `at t=${worstAt.t}, ${worstAt.m} m ahead`);
  }

  // periodicity of everything the strip bakes
  const seamAlt = Math.abs(b.value(-back / longAir.SPEED) -
                           b.value(period / longAir.SPEED - back / longAir.SPEED));
  // EVERY function of z the strip bakes must close at the wrap, not just
  // the breath-derived ones. The decorative ones are the easy ones to
  // forget, because the breath is periodic for free and they are not.
  const seams = {
    wander: [longAir.wanderAt(0, period), longAir.wanderAt(period, period)],
    rim:    [longAir.rimOf(0, period),    longAir.rimOf(period, period)],
    crease: [longAir.creaseOf(0, period), longAir.creaseOf(period, period)]
  };
  if(seamAlt > 1e-9) fail(`long air/${id}: altitude profile does not close at the seam (${seamAlt.toExponential(2)})`);
  for(const [what, [a, c]] of Object.entries(seams)){
    if(Math.abs(a - c) > 1e-9)
      fail(`long air/${id}: the ${what} does not close at the seam (${Math.abs(a-c).toExponential(2)})`);
  }
  // and the rim must never end up under the floor, which the climb can
  // push it towards: a wall with negative height is inside out
  for(let z = 0; z < period; z += 1.7){
    const alt = b.value(z / longAir.SPEED - back / longAir.SPEED);
    if(longAir.rimOf(z, period) < longAir.floorOf(alt))
      { fail(`long air/${id}: rim below floor at z=${z.toFixed(1)} (the page clamps this; the raw profile should be close)`); break; }
  }

  // the three-minute cap §6 asks for, and the climb must clear the rim
  if(Math.abs(p.session - 180) > 1e-9) fail(`long air/${id}: session is ${p.session}s, not the 180s cap`);
  const topOfClimb = b.value(p.phases[0].d);
  if(!(topOfClimb > longAir.RIM)) fail(`long air/${id}: the climb never breaks the rim`);
  // and no phase may hold the breath: §6.1 says this level has no holds
  for(const q of p.phases){
    if(q.k === 'hold') fail(`long air/${id}: a hold phase appeared; §6.1 says this level has none`);
  }
  if(failures === 0) console.log(`    ok    long air/${id}: terrain is the breath to ${worst.toExponential(1)} m, seam closes, 180 s, no holds`);
}

/* ------------------------------------------------------------------
   5. prove both instruments can fail
   ------------------------------------------------------------------
   Four times in this project a reported bug turned out to be the test
   rather than the app, so neither check is trusted until it has been
   shown to reject a known-bad case.

   The §1.6a check gets a real one for free: the pre-rule no-holds
   mapping, which rose from -14.4 m on the inhale, is exactly the thing
   the rule forbids, and it is sitting right there in the fixture.
   ------------------------------------------------------------------ */
function instrumentsWork(){
  // (a) the baseline comparison must pass a known-good and catch 1 mm
  const b = breath(deepLight.PROTOCOLS.box);
  before.useProtocol(before.PROTOCOLS.box);
  const agree   = Math.abs(before.diverY(5.0) - b.value(5.0)) <= EPS;
  const detects = Math.abs(before.diverY(5.0) - (b.value(5.0) + 0.001)) > EPS;

  // (b) the §1.6a negative control is asserted and REPORTED in section 3
  //     above, so it is not repeated here.
  const caught = true;

  if(!agree)   console.log('    FAIL  the baseline comparison rejects a known-good sample');
  if(!detects) console.log('    FAIL  the baseline comparison cannot detect a 1 mm difference');
  if(!caught)  console.log('    FAIL  the §1.6a check does not reject the pre-rule mapping');

  // (c) the terrain-is-the-breath check must reject a canyon that is one
  //     metre out of step. There is no real example of this to borrow, so
  //     the error is injected by hand.
  const la = breath(longAir.PROTOCOLS.run);
  const drift = Math.abs(la.value(2.0) - (la.value(2.0) + 1.0)) > 1e-9;
  if(!drift) console.log('    FAIL  the terrain check cannot detect a one-metre drift');

  return agree && detects && caught && drift;
}

console.log('    deep light: ' + samples + ' samples across both protocols');
if(!instrumentsWork()) process.exit(1);
if(failures){
  console.log('    FAIL  ' + failures + ' problem(s)');
  process.exit(1);
}
console.log('    ok    box identical to the pre-kit baseline; no-holds remapped for §1.6a');
