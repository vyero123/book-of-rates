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
