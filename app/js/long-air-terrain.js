/* Long Air — THE TERRAIN, AS A MODULE.
 *
 * Pulled out of long-air.html on 2 November 2026 for one reason: the
 * reader reported the scene as a jutting, discontinuous mess and asked
 * for it to be SAMPLED rather than eyeballed. A sampler has to run in
 * Node — a browser cannot be made to prove "smooth" cheaply and the
 * frame-to-frame meter cannot see a shape fault at all — and a Node
 * tool cannot import a <script type="module"> block out of an HTML
 * page. So the profile, the grade and the mesh's own interpolation
 * live here, and tools/continuity.mjs samples EXACTLY the functions
 * the page draws rather than a second copy of them that could drift.
 *
 * That hazard is not hypothetical. gradeAt was already duplicated
 * once in this chapter — the glider's shadow needed it — and the note
 * on hoisting it says plainly that a second copy which drifted would
 * bury the shadow in the hill with nothing reporting it. This is the
 * same argument applied to the whole surface.
 *
 * No three.js and no DOM here: numbers only.
 */

import { ridgeAt, wanderAt, RIDGE_TOP, sat } from './long-air-breath.js';

/* ------------------------------------------------------------------
   THE CROSS-SECTION, AS A FUNCTION RATHER THAN A TABLE
   ------------------------------------------------------------------
   Refinement is the right lever NOW and was not before, and the reason
   is the one the sampler established: the kink angle at a knot is
   about f'' times the spacing, so halving the spacing halves the angle
   only if f'' is BOUNDED. While ridgeAt and gradeAt were quantised,
   f'' was unbounded and subdividing bought nothing — which is why
   nine columns to fifteen changed nothing on 2 November. They are C2
   now, so subdivision converges, and this is where it gets spent.

   Two things had to change before the knobs would do anything.

   1. THE PROFILE IS A FUNCTION, NOT A HAND TABLE. Quintic easing
      between fifteen hand-placed knots concentrates all the curvature
      inside the short spans: the skirt dropped 8.5 m across 40 m,
      giving f'' = 5.77 * 8.5 / 1600 = 0.031, which needs a 2 m column
      spacing to come under four degrees and 190 columns to do it.
      Spreading the same drop as one smooth descent takes f'' to
      0.0036 — nine times lower — and the same four degrees then costs
      64 columns instead of 190.

   2. THE LIP'S PER-COLUMN JITTER HAD TO GO. It was independent noise
      at each column, which is unbounded f'' by construction: halving
      the lip's spacing would have made it WORSE, not better. It is a
      smooth ripple along x now, so the lip refines like everything
      else. (See lipOffset.)

   What the shape still is: flat in the lane, a pair of low shoulders
   either side, then a long fall away at both ends. Hand-assigned tone
   bands, because §4.2 is explicit that value indices are decisions
   and never a function of distance — but assigned by band of |x|
   rather than per knot, so adding columns does not add decisions.
   ------------------------------------------------------------------ */
const SPAN = 190;                 // half-width of the ridge ribbon

/** Height relative to the crest. Smooth, with bounded curvature: the
 *  shoulder bumps are a single raised sine lobe and the skirt is one
 *  quintic descent rather than three chained knots. */
export function profileDy(x){
  const a = Math.abs(x);
  // the two shoulders: +0.35 at about 13 m, zero on the spine and zero
  // again by 34 m, and C2 at both ends because sin^2 is
  const bump = a < 34 ? 0.40 * Math.pow(Math.sin(Math.PI * a / 34), 2) : 0;
  // the fall away, one smooth descent over the whole outer width
  const t = Math.min(1, Math.max(0, (a - 34) / (SPAN - 34)));
  const drop = 15.0 * (t * t * t * (t * (t * 6 - 15) + 10));
  return bump - drop;
}

/** Which value index this part of the hill is painted with. A
 *  decision per band, not per column (§4.2: hand-assigned, never
 *  derived from distance). 0 PALE, 1 LIGHT, 2 MID, 3 BODY. */
export function profileTone(x){
  const a = Math.abs(x);
  if(a <= 40)  return 0;
  if(a <= 72)  return 2;
  if(a <= 132) return 1;
  return 3;
}

/** 1 on the lit crest band, 0 on the skirt, and SMOOTH between the
 *  two. It used to be a hard 0/1 at |x| = 100, interpolated across
 *  whatever span happened to straddle it — so the width of that
 *  transition was an accident of the column layout rather than a
 *  decision. */
export function profileH(x){
  const t = Math.min(1, Math.max(0, (Math.abs(x) - 86) / 54));
  return 1 - t * t * t * (t * (t * 6 - 15) + 10);
}

/** How much of the course's lateral wander this column follows. Was
 *  `Math.abs(q.x) > 100 ? 0.4 : 1` — a step, so two neighbouring
 *  columns either side of 100 m moved by different amounts and left a
 *  crease down the hillside that no amount of subdivision would fix. */
export function wanderScale(x){
  const t = Math.min(1, Math.max(0, (Math.abs(x) - 80) / 40));
  return 1 - 0.6 * (t * t * t * (t * (t * 6 - 15) + 10));
}

/* HOW FINE. Both numbers are set by the continuity instrument rather
   than by eye: the worst knot angle in the chapter is the target, and
   these are the spacings that bring the ridge under it.
     columns  5.9 m  ->  cross-section knots 2.8 deg worst
     rows     2.6 m  ->  along-course knots 3.7 deg worst
   Both were walked down until the instrument passed at four degrees,
   not chosen and then justified: 3.0 m rows measured 4.23 and failed.
   Triangles scale as the product of the two, so both were raised
   together only as far as the measurement demanded. */
export const COLS = 65;
export const ROW_SPACING = 2.6;

/** The column table the geometry is built from, generated rather than
 *  written out, so the count is a knob and not an edit. */
export const PROF = Array.from({ length: COLS }, (_, i) => {
  const x = -SPAN + (i / (COLS - 1)) * SPAN * 2;
  return { x, dy: profileDy(x), tone: profileTone(x), h: profileH(x) };
});

/** How many z rows the ridge mesh is built from. The mesh is linear
 *  between them, so this spacing is what multiplies f'' to give the
 *  visible kink angle along the course. */
export const rowsOf = period => Math.round(period / ROW_SPACING);

/* ------------------------------------------------------------------
   SMOOTH SATURATION, which is the whole of the fix
   ------------------------------------------------------------------
   Math.min(hi, Math.max(lo, x)) is continuous in value and
   discontinuous in slope: the derivative goes from 1 to 0 in nothing
   at all, wherever the clamp bites. On a surface, a slope that changes
   instantly IS a jut — that is what the word means. Three fields in
   this chapter were clamped that way and two of them were also
   quantised, which is worse: a quantised field is discontinuous in
   VALUE, so its slope is unbounded and no amount of subdivision can
   soften it.

   `sat` maps the whole input range into [lo, hi] through a quintic
   with zero first AND second derivative at both ends, so the surface
   is C2 everywhere — no kink at the ends of the range and no sudden
   change of curvature either. The middle is steeper than linear and
   the ends are flat, which is what terrain looks like anyway: flats at
   the valley floor and the ridge top, grade in between.
   ------------------------------------------------------------------ */
const smoother = t => t * t * t * (t * (t * 6 - 15) + 10);
/* `sat` itself lives in long-air-breath.js, next to ridgeAt which is
   its first caller, so the two modules do not form an import cycle.
   Re-exported so anything reaching for the terrain gets it. */
export { sat };

/* ------------------------------------------------------------------
   THE CROSS-COURSE GRADE
   ------------------------------------------------------------------
   Variance across the ridge as well as along it: ridgeAt already runs
   four harmonics down the z axis, but the same profile used to be
   extruded at every one of the 168 rows, so the ridge was a constant
   shape swept along a varying spine.

   It WAS `Math.max(-1.6, Math.min(0.45, Math.round(g / 0.3) * 0.3))`.
   Measured by tools/continuity.mjs, that is a value discontinuity: the
   sampled slope doubled every time the sample spacing was halved,
   which is the signature of a jump rather than of a steep gradient.
   Now it is saturated smoothly into the same range it was clamped to,
   so the cap still binds — the corridor margin depends on it — and the
   surface no longer steps.
   ------------------------------------------------------------------ */
export function gradeAt(zb, x, period){
  const u = (zb / period) * Math.PI * 2;
  const g = Math.sin(u * 5 + x * 0.021) * 0.62
          + Math.sin(u * 11 + 2.3 + x * 0.047) * 0.34;
  // the raw sum spans +-0.96; saturate that into the range the
  // geometry is allowed to use
  return sat(g, -1.6, 0.45, -0.96, 0.96);
}

/* ------------------------------------------------------------------
   THE SURFACE
   ------------------------------------------------------------------ */

/** The columns at one z row: their shifted x and their height.
 *  This is verbatim what ridgeGeometry pushes as vertices, which is
 *  the point — the sampler and the mesh must not be able to disagree. */
export function columnsAt(zb, period){
  const w = wanderAt(zb, period);
  const top = ridgeAt(zb, period);
  return PROF.map(q => ({
    x: q.x + w * wanderScale(q.x),
    y: top + q.dy + q.h * gradeAt(zb, q.x, period)
  }));
}

/** The analytic surface: the field the mesh is sampled FROM, with the
 *  cross-section interpolated smoothly rather than linearly.
 *
 *  Smooth interpolation between the knots, not more knots. A cubic
 *  through the columns would ring; a quintic ease between each
 *  neighbouring pair cannot overshoot and has zero slope at every
 *  knot, which is more than smooth enough for scenery and is
 *  monotone between knots by construction. */
export function terrainY(x, zb, period){
  const c = columnsAt(zb, period);
  if(x <= c[0].x) return c[0].y;
  if(x >= c[c.length - 1].x) return c[c.length - 1].y;
  let i = 0;
  while(i < c.length - 2 && x > c[i + 1].x) i++;
  const t = (x - c[i].x) / (c[i + 1].x - c[i].x);
  return c[i].y + (c[i + 1].y - c[i].y) * smoother(t);
}

/** The surface that is actually DRAWN: linear between columns and
 *  linear between rows, because that is what triangles are.
 *
 *  Used by the glider's shadow, which has to lie on the triangles the
 *  GPU renders and not on the function they were sampled from, and by
 *  tools/continuity.mjs, which measures the kink angle at every knot. */
export function meshY(x, zb, period, rows = rowsOf(period)){
  const rowY = zr => {
    const c = columnsAt(zr, period);
    if(x <= c[0].x) return c[0].y;
    if(x >= c[c.length - 1].x) return c[c.length - 1].y;
    let i = 0;
    while(i < c.length - 2 && x > c[i + 1].x) i++;
    const t = (x - c[i].x) / (c[i + 1].x - c[i].x);
    return c[i].y + (c[i + 1].y - c[i].y) * t;
  };
  const f  = (((zb % period) + period) % period) / period * rows;
  const i0 = Math.floor(f), fr = f - i0;
  return rowY((i0 / rows) * period) * (1 - fr)
       + rowY(((i0 + 1) / rows) * period) * fr;
}

/* ------------------------------------------------------------------
   THE GATE LIP PROFILE
   ------------------------------------------------------------------
   The columns the opening is built across, and how far each one steps
   away from the centre lane. Shared with tools/continuity.mjs for the
   usual reason: a replica in the sampler could drift from the thing it
   is sampling, which makes the measurement worthless at exactly the
   moment it matters.

   IT WAS THE WORST JUT IN THE CHAPTER AND IT IS ON THE EDGE YOU FLY
   THROUGH. Every column except the middle took an independent
   quantised random offset of up to 1.8 m, over spans of 4.6 m, with
   the centre pinned — so the lip turned up to 36 degrees at the knot
   directly in front of the reader. Measured at the knots, exactly,
   because sampling a piecewise-linear profile on some other grid
   dilutes the angle and hides it.

   The shape is now a smooth U with a small per-column jitter on top:
   zero slope at the centre, so the knot the reader looks straight at
   is flat, and the sides still visibly rougher than the lane. Both
   terms are non-negative in the gate's own direction, which preserves
   the invariant that variation only ever makes the hole BIGGER.
   ------------------------------------------------------------------ */
/* THE PER-COLUMN JITTER WAS BLOCKING REFINEMENT, so it is gone.
   -------------------------------------------------------------------
   The previous version added an independent quantised offset at each
   column on top of the smooth U. That is unbounded f'' by
   construction: the roughness does not shrink as the columns get
   closer together, so halving the lip's spacing would have made the
   knot angle WORSE rather than better — the one thing that must not
   be true of anything on a mesh about to be subdivided.

   It is a smooth ripple along x now, with a per-gate phase so gates
   still differ from each other. Same read — a level lane with rougher
   sides — and it refines.

   Non-negative in the gate's own direction at every x, which keeps
   the invariant that variation only ever makes the hole BIGGER.
   ------------------------------------------------------------------- */
export const LIP_COLS = 31;
export const GX = Array.from({ length: LIP_COLS },
  (_, i) => -15 + (i / (LIP_COLS - 1)) * 30);

export function lipOffset(gateI, k){
  const x = GX[k];
  // the smooth part: a U across the opening, quantised PER GATE so a
  // gate still has one decided size rather than a continuum. Quantising
  // a per-object constant is harmless — there is no surface across
  // which it varies, so it has no derivative to be discontinuous in.
  const vmax = Math.round((((gateI * 31) % 11) / 11 * 1.8) / 0.6) * 0.6;
  const t = Math.abs(x) / 15;
  const u = t * t * t * (t * (t * 6 - 15) + 10);   // C2, flat at x = 0
  // the rough part: one smooth lobe along the lip, phase per gate,
  // raised so it never dips below zero
  const ph = ((gateI * 2.399) % 6.283);
  const j = 0.17 * (0.5 - 0.5 * Math.cos(x * 0.42 + ph));
  return vmax * u + j;
}

/** The highest the drawn surface ever reaches, sampled rather than
 *  reasoned about. The corridor floor has to clear this, and the
 *  guarantee is re-derived from the geometry rather than from
 *  RIDGE_TOP, which only bounds the spine. */
export function highestDrawn(period, dz = 1.0, dx = 2.0){
  let peak = -Infinity, at = null;
  for(let z = 0; z < period; z += dz){
    for(let x = -40; x <= 40; x += dx){
      const y = meshY(x, z, period);
      if(y > peak){ peak = y; at = { z:+z.toFixed(1), x:+x.toFixed(1) }; }
    }
  }
  return { peak:+peak.toFixed(3), at, ridgeTop: RIDGE_TOP };
}
