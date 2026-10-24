#!/bin/sh
# Assemble, gate, commit, push — and FAIL LOUDLY.
#
#     sh tools/push.sh "commit message" [source-root]
#
# source-root defaults to the directory this script's parent is in, i.e.
# the mounted working copy. Everything else it needs it makes for itself.
#
# ---------------------------------------------------------------------
# WHY THIS SCRIPT OWNS THE WHOLE CHAIN
#
# 1. An early version chained check && commit && push with `echo pushed`
#    on the NEXT line, so a push the gate had correctly refused was
#    reported as having happened. The gate must be in the same chain as
#    the push, and the push must be verified against the remote rather
#    than assumed. Both are below.
#
# 2. It used to assume a populated clone at /tmp/bor and an askpass
#    helper at /tmp/ap.sh, both created by hand beforehand. On
#    23 October a /tmp/bor and a /tmp/ap.sh left behind by an EARLIER
#    session were still on disk, owned by a different user so they could
#    not be overwritten, and the stale helper pointed at that session's
#    mount path — which the current session cannot read. The result: a
#    helper that existed, was executable, and silently supplied nothing.
#
#    Parameterising the paths would only have moved the problem. So the
#    script now CREATES everything it depends on, inside a directory it
#    owns, every time. There is nothing left for a previous session to
#    shadow, and nothing to remember to set up.
#
# 3. The clone is cached between runs in the same session, but it is
#    validated first (right remote, really a clone) and hard-reset to
#    origin/main before assembly, so a half-finished earlier attempt
#    cannot contribute anything to the next commit.
#
# 4. token.txt is a live PAT at the source root. It never reaches a
#    command line, never gets echoed, and is excluded from the assembly
#    as well as being in .gitignore — belt and braces, because the gate's
#    credential scan is the last line of defence and should never be the
#    only one. Any git output is run through a redaction filter.
# ---------------------------------------------------------------------
set -eu

# The message may be given inline or, far better, read from a file:
#
#     sh tools/push.sh -F /path/to/message.txt [source-root]
#
# Inline is a shell argument, so backticks and $ in it are substituted by
# the shell before this script ever sees them. On 24 October a message
# describing a bug in a field called `pearl` had the word silently
# removed and printed "pearl: command not found" — harmless that time,
# but the same mechanism would happily run whatever is in the backticks.
# -F reads the bytes as they are. Prefer it for anything long.
if [ "${1:-}" = "-F" ]; then
  [ -f "${2:-}" ] || { echo "PUSH ABORTED — no message file at ${2:-}"; exit 4; }
  MSG=$(cat "$2")
  SRC="${3:-}"
else
  MSG="${1:?usage: sh tools/push.sh \"message\" [src] | -F <file> [src]}"
  SRC="${2:-}"
fi
if [ -z "$SRC" ]; then
  SRC=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
fi
SRC=$(CDPATH= cd -- "$SRC" && pwd)

PREFIX="github""_pat_"
redact(){ sed "s/${PREFIX}[A-Za-z0-9_]*/[REDACTED]/g"; }

[ -f "$SRC/token.txt" ] || { echo "PUSH ABORTED — no token.txt at $SRC"; exit 4; }
[ -f "$SRC/.git/config" ] || { echo "PUSH ABORTED — $SRC is not a working copy"; exit 4; }

# The remote, read out of the source config as a FILE. Reading is fine;
# running git in the mounted folder is not (see CLAUDE.md). Any embedded
# credentials are stripped, because we supply our own.
REMOTE=$(sed -n 's/^[[:space:]]*url[[:space:]]*=[[:space:]]*//p' "$SRC/.git/config" |
         head -1 | sed 's#https://[^@/]*@#https://#')
[ -n "$REMOTE" ] || { echo "PUSH ABORTED — could not read remote url"; exit 4; }

# ---- our own private workspace, under the session home, never /tmp ----
WORK="${BOR_WORK:-$HOME/.bor}"
mkdir -p "$WORK"
chmod 700 "$WORK"
CLONE="$WORK/clone"
ASKPASS="$WORK/askpass.sh"

cleanup(){ rm -f "$ASKPASS"; }
trap cleanup EXIT HUP INT TERM

# ---- the askpass helper, written fresh every run ----
# It reads the PAT from the file at call time. The username can be
# anything for a fine-grained PAT over HTTPS; x-access-token is the
# conventional placeholder and avoids depending on the account name.
cat > "$ASKPASS" <<EOF
#!/bin/sh
case "\$1" in
  Username*) printf 'x-access-token\n' ;;
  *)         tr -d '\r\n' < '$SRC/token.txt' ;;
esac
EOF
chmod 700 "$ASKPASS"
# prove the helper works before relying on it: four times in this project
# a reported fault turned out to be the instrument, not the thing measured
[ -s "$SRC/token.txt" ] || { echo "PUSH ABORTED — token.txt is empty"; exit 4; }
[ -n "$("$ASKPASS" Password)" ] || { echo "PUSH ABORTED — askpass helper returned nothing"; exit 4; }

export GIT_ASKPASS="$ASKPASS"
export GIT_TERMINAL_PROMPT=0

# ---- the clone: validate, or make a new one ----
VALID=0
if [ -d "$CLONE/.git" ]; then
  HAVE=$(git -C "$CLONE" config --get remote.origin.url 2>/dev/null |
         sed 's#https://[^@/]*@#https://#' || true)
  [ "$HAVE" = "$REMOTE" ] && VALID=1
fi
if [ "$VALID" -ne 1 ]; then
  rm -rf "$CLONE"
  git clone -q "$REMOTE" "$CLONE" 2>&1 | redact
fi
git -C "$CLONE" fetch -q origin main 2>&1 | redact
git -C "$CLONE" checkout -q -B main origin/main
# discard anything a previous half-finished attempt left behind
git -C "$CLONE" reset -q --hard origin/main
git -C "$CLONE" clean -qfd

# The sandbox has no git identity, and `git commit` stops dead without
# one — after the gate has already run, which is a confusing place to
# fail. Inherit it from the history of the repo being pushed to rather
# than inventing one, so commits stay attributed consistently.
if ! git -C "$CLONE" config --get user.email >/dev/null 2>&1; then
  WHO_N=$(git -C "$CLONE" log -1 --format='%an' 2>/dev/null || true)
  WHO_E=$(git -C "$CLONE" log -1 --format='%ae' 2>/dev/null || true)
  [ -n "$WHO_N" ] && git -C "$CLONE" config user.name  "$WHO_N"
  [ -n "$WHO_E" ] && git -C "$CLONE" config user.email "$WHO_E"
  if ! git -C "$CLONE" config --get user.email >/dev/null 2>&1; then
    echo "PUSH ABORTED — no git identity, and none to inherit from history"; exit 4
  fi
fi

BEFORE=$(git -C "$CLONE" rev-parse HEAD)

# ---- assemble: mirror the source tree in, minus the things that must
#      never be committed ----
#
# --no-perms is deliberate. The mounted working copy comes through a
# cloud-synced Windows filesystem where every file reads as 0700, so -a
# would stamp the executable bit onto the lot. It happens that almost
# everything here is already committed as 100755, so today the damage
# would have been one file — but the next time the mount's modes differ
# it is a diff on every file in the tree, which is the kind of noise that
# hides a real change. Destination modes are left alone; git only records
# the exec bit anyway.
#
# KEEP_AT_ROOT: /04-breath-loops.html is tracked at the repo root and is
# NOT in the working copy, so --delete would quietly remove it. It looks
# like a stray duplicate of prototypes/04-breath-loops.html, but deleting
# a tracked file as a SIDE EFFECT of pushing something else is not this
# script's business. It is preserved and reported instead; remove it in
# its own commit if it really is unwanted.
KEEP_AT_ROOT='/04-breath-loops.html'

if command -v rsync >/dev/null 2>&1; then
  rsync -rlt --no-perms --delete \
    --exclude '.git/' --exclude 'token.txt' --exclude 'node_modules/' \
    --exclude '.DS_Store' --exclude '*.swp' \
    --exclude "$KEEP_AT_ROOT" \
    "$SRC"/ "$CLONE"/
else
  echo "PUSH ABORTED — rsync is required for a verified assembly"; exit 4
fi

# `[ ... ] && echo` as the last command in a loop body returns non-zero
# when the test fails, and under `set -e` that aborts the script. A
# "prove the gate catches a break" test died this way on 12 October and
# committed its own deliberate breakage.
for f in $KEEP_AT_ROOT; do
  if [ -e "$CLONE${f}" ]; then
    echo "  note  preserved tracked file not in the working copy: ${f#/}"
  fi
done

cd "$CLONE"

# Stage BEFORE gating: the gate's credential scan reads the INDEX, so
# checking first would test the previous commit rather than what is about
# to go out.
git add -A

if ! sh tools/check.sh . > "$WORK/check.log" 2>&1; then
  echo "PUSH ABORTED — gate failed:"; cat "$WORK/check.log"; exit 1
fi
tail -n 1 "$WORK/check.log"

if git diff --cached --quiet; then echo "PUSH SKIPPED — nothing staged"; exit 2; fi

git commit -q -m "$MSG"
git push -q origin main 2>&1 | redact

LOCAL=$(git rev-parse HEAD)
REMOTE_HEAD=$(git ls-remote origin -h refs/heads/main | cut -f1)
if [ "$LOCAL" != "$REMOTE_HEAD" ]; then
  echo "PUSH FAILED — remote $REMOTE_HEAD != local $LOCAL"; exit 3
fi
echo "PUSHED $LOCAL  (was $BEFORE)"
git --no-pager show --stat --oneline HEAD | head -40
