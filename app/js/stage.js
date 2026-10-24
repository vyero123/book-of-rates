/* The Book of Rates — THE 3-D RUNTIME SHELL.
 *
 * Everything a 3-D chapter needs around its scene and does not want to
 * write again: WebGL detection and a graceful absence, loading three off
 * the CDN, a renderer with the pixel ratio capped, resize and orientation,
 * the frame clock, pause-on-hidden, context loss and restore, the fps
 * readout, the remembered protocol choice, and the warning-scroll hookup.
 *
 * None of it is clever. All of it is load-bearing, and most of it is here
 * because getting it wrong once cost an afternoon:
 *
 *  - DPR is capped at 1.5. A phone reporting 3 renders nine times the
 *    pixels for a picture made of flat posterised shapes, which have no
 *    detail to resolve. This is the single biggest perf lever in the kit.
 *  - the loop is CANCELLED on `visibilitychange`, not merely skipped.
 *    An animation left requesting frames behind a hidden tab is the same
 *    class of discourtesy as audio left playing.
 *  - `webglcontextlost` must preventDefault() or the context never comes
 *    back, and the loop must be stopped before it tries to render into a
 *    dead context.
 *  - the scroll hookup has exactly one contract, stated at the bottom,
 *    and violating it once produced infinite recursion that looked like a
 *    frozen breath because the render loop kept drawing.
 */

/** §4.2 has nothing to say about pixel ratio; the frame budget does. */
export const DPR_CAP = 1.5;

/* ------------------------------------------------------------------
   Getting off the ground
   ------------------------------------------------------------------ */

export function webglOk(){
  try{
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl'));
  }catch(e){ return false; }
}

/** Detect, load, start — and say something useful on each of the three
 *  ways it can fail. `fallback(why)` is the chapter's own absent-WebGL
 *  panel; the 2-D prototypes do the same job without it, so a chapter is
 *  never the only way in. The throw after the fallback is deliberate: the
 *  reader has been told, and the console should still carry the stack. */
export async function boot({ cdn, fallback, start }){
  if(!webglOk()){
    fallback('This browser could not give the page a WebGL context, so the 3-D scene cannot be drawn.');
    return;
  }
  let THREE;
  try{ THREE = await import(cdn); }
  catch(e){
    fallback('The 3-D library could not be loaded from the network, so the scene cannot be drawn.');
    return;
  }
  try{ start(THREE); }
  catch(e){
    fallback('The 3-D scene failed to start: ' + (e && e.message ? e.message : e));
    throw e;
  }
}

/* ------------------------------------------------------------------
   Renderer, scene, camera, and the fit
   ------------------------------------------------------------------ */

/** No shadow maps, no postprocessing, no tone mapping, no stencil. The
 *  look is flat unlit colour by design (§4.2 rule 1), so every one of
 *  those is cost with nothing to show for it.
 *
 *  `fov` may be a function of aspect: the chapters want a wider lens on a
 *  tall phone than on a landscape tablet, and the project is mobile-first
 *  at 375 px, so the portrait value is the real one and the other is the
 *  accommodation. */
export function stage(THREE, { canvas, clear, fov, near = 0.1, far = 400, dprCap = DPR_CAP }){
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias:true, alpha:false, powerPreference:'high-performance',
    stencil:false, depth:true
  });
  renderer.shadowMap.enabled = false;
  renderer.setClearColor(clear, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, near, far);
  const size = { W: 1, H: 1 };
  const fits = [];

  function resize(){
    size.W = Math.max(1, window.innerWidth);
    size.H = Math.max(1, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
    renderer.setSize(size.W, size.H, false);
    camera.aspect = size.W / size.H;
    camera.fov = typeof fov === 'function' ? fov(camera.aspect) : fov;
    camera.updateProjectionMatrix();
    for(const cb of fits) cb(size, camera);
  }
  window.addEventListener('resize', resize, { passive:true });
  // orientationchange fires before the new innerWidth is readable on iOS
  window.addEventListener('orientationchange', () => setTimeout(resize, 120), { passive:true });
  resize();

  /** Register something that depends on the viewport — an aspect uniform,
   *  a layout constant. REGISTERED, not passed to stage(), because the
   *  first fit happens inside stage() itself: a callback handed in as an
   *  option would run before the uniforms it writes to had been declared,
   *  and a `const` read in its own temporal dead zone throws. Each
   *  callback is invoked once on registration so the caller does not have
   *  to prime it by hand. */
  function onFit(cb){ fits.push(cb); cb(size, camera); }

  return { renderer, scene, camera, size, resize, onFit };
}

/* ------------------------------------------------------------------
   The clock
   ------------------------------------------------------------------ */

/** One rAF loop, with dt clamped so a backgrounded tab cannot return and
 *  advance the breath by four seconds in one frame.
 *
 *  `frame(dt, now, running)` is called every frame, running or not, so the
 *  chapter can keep its fps readout honest while paused instead of letting
 *  it report the last live number for ever.
 */
export function clock(frame){
  let rafId = 0, last = performance.now(), running = true;

  function tick(now){
    rafId = requestAnimationFrame(tick);
    let dt = (now - last) / 1000; last = now;
    if(dt > 0.05) dt = 0.05;
    frame(dt, now, running);
  }

  const api = {
    start(){ if(!rafId){ last = performance.now(); rafId = requestAnimationFrame(tick); } },
    stop(){ if(rafId){ cancelAnimationFrame(rafId); rafId = 0; } },
    /** after any pause, so the first live frame is not a four-second dt */
    resync(){ last = performance.now(); },
    get running(){ return running; },
    set running(v){ running = v; if(v) api.resync(); },

    /** Run the frame body n times at a fixed dt, WITHOUT requestAnimationFrame.
     *
     *  This exists for one specific reason. These chapters are inspected
     *  through a browser pane that is hidden between tool calls, and a
     *  hidden pane gets NO rAF callbacks at all — a freshly registered
     *  one fires zero times in a second, which is how you tell it is the
     *  instrument and not the app. The consequence is that everything
     *  inside the frame body — the camera, the uniform writes, the
     *  per-phase branches — is the one part of a chapter that cannot be
     *  reached from a tool call, and a throw in there is invisible,
     *  because a dead control path behind a stalled loop looks exactly
     *  like a stalled loop.
     *
     *  So: a way to execute the real frame body on demand, with a
     *  deterministic dt. Not a test double — it calls the same function
     *  rAF calls, so what it exercises is what ships.
     */
    pump(dt = 1/60, n = 1){
      for(let i = 0; i < n; i++) frame(dt, performance.now(), running);
      return n;
    }
  };

  document.addEventListener('visibilitychange', () => {
    if(document.hidden) api.stop(); else { api.resync(); api.start(); }
  });

  return api;
}

/** Stop the loop on context loss, resize and restart on restore.
 *  preventDefault() is what makes the restore event ever arrive. */
export function contextGuard(canvas, { onLost, onRestored }){
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); onLost(); }, false);
  canvas.addEventListener('webglcontextrestored', () => onRestored(), false);
}

/* ------------------------------------------------------------------
   The fps readout
   ------------------------------------------------------------------ */

/** Averaged over half a second, and reporting the size and pixel ratio
 *  alongside, because a frame rate without them says nothing: 60 fps at
 *  DPR 1 on a 375-wide viewport and 60 fps at DPR 1.5 are different
 *  results. Tapping it hides it behind an invisible dot that brings it
 *  back, so it can be dismissed for a screenshot without a settings trip.
 *
 *  It measures and it is not a judgement. A frame rate says the scene
 *  draws; it says nothing about whether the scene is any good.
 */
export function fps({ el, dot, renderer, size }){
  let acc = 0, n = 0, lastReport = performance.now(), prev = performance.now();

  if(el && dot){
    el.addEventListener('click', () => { el.classList.add('off'); dot.classList.add('on'); });
    dot.addEventListener('click', () => { el.classList.remove('off'); dot.classList.remove('on'); });
  }

  return function tick(now, idle){
    const d = now - prev; prev = now;
    if(!idle && d > 0){ acc += d; n++; }
    if(now - lastReport > 500){
      const v = n ? (1000 / (acc / n)) : 0;
      el.textContent = (idle ? 'paused' : v.toFixed(0) + ' fps')
        + '\n' + size.W + '×' + size.H + ' @' + renderer.getPixelRatio().toFixed(2);
      acc = 0; n = 0; lastReport = now;
    }
  };
}

/* ------------------------------------------------------------------
   The remembered choice
   ------------------------------------------------------------------ */

/** Which protocol the reader picked, kept per device.
 *
 *  Every path throws in private browsing, and every catch here fails
 *  TOWARDS asking again, which is the safe direction: the cost of asking
 *  a second time is one tap, and the cost of silently assuming is that
 *  somebody gets holds they did not choose.
 */
export function choice({ key, valid }){
  return {
    read(){
      try{
        const raw = localStorage.getItem(key);
        const v = raw ? JSON.parse(raw) : null;
        return (v && valid(v.choice)) ? v : null;
      }catch(e){ return null; }
    },
    write(c){
      try{ localStorage.setItem(key, JSON.stringify({ choice:c, at:new Date().toISOString() })); }
      catch(e){ /* not persisted; it will ask next time, which is safe */ }
    },
    clear(){ try{ localStorage.removeItem(key); }catch(e){} }
  };
}

/* ------------------------------------------------------------------
   The way in
   ------------------------------------------------------------------ */

/** The warning scroll, then the chapter.
 *
 *  `requireScroll` returns TRUE when it has opened the scroll and will run
 *  the callback on dismissal, and FALSE when the scroll has been seen
 *  before and the caller should simply continue. IT MUST NEVER DO BOTH.
 *
 *  js/gate.js once invoked the callback in the already-seen case as well
 *  as returning false, so `begin()` re-entered itself until the stack
 *  overflowed — and because the render loop kept drawing from its idle
 *  path, the symptom was a breath that looked stuck rather than an error.
 *  This wrapper exists so there is exactly one place in the project where
 *  that contract is spelled out and obeyed.
 */
export function enter(requireScroll, next){
  if(!requireScroll(next)) next();
}
