/* The Book of Rates — VALUE, HUE AND THE POSTERISED SHADER PRELUDE.
 *
 * Design doc §4.2 in code. The two rules that actually do the work:
 *
 *   rule 2  form comes from value and hue, not line. Two to four values
 *           per object, every shadow its own hard-edged polygon, and the
 *           shadow SHIFTS HUE rather than darkening.
 *   rule 5  depth is four to six discrete bands, never a continuous
 *           gradient.
 *
 * So the unit of colour in a chapter is not a hex value, it is a SIX-STEP
 * VALUE RAMP, and every object in the scene is painted by picking indices
 * out of it.
 *
 *   THE INDICES ARE ASSIGNED BY HAND, PER LAYER. They are never derived
 *   from distance or from a lighting calculation. That is the single most
 *   important line in this file. Deep Light's first pass computed each
 *   layer's value from its depth, which is exactly what rule 5 forbids:
 *   it produces a smooth gradient made of bands, every object reads as
 *   the same object at a different distance, and the frame goes flat.
 *   Hand-assigning lets two things at the same distance take different
 *   values because they are different things, which is what makes the
 *   picture legible.
 *
 * HUE-FAMILY SEPARATION. A ramp is one hue family. When a chapter has two
 * worlds — below and above the water in Deep Light, the gorge and the open
 * sky in Cliff Run — the second world does not get a tint of the first.
 * It gets its own family AND its value structure inverted: if world one is
 * mostly dark with a small bright window, world two is mostly bright with
 * the dark shape in it. `family()` is only a container for that decision;
 * making it is the chapter's job.
 *
 * No three.js import and no DOM: hex numbers and GLSL source strings only.
 */

/* ------------------------------------------------------------------
   The six-step ramp
   ------------------------------------------------------------------ */

/** Index 0 is the palest step, index 5 the darkest. Six is the top of the
 *  §4.2 rule-5 range; a chapter that wants four bands uses four of these
 *  and leaves two unused rather than changing the length, because the
 *  shader prelude below is written for six. */
export const PALE = 0, LIGHT = 1, MID = 2, BODY = 3, DEEP = 4, DARK = 5;

/** Wrap a chapter's ramp with a named-index reader, so scene code says
 *  `r.at(DEEP)` and a reviewer can see the hand-assignment at the call
 *  site instead of counting array positions. */
export function ramp(steps){
  if(steps.length !== 6) throw new Error('a value ramp is six steps (§4.2 rule 5)');
  return { steps, at: i => steps[i] };
}

/** One hue family: a ramp plus the named colours that sit outside it —
 *  the accent, and whatever furniture the chapter paints by name. */
export function family(steps, named){
  return { ...ramp(steps), ...named };
}

/* ------------------------------------------------------------------
   Design doc §4.3 — the per-theme palettes.
   Sky reads top-to-horizon, then the shadow colour, then the one accent.
   Derived for this project from descriptions and reference; nothing lifted.
   Nine more chapters are coming and each one starts here.
   ------------------------------------------------------------------ */
export const THEME = {
  calmDawnCoast:  { sky:[0x2B1B4E, 0x8A2B6B, 0xF7A93B], shadow:0x1A0F2E, accent:0xFDF1DC },
  groundedDesert: { sky:[0xE8553A, 0xF6B04A],           shadow:0x5B2A4A, accent:0x2FA39A },
  soothedPool:    { sky:[0x14183F, 0x2C3E8C],           shadow:0x080A22, accent:0x46D6C8 },
  settledStorm:   { sky:[0x5B4B7A, 0xB7C0D8],           shadow:0x2F3E4D, accent:0xFFF2A8 },
  focusedPlateau: { sky:[0x9FC6D8, 0xE7E2C4],           shadow:0x2A3A4A, accent:0xE4572E },
  sleepyRiver:    { sky:[0x0E1230, 0x1E2A5C],           shadow:0x060818, accent:0xC9A86A },
  energisedCliffs:{ sky:[0xF2E6A0, 0xBFE3B4],           shadow:0x173A44, accent:0xE4572E },
  alertTemple:    { sky:[0xD9E4EE, 0xF4E9D0],           shadow:0x2B2235, accent:0xC23B2E },
  composedUnder:  { sky:[0x1B6A72, 0x0A2E3C],           shadow:0x06181F, accent:0xF2E3C8 },
  arrivedAbove:   { sky:[0x2B1B4E, 0xE8473C, 0xF7A93B], shadow:0x1A0F2E, accent:0xFFE9A8 }
};

/* ------------------------------------------------------------------
   The shader prelude
   ------------------------------------------------------------------ */

/** Posterise a 0..1 scalar to n hard steps. The clamp top is 0.999, not
 *  1.0: at exactly 1.0 the floor lands on n and the last step is one
 *  pixel wide, which shows up as a bright rim on every silhouette. */
export const STEP_GLSL = `
  float posterise(float x, float n){
    return floor(clamp(x, 0.0, 0.999) * n) / (n - 1.0);
  }
`;

/* ------------------------------------------------------------------
   DESIGN DOC §4.2a — A HARD EDGE IS NOT A JAGGED EDGE
   ------------------------------------------------------------------
   The author rated the 3-D work 3/10 for detail and named the jagged
   light on the water. The obvious reading is that §4.2 rule 5 is the
   cause and has to go. It is not, and it does not.

   MEASURED FIRST, 2 November 2026, on the deployed build at DPR 1.5:
   the context reports SAMPLES 4, SAMPLE_BUFFERS 1. MSAA is not merely
   requested, it is granted. Every GEOMETRIC edge in these chapters is
   therefore already antialiased — so every jagged edge that is visible
   is a SHADER-COMPUTED edge INSIDE a triangle, which MSAA cannot reach
   by construction. That is the whole symptom in one measurement, and
   it points at exactly one fix.

   `step()` puts the boundary on whichever side of the pixel centre the
   arithmetic happened to fall. The edge is hard, and it is also a
   staircase, and it crawls when the camera moves because the staircase
   re-lands every frame. `aastep()` puts the same boundary in the same
   place and resolves it across ONE PIXEL, using the screen-space
   derivative. A one-pixel riser is not a gradient: rule 5 forbids a
   continuous ramp standing in for form, not a cleanly sampled
   boundary between two flat shapes. Scissors leave a clean line.

   WHY fwidth IS SAFE HERE. three.js dropped WebGL1 at r163 and the kit
   loads r186, so the context is always WebGL2 — where the WebGL 2.0
   spec implicitly enables OES_standard_derivatives in GLSL ES 1.00
   shaders, no #extension directive required. Verified by compiling a
   probe material on the deployed page before any of this was written,
   because a shader that silently fails to link is this project's worst
   failure mode and "it should work" is not a measurement. If it ever
   does fail, it fails LOUDLY and all at once: every shader in a
   chapter shares this prelude, so `linkReport` would report the lot
   broken rather than one layer quietly missing.

   No dependencies — include AA_GLSL first in any prelude that uses the
   AA variants below.
   ------------------------------------------------------------------ */
export const AA_GLSL = `
  /* step(), resolved across one pixel. Same edge, same place.
   *
   * The max() is not defensive clutter. fwidth() of a value that is
   * CONSTANT across a primitive — a per-object tier, a per-cell hash
   * in the interior of its cell — is exactly 0, and smoothstep(e, e, x)
   * divides by zero. The floor makes those cases degrade to the plain
   * step() they always were, instead of to a NaN that paints a black
   * or white fragment and looks like a completely different bug. */
  float aastep(float edge, float x){
    float w = max(fwidth(x) * 0.6, 1e-5);
    return smoothstep(edge - w, edge + w, x);
  }
  /* the band lo..hi, both edges resolved */
  float aaband(float x, float lo, float hi){
    return aastep(lo, x) * (1.0 - aastep(hi, x));
  }
  /* posterise(), resolved. Identical away from the risers.
   *
   * The mix() at the end is the part that is easy to leave out and
   * then spend an afternoon on: once the bands are finer than a pixel
   * — a posterised field on a surface running away to the horizon —
   * no amount of edge resolution helps, because the thing being
   * sampled is below the sampling rate. That is moire, not form. So
   * where a pixel spans more than half a step, fall back to the
   * continuous value and let the bands dissolve into it. */
  float posteriseAA(float x, float n){
    float c = clamp(x, 0.0, 0.999);
    float s = c * n;
    float w = fwidth(s);
    float i = floor(s);
    float e = clamp(w * 0.6, 0.0015, 0.5);
    float q = (i + smoothstep(1.0 - e, 1.0, s - i)) / (n - 1.0);
    return mix(q, s / (n - 1.0), clamp(w - 0.5, 0.0, 1.0));
  }
`;

/** Index into the six-step ramp from a 0..1 scalar, in the shader.
 *  Declares `uniform vec3 uRamp[6]`. */
export const RAMP_GLSL = `
  uniform vec3 uRamp[6];
  vec3 rampPick(float x){
    vec3 c = uRamp[0];
    for(int i = 1; i < 6; i++){
      c = mix(c, uRamp[i], step(float(i) / 6.0, clamp(x, 0.0, 0.999)));
    }
    return c;
  }
`;

/** THE SAME RAMP, WITH THE RISERS RESOLVED (§4.2a).
 *
 *  `rampPick` is kept verbatim so a chapter that has not been through
 *  the quality pass is bit-identical; `rampPickAA` crosses each of the
 *  five boundaries over one pixel instead of landing on the pixel grid.
 *  Away from the boundaries the two return the same colour.
 *
 *  Requires AA_GLSL. Declares `uniform vec3 uRamp[6]` exactly once —
 *  do NOT include both this and RAMP_GLSL in one shader.
 */
export const RAMP_AA_GLSL = RAMP_GLSL + `
  vec3 rampPickAA(float x){
    float s = clamp(x, 0.0, 0.999) * 6.0;
    float w = clamp(fwidth(s) * 0.6, 0.0015, 0.5);
    vec3 c = uRamp[0];
    for(int i = 1; i < 6; i++){
      c = mix(c, uRamp[i], smoothstep(float(i) - w, float(i) + w, s));
    }
    return c;
  }
`;

/** CLAMPED DEPTH FOG, and the clamp is the point.
 *
 *  Exponential distance fog, then posterised to hard bands (rule 5 applies
 *  to atmosphere too), then multiplied by a ceiling well below 1. Without
 *  the ceiling everything past the fog distance converges on the fog
 *  colour and the far layers stop being distinguishable from each other —
 *  the background becomes one flat slab and the parallax it was built for
 *  is invisible. 0.55 keeps the furthest band readable as itself.
 *
 *  Declares `uniform vec3 uFog` and `float fogAmount(float dist)`.
 */
export function fogGlsl({ near = 10.0, rate = 0.030, steps = 5.0, max = 0.55 } = {}){
  return `
  uniform vec3 uFog;
  float fogAmount(float dist){
    float f = 1.0 - exp(-max(dist - ${near.toFixed(1)}, 0.0) * ${rate.toFixed(3)});
    return floor(clamp(f, 0.0, 0.999) * ${steps.toFixed(1)}) / ${(steps - 1.0).toFixed(1)} * ${max.toFixed(2)};
  }
`;
}

/** The Deep Light / default fog, so the common case needs no arguments. */
export const FOG_GLSL = fogGlsl();

/** THE SAME FOG, WITH THE BANDS RESOLVED (§4.2a).
 *
 *  Fog bands run across the biggest, flattest surfaces in a scene — a
 *  seabed, a water plane — at a grazing angle, which is the worst case
 *  for a hard `floor()`: the riser between two fog bands lands on a
 *  different row of pixels every frame as the camera moves, and reads
 *  as a seam crawling over the floor. posteriseAA holds it still, and
 *  dissolves the banding entirely out at the distance where the bands
 *  are finer than a pixel.
 *
 *  Requires AA_GLSL. Declares `uniform vec3 uFog` — do NOT include
 *  both this and the plain fog in one shader.
 */
export function fogGlslAA({ near = 10.0, rate = 0.030, steps = 5.0, max = 0.55 } = {}){
  return `
  uniform vec3 uFog;
  float fogAmount(float dist){
    float f = 1.0 - exp(-max(dist - ${near.toFixed(1)}, 0.0) * ${rate.toFixed(3)});
    return posteriseAA(f, ${steps.toFixed(1)}) * ${max.toFixed(2)};
  }
`;
}

/** The default fog, resolved. */
export const FOG_AA_GLSL = fogGlslAA();

/* ------------------------------------------------------------------
   CAUSTICS
   ------------------------------------------------------------------
   The light a wavy surface throws on whatever is under it: a moving
   net of bright filaments, brightest where the surface happens to be
   focusing. It is the single most recognisable thing about being
   underwater and Pearl Diver did not have it at all — the seabed was
   an unlit near-black plane and the overhead surface was a soft grey
   smudge.

   HOW IT IS BUILT, and why not out of one sine. A `sin(x)+sin(y)`
   field reads as corrugated iron: you can see the two directions and
   the period is obvious within a second. This is three octaves of a
   domain-WARPED field — each octave rotates and scales the coordinate
   and then folds it through the previous octave's output — so no
   single direction or period is legible. `1 - abs(s)` is what turns
   smooth waves into filaments: the bright line is the ZERO CROSSING of
   the field, which is thin, branching and closes into cells, and is
   the shape a caustic actually has. The rotation matrix is an
   irrational-ish angle so the octaves never line up into a plaid.

   Returns 0..1. Posterise it at the call site (3 steps is the project
   value) and resolve the risers with posteriseAA, or it will alias
   worse than anything else in the frame — a caustic is high frequency
   by nature and it MOVES, which is the exact recipe for crawling.
   ------------------------------------------------------------------ */
export const CAUSTIC_GLSL = `
  float causticField(vec2 p, float t, int octaves){
    vec2 q = p;
    float a = 0.0, amp = 1.0, tot = 0.0;
    for(int i = 0; i < 3; i++){
      if(i >= octaves) break;
      q = mat2(0.8018, -0.5976, 0.5976, 0.8018) * q * 1.83 + vec2(0.0, t * 0.055);
      float s = sin(q.x + sin(q.y * 1.31 + t * 0.21))
              + sin(q.y * 0.91 - sin(q.x * 1.13 - t * 0.17));
      a   += amp * (1.0 - abs(s) * 0.5);
      tot += amp;
      amp *= 0.55;
    }
    return clamp(a / tot, 0.0, 1.0);
  }
  float caustic(vec2 p, float t){ return causticField(p, t, 3); }
`;

/** §4.2 rule 7 — texture lives in the background layer only. A cheap
 *  value-only hash, added at the very end of a fragment shader and kept
 *  off figures and UI. */
export const GRAIN_GLSL = `
  float grainAt(vec2 p){ return fract(sin(dot(floor(p), vec2(41.3, 289.1))) * 43758.5453); }
`;

/** A hard hash for chipped detail — the glitter cells on water, the
 *  speckle on rock. Cells, not noise: it must quantise. */
export const CHIP_GLSL = `
  float chipAt(vec2 cell){ return fract(sin(dot(cell, vec2(12.98, 78.23))) * 43758.5453); }
`;

/** Everything above, in one string, for a shader that wants the lot. */
export const PRELUDE = STEP_GLSL + RAMP_GLSL + FOG_GLSL + GRAIN_GLSL + CHIP_GLSL;

/** The same, for a chapter that has been through the §4.2a quality
 *  pass: AA first, then the resolved ramp and the resolved fog. Pearl
 *  Diver uses this; the chapters that have not been done yet keep
 *  PRELUDE and are bit-identical until they are. */
export const PRELUDE_AA =
  AA_GLSL + STEP_GLSL + RAMP_AA_GLSL + FOG_AA_GLSL + GRAIN_GLSL + CHIP_GLSL + CAUSTIC_GLSL;

/* ------------------------------------------------------------------
   JS-side equivalents, for anything posterised on the CPU
   ------------------------------------------------------------------ */

/** Quantise to a grid — the posterised silhouette trick used on every
 *  profile in the kit: a ridge line, a mesa top, a gorge rim. Rounding a
 *  smooth curve to a step size is what makes it read as cut paper. */
export const quant = (x, step) => Math.round(x / step) * step;

/** The same, flooring, for anything that must never exceed the curve. */
export const quantDown = (x, step) => Math.floor(x / step) * step;

export const posterise = (x, n) => Math.floor(Math.min(0.999, Math.max(0, x)) * n) / (n - 1);
