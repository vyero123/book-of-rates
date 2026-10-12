#!/bin/sh
# Gate, commit, push — and FAIL LOUDLY. An earlier version chained these
# with && and printed "pushed" on the next line regardless, so a push that
# the gate had correctly refused was reported as having happened.
set -eu
MSG="$1"
cd /tmp/bor
if ! sh tools/check.sh . > /tmp/check.log 2>&1; then
  echo "PUSH ABORTED — gate failed:"; cat /tmp/check.log; exit 1
fi
git add -A
if git diff --cached --quiet; then echo "PUSH SKIPPED — nothing staged"; exit 2; fi
git commit -q -m "$MSG"
GIT_ASKPASS=/tmp/ap.sh git push -q origin main 2>&1 | sed "s/github_pat_[A-Za-z0-9_]*/[REDACTED]/g"
HEAD_LOCAL=$(git rev-parse HEAD)
HEAD_REMOTE=$(GIT_TERMINAL_PROMPT=0 git ls-remote origin -h refs/heads/main | cut -f1)
if [ "$HEAD_LOCAL" != "$HEAD_REMOTE" ]; then
  echo "PUSH FAILED — remote head $HEAD_REMOTE does not match local $HEAD_LOCAL"; exit 3
fi
echo "PUSHED $HEAD_LOCAL"
