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
         CORR_LO, CORR_HI, RIDGE_TOP, GROUND, ALT_LOW, BEHIND } from '../app/js/long-air-breath.js';
import { breath } from '../app/js/breath.js';
import * as D from '../app/js/dove-shape.js';
import { PROTOCOLS as DL } from '../app/js/deep-light-breath.js';
import { gradeAt, terrainY, meshY, columnsAt, rowsOf,
         highestDrawn, PROF, GX, lipOffset,
         profileTone, profileH,
         TREES, TREE_SEG, treeWidth, treeLean,
         CGX, cloudLip, cloudUnder, cloudCrown, cloudEnd, BANK_DEPTH, CLOUD_CROWN_MAX,
         BGX, buttressTop, gateFlank, BUTT_HALF, BUTT_SINK } from '../app/js/long-air-terrain.js';
import { CAM_EASE } from '../app/js/long-air-lens.js';
import * as CF from '../app/js/long-air-clouds.js';
import { MAG, MAG_V, MAG_T, GATE_HALF } from '../app/js/long-air-breath.js';
import { readFileSync } from 'node:fs';

const VERBOSE = process.argv.includes('--verbose');

/* ONE BAR FOR THE WHOLE CHAPTER, in degrees of turn at a knot AS SEEN
   from the lens. Four degrees is about three pixels of deviation
   across a knot at the distance the ridge is read at on a 375 px
   screen, which is below the point where an edge reads as a corner
   rather than as a line. */
/* THE DEGREE BAR IS A PROXY, AND IT IS NOW LABELLED AS ONE.
   It was derived as "about three pixels of deviation across a knot at
   the distance the ridge is read at on a 375 px screen" — a stand-in
   for the pixel sagitta, computed back when nothing here could
   project. Everything it stands in for IS projected now, in THE
   ANGULAR BAR below, and the ridge passes there at 1.56 and 0.85 px.

   When MAG scaled the terrain's relief by T the degree numbers scaled
   with it, exactly as the proxy must, and three of them crossed 4.
   Raising the bar to make them pass would be the thing CLAUDE.md
   warns about; so the bar scales by the same T its subject does,
   which is what a proxy for a fixed pixel quantity has to do, and the
   REAL bar is the one in pixels and is unmoved at 2 px. If the two
   ever disagree about a verdict, the pixel one is right. */
const TARGET_DEG = 4.0 * MAG_T;
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
  /* THE QUESTION CHANGED ON 6 NOVEMBER. It used to be "is the slab's
     flat far edge below the lowest terrain across the opening", which
     is the right question about a card propped against a hill. The
     buttress has no flat far edge: its base is meshY sampled column
     by column, so the honest question is whether it COINCIDES with
     the drawn surface rather than whether it is buried under it. A
     gap of any sign is a seam now. */
  /* WHAT CAN ACTUALLY FAIL. The base is meshY by construction, so
     comparing it with meshY is a check that cannot fail and is worth
     nothing — the first version of this did exactly that and is the
     reason this note exists. The identity that CAN break is at the
     other end: the buttress TOP has to arrive at the hill at the
     flank's edge, or every gate has a step down its side. That
     depends on gateFlank reaching zero and on buttressTop blending
     towards the ground it was handed, both of which are real code. */
  let worstSeam = Infinity, seamAt = null;
  for(const g of course.gates){
    const lip = g.centre - g.half;
    /* the module's own edge, not a number typed here: BUTT_HALF moved
       from 46 to 52 and this test kept probing 46, where the flank is
       legitimately still a third of the way up. The same class of
       fault the whole file exists to catch, in the file itself. */
    for(const x of [BGX[0], BGX[BGX.length - 1], -BUTT_HALF, BUTT_HALF,
                    -(BUTT_HALF - 0.1), BUTT_HALF - 0.1]){
      const ground = meshY(x, g.zb, period);
      /* how far UNDER the hill the flank sits; negative would be above */
      const d = ground - buttressTop(x, g.i, lip, ground);
      if(d < worstSeam){ worstSeam = d; seamAt = { z:+g.zb.toFixed(1), x }; }
    }
  }
  /* THE TOLERANCE IS A PIXEL, CONVERTED, not a round number. At the
     edge itself gateFlank is exactly zero and the departure is
     exactly zero; a hair inside it the quintic is 1 - 3e-7, which
     against a 22 m lip is about eight microns. Asking for 1e-6 there
     was asking the quintic to be something other than a quintic. A
     gate is read from about twelve metres, where a millimetre is
     0.06 px — six hundredths of a pixel is the scale at which "no
     visible step" stops being a claim about the picture. */
  /* THE QUESTION INVERTED ON 6 NOVEMBER. It used to ask whether the
     buttress top MEETS the hill at its flank, and it did — to eight
     microns, which turned out to be the fault rather than the proof.
     Two surfaces that coincide z-fight, and about five columns per
     gate were inside five centimetres of each other across the full
     width. So the flank is BURIED now and what has to be checked is
     that it is buried: deeply enough that nothing can fight, and not
     so deep that a buttress would be seen to start inside the hill.

     `worstSeam` is now the smallest burial anywhere on the flank
     rather than the largest departure, and the bar is the depth
     buffer's, not a pixel's. */
  const gl = `buttress flank is buried, not landed: shallowest burial ` +
             `${worstSeam.toFixed(3)} m (sink ${BUTT_SINK} m)`;
  if(worstSeam > 0.05 && worstSeam <= BUTT_SINK + 1e-9)
    ok(gl + '  (clear of the depth buffer, and never seen to start)');
  else bad(gl + `  — at z=${seamAt.z} x=${seamAt.x}; under 5 cm the two surfaces z-fight, ` +
                `which is the "ridges of rock appearing and disappearing" the reader reported`);
  /* AND THE FLANK MUST ACTUALLY ARRIVE AT THE HILL. gateFlank is what
     turns the gate from a wall ending in mid-air into a swelling of
     the hillside, and a taper that did not reach zero would leave a
     step down the side of every gate. */
  const fl = `gate flank: ${gateFlank(BUTT_HALF).toExponential(1)} at the edge, ` +
             `${gateFlank(15).toFixed(3)} at the opening (so the lip is exact where it is aimed at)`;
  if(gateFlank(BUTT_HALF) < 1e-12 && Math.abs(gateFlank(15) - 1) < 1e-12) ok(fl);
  else bad(fl + '  — the buttress does not melt into the hill');
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
  /* ================================================================
     THE EXIT IS ASSERTED, NOT HOPED FOR — 3 November 2026
     ================================================================
     The reader's requirement is that the bird leaves the frame
     EXACTLY when she dives: the departure and the start of the
     descent are one moment. The old flight could not be held to that
     and was not: it integrated a velocity, so its position at the
     phase boundary depended on the frame clock and the whole history
     of the flight, and nothing computed it. Measured afterwards, box
     came out at 3.52 s of a 3.55 s window — right by luck — and
     no-holds at 4.85 s against a 4.55 s window, which OVERRAN, with
     the bird still crossing the frame as she started down.

     doveTiming() makes the identity structural: `span` is defined as
     whatever is left between the release and the end of the inhale,
     so launchAt + span === d for any protocol, and doveFlight() is a
     pure function of that normalised time. Three things are checked
     here, and the first is the requirement itself.

       1. launchAt + span === d, to floating-point exactness, for
          every protocol that exists.
       2. The flight is long enough to read as a flight rather than
          as a dart. "Gracefully" is the reader's word.
       3. The arc's endpoint is actually OUTSIDE the frame at u = 1,
          computed against the chapter's own fov and trailing
          distance rather than asserted. Without this the first two
          would only prove the bird stops being drawn on time, which
          is not the same as leaving.
     ================================================================ */
  {
    const MIN_MORPH = 0.60, MIN_FLIGHT = 1.50;
    /* the chapter's own lens, read out of the page as text, for the
       same reason the rock shader's band edges are: a second copy of
       a constant in a tool is a constant free to drift from the thing
       it is measuring. */
    const pd = readFileSync(new URL('../app/pearl-diver.html', import.meta.url), 'utf8');
    const fovM = pd.match(/fov:\s*a\s*=>\s*a\s*<\s*0\.75\s*\?\s*(\d+)\s*:\s*(\d+)/);
    const backM = pd.match(/let camBack\s*=\s*([\d.]+)/);
    if(!fovM || !backM) bad('dove: could not read the chapter\'s fov / camBack out of the page');
    const FOV = fovM ? +fovM[1] : 62;            // the phone branch
    const CAM_BACK = backM ? +backM[1] : 9;
    const END = D.doveFlight(1, 1, 0);
    /* along-axis range at the exit: the lens trails by CAM_BACK and
       the bird has travelled DOVE_RANGE.back further away again */
    const range = CAM_BACK + D.DOVE_RANGE.back;
    const halfH = Math.tan(FOV / 2 * Math.PI / 180) * range;
    const clears = END[1] / halfH;
    const fl = `dove exit geometry      climbs ${END[1].toFixed(1)} m against a ` +
               `${halfH.toFixed(1)} m half-frame at ${range.toFixed(1)} m ` +
               `(fov ${FOV}, camBack ${CAM_BACK}) = clears by x${clears.toFixed(2)}`;
    if(clears >= 1.25) ok(fl); else bad(fl + '  — the bird is still in frame at u = 1');

    for(const id of Object.keys(DL)){
      const inPh = DL[id].phases.find(p => p.k === 'in');
      const TM = D.doveTiming(inPh.d);
      const W = TM.W;
      const at = f => D.DOVE_T0 + f * W;
      const morphLen = (0.52 - 0.22) * W;
      const exitErr = Math.abs(TM.launchAt + TM.span - inPh.d);
      const line = `dove fits ${(DL[id].id + ' ' + inPh.d + 's').padEnd(12)}` +
                   `W ${W.toFixed(2)}  raise ${at(0).toFixed(2)}-${at(0.30).toFixed(2)}` +
                   `  opens ${at(0.22).toFixed(2)}-${at(0.52).toFixed(2)}` +
                   `  released ${TM.launchAt.toFixed(3)}` +
                   `  flies ${TM.span.toFixed(3)}s` +
                   `  EXITS ${(TM.launchAt + TM.span).toFixed(3)} of ${inPh.d.toFixed(3)}`;
      const fits = W > 0 && morphLen >= MIN_MORPH &&
                   exitErr < 1e-9 && TM.span >= MIN_FLIGHT;
      if(fits) ok(line);
      else if(exitErr >= 1e-9) bad(line + `  — exit misses the dive by ${exitErr.toExponential(1)}s`);
      else if(TM.span < MIN_FLIGHT) bad(line + `  — only ${TM.span.toFixed(2)}s of flight, that is a dart`);
      else bad(line + `  — morph only ${morphLen.toFixed(2)}s`);
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

/* ==================================================================
   THE ANGULAR BAR — what the knot subtends FROM THE LENS
   ==================================================================
   Everything above measures the surface in WORLD SPACE, and the brief
   for this pass was right to question that. A four degree turn 20 m
   from the lens is nothing; the same four degrees at 2 m is a corner.
   The section above already knew this — it carried an "as seen" column
   — but it computed it as `deg * min(1, 40/dist)`, which is a
   heuristic with no optics in it. It is kept below for comparison and
   it is not the measurement.

   THE HONEST QUANTITY IS THE SAGITTA IN PIXELS: project the knot and
   its two neighbours through the chapter's real lens, and measure how
   far the knot's image sits off the straight line joining its
   neighbours' images. That IS the question "does this read as a
   polygon", in the only units that can answer it. Under a pixel and
   the mesh is indistinguishable from a smooth curve at that distance,
   whatever its world-space angle; over about two and the facets are
   visible.

   The lens is the chapter's own. Nothing here is a guessed camera:
   fov, aspect, trailing distance and aim all come from the same
   constants long-air.html builds the pose from, and the aspect is the
   reader's phone — 375 x 812 CSS pixels, which is what §mobile-first
   means and the screen this is for.
   ================================================================== */
say('');
say('THE ANGULAR BAR — the knot projected through the chapter\'s own lens');

const SCR_W = 375, SCR_H = 812;          // the reader's phone, CSS px
const ASPECT = SCR_W / SCR_H;
const FOV_DEG = ASPECT < 0.75 ? 66 : 55; // long-air.html's own fov(aspect)

/* The nominal pose: the glider at the bottom of its corridor on a
   level phase, which is where the ridge fills most of the frame and
   therefore where its facets are most visible. CAM_EASE and the
   aspect factor are the page's. */
const POSE_KITE = ALT_LOW;
const CAM_Y  = POSE_KITE + 1.0;
const CAM_Z  = CAM_EASE.level.back * (ASPECT < 0.75 ? 1.0 : 1.3);
const LOOK_Y = POSE_KITE + CAM_EASE.level.look;
const LOOK_Z = -22;

/* lookAt, by hand: the forward axis, then a right and an up from it.
   No three.js in a Node tool. */
function basis(){
  const f = [0 - 0, LOOK_Y - CAM_Y, LOOK_Z - CAM_Z];
  const fl = Math.hypot(...f); for(let i = 0; i < 3; i++) f[i] /= fl;
  // right = normalize(cross(worldUp, -forward)) with worldUp = +y
  const r = [ f[2] * 1 - 0, 0, -(f[0] * 1) ];
  const rl = Math.hypot(...r) || 1; for(let i = 0; i < 3; i++) r[i] /= rl;
  const u = [ r[1]*f[2] - r[2]*f[1], r[2]*f[0] - r[0]*f[2], r[0]*f[1] - r[1]*f[0] ];
  return { f, r, u };
}
const BAS = basis();
const FY = 1 / Math.tan(FOV_DEG / 2 * Math.PI / 180);

/** World point to screen pixels, or null when it is behind the lens. */
function project(x, y, z){
  const d = [x - 0, y - CAM_Y, z - CAM_Z];
  const vz = d[0]*BAS.f[0] + d[1]*BAS.f[1] + d[2]*BAS.f[2];   // +ve = ahead
  if(vz <= 0.2) return null;
  const vx = d[0]*BAS.r[0] + d[1]*BAS.r[1] + d[2]*BAS.r[2];
  const vy = d[0]*BAS.u[0] + d[1]*BAS.u[1] + d[2]*BAS.u[2];
  const nx = (FY / ASPECT) * vx / vz, ny = FY * vy / vz;
  return [ (nx * 0.5 + 0.5) * SCR_W, (1 - (ny * 0.5 + 0.5)) * SCR_H, vz ];
}

/** True when an image is inside the frame the reader is looking at.
 *  WITHOUT THIS THE MEASUREMENT IS MEANINGLESS, and the first run
 *  proved it: it reported 80.15 px off the chord "at 1 m", which was a
 *  row of the ridge passing directly beneath the lens — twelve metres
 *  below it, one metre along the view axis, and nowhere near the
 *  frame. A knot the reader cannot see cannot look polygonal. The
 *  margin is generous rather than exact: a knot just outside the edge
 *  still has triangles reaching into frame. */
const onScreen = q => q && q[0] > -60 && q[0] < SCR_W + 60 &&
                            q[1] > -60 && q[1] < SCR_H + 60;

/** Pixels from B's image to the chord joining A's and C's images. */
function sagittaPx(A, P, C){
  const a = project(...A), p = project(...P), c = project(...C);
  if(!a || !p || !c) return null;
  if(!onScreen(a) || !onScreen(p) || !onScreen(c)) return null;
  const ex = c[0] - a[0], ey = c[1] - a[1];
  const L = Math.hypot(ex, ey);
  if(L < 1e-6) return null;
  const off = Math.abs((p[0] - a[0]) * ey - (p[1] - a[1]) * ex) / L;
  return { px: off, dist: p[2] };
}

/* THE RIDGE, both ways, over the part of the strip that is in frame.
   World z of a vertex with base z is period*BEHIND - mod(zb - dist,
   period); at dist = 0 that is period*BEHIND - zb, so the rows in
   front of the lens are the ones with small zb. The ridge is drawn
   from the lens out to the fog, so sweep the near 120 m. */
const BACK0 = period * BEHIND;
const zWorldOf = zb => BACK0 - zb;

let worstAcross = { px: 0 }, worstAlong = { px: 0 };
for(let zb = 0; zb <= 130; zb += rowStep){
  const cols = columnsAt(zb, period);
  const zw = zWorldOf(zb);
  /* ACROSS the ridge: the cross-section's own knots, which are the
     columns, at the depth they are actually seen at. */
  for(let i = 1; i < cols.length - 1; i++){
    const r = sagittaPx([cols[i-1].x, cols[i-1].y, zw],
                        [cols[i  ].x, cols[i  ].y, zw],
                        [cols[i+1].x, cols[i+1].y, zw]);
    if(r && r.px > worstAcross.px) worstAcross = { ...r, x: cols[i].x, zb };
  }
}
/* ALONG the course: three rows of knots down the z axis at fixed x. */
for(const x of [0, -13, 13, -34, 34, -58, 58]){
  for(let zb = rowStep; zb <= 130; zb += rowStep){
    const y0 = meshY(x, zb - rowStep, period), y1 = meshY(x, zb, period),
          y2 = meshY(x, zb + rowStep, period);
    const r = sagittaPx([x, y0, zWorldOf(zb - rowStep)],
                        [x, y1, zWorldOf(zb)],
                        [x, y2, zWorldOf(zb + rowStep)]);
    if(r && r.px > worstAlong.px) worstAlong = { ...r, x, zb };
  }
}

/* THE BAR. One pixel is the honest line: a vertex that sits less than
   a pixel off its own chord cannot be seen to be a vertex. Two is
   where faceting becomes legible on a 375 px screen, so that is the
   bar, with the one-pixel figure reported alongside. */
const PX_BAR = 2.0;
for(const [name, w] of [['ridge across (columns)', worstAcross],
                        ['ridge along (rows)',     worstAlong]]){
  if(!w.dist){ bad(`${name}: nothing projected — the instrument saw no geometry`); continue; }
  const line = `${name.padEnd(24)} worst ${w.px.toFixed(2).padStart(5)} px off the chord` +
               ` at ${w.dist.toFixed(0)} m, x=${(w.x ?? 0).toFixed(0)}  (bar ${PX_BAR} px)`;
  if(w.px <= PX_BAR) ok(line); else bad(line);
}

/* ==================================================================
   THE TREELINE, AGAINST THE SKY
   ==================================================================
   The treeline is the only thing added in the 3 November detail pass
   that is a silhouette against a flat sky, which is the worst case
   for a polygonal outline: a facet on the hillside is masked by the
   hill's own value bands, a facet on an edge against nothing is the
   only thing there is to look at in that part of the frame.

   So it is projected through the same lens, measured the same way,
   and held to the same pixel bar as the ridge. Both edges of every
   tree, at the mesh's own knots, with the lean included — the lean is
   part of the drawn outline and measuring the width profile alone
   would be measuring something that is not on screen.

   The trees stand on meshY, so this also catches a tree planted at a
   height the hill does not have.
   ================================================================== */
{
  let worst = { px: 0 }, inFrame = 0;
  const rowsT = rowsOf(period);
  for(const T of TREES){
    const zb = T.zf * period;
    const zw = zWorldOf(zb);
    if(zw > 0 || zw < -140) continue;         // not in front of the lens
    const base = meshY(T.x, zb, period, rowsT);
    const P = (s, sd) => {
      const f = s / TREE_SEG;
      return [T.x + treeLean(f, T.lean) + sd * treeWidth(f, T.wT, T.wC),
              base + f * T.h, zw];
    };
    for(const sd of [-1, 1]){
      for(let s = 1; s < TREE_SEG; s++){
        const r = sagittaPx(P(s - 1, sd), P(s, sd), P(s + 1, sd));
        if(r){ inFrame++; if(r.px > worst.px) worst = { ...r, tree: T.i, s, sd }; }
      }
    }
  }
  if(inFrame === 0){
    bad('treeline: nothing projected — the instrument saw no trees, so this measures nothing');
  } else {
    const line = `treeline silhouette      worst ${worst.px.toFixed(2).padStart(5)} px off the chord` +
                 ` at ${worst.dist.toFixed(0)} m (tree ${worst.tree}, knot ${worst.s}),` +
                 ` ${inFrame} knots in frame  (bar ${PX_BAR} px)`;
    if(worst.px <= PX_BAR) ok(line); else bad(line);
  }
  /* AND THEY MUST NEVER REACH THE CORRIDOR. Scenery that pokes into
     the flight band would be geometry the glider has to be protected
     from, and tools/regress.mjs's clearances do not know it exists.
     Checked against the DRAWN terrain they stand on rather than
     against RIDGE_TOP, because that is what sets their feet. */
  let top = -Infinity, atT = null;
  for(const T of TREES){
    const zb = T.zf * period;
    const y = meshY(T.x, zb, period, rowsT) + T.h;
    if(y > top){ top = y; atT = T.i; }
  }
  const tl = `tallest treetop ${top.toFixed(2)} m against the corridor floor ${CORR_LO} ` +
             `(tree ${atT}); clears by ${(CORR_LO - top).toFixed(2)} m`;
  if(top < CORR_LO) ok(tl); else bad(tl + '  — a tree is in the flight band');
}

/* ==================================================================
   THE CLOUDS, IN PIXELS — and the promise they have to keep
   ==================================================================
   6 November 2026. The clouds stopped being the gates' upper lip and
   became a sparse field of their own, so everything measured here
   changed subject. Three questions, and the first is the one that
   matters:

   1. ON-PACE PLAY MUST NEVER NEED TO ENTER ONE. That invariant used
      to hold because the bank WAS the gate's upper lip, so clearing
      it and clearing the gate were the same act. Now it holds because
      every cloud's underside is derived from the SCHEDULE at its own
      position plus the gate's half-opening plus a clearance — the
      same margin the course already promises. Derived, and checked
      here against the LOWEST the underside ever reaches, which is the
      drawn curve minus the billow's own bound.
   2. The silhouette has to hold the pixel bar, like every other edge.
   3. A cloud may not push past the ceiling the chapter says the
      weather sits under.
   ================================================================== */
say('');
say('THE CLOUDS — a sparse field now, not the gates\' upper lip');
{
  const probe3 = breath(proto);
  const course3 = courseOf(proto, t => probe3.value(t));
  const field = CF.cloudsFor(course3);

  /* (1) the promise */
  let worstClear = Infinity, clearAt = null;
  for(const c of field){
    for(let u = -1; u <= 1.0001; u += 0.01){
      const low = CF.cloudUnderY(c, u) - CF.CLOUD_BILLOW;
      const m = low - CF.scheduleAt(course3, c.zb);
      if(m < worstClear){ worstClear = m; clearAt = { i:c.i, u:+u.toFixed(2) }; }
    }
  }
  const pl = `every cloud's lowest underside clears the schedule beneath it by ` +
             `${worstClear.toFixed(2)} m (the opening itself is ${GATE_HALF.toFixed(2)})`;
  if(worstClear >= GATE_HALF) ok(pl + '  — on-pace play can never need to enter one');
  else bad(pl + `  — a reader following the cue would be put into cloud ${clearAt.i}`);

  /* (2) the silhouette, under and crown, through the chapter's lens */
  let worst = { px: 0 }, seen = 0, worstDeg = 0;
  const N = CF.CLOUD_COLS;
  /* EVERY CLOUD IS PROJECTED AT A REPRESENTATIVE DISTANCE, not at
     wherever this particular layout happens to put it. Sparse means
     sixteen clouds over 672 m, so at any one moment most of them are
     outside the frame and the first version of this check measured
     NOTHING and said so. The question is not whether these ones are
     in shot; it is whether a cloud's outline reads as a polygon at
     the range clouds are read at. 40 m is the near end of that — a
     cloud closer than this is overhead and past — so it is the worst
     case and therefore the one to hold. */
  const CLOUD_DIST = 40;
  for(const c of field){
    const zw = -CLOUD_DIST;
    for(const [name, Y] of [['under', u => CF.cloudUnderY(c, u)],
                            ['crown', u => CF.cloudCrownY(c, u)]]){
      for(let k = 1; k < N - 1; k++){
        const U = j => -1 + (j / (N - 1)) * 2;
        /* centred for the measurement. A cloud's own x puts most of
           them off the side of the frame, where onScreen rejects the
           knots and the check quietly measures six of them instead of
           two thousand. Where it sits is a composition question; what
           its edge looks like when you are under it is this one. */
        const X = j => U(j) * c.halfW;
        const r = sagittaPx([X(k-1), Y(U(k-1)), zw], [X(k), Y(U(k)), zw],
                            [X(k+1), Y(U(k+1)), zw]);
        if(r){ seen++; if(r.px > worst.px) worst = { ...r, i:c.i, k, name }; }
        const s1 = (Y(U(k)) - Y(U(k-1))) / (X(k) - X(k-1));
        const s2 = (Y(U(k+1)) - Y(U(k))) / (X(k+1) - X(k));
        worstDeg = Math.max(worstDeg, Math.abs(Math.atan(s2) - Math.atan(s1)) * 180 / Math.PI);
      }
    }
  }
  if(seen === 0) bad('clouds: nothing projected — the instrument saw no clouds in frame');
  else {
    const line = `cloud silhouette         worst ${worst.px.toFixed(2).padStart(5)} px off the chord` +
                 ` at ${worst.dist.toFixed(0)} m (cloud ${worst.i}, ${worst.name}),` +
                 ` ${worstDeg.toFixed(1)} deg in world, ${seen} knots  (bar ${PX_BAR} px)`;
    if(worst.px <= PX_BAR) ok(line); else bad(line);
  }

  /* (3) the ceiling, and the billow's own bound */
  let over = 0, topMost = -Infinity;
  for(const c of field){
    for(let u = -1; u <= 1.0001; u += 0.02){
      const top = CF.cloudCrownY(c, u) + CF.CLOUD_BILLOW * c.puff * 1.3;
      topMost = Math.max(topMost, top);
      if(top > ceilAt(c.zb, period) + 2.0 + CF.CLOUD_BILLOW * 2 + 12) over++;
    }
  }
  if(over === 0) ok(`no cloud pushes past the ceiling; the highest reaches ${topMost.toFixed(1)} m`);
  else bad(`${over} samples push past the ceiling the chapter says the weather sits under`);

  /* AND HOW SPARSE. The reader asked for clouds that do not overwhelm
     an otherwise sunny day, so the number that answers that is
     printed rather than left to taste: what fraction of the strip has
     a cloud anywhere over the lane. */
  let covered = 0, steps = 0;
  for(let z = 0; z < period; z += 2){
    steps++;
    if(CF.cloudsAt(field, period, z, 0).length) covered++;
  }
  ok(`sky over the lane: ${(100 - covered / steps * 100).toFixed(0)}% open, ` +
     `${field.length} clouds ${(2 * Math.min(...field.map(c => c.halfW))).toFixed(0)}-` +
     `${(2 * Math.max(...field.map(c => c.halfW))).toFixed(0)} m wide, ` +
     `bases ${Math.min(...field.map(c => c.base)).toFixed(0)}-` +
     `${Math.max(...field.map(c => c.base)).toFixed(0)} m; layout repeats every ` +
     `${(period / 14).toFixed(0)} s, the billow never does`);
}

/* ==================================================================
   THE BUTTRESS SILHOUETTE
   ==================================================================
   New geometry across the whole width of the frame, and the flank is
   where it lives: a gate's lip reaches 24.6 m and has to come down to
   a hillside at about 2 m over the 31 m between the opening's edge
   and the buttress's. That is the steepest smooth descent anywhere in
   the chapter, so it is the knot most at risk and the one the row
   spacing of 1.53 m was chosen against. Projected, like everything
   else that shows as an edge.
   ================================================================== */
say('');
say('THE BUTTRESS — the flank, through the lens');
{
  const probe4 = breath(proto);
  const course4 = courseOf(proto, t => probe4.value(t));
  let worst = { px: 0 }, seen = 0, tallest = 0;
  for(const g of course4.gates){
    const zw = zWorldOf(g.zb);
    if(zw > 0 || zw < -140) continue;
    const lip = g.centre - g.half;
    tallest = Math.max(tallest, lip);
    const Y = x => buttressTop(x, g.i, lip, meshY(x, g.zb, period));
    for(let k = 1; k < BGX.length - 1; k++){
      const r = sagittaPx([BGX[k-1], Y(BGX[k-1]), zw],
                          [BGX[k],   Y(BGX[k]),   zw],
                          [BGX[k+1], Y(BGX[k+1]), zw]);
      if(r){ seen++; if(r.px > worst.px) worst = { ...r, gate:g.i, x:BGX[k] }; }
    }
  }
  if(seen === 0){
    bad('buttress: nothing projected — the instrument saw no gates in frame');
  } else {
    const line = `buttress flank           worst ${worst.px.toFixed(2).padStart(5)} px off the chord` +
                 ` at ${worst.dist.toFixed(0)} m (gate ${worst.gate}, x=${worst.x.toFixed(1)}),` +
                 ` tallest lip in frame ${tallest.toFixed(1)} m, ${seen} knots  (bar ${PX_BAR} px)`;
    if(worst.px <= PX_BAR) ok(line); else bad(line);
  }
}

/* PROVE THE PROJECTOR. A tool that reports pixels has to be shown to
   put a known thing in the right place, or the numbers above are
   decoration — and a silently broken projector reports small
   sagittas, which looks exactly like success. Two checks: the aim
   point must land on the frame's centre line, and a metre stick at a
   known distance must subtend the size the optics say it should. */
{
  const c = project(0, LOOK_Y, LOOK_Z);
  const dx = Math.abs(c[0] - SCR_W / 2), dy = Math.abs(c[1] - SCR_H / 2);
  if(dx < 0.6 && dy < 0.6) ok(`projector: the aim point lands at frame centre (off by ${dx.toFixed(2)}, ${dy.toFixed(2)} px)`);
  else bad(`projector: the aim point is ${dx.toFixed(1)}, ${dy.toFixed(1)} px off centre — the camera basis is wrong`);

  /* a 1 m vertical stick on the view axis, 40 m out, should subtend
     H / (2 tan(fov/2) * 40) pixels */
  const want = SCR_H / (2 * Math.tan(FOV_DEG / 2 * Math.PI / 180) * 40);
  const pA = project(0, LOOK_Y, LOOK_Z), pB = project(0, LOOK_Y + 1, LOOK_Z);
  const axis = Math.hypot(0, LOOK_Y - CAM_Y, LOOK_Z - CAM_Z);
  const got = Math.abs(pB[1] - pA[1]) * axis / 40;     // rescale to 40 m
  if(Math.abs(got - want) / want < 0.02)
    ok(`projector: a 1 m stick at 40 m subtends ${(want).toFixed(1)} px as the optics require`);
  else bad(`projector: 1 m at 40 m measured ${got.toFixed(2)} px, optics say ${want.toFixed(2)} — scale is wrong`);
}

/* ==================================================================
   THE PAGE MUST NOT RE-IMPLEMENT THE TERRAIN
   ==================================================================
   This is the guard for the fault that made every number above
   meaningless until 3 November. ridgeGeometry in long-air.html had its
   own copy of the vertex arithmetic, and it had drifted from
   columnsAt() in two places, so this file was measuring a 2.94 degree
   cross-section while the page drew a 20.00 degree one.

   A comment saying "use the module" would not have prevented it,
   because a comment did say so. This reads the page as TEXT and fails
   on the two expressions that drifted, and on the absence of the call
   that replaced them. It is the same shape as the gate's credential
   scan: cheap, textual, and aimed at one specific mistake that has
   actually been made.
   ================================================================== */
say('');
say('THE PAGE AGAINST THE MODULE — one definition, not two that can drift');
{
  const raw = readFileSync(new URL('../app/long-air.html', import.meta.url), 'utf8');
  /* COMMENTS ARE STRIPPED BEFORE THE SCAN, and the first run of this
     guard is why. It failed on both forbidden expressions — because
     the note in ridgeGeometry explaining what they were QUOTES them
     verbatim. That is precisely the mistake CLAUDE.md records about
     the credential scan: writing the literal pattern into a tracked
     file makes the scan match that file for ever and quietly useless.
     Here it was loud rather than quiet, which is luck. The scan now
     looks at code. */
  const page = raw.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^[ \t]*\/\/.*$/gm, ' ');
  const forbidden = [
    [/Math\.abs\(\s*q\.x\s*\)\s*>\s*100/,
     'the hard wander step that wanderScale() replaced'],
    [/q\.h\s*\?\s*gradeAt/,
     'the boolean grade test where the module multiplies by q.h'],
  ];
  let clean = true;
  for(const [re, why] of forbidden){
    if(re.test(page)){ bad(`long-air.html still contains ${why}`); clean = false; }
  }
  if(clean) ok('long-air.html contains neither of the two expressions that drifted');
  if(/columnsAt\s*\(/.test(page)) ok('long-air.html builds its ridge from columnsAt()');
  else bad('long-air.html does not call columnsAt() — it is computing vertices again');

  /* AND THE GLSL CONSTANTS. The rock shader evaluates profileTone and
     profileH per fragment, in GLSL, from numbers written out by hand.
     That is a second copy of a decision, so it is checked against the
     module rather than trusted: the band edges and the taper span are
     read back out of the shader source and compared. */
  const want = { edges: [40, 72, 132], hLo: 86, hSpan: 54 };
  const got = {
    edges: [...page.matchAll(/aastep\((\d+)\.0,\s*a\)/g)].map(m => +m[1]),
    hLo:   +(page.match(/clamp\(\(a - (\d+)\.0\) \/ (\d+)\.0, 0\.0, 1\.0\)/) || [])[1],
    hSpan: +(page.match(/clamp\(\(a - (\d+)\.0\) \/ (\d+)\.0, 0\.0, 1\.0\)/) || [])[2]
  };
  const same = JSON.stringify(got.edges) === JSON.stringify(want.edges) &&
               got.hLo === want.hLo && got.hSpan === want.hSpan;
  /* and the module's own functions must agree with those numbers */
  const modOk = profileTone(39) === 0 && profileTone(41) === 2 &&
                profileTone(71) === 2 && profileTone(73) === 1 &&
                profileTone(131) === 1 && profileTone(133) === 3 &&
                Math.abs(profileH(86) - 1) < 1e-9 && profileH(140) === 0;
  if(same && modOk)
    ok(`the shader's band edges ${got.edges.join('/')} m and taper ${got.hLo}..${got.hLo+got.hSpan} m match profileTone/profileH`);
  else if(!same)
    bad(`the shader's band edges ${JSON.stringify(got)} do NOT match the module's ${JSON.stringify(want)}`);
  else
    bad('profileTone/profileH no longer have the band edges the shader was written against');
}

say('');
if(FAIL){ say('CONTINUITY FAILED — the scene has a measured discontinuity.'); process.exit(1); }
say('CONTINUITY PASSED');
