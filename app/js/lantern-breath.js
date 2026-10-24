/* Lantern Current — the protocols, and THE HULL ABOVE THE WATERLINE.
 *
 * A 3-D treatment of CHAPTER NINE: design doc §6 row 4. Sleepy. 4 / 8
 * going to 4 / 9.3, 5.0 down to 4.5 a minute. Night river, drifting
 * paper lanterns. The row's interaction: "rest a finger anywhere to
 * light a lantern. Screen dims across the session and ends dark."
 *
 * There is no flat twin. This is a new chapter.
 *
 * -------------------------------------------------------------------
 * WHY THIS ONE WANTS THREE DIMENSIONS
 * -------------------------------------------------------------------
 * Because a lantern is a light source at a DISTANCE, and distance is the
 * only thing that makes a light on water read as a light on water: the
 * pool it throws shortens as you come level with it, swings across the
 * reeds as you pass, and stretches away behind. Flat, a lantern is a
 * sprite that gets smaller. Here the lanterns you light stay where you
 * lit them and the river carries you past each one in turn, so by the
 * end the session is visible as a line of lights going back up the
 * river behind you — which is the thing the row is actually describing
 * and which has nowhere to exist in two dimensions.
 *
 * -------------------------------------------------------------------
 * THE TRAVELLED SCALAR IS THE HULL'S HEIGHT ABOVE THE WATERLINE
 * -------------------------------------------------------------------
 * Small numbers — two thirds of a metre, end to end — because the camera
 * is low and near the water, where two thirds of a metre is the
 * difference between seeing the far bank and seeing the surface. The
 * boat lifts as you fill and settles as you empty; the camera goes with
 * it; the reflection stretches and compresses under it.
 *
 * §1.6a — NO INHALE IS DEPICTED UNDERWATER — BINDS THIS CHAPTER.
 * Row 4 is on the design doc's own list of water themes. It is honoured
 * here by the SHAPE of the mapping rather than by a number tuned until
 * it clears: SURFACE is 0 and every phase of every protocol has both of
 * its height anchors strictly above it, because the boat floats and
 * there is no phase in which anything goes under. tools/regress.mjs
 * samples it anyway, every hundredth of a second, because a rule that
 * depends on somebody remembering it during a refactor is not a rule —
 * and THIS CHAPTER IS IN THAT HARNESS'S `WATER` LIST, which is the part
 * it is possible to forget.
 *
 * -------------------------------------------------------------------
 * LIGHTING A LANTERN
 * -------------------------------------------------------------------
 * Rest a finger anywhere and the nearest unlit lantern ahead of you
 * lights. That is all of it. There is no count, no total, no "lanterns
 * lit" anywhere in this file or any other, nothing is compared between
 * sessions, and a session in which you light none is a session. The
 * river carries you the same distance either way and the chapter ends
 * at the same moment.
 *
 * The ONE thing lighting changes is the light, which is the point: the
 * ambient falls across the session on a schedule nothing can touch, so
 * the later it gets the more the lanterns you lit are the only thing
 * showing you the river. That is a reason to light them that is not a
 * score.
 *
 * SILENT. No AudioContext, no media elements.
 */

import { protocol } from './breath.js';
import { corridor } from './course.js';

/* ------------------------------------------------------------------
   Heights, in metres above the waterline. Above zero is out of the water.
   ------------------------------------------------------------------ */

/** §1.6a, as a predicate, in the same terms Deep Light states it. Above
 *  zero is out of the water. Exported so tools/regress.mjs tests the
 *  same definition the chapter uses rather than its own copy of it. */
export const SURFACE = 0;

export const HULL_LOW  = 0.26;
export const HULL_HIGH = 0.94;

/** The hard walls. Both are above the waterline, which is the structural
 *  statement: there is no value the controller can reach, under any
 *  clamp, overshoot or contact, at which the boat is under water. */
export const WALL_LOW  = 0.10;
export const WALL_HIGH = 1.25;

export const CORRIDOR = corridor({
  lo: WALL_LOW, hi: WALL_HIGH, low: HULL_LOW, high: HULL_HIGH
});
export const RANGE  = CORRIDOR.range;
export const normOf = CORRIDOR.normOf;
export const liftOf = CORRIDOR.atOf;

/** No session runs past three minutes. */
export const SESSION_CAP = 180;

/** How dark it gets. The ambient light is multiplied by this at the end
 *  of the session: "the screen dims across the session and ends dark".
 *  Not to zero — a black screen is a broken app, not an ending. */
export const END_LIGHT = 0.18;

/* ------------------------------------------------------------------
   The protocols. §6 row 4: 4 / 8 going to 4 / 9.3.
   ------------------------------------------------------------------
   The row describes one session that slows partway through. The engine's
   unit is a cycle, so they are offered as two protocols and the gate
   sheet says which is which, rather than pretending a cascade is
   happening when it is not. Both are 4 in; only the exhale lengthens,
   which is the row's own shape.
   ------------------------------------------------------------------ */
export const PROTOCOLS = {
  /* 4 / 8, 5.0 a minute. 15 × 12 s = 180 s. */
  drift: protocol({
    id:'drift', name:'Drifting · 4 in / 8 out · 5 breaths a minute', cycles:15,
    phases:[
      { k:'in',  d:4, label:'breathe in',  sub:'the boat lifts',
        from:HULL_LOW, to:HULL_HIGH, cam:'lift',
        count:'breathe out in',
        scalar:p => p },
      { k:'out', d:8, label:'breathe out', sub:'let it settle',
        from:HULL_HIGH, to:HULL_LOW, cam:'settle',
        count:'breathe in in',
        scalar:p => 1 - p }
    ]
  }),

  /* 4 / 9.3, 4.51 a minute. 13 × 13.3 s = 172.9 s. */
  slower: protocol({
    id:'slower', name:'Slower · 4 in / 9.3 out · 4.5 breaths a minute', cycles:13,
    phases:[
      { k:'in',  d:4,   label:'breathe in',  sub:'the boat lifts',
        from:HULL_LOW, to:HULL_HIGH, cam:'lift',
        count:'breathe out in',
        scalar:p => p },
      { k:'out', d:9.3, label:'breathe out', sub:'let it settle',
        from:HULL_HIGH, to:HULL_LOW, cam:'settle',
        count:'breathe in in',
        scalar:p => 1 - p }
    ]
  })
};

/* ------------------------------------------------------------------
   The river
   ------------------------------------------------------------------ */

/** Metres a second the bank goes past. Slow: this is the sleepy chapter
 *  and the whole argument for it is that there is time to look at
 *  things. */
export const SPEED = 3.2;

/** How much of the strip stays behind the lens — far more than Long
 *  Air's 0.09, and that is this chapter's one real constraint showing.
 *
 *  The lanterns you light stay lit, and what you want to see is them
 *  trailing away behind you. On a wrapped strip that trail can only be
 *  as long as the tail the strip keeps: 0.28 of a 154 m period is about
 *  forty-three metres of lit river behind the boat, which at night with
 *  fog is a long way. It cannot be unbounded, and claiming otherwise in
 *  a comment would be the sort of thing nobody checks. The river also
 *  laps — you go round the strip three or four times in a session — so
 *  lanterns lit early come back round already lit, which is a better
 *  ending than a trail that vanishes. */
export const BEHIND = 0.28;

/** The strip is four breath cycles long, so the bank does not repeat
 *  every breath. */
export const STRIP_CYCLES = 4;
export const periodOf = proto => SPEED * proto.cycle * STRIP_CYCLES;

/** How many lanterns are on the water in one strip. They are spaced by
 *  an irrational-ish stride rather than evenly, so the river does not
 *  read as a row of streetlights. */
export const LANTERNS = 40;

/** Where lantern i sits in the strip: z along it, x across it. Periodic
 *  in the strip by construction, since both are functions of i/LANTERNS.
 *
 *  Lanterns are kept OFF the centre line — the boat's own lane — on both
 *  sides, so none of them is ever something you run into. There is no
 *  collision in this chapter at all; this is why there does not need to
 *  be one. */
export function lanternAt(i, period){
  const u = i / LANTERNS;
  const z = (u + ((i * 7919) % 37) / 37 * 0.012) * period;
  const side = (i % 2) ? 1 : -1;
  const across = 1.5 + ((i * 6367) % 23) / 23 * 2.6;
  return { z, x: side * across, lean: ((i * 5281) % 19) / 19 - 0.5 };
}

/** The bank's edge, left and right, as a function of z. Quantised to
 *  hard terraces. Wide enough either side of the lanterns that the
 *  reeds never sit on top of one. */
export function bankAt(z, period, side){
  const a = (z / period) * Math.PI * 2;
  const w = 6.4 + Math.sin(a * 3 + (side > 0 ? 0 : 2.1)) * 1.5
                + Math.sin(a * 7 + (side > 0 ? 1.3 : 4.0)) * 0.7;
  return side * Math.round(w / 0.5) * 0.5;
}

/** The far treeline's height over the bank. */
export function treeAt(z, period, side){
  const a = (z / period) * Math.PI * 2;
  const h = 3.4 + Math.sin(a * 5 + (side > 0 ? 0.4 : 2.9)) * 1.3
                + Math.sin(a * 13 + 1.7) * 0.6;
  return Math.max(1.2, Math.round(h / 0.6) * 0.6);
}

export const CHOICE = { drift:'drift', slower:'slower' };
export const validChoice = c => c === 'drift' || c === 'slower';
