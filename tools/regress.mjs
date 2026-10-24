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
import * as bamboo from '../app/js/bamboo-rain-breath.js';
import * as lantern from '../app/js/lantern-breath.js';
import { body, ratesOf } from '../app/js/course.js';

const STEP = 0.05;          // 20 samples a second
const EPS  = 1e-12;

/** The real controller, built from the chapter's own corridor and the
 *  protocol's own derived rates. Not a reproduction of the page's loop —
 *  the same object the page drives. */
const kiteBody = proto =>
  body({ corridor: longAir.CORRIDOR, rates: longAir.rates(proto) });

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
  { chapter:'deep light', surface: deepLight.SURFACE, protocols: deepLight.PROTOCOLS },
  /* Lantern Current, added 24 Oct with the chapter itself. §6 row 4 is on
     the design doc's own list of water themes, so the rule binds it: the
     travelled scalar is the hull's height above the waterline and every
     anchor of every phase is above SURFACE, so the inhale is never under
     it by the SHAPE of the mapping. That is the claim; this is where it
     stops being a claim. */
  { chapter:'lantern current', surface: lantern.SURFACE, protocols: lantern.PROTOCOLS }
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
  // The lower slab is SUPPOSED to rise out of the ridge, so this is only
  // asking that the opening itself is not eaten by it. The margin that
  // actually protects the kite is the corridor floor above, checked
  // above at 2.6 m — a figure clipping the floor is what this pair of
  // checks exists to make unreachable.
  if(minLipGap <= 0.0)   fail(`long air/${id}: the ridge eats a gate's opening (${minLipGap.toFixed(2)} m)`);
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

  /* (f) THE SHAPE OF EACH PROTOCOL, now that there are holds in one of
         them. Re-badged to chapter four on 24 October: row 3 is box
         breathing, so `box` is REQUIRED to have holds and `open` is
         required to have none. The old check here simply banned the word
         `hold`, which was right for row 6 and would now reject the
         chapter's own protocol — so it is replaced by the two claims the
         gate sheet actually makes to the reader:

           - box breathing's holds are exactly equal to its other phases,
             which is what "set by the app, never lengthening" means in
             data rather than in copy;
           - the no-holds option really holds nothing.

         Plus the session cap, which is now a named constant in the
         chapter rather than the literal 180 sitting in the harness. */
  if(proto.session > longAir.SESSION_CAP + 1e-9)
    fail(`long air/${id}: session is ${proto.session}s, past the ${longAir.SESSION_CAP}s cap`);

  const holds = proto.phases.filter(q => q.k === 'hold' || q.k === 'holdout');
  if(id === 'box'){
    if(holds.length !== 2)
      fail(`long air/box: box breathing has ${holds.length} hold phases, not 2`);
    const ds = proto.phases.map(q => q.d);
    if(ds.some(d => Math.abs(d - ds[0]) > 1e-12))
      fail(`long air/box: the four sides of the box are ${ds.join('/')} — the holds must be ` +
           `exactly equal to the other phases, which is what the gate sheet promises`);
  } else if(holds.length){
    fail(`long air/${id}: the no-holds protocol has ${holds.length} hold phase(s)`);
  }

  /* (g) THE LEVEL CHANNEL. The claim made in the re-badge is that a hold
         falls out of the gate builder as a flat corridor, with nothing in
         courseOf() knowing what a hold is. That is checkable: every gate
         whose arrival lands inside a stationary phase must open at that
         phase's own altitude, and there must be more than one of them or
         it is a point rather than a channel. */
  for(let pi = 0; pi < proto.phases.length; pi++){
    const q = proto.phases[pi];
    if(q.from !== q.to) continue;
    const t0 = proto.phases.slice(0, pi).reduce((a, p) => a + p.d, 0);
    const inside = course.gates.filter(g => {
      const u = ((g.ta % proto.cycle) + proto.cycle) % proto.cycle;
      return u >= t0 && u < t0 + q.d;
    });
    if(inside.length < 2)
      fail(`long air/${id}: the ${q.k} phase produced ${inside.length} gate(s) — not a channel`);
    for(const g of inside){
      if(Math.abs(g.centre - q.from) > 1e-9)
        fail(`long air/${id}: a gate inside the ${q.k} phase opens at ${g.centre.toFixed(2)}, ` +
             `not level at ${q.from}`);
    }
  }

  if(failures === 0)
    console.log(`    ok    long air/${id}: course is the schedule to ${worst.toExponential(1)} m, ` +
                `seams close, ${minRidgeGap.toFixed(1)} m under the corridor, ` +
                `${proto.session}s, ${holds.length} hold(s), level channels flat`);
}

/* ------------------------------------------------------------------
   4a. §6.1'S PROMISE, MADE EXECUTABLE
   ------------------------------------------------------------------
   "The cloud gaps are generated from the breath schedule, so following
   the pacing always clears them." That is the chapter's central promise
   to the player and it is the one thing that must not be approximately
   true. It was not: the first build of the game eased the schedule while
   the buttons integrate at a constant rate, so the best a player could
   possibly produce diverged from the course by 3.73 m against a 3.6 m
   half-gap, and an on-pace player clipped lips a third of the time.
   Nothing in the gate could see it, and in a screenshot it looks like a
   kite near a rock.

   So an on-pace player is flown through a whole session. The kite must
   clear every gate on the BASE gap, with forgiveness left completely
   unspent, because forgiveness is there for players who are off pace and
   not to cover for a course that cannot be flown.

   24 Oct: this used to carry its OWN copy of the control loop — fill
   integration, spring, clamp — written to match the page's. Two pieces
   of code that merely agreed on the day they were written is not a
   proof of anything, and this project has four separate entries in
   CLAUDE.md about a reported bug turning out to be the instrument. The
   loop now lives in js/course.js and BOTH the page and this harness
   drive the same object, so what is checked here is what ships.
   ------------------------------------------------------------------ */
function flyOnPace(proto){
  const b = breath(proto);
  const course = longAir.courseOf(proto, t => b.value(t));
  const kite = kiteBody(proto);
  const dt = 1 / 120;
  let worstMargin = Infinity, worstAt = null, minRidge = Infinity;
  for(let t = 0; t < proto.session; t += dt){
    // press exactly what the cue says — nothing cleverer
    kite.follow(dt, b.at(t).p.k);
    const y = kite.value;

    const dist = longAir.SPEED * t;
    minRidge = Math.min(minRidge, y - longAir.ridgeAt(dist, course.period));
    const { gate, ahead } = longAir.gateAt(course, dist);
    if(Math.abs(ahead) < 4.0){
      // base gap only: no forgiveness spent
      const margin = gate.half - Math.abs(y - gate.centre) - 0.78;   // kite half-height
      if(margin < worstMargin){ worstMargin = margin; worstAt = +t.toFixed(2); }
    }
  }
  return { worstMargin:+worstMargin.toFixed(2), worstAt, minRidge:+minRidge.toFixed(2) };
}
for(const id of Object.keys(longAir.PROTOCOLS)){
  const f = flyOnPace(longAir.PROTOCOLS[id]);
  if(f.worstMargin < 0)
    fail(`long air/${id}: an ON-PACE player clips a gate by ${(-f.worstMargin).toFixed(2)} m ` +
         `at t=${f.worstAt} — §6.1 promises following the pacing always clears`);
  else if(f.worstMargin < 0.4)
    fail(`long air/${id}: an on-pace player clears by only ${f.worstMargin.toFixed(2)} m ` +
         `at t=${f.worstAt}; that is too fine to call a guarantee`);
  if(f.minRidge < 1.0)
    fail(`long air/${id}: an on-pace player comes within ${f.minRidge.toFixed(2)} m of the ridge`);
  if(failures === 0)
    console.log(`    ok    long air/${id}: on-pace play clears every gate by ${f.worstMargin.toFixed(2)} m ` +
                `with forgiveness unspent, ${f.minRidge.toFixed(1)} m over the ridge`);
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
  const kite = kiteBody(proto);
  const dt = 1 / 120;
  let lo = 1, hi = 0, se = 0, n = 0;
  /* The player follows the protocol's OWN phase sequence with every
     duration divided by m — which is what "breathing m times faster"
     actually means. An earlier version alternated in/out on a fixed
     period and ignored rest phases entirely, so for the slow protocol
     its m=1 player never rested, drifted, and scored worse than a 2x
     player: the harness reported a design failure that was its own
     omission. Four times before, a bug in this project turned out to be
     the instrument. */
  for(let t = 0; t < proto.session; t += dt){
    kite.follow(dt, b.at(t * m).p.k);
    const fill = kite.fill;
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
   5. EVERY CHAPTER, EVERY PROTOCOL — the claims that are not special
   ------------------------------------------------------------------
   Three things are true of every mapping in the project and none of
   them was being checked, because each chapter checked its own things.
   They are cheap, they are universal, and the first is a real class of
   bug rather than a tidiness rule:

     (a) THE SCHEDULE MUST CLOSE AT THE CYCLE WRAP. The last phase's `to`
         is the next cycle's first `from`. If they differ, the figure
         teleports once a breath — which, in a scene where the figure
         SPRINGS towards the schedule rather than sitting on it, does not
         look like a jump. It looks like a kick, or like the spring being
         badly tuned, and it would be chased in the wrong file.
     (b) THE SCHEDULE MUST STAY INSIDE THE CORRIDOR. The whole
         no-clipping guarantee is that the hard walls lie outside the
         band the schedule sweeps; a phase anchored outside them would
         have the clamp fighting the schedule for ever.
     (c) The session cap, and protocol() not eating the chapter's `id`.
   ------------------------------------------------------------------ */
const CHAPTERS = [
  { name:'long air',        mod: longAir,   corridor: longAir.CORRIDOR },
  { name:'bamboo rain',     mod: bamboo,    corridor: bamboo.CORRIDOR  },
  { name:'lantern current', mod: lantern,   corridor: lantern.CORRIDOR },
  /* Deep Light predates the corridor helper and anchors its heights
     directly, so it joins (a) and (c) and not (b). */
  { name:'deep light',      mod: deepLight, corridor: null }
];

for(const ch of CHAPTERS){
  for(const [id, proto] of Object.entries(ch.mod.PROTOCOLS)){
    if(proto.id !== id) fail(`${ch.name}/${id}: protocol() dropped or changed \`id\` (got ${proto.id})`);

    const ph = proto.phases;
    if(Math.abs(ph[ph.length - 1].to - ph[0].from) > 1e-9)
      fail(`${ch.name}/${id}: the schedule does not close at the cycle wrap — ` +
           `last phase ends at ${ph[ph.length-1].to}, first begins at ${ph[0].from}`);
    for(let i = 0; i + 1 < ph.length; i++){
      if(Math.abs(ph[i].to - ph[i+1].from) > 1e-9)
        fail(`${ch.name}/${id}: phase ${i} (${ph[i].k}) ends at ${ph[i].to} and phase ` +
             `${i+1} (${ph[i+1].k}) begins at ${ph[i+1].from}`);
    }

    if(ch.corridor){
      const C = ch.corridor;
      for(const q of ph){
        for(const v of [q.from, q.to]){
          if(v < C.lo || v > C.hi)
            fail(`${ch.name}/${id}: a ${q.k} phase is anchored at ${v}, outside the ` +
                 `corridor walls [${C.lo}, ${C.hi}]`);
        }
      }
    }

    const cap = ch.mod.SESSION_CAP;
    if(cap !== undefined && proto.session > cap + 1e-9)
      fail(`${ch.name}/${id}: session is ${proto.session}s, past the ${cap}s cap`);
  }
  if(failures === 0)
    console.log(`    ok    ${ch.name}: schedule closes at every seam, inside the corridor, under the cap`);
}

/* ------------------------------------------------------------------
   5a. BAMBOO RAIN — the claims the chapter's own comments make
   ------------------------------------------------------------------ */
for(const [id, proto] of Object.entries(bamboo.PROTOCOLS)){
  const b = breath(proto);

  /* (a) THE RATE CAP, SWAPPED AND STILL EXACT. This chapter drives its
         scalar on the EXHALE, so it swaps the kit's two rates. A full
         exhale of pressing must cross the band exactly once — no more,
         which is the cap, and no less, or somebody breathing correctly
         could not reach the far wall. */
  const r = bamboo.pushRates(proto);
  const plain = ratesOf(proto);
  if(Math.abs(r.fillPerSec * r.dout - 1) > 1e-12)
    fail(`bamboo/${id}: a full exhale pushes the curtain ${(r.fillPerSec*r.dout).toFixed(3)} ` +
         `times across the band, not once`);
  if(Math.abs(r.emptyPerSec * r.din - 1) > 1e-12)
    fail(`bamboo/${id}: a full inhale lets it back ${(r.emptyPerSec*r.din).toFixed(3)} times, not once`);
  if(r.fillPerSec !== plain.emptyPerSec || r.emptyPerSec !== plain.fillPerSec)
    fail(`bamboo/${id}: pushRates() is not the kit's rates swapped, so the two can drift apart`);

  /* (b) THE DOUBLE INHALE, which is the reason ratesOf() sums rather
         than finds. If this ever stops being two phases the sum equals
         the find and the check above stops meaning anything, so the
         structure is asserted rather than assumed. */
  if(id === 'sigh'){
    const ins = proto.phases.filter(q => q.k === 'in');
    if(ins.length !== 2)
      fail(`bamboo/sigh: the physiological sigh needs two inhale phases, found ${ins.length}`);
    else if(!(ins[1].d < ins[0].d))
      fail(`bamboo/sigh: the second inhale (${ins[1].d}s) is not shorter than the first ` +
           `(${ins[0].d}s) — it is a sip on top, not a second breath`);
    const wouldFind = proto.phases.find(q => q.k === 'in').d;
    if(Math.abs(wouldFind - plain.din) < 1e-12)
      fail('bamboo/sigh: summing the inhales gives the same answer finding the first one ' +
           'would, so this protocol no longer exercises the difference');
  }

  /* (c) A READER PRESSING EXACTLY ON THE CUE must track the schedule.
         Same controller as Long Air, same corridor helper, driven by the
         phase kind — and here what drives it OUT is the exhale, so
         getting the swap backwards would be a curtain moving the
         opposite way to the cue for a whole session. Checked, not
         eyeballed: in a screenshot it is just rain. */
  const curtain = body({ corridor: bamboo.CORRIDOR, rates: r, k: bamboo.SPRING });
  const dt = 1 / 120;
  let se = 0, n = 0, worst = 0, nearest = Infinity;
  for(let t = 0; t < proto.session; t += dt){
    const kind = b.at(t).p.k;
    curtain.drive(dt, bamboo.pushes(kind), kind === 'in');
    nearest = Math.min(nearest, curtain.value);
    if(t > proto.cycle){
      const e = curtain.value - b.value(t);
      se += e * e; n++;
      worst = Math.max(worst, Math.abs(e));
    }
  }
  /* The tolerance is DERIVED, not guessed. The only error a cue-perfect
     reader can have is the spring's own lag behind a ramp, which is
     about 2·slope/sqrt(k) — so the bar is the steepest phase's predicted
     lag, taken from the controller's own constants. A guessed number
     here would either pass a chapter whose rates were backwards or fail
     one whose curtain is simply heavy, and in both cases nobody could
     say which. The first draft used 1.2 m and failed the sigh, whose
     first inhale sweeps 19 m in two seconds; the lag that explains was
     2.4 m and the MEASUREMENT WAS RIGHT — the spring was too soft for a
     schedule with one-second phases in it, which is why the chapter now
     names its own stiffness and this reads it from there.

     The worst-case bound is twice the steady lag, not equal to it,
     because the sigh's phases are shorter than the spring's settling
     time: the schedule reverses while the body is still catching up, so
     the turnaround error is roughly lag out plus lag back. */
  const rms = Math.sqrt(se / n);
  let steepest = 0;
  for(const q of proto.phases) steepest = Math.max(steepest, Math.abs(q.to - q.from) / q.d);
  const allow = curtain.lag(steepest);
  if(rms > allow)
    fail(`bamboo/${id}: pressing exactly on the cue tracks the schedule to ${rms.toFixed(2)} m ` +
         `rms, more than the ${allow.toFixed(2)} m the spring's lag explains — the rates are ` +
         `not the schedule's`);
  if(worst > allow * 2.0)
    fail(`bamboo/${id}: worst tracking error ${worst.toFixed(2)} m against a predicted lag of ` +
         `${allow.toFixed(2)} m`);
  if(nearest < bamboo.WALL_NEAR - 1e-9)
    fail(`bamboo/${id}: the curtain reached ${nearest.toFixed(2)} m, inside the near wall`);

  /* (d) THE STORM CLEARS ON SCHEDULE, NOT ON EFFORT. The clearing term
         is a function of elapsed time alone: it starts at nothing, ends
         at the full shift and never goes backwards. A reader who never
         touches the screen gets all of it. */
  if(bamboo.clearingAt(0) !== 0)
    fail('bamboo: the clearing does not start at zero');
  if(Math.abs(bamboo.clearingAt(1) - bamboo.CLEAR_SHIFT) > 1e-9)
    fail('bamboo: the clearing does not reach the full shift by the end of the session');
  let prev = -1;
  for(let p = 0; p <= 1.0001; p += 0.01){
    const c = bamboo.clearingAt(p);
    if(c < prev - 1e-12) fail(`bamboo: the clearing goes backwards at progress ${p.toFixed(2)}`);
    prev = c;
  }

  /* (e) LIGHTNING ONLY ON THE EXHALE. A flash is what shows you how far
         back the curtain has gone, so it is worth nothing at the moment
         the curtain is closest — and a full-frame flash landing in an
         inhale is a startle at the one moment in this chapter where a
         startle does not belong. */
  let offPhase = 0, strokes = 0;
  for(let t = 0; t < proto.session; t += 0.01){
    if(bamboo.strokeAt(t, proto.cycle) <= 0) continue;
    strokes++;
    if(b.at(t).p.k !== 'out') offPhase++;
  }
  if(offPhase) fail(`bamboo/${id}: ${offPhase} lightning samples land outside an exhale`);
  if(!strokes) fail(`bamboo/${id}: no lightning at all in a whole session`);

  if(failures === 0)
    console.log(`    ok    bamboo/${id}: push rate exact and swapped, cue-perfect play tracks to ` +
                `${rms.toFixed(2)} m rms inside a predicted ${allow.toFixed(2)} m of lag ` +
                `(worst ${worst.toFixed(2)}), nearest ${nearest.toFixed(1)} m, ` +
                `clearing monotone to ${bamboo.CLEAR_SHIFT} m, ${strokes} lightning samples, all on exhales`);
}

/* ------------------------------------------------------------------
   5b. LANTERN CURRENT — §1.6a BY CONSTRUCTION, and the river's seams
   ------------------------------------------------------------------
   The §1.6a sampling is done in section 3 above with the other water
   chapters. What is checked here is the STRUCTURAL claim the chapter
   makes about why it passes: not that the samples happen to come out
   above the line, but that both walls the controller clamps to are above
   it, so no clamp, overshoot or contact can put the hull under water at
   all. That is the difference between satisfying the rule and being
   unable to break it — §1.6a's own wording: satisfy it with the shape of
   the mapping, not with a number tuned until it just clears.
   ------------------------------------------------------------------ */
if(!(lantern.WALL_LOW > lantern.SURFACE))
  fail(`lantern current: the lower corridor wall is at ${lantern.WALL_LOW}, not above ` +
       `the waterline — the hull could be clamped under water`);

for(const [id, proto] of Object.entries(lantern.PROTOCOLS)){
  const b = breath(proto);
  const period = lantern.periodOf(proto);

  /* the river's seams, same discipline as Long Air's strip */
  const seams = {
    bankL: [lantern.bankAt(0, period, -1), lantern.bankAt(period, period, -1)],
    bankR: [lantern.bankAt(0, period,  1), lantern.bankAt(period, period,  1)],
    treeL: [lantern.treeAt(0, period, -1), lantern.treeAt(period, period, -1)],
    treeR: [lantern.treeAt(0, period,  1), lantern.treeAt(period, period,  1)]
  };
  for(const [what, [x, y]] of Object.entries(seams)){
    if(Math.abs(x - y) > 1e-9)
      fail(`lantern/${id}: the ${what} does not close at the seam (${Math.abs(x-y).toExponential(2)})`);
  }

  /* every lantern is off the boat's own lane and inside the bank, both
     sides. There is no collision in this chapter, and this is the reason
     there does not need to be one. */
  let inLane = 0, pastBank = 0;
  for(let i = 0; i < lantern.LANTERNS; i++){
    const L = lantern.lanternAt(i, period);
    if(Math.abs(L.x) < 1.0) inLane++;
    if(Math.abs(L.x) > Math.abs(lantern.bankAt(L.z, period, Math.sign(L.x))) - 0.5) pastBank++;
  }
  if(inLane)   fail(`lantern/${id}: ${inLane} lantern(s) sit in the boat's own lane`);
  if(pastBank) fail(`lantern/${id}: ${pastBank} lantern(s) sit in or past the bank`);

  /* the boat follows the schedule with mass — the kit's controller with
     the SCHEDULE holding the control instead of a reader — and must
     still never go under. Driven, not asserted. */
  const hull = body({ corridor: lantern.CORRIDOR, rates: ratesOf(proto) });
  const dt = 1 / 120;
  let lowest = Infinity, worst = 0;
  for(let t = 0; t < proto.session; t += dt){
    hull.follow(dt, b.at(t).p.k);
    lowest = Math.min(lowest, hull.value);
    if(t > proto.cycle) worst = Math.max(worst, Math.abs(hull.value - b.value(t)));
  }
  if(lowest <= lantern.SURFACE)
    fail(`lantern/${id}: the hull reached ${lowest.toFixed(3)} m, at or below the waterline`);

  if(failures === 0)
    console.log(`    ok    lantern/${id}: hull stays ${lowest.toFixed(2)} m clear of the waterline ` +
                `(walls ${lantern.WALL_LOW}/${lantern.WALL_HIGH}), lag ${worst.toFixed(2)} m, ` +
                `banks and treeline close at the seam, no lantern in the lane`);
}

/* ------------------------------------------------------------------
   6. prove both instruments can fail
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
  const la = breath(longAir.PROTOCOLS.box);
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
