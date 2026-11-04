/* THE CONTINUITY SAMPLER — Long Air, 2 November 2026.
 *
 * The reader's verdict on Long Air was "a jutting, discontinuous mess",
 * with the instruction: sample for continuity and you will find the
 * scene is very disjointed. That is the right instruction and this is
 * the instrument for it.
 *
 * WHY A THRESHOLD WOULD NOT WORK, AND WHAT IS USED INSTEAD
 * -------------------------------------------------------
 * "The slope is bigger than N" cannot distinguish a steep hillside
 * from a cliff edge, and picking N would just be eyeballing with extra
 * steps. The thing that actually separates them is how the measurement
 * BEHAVES UNDER REFINEMENT:
 *
 *   a smooth field      halve the sample spacing and the measured
 *                       max slope and max curvature both stay put
 *   a slope kink (C0)   max slope stays put; max curvature DOUBLES
 *   a value jump (C-1)  max slope doubles; max curvature QUADRUPLES
 *
 * So the sampler evaluates each field at three spacings and reports
 * the growth ratio. A ratio near 1 is smooth at every scale. A ratio
 * near 2 or 4 means the quantity is diverging, which is a
 * discontinuity however large or small it happens to look at one
 * particular spacing. No magic number anywhere.
 *
 * AND THE NUMBER A READER ACTUALLY SEES is the kink angle at a knot.
 * The scene is a triangle mesh, so it is piecewise linear and has a
 * slope discontinuity at every row and every column BY CONSTRUCTION.
 * What decides whether that reads as a jut is the angle between
 * consecutive segments, which is about f'' times the spacing. Halving
 * the spacing halves the angle only if f'' is bounded; where the field
 * is quantised, f'' is unbounded and subdividing achieves nothing.
 * That is why going from nine columns to fifteen did not help.
 *
 * PROVE THE INSTRUMENT BEFORE TRUSTING IT
 * ---------------------------------------
 * Six times in this project a reported fault has turned out to be the
 * measuring apparatus, the most recent being a coverage() stride too
 * coarse to resolve the thing it was asked about — which produced four
 * fixes for a bug that did not exist. So this file refuses to report
 * anything about the scene until it has classified three CONTROLS with
 * known answers: a pure sine (smooth), a quantised sine (value jump)
 * and a clamped sine (slope kink). If it cannot tell those apart it
 * exits non-zero and says so, and its findings about the scene are
 * worth nothing.
 *
 *     node tools/continuity.mjs [--verbose]
 *
 * Exit 0 = every sampled field is smooth under refinement and every
 * kink angle is under the budget. Non-zero = something juts, or the
 * instrument failed its own controls.
 */

import { periodOf, PROTOCOLS, ridgeAt, ceilAt, wanderAt, courseOf,
         CORR_LO, CORR_HI, RIDGE_TOP, GROUND } from '../app/js/long-air-breath.js';
import { breath } from '../app/js/breath.js';
import * as D from '../app/js/dove-shape.js';
import { PROTOCOLS as DL } from '../app/js/deep-light-breath.js';
import { gradeAt, terrainY, meshY, columnsAt, rowsOf,
         highestDrawn, PROF, GX, lipOffset } from '../app/js/long-air-terrain.js';

const VERBOSE = process.argv.includes('--verbose');

/* ONE BAR FOR THE WHOLE CHAPTER, in degrees of turn at a knot AS SEEN
   from the lens. Four degrees is about three pixels of deviation
   across a knot at the distance the ridge is read at on a 375 px
   screen, which is below the point where an edge reads as a corner
   rather than as a line. */
const TARGET_DEG = 4.0;
let FAIL = 0;
const say = s => console.log(s);
const ok   = s => say('  ok    ' + s);
const bad  = s => { say('  FAIL  ' + s); FAIL = 1; };

/* ------------------------------------------------------------------
   The core measurement
   ------------------------------------------------------------------ */

/** Max |first difference| and |second difference| of f over [a,b) at
 *  spacing h, scaled so they approximate f' and f''. */
function diffs(f, a, b, h){
  let d1 = 0, d2 = 0, at1 = a, at2 = a;
  for(let x = a + h; x < b - h; x += h){
    const fm = f(x - h), f0 = f(x), fp = f(x + h);
    const s = Math.abs((fp - fm) / (2 * h));
    const c = Math.abs((fp - 2 * f0 + fm) / (h * h));
    if(s > d1){ d1 = s; at1 = x; }
    if(c > d2){ d2 = c; at2 = x; }
  }
  return { d1, d2, at1, at2 };
}

/** Classify by how the maxima behave when the spacing is halved. */
function classify(f, a, b, h0 = 0.4){
  const c = [diffs(f, a, b, h0), diffs(f, a, b, h0 / 2), diffs(f, a, b, h0 / 4)];
  const r1 = c[2].d1 / Math.max(1e-9, c[0].d1);
  const r2 = c[2].d2 / Math.max(1e-9, c[0].d2);
  // over two halvings: smooth ~1, kink ~4 in d2, jump ~4 in d1
  let kind = 'smooth';
  if(r1 > 2.2) kind = 'VALUE JUMP';
  else if(r2 > 2.2) kind = 'SLOPE KINK';
  return { kind, slopeGrowth:+r1.toFixed(2), curvGrowth:+r2.toFixed(2),
           maxSlope:+c[2].d1.toFixed(3), worstAt:+c[2].at1.toFixed(1),
           maxCurv:+c[2].d2.toFixed(3), worstCurvAt:+c[2].at2.toFixed(1) };
}

/** The visible number: the largest turn, in degrees, between two
 *  consecutive segments of a piecewise-linear run of samples. */
function maxKinkDeg(f, a, b, step){
  let worst = 0, at = a;
  let prev = f(a), cur = f(a + step);
  for(let x = a + step; x + step < b; x += step){
    const nxt = f(x + step);
    const a1 = Math.atan2(cur - prev, step);
    const a2 = Math.atan2(nxt - cur, step);
    const d = Math.abs(a2 - a1) * 180 / Math.PI;
    if(d > worst){ worst = d; at = x; }
    prev = cur; cur = nxt;
  }
  return { deg:+worst.toFixed(2), at:+at.toFixed(1) };
}

/* ------------------------------------------------------------------
   THE PRE-FIX DEFINITIONS, FROZEN AS THE NEGATIVE CONTROL
   ------------------------------------------------------------------
   Verbatim copies of ridgeAt, ceilAt and gradeAt as they stood on the
   build the reader called a jutting, discontinuous mess. They are kept
   for the same reason tools/fixtures keeps the pre-§1.6a mapping: a
   check nobody has watched fail is not known to be able to fail, and
   a "before" number nobody can reproduce is an anecdote.

   These are history. Nothing imports them and nothing should.
   ------------------------------------------------------------------ */
const BEFORE = {
  ridgeAt(z, period){
    const u = (z / period) * Math.PI * 2;
    const h = Math.sin(u * 3) * 1.55 + Math.sin(u * 7 + 0.9) * 1.05
            + Math.sin(u * 13 + 1.7) * 0.6 + Math.sin(u * 23 + 4.2) * 0.3 + 1.3;
    return Math.min(3.4, Math.max(0.0, Math.round(h / 0.85) * 0.85));
  },
  ceilAt(z, period){
    const u = (z / period) * Math.PI * 2;
    return 36.0 + 7.0 + Math.round((Math.sin(u * 7 + 0.6) * 2.4) / 1.6) * 1.6;
  },
  gradeAt(zb, x, period){
    const u = (zb / period) * Math.PI * 2;
    const g = Math.sin(u * 5 + x * 0.021) * 0.62 + Math.sin(u * 11 + 2.3 + x * 0.047) * 0.34;
    return Math.max(-1.6, Math.min(0.45, Math.round(g / 0.3) * 0.3));
  }
};

/* ------------------------------------------------------------------
   1. PROVE THE INSTRUMENT
   ------------------------------------------------------------------ */
say('');
say('CONTROLS — the instrument must classify these correctly or');
say('everything below it is worthless.');

const controls = [
  { name:'pure sine (smooth)',          f: z => Math.sin(z * 0.09) * 3,          want:'smooth' },
  { name:'quantised sine (value jump)', f: z => Math.round(Math.sin(z * 0.09) * 3 / 0.85) * 0.85, want:'VALUE JUMP' },
  { name:'clamped sine (slope kink)',   f: z => Math.min(1.2, Math.max(-1.2, Math.sin(z * 0.09) * 3)), want:'SLOPE KINK' },
  { name:'abs sine (slope kink)',       f: z => Math.abs(Math.sin(z * 0.09)) * 3, want:'SLOPE KINK' },
  { name:'smooth-saturated sine',       f: z => { const t = (Math.sin(z*0.09)*3 + 3) / 6;
                                                  return t*t*t*(t*(t*6-15)+10) * 2.4; }, want:'smooth' }
];
for(const c of controls){
  const r = classify(c.f, 0, 600);
  const line = `${c.name}: ${r.kind} (slope x${r.slopeGrowth}, curv x${r.curvGrowth})`;
  if(r.kind === c.want) ok(line); else bad(line + ` — expected ${c.want}`);
}
if(FAIL){
  say('');
  say('INSTRUMENT FAILED ITS OWN CONTROLS — reporting nothing about the scene.');
  process.exit(2);
}

/* ------------------------------------------------------------------
   2. THE SCENE
   ------------------------------------------------------------------ */
const proto = PROTOCOLS.box;
const period = periodOf(proto);
const rows = rowsOf(period);
const rowStep = period / rows;

say('');
say(`LONG AIR — strip period ${period.toFixed(1)} m, ${rows} mesh rows, ` +
    `${rowStep.toFixed(2)} m apart`);
/* The negative control: the same three fields as they were, run
   through the same classifier, so "before" and "after" are the same
   measurement rather than two different ones. */
say('');
say('THE PRE-FIX BUILD — the negative control, so the check is known');
say('to be able to fail and the before numbers are reproducible.');
for(const [name, f] of [
  ['ridgeAt (before)', z => BEFORE.ridgeAt(z, period)],
  ['ceilAt  (before)', z => BEFORE.ceilAt(z, period)],
  ['gradeAt (before)', z => BEFORE.gradeAt(z, 0, period)]
]){
  const r = classify(f, 0, period);
  const k = maxKinkDeg(f, 0, period, rowStep);
  const line = `${name.padEnd(20)} ${r.kind.padEnd(11)} slope x${r.slopeGrowth} ` +
               `curv x${r.curvGrowth}   worst knot ${k.deg} deg`;
  if(r.kind === 'smooth') bad(line + ' — the negative control is not failing!');
  else ok('detected: ' + line);
}

say('');
say('FIELDS ALONG z  (what the scenery is sampled from)');

const fields = [
  { name:'ridgeAt   (ridge crest)',  f: z => ridgeAt(z, period) },
  { name:'ceilAt    (cloud floor)',  f: z => ceilAt(z, period) },
  { name:'wanderAt  (lateral)',      f: z => wanderAt(z, period) },
  { name:'gradeAt   (x=0)',          f: z => gradeAt(z, 0, period) },
  { name:'gradeAt   (x=13)',         f: z => gradeAt(z, 13, period) },
  { name:'terrainY  (x=0, analytic)',f: z => terrainY(0, z, period) },
  { name:'terrainY  (x=-58)',        f: z => terrainY(-58, z, period) }
];
const results = [];
for(const q of fields){
  const r = classify(q.f, 0, period);
  results.push({ q, r });
  const line = `${q.name.padEnd(28)} ${r.kind.padEnd(11)} ` +
               `slope x${String(r.slopeGrowth).padStart(5)}  curv x${String(r.curvGrowth).padStart(6)}` +
               `  max|f'| ${r.maxSlope}`;
  if(r.kind === 'smooth') ok(line); else bad(line + `   worst near z=${r.worstAt}`);
}

say('');
say('THE DRAWN SURFACE — kink angle at a knot, which is the jut itself');

const kinks = [];
function kink(name, f, a, b, step, budget){
  const k = maxKinkDeg(f, a, b, step);
  kinks.push({ name, ...k, budget });
  const line = `${name.padEnd(34)} ${String(k.deg).padStart(6)} deg at ${k.at}` +
               `   (budget ${budget})`;
  if(k.deg <= budget) ok(line); else bad(line);
}
// along the course, at the crest and on each shoulder
kink('crest line along z (x=0)',   z => meshY(0,   z, period), 0, period, rowStep, TARGET_DEG);
kink('shoulder along z (x=-13)',   z => meshY(-13, z, period), 0, period, rowStep, TARGET_DEG);
kink('flank along z (x=-58)',      z => meshY(-58, z, period), 0, period, rowStep, TARGET_DEG);
kink('cloud floor along z',        z => ceilAt(z, period),     0, period, rowStep, TARGET_DEG);
/* ACROSS THE RIDGE, MEASURED AT THE COLUMNS THEMSELVES.
   Sampling the cross-section on an arbitrary grid dilutes the kink,
   because the breakpoint falls somewhere between two samples and the
   angle gets shared out between them. The mesh's knots are the
   columns, so the honest number is the exact angle between the two
   segments that meet at each one. */
function columnKink(z){
  const c = columnsAt(z, period);
  let worst = 0, at = 0;
  for(let i = 1; i < c.length - 1; i++){
    const s1 = (c[i].y - c[i-1].y) / (c[i].x - c[i-1].x);
    const s2 = (c[i+1].y - c[i].y) / (c[i+1].x - c[i].x);
    const d = Math.abs(Math.atan(s2) - Math.atan(s1)) * 180 / Math.PI;
    if(d > worst){ worst = d; at = c[i].x; }
  }
  return { deg:+worst.toFixed(2), at:+at.toFixed(1) };
}
for(const z of [0, period * 0.17, period * 0.41, period * 0.73]){
  const k = columnKink(z);
  kinks.push({ name:`cross-section z=${z.toFixed(0)}`, ...k, budget:TARGET_DEG });
  const line = `cross-section at z=${z.toFixed(0)}`.padEnd(34) +
               `${String(k.deg).padStart(6)} deg at x=${k.at}   (budget ${TARGET_DEG})`;
  if(k.deg <= TARGET_DEG) ok(line); else bad(line);
}

/* ------------------------------------------------------------------
   3. THE WRAP SEAM — value AND derivative
   ------------------------------------------------------------------
   The strip is periodic in z over the whole period and every scrolled
   mesh relies on that. Matching VALUE at the seam is not enough: if
   the slope does not match there is a crease across the whole world
   once every period, which is exactly the class of fault
   tools/flash-check.md found one level down when a triangle straddled
   the wrap.
   ------------------------------------------------------------------ */
say('');
say('THE WRAP SEAM at z = 0 = period');
const seam = (name, f) => {
  const h = 0.05;
  const vA = f(period - 1e-6), vB = f(0);
  const sA = (f(period - 1e-6) - f(period - 1e-6 - h)) / h;
  const sB = (f(h) - f(0)) / h;
  const dv = Math.abs(vA - vB), ds = Math.abs(sA - sB);
  const line = `${name.padEnd(28)} value ${dv.toExponential(1)}  slope ${ds.toExponential(1)}`;
  if(dv < 1e-6 && ds < 1e-3) ok(line); else bad(line);
};
seam('ridgeAt',  z => ridgeAt(z, period));
seam('ceilAt',   z => ceilAt(z, period));
seam('wanderAt', z => wanderAt(z, period));
seam('gradeAt',  z => gradeAt(z, 0, period));
seam('terrainY', z => terrainY(0, z, period));

/* ------------------------------------------------------------------
   3b. THE GATE SLABS AGAINST THE TERRAIN
   ------------------------------------------------------------------
   A slab that FLOATS over the hill leaves a gap you can see under, and
   the line where it almost meets the ground wanders about as the ridge
   scrolls past: a jut of a different kind. A slab buried in the hill
   is correct and invisible. So the question is not "do they intersect"
   — they must — but "is the slab's far edge below the LOWEST the
   terrain gets anywhere across the opening at that z".

   Same for the cloud bank at the top against the ceiling.
   ------------------------------------------------------------------ */
say('');
say('GATE SLABS AGAINST THE TERRAIN');
{
  const probe = breath(proto);
  const course = courseOf(proto, t => probe.value(t));
  const ROCK_FAR = GROUND - 3.0;
  let worstGap = -Infinity, gapAt = null;
  let lipKink = 0, lipAt = null;
  for(const g of course.gates){
    // the drawn terrain right across the opening at this gate's z
    let lowest = Infinity;
    for(let x = -20; x <= 20; x += 1) lowest = Math.min(lowest, meshY(x, g.zb, period));
    // positive gap = the slab stops ABOVE the ground and you can see under
    const gap = ROCK_FAR - lowest;
    if(gap > worstGap){ worstGap = gap; gapAt = { z:+g.zb.toFixed(1), lowest:+lowest.toFixed(2) }; }
    // the lip profile is seven knots across thirty metres; measure its
    // own kink the exact way, at the knots
    // the profile itself, imported, not replicated
    const lipFor = k => lipOffset(g.i, k);
    for(let k = 1; k < GX.length - 1; k++){
      const s1 = (lipFor(k) - lipFor(k-1)) / (GX[k] - GX[k-1]);
      const s2 = (lipFor(k+1) - lipFor(k)) / (GX[k+1] - GX[k]);
      const d = Math.abs(Math.atan(s2) - Math.atan(s1)) * 180 / Math.PI;
      if(d > lipKink){ lipKink = d; lipAt = { gate:g.i, x:GX[k] }; }
    }
  }
  const gl = `rock slab far edge vs lowest terrain across the opening: ` +
             `worst gap ${worstGap.toFixed(2)} m at z=${gapAt.z}`;
  if(worstGap < 0) ok(gl + '  (buried everywhere, as it must be)');
  else bad(gl + '  — the slab floats and you can see under it');
  const ll = `gate lip profile, worst knot ${lipKink.toFixed(2)} deg at x=${lipAt.x}`;
  if(lipKink <= TARGET_DEG) ok(ll); else bad(ll + `  (budget ${TARGET_DEG})`);
}

/* ------------------------------------------------------------------
   3c. EVERY MESH, BOTH AXES, AGAINST ONE BAR
   ------------------------------------------------------------------
   A surface smooth in one direction and coarse in the other still
   juts, so each mesh is swept along z AND across x and reports the
   worse of the two. One target for the whole chapter.

   DISTANT GEOMETRY IS EXCLUDED BY MEASUREMENT, NOT BY ASSERTION. The
   far mesas sit 360 to 780 m away and their profile is deliberately
   quantised into hard steps — that is the §4.2 rule-5 background
   silhouette and it is not up for smoothing. What matters is what the
   step SUBTENDS: a 7 m riser at 780 m is 0.5 degrees, which is half a
   pixel at this viewport. So the sweep reports both the world angle
   and the angle subtended from the lens, and the bar is applied to
   the second.
   ------------------------------------------------------------------ */
say('');
say(`EVERY MESH, WORST KNOT — target ${TARGET_DEG} deg as seen`);
{
  const CAM = { y: 22, z: 13 };          // where the lens actually rides
  const seen = (deg, dist) => deg * Math.min(1, 40 / Math.max(1, dist));
  const sweep = [];

  // the ridge, along the course and across it
  let zWorst = 0, xWorst = 0;
  for(let x of [-120, -58, -13, 0, 13, 58, 120]){
    const k = maxKinkDeg(z => meshY(x, z, period), 0, period, rowStep);
    if(k.deg > zWorst) zWorst = k.deg;
  }
  for(const z of [0, period*0.17, period*0.41, period*0.73, period*0.91]){
    const c = columnsAt(z, period);
    for(let i = 1; i < c.length - 1; i++){
      const s1 = (c[i].y - c[i-1].y) / (c[i].x - c[i-1].x);
      const s2 = (c[i+1].y - c[i].y) / (c[i+1].x - c[i].x);
      const d = Math.abs(Math.atan(s2) - Math.atan(s1)) * 180 / Math.PI;
      if(d > xWorst) xWorst = d;
    }
  }
  sweep.push({ mesh:'ridge', along:zWorst, across:xWorst, dist:45 });

  // the gate lips, across the opening
  {
    const probe2 = breath(proto);
    const course2 = courseOf(proto, t => probe2.value(t));
    let w = 0;
    for(const g of course2.gates){
      for(let k = 1; k < GX.length - 1; k++){
        const s1 = (lipOffset(g.i, k) - lipOffset(g.i, k-1)) / (GX[k] - GX[k-1]);
        const s2 = (lipOffset(g.i, k+1) - lipOffset(g.i, k)) / (GX[k+1] - GX[k]);
        const d = Math.abs(Math.atan(s2) - Math.atan(s1)) * 180 / Math.PI;
        if(d > w) w = d;
      }
    }
    sweep.push({ mesh:'gate lip', along:0, across:w, dist:20 });
  }

  // the cloud ceiling the cloud slab hangs from
  sweep.push({ mesh:'cloud ceiling',
               along: maxKinkDeg(z => ceilAt(z, period), 0, period, rowStep).deg,
               across: 0, dist:40 });

  // the far mesas — quantised on purpose, judged by what they subtend
  for(const L of [{z:780, step:7.0}, {z:520, step:5.5}, {z:360, step:4.0}]){
    const span = 1800, n = 40;
    const deg = Math.atan(L.step / (span / n)) * 180 / Math.PI;
    sweep.push({ mesh:`far mesa z=${L.z}`, along:0, across:deg, dist:L.z });
  }

  for(const s of sweep){
    const worst = Math.max(s.along, s.across);
    const app = seen(worst, s.dist);
    const line = `${s.mesh.padEnd(18)} along ${s.along.toFixed(2).padStart(6)}  ` +
                 `across ${s.across.toFixed(2).padStart(6)}  ` +
                 `worst ${worst.toFixed(2).padStart(6)} deg at ~${s.dist} m ` +
                 `= ${app.toFixed(2)} as seen`;
    if(app <= TARGET_DEG) ok(line); else bad(line);
  }
}

/* ------------------------------------------------------------------
   3d. PEARL DIVER — THE DOVE
   ------------------------------------------------------------------
   A wing's outline is a contour like any other, and a wing in motion
   is the contour that shows a defect soonest: it sweeps across the
   frame every cycle, ten to fourteen times a session. So it is held
   to the same bar as the terrain, measured the same way, at the
   mesh's own knots.

   The leading and trailing edges are what the reader sees in
   silhouette. The cross-section ring matters less — it is seen end-on
   — but it is swept too, because a surface smooth in one direction
   and coarse in the other still juts.
   ------------------------------------------------------------------ */
say('');
say('PEARL DIVER — THE DOVE');
{
  /* How the dove is read, so every bar below is a number rather than a
     feeling: a 0.68 m bird at about twelve metres on a 375x812 lens. */
  const DOVE_DIST = 12.0;
  const PX_PER_RAD = 812 / 1.082;
  const DOVE_CAP_DEG = 15, DOVE_CAP_PX = 0.5;

  // the contour functions, classified under refinement first
  for(const [name, f] of [
    ['chordHalf',  w => D.chordHalf(w)],
    ['thickHalf',  w => D.thickHalf(w)],
    ['sweepZ',     w => D.sweepZ(w)],
    ['dihedralY',  w => D.dihedralY(w)],
    ['centreZ',    w => D.centreZ(w)]
  ]){
    const r = classify(f, -1, 1, 0.02);
    const line = `${('dove ' + name).padEnd(28)} ${r.kind.padEnd(11)} ` +
                 `slope x${String(r.slopeGrowth).padStart(5)}  curv x${String(r.curvGrowth).padStart(6)}`;
    if(r.kind === 'smooth') ok(line); else bad(line);
  }

  // the drawn silhouette, at the mesh's own span knots
  const edge = (sgn) => {
    let worst = 0, at = 0;
    for(let j = 1; j < D.NW; j++){
      const w0 = D.wAt(j - 1), w1 = D.wAt(j), w2 = D.wAt(j + 1);
      const P = w => [D.spanX(w), D.centreZ(w) + sgn * D.chordHalf(w)];
      const a = P(w0), b = P(w1), c = P(w2);
      const t1 = Math.atan2(b[1] - a[1], b[0] - a[0]);
      const t2 = Math.atan2(c[1] - b[1], c[0] - b[0]);
      let d = Math.abs(t2 - t1) * 180 / Math.PI;
      if(d > 180) d = 360 - d;
      if(d > worst){ worst = d; at = w1; }
    }
    return { deg:+worst.toFixed(2), at:+at.toFixed(3) };
  };
  /* THE BAR FOR A SMALL OBJECT IS NOT THE BAR FOR TERRAIN, and saying
     so with a number rather than by waiving it. Four degrees was
     derived for a hillside that fills the frame; the dove is a 0.68 m
     bird read at about twelve metres. What a reader can see is the
     SAGITTA — how far the polyline bulges off the true curve — which
     for segment length h and knot angle θ is θh/8, and that converts
     to device pixels at the viewing distance. A raw-angle cap rides
     alongside it so the shape can never become a visible polygon
     however small it is on screen. */
  const span = 2 * D.HALF_SPAN / D.NW;      // segment length along x
  for(const [name, sgn] of [['leading edge', 1], ['trailing edge', -1]]){
    const k = edge(sgn);
    const px = (k.deg * Math.PI / 180) * span / 8 / DOVE_DIST * PX_PER_RAD;
    const line = `dove ${name}`.padEnd(28) + `${String(k.deg).padStart(6)} deg at w=${k.at}` +
                 `  = ${px.toFixed(3)} px bulge at ${DOVE_DIST} m` +
                 `   (caps ${DOVE_CAP_DEG} deg / ${DOVE_CAP_PX} px)`;
    if(k.deg <= DOVE_CAP_DEG && px <= DOVE_CAP_PX) ok(line); else bad(line);
  }

  // the dihedral line, seen head-on
  {
    let worst = 0, at = 0;
    for(let j = 1; j < D.NW; j++){
      const P = w => [D.spanX(w), D.dihedralY(w)];
      const a = P(D.wAt(j-1)), b = P(D.wAt(j)), c = P(D.wAt(j+1));
      const d = Math.abs(Math.atan2(c[1]-b[1], c[0]-b[0]) -
                         Math.atan2(b[1]-a[1], b[0]-a[0])) * 180 / Math.PI;
      if(d > worst){ worst = d; at = D.wAt(j); }
    }
    const line = 'dove dihedral line'.padEnd(28) + `${String(+worst.toFixed(2)).padStart(6)} deg at w=${at.toFixed(3)}` +
                 `   (budget ${TARGET_DEG})`;
    if(worst <= TARGET_DEG) ok(line); else bad(line);
  }

  /* THE CROSS-SECTION RING, judged by what it puts on screen.
     A ring of NU segments turns 360/NU per knot just by being a
     circle, and an ellipse concentrates that turning at its two ends
     — which on a wing are the leading and trailing edges and are
     SUPPOSED to be sharp. A raw-angle bar would condemn a correctly
     shaped blade. What can actually be seen is the sagitta: the
     polyline's bulge off the true curve, which is the knot angle
     times the local segment length over eight. The segments at an
     ellipse's sharp ends are short, which is exactly why the large
     angle there costs nothing. */
  {
    let worstPx = 0, worstDeg = 0, atW = 0;
    for(let j = 0; j <= D.NW; j += 2){
      const w = D.wAt(j);
      for(let i = 0; i < D.NU; i++){
        const P = k => { const p = D.dovePoint(D.uAt((k + D.NU) % D.NU), w); return [p[2], p[1]]; };
        const a2 = P(i), b2 = P(i+1), c2 = P(i+2);
        const h1 = Math.hypot(b2[0]-a2[0], b2[1]-a2[1]);
        const h2 = Math.hypot(c2[0]-b2[0], c2[1]-b2[1]);
        let d = Math.abs(Math.atan2(c2[1]-b2[1], c2[0]-b2[0]) -
                         Math.atan2(b2[1]-a2[1], b2[0]-a2[0]));
        if(d > Math.PI) d = 2 * Math.PI - d;
        const px = d * ((h1 + h2) / 2) / 8 / DOVE_DIST * PX_PER_RAD;
        if(px > worstPx){ worstPx = px; worstDeg = d * 180 / Math.PI; atW = w; }
      }
    }
    const line = `dove cross-section ring`.padEnd(28) +
                 `${worstDeg.toFixed(1)} deg = ${worstPx.toFixed(3)} px bulge at w=${atW.toFixed(2)}` +
                 `   (cap ${DOVE_CAP_PX} px)`;
    if(worstPx <= DOVE_CAP_PX) ok(line); else bad(line);
  }

  // the morph must not fold the surface through itself at any point
  {
    let minJ = Infinity, at = null;
    for(let m = 0; m <= 1.0001; m += 0.05){
      for(let j = 1; j <= D.NW; j++){
        const w = D.wAt(j), wp = D.wAt(j - 1);
        const x  = D.morphPoint(0.25, w,  m)[0];
        const xp = D.morphPoint(0.25, wp, m)[0];
        if(x - xp < minJ){ minJ = x - xp; at = { m:+m.toFixed(2), w:+w.toFixed(2) }; }
      }
    }
    const line = `dove morph stays unfolded`.padEnd(28) +
                 `min span step ${minJ.toFixed(5)} m at morph ${at.m}, w=${at.w}`;
    if(minJ > -1e-9) ok(line); else bad(line + '  — the surface folds through itself');
  }

  /* THE GESTURE HAS TO FIT, IN BOTH PROTOCOLS.
     The start is given in seconds (0.30 s into the inhale) and the end
     is "before the descent", so the window is the phase's own duration
     less the start and a tail margin, and every beat is a fraction of
     that. A protocol with a longer inhale gets a longer gesture rather
     than the same one with dead air after it. The check is that no
     beat is short enough to snap: the morph is the tightest and is the
     one that has to read as a transformation rather than a cut. */
  {
    const T0 = 0.30, TAIL = 0.15, MIN_MORPH = 0.60;
    for(const id of Object.keys(DL)){
      const inPh = DL[id].phases.find(p => p.k === 'in');
      const W = inPh.d - T0 - TAIL;
      const at = f => T0 + f * W;
      const morphLen = (0.52 - 0.22) * W;
      const line = `dove fits ${(DL[id].id + ' ' + inPh.d + 's').padEnd(12)}` +
                   `W ${W.toFixed(2)}  raise ${at(0).toFixed(2)}-${at(0.30).toFixed(2)}` +
                   `  opens ${at(0.22).toFixed(2)}-${at(0.52).toFixed(2)}` +
                   `  released ${at(0.45).toFixed(2)}` +
                   `  gone ${at(1).toFixed(2)} of ${inPh.d}`;
      const fits = W > 0 && morphLen >= MIN_MORPH && at(1) <= inPh.d - TAIL + 1e-9;
      if(fits) ok(line); else bad(line + `  — morph only ${morphLen.toFixed(2)}s`);
      // and the inhale must be stationary at the surface, or the
      // gesture would be cut short by the descent starting (§1.6a
      // already requires this; it is asserted rather than assumed)
      const flat = inPh.from === inPh.to && inPh.from > 0;
      if(flat) ok(`     ${DL[id].id}: inhale is flat and above the surface`);
      else bad(`     ${DL[id].id}: the inhale moves — the gesture would be cut short`);
    }
  }

  // the blade stations are excluded from the ring check by MEASUREMENT:
  // their cross-section is sub-pixel, so its knots cannot be seen
  {
    const PX = 812 / 1.082 / 12.0;
    const t = D.thickHalf(0.6) * 2 * PX;
    const line = `dove blade thickness at w=0.6`.padEnd(28) +
                 `${(D.thickHalf(0.6)*2).toFixed(4)} m = ${t.toFixed(2)} px at 12 m`;
    if(t < 1.0) ok(line + '  (sub-pixel: its ring is not a silhouette)');
    else bad(line + '  — thick enough to show its cross-section knots');
  }
}

/* ------------------------------------------------------------------
   4. THE CORRIDOR MARGIN, RE-DERIVED FROM THE GEOMETRY
   ------------------------------------------------------------------
   regress.mjs checks clearance against ridgeAt, which only bounds the
   SPINE. The thing a glider could actually touch is the drawn surface,
   which is the spine plus the profile plus the grade. Smoothing the
   fields changes those numbers, so the guarantee is re-derived here
   rather than assumed to have survived.
   ------------------------------------------------------------------ */
say('');
say('THE CORRIDOR MARGIN, measured on the DRAWN surface');
const hi = highestDrawn(period);
const margin = CORR_LO - hi.peak;
const mline = `highest drawn terrain ${hi.peak} m at z=${hi.at.z} x=${hi.at.x}` +
              `; corridor floor ${CORR_LO}; margin ${margin.toFixed(2)} m`;
if(margin >= 3.0) ok(mline); else bad(mline + '  — margin under 3 m');
/* RIDGE_TOP has to bound the DRAWN surface, not the spine. It did not
   until 2 November: the profile's dy and the cross-course grade stack
   on top of ridgeAt, and nothing checked the total. */
if(hi.peak <= RIDGE_TOP + 0.01) ok(`drawn peak ${hi.peak} within RIDGE_TOP ${RIDGE_TOP}`);
else bad(`drawn peak ${hi.peak} exceeds RIDGE_TOP ${RIDGE_TOP} — the constant is a lie`);

if(VERBOSE){
  say('');
  say('columns at z=0:');
  for(const c of columnsAt(0, period)) say(`   x ${c.x.toFixed(1).padStart(7)}  y ${c.y.toFixed(3)}`);
}

say('');
if(FAIL){ say('CONTINUITY FAILED — the scene has a measured discontinuity.'); process.exit(1); }
say('CONTINUITY PASSED');
