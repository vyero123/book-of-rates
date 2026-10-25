# The frame-to-frame check, and why it is not in the gate

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
const m = window.__longAir;              // or __deepLight, __bamboo, __lantern

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

## Baselines

375x812, DPR 1.5, 1200 pumped frames at 1/60, first 240 discarded,
threshold 25. Measured on the deployed build.

| chapter | drive | events / 10 s | per s | worst | mean |
|---|---|---|---|---|---|
| Long Air · box | on cue | 12 | 0.75 | 135.4 | 1.99 |
| Long Air · box | idle | 15 | 0.94 | 121.3 | 3.13 |
| Long Air · open | on cue | 16 | 1.00 | 129.0 | 2.16 |
| Deep Light · box | — | 14 | 0.88 | 274.4 | 2.33 |
| Deep Light · no holds | — | 28 | 1.75 | 115.0 | 2.99 |
| Bamboo Rain · sigh | on cue | 4 | 0.25 | 201.3 | 0.69 |
| Bamboo Rain · settled | on cue | 3 | 0.19 | 200.2 | 0.65 |
| Lantern Current · drift | on cue | 0 | 0.00 | 2.2 | 0.29 |
| Lantern Current · slower | on cue | 0 | 0.00 | 6.9 | 0.32 |

**Lantern Current is the reference.** Zero events, worst under seven.
That is what a travelling chapter looks like with nothing wrong, and it
proves the meter is not simply reporting motion.

**Bamboo Rain's worst ~200 is the lightning**, which is a deliberate
full-frame event constrained to exhales and checked as such in
`regress.mjs`. Its *rate* (0.2/s) is what matters and it is low.

**Deep Light's worst 274 is the waterline crossing**, which is also
designed — but 1.75 events a second on the no-holds protocol is not
explained by one surface break per breath, and is the clearest
outstanding lead in the project.

**Long Air is improved and not fixed.** See the history below.

## Long Air: what was tried

| change | on-cue events | worst |
|---|---|---|
| as reported | 23 | 78.3 |
| near dissolve of gates at the lens | 14 | 74.7 |
| accent restricted to the lip edge, not the shelf | 16 | — |
| gate spacing 0.55 s → 1.45 s | 11 | 49.5 |
| slabs cut to a band round the opening | 19 | 89.2 | *(reverted — worse)* |
| gates wound correctly and front-face culled | 12 | 135.4 |

Eliminated by measurement, each with a number: the idle background
behind a chapter (one canvas, one context, `window.__bor` absent on a
chapter page); a stale service worker; a second render loop; the lens
flying behind a wall (0 frames of 2160 outside an opening); depth
precision (identical at near 0.1, 2.0, 5.0); the far stack (identical
from 155 visible gates down to 10); forgiveness stepping (`uForgive` is
0 for every frame of an on-cue flight).

What held throughout: at the worst frame **only the two gate meshes
move**, every other layer scores exactly 0.0. The count has roughly
halved; the worst single event has not been solved. The next thing I
would do is isolate the rock gate alone across its worst frame pair and
read the colour grid, which is how the back-face cause was found.
