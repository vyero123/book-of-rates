# The frame-to-frame check, and why it is not in the gate

*Deep Light was renamed **Pearl Diver** and made chapter one on 31 October
2026. The page is `app/pearl-diver.html`; `window.__deepLight` still works
there as an alias. Baselines recorded under the old name are the same
chapter and the same measurements.*

A chapter was reported as "a different theme flashes in every second or
so". Nothing in `tools/check.sh` could see it and nothing was going to,
because **every individual frame was correct**. A screenshot shows a
correct frame. `renderer.info` shows the right number of draw calls.
`linkReport` shows every shader linked. The fault exists only in the
*difference between consecutive frames*.

This is the procedure that finds that class. It needs a browser, so it
cannot live in `tools/regress.mjs` — and an arithmetic proxy for it was
written, found unable to fail, and deleted rather than kept as cover
(see section 4-BETA in `regress.mjs` for that reasoning).

## What is gated instead

`regress.mjs` section 4-ALPHA bounds **how often the world puts
something across the lens**, which is arithmetic and does bind:

    gates a second = SPEED / dz  =  1 / SPACING

Note it does not depend on travel speed at all, only on how finely the
course is sampled. The instinct when something flickers is to slow the
world down; that would not help.

## The procedure

Open a chapter, clear the service worker and caches first (a stale
mixture of modules is its own cause of inconsistent rendering), force a
resize so the drawing buffer is really the viewport, then:

```js
const m = window.__longAir;              // or __pearlDiver, __bamboo, __lantern
//    (__deepLight is kept as an alias on the Pearl Diver page: the
//     chapter was renamed on 31 October and every procedure written
//     before that names the old global.)

// 1. PROVE THE INSTRUMENT BEFORE USING IT.
//    Hide everything and render: the frame must be exactly the clear
//    colour. If it is not, readPixels is not reading what was just
//    drawn and every number below is worthless. Four of my measurements
//    were wrong before I did this; it belongs first, not last.
const proof = m.probe().prove();
//    proof.withNothing must equal the chapter's clear colour
//    proof.sizedProperly must be true (a 1x1 buffer samples one pixel)

// 2. EXACTLY ONE RENDERER, ONE LOOP, ONE CANVAS.
m.solo();     // { renderers: 1, loops: 1, canvasesWithAContext: 1, ok: true }

// 3. EVERY SHADER LINKED.
m.links();    // { broken: 0, ok: true }

// 4. DRIVE THE REAL FRAME BODY AND DIFF CONSECUTIVE FRAMES.
//    Press the buttons on the cue — a meter that drives with no input
//    measures a reader who never breathes, which is not the complaint.
```

Read each frame back, reduce it to a mean RGB, and count how often the
summed-channel difference between consecutive frames exceeds 25. Ordinary
motion scores in single figures; a whole scene swapping scores in the
tens or hundreds.

### When it fires, attribute it

- Replay to the worst frame **and check the jump reproduces** before
  believing anything about its parts. A replay that has diverged reads
  zero for every layer and invites a wrong explanation.
- Render **one mesh at a time** and measure that mesh's own change
  across the frame pair. Hiding one layer at a time is confounded by
  occlusion; isolating is not.
- Beware: `begin()` re-asserts every world mesh's visibility, so hiding
  a mesh inside a function that calls it does nothing.
- Screenshots cannot compare consecutive frames here. Taking one makes
  the pane visible, real rAF fires, and the live loop advances the scene
  by a couple of tenths of a second between captures. Compare inside a
  single call, as a colour grid.

## COUNT CLUSTERS, NOT FRAMES — 31 October 2026

The single most important correction in this document. `over` counts
FRAMES in which the picture changed by more than the threshold. A reader
does not see frames, they see EVENTS, and the two differ by however many
frames an event lasts.

Same instrument, same parameters, same session:

| chapter | over-threshold frames | what they actually are |
|---|---|---|
| Pearl Diver, no holds | 28 | **6** runs, two of them 10 consecutive frames |
| Long Air, box, on cue | 12 | **12** runs of ONE frame each |

Those are opposite diagnoses recorded as nearly the same number. Pearl
Diver's are a designed transition that takes ten frames and re-tints the
whole frame continuously, counted ten times. Long Air's were genuine
single-frame pops, which is what "a different theme flashes" looks like.

`flashMeter.run()` now reports `clusters`, `clustersPerSecond`,
`longestCluster` and the `runs` themselves. **Read the cluster count. A
long cluster is a transition; a one-frame cluster is a flash.**

## Baselines

375x812, DPR 1.5, 1200 pumped frames at 1/60, first 240 discarded,
threshold 25, cluster gap 2. Measured on the deployed build,
31 October 2026, after the wrap fix below.

| chapter | drive | frames | clusters | per s | longest | worst | mean |
|---|---|---|---|---|---|---|---|
| Pearl Diver · box | — | 14 | 5 | 0.31 | 5 | 274.2 | 2.34 |
| Pearl Diver · no holds | — | 28 | 6 | 0.38 | 10 | 115.0 | 2.99 |
| Long Air · box | on cue | 5 | 5 | 0.31 | 1 | 44.4 | 1.58 |
| Long Air · box | idle | 5 | 5 | 0.31 | 1 | 81.5 | 1.86 |
| Bamboo Rain · sigh | idle | 4 | 4 | 0.25 | 1 | 260.6 | 0.86 |
| Bamboo Rain · settled | idle | 3 | 3 | 0.19 | 1 | 258.0 | 0.81 |
| Lantern Current · drift | idle | 0 | 0 | 0.00 | 0 | 0.8 | 0.08 |
| Lantern Current · slower | idle | 0 | 0 | 0.00 | 0 | 0.9 | 0.08 |

For comparison, the figures this table replaces (12 October, same
parameters, frames only): Long Air box on cue 12 / worst 135.4 / mean
1.99; Long Air idle 15 / 121.3 / 3.13; Pearl Diver box 14 / 274.4 /
2.33; no holds 28 / 115.0 / 2.99.

**Lantern Current is still the reference.** Zero events, worst under one.

## LEAD ONE, RESOLVED: Pearl Diver's 14-28 events was a unit error

The lead read: "1.75 events a second on the no-holds protocol is not
explained by one surface break per breath". It is explained by exactly
that, and the meter was the thing at fault.

What the events are, attributed by per-mesh coverage across each frame
pair:

    frames 767-777, delta 42-48 then 115, 111
      water surface plane  3025v  coverage 0.78 -> 0.68 -> 0.46 -> 0.24 -> 0.06
      underwater backdrop  1681v  coverage 0.03 -> 0.15 -> 0.26
      sky/water screen quad  4v   coverage 0.15 -> 0.29 -> 0.12

The camera descends through the water plane. `uAbove` ramps 0.94 -> 0
over ten frames across its 0.20 m band, the whole frame re-tints between
two palettes, and the surface quad sweeps off the lens. Every frame of
it is correct and the transition is the design.

Counted properly: 2 crossings per cycle (down on `out`, up on the rest
at empty), cycle 11.0 s, 16 s of measurement = 2.9 crossings, observed 6
clusters. One per crossing each way, plus the spray burst. The arithmetic
closes.

Two hypotheses killed on the way, both recorded because they looked good:

- **The three visibility thresholds** (`stacks.visible = camY > -1.1`,
  `birds > -0.6`, `shafts < 0.3`) were the obvious suspect: camY is eased,
  so it could chatter across a threshold and pop a large layer. Measured:
  **9 flips in 960 frames**, and exactly one of them coincides with an
  event — a 4-vertex mesh at renderOrder 5. Dead.
- **A discrete state change at the worst frame.** Every material uniform,
  colour and opacity in the scene was snapshotted per frame and diffed
  across the worst pair. At frame 775, the 115 frame, **nothing discrete
  changed at all**: `uAbove` was already 0 and did not move, and the only
  deltas were uCamX +0.0007, uCamY -0.025, uDepth +0.0015. A big jump with
  no state change is geometry crossing the lens, which is what it was.

Nothing to fix. Pearl Diver's real event rate is 0.31-0.38/s, in the same
range as every other chapter.

## LEAD TWO, RESOLVED AND FIXED: a triangle straddling the scroll wrap

Long Air's worst single event of 135.4, open since 12 October. The route
was the one this document already prescribed — isolate one layer across
the worst frame pair and read the colour grid — and it worked.

    per-mesh coverage across the pair     frame 947 -> 948
      ridge  1521v    0.317 -> 0.002     (stops mattering: occluded)
      rock gate 693v  0.284 -> 0.578
      cloud gate 693v 0.230 -> 0.382     (96% of the frame between them)

    the rock gate rendered ALONE, mean RGB per horizontal band
      top two thirds   delta 0, identical
      bottom third     (47,34,19) / (10,16,15) / clear (23,58,68)
                       -> a flat (128,55,23) across all of it

    straddling triangles, arithmetic on the geometry, no rendering
      frames 945, 946, 947    rock 0    cloud 0
      frame 948               rock 12   cloud 12, spread 669.4 m of a
                              672 m period

**Cause.** `scrollGlsl()` takes `mod()` of each vertex's own z. Right for
a continuous surface, wrong for a mesh of separate objects: a triangle
whose vertices fall either side of the wrap is stretched across the whole
period for as long as it straddles it. The near dissolve cannot save it,
because it discards by view depth and the smear spans every depth there
is. One event per object per period — which is why the count tracked GATE
SPACING (0.55 s -> 1.45 s roughly halved it, see the history below) and
why slowing the world down was never going to help.

**Fix.** `scrollWholeGlsl(behind)` in `js/mesh.js`. Every vertex of one
object carries that object's anchor z in `aBaseZ`, that is what wraps, and
the vertex rides at its own offset from it. No triangle can straddle,
because all three of its vertices wrap on the same frame — and the object
teleports at `s -> 0`, the far end of the period, out of sight. Everywhere
except the wrap it is arithmetically identical to `scrolled()`.

Measured after, on the deployed build: on cue 12 -> **5** events, worst
135.4 -> **44.4**, mean 1.99 -> 1.58; idle 15 -> **5**, worst 121.3 ->
81.5. `straddling` is 0 on both gates at every one of 1200 frames, and
the five remaining events are the same five the old run had at 569, 594,
657, 681 and 1093 — the fix removed exactly the straddle events and
nothing else.

**The ridge keeps the per-vertex scroll.** It is continuous terrain; its
straddling count is a CONSTANT 16 triangles at every frame, and measured
in isolation across the worst frame pair it contributes exactly 0.0. A
permanent smear behind the lens is not an event. `straddling()` reports
`anchored: false` and a constant count for it, which is the healthy
answer for a surface; a count that goes 0 -> n in one frame is a flash.

`flashMeter.straddling(mesh)` is kept because it renders nothing, so
unlike every pixel instrument here it cannot be fooled by a readback.

## Still open

- **Long Air's five remaining events**, all single-frame, four of them in
  the `out` phase at 569, 594, 657, 681, peaks 26-44. They predate the
  wrap fix and are untouched by it. Small, but they are real one-frame
  pops and the chapter's reference is zero.
- **Long Air idle has one 81.5** at frame 820 that the on-cue run does
  not. Worth isolating: an event that only appears with no input is a
  clue about the idle path, not the course.
- **Bamboo Rain's four events arrive in 45 frames** (937, 952, 965, 982)
  at 261, 131, 76, 54 — a decaying sequence, not four independent
  strikes. That is one lightning event plus its tail, and it should
  probably be counted as one. The cluster merge gap of 2 frames does not
  catch it; a gap sized to the strike's decay would.
- **Pearl Diver box's 274.2** is the waterline crossing, as designed, and
  is the largest single number in the project. It is a 5-frame cluster,
  not a pop.

## A fifth instrument failure, logged

While verifying the fix I sampled `P.coverage()` every 20 frames inside
the measurement loop. `coverage()` leaves the last render as "the scene
without that mesh", so the next readback compared a complete frame with
an incomplete one: 51 clusters, one every 20 frames, peaks to 99.9. A
perfect periodic fault, entirely mine. The straddle check renders
nothing, which is why it is the instrument to reach for first.

## The history: Long Air, what was tried

| change | on-cue events | worst |
|---|---|---|
| as reported | 23 | 78.3 |
| near dissolve of gates at the lens | 14 | 74.7 |
| accent restricted to the lip edge, not the shelf | 16 | — |
| gate spacing 0.55 s -> 1.45 s | 11 | 49.5 |
| slabs cut to a band round the opening | 19 | 89.2 | *(reverted - worse)* |
| gates wound correctly and front-face culled | 12 | 135.4 |
| **per-object wrap (`scrollWholeGlsl`)** | **5** | **44.4** |

Note in hindsight that the spacing row was the signature all along: the
event rate is one per object per period, so halving the number of objects
halved the count. It was read as "fewer big things sweeping the frame".

Eliminated by measurement, each with a number: the idle background behind
a chapter (one canvas, one context, `window.__bor` absent on a chapter
page); a stale service worker; a second render loop; the lens flying
behind a wall (0 frames of 2160 outside an opening); depth precision
(identical at near 0.1, 2.0, 5.0); the far stack (identical from 155
visible gates down to 10); forgiveness stepping (`uForgive` is 0 for
every frame of an on-cue flight).
