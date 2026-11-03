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
   THE CROSS-SECTION
   ------------------------------------------------------------------
   One open profile across the width, extruded along z. `dy` is
   relative to the crest; the two ends drop away out of frame.

   Fifteen columns rather than the original nine. The extra ones are
   not detail for its own sake: the fragment shader paints this
   surface from an INTERPOLATED tone, and between x = -34 and x = -120
   there were no vertices at all, so every value band across eighty-six
   metres of hillside was a straight line between two columns.

   But more knots is not smoothness, and that is the lesson of
   2 November. A triangle mesh is piecewise linear by construction, so
   it has a slope discontinuity at EVERY knot; what decides whether
   that reads as a jut is the ANGLE of the kink, which is roughly
   f'' * spacing. Halving the spacing halves the angle only if f'' is
   bounded. Where the underlying field is quantised, f'' is unbounded
   and no number of knots helps at all. See tools/continuity.mjs.
   ------------------------------------------------------------------ */
export const PROF = [
  { x:-190, dy:-15,   tone:3, h:0 },
  { x:-150, dy: -6.5, tone:3, h:0 },
  { x:-120, dy: -1.2, tone:1, h:1 },
  { x: -86, dy: -0.7, tone:1, h:1 },
  { x: -58, dy: -0.3, tone:2, h:1 },
  { x: -34, dy:  0,   tone:0, h:1 },
  { x: -13, dy:  0.4, tone:0, h:1 },
  { x:   0, dy:  0,   tone:0, h:1 },
  { x:  13, dy:  0.4, tone:0, h:1 },
  { x:  34, dy:  0,   tone:0, h:1 },
  { x:  58, dy: -0.3, tone:2, h:1 },
  { x:  86, dy: -0.7, tone:1, h:1 },
  { x: 120, dy: -1.2, tone:1, h:1 },
  { x: 150, dy: -6.5, tone:3, h:0 },
  { x: 190, dy:-15,   tone:3, h:0 }
];

/** How many z rows the ridge mesh is built from. About one every four
 *  metres; the mesh is linear between them, so this is the spacing
 *  that multiplies f'' to give the visible kink angle. */
export const rowsOf = period => Math.round(period / 4);

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
    x: q.x + w * (Math.abs(q.x) > 100 ? 0.4 : 1),
    y: top + q.dy + (q.h ? gradeAt(zb, q.x, period) : 0)
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
