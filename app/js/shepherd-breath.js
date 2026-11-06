/* THE SHEPHERD — the protocols, the hill, and the flock's lag.
 *
 * A 3-D treatment of the FIRST theme this book ever had: a person
 * walking up and down a hill, which was the whole of the original
 * 2-D sketch. 6 November 2026.
 *
 * -------------------------------------------------------------------
 * WHAT THE BREATH DRIVES
 * -------------------------------------------------------------------
 * `s`, the shepherd's distance along the path, in metres. Breathe in
 * and he climbs; breathe out and he comes back down; a hold is a
 * level terrace where he stands. That is the theme stated literally,
 * and it is the right literal statement: walking uphill IS what an
 * inhale feels like, and the book has always known it.
 *
 * -------------------------------------------------------------------
 * AND WHY THE FLOCK IS THE POINT
 * -------------------------------------------------------------------
 * A figure walking a line is Long Air's spatial relationship with a
 * different skin, and this book has already learned what that costs —
 * Lantern Current is the chapter that did it. What makes this one its
 * own thing is behind the shepherd.
 *
 * EACH SHEEP FOLLOWS THE ONE AHEAD OF IT, WITH LAG. So the line of
 * the flock is a VISIBLE RECORD OF THE LAST SEVERAL SECONDS OF YOUR
 * BREATHING. Breathe evenly and it strings out evenly. Change pace
 * and you watch the change travel down the line, sheep by sheep, and
 * arrive at the last one seconds after you made it. Turn at the top
 * of a breath and the flock is still coming up: they stream past the
 * shepherd and the line folds over itself, which is exactly what a
 * real flock does and exactly what the turnaround of a breath is.
 *
 * Nothing else in the book shows you your own past. The tail in Long
 * Air is three tenths of a second of it; this is twelve.
 *
 * -------------------------------------------------------------------
 * THE LAG IS DERIVED, NOT CHOSEN
 * -------------------------------------------------------------------
 * A critically damped follower tracking a ramp of slope v settles at
 * an error of 2v/w. The schedule's steepest slope is the whole path
 * in the shortest moving phase, so each link in the chain lags by
 * that much and the whole flock trails N times it. Two things have to
 * be true at once and they pull against each other:
 *
 *   - the LAST sheep must still be on screen, or the record is being
 *     kept where the reader cannot read it;
 *   - consecutive sheep must be far enough apart to be separate
 *     animals rather than a smear.
 *
 * Both are solved by one number, FLOCK_W, and it is picked by stating
 * the trail length wanted and inverting rather than by feel. See
 * FLOCK_TRAIL below. tools/regress.mjs re-derives it from the drawn
 * positions rather than trusting this comment.
 *
 * §1.6a is vacuous here: no water in this chapter.
 * SILENT. No AudioContext, no media elements.
 */

import { protocol, linear } from './breath.js';
import { corridor, ratesOf } from './course.js';

/* ------------------------------------------------------------------
   THE PATH, in metres along the slope
   ------------------------------------------------------------------ */

/** The hard ends of the walk. The shepherd is clamped into this, so
 *  walking off the end of the hill is unreachable rather than
 *  unlikely — the same construction as every other corridor here. */
export const PATH_LO = 0.0;
export const PATH_HI = 48.0;

/** The band the SCHEDULE sweeps, inside the path. Narrower at both
 *  ends so a reader who overshoots has somewhere to overshoot into.
 *  THE FLOCK IS WHY THE LOWER MARGIN IS LARGE: the last sheep trails
 *  the shepherd by FLOCK_TRAIL, and it has to have hill left to stand
 *  on when he is at the bottom of his own band. */
export const WALK_LO = 11.0;
export const WALK_HI = 33.0;

export const CORRIDOR = corridor({ lo: PATH_LO, hi: PATH_HI, low: WALK_LO, high: WALK_HI });
export const RANGE  = CORRIDOR.range;
export const normOf = CORRIDOR.normOf;
export const atOf   = CORRIDOR.atOf;

/* ------------------------------------------------------------------
   THE HILL
   ------------------------------------------------------------------
   One smooth landform, and the path runs up its side. Everything
   about it is a function of two numbers so tools/continuity.mjs can
   classify it under refinement and project its silhouette — the hill
   line against the sky is the longest edge in the chapter and the one
   a polygon would show on first.

   THE PROFILE IS NOT A SINGLE SLOPE. A constant gradient gives a
   wedge, and a wedge has no horizon: the brow would be a straight
   line across the frame for the whole session. This is a shoulder
   that steepens and then eases to a rounded brow, which is what makes
   the top of the walk read as a top rather than as more of the same.

   C2 EVERYWHERE, by construction rather than by inspection: a
   smootherstep plus two bounded harmonics. The recurring faults in
   this project are a field quantised then clamped, and independent
   per-element noise — there is neither here.
   ------------------------------------------------------------------ */

/** Height of the path at distance s along it. */
export function hillAt(s){
  const t = Math.min(1, Math.max(0, s / PATH_HI));
  /* the main rise: flat at the foot, steep through the middle, easing
     to a brow. 5.77 is smootherstep's own peak curvature, so this
     term's worst f'' is 5.77 * RISE / PATH_HI^2 and is bounded. */
  const main = 13.0 * (t * t * t * (t * (t * 6 - 15) + 10));
  /* two low harmonics so the slope is a hillside rather than a ramp.
     Bounded amplitude and wavelength, so the curvature they add is
     bounded too and subdivision converges on them. */
  const roll = Math.sin(s * 0.072 + 0.6) * 1.15
             + Math.sin(s * 0.151 + 2.4) * 0.42;
  return main + roll;
}

/** The lateral drift of the path, so the walk is not a straight line
 *  up the fall line. Small: this is a path worn by feet, not a road. */
export function pathX(s){
  return Math.sin(s * 0.038 + 1.1) * 3.4 + Math.sin(s * 0.091) * 1.1;
}

/** The ground either side of the path. `o` is metres across from it.
 *  The hill falls away to both sides, more steeply the further out,
 *  so the path sits in a shallow draw and the horizon is the brow
 *  rather than the edge of a plane. */
export function groundAt(s, o){
  /* EVEN IN o, AND SMOOTH ACROSS ZERO. The first version took
     a = Math.abs(o) and built both terms on it, which puts a SLOPE
     KINK down the middle of the hillside — along the path, which is
     the one line the camera is always pointed at. tools/continuity.mjs
     measured the crease at 5.11 px against a 2 px bar once it was
     asked to sweep THROUGH zero; its first sweep ran 0 upward and
     never crossed the fault, which is the older lesson restated: a
     check that cannot reach the defect reports a clean surface.

     o*o is even and smooth at the origin and needs no abs() at all.
     The fall's denominator uses it too, so the whole term is a
     rational function of o^2 — C-infinity everywhere, bounded
     curvature, and it refines. */
  const q = o * o;
  const fall = 0.055 * q / (1 + 0.0015 * q);
  const cross = Math.sin(s * 0.063 + o * 0.08 + 1.7) * 0.9
              * (1 - Math.exp(-0.0032 * q));
  return hillAt(s) - fall + cross;
}

/* ------------------------------------------------------------------
   THE PROTOCOLS
   ------------------------------------------------------------------
   The same two the book offers everywhere: one with two short holds
   and one with none, neither withheld and neither recommended. A hold
   is a phase whose `from` equals its `to`, so it arrives as a LEVEL
   TERRACE the shepherd stands on — the scene needs no new branch for
   it, exactly as Long Air's level channel needed none.
   ------------------------------------------------------------------ */
export const SESSION_CAP = 180;

export const PROTOCOLS = {
  box: protocol({
    id:'box', name:'Box breathing · 4-4-4-4 · 3.75 breaths a minute', cycles:11,
    phases:[
      { k:'in',      d:4, label:'breathe in',  sub:'up the hill',
        from:WALK_LO, to:WALK_HI, ease:linear, cam:'climb',
        scalar:p => p },
      { k:'hold',    d:4, label:'hold',        sub:'stand',
        from:WALK_HI, to:WALK_HI, cam:'level', count:'breathe out in',
        scalar:() => 1 },
      { k:'out',     d:4, label:'breathe out', sub:'back down',
        from:WALK_HI, to:WALK_LO, ease:linear, cam:'descend',
        count:'level out in',
        scalar:p => 1 - p },
      { k:'holdout', d:4, label:'hold',        sub:'stand',
        from:WALK_LO, to:WALK_LO, cam:'level', count:'breathe in in',
        scalar:() => 0 }
    ]
  }),

  open: protocol({
    id:'open', name:'No holds · 4 in / 5 out / 3 · 5 breaths a minute', cycles:15,
    phases:[
      { k:'in',   d:4, label:'breathe in',  sub:'up the hill',
        from:WALK_LO, to:WALK_HI, ease:linear, cam:'climb',
        scalar:p => p },
      { k:'out',  d:5, label:'breathe out', sub:'back down',
        from:WALK_HI, to:WALK_LO, ease:linear, cam:'descend',
        count:'level out in',
        scalar:p => 1 - p },
      { k:'rest', d:3, label:'rest',        sub:'stand',
        from:WALK_LO, to:WALK_LO, cam:'level', count:'breathe in in',
        scalar:() => 0 }
    ]
  })
};

export const rates = ratesOf;

/* ------------------------------------------------------------------
   THE FLOCK
   ------------------------------------------------------------------ */

/** How many sheep. Five to start, which is the number the reader
 *  asked for and is also about the most a reader can count at a
 *  glance without counting — past that the line stops being a record
 *  anybody reads and becomes a texture. */
export const FLOCK_N = 5;

/** THE STEEPEST THE SCHEDULE EVER MOVES, in metres of path a second.
 *  Derived from the protocols rather than typed, so a change to a
 *  duration cannot leave this behind. */
export const PATH_V_MAX = Math.max(
  ...Object.values(PROTOCOLS).flatMap(p =>
    p.phases.filter(q => q.from !== q.to)
            .map(q => Math.abs(q.to - q.from) / q.d)));

/** HOW LONG THE LINE SHOULD BE, in metres of path.
 *
 *  This is the one number chosen by looking rather than derived, and
 *  it is chosen as a LENGTH because that is the thing the reader
 *  sees — not as a time constant, which is the thing the code wants.
 *  13 m is a bit over half the 22 m band the schedule sweeps, so at
 *  the top of a breath the last sheep is still on the lower slope and
 *  the whole history is in frame at once; and it is five sheep over
 *  13 m, which is 2.6 m apart at an even pace -- about three body
 *  lengths, which is how a flock following somebody actually walks.
 *
 *  AT 5.5 m/s THE WALK IS BRISK, and that is a stylisation rather
 *  than an oversight. The phase durations belong to the protocol and
 *  cannot move; a real walking pace over a four second inhale covers
 *  about six metres, which at any distance that frames the flock is
 *  a tenth of the screen and reads as standing still. This book
 *  already flies a kite at fourteen metres a second. The scale is
 *  chosen so the MOTION is legible, and the thing that has to be
 *  true -- that the line behind him is your own last few seconds --
 *  is true at any speed.
 *
 *  FLOCK_W is then inverted out of it rather than tuned: a critically
 *  damped follower tracking a ramp of slope v settles at an error of
 *  2v/w per link, so N links trail 2Nv/w and
 *
 *      w = 2 * N * PATH_V_MAX / FLOCK_TRAIL
 *
 *  tools/regress.mjs measures the trail on the DRAWN positions and
 *  checks it against this, rather than taking the algebra on trust —
 *  the algebra assumes a ramp and the schedule turns around, which is
 *  exactly where an assumption like that stops holding. */
export const FLOCK_TRAIL = 13.0;
export const FLOCK_W = 2 * FLOCK_N * PATH_V_MAX / FLOCK_TRAIL;

/** How far a sheep is allowed to be from the one ahead before the
 *  chapter would be drawing a smear instead of a flock. Used by the
 *  harness as the lower bound on legibility, and derived from the
 *  same trail: an even pace puts them FLOCK_TRAIL/N apart, and half
 *  of that is the point at which two animals start to overlap at the
 *  lens's own distance. */
export const FLOCK_MIN_GAP = FLOCK_TRAIL / FLOCK_N * 0.5;

/** The camera's trailing distance and height above the path. Fixed:
 *  a rig has a length, and keeping it fixed is also what keeps the
 *  angular rate up — everything near the lens stays near it. */
/* THE LENS IS PARKED, AND THAT IS THE WHOLE SPATIAL IDEA.
   ------------------------------------------------------------------
   Lantern Current failed because its camera rode the thing the breath
   moved, so the breath's motion cancelled out: measured, its hull
   lift gives 2.4 degrees a second of angular rate against Long Air's
   88. A camera that follows the figure makes the figure motionless
   and hands the reading to the scenery.

   So this one does not follow. The lens sits near the foot of the
   path, a little above and to one side, and the shepherd RECEDES up
   the hill on the inhale and RETURNS on the exhale. His motion is
   displacement across the frame AND a change of size, and the flock
   strings out between him and the lens -- the nearest sheep passing
   close enough to read as an animal while the shepherd is small on
   the brow. That is a use of depth a flat version cannot fake, and
   it is a different spatial relationship from every other chapter:
   Pearl Diver descends, Long Air travels forward, Bamboo Rain is
   enclosed and stationary, and this one has something approach and
   recede along a line running away from the reader.

   It is not rigidly parked: the aim tracks the shepherd so he cannot
   leave the frame, slowly enough that the tracking is not what the
   reader reads. */
export const CAM_AT   = WALK_LO - 13.0;
export const CAM_SIDE = 7.0;
export const CAM_UP   = 3.2;

/** Per-phase lens behaviour, hand-assigned like every other decision
 *  here. `look` is how far up the path the lens aims relative to the
 *  shepherd, `ease` how quickly it moves to a new phase's value. */
export const CAM_EASE = {
  climb:   { look:  5.0, ease: 2.2 },
  descend: { look: -3.0, ease: 2.6 },
  level:   { look:  1.0, ease: 2.8 }
};

/** The choice the gate offers, in the same two words the rest of the
 *  book uses, because it is the same choice. */
export const CHOICE = { holds:'box', noholds:'open' };
export const validChoice = c => c === 'holds' || c === 'noholds';
