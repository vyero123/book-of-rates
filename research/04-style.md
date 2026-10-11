# 04 - Style Reference: the "Samurai Jack idiom" as a design language

Purpose: document the visual idiom (not any character, frame or episode) so an illustrator/engineer can work in it with original artwork for BookofRates.

Evidence legend used throughout:
- **[SOURCED]** stated by a named source (see References).
- **[DERIVED]** my own synthesis from the sourced principles plus general art-history knowledge. No source gave hex values or shape recipes; every hex code in this file is DERIVED and is a starting suggestion, not a measurement of the show.

Scope guard: nothing here describes how to draw specific characters or reproduce specific frames. Figures are discussed only as generic "simplified human silhouette" design.

---

## 1. Scott Wills and the background-painting approach

### Who and how he joined [SOURCED]
- Scott Wills was a DreamWorks feature background painter (The Road to El Dorado). Tartakovsky was looking for "someone extraordinary" to supervise backgrounds (per *Makin' Toons*, via Animation Obsessive). Wills: "no one leaves features to go to TV - it's unheard of." He took it because Tartakovsky promised the show would change styles and locations frequently ("no rules"; Sloan Science & Film interview).
- Tartakovsky: "It really came together when Scott Wills came aboard. 'Cause when Scott started to paint, all of a sudden, we had lighting, we had mood and atmosphere."
- Wills later reunited with Tartakovsky as art director on *Primal* (2019-), where he paints all environments, colours the characters and "puts effects, colour and light together".

### Team split [SOURCED]
- **Dan Krall** (co-art director) drew the black-and-white background *layouts* on paper, deliberately "flat, sort of a surreal look", often ignoring perspective and bringing it back only for certain shots. Wills: backgrounds "freely switched between realism and pure design."
- **Wills, Jenny Gase-Baker, Bill Wray, Nadia Vurbenova-Mouri** (and others, e.g. Richard Daskas) painted **colour keys**. Wills picked which shots needed a key by going through the storyboard with Tartakovsky.
- The **majority of final backgrounds were painted at Rough Draft Korea** from those keys.

### Influences (stated by Wills / Tartakovsky) [SOURCED]
- Wills "tried to blend Hanna-Barbera with Japanese prints and posters."
- His goal: "combine everything that's good about realistic painting and feature painting, and everything that's good about UPA-type stylization" - "cinematic lighting, with mood and depth, but at the same time have it feel stylized."
- Wills named **Charley Harper** the supreme influence: "when I feel like I've done a painting that's very Samurai Jack, the way I want it, it's mostly Harper's kind of feeling." (Harper = "minimal realism": subjects reduced to hard-edged flat geometric shapes, depth by overlap and colour/size relationships, not modelling.)
- Tartakovsky: 1950s Disney artwork, UPA, Golden Books, Toei's *The Little Prince and the Eight-Headed Dragon* (1963) as the main reference for the lineless look; Lawrence of Arabia / Doctor Zhivago / Kurosawa / Miyazaki for treating landscape as a "character". Animation Obsessive also notes distant-hill rendering close to *The Adventures of Prince Achmed*.
- Series rule recalled by Tartakovsky: **"no green grass, no blue sky."**

### Actual media and texture [SOURCED]
- Physical media for keys and demo finals. Krall and the painters worked in physical media; Wills considered it "softer, more textured and more alive than digital at that time."
- Wills's painting tutorials (filmed for the Korean team) show **Cel Vinyl paint (acrylic-vinyl), an Iwata airbrush (used for painting and for wetting the page), a hair dryer and a paper towel to lift/dab texture** - "the all-important texture."
- Production BG size: ~11 x 13 in ("12 field"). Colour keys ~4.5 x 6 in. Rough "comps" ~2 x 4 in. Averages ~30 keys per 22-min episode, some episodes 50+. Episode 4 ("The Woolies"): 41 keys, 7 comps, 4 finals in about 3 weeks.
- Backgrounds were **scanned and composited digitally**; Wills scanned and colour-corrected every key himself (colleagues nicknamed him "The Wizard"; he worked inside a black curtain to block ambient light). Overseas finals were colour-corrected "to match the key" by selecting colours individually.
- Wills also works in Photoshop and sometimes mixes acrylic and digital (Lines and Colors). His blog: animationbgs.blogspot.com.

### The texture quality (dry-brush, gouache-like grain) [DERIVED from sourced media]
The medium (acrylic-vinyl, airbrush-wetted paper, towel-lifted) explains the look: large flat shapes with a **slightly mottled, uneven density**, soft airbrushed edges *only where intended* (skies, glows) and crisp cut edges elsewhere, plus dabbed/dry-brushed granulation where a paper towel lifted paint. Gouache-like = matte, opaque, no gloss, no transparency stacking. For web: matte flat fills + low-frequency mottling + occasional dry-brush edge breakup (Section 8).

### The key production lesson for a designer [SOURCED]
Wills: outlines "are very helpful in keeping everything 'reading' over the background, remove them and you've got problems. The thicker the line the more fool proof the read." Because Jack's cast had **no outline whatsoever**, colour relationships between background keys and character "colour models" had to be locked. Krall: if a sky patch ends up flesh-toned, "Jack's nose disappears against the sky." **Design implication: if your foreground objects are lineless, you must police value/hue separation from the background the way a colour stylist would.**

---

## 2. The signature move: lineless backgrounds vs. clean-edged figures

[SOURCED] Wills's team "took advantage of new technology at the time to remove the thick black lines usually drawn around cartoon characters"; characters are "made up of only colours and shapes." Tartakovsky compared the look to Sleeping Beauty and Golden Books. [DERIVED] Clarification for your use: the *backgrounds* are painted shapes with no ink contour (as in all painted BGs); the *figures* are crisp-edged flat-colour cut shapes with hard, clean silhouettes. Contrast comes from edge quality and rendering mode, not from a line/no-line split alone.

### Why the contrast works [DERIVED]
1. **Two rendering regimes = automatic figure/ground.** Background = painterly, grainy, atmospheric, lit. Figure = clean, flat, graphic. The eye separates them by *texture and edge sharpness* before it checks colour.
2. **Painterly fields stay quiet** because they contain no contour lines competing with the action; large simple shapes are the "negative space" the figure sits in.
3. **Silhouette-first reading.** With no interior lines, a form must read as a shape. That forces designers to push angularity, asymmetry and strong outer profiles.

### How form is read without line [DERIVED]
- **Value steps:** 2-4 discrete values per object (light plane / mid / shadow shape / accent). No smooth modelling.
- **Hue shifts:** lit side warm, shadow side cooler (or vice versa for cold light). The shift carries volume as much as the value drop.
- **Hard-edged cast/core shadow shapes** drawn as their own polygons, with crisp terminators that echo the object's geometry.
- **Silhouette against a lighter/different-hue zone behind it.** Place dark masses against bright sky bands; light masses against dark.
- **Overlap order** (Harper-style): nearer shapes overlap farther ones; depth from layer order + band colour, not perspective grids.

---
## 3. Colour

### What the sources actually say [SOURCED]
- "Bold and unexpected colours - basically not realistic; any time I have a realistic solution, that's not good for Genndy" (Wills, on the Jack/Primal collaboration). Even on grounded *Primal*, Tartakovsky "always wants some crazy colour statement that shocks you" (green blood is the cited example).
- Series rule: no green grass, no blue sky.
- Colour is planned as **colour keys per shot, with a "match to" list** so adjacent shots share a palette - i.e. palette is *per scene/sequence*, not per frame.
- Season-5 reviews describe frequent **black/white colour splits** (hard two-value sequences) as a recurring device.
- Reviewer shorthand for the influence mix: UPA flat style, Mary Blair colour palette, Eyvind Earle backgrounds, Kurosawa, Frank Miller.

**Honest gap:** no interview or art-book text I could retrieve states hex values or per-environment palettes. Everything below is DERIVED: my reading of the idiom plus the sourced rules (limited palette per scene, non-naturalistic hue, shadows as hue shifts, high-chroma skies, lineless separation).

### Principles [DERIVED]
1. **One dominant hue family per scene** (60-70% of area), one contrasting accent (5-10%), everything else is value steps of those.
2. **Sky is the loudest colour in the frame** and is chosen first. Ground and objects are answers to the sky.
3. **Shadows are a different hue, not darker local colour.** Warm light -> violet/blue-teal shadow. Cold light -> warm magenta-brown shadow. Never multiply with black.
4. **Atmospheric perspective = discrete bands**: each farther layer is lighter, less saturated, shifted toward the sky hue. Steps, not gradient.
5. **Keep the figure's hue/value out of the local background band** (the Krall "nose disappears" rule).
6. **Reserve a "hot" accent** (vermilion, signal yellow) for the one thing the eye should land on.

### Starter palettes (all hex DERIVED; tune on screen)
Each: sky / far / mid / near / shadow / accent. Bokashi sky = top -> horizon pair.

**Desert / wasteland (heat)**
- Sky top `#E8553A` -> horizon `#F6B04A` (or flipped to a bleached `#F4D58D` for heat haze)
- Far dunes/mesas `#E9946A`; mid `#C9623F`; near `#8E3B2E`
- Shadow `#5B2A4A` (plum, not brown); accent `#2FA39A` (teal oasis / cloth)
- Haze band: `#F7D9A8` at ~60% opacity between layers.

**Forest / bamboo (day)**
- Sky `#F2E6A0` -> `#BFE3B4` (pale lime-gold, not blue)
- Far trunks `#9FC79B`; mid `#4F9A7A`; near canopy mass `#1F4E4A`
- Shadow `#173A44` (deep teal); light shafts `#F7F0B8`; accent `#E4572E`.

**Forest / bamboo (dusk/dark)**
- Sky `#3B2F6B` -> `#E0704F`; mass silhouettes `#1A1633`; rim light `#F0A15A`.

**Night**
- Sky `#14183F` -> `#2C3E8C`; moon/light `#F3EBC3`
- Far land `#2A2F73`; mid `#1B1F55`; near `#0D0F2B`
- Shadow is *bluer/violeter*, never black; accent `#46D6C8` (cold teal glow) or `#FF5A6E`.

**Rain / storm**
- Sky `#4C5D73` -> `#8DA1B0` (slate-to-pale), or an unnatural `#5B4B7A` -> `#B7C0D8` for a more Jack-like storm
- Rain streaks `#DCE6EE` @ 60-80%; land `#2F3E4D`; accent flash `#FFF2A8`.
- Lightning inversion frame: swap to `#F4F1E8` ground / `#1A1A2E` shapes (see 6.5).

**Snow**
- Sky `#C9D6F2` -> `#F2E3E8` (lavender-to-blush); snow planes `#FFFFFF` / `#DDE6FA` / `#B4C2E8`
- Shadow `#7C86C9` (periwinkle); dark mass `#2D3566`; accent `#E0584A`.

**Sunset / graphic silhouette**
- Sky bands (hard or bokashi): `#2B1B4E` -> `#8A2B6B` -> `#E8473C` -> `#F7A93B` -> `#FBE08A`
- Silhouette layers: `#2A1840`, `#1A0F2E`, `#0C0716` (stepping darker toward viewer); sun disc `#FFF1B5`.

**Interiors (temple/hall)**
- Walls `#7A3E3A` / `#A5594A`; light pool `#F3C77A`; floor `#3C2A3F`
- Shadow `#241831`; accent `#2EA6A0` (jade) or `#D9A441` (gold).

**Industrial / mechanical**
- Base `#3A4650` / `#56707A`; hot light `#FF6B35`; neon seam `#37E2D5` or `#E83E8C`
- Shadow `#14202A`; steam `#C8D4D6`; flat sheet-metal highlight `#9BB3B8`.

**Underwater**
- Surface `#9FE5D6` -> `#2F8F9D` -> `#14405F` -> `#0A1B33` (hard bands by depth)
- Light shafts `#D9FFF2` @ 25%; silhouettes `#0C2A44`; accent coral `#FF7A59`.

**Neutral working ink/paper** (UI chrome): paper `#F3EAD7`, ink `#1E1A2B`.

---

## 4. Negative space and composition

### Sourced intent [SOURCED]
- Tartakovsky wanted "a minute or two" sequences "of just establishing the environment" so you "feel the landscape" as in *Lawrence of Arabia*. Background as character.
- Krall's layouts: flat, surreal, perspective optional. The show favours long holds, wordless sequences, geometric stylisation, and Dan Krall/Wills-style freedom to switch between realism and pure design.

### Rules of thumb [DERIVED]
- **Extreme wide shot with tiny figure**: figure <= 5% of frame height; 60-80% of area is "quiet" (sky/ground bands).
- **Strong horizon, off-centre** (roughly 1/4 or 3/4 vertical, rarely 1/2). Horizon is often a hard colour change, not a line.
- **Asymmetry with counterweight**: one big mass (mesa, tree, cloud) balances one small high-contrast accent.
- **Verticals + horizontals** dominate; diagonals are saved for tension (rain, cliffs, action).
- **Frame cropping**: objects run off the edge; foreground silhouettes crop at top/bottom like ukiyo-e.
- **Triptych / split-screen**: the show uses multi-panel screens (a widescreen-era device), panels with separate palettes, hard dividers.
- **Widescreen**: compose for ~2.0:1 to 2.4:1 even in a 16:9 or mobile frame - think horizontal bands, with letterboxing as a mood device.

### Ukiyo-e comparison (Hiroshige / Hokusai) [SOURCED + DERIVED]
- **Bokashi** (printers wiping pigment off the block so colour grades) - essential to Hiroshige skies and mood: "the success of Hiroshige's designs depended largely on the skilful use of bokashi colour gradation to enhance the mood of rainfall, mist or snow" (Ashmolean/Allen Memorial sources). *Ichimonji bokashi* = a straight horizontal band of gradation at top/horizon, used in almost all Hokusai and Hiroshige landscapes.
- **Flat colour blocks with delicate detailing**; Prussian blue gave bold sky/water.
- [DERIVED] Other transferable traits: strong foreground cropping (a pole, branch, boat), high/low viewpoint extremes, stylised wave and cloud *pattern* forms (repeating curved lobes), rain as parallel straight strokes, tonal bands for distance. In web terms: a linear gradient sky constrained to a band, flat layers beneath.

---

## 5. UPA and the mid-century lineage

### UPA [SOURCED: Animation Obsessive, Bendazzi, Abraham]
- Founded in the 1940s by artists leaving Disney. John Hubley and Zack Schwartz, 1946: "We have found that the medium of animation has become a new language... We have found that line, shape, color and symbols in movement can represent the essence of an idea." Visuals drawn "from modern art and design."
- Key works: *Gerald McBoing-Boing* (1950, Oscar; flat graphic drawings, loose abstract colour, limited animation), *Rooty Toot Toot* (1951, Hubley), Mr. Magoo (from *The Ragtime Bear*, 1949; *When Magoo Flew*, 1954 Oscar), *The Tell-Tale Heart* (1953, painted surrealism), *The Jaywalker* (1956).
- Pete Docter: UPA movement "based on feelings, rather than anatomy." Tartakovsky named **Bobe Cannon** as the major influence on timing: each character has its own movement; poses held then snapped.
- Tartakovsky (LA Times): UPA films "very artistic but very character driven."
- Takeaway for static design: **abstraction over realism; shape, colour and symbol carry meaning; backgrounds suggest rather than describe.**

### Others [SOURCED where noted]
- **Eyvind Earle** (*Sleeping Beauty*, 1959): gouache BGs, medieval-tapestry/Persian-miniature/Japanese-print influence, stylised "square" trees, stacked horizontal layering [DERIVED detail]. Reviewers cite Earle in Jack.
- **Mary Blair**: saturated, flat, unexpected colour combinations [reviewer-cited].
- **Charley Harper** [SOURCED, Wills]: see Section 1.
- **Frank Miller** (*Ronin*, *300*), **Kurosawa**, **Lone Wolf and Cub**, **Lawrence of Arabia**, Ben-Hur/Spartacus-era epics [SOURCED via Wikipedia/Looper/EW citations].
- Not confirmed by my retrieved sources: Moebius, Alex Toth, spaghetti westerns. (They are commonly attributed in fan/press writing; verify before quoting in public-facing copy. Safe wording: "limited-animation era design in the Toth/UPA tradition".)

---
## 6. Shape language: construction recipes

**All recipes in this section are DERIVED** from the sourced principles (flat shapes, hard-edged value steps, bands of colour, Harper/UPA/ukiyo-e geometry). They describe a generic idiom, not any specific frame.

General rules: every object = 1 base shape + 1-2 shadow shapes + at most 1 highlight/rim shape. Straight edges and circular arcs; avoid organic wobble except in deliberate brush-breakup. Shadow shapes follow the form's geometry and are cut with hard terminators.

### 6.1 Clouds
- Build as a **stack of overlapping flat lobes**: a flat or slightly convex base line, 3-6 circular/elliptical lobes on top, largest in the middle, sized in a rhythm (big-small-medium).
- Fill lobes with one light colour. Add **one shadow shape**: the lower-right (away from light) crescent of each lobe, merged into a single underside band parallel to the base.
- No gradient inside the cloud. Gradient is allowed only in the *sky behind* (bokashi).
- Variants: (a) horizontal "streak" clouds = long thin lenses stacked in 3-5 rows, each a different tint; (b) storm cloud = same lobes but 2-3 value steps darker and a hard-edged light rim on top; (c) cloud bands with wavy ukiyo-e scalloped edge (repeating arcs).
- Cluster 1-3 clouds, never scatter 10; leave sky empty.

### 6.2 Trees and bamboo
- **Tree**: trunk = tapered quadrilateral (straight sides). Canopy = one flat mass built from 2-4 rounded or angular polygons; **no leaf detail**. Optional 2-3 negative-space "holes" showing sky. Light side = one sliver polygon; shadow = the rest in darker/cooler.
- **Pine/conifer**: stacked triangles or notched bands (flat-top layers).
- **Bamboo**: tall vertical rectangles in 3-4 depth layers; nodes = short horizontal ticks every ~1/6 height; each layer lighter and less saturated than the one before. Spacing irregular but rhythmic; some stalks cropped by the frame edge; leaves = small clusters of tapering blade shapes in a flat dark mass at the top.
- **Forest**: far layer = pale band of vertical shapes; mid = medium; near = near-silhouette dark with a single sky-colour light shaft cutting diagonally.

### 6.3 Rocks, cliffs, mountains
- Rocks: **faceted polygons** (4-7 straight edges). Split each into light plane and shadow plane with one straight terminator; optional third mid plane.
- Cliffs: vertical stack of slab polygons with slightly off-vertical edges; top plane catches sky colour; side plane in shadow hue; occasional cracks as single thin wedges (negative shapes, not lines).
- Mountains: triangles/trapezoids in 3-5 layers; **ridge shadow split** as a zigzag straight-edged polygon down the lit/dark side; snow = white polygon caps cut with the same hard terminator.
- Mesa: flat top, vertical sides, 2-band strata (horizontal colour steps).

### 6.4 Water
- **Sea/lake**: horizontal flat bands, darker at the foreground or near horizon depending on mood; each band slightly different hue.
- **Waves**: curling crest = a hooked tapered shape (like a thick comma) with a scalloped fringe of 3-5 small circles/points; trough shadow = a dark crescent under the crest; foam = pale flat polygons. Repeat the wave motif at 2-3 scales.
- **Ripples**: concentric flattened ellipses (aspect ~ 4:1) in a light tint, no stroke - filled rings or thin lens shapes.
- **Reflections**: a copy of the object shape, flipped, same silhouette but 1-2 steps lighter and broken into 3-5 horizontal slices with small offsets (no blur).
- **Waterfall**: tall vertical bands with irregular tops, white streak shapes, mist = low horizontal flat band at the base.

### 6.5 Grass, reeds, rain, lightning, wind, mist, snow
- **Grass/reeds**: sheaves of tapering blades (long thin triangles with slight curve) fanned from a common base, 5-9 per tuft, 2 colours (lit/shadow), overlapping at different heights; fill, never stroke.
- **Rain**: long parallel diagonal streaks at one angle (e.g. 70-75 degrees), tapered ends, 2 layers (near: longer, wider, opacity higher; far: shorter, thinner), a few streak "gaps" to avoid mechanical regularity. Ground splashes = tiny arcs/ellipses.
- **Lightning**: angular zig-zag polygon with 3-5 segments, 1-2 forks branching at sharp angles, thicker at top. **Flash frame**: invert or hard-swap the scene to two values (pale sky, dark shapes) for 1-3 frames; hold on silence.
- **Wind**: not drawn as lines - show via lean (grass/trees tilted same way), cloth/hair streamers as long tapered ribbons, and debris as small angled shapes in a row.
- **Fog/mist**: 2-4 flat horizontal bands of semi-opaque sky-tinted colour layered between depth planes; edges soft *only* at the top (bokashi) or fully hard; never blurry cloud.
- **Snow**: small flat circles/dots in two sizes at semi-random positions; drifts = smooth flat shapes with a single curving shadow edge; sky pale-lavender; wind-blown streaks = short diagonal dashes.

### 6.6 Distance: discrete atmospheric bands
Choose 4-6 depth planes. Each step back: lightness +8-12%, saturation -15-25%, hue rotated ~10-20 degrees toward the sky hue. Each plane is a **single flat silhouette** with its own shadow shapes only on the nearest 2 layers. Hard edges between layers; allow a thin "haze band" of sky colour at the base of each farther layer. No continuous gradient across the scene.

### 6.7 Figures (generic)
- Build the human body from **6-8 primitives**: wedge/trapezoid torso, tapered limbs, small circle/oval head, optional large simple hat or robe mass that dominates the silhouette.
- Strong **asymmetric gesture** (weight on one leg, arm out, cloth trailing). Silhouette must read in solid black.
- Interior detail minimal: one or two colour planes (clothing), one accent (sash/band). **No outline**; edges are hard and clean; skin tone must differ from adjacent background tone.
- Shadow on figure: one hard-edged shape in a cool/violet version of local colour, along the side opposite the light.

---

## 7. Mood, weather and sound

### Sourced [SOURCED]
- Tartakovsky, burnt out on dialogue after *Dexter's Laboratory* and *Powerpuff Girls*: "tell the stories visually... tell a very simple story visually." Episode 1 was so silent that Cartoon Network executives "didn't have any expression on their faces" (Mike Lazzo later: "speechless").
- Example cited: a burning-tree sequence of ~1:20 with no dialogue and no characters on screen, ending with a dissolve to a calm waterfall (an emotional beat carried by image alone).
- Limited-animation techniques (Cannon-influenced): "long, long holds and looping motions"; action is "segmented" - characters "move quickly and then abruptly pause, in a rhythm."
- Colour and light establish mood (Wills: "it's all about setting up the mood"); the show leans on two-value colour splits for high-drama sequences.
- Fan-comment evidence (treat as anecdotal, from Animation Obsessive comments): an episode built on near-black-screen soundscape and one built on only black and white shadows.

### Practical translation [DERIVED]
- **Colour alone for emotion**: pick the mood hue before anything else - rage = saturated vermilion field; grief/loneliness = desaturated violet-blue with one warm dot; calm = pale mint/blue-grey with soft horizontal bands; dread = acidic green-yellow sky over near-black shapes.
- **Heat haze**: warm horizon band, layers rendered with slight horizontal wobble (feDisplacementMap on x only), sun as a flat disc with a larger translucent halo disc.
- **Rain/storm**: slow camera locked, long holds, streak layers drifting, lightning as sudden palette inversion followed by silence.
- **Night**: colour-shifted, not darkened (violet/teal shadows), a single warm accent light.
- **Silence**: hold frames, cut on silence, smears (stretch shapes along motion for 1-2 frames), then snap to rest - for UI this maps to long eases and abrupt stops, ~0 micro-animation noise.

---

## 8. Practical translation to web (SVG + CSS)

### Architecture
- One `<svg viewBox="0 0 1600 700" preserveAspectRatio="xMidYMax slice">` (2.3:1) per scene, with `<g>` per depth plane. Move planes with CSS transforms for parallax (transform: translateX/translate3d; use `will-change: transform` sparingly).
- Rules: **fills only, no `stroke`** on scenery. Shadows are separate `<path>`s grouped with their parent. Prefer `shape-rendering="geometricPrecision"` for crisp hard edges.
- Palette as CSS custom properties per scene (`--sky-top`, `--sky-hz`, `--far`, `--mid`, `--near`, `--shadow`, `--accent`) so a scene theme swap is a class change.

### Sky: bokashi band
```svg
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="var(--sky-top)"/>
    <stop offset="0.85" stop-color="var(--sky-hz)"/>
    <stop offset="1" stop-color="var(--sky-hz)"/>
  </linearGradient>
</defs>
<rect width="1600" height="520" fill="url(#sky)"/>
```
Keep the gradient confined to the sky rect; everything below is flat.

### Painterly grain without raster assets (feTurbulence)
Mottled paint density (low-frequency) plus fine granulation (high-frequency), multiplied over a layer:
```svg
<filter id="paint" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="3" seed="7" result="mottle"/>
  <feColorMatrix in="mottle" type="matrix"
     values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0   0 0 0 .55 -.12" result="mottleA"/>
  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="grain"/>
  <feColorMatrix in="grain" type="matrix"
     values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0   0 0 0 .5 -.18" result="grainA"/>
  <feMerge result="noise"><feMergeNode in="mottleA"/><feMergeNode in="grainA"/></feMerge>
  <feComposite in="noise" in2="SourceAlpha" operator="in" result="noiseClip"/>
  <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="noiseClip"/></feMerge>
</filter>
```
- This darkens (alpha black) in blotches; for lighten+darken mottling, add a second pass with white. Apply to a **group** (`<g filter="url(#paint)">`), not each shape.
- Tune: lower `baseFrequency` -> larger mottles; raise alpha slope (.55) -> stronger paint unevenness.

### Dry-brush / rough edge
```svg
<filter id="rough" x="-5%" y="-5%" width="110%" height="110%">
  <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="11" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G"/>
</filter>
```
Use on near-ground and painterly layers only; **keep figure/UI shapes unfiltered (clean edges)** - this preserves the sourced "painted BG vs crisp character" contrast.

### Paper/tooth overlay (whole scene)
A top `<rect>` with a very low-opacity (6-10%) feTurbulence texture, `mix-blend-mode: multiply`, `pointer-events: none`.

### Hard shadow shapes
Author as `<path>` with fill `var(--shadow)`; clip to parent with `<clipPath>` when a shadow should stay inside a rock/tree shape:
```svg
<clipPath id="rockClip"><path d="M..."/></clipPath>
<path d="M..." fill="var(--mid)"/>
<g clip-path="url(#rockClip)"><path d="M..." fill="var(--shadow)"/></g>
```

### Atmospheric bands
Stack ordered `<g>` layers, each fill = interpolate(toward sky). Compute in JS from the scene palette so the system produces consistent desaturation steps:
`bandColor(i) = mix(local, skyHz, 0.12 * i)` with a small saturation reduction.

### Rain / snow / mist (cheap and flat)
- Rain: an `<g>` of `<line>`-like tapered polygons or `<rect>`s rotated ~72deg; animate `transform: translate(-40px, 120px)` over 600-900ms linear, loop; two layers at different speeds. For CSS-only, use repeating `linear-gradient` at an angle on an overlay with `background-size` animated.
- Snow: small `<circle>`s; CSS keyframes drifting; or a tiled SVG pattern with `animateTransform`.
- Mist: 2-3 semi-transparent flat `<rect>`s with `mask` gradient on top edge; slow horizontal drift of 20-60s.
- Lightning: toggle a root class that swaps CSS variables to the inverted palette for 80-120ms, then holds ~1.5s of stillness.

### Parallax
Layers translate at different rates on scroll or pointer move: `far 0.1x, mid 0.3x, near 0.6x`; sky fixed. Respect `prefers-reduced-motion` (turn motion off, keep stillness).

### Heat haze
Apply an `feDisplacementMap` with a slowly-animating `feTurbulence` `baseFrequency` (via SMIL or JS) to a thin horizontal band group only (cheap) - avoid filtering the full-canvas on mobile.

### Performance notes
- Filters on big groups can be GPU/CPU heavy on mobile; pre-render with `<foreignObject>`-free tactics: bake the filter to a static group and cache (or rasterize once to canvas).
- Keep filter regions tight; avoid animating `baseFrequency` on large areas.
- For crisp 1x/2x output, avoid blur filters on edges; use displacement sparingly.

### Palette tokens suggestion
```css
:root{
  --paper:#F3EAD7; --ink:#1E1A2B;
}
.scene-desert{--sky-top:#E8553A;--sky-hz:#F6B04A;--far:#E9946A;--mid:#C9623F;--near:#8E3B2E;--shadow:#5B2A4A;--accent:#2FA39A;}
.scene-night{--sky-top:#14183F;--sky-hz:#2C3E8C;--far:#2A2F73;--mid:#1B1F55;--near:#0D0F2B;--shadow:#080A22;--accent:#46D6C8;}
.scene-forest{--sky-top:#F2E6A0;--sky-hz:#BFE3B4;--far:#9FC79B;--mid:#4F9A7A;--near:#1F4E4A;--shadow:#173A44;--accent:#E4572E;}
.scene-snow{--sky-top:#C9D6F2;--sky-hz:#F2E3E8;--far:#DDE6FA;--mid:#B4C2E8;--near:#7C86C9;--shadow:#2D3566;--accent:#E0584A;}
.scene-storm{--sky-top:#5B4B7A;--sky-hz:#B7C0D8;--far:#6F7A99;--mid:#4A5470;--near:#2F3E4D;--shadow:#1A2230;--accent:#FFF2A8;}
.scene-sunset{--sky-top:#2B1B4E;--sky-hz:#F7A93B;--far:#8A2B6B;--mid:#2A1840;--near:#0C0716;--shadow:#0C0716;--accent:#FFF1B5;}
```

---

## 9. IP boundary

### Position [SOURCED]
- **Ideas/styles are not protected; specific expression is.** 17 U.S.C. section 102(b) excludes "any idea, procedure, process, system, method of operation, concept, principle, or discovery... regardless of the form in which it is described, explained, illustrated, or embodied." The U.S. Copyright Office's Circular 33 (rev. 03/2021, "Works Not Protected by Copyright") restates this: copyright "will extend only to the original expression in that work and not to the underlying idea," and it also lists as unprotectable the **name of a character**, general layout/format, and **familiar symbols and designs/common shapes**.
- Stephen Wolfson (Creative Commons, 2023): "style is not generally protected by copyright, and that's a good thing"; copyright doesn't cover animation style - *Avatar: The Last Airbender* shares an animation/storytelling style with anime without copying any show. He cites *Google v. Oracle* for the idea/expression line. Caveat he stresses: the line between style and expression "can be fuzzy"; some courts treat style as one ingredient of "substantial similarity" (*Steinberg v. Columbia Pictures*; *Malden Mills v. Regency Mills*), and *Williams v. Gaye* shows a defendant can still lose when a work copies protectable expression. Style similarity alone is not determinative.
- Trademark: *Dr. Seuss Enterprises v. ComicMix* (S.D. Cal., Dec. 2017): "Most courts have held there is no trademark protection for the 'style' of an artist." The court did not exclude trademark protection for *specific characters* (e.g. the Cat's hat).
- Characters: protected when distinctly delineated; generic types/archetypes (a lone swordsman, a masked villain) are building blocks (*Nichols v. Universal*, 2d Cir. 1930).

### Practical guardrails for BookofRates [DERIVED, not legal advice]
- Do: use lineless flat-colour scenery, bokashi skies, banded atmospheric perspective, hard shadow shapes, widescreen asymmetric composition, painterly grain, non-naturalistic palettes.
- Don't: reuse any character, costume, logo, title lettering, or recognisable composition/setpiece; don't trace or recreate frames; don't name the show or its characters in the app, store listing or marketing as the style source ("in the style of Samurai Jack" invites trademark/false-association complaints even if copyright doesn't bite); avoid recognisable signature props.
- Name the idiom by its lineage instead: "mid-century cartoon modern", "UPA-era painted backgrounds", "ukiyo-e-influenced", "hard-edge flat colour".
- Keep a short originality log (sketches, palette derivations) to show independent creation.
- If any specific wording matters (store listings, ads), ask counsel.

---

## 10. Core rules checklist (for the design brief)
1. Flat shapes, no strokes on scenery; figures/UI crisp and clean.
2. 2-4 values per object; shadows are a hue shift with a hard edge.
3. One dominant hue family per scene; sky chosen first; never default green/blue.
4. Depth = 4-6 discrete bands that desaturate and lighten.
5. Huge negative space; tiny figure; off-centre horizon; cropped foreground.
6. Texture lives in the background layer only (mottling, dry-brush, paper tooth).
7. Silence and holds are design elements; animate rarely and decisively.
8. Separate the figure from the ground in value/hue before anything else.

---

## References (URLs)

Primary / strongest
- Animation Obsessive, "How They Painted 'Samurai Jack'" (Nov 2021) - https://animationobsessive.substack.com/p/how-they-painted-samurai-jack
- Animation Obsessive, "The Visual World of 'Samurai Jack'" (May 2025) - https://animationobsessive.substack.com/p/the-visual-world-of-samurai-jack
- Animation Obsessive, "An Introduction to UPA" (Aug 2023) - https://animationobsessive.substack.com/p/an-introduction-to-upa
- Animation Obsessive, on *The Little Prince and the Eight-Headed Dragon* - https://animationobsessive.substack.com/p/the-anime-that-inspired-samurai-jack
- Scott Wills to Drake Brodahl, "Message from Scott Wills" (Aug 2008) - http://pumml.blogspot.com/2008/08/message-from-scott.html
- Scott Wills to Drake Brodahl, "More from Scott Wills" (Aug 2008) - http://pumml.blogspot.com/2008/08/more-from-scott-wills.html
- Sloan Science & Film, "Genndy Tartakovsky's Primal: Art Director Scott Wills" (Oct 2020) - https://scienceandfilm.org/articles/genndy-tartakovskys-primal-art-director-scott-wills/
- Lines and Colors, "Scott Wills" (2013) - https://linesandcolors.com/2013/10/04/scott-wills/
- Scott Wills's background blog - http://animationbgs.blogspot.com/
- Wills, Samurai Jack painting tutorial clip (via Animation Obsessive tweet) - https://twitter.com/ani_obsessive/status/1399692499875213313
- Other sources cited by Animation Obsessive: *Makin' Toons*; *The Best of Draw!* vols 1 and 3; *Genndy's Roundtable* and *Behind the Sword* (DVD extras); Entertainment Weekly (2002) https://ew.com/article/2002/03/01/jack-magic/ ; Dan Krall interview (The Cartoon Chronicles) https://www.youtube.com/watch?v=Qcf01gI8Chg ; Red Carpet Report interview https://www.youtube.com/watch?v=WfR4XTIb6uU
- Cartoon Modern (Amid Amidi) - https://archive.org/details/cartoonmodern

Influences
- Henry Ford Museum, "Charley Harper, Ford Motor Company and 'Minimal Realism'" - https://www.thehenryford.org/collections/explore/articles/charley-harper-ford-motor-company-and-minimal-realism
- Walt Disney Family Museum, Eyvind Earle and Sleeping Beauty - https://waltdisney.org/blog/eyvind-earle-artistic-devotion-distinction-sleeping-beauty
- Japanese Architecture and Art Net Users System (JAANUS), ichimonji bokashi - https://aisf.or.jp/~jaanus/deta/i/ichimonjibokashi.htm
- Art Institute of Chicago, Utagawa Hiroshige - https://www.artic.edu/artists/34946/utagawa-hiroshige
- Allen Memorial Art Museum, Hiroshige "Night Rain at Karasaki" - https://allenartcollection.oberlin.edu/objects/2955
- Samurai Jack overview (Wikipedia, influences list - secondary) - https://en.wikipedia.org/wiki/Samurai_Jack

IP
- U.S. Copyright Office, Circular 33, "Works Not Protected by Copyright" - https://www.copyright.gov/circs/circ33.pdf
- 17 U.S.C. 102(b) - https://www.law.cornell.edu/uscode/text/17/102
- Creative Commons (S. Wolfson), "The Complex World of Style, Copyright, and Generative AI" - https://creativecommons.org/2023/03/23/the-complex-world-of-style-copyright-and-generative-ai/
- ComicMix, summary of *Dr. Seuss Enterprises v. ComicMix* style ruling - https://comicmix.com/2017/12/08/judge-rules-that-an-illustration-style-cant-be-a-trademark/

Web technique (not fetched this session; based on standard SVG spec behaviour - verify in browser)
- MDN: feTurbulence - https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feTurbulence
- MDN: feDisplacementMap - https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feDisplacementMap

## Known gaps / confidence
- No source gave hex values or per-environment palettes for the show; all hexes are derived.
- Moebius, Alex Toth and spaghetti westerns as Tartakovsky influences were not confirmed in retrieved sources.
- Shape recipes in Section 6 are synthesis, not quotations.
- SVG filter snippets are untested here; test and tune in browser (particularly feColorMatrix alpha values).
