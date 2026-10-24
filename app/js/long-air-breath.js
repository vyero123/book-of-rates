/* Long Air — the two protocols, as DATA.
 *
 * A 3-D treatment of level 6, The Run (design doc §6, §6.1). The flat
 * chapter stays exactly as it is; this is its sibling.
 *
 * WHY THIS LEVEL GOT THE SECOND 3-D CHAPTER. Of the nine themes left,
 * this is the one that is actually ABOUT depth. Everything else in the
 * book can be staged as a picture that changes — a pool, a plateau, a
 * river, a temple — and the flat versions of those are not missing
 * anything. A flight down a gorge is different: the whole sensation is
 * forward translation, and forward translation is parallax, occlusion
 * and approach. A flat painting of speed has to draw speed lines and ask
 * you to believe them. In three dimensions the near wall genuinely goes
 * past the lens faster than the far rim, and the thing you were trying
 * to depict happens instead of being depicted.
 *
 * It also lets the chapter inherit the one functional advantage the
 * project has found anywhere (§5.1): PREDICTION. In Prototype 1 the dune
 * profile ahead of the traveller was not decorated with the breath, it
 * WAS the breath — the slope rising ahead of you is the inhale you are
 * about to take. Here that generalises into three dimensions: the gorge
 * floor and the distance between the rims, for every metre of the canyon
 * in front of you, are generated from the breath schedule at the moment
 * you will arrive there. So you can see three breaths into the future as
 * the shape of the canyon, and the turnaround can be prepared instead of
 * reacted to.
 *
 * THE MAPPING. No holds anywhere — §6.1 is explicit that this level has
 * none, and at 8 breaths a minute it is the briskest thing in the book,
 * so the one combination that actually kills people (§2.1 rule 3: fast
 * breathing then a hold) is not available here even by accident.
 *
 *     breathe in   — she climbs. The gorge opens out, the floor falls
 *                    away, and at the top of the inhale she breaks the
 *                    rim line into open sky for about a second.
 *     breathe out  — she dives. The walls close in, the floor comes up,
 *                    and the near rock starts hammering past the lens.
 *
 * The arousal in this level comes from speed and imagery, which §6.1 says
 * is honest as long as it is not dressed up as a physiological effect. It
 * is not. Three-minute cap, both protocols, exactly as the doc specifies.
 *
 * NOTHING IS CAUSAL. The two buttons roll her and flare her wings. They
 * do not make her climb, they cannot make her crash, and letting go does
 * nothing except stop the rolling. The glide is on the schedule.
 */

import { protocol, clamp01, smooth, bias, hold } from './breath.js';

/* ---------- the flight, in altitude terms. The rim is at 17. */
export const RIM      = 17.0;
export const ALT_LOW  =  4.2;    // down among the boulders
export const ALT_HIGH = 19.5;    // two and a half metres clear of the rim

/* A dive accelerates: it must leave the top slowly and arrive at the
   bottom fast. Plain smoothstep is symmetrical and read as a float down
   rather than a drop, which took the whole point out of the exhale. */
export const plunge = bias(1.7);
/* A climb is the other way round: she converts speed into height, so she
   leaves fast and runs out of energy at the top. */
export const soar   = bias(0.62);

export const PROTOCOLS = {
  /* §6 row 6: 3 / 4.5, no holds, 8 breaths a minute, three-minute cap.
     24 cycles × 7.5 s = 180 s exactly. */
  run: protocol({
    id:'run', name:'The run · 3 in / 4.5 out · 8 breaths a minute', cycles:24,
    phases:[
      { k:'in',  d:3,   label:'breathe in',  sub:'climbing',
        from:ALT_LOW, to:ALT_HIGH, ease:soar, cam:'rise', bank:-1,
        // wings spread wide on the climb and tuck for the dive: one
        // scalar for the whole airframe, so the sweep, the tail and the
        // speed lines cannot disagree with each other
        scalar:p => soar(p) },
      { k:'out', d:4.5, label:'breathe out', sub:'diving',
        from:ALT_HIGH, to:ALT_LOW, ease:plunge, cam:'dive', bank:1,
        count:'breathe in in', grit:true,
        scalar:p => 1 - plunge(p) }
    ]
  }),

  /* The slower one. Not a safety fallback — there is nothing to be gated
     out of here — just a different exercise for a different day, at 6
     breaths a minute instead of 8, and the same three-minute cap.
     18 cycles × 10 s = 180 s.

     It has a third phase the brisk one does not: a second at empty down
     among the boulders. That is §2.4's rest-at-empty, which is a rest and
     not a hold against urge, and the engine takes it without the scene
     knowing anything new — the phase descriptor carries its own
     altitude anchors, its own camera and its own countdown, and the
     render loop has no branch for it. That is the whole reason the
     protocol engine is shaped the way it is. */
  long: protocol({
    id:'long', name:'The long glide · 4 in / 5 out / 1 at empty · 6 breaths a minute', cycles:18,
    phases:[
      { k:'in',   d:4, label:'breathe in',  sub:'climbing',
        from:ALT_LOW, to:ALT_HIGH, ease:soar, cam:'rise', bank:-1,
        scalar:p => soar(p) },
      { k:'out',  d:5, label:'breathe out', sub:'diving',
        from:ALT_HIGH, to:ALT_LOW, ease:plunge, cam:'dive', bank:1,
        count:'level out in', grit:true,
        scalar:p => 1 - plunge(p) },
      { k:'rest', d:1, label:'rest',        sub:'skimming',
        from:ALT_LOW, to:ALT_LOW, cam:'skim', bank:0,
        count:'breathe in in', grit:true,
        // wings come back out as she levels, ready to climb again
        scalar:hold(0.25, 1.0) }
    ]
  })
};

/* ------------------------------------------------------------------
   THE TERRAIN IS THE BREATH
   ------------------------------------------------------------------ */

/** How fast she travels down the gorge, metres per second. The one number
 *  that ties time to distance, and therefore the number that makes the
 *  canyon ahead readable as a schedule. */
export const SPEED = 17.0;

/** How much of the canyon strip sits BEHIND her, as a fraction of its
 *  length. Some terrain has to be behind the lens or the near wall pops
 *  into existence at the edge of the frame.
 *
 *  Exported, and imported by the page rather than written there, because
 *  it appears in three places that must agree exactly — the build-time
 *  profile, the vertex shader's modulo, and the arrival-time arithmetic
 *  that makes the terrain the breath. Two copies of this number would
 *  put the canyon silently out of step with the schedule, which is the
 *  one failure this chapter cannot survive and the one that would look
 *  like nothing at all. tools/regress.mjs checks the agreement. */
export const BEHIND = 0.09;

/** How many breath cycles long the canyon strip is. */
export const STRIP_CYCLES = 3;

/** The strip length for a protocol, in metres. */
export const periodOf = proto => SPEED * proto.cycle * STRIP_CYCLES;

/** Normalised altitude, 0 at the bottom of the dive and 1 at the top of
 *  the climb. Every piece of terrain is a function of this and nothing
 *  else, which is what guarantees the canyon cannot drift out of step
 *  with the breath: there is no second source of truth to drift from. */
export function norm(alt){ return clamp01((alt - ALT_LOW) / (ALT_HIGH - ALT_LOW)); }

/** The floor, quantised to hard 1.2 m terraces (§4.2 rule 5 — depth in
 *  discrete bands, never a continuous ramp; a smooth floor profile here
 *  read as a gradient and took the cut-paper look off the whole frame).
 *
 *  It follows her, but at a little over half her swing, so her CLEARANCE
 *  varies too: eleven metres of air under her at the top of the climb,
 *  four at the bottom of the dive. That difference is the legibility.
 *  Floor and glider moving together would be a camera trick; floor and
 *  glider moving by different amounts is a dive. */
export function floorOf(alt){
  // Math.max(0, ...) is not belt-and-braces, it is a bug fix. At the exact
  // bottom of the dive the eased altitude lands on ALT_LOW to within a
  // rounding error, and (alt - ALT_LOW) comes out as about -1e-15. Floor
  // of a hair below zero is -1, so the floor dropped a whole 1.2 m terrace
  // — and because the canyon is BAKED from this function, that baked a
  // one-slice-wide notch into the rock at the bottom of every single dive.
  // Caught by pumping the frame body on the deployed page and reading a
  // floor of -1.2 where it had to be 0.
  return Math.floor((Math.max(0, alt - ALT_LOW) * 0.55) / 1.2) * 1.2;
}

/** Half the distance between the two rims. Narrow at the bottom of the
 *  dive and wide at the top of the climb, so the walls are closest to the
 *  lens exactly when she is going fastest. The gorge squeezing shut as
 *  she accelerates is the whole of the speed sensation; speed lines are
 *  only the garnish on it. */
export function gapOf(alt){
  return 7.0 + 9.0 * smooth(norm(alt));
}

/** The gorge wanders, so there is something to bank around and the walls
 *  are not two parallel planes. Purely geometric, deliberately NOT keyed
 *  to the breath — Prototype 1's lesson: when every layer followed the
 *  breath curve the frame read as noise. This is fixed geology.
 *
 *  It is built from HARMONICS OF THE STRIP LENGTH rather than from
 *  arbitrary frequencies, and that is not a stylistic choice. The canyon
 *  is one mesh scrolled for ever by a modulo, so every function of z in
 *  it has to be periodic in the strip length or there is a visible step
 *  where the strip wraps. Free-running sines would have left a seam that
 *  arrives once every twenty-two seconds and looks like a glitch.
 *
 *  The strip is three breath cycles long, so the wander repeats every
 *  three breaths while the floor repeats every one — which is why the
 *  canyon does not look like the same corner over and over. */
export function wanderAt(z, period){
  const u = (z / period) * Math.PI * 2;
  return Math.sin(u) * 7.0 + Math.sin(u * 3 + 2.1) * 3.0;
}

/* The same periodicity requirement applies to EVERY function of z the
 * canyon bakes, not just the wander — which is easy to forget, because
 * the breath-derived parts are periodic for free and the decorative
 * parts are not. The rim height and the floor's crease are both
 * decorative, both were written as free-running sines first, and both
 * would have left a step at the wrap: a canyon that visibly jolts once
 * every twenty-two seconds, which reads as a dropped frame rather than
 * as a mistake in the terrain. Harmonics of the strip length, same as
 * the wander, and the seams are checked in tools/regress.mjs.
 */

/** The rim is flat geology and does NOT follow the breath — it is what
 *  the breath-driven floor and gap are read against, so it has to be the
 *  stable thing in the frame. */
export function rimOf(z, period){
  const u = (z / period) * Math.PI * 2;
  return RIM + Math.round((Math.sin(u * 7 + 1.1) * 2.2) / 1.6) * 1.6;
}

/** The floor is terraced and tilted, with a hard crease down the middle
 *  rather than a smooth basin (§4.2 rule 5). */
export function creaseOf(z, period){
  const u = (z / period) * Math.PI * 2;
  return Math.round((Math.sin(u * 17) * 1.1 + 0.6) / 1.2) * 1.2;
}

/* §1.6a — no inhale is ever depicted underwater, in any water theme.
   THERE IS NO WATER IN THIS CHAPTER. Not a pool, not a river, not a
   coastline: she flies down a dry gorge at noon and never touches
   anything. So the rule is satisfied vacuously here, and it is recorded
   rather than left to inference, because the thing that would break it
   is somebody later adding a river along the canyon floor. If that ever
   happens, this chapter joins the WATER list in tools/regress.mjs and
   the inhale — which is the climb, from 4.2 m to 19.5 m — has to be
   checked against it like everything else. As written, the only phase
   anywhere near the rock is the exhale. */

export const CHOICE = { brisk:'run', slow:'long' };
export const validChoice = c => c === 'brisk' || c === 'slow';
