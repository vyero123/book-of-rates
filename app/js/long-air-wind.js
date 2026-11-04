/* Long Air — THE WIND, AS ONE FIELD IN ONE PLACE.
 *
 * WHY THIS IS A MODULE AND NOT FOUR SHADER SNIPPETS
 * ------------------------------------------------------------------
 * The detail pass this file is for adds soft moving things in several
 * layers at once: long grass combed across the plateau, seed heads and
 * down adrift in the air, wool on the underside of the cloud banks,
 * streamers on the kite's own line. The cheap way to build those is
 * four independent noise functions, one per layer, and it is the wrong
 * way for two separate reasons.
 *
 * 1. IT WOULD NOT READ AS WIND. Pearl Diver's best move was that ONE
 *    light field paints the Snell window overhead, the shafts in the
 *    column and the caustics on the floor — so the reader sees one
 *    phenomenon in three places rather than three effects. Four
 *    unrelated noises moving at four rates is the opposite: it reads as
 *    busy-ness, which is the one thing a chapter about slowing down
 *    cannot afford. There is one wind over this plateau. Everything
 *    soft is in it.
 *
 * 2. INDEPENDENT PER-ELEMENT NOISE IS UNBOUNDED CURVATURE. That is the
 *    fault the lip profile had (long-air-terrain.js, lipOffset) and it
 *    is a standing hazard in this project: a field whose roughness does
 *    not shrink as the sample spacing shrinks cannot be refined, so
 *    subdivision makes it worse rather than better. Everything here is
 *    a small sum of sines in a WORLD coordinate, so it is C-infinity by
 *    construction and anything built on it refines.
 *
 * WHAT COUPLES IT TO THE READER
 * ------------------------------------------------------------------
 * `windGust` takes `fill` — the reader's OWN breath, not the schedule.
 * Breathe in and the wind freshens; breathe out and it eases. Every
 * soft layer in the chapter moves together with it, so the plateau
 * breathes when the reader does. This is a reading of the world, never
 * a reading of the reader: there is no level of gust that is correct
 * and none that is a failure, nothing is counted, and at the bottom of
 * the range the wind is still blowing (GUST_LO is 0.34, not 0). A
 * reader who never touches the glass gets a breeze, not a dead calm —
 * §1.6b, recommended and not required.
 *
 * ONE DEFINITION OF EVERY NUMBER. The GLSL below is BUILT from the
 * constants rather than written alongside them, so there is no second
 * copy of a wavelength to drift from the first. That is the lesson of
 * the terrain, where a page that re-implemented columnsAt() had the
 * sampler measuring a 2.94 degree surface while the GPU drew a 20.00
 * degree one.
 *
 * WHY THERE IS ALMOST NO JAVASCRIPT HERE. Everything the wind drives is
 * evaluated in a shader — the grass per fragment, the motes and the
 * streamers per vertex — so no caller needs the field on the CPU and
 * there is nothing to keep in agreement. `gustOf` is the single
 * exception, because tools/temporal.mjs has to be able to difference
 * the gust in time, and it is one smoothstep built from the same two
 * constants the GLSL is.
 *
 * No three.js and no DOM: numbers and source strings only.
 */

/* ------------------------------------------------------------------
   THE CONSTANTS
   ------------------------------------------------------------------
   The two wavelengths are chosen against what a metre is worth on
   screen rather than by eye. The ridge is read between about 40 and
   120 m from the lens through a 66 degree vertical field on a 375 px
   phone, which is roughly 12 px per metre at 40 m and 4 px at 120 m.

     K1 = 0.075 /m   ->  84 m between combs. The long swell that
                         crosses the whole plateau: one or two of them
                         are in frame at a time, which is what makes
                         the wind legible as a direction rather than as
                         texture.
     K2 = 0.26  /m   ->  24 m. The short ripple, still 95 px across at
                         the near edge of the ridge and 24 px at the
                         far edge, so it never approaches the sampling
                         rate and never crawls. (Pearl Diver's glitter
                         path had to be cut off at 22 m precisely
                         because its cell DID go under a pixel; nothing
                         here does, so nothing here needs that cutoff.)

   One sine is legible as one sine inside a second, which is half of
   why Pearl Diver's water read as cheap, so the short component is
   FOLDED through the long one rather than merely added to it: its
   phase is displaced by sin of the long component's phase. The two
   never line up into a plaid and no single period is readable.

   The direction is a decision, like every other decision in this
   project: the wind crosses the course from the left-rear, so the
   combs run diagonally away from the reader rather than straight down
   the course (which would read as the course) or straight across it
   (which would read as a ladder). CROSS_ROT rotates the short
   component off the long one by about 24 degrees, which is enough to
   keep them from beating and little enough that they are plainly the
   same wind.
   ------------------------------------------------------------------ */
export const WIND = {
  DIR_X: 0.3714,          // normalised: the long comb's travel direction
  DIR_Z: 0.9285,
  CROSS_ROT: 0.42,        // radians the short component is rotated by
  K1: 0.075,              // 1/m — the long comb
  K2: 0.260,              // 1/m — the short ripple
  S1: 0.95,               // rad/s — how fast the long comb travels
  S2: 1.70,               // rad/s — the short one
  FOLD: 0.80,             // how far the long comb warps the short one
  GUST_LO: 0.34,          // the breeze that is always blowing
  GUST_HI: 1.00           // at the top of the reader's own breath
};

/** The short component's direction, derived from the long one's so the
 *  two can never be given inconsistent angles. */
const CX = WIND.DIR_X * Math.cos(WIND.CROSS_ROT) - WIND.DIR_Z * Math.sin(WIND.CROSS_ROT);
const CZ = WIND.DIR_X * Math.sin(WIND.CROSS_ROT) + WIND.DIR_Z * Math.cos(WIND.CROSS_ROT);

/** The gust, from the reader's own fill. Smoothstep rather than linear
 *  so the wind eases into and out of each turnaround instead of
 *  arriving at a constant rate — the turnarounds are where this
 *  chapter's motion lives (see the note on fill versus altitude in
 *  long-air.html) and a linear ramp makes them the dullest moment
 *  rather than the richest.
 *
 *  Smooth in `fill`, and `fill` is itself continuous, so this
 *  introduces no step anywhere. tools/temporal.mjs samples it. */
export function gustOf(fill){
  const t = Math.min(1, Math.max(0, fill));
  const s = t * t * (3 - 2 * t);
  return WIND.GUST_LO + (WIND.GUST_HI - WIND.GUST_LO) * s;
}

const f = x => x.toFixed(6);

/** The shader side. Declares nothing and depends on nothing, so it can
 *  be dropped into any prelude in the chapter.
 *
 *   windDir()            the long comb's unit direction, xz
 *   windCross()          the short ripple's, rotated off it
 *   windGust(fill)       GUST_LO..GUST_HI, the reader's breath
 *   windWave(w, t)       about -1..1, the travelling comb at a world
 *                        xz position. C-infinity in w and in t.
 *   windLay(w, t, gust)  the DISPLACEMENT a soft thing at w is pushed
 *                        by, in metres. This is the one every layer
 *                        should use, because it is what makes grass,
 *                        down, wool and a streamer agree about which
 *                        way the air is going at a place.
 */
export const WIND_GLSL = `
  vec2 windDir(){   return vec2(${f(WIND.DIR_X)}, ${f(WIND.DIR_Z)}); }
  vec2 windCross(){ return vec2(${f(CX)}, ${f(CZ)}); }

  float windGust(float fill){
    float s = clamp(fill, 0.0, 1.0);
    s = s * s * (3.0 - 2.0 * s);
    return ${f(WIND.GUST_LO)} + ${f(WIND.GUST_HI - WIND.GUST_LO)} * s;
  }

  /* The short component is FOLDED through the long one rather than
     added to it, so neither period is legible on its own. Same
     construction as the kit's caustic field and for the same reason:
     sin(x) + sin(y) reads as corrugated iron within a second. */
  float windWave(vec2 w, float t){
    float p = dot(w, windDir())   * ${f(WIND.K1)} - t * ${f(WIND.S1)};
    float q = dot(w, windCross()) * ${f(WIND.K2)} - t * ${f(WIND.S2)};
    return sin(p) * 0.62 + sin(q + sin(p) * ${f(WIND.FOLD)}) * 0.38;
  }

  /* Metres of push, along the wind, at a place. Soft things lie over
     in the direction the air is going and lie over FURTHER where the
     comb is passing, which is what a gust looks like crossing a field. */
  vec2 windLay(vec2 w, float t, float gust){
    return windDir() * (gust * (0.55 + 0.45 * windWave(w, t)));
  }
`;
