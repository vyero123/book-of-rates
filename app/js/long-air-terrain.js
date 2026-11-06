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

import { ridgeAt, wanderAt, RIDGE_TOP, sat, MAG_V, MAG_T, RELIEF_AMP } from './long-air-breath.js';
/* Every vertical quantity in this file is a multiple of one of these
   two. MAG_T for anything that is part of the HILL, MAG_V for
   anything that belongs to the flight band — the gate lips, the cloud
   banks. Raising MAG in long-air-breath.js moves all of it together,
   which is the point of there being one knob. */
const T = MAG_T, V = MAG_V;

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
  const bump = a < 34 ? 0.40 * T * Math.pow(Math.sin(Math.PI * a / 34), 2) : 0;
  // the fall away, one smooth descent over the whole outer width
  const t = Math.min(1, Math.max(0, (a - 34) / (SPAN - 34)));
  const drop = 15.0 * T * (t * t * t * (t * (t * 6 - 15) + 10));
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

/* HOW FINE — AND THE BAR IS ANGULAR NOW, NOT WORLD-SPACE.
   ------------------------------------------------------------------
   These used to be set by a four degree worst-knot bar measured in
   WORLD space, and that bar was the wrong quantity. Four degrees of
   turn 120 m away is invisible; the same four degrees at 24 m is a
   facet. The old report knew it mattered — it carried an "as seen"
   column — but computed it as `deg * min(1, 40/dist)`, a heuristic
   with no optics in it.

   tools/continuity.mjs now projects each knot and its two neighbours
   through the chapter's REAL lens (its own fov(aspect), its own
   trailing distance and aim, on a 375 x 812 phone) and measures how
   far the knot's image sits off the chord joining its neighbours'.
   That is the question "does this read as a polygon" asked in the only
   units that can answer it. The projector is checked against two known
   cases — the aim point must land at frame centre, a 1 m stick at 40 m
   must subtend the 15.6 px the optics require — before any of its
   numbers are believed.

   Measured on the near cross-section, which is where the reader
   actually looks (24 m out, just off the spine):

     COLS  spacing   sagitta      world-space knot
      65    5.94 m    3.77 px      2.56 deg   <- passed the old 4 deg bar
      85    4.52 m    2.26 px      2.00 deg
     105    3.65 m    1.50 px      1.63 deg
     129    2.97 m    1.00 px      1.36 deg   <- here
     161    2.37 m    0.65 px      1.11 deg

   So the old build was comfortably inside its four degree bar and
   nearly four pixels off its own chord at the distance it is read at.
   That is the brief's suspicion confirmed: the bar was too loose
   exactly where it mattered.

   129, NOT 105. The bar is 2 px — where faceting becomes legible on a
   375 px screen — and 105 would clear it at 1.50. But a vertex less
   than a pixel off its own chord cannot be SEEN to be a vertex at
   all, and 129 is where that happens. Picking the first value that
   scrapes under the line is the thing this project has a note about;
   this is picked for the property, with the bar left as the backstop.

   ROWS ARE UNCHANGED at 2.6 m, because the same instrument measures
   the along-course knots at 0.58 px — already more than three times
   inside the bar. Refining them would have cost triangles and bought
   nothing, which is the whole reason for measuring the two axes
   separately rather than raising both together.

   Sagitta goes as the SQUARE of the spacing, and the table confirms
   it: doubling the columns quartered it. That is also the proof that
   the field's curvature is bounded and therefore that subdivision is
   the right lever here at all — the same test that said it was the
   wrong lever while the profile was quantised. */
/* 153 AND 2.3, UP FROM 129 AND 2.6. The fine octave is the reason:
   its shortest term is 10.7 m down the course, which needs about
   four samples a cycle to be drawn rather than aliased.

   MEASURED AT THREE SETTINGS RATHER THAN PICKED, because the ridge
   is the single largest line in this chapter's triangle budget and
   "not too stingy" is not a licence to waste:

       169 / 2.0   112,896 tri   0.70 px across, 0.77 along
       153 / 2.3    88,768       0.89            1.01
       145 / 2.5    77,472       0.99            1.11

   153 and 2.3 is shipped. It holds the ONE pixel line — the point
   below which a vertex cannot be seen to be a vertex at all, which
   is stricter than the 2 px bar the chapter gates on — on both axes.
   The 24,000 extra triangles the finer setting buys go entirely into
   the difference between 0.70 px and 0.89 px, which nobody can see.
   The coarsest setting breaks the 1 px line along the course, so it
   is not free either. */
export const COLS = 153;
export const ROW_SPACING = 2.3;

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
  return sat(g, -1.6 * T, 0.45 * T, -0.96, 0.96);
}

/* ------------------------------------------------------------------
   THE SURFACE
   ------------------------------------------------------------------ */

/* ==================================================================
   THE FINE OCTAVE — 6 November 2026
   ==================================================================
   The hill was three smooth fields: a spine running four harmonics
   down z, a cross-section that is one bump and one long fall, and a
   cross-course grade of two harmonics. All of them are tens of metres
   across, so the surface had SHAPE and no GRAIN — the reader said it
   does not read as a material, and it did not, because every feature
   on it was bigger than the frame.

   WHAT THE SCALE HAD TO BE, and why it is not finer. The mesh samples
   2.2 m down the course and 2.6 m across it, so anything under about
   9 m of wavelength is below four samples a cycle and aliases — it
   would not be texture, it would be noise that changes when the rows
   move. So the shortest term here is 8.5 m and the rest are longer;
   metre-scale grain belongs in the fragment stage and is there (see
   the rock material in long-air.html), which is also where the sail's
   weave and the cloud's wool live. Geometry buys the silhouette and
   the way light falls across a slope; it does not buy grain.

   THE TERMS ARE FOLDED, NOT ADDED. Two sines of x and z summed give a
   plaid you can read in a second — the fault the kit's caustic note
   describes and the wind field avoids the same way. Each component
   here has the other axis folded into its phase, so no direction and
   no period is legible, and because the fold is a bounded sine of a
   linear argument the curvature stays bounded and the whole thing
   refines.

   PERIODIC IN zb BY CONSTRUCTION: every z term is an integer multiple
   of the strip's own angle, so the wrap seam closes in value and in
   slope without anything being tuned to make it.
   ================================================================== */
export function reliefAt(x, zb, period){
  const u = (zb / period) * Math.PI * 2;
  const s1 = Math.sin(u * 37 + x * 0.16);
  const s2 = Math.sin(u * 55 + 2.1 + Math.sin(x * 0.13) * 1.1);
  const s3 = Math.sin(x * 0.26 + 0.9 + Math.sin(u * 23) * 0.9);
  /* the weights sum to 1.15, which is what long-air-breath.js takes
     off SPINE_TOP so RIDGE_TOP still bounds the drawn surface */
  return (s1 * 0.50 + s2 * 0.30 + s3 * 0.35) * RELIEF_AMP * T;
}

/** The columns at one z row: their shifted x and their height.
 *  This is verbatim what ridgeGeometry pushes as vertices, which is
 *  the point — the sampler and the mesh must not be able to disagree. */
export function columnsAt(zb, period){
  const w = wanderAt(zb, period);
  const top = ridgeAt(zb, period);
  return PROF.map(q => ({
    x: q.x + w * wanderScale(q.x),
    /* the fine octave rides on everything else and is NOT tapered by
       q.h: grain does not stop at the lit crest band, it is what the
       ground is made of all the way out */
    y: top + q.dy + q.h * gradeAt(zb, q.x, period) + reliefAt(q.x, zb, period)
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

/** The lip offset as a function of x rather than of a column index.
 *  This is the primitive; lipOffset(gateI, k) is it sampled at GX[k].
 *  The buttress needs it at columns GX does not have, and a second
 *  copy of the formula for those is exactly the fault that had the
 *  sampler measuring a surface the page did not draw. */
export function lipOffsetAt(gateI, x){
  // the smooth part: a U across the opening, quantised PER GATE so a
  // gate still has one decided size rather than a continuum. Quantising
  // a per-object constant is harmless — there is no surface across
  // which it varies, so it has no derivative to be discontinuous in.
  const vmax = Math.round((((gateI * 31) % 11) / 11 * 1.8) / 0.6) * 0.6;
  const t = Math.min(1, Math.abs(x) / 15);
  const u = t * t * t * (t * (t * 6 - 15) + 10);   // C2, flat at x = 0
  // the rough part: one smooth lobe along the lip, phase per gate,
  // raised so it never dips below zero
  const ph = ((gateI * 2.399) % 6.283);
  const j = 0.17 * (0.5 - 0.5 * Math.cos(x * 0.42 + ph));
  return vmax * u + j;
}
export function lipOffset(gateI, k){ return lipOffsetAt(gateI, GX[k]); }

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

/* ==================================================================
   THE TREELINE — 3 November 2026
   ==================================================================
   Wind-bent trees standing on the ridge's shoulders. They are the one
   thing added in this detail pass that is a SILHOUETTE AGAINST SKY,
   which is the worst case for a polygonal outline: a facet on a hill
   is hidden by the hill's own value bands, and a facet on an edge
   against a flat sky is the only thing there is to look at.

   So the profile lives here, next to the terrain it stands on and
   inside the module tools/continuity.mjs already samples, and the
   sampler projects the drawn outline through the chapter's own lens
   and holds it to the same pixel bar as the ridge. A replica of this
   in the page would be the exact fault that made the whole continuity
   campaign of 2 November meaningless.

   THE WIDTH PROFILE. A trunk term that tapers linearly to nothing and
   a crown term that is a power of sin(pi f), so the outline is zero
   at the ground-level edge of the trunk, bulges through the crown and
   closes to a POINT at the top. A blade that stops at a constant
   width ends in a rectangle, which is what Pearl Diver's coral did
   before its taper was taken from 0.65 to 0.94; a tree that does it
   is a lollipop. Both terms are C-infinity in f, so the curvature is
   bounded and subdivision converges -- which is the property that
   makes SEG a knob rather than a wish.

   THE LEAN is quadratic in height, which is what a wind-bent trunk
   is: no bend at the root, most of it in the top third. It is a
   per-tree constant times f*f, so it adds no curvature of its own
   beyond a constant second derivative.
   ================================================================== */

/** How many segments up a tree. Eight: measured through the chapter's
 *  own lens by tools/continuity.mjs, which reports the worst
 *  silhouette knot in the whole treeline in pixels off its own chord
 *  and holds it to the same 2 px bar the ridge is held to. */
export const TREE_SEG = 8;

/** Half-width of the silhouette at height fraction f, for a tree with
 *  trunk half-width wT and crown half-width wC. */
export function treeWidth(f, wT, wC){
  return wT * (1 - f) * 0.30 + wC * Math.pow(Math.sin(Math.PI * f), 2.2);
}

/** Lateral offset of the trunk's centre at height fraction f. */
export function treeLean(f, lean){ return lean * f * f; }

/* WHERE THEY STAND. On the shoulders and the upper skirt only:
   inside |x| = 30 is the lane the gates are cut through and the
   reader's own flight path, and past |x| = 82 the hill has fallen far
   enough that a tree is below the frame at every altitude in the
   corridor.

   THE HEIGHT IS CAPPED SO NOTHING EVER ENTERS THE CORRIDOR. The drawn
   terrain peaks at RIDGE_TOP (3.4 m, re-derived and checked by the
   sampler) and the corridor floor is CORR_LO. A cap of 4.2 m puts the
   tallest possible treetop at 7.6 m, which is under the floor with
   four tenths of a metre to spare -- so this is scenery that cannot
   become geometry the glider has to be protected from, and
   tools/regress.mjs's clearances are untouched by construction rather
   than by re-measurement.

   Deterministic from the index, like every other quantity-item in
   this project: no Math.random anywhere, so the sampler measures the
   trees the page draws. */
export const TREE_N = 56;
export const TREE_MAX_H = 3.6 * T;
export const TREES = Array.from({ length: TREE_N }, (_, i) => {
  const side = (i % 2) ? 1 : -1;
  const r = k => ((i * k) % 97) / 97;
  return {
    i,
    x:    side * (30 + r(7919) * 52),
    zf:   (i / TREE_N + r(6367) * 0.012) % 1,      // fraction of the strip
    h:    2.1 * T + r(5281) * (TREE_MAX_H - 2.1 * T),
    wT:   (0.26 + r(4409) * 0.16) * T,
    wC:   (0.42 + r(3779) * 0.34) * T,
    /* all of them lean the same way, because a prevailing wind is
       what bends a treeline and trees leaning at random would read
       as damage rather than as weather. +x is downwind: it is the
       sign of WIND.DIR_X in js/wind.js. */
    lean: (0.30 + r(2749) * 0.24) * T,
    seed: (i * 1.91) % 6.283
  };
});

/* ==================================================================
   THE CLOUD LIP — a silhouette, not a slab with detail on it
   ==================================================================
   6 November 2026. The reader: the clouds look nothing like clouds,
   in shape or colour. The shape half is the one that matters first,
   and the diagnosis is exact — the banks were a smooth U with a
   single ripple on it, shaded with a wool field. That is a SLAB WITH
   SURFACE DETAIL. What makes a cloud read as a cloud is its OUTLINE:
   rounded bulges at several scales, cauliflower rather than lobed,
   sitting on a flattish base. No amount of shading rescues a wrong
   silhouette, and shading that does not follow the bulges actively
   fights it.

   WHY THE OLD PROFILE COULD NOT HAVE BULGES, and what changed.
   The turn angle at a knot is about f'' times the column spacing, and
   for a component of amplitude A and wavenumber k that is A k^2 h.
   The shared lip had 31 columns across 30 m, so h = 1 m, and the
   chapter's 4 degree world-space bar allows A k^2 <= 0.07. For bulges
   eight metres across that is an amplitude of eleven centimetres:
   invisible. The profile was not timid, it was at its resolution
   limit.

   BOTH HALVES OF THAT ARE FIXED. The columns go to 91 over the same
   30 m, h = 0.33 m; and the bar becomes the PIXEL sagitta through the
   chapter's own lens, which is the honest quantity and the one the
   ridge, the trees and the dove are already held to. A 4 degree
   world bar on a 0.33 m segment is 0.11 px of bulge at the distance a
   gate is read at — it was never measuring what a reader can see, it
   was measuring the segment length. tools/continuity.mjs now projects
   this profile.

   THREE SCALES, each a plain cosine of x with a per-gate phase, so
   the curvature is bounded and the whole thing refines — the lesson
   of the per-column jitter that had to be taken out of lipOffset.
   Amplitudes are chosen against the budget above and then MEASURED
   rather than trusted:

       1.8 m at 11 m across   A k^2 = 0.59
       0.7 m at  5 m          = 1.10
       0.22 m at 2.2 m        = 1.79
                        total  3.48   against about 3.9 at a 2 px bar

   NON-NEGATIVE IN THE GATE'S OWN DIRECTION at every x, which keeps
   the standing invariant that variation only ever makes the hole
   BIGGER. Each component is written as (1 - cos)/2 times its
   amplitude, which is zero at its own minima and never negative, so
   the sum cannot dip below the base lip however the phases land.

   AND A FLATTISH BASE. The bulges are weighted by a smooth window
   that is small in the middle of the opening and full at the sides,
   so the part of the bank the reader flies under is close to level
   and the cauliflower is where the cloud is deep. That is what a
   cumulus does and it is also what keeps the opening honest.
   ================================================================== */
/* THE WHOLE OUTLINE, NOT JUST THE BOTTOM EDGE — second pass,
   6 November 2026, after looking at the first one on the deployed
   build. The cauliflower went on the LIP and the lip alone, and the
   bank still read as a white block: its top was a flat line at the
   ceiling and its sides were vertical cuts at x = +-15. Most of a
   cloud's silhouette is its top and its ends. Putting bumps on the
   one edge that was already the least of the problem is the kind of
   fix that measures well and changes nothing.

   So the columns run to +-26 and the bank CLOSES: past the opening
   the lip rises to meet the crown, so each end is a rounded shoulder
   rather than a cut. The crown gets its own three scales, with
   different phases from the lip's, so the top is as lumpy as the
   bottom and the two do not rhyme. The bank is a closed blob now and
   there is clear sky past its ends, which there should be. */
export const CLOUD_LIP_COLS = 121;
export const CLOUD_HALF = 22;
export const CGX = Array.from({ length: CLOUD_LIP_COLS },
  (_, i) => -CLOUD_HALF + (i / (CLOUD_LIP_COLS - 1)) * CLOUD_HALF * 2);

/** 0 across the opening, 1 where the bank has closed. Quintic, so
 *  the shoulder is C2 at both ends. */
export function cloudEnd(x){
  const t = Math.min(1, Math.max(0, (Math.abs(x) - 15) / (CLOUD_HALF - 15)));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** The crown's own cauliflower, upward. Same construction as the
 *  lip's and deliberately different phases: a cloud whose top echoed
 *  its bottom would read as an extruded shape, which is what this
 *  whole pass is for. Non-negative, so it only ever adds height. */
export function cloudCrown(gateI, k){
  const x = CGX[k];
  const ph = n => ((gateI * 1.733 * n + 2.1) % 6.283);
  const lobe = (amp, wave, n) => amp * 0.5 * (1 - Math.cos(x * (2 * Math.PI / wave) + ph(n)));
  return lobe(3.20 * V, 17.0, 1) + lobe(1.00 * V, 8.0, 2) + lobe(0.30 * V, 4.0, 3);
}

/* HOW DEEP A BANK IS, and why it is not the ceiling any more.
   ------------------------------------------------------------------
   The crown used to sit at ceilAt + 2, which for a low gate is a
   twenty-five metre white tower thirty metres wide. That is a wall,
   which is what it was when it had to be one; a bank that closes at
   its ends has to have proportions a cloud has. Twelve metres against
   sixty-four wide is a cumulus.

   THE SHOULDER IS WHAT THIS NUMBER IS REALLY FOR. Closing the ends
   means the lip climbs the whole depth of the bank over CLOUD_HALF -
   15 metres, and that shoulder is the sharpest turn in the profile.
   For a rise R over span S at column spacing h the knot angle is
   about 5.77 R h / S^2 and the sagitta is that times h/8, so holding
   1.5 px at the twelve metres a gate is nearest needs

       R <= 0.0333 S^2 / h^2

   At S = 17 and h = 0.71 that is 19.0 m, against a worst case here of
   twelve plus the crown's own 4.9 m of bulge. Measured rather than
   trusted: tools/continuity.mjs projects the DRAWN outline.

   ceilAt still bounds it -- the crown may not exceed ceilAt + 2 --
   so the field still means something and is still checked, but it no
   longer POSITIONS the crown. */
export const BANK_DEPTH = 12 * V;

/** The drawn underside of a bank at one column: the cauliflower where
 *  the opening is, rising to meet the crown where the bank closes.
 *  THIS is the curve the page draws, so this is the curve the sampler
 *  measures — the first version of the close had the page drawing
 *  this and the sampler still measuring cloudLip alone, and the check
 *  fired on a 129 degree turn that was not where it said it was. */
export function cloudUnder(gateI, k, lipBase, crownY){
  const under = lipBase + cloudLip(gateI, k);
  const e = cloudEnd(CGX[k]);
  return under + (crownY - under) * e;
}

/** The cloud bank's lower outline, in metres away from the opening.
 *  Shares the per-gate size decision with lipOffset so a wide gate is
 *  wide for both halves, and adds the bulges on top. */
export function cloudLip(gateI, k){
  const x = CGX[k];
  // the same decided per-gate opening the rock lip uses
  const vmax = Math.round((((gateI * 31) % 11) / 11 * 1.8 * V) / (0.6 * V)) * (0.6 * V);
  /* THE CLAMP IS LOAD-BEARING AND WAS MISSING. A quintic smootherstep
     is only a smootherstep on [0,1]; past it, t^3(6t^2-15t+10) grows
     without any bound at all. While CGX stopped at +-15 that could
     not happen. Widening it to close the bank's ends sent t to 2.5
     and this returned FOUR HUNDRED METRES at the outermost column,
     which is what the sampler was reporting as a 129 degree turn. It
     was right and the first reading of it was not: the curve really
     was turning, and not where the first explanation put it. */
  const t = Math.min(1, Math.abs(x) / 15);
  const u = t * t * t * (t * (t * 6 - 15) + 10);   // C2, flat at x = 0
  // the cauliflower, three scales, each non-negative by construction
  const ph = n => ((gateI * 2.399 * n) % 6.283);
  const lobe = (amp, wave, n) => amp * 0.5 * (1 - Math.cos(x * (2 * Math.PI / wave) + ph(n)));
  // flattish under the middle of the opening, full at the sides
  const win = 0.28 + 0.72 * u;
  return vmax * u + (lobe(1.80 * V, 11.0, 1) + lobe(0.55 * V, 5.5, 2)
                   + lobe(0.15 * V, 3.5, 3)) * win;
}

/** THE DRAWN UNDERSIDE OF A BANK IN THE KITE'S OWN LANE.
 *
 *  The buoyancy boundary has to be where the cloud IS, not where the
 *  opening's arithmetic puts it. Those were the same number until the
 *  cauliflower went on: cloudLip raises the drawn lip above the base
 *  lip everywhere, so a reader would have felt the push while still
 *  looking at clear air under the bank. The glider flies within about
 *  twenty centimetres of x = 0, so the column at x = 0 is the honest
 *  place to ask, and CGX has one exactly there by construction (91 is
 *  odd). Shared rather than re-derived at the three call sites. */
export const CLOUD_MID = (CLOUD_LIP_COLS - 1) / 2;
export function cloudBaseOffset(gateI){ return cloudLip(gateI, CLOUD_MID); }

/* ==================================================================
   THE GROUND IS ONE LANDSCAPE — 6 November 2026
   ==================================================================
   The reader: make the ground more continuous instead of interrupted
   shapes as the basis. As built the course was a ridge with flat
   slabs standing in it -- each rock gate ran from a plane at
   GROUND - 3 up to its lip and stopped dead at x = +-15, so it read
   as a card propped against the hill rather than as part of it.

   WHAT WAS ACTUALLY TRIED FIRST, AND WHY IT IS NOT HERE. The obvious
   reading is to fold the gates into columnsAt() so there is literally
   one surface. That cannot be built at this mesh resolution and the
   arithmetic says so rather than my taste: a gate's lower lip follows
   the schedule and reaches 24.6 m, the rows are 2.6 m apart, and for
   a smootherstep of height H over half-length L the worst knot angle
   is about 5.77 H h / L^2. Over a 30 m rise that is 0.154 x 2.6 =
   0.4 rad, twenty-three degrees at a single knot; to bring it under
   the chapter's bar needs rows 0.45 m apart, which is 1,500 rows and
   roughly 400,000 triangles for the ridge alone. A 24 m near-vertical
   feature every twenty metres is architecture, not terrain, and §4.2
   is explicit that a hard edge is legitimate -- the lip is the thing
   the reader aims at and is SUPPOSED to be an edge.

   So the gates stay their own mesh and stop being separate SHAPES,
   which is what was actually wrong:

     - the base is the DRAWN TERRAIN, sampled with meshY at every
       column, instead of a flat plane below everything. There is no
       junction to see and no gap that could open under one;
     - the columns run out to +-46 m instead of stopping at +-15, and
       the lip height blends down to that terrain across the flank,
       so a gate is a buttress swelling out of the hillside rather
       than a wall ending in mid-air;
     - it is painted in the hill's own value language, including the
       layered haze, so it reads as the same rock.

   The flank taper is a quintic, C2 at both ends, so it adds no kink
   where it meets the hill and none where it leaves the opening.
   ================================================================== */

/** How much of the gate's own lip height survives at x. 1 across the
 *  opening, 0 by the time the buttress has melted into the hillside. */
export const BUTT_HALF = 52;
export function gateFlank(x){
  const t = Math.min(1, Math.max(0, (Math.abs(x) - 15) / (BUTT_HALF - 15)));
  return 1 - t * t * t * (t * (t * 6 - 15) + 10);
}

/** The buttress columns. 61 across 92 m is 1.53 m apart, which is
 *  what the flank's own curvature needs to stay inside the pixel bar
 *  on the tallest gate; tools/continuity.mjs projects it rather than
 *  taking that on trust. */
/* 85, RAISED FROM 67 ON 6 NOVEMBER. Burying the flank put a little
   more curvature into it and the measurement went to 1.95 px against
   a 2 px bar, which is passing by an amount I would not trust. The
   reader has said the chapter runs at 60 fps and not to be stingy, so
   this is bought rather than argued around: sagitta goes as the
   square of the column spacing, so 67 -> 85 takes it to about 1.2 px.
   Costs 2,376 triangles across the strip. */
export const BUTT_COLS = 85;
export const BGX = Array.from({ length: BUTT_COLS },
  (_, i) => -BUTT_HALF + (i / (BUTT_COLS - 1)) * BUTT_HALF * 2);

/** The top of the buttress at one column: the gate's own lip where
 *  the opening is, the hill where it is not, and one smooth blend
 *  between. `lipBase` is the gate's lower lip (centre - half) and
 *  `groundY` is meshY at this column and this row. */
/* ==================================================================
   THE BURIED FLANK — 6 November 2026
   ==================================================================
   The reader: at the lowest points, weird ridges of rock appear and
   then disappear into the ground. Measured rather than guessed, and
   two likelier-sounding explanations were tested and REFUSED first:
   the drawn rock lip is never below the drawn terrain (zero columns
   out of 2,211), and the lip ribbon's 2.6 m span cuts under the hill
   by at most 3.3 cm. Neither is a visible anything.

   What IS happening: the flank taper is a quintic, so it approaches
   zero slowly, and the buttress therefore hugs the hill for several
   metres at each edge. About five columns per gate — both flanks,
   across the full 104 m width — sit within FIVE CENTIMETRES of the
   terrain. Two surfaces that close are one surface as far as a depth
   buffer is concerned, and they z-fight.

   Which is also why it is "at the lowest points": the complaint is
   about where the CAMERA is, not where the geometry is. Low in the
   corridor the lens looks along the hill rather than down on it, so
   the band is seen at a grazing angle — the worst case for depth
   precision and the largest screen area the band ever covers.

   THE FIX IS TO BURY THE FLANK RATHER THAN TO LAND IT. The rise is
   unchanged where it matters: at the opening gateFlank is 1 and the
   top is exactly the gate's own lip, so nothing about the mechanic or
   the aimable edge moves. Away from it the top is pushed BELOW the
   terrain by up to SINK, so the two surfaces separate instead of
   converging and there is nothing left to fight. Both terms are C2,
   so the flank is as smooth as it was.

   SINK is 0.4 m, which is eight times the five centimetres measured
   above and a quarter of the 1.67 m the lowest lip clears the crest
   by — far enough to be certain, small enough that no reader will
   ever see a buttress start a little way inside the hill. */
export const BUTT_SINK = 0.4;
export function buttressTop(x, gateI, lipBase, groundY){
  const lipY = lipBase - lipOffsetAt(gateI, x);
  const f = gateFlank(x);
  return groundY + (lipY - groundY) * f - BUTT_SINK * (1 - f);
}

/** The most the crown's cauliflower can ever add. Each lobe is
 *  amp * 0.5 * (1 - cos(...)), so its own maximum is amp; the sum is
 *  the bound. Exported so tools/continuity.mjs can assert the crown
 *  stays under the ceiling against the REAL bound instead of against
 *  a slack number somebody typed — which is what it was doing, and
 *  what broke the moment the amplitudes started scaling with MAG. */
export const CLOUD_CROWN_MAX = (3.20 + 1.00 + 0.30) * V;
