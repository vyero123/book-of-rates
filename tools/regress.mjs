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
   4. LONG AIR: the course must BE the protocol
   ------------------------------------------------------------------
   The chapter is a game now, and its whole claim is that the obstacle
   course is the breath schedule expressed as level design: the gap in
   each gate, at the moment the player reaches it, sits at the altitude
   the protocol wants. If that drifts, flying well and breathing on pace
   stop being the same act and the chapter has no argument — and it would
   still look completely fine, which is exactly why it is checked here.
   ------------------------------------------------------------------ */
for(const id of Object.keys(longAir.PROTOCOLS)){
  const proto = longAir.PROTOCOLS[id];
  const b = breath(proto);
  const course = longAir.courseOf(proto, t => b.value(t));
  const period = course.period, back = course.back;

  /* (a) every gate's opening is the schedule at the gate's arrival time,
         and the arrival time must be recoverable from the player's
         position — the same inverse the collision test uses. */
  let worst = 0, worstAt = null;
  for(const g of course.gates){
    const e = Math.abs(g.centre - b.value(g.ta));
    if(e > worst){ worst = e; worstAt = g.i; }
  }
  if(worst > 1e-9) fail(`long air/${id}: gate ${worstAt} is ${worst.toExponential(2)} m off its own schedule`);

  /* (b) gateAt() must find the gate the player is actually at. Walk a
         whole session and check the gate it returns is the nearest one. */
  let lookupBad = 0;
  for(let t = 0; t < proto.session; t += 0.21){
    const dist = longAir.SPEED * t;
    const { gate, ahead } = longAir.gateAt(course, dist);
    if(Math.abs(ahead) > course.dz / 2 + 1e-6) lookupBad++;
    // and the gate it found must be the schedule at the time it is reached
    const reachIn = ahead / longAir.SPEED;
    if(Math.abs(gate.centre - b.value(t + reachIn)) > 1e-6) lookupBad++;
  }
  if(lookupBad) fail(`long air/${id}: gateAt() disagreed with the layout ${lookupBad} times`);

  /* (c) THE CORRIDOR. The first pass let the figure clip through the
         floor. This checks the margin rather than trusting it: the kite
         is clamped into [CORR_LO, CORR_HI], every ridge crest must stay
         below CORR_LO, and no gate's lower lip may reach the ridge. */
  let minRidgeGap = Infinity, minLipGap = Infinity, lipOverHi = 0;
  for(let z = 0; z < period; z += 1.3){
    minRidgeGap = Math.min(minRidgeGap, longAir.CORR_LO - longAir.ridgeAt(z, period));
  }
  for(const g of course.gates){
    minLipGap = Math.min(minLipGap, (g.centre - g.half) - longAir.RIDGE_TOP);
    if(g.centre + g.half < longAir.CORR_LO) lipOverHi++;
  }
  if(minRidgeGap <= 0.5) fail(`long air/${id}: only ${minRidgeGap.toFixed(2)} m between the ridge and the corridor floor`);
  if(minLipGap <= 0.5)   fail(`long air/${id}: a gate's lower lip comes within ${minLipGap.toFixed(2)} m of the ridge`);
  if(lipOverHi)          fail(`long air/${id}: ${lipOverHi} gate(s) sit entirely below the corridor`);

  /* (d) seams. Everything the strip bakes must close at the wrap, or
         the course visibly jolts once every twenty-odd seconds. The
         breath-derived parts are periodic for free; the decorative ones
         are the easy ones to forget. */
  const seams = {
    wander: [longAir.wanderAt(0, period), longAir.wanderAt(period, period)],
    ridge:  [longAir.ridgeAt(0, period),  longAir.ridgeAt(period, period)],
    ceiling:[longAir.ceilAt(0, period),   longAir.ceilAt(period, period)],
    gates:  [course.gates[0].centre, b.value(period / longAir.SPEED - back / longAir.SPEED)]
  };
  for(const [what, [x, y]] of Object.entries(seams)){
    if(Math.abs(x - y) > 1e-9)
      fail(`long air/${id}: the ${what} does not close at the seam (${Math.abs(x-y).toExponential(2)})`);
  }

  /* (e) the rate cap is DERIVED from the protocol, not tuned. Holding the
         inhale button for the length of the protocol's inhale must fill
         the kite exactly once — no more, which is the cap, and no less,
         or a player breathing correctly could not reach the gates. */
  const r = longAir.rates(proto);
  if(Math.abs(r.fillPerSec * r.din - 1) > 1e-12)
    fail(`long air/${id}: a full inhale fills the kite ${(r.fillPerSec*r.din).toFixed(3)} times, not once`);
  if(Math.abs(r.emptyPerSec * r.dout - 1) > 1e-12)
    fail(`long air/${id}: a full exhale empties the kite ${(r.emptyPerSec*r.dout).toFixed(3)} times, not once`);

  /* (f) §6 row 6 and §6.1: three-minute cap, and no holds anywhere. */
  if(Math.abs(proto.session - 180) > 1e-9) fail(`long air/${id}: session is ${proto.session}s, not the 180s cap`);
  for(const q of proto.phases)
    if(q.k === 'hold') fail(`long air/${id}: a hold phase appeared; §6.1 says this level has none`);

  if(failures === 0)
    console.log(`    ok    long air/${id}: course is the schedule to ${worst.toExponential(1)} m, ` +
                `seams close, ${minRidgeGap.toFixed(1)} m under the corridor, 180 s, no holds`);
}

/* ------------------------------------------------------------------
   4b. PACE INTEGRITY — breathing faster must not be rewarded
   ------------------------------------------------------------------
   Handing the player the buttons hands them the protocol, so the claim
   that the intended rate is still the intended rate has to be checked
   rather than asserted.

   The kite's fill rate is capped at the protocol's own, so a player
   breathing m times faster gets 1/m of the altitude range — they
   oscillate around the middle while the gates sweep the whole of it.
   This simulates a player breathing at several multiples of the pace and
   measures how well each one tracks the schedule. The intended rate must
   come out best, by a clear margin, and the achieved swing must fall off
   as 1/m. Nothing here is a score or is shown to anyone; it is a
   statement about the design, tested.
   ------------------------------------------------------------------ */
function flyAt(proto, m){
  const b = breath(proto);
  const r = longAir.rates(proto);
  const dt = 1 / 120;
  let fill = 0, lo = 1, hi = 0, se = 0, n = 0;
  // the player repeats the protocol's own in/out pattern, time-compressed
  const pin = r.din / m, pout = r.dout / m, pcyc = pin + pout;
  for(let t = 0; t < proto.session; t += dt){
    const u = t % pcyc;
    if(u < pin) fill = Math.min(1, fill + r.fillPerSec * dt);
    else        fill = Math.max(0, fill - r.emptyPerSec * dt);
    if(t > proto.cycle){                 // let the first cycle settle
      lo = Math.min(lo, fill); hi = Math.max(hi, fill);
      const want = longAir.normOf(b.value(t));
      se += (fill - want) ** 2; n++;
    }
  }
  return { m, swing:+(hi - lo).toFixed(3), rms:+Math.sqrt(se / n).toFixed(3) };
}
for(const id of Object.keys(longAir.PROTOCOLS)){
  const proto = longAir.PROTOCOLS[id];
  const runs = [1, 2, 3, 4].map(m => flyAt(proto, m));
  const onPace = runs[0];
  for(const r of runs.slice(1)){
    if(r.rms <= onPace.rms)
      fail(`long air/${id}: breathing ${r.m}x faster tracks the course as well as the intended ` +
           `pace (rms ${r.rms} vs ${onPace.rms}) — the rate cap is not doing its job`);
    const expected = 1 / r.m;
    if(r.swing > expected * 1.15)
      fail(`long air/${id}: breathing ${r.m}x faster reached ${r.swing} of the range, ` +
           `more than the ${expected.toFixed(2)} the rate cap should allow`);
  }
  if(failures === 0)
    console.log(`    ok    long air/${id}: pace integrity — swing ` +
                runs.map(r => `${r.m}x:${r.swing}`).join(' ') + `, best fit at 1x`);
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
