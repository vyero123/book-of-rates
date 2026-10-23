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

# --- 4. no credential may ever reach the index ---
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
