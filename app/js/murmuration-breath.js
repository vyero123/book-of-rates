/* THE MURMURATION — the flock, the shape the breath gives it, and
 * the lens that has to be underneath it.
 *
 * Built 7 November 2026, into the slot Lantern Current was withdrawn
 * from. It exists to answer that chapter's diagnosis rather than to
 * decorate the gap: Lantern's breath moved a hull 0.68 m against
 * nothing, its camera rode the thing the breath moved so the motion
 * cancelled out, and its spatial relationship — travel along a path —
 * was Long Air's with a different skin.
 *
 * -------------------------------------------------------------------
 * WHAT THE BREATH DRIVES: THE SHAPE, NOT THE POSITION
 * -------------------------------------------------------------------
 * `gather`, 0..1. Breathe in and the flock BALLS UP and lifts;
 * breathe out and it opens and settles. Nothing travels. That is the
 * point — it is the one spatial relationship the book does not have,
 * and it is the opposite of the one that failed.
 *
 * Translation was considered first and the arithmetic killed it: a
 * flock at 60 m rising 15 m over a four-second inhale sweeps 3.5
 * degrees a second, which is Lantern's number to within rounding. A
 * chapter cannot be rescued by changing what the thing IS while
 * keeping what it DOES.
 *
 * -------------------------------------------------------------------
 * THE NUMBER I QUOTED BEFORE BUILDING THIS WAS WRONG, AND HERE IS THE
 * HONEST VERSION
 * -------------------------------------------------------------------
 * I said "19 degrees a second of silhouette motion". That came from a
 * flock whose angular radius goes from 38 to 19 degrees — and I
 * quoted the DIFFERENCE as a RATE. Over a four-second inhale it is
 * not 19 a second, it is under five.
 *
 * And it cannot be fixed by staging, which is worth writing down
 * because it is a property of the idea rather than of this build. The
 * angular radius of a ball at range D is atan(R/D), so its rate is
 * about (dR/dt)/D. For 19 deg/s at any D a flock can be seen whole
 * from, the radius would have to change by tens of metres a second.
 * A four-second breath does not contain that.
 *
 * SO THE CHAPTER DOES NOT REST ON THAT NUMBER. It rests on three
 * things that are measured on the running build (__murmuration.rates)
 * rather than predicted here, and the predictions are:
 *
 *   the flock's angular RADIUS      35.3 deg spread, 17.1 gathered
 *                                   (so 70.6 deg of frame down to
 *                                   34.2 — never under the 30 the
 *                                   staging condition asks for)
 *   its rate of change               4.6 deg/s   <- the small one
 *   the near edge's own travel       29 deg/s falling to 9.6 as it
 *                                   recedes: this is what the eye
 *                                   follows, because the edge is made
 *                                   of birds and birds are what you
 *                                   look at
 *   one bird, flying                 77 deg/s at the near edge,
 *                                   22 at the far side — CONSTANT,
 *                                   because the breath does not
 *                                   speed birds up or slow them down
 *   the CHURN                        31.5 deg/s spread, 57.3 gathered
 *
 * THE CHURN IS THE REAL MECHANIC AND IT IS NOT A STYLISTIC CHOICE, it
 * is what falls out of holding airspeed constant. A bird flies at
 * AIRSPEED whatever the flock is doing; if the ball it is flying
 * round halves in radius, its ANGULAR rate round that ball doubles.
 * So the breath does not move the birds — IT TURNS THEM, and a
 * gathered flock visibly boils where a spread one drifts. That is
 * what a real murmuration does when it balls up, and it is the half
 * of this chapter that has a large number attached to it.
 *
 * -------------------------------------------------------------------
 * AND THERE IS NO INTEGRATOR IN THE FLOCK
 * -------------------------------------------------------------------
 * Five hundred birds converging on a target is five hundred things
 * proportional to a remaining error, which is the shape that cost the
 * Shepherd a mapping (a rate proportional to the distance left crawls
 * the last stretch; lagged both ways it overshoots and cannot come
 * back). None of it applies here, because the flock has no control
 * loop at all: every bird's position is a FUNCTION of `gather`,
 * evaluated. There is exactly one integrator in the chapter — the
 * kit's body spring on `gather` itself, bounded by its corridor — and
 * one accumulator, the orbit angle, which is a pure integral of a
 * rate and has no target to miss.
 *
 * §1.6a is vacuous here: no water. SILENT: no AudioContext, no media.
 */

import { protocol, linear } from './breath.js';
import { corridor, ratesOf } from './course.js';

/* ------------------------------------------------------------------
   THE FLOCK
   ------------------------------------------------------------------ */

/** How many birds. 560 is two triangles each — about 1,100 triangles
 *  for the whole flock, which is nothing — so the number is set by
 *  what reads as a murmuration rather than by cost. Below about three
 *  hundred the sky looks sparse at the spread end; above a thousand
 *  the gathered end goes to a solid blob and the shape stops being
 *  readable, which is the one thing this chapter cannot afford. */
export const FLOCK_N = 560;

/** Metres a second. A starling cruises about eleven, and it is held
 *  CONSTANT through the breath on purpose — see the churn note above.
 *  Everything angular in this chapter is derived from it. */
export const AIRSPEED = 11.0;

/* ==================================================================
   THE FLOCK IS TALL, AND THAT IS THE FRAME'S DOING — 7 November 2026
   ==================================================================
   THE FIRST BUILD WAS A SQUASHED BALL AND IT WAS UNREADABLE. Twenty
   metres of radius at 28 m subtends 70 degrees; the phone is in
   PORTRAIT, so the frame is 62 degrees tall and only 31 across. The
   flock ran off both sides and read as "birds everywhere" rather than
   as a shape, which is fatal in a chapter whose whole mechanic is the
   shape.

   THE OBVIOUS FIX IS THE WRONG ONE. Pushing the lens back until a
   20 m ball fits the narrow axis means 80 m of range, and at 80 m the
   near edge is 60 m away, a bird crosses the field at 10 deg/s
   instead of 76, and the near edge sweeps 4 instead of 28. That is
   handing back everything the staging was for in order to satisfy a
   condition about the staging. The lens stays where it is.

   SO THE FLOCK CHANGES SHAPE INSTEAD. It is TALL — a roosting column
   rather than a ball — which is a real form a murmuration takes and
   is also the form a portrait frame can hold: narrow across, where
   there are only 31 degrees, and tall, where there are 62.

   AND THE CONDITION ITSELF HAD TO BE RE-DERIVED, because "the flock
   subtends 30 to 40 degrees" assumed a ball seen whole. What actually
   has to be true is:

     GATHERED   a readable shape with margin on the narrow axis —
                15.1 degrees across (49% of the frame's width) and
                27.0 tall (44% of its height)
     SPREAD     plainly bigger, and allowed to OVERFLOW: 44.2 across
                and 73.7 tall, or 143% and 119% of the frame. A sky
                you cannot see the edges of is not a failure, it is
                the other half of the mechanic.

   The number that is being held is the RATIO, which is what the
   reader sees: the flock goes from more than filling the frame to
   under half of it, twice a breath.
   ================================================================== */

/** Horizontal and vertical radius, spread and gathered. Four numbers
 *  rather than one, because the shape changes as well as the size:
 *  spread it is 1.85 times taller than wide, gathered 1.8 — it does
 *  not simply scale, it compacts. */
export const R_H_SPREAD = 13.0, R_V_SPREAD = 24.0;
export const R_H_GATHER =  5.0, R_V_GATHER =  9.0;

/** Where the column sits. It LIFTS as it gathers, which reinforces
 *  the shape change rather than competing with it: gathering makes it
 *  smaller AND further away, so the angular size falls faster than
 *  the radius does. Spread, the bottom of the column is 8 m off the
 *  ground and 11.9 m from the lens — that is the "close and
 *  underneath" the numbers depend on, and it is the bottom of the
 *  column rather than the centre that delivers it. */
export const X_C = 10.0;          // metres along the ground from the lens
export const ALT_SPREAD = 32.0;
export const ALT_GATHER = 38.0;

/** The shell has thickness, or every bird sits on one surface and the
 *  flock reads as a soap bubble. 0.42 means the innermost birds are
 *  at 42% of the radius. */
export const SHELL_IN = 0.42;

/* ------------------------------------------------------------------
   THE CONTROL — the same three-state pursuit as everywhere else
   ------------------------------------------------------------------
   A protocol with holds needs three states and a binary control has
   two; the Shepherd's harness measured what that costs at 20.89 m of
   error on a 22 m band. So: one finger sets a place, the flock goes
   to that shape, and a hold is leaving your finger where it is.

   The corridor is on `gather` itself, 0 spread to 1 balled, with a
   little room beyond both ends so the spring has somewhere to
   overshoot into and never clamps during an ordinary breath. */
export const GATHER_LO = -0.08, GATHER_HI = 1.08;
export const BAND_LO = 0.0, BAND_HI = 1.0;

export const CORRIDOR = corridor({ lo: GATHER_LO, hi: GATHER_HI,
                                   low: BAND_LO, high: BAND_HI });
export const RANGE  = CORRIDOR.range;
export const normOf = CORRIDOR.normOf;
export const atOf   = CORRIDOR.atOf;

/** THE SHAPE PARAMETER THE SCENE ACTUALLY READS, 0..1, from the
 *  corridor value — AND IT IS NOT A CLAMP.
 *
 *  A clamp was the first version and it is wrong here for a reason
 *  worth keeping. The kit's body deliberately overshoots the band it
 *  is driven across, and its own corridor then clamps the value at
 *  GATHER_LO/GATHER_HI. Clamping the radius at the BAND edge on top
 *  of that puts a derivative discontinuity exactly where the
 *  overshoot turns around, which on screen is a flock that hits a
 *  wall at the top of every inhale — the one moment in the breath the
 *  reader is most likely to be watching.
 *
 *  So the whole corridor, overshoot included, is mapped through a
 *  quintic smootherstep. It is C2 everywhere, monotone, and FLAT at
 *  both ends, so the corridor's own clamp lands where the derivative
 *  is already zero and cannot be seen. The band's ends come out at
 *  0.003 and 0.997 rather than 0 and 1 — a radius of 19.97 m instead
 *  of 20 — which is three centimetres and buys a continuous
 *  silhouette.
 *
 *  And the smootherstep is only a smootherstep ON [0,1]: u is formed
 *  by dividing by the corridor's own range and then clamped AT THE
 *  POINT OF USE, which is the Long Air lesson (an extrapolated
 *  quintic there returned four hundred metres). */
const clamp01 = x => Math.min(1, Math.max(0, x));
export function shapeOf(gather){
  const u = clamp01((gather - GATHER_LO) / (GATHER_HI - GATHER_LO));
  return u * u * u * (u * (u * 6 - 15) + 10);
}
export function radiusAt(gather){
  /* THE EFFECTIVE RADIUS, which is the one the churn is computed
     from: the cube root of the ellipsoid's own volume measure, so a
     column and a ball of the same volume boil at the same rate. */
  const r = radiiAt(gather);
  return Math.cbrt(r.h * r.h * r.v);
}
export function radiiAt(gather){
  const g = shapeOf(gather);
  return { h: R_H_SPREAD + (R_H_GATHER - R_H_SPREAD) * g,
           v: R_V_SPREAD + (R_V_GATHER - R_V_SPREAD) * g };
}
export function altitudeAt(gather){
  return ALT_SPREAD + (ALT_GATHER - ALT_SPREAD) * shapeOf(gather);
}
/** The churn: angular rate round the ball, rad/s. The whole mechanic
 *  in one line, and it is a consequence of constant airspeed rather
 *  than a curve anybody drew. */
export const omegaAt = gather => AIRSPEED / radiusAt(gather);

/* ------------------------------------------------------------------
   THE LENS — parked, close, and underneath
   ------------------------------------------------------------------
   PARKED, with no tracker of any kind. Lantern's camera rode the
   thing its breath moved and the motion cancelled out; the cheapest
   way to be certain that cannot happen here is for the lens not to
   move at all. Everything the flock does is then visible by
   construction, and the chapter has nothing to hide behind.

   CLOSE AND UNDERNEATH, because that is the condition every number
   above depends on. The near edge of a spread flock is 8.2 m from the
   lens; if the lens goes back, the near-edge rate (29 deg/s) and the
   bird rate (77) fall with it and the chapter quietly becomes the one
   it replaced. If staging ever wants the lens further out, the
   numbers have to be re-derived rather than the distance accepted.

   It aims at a FIXED point between the two altitudes, so the flock's
   lift reads as the flock going up the frame rather than as nothing
   at all. The elevation is about 72 degrees — steep, and that is why
   there is no horizon in this chapter: at 375x812 the frame runs from
   41 to 103 degrees of elevation and the ground is nowhere in it. The
   sky's own gradient carries which way is up. */
export const CAM_AT = [0, 1.6, 0];
export const CAM_AIM = [X_C, (ALT_SPREAD + ALT_GATHER) / 2, 0];

/* ------------------------------------------------------------------
   THE PROTOCOLS
   ------------------------------------------------------------------
   The same two the book offers everywhere: one with two short holds
   and one with none, neither withheld and neither recommended. A hold
   is a phase whose `from` equals its `to`, and here it arrives as a
   flock holding its shape — balled and boiling at the top, open and
   drifting at the bottom.
   ------------------------------------------------------------------ */
export const SESSION_CAP = 180;

export const PROTOCOLS = {
  box: protocol({
    id:'box', name:'Box breathing · 4-4-4-4 · 3.75 breaths a minute', cycles:11,
    phases:[
      { k:'in',      d:4, label:'breathe in',  sub:'gather',
        from:BAND_LO, to:BAND_HI, ease:linear, cam:'gather',
        scalar:p => p },
      { k:'hold',    d:4, label:'hold',        sub:'held',
        from:BAND_HI, to:BAND_HI, cam:'held', count:'breathe out in',
        scalar:() => 1 },
      { k:'out',     d:4, label:'breathe out', sub:'open',
        from:BAND_HI, to:BAND_LO, ease:linear, cam:'open',
        count:'level out in',
        scalar:p => 1 - p },
      { k:'holdout', d:4, label:'hold',        sub:'drift',
        from:BAND_LO, to:BAND_LO, cam:'drift', count:'breathe in in',
        scalar:() => 0 }
    ]
  }),

  open: protocol({
    id:'open', name:'No holds · 4 in / 5 out / 3 · 5 breaths a minute', cycles:15,
    phases:[
      { k:'in',   d:4, label:'breathe in',  sub:'gather',
        from:BAND_LO, to:BAND_HI, ease:linear, cam:'gather',
        scalar:p => p },
      { k:'out',  d:5, label:'breathe out', sub:'open',
        from:BAND_HI, to:BAND_LO, ease:linear, cam:'open',
        count:'level out in',
        scalar:p => 1 - p },
      { k:'rest', d:3, label:'rest',        sub:'drift',
        from:BAND_LO, to:BAND_LO, cam:'drift', count:'breathe in in',
        scalar:() => 0 }
    ]
  })
};

export const rates = ratesOf;

/* ------------------------------------------------------------------
   THE GEOMETRY OF WHAT IS BEING CLAIMED
   ------------------------------------------------------------------
   Shared by the page's inspection hook and tools/regress.mjs so there
   is one definition of the numbers in the header comment, and so a
   change to the staging moves the claim rather than leaving it behind
   as a comment nobody re-ran.
   ------------------------------------------------------------------ */

/** Everything the lens can say about the flock at a given `gather`.
 *  Angles in degrees, ranges in metres. */
export function geometry(gather){
  const R = radiusAt(gather);
  const r = radiiAt(gather);
  const dx = X_C - CAM_AT[0];
  const dy = altitudeAt(gather) - CAM_AT[1];
  const D = Math.hypot(dx, dy);
  const deg = a => a * 180 / Math.PI;
  /* the BOTTOM of the column is the nearest part of it, and it is
     what the "close and underneath" figures are measured from */
  const bottom = Math.hypot(dx, dy - r.v);
  return {
    radius: R, rh: r.h, rv: r.v,
    centreRange: D,
    bottomRange: bottom,
    nearEdge: bottom,
    subtendH: deg(2 * Math.atan(r.h / D)),
    subtendV: deg(2 * Math.atan(r.v / D)),
    angRadius: deg(Math.atan(R / D)),
    subtend:   deg(2 * Math.atan(R / D)),
    /** how fast one bird crosses the field of view, at the near edge
     *  and at the far side. Constant in metres a second; it is only
     *  the range that changes. */
    birdNear:  deg(AIRSPEED / Math.max(1e-6, bottom)),
    birdFar:   deg(AIRSPEED / (D + r.v)),
    /** and how fast the pattern recirculates */
    churn:     deg(omegaAt(gather))
  };
}

/** The rates ACROSS a phase: what the shape change costs per second
 *  when it is flown exactly on the cue. `secs` is the phase length. */
export function sweep(secs = 4){
  const a = geometry(0), b = geometry(1);
  return {
    secs,
    subtendH: [+a.subtendH.toFixed(1), +b.subtendH.toFixed(1)],
    subtendV: [+a.subtendV.toFixed(1), +b.subtendV.toFixed(1)],
    subtend: [+a.subtend.toFixed(1), +b.subtend.toFixed(1)],
    /** THE SMALL ONE, and it is in the report on purpose */
    angRadiusRate: +((a.angRadius - b.angRadius) / secs).toFixed(2),
    /** THE ONE THE EYE FOLLOWS: the near edge is made of birds, and
     *  it travels nearEdge(spread) -> nearEdge(gathered) in `secs`. */
    edgeMetresPerSec: +((b.nearEdge - a.nearEdge) / secs).toFixed(2),
    edgeRateNear: +(((b.nearEdge - a.nearEdge) / secs) / a.nearEdge * 180 / Math.PI).toFixed(1),
    edgeRateFar:  +(((b.nearEdge - a.nearEdge) / secs) / b.nearEdge * 180 / Math.PI).toFixed(1),
    birdNear: [+a.birdNear.toFixed(1), +b.birdNear.toFixed(1)],
    churn:    [+a.churn.toFixed(1), +b.churn.toFixed(1)]
  };
}

/** The choice the gate offers, in the same two words the rest of the
 *  book uses, because it is the same choice. */
export const CHOICE = { holds:'box', noholds:'open' };
export const validChoice = c => c === 'holds' || c === 'noholds';
