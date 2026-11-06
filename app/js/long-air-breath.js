/* Long Air — the protocols, and THE COURSE THEY GENERATE.
 *
 * A 3-D treatment of CHAPTER FOUR, The Kite Line (design doc §6 row 3).
 * The flat chapter stays exactly as it is; this is its sibling.
 *
 * ===================================================================
 * RE-BADGED, 24 October 2026. It was chapter five's protocols.
 * ===================================================================
 *
 * The chapter was built as a 3-D treatment of level 6, The Run — 3 in /
 * 4.5 out, 8 breaths a minute, energised, no holds. That was a mistake
 * about which level it is, not about what it is: the thing on screen is
 * A KITE ON A PLATEAU, which is §6 row 3's theme ("high plateau, wind,
 * one kite in an empty sky"), and row 3's protocol is box breathing at
 * 3.75 a minute. Row 3's own §6.1 note is also the one that decided this
 * chapter's collision rule, word for word, before anybody built it. The
 * scene always belonged to chapter four; only the schedule was wrong.
 *
 * So the protocols are now box breathing and a no-holds alternative, and
 * one structural thing falls out of the gate builder for free: BOX
 * BREATHING'S HOLDS BECOME LEVEL CHANNELS. A hold phase has `from` equal
 * to `to`, so every gate built across it opens at the same altitude, and
 * a run of gates at one altitude is a flat corridor the kite holds height
 * through. Nothing in courseOf() knows what a hold is; it just lays gates
 * on the schedule, and a schedule that stops moving lays a straight
 * corridor. A two-button control can express a hold perfectly — both
 * buttons off — so this is the one protocol shape the mechanic suits
 * best, which is a pleasant thing to discover after the fact rather than
 * an argument made to justify the move.
 *
 * The chapter keeps its own name, its own URL and its own file. Only the
 * number, the schedule and the copy changed.
 *
 * ONE DIVERGENCE FROM THE ROW, stated rather than hidden: row 3's
 * interaction is a side slider, and this chapter has two buttons. The
 * buttons are what the course was designed around and what the rate cap
 * is derived from; a slider hands the player an absolute altitude
 * instead of a rate, which would make the cap meaningless. The flat
 * chapter four still has the slider, so both readings exist.
 *
 * ===================================================================
 * SECOND PASS, 24 October 2026. It is a game now.
 * ===================================================================
 *
 * The first pass had the terrain generated from the breath schedule and
 * the player watching it go by. Three things were wrong with that, two
 * of them reported and one of them structural:
 *
 *   - the two buttons appeared to do nothing, and they nearly did: they
 *     rolled the figure and slid her sideways, and the camera followed
 *     her sideways position almost exactly, so the one thing they
 *     controlled was the one thing the camera cancelled out;
 *   - the figure clipped through the floor;
 *   - up-and-down motion did not mean anything, because nothing was
 *     asking her to be at any particular height.
 *
 * The redesign fixes the third by making height the whole game, which
 * makes the first fix itself. THE OBSTACLE COURSE IS NOW THE PROTOCOL.
 * Gates are placed so that the gap, at the moment you reach it, sits at
 * the altitude the protocol wants you to be at — so flying the course
 * correctly and breathing on schedule are not two things that have to be
 * reconciled, they are the same act. The course is the protocol
 * expressed as level design.
 *
 * That keeps the predictive property the first pass was built around
 * (§5.1: a cue that shows you what is COMING beats one that shows you
 * what is happening) and promotes it from scenery to mechanic. The
 * arrival-time arithmetic is unchanged and is derived below.
 *
 * -------------------------------------------------------------------
 * WHY BREATHING FASTER CANNOT HELP YOU
 * -------------------------------------------------------------------
 * This is the part that needed the most care, because handing the player
 * the pace is handing them the protocol.
 *
 * The kite's climb and sink rates are CAPPED at the protocol's own rates:
 * holding the inhale button for exactly the length of the protocol's
 * inhale takes the kite from the bottom of its range to the top, and no
 * input of any kind moves it faster. So breathing at twice the rate does
 * not get you twice the altitude — it gets you half the swing, oscillating
 * around the middle of the range. And the gates need the FULL swing,
 * because they were built from the full swing.
 *
 * The consequence is that the intended rate is not enforced by a rule, it
 * is the only rate the course can be flown at. Fast breathing is not
 * punished; it is simply not rewarded, which is the only lever worth
 * having — §2.4's hard-won point is that every documented breathwork
 * death involved somebody trying to beat something, so the thing to
 * remove is the incentive, not the capability.
 *
 * What this does NOT do, stated plainly: it cannot stop someone pressing
 * the buttons quickly while actually breathing quickly. No app can see a
 * chest. What limits the damage is that the cue text still names the pace
 * the course was built for, so the schedule stays visible even to a
 * player ignoring it, and that the pace named is 3.75 breaths a minute —
 * slower than anything this app has ever shipped.
 *
 * ON THE HOLDS, since box breathing has two of them. §2.1 rule 3 is the
 * one that matters: never hyperventilation followed by a breath-hold. Its
 * blanket form was withdrawn by the author on 23 October and the
 * prohibition moved onto rule 1, where the evidence sits — every death
 * cited for that combination happened in water. This chapter is dry, the
 * holds are four seconds, exactly equal to the other three phases, set by
 * the app, never lengthening and never timed by the player, and the pace
 * they sit in is 3.75 a minute. There is no fast breathing anywhere in
 * the chapter for them to follow. §6.1 reached the same conclusion from
 * the other direction: "box breathing's 4-second holds are low-risk and
 * this is the only level with holds at all besides nothing."
 *
 * And the no-holds protocol below is fully built and offered beside it,
 * neither withheld nor recommended, because §2.2 is explicit that an
 * all-or-nothing gate trains people to lie to it.
 *
 * -------------------------------------------------------------------
 * COLLISION
 * -------------------------------------------------------------------
 * §6.1's note on THIS level — row 3, Kite Line — decided this for exactly
 * this mechanic, and it is worth quoting because it was decided before
 * anybody tried to build it. (It was quoted here while the chapter
 * carried chapter five's protocols too, which was the first clue that the
 * scene belonged to row 3.)
 * "the cloud gaps are generated from the breath schedule, so following
 * the pacing always clears them — and when the user drifts off pace, the
 * gap widens rather than the kite crashing. The slider position is
 * expressive; the kite's survival is not in question."
 *
 * So: `forgiveness()` below widens the gap in proportion to how far off
 * pace the player is. The course yields before contact. Contact that
 * happens anyway is soft — see the scene file. Nothing is counted
 * anywhere, in this file or any other.
 *
 * §1.6a — no inhale depicted underwater — is vacuous here: there is no
 * water in this chapter, and a kite over a plateau is not going to grow
 * any. If one is ever added, this chapter joins the WATER list in
 * tools/regress.mjs.
 */

import { protocol } from './breath.js';
import { corridor, ratesOf, courseOf as buildCourse, gateAt as findGate,
         forgiveness as forgive, periodOf as stripPeriod,
         gatesPerCycle as perCycle } from './course.js';

/* THE CORRIDOR, THE RATE CAP, THE FILL/POSITION SPLIT AND THE COURSE ARE
   NOW THE KIT'S, not this chapter's — js/course.js. Nothing about them
   was kite-shaped, and two more 3-D chapters would have copied all four.
   What is left in this file is what is genuinely Long Air's: the numbers,
   the protocols, and the plateau. The thin wrappers below keep this
   module's public surface exactly as it was, so the page and the harness
   did not have to be rewritten around the move. */

/* ==================================================================
   LIFT — ONE KNOB FOR HOW MUCH THE FLYING IS WORTH
   ==================================================================
   6 November 2026. The reader wants the up-and-down to feel ten to
   twenty times what it was. Multiplying the altitude band by fifteen
   is the obvious lever and it is the wrong one on its own: the phase
   durations are fixed by the protocol, so fifteen times the range in
   the same four seconds is 77 m/s of climb against 14 m/s of forward
   travel — a flight path 80 degrees from level, which is a rocket,
   and the gates, the corridor and the terrain's own scale all stop
   agreeing with each other.

   WHAT THE SENSATION ACTUALLY IS. The eye reads ANGULAR rate, not
   metres: how fast the world sweeps through the frame. For vertical
   motion that is

       omega  =  vertical speed / distance to the nearest thing you
                 can see move

   and the chapter was weak in BOTH terms. Vertical speed was 5.1 m/s
   (20.5 m in a 4 s inhale). And the nearest thing that moved with
   altitude was the ridge, forty-five metres off — because the two
   layers that ARE close, the motes and the speed streaks, were pinned
   to the kite's own frame and therefore moved with it, contributing
   exactly nothing. So:

       omega  =  5.1 / 45  =  0.11 rad/s  =  6.5 deg/s

   THE TWO FACTORS, AND WHY THEY MULTIPLY. Raising the real range is
   limited by the flight-path angle: it is the only term that costs
   geometry and the only one that can make the chapter absurd. Putting
   a visible reference CLOSE is nearly free and is where most of the
   sensation was being thrown away.

       real range      x 2.4   (band 20.5 -> 49 m, path angle 41 deg)
       near reference  x 5.6   (45 m of terrain -> 8 m of drifting
                                seed heads, world-anchored so they
                                stream past instead of riding along)
                       ------
       felt            x 13.5  of angular rate

   That is the reader's range reached by the two terms it is actually
   made of, rather than by one multiplication that would have had to
   be fifteen on its own and would have broken the chapter to get it.

   MAG IS THE KNOB AND IT IS THE ONLY ONE. Every vertical constant
   below is derived from it, so the band, the corridor, the gate
   openings, the forgiveness, the cloud base and depth, the buoyancy
   coefficient, the terrain's own relief and the treeline all move
   together and the landscape keeps its proportions. MAG = 1 is the
   chapter as it was.

       V = MAG^0.35   how much REAL range grows. The exponent is what
                      splits the work between the two factors above:
                      at MAG 12 it gives 2.41, and the remaining 5.6
                      comes from the near reference, which is the
                      parallax work in long-air.html.
       T = sqrt(V)    how much the TERRAIN's relief grows. Less than
                      the band, deliberately: the hill has to stay a
                      plateau you soar over rather than becoming a
                      mountain range you thread, and its curvature
                      scales linearly with its relief, so every pixel
                      bar in tools/continuity.mjs scales with T. At
                      T = 1.55 the ridge's worst knot goes from 1.00
                      to about 1.6 px against a 2 px bar — which is
                      the real ceiling on this number and the reason
                      it is a square root rather than V.

   WHAT IT COSTS TO TURN UP. Nothing in triangles: every constant here
   is a multiplier on geometry that already exists. The cost is in the
   bars. T drives the ridge's knot angle linearly, so MAG beyond about
   20 (T = 1.72, ridge 1.72 px) runs out of room against the 2 px bar
   and the ridge would need more columns. The flight path angle is
   atan(20.5 V / 56), which at MAG 20 is 44 degrees.

   AND A WORD ABOUT THE TOP OF THE RANGE. This is a calming exercise.
   Large, fast vertical camera motion is the standard way to make
   somebody queasy, and expansive is the goal where vertigo is not.
   At MAG 20 the lens sweeps about 100 degrees a second at the
   turnarounds, which is brisk enough to read as violent rather than
   soaring. 12 is shipped and 8 to 14 is the band I would stay in;
   the knob goes to 20 and the reader is welcome to overrule me.
   ================================================================== */
export const MAG = 12;
const V = Math.pow(MAG, 0.35);
const T = Math.sqrt(V);
/** Exposed so the page and the samplers scale with the same numbers
 *  rather than each raising MAG to its own power. */
export const MAG_V = V, MAG_T = T;

/* ------------------------------------------------------------------
   The corridor, in metres. Above zero is up.
   ------------------------------------------------------------------ */

/** The ridge below. Its tops are quantised and stay under the corridor. */
export const GROUND    =  0.0;
export const RIDGE_TOP =  3.4 * T;     // the highest any ridge crest reaches

/** Where the kite is allowed to be. The first pass let the figure clip
 *  through the floor; this pass makes that unreachable by construction —
 *  the kite is clamped into this band, the band's floor sits well above
 *  the highest ridge crest, and tools/regress.mjs checks the margin
 *  rather than trusting it. */
/* DERIVED FROM THE TERRAIN, NOT TYPED. The floor has to clear the
   highest drawn crest by the margin the sampler measures (4.62 m at
   MAG 1), and the ceiling has to sit above the band by the overshoot
   room the band itself needs. Both were constants that happened to
   satisfy those relations; they now state them. */
/* BOTH GAPS SCALE, and the gate opening is why. GATE_HALF grows with
   V — it has to, because the spring's lag grows with the schedule's
   slope and the on-pace margin is the opening less that lag — so the
   gate's LOWER lip reaches V times further below the band. If the
   distance from the band down to the hill stayed fixed, that lip
   would end up underground, which is exactly what the harness caught:
   "the ridge eats a gate's opening (-9.56 m)".
   At MAG 1 the lowest lip clears the crest by 0.7 m. Scaling both
   gaps keeps that relation rather than restoring it by hand, and at
   MAG 12 it comes out at 1.67 m — the guarantee gets stronger, which
   is the only direction it is allowed to move. */
export const CORR_LO = RIDGE_TOP + 4.6 * V;
export const ALT_LOW  = CORR_LO + 3.5 * V;
export const ALT_HIGH = ALT_LOW + 20.5 * V;
export const CORR_HI = ALT_HIGH + 4.0 * V;

/** The band the SCHEDULE sweeps, inside the corridor. Narrower than the
 *  corridor at both ends, so a player who overshoots has somewhere to
 *  overshoot into instead of hitting a hard stop. */
/** The kit's corridor object, which also checks the nesting the whole
 *  no-clipping guarantee rests on: CORR_LO < ALT_LOW < ALT_HIGH < CORR_HI. */
export const CORRIDOR = corridor({ lo: CORR_LO, hi: CORR_HI, low: ALT_LOW, high: ALT_HIGH });

export const RANGE  = CORRIDOR.range;
export const normOf = CORRIDOR.normOf;
export const altOf  = CORRIDOR.atOf;

/* THE SCHEDULE IS LINEAR, AND THAT IS FORCED, not a preference.
 *
 * The first pass eased it — a climb that leaves fast and runs out at the
 * top (bias 0.62), a descent that accelerates (bias 1.7) — which was
 * right when the breath drove the scene and nobody had to match it.
 *
 * It is incompatible with the control. The buttons integrate fill at a
 * CONSTANT rate, so the best a player can possibly produce is a straight
 * ramp. Against the eased schedule that ramp is out by up to 3.73 m at
 * the middle of an inhale — more than the 3.6 m half-gap, on its own,
 * before any lag. Perfect play was geometrically impossible: an on-pace
 * player was clipping gates 35% of the time, which is the exact opposite
 * of §6.1's promise that following the pacing always clears them.
 *
 * The fix is not a bigger gap, it is the right shape. A constant-rate
 * control can only track the integral of a constant, so the schedule has
 * to be linear. It also suits the idiom: linear ramps make the course a
 * run of hard straight facets rather than curves.
 */
export const linear = x => x;

/* ------------------------------------------------------------------
   The protocols. §6 row 3: box breathing, 3.75 a minute.
   ------------------------------------------------------------------ */

/** No session in this chapter runs past three minutes. Row 3 does not
 *  impose a cap — row 6 did, and this chapter inherited the habit — but a
 *  cap is worth keeping on a chapter with a control in it, and a named
 *  constant is worth more than the number 180 appearing in a check. */
export const SESSION_CAP = 180;

export const PROTOCOLS = {
  /* BOX BREATHING, 4-4-4-4, 3.75 breaths a minute. 11 × 16 s = 176 s.
     §6 row 3's own protocol.

     The two holds are the interesting part, and nothing here implements
     them: they are a phase whose `from` equals its `to`. courseOf() lays
     gates on the schedule without caring why it is flat, so a hold comes
     out as a LEVEL CHANNEL — a run of gates all at one altitude, which is
     a straight corridor to hold height through with both buttons off.
     `cam:'level'` already existed for the old slow protocol's rest, so
     the scene needs no new branch either. */
  box: protocol({
    id:'box', name:'Box breathing · 4-4-4-4 · 3.75 breaths a minute', cycles:11,
    phases:[
      { k:'in',      d:4, label:'breathe in',  sub:'let it climb',
        from:ALT_LOW,  to:ALT_HIGH, ease:linear, cam:'rise',
        scalar:p => p },
      { k:'hold',    d:4, label:'hold',        sub:'fly it level',
        from:ALT_HIGH, to:ALT_HIGH, cam:'level', count:'breathe out in',
        scalar:() => 1 },
      { k:'out',     d:4, label:'breathe out', sub:'let it fall',
        from:ALT_HIGH, to:ALT_LOW,  ease:linear, cam:'dive',
        count:'level out in',
        scalar:p => 1 - p },
      { k:'holdout', d:4, label:'hold',        sub:'fly it level',
        from:ALT_LOW,  to:ALT_LOW,  cam:'level', count:'breathe in in',
        scalar:() => 0 }
    ]
  }),

  /* THE NO-HOLDS ALTERNATIVE, 4 in / 5 out / 3 at empty, 5 a minute.
     15 × 12 s = 180 s.

     THE REST WAS ONE SECOND AND IS NOW THREE, and that is a structural
     fix rather than a tuning one. A level channel is a run of gates at
     one altitude; gates are laid every SPACING seconds of schedule; so
     a stationary phase SHORTER THAN THE GATE SPACING cannot contain two
     gates and cannot be a channel at all. At the old 0.55 s spacing a
     one-second rest held two gates and worked. When the spacing went to
     1.45 s to cut how often a wall crosses the lens, the one-second
     rest quietly stopped being a channel — the harness caught it, and
     the first response was to exempt short phases from the check, which
     is papering over a real mismatch between two numbers that have to
     agree.

     They agree now: the rest is 3 s, comfortably longer than two gate
     spacings, so the no-holds protocol has a real level channel again
     and the check is unconditional. The pace moves from 6 a minute to
     5, which is the middle of the resonance band and a better place for
     this chapter's slow option to be anyway. */
  open: protocol({
    id:'open', name:'No holds · 4 in / 5 out / 3 at empty · 5 breaths a minute', cycles:15,
    phases:[
      { k:'in',   d:4, label:'breathe in',  sub:'let it climb',
        from:ALT_LOW, to:ALT_HIGH, ease:linear, cam:'rise',
        scalar:p => p },
      { k:'out',  d:5, label:'breathe out', sub:'let it fall',
        from:ALT_HIGH, to:ALT_LOW, ease:linear, cam:'dive',
        count:'level out in',
        scalar:p => 1 - p },
      { k:'rest', d:3, label:'rest',        sub:'fly it level',
        from:ALT_LOW, to:ALT_LOW, cam:'level', count:'breathe in in',
        scalar:() => 0 }
    ]
  })
};

/* ------------------------------------------------------------------
   The player's rates — derived from the protocol, never guessed
   ------------------------------------------------------------------ */

/** How fast the kite may fill and empty, in fractions of the range per
 *  second, taken from the durations of the protocol's own inhale and
 *  exhale. Holding the inhale button for the length of the protocol's
 *  inhale fills it exactly once: that is the whole of the rate cap, and
 *  it is derived rather than tuned so it cannot drift away from the
 *  course when a duration is edited. Now the kit's `ratesOf`, which sums
 *  rather than finds — a chapter with a double inhale needs that and
 *  this chapter is unaffected by it. */
export const rates = ratesOf;

/* ------------------------------------------------------------------
   Travel, and the strip
   ------------------------------------------------------------------ */

/** Metres a second the course comes at you. Slower than the first pass's
 *  17: at 375 px wide a gate has to be readable early enough to do
 *  something about it, and the first pass was a canyon you watched rather
 *  than a course you flew. */
export const SPEED = 14.0;

/** How much of the strip stays behind the lens, as a fraction. */
export const BEHIND = 0.09;

/** The strip is three breath cycles long. The GATES repeat every cycle,
 *  which is correct and is the point — the breath repeats — but the
 *  scenery is keyed to the strip so it does not repeat every breath. */
export const STRIP_CYCLES = 3;
export const periodOf = proto =>
  stripPeriod({ speed: SPEED, cycle: proto.cycle, cycles: STRIP_CYCLES });

/* ------------------------------------------------------------------
   THE COURSE
   ------------------------------------------------------------------
   Baked once per protocol, scrolled for ever by a modulo in a vertex
   shader: one draw call, no streaming, no seam.

   The arithmetic that makes it predictive, unchanged from the first pass.
   A thing built at z = zb shows up at world z = BEHIND·P − mod(zb − uDist, P),
   so its distance ahead is d = mod(zb − SPEED·t, P) − BEHIND·P and the
   player reaches it in d/SPEED seconds. Because the schedule is periodic
   and P is a whole number of its cycles, that arrival TIME collapses to
   zb/SPEED − BEHIND·P/SPEED — a function of zb alone, with t cancelled.
   So the whole course can be baked at build time and is still exactly the
   schedule laid out in space.

   Everything else in the strip must be periodic in P too, or the wrap
   leaves a step. The breath-derived parts are periodic for free; the
   decorative ones are not, and are built from harmonics of P below.
   ------------------------------------------------------------------ */

/** Half the vertical opening of a gate, before forgiveness. The kite is
 *  about 1.6 m across, so this is a generous hole — §6.1: following the
 *  pacing always clears them, and the kite's survival is not in question.
 *  It is a pacing cue wearing a game's clothes, not a test.
 *
 *  3.6 left an on-pace player clearing by 0.08 m once a session, which
 *  is not a guarantee, it is a coincidence. The spring lag behind a ramp
 *  is about 1.4 m and the turnaround adds its own overshoot, so the hole
 *  has to be bigger than the worst of those put together with room to
 *  spare. tools/regress.mjs flies an on-pace player through a whole
 *  session and fails under 0.4 m of margin. */
export const GATE_HALF = 7.4 * V;

/** How much wider the gap gets when the player is completely off pace.
 *  §6.1 again: "when the user drifts off pace, the gap widens rather than
 *  the kite crashing". This is that sentence as a number. */
export const FORGIVE_MAX = 4.6 * V;

/* ==================================================================
   THE GLIDER MODEL — 24 October 2026
   ==================================================================
   Two forces and no others, by instruction:

     THE GLIDER'S OWN DIRECTION. Near a surface it bends away from it
       by itself (body.avoid). That is what makes crashing unreachable:
       not a rule forbidding it, a tendency avoiding it.
     SURFACE FRICTION. Contact is a SKIM — it rides the surface rather
       than being shoved off it — and what it costs is FORWARD SPEED.
       Breath is the only thing that takes the friction off again.

   GRAVITY IS NOT MODELLED. No falling term, no weight, no lift, no
   stall. A reader who stops breathing does not sink; they slow down.
   Adding a third force for realism would be adding a way to lose to a
   chapter that does not have one, and this chapter's whole claim is
   that it cannot be lost.

   WHAT THE OLD MODEL DID, and why it had to go. Contact used to push
   the kite back towards the opening and add a velocity kick. A kite
   held against a lip was shoved, kicked and shoved again: driving the
   page with the buttons mashed produced a kite at 25.9 m/s, 10.8 m off
   its schedule, with the entire grit pool saturated at 130 live
   particles. "It cannot crash" was true and it was also visibly
   thrashing, which is not the same promise.

   THE APERTURE IS WIDER AND THE GROUND IS MORE VARIED, which the
   author asked for and which the friction model also needs. The gates
   open 7.4 m either side rather than 4.6, forgiveness adds up to 4.6
   rather than 3.2, and the corridor moved up and grew (8..36 against
   5..27, with the schedule sweeping 11.5..32 against 7.5..24.5) to
   keep the lower lip clear of a ridge that now reaches 3.4 m and
   varies much more on the way there.

   The wider aperture is also what bounds the one feedback loop this
   model could have had. Friction slows forward travel, so a slowed
   glider is somewhere the course did not expect it at that moment —
   and if that mismatch could exceed the opening, slowing would cause
   contact, which would cause more slowing. It cannot: see
   MAX_DESYNC_M below, which is derived from the model's own constants
   and checked in tools/regress.mjs.
   ================================================================== */

/** The most forward speed friction can take away. */
export const DRAG_MAX_LOSS = 0.45;
/** Drag gained per second of continuous skimming... */
export const DRAG_GAIN = 1.3;
/** ...and removed per second of breathing on the cue. Clearing is
 *  faster than gaining on purpose: recovery should never feel like a
 *  penalty being served. */
export const DRAG_CLEAR = 1.6;

/** How near a lip the glider starts steering away, in metres, and how
 *  hard. The margin is large relative to the gap because the avoidance
 *  is meant to be a bend, not a save. */
/* ==================================================================
   THE TOP OF THE COURSE IS CLOUD, NOT A CEILING — 4 November 2026
   ==================================================================
   The reader's instruction: no hard upper boundary; fluffy clouds
   that gently push you away, but you can go into them if you want.
   That is §1.6b — recommended, not required — applied to the geometry
   rather than to the schedule, and it is the same conviction as the
   soft skim on the floor. The sky stops being a limit and becomes an
   opinion.

   So the upper lip of every gate stops being a surface. The lower one
   does not: rock is rock, and a reader who cannot fly through a hill
   is not being refused anything. Only the weather yields.

   CLOUD_LIFT is the coefficient of a CUBIC in depth, in m/s^2 per
   cubic metre. Cubic because d^3 is zero in value, slope AND
   curvature at d = 0, so the field is C2 across the boundary by
   construction — no span to tune, no instant at which anything
   begins. See buoy() in js/course.js.

   WHAT THE NUMBER COMES TO, since a coefficient on a cube is not
   readable by eye. Acceleration at depth d is 0.06 d^3:

       1 m in    0.06 m/s^2    a suggestion; the reader may not notice
       3 m in    1.6           a lean, clearly the world's opinion
       6 m in    13            firm, and still not a stop
      10 m in    60            the spring cannot hold against it

   And the equilibrium: the altitude spring pulls up with k(want - y)
   at k = 64 towards a target that tops out at ALT_HIGH, so a reader
   holding a full inhale over a gate whose opening is low settles
   about twelve metres into the bank and hangs there. That is deep
   enough to be a place rather than a rebuff, which is what "you can
   go into them if you want" has to mean to be true.

   CLOUD_REACH is how far either side of a gate the bank is felt,
   beyond the slab's own depth. The envelope across it is a quintic,
   so the onset is C2 in the approach distance as well as in depth —
   the force is a product of two smooth factors and a gate on either
   of them would put back the discontinuity the cubic exists to
   remove. */
/* THE COEFFICIENT SCALES AS 1/V^2, so the equilibrium DEPTH scales
   with the band rather than the force doing. Balancing k(want - y)
   against L d^3 with both y and d proportional to V needs L
   proportional to 1/V^2; anything else and a reader at MAG 12 either
   bounces off the base or sinks through the bank. */
export const CLOUD_LIFT = 0.06 / (V * V);
export const CLOUD_REACH = 4.0;

export const AVOID_MARGIN = 4.2 * V;
export const AVOID_STRENGTH = 30;

/** THE WORST THE COURSE CAN GET OUT OF STEP WITH THE BREATH, in metres
 *  of altitude, derived rather than hoped for.
 *
 *  Drag is cleared by breathing on the cue, so the longest a glider can
 *  stay slowed while following the cue is one clearing time. In that
 *  window it covers less ground than the course expects by at most
 *  SPEED · DRAG_MAX_LOSS · (1/DRAG_CLEAR) metres, which is a time
 *  offset of DRAG_MAX_LOSS/DRAG_CLEAR seconds against a schedule that
 *  moves at most RANGE/shortest-phase metres a second.
 *
 *  This must stay comfortably inside the opening, or friction would
 *  cause contact and contact would cause friction. It is the one
 *  feedback loop in the model and this is the number that opens it. */
export const MAX_DESYNC_M = (DRAG_MAX_LOSS / DRAG_CLEAR) * (RANGE / 4);

/** HOW FAST THE GLIDER MAY EVER TRAVEL, derived from the schedule.
 *
 *  The steepest the schedule ever moves is the whole range in one
 *  phase; the glider has no reason to go faster than that with a margin
 *  for the spring's lead-in. Without a cap the avoidance, which is
 *  right for a reader drifting towards a lip, is far too strong for one
 *  who is not breathing at all: that reader sits at the bottom of the
 *  corridor while the schedule sweeps the whole of it, so they are
 *  permanently against a lip and permanently being herded. Measured on
 *  the deployed page, the kite reached 27.5 m/s. Gathered back towards
 *  the opening is right; snapped there is not. */
export const V_MAX = 2.6 * (RANGE / 4);

/** Gates roughly every 0.55 s of schedule, rounded so a whole number
 *  fits in a cycle — a fraction of a gate per cycle would break the
 *  strip's periodicity and put the course out of step with the breath. */
/* HOW OFTEN A WALL SWEEPS THE LENS, in seconds of schedule.
 *
 * This was 0.55, which at 14 m/s is a gate every 7.7 m and 1.8 large
 * opaque objects passing the camera every second. That is the reported
 * fault: "a different theme flashes in every second or so". It is not a
 * defect in any one layer — every candidate was measured and cleared,
 * including a second render loop, the idle background, depth precision,
 * the near field, the far stack, the lip accent and the forgiveness
 * stepping — it is simply the rate at which the course throws a wall
 * across the frame. Hiding the gate meshes takes the flash count to
 * zero; nothing else does.
 *
 * 1.45 s is a gate every 20.3 m, 0.69 a second. Eleven gates a breath
 * still samples the altitude curve far more finely than a reader can
 * fly it — the course is no less the schedule, it just states it in
 * fewer words. tools/regress.mjs proves that rather than assuming it:
 * the gate-is-the-schedule check holds at any spacing. */
export const SPACING = 1.45;
export const gatesPerCycle = proto => perCycle({ cycle: proto.cycle, spacing: SPACING });

/** Build the gate list. `schedule(t)` is the protocol's own altitude
 *  curve — pass `breath(proto).value`. The layout and its derivation are
 *  the kit's now; this supplies the plateau's own numbers. */
export const courseOf = (proto, schedule) => buildCourse({
  proto, schedule, speed: SPEED, stripCycles: STRIP_CYCLES,
  behind: BEHIND, half: GATE_HALF, spacing: SPACING
});

/** Which gate is nearest the kite right now, given distance travelled.
 *  The inverse of the layout, so the collision test and the drawn
 *  geometry cannot disagree about where a gate is. */
export const gateAt = findGate;

/** How far off pace the player is, 0 (on it) to 1 (hopeless), and the
 *  extra half-gap that earns them. Quantised into four steps so the
 *  course does not breathe in and out continuously with every wobble —
 *  it should feel like the world making room, not like rubber. */
export const forgiveness = (kiteY, targetY) =>
  forgive({ value: kiteY, target: targetY, range: RANGE, max: FORGIVE_MAX });

/* ------------------------------------------------------------------
   Decoration — periodic in the strip, and deliberately NOT keyed to the
   breath. Prototype 1's lesson: when every layer followed the breath
   curve the frame read as noise. The gates are the breath; the ridge and
   the cloud ceiling are weather and geology.
   ------------------------------------------------------------------ */

/** The ridge crests below the corridor. Quantised to hard terraces
 *  (§4.2 rule 5) and clamped under RIDGE_TOP so the corridor floor is
 *  always clear of them. */
/** GREATER VARIANCE OF GRADE, which the author asked for.
 *
 *  The old ridge was two harmonics quantised to 0.8 m steps between
 *  0.4 and 2.4: a gentle corrugation that read as texture rather than
 *  as terrain, and whose grade barely changed from one crest to the
 *  next. This one runs 0.0 to 3.4 over four harmonics with a coarser
 *  0.85 m step, so it has flats, long climbs and sudden drops instead
 *  of one repeating bump — and the quantisation makes those read as
 *  cut terraces (§4.2 rule 5) rather than as a wobble.
 *
 *  Still clamped under RIDGE_TOP, and the corridor floor is still
 *  checked against it in tools/regress.mjs rather than trusted. */
/** SMOOTH SATURATION, because a clamp is a jut.
 *
 *  Math.min(hi, Math.max(lo, x)) is continuous in value and
 *  discontinuous in SLOPE: the derivative drops from 1 to 0 over no
 *  distance at all, wherever the clamp bites. On a surface that is a
 *  crease, and a crease is exactly what the reader was describing.
 *
 *  A quintic with zero first and second derivative at both ends, so
 *  the result is C2: no kink where the range ends and no sudden change
 *  of curvature either. Flat at the bottom, flat at the top, steeper
 *  than linear in between — which is what terrain looks like anyway.
 *
 *  Lives here rather than in long-air-terrain.js so that module can
 *  import it without the two forming a cycle. */
export function sat(x, lo, hi, inLo, inHi){
  const t = (x - inLo) / (inHi - inLo);
  if(t <= 0) return lo;
  if(t >= 1) return hi;
  return lo + (hi - lo) * (t * t * t * (t * (t * 6 - 15) + 10));
}

/* QUANTISATION REMOVED — 2 November 2026, and the measurement is why.
   ------------------------------------------------------------------
   This was `Math.min(RIDGE_TOP, Math.max(0, Math.round(h / 0.85) * 0.85))`:
   a step function with two hard clamps on top of it. The intent was
   cut terraces (§4.2 rule 5) and the result was not terraces, because
   the mesh samples this every four metres and the steps land wherever
   they land relative to that grid — so an 0.85 m riser arrives as a
   random 0.85 m lurch inside one row rather than as an architectural
   edge. The reader called the chapter a jutting, discontinuous mess
   and asked for it to be sampled.

   Sampled, by tools/continuity.mjs, which classifies a field by how
   its measured derivatives behave when the sample spacing is halved:

     ridgeAt   VALUE JUMP   slope x4, curvature x16 over two halvings
     crest line as drawn    a 25.14 degree turn at a single knot

   A ratio of 4 and 16 is a value discontinuity — the derivative is
   diverging, not merely large — and 25 degrees in four metres is the
   jut itself. Note that this is NOT fixed by more knots: the kink
   angle at a knot is about f'' times the spacing, and for a quantised
   field f'' is unbounded, so subdividing achieves nothing. Going from
   nine profile columns to fifteen was the same mistake in x.

   §4.2a already draws this line for shading: a hard edge is not a
   jagged edge, and posterised VALUE steps stay. This is geometry, not
   shading — the terraces were never legible as terraces — so the
   field is now smooth and the hard steps continue to live where they
   always worked, in the value bands the fragment shader paints on top
   of it. Still bounded by the same [0, RIDGE_TOP], now by saturation
   rather than by a clamp. */
export function ridgeAt(z, period){
  const u = (z / period) * Math.PI * 2;
  const h = Math.sin(u * 3) * 1.55
          + Math.sin(u * 7 + 0.9) * 1.05
          + Math.sin(u * 13 + 1.7) * 0.6
          + Math.sin(u * 23 + 4.2) * 0.3
          + 1.3;
  // the four harmonics span +-3.5 about 1.3
  return sat(h, 0.0, SPINE_TOP, -2.2, 4.8);
}

/* RIDGE_TOP NOW MEANS WHAT ITS NAME SAYS — 2 November 2026.
   ------------------------------------------------------------------
   It was documented as "the highest any ridge crest reaches" and
   ridgeAt was clamped to it, but ridgeAt is only the SPINE: the mesh
   adds the profile's own dy (up to +0.4 at the x = +-13 columns) and
   the cross-course grade (up to +0.45) on top. So the surface a glider
   could actually touch reached 4.22 m while the constant claimed 3.4,
   and tools/regress.mjs has been checking the corridor margin against
   the wrong number since the ridge was built.

   Measured, not reasoned about: tools/continuity.mjs samples the DRAWN
   surface across the whole strip and reports its peak.

   The guarantee is re-derived rather than the check loosened, which is
   what was asked for. The spine is saturated 0.85 m lower — exactly
   max(dy) + max(grade) — so the drawn peak lands on RIDGE_TOP and the
   name is true again. This moves the terrain DOWN, so every clearance
   in tools/regress.mjs gets larger: the on-pace guarantee is
   strengthened, never weakened. */
export const SPINE_TOP = RIDGE_TOP - 0.85 * T;

/** The underside of the cloud ceiling, well above the corridor.
 *  Was quantised to 1.6 m steps and measured the same way: VALUE JUMP,
 *  slope x4, curvature x16, a 21.8 degree turn at one knot. It is a
 *  single harmonic and needs no clamp at all, so dropping the
 *  quantisation leaves a pure sine. */
export function ceilAt(z, period){
  const u = (z / period) * Math.PI * 2;
  return CORR_HI + 7.0 * V + Math.sin(u * 7 + 0.6) * 2.4 * V;
}

/** Lateral wander, for the ridge and the far scenery only. The kite has
 *  no lateral control any more — the game is one-dimensional on purpose,
 *  which is what makes it legible on a 375 px screen — so this is
 *  scenery, not gameplay. */
export function wanderAt(z, period){
  const u = (z / period) * Math.PI * 2;
  return Math.sin(u) * 5.0 + Math.sin(u * 3 + 2.1) * 2.0;
}

/** The gate's two buttons speak in these terms; the engine speaks in
 *  protocol ids. One place to translate, and the same two words Deep
 *  Light uses, because it is the same choice being offered. */
export const CHOICE = { holds:'box', noholds:'open' };
export const validChoice = c => c === 'holds' || c === 'noholds';
