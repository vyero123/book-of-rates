/* Pearl Diver — THE DOVE, AS A SHAPE.
 *
 * At the top of the breath she raises the pearl and it opens into a
 * bird. This module is the bird: pure numbers, no three.js and no DOM,
 * for the same reason app/js/long-air-terrain.js is — tools/continuity.mjs
 * has to sample EXACTLY the contour that gets drawn, and a Node tool
 * cannot import a <script type="module"> block out of an HTML page. A
 * wing's outline is a contour like any other and gets checked like one.
 *
 * ONE SURFACE, TWO PARAMETERISATIONS, AND THAT IS THE TRANSFORMATION.
 * ------------------------------------------------------------------
 * The pearl is not crossfaded into a bird and the bird is not a second
 * sprite. There is a single grid of vertices over (u, w), and every
 * vertex has two positions: where it sits on a SPHERE of the pearl's
 * own radius, and where it sits on the DOVE. The morph interpolates
 * between them, so the thing on screen at morph 0 is exactly the pearl
 * that has been in the chapter all along and the thing at morph 1 is
 * the bird — and in between, the sphere's two ends draw out into
 * wings, because that is what the parameterisation does when you pull
 * it.
 *
 * The mapping is chosen to make that read: the sphere's two POLES
 * become the two WINGTIPS, and the sphere's equator becomes the
 * body's cross-section. So the sphere opens along its own axis.
 *
 *   u  0..1   around the cross-section (wraps)
 *   w -1..1   along the span; 0 is the breastbone, +-1 the wingtips
 *
 * EVERY FUNCTION HERE IS C2. The silhouette of a wing in motion shows
 * every defect, and the project's own finding from Long Air applies
 * unchanged: the kink angle at a mesh knot is about f'' times the
 * spacing, so a quantised or hard-clamped profile cannot be fixed by
 * subdividing it. Nothing here quantises and nothing here clamps with
 * Math.min/Math.max across a range that bites; the quintic `sm` is
 * used throughout and has zero first and second derivative at both
 * ends.
 *
 * ORIGINAL WORK. A generic bird in flight, built from smooth profile
 * functions. No existing character, mark or frame (design doc 4.1).
 */

/** The quintic ease. Zero slope AND zero curvature at both ends, so
 *  blends built from it cannot leave a kink where they start or stop. */
export const sm = t => {
  const c = t <= 0 ? 0 : t >= 1 ? 1 : t;
  return c * c * c * (c * (c * 6 - 15) + 10);
};

/* ------------------------------------------------------------------
   The sizes. The pearl's radius is the one number that is not free:
   it has to be the radius the chapter has been drawing, or the moment
   the mesh takes over from the old sphere would be a visible pop.
   ------------------------------------------------------------------ */
export const PEARL_R   = 0.22;    // matches the sphere this replaces
export const HALF_SPAN = 0.34;    // 0.68 m across the wings

/* ------------------------------------------------------------------
   The profile functions — the contour the sampler checks
   ------------------------------------------------------------------ */

/** Where this station sits along the span. */
export const spanX = w => w * HALF_SPAN;

/** Half the fore-aft chord. Wide at the breast, easing down across the
 *  inner wing, then tapering to a rounded tip — a taper, not a
 *  rectangle, and rounded rather than pointed because a point is a
 *  curvature spike and the tip is the fastest-moving part of the
 *  silhouette. */
export function chordHalf(w){
  const a = Math.abs(w);
  const root  = 0.21 - 0.085 * sm((a - 0.05) / 0.55);
  const taper = 1 - sm((a - 0.28) / 0.72);
  return root * taper + 0.010;
}

/** Half the thickness. The body is round; the wing is a blade. */
export function thickHalf(w){
  const a = Math.abs(w);
  return 0.105 * (1 - sm((a - 0.04) / 0.46)) + 0.006;
}

/** The wing sweeps back as it goes out. Forward is +z. */
export function sweepZ(w){
  return -0.17 * sm((Math.abs(w) - 0.10) / 0.90);
}

/** And rises: dihedral. */
export function dihedralY(w){
  return 0.065 * sm((Math.abs(w) - 0.12) / 0.88);
}

/** The cross-section's centre, which carries the tail: the body sits
 *  a little back of the shoulder so there is something behind the
 *  wings as well as in front. */
export function centreZ(w){
  return sweepZ(w) - 0.030 * (1 - sm(Math.abs(w) / 0.5));
}

/* ------------------------------------------------------------------
   The two parameterisations
   ------------------------------------------------------------------ */

/** The dove. */
export function dovePoint(u, w){
  const ang = u * Math.PI * 2;
  return [ spanX(w),
           dihedralY(w) + thickHalf(w) * Math.sin(ang),
           centreZ(w)   + chordHalf(w) * Math.cos(ang) ];
}

/** The pearl: the same grid, laid on a sphere, with the poles at the
 *  wingtips so the opening runs along the span. */
export function spherePoint(u, w){
  const ang = u * Math.PI * 2;
  const th  = (1 - w) * 0.5 * Math.PI;      // w=+1 -> 0, w=-1 -> PI
  const s   = Math.sin(th);
  return [ PEARL_R * Math.cos(th),
           PEARL_R * s * Math.sin(ang),
           PEARL_R * s * Math.cos(ang) ];
}

/** Outward normal of either surface, by central difference. Exact
 *  enough at both ends of the morph, which is what matters: the shaded
 *  terminator has to be identical to the old pearl's at morph 0. */
function normalOf(fn, u, w){
  const h = 1e-3;
  const a = fn(u + h, w), b = fn(u - h, w);
  const c = fn(u, Math.min(1, w + h)), d = fn(u, Math.max(-1, w - h));
  const du = [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
  const dw = [c[0]-d[0], c[1]-d[1], c[2]-d[2]];
  let n = [ du[1]*dw[2] - du[2]*dw[1],
            du[2]*dw[0] - du[0]*dw[2],
            du[0]*dw[1] - du[1]*dw[0] ];
  const L = Math.hypot(n[0], n[1], n[2]) || 1;
  n = [n[0]/L, n[1]/L, n[2]/L];
  // point it outwards: away from the span axis for a surface of this
  // shape, which the sphere case agrees with
  const p = fn(u, w);
  const dot = n[1]*(p[1] - dihedralY(w)) + n[2]*(p[2] - centreZ(w));
  return dot < 0 ? [-n[0], -n[1], -n[2]] : n;
}
export const doveNormal   = (u, w) => normalOf(dovePoint, u, w);
export const sphereNormal = (u, w) => {
  const p = spherePoint(u, w);
  const L = Math.hypot(p[0], p[1], p[2]) || 1;
  return [p[0]/L, p[1]/L, p[2]/L];
};

/* ------------------------------------------------------------------
   THE MESH RESOLUTION
   ------------------------------------------------------------------
   Set by tools/continuity.mjs against the same four-degree knot bar
   the terrain is held to, not by eye. The span axis carries the
   silhouette — the leading and trailing edges of a wing in motion —
   so it gets the finer count of the two.
   ------------------------------------------------------------------ */
export const NU = 36;     // around the cross-section
export const NW = 96;     // along the span

/** HOW LATE THIS STATION UNFOLDS. The body opens first and the tips
 *  last, which is what makes it read as opening rather than inflating.
 *
 *  The spread is bounded for a reason the sampler found: if
 *  neighbouring stations unfold at sufficiently different rates the
 *  surface crosses itself at the wingtip part-way through the morph.
 *  At 0.55 delay over a 0.45 window it folded by 7 mm around morph
 *  0.7; at 0.40 over 0.60 it does not fold at all. Checked, not
 *  reasoned about. */
export const unfold = (m, w) => sm((m - Math.abs(w) * 0.40) / 0.60);

/* THE SPAN USES THE GLOBAL MORPH, THE CROSS-SECTION USES THE DELAY,
   and that split is what stops the surface folding through itself.
   ------------------------------------------------------------------
   Delaying ALL three coordinates per station reverses the ordering at
   the wingtip part-way through the opening. The arithmetic: near
   w = -1 the sphere's x barely changes with w (it is a pole, so
   dx/dw -> 0) while the dove's changes at the full half-span rate, and
   the delay contributes a term proportional to d(local)/dw times the
   gap between the two. Measured at a 0.55 delay the surface folded by
   7 mm; at 0.40 it still folded by 1.2 mm. Tuning it down further
   would only have made the fold smaller, not absent.

   Interpolating the SPAN with one global morph makes ordering
   monotone by construction — both endpoint curves are monotone in w,
   so any convex combination of them is too, at every value of m. The
   "opens from the breast outward" read survives intact, because it
   was never the span that carried it: it is the cross-section
   flattening progressively from body to tip that looks like unfolding.

   The vertex shader is these same two lines. */
export function morphPoint(u, w, m){
  const s = spherePoint(u, w), d = dovePoint(u, w);
  const k = unfold(m, w);
  return [ s[0] + (d[0] - s[0]) * m,
           s[1] + (d[1] - s[1]) * k,
           s[2] + (d[2] - s[2]) * k ];
}

/** The signed span value at row j of the grid. */
export const wAt = j => -1 + (j / NW) * 2;
/** The angle parameter at column i of the grid. */
export const uAt = i => i / NU;
