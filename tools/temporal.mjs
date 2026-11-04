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
         DRAG_MAX_LOSS, DRAG_GAIN, DRAG_CLEAR } from '../app/js/long-air-breath.js';
import { breath } from '../app/js/breath.js';
import { body, drag } from '../app/js/course.js';
import { lens, CAM_EASE } from '../app/js/long-air-lens.js';
import { tracker } from '../app/js/follow.js';

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
  forgiveRaw: 'the quantised DECISION (§6.1); `forgive` is what ships'
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
  else if(stepped) kind = 'STEPPED';
  else if(kinked)  kind = 'VELOCITY STEP';
  else if(ratio > FRDEP_BAR) kind = 'FRAME-RATE DEPENDENT';
  return { kind, steady: a, jitter: b, frRatio: ratio, moves };
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
  if(r.kind === c.want) ok(line); else bad(line + ` — expected ${c.want}`);
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
function sampleChapter(clk, { makeLens = lens, offPace = false } = {}){
  const B = breath(proto);
  const K = body({ corridor: CORRIDOR, rates: RATE, vMax: V_MAX });
  const D = drag({ maxLoss: DRAG_MAX_LOSS, gain: DRAG_GAIN, clear: DRAG_CLEAR });
  const L = makeLens();
  let t = 0, dist = 0, wall = 0, skims = 0;
  /* the same w the page uses, and the same module: the smoothed room
     is what the vertex shader gets and what the collision test uses,
     so it is what has to be measured */
  const FORG = tracker(0, 3.5);
  const S = { dist:[], kiteY:[], fill:[], forgiveRaw:[], forgive:[],
              camY:[], camBack:[], lookY:[], gateCentre:[], gateHalf:[],
              ridgeUnder:[], ceilUnder:[], speedF:[] };

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
    if(offPace){
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
    if(K.skim({ centre: gate.centre, half, bodyHalf: 0.78 }) > 0) skims++;

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
  if(b.stepRatio > STEP_RATIO_BAR || b.dvRatio > DV_RATIO_BAR){ controlCaught++; ok('detected: ' + line); }
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
  if(EXPECTED[k])                           say('  --    ' + line + `   EXPECTED: ${EXPECTED[k]}`);
  else if(r.kind === 'smooth' || r.kind === 'still') ok(line);
  else bad(line);
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
  if(EXPECTED[r.k] || !r.moves)   say('  --    ' + line);
  else if(r.frRatio <= FRDEP_BAR) ok(line);
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
say('OFF PACE — the opening, which is the only thing this run judges.');
for(const k of ['forgiveRaw', 'forgive']){
  const a = analyse(offSteady[k]), b = analyse(offJitter[k]);
  const r = verdict(a, b);
  const line = `${k.padEnd(16)} ` +
    `${(b.stepRatio === Infinity ? 'inf' : b.stepRatio.toFixed(1)).padStart(9)}  ` +
    `${(b.dvRatio === Infinity ? 'inf' : b.dvRatio.toFixed(1)).padStart(9)}  ` +
    `${b.maxDV.toFixed(3).padStart(9)}   ${r.kind}`;
  if(EXPECTED[k]) say('  --    ' + line + `   EXPECTED: ${EXPECTED[k]}`);
  else if(r.kind === 'smooth' || r.kind === 'still') ok(line);
  else bad(line);
}
say('');
say('  For scale: the raw decision steps FORGIVE_MAX/3 = 1.53 m between');
say('  two frames and moves every lip in the course by it. The smoothed');
say('  value reaches the same four sizes over about a third of a second.');

say('');
say(`CAMERA EASE CONSTANTS, for the record: ${JSON.stringify(CAM_EASE)}`);

say('');
if(FAIL){ say('TEMPORAL CONTINUITY FAILED'); process.exit(1); }
say('TEMPORAL CONTINUITY PASSED');
