/* THE SHEPHERD — the protocols, the hills, and the flock's lag.
 *
 * A 3-D treatment of the FIRST theme this book ever had: a person
 * walking over a hill, which was the whole of the original 2-D
 * sketch. 6 November 2026; remade for progress on 7 November.
 *
 * -------------------------------------------------------------------
 * WHAT THE BREATH DRIVES
 * -------------------------------------------------------------------
 * DISTANCE WALKED, and it only ever goes up. Breathe in and he climbs
 * the face of the hill in front of him; breathe out and he goes over
 * the crest and down the back of it; and the next breath is the next
 * hill. A hold is the one place on a hill where walking on would take
 * you away from the height you are asking for — the crest, if you are
 * asking for the top, and the trough, if you are asking for the
 * bottom — so the holds are the SHAPE OF THE GROUND rather than a
 * rule laid over it.
 *
 * ONE BREATH, ONE HILL. The terrain is periodic in distance walked at
 * exactly one period per breath cycle. That is the mapping, and
 * everything else in this file is the arithmetic that makes it come
 * out right.
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
 * arrive at the last one seconds after you made it. Stop at a crest
 * and they come up over it one at a time and close around you, which
 * is exactly what a real flock does and exactly what the top of a
 * breath is.
 *
 * Progress made this better rather than complicating it. When he
 * oscillated, the flock folded back over itself at every turn and the
 * line was a tangle; now it is strung out along real ground he has
 * covered, and the reader can see how long ago each sheep was where
 * he is.
 *
 * Nothing else in the book shows you your own past. The tail in Long
 * Air is three tenths of a second of it; this is several seconds.
 *
 * §1.6a is vacuous here: no water in this chapter.
 * SILENT. No AudioContext, no media elements.
 */

import { protocol, linear } from './breath.js';
import { corridor, ratesOf } from './course.js';

/* ==================================================================
   THE TWO SCALARS, AND KEEPING THEM APART IS THE DESIGN
   ==================================================================
     HEIGHT    what the protocol asks for and what the reader's
               finger sets. Bounded, sweeps up and down, and the
               corridor applies to it exactly as every other
               chapter's does.
     DISTANCE  metres walked. MONOTONE — never goes backwards.
               Derived from the height being asked for and the shape
               of the ground, never driven directly.

   THE DRIVE RULE, in one sentence: WALK TOWARDS THE NEXT PLACE AHEAD
   OF YOU WHERE THE GROUND IS THE HEIGHT YOU ARE ASKING FOR. The path
   is one-way, so "get there" always means "walk on". Rate is
   proportional to how far ahead that place is and capped, which is
   what keeps a fast finger from buying extra ground — the same cap,
   for the same reason, as every other chapter.

   The two holds fall out of it rather than being cases in it. Ask for
   the crest while you are on the front face and the place you are
   walking to IS the crest; arrive, and there is nowhere ahead that is
   any higher, so you stand. Ask for the trough on the back face and
   the same thing happens at the bottom. No branch in the code says
   "hold".
   ================================================================== */

/* ------------------------------------------------------------------
   THE HILL, SIZED BY GAIT RATHER THAN BY TASTE
   ------------------------------------------------------------------
   One breath is one hill, so the hill's length is fixed by how fast
   a person walks and how long the moving phases are. Both protocols
   here have a 4 s inhale, which is the SHORTEST moving phase either
   of them has, and in it he must cover half a hill — up the front
   face from the trough to the crest.

       half a hill  =  v_move * 4 s

   A brisk walk is about 2.2 m/s, so half a hill is 8.8 m and a hill
   is 17.6. Round to 18, which puts v_move at 2.25 m/s: brisk, and
   still a walk rather than a jog. The box cycle is 16 s, so the
   average over a breath — holds included — is 1.125 m/s, an amble.

   THE HEIGHT IS THEN FIXED BY THE SLOPE, not chosen: a raised cosine
   of length L and height H has a maximum gradient of H*pi/L, and a
   hillside a person walks over without scrambling is about 29
   degrees, or 0.55. That gives H = 0.55 * 18 / pi = 3.15, rounded to
   3.2. It is a down rather than a mountain, which is what a flock is
   grazed on, and because the crest crosses the frame once per breath
   the SIZE of the hill is not what makes the motion legible — the
   rate is, and that is measured below. */
export const HILL_LEN = 18.0;
export const HILL_H   = 3.2;

/** Position within the current hill: 0 at a trough, 0.5 at a crest,
 *  1 at the next trough. */
export function phaseOf(d){
  return (((d % HILL_LEN) + HILL_LEN) % HILL_LEN) / HILL_LEN;
}

/** Height above the trough at distance d. Periodic in HILL_LEN, and
 *  C2 across the wrap by construction: a raised cosine has matching
 *  value, slope and curvature at both ends of its period, which a
 *  pair of smootherstep ramps joined at the crest does not. */
export function hillAt(d){
  return HILL_H * 0.5 * (1 - Math.cos(phaseOf(d) * Math.PI * 2));
}
/** Its gradient, analytically rather than by differencing — the
 *  drive rule reads the sign of this and a numerical sign near the
 *  crest is a coin toss. */
export function hillSlope(d){
  return HILL_H * 0.5 * Math.sin(phaseOf(d) * Math.PI * 2) * (Math.PI * 2 / HILL_LEN);
}

/** THE HILL INVERTED, on its ASCENDING branch: the phase in [0, 0.5]
 *  at which the ground is h. Clamped at both ends, because the
 *  schedule's own band reaches the crest exactly and a reader's
 *  finger plus a spring's overshoot reach past it — and an unclamped
 *  acos returns NaN rather than 0.5, which is the quiet kind of
 *  wrong. (Long Air shipped an unclamped quintic that returned four
 *  hundred metres; the lesson there was to clamp AT THE POINT OF USE,
 *  which is here.) */
export function hillPhaseUp(h){
  const c = 1 - 2 * Math.min(HILL_H, Math.max(0, h)) / HILL_H;
  return Math.acos(Math.min(1, Math.max(-1, c))) / (Math.PI * 2);
}

/** THE NEXT PLACE AHEAD, in hills, where the ground is `wantH`.
 *  Always >= d / HILL_LEN, which is what makes the walk monotone.
 *
 *  Four cases, and they are the four quadrants of (which face am I
 *  on) x (am I asking for higher or lower):
 *
 *    front face, asking higher   the crest side of this hill
 *    front face, asking lower    over the crest, the back side
 *    back face,  asking lower    further down the back side
 *    back face,  asking higher   on, over the trough, up the NEXT
 *                                hill's front face
 *
 *  The last one is the only one that is not obvious, and it is the
 *  one that makes the chapter work: a reader at the bottom of a hill
 *  who breathes in does not turn round, he carries on. It is also
 *  what unsticks the wrap — without it a reader who finished an
 *  exhale at the trough would be asked to climb and would have
 *  nowhere ahead to climb to.
 *
 *  ON THE ONE DISCONTINUITY IN HERE, because it would otherwise be
 *  the sort of thing that gets found by a reader rather than by me.
 *  "Next occurrence" is a sawtooth in principle: cross a target and
 *  the target jumps forward. Here the jump sits at the crest,
 *  between case 1 and case 4, and it is UNREACHABLE along any
 *  trajectory. To cross the crest at all the rate must be non-zero
 *  there, which needs a target more than the dead zone beyond it,
 *  which only happens when wantH is BELOW the ground — case 2, whose
 *  formula is identical to case 3 and therefore continuous through
 *  the crest. Asking for higher while on the front face stops you at
 *  the crest by construction. tools/regress.mjs asserts it on the
 *  drawn walk rather than leaving it to this comment.
 */
export function targetHills(d, wantH){
  const n = Math.floor(d / HILL_LEN);
  const w = d / HILL_LEN - n;
  const up = hillPhaseUp(wantH);
  if(wantH >= hillAt(d)){
    return w <= 0.5 ? n + Math.max(w, up)         // 1. climb to it
                    : n + 1 + up;                 // 4. on to the next hill
  }
  return w <= 0.5 ? n + 1 - up                    // 2. over the crest
                  : n + Math.max(w, 1 - up);      // 3. on down
}

/* ------------------------------------------------------------------
   THE HEIGHT BAND
   ------------------------------------------------------------------
   The band the SCHEDULE sweeps is the WHOLE hill, trough to crest,
   because the hill is the thing being walked over and half a hill is
   not a breath. The corridor's outer range is a little wider at both
   ends so the spring has somewhere to overshoot into and never
   clamps during an ordinary breath — a clamp is a derivative
   discontinuity wherever it bites, and this project has shipped two
   and spent a session finding each. */
export const WALK_LO = 0.0;
export const WALK_HI = HILL_H;
export const HT_LO = -0.6;
export const HT_HI = HILL_H + 0.6;

export const CORRIDOR = corridor({ lo: HT_LO, hi: HT_HI, low: WALK_LO, high: WALK_HI });
export const RANGE  = CORRIDOR.range;
export const normOf = CORRIDOR.normOf;
export const atOf   = CORRIDOR.atOf;

/** The pace the mapping is built on, metres a second: half a hill in
 *  the shortest moving phase either protocol has. */
export const V_MOVE = (HILL_LEN * 0.5) / 4.0;
/** And the average over a whole box cycle, holds included. */
export const WALK_V_NOM = HILL_LEN / 16.0;

/** The rate cap. 1.8x the moving pace: enough that a reader who has
 *  fallen behind the cue can catch up, and not enough to take two
 *  hills in a breath, which is what makes pace matter. */
export const WALK_V_MAX = V_MOVE * 1.8;

/** HOW THE RATE FALLS OFF AS HE ARRIVES, in hills.
 *
 *  NOT A PROPORTIONAL GAIN AND NOT A DEAD ZONE, and the reason is
 *  the shape of a hilltop. A rate proportional to the remaining
 *  distance crawls the last stretch, and the last stretch of a climb
 *  is the flat bit at the top, so the hill's own curvature and the
 *  controller's slowdown compound: measured at a gain of 1.5, he was
 *  at 70% of the hill when the inhale ended and spent half the hold
 *  still walking, which is the cue saying "stand" over a figure that
 *  is visibly not standing. A dead zone to cut it short just moves
 *  the fault — the rate then steps to zero, and a walker stopping
 *  dead from two metres a second is the one gait fault nobody misses.
 *
 *  So the rate SATURATES instead:
 *
 *      v = WALK_V_MAX * e^2 / (e^2 + E0^2)
 *
 *  which is zero at zero error WITH ZERO SLOPE, so he eases to a
 *  halt with no discontinuity and no threshold anywhere; is within a
 *  percent of the cap for any error over about a fifth of a hill, so
 *  he walks at a walking pace rather than accelerating up the
 *  hillside; and never exceeds the cap, so the no-extra-ground
 *  guarantee is untouched.
 *
 *  E0 is where the slowdown bites, and it is derived from the time
 *  the phase allows. Half a hill at the cap takes
 *
 *      (1/cap) * [ 0.5 - eps + E0^2 * (1/eps - 2) ]     hills/s units
 *
 *  which at E0 = 0.035 and eps = 0.004 (7 cm short) is 3.55 s of a
 *  4 s inhale. Measured on the drawn walk with the body spring in
 *  the chain he crests about a second into the hold and stands for
 *  the remaining three; tools/regress.mjs holds that number. */
export const PHASE_E0 = 0.035;

/** THE DRIVE RULE, shared by the page and both harnesses so there is
 *  one definition of what walking means. Metres a second, always
 *  >= 0 — he cannot walk backwards, which is the whole point. */
export function walkRate(d, wantH){
  const e = Math.max(0, targetHills(d, wantH) - d / HILL_LEN);
  return WALK_V_MAX * e * e / (e * e + PHASE_E0 * PHASE_E0);
}

/** AND HE HAS TO GET MOVING, which is the other end of the same
 *  problem. `targetHills` is a "next occurrence", so it jumps
 *  forward by most of a hill the moment the reader asks for a height
 *  BELOW the one he is standing at on a front face: the way down is
 *  over the top, and the distance to it goes from nothing to the far
 *  side of the crest in one frame. The rate rule above would answer
 *  that with the full cap instantly — a standing figure at three
 *  metres a second with no step in between.
 *
 *  So the walk carries a first-order lag. It is a gait, not a
 *  filter: a person leaning into a stride takes about half a second
 *  to be walking, and this is that. Applied as 1 - exp(-dt/tau)
 *  rather than dt/tau, so the response to a step is identical at any
 *  frame rate — tools/temporal.mjs reads the difference, and a
 *  dt/tau version of exactly this is the class of bug that made 58
 *  fps look worse than 60 in Long Air.
 *
 *  ONE-SIDED, AND THE FIRST VERSION WAS NOT, which cost the whole
 *  mapping. Lagged in both directions he OVERSHOOTS the place he is
 *  walking to; he cannot walk back, so the overshoot lands him past
 *  the crest, `targetHills` moves the target a whole hill on, and he
 *  chases it for ever. Measured: 2.94 hills per breath instead of
 *  one. Lagging only the accelerations keeps v <= walkRate at every
 *  instant, so overshoot is impossible by construction rather than
 *  by a clamp — and it is also what a walker does, since stopping is
 *  quicker than starting.
 *
 *  What the deceleration costs instead, measured: 12.8 m/s^2 at
 *  worst, on the no-holds protocol at the moment he reaches a crest.
 *  That is a figure arriving somewhere and stopping, over about a
 *  step and a half, and it is where the slowdown belongs. The
 *  accelerations peak at 8.6. Pulling the schedule's band in from
 *  the crest softens the deceleration — acos has an infinite
 *  derivative at both ends of the hill, which is where the number
 *  comes from — but it costs the exactness of one breath to one
 *  hill (0.985 at a 5 cm inset) and raises the top speed, so the
 *  band stays on the hill's own two extremes. */
export const WALK_TAU = 0.45;
export const walkEase = dt => 1 - Math.exp(-dt / WALK_TAU);
/** The whole gait in one place, so the page and both harnesses
 *  cannot disagree about it. Returns the new rate. */
export function walkStep(v, d, wantH, dt){
  const vt = walkRate(d, wantH);
  return vt > v ? v + (vt - v) * walkEase(dt) : vt;
}

/* ------------------------------------------------------------------
   THE PATH AND THE GROUND EITHER SIDE OF IT
   ------------------------------------------------------------------
   EVERYTHING HERE CLOSES AT PATH_PERIOD, and that is not a stylistic
   choice. The hill mesh is one strip of PATH_PERIOD metres scrolled
   under the lens, so any term in the surface whose period does not
   divide the strip's exactly is a VALUE JUMP at the wrap, dragged
   through the frame once per lap. The periods below are PATH_PERIOD
   over an integer, and the integers are chosen so that nothing
   rhymes with the hill — a lateral feature that repeats every whole
   number of hills would make every breath look like the last one.
   ------------------------------------------------------------------ */
/** The strip, in hills. 12 is 216 m, which is past the fog. */
export const PATH_HILLS = 12;
export const PATH_PERIOD = HILL_LEN * PATH_HILLS;

/** The lateral drift of the path, so the walk is not a ruled line.
 *  One slow component over the whole strip and one at 2.4 hills. */
export function pathX(d){
  return Math.sin(d * (Math.PI * 2 / PATH_PERIOD)) * 4.6
       + Math.sin(d * (Math.PI * 2 / (PATH_PERIOD / 5)) + 2.1) * 1.3;
}

/** The ground either side of the path. `o` is metres across from it.
 *
 *  EVEN IN o AND SMOOTH ACROSS ZERO — the first build used
 *  Math.abs(o), which is a slope kink straight down the line the
 *  camera is always pointed at, and the sampler only caught it once
 *  it was asked to sweep THROUGH zero.
 *
 *  The fall away from the path is gentle at the camera's own offset
 *  and steepens with distance: 0.9 m down at nine metres out, where
 *  the lens sits, and six and a half metres down at the edge of the
 *  strip. A down-land, not a ravine. */
export function groundAt(d, o){
  const q = o * o;
  const fall = 0.012 * q / (1 + 0.0015 * q);
  const cross = Math.sin(d * (Math.PI * 2 / (PATH_PERIOD / 5)) + o * 0.08 + 1.7)
              * 0.7 * (1 - Math.exp(-0.0032 * q));
  return hillAt(d) - fall + cross;
}

/* ------------------------------------------------------------------
   THE PROTOCOLS
   ------------------------------------------------------------------
   The same two the book offers everywhere: one with two short holds
   and one with none, neither withheld and neither recommended. A hold
   is a phase whose `from` equals its `to`, and here that arrives as
   the shepherd STANDING AT THE CREST or standing at the foot — the
   scene needs no new branch for it, because the ground supplies the
   stop.
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
        from:WALK_HI, to:WALK_HI, cam:'crest', count:'breathe out in',
        scalar:() => 1 },
      { k:'out',     d:4, label:'breathe out', sub:'over and down',
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
      { k:'out',  d:5, label:'breathe out', sub:'over and down',
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

/** How many sheep. Five, which is about the most a reader can count
 *  at a glance without counting; past that the line stops being a
 *  record anybody reads and becomes a texture. */
export const FLOCK_N = 5;

/** THE LAG IS DERIVED FROM HOW MUCH HISTORY THE LINE SHOULD HOLD.
 *
 *  Each sheep follows the one ahead in DISTANCE WALKED, so the line
 *  is strung out along real ground he has covered: change pace and
 *  the change travels down the line and arrives at the last sheep
 *  seconds later. The parameter is therefore a LENGTH OF TIME, not a
 *  length of ground, and that is the correction this rebuild forced.
 *
 *  THE FIRST DERIVATION WAS THE TRAIL LENGTH AND IT DID NOT SURVIVE
 *  MEASUREMENT. A critically damped follower tracking a ramp of
 *  slope v settles at an error of 2v/w, so N links trail 2Nv/w, and
 *  inverting that for a 14 m trail at V_MOVE gives w = 1.607. The
 *  harness measured the drawn trail at 8.86 m — forty percent short,
 *  and not because the algebra is wrong but because its ASSUMPTION
 *  is: it is a steady-state figure, the chain takes about 2N/w to
 *  reach it, and this schedule is only moving for four seconds at a
 *  time. A formula whose settling time is longer than the thing it
 *  is applied to does not describe it.
 *
 *  So the quantity that is actually chosen is the MEMORY: how long
 *  ago the last sheep was standing where he is now. Each link holds
 *  about 2/w seconds of it, so
 *
 *      w = 2 * N / FLOCK_MEMORY
 *
 *  FOUR AND A HALF SECONDS, and that is SHORTER THAN I WANTED, for a
 *  reason that is about the FRAME rather than the mechanic. The lens
 *  is side-on (see below), the phone is in portrait, and the
 *  horizontal field is 31 degrees: a line of figures seen side-on at
 *  22 m fits in about 12 m of picture, full stop. Ten seconds of
 *  memory strings the flock out over seventeen and most of it is off
 *  the right-hand edge — a record kept where the reader cannot read
 *  it, which is the thing the derivation was supposed to prevent.
 *  Four and a half still spans a whole inhale, and no other chapter
 *  in the book shows more than three tenths of a second of anything.
 *
 *  FLOCK_TRAIL is a CONSEQUENCE now and the harness measures it:
 *  7.5 m on the box protocol and 9.3 on the no-holds one, against
 *  the 8.5 this was designed around. Half a hill, so the whole line
 *  is on one face; and five sheep over that is about a metre and a
 *  half apart, a close flock. They close right up on a hold, which
 *  is the chapter working rather than the chapter failing. */
export const FLOCK_MEMORY = 4.5;
export const FLOCK_W = 2 * FLOCK_N / FLOCK_MEMORY;
export const FLOCK_TRAIL = 8.5;
export const FLOCK_MIN_GAP = FLOCK_TRAIL / FLOCK_N * 0.5;

/* ==================================================================
   THE LENS TRAVELS WITH HIM, AND SIDE-ON — 7 November 2026
   ==================================================================
   It was PARKED at the foot of a fixed path, which was right for an
   oscillation: a figure receding and returning reads as motion
   against a still frame. It is exactly wrong for progress. A figure
   making net progress away from a parked lens simply leaves, and
   within two breaths he would be a dot.

   So the question CLAUDE.md says to ask every time — what does the
   breath move, and relative to WHAT — gets its new answer: the
   breath moves him forward over ground, and the thing it moves him
   relative to is the GROUND ITSELF, which is why the lens is now off
   to the side and low. Side-on, the walk is travel across the frame
   and the hillside streams past; the crest rises through the picture
   and sinks behind him once per breath; and the flock strings out
   behind him along ground the reader has just watched him cover.

   HOW FAR OFF, AND THE FIRST ANSWER WAS WRONG IN A WAY THE MAPPING
   COULD NOT HAVE TOLD ME. Nine metres to the side and five behind
   put the shepherd off the left-hand edge of a 375 px frame and the
   last sheep seventeen hundred pixels past it: a side view of a line
   of figures needs the line to FIT, and a portrait phone gives 31
   degrees across. At 22 m that is 12.2 m of frame, which is what the
   flock above was re-derived against.

   And a second fault the same search found, which no amount of
   staring at the mapping would have shown either: a lens 22 m BEHIND
   him cannot see him at all, because the hills are 18 m long and
   there is a crest in the way. The sightline's clearance over the
   ground is measured now, at twelve points around a hill, rather
   than assumed.

   THE NUMBERS, because Lantern Current passed every gate in this
   repo and still failed on exactly this. At 2.25 m/s moving, 22 m
   abeam and 3 m up:

       he crosses the frame in 5.4 s     18% of the width a second
       ground abeam the lens, 22 m                   5.9 deg/s
       the grass directly under it, 3 m             43   deg/s
       Lantern Current, at its best                  2.4 deg/s
       Long Air at MAG 12                           88   deg/s

   THE FIRST LINE IS THE ONE THAT MATTERS FOR A SHOT LIKE THIS, and
   it is the one Lantern could not have produced at any distance: a
   figure that crosses the whole picture once a breath. Angular rate
   is the right test for a lens pointed ALONG the motion; across it,
   what the reader reads is the fraction of the frame travelled, and
   quoting the angular number alone here would be the measurement
   pointing at the wrong thing.

   IT TRAILS RATHER THAN RIDING, which is the other half of Lantern's
   fault: its camera rode the thing the breath moved, so the motion
   cancelled out. This one follows his distance through a slow
   tracker, so being ahead of or behind the pace is displacement
   within the frame — he walks towards the front of the picture on a
   fast climb and drifts back on a slow one. */
export const CAM_SIDE = 22.0;   // metres off the path
export const CAM_UP   = 3.0;    // metres above the ground beneath it
export const CAM_BACK = 3.5;    // abeam the middle of the line
export const CAM_W    = 1.1;    // how slowly it takes up his pace

/** Per-phase lens behaviour, hand-assigned like every other decision
 *  here. `look` is how far up the path the lens aims relative to the
 *  shepherd, `ease` how quickly it moves to a new phase's value.
 *  `crest` is its own entry rather than reusing `level`: a hold at
 *  the top is the one moment the far side of the hill is about to
 *  open up, and the lens looks further ahead for it. */
export const CAM_EASE = {
  /* SMALL, and that is the side-on lens again: at 22 m, aiming five
     metres up the path swings the whole picture by thirteen degrees,
     which is nearly half the frame. They are kept, because the lens
     leaning ahead of him on a climb and settling back on a descent
     is worth having; they are kept small because at this distance a
     little of it goes a long way. */
  climb:   { look:  2.0, ease: 2.2 },
  crest:   { look:  3.0, ease: 2.0 },
  descend: { look:  0.5, ease: 2.6 },
  level:   { look:  0.0, ease: 2.8 }
};

/** The choice the gate offers, in the same two words the rest of the
 *  book uses, because it is the same choice. */
export const CHOICE = { holds:'box', noholds:'open' };
export const validChoice = c => c === 'holds' || c === 'noholds';
