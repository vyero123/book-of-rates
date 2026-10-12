#!/bin/sh
# Gate, commit, push — and FAIL LOUDLY.
#
# An earlier version chained these with && and printed "pushed" on the next
# line regardless, so a push the gate had correctly refused was reported as
# having happened. This verifies the remote head instead of assuming.
#
# The PAT prefix is assembled at runtime: writing it literally into a
# tracked file makes the credential scan match this file for ever and go
# quietly useless.
set -eu
MSG="$1"
PREFIX="github""_pat_"
cd /tmp/bor
# Stage first: the gate's credential scan reads the INDEX, so checking
# before staging tests the previous commit, not what is about to go out.
git add -A
if ! sh tools/check.sh . > /tmp/check.log 2>&1; then
  echo "PUSH ABORTED — gate failed:"; cat /tmp/check.log; exit 1
fi
if git diff --cached --quiet; then echo "PUSH SKIPPED — nothing staged"; exit 2; fi
git commit -q -m "$MSG"
GIT_ASKPASS=/tmp/ap.sh git push -q origin main 2>&1 | sed "s/${PREFIX}[A-Za-z0-9_]*/[REDACTED]/g"
LOCAL=$(git rev-parse HEAD)
REMOTE=$(GIT_TERMINAL_PROMPT=0 git ls-remote origin -h refs/heads/main | cut -f1)
if [ "$LOCAL" != "$REMOTE" ]; then
  echo "PUSH FAILED — remote $REMOTE != local $LOCAL"; exit 3
fi
echo "PUSHED $LOCAL"
