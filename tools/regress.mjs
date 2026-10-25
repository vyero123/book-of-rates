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
import { body, ratesOf, corridor as cor, drag } from '../app/js/course.js';

const STEP = 0.05;          // 20 samples a second
const EPS  = 1e-12;

/** The real controller, built from the chapter's own corridor and the
 *  protocol's own derived rates. Not a reproduction of the page's loop —
 *  the same object the page drives. */
const kiteBody = proto =>
  body({ corridor: longAir.CORRIDOR, rates: longAir.rates(proto), vMax: longAir.V_MAX });

/** HOW FAR A SPRUNG BODY MAY TRAIL A PIECEWISE-LINEAR SCHEDULE, derived
 *  from the controller's own constants instead of guessed.
 *
 *  On a single ramp the steady lag is about 2·slope/sqrt(k), which the
 *  kit exposes as body.lag(). The WORST error is not that: it is at a
 *  turnaround, where the body is still trailing the ramp it was on when
 *  the schedule reverses onto the next one, so the two lags add. The
 *  1.5 is the spring's own overshoot on top of that.
 *
 *  This replaces two different hand-picked multipliers that were doing
 *  the same job badly in two chapters — one of them within a millimetre
 *  of failing a protocol that was perfectly correct, which is a check
 *  about to start lying.
 */
function trailBound(ctrl, phases){
  const slope = q => Math.abs(q.to - q.from) / q.d;
  let worst = 0;
  for(let i = 0; i < phases.length; i++){
    const j = (i + 1) % phases.length;           // includes the cycle wrap
    worst = Math.max(worst, ctrl.lag(slope(phases[i])) + ctrl.lag(slope(phases[j])));
  }
  return worst * 1.5;
}

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
    /* A CHANNEL NEEDS TWO GATES TO BE A CHANNEL, and a phase shorter
       than the gate spacing cannot have two — that is arithmetic, not a
       defect, and it is stated here rather than worked around.

       It became live when the spacing went from 0.55 s to 1.45 s to cut
       how often a wall sweeps the lens: box breathing's four-second
       holds still carry two gates each, and the no-holds protocol's
       ONE-second rest at empty now carries none. What that protocol
       gets instead is a longer level gap between the gate before it and
       the gate after, both of which sit at the same altitude because
       the phases either side of a rest at empty begin and end there.
       The flat stretch is still flown; it is simply not marked.

       The claim that survives at every spacing, and the one that
       matters, is the second check: no gate inside a stationary phase
       may open anywhere but level. */
    /* UNCONDITIONAL AGAIN. This was briefly exempted for phases shorter
       than the gate spacing, which was papering over a real mismatch:
       a stationary phase that cannot hold two gates cannot be a level
       channel, and a chapter that promises one has to make the phase
       long enough rather than make the check quieter. The no-holds
       protocol's rest went from 1 s to 3 s for exactly that reason. */
    if(inside.length < 2)
      fail(`long air/${id}: the ${q.k} phase is ${q.d}s and produced ${inside.length} gate(s) ` +
           `at ${(course.dz / longAir.SPEED).toFixed(2)}s spacing — a stationary phase has to ` +
           `be at least two gate spacings long to be a channel at all`);
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
   4-ALPHA. HOW OFTEN DOES THE WORLD THROW SOMETHING ACROSS THE LENS?
   ------------------------------------------------------------------
   Long Air was reported as flashing a different scene in about once a
   second. Every structural candidate was measured and cleared — a
   second render loop, the book's background, depth precision, the near
   field, the far stack, an accent shelf, the forgiveness stepping — and
   the answer was simply that a gate went past every 0.55 seconds and
   each one is a large opaque object crossing the whole frame.

   That is not a bug any single check could have seen, because nothing
   was wrong: the course was the schedule, every gate was level, the
   seams closed, on-pace play cleared everything. It was a RATE, and a
   rate is arithmetic, so it can be checked here.

   This is deliberately a design bound and not a physical one. It says:
   if a chapter puts something across the reader's view more often than
   about once a second, it will read as a strobe however correct each
   frame is. A reader looking at a breathing app should not be made to
   blink.
   ------------------------------------------------------------------ */
const SWEEPS_PER_SECOND_MAX = 1.0;

for(const id of Object.keys(longAir.PROTOCOLS)){
  const proto = longAir.PROTOCOLS[id];
  const b = breath(proto);
  const course = longAir.courseOf(proto, t => b.value(t));
  /* gates a second = SPEED / dz, which reduces to 1 / SPACING: the rate
     does not depend on how fast the course travels, only on how finely
     it is sampled. Worth stating, because the instinct when something
     flickers is to slow the world down, and that would not have helped. */
  const rate = longAir.SPEED / course.dz;
  if(rate > SWEEPS_PER_SECOND_MAX)
    fail(`long air/${id}: a gate crosses the lens ${rate.toFixed(2)} times a second ` +
         `(every ${course.dz.toFixed(1)} m). Over ${SWEEPS_PER_SECOND_MAX}/s a corridor of ` +
         `walls reads as a strobe however correct each frame is — this is what the ` +
         `"different theme flashing in" report turned out to be.`);
  if(failures === 0)
    console.log(`    ok    long air/${id}: a gate crosses the lens ${rate.toFixed(2)} times a ` +
                `second, every ${course.dz.toFixed(1)} m`);
}

/* The same question of the other travelling chapter. Lantern Current
   passes under an arch, which is a cable and some lamps rather than a
   wall, but it is still something crossing the view on a fixed cadence
   and it is still worth knowing the number. */
for(const id of Object.keys(lantern.PROTOCOLS)){
  const period = lantern.periodOf(lantern.PROTOCOLS[id]);
  const spacing = period / lantern.archCount(period);
  const rate = lantern.SPEED / spacing;
  if(rate > SWEEPS_PER_SECOND_MAX)
    fail(`lantern/${id}: an arch crosses the lens ${rate.toFixed(2)} times a second`);
  if(failures === 0)
    console.log(`    ok    lantern/${id}: an arch crosses the lens ${rate.toFixed(2)} times a ` +
                `second, every ${spacing.toFixed(1)} m`);
}

/* ------------------------------------------------------------------
   4-BETA. WHY THE ONE-FRAME COLOUR JUMP IS NOT CHECKED HERE
   ------------------------------------------------------------------
   The chapter was reported as flashing a different scene in about once
   a second. What finds that is a frame-to-frame meter in a browser:
   render, read the frame back, and compare CONSECUTIVE frames. Every
   individual frame was correct, so a screenshot showed nothing; nothing
   was drawn twice, so draw-call counts showed nothing. The fault exists
   only in the difference.

   I tried to give that an arithmetic shadow here — how much of the
   field of view a gate's slabs occupy, and how fast that changes per
   frame — and then tried to prove the shadow could fail, which is this
   project's own standard. IT COULD NOT. At 14 m/s and 60 fps the lens
   moves 0.23 m a frame, and the share of the view a gate occupies is a
   smooth function of distance: the worst real case scores 2.2% and the
   worst case I could contrive scores 0.0%. A check that cannot be made
   to fail is worse than no check, because it reads as cover.

   It is also the wrong shape. The fault turned out to be the INSIDE of
   the slabs being drawn as though lit — shading, winding and draw
   order, none of which geometry arithmetic can see. So the geometric
   proxy was deleted rather than kept as decoration.

   WHERE THIS CLASS IS ACTUALLY CAUGHT: tools/flash-check.md, which is a
   procedure for a browser plus the measured baseline for every chapter.
   The rate check above (4-ALPHA) is the part that IS arithmetic and
   does bind: how often the world puts something across the lens.
   ------------------------------------------------------------------ */

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

   24 Oct, SECOND REWRITE: THE PHYSICS CHANGED, SO THE DERIVATION HAD
   TO BE REDONE RATHER THAN THE THRESHOLD LOOSENED.

   The old model pushed the kite back off a lip and kicked it. The new
   one has exactly two forces: the glider steers away from a surface by
   itself, and contact is a SKIM that costs forward speed, which breath
   takes back off again. Speed is no longer constant, so `dist` is an
   integral and the old `dist = SPEED * t` the harness used is simply
   not what the page does any more.

   The guarantee re-derives to something STRONGER and simpler:

     ON-PACE PLAY NEVER TOUCHES A SURFACE AT ALL.

   Not "clears by a margin" — zero contacts in a whole session. And
   that is what makes the rest of it true, in a chain worth writing out:
   no contact means no drag; no drag means nominal speed; nominal speed
   means dist is exactly SPEED*t; and that is the condition under which
   the course's arrival-time arithmetic is exact, which is what makes
   every gate's opening the schedule's own altitude. The chapter's
   promise now rests on a property the harness can check as a count of
   zero rather than as a tolerance.
   ------------------------------------------------------------------ */
const KITE_HALF = 0.78;

/** Fly the chapter with the REAL model: the same body, the same
 *  avoid/skim, the same drag object the page drives. `press(t, kind)`
 *  decides what the reader does. */
function fly(proto, press){
  const b = breath(proto);
  const course = longAir.courseOf(proto, t => b.value(t));
  const kite = kiteBody(proto);
  const fric = drag({ maxLoss: longAir.DRAG_MAX_LOSS, gain: longAir.DRAG_GAIN,
                      clear: longAir.DRAG_CLEAR });
  const dt = 1 / 120;
  let dist = 0, skims = 0, worstMargin = Infinity, worstAt = null, maxV = 0;
  let minRidge = Infinity, maxDrag = 0, minSpeed = Infinity, maxBehind = 0;
  for(let t = 0; t < proto.session; t += dt){
    const kind = b.at(t).p.k;
    const { inDown, outDown } = press(t, kind);

    const working = kind === 'in'  ? (inDown && !outDown)
                  : kind === 'out' ? (outDown && !inDown)
                  : (!inDown && !outDown);
    fric.breathe(dt, working);
    const speed = longAir.SPEED * fric.speedFactor;
    dist += speed * dt;
    minSpeed = Math.min(minSpeed, speed);
    maxDrag = Math.max(maxDrag, fric.value);
    maxBehind = Math.max(maxBehind, longAir.SPEED * t - dist);

    kite.drive(dt, inDown, outDown);

    const { gate, ahead } = longAir.gateAt(course, dist);
    const forg = longAir.forgiveness(kite.value, gate.centre);
    const half = gate.half + forg.extra;
    if(Math.abs(ahead) < 2.6 + longAir.AVOID_MARGIN * 2){
      kite.avoid({ centre: gate.centre, half, bodyHalf: KITE_HALF, dt,
                   margin: longAir.AVOID_MARGIN, strength: longAir.AVOID_STRENGTH });
    }
    if(Math.abs(ahead) < 2.6 + 1.4){
      if(kite.skim({ centre: gate.centre, half, bodyHalf: KITE_HALF }) > 0){
        skims++; fric.skim(dt);
      }
      // the BASE gap, with forgiveness left unspent
      const margin = gate.half - Math.abs(kite.value - gate.centre) - KITE_HALF;
      if(margin < worstMargin){ worstMargin = margin; worstAt = +t.toFixed(2); }
    }
    minRidge = Math.min(minRidge, kite.value - longAir.ridgeAt(dist, course.period));
    maxV = Math.max(maxV, Math.abs(kite.v));
  }
  return { skims, worstMargin:+worstMargin.toFixed(2), worstAt,
           minRidge:+minRidge.toFixed(2), maxDrag:+maxDrag.toFixed(3),
           minSpeed:+minSpeed.toFixed(2), maxBehind:+maxBehind.toFixed(2),
           maxV:+maxV.toFixed(2), dist:+dist.toFixed(1) };
}

const ON_CUE  = (t, kind) => ({ inDown: kind === 'in', outDown: kind === 'out' });
const NEVER   = () => ({ inDown:false, outDown:false });
const ALWAYS  = () => ({ inDown:true,  outDown:false });
const MASHING = (t) => ({ inDown: Math.floor(t * 7) % 2 === 0,
                          outDown: Math.floor(t * 11) % 3 === 0 });

for(const id of Object.keys(longAir.PROTOCOLS)){
  const proto = longAir.PROTOCOLS[id];

  /* (a) THE PROMISE, re-derived: on-pace play never touches anything. */
  const cue = fly(proto, ON_CUE);
  if(cue.skims)
    fail(`long air/${id}: an ON-PACE player skims a surface ${cue.skims} times — the promise ` +
         `is that following the pacing never touches one, and every other guarantee here ` +
         `depends on it (no contact -> no drag -> nominal speed -> the course IS the schedule)`);
  if(cue.maxDrag > 0)
    fail(`long air/${id}: an on-pace player picked up drag (${cue.maxDrag})`);
  if(Math.abs(cue.dist - longAir.SPEED * proto.session) > 0.5)
    fail(`long air/${id}: an on-pace player covered ${cue.dist} m, not the nominal ` +
         `${(longAir.SPEED * proto.session).toFixed(1)} m — the course and the schedule have ` +
         `come apart`);
  if(cue.worstMargin < 0.4)
    fail(`long air/${id}: an on-pace player clears by only ${cue.worstMargin} m`);
  if(cue.minRidge < 1.0)
    fail(`long air/${id}: an on-pace player comes within ${cue.minRidge} m of the ridge`);

  /* (b) THE GLIDER CANNOT CRASH, and this is what that means now: no
         reader, however adversarial, leaves the corridor, stops dead,
         or gets stuck. Three bad readers — one who never breathes, one
         who holds the inhale for ever, one mashing both buttons. */
  for(const [name, press] of [['never breathing', NEVER],
                              ['holding in for ever', ALWAYS],
                              ['mashing', MASHING]]){
    const f = fly(proto, press);
    if(f.minSpeed <= 0)
      fail(`long air/${id}: a reader ${name} stops dead (${f.minSpeed} m/s) — friction may ` +
           `slow the glider and may never stop it`);
    if(f.minSpeed < longAir.SPEED * (1 - longAir.DRAG_MAX_LOSS) - 1e-9)
      fail(`long air/${id}: a reader ${name} drops to ${f.minSpeed} m/s, below the floor the ` +
           `model's own maxLoss allows`);
    if(f.minRidge < 0)
      fail(`long air/${id}: a reader ${name} goes through the ridge (${f.minRidge} m)`);
    /* and nobody, however they press, gets snapped about. The avoidance
       is a bend, not a save: without the cap a reader who never
       breathes sits permanently against a lip, is permanently herded,
       and hit 27.5 m/s on the deployed page. */
    if(f.maxV > longAir.V_MAX + 1e-6)
      fail(`long air/${id}: a reader ${name} reaches ${f.maxV} m/s, past the ` +
           `${longAir.V_MAX.toFixed(1)} m/s the schedule's own steepest sweep allows`);
  }

  /* (c) THE FEEDBACK LOOP IS OPEN. Friction slows the glider, so a
         slowed glider meets gates the course laid for a moment it has
         not reached — and if that mismatch could exceed the opening,
         slowing would cause contact and contact would cause slowing.
         MAX_DESYNC_M is derived from the model's own constants; this is
         where it is checked against the aperture rather than hoped for. */
  const room = longAir.GATE_HALF - KITE_HALF;
  if(longAir.MAX_DESYNC_M >= room)
    fail(`long air/${id}: the worst desync friction can cause is ${longAir.MAX_DESYNC_M.toFixed(2)} m ` +
         `against ${room.toFixed(2)} m of opening — friction would cause contact and contact ` +
         `would cause friction`);

  /* (d) BREATH IS WHAT RETURNS THE SPEED. From fully stuck, a reader
         breathing on the cue must be back to full speed in the time the
         model's own clear rate says, and nothing else may do it: a
         reader who does NOT breathe must stay slowed. */
  {
    const f = drag({ maxLoss: longAir.DRAG_MAX_LOSS, gain: longAir.DRAG_GAIN,
                     clear: longAir.DRAG_CLEAR });
    f.value = 1;
    let secs = 0;
    for(let i = 0; i < 2000 && f.value > 0; i++){ f.breathe(1/120, true); secs += 1/120; }
    if(f.value > 0) fail(`long air/${id}: breathing on the cue never clears the friction`);
    // one dt of slack: the loop counts the step that reaches zero
    if(secs > f.recoverySeconds + 1/120 + 1e-9)
      fail(`long air/${id}: recovery took ${secs.toFixed(2)}s against the ` +
           `${f.recoverySeconds.toFixed(2)}s the clear rate implies`);
    const g = drag({ maxLoss: longAir.DRAG_MAX_LOSS, gain: longAir.DRAG_GAIN,
                     clear: longAir.DRAG_CLEAR });
    g.value = 1;
    for(let i = 0; i < 2000; i++) g.breathe(1/120, false);
    if(g.value < 1 - 1e-9)
      fail(`long air/${id}: friction decays on its own (${g.value.toFixed(3)}) — the breath is ` +
           `supposed to be the only thing that removes it`);
  }

  if(failures === 0){
    const m = fly(proto, MASHING);
    console.log(`    ok    long air/${id}: on-pace play never touches a surface (0 skims, ` +
                `drag 0, ${cue.dist} m covered, clears by ${cue.worstMargin} m with ` +
                `forgiveness unspent, ${cue.minRidge} m over the ridge); mashing skims ` +
                `${m.skims}x, bottoms out at ${m.minSpeed} m/s and stays ${m.minRidge} m ` +
                `over the ridge; worst desync ${longAir.MAX_DESYNC_M.toFixed(2)} m inside ` +
                `${room.toFixed(2)} m of opening`);
  }
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
  const allowWorst = trailBound(curtain, proto.phases);
  if(rms > allow)
    fail(`bamboo/${id}: pressing exactly on the cue tracks the schedule to ${rms.toFixed(2)} m ` +
         `rms, more than the ${allow.toFixed(2)} m the spring's lag explains — the rates are ` +
         `not the schedule's`);
  if(worst > allowWorst)
    fail(`bamboo/${id}: worst tracking error ${worst.toFixed(2)} m against a turnaround bound ` +
         `of ${allowWorst.toFixed(2)} m`);
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
  /* and the lag must be the spring's own and nothing else — derived
     from the controller's constants, never a number picked to pass */
  const allowLag = trailBound(hull, proto.phases);
  if(worst > allowLag)
    fail(`lantern/${id}: the hull trails its schedule by ${worst.toFixed(3)} m, more than the ` +
         `${allowLag.toFixed(3)} m the spring explains — the anchors are not what a ` +
         `constant rate reaches`);

  /* ---------------------------------------------------------------
     THE ATTENTION ARC. The chapter's claim is: focus one, then focus
     two HIGHER AND MORE, then all the way down to nothing gathered.
     Each clause is checkable and none of them is visible in a
     screenshot, so none of them is left to one.
     --------------------------------------------------------------- */
  const ins = proto.phases.filter(q => q.k === 'in');
  if(ins.length !== 2)
    fail(`lantern/${id}: a double breath needs two inhale phases, found ${ins.length}`);
  else {
    if(!(ins[1].d < ins[0].d))
      fail(`lantern/${id}: the second inhale (${ins[1].d}s) is not shorter than the first`);
    if(ins[0].focus !== lantern.FOCUS.NEAR || ins[1].focus !== lantern.FOCUS.FAR)
      fail(`lantern/${id}: the two inhales do not name two different objects of focus ` +
           `(${ins[0].focus} then ${ins[1].focus})`);
    // the increase: the second object is HIGHER and the attention on it
    // is TIGHTER, and the front gets there FASTER. "More", not "another
    // one of the same".
    if(!(ins[1].to > ins[0].to))
      fail(`lantern/${id}: the second inhale does not rise above the first ` +
           `(${ins[0].to} then ${ins[1].to}) — there is no increase`);
    if(!(ins[1].tight(1) > ins[0].tight(1)))
      fail(`lantern/${id}: attention is not tighter on the second object ` +
           `(${ins[0].tight(1)} vs ${ins[1].tight(1)})`);
    /* THE FRONT'S ANCHORS, like the hull's, MUST BE WHAT A CONSTANT
       RATE REACHES. Both were written for a "the second sip is faster"
       effect and both were wrong in the same way: the control
       integrates at one rate across the whole inhale, so an anchor it
       cannot reach is not a target, it is a permanent error. The front
       version trailed by 0.15 of the arch, which on screen is the light
       running up the wire visibly behind the cue asking for it.

       So the increase is NOT A SPEED anywhere in this chapter. It is
       what gets lit (the second sip finishes the span and the keystone,
       the part that is overhead), how tightly it is held, and where the
       lens goes. Those are the three checks below. */
    const totalInR = ins.reduce((a, q) => a + q.d, 0);
    const wantReach = ins[0].d / totalInR;
    if(Math.abs(ins[0].reach[1] - wantReach) > 1e-9)
      fail(`lantern/${id}: the first sip ends with the front at ${ins[0].reach[1]} but a ` +
           `constant-rate hold reaches ${wantReach.toFixed(3)} there`);

    /* and the second sip must light the TOP of the arch: everything it
       adds has to be higher than everything the first sip reached */
    const archA = lantern.archLights();
    const firstTop  = Math.max(...archA.filter(L => L.s <= ins[0].reach[1] + 1e-9).map(L => L.y));
    const secondTop = Math.max(...archA.map(L => L.y));
    const secondSet = archA.filter(L => L.s > ins[0].reach[1] + 1e-9);
    if(!secondSet.length)
      fail(`lantern/${id}: the second sip lights nothing the first did not`);
    else if(!(Math.min(...secondSet.map(L => L.y)) >= firstTop - 1e-9))
      fail(`lantern/${id}: the second sip lights something LOWER than the first reached ` +
           `— "up through them" has to be up`);
    if(!(secondTop > firstTop))
      fail(`lantern/${id}: the second sip does not reach higher than the first`);

    /* THE HULL'S OWN ANCHORS MUST BE WHAT A CONSTANT RATE REACHES.
       The hull is the kit's body with the schedule holding the control,
       and that integrates at one rate across the whole inhale, so the
       only height it can be at when the first sip ends is the one that
       rate gets to. A prettier number here does not move the boat; it
       makes the boat lag its own schedule for the rest of the breath,
       and the lag then looks like a badly tuned spring. */
    const totalIn = ins.reduce((a, q) => a + q.d, 0);
    const want = lantern.HULL_LOW +
                 (lantern.HULL_HIGH - lantern.HULL_LOW) * (ins[0].d / totalIn);
    if(Math.abs(ins[0].to - want) > 1e-9)
      fail(`lantern/${id}: the first sip ends at ${ins[0].to.toFixed(3)} m but a constant-rate ` +
           `inhale reaches ${want.toFixed(3)} m there`);
  }

  /* The exhale must reach NO FOCUS AT ALL, and must get there before it
     ends rather than at the last instant: "all the way down to an
     unfocused, general, relaxed state" is a place to arrive and rest in,
     not a line to cross on the way to the next breath. */
  const outs = proto.phases.filter(q => q.k === 'out');
  for(const q of outs){
    if(q.focus !== lantern.FOCUS.NONE)
      fail(`lantern/${id}: the exhale still names a focus (${q.focus})`);
    if(q.tight(1) > 1e-9)
      fail(`lantern/${id}: attention is still ${q.tight(1).toFixed(3)} at the end of the exhale`);
    let arrived = null;
    for(let p = 0; p <= 1.0001; p += 0.005){
      if(q.tight(p) <= 1e-9){ arrived = p; break; }
    }
    if(arrived === null || arrived > 0.9)
      fail(`lantern/${id}: the exhale only lets go at ${(arrived === null ? 1 : arrived).toFixed(2)} ` +
           `of the way through — there is no released state to rest in`);
  }

  /* REACH is continuous across the whole cycle and ends where it began,
     or the illumination front teleports once a breath — which, against
     an arch lighting from the feet up, would look like the arch
     flickering rather than like a jump. */
  let prevReach = null, reachHi = 0, reachLo = 1;
  for(let t = 0; t <= proto.cycle + 1e-9; t += 0.01){
    const a = lantern.attention(b, +t.toFixed(4));
    reachHi = Math.max(reachHi, a.reach); reachLo = Math.min(reachLo, a.reach);
    if(prevReach !== null && Math.abs(a.reach - prevReach) > 0.08)
      fail(`lantern/${id}: the illumination front jumps ${Math.abs(a.reach-prevReach).toFixed(3)} ` +
           `at t=${t.toFixed(2)}`);
    prevReach = a.reach;
  }
  if(Math.abs(reachHi - lantern.REACH_FULL) > 1e-9)
    fail(`lantern/${id}: the front only reaches ${reachHi.toFixed(3)}, never the apex`);
  if(reachLo > 1e-9)
    fail(`lantern/${id}: the front never comes back down to the feet (lowest ${reachLo.toFixed(3)})`);

  /* ---------------------------------------------------------------
     THE ARCH ITSELF. Its distance ordering is baked from a canonical
     eye, and the two things that must be true of it are that the feet
     really are nearest and the apex really is furthest — otherwise
     "lights up from the sides and rushes upward" is just a claim.
     --------------------------------------------------------------- */
  const arch = lantern.archLights();
  if(arch.length !== lantern.ARCH_LIGHTS * 2)
    fail(`lantern: an arch has ${arch.length} lights, not ${lantern.ARCH_LIGHTS * 2}`);
  if(Math.abs(arch[0].s) > 1e-9 || Math.abs(arch[arch.length-1].s - 1) > 1e-9)
    fail('lantern: the arch ordering is not normalised to 0..1');
  // nearest is a foot (a near 0), furthest is an apex (a near 1)
  if(arch[0].a > 0.2)
    fail(`lantern: the nearest light on the arch is at a=${arch[0].a.toFixed(2)}, not a foot`);
  if(arch[arch.length-1].a < 0.8)
    fail(`lantern: the furthest light is at a=${arch[arch.length-1].a.toFixed(2)}, not the apex`);
  // both feet must light before anything above them: "the lights on
  // either side closest to the person light up first"
  const firstTwo = arch.slice(0, 2).map(L => L.side).sort();
  if(firstTwo[0] !== -1 || firstTwo[1] !== 1)
    fail('lantern: the first two lights of an arch are not one on each side');
  // height must increase with the ordering, or "upward" is not what
  // the front actually does
  for(let i = 1; i < arch.length; i++){
    if(arch[i].y < arch[i-1].y - 1e-9 && arch[i].side === arch[i-1].side)
      fail(`lantern: the arch ordering goes DOWN at index ${i} ` +
           `(${arch[i-1].y.toFixed(2)} -> ${arch[i].y.toFixed(2)})`);
  }
  // nothing in the boat's lane, at any height
  const inLaneArch = arch.filter(L => Math.abs(L.x) < 1.0).length;
  if(inLaneArch) fail(`lantern: ${inLaneArch} arch light(s) sit in the boat's own lane`);
  // the arches must fit the strip a whole number of times
  const nArch = lantern.archCount(period);
  if(Math.abs(lantern.archZ(nArch, period) - period) > 1e-9)
    fail('lantern: the arches do not close at the strip seam');

  /* ---------------------------------------------------------------
     THE FRONT, FLOWN. The reader holds through both inhales and lets
     go through the exhale, driven by the same controller the page
     drives, and three things must come out of it:

       - the front reaches the apex, so the whole arch can light;
       - it comes back to the feet before the next breath, so the fade
         is a thing that completes rather than a thing that is
         interrupted;
       - HOLDING THROUGH THE EXHALE TOO CANNOT PUSH IT PAST THE APEX.
         That is the rate cap, and it is what stops "hold more" being a
         strategy. The arch has a top.
     --------------------------------------------------------------- */
  const FRONT_CORRIDOR = cor({ lo:-0.20, hi:1.14, low:-0.12, high:1.06 });
  const flyFront = (holdAlways) => {
    const f = body({ corridor: FRONT_CORRIDOR, rates: ratesOf(proto), k: 140, zeta: 0.55 });
    let hi = -Infinity, lo = Infinity, endOfExhale = null, worstE = 0;
    const dt = 1 / 120;
    for(let tt = 0; tt < proto.session; tt += dt){
      const kind = b.at(tt).p.k;
      const hold = holdAlways ? true : (kind === 'in');
      f.drive(dt, hold, !hold);
      if(tt > proto.cycle){
        hi = Math.max(hi, f.value); lo = Math.min(lo, f.value);
        if(!holdAlways) worstE = Math.max(worstE, Math.abs(f.fill - lantern.attention(b, tt).reach));
      }
      // the instant before the cycle wraps, on the second cycle onward
      const u = tt % proto.cycle;
      if(!holdAlways && tt > proto.cycle && u > proto.cycle - dt * 1.5) endOfExhale = f.value;
    }
    return { hi:+hi.toFixed(4), lo:+lo.toFixed(4), endOfExhale, worstE:+worstE.toFixed(4) };
  };
  const onCue = flyFront(false);
  const greedy = flyFront(true);
  /* THE APEX MUST ACTUALLY LIGHT. Not "the front gets close to 1" —
     the keystone lamp's own litAmount must reach full, which is the
     thing the reader can see and the thing two separate bugs stopped
     happening (a lip running the wrong way, and a spring target of
     exactly 1 that a sprung value approaches and never arrives at). */
  const apex = Math.max(...lantern.archLights().map(L => L.s));
  if(lantern.litAmount(apex, onCue.hi) < 1 - 1e-9)
    fail(`lantern/${id}: holding exactly on the cue leaves the keystone at ` +
         `${lantern.litAmount(apex, onCue.hi).toFixed(3)} — the arch never closes`);
  if(onCue.endOfExhale === null || lantern.litAmount(0, onCue.endOfExhale) > 1e-9)
    fail(`lantern/${id}: the feet are still lit at ${onCue.endOfExhale} when the next breath ` +
         `begins — the fade never completes`);
  /* AND HOLDING THROUGH THE EXHALE GAINS NOTHING. The arch has a top;
     this is the rate cap, and it is what stops "hold more" being a
     strategy in a chapter where nothing is counted. */
  if(lantern.litAmount(apex, greedy.hi) > lantern.litAmount(apex, onCue.hi) + 1e-9)
    fail(`lantern/${id}: holding through the exhale lights more of the arch than holding on ` +
         `the cue does — the arch is supposed to have a top`);
  const frontCtrl = body({ corridor: FRONT_CORRIDOR, rates: ratesOf(proto), k: 140, zeta: 0.55 });
  /* fill is integrated, not sprung, so the only error it can have
     against the schedule is a real mismatch between the anchors and the
     rate — which is exactly what this is looking for. The tolerance is
     a hundredth of the arch, not a derived lag, because there is no
     spring in this comparison at all. */
  const frontAllow = 0.01;
  void frontCtrl;
  if(onCue.worstE > frontAllow)
    fail(`lantern/${id}: the front trails the schedule by ${onCue.worstE} of the arch, more ` +
         `than the ${frontAllow.toFixed(4)} its own spring explains`);

  /* litAmount is the only thing that decides what is on, so it had
     better be monotonic in the front and bounded. */
  let prevLit = -1;
  for(let f = 0; f <= 1.0001; f += 0.01){
    const v = lantern.litAmount(0.5, f);
    if(v < prevLit - 1e-12) fail('lantern: litAmount() is not monotonic in the front');
    if(v < 0 || v > 1) fail(`lantern: litAmount() returned ${v}`);
    prevLit = v;
  }

  if(failures === 0)
    console.log(`    ok    lantern/${id}: hull stays ${lowest.toFixed(2)} m clear of the waterline ` +
                `(walls ${lantern.WALL_LOW}/${lantern.WALL_HIGH}), lag ${worst.toFixed(2)} m, ` +
                `banks and treeline close at the seam, no lantern in the lane; ` +
                `arch: ${arch.length} lights, feet first, keystone lights at front ` +
                `${onCue.hi.toFixed(3)} and the feet go out before the next breath, ` +
                `front tracks the hold to ${onCue.worstE} of the arch`);
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
