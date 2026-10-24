/* Deep Light — the two protocols, as DATA.
 *
 * Split out of deep-light.html when the kit was extracted. The page keeps
 * the scene; this file keeps the breath. Two reasons it is worth its own
 * module rather than staying inline:
 *
 *  1. it is the thing most likely to be edited, and it is the thing an
 *     edit to is most likely to be dangerous;
 *  2. it has no dependency on three.js or the DOM, so tools/regress.mjs
 *     can sample the entire session in Node and diff it against the frozen
 *     pre-kit baseline in tools/fixtures. A browser cannot be made to
 *     prove "identical" cheaply; arithmetic in a terminal can.
 *
 * Nothing about the mapping changed in the extraction. `grip` is now
 * called `scalar`, which is the kit's name for a phase's own expressive
 * curve, and `ease` is defaulted by protocol() instead of at the read
 * site. The numbers are untouched.
 *
 * THE MAPPING, and the reasoning, preserved from the original file:
 *
 *   inhale  — above water, and nowhere else. Stationary at the surface.
 *   hold    — the travel. Both holds are travel, one down, one up.
 *   exhale  — on the seabed, and nowhere else. Stationary at the bottom.
 *
 * So: breathe in at the surface, hold down, empty your lungs on the floor
 * of the sea, hold back up. An earlier version exhaled during the rise,
 * which put the breath and the motion out of step. Bubbles belong to the
 * exhale alone, which is what keeps a hold legible as a hold. The pearl is
 * taken at the bottom while she is emptying, and the whole ascent is a
 * held breath with it at her chest.
 *
 * On retention at all: the design doc originally decided against it here
 * (§8 decision 2, §2.4). That decision was amended by the author on
 * 23 October 2026 — §1.5, §2.4 — on the grounds that this is a personal
 * project offered as-is. The original reasoning is preserved, not deleted,
 * and the no-holds protocol below is the doc's own version, fully built,
 * because §2.2 is explicit that an all-or-nothing gate trains people to
 * lie to it. Neither is withheld and neither is recommended.
 *
 * LATER THE SAME DAY: §1.6a was added — an inhale is never depicted
 * underwater, in any water theme. It is a standing rule, it is not
 * subject to a per-level exception, and it invalidated the no-holds
 * protocol's mapping, which used to rise on the inhale. See the long
 * note on that protocol below. The box protocol was checked against the
 * rule rather than assumed to comply: its inhale is flat at the surface,
 * both height anchors at +0.52, no travel at all during the phase, so it
 * complies and always did.
 */

import { protocol, clamp01, smooth, drop } from './breath.js';

/* ---------- the dive, in height terms. Above zero is out of the water. */
export const Y_AIR    =  0.52;
export const Y_BOTTOM = -14.4;
/* Snorkel depth. The no-holds protocol reaches to here and no further —
   see the §1.6a note on that protocol below for why it cannot go deeper. */
export const Y_REACH  =  -3.8;

/** §1.6a, as a predicate. Above zero is out of the water, and an inhale
 *  must be entirely out of the water — not arriving there, not clearing
 *  it at the last moment. Exported so tools/regress.mjs tests the same
 *  definition the chapter uses rather than its own copy of it. */
export const SURFACE = 0;

export const PROTOCOLS = {
  box: protocol({
    id:'box', name:'Box breathing · 4-4-4-4 · 3.75 breaths a minute', cycles:10,
    phases:[
      { k:'in',   d:4, label:'breathe in',  sub:'at the surface',
        from:Y_AIR, to:Y_AIR, cam:'air', aim:-0.15,
        scalar:p => 1 - smooth(clamp01(p / 0.50)) },
      { k:'hold', d:4, label:'hold',        sub:'going down',
        from:Y_AIR, to:Y_BOTTOM, cam:'down', ease:drop, aim:0.60,
        count:'breathe out in', scalar:() => 0 },
      { k:'out',  d:4, label:'breathe out', sub:'on the seabed',
        from:Y_BOTTOM, to:Y_BOTTOM, cam:'floor', aim:0.10, bubbles:true,
        scalar:p => smooth(clamp01((p - 0.45) / 0.40)) },
      { k:'hold', d:4, label:'hold',        sub:'rising with it',
        from:Y_BOTTOM, to:Y_AIR, cam:'up', aim:-0.45,
        count:'surfacing in', scalar:() => 1 }
    ]
  }),

  /* THE NO-HOLDS PROTOCOL — REMAPPED 23 October 2026 for §1.6a.
     ------------------------------------------------------------------
     It used to be the design doc's own §2.4 mapping: she sank as she
     emptied, rested at the bottom at empty, and ROSE AS SHE BREATHED IN,
     breaking the surface at the top of the inhale. That last clause is
     now disallowed. §1.6a: an inhale is never depicted underwater, in
     any water theme, at any depth, for any part of the phase — because
     the user's own diaphragm follows the picture, so an inhale cued over
     a submerged body is a rehearsal of inhaling underwater, and that is
     the one association nobody should be practising.

     Which leaves 4 / 2 / 5 with no phase to ascend in. The full
     reasoning, and the two options rejected, are in the §2.4 amendment;
     the short version is that bringing her up fourteen metres inside a
     two-second rest is about seven metres a second, and the usual excuse
     for it — empty lungs, so she floats — is backwards, since emptying
     the lungs makes a diver LESS buoyant. That satisfies the rule on
     paper by making the picture a lie.

     So THE DESCENT BECOMES A REACH. She tips down and reaches on the
     exhale, to snorkel depth; she turns and kicks back up through the
     rest at empty, breaking the surface BEFORE the rest ends; and the
     whole inhale is taken at the surface with her head in the air,
     stationary. Three and a half metres and a kick is something a four-
     second exhale and a two-second rest can honestly account for.

     The cost, stated rather than hidden: this protocol no longer visits
     the seabed. That is the true consequence of its breath structure,
     not a workaround — the mapping yields to the rule, never the other
     way round. The gain is that both protocols now hold the inhale
     stationary at the surface, so §1.6a is satisfied by the SHAPE of the
     mapping rather than by a number tuned until it just clears the line.
     ------------------------------------------------------------------ */
  open: protocol({
    id:'open', name:'No holds · 4 out / 2 at empty / 5 in · 5.45 breaths a minute', cycles:14,
    phases:[
      { k:'out',  d:4, label:'breathe out', sub:'reaching down',
        from:Y_AIR, to:Y_REACH, cam:'down', ease:drop, aim:0.60, bubbles:true,
        // she arrives and closes on the pearl as she finishes emptying,
        // which is the same logic the box protocol uses on the seabed
        scalar:p => smooth(clamp01((p - 0.55) / 0.40)) },
      // a rest at empty, not a hold against urge: §2.4's version. It is
      // now also the ascent, and it must FINISH above the surface.
      { k:'rest', d:2, label:'rest',        sub:'kicking back up',
        from:Y_REACH, to:Y_AIR, cam:'up2air', count:'surfacing in',
        scalar:() => 1 },
      { k:'in',   d:5, label:'breathe in',  sub:'at the surface',
        from:Y_AIR, to:Y_AIR, cam:'air', aim:-0.15,
        // at the surface she stows it, exactly as in the box protocol
        scalar:p => 1 - smooth(clamp01(p / 0.50)) }
    ]
  })
};

/** The gate's two buttons speak in these terms; the engine speaks in
 *  protocol ids. One place to translate, so neither has to know the other. */
export const CHOICE = { holds:'box', noholds:'open' };
export const validChoice = c => c === 'holds' || c === 'noholds';
