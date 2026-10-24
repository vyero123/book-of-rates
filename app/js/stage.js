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
   TWO INSTRUMENTS FOR FAULTS THAT ARE INVISIBLE TO A SCREENSHOT
   ------------------------------------------------------------------
   A chapter was reported as flashing a different scene in about once a
   second. The first hypothesis was two things drawing to one surface —
   a second render loop, or the book's background still alive behind a
   chapter. It was neither, and it took four wrong measurements to find
   that out, so both the suspicion and the real cause now have an
   instrument instead of an argument.

   soloReport() answers the first: how many renderers and how many
   render loops exist in this document. stage() and clock() count
   themselves, so nothing has to remember to register.

   flashMeter() answers the second, and is the one that found it: drive
   the REAL frame body, read the frame back each time, and report the
   discontinuity BETWEEN frames. Every individual frame was correct, so
   a screenshot showed nothing; nothing was drawn twice, so draw-call
   counts showed nothing. The fault only exists in the difference.
   ------------------------------------------------------------------ */
const LIVE = { renderers: 0, loops: 0 };

/** How many renderers and loops this document has made. Exactly one of
 *  each is the only healthy answer for a chapter page. */
export function soloReport(){
  const canvases = typeof document === 'undefined' ? []
    : [...document.querySelectorAll('canvas')].map(c => {
        const kinds = [];
        for(const k of ['webgl2','webgl','2d','bitmaprenderer']){
          try { if(c.getContext(k)) kinds.push(k); } catch(e){}
        }
        return { id: c.id || '(none)', kinds };
      });
  const drawing = canvases.filter(c => c.kinds.length);
  return {
    renderers: LIVE.renderers, loops: LIVE.loops,
    canvasesWithAContext: drawing.length, canvases: drawing,
    ok: LIVE.renderers === 1 && LIVE.loops === 1 && drawing.length === 1
  };
}

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
  LIVE.renderers++;
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
  LIVE.loops++;
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

/* ------------------------------------------------------------------
   THE FLASH METER
   ------------------------------------------------------------------
   Drive the real frame body, read each frame back, and report how much
   the picture changes BETWEEN consecutive frames.

   This is the instrument that found Long Air's reported fault, after
   four measurements that were wrong for four different reasons, every
   one of them mine:

     - sampling a 1x1 drawing buffer, because the viewport emulation had
       not reached the renderer, and calling the single pixel a frame;
     - bisecting by hiding one mesh at a time while the function under
       test called begin(), which re-asserts every world mesh's
       visibility and quietly put them all back;
     - bisecting over t = 0..4 when the events were at t = 7..8;
     - trusting readPixels before proving it could tell two scenes
       apart. (It could: hiding everything gives exactly the clear
       colour. That test should have come first.)

   So: prove the instrument before using it. `prove()` below hides the
   whole scene, renders, and checks the frame really is the clear colour
   — if it is not, the readback is not reading what was just drawn and
   every number it produces is worthless.

   `coverage(mesh)` answers the follow-up a flash always raises: how
   much of the frame does ONE layer own right now? Long Air's answer was
   99.8%, which is the whole diagnosis in one number.
   ------------------------------------------------------------------ */
export function flashMeter({ renderer, scene, camera, step, canvas }){
  const gl = renderer.getContext();
  const el = canvas || renderer.domElement;
  let buf = null;
  function grid(stride = 16){
    const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
    const need = W * H * 4;
    if(!buf || buf.length < need) buf = new Uint8Array(need);
    gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    const out = [];
    for(let y = 0; y < H; y += stride) for(let x = 0; x < W; x += stride){
      const o = (y * W + x) * 4;
      out.push(buf[o], buf[o+1], buf[o+2]);
    }
    return out;
  }
  const mean = g => {
    let r = 0, b = 0, gg = 0;
    for(let i = 0; i < g.length; i += 3){ r += g[i]; gg += g[i+1]; b += g[i+2]; }
    const n = g.length / 3;
    return [r/n, gg/n, b/n];
  };
  const delta = (a, c) => Math.abs(a[0]-c[0]) + Math.abs(a[1]-c[1]) + Math.abs(a[2]-c[2]);

  return {
    /** The readback must be able to tell two scenes apart before any of
     *  its numbers mean anything. */
    prove(){
      const meshes = []; scene.traverse(o => { if(o.isMesh) meshes.push(o); });
      const was = meshes.map(o => o.visible);
      renderer.render(scene, camera); const all = mean(grid(24));
      meshes.forEach(o => o.visible = false);
      renderer.render(scene, camera); const none = mean(grid(24));
      meshes.forEach((o, i) => o.visible = was[i]);
      renderer.render(scene, camera);
      let cc = null;
      try { cc = renderer.getClearColor({ r:0, g:0, b:0 }); } catch(e){}
      return {
        withEverything: all.map(Math.round),
        withNothing: none.map(Math.round),
        expectedClear: cc ? [Math.round(cc.r*255), Math.round(cc.g*255), Math.round(cc.b*255)] : null,
        canTellThemApart: delta(all, none) > 4,
        sizedProperly: gl.drawingBufferWidth > 4 && gl.drawingBufferHeight > 4,
        buffer: [gl.drawingBufferWidth, gl.drawingBufferHeight],
        element: [el.width, el.height]
      };
    },

    /** Run `frames` of the real frame body and report the worst and
     *  typical jump between consecutive frames. `threshold` is in the
     *  same summed-channel units; a whole scene swapping scores in the
     *  tens, ordinary motion scores in single figures. */
    run({ frames = 900, warmup = 240, dt = 1/60, threshold = 25 } = {}){
      let prev = null, worst = 0, worstAt = 0, over = 0, n = 0, total = 0;
      for(let i = 0; i < frames; i++){
        step(dt, i);
        if(i < warmup) continue;
        const c = mean(grid());
        if(prev){
          const d = delta(prev, c);
          total += d; n++;
          if(d > threshold) over++;
          if(d > worst){ worst = d; worstAt = i; }
        }
        prev = c;
      }
      return { frames, worst:+worst.toFixed(1), worstAtFrame: worstAt,
               mean:+(n ? total/n : 0).toFixed(2), over, threshold,
               perSecond:+(n ? over / (n * dt) : 0).toFixed(2) };
    },

    /** What fraction of the frame does this one mesh own right now? */
    coverage(mesh){
      renderer.render(scene, camera); const withIt = grid(24);
      const was = mesh.visible; mesh.visible = false;
      renderer.render(scene, camera); const without = grid(24);
      mesh.visible = was;
      let diff = 0;
      for(let i = 0; i < withIt.length; i += 3){
        if(Math.abs(withIt[i]-without[i]) + Math.abs(withIt[i+1]-without[i+1]) > 12) diff++;
      }
      return +(diff / (withIt.length / 3)).toFixed(3);
    },

    /** The worst any single mesh covers over a run — the number that
     *  says "one layer is filling the screen". */
    peakCoverage({ frames = 420, dt = 1/60 } = {}){
      const meshes = []; scene.traverse(o => { if(o.isMesh && o.visible) meshes.push(o); });
      let peak = 0, which = null, at = 0;
      for(let i = 0; i < frames; i++){
        step(dt, i);
        if(i % 6) continue;
        for(const o of meshes){
          if(!o.visible) continue;
          const c = this.coverage(o);
          if(c > peak){ peak = c; at = i;
            which = o.geometry.getAttribute('position').count + 'v/order' + o.renderOrder; }
        }
      }
      return { peak, mesh: which, atFrame: at };
    }
  };
}
