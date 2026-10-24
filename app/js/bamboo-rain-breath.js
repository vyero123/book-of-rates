/* Bamboo Rain — the protocols, and WHERE THE RAIN IS.
 *
 * A 3-D treatment of CHAPTER EIGHT: design doc §6 row 5. Settled, after
 * distress. Double nasal inhale and a long exhale, then 5 / 6. Storm:
 * rain, hard angular lightning, a full-frame flash. The interaction the
 * row names is the whole chapter: "each exhale pushes the rain band
 * further off. The storm clears on schedule."
 *
 * There is no flat twin. This is a new chapter, not a second reading of
 * an old one.
 *
 * -------------------------------------------------------------------
 * WHY THIS ONE WANTS THREE DIMENSIONS
 * -------------------------------------------------------------------
 * Because the rain is a VOLUME with a near face, and the interaction is
 * pushing that face away from you through depth. In two dimensions the
 * only thing "further off" can mean is smaller or fainter — a change in
 * the picture. Here it is a change in where you are standing relative to
 * a wall of water: the near slivers stop existing, the far ones stay,
 * the sound of it would recede if there were any, and a lightning stroke
 * behind the curtain shows you exactly how deep the gap you have opened
 * now is. Depth is the mechanic, not the scenery.
 *
 * -------------------------------------------------------------------
 * THE TRAVELLED SCALAR IS THE CURTAIN'S NEAR FACE, IN METRES
 * -------------------------------------------------------------------
 * Not the figure. The figure is sitting still under a shelter — this is
 * the one chapter so far where the breath moves the WORLD and leaves the
 * body where it is, which is what "settled, after distress" should feel
 * like. She is not going anywhere; the weather is.
 *
 * Per cycle the curtain comes in as you fill and goes out as you empty,
 * and it returns to where it started, because the schedule is periodic
 * and must be. THE STORM CLEARING IS A SEPARATE TERM — the session
 * progress translates the whole band outward and thins the rain, which
 * is what "the storm clears on schedule" means precisely: on the
 * schedule, not on the effort. Lift your finger for the entire session
 * and it still clears. §6: the interaction guarantees success.
 *
 * -------------------------------------------------------------------
 * THE PUSH, AND WHY PUSHING HARDER DOES NOTHING
 * -------------------------------------------------------------------
 * One press target, the whole screen. Hold it and the curtain is driven
 * out; let go and it drifts back in. The rates are the kit's, derived
 * from the protocol's own durations — and SWAPPED, which is the point of
 * them being a mapping rather than a convention: here the EXHALE is the
 * phase that drives the scalar up, so the exhale's duration sets the
 * fill rate and the inhale's sets the decay. See pushRates() below.
 *
 * The cap is therefore exactly as it is in Long Air: a full exhale's
 * worth of pressing drives the curtain across its whole band exactly
 * once, and nothing moves it faster. Pressing through the inhale as well
 * buys nothing, because the band has a far wall. Breathing twice as fast
 * gets half the swing.
 *
 * -------------------------------------------------------------------
 * §1.6a — NO INHALE DEPICTED UNDERWATER
 * -------------------------------------------------------------------
 * Not applicable, and this is a judgement rather than an oversight, so
 * it is written down. The rule binds WATER THEMES; the design doc's own
 * list of those is rows 1, 2, 4, 7 and 9. Row 5 is a storm on land, the
 * figure is under a shelter, nobody is submerged at any point and there
 * is no surface to be under. There is standing water on the ground and
 * the rule has nothing to say about standing on it.
 *
 * If a figure is ever put INTO the water in this chapter, it joins the
 * WATER list in tools/regress.mjs in the same commit, or the guarantee
 * is lost silently — which is the whole failure mode that list exists to
 * prevent.
 *
 * SILENT. No AudioContext, no media elements. A storm chapter is the one
 * most tempting to put thunder in, and it is still silent by design.
 */

import { protocol, smooth, clamp01 } from './breath.js';
import { corridor, ratesOf } from './course.js';

/* ------------------------------------------------------------------
   The curtain, in metres from the figure. Bigger is further away.
   ------------------------------------------------------------------ */

/** Where the schedule sweeps. NEAR is close enough that the rain is
 *  falling past the edge of the shelter roof; FAR is the far side of the
 *  clearing. */
export const RAIN_NEAR =  5.5;
export const RAIN_FAR  = 30.0;

/** The hard walls. The near wall is what makes it impossible for the
 *  curtain to arrive ON the figure however badly the session goes, which
 *  is the same guarantee Long Air's corridor floor gives the kite — by
 *  construction, not by being unlikely. */
export const WALL_NEAR =  4.0;
export const WALL_FAR  = 38.0;

export const CORRIDOR = corridor({
  lo: WALL_NEAR, hi: WALL_FAR, low: RAIN_NEAR, high: RAIN_FAR
});
export const RANGE  = CORRIDOR.range;
export const normOf = CORRIDOR.normOf;
export const distOf = CORRIDOR.atOf;

/** A point in the band by the fraction of the way IN from the far wall.
 *  Used to anchor the double inhale's middle, so the two inhale phases
 *  can be given anchors that make them one continuous movement rather
 *  than two of different speeds — see the protocol below. */
export const inward = f => RAIN_FAR - RANGE * f;

/** The sigh's inhale is 2 s + 1 s, and the boundary between them is
 *  two thirds of the way in, which makes the WHOLE inhale one constant
 *  speed. */
export const RAIN_MID = inward(2 / 3);

/** How much further the whole band sits by the end of the session. This
 *  is the clearing, and it is a function of elapsed time alone. */
export const CLEAR_SHIFT = 26.0;

/** The band's own translation at session progress 0..1. Eased, because a
 *  storm does not clear linearly — it holds, then goes. */
export const clearingAt = prog => smooth(clamp01(prog)) * CLEAR_SHIFT;

/** No session runs past three minutes. */
export const SESSION_CAP = 180;

/* The schedule is LINEAR within each phase, for the same forced reason
 * as Long Air: a press integrates at a constant rate, so the best a
 * player can possibly produce is a straight ramp, and an eased schedule
 * is a target a constant-rate control cannot track. The easing in this
 * chapter is all in the clearing term above, which no control touches. */
export const linear = x => x;

/* ------------------------------------------------------------------
   The protocols
   ------------------------------------------------------------------ */
export const PROTOCOLS = {
  /* THE SIGH. §6 row 5's own protocol: double nasal inhale, long exhale.
     2 + 1 + 6 = 9 s, 6.67 breaths a minute, 20 cycles = 180 s.

     The second inhale is a SIP ON TOP of the first, not a second breath:
     it is short, it is taken without emptying, and the cue says so. The
     physiological sigh is the one pattern in the row and it is what the
     chapter is for.

     Two phases carry k:'in'. That is what makes the kit's ratesOf() sum
     rather than find — the older version took the first inhale's 2 s and
     would have driven the scalar across its whole band in two seconds
     against a cue asking for three. A rate cap that does not cap.

     AND THE SIP DOES NOT JERK THE WORLD. The boundary between the two
     inhales is anchored two thirds of the way in, which is exactly where
     two seconds of a three-second constant-speed inhale ends — so the
     curtain crosses the whole band at ONE speed and the only thing that
     changes at the sip is the cue. The first version gave each phase its
     own share of the distance and the curtain visibly jerked at the
     boundary; tools/regress.mjs caught it as a tracking error twice the
     lag the spring could explain, which is what that check is for. It is
     also the more honest picture: a short sip on top of a breath does
     not make the weather flinch. */
  sigh: protocol({
    id:'sigh', name:'The sigh · 2 in, 1 more on top / 6 out · 6.7 breaths a minute', cycles:20,
    phases:[
      { k:'in',  d:2, label:'breathe in',  sub:'through the nose',
        from:RAIN_FAR, to:RAIN_MID, ease:linear, cam:'draw',
        scalar:p => p * 0.62 },
      { k:'in',  d:1, label:'and again',   sub:'a short sip on top',
        from:RAIN_MID, to:RAIN_NEAR, ease:linear, cam:'draw',
        count:'breathe out in',
        scalar:p => 0.62 + p * 0.38 },
      { k:'out', d:6, label:'breathe out', sub:'push it away',
        from:RAIN_NEAR, to:RAIN_FAR, ease:linear, cam:'push',
        count:'breathe in in',
        scalar:p => 1 - p }
    ]
  }),

  /* AND THEN 5 / 6, the second half of the row. 11 s, 5.45 a minute,
     16 cycles = 176 s. The row describes these as one session that
     changes partway through; the engine's unit is a cycle, so they are
     offered as two and the gate sheet says which is which rather than
     pretending a cascade is happening. */
  settled: protocol({
    id:'settled', name:'Settled · 5 in / 6 out · 5.45 breaths a minute', cycles:16,
    phases:[
      { k:'in',  d:5, label:'breathe in',  sub:'let it come in',
        from:RAIN_FAR, to:RAIN_NEAR, ease:linear, cam:'draw',
        count:'breathe out in',
        scalar:p => p },
      { k:'out', d:6, label:'breathe out', sub:'push it away',
        from:RAIN_NEAR, to:RAIN_FAR, ease:linear, cam:'push',
        count:'breathe in in',
        scalar:p => 1 - p }
    ]
  })
};

/* ------------------------------------------------------------------
   The push rates
   ------------------------------------------------------------------ */

/** THE RATES, SWAPPED. In Long Air the inhale drives the scalar up, so
 *  the inhale's duration sets the fill rate. Here the EXHALE is what
 *  drives the curtain out, so the exhale's duration sets the fill rate
 *  and the inhale's sets the decay.
 *
 *  Stated as a swap of the kit's own numbers rather than written out by
 *  hand, so the derivation — a full phase of pressing crosses the band
 *  exactly once, no more and no less — is the same derivation and cannot
 *  drift away from it. */
export function pushRates(proto){
  const r = ratesOf(proto);
  return { fillPerSec: r.emptyPerSec, emptyPerSec: r.fillPerSec, din: r.din, dout: r.dout };
}

/** Is this phase the one that pushes? The scene asks, rather than
 *  testing `k === 'out'` in three places. */
export const pushes = kind => kind === 'out';

/** THE CURTAIN'S SPRING, stiffer than the kit's default 64.
 *
 *  Not a taste decision. The sigh's first inhale brings the curtain
 *  nineteen metres in two seconds, and the second brings it five and a
 *  half in one — phases SHORTER THAN THE SPRING'S OWN SETTLING TIME, so
 *  the schedule reverses while the body is still catching up and the
 *  error at the turnaround is about twice the steady-state lag rather
 *  than equal to it. At k=64 that was four and a half metres on a
 *  twenty-four metre band, which is a curtain arriving visibly after the
 *  cue that asked for it.
 *
 *  k=180 puts the settling time near 0.3 s, comfortably inside the
 *  one-second sip. The curtain still has mass — it is a wall of water
 *  moving through air, not a kite on a line, and it should not be
 *  weightless — it simply has less of it than the default assumes.
 *
 *  tools/regress.mjs derives its tolerance from this number rather than
 *  carrying one of its own, so changing it here moves the bar with it. */
export const SPRING = 180;

/* ------------------------------------------------------------------
   The grove and the ground — decoration, deliberately NOT keyed to the
   breath. Prototype 1's lesson: when every layer follows the breath
   curve the frame reads as noise. The curtain is the breath; the bamboo
   and the puddles are a place it is raining in.
   ------------------------------------------------------------------ */

/** Stem height for a stem at parameter u (0..1 across the grove).
 *  Quantised to hard steps, §4.2 rule 5. */
export function stemAt(u){
  const a = u * Math.PI * 2;
  const h = 7.0 + Math.sin(a * 3.0) * 1.8 + Math.sin(a * 11.0 + 1.1) * 0.9;
  return Math.round(h / 0.7) * 0.7;
}

/** How bright a lightning stroke is at time t, 0 most of the time.
 *  STRUCK ON THE EXHALE ONLY, and late in it: a flash is the thing that
 *  shows you how far back the curtain has gone, so it is worth nothing
 *  at the moment the curtain is closest. Hard-edged and short — §4.2
 *  rule 5 applies to light as well as to depth.
 *
 *  Deterministic in the cycle index, not random, so the same session
 *  twice is the same session. */
export function strokeAt(t, cycle){
  const n = Math.floor(t / cycle);
  const u = (t % cycle) / cycle;
  // roughly every third cycle, and never in the first one
  if(n < 1 || n % 3 !== 1) return 0;
  const at = 0.62 + ((n * 7919) % 17) / 17 * 0.14;
  const d = (u - at) / 0.085;
  if(d < 0 || d > 1) return 0;
  // two hard steps, bright then half, then gone. Not a fade.
  return d < 0.34 ? 1.0 : (d < 0.62 ? 0.45 : 0.18);
}

export const CHOICE = { sigh:'sigh', settled:'settled' };
export const validChoice = c => c === 'sigh' || c === 'settled';
