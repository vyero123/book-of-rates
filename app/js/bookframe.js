/* The Book of Rates — the book as an object, in markup.
 *
 * The CSS lives in app/css/bookframe.css and is the single definition of
 * the gold tooling, the board solid and the fore-edge. This file is the
 * markup for them, and the two behaviours that use it:
 *
 *   mountPageFrame(target)  the cover's framing, held to the viewport,
 *                           for a page the reader is INSIDE
 *   closeBook({ then })     the board swinging shut over a chapter
 *
 * Nothing here invents a second idiom. The corner ornament, the double
 * rule and the stitch line are the same four paths and three divs the
 * cover has always used; they were ids in index.html and are now classes
 * so that three places can wear them without three copies existing.
 */

const CSS_HREF = 'css/bookframe.css';

/** Add the stylesheet if this page has not got it. Idempotent, and it
 *  resolves relative to the document, so a chapter at app/x.html and the
 *  cover at app/ both reach the same file.
 *
 *  index.html does NOT rely on this — it links the sheet in <head>, so
 *  the cover is framed in the first painted frame rather than one or two
 *  frames later. This is for chapter pages, which only need the board at
 *  the moment they are leaving. */
let cssLink = null;
export function ensureCss(){
  const want = new URL(CSS_HREF, document.baseURI).href;
  const had = [...document.querySelectorAll('link[rel="stylesheet"]')].find(l => l.href === want);
  if(had){ cssLink = had; return false; }
  const l = document.createElement('link');
  l.rel = 'stylesheet'; l.href = CSS_HREF;
  document.head.appendChild(l);
  cssLink = l;
  return true;
}

/** Has the sheet actually arrived? A <link> appended to the head loads
 *  ASYNCHRONOUSLY, and until it has, `.bor-board` has no transform rule
 *  — so a board mounted open is not open, and removing the class
 *  animates nothing from nothing.
 *
 *  Measured: closeBook() called on a chapter that had never loaded the
 *  sheet read `transform: none` at both ends of the turn. The board was
 *  there, the classes were right, and the stylesheet was still in
 *  flight.
 *
 *  So chapters call ensureCss() when they WIRE their exits, which gives
 *  the sheet a whole session to arrive, and closeBook checks anyway. */
export function cssReady(){
  if(!cssLink) return false;
  const want = cssLink.href;
  for(const s of document.styleSheets) if(s.href === want) return true;
  return false;
}

/* The corner ornament. One shape, drawn four times with the class doing
   the mirroring — a second hand-drawn corner is a second corner. */
const CORNER = `
  <path d="M2 14 Q2 2 14 2 L14 5 Q5 5 5 14 Z" fill="#C9A227"/>
  <path d="M8 20 Q8 8 20 8 L20 10 Q10 10 10 20 Z" fill="#EFD98B" opacity=".65"/>
  <circle cx="16" cy="16" r="2.1" fill="#EFD98B" opacity=".8"/>`;

const corner = cls => `<svg class="${cls}" viewBox="0 0 34 34" aria-hidden="true">${CORNER}</svg>`;

/** The gold tooling: outer rule, stitch line, inner rule, four corners.
 *  `page` holds it to the viewport instead of to its parent, for a
 *  scrolling page. */
export function toolHTML({ page = false } = {}){
  return `<div class="bor-tool${page ? ' page' : ''}" aria-hidden="true">
  <div class="outer"></div>
  <div class="stitch"></div>
  <div class="inner"></div>
  ${corner('c1')}${corner('c2')}${corner('c3')}${corner('c4')}
</div>`;
}

/** The board solid: back face, fore-edge, front face, spine, and the
 *  text block behind the lot. `face` is dropped into the front face, so
 *  the cover can put its plate there and the exit overlay can put
 *  nothing there. */
export function boardHTML({ face = '', tool = true } = {}){
  return `<div class="bor-textblock"></div>
<div class="bor-board">
  <div class="bor-face bor-back"></div>
  <div class="bor-edge"></div>
  <div class="bor-face bor-front">
    ${tool ? toolHTML() : ''}
    ${face}
  </div>
  <div class="bor-spine"><i style="top:13%"></i><i style="top:34%"></i><i style="top:55%"></i><i style="top:76%"></i></div>
</div>`;
}

/** Frame a page the reader is inside. Returns the element so a caller
 *  can take it away again. */
export function mountPageFrame(target = document.body){
  ensureCss();
  const d = document.createElement('div');
  d.innerHTML = toolHTML({ page: true });
  const el = d.firstElementChild;
  target.appendChild(el);
  return el;
}

/** Does this reader want stillness? Asked at the moment of use rather
 *  than cached, because it can change while the app is open. */
export const reducedMotion = () =>
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------
   CLOSING THE BOOK
   ------------------------------------------------------------------
   Leaving a chapter should read as the page being closed or turned back
   — the reverse of the way in. The way in already exists and already
   carries real thickness: the cover's board, with two faces and a
   fore-edge, swinging on its spine. So the exit is THAT, run backwards,
   and not a second mechanism.

   The chapter's own canvas is left underneath and untouched. A snapshot
   would be the obvious alternative and is worse: PageTurn's snapshot
   costs a backing store the size of the viewport, and the board here
   covers the frame within a couple of hundred milliseconds anyway.

   The board starts OPEN (rotateY(-158deg), lying back against its own
   hinge, which is where the cover's opening animation leaves it) and
   closes to 0. So the reader sees the inside of the board sweep across,
   turn over, and present the cover — the page coming back.
   ------------------------------------------------------------------ */

let closing = false;

/**
 * @param {object}   o
 * @param {Function} o.then  called once the board is shut. Navigate here.
 * @param {number}   o.ms    duration. Punctuation, so short by default.
 * @param {string}   o.face  optional markup for the front face.
 */
export function closeBook({ then = () => {}, ms = 760, face = '' } = {}){
  // A second press must not start a second board. It must also not
  // SWALLOW the navigation, which is the trap: a reader who taps twice
  // would otherwise sit on a chapter that is already leaving.
  if(closing) return;
  closing = true;

  // Stillness asked for is stillness given. There is nothing in the turn
  // a reader needs, so it is skipped outright rather than shortened.
  if(reducedMotion()){ then(); return; }

  ensureCss();
  const stage = document.createElement('div');
  stage.className = 'bor-stage bor-closing bor-open';
  stage.style.setProperty('--bor-close-ms', ms + 'ms');
  stage.innerHTML = `<div class="bor-book">${boardHTML({ face })}</div>`;
  document.body.appendChild(stage);

  // If the sheet is somehow still in flight, the board is not open yet
  // and there is nothing to animate FROM. Rather than show a board that
  // appears already shut, leave immediately: an instant exit is a worse
  // transition but it is not a broken one. Chapters avoid this by
  // calling ensureCss() when they wire their exits.
  if(!cssReady()){ then(); closing = false; stage.remove(); return; }

  /* FLUSH THE OPEN STATE SYNCHRONOUSLY, DO NOT WAIT FOR A FRAME.
     The transition needs the open transform to be the committed
     starting style before the class comes off. The obvious way to get
     that is to wait a frame or two with requestAnimationFrame — and it
     is wrong, because a page that is not being painted gets NO rAF
     callbacks at all. Measured: through a hidden browser pane the board
     mounted correctly and then sat at rotateY(-158deg) for the whole
     duration, because the callback never ran. It degraded to an instant
     exit rather than a stuck page, which is the right way round, but it
     also meant the turn could not be verified.

     Reading offsetWidth forces a style and layout flush right now, with
     no dependence on the compositor scheduling anything. */
  void stage.offsetWidth;
  stage.classList.remove('bor-open');
  stage.classList.add('shut');

  // A transitionend that never arrives would strand the reader on a
  // chapter with a cover over it, so the timer is the authority and
  // transitionend is not consulted at all. The same reasoning as the
  // gate: the thing that must happen is the navigation.
  setTimeout(() => { try { then(); } finally { closing = false; } }, ms + 40);
}

/** For a chapter: turn every "back to the book" link into a page turn,
 *  without each chapter having to know how. Returns the number of links
 *  wired, so a chapter can assert it found them — four silently unlinked
 *  shaders have shipped in this project and a silently unwired link is
 *  the same failure in a different medium. */
export function wireExits(selector = 'a[href*="#contents"]', opts = {}){
  // Load the sheet NOW, at boot, not at the moment of leaving: a <link>
  // appended to the head loads asynchronously, and a board whose CSS has
  // not arrived is a board that is not open.
  ensureCss();
  const links = [...document.querySelectorAll(selector)];
  for(const a of links){
    a.addEventListener('click', e => {
      if(e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;  // let the reader open a new tab
      e.preventDefault();
      const href = a.getAttribute('href');
      closeBook({ ...opts, then: () => { location.href = href; } });
    });
  }
  return links.length;
}
