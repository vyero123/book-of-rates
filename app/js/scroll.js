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

/* the two rollers: a turned wooden rod with a cap at each end */
#bor-scroll .roller{position:relative;height:19px;flex:0 0 19px;border-radius:10px;
  background:linear-gradient(180deg,#6B4326 0%,#A9743F 26%,#7A4D2A 54%,#3C2415 100%);
  box-shadow:0 1px 0 rgba(255,228,180,.26) inset, 0 6px 14px rgba(0,0,0,.5);
  margin:0 -7px;z-index:2}
#bor-scroll .roller::before,#bor-scroll .roller::after{content:'';position:absolute;
  top:-3px;bottom:-3px;width:13px;border-radius:7px;
  background:linear-gradient(180deg,#8A5C31,#C9A227 30%,#6B4326 72%,#2E1B10);
  box-shadow:0 2px 5px rgba(0,0,0,.5)}
#bor-scroll .roller::before{left:-2px}
#bor-scroll .roller::after{right:-2px}

/* the parchment */
#bor-scroll .vellum{position:relative;flex:1 1 auto;overflow:auto;
  -webkit-overflow-scrolling:touch;
  padding:26px 22px 28px;color:#2A1B10;
  background:
    radial-gradient(130% 80% at 12% 0%, rgba(255,255,255,.55), transparent 55%),
    radial-gradient(120% 70% at 88% 100%, rgba(140,98,52,.22), transparent 58%),
    linear-gradient(180deg,#F2E3C3 0%,#EADAB4 42%,#E3CEA2 100%);
  box-shadow:inset 0 12px 16px -12px rgba(60,36,21,.6),
             inset 0 -12px 16px -12px rgba(60,36,21,.6),
             0 10px 26px rgba(0,0,0,.42)}
/* laid-paper grain, flat and cheap */
#bor-scroll .vellum::before{content:'';position:absolute;inset:0;pointer-events:none;
  background:repeating-linear-gradient(90deg, rgba(120,84,46,.055) 0 1px, transparent 1px 4px),
             repeating-linear-gradient(0deg, rgba(120,84,46,.035) 0 1px, transparent 1px 7px)}

#bor-scroll .of{font:400 8.5px/1 ui-serif,Georgia,serif;letter-spacing:.36em;
  text-transform:uppercase;color:rgba(42,27,16,.52);text-align:center}
#bor-scroll h2{margin:9px 0 2px;text-align:center;
  font:400 23px/1.18 ui-serif,Georgia,serif;letter-spacing:.01em;color:#2A1B10}
#bor-scroll .rule{height:1px;margin:14px 10% 16px;
  background:linear-gradient(90deg,transparent,rgba(122,77,42,.55) 22%,
    rgba(201,162,39,.85) 50%,rgba(122,77,42,.55) 78%,transparent)}
#bor-scroll p{margin:0 0 13px;font:400 13px/1.62 ui-serif,Georgia,serif;color:#3A2616}
#bor-scroll p.lede{font-style:italic;color:#4A3220}
#bor-scroll b{font-weight:700;color:#241509}
#bor-scroll .item{margin:0 0 12px}
#bor-scroll .item .t{font:700 12px/1.4 ui-sans-serif;letter-spacing:.02em;color:#241509}
#bor-scroll .item .d{font:400 12.5px/1.58 ui-serif,Georgia,serif;color:#4A3220;margin-top:2px}
#bor-scroll .fine{margin-top:16px;font:400 10.5px/1.6 ui-sans-serif;color:rgba(42,27,16,.6);
  text-align:center}

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
    <div class="roller"></div>
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
    <div class="roller"></div>
    <div class="arrows bot">${ARROW}</div>
    <div class="hint">Anywhere to go on</div>
  </div>`;
  document.body.appendChild(el);

  let done = false;
  const EVENTS = ['pointerdown','touchstart','touchmove','wheel','keydown','click'];

  function close(){
    if (done) return;
    done = true;
    for (const e of EVENTS) window.removeEventListener(e, close, true);
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
