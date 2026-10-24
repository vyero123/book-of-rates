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

/* ------------------------------------------------------------------
   The corridor, in metres. Above zero is up.
   ------------------------------------------------------------------ */

/** The ridge below. Its tops are quantised and stay under the corridor. */
export const GROUND    =  0.0;
export const RIDGE_TOP =  3.4;     // the highest any ridge crest reaches

/** Where the kite is allowed to be. The first pass let the figure clip
 *  through the floor; this pass makes that unreachable by construction —
 *  the kite is clamped into this band, the band's floor sits well above
 *  the highest ridge crest, and tools/regress.mjs checks the margin
 *  rather than trusting it. */
export const CORR_LO = 8.0;
export const CORR_HI = 36.0;

/** The band the SCHEDULE sweeps, inside the corridor. Narrower than the
 *  corridor at both ends, so a player who overshoots has somewhere to
 *  overshoot into instead of hitting a hard stop. */
export const ALT_LOW  = 11.5;
export const ALT_HIGH = 32.0;

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

  /* THE NO-HOLDS ALTERNATIVE, 4 in / 5 out / 1 at empty, 6 a minute.
     18 × 10 s = 180 s. This is the protocol the chapter shipped as its
     slow option, kept verbatim and re-cast as the no-holds choice, which
     is what it always was — `rest` is a second at empty, not a breath
     held against urge. It keeps one short level channel of its own, at
     the bottom of the range, so the shape the box protocol is built
     around is present in both. */
  open: protocol({
    id:'open', name:'No holds · 4 in / 5 out / 1 at empty · 6 breaths a minute', cycles:18,
    phases:[
      { k:'in',   d:4, label:'breathe in',  sub:'let it climb',
        from:ALT_LOW, to:ALT_HIGH, ease:linear, cam:'rise',
        scalar:p => p },
      { k:'out',  d:5, label:'breathe out', sub:'let it fall',
        from:ALT_HIGH, to:ALT_LOW, ease:linear, cam:'dive',
        count:'level out in',
        scalar:p => 1 - p },
      { k:'rest', d:1, label:'rest',        sub:'fly it level',
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
export const GATE_HALF = 7.4;

/** How much wider the gap gets when the player is completely off pace.
 *  §6.1 again: "when the user drifts off pace, the gap widens rather than
 *  the kite crashing". This is that sentence as a number. */
export const FORGIVE_MAX = 4.6;

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
export const AVOID_MARGIN = 4.2;
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
export const SPACING = 0.55;
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
export function ridgeAt(z, period){
  const u = (z / period) * Math.PI * 2;
  const h = Math.sin(u * 3) * 1.55
          + Math.sin(u * 7 + 0.9) * 1.05
          + Math.sin(u * 13 + 1.7) * 0.6
          + Math.sin(u * 23 + 4.2) * 0.3
          + 1.3;
  return Math.min(RIDGE_TOP, Math.max(0.0, Math.round(h / 0.85) * 0.85));
}

/** The flat underside of the cloud ceiling, well above the corridor. */
export function ceilAt(z, period){
  const u = (z / period) * Math.PI * 2;
  return CORR_HI + 7.0 + Math.round((Math.sin(u * 7 + 0.6) * 2.4) / 1.6) * 1.6;
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
