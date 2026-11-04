/* Long Air — THE LENS, AS A MODULE.
 *
 * Pulled out of long-air.html on 3 November 2026, for the same reason
 * the terrain was pulled out on 2 November: the reader reported the
 * chapter as disorienting and jerky, a Node sampler is the only
 * instrument that can see a jerk, and a Node tool cannot import a
 * <script type="module"> block out of an HTML page. tools/temporal.mjs
 * samples EXACTLY this, not a replica of it.
 *
 * That hazard is not hypothetical here either. On 3 November the
 * terrain sampler was found to be measuring columnsAt() while the page
 * drew its own open-coded copy of the same loop: it reported a 2.94
 * degree cross-section on a surface that was turning 20.00 degrees. One
 * definition, or the measurement is worthless at exactly the moment it
 * matters.
 *
 * WHAT WAS WRONG WITH THE CODE THIS REPLACES
 * ------------------------------------------------------------------
 * Three faults, all temporal, none of them visible to a spatial
 * continuity check and none of them visible in a screenshot.
 *
 * 1. THE LOOK TARGET JUMPED AT EVERY PHASE BOUNDARY. The old frame body
 *    read
 *
 *      if(ph.cam === 'rise'){      lookOff =  2.6; ... ease = 2.6; }
 *      else if(ph.cam === 'dive'){ lookOff = -2.2; ... ease = 3.0; }
 *      else {                      lookOff =  0.2; ... ease = 3.2; }
 *      camera.lookAt(x, kiteY + lookOff, -22);
 *
 *    and `ease` was assigned in all three branches AND NEVER READ. The
 *    look offset was applied raw, so at a rise->dive boundary the aim
 *    point moved 4.8 m in a single frame at about 22 m range: an
 *    instantaneous 12.3 degree rotation of the whole frame, four times
 *    every box cycle. It is frame-rate independent, which is why it
 *    persisted at 58 fps, and it is the largest single discontinuity
 *    measured anywhere in this chapter. The dead `ease` variable says
 *    plainly that smoothing was intended and never wired up.
 *
 *    It is wired up now, which is also why `ease` differs per phase:
 *    the lens leans into a rise more eagerly than it settles out of a
 *    hold.
 *
 * 2. THE SMOOTHING WAS FRAME-RATE DEPENDENT. `x += (want-x) * min(1,
 *    dt*k)` is the first-order approximation of an exponential
 *    approach, and it is only first order: the fraction it moves is
 *    linear in dt where the true fraction is 1-exp(-k·dt). Under a
 *    steady clock the difference is a slightly wrong time constant and
 *    nobody can tell. Under a clock that sits at 58 and drops the
 *    occasional frame it is a different time constant every frame, so
 *    the lens accelerates and decelerates on the frame clock rather
 *    than on the scene — and a long frame overshoots, because the
 *    linear term keeps growing while the true one saturates.
 *
 *    `approach` below is the exact solution of dx/dt = k(want - x) over
 *    one step. It costs an exp() three times a frame and it is
 *    identical under any clock, which is the entire point.
 *
 * 3. THE SAME NUMBER WAS SMOOTHED TWICE, INCONSISTENTLY. camY chased
 *    kiteY at k=4.5 while the look target used kiteY raw. So the lens
 *    POSITION lagged the glider and the lens AIM did not, and the two
 *    disagreements beat against each other through every turnaround.
 *    Both now go through the same follower.
 *
 * No three.js and no DOM here: numbers only, so the sampler can drive
 * it. The page asks for the pose and applies it.
 */

import { approach, tracker } from './follow.js';

/* ------------------------------------------------------------------
   WHY THE FOLLOWERS ARE SECOND ORDER — the measurement that changed
   this file after it was first written
   ------------------------------------------------------------------
   The first version of this module smoothed the aim offset with a
   first-order exponential, which took the worst single-frame velocity
   jump in `lookY` from 146.1 units/s to 7.5. That is a nineteen-fold
   improvement and it was still wrong, and tools/temporal.mjs named it:

     lookY   step ratio 4.8   dV ratio 328   VELOCITY STEP

   A first-order follower chasing a target that STEPS is continuous in
   position and discontinuous in velocity — the instant `want` jumps by
   D, the follower's speed jumps by k·D. The phase targets below are
   constants per phase, so they step at every boundary by construction,
   and no amount of first-order smoothing can hide that. A position-only
   measure passes this case completely, which is why it survived the
   first pass: nothing jumps, and the lens still lunges four times a
   cycle.

   So the aim and the trailing distance go through `tracker` — exact,
   critically damped, second order — and a step in the target produces
   continuous position and continuous velocity. The lens accelerates
   into a new phase instead of being yanked into it.

   The glider height still uses a first-order `approach`, deliberately:
   its target is the glider's own altitude, which is already a damped
   spring and does not step, so a second order filter there would only
   add lag.
   ------------------------------------------------------------------ */

/** Per-phase lens behaviour. `look` is where the lens aims relative to
 *  the glider, `back` is how far behind it rides, `ease` is how quickly
 *  the aim moves to a new phase's value — the variable that used to be
 *  computed and discarded.
 *
 *  Hand-assigned per phase, like every other decision in this project:
 *  a rise is met eagerly, a dive is followed, a hold settles.
 *
 *  The three keys are the three values `cam` actually takes in
 *  long-air-breath.js's phase tables — 'rise', 'dive' and 'level'. A
 *  fourth name here would be dead code that looked like behaviour, and
 *  a missing one falls back to 'level' rather than throwing, because a
 *  lens that stops moving is a worse failure than a lens that holds
 *  level. */
export const CAM_EASE = {
  rise:  { look:  2.6, back: 13.5, ease: 2.6 },
  dive:  { look: -2.2, back: 12.5, ease: 3.0 },
  level: { look:  0.2, back: 11.5, ease: 3.2 }
};

/** How fast the lens height follows the glider. The old number, kept
 *  deliberately: it was never the fault, the integrator was, and
 *  changing a constant at the same time as fixing the maths would make
 *  it impossible to say afterwards which did what. */
export const K_HEIGHT = 4.5;

/** The trailing distance's second-order rate, in radians per second.
 *  2.0 as a first-order rate and 2.0 as a critical frequency settle in
 *  about the same time, so the lens rides where it always did; it now
 *  gets there without a velocity step. */
export const W_BACK = 2.0;

/** The lens's own state and one step of it.
 *
 *  `step` returns the pose rather than touching a camera, so the same
 *  call drives the page and the sampler. The page reads `camY`,
 *  `camBack` and `lookY` off it and builds the three.js pose from them.
 */
export function lens({ camBack = 13.0, kiteY = 11.5 } = {}){
  /* The aim offset is STATE now, not a per-frame lookup, and it is
     second-order state. That is the whole of fix 1. */
  const aim  = tracker(CAM_EASE.level.look, CAM_EASE.level.ease);
  const back = tracker(camBack, W_BACK);

  const L = {
    camY: kiteY + 1.0,
    /* The glider's height, smoothed ONCE and used for both the lens
       position and the lens aim. That is fix 3: these were two
       different numbers, and they disagreed through every turnaround. */
    followY: kiteY,

    get camBack(){ return back.value; },
    get lookOff(){ return aim.value; },
    /** the world y the lens aims at */
    get lookY(){ return L.followY + aim.value; },

    /** Put the lens where it belongs with no motion, for a protocol
     *  change: easing across from the other protocol's pose would be a
     *  claim of continuity between two things that are not continuous. */
    reset(kiteY){
      L.followY = kiteY; L.camY = kiteY + 1.0;
      aim.set(CAM_EASE.level.look);
      back.set(CAM_EASE.level.back);
      return L;
    },

    step(dt, { kiteY, cam }){
      const C = CAM_EASE[cam] || CAM_EASE.level;
      /* the aim's rate is the phase's own `ease` — the variable that
         used to be assigned in all three branches and never read */
      aim.w = C.ease;
      aim.step(dt, C.look);
      back.step(dt, C.back);
      L.followY = approach(L.followY, kiteY, K_HEIGHT, dt);
      L.camY    = L.followY + 1.0;
      return L;
    }
  };
  return L;
}
