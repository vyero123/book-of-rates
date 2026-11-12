/* The Book of Rates — the warning scroll.
 *
 * This replaces the screening gate (js/gate.js) as the blocking step on
 * the way into the book. The reason it replaced it is the principle at
 * design doc §1.6: an established practice is safe to practise as long
 * as the practitioner knows what circumstances it requires, and that
 * awareness is the practitioner's, not the app's. So the app's job here
 * is DISCLOSURE, not gatekeeping — which means this is an interstitial
 * and not a consent form.
 *
 * Consequences of that, all deliberate:
 *
 *  - There is no button. There is nothing to agree to.
 *  - ANY input dismisses it: a tap, a drag, a scroll, a key. Immediately.
 *  - There is no minimum dwell. A reader who already knows this should
 *    not be made to sit through it, and a reader who does not is not
 *    helped by being forced to wait three seconds before they may leave.
 *  - It is shown once per device and can be reopened from Options.
 *
 * The one piece of timing in here is a 150 ms guard after opening, and it
 * is not a dwell requirement: it stops the same finger-down that opened
 * the cover from also dismissing the scroll as the gesture ends. Without
 * it the scroll would appear and vanish in the same touch.
 *
 * The arrows point right, top and bottom, and blink — a reduced-motion
 * query turns the blink off and leaves them lit, because the arrow is the
 * instruction and the blink is only the emphasis.
 */

const KEY = 'bor.scroll.v1';

export function scrollSeen(){
  try { return !!JSON.parse(localStorage.getItem(KEY) || 'null'); } catch(e){ return false; }
}
function markSeen(){
  try { localStorage.setItem(KEY, JSON.stringify({ at: Date.now() })); } catch(e){}
}

const CSS = `
#bor-scroll{position:fixed;inset:0;z-index:300;display:grid;place-items:center;
  padding:18px 14px;background:rgba(8,5,16,.78);
  -webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);
  font-family:ui-sans-serif,-apple-system,"Avenir Next",Segoe UI,sans-serif;
  animation:bor-scroll-in .42s cubic-bezier(.33,0,.2,1) both}
@keyframes bor-scroll-in{from{opacity:0;transform:scale(.965)}to{opacity:1;transform:none}}

#bor-scroll .sheet{position:relative;width:100%;max-width:400px;max-height:94vh;
  display:flex;flex-direction:column}

/* ==================================================================
   THE MATERIAL PASS — 12 November 2026
   ==================================================================
   THE PAPER WAS GRAPH PAPER. The grain was two repeating gradients at
   90deg and 0deg, 1 px every 4 and every 7 — a GRID, and the one thing
   laid paper never is. Laid paper is made on a wire mould: fine LAID
   lines close together in one direction, and widely spaced CHAIN lines
   across them, about 25 mm apart. One axis fine, one axis sparse. Two
   axes at the same scale is squared notebook paper and that is exactly
   what it read as at 375 px.

   THE SHEET DID NOT COME FROM ANYWHERE. It was a rectangle with a bar
   above it and a bar below it and a visible gap at each. A scroll's
   whole shape is that the paper goes UNDER the rod and keeps going, so
   the rollers cast onto the sheet, the sheet darkens into the tuck, and
   the last few millimetres curve out of the light.

   THE RODS WERE PILLS. A 19 px rounded bar with a four-stop gradient
   and two capsules on the ends. Turned wood has a narrow specular LINE
   rather than a broad band, and a finial is a disc with a rim seen
   edge-on, which is darker at its own edges and not at its middle.

   And the headings were bold SANS on a parchment, which is the one
   anachronism on the sheet. Small-caps serif, same family as the body.
   ================================================================== */

/* the two rollers: a turned wooden rod with a finial at each end */
#bor-scroll .roller{position:relative;height:19px;flex:0 0 19px;border-radius:10px;
  background:
    linear-gradient(180deg,
      #3A2314 0%, #6E462A 13%, #C08A51 27%, #E8C190 33%, #A9743F 42%,
      #7A4D2A 62%, #4A2D1A 82%, #241509 100%),
    repeating-linear-gradient(94deg, rgba(0,0,0,.14) 0 1px, transparent 1px 9px);
  box-shadow:0 7px 16px rgba(0,0,0,.55), 0 2px 3px rgba(0,0,0,.5);
  margin:0 -7px;z-index:2}
/* the grain of the rod, running along it, and only faintly */
#bor-scroll .roller::before{content:'';position:absolute;inset:0;border-radius:10px;
  pointer-events:none;opacity:.22;
  background:repeating-linear-gradient(90deg,
    rgba(0,0,0,.5) 0 1px, transparent 1px 7px, rgba(255,220,170,.4) 7px 8px, transparent 8px 19px)}
#bor-scroll .roller i{position:absolute;top:-3.5px;bottom:-3.5px;width:13px;
  border-radius:7px;
  background:
    radial-gradient(60% 50% at 50% 34%, rgba(255,236,190,.55), transparent 70%),
    linear-gradient(180deg,#2E1B10 0%,#8A5C31 10%,#D9B45E 32%,#C9A227 46%,
                    #6B4326 74%,#1E1209 100%);
  box-shadow:0 2px 6px rgba(0,0,0,.6), inset 0 0 0 1px rgba(0,0,0,.35)}
#bor-scroll .roller i.l{left:-3px}
#bor-scroll .roller i.r{right:-3px}

/* the parchment */
#bor-scroll .vellum{position:relative;flex:1 1 auto;overflow:auto;
  -webkit-overflow-scrolling:touch;
  padding:30px 22px 32px;color:#2A1B10;
  background:
    /* the sheet curving away at the left and right edges */
    linear-gradient(90deg, rgba(120,84,46,.30) 0, transparent 14px,
                           transparent calc(100% - 14px), rgba(120,84,46,.26) 100%),
    radial-gradient(130% 80% at 12% 0%, rgba(255,255,255,.52), transparent 55%),
    radial-gradient(120% 70% at 88% 100%, rgba(140,98,52,.22), transparent 58%),
    linear-gradient(180deg,#F2E3C3 0%,#EADAB4 42%,#E3CEA2 100%);
  /* THE TUCK. Strong and short at both ends, so the sheet goes under
     the rod rather than stopping at it. */
  box-shadow:inset 0 20px 18px -16px rgba(44,24,12,.85),
             inset 0 -20px 18px -16px rgba(44,24,12,.85),
             0 10px 26px rgba(0,0,0,.42)}
/* LAID PAPER: fine laid lines one way, sparse chain lines the other,
   and a mottle over both so the lines are not perfectly even. */
#bor-scroll .vellum::before{content:'';position:absolute;inset:0;pointer-events:none;
  background:
    repeating-linear-gradient(0deg,
      rgba(120,84,46,.050) 0 1px, transparent 1px 3px),
    repeating-linear-gradient(90deg,
      rgba(120,84,46,.085) 0 1px, transparent 1px 27px)}
#bor-scroll .vellum::after{content:'';position:absolute;inset:0;pointer-events:none;
  opacity:.14;background-size:180px 180px;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='v'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.035' numOctaves='3' seed='5'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23v)'/%3E%3C/svg%3E")}

#bor-scroll .of{font:400 8.5px/1 ui-serif,Georgia,serif;letter-spacing:.36em;
  text-transform:uppercase;color:rgba(42,27,16,.52);text-align:center}
#bor-scroll h2{margin:10px 0 2px;text-align:center;
  font:400 25px/1.16 ui-serif,Georgia,serif;letter-spacing:.005em;color:#241509;
  text-shadow:0 1px 0 rgba(255,250,235,.5)}
/* the rule, with a struck lozenge at its centre */
#bor-scroll .rule{position:relative;height:1px;margin:15px 10% 18px;
  background:linear-gradient(90deg,transparent,rgba(122,77,42,.55) 22%,
    rgba(201,162,39,.85) 50%,rgba(122,77,42,.55) 78%,transparent)}
#bor-scroll .rule::after{content:'';position:absolute;left:50%;top:50%;
  width:5px;height:5px;margin:-2.5px 0 0 -2.5px;transform:rotate(45deg);
  background:linear-gradient(135deg,#E0C271,#8A6A14);
  box-shadow:0 1px 0 rgba(255,250,235,.6)}
#bor-scroll p{margin:0 0 13px;font:400 13px/1.62 ui-serif,Georgia,serif;color:#3A2616}
#bor-scroll p.lede{font-style:italic;color:#4A3220}
#bor-scroll b{font-weight:700;color:#241509}
#bor-scroll .item{margin:0 0 13px}
/* Serif, not sans: the same voice as the body, raised.
   SMALL CAPS WERE TRIED AND REJECTED HERE. They are the bookish answer
   and they are the wrong one for this sheet, because these headings are
   whole sentences and the most important of them is the water rule.
   A sentence set in small caps is an inscription — handsome, and read
   more slowly. The anachronism being fixed is the bold SANS on a
   parchment; it is not fixed any better by also making the one line
   that matters harder to read. */
#bor-scroll .item .t{font:700 12.5px/1.42 ui-serif,Georgia,serif;
  letter-spacing:.012em;color:#1E1007}
#bor-scroll .item .d{font:400 12.5px/1.58 ui-serif,Georgia,serif;color:#4A3220;margin-top:1px}
#bor-scroll .fine{margin-top:18px;font:italic 400 11px/1.6 ui-serif,Georgia,serif;
  color:rgba(42,27,16,.62);text-align:center}

/* the arrows: top and bottom, both pointing right, gently blinking */
#bor-scroll .arrows{position:absolute;left:0;right:0;display:flex;justify-content:center;
  pointer-events:none;z-index:3}
#bor-scroll .arrows.top{top:-2px}
#bor-scroll .arrows.bot{bottom:-2px}
#bor-scroll .arrows svg{width:30px;height:16px;display:block;
  filter:drop-shadow(0 1px 2px rgba(0,0,0,.55));
  animation:bor-blink 1.9s ease-in-out infinite}
#bor-scroll .arrows.bot svg{animation-delay:.95s}
@keyframes bor-blink{0%,100%{opacity:.28}50%{opacity:1}}
#bor-scroll .hint{position:absolute;left:0;right:0;bottom:-26px;text-align:center;
  font:500 8.5px/1 ui-sans-serif;letter-spacing:.26em;text-transform:uppercase;
  color:rgba(243,234,215,.5)}

@media (prefers-reduced-motion: reduce){
  #bor-scroll{animation:none}
  #bor-scroll .arrows svg{animation:none;opacity:.92}
}
`;

const ARROW = `<svg viewBox="0 0 30 16" aria-hidden="true">
  <path d="M4 3 L11 8 L4 13 Z" fill="#C9A227"/>
  <path d="M14 3 L21 8 L14 13 Z" fill="#C9A227" opacity=".7"/>
  <path d="M24 4.5 L28 8 L24 11.5 Z" fill="#C9A227" opacity=".4"/>
</svg>`;

/** Open the scroll. `onDone` runs once it has been dismissed. */
export function openScroll(onDone){
  if (document.getElementById('bor-scroll')) return;

  const st = document.createElement('style');
  st.id = 'bor-scroll-css';
  st.textContent = CSS;
  document.head.appendChild(st);

  const el = document.createElement('div');
  el.id = 'bor-scroll';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', 'What this practice asks for');
  el.innerHTML = `<div class="sheet">
    <div class="arrows top">${ARROW}</div>
    <div class="roller"><i class="l"></i><i class="r"></i></div>
    <div class="vellum">
      <div class="of">The Book of Rates</div>
      <h2>What this asks of you</h2>
      <div class="rule"></div>

      <p class="lede">These are old practices, kept by a great many people for a very long
        time. They are safe in the circumstances they ask for. Those circumstances are yours
        to provide — no app can check them for you, and this one does not pretend to.</p>

      <div class="item">
        <div class="t">On land. Sitting or lying down.</div>
        <div class="d">Not standing, not walking, not in a vehicle. If you are going to feel
          faint, be somewhere it does not matter that you did.</div>
      </div>

      <div class="item">
        <div class="t">Never in or near water. This one has no exceptions.</div>
        <div class="d">No bath, pool, sea or hot tub, and never before swimming or diving.
          Holding your breath after breathing hard causes blackout with no warning at all —
          and that is a drowning mechanism, not a breathing one. On a floor the worst of it
          is a faint. In water it has killed strong swimmers in shallow, supervised pools.</div>
      </div>

      <div class="item">
        <div class="t">Stop whenever you like.</div>
        <div class="d">The stop control stays on screen the whole way through and always
          works. Light-headedness or tingling means ease off, never push through. Chest pain,
          fainting, or losing your vision means stop and get help.</div>
      </div>

      <p class="fine">A personal project, offered as-is, for your own judgement.
        Not medical advice.</p>
    </div>
    <div class="roller"><i class="l"></i><i class="r"></i></div>
    <div class="arrows bot">${ARROW}</div>
    <div class="hint">Anywhere to go on</div>
  </div>`;
  document.body.appendChild(el);

  let done = false;
  const EVENTS = ['pointerdown','touchstart','touchmove','wheel','keydown','click'];

  /* BACK DISMISSES IT TOO — 6 November 2026. The scroll takes any
     input at all to close (design doc §1.6: disclosure, not a consent
     gate), and the browser's back button is an input the reader
     plainly means as "not this". Without it, Back over the scroll
     navigated the page underneath while the sheet stayed on top of
     whatever arrived. Closing is closing: it marks seen exactly as
     every other dismissal does. */
  function onPop(){ close(); }

  function close(){
    if (done) return;
    done = true;
    for (const e of EVENTS) window.removeEventListener(e, close, true);
    window.removeEventListener('popstate', onPop);
    el.removeEventListener('scroll', close, true);
    el.style.transition = 'opacity .26s ease, transform .26s ease';
    el.style.opacity = '0';
    el.style.transform = 'scale(1.02)';
    setTimeout(() => { el.remove(); st.remove(); }, 280);
    markSeen();
    if (onDone) onDone();
  }

  // 150 ms, only so the gesture that opened the cover cannot close this as
  // it ends. Not a dwell requirement — see the note at the top of the file.
  setTimeout(() => {
    if (done) return;
    for (const e of EVENTS) window.addEventListener(e, close, true);
    window.addEventListener('popstate', onPop);
    el.addEventListener('scroll', close, true);
  }, 150);
}

/** Gate a caller the same way js/gate.js did:
 *
 *      if (requireScroll(() => begin())) return;   // ...then carry on
 *
 *  Returns TRUE if the scroll was opened and the caller should stop. The
 *  callback runs once it has been dismissed. Returns FALSE if it has been
 *  seen already, and the caller simply continues.
 *
 *  It must NOT invoke the callback in the already-seen case. gate.js once
 *  did exactly that, and `begin()` recursed into itself until the stack
 *  overflowed — while the render loop kept drawing, so it looked like a
 *  stuck breath rather than a dead control path. Same contract, same
 *  reason, kept deliberately identical.
 */
export function requireScroll(onReady){
  if (scrollSeen()) return false;
  openScroll(onReady);
  return true;
}
