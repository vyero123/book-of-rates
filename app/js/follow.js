/* The Book of Rates — FOLLOWERS, EXACTLY INTEGRATED.
 *
 * WHY THIS MODULE EXISTS
 * ------------------------------------------------------------------
 * Every chapter has values that chase other values: a lens chasing a
 * figure, a figure chasing a schedule, an opening widening to make
 * room. Two mistakes keep getting made, and tools/temporal.mjs can now
 * see both of them.
 *
 * 1. `x += (want - x) * min(1, dt * k)`. This is the first-order
 *    approximation of an exponential approach. At the time constants
 *    this project uses it is a good approximation — measured, and the
 *    measurement refused the hypothesis that it was a significant
 *    cause of anything in Long Air — but it is approximate for no
 *    reason, and the min(1, ...) is itself a kink in dt that bites on
 *    exactly the long frames it was added to protect. `approach` below
 *    is the exact solution and costs one exp().
 *
 * 2. THE ONE THAT ACTUALLY MATTERS. A first-order follower chasing a
 *    target that STEPS gives motion that is continuous in position and
 *    DISCONTINUOUS IN VELOCITY. The moment `want` jumps by D, the
 *    follower's speed jumps by k·D, instantly, for ever, however
 *    smooth the follower itself is.
 *
 *    This is the fault that survived the first pass on Long Air's lens.
 *    Smoothing the per-phase look offset took its worst single-frame
 *    velocity jump from 146 units/s to 7.5 — a nineteen-fold
 *    improvement that still measured as a VELOCITY STEP, because the
 *    phase target still stepped underneath it. A position-only measure
 *    passes this case, which is why it had never been caught: nothing
 *    jumps, and yet the lens visibly lunges every time the phase
 *    changes.
 *
 *    The cure is an order of smoothing more than the fault. `tracker`
 *    is critically damped and second order, so a step in the target
 *    produces continuous position AND continuous velocity: the follower
 *    accelerates away from rest, which is what a camera on a real rig
 *    does and what a step through a first-order filter never does.
 *
 * Both are integrated EXACTLY — closed form over the step, not an
 * Euler step — so neither depends on the frame rate. That matters here
 * specifically: the reader's phone sits at 58 fps and drops frames,
 * and has said that is fine, so nothing may look different because of
 * it.
 *
 * Numbers only. No DOM, no three.js: tools/temporal.mjs drives these
 * directly, and what it drives is what ships.
 */

/** FIRST ORDER, exact. dx/dt = k(want - x) over one step.
 *
 *  1 - exp(-k·dt) is bounded by 1 for any dt, however long, so this
 *  needs no clamp — which is the other half of the point, because the
 *  clamp it replaces was a discontinuity in dt.
 *
 *  Use this for a target that is already smooth. For a target that
 *  steps, use `tracker`. */
export const approach = (x, want, k, dt) => x + (want - x) * (1 - Math.exp(-k * dt));

/** SECOND ORDER, CRITICALLY DAMPED, exact.
 *
 *  x'' = -2w·x' - w²(x - want), solved in closed form over dt with
 *  `want` held constant across the step. Critically damped, so it never
 *  overshoots and never rings: it is the fastest approach that does
 *  not oscillate, which is what a lens wants and what an opening
 *  making room wants.
 *
 *  The closed form. With d = x - want and the system critically
 *  damped, the solution is (A + B·t)·exp(-w·t) with A = d and
 *  B = v + w·d, so
 *
 *      x(t) = want + (d + (v + w·d)·t)·e^(-w·t)
 *      v(t) = ((v + w·d)·(1 - w·t) - w·d)·e^(-w·t)
 *
 *  `w` is in radians per second and 1/w is roughly the time to come
 *  most of the way: w = 8 settles in about a third of a second.
 *
 *  Returns a live object; call step(dt, want) every frame and read
 *  `.value`. `v` is exposed because a chapter that wants to pitch a
 *  figure with its own vertical speed should use the follower's
 *  velocity rather than differencing its position by hand.
 */
export function tracker(start = 0, w = 8){
  const T = {
    value: start,
    v: 0,
    w,
    /** Jump to a value with no motion — for a reset or a fresh
     *  protocol, where easing in from the old state would be a lie
     *  about continuity rather than continuity. */
    set(x){ T.value = x; T.v = 0; return T; },
    step(dt, want){
      const d = T.value - want;
      const B = T.v + T.w * d;
      const e = Math.exp(-T.w * dt);
      T.value = want + (d + B * dt) * e;
      T.v     = (B * (1 - T.w * dt) - T.w * d) * e;
      return T.value;
    }
  };
  return T;
}
