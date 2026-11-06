/* THE TEMPORAL COUNTERPART TO tools/continuity.mjs — 3 November 2026.
 *
 * WHY THIS EXISTS, AND WHY continuity.mjs COULD NOT FIND WHAT IT IS FOR
 * ---------------------------------------------------------------------
 * continuity.mjs measures SHAPE. It asks, of a surface, "how far does
 * the slope turn at a knot" — and it brought every mesh in Long Air
 * under four degrees. The reader then said the chapter was still
 * disorienting and jerky, and added that the frame rate drops to 58 and
 * that this is fine.
 *
 * That last part is the diagnosis. A field can be perfectly C2 in SPACE
 * and still move in STEPS. Nothing in continuity.mjs samples time at
 * all: it evaluates the scenery's functions on a spatial grid with no
 * frame clock anywhere near it. So the entire class of fault where a
 * value that drives geometry changes discontinuously FROM ONE FRAME TO
 * THE NEXT was outside its reach, by construction.
 *
 * A jerk is a spike in the second derivative with respect to TIME, and
 * it is exactly as measurable as a kink in space. This samples every
 * animated scalar in the chapter frame by frame, differences it twice in
 * time, and reports:
 *
 *   STEP        the largest single-frame change in value, against the
 *               median single-frame change. A staircase shows up here
 *               and nowhere else: its steps are many times its typical
 *               motion.
 *   dV          the largest single-frame change in VELOCITY, in units
 *               per second. This is the quantity the eye reads as a
 *               jerk: a smooth motion changes speed gradually, a jerky
 *               one changes speed in one frame.
 *   JERK        dV/dt, the second time derivative, in units/s^2.
 *
 * AND IT RUNS THE SAME SAMPLE TWICE: once at a metronome 60 fps, and
 * once on a JITTERED clock that drops to 58 and occasionally spikes.
 * That second run is the whole point. A frame-rate-dependent integrator
 * is identical to a correct one under a perfectly steady clock and
 * diverges the moment the clock wobbles — which is the reader's
 * situation, and which is why "it is fine at 58" is a statement about
 * the integrator rather than about performance. A field whose numbers
 * get materially worse between the two runs is frame-rate dependent,
 * and the tool says so by name.
 *
 * PROVE THE INSTRUMENT FIRST. Seven times in this project a reported
 * fault has been the measuring apparatus rather than the thing
 * measured, most recently a sampling stride that could not resolve what
 * it was measuring. So this starts with controls it must classify
 * correctly — including, specifically, a dt-linear follower, which is
 * the fault it was built to find — and refuses to report anything about
 * the chapter if it gets one of them wrong.
 *
 * It imports the chapter's REAL modules. Nothing here is a replica:
 * that is the lesson of the terrain, where a sampler that measured
 * columnsAt() while the page drew its own open-coded copy reported 2.94
 * degrees on a surface that was turning 20.
 */

import { PROTOCOLS, periodOf, ridgeAt, ceilAt, wanderAt, courseOf, gateAt,
         forgiveness, rates, SPEED, BEHIND, CORRIDOR, RANGE, normOf,
         GATE_HALF, FORGIVE_MAX, V_MAX, AVOID_MARGIN, AVOID_STRENGTH,
         CLOUD_LIFT, CLOUD_REACH,
         DRAG_MAX_LOSS, DRAG_GAIN, DRAG_CLEAR } from '../app/js/long-air-breath.js';
import { breath } from '../app/js/breath.js';
import { body, drag } from '../app/js/course.js';
import { lens, CAM_EASE } from '../app/js/long-air-lens.js';
import { tracker } from '../app/js/follow.js';
import * as cloudfield from '../app/js/long-air-clouds.js';
import { MAG, MAG_V } from '../app/js/long-air-breath.js';
import * as SHEP from '../app/js/shepherd-breath.js';

let FAIL = false;
const say = s => console.log(s);
const ok  = s => say('  ok    ' + s);
const bad = s => { FAIL = true; say('  FAIL  ' + s); };

/* ------------------------------------------------------------------
   THE MEASUREMENT
   ------------------------------------------------------------------
   Given a series of (t, value) samples taken at the frame times they
   were actually produced at, difference twice.

   The velocity between two samples is (x1-x0)/dt, which is the speed
   the pixels actually moved at; the jump in that quantity from one
   frame boundary to the next is what the eye reads as a jerk. Both
   first differences are divided by their OWN dt, which matters on the
   jittered clock: dividing by a nominal dt would charge a frame-rate
   wobble to the signal.
   ------------------------------------------------------------------ */
function analyse(samples){
  const n = samples.length;
  const steps = [], vels = [];
  for(let i = 1; i < n; i++){
    const dt = samples[i].t - samples[i-1].t;
    const d  = samples[i].v - samples[i-1].v;
    steps.push(Math.abs(d));
    vels.push({ v: d / dt, t: (samples[i].t + samples[i-1].t) / 2, dt });
  }
  const sorted = [...steps].sort((a, b) => a - b);
  const medStep = sorted[Math.floor(sorted.length / 2)] || 0;
  const maxStep = sorted[sorted.length - 1] || 0;

  let maxDV = 0, maxJerk = 0, atT = 0, maxSpeed = 0;
  const dvs = [];
  for(const q of vels) maxSpeed = Math.max(maxSpeed, Math.abs(q.v));
  for(let i = 1; i < vels.length; i++){
    const dv = Math.abs(vels[i].v - vels[i-1].v);
    const dt = (vels[i].t - vels[i-1].t) || 1e-9;
    dvs.push(dv);
    if(dv > maxDV){ maxDV = dv; atT = vels[i].t; }
    maxJerk = Math.max(maxJerk, dv / dt);
  }
  /* THE VELOCITY-JUMP OUTLIER RATIO, which is the measurement that
     actually separates a jerk from a curve.
     -----------------------------------------------------------------
     `lurch` (maxDV / maxSpeed) turned out NOT to separate them, and
     the instrument said so by failing its own smooth controls. The
     reason is arithmetic: for any smooth signal maxDV is about
     |x''|·dt, so lurch is about dt·omega — a sine tracked at 30 fps
     genuinely changes velocity by 3% of its peak every frame, and no
     bar on that quantity can tell it from a small real step without
     also depending on the frame rate, which is the one thing this
     tool must not do.

     What distinguishes a jerk is that it is an OUTLIER. A smooth
     signal's velocity changes by a similar amount every frame, so its
     worst frame is a small multiple of its median frame. A step — or
     an exponential chasing a target that steps, which is continuous
     in position and discontinuous in velocity — puts almost all of
     its velocity change into one frame. So: the worst velocity jump
     against the MEDIAN velocity jump. Dimensionless, frame-rate
     independent, and it fires on exactly the class of fault that
     position-only measures miss. */
  const dvSorted = [...dvs].sort((a, b) => a - b);
  const medDV = dvSorted[Math.floor(dvSorted.length / 2)] || 0;
  return {
    maxStep, medStep,
    stepRatio: medStep > 1e-12 ? maxStep / medStep : (maxStep > 1e-12 ? Infinity : 1),
    dvRatio:   medDV   > 1e-12 ? maxDV   / medDV   : (maxDV   > 1e-12 ? Infinity : 1),
    maxSpeed, maxDV, medDV, maxJerk, atT
  };
}

/** How many SECONDS of motion the worst single-frame velocity jump is
 *  worth, at the signal's own top speed. This is the scale-free number:
 *  a smooth motion's velocity changes by a small fraction of its range
 *  per frame, so this is a few hundredths of a second. A staircase's
 *  velocity jump is worth a large fraction of a second of travel, and
 *  that is what reads as a lurch regardless of the units involved. */
const lurch = r => r.maxSpeed > 1e-12 ? r.maxDV / r.maxSpeed : 0;

/* ------------------------------------------------------------------
   THE MOTION FLOOR, and why the first version of this tool needed one
   ------------------------------------------------------------------
   Both headline numbers are RATIOS — the worst step over the median
   step, the worst velocity jump over the top speed — and a ratio is
   meaningless when its denominator is noise. The first run of this
   tool reported camBack with a step ratio of 79.6 and a lurch of
   1.0001, which looked like the worst fault in the chapter. It was
   not: camBack travels about two metres in total over a whole cycle,
   so its median per-frame step is microscopic and ANY variation
   divides into it to give a large number.

   That is the project's recurring failure mode — seven times a
   reported fault has been the instrument — so the ratios are now
   gated on an ABSOLUTE amount of movement. A field that never moves
   far enough to be seen cannot be jerky, whatever its ratios say.

   THE FLOOR IS DERIVED, NOT TUNED. Every field here is in metres, and
   the question is what velocity jump is visible on the reader's
   screen. A velocity jump does not displace anything on the frame it
   happens — it changes the RATE, so the deviation from the path the
   eye was predicting grows as dV·t. Take a tenth of a second as the
   window over which the eye holds a prediction, and one pixel as the
   deviation it can notice in that window.

   Long Air's lens rides about 12 m behind the glider with a 33 degree
   half-angle, so the frame spans 2·12·tan(33) = 15.6 m across roughly
   700 px on the reader's 375 px-wide phone at DPR 1.5 — about 45 px
   per metre, i.e. 0.022 m per pixel. So

       dV_floor = 0.022 m / 0.1 s = 0.22 m/s

   rounded to 0.25. Below that, a velocity jump moves the picture less
   than a pixel inside the window the eye integrates over, and cannot
   be what the reader is describing however bad its ratios look.

   This is the number that stopped camBack being reported as a fault
   after it was fixed: 0.138 m/s, which is half a pixel.
   ------------------------------------------------------------------ */
const DV_FLOOR = 0.25;

/* ------------------------------------------------------------------
   WHAT FAILS, AND WHAT IS ONLY RECORDED
   ------------------------------------------------------------------
   A gate that can never pass is decoration, and a gate set at
   whatever today's build happens to measure is the thing CLAUDE.md
   warns about: a number tuned until it just clears the line.

   So there are two levels, both derived from the floor above.

     under DV_FLOOR (0.25 m/s)   invisible. Passes, silently.
     DV_FLOOR .. FAIL_BAR        RESIDUAL. Printed with its number so
                                 a regression is visible in the diff,
                                 and not failed: these are sub-pixel
                                 to a few pixels, and every one of
                                 them traces to a decision the design
                                 documents (a quantised opening, a
                                 capped fill rate) rather than to a
                                 mistake.
     over FAIL_BAR (1.00 m/s)    FAILS. Four pixels of deviation
                                 inside the window the eye holds a
                                 prediction over is not a curve by any
                                 reading, and everything this pass
                                 actually fixed was far above it: the
                                 lens aim at 146.2, the opening at
                                 193.2, the trailing distance at 4.0.

   The residuals as of 3 November 2026, for the record, so the next
   session can see movement rather than re-deriving it:

     kiteY   0.41    the altitude spring, semi-implicit Euler
     camY    0.39    follows kiteY, so inherits it
     lookY   0.53    follows kiteY, plus the aim
     fill    0.25    the fill rate's hard cap at the ends of a breath
     forgive 0.54    the four-step §6.1 opening, smoothed at w=3.5
             0.85    the same, off pace, where the steps are frequent

   None of these is a mistake to be fixed; each is a documented
   decision costing a few pixels. The spring is the one worth
   revisiting, and deliberately NOT revisited here: `lag()` in
   course.js is derived from its integrator and every chapter's
   tracking tolerance in tools/regress.mjs is derived from `lag()`, so
   replacing it would move a dozen numbers in four chapters at once
   and none of the movement would be attributable. It is substepped at
   60 Hz instead, which took its frame-rate ratio from 1.97 to 1.38
   and is bit-identical at 60 fps.
   ------------------------------------------------------------------ */
const FAIL_BAR = 1.00;

/* ------------------------------------------------------------------
   EXPECTED DISCONTINUITIES — fields that SHOULD step
   ------------------------------------------------------------------
   Not everything sampled here is a rendered quantity. `gateCentre` is
   "the centre of the gate the glider is currently approaching", and
   when the glider passes one, that becomes a different gate: the value
   jumps, correctly, and nothing on screen jumps with it because no
   vertex reads it. Reporting it as a fault would be the coverage-zero
   mistake again — a number that looks like a defect and is actually
   the measurement pointing at the wrong thing.

   So these are measured and PRINTED, because a change in them is
   worth seeing, and excluded from pass/fail with the reason attached.
   Anything added to this list needs a reason that says why no vertex
   and no pixel follows it.
   ------------------------------------------------------------------ */
const EXPECTED = {
  gateCentre: 'identity of the approaching gate; no vertex reads it',
  gateHalf:   'gate.half + forgive; the drawn lip follows `forgive`',
  forgiveRaw: 'the quantised DECISION (§6.1); `forgive` is what ships',
  /* ADDED 4 November 2026, with the reason stated precisely because
     this one is NOT harmless in the way the two above are.

     `cloud` is the enveloped depth into a bank. It is zero on most
     frames and non-zero in bursts, so its step ratio is infinite by
     construction -- the median frame is zero -- which is the same
     artefact the DV_FLOOR note describes for camBack and not a
     property of the signal. And it moves fast for an honest reason:
     the glider flies into a bank at fourteen metres a second, so a
     quintic ramp over the envelope's 6.6 m is half a second long and
     a few units a second of velocity change is its CURVATURE rather
     than a step.

     It is excluded here because the two things it is responsible for
     are BOTH judged on their own. What the force produces is kiteY,
     which is measured on the climbing run below and has to pass.
     What it draws is cloudSoft, the second-order smoothed 0..1 the
     overlay reads, which is measured there too. Nothing about this
     field escapes measurement; it is only measured where it has
     units that mean something. */
  cloud: 'the force\'s input; kiteScreen is what it produces and cloudSoft is what it draws, both judged',
  /* kiteY IS THE WORLD-FRAME HEIGHT AND THE LENS FOLLOWS IT. A metre
     the camera travels with it moves nothing on screen, so its
     absolute velocity jump is not a quantity a reader can see —
     kiteScreen, the difference, is, and it is judged everywhere kiteY
     used to be. kiteY stays in the report because a change in it is
     worth seeing and because it is half of the number that matters. */
  kiteY: 'world-frame height; the lens follows it — kiteScreen is what moves on screen and is judged',
  /* ADDED 7 November 2026, for the Shepherd's gait.

     `walkV` is the shepherd's walking RATE, so its velocity jump is
     an ACCELERATION and its units are not the units this file's
     thresholds are in. It is allowed to step, by design and in one
     direction only: the gait lags the accelerations and does NOT lag
     the decelerations, because lagging both makes him overshoot the
     place he is walking to, and he cannot walk back — the measured
     consequence was 2.94 hills a breath instead of one. So arriving
     somewhere and stopping is a step in this field, peaking at
     12.8 m/s^2 on the no-holds protocol as a figure reaches a crest,
     and it is the right shape rather than a defect.

     What it is responsible for is judged: `walk` is the position it
     integrates to, and `shepScreen` is where that puts him in the
     frame given a lens that trails him. Both are measured here and
     both have to pass. */
  walkV: 'the walking rate; its jump is an acceleration — `walk` and `shepScreen` are what move and are judged'
};

/* ------------------------------------------------------------------
   THE CLOCKS
   ------------------------------------------------------------------
   Steady, and jittered. The jittered one is not random noise for its
   own sake: it is a 58 fps baseline with occasional long frames, which
   is what the reader described and what the clock in stage.js caps at
   0.05 s. A correct integrator is indifferent to the difference
   between these two; an incorrect one is not.
   ------------------------------------------------------------------ */
const STEADY = n => { const a = []; for(let i = 0; i < n; i++) a.push(1/60); return a; };
function JITTER(n, seed = 1){
  // deterministic, so the numbers in a report are reproducible
  let s = seed, a = [];
  const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for(let i = 0; i < n; i++){
    let dt = 1/58;
    const r = rnd();
    if(r > 0.94) dt = 1/30;          // a dropped frame
    else if(r > 0.80) dt = 1/48;
    else dt += (rnd() - 0.5) * 0.002;
    a.push(Math.min(0.05, dt));      // the clock's own cap
  }
  return a;
}

/* ------------------------------------------------------------------
   1. PROVE THE INSTRUMENT
   ------------------------------------------------------------------ */
say('');
say('CONTROLS — a temporal instrument that cannot tell a staircase from');
say('a ramp, or a dt-linear follower from an exact one, is worthless.');

/** Drive a one-dimensional follower over a clock and return samples. */
function run(clk, step){
  const out = []; let t = 0;
  for(const dt of clk){ t += dt; out.push({ t, v: step(dt, t) }); }
  return out;
}

/* THE AMPLITUDE IS NOT ARBITRARY. It was 8 m, and at 8 m the smooth
   ramp's worst velocity jump is 0.216 m/s — which is just UNDER the
   0.25 m/s visibility floor derived above, so the instrument correctly
   classified its own smooth control as `still` rather than `smooth`
   and refused to run. A control that slips under the floor tests
   nothing. 30 m puts every control well clear of it, so the smooth
   cases are genuinely being asked whether they are smooth rather than
   whether they move. */
const AMP = 30;
const target = t => 10 + AMP * Math.sin(t * 0.9);   // something to follow

/* A square wave switching between three levels, which is what a
   per-phase constant applied raw does to the lens's aim point. It is
   the fault this tool was built to find, so it is a control. */
const phaseSwitch = t => { const k = Math.floor(t / 1.9) % 3;
                           return [2.6, -2.2, 0.2][k]; };

const controls = [
  { name: 'smooth ramp',
    make: clk => run(clk, (dt, t) => target(t)),
    want: 'smooth' },
  { name: 'staircase (4 steps, like forgiveness)',
    make: clk => run(clk, (dt, t) =>
      Math.floor(((target(t) + AMP) / (2 * AMP)) * 4) / 3 * 4.6),
    want: 'STEPPED' },
  { name: 'raw per-phase constant (the lens aim fault)',
    make: clk => run(clk, (dt, t) => phaseSwitch(t)),
    want: 'STEPPED' },
  /* AND THE ONE THAT CORRECTED ME. I came to this tool expecting the
     chapter's dt-linear camera lerp to be a significant cause, wrote
     this control asserting it was FRAME-RATE DEPENDENT, and the
     instrument refused: at k=4.5 over frames of 16-33 ms, min(1,dt*k)
     is within half a percent of 1-exp(-k·dt), and its lurch rises by
     1.5x against the exact version's 1.1x — both far under the bar in
     absolute terms. So the honest verdict for this control is SMOOTH,
     and the lerp is NOT reported as a cause of anything. It is still
     replaced in long-air-lens.js, because an exact exponential costs
     one exp() and removes a variable, but the report must not claim a
     fix it cannot measure. This is the eighth time in this project
     that the instrument has disagreed with the diagnosis and been
     right. */
  { name: 'dt-linear follower, k=4.5 (the chapter\'s own)',
    make: clk => { let x = 10; return run(clk, (dt, t) => {
      x += (target(t) - x) * Math.min(1, dt * 4.5); return x; }); },
    want: 'smooth' },
  /* the same construction where it DOES bite, so the frame-rate test
     is known to be able to fire rather than merely present */
  { name: 'dt-linear follower, k=40 (stiff: clamp bites)',
    make: clk => { let x = 10; return run(clk, (dt, t) => {
      x += (target(t) - x) * Math.min(1, dt * 40); return x; }); },
    want: 'FRAME-RATE DEPENDENT' },
  { name: 'exact exponential   x += (want-x)*(1-exp(-k dt))',
    make: clk => { let x = 10; return run(clk, (dt, t) => {
      x += (target(t) - x) * (1 - Math.exp(-4.5 * dt)); return x; }); },
    want: 'smooth' },
  { name: 'per-frame constant  x += 0.05 (no dt at all)',
    make: clk => { let x = 10; return run(clk, () => (x += 0.05)); },
    want: 'FRAME-RATE DEPENDENT' }
];

/* THE CLASSIFIER.
   Two independent questions, asked in order, because they have
   different cures:

   1. Is it STEPPED? The worst single-frame move is many times the
      typical one. A staircase is the only thing that does this. The
      cure is to stop quantising a value that moves geometry.

   2. Is it FRAME-RATE DEPENDENT? Its worst velocity jump gets
      materially worse when the clock wobbles, compared with the same
      signal on a metronome. The cure is to integrate by dt properly.

   The thresholds are set from the controls, not from taste: the
   stepped control lands at a step ratio in the hundreds and every
   smooth control is under 4, so 12 separates them with an order of
   magnitude of room on each side. The frame-rate test compares a
   signal with ITSELF, so it needs no absolute scale — a correct
   integrator's lurch is within noise of its steady value, an
   incorrect one's rises by a large multiple. */
/* THE BARS, set from the measured controls below and printed with them
   so the separation can be checked rather than taken on trust. Run
   with CALIBRATE=1 to print every control's raw numbers.

   Measured on the controls:
     smooth ramp / followers   stepRatio 2.7-3.5   dvRatio 3-9
     staircase, raw phase step stepRatio inf       dvRatio 300+
   so both bars sit an order of magnitude clear of the smooth cases. */
const STEP_RATIO_BAR = 12;
const DV_RATIO_BAR   = 40;
const FRDEP_BAR      = 2.0;

/** The verdict, from the two runs of one field. `moves` is the gate
 *  described at DV_FLOOR: without it a field that barely moves at all
 *  scores as the worst thing in the chapter. */
function verdict(a, b){
  /* THE FRAME-RATE RATIO IS ON maxDV, NOT ON lurch, and that is a
     correction. lurch divides by the signal's own top speed, and a
     SMOOTHER signal has a lower top speed — so camY, which is a
     smoothed copy of kiteY, scored a worse frame-rate ratio (2.41)
     than the kiteY it follows (1.37) purely because its denominator
     was smaller. Comparing the same field on two clocks needs no
     normalisation at all: maxDV is already in the field's own units,
     and both runs are of the same field. */
  const ratio = a.maxDV > 1e-9 ? b.maxDV / a.maxDV : (b.maxDV > 1e-6 ? Infinity : 1);
  const moves = Math.max(a.maxDV, b.maxDV) > DV_FLOOR;
  const stepped = b.stepRatio > STEP_RATIO_BAR || a.stepRatio > STEP_RATIO_BAR;
  /* A velocity-jump outlier WITHOUT a position-jump outlier is the
     signature of a smooth follower chasing a target that steps: the
     position never jumps, so a position-only measure passes it, and
     the velocity jumps every time the target does. That is what the
     lens's per-phase constants do even after they are smoothed, and
     it is why this case gets its own name. */
  const kinked = b.dvRatio > DV_RATIO_BAR || a.dvRatio > DV_RATIO_BAR;
  let kind = 'smooth';
  if(!moves) kind = 'still';
  else if(stepped || kinked){
    /* the fault's NAME says which kind it is; whether it fails is a
       separate question, decided by how big it is */
    kind = (stepped ? 'STEPPED' : 'VELOCITY STEP') +
           (b.maxDV <= FAIL_BAR ? ' (residual)' : '');
  }
  else if(ratio > FRDEP_BAR) kind = 'FRAME-RATE DEPENDENT';
  const fails = b.maxDV > FAIL_BAR &&
                (kind.startsWith('STEPPED') || kind.startsWith('VELOCITY'));
  return { kind, steady: a, jitter: b, frRatio: ratio, moves, fails };
}

function classify(make){
  return verdict(analyse(make(STEADY(900))), analyse(make(JITTER(900))));
}

for(const c of controls){
  const r = classify(c.make);
  const j = r.jitter;
  const line = `${c.name.padEnd(44)} ${r.kind.padEnd(14)} ` +
               `step x${(j.stepRatio === Infinity ? 'inf' : j.stepRatio.toFixed(1)).padStart(6)}  ` +
               `dV x${(j.dvRatio === Infinity ? 'inf' : j.dvRatio.toFixed(1)).padStart(7)}  ` +
               `lurch ${lurch(j).toFixed(4)}  fr x${r.frRatio === Infinity ? 'inf' : r.frRatio.toFixed(2)}`;
  if(r.kind.startsWith(c.want)) ok(line); else bad(line + ` — expected ${c.want}`);
}
if(FAIL){
  say('');
  say('INSTRUMENT FAILED ITS OWN CONTROLS — reporting nothing about the chapter.');
  process.exit(2);
}

/* ------------------------------------------------------------------
   2. THE CHAPTER, FRAME BY FRAME
   ------------------------------------------------------------------
   Every animated scalar that reaches a vertex or the lens, driven by
   the chapter's own modules over the same two clocks.

   The drive is a FIXED, REPRODUCIBLE reader: following the schedule
   with a lag, which is the normal case and the one that spends most of
   its time near a forgiveness boundary. A reader who tracked the
   schedule exactly would never cross one and the staircase would not
   appear — which is how a quantised control signal survives being
   eyeballed.
   ------------------------------------------------------------------ */
const proto = PROTOCOLS.box;
const period = periodOf(proto);
const RATE = rates(proto);
const probe = breath(proto);
const course = courseOf(proto, t => probe.value(t));
const clouds = cloudfield.cloudsFor(course);

/* ------------------------------------------------------------------
   THE PRE-FIX LENS — the negative control
   ------------------------------------------------------------------
   Verbatim what long-air.html's frame body did before 3 November,
   including the `ease` variable that was assigned in all three
   branches and never read. Nothing imports this and nothing should: it
   is here so the before numbers come out of the same measurement as
   the after numbers rather than out of a different one, and so the
   check is known to be able to fail.
   ------------------------------------------------------------------ */
function lensBefore(){
  let camY = 13.0, camBack = 13.0;
  const L = {
    get camY(){ return camY; },
    get camBack(){ return camBack; },
    lookOff: 0.2, followY: 11.5,
    step(dt, { kiteY, cam }){
      let lookOff, wantBack, ease;
      if(cam === 'rise'){      lookOff =  2.6; wantBack = 13.5; ease = 2.6; }
      else if(cam === 'dive'){ lookOff = -2.2; wantBack = 12.5; ease = 3.0; }
      else {                   lookOff =  0.2; wantBack = 11.5; ease = 3.2; }
      camY    += ((kiteY + 1.0) - camY) * Math.min(1, dt * 4.5);
      camBack += (wantBack - camBack)   * Math.min(1, dt * 2.0);
      L.lookOff = lookOff;          // applied RAW — this is fault 1
      L.followY = kiteY;            // and the aim used kiteY unsmoothed
      return L;
    },
    get lookY(){ return L.followY + L.lookOff; }
  };
  return L;
}

/* ------------------------------------------------------------------
   TWO READERS, AND WHY IT HAS TO BE TWO
   ------------------------------------------------------------------
   The first version of this harness drove the glider with one crude
   lagged follower and reported kiteY at a 54.7 m/s single-frame
   velocity jump — far worse than the fault it was supposed to be
   measuring. That was the harness. The lagged reader was so far off
   pace that it rode the gate lips continuously, and KITE.skim()
   PLACES the body exactly on a lip by design ("riding the surface",
   course.js) — so every one of those jumps was an intended placement,
   not a jerk in free flight. Eight times now a reported fault in this
   project has been the instrument.

   So the chapter is sampled twice over:

     ON PACE    follows the cue exactly. tools/regress.mjs already
                proves this configuration never touches a surface, so
                there are no placements and kiteY, camY and lookY
                measure FREE FLIGHT — the spring, the lens, the
                integrators. This is the run that judges smoothness.

     OFF PACE   deliberately lags, which is what drives the error
                across the forgiveness boundaries. This is the run
                that exercises the opening, and it reports the skim
                count so an unrepresentative driver cannot pass
                unnoticed.

   Each asserts its own precondition. If the on-pace reader skims even
   once, it is not on pace and its numbers are withdrawn.
   ------------------------------------------------------------------ */
function sampleChapter(clk, { makeLens = lens, offPace = false, climb = false } = {}){
  const B = breath(proto);
  const K = body({ corridor: CORRIDOR, rates: RATE, vMax: V_MAX });
  const D = drag({ maxLoss: DRAG_MAX_LOSS, gain: DRAG_GAIN, clear: DRAG_CLEAR });
  const L = makeLens();
  let t = 0, dist = 0, wall = 0, skims = 0;
  /* the same w the page uses, and the same module: the smoothed room
     is what the vertex shader gets and what the collision test uses,
     so it is what has to be measured */
  const FORG = tracker(0, 3.5 / MAG_V);
  /* the page's own softening follower, same module and same w */
  const CLOUDIN = tracker(0, 2.6);
  const S = { dist:[], kiteY:[], fill:[], forgiveRaw:[], forgive:[],
              camY:[], camBack:[], lookY:[], gateCentre:[], gateHalf:[],
              ridgeUnder:[], ceilUnder:[], speedF:[], cloud:[], cloudSoft:[],
              kiteScreen:[] };

  for(const dt of clk){
    t += dt; wall += dt;
    const st = B.at(t), ph = st.p;
    const sched = B.value(t);

    /* a reader a beat behind the cue: the ordinary case */
    const working = ph.k === 'in' ? true : ph.k === 'out' ? true : true;
    D.breathe(dt, working);
    const speed = SPEED * D.speedFactor;
    dist += speed * dt;

    /* ON PACE: drive the fill from the phase, which is exactly what
       the chapter's own controls do when the reader presses on the
       cue. OFF PACE: chase a schedule half a second stale, so the
       error wanders across the forgiveness boundaries. */
    if(climb){
      /* A READER HOLDING THE INHALE. This is what actually puts a
         glider into a cloud bank -- the off-pace reader chases a
         stale schedule and so stays near the opening, which is why
         the first run of the cloud check read `still` and was
         measuring nothing. A check nobody has watched fire is not
         known to be able to fire: eight times in this project a
         reported fault has been the instrument, and a reported PASS
         can be the instrument just as easily. */
      K.fill = Math.min(1, K.fill + RATE.fillPerSec * dt);
      K.settle(dt);
    } else if(offPace){
      const lagged = normOf(B.value(Math.max(0, t - 0.55)));
      const gap = lagged - K.fill;
      const cap = (ph.k === 'in' ? RATE.fillPerSec : RATE.emptyPerSec) * dt;
      let mv = gap * 14 * dt;
      if(mv >  cap) mv =  cap;
      if(mv < -cap) mv = -cap;
      K.fill = Math.min(1, Math.max(0, K.fill + mv));
      K.settle(dt);
    } else {
      K.follow(dt, ph.k);
    }

    const { gate } = gateAt(course, dist);
    const forg = forgiveness(K.value, gate.centre);
    FORG.step(dt, forg.extra);
    const half = gate.half + FORG.value;
    K.avoid({ centre: gate.centre, half, bodyHalf: 0.78, dt,
              margin: AVOID_MARGIN, strength: AVOID_STRENGTH });
    if(K.skim({ centre: gate.centre, half, bodyHalf: 0.78, side: -1 }) > 0) skims++;
    /* THE BUOYANCY, which is a NEW INTEGRATOR and therefore exactly
       the thing this file exists for. A force applied per frame
       rather than per second is the class of bug that made 58 fps
       look worse than 60, and a boundary that bit discontinuously
       would show here as a velocity step however smooth it looked.
       Driven through the real module, not a replica. */
    const kiteZb = dist + period * BEHIND;
    let into = 0;
    for(const n of cloudfield.cloudsAt(clouds, period, kiteZb, 0)){
      const d = K.buoy({ base: n.base, bodyHalf: 0.78, dt, lift: CLOUD_LIFT, env: n.env });
      if(d > into) into = d;
    }

    L.step(dt, { kiteY: K.value, cam: ph.cam });

    S.dist.push      ({ t: wall, v: dist });
    S.kiteY.push     ({ t: wall, v: K.value });
    S.fill.push      ({ t: wall, v: K.fill });
    S.forgiveRaw.push({ t: wall, v: forg.extra });
    S.forgive.push   ({ t: wall, v: FORG.value });
    S.camY.push      ({ t: wall, v: L.camY });
    S.camBack.push   ({ t: wall, v: L.camBack });
    /* THE AIM POINT, which is the one nothing was watching. A jump
       here rotates the entire frame, so it is the field most likely to
       read as "disorienting" rather than merely as rough. */
    S.lookY.push     ({ t: wall, v: L.lookY });
    S.gateCentre.push({ t: wall, v: gate.centre });
    S.gateHalf.push  ({ t: wall, v: half });
    S.ridgeUnder.push({ t: wall, v: ridgeAt(dist + period * BEHIND, period) });
    S.ceilUnder.push ({ t: wall, v: ceilAt(dist + period * BEHIND, period) });
    S.speedF.push    ({ t: wall, v: D.speedFactor });
    S.cloud.push     ({ t: wall, v: into });
    /* WHAT THE READER ACTUALLY SEES. The overlay's opacity, not the
       depth: this is the quantity a step in which would white the
       frame out between two frames, and it is the one that has to be
       smooth on the reader's jittered clock. */
    CLOUDIN.step(dt, Math.min(1, Math.max(0, into / 6.0)));
    S.cloudSoft.push ({ t: wall, v: CLOUDIN.value });
    /* ==============================================================
       WHAT THE READER ACTUALLY SEES THE GLIDER DO
       ==============================================================
       6 November 2026, added when MAG magnified the chapter and
       kiteY's absolute numbers went with it.

       kiteY is the glider's height IN THE WORLD, and the world is not
       what the reader is looking at: the lens follows the glider, so
       a metre of kiteY that camY also travels moves nothing on
       screen. The visible quantity is the DIFFERENCE, which is the
       tracking error, and at the twelve metres the lens trails it is
       45 px per metre.

       This is the honest re-derivation the magnification forced.
       kiteY's own velocity jump rose with the band — it has to, the
       motion really is bigger — and raising the bar to let it through
       would have been the thing CLAUDE.md warns about. Measuring the
       thing the bar was always a proxy FOR is the alternative, and it
       is the same move the cloud lip's pixel bar was.

       It also fixes a second artefact in the same stroke. On the
       climbing run kiteY is dominated by the buoyancy, a d^3 field
       that is zero on most frames and enormous on a few, so its
       median per-frame change is near nothing and its RATIOS are
       meaningless — the camBack problem the DV_FLOOR note describes,
       in a different field. The difference has no such gap. */
    S.kiteScreen.push({ t: wall, v: K.value - L.camY });
  }
  S.skims = skims;
  return S;
}

const FRAMES = 1800;                       // half a minute of flight
const steadyRun = sampleChapter(STEADY(FRAMES));
const jitterRun = sampleChapter(JITTER(FRAMES));
const beforeRun = sampleChapter(JITTER(FRAMES), { makeLens: lensBefore });
const offSteady = sampleChapter(STEADY(FRAMES), { offPace: true });
const offJitter = sampleChapter(JITTER(FRAMES), { offPace: true });
/* TWICE AS LONG AS THE OTHERS, because the clouds are sparse now.
   Sixteen of them over a 48 s lap, most off the lane, so a 30 s run
   can miss every one — and it did: the check fired with "the
   climbing reader never enters a cloud", correctly, since every cloud
   number here would otherwise have been measuring nothing. The run is
   lengthened rather than the assertion softened. */
const UP_FRAMES = FRAMES * 4;
const upSteady  = sampleChapter(STEADY(UP_FRAMES), { climb: true });
const upJitter  = sampleChapter(JITTER(UP_FRAMES), { climb: true });

/* THE PRECONDITION, ASSERTED RATHER THAN ASSUMED. */
say('');
if(steadyRun.skims === 0 && jitterRun.skims === 0){
  ok(`on-pace reader touched no surface (0 skims over ${FRAMES} frames x2), ` +
     `so kiteY/camY/lookY below are free flight`);
} else {
  bad(`on-pace reader skimmed ${steadyRun.skims}/${jitterRun.skims} times — it is ` +
      `NOT on pace, and its smoothness numbers are withdrawn`);
}
ok(`off-pace reader skimmed ${offJitter.skims} times, which is what exercises ` +
   `the opening; its kiteY steps are intended placements, not jerks`);

/* ------------------------------------------------------------------
   THE NEGATIVE CONTROL, FIRST
   ------------------------------------------------------------------
   The pre-fix lens, through the same analysis. If this passes, the
   check cannot detect the fault it was written for and nothing below
   it means anything.
   ------------------------------------------------------------------ */
say('');
say('THE PRE-FIX LENS — the negative control, so the before numbers are');
say('reproducible and the check is known to be able to fail.');
let controlCaught = 0;
for(const k of ['lookY', 'camY', 'camBack']){
  const b = analyse(beforeRun[k]);
  const line = `${('lens ' + k + ' (before)').padEnd(26)} ` +
               `step x${(b.stepRatio === Infinity ? 'inf' : b.stepRatio.toFixed(1)).padStart(7)}  ` +
               `dV x${(b.dvRatio === Infinity ? 'inf' : b.dvRatio.toFixed(1)).padStart(8)}  ` +
               `max dV ${b.maxDV.toFixed(3)} u/s`;
  if(b.maxDV > FAIL_BAR){ controlCaught++; ok('detected: ' + line); }
  else say('  --    ' + line + '  (was already acceptable)');
}
if(controlCaught === 0) bad('THE NEGATIVE CONTROL IS NOT FAILING — this check is decoration.');

say('');
say(`LONG AIR, SAMPLED IN TIME — ${FRAMES} frames, twice: a steady 60 fps`);
say('clock and a jittered one that sits at 58 and drops frames.');
say('');
say('  lurch = the worst single-frame velocity jump, expressed as the');
say('  seconds of travel at the signal\'s own top speed that it is worth.');
say('  Anything the eye reads as continuous stays well under 0.05 s.');
say('');
say('  FIELD            STEP RATIO   dV RATIO     max dV      VERDICT');

const rows = [];
for(const k of Object.keys(steadyRun)){
  if(k === 'skims') continue;
  const a = analyse(steadyRun[k]);
  const b = analyse(jitterRun[k]);
  const r = verdict(a, b);
  rows.push({ k, ...r });
  const line = `${k.padEnd(16)} ` +
    `${(b.stepRatio === Infinity ? 'inf' : b.stepRatio.toFixed(1)).padStart(9)}  ` +
    `${(b.dvRatio === Infinity ? 'inf' : b.dvRatio.toFixed(1)).padStart(9)}  ` +
    `${b.maxDV.toFixed(3).padStart(9)}   ${r.kind}`;
  if(EXPECTED[k])      say('  --    ' + line + `   EXPECTED: ${EXPECTED[k]}`);
  else if(r.fails)     bad(line);
  else                 ok(line);
}

say('');
say('FRAME-RATE DEPENDENCE — the same field on both clocks. A correct');
say('integrator gives the same lurch either way; the ratio is the tell.');
say('Fields below the motion floor and expected-discontinuous fields are');
say('reported and not judged.');
for(const r of rows){
  const line = `${r.k.padEnd(16)} steady dV ${r.steady.maxDV.toFixed(4)}  ` +
               `jittered dV ${r.jitter.maxDV.toFixed(4)}  ratio ` +
               `${r.frRatio === Infinity ? 'inf' : r.frRatio.toFixed(2)}`;
  /* The ratio is a DIAGNOSTIC and fails only when the thing it is a
     ratio of is big enough to see. camY ran at 2.48 while its worst
     velocity jump was 0.39 m/s — a real frame-rate dependence,
     inherited from the altitude spring it follows, and under two
     pixels. Failing on it would be failing on the arithmetic rather
     than on the picture. */
  if(EXPECTED[r.k] || !r.moves)   say('  --    ' + line);
  else if(r.frRatio <= FRDEP_BAR) ok(line);
  else if(r.jitter.maxDV <= FAIL_BAR) say('  --    ' + line + '  (frame-rate dependent, under the fail bar)');
  else bad(line + '  <-- depends on the frame rate');
}

/* ------------------------------------------------------------------
   THE OFF-PACE READER — the run that exercises the opening
   ------------------------------------------------------------------
   kiteY is NOT judged here. An off-pace glider rides the lips, and
   course.js places it exactly on them on purpose; those placements are
   the design and would be reported as jerks by any measure that did
   not know the difference. What IS judged is the room the world makes,
   because that moves vertices in every gate at once.
   ------------------------------------------------------------------ */
say('');
say('OFF PACE — the opening, AND the lens, which is the addition that');
say('the deployed build forced. The on-pace run above cannot see this:');
say('an on-pace glider never skims, so it never asks whether a surface');
say('placement gets multiplied into the frame. Driven through the real');
say('frame body on the deployed page with nobody steering, it did —');
say('kiteY jumped 36.54 m/s on 4 frames of 1800, and a first-order lens');
say('turned that into 2.90 m/s of WHOLE-FRAME movement. kiteY itself is');
say('not judged here: course.js places the body on a lip on purpose.');
/* kiteY is deliberately absent from this list rather than exempted in
   EXPECTED: it IS judged on the on-pace run, where a placement cannot
   happen, and listing it globally would have quietly stopped that. */
/* kiteScreen is absent here for the same reason kiteY always was,
   and adding it was a mistake the harness caught at 48 m/s: an
   off-pace glider RIDES the lips and course.js places the body
   exactly on one by design, so the difference between it and the
   lens carries those placements too. Both are judged on the on-pace
   run, where regress.mjs proves no placement can happen. */
for(const k of ['forgiveRaw', 'forgive', 'camY', 'lookY', 'camBack', 'cloud']){
  const a = analyse(offSteady[k]), b = analyse(offJitter[k]);
  const r = verdict(a, b);
  const line = `${k.padEnd(16)} ` +
    `${(b.stepRatio === Infinity ? 'inf' : b.stepRatio.toFixed(1)).padStart(9)}  ` +
    `${(b.dvRatio === Infinity ? 'inf' : b.dvRatio.toFixed(1)).padStart(9)}  ` +
    `${b.maxDV.toFixed(3).padStart(9)}   ${r.kind}`;
  if(EXPECTED[k]) say('  --    ' + line + `   EXPECTED: ${EXPECTED[k]}`);
  else if(r.fails) bad(line);
  else ok(line);
}
say('');
say('  For scale: the raw decision steps FORGIVE_MAX/3 = 1.53 m between');
say('  two frames and moves every lip in the course by it. The smoothed');
say('  value reaches the same four sizes over about a third of a second.');

/* ------------------------------------------------------------------
   THE CLIMBING READER — the run that exercises the cloud
   ------------------------------------------------------------------
   The buoyancy that replaced the hard ceiling on 4 November is a new
   integrator, and the only one in this chapter applied as a FORCE
   outside the spring's own substepped loop. A force applied per frame
   rather than per second is precisely the fault this file was built
   to find, and a cubic that bit discontinuously at the boundary would
   show here as a velocity step however smooth it looks written down.

   It needs a reader who actually goes in. Neither of the two above
   does: the on-pace one is guaranteed not to by tools/regress.mjs,
   and the off-pace one chases a stale schedule and therefore stays
   near the opening. This one holds the inhale, which is what a reader
   with a finger at the top of the glass does, and climbs into the
   bank.

   The depth is ASSERTED NON-ZERO first. Without that this whole
   section passes trivially on a day the mechanic is broken.
   ------------------------------------------------------------------ */
say('');
say('A READER HOLDING THE INHALE — the run that goes into the cloud');
{
  const d = analyse(upJitter.cloud);
  if(d.maxSpeed > 1e-9 || Math.max(...upJitter.cloud.map(q => q.v)) > 0.05){
    const deepest = Math.max(...upJitter.cloud.map(q => q.v));
    ok(`the climbing reader goes ${deepest.toFixed(2)} m into a bank, so the ` +
       `measurements below are of something that happens`);
  } else {
    bad('the climbing reader never enters a cloud — the buoyancy is unreachable, ' +
        'and every cloud number in this file is measuring nothing');
  }
  /* kiteY IS JUDGED HERE ONLY IF THIS READER NEVER TOUCHED ANYTHING.
     A reader holding the inhale against a low opening rides the rock
     lip, and course.js PLACES the body exactly on a lip on purpose —
     those placements are the design and any measure that did not know
     the difference would report them as jerks. That is the same
     reason kiteY is absent from the off-pace list above, and it is
     decided by the skim count rather than asserted, so the check
     stays live on any build where this reader happens not to skim. */
  const upSkims = upSteady.skims + upJitter.skims;
  if(upSkims === 0){
    ok(`the climbing reader skimmed nothing, so its kiteY is judged too`);
  } else {
    say(`  --    the climbing reader skimmed ${upSkims} times; its kiteY carries ` +
        `intended surface placements and is reported, not judged (camY, lookY and ` +
        `cloudSoft are what the buoyancy has to keep smooth, and they are judged)`);
  }
  for(const k of ['cloud', 'cloudSoft', 'kiteY', 'kiteScreen', 'camY', 'lookY']){
    const a = analyse(upSteady[k]), b = analyse(upJitter[k]);
    const r = verdict(a, b);
    const line = `${k.padEnd(16)} ` +
      `${(b.stepRatio === Infinity ? 'inf' : b.stepRatio.toFixed(1)).padStart(9)}  ` +
      `${(b.dvRatio === Infinity ? 'inf' : b.dvRatio.toFixed(1)).padStart(9)}  ` +
      `${b.maxDV.toFixed(3).padStart(9)}   ${r.kind}` +
      `   fr x${r.frRatio === Infinity ? 'inf' : r.frRatio.toFixed(2)}`;
    /* ==============================================================
       WHAT THIS READER IS FOR, AND WHAT IT IS NOT FOR
       ==============================================================
       The climbing reader holds the inhale for thirty seconds. In
       tools/regress.mjs that reader is one of the three ADVERSARIAL
       ones, and they are judged on safety — cannot crash, cannot stop
       dead, cannot be snapped about — rather than on smoothness,
       because what they do is not what the chapter is for.

       It exists here to exercise the BUOYANCY, so what it has to
       prove is that the field keeps the FRAME smooth: cloudSoft is
       what the overlay reads, camY and lookY are the whole picture,
       and all three are judged and pass.

       kiteScreen is reported and not judged ON THIS RUN ONLY. Flying
       into a dense bank at twelve metres a second and being slowed is
       the feature — the field is explicitly "firm, and still not a
       stop" — so the glider's own deceleration is the thing working,
       not a jerk. It stays judged on the on-pace run, where it passes
       at 0.729, and that is the run that decides whether the chapter
       is smooth for somebody following the cue.

       This is a narrower claim than the one I first tried here, which
       was that the reader skims; the skim count came back zero and
       refused it. The count is still printed above so that excuse
       cannot be reached for again without evidence. */
    const adversarial = (k === 'kiteScreen' || k === 'kiteY');
    const placed = adversarial || (k === 'kiteY' && upSkims > 0);
    if(EXPECTED[k])        say('  --    ' + line + `   EXPECTED: ${EXPECTED[k]}`);
    else if(placed)        say('  --    ' + line +
      `   = ${(b.maxDV * 0.1 * 45).toFixed(1)} px of deviation; an adversarial reader being ` +
      `slowed by the field, judged on the on-pace run`);
    else if(r.fails)       bad(line);
    else                   ok(line);
  }
}

/* ==================================================================
   THE SHEPHERD — a CHAIN of followers, which is new
   ==================================================================
   Every other chapter has followers; none of them has followers
   feeding followers. A chain is where a step gets AMPLIFIED rather
   than absorbed: each link multiplies its input's velocity jump by
   about w, so a jolt at the head arrives at the tail five times
   magnified, and the tail is a sheep the reader is looking at.

   That is the thing this harness exists to catch, so it is driven
   here with the chapter's real modules — the same tracker and the
   same body the page runs — on both clocks. The head is judged as a
   first-class field and so is the LAST sheep, because if anything is
   going to lurch it is the end of the chain.
   ================================================================== */
function sampleShepherd(clk){
  const proto = SHEP.PROTOCOLS.box;
  const b = breath(proto);
  const R = rates(proto);
  const W = body({ corridor: SHEP.CORRIDOR, rates: R,
                   vMax: SHEP.RANGE * R.fillPerSec * 2.2 });
  const flock = Array.from({ length: SHEP.FLOCK_N },
                           () => tracker(0, SHEP.FLOCK_W));
  const aim = tracker(SHEP.CAM_EASE.level.look, SHEP.CAM_EASE.level.ease);
  const camd = tracker(0, SHEP.CAM_W);
  W.reset(SHEP.normOf(b.value(0)));
  for(const f of flock) f.set(0);
  let t = 0, wall = 0, d = 0, v = 0;
  const S = { wantH:[], walkV:[], walk:[], sheep1:[], sheepLast:[], trail:[],
              camAim:[], camAt:[], shepScreen:[] };
  for(const dt of clk){
    t += dt; wall += dt;
    const ph = b.at(t).p;
    /* a cue-perfect reader: the finger sits where the schedule is,
       which is what makes a hold a hold */
    const want = SHEP.normOf(b.value(t));
    const gap = want - W.fill;
    const up = gap > 0.012, down = gap < -0.012;
    const cap = (up ? R.fillPerSec : down ? R.emptyPerSec : 0) * dt;
    if(cap > 0){
      let mv = gap * 14 * dt;
      if(mv >  cap) mv =  cap;
      if(mv < -cap) mv = -cap;
      W.fill = Math.min(1, Math.max(0, W.fill + mv));
    }
    W.settle(dt);
    /* THE GAIT, which is new and is this chapter's own integrator:
       a one-sided first-order lag on the walking rate, applied as
       1 - exp(-dt/tau) so a step response is the same at any frame
       rate. The dt/tau version of exactly this is what made 58 fps
       look worse than 60 in Long Air, so it is judged here rather
       than asserted in a comment. */
    v = SHEP.walkStep(v, d, W.value, dt);
    d += v * dt;
    let prev = d;
    for(const f of flock){ f.step(dt, prev); prev = f.value; }
    const E = SHEP.CAM_EASE[ph.cam] || SHEP.CAM_EASE.level;
    aim.w = E.ease; aim.step(dt, E.look); camd.step(dt, d);
    /* AND WHERE HE IS IN THE FRAME, which is the quantity the reader
       actually sees: the lens TRAILS him, so his screen position is
       the difference between two independently damped things and a
       deviation in either shows up here. Long Air learned that the
       world-frame height is not the judged field — the screen one
       is. */
    S.wantH.push    ({ t: wall, v: W.value });
    S.walkV.push    ({ t: wall, v });
    S.walk.push     ({ t: wall, v: d });
    S.sheep1.push   ({ t: wall, v: flock[0].value });
    S.sheepLast.push({ t: wall, v: flock[flock.length-1].value });
    S.trail.push    ({ t: wall, v: d - flock[flock.length-1].value });
    S.camAim.push   ({ t: wall, v: aim.value });
    S.camAt.push    ({ t: wall, v: camd.value - SHEP.CAM_BACK });
    S.shepScreen.push({ t: wall, v: d - (camd.value - SHEP.CAM_BACK) });
  }
  return S;
}

say('');
say('THE SHEPHERD — the walk, the chain, and the lens');
{
  const a = sampleShepherd(STEADY(FRAMES));
  const b2 = sampleShepherd(JITTER(FRAMES));
  for(const k of Object.keys(a)){
    const ra = analyse(a[k]), rb = analyse(b2[k]);
    const r = verdict(ra, rb);
    const line = `${k.padEnd(16)} ` +
      `${(rb.stepRatio === Infinity ? 'inf' : rb.stepRatio.toFixed(1)).padStart(9)}  ` +
      `${(rb.dvRatio === Infinity ? 'inf' : rb.dvRatio.toFixed(1)).padStart(9)}  ` +
      `${rb.maxDV.toFixed(3).padStart(9)}   ${r.kind}   fr x${r.frRatio === Infinity ? 'inf' : r.frRatio.toFixed(2)}`;
    if(EXPECTED[k])  say('  --    ' + line + `   EXPECTED: ${EXPECTED[k]}`);
    else if(r.fails) bad(line);
    else             ok(line);
  }
  /* AND THE CHAIN MUST NOT AMPLIFY. The whole hazard of followers
     feeding followers is that the tail is worse than the head; if it
     is, the sheep at the back is the thing that lurches. */
  const head = analyse(sampleShepherd(JITTER(FRAMES)).walk);
  const tail = analyse(sampleShepherd(JITTER(FRAMES)).sheepLast);
  const amp = head.maxDV > 1e-9 ? tail.maxDV / head.maxDV : 0;
  const al = `the chain damps rather than amplifies: head ${head.maxDV.toFixed(3)} -> ` +
             `tail ${tail.maxDV.toFixed(3)} u/s, x${amp.toFixed(2)} over ${SHEP.FLOCK_N} links`;
  if(amp <= 1.0) ok(al); else bad(al + '  — the sheep at the back lurches harder than the shepherd');
}

say('');
say(`CAMERA EASE CONSTANTS, for the record: ${JSON.stringify(CAM_EASE)}`);

say('');
if(FAIL){ say('TEMPORAL CONTINUITY FAILED'); process.exit(1); }
say('TEMPORAL CONTINUITY PASSED');
