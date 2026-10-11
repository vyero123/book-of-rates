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
