/* The Book of Rates — DEEP LIGHT AS THE BOOK'S BACKGROUND.
 *
 * The water column from chapter six, running behind the cover and the
 * contents. Not the chapter: an IDLE VARIANT, which is a different thing
 * and is built differently on purpose.
 *
 * ===================================================================
 * THE HONEST COST, UP FRONT
 * ===================================================================
 * A WebGL scene running permanently behind the UI is a battery and
 * thermal question, not an fps question. A phone that holds 60 fps while
 * getting warm is not passing — it is failing slowly. So the budget here
 * is not "does it hit 60", it is "how much work does it do per second
 * of a reader sitting on the contents page deciding what to open", and
 * every decision below is spending against that:
 *
 *  - IT RUNS AT 20 fps, not 60. A slow drift behind a scrim has nothing
 *    to say at 60 Hz. This is a straight two-thirds cut in GPU work and
 *    it is the single biggest lever here. The rAF callback still fires
 *    at display rate and returns immediately; the render does not.
 *  - DPR IS CAPPED AT 1.0, not the kit's 1.5. The scene sits behind a
 *    scrim at up to 80% opacity and is made of flat posterised shapes
 *    with no detail to resolve. On a phone reporting 3 this is a ninefold
 *    cut in pixels against the naive case.
 *  - NOTHING IS WRITTEN PER FRAME. The chapter's kelp, fish and bubbles
 *    all move; here they move in the VERTEX SHADER off one time uniform,
 *    so a frame is four uniform writes and four draw calls, with no
 *    buffer uploads and no particle pool stepping on the CPU.
 *  - THE EXPENSIVE LAYERS ARE NOT HERE. The chapter's 54x54 surface
 *    plane, its 40x40 seabed, its coral, its sea stacks, its birds, its
 *    above-water world and its diver are all absent. What is left is the
 *    column, the ridges, the kelp, some fish and some bubbles.
 *  - IT STOPS. Hidden tab, reduced-motion, navigation away, or the
 *    reader turning it off — see `stop()` and the notes at the bottom.
 *
 * WHAT IT REPLACES MATTERS TOO, and is the part that makes this a
 * defensible trade rather than a new cost. The page already ran a 2-D
 * canvas background every frame at 60 Hz: a full scene draw over a
 * ~900,000-pixel canvas plus a full-canvas grain pattern fill on top of
 * it, which is a large per-frame fill in software. Measure both before
 * believing either — app/index.html keeps a `__bor.bg` hook for exactly
 * that — but the shape of it is that this is cheaper, not dearer.
 *
 * IF IT IS NOT CHEAP ENOUGH ON A GIVEN DEVICE there is no heroic
 * fallback logic here, because a background that measures itself and
 * changes its mind is worse than one that can be switched off. The
 * reader gets a switch, reduced-motion gets honoured, and a browser with
 * no WebGL keeps the 2-D background it always had.
 *
 * NO PROTOCOL RUNS HERE. There is no breath, no cue, no session and no
 * diver. The book's background must never look like a thing you are
 * supposed to be breathing along with: a reader on the contents page is
 * choosing, not practising, and pacing them while they choose would be
 * the app leading a practice nobody started.
 */

import { ramp, RAMP_GLSL, GRAIN_GLSL, fogGlsl,
         PALE, LIGHT, MID, BODY, DEEP, DARK } from './palette.js';
import { builder, bands, posterMat, screenQuad, linkReport } from './mesh.js';
import { stage, clock, contextGuard, webglOk } from './stage.js';

/** Chapter six's own ramp, unchanged, because this is meant to read as
 *  that place and not as a tint of it. */
export const R = ramp([0xD8F0E6, 0x93CFC6, 0x4E9C9E, 0x246E78, 0x103C4C, 0x08202C]);

export const PAL = {
  ridgeFar:0x4E8E92, ridgeMid:0x27606C, ridgeNear:0x16203A,
  fish:0xB4DCD2, fishDark:0x2A5560, bubble:0xDFF3EC, cream:0xF2E3C8,
  kelpA:0x1B1C3C
};

const BED_Y = -17;

/** 20 frames a second. Named, because the number is the argument. */
export const IDLE_FPS = 20;
/** 1.0, not the kit's 1.5: this sits behind a scrim. */
export const IDLE_DPR = 1.0;

export const reducedMotion = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  catch(e){ return false; }
};

/** Build and run the idle column on `canvas`.
 *
 *  Returns a handle with start/stop/dispose, a `bench` for measuring it
 *  honestly on a real device, and `info` so a caller can report what it
 *  actually built rather than what it meant to build.
 *
 *  THREE is passed in: the library arrives by dynamic import at boot
 *  (stage.js), so nothing here imports it at the top level.
 */
export function deepLightIdle(THREE, { canvas, fps = IDLE_FPS, dpr = IDLE_DPR,
                                       still = false } = {}){
  const C = h => new THREE.Color(h);
  const ramp6 = R.steps.map(C);

  const uTime = { value: 0 };
  const uRamp = { value: ramp6 };
  const uFog  = { value: C(R.at(BODY)) };
  const uAspect = { value: 1 };

  /* A shorter fog than the chapter's: the idle column is shallower and
     the far ridges should still be readable as separate things. */
  const FOG = fogGlsl({ near: 8, rate: 0.026, steps: 5, max: 0.50 });

  const { renderer, scene, camera, size, resize, onFit } = stage(THREE, {
    canvas, clear: R.at(DARK), fov: a => a < 0.75 ? 60 : 50, far: 260, dprCap: dpr
  });
  onFit(() => { uAspect.value = camera.aspect; });

  /* ----------------------------------------------------------------
     1. THE COLUMN. One full-screen fragment: the chapter's own vertical
     ramp, with its light shafts folded into the same shader instead of
     being their own additive plane. Two draw calls become one, and the
     shafts stop costing a transparent full-width pass.
     ---------------------------------------------------------------- */
  scene.add(screenQuad(THREE, {
    uniforms:{ uTime, uRamp, uAspect, uCream:{ value: C(PAL.cream) } },
    prelude: RAMP_GLSL + GRAIN_GLSL,
    fragment:`
      varying vec2 vUv;
      uniform float uTime, uAspect;
      uniform vec3 uCream;
      void main(){
        // pale overhead, dark below — the chapter's structure exactly
        float y = clamp((1.0 - vUv.y) * 0.78 + 0.06, 0.0, 1.0);
        vec3 col = rampPick(y);

        // the shafts, as hard steps rather than a soft wedge
        float x = (vUv.x - 0.5) * uAspect * 6.0 + (1.0 - vUv.y) * 1.3;
        float s = (sin(x * 1.7 + uTime * 0.035) * 0.5 + 0.5)
                * (sin(x * 0.7 - uTime * 0.022 + 1.9) * 0.5 + 0.5);
        s = floor(clamp((s - 0.34) / 0.44, 0.0, 0.999) * 3.0) / 2.0;
        col = mix(col, uCream, s * 0.085 * smoothstep(0.0, 0.55, vUv.y));

        col += (grainAt(vUv * 520.0) - 0.5) * 0.020;
        gl_FragColor = vec4(col, 1.0);
      }
    `
  }));

  /* ----------------------------------------------------------------
     2. RIDGES — the kit's parallax band pattern, hand-assigned tiers.
     ---------------------------------------------------------------- */
  const ridges = new THREE.Mesh(bands(THREE, [
    { z:-120, base: -2, amp: 6.0, step:2.5, seed:5,  tier:2 },
    { z: -78, base: -6, amp: 4.5, step:2.0, seed:17, tier:3 },
    { z: -46, base:-10, amp: 3.0, step:1.5, seed:29, tier:4 }
  ], { n: 30, span: 260, skirt: -40 }), posterMat(THREE, {
    uniforms:{ uRamp, uHaze:{ value: C(PAL.ridgeMid) } }, prelude: RAMP_GLSL,
    vertex:`
      attribute float aTier; varying float vTier;
      void main(){ vTier = aTier;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragment:`
      varying float vTier; uniform vec3 uHaze;
      void main(){
        vec3 col = rampPick((vTier + 0.5) / 6.0);
        gl_FragColor = vec4(mix(col, uHaze, (4.0 - vTier) / 3.0 * 0.45), 1.0);
      }
    `
  }));
  scene.add(ridges);

  /* ----------------------------------------------------------------
     3. KELP — fourteen strands, one mesh, swaying in the vertex shader.
     The chapter has twenty-two at ten segments; this has fourteen at
     seven, which is the same picture at this scale behind a scrim.
     ---------------------------------------------------------------- */
  function kelpGeometry(n, seg){
    const b = builder(THREE, { aH:1, aPhase:1, aSide:1 });
    for(let i = 0; i < n; i++){
      const ang = (i / n) * Math.PI * 2 + (i * 2.399);
      const rad = 7 + ((i * 7919) % 97) / 97 * 14;
      const cx = Math.cos(ang) * rad;
      let   cz = Math.sin(ang) * rad - 5;
      if(cz > -2.0) cz = -2.5 - (cz + 2.0);        // keep them off the lens
      const h = 6 + ((i * 6367) % 83) / 83 * 8.0;
      const wBase = 0.36 + ((i * 5281) % 61) / 61 * 0.5;
      const ph = (i * 1.7) % 6.283;
      for(let s = 0; s <= seg; s++){
        const f = s / seg, w = wBase * (1 - f * 0.88);
        for(const side of [-1, 1]){
          b.vertex(cx + side * w, BED_Y + 1.1 + f * h, cz, { aH:f, aPhase:ph, aSide:side });
        }
      }
      b.strip(seg, true);
    }
    return b.geometry();
  }
  scene.add(new THREE.Mesh(kelpGeometry(14, 7), posterMat(THREE, {
    uniforms:{ uTime, uFog, uA:{value:C(PAL.kelpA)}, uB:{value:C(R.at(BODY))} },
    side: THREE.DoubleSide, prelude: FOG,
    vertex:`
      attribute float aH; attribute float aPhase; attribute float aSide;
      uniform float uTime;
      varying float vH; varying float vSide; varying float vDist;
      void main(){
        vec3 p = position;
        float bend = aH * aH;
        // slower than the chapter's: this is drift, not a current
        p.x += sin(uTime * 0.21 + aPhase) * bend * 1.15;
        p.z += cos(uTime * 0.17 + aPhase * 1.7) * bend * 0.8;
        vH = aH; vSide = aSide;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vDist = -mv.z;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragment:`
      varying float vH; varying float vSide; varying float vDist;
      uniform vec3 uA, uB;
      void main(){
        // two values per strand, split down the middle: form from value,
        // never from a line (§4.2 rule 2)
        vec3 col = mix(uA, uB, step(0.0, vSide) * 0.65 + vH * 0.2);
        gl_FragColor = vec4(mix(col, uFog, fogAmount(vDist)), 1.0);
      }
    `
  })));

  /* ----------------------------------------------------------------
     4. FISH — one merged billboard mesh. The chapter steps a school on
     the CPU; here every fish swims by a MODULO ON ITS OWN BAKED PATH in
     the vertex shader, so the whole school costs one uniform write.
     ---------------------------------------------------------------- */
  const SCHOOL = 18, SWIM = 46.0;
  function fishGeometry(n){
    const b = builder(THREE, { aCorner:2, aSeed:1, aLane:1, aDepth:1 });
    const OUT = [[-1.0,0],[0.1,0.42],[0.55,0.1],[0.55,-0.1],[0.1,-0.42]];
    for(let i = 0; i < n; i++){
      const seed = ((i * 7919) % 211) / 211;
      const lane = -3 - seed * 11;                 // height
      const depth = -8 - ((i * 6367) % 97) / 97 * 26;
      const sc = 0.5 + seed * 0.55;
      const base = b.count;
      const at = { aSeed: seed, aLane: lane, aDepth: depth };
      b.vertex(0, 0, 0, { ...at, aCorner:[0, 0] });
      for(const [cx, cy] of OUT) b.vertex(0, 0, 0, { ...at, aCorner:[cx*sc, cy*sc] });
      b.fan(OUT.length);
      void base;
    }
    return b.geometry();
  }
  scene.add(new THREE.Mesh(fishGeometry(SCHOOL), posterMat(THREE, {
    uniforms:{ uTime, uFog, uFish:{value:C(PAL.fish)}, uDark:{value:C(PAL.fishDark)} },
    side: THREE.DoubleSide, prelude: FOG,
    vertex:`
      attribute vec2 aCorner; attribute float aSeed; attribute float aLane; attribute float aDepth;
      uniform float uTime;
      varying float vUpper; varying float vDist;
      void main(){
        // the whole path is a modulo: nothing is spawned, nothing retires
        float x = mod(uTime * (0.9 + aSeed * 0.7) + aSeed * ${SWIM.toFixed(1)},
                      ${SWIM.toFixed(1)}) - ${(SWIM / 2).toFixed(1)};
        float y = aLane + sin(uTime * 0.5 + aSeed * 11.0) * 0.5;
        vec4 mv = modelViewMatrix * vec4(x, y, aDepth, 1.0);
        mv.xy += aCorner;
        vUpper = step(0.0, aCorner.y);
        vDist = -mv.z;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragment:`
      varying float vUpper; varying float vDist;
      uniform vec3 uFish, uDark;
      void main(){
        // dark back, pale belly: two values, one hard edge
        vec3 col = mix(uFish, uDark, vUpper);
        gl_FragColor = vec4(mix(col, uFog, fogAmount(vDist)), 1.0);
      }
    `
  })));

  /* ----------------------------------------------------------------
     5. BUBBLES — same trick, rising by modulo. The chapter uses the
     kit's particle pool, which rewrites a buffer every frame; a
     background cannot justify that and does not need it, because these
     come from nothing in particular and are not answering anybody.
     ---------------------------------------------------------------- */
  const RISE = 24.0;
  /* aCorner stays a UNIT corner and the radius rides along in aR, so the
     fragment shader can test `length(vC)` against 1 and get a ring at
     any size. Baking the radius into the corner instead makes every
     bubble a different distance from its own centre in the varying, and
     the ring test then has nothing constant to compare against. */
  function bubbleGeometry(n){
    const b = builder(THREE, { aCorner:2, aSeed:1, aR:1, aCol:3 });
    for(let i = 0; i < n; i++){
      const seed = ((i * 5281) % 199) / 199;
      const x = (((i * 2311) % 101) / 101 - 0.5) * 26;
      const z = -6 - ((i * 1933) % 89) / 89 * 22;
      const r = 0.055 + seed * 0.10;
      const base = b.count;
      const at = { aSeed: seed, aR: r, aCol: [x, 0, z] };
      for(const [cx, cy] of [[-1,-1],[1,-1],[1,1],[-1,1]]){
        b.vertex(0, 0, 0, { ...at, aCorner:[cx, cy] });
      }
      b.tri(base, base+1, base+2); b.tri(base, base+2, base+3);
    }
    return b.geometry();
  }
  scene.add(new THREE.Mesh(bubbleGeometry(36), posterMat(THREE, {
    uniforms:{ uTime, uBub:{ value: C(PAL.bubble) } },
    transparent:true, depthWrite:false, side:THREE.DoubleSide,
    vertex:`
      attribute vec2 aCorner; attribute float aSeed; attribute float aR; attribute vec3 aCol;
      uniform float uTime;
      varying vec2 vC; varying float vA;
      void main(){
        float y = mod(uTime * (0.55 + aSeed * 0.5) + aSeed * ${RISE.toFixed(1)},
                      ${RISE.toFixed(1)}) - 18.0;
        vec3 p = vec3(aCol.x + sin(y * 0.6 + aSeed * 9.0) * 0.28, y, aCol.z);
        vC = aCorner;
        // fade out the last couple of metres rather than popping
        vA = 0.42 * (1.0 - smoothstep(2.0, 5.0, y));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        mv.xy += aCorner * aR;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragment:`
      varying vec2 vC; varying float vA;
      uniform vec3 uBub;
      void main(){
        if(vA < 0.02) discard;
        float d = length(vC);
        // a ring, not a disc, and hard-edged
        gl_FragColor = vec4(uBub, vA * step(d, 1.0) * (1.0 - step(d, 0.62)));
      }
    `
  })));

  /* ----------------------------------------------------------------
     The camera: a fixed lens with a very slow drift, so there is
     parallax without anything happening. `still` freezes it entirely
     for prefers-reduced-motion.
     ---------------------------------------------------------------- */
  function place(t){
    const a = still ? 0 : t;
    camera.position.set(Math.sin(a * 0.035) * 1.6, -5.5 + Math.sin(a * 0.027) * 0.9, 12);
    camera.up.set(0, 1, 0);
    camera.lookAt(Math.sin(a * 0.021) * 0.8, -6.2, -18);
  }

  /* ----------------------------------------------------------------
     The clock, CAPPED. The rAF callback still fires at display rate —
     it has to, there is no cheaper way to stay in step with vsync — but
     it returns in a few microseconds unless enough time has passed.
     The GPU work is what costs, and that is what this cuts.
     ---------------------------------------------------------------- */
  let t = 0, acc = 0, rendered = 0, dead = false;
  const period = 1 / fps;
  const loop = clock((dt, now, running) => {
    /* A rAF callback can already be queued when dispose() runs, and
       rendering into a disposed renderer throws
       "Cannot read properties of null (reading 'precision')" out of
       three's own program cache. Seen in the console while switching
       the background setting. loop.stop() cancels the next frame, not
       the one in flight; this flag catches that one. */
    if(dead || !running) return;
    /* REDUCED MOTION IS A STILL, NOT A SLOW ONE. `still` freezes the
       clock as well as the camera and the loop stops itself after one
       frame: a reader who has asked the OS for less motion is not asking
       for the same scene at a lower frame rate, and leaving the shaders
       advancing would have kept the kelp, the fish and the bubbles all
       moving while only the lens held still. The picture is the same
       picture; it simply does not move. */
    if(still){
      uTime.value = 4.0;        // a moment with the school mid-frame
      place(0);
      renderer.render(scene, camera);
      rendered++;
      loop.stop();
      return;
    }
    t += dt; acc += dt;
    if(acc < period) return;
    acc = 0;
    uTime.value = t;
    place(t);
    renderer.render(scene, camera);
    rendered++;
  });

  contextGuard(canvas, {
    onLost(){ loop.stop(); },
    onRestored(){ resize(); loop.resync(); loop.start(); }
  });

  const handle = {
    start(){ loop.resync(); loop.start(); },
    stop(){ loop.stop(); },
    /** Give the GPU everything back. Called on pagehide, because iOS can
     *  keep this document alive in the back/forward cache while the next
     *  page allocates its own surfaces, and two live contexts at once is
     *  exactly what gets a tab killed. */
    dispose(){
      dead = true;
      loop.stop();
      scene.traverse(o => {
        if(o.geometry) o.geometry.dispose();
        if(o.material) o.material.dispose();
      });
      renderer.dispose();
      try { renderer.forceContextLoss(); } catch(e){ /* not everywhere */ }
    },
    resize,
    /** every shader in here, and whether it linked */
    links(){ return linkReport(renderer, scene, camera); },
    /** Drive the real frame body without rAF — a hidden browser pane
     *  gets no rAF callbacks at all. See clock().pump in stage.js. */
    pump(dt, n){ return loop.pump(dt, n); },
    get framesRendered(){ return rendered; },
    get info(){
      return { fpsCap: fps, dprCap: dpr, still,
               pixelRatio: renderer.getPixelRatio(),
               size: [size.W, size.H],
               drawCalls: renderer.info.render.calls,
               triangles: renderer.info.render.triangles };
    },
    /** Measure it on the device rather than asserting it. */
    bench(n = 30){
      const gl = renderer.getContext();
      renderer.render(scene, camera); gl.finish();
      const s = performance.now();
      for(let i = 0; i < n; i++) renderer.render(scene, camera);
      gl.finish();
      const ms = (performance.now() - s) / n;
      return { msPerRender: ms, n,
               msPerSecondOfIdle: ms * fps,
               drawCalls: renderer.info.render.calls,
               triangles: renderer.info.render.triangles };
    }
  };
  place(0);
  return handle;
}

export { webglOk };
