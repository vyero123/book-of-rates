/* Long Air — the protocols, and THE COURSE THEY GENERATE.
 *
 * A 3-D treatment of level 6, The Run (design doc §6). The flat chapter
 * stays exactly as it is; this is its sibling.
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
 * chest. Two things limit the damage. Neither protocol here has a hold,
 * so the combination that actually kills people (§2.1 rule 3 —
 * hyperventilation followed by a breath-hold) is not reachable in this
 * chapter at all. And the cue text still names the pace the course was
 * built for, so the schedule remains visible even to a player ignoring it.
 *
 * -------------------------------------------------------------------
 * COLLISION
 * -------------------------------------------------------------------
 * §6.1 already decided this for exactly this mechanic, and it is worth
 * quoting because it was decided before anybody tried to build it:
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

import { protocol, clamp01, smooth, bias } from './breath.js';

/* ------------------------------------------------------------------
   The corridor, in metres. Above zero is up.
   ------------------------------------------------------------------ */

/** The ridge below. Its tops are quantised and stay under the corridor. */
export const GROUND    =  0.0;
export const RIDGE_TOP =  2.4;     // the highest any ridge crest reaches

/** Where the kite is allowed to be. The first pass let the figure clip
 *  through the floor; this pass makes that unreachable by construction —
 *  the kite is clamped into this band, the band's floor sits well above
 *  the highest ridge crest, and tools/regress.mjs checks the margin
 *  rather than trusting it. */
export const CORR_LO = 5.0;
export const CORR_HI = 27.0;

/** The band the SCHEDULE sweeps, inside the corridor. Narrower than the
 *  corridor at both ends, so a player who overshoots has somewhere to
 *  overshoot into instead of hitting a hard stop. */
export const ALT_LOW  =  7.5;
export const ALT_HIGH = 24.5;
export const RANGE    = ALT_HIGH - ALT_LOW;

export const normOf = alt => clamp01((alt - ALT_LOW) / RANGE);
export const altOf  = n   => ALT_LOW + clamp01(n) * RANGE;

/* A climb trades speed for height, so it leaves fast and runs out at the
   top; a descent accelerates. Same curves as the first pass, same names. */
export const soar   = bias(0.62);
export const plunge = bias(1.7);

/* ------------------------------------------------------------------
   The protocols. §6 row 6: no holds anywhere, three-minute cap.
   ------------------------------------------------------------------ */
export const PROTOCOLS = {
  /* 3 / 4.5, 8 breaths a minute. 24 × 7.5 s = 180 s exactly. */
  run: protocol({
    id:'run', name:'The run · 3 in / 4.5 out · 8 breaths a minute', cycles:24,
    phases:[
      { k:'in',  d:3,   label:'breathe in',  sub:'let it climb',
        from:ALT_LOW, to:ALT_HIGH, ease:soar, cam:'rise',
        scalar:p => soar(p) },
      { k:'out', d:4.5, label:'breathe out', sub:'let it fall',
        from:ALT_HIGH, to:ALT_LOW, ease:plunge, cam:'dive',
        count:'breathe in in',
        scalar:p => 1 - plunge(p) }
    ]
  }),

  /* The slower one, 6 a minute, same cap: 18 × 10 s = 180 s. It has a
     third phase the brisk one lacks — a second at empty, low — and the
     engine takes it without the scene knowing anything new. In the course
     that second becomes a short LEVEL channel: the gates stop climbing or
     falling and you fly straight, with both buttons off. A hold is the
     one thing a two-button control can express perfectly. */
  long: protocol({
    id:'long', name:'The long glide · 4 in / 5 out / 1 at empty · 6 breaths a minute', cycles:18,
    phases:[
      { k:'in',   d:4, label:'breathe in',  sub:'let it climb',
        from:ALT_LOW, to:ALT_HIGH, ease:soar, cam:'rise',
        scalar:p => soar(p) },
      { k:'out',  d:5, label:'breathe out', sub:'let it fall',
        from:ALT_HIGH, to:ALT_LOW, ease:plunge, cam:'dive',
        count:'level out in',
        scalar:p => 1 - plunge(p) },
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
 *  course when a duration is edited. */
export function rates(proto){
  const dur = k => { const p = proto.phases.find(q => q.k === k); return p ? p.d : null; };
  const din = dur('in'), dout = dur('out');
  if(!din || !dout) throw new Error('rates(): protocol needs an in and an out phase');
  return { fillPerSec: 1 / din, emptyPerSec: 1 / dout, din, dout };
}

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
export const periodOf = proto => SPEED * proto.cycle * STRIP_CYCLES;

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
 *  about 1.4 m across, so this is a generous hole — §6.1: following the
 *  pacing always clears them, and the kite's survival is not in question.
 *  It is a pacing cue wearing a game's clothes, not a test. */
export const GATE_HALF = 3.6;

/** How much wider the gap gets when the player is completely off pace.
 *  §6.1 again: "when the user drifts off pace, the gap widens rather than
 *  the kite crashing". This is that sentence as a number. */
export const FORGIVE_MAX = 3.2;

/** Gates roughly every 0.55 s of schedule, rounded so a whole number
 *  fits in a cycle — a fraction of a gate per cycle would break the
 *  strip's periodicity and put the course out of step with the breath. */
export const gatesPerCycle = proto => Math.round(proto.cycle / 0.55);

/** Build the gate list. `schedule(t)` is the protocol's own altitude
 *  curve — pass `breath(proto).value`. */
export function courseOf(proto, schedule){
  const period = periodOf(proto);
  const back = period * BEHIND;
  const perCycle = gatesPerCycle(proto);
  const n = perCycle * STRIP_CYCLES;
  const dz = period / n;
  const gates = [];
  for(let i = 0; i < n; i++){
    const zb = i * dz;
    const ta = zb / SPEED - back / SPEED;   // see the derivation above
    gates.push({ i, zb, ta, centre: schedule(ta), half: GATE_HALF });
  }
  return { period, back, dz, perCycle, gates };
}

/** Which gate is nearest the kite right now, given distance travelled.
 *  The inverse of the layout above, so the collision test and the drawn
 *  geometry cannot disagree about where a gate is. */
export function gateAt(course, dist){
  const { period, back, dz, gates } = course;
  const zb = ((dist + back) % period + period) % period;
  const i = Math.round(zb / dz) % gates.length;
  const g = gates[i];
  // signed distance from the kite to that gate's plane, +ve = still ahead
  let ahead = g.zb - zb;
  if(ahead >  period / 2) ahead -= period;
  if(ahead < -period / 2) ahead += period;
  return { gate: g, ahead };
}

/** How far off pace the player is, 0 (on it) to 1 (hopeless), and the
 *  extra half-gap that earns them. Quantised into four steps so the
 *  course does not breathe in and out continuously with every wobble —
 *  it should feel like the world making room, not like rubber. */
export function forgiveness(kiteY, scheduleY){
  const err = Math.abs(kiteY - scheduleY) / RANGE;
  const stepped = Math.floor(clamp01(err / 0.55) * 4) / 3;
  return { err: clamp01(err), extra: Math.min(1, stepped) * FORGIVE_MAX };
}

/* ------------------------------------------------------------------
   Decoration — periodic in the strip, and deliberately NOT keyed to the
   breath. Prototype 1's lesson: when every layer followed the breath
   curve the frame read as noise. The gates are the breath; the ridge and
   the cloud ceiling are weather and geology.
   ------------------------------------------------------------------ */

/** The ridge crests below the corridor. Quantised to hard terraces
 *  (§4.2 rule 5) and clamped under RIDGE_TOP so the corridor floor is
 *  always clear of them. */
export function ridgeAt(z, period){
  const u = (z / period) * Math.PI * 2;
  const h = Math.sin(u * 5) * 1.3 + Math.sin(u * 13 + 1.7) * 0.8 + 1.1;
  return Math.min(RIDGE_TOP, Math.max(0.4, Math.round(h / 0.8) * 0.8));
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

export const CHOICE = { brisk:'run', slow:'long' };
export const validChoice = c => c === 'brisk' || c === 'slow';
