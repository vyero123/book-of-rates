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

## Other standing constraints for this project

- **Never run git inside the mounted folder.** Clone to `/tmp`, assemble there, push with an
  askpass helper. Writes to the mounted folder are fine; git operations are not.
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
