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

import { protocol, smooth, clamp01 } from './breath.js';
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

/** Where the hull sits between the two inhales.
 *
 *  DERIVED, and it has to be. The hull is carried by the kit's body with
 *  the schedule holding the control, and that integrates at ONE constant
 *  rate across the whole inhale — so the only height it can actually be
 *  at when the first sip ends is the one a constant rate reaches, which
 *  is 2.4/4.0 of the way up. Writing a prettier number here does not
 *  make the boat go there; it makes the boat lag its own schedule by a
 *  fifth of the band for the rest of the breath.
 *
 *  The first draft put it at 0.52 for a "second sip gets the larger
 *  share" effect, which is exactly that mistake. THE INCREASE IS NOT IN
 *  THE BOAT. It is in the attention: the front runs 0.46 up the arch in
 *  2.4 s and the remaining 0.54 in 1.6 s, which is nearly twice the
 *  rate, and the second object is higher, further and more tightly held.
 *  The boat rises steadily under all of that, which is what a loaded
 *  boat on slow water does. */
const SIP_SPLIT = 2.4 / 4.0;
export const HULL_MID = HULL_LOW + (HULL_HIGH - HULL_LOW) * SIP_SPLIT;

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
/* ==================================================================
   A DOUBLE BREATH NEEDS TWO THINGS TO ATTEND TO — 24 October 2026
   ==================================================================
   The chapter shipped with a single inhale and a single object of
   focus, and the author's note on it is the whole of the redesign: a
   double inhale asks you to gather attention twice, and there was only
   ever one thing there to gather it onto. The second sip had nothing to
   be a second sip OF.

   So the breath is now 2.4 + 1.6 in, long out, and there are TWO
   OBJECTS OF FOCUS with a movement and an increase between them:

     FIRST INHALE   the near lights, low, just off the water on either
                    side of the boat. Close, small, definite.
     SECOND INHALE  higher and further up the arch, and MORE of it: the
                    attention does not move sideways to a second thing
                    of the same size, it rises through the first into
                    something larger. That is the increase.
     EXHALE         all the way down to no focus at all. Not a third
                    target and not a smaller one — the light that was
                    gathered onto a point spreads out over the whole
                    river, and nothing in the frame is singled out.

   THE RATES ARE UNCHANGED, which is the constraint the redesign had to
   work inside: §6 row 4 is 5.0 a minute going to 4.5, and 2.4 + 1.6 + 8
   is 12 s is exactly 5.0, and 2.4 + 1.6 + 9.3 is 13.3 s is exactly
   4.51. The chapter gained a structure without moving the pace it is
   for.

   THE RELEASE IS IN THE SCENE, not only in the figure. "Unfocused" here
   is a real quantity the shaders read — `tight` falls to zero and the
   same light spreads from one point across everything. Conservation of
   light as attention: it is never dimmer overall during the exhale, it
   is only less gathered. A release that simply faded out would be the
   scene going away, which is the opposite of relaxing into it.
   ================================================================== */

/** Where attention is, as a phase field the engine passes through
 *  untouched. 'near' and 'far' are the two objects; 'none' is the
 *  released state and is a real place rather than the absence of one. */
export const FOCUS = { NEAR:'near', FAR:'far', NONE:'none' };

/** How far UP THE PATH the illumination has reached, 0..1, for each
 *  phase. The path is the arch (below): 0 is its feet on the water, 1
 *  is its apex. The first inhale reaches the near lights; the second
 *  carries it the rest of the way up; the exhale lets it back down.
 *
 *  These are the anchors the scene's own front springs towards, and
 *  they are here rather than in the scene so tools/regress.mjs can
 *  check the arc without a browser. */
export const REACH_NEAR = 0.46;
export const REACH_FULL = 1.00;

export const PROTOCOLS = {
  /* 2.4 + 1.6 in / 8 out. 12 s, 5.0 a minute, 15 cycles = 180 s. */
  drift: protocol({
    id:'drift', name:'Drifting · 2.4 + 1.6 in / 8 out · 5 breaths a minute', cycles:15,
    phases:[
      { k:'in',  d:2.4, label:'breathe in',  sub:'the near lights',
        from:HULL_LOW, to:HULL_MID, cam:'lift',
        focus:FOCUS.NEAR, reach:[0, REACH_NEAR],
        tight:p => 0.72 * p,
        scalar:p => p * 0.6 },
      { k:'in',  d:1.6, label:'and again',   sub:'up through them',
        from:HULL_MID, to:HULL_HIGH, cam:'rise',
        focus:FOCUS.FAR, reach:[REACH_NEAR, REACH_FULL],
        count:'breathe out in',
        // the increase: attention is TIGHTER on the second object, not
        // merely moved to it
        tight:p => 0.72 + 0.28 * p,
        scalar:p => 0.6 + 0.4 * p },
      { k:'out', d:8,   label:'breathe out', sub:'let it all go wide',
        from:HULL_HIGH, to:HULL_LOW, cam:'settle',
        focus:FOCUS.NONE, reach:[REACH_FULL, 0],
        count:'breathe in in',
        // all the way down to nothing gathered. Eased so the letting-go
        // is slow at the start and complete well before the next breath
        tight:p => 1 - smooth(clamp01(p / 0.82)),
        scalar:p => 1 - p }
    ]
  }),

  /* 2.4 + 1.6 in / 9.3 out. 13.3 s, 4.51 a minute, 13 cycles = 172.9 s. */
  slower: protocol({
    id:'slower', name:'Slower · 2.4 + 1.6 in / 9.3 out · 4.5 breaths a minute', cycles:13,
    phases:[
      { k:'in',  d:2.4, label:'breathe in',  sub:'the near lights',
        from:HULL_LOW, to:HULL_MID, cam:'lift',
        focus:FOCUS.NEAR, reach:[0, REACH_NEAR],
        tight:p => 0.72 * p,
        scalar:p => p * 0.6 },
      { k:'in',  d:1.6, label:'and again',   sub:'up through them',
        from:HULL_MID, to:HULL_HIGH, cam:'rise',
        focus:FOCUS.FAR, reach:[REACH_NEAR, REACH_FULL],
        count:'breathe out in',
        tight:p => 0.72 + 0.28 * p,
        scalar:p => 0.6 + 0.4 * p },
      { k:'out', d:9.3, label:'breathe out', sub:'let it all go wide',
        from:HULL_HIGH, to:HULL_LOW, cam:'settle',
        focus:FOCUS.NONE, reach:[REACH_FULL, 0],
        count:'breathe in in',
        tight:p => 1 - smooth(clamp01(p / 0.82)),
        scalar:p => 1 - p }
    ]
  })
};

/** The two attention scalars, read from whatever phase we are in.
 *
 *  `tight` is how gathered attention is, 0..1. `reach` is how far up the
 *  arch the illumination has got, 0..1. They are deliberately NOT the
 *  same number: reach runs up during both inhales and back down through
 *  the exhale, while tight is about whether the light is concentrated at
 *  all — so there is a moment at the top of the second inhale where
 *  reach and tight are both 1, and a long exhale where reach comes down
 *  the path while tight dissolves. Collapsing them into one scalar was
 *  the first thing tried and it made the release read as the arch simply
 *  switching off.
 */
export function attention(b, t){
  const s = b.at(t), p = s.p;
  const [r0, r1] = p.reach || [0, 0];
  return {
    focus: p.focus || FOCUS.NONE,
    reach: r0 + (r1 - r0) * (p.ease ? p.ease(s.pr) : s.pr),
    tight: clamp01(p.tight ? p.tight(s.pr) : 0)
  };
}

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

/* ==================================================================
   THE ARCH, AND WHY IT IS A FIXED STRUCTURE
   ==================================================================
   The lights are not scattered. They stand in ARCHES across the river
   at stations down its length: two feet on the water, one each side of
   the boat's own lane, rising up and outward and then back in, so the
   two halves lean towards each other high overhead. On screen that
   reads as an arch you are about to go under.

   WHICH LIGHT CAN BE LIT IS ITS DISTANCE FROM THE VIEWER, over a fixed
   length. Each light carries a baked `s` in 0..1 — its own place in the
   arch's distance ordering, 0 at the feet (nearest) and 1 at the apex
   (furthest). The illumination front is a single scalar: a light is lit
   when `s <= front`. The feet light first, and the front then rushes
   outward and upward along the arch.

   ----------------------------------------------------------------
   THE ONE THING THAT HAS TO BE RIGHT: `s` IS BAKED, NOT LIVE.
   ----------------------------------------------------------------
   `s` is computed once, from a canonical viewpoint at the station's own
   approach — not from where the boat happens to be. That is the whole
   trick, and getting it wrong is the obvious failure:

   If the ordering were recomputed from the live camera every frame,
   then moving forward would REORDER the arch underneath its own
   illumination. An arch you lit from forty metres back would silently
   re-sort as you came level with it, and the dimming on the exhale
   would run along a different path from the one the lighting ran up.
   The reader would see lights going out in an order that had nothing to
   do with the order they came on, which is exactly the thing that is
   supposed to be legible here.

   Baked, the opposite happens, and it is the point of the whole
   mechanic: THE FRONT RETREATS ALONG A PATH FIXED IN THE WORLD WHILE
   THE BOAT TRAVELS FORWARD THROUGH IT. During the exhale you are not
   watching an arch fade in front of you — you are passing under one
   while it goes out over your head, from the apex back down to the feet
   you are drawing level with.

   It also buys the predictive property the other chapters have (§5.1):
   the arch ahead of you already knows its own order, so what you can
   see coming is the shape the next breath will light.
   ================================================================== */

/** Lights per arch, per side. Each arch has 2*ARCH_LIGHTS of them. */
export const ARCH_LIGHTS = 7;

/** How far apart the arches stand, in metres of river. */
export const ARCH_SPACING = 11.0;

/** The arch's geometry, in metres. FOOT_X is clear of the boat's lane
 *  on both sides, so nothing in this chapter is ever something you run
 *  into — there is no collision here and this is why there does not
 *  need to be one. */
export const FOOT_X   = 2.1;    // half-width at the water
export const BELLY_X  = 5.4;    // widest point, around halfway up
export const APEX_X   = 1.45;   // the two halves lean back in at the top
export const APEX_Y   = 5.2;    // how high it goes
export const ARCH_LEAN = 3.4;   // the apex sits this much further downriver

/* The bulge is DERIVED from the three widths rather than tuned, so the
   curve passes through all three exactly. The first version multiplied
   a sine by the foot-to-belly difference and subtracted a power term to
   bring it back in, which overshot: at the apex it came out at −0.65,
   so the two halves of the arch CROSSED OVER THROUGH THE BOAT'S LANE
   and the top of the arch was inside out. It looks like an arch in a
   side view and is wrong from the one place anybody is standing.
   tools/regress.mjs caught it as two lights in the lane. */
const ARCH_BULGE = BELLY_X - (FOOT_X + APEX_X) / 2;

/** One light's place on one half of an arch, at parameter a in 0..1
 *  running foot (0) to apex (1). Returns metres, relative to the
 *  station's own z.
 *
 *  The curve goes OUT and then back IN as it rises, which is what makes
 *  it an arch rather than a pair of poles, and it leans away downriver
 *  so that height and distance increase together — that is what lets a
 *  single distance ordering read as "upward and outward" on screen.
 */
export function archPoint(a, side){
  // a straight foot-to-apex taper, pushed out by a sine that is zero at
  // BOTH ends — so the curve hits FOOT_X, BELLY_X and APEX_X exactly and
  // cannot wander past any of them
  const x = side * (FOOT_X + (APEX_X - FOOT_X) * a + ARCH_BULGE * Math.sin(a * Math.PI));
  const y = SURFACE + APEX_Y * Math.sin(a * Math.PI * 0.5);
  const z = -ARCH_LEAN * a * a;
  return { x, y, z };
}

/** Build one arch's lights, each with its baked distance order `s`.
 *
 *  `eye` is the canonical viewpoint: the boat's own seat, at the
 *  station's approach distance. Fixed, so the ordering is a property of
 *  the arch and not of where anybody is standing.
 */
export const EYE_BACK = 16.0;   // how far back the canonical eye sits
export const EYE_Y    = HULL_LOW + 1.42;

export function archLights(){
  const out = [];
  let dMin = Infinity, dMax = -Infinity;
  for(const side of [-1, 1]){
    for(let i = 0; i < ARCH_LIGHTS; i++){
      const a = i / (ARCH_LIGHTS - 1);
      const p = archPoint(a, side);
      /* The eye sits BEHIND the station at +EYE_BACK and the river runs
         towards −z, so a point further downriver has a more negative z
         and is FURTHER AWAY: the separation is EYE_BACK − p.z, not
         p.z + EYE_BACK. Written the wrong way round first, which put
         the apex NEARER than the feet and inverted the whole ordering —
         the arch would have lit from the top down. */
      const dx = p.x, dy = p.y - EYE_Y, dz = EYE_BACK - p.z;
      const d = Math.sqrt(dx*dx + dy*dy + dz*dz);
      if(d < dMin) dMin = d;
      if(d > dMax) dMax = d;
      out.push({ side, a, x:p.x, y:p.y, z:p.z, d });
    }
  }
  /* Normalise the distances to 0..1 — "at a fixed length" is this: the
     span from the nearest light to the furthest is the same length for
     every arch, so one scalar drives all of them and an arch cannot
     light in a different order from its neighbour. */
  const span = Math.max(1e-6, dMax - dMin);
  for(const L of out) L.s = (L.d - dMin) / span;
  out.sort((p, q) => p.s - q.s);
  return out;
}

/** Is this light lit, given a front? A plain threshold on the baked
 *  order, with a short lip so a light comes up over about a tenth of
 *  the path rather than snapping. */
export const litAmount = (s, front) =>
  clamp01((front - s) / 0.10);

/** How many arches fit in one strip period. Rounded, because a fraction
 *  of an arch at the wrap is a visible jolt once a lap. */
export const archCount = period => Math.max(1, Math.round(period / ARCH_SPACING));

/** Where arch k stands along the strip. */
export const archZ = (k, period) => (k / archCount(period)) * period;

/** How many lanterns float on the water between the arches. These are
 *  scenery and are not part of the mechanic — they are what makes the
 *  river a river rather than a corridor of installations. */
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
