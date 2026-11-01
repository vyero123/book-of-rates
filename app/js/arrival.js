/* The Book of Rates — ARRIVING IN A CHAPTER.
 *
 * Choosing a chapter should read as falling into it rather than as a cut.
 *
 * THE SCENE DOES IT, NOT AN OVERLAY. A wipe or a fade over the top is a
 * picture of a transition; a camera that starts back and rushes in is
 * the transition, because it is the chapter's own world moving. It also
 * costs nothing: no snapshot, no second canvas, no extra draw call — one
 * translate and one rotate on a camera that was going to be written
 * every frame anyway.
 *
 * HOW IT ATTACHES. Every chapter sets its camera from scratch each frame
 * (position, then lookAt). This runs immediately after that and before
 * the uniform writes that read the camera, so the shaders see the camera
 * that is actually used to render. It is relative, never cumulative:
 * each frame it displaces the pose the chapter just computed, by an
 * amount that decays to nothing.
 *
 * IT IS PUNCTUATION, NOT A CUTSCENE. Default 700 ms, and the last third
 * of that is already within a few percent of the resting pose. A
 * transition you can be bored by has failed at being one.
 *
 * REDUCED MOTION IS HONOURED BY BEING INERT. There is nothing in the
 * rush a reader needs to know, so asked for stillness it does not
 * happen at all — `apply` returns immediately and the first frame is the
 * chapter's own. Not a shortened version: none.
 */

const easeOut = x => 1 - Math.pow(1 - x, 3);

const stillness = () =>
  typeof window !== 'undefined' && window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * @param {object} o
 * @param {number} o.dist  how far back the lens starts, in the chapter's
 *                         own units. Roughly "one more of whatever the
 *                         camera already trails by" reads as falling in
 *                         rather than as a zoom.
 * @param {number} o.ms    how long the fall lasts.
 * @param {number} o.pitch radians of nose-up at the start, settling to 0.
 *                         Small: this is the difference between falling
 *                         and sliding, and more than about 0.1 is a lurch.
 * @param {Function} o.still  injectable for testing; defaults to the
 *                         media query. A test that cannot set the
 *                         reduced-motion branch cannot check it.
 */
export function arrival({ dist = 14, ms = 700, pitch = 0.06, still = stillness } = {}){
  let t0 = 0, running = false, inert = false;

  const api = {
    /** Begin the fall. Called when the chapter actually starts — after
     *  the scroll and the protocol choice — because a rush-in played
     *  behind a sheet is a rush-in nobody saw. */
    start(now = performance.now()){
      inert = !!still();
      if(inert){ running = false; return false; }
      t0 = now; running = true; return true;
    },

    /** Displace the pose the chapter just set. Call once per frame,
     *  straight after the chapter's own camera.lookAt(), and before
     *  anything that reads camera.position.
     *  @returns {number} 0..1, how much of the fall is left. 0 means
     *  nothing was done, so a caller can assert it ever ran. */
    apply(camera, now = performance.now()){
      if(!running) return 0;
      const e = (now - t0) / ms;
      if(e >= 1){ running = false; return 0; }
      const k = 1 - easeOut(Math.max(0, e));
      camera.translateZ(dist * k);
      camera.rotateX(pitch * k);
      return k;
    },

    /** Land immediately. For a context loss, a resume, or a chapter that
     *  decides the reader has waited long enough. */
    skip(){ running = false; },

    get running(){ return running; },
    get inert(){ return inert; }
  };
  return api;
}

/* ------------------------------------------------------------------
   THE OTHER HALF, IN THE CONTENTS
   ------------------------------------------------------------------
   The chapter's camera covers the second half of the fall. The first
   half belongs to the list: the row the reader chose comes toward them
   and the rest of the book drops away behind it.

   It is deliberately SHORT — shorter than the camera's half — because
   it is also dead time. The chapter page is loading underneath it, so
   the only thing this can cost is the part of the load it hides.
   ------------------------------------------------------------------ */

/** Wire a container of links so that choosing one falls into it.
 *  @returns {number} how many links were wired. Checked by the caller:
 *  a silently unwired link is the same class of fault as a silently
 *  unlinked shader, and this project has shipped four of those. */
export function fallIntoChapter(container, { ms = 260, selector = 'a.entry' } = {}){
  const links = [...container.querySelectorAll(selector)];
  for(const a of links){
    a.addEventListener('click', e => {
      if(e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      const href = a.getAttribute('href');
      if(!href) return;
      if(stillness()) return;              // let the plain navigation happen
      e.preventDefault();
      container.classList.add('falling');
      a.classList.add('chosen');
      // The timer navigates, not transitionend: a transition that never
      // fires would strand the reader on a list that has already left.
      setTimeout(() => { location.href = href; }, ms);
    });
  }
  return links.length;
}
