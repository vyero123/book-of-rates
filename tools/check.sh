#!/bin/sh
# Syntax gate for The Book of Rates.
#
# On 11 October a broken scenes.js went live because the verification
# command was `node --check && echo OK` on one line and `git commit` on the
# next, so the check never gated the push. This script exits non-zero on
# any failure and MUST be the first thing in the push chain:
#
#     sh tools/check.sh && git commit ... && git push ...
#
# Usage: sh tools/check.sh [repo-root]

set -eu
ROOT="${1:-.}"
FAIL=0

say(){ printf '%s\n' "$*"; }

# --- 1. every ES module under app/js ---
for f in "$ROOT"/app/js/*.js; do
  [ -e "$f" ] || continue
  if node --input-type=module --check < "$f" >/dev/null 2>&1; then
    say "  ok    $(basename "$f")"
  else
    say "  FAIL  $(basename "$f")"
    node --input-type=module --check < "$f" 2>&1 | head -6
    FAIL=1
  fi
done

# --- 2. inline <script type="module"> blocks in every html page ---
for f in "$ROOT"/app/*.html "$ROOT"/prototypes/*.html "$ROOT"/index.html; do
  [ -e "$f" ] || continue
  name=$(basename "$f")
  if python3 - "$f" >/dev/null 2>&1 <<'PY'
import re, sys, pathlib, subprocess, tempfile, os
src = pathlib.Path(sys.argv[1]).read_text(encoding='utf-8')
blocks = re.findall(r'<script type="module">(.*?)</script>', src, re.S)
plain  = re.findall(r'<script>(.*?)</script>', src, re.S)
rc = 0
for kind, chunks, flag in (('module', blocks, True), ('classic', plain, False)):
    if not chunks: continue
    js = "\n".join(chunks)
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t:
        t.write(js); path = t.name
    cmd = ['node','--check',path] if not flag else ['node','--input-type=module','--check']
    if flag:
        r = subprocess.run(cmd, input=js, capture_output=True, text=True)
    else:
        r = subprocess.run(cmd, capture_output=True, text=True)
    os.unlink(path)
    if r.returncode != 0:
        sys.stderr.write(r.stderr); rc = 1
sys.exit(rc)
PY
  then
    say "  ok    $name"
  else
    say "  FAIL  $name"
    python3 - "$f" <<'PY' 2>&1 | head -8
import re, sys, pathlib, subprocess
src = pathlib.Path(sys.argv[1]).read_text(encoding='utf-8')
for chunks, mod in ((re.findall(r'<script type="module">(.*?)</script>', src, re.S), True),
                    (re.findall(r'<script>(.*?)</script>', src, re.S), False)):
    if not chunks: continue
    js = "\n".join(chunks)
    cmd = ['node','--input-type=module','--check'] if mod else ['node','--check','/dev/stdin']
    r = subprocess.run(cmd, input=js, capture_output=True, text=True)
    if r.returncode: print(r.stderr)
PY
    FAIL=1
  fi
done

# --- 3. every named import must actually be exported ---
# A syntax check cannot see this. On 12 October journey.html imported
# `resumeAudio` from audio.js, which did not export it: every file parsed
# cleanly, the gate passed, and the journey page failed to load at all in
# production. Syntax validity is not module validity.
if ! python3 "$ROOT/tools/imports.py" "$ROOT"; then
  say "  FAIL  import/export mismatch"
  FAIL=1
else
  say "  ok    imports resolve"
fi

# --- 4. the breath mapping must not have drifted ---
# The 3-D chapters' machinery was pulled out of deep-light.html into a
# shared kit on 23 October. The extraction was claimed to be
# behaviour-preserving; this is where that claim is checked rather than
# believed. tools/regress.mjs samples phase, cue, countdown, height and
# the expressive curve every 50 ms across a full session plus a cycle,
# for both protocols, and diffs them against a frozen verbatim copy of
# the pre-kit code. A regression in the breath is worse than no kit.
if ! node "$ROOT/tools/regress.mjs"; then
  say "  FAIL  the breath mapping differs from the frozen baseline"
  FAIL=1
fi

# --- 4b. the scenery must be continuous ---
# The reader's verdict on Long Air was "a jutting, discontinuous mess"
# and the instruction was to SAMPLE for continuity rather than adjust
# things that looked suspect. tools/continuity.mjs does that: it
# classifies every terrain field by how its measured derivatives behave
# when the sample spacing is halved (smooth stays put, a slope kink
# doubles in curvature, a value jump doubles in slope), reports the
# kink angle at every mesh knot, checks the wrap seam for a DERIVATIVE
# match and not only a value match, and re-derives the corridor margin
# from the drawn surface instead of from the spine.
#
# It proves itself on five controls with known answers before it says
# anything about the scene, and it keeps the pre-fix definitions as a
# negative control so the check is known to be able to fail.
if ! node "$ROOT/tools/continuity.mjs" > /dev/null 2>&1; then
  say "  FAIL  the scenery has a measured discontinuity"
  node "$ROOT/tools/continuity.mjs" 2>&1 | grep -E "FAIL" | head -10
  FAIL=1
else
  say "  ok    scenery continuous: every field smooth under refinement"
fi

# --- 4c. and the scenery must be continuous IN TIME ---
# continuity.mjs measures SHAPE, and it had brought every mesh in Long
# Air under its bar while the reader was still reporting the chapter as
# disorienting and jerky. It could not have found the reason: nothing
# in it samples time, so a value that drives geometry and changes
# discontinuously FROM ONE FRAME TO THE NEXT was outside its reach by
# construction.
#
# tools/temporal.mjs is the counterpart. It drives the chapter's real
# modules frame by frame over two clocks — a metronome 60 fps and a
# jittered one that sits at 58 and drops frames, which is the reader's
# own situation — differences every animated scalar twice in TIME, and
# names what it finds: a position step, a velocity step (a smooth
# follower chasing a target that steps, which a position-only measure
# passes), or a frame-rate dependence.
#
# It proves itself on seven controls first, asserts that its on-pace
# reader touches no surface before claiming to measure free flight, and
# keeps the pre-fix lens as a negative control.
if ! node "$ROOT/tools/temporal.mjs" > /dev/null 2>&1; then
  say "  FAIL  something animated moves in steps"
  node "$ROOT/tools/temporal.mjs" 2>&1 | grep -E "FAIL" | head -10
  FAIL=1
else
  say "  ok    motion continuous: no animated scalar steps on either clock"
fi

# --- 4e. the reader-led spine ---
# Design doc 1.7: the reader sets the rate. A chapter built on that has
# no schedule to fly, so regress.mjs's "on-pace play never touches a
# surface" cannot cover it — that is a promise about a reader conforming
# to OUR rate. tools/lead.mjs checks the other kind of thing: properties
# over a FAMILY of reader behaviours. The phase estimator against traces
# with known periods (and a tremor it must refuse to call a rhythm); the
# superstructure locking, standing behind, and NOT locking when it
# should not; 1.6a as a continuous invariant, swept over every state and
# flown for a thousand seconds of a random reader; and the one-riser
# ramp against the five-riser loop it replaced. Every section carries a
# case that is required to fail.
if ! node "$ROOT/tools/lead.mjs" > /dev/null 2>&1; then
  say "  FAIL  the reader-led spine"
  node "$ROOT/tools/lead.mjs" 2>&1 | grep -E "FAIL" | head -10
  FAIL=1
else
  say "  ok    reader-led spine: estimator, coupling, 1.6a invariant, ramp"
fi

# --- 4f. Bamboo Rain's water-tipper ---
# The second Bamboo Rain (13 November 2026) is reader-led and one degree
# of freedom: press to fill, let go to pour. tools/sozu.mjs flies its
# model (js/sozu-breath.js) over a family of readers and checks what
# the chapter's header promises: it turns fast, the pour outlasts the
# fill at every rate, it caps, it cannot be failed, and a longer breath
# reaches further. It carries a case that is required to fail.
if ! node "$ROOT/tools/sozu.mjs" > /dev/null 2>&1; then
  say "  FAIL  bamboo rain's water-tipper"
  node "$ROOT/tools/sozu.mjs" 2>&1 | grep -E "FAIL" | head -10
  FAIL=1
else
  say "  ok    bamboo rain: turns, pours longer than it fills, caps, cannot be failed"
fi

# --- 4d. the back button must stay sensible ---
# The reader hit a real bug here on 6 November: every exit assigned
# location.href, which PUSHES a history entry, so Back from the
# contents went forward into the chapter the reader had just left and
# restarted it. The fix is that returning uses the browser's own back
# (js/bookframe.js, returnToBook) and that opening the book pushes a
# `#contents` entry for it to land on.
#
# Neither of those can be proved in Node — history is a browser
# object. What CAN be checked, cheaply and textually, is that nothing
# has quietly gone back to the construction that caused it: a chapter
# assigning location.href to the contents directly, bypassing the
# shared helper, or index.html losing the pushState the helper lands
# on. Same shape as the credential scan: aimed at one specific
# mistake that has actually been made.
BACK=0
for f in "$ROOT"/app/*.html; do
  [ -e "$f" ] || continue
  case "$(basename "$f")" in index.html|deep-light.html) continue ;; esac
  if grep -qE "location\.href *= *['\"]\./#contents" "$f"; then
    say "  FAIL  $(basename "$f") assigns location.href to the contents — use returnToBook()"
    BACK=1
  fi
done
if ! grep -q "pushState({ bor:'contents' }" "$ROOT/app/index.html"; then
  say "  FAIL  index.html no longer pushes a #contents entry for Back to land on"
  BACK=1
fi
if ! grep -q "export function returnToBook" "$ROOT/app/js/bookframe.js"; then
  say "  FAIL  bookframe.js has lost returnToBook()"
  BACK=1
fi
if [ "$BACK" -eq 0 ]; then
  say "  ok    the back button's two halves are both still wired"
else
  FAIL=1
fi

# --- 5. no credential may ever reach the index ---
PAT="github""_pat_"
if [ -d "$ROOT/.git" ]; then
  if git -C "$ROOT" grep --cached -lE "$PAT" >/dev/null 2>&1; then
    say "  FAIL  a token-shaped string is staged"
    FAIL=1
  else
    say "  ok    no credential in the index"
  fi
fi

if [ "$FAIL" -ne 0 ]; then
  say "CHECK FAILED — nothing should be pushed"
  exit 1
fi
say "CHECK PASSED"
