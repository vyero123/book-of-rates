# Working notes — The Book of Rates

## Audio verification: stop it and close the tab in the same step

**Audio played in the browser pane comes out of the user's actual speakers, in their actual
room.** They can hear it, and they may not be able to tell where it is coming from. On
11 October I verified the loop sketches through the analyser and left the page playing, and
the user had to come and ask what the noise was.

The rule, for any step that makes sound:

1. Verify in as few seconds as possible.
2. In the **same** tool call or the one immediately after, stop playback: call the page's own
   stop, then `ctx.suspend()` and `ctx.close()` on any AudioContext, and pause any
   `<audio>`/`<video>` elements.
3. Close the tab with `tabs_close`, and confirm with `tabs_context` that nothing is left open.
4. Never end a turn with an audio tab open. Treat it like leaving an appliance switched on in
   someone's house.

Same logic applies to anything else that keeps running after attention moves on: long-lived
tabs, animations with sound, background timers, media autoplay.

## I cannot hear the audio, and the meter is not a quality judgement

Two separate lessons from 11 October, both learned the hard way.

1. **A level reading says a signal exists and how big it is. It says nothing
   about whether it sounds good.** "All four produce sound and match at -7 dBFS"
   is not evidence of quality. It was treated as such, the result was shipped,
   and the user said it sounded terrible. Build pages that let the user solo,
   mute and re-level each layer so they can say *which* element is wrong —
   that is the only real instrument available here.
2. **Byte time-domain silence is 128, not 0.** A failed `getByteTimeDomainData`
   leaves a zero-filled buffer, which computes as full scale and is
   indistinguishable from clipping. Always sanity-check the mean before
   trusting a level. Half an hour went into chasing a runaway that was partly
   this artefact.

Corollaries: measure upstream of the master gain while muted, so diagnosis is
silent. Prefer structures that cannot diverge (no audio feedback loops) over
structures that need a limiter to stay safe. And distrust any node that reports
impossible values rather than building on top of it.

## Never push without the gate

`sh tools/check.sh .` syntax-checks every ES module and every inline
`<script>` block, and scans the index for a credential. It exits non-zero
on failure. It MUST be the first link in the push chain:

    sh tools/check.sh . && git commit -q -m "..." && GIT_ASKPASS=... git push

On 11 October a broken `scenes.js` went live because the check ran as
`node --check && echo OK` on one line and the commit ran on the next, so
the check gated nothing. A check that is not in the same `&&` chain as the
push is decoration.

## My own test code is the most common source of false alarms

Four times on 11-12 October I reported a bug that was my instrument, not
the app:

1. Byte time-domain silence is 128, not 0 — a failed analyser read
   computes as full-scale clipping.
2. Reading `transport.nextBeat` AFTER `stop()` reports 0, because stop
   resets it. "No beats scheduled" was a measurement artefact.
3. A one-shot canvas draw verified by screenshot looks blank, because
   taking the screenshot fires a resize which reallocates and clears the
   canvas. Drive a loop, don't draw once.
4. Netlify rewrites `../archive.html` to `/archive`, so a
   `querySelector('a[href="../archive.html"]')` finds nothing on a page
   where the link is present and working.

Before reporting a fault, check the measurement can detect a known-good
case. Prove the instrument, then trust it.

## Deployment can hide a fix

The service worker was cache-first and served a MIXTURE of old and new
modules after a deploy — concretely observed: `pageturn.js` on the network
and in the cache both had a method the running page did not. It is now
network-first for HTML and JS, with a one-shot reload on
`controllerchange`. When a fix seems not to have landed, check what the
page is actually running before changing the code again.

## Do not use curl or wget for web content

Web fetching goes through the provided tools. I used `curl` once to check
a deployed file; that was wrong even for our own site. Verify from inside
the page with `fetch`, or use the browser tools.

## The gate only covers what it checks

12 October, in one session, three things got past a passing gate:

1. **A missing export.** `journey.html` imported `resumeAudio` from
   `audio.js`, which did not export it. Every file parsed cleanly, the gate
   said OK, and the journey page failed to load entirely in production.
   Syntax validity is not module validity. `tools/imports.py` now resolves
   every named import against the target's real exports.
2. **A shell line that lied.** `check && commit && push` on one line with
   `echo pushed` on the next printed success for a push the gate had
   correctly refused. Use `tools/push.sh`: it stages, gates, commits,
   pushes, and then compares the local head against the remote before
   claiming anything.
3. **An abandoned restore.** A "prove the gate catches a break" test broke
   a file, and `set -e` aborted the script before the restore line ran, so
   the deliberate breakage was committed. Restore in a trap, or verify the
   file afterwards.

And the fault underneath all of it: `requireGate(() => begin())` called
its own callback when the gate had already been passed, so `begin()`
re-entered itself until the stack overflowed. The scene still drew from
the idle loop, so it looked exactly like a stuck breath. A render loop
that keeps running can disguise a control path that is completely dead —
when something looks frozen, check whether the thing driving it ever ran.

## No inhale is ever depicted underwater

Design doc **§1.6a**, added by the user on 23 October 2026. A standing protocol rule, not a
note on any one level, and it binds every water-set theme including the ones not yet built.

> In any water theme the inhale happens above the surface and nowhere else. A figure may
> descend, rest, reach, exhale or travel while submerged. A figure may not breathe in while
> submerged, at any depth, for any part of the phase.

The reason is reflex: the user's own diaphragm follows the picture, so an inhale cued over a
submerged body is a rehearsal of inhaling underwater. Note that this is **not** in tension
with §1.6's disclosure-not-gatekeeping principle — §1.6 is about *practices*, which the app
cannot see; this is about *depiction*, which is entirely the app's doing. Disclosure is not
available as a defence, because the user does not read the picture, they breathe along with it.

Practical consequences, learned doing the Deep Light remap:

- **The mapping yields to the rule, never the other way round.** If a protocol's structure
  cannot get the figure back to the surface before the inhale starts, it does not get a
  descent — it gets a shallower one or none. Deep Light's no-holds protocol lost the seabed.
- An ascent that finishes *during* the inhale is a violation, not a near-miss.
- Do not satisfy it with a number tuned until it just clears the line. Satisfy it with the
  shape of the mapping: hold the inhale stationary at the surface.
- It is **checked mechanically** by `tools/regress.mjs`, which samples every protocol of
  every water chapter and fails the build on any inhale sample at or below the waterline. New
  water chapters must be added to its `WATER` list or they are not covered. The pre-rule
  mapping is kept in `tools/fixtures` as the negative control, so the check is known to be
  able to fail.

## Long Air detail pass — 3 November 2026

The open items recorded here on the first pass are all closed. For the record, and because
one of them resolved by DELETION rather than by decision:

- **The sun's azimuth problem evaporated with the disc.** The drawn sun contradicted the
  forward shadow (a shadow thrown down the course means a light behind the reader) and was
  flagged for the user to choose between. The user's verdict on the disc was that it read as
  a cameo, so it is gone: `sp` is a light POSITION now, the cloud lobes are lit on the face
  turned towards it and drift through it, and a three-step warm wash carries the glow. With
  nothing in frame asserting a direction there is nothing left to contradict, so the
  forward shadow stands unopposed. A resolved question does not stay on the list.
- **The brief's triangle figure (41,696) is stale.** Measured on the deployed build at
  375x812: 74,720 triangles / 12 draw calls before this pass, 75,852 / 15 after.
- **Standing principle this pass is built on:** detail goes in the FRAGMENT stage by
  default, because new geometry is new knots and every knot has to hold the chapter's 1 px
  angular bar through its own lens. The three things that did add geometry were chosen so
  the bar is cheap to hold: billboards (no interior knot at all) and one silhouette profile
  that lives in `long-air-terrain.js` so `continuity.mjs` measures what the GPU draws.

## Long Air — 6 November 2026

The 4 November note here said the inside of a cloud was unresolved and that the honest fix
was a blend rather than another cell size. That was taken: the cloud half of the gate
material is transparent and both of its dissolves are alpha. The dither is gone. The note
is replaced rather than left standing.

Two things worth keeping from this pass:

- **The pixel bar is the bar; the world-degree bar measures segment length.** The cloud lip
  could not have visible bulges while it was held to 4 world degrees across 1 m columns —
  that allows an eleven-centimetre bulge at eight metres across, and 4 degrees on a short
  segment is 0.11 px at the range a gate is read at. Moving it to the projected sagitta
  bought 41.5 degrees of world turn at 0.93 px. Anything new that shows as an EDGE should be
  projected, not measured in world degrees: the ridge, the trees, the dove, the cloud lip,
  the cloud crown and the buttress flank all are.
- **A quintic smootherstep is only a smootherstep on [0,1].** `cloudLip` extrapolated it
  when the columns were widened past the opening and returned four hundred metres. The
  sampler caught it and was explained away once before it was believed. Clamp the parameter
  at the point of use, not at the call site.

**Cost is now the thing to watch.** 74,720 triangles / 12 draw calls at the start of the
3 November pass; 91,694 / 16 now, a 23% rise, on a chapter the reader reported at 58–60 fps.
That has NOT been measured on their phone — the sandbox bench runs on a desktop GPU and says
nothing useful about it. If the chapter has gone soft, the first places to look are
CLOUD_LIP_COLS (121) and BUTT_COLS (61), both of which are knobs with the arithmetic for
what they buy written next to them in `long-air-terrain.js`.

## Long Air — 6 November 2026, the triangle budget opened

The reader reported 60 fps strong and said not to be stingy with triangles. Three things
to carry forward.

**Subdivision is still the wrong answer for the gates, and now for a STRUCTURAL reason
rather than a cost one.** The cost argument (half-metre rows, ~400,000 triangles) is no
longer the point. The real reason is that the gate lip must be a HARD EDGE: it is the
thing the reader aims at, §4.2 says a hard edge is legitimate, and a C2 terrain surface
cannot have one by construction. Folding the gate into the ground would either lose the
aimable edge or keep it as a crease that fails the continuity bar by design. The collision
model is also 1-D — a horizontal lip at `centre - half` — and a terrain-blended gate would
have a lip varying with x that the 1-D model cannot represent. Do not reopen this on cost.

**Where the triangles DID go:** `BUTT_COLS` 67 → 85 and `CLOUD_COLS` 45 → 101, both bought
to hold the 2 px bar after a shape change, both with the arithmetic beside them. The
pattern worth keeping: change the shape for the look, measure, then buy the bar back with
columns rather than compromising the shape.

**Cost, measured on the deployed build at 375x812:** 92,486 triangles / 16 draw calls at
the start of this pass, **117,806 / 16** now. That is where I would start being nervous —
not because of this number, but because the next structural change will want another 20%
and nothing has been measured on the reader's own phone. `CLOUD_N` (16) is the one knob
that changes how much sky is covered; `CLOUD_COLS` and `BUTT_COLS` are the two that cost
the most and buy only smoothness.

**The ground's texture is done, in TWO layers, and the split is the lesson.** The note
that asked for "a finer octave of relief" was half an answer: the sail's weave and the
cloud's wool — the two things the reader named as reading like materials — are SHADING,
not geometry. So the mesh got the mid scale (`reliefAt`, 10–30 m, folded so no direction
is legible, paid for with rows) and the fragment stage got the fine scale (2 m and 0.7 m,
dissolving out past 90 m). Geometry buys the silhouette and the way light falls across a
slope; it does not buy grain. The mesh samples ~2.3 m, so anything under about 9 m of
wavelength aliases and belongs in the shader by arithmetic rather than by preference.

**Two instruments were wrong and the new octave exposed both.** The seam check used
one-sided differences and was measuring its own truncation error — it failed a field that
is exactly periodic by construction; centred differences read 6e-15. And the world-degree
proxy assumes a FIXED column spacing, so when ROW_SPACING went 2.6 → 2.3 it condemned a
surface the projected measurement passes at 0.89 px. Sweeps that have a projected
counterpart now report and do not gate; the cloud ceiling and the far mesas have none and
keep theirs.

**Measure three settings before spending on subdivision.** 169/2.0 is 112,896 ridge
triangles at 0.70 px; 153/2.3 is 88,768 at 0.89; 145/2.5 is 77,472 at 0.99. The middle one
ships: it holds the 1 px line (below which a vertex cannot be seen to BE a vertex) on both
axes, and the 24,000 triangles the finest setting buys go into a difference nobody can
see. "Not too stingy" is not a licence to waste.

**Cost: 140,526 triangles / 16 draw calls** on the deployed build at 375x812, from 117,806
at the start of this pass. Still not measured on the reader's phone. The knobs, largest
first: `COLS`/`ROW_SPACING` (the ridge, ~89k of it), `CLOUD_COLS` (101), `BUTT_COLS` (85),
`CLOUD_N` (16, the only one that changes how much sky is covered).

## The Shepherd, and what Lantern Current's failure taught — 6 November 2026

**Lantern Current is a failed concept, not a rough one, and the number says so.** The
reader's verdict was "I don't get its motion", which is literally accurate: its breath
drives a 0.68 m hull lift over 4 s, and against the nearest thing that moves with it that
is **2.4 degrees a second** of angular rate. Long Air is 88. Nothing survives that gap —
it is three orders of nothing. The deeper fault is that its camera RIDES the thing the
breath moves, so the motion cancels out; and its spatial relationship, travel along a
path, is Long Air's with a different skin. My recommendation is that it is replaced rather
than rebuilt, and that its slot goes to a new idea. **Not deleted in this pass** — removing
a chapter is a content decision.

**The Shepherd exists because of that diagnosis.** Its lens is PARKED at the foot of the
path, so the figure recedes and returns: the breath's motion is displacement across the
frame and a change of size, neither of which a following camera can show. Build anything
new against this question first — *what does the breath move, and what is it moving
RELATIVE TO* — because a chapter can pass every gate in this repo and still be the one
nobody understands.

**Three faults in the new chapter that the harnesses found, not me:**

- **A binary control cannot express a hold.** Hold-to-climb, release-to-descend has two
  states; box breathing has three. `regress.mjs` measured 20.89 m of error on a 22 m band
  — very nearly the whole hill, on the protocol the chapter offers first. It is Long Air's
  pursuit now: a finger sets a place and a hold is leaving it there. **Any chapter offering
  a protocol with holds needs a three-state control**, and the cheapest check for it is to
  fly the cue perfectly in the harness and look at the error.
- **A classifier that cannot reach the defect reports a clean surface.** `groundAt` used
  `Math.abs(o)`, a slope kink straight down the path — the one line the camera always
  points at. The sweep ran 0 upward and never crossed zero. Sweep THROUGH the symmetry
  axis, always.
- **58 draw calls.** Every limb of every animal was its own Mesh. `js/mesh.js` opens by
  saying why that is wrong and this was the first chapter with a flock in it. One merged
  mesh with per-animal uniform arrays: 5 calls. Bake normals with the INVERSE scale when
  primitives are stretched non-uniformly, or the lit side is silently wrong.

**Cost:** 70,718 triangles / 5 draw calls at 375x812. Hill resolution measured at three
settings (161/193/225 columns → 2.14/1.51/1.10 px) and 193 shipped; rows left at 132
because the same instrument reads 0.14 px along the path, where the hill runs away from
the lens. Measure the two axes separately — that is why they are different numbers.

## HUMAN-LED MOTION — the reader sets the rate

Design doc **§1.7**, added by the user on 12 November 2026, as a universal design principle
for the project and "the tenet for a variety of rates". A standing constraint on everything
built from here, and the biggest one in this file.

> Human-led motion — for example, starting with stillness and having the person initiate the
> sequence rather than be subject to it. **They set the rate, not us.** We create the
> boundaries that motivate them to move to particular rates, but we do not hinder their
> ability to express their own rates. Instead we adapt to their rates in order to find
> synchronicity where their motion can align with our general patterns, through the principle
> of **superstructures**.
>
> Superstructures: rates harmoniously superimposed onto smaller, more erratic structures in
> order to normalise or stabilise them closer to a particular rhythm **without causing them
> to vanish**.
>
> A 4-4-4-4 glider should be able to become a **0.5-0.5** motion. Speeding up the same glider
> 8× would not be nice — **simplify the imagery** as though in a panicked state: periphery
> fuzzy and less detailed at higher speeds, centre locked and steady. The offering for a
> slower pace should be there **in the environment**, not as a 4-4-4-4 but maybe just a
> fraction off the 2s, inviting you to slowly extend your rate.

Where it sits: §1.6 governs who may begin (disclosure, not gatekeeping). §1.6b governs what
may be required once they have (the rhythm is an invitation). **§1.7 governs who leads**, and
it is the one that bites, because a forgiving app-owned clock satisfies §1.6b and still fails
this. §1.6a is untouched — but a reader-led inhale can arrive at any instant, so "no inhale
underwater" becomes a property the scene must hold CONTINUOUSLY, not at known phase times.

**This is a change to the kit's spine, not a chapter tweak, and must be treated as one.**
`breath.js` is `f(t)`: same `t`, same answer. Under §1.7 a phase ends when the reader ends
it, so `at/value/cue/progress` all lose that property. The protocol becomes a target rather
than a schedule of durations. And `regress.mjs`'s whole guarantee structure — including
"on-pace play never touches a surface", which is explicitly a promise about a reader
conforming to OUR rate — depends on flying one deterministic session; it has to become
properties over a family of reader behaviours, pathological ones included. Full cost
accounting at design doc §1.7a. Do not start that rebuild without the author's say-so.

## Cost: the recorded numbers were stale, and the axis was the wrong one — 12 November 2026

Measured on the deployed build at 375x812 (buffer 562x1218, MSAA 4 granted, DPR_CAP 1.5),
on an AMD Radeon 780M via ANGLE — a laptop iGPU, so read the caveat below before using any
of it.

    The Shepherd      145,470 tri /  5 calls   <- this file said 81,920. Wrong by 78%.
    Long Air          140,454 tri / 14 calls   <- agrees with the 3 Nov figure
    Pearl Diver        46,912 tri / 17 calls   <- never recorded anywhere before
    Bamboo Rain         3,388 tri / 13 calls   <- never recorded anywhere before
    The Murmuration     1,122 tri /  2 calls   <- agrees

**THE BENCH IS NOT TRUSTWORTHY AND HERE IS THE NUMBER.** Eight consecutive `bench(60)` runs
on one page, same scene, same buffer, inside sixty seconds: 0.100 0.085 0.100 0.057 0.062
0.098 0.192 0.077 ms. **3.4x spread on identical work.** Use medians of eight or do not
quote a time. A resolution-scaling test was attempted and could not be run — changing the
emulated viewport did not propagate to the drawing buffer — and is reported as not-run
rather than worked around.

**THE TRIANGLE BUDGET IS NOT THE BINDING CONSTRAINT, AND SEVERAL PASSES HAVE BEEN WORRYING
ABOUT THE WRONG AXIS.** Medians of eight at comparable buffer sizes: Long Air 140,454
triangles at 0.083 ms over 786k px; Bamboo Rain 3,388 triangles at ~0.090 ms over 685k px.
**Forty-one times the geometry, the same frame time.** Cost tracks PIXELS, not primitives.
The Shepherd carries more geometry than Long Air in five draw calls and costs less. So:
subdivision is cheap and buying columns was right for a reason nobody stated; the expensive
axis is per-fragment arithmetic on the surfaces that FILL THE FRAME. The largest single
identifiable waste is `rampPickAA` — 5 unrolled smoothsteps plus a fwidth to choose between
six colours, called three times on the ridge, which is about half that shader's whole
smoothstep budget. Only one of the five risers is ever near the fragment's value.

**What is still unmeasured is the only thing that matters.** Instantaneous margin on a
desktop iGPU says nothing about a phone over a five-minute session, where THERMAL is the
constraint and a chapter that runs at 60 fps for thirty seconds and 40 at four minutes fails
exactly when the breathing is working. Every chapter already exposes `__chapter.bench()`;
surfacing a median frame time behind an Options toggle and asking the reader to read it off
their own phone at the start and end of a session is the only way to get the number.

Full working, and the two other questions it came from, in `docs/2026-11-12-analysis.md`.

## The hard idiom rules are withdrawn; light is allowed — 12 November 2026

Design doc **§4.2b**, on the author's instruction, the same day as §1.7. §4.2's seven rules
and §4.2a's "does not license" list are no longer constraints. The author's reason is the one
to keep: **"having rules that aren't attached to purpose means the rules lose meaning with
iterations."** So the look is restated as seven PURPOSES, each with a test: reads at a glance
(squint), designed value structure (desaturate), few hues with the mood in the air (name the
colour in one word), depth you can feel (cover the figure), every visible edge a decision,
ONE structure (does anything disagree about where the light is), original work (§4.1, not
withdrawn). **Light models; the palette designs.**

Permitted now: a lighting model, normals everywhere, a light vector, shadow maps, gradients,
specular, translucency, textures, any number of values. Not touched: §1.6a, §1.6b, §1.7, §2,
§4.1. **The old chapters are not being converted** unless asked.

I recommended AGAINST this in the morning (analysis §2.6) and was overruled; §5.1 of
`docs/2026-11-12-analysis.md` says where the recommendation was wrong. Short version: I
treated hand-assigned value as something lighting would destroy, when lighting only takes
over the modelling and leaves the design where it was.

## The kit grew a spine and a light — 12 November 2026

- **`js/lead.js`** — `leader()` measures the reader's rhythm from one 0..1 scalar by
  HYSTERETIC TURNING POINTS, never a derivative; `superstructure()` is a coupled oscillator
  that prefers to be 8% slower and, locked, stands asin(detune/K) behind the reader. Pure
  arithmetic. The reader's phase is taken from POSITION between their last two extremes,
  not from time — a reader who pauses half way up is half way up, not advancing.
- **`js/light.js`** — one sun, hemisphere ambient, a shadow rig (REGISTERED casters, FIXED
  frustum, normal-offset bias), `noiseTexture`, `gradeTexture`, and the periphery for §1.7.
  The periphery DROPS TERMS and never dissolves a surface. **Texture fetches stay OUTSIDE
  branches** (a fetch needs derivatives; inside a per-fragment branch they are undefined and
  the result is a mip seam along the edge of the branch); the branches skip sines.
- **`js/solid.js`** — icospheres with shared vertices; normals from the triangles AS THEY END
  UP. A displaced `SphereGeometry` opens along its seam.
- **`rampPickAA` is one riser now**, not five, and is proved equal to the loop. If the clamp
  on `w` is ever raised past 0.5 the equivalence breaks; the harness has that as its negative
  control.
- **`tools/lead.mjs`** is in the gate (4e). **`tools/dryrun.mjs`** is not: it runs a page's
  real module against real three with the renderer stubbed and compiles every shader with
  glslang. Needs `npm i three@0.186.1 @webgpu/glslang` in a scratch directory.
  Two instrument faults met while building it: the glslang module object is a thenable that
  resolves to ITSELF, so `await` on it never returns (use `.then`, delete `.then`, resolve);
  and `require.resolve('three')` lands on the CJS build, whose namespace has no named exports.

## THE PUSH IS REFUSED BY THE SANDBOX, TWICE NOW — 12 November 2026

Two consecutive sessions have had `git push` refused by the environment, after the gate
passed: *"only git clone, git fetch and plain downloads from GitHub work here, not git push,
other uploads or Git LFS."* HTTP 403. `git clone` and `git fetch` DO work, so the diff half
of `push.sh` is fine and the verification half is what fails.

**This is not worked around.** No curl, no wget, no alternative host. `docs/HOW-TO-PUSH.md`
has the commands for the author to run on their own machine, and
`docs/PENDING-COMMIT-MESSAGE.txt` is the message.

### THE MOUNT'S `.git` HAS NEVER FETCHED, AND THAT BROKE THE HAND ROUTE

The author ran the hand sequence and **git rejected the push, correctly.** The diagnosis is
worth more than the incident:

**`.git` in this folder was cloned at `fe25379` and has not fetched since — it is ~180
commits behind `origin/main`.** Everything from the Shepherd's progress rebuild onwards is
missing from its history, though the *files* on disk are current, because sessions write
files here directly. So a hand commit lands with `fe25379` as its parent and pushing it is a
non-fast-forward that would discard four months of history.

**`push.sh` HIDES THIS, and that is structural rather than accidental.** It rsyncs the
working files into a clone it makes itself and never reads the mount's `.git` except to
lift the remote URL out of `.git/config` as a text file. That is exactly what makes a push
verifiable — and it is why nobody has noticed for months. **Checking that the mount's FILES
match the remote does not check that its GIT METADATA does**, and I made precisely that
error: I diffed against a fresh clone, found the files right, and handed over a sequence
that depended on something I had not looked at.

The fix, which also cures the staleness permanently, is `git fetch origin` then
`git reset --mixed origin/main` — index and HEAD move, **no file on disk is touched** — and
only then `git checkout -- 04-breath-loops.html` (that file is tracked at the root, is not
in this working copy, and `git add -A` would otherwise commit its deletion as a side
effect; the restore has to come after the reset or the index does not know the file).

**And the sequence was TESTED this time, not reasoned about.** A sandbox clone was put in
the mount's exact state, the author's commands were replayed to reproduce the rejection, then
the fix was run: parent `413909d`, a true fast-forward, tree identical to the mount, gate
passing. Prove the instrument, then hand it over — the same rule this file already states
about measurement applies to instructions given to the author.

**Until that push lands, nothing from 12 November is deployed and nothing can be looked at.**
The whole of the Free Dive, `lead.js`, `light.js`, `solid.js`, the one-riser ramp and Pearl
Diver's water change are in the working copy only. Diff against a fresh clone before trusting
any of it: verified on 12 November as 16 files, +2971/-13, gate passing.

## LEVEL OF EFFORT FOR THE §1.7 / §4.2b CONVERSION — 12 November 2026

Asked for by the author before any conversion starts. Full working in
`docs/2026-11-12-loe.md`. **It is not a batch job: ~11–15 sessions, one at a time.**

The four things worth carrying even if that file is never read again:

1. **Reader-led is the cheap half.** Long Air, the Shepherd and the Murmuration already read
   an identical continuous `reachAt`. And for the two travelling chapters the reader's rate
   can enter as FORWARD SPEED against a world whose period is fixed in *distance* — so
   `superstructure().period` drives speed and the baked geometry survives untouched. That is
   also §1.7's "the offering is in the environment", for free: the gates arrive 8% late.
2. **Lit is the dear half, and normals are why.** `terrainY` interpolates Long Air's
   cross-section with a quintic ease that has ZERO SLOPE AT EVERY KNOT. Correct unlit —
   it cannot overshoot. Under a light every column is a rib. Fixing it changes the
   silhouette and reopens the sagitta bar and the column budget.
3. **Lighting re-opens every continuity bar in the repo.** The Shepherd note already says an
   unlit surface hides its own facets and that what shows a row boundary is the ground-sky
   EDGE. Those bars were derived against a silhouette criterion; a shading criterion is a
   different number. Per chapter, as each converts.
4. **The anti-aliasing leftovers mostly dissolve** — hard risers are what needed AA and
   §4.2b permits gradients — but **lighting Long Air FORCES the `scrollGlsl` fix**, because
   its stretched quad is currently masked only by a cross-section that barely varies along z.

Recommended first: **the Murmuration with its roost**, because it is the only chapter broken
by its own diagnosis, has no terrain to disturb, and is the cheapest honest test of whether
the superstructure is LEGIBLE — the one question the whole of §1.7 rests on. Long Air last.
**Pearl Diver: recommend not converting at all** — the Free Dive is already the reader-led lit
water chapter and was built beside it so the two could be compared.

## The Free Dive has been looked at — 12 November 2026, late

`app/free-dive.html`: the first reader-led chapter and the first lit one. A new chapter
beside Pearl Diver, not a replacement. No schedule: she goes where the finger is, the pearl
takes four seconds at the oyster and is kept if she leaves, nothing is counted. Silent.

Looked at LOCALLY, on the author's machine, at 375x812, before any push. Not yet on a phone.

**IT DREW NOTHING, AND SO DID THE MURMURATION, FOR THE SAME REASON.** Neither page ever
called `loop.start()`. `clock()` restarts on `visibilitychange`, and the inspection pane hides
and shows between tool calls, so every session that ever measured the Murmuration started
its loop by accident. Opened and left visible — a phone — it is a flat sky and the cue. That
was live when the reader said "just doesn't work"; the legibility diagnosis may still be
right, but it was made about a chapter the reader may never have seen move. The dry run
missed it because it PUMPS. The tell is the one this file already gives: frames firing (62 a
second) with the chapter's own clock stuck at 0. Both fixed. Every other clock chapter had it.

**What was seen:** all 28 materials link; exposure reads (teal water, lit sand, caustics);
the dive, the rest at the oyster, the carry with the pearl held up and the release all pose
correctly — no sign errors; 77,626 triangles / 28 draw calls, as predicted offline.

**Three things looking found, fixed the same night:**

- **The shadow was a staircase.** One nearest-filtered comparison per tap, on sand where a
  texel is a dozen pixels. Each tap now blends four COMPARISONS (never depths) by position,
  and the map is 2048. In `js/light.js`, so every later lit chapter inherits it.
- **A front kelp blade stood in front of the oyster.** Front blades are PLACED now
  (`FRONT_X`), in the gaps between the sites, because the lens centres on a site exactly when
  she is at it. The random x is still drawn so the back forest keeps its layout.
- **At the surface she had no head.** Her head is above the waterline and the surface hid
  it — the one moment §1.6a is about, shown as a torso. The surface now draws first and
  writes no depth (from below, everything else is in front of it), and rings run out from
  where she breaks it, scaled by the same `inhaleAt` that gates everything else.

**STILL OPEN: is the superstructure legible?** Held still, the light is clearly brighter at
one end of the world's cycle than the other, and kelp and rock hold still as a reference, so
it passes the test the Murmuration failed. But idle it is a 20-second swell of brightness,
and from stills it may read as cloud passing rather than as the water answering. Needs the
author's eyes, in motion. Also open: the meter on the reader's phone at 0 and at 5 minutes.

**Instrument notes.** While the pane is hidden, rAF does not fire (drive with `pump`) and a
screenshot can come back as a magnified top-left crop of the frame. `toDataURL` in the same
task as a `pump`, shown in an `<img>`, gets the whole frame. And the gate needs two things on
this Windows machine: a real `python3` on PATH (the default is the Store stub) and
`PYTHONUTF8=1`.

## Other standing constraints for this project

- **One session at a time in this folder. `push.sh` rsyncs the ENTIRE mount.**
  On 3 November two sessions worked the folder at once. The other one pushed its own
  chapter and, because the assembly step mirrors the whole working copy into the clone,
  commit `6df1556` ("Pearl Diver: the pearl opens into a dove…") also carried a *mid-flight*
  snapshot of this session's Long Air work: `follow.js`, `long-air-lens.js`,
  `tools/temporal.mjs`, 255 lines of `long-air.html` and the `course.js` change. It passed
  the gate at that instant and deployed, so unverified half-work shipped under a commit
  message that does not mention it — and the next gate run failed on four checks belonging
  to a session that had not asked for a push. The reverse also happened: a correct
  `resetDove()` fix sat unpushable for an hour because the gate was blocked on the other
  session's files.
  There is no per-file staging to retreat to; the mirror is deliberate and load-bearing
  (it is what makes a push verifiable). So the rule is at the session level:
  **never have two sessions writing this folder.** If a second one is needed, give it its
  own clone outside the mount. And after any concurrent episode, do not assume the remote
  reflects only what you intended — diff the mount against a fresh clone before continuing,
  and re-verify anything that shipped without you.
- **Never run git inside the mounted folder.** Clone to `/tmp`, assemble there, push with an
  askpass helper. Writes to the mounted folder are fine; git operations are not.
  Note that `tools/check.sh` is a git operation in part — its credential scan reads the
  index — so run it in the clone, never in the mount. `push.sh` already does this; running
  the gate by hand in the mount is the slip to avoid.
- **`token.txt` is a live PAT at the repo root.** It is in `.gitignore`. Never echo it, never
  put it on a command line, never commit it. Before every push, scan the index for the
  fine-grained-PAT prefix — build the pattern at runtime rather than writing it literally in
  a tracked file, e.g. `git grep --cached -lE "github""_pat_"`. Writing the literal prefix
  into a committed file makes the scan match that file forever and quietly useless.
  Verified clean: history contains no token blob.
- **Mobile-first, 375 px.** The user is on an iPhone.
- **Render it and look at it.** Nothing visual is "done" until it has been screenshotted and
  inspected. No headless browser is available in the sandbox (Chromium download is blocked),
  so the route is: push → Netlify → view at `book-of-rates.netlify.app`.
- **Two evidence standards** (design doc §3.1): breathing-to-body claims keep full evidence
  discipline; the music and art layers are design decisions and are not apologised for.
- **No existing recordings, compositions, characters or frames.** Original work in an idiom
  only. See design doc §3.7 and §4.1.

## The Shepherd makes progress — 7 November 2026

The chapter oscillated on a fixed path; the reader asked for progress, over the hill and
on to the next. It is a better chapter now, and the rebuild taught four things.

**A mapping can be right and the picture still empty, and only looking tells you.** Two
faults survived every harness in this repo:

1. The lens was 22 m behind him and the hills are 18 m long, so there was a CREST between
   the camera and the shepherd. He was not in frame at all. Sightline clearance over the
   ground is measured now, at twelve points around a hill.
2. A side view of a line of figures needs the line to FIT. A portrait phone gives 31
   degrees across; the first lens put the shepherd past the left edge and the last sheep
   seventeen hundred pixels past that. The FLOCK was re-derived against the frame — 4.5 s
   of memory instead of 10 — rather than the frame being bent around the flock.

**Angular rate is the right test for a lens pointed ALONG the motion. Across it, the
number is the fraction of the frame travelled.** The Shepherd's lens is abeam, so its
5.9 deg/s abeam figure means nothing on its own; what the reader reads is that he crosses
the whole picture in 5.4 seconds, 18% of the width a second. Quote both or neither.

**One-sided lags only.** The gait lags accelerations and not decelerations. Lagged both
ways it OVERSHOOTS the place it is walking to, and this chapter cannot walk back, so the
overshoot lands past the crest, the "next occurrence" target moves a whole hill on, and he
chases it for ever: 2.94 hills a breath instead of one. Any controller whose target is a
"next occurrence" has this shape. Keep v <= the rate rule at every instant, by
construction rather than by a clamp.

**A rate proportional to the distance remaining crawls the last stretch — and the last
stretch of a climb is the flat bit at the top.** He was at 70% of the hill when the inhale
ended and spent half the hold still walking. A dead zone just moves the fault to a figure
stopping dead from walking pace. Saturating (v = vmax * e^2/(e^2+E0^2)) is zero at zero
error WITH ZERO SLOPE and near the cap everywhere else.

**An unlit surface hides its own facets, and the sagitta sweep should say so.** The hill is
flat-shaded from fields of (d, o) with no normal in it, so an interior knot has nothing to
reveal it; what shows a row boundary is the edge where the ground meets the SKY. That edge
is FOUND per column, not assumed — with a low lens it is four metres away for some columns
and a hundred for others. The interior sweeps are still gated: a mesh that passes without
needing the argument is worth more than the argument.

**Cost: 81,920 triangles / 5 draw calls**, DOWN from 125,440 at the start of the staging
pass, because moving the lens out bought more across than it cost along. The two axes are
nothing like each other here — 0.338 m rows against 1.688 m columns — and the table of what
each setting buys is beside them in `shepherd.html`.

**The lens constants are on the inspection hook** (`__shepherd.cam({...})`). Staging cannot
be measured, only looked at, and a push per guess is how an afternoon goes into a camera.
The module's constants are the source of truth and seed it.

## Lantern Current was withdrawn — 7 November 2026

Removed from the book, on the reader's instruction and my recommendation. Not deleted
quietly: `app/lantern-current.html` is a forwarding stub to the contents, `archive.html`
carries it as a withdrawn chapter with the reason on its card, and `js/lantern-breath.js`
is a tombstone (`rm` is refused on this mount). Out of `index.html`'s contents, out of
`sw.js`'s shell list — cache bumped to `bor-v19` — and out of `regress.mjs` entirely,
including its `WATER` entry, its arch-cadence check and the whole of section 5b.

**THE DIAGNOSIS IS KEPT, because it is the test every new chapter now takes first.** Its
breath drove a 0.68 m hull lift over four seconds; against the nearest thing that moved
with it, that is **2.4 degrees a second**. Long Air is 88. The deeper faults were that its
camera RODE the thing the breath moved, so the motion cancelled out, and that its spatial
relationship — travel along a path — was Long Air's with a different skin.

So, before building anything: *what does the breath move, and what is it moving RELATIVE
TO?* Then put a number on it, and remember the Shepherd's correction — angular rate is the
right test for a lens pointed ALONG the motion; across it, the number is the fraction of
the frame travelled.

## The Murmuration — 7 November 2026

Built into Lantern Current's slot. The breath drives the flock's SHAPE: gather and lift on
the inhale, open and settle on the exhale. Nothing travels, which is the one spatial
relationship this book did not have and the opposite of the one that failed.

**I QUOTED A NUMBER BEFORE BUILDING IT AND THE NUMBER WAS WRONG.** "19 degrees a second of
silhouette motion" was a flock's angular radius going from 38 to 19 degrees — an EXTENT,
quoted as a RATE. Over a four-second inhale it is 4.5. Nor can staging fix it: the angular
radius of a ball at range D changes at about (dR/dt)/D, so 19 deg/s needs tens of metres a
second of radius change and a breath does not contain that. Check the units of a proposal's
headline number before committing to the proposal.

**MEASURED ON THE DEPLOYED BUILD at 375x812, flown on the cue:**

    flock drawn width      237% of frame spread -> 77% gathered
    contraction rate       30.8% of frame width a second
    a bird on screen       222 px/s peak = 27.4% of frame height a second
    the drawn lower edge   98 px/s = 12.1% a second
    churn                  41.2 -> 102.4 deg/s  (constant airspeed, x2.5)
    density                x15.3 birds per cubic metre
    cost                   1,122 triangles / 2 draw calls, 63 fps

For comparison the Shepherd ships at 18% of frame width a second and Lantern managed
2.4 deg/s. **Quote both kinds of number or neither** — the angular figures are in the
module beside the frame fractions.

**THE FLOCK IS A BROAD SHALLOW SHEET, AND IT TOOK TWO WRONG SHAPES TO GET THERE.** A
squashed ball at 28 m subtends 70 degrees; the phone is PORTRAIT, so the frame is 62 tall
and only 31 across, and it ran off both sides and read as birds everywhere. A tall column
was worse and the reason is the one to keep: **the lens points up at 72 degrees, so the
camera's screen-up is nearly world -x and the column's long axis runs down the view
direction.** A column seen end-on is a blob. The paper calculation measured the angle an
axis subtends IN SPACE, and at this elevation that lands in DEPTH. What a steeply upward
lens sees face-on is a horizontal sheet.

**PUSHING THE LENS BACK WAS THE TEMPTING FIX AND IT IS A TRAP.** Fitting a 20 m ball into
31 degrees needs 80 m of range; the near edge goes to 60 m, a bird crosses at 10 deg/s
instead of 52. That hands back everything the staging was for in order to satisfy a
condition about the staging. Change the shape, not the distance — and `regress.mjs` now
refuses a near edge over 16 m so a quiet drift cannot happen without a gate failing.

**SIX INSTRUMENT FAULTS IN ONE CHAPTER, none of them in the chapter.** Projecting two AXES
instead of the surface (cannot see foreshortening — this is the one that cost a whole
shape); dividing by `size.H`, which is 0 when the page is measured with its pane hidden, and
returning a confident zero; converting NDC y to degrees by multiplying by the field of view
(NDC is linear in the TANGENT of the angle); measuring before the loop had placed the
camera, so `project()` returned NaN, which `toFixed` turns into "NaN" and JSON into null;
tracking a point on the flock's underside, which at this elevation moves almost entirely in
depth; and flying an unsteered reader at SELF_WALK and calling it cue-perfect. The drawn
figures are in PIXELS and PERCENT OF FRAME now, which need no conversion, and the box
sampler is proved against a 5 m sphere versus the optics (212 px against 232) before any of
its numbers are believed.

**AND THERE IS NO CONTROL LOOP IN THE FLOCK.** Five hundred birds converging on a target is
five hundred things proportional to a remaining error — the shape that cost the Shepherd its
mapping twice. Every bird's position is a FUNCTION of `gather`, evaluated in the vertex
shader from a bird index and four shared uniforms. One integrator in the chapter (the kit's
body spring) and one accumulator (the orbit angle, which must be integrated rather than
recomputed, because omega depends on the radius and a shared phase that jumped when the
flock changed shape would tear the pattern apart once a breath).

**A SKY BEHIND NOTHING IS THE CASE §4.2 BREAKS ON.** Six posterised steps are six SLABS
across 812 px, their edges read as horizons, and they cut through the flock; the three giant
arcs that looked like sand dunes were the warm wash's own contours at three steps. Sixteen
and eight now. The idiom is about edges that mean something — a sky's do not.

**Derive tolerances, don't widen them.** The mashing-reader check failed at 1e-9 because two
sprung integrations differ by their rounding. The bar is one DRAWN PIXEL: the whole band is
worth 482 px of flock width at 375x812, so one pixel is 1/482 of it.

## The scroll puts a sheet through the scene — 7 November 2026

The reader: *"flooded in the valleys with some kind of overlapping pane of grass."*

**`js/mesh.js`'s `scrollGlsl()` takes `mod` of EACH VERTEX's own z, and that is NOT safe
for a continuous surface.** mesh.js says it is, and says the hazard is only for separate
objects. The thing that note missed is that a surface's rows are JOINED: a chain mapped
onto a ring has to be cut somewhere, so every frame exactly ONE row of quads has its two
ends on opposite sides of the wrap and is stretched across the whole period. The objects
case loses one object; the surface case GAINS A SHEET — 216 m of flat ribbon at roughly
ground height, spanning the view, with the hillside rising through it. There is no fixing
it inside a vertex shader: it is one primitive out of 55,000 and a vertex shader cannot
see primitives.

**The fix is not to wrap.** Make the strip longer than the view by one terrain period and
TRANSLATE the whole mesh by `distance mod TERRAIN_PERIOD`. The reset is invisible because
the ground repeats on exactly that period. A row's world distance is then fixed at bake
time and nothing moves between the vertices of a quad, so the fault cannot come back by a
number being changed. The price: every field in the surface must close on the (now short)
terrain period, and the strip costs the extra length — the Shepherd went 82k → 125k
triangles.

**`tools/continuity.mjs` now measures it:** "no stretched quad" compares the worst gap
between consecutive drawn rows against the nominal spacing.

**LONG AIR'S RIDGE STILL USES `scrollGlsl` AND STILL HAS THE DEFECT.** It is masked rather
than absent: its cross-section barely varies along z, so the stretched quad looks like more
canyon. Screenshotted and confirmed to look normal. Left alone deliberately — fixing it
costs triangles on a chapter the reader is happy with — but it is a known latent fault, and
if Long Air ever grows terrain that varies along the course it will appear.

**Six poses, not three.** With a translated strip the slide moves the row grid relative to
the lens, so the worst knot moves with it: three sample poses missed the Shepherd's worst
by half a pixel and passed a mesh that failed.

## The Murmuration does not read, and I think I know why — 7 November 2026

Reader's verdict: *"just doesn't work."* Same verdict Lantern got, on numbers that measured
well. Investigated device-first before changing anything.

**Not the device, as far as I can establish.** Page 200, contents links to it, WebGL2,
`precision highp float` declared, 23-bit mantissa in both stages, both materials linked,
2 draw calls, 1,122 triangles, 63–107 fps. One real fragility found and removed: the
per-bird `fract(sin(n*127.1)*43758.5453)` hash is handed ~74,000 radians and collapses from
547 distinct values at highp to **SIX at mediump**, which would make every bird share an
orbital plane. Baked as attributes from a 32-bit LCG now. Not proven to be the cause — the
spec guarantees highp in the vertex stage — but **never ship a sin-hash with a large
argument**; bake it.

**THE REAL FAULT IS THE FRAMEWORK QUESTION, ANSWERED HONESTLY: the breath moves the flock's
boundary RELATIVE TO NOTHING.** The frame is empty sky by design — "the chapter is the
flock, not a landscape with a flock in it" — and an empty sky has no landmark and no scale.

So: **a flock contracting in an empty sky is the same picture as the camera pulling back.**
Scale and distance are unresolvable without a reference, so "it got smaller" and "I moved
away from it" are indistinguishable, and the book never moves its camera, so the reader has
no prior that resolves it. What they see is a zoom, and a zoom is not a breath.

**And this is why my numbers were strong and still wrong.** 237% → 77% of frame is a true
measurement of how much of the picture the flock covers — but COVERAGE IS EXACTLY WHAT A
ZOOM CHANGES TOO. The Shepherd's 18% of frame width a second is displacement *past fixed
landmarks*, which a zoom cannot fake. I measured the right number for a different chapter.
**A frame-fraction figure only means something when something else in the frame is holding
still.** Add that to the pair rule: angular rate along the motion, frame fraction across
it, and either one is void without a fixed reference in shot.

Churn (41 → 102 deg/s) is real and is not the problem, but it has no boundary: busy-ness
has no direction, so it cannot carry in-versus-out on its own.

**Fixable, at about 60/40.** The fix is a fixed reference in frame — drop the lens so a
treeline or roofline is in shot and let part of the flock pass in front of it. Better still
and the version I would build: **a roost.** A tree or pylon in frame; the exhale settles
birds onto it, the inhale lifts them off. The reference is in shot, nothing travels, and
the quantity is a count of birds in the air rather than a size — unmistakable, and it
cannot be confused with a camera move. Not built: a rebuild is the reader's call.
