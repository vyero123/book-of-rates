/* The Book of Rates — MERGED-MESH AND POSTERISED-MATERIAL HELPERS.
 *
 * The perf envelope for a 3-D chapter is: low draw calls, merged meshes,
 * DPR capped at 1.5, no shadow maps, no postprocessing. The first of
 * those is the one that needs tooling, because the natural way to write
 * "twenty-two strands of kelp" is twenty-two meshes, and on a phone that
 * is twenty-two draw calls for about four hundred triangles.
 *
 * So everything in a chapter that comes in quantity — ridge bands, kelp,
 * coral, sea stacks, mesas, fish, birds, speed lines, bubbles — is ONE
 * mesh with per-vertex attributes carrying whatever differs, and the
 * variation happens in the vertex shader. That is what `builder` is for.
 *
 * THREE is passed in rather than imported. The library arrives by dynamic
 * import from a CDN at boot (see stage.js), so a module that imported it
 * at the top level would either duplicate the download or fail to parse
 * offline. Everything here takes it as its first argument.
 */

/* ------------------------------------------------------------------
   The builder
   ------------------------------------------------------------------ */

/** Accumulate vertices, per-vertex attributes and indices, then hand over
 *  one BufferGeometry.
 *
 *      const b = builder(THREE, { aH:1, aPhase:1, aRoot:3 });
 *      for (const strand of strands){
 *        for (let s = 0; s <= SEG; s++){
 *          b.vertex(x - w, y, z, { aH:f, aPhase:ph, aRoot:root });
 *          b.vertex(x + w, y, z, { aH:f, aPhase:ph, aRoot:root });
 *        }
 *        b.strip(SEG, true);
 *      }
 *      scene.add(new THREE.Mesh(b.geometry(), mat));
 *
 *  `attrSpec` maps attribute name to item size. Every vertex must supply
 *  every declared attribute: a missing one used to silently pack zeros and
 *  produce one strand lying flat at the origin, which is maddening to find
 *  in a merged mesh, so it throws instead.
 */
export function builder(THREE, attrSpec = {}){
  const pos = [], idx = [];
  const names = Object.keys(attrSpec);
  const data = {};
  for(const k of names) data[k] = [];
  let n = 0;

  const api = {
    get count(){ return n; },

    vertex(x, y, z, attrs){
      pos.push(x, y, z);
      for(const k of names){
        const v = attrs ? attrs[k] : undefined;
        if(v === undefined) throw new Error('vertex is missing attribute ' + k);
        const size = attrSpec[k];
        if(size === 1) data[k].push(v);
        else for(let i = 0; i < size; i++) data[k].push(v[i]);
      }
      return n++;
    },

    tri(a, b, c){ idx.push(a, b, c); return api; },

    /** Close a ribbon out of the last 2*(segments+1) vertices pushed, which
     *  must alternate rail A, rail B, rail A, rail B...
     *
     *  `flip` reverses the winding. It matters: a ribbon drawn with the
     *  wrong winding on a FrontSide material is invisible, and the two
     *  idioms in the project genuinely differ — a ridge profile pushes
     *  top-then-bottom and a plant pushes left-then-right. */
    strip(segments, flip = false){
      const base = n - (segments + 1) * 2;
      for(let s = 0; s < segments; s++){
        const a = base + s*2, b = a+1, c = a+2, d = a+3;
        if(flip) idx.push(a, c, b,  b, c, d);
        else     idx.push(a, b, c,  b, d, c);
      }
      return api;
    },

    /** Fan the last `ring` vertices around the one before them. */
    fan(ring){
      const centre = n - ring - 1;
      for(let k = 0; k < ring; k++){
        idx.push(centre, centre + 1 + k, centre + 1 + ((k + 1) % ring));
      }
      return api;
    },

    geometry(){
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      for(const k of names){
        g.setAttribute(k, new THREE.Float32BufferAttribute(data[k], attrSpec[k]));
      }
      g.setIndex(idx);
      return g;
    }
  };
  return api;
}

/* ------------------------------------------------------------------
   The parallax background band pattern
   ------------------------------------------------------------------ */

/** Three or four hard silhouette layers at fixed depths, each a quantised
 *  profile over a wide span with a skirt dropped well below the frame.
 *
 *  This is the §4.2 rule-5 background, and two details are load-bearing:
 *
 *   - the profile height is sampled at PAIRS of columns (`q = floor(i/2)*2`)
 *     and then quantised to the layer's step, so the top edge is a flight
 *     of hard stairs rather than a polyline. A smooth profile here is the
 *     single quickest way to make the whole frame look like a gradient.
 *   - the layers do NOT follow the breath. Prototype 1 applied the breath
 *     curve to every layer and the frame read as noise. They are fixed
 *     geology drifting past; only the near-field answers the figure.
 *
 *  Each layer wants { z, base, amp, step, seed, tier }. `tier` is the
 *  hand-assigned value index (palette.js) — it is a decision, not a
 *  function of z.
 */
export function bands(THREE, layers, { n = 34, span = 150, skirt = -46, profile } = {}){
  const b = builder(THREE, { aTier: 1 });
  const shape = profile || ((L, q) =>
    L.base + Math.sin((q + L.seed) * 0.9) * L.amp
           + Math.sin((q + L.seed) * 0.31) * L.amp * 0.7);
  for(const L of layers){
    for(let i = 0; i <= n; i++){
      const x = -span/2 + (i/n) * span;
      const q = Math.floor(i / 2) * 2;
      const h = Math.round(shape(L, q, i) / L.step) * L.step;
      b.vertex(x, h,     L.z, { aTier: L.tier });
      b.vertex(x, skirt, L.z, { aTier: L.tier });
    }
    b.strip(n, false);
  }
  return b.geometry();
}

/* ------------------------------------------------------------------
   NEAR-FIELD DISSOLVE — do not let a wall sweep the lens
   ------------------------------------------------------------------
   Any chapter that flies a camera THROUGH its own scenery has this
   problem, and Long Air shipped it: the gates are walls with a hole in
   them, the camera rides thirteen metres behind the kite, and once a
   gate reaches the lens it fills the frame. Measured on the deployed
   page, a single gate covered 99.8% of the frame at its peak, about
   2.3 times a second — the whole picture flipping between "slab face"
   and "open view", which reads as a different scene flashing in.

   A screenshot cannot show it: every individual frame is correct. Draw
   call counts cannot show it: nothing is drawn twice. It is only
   visible as a DISCONTINUITY BETWEEN frames, which is why it needed a
   frame-to-frame meter to find and why one now ships (flashMeter, on
   every chapter's hook).

   The fix is to stop drawing a thing the reader has already passed,
   and to stop over a few metres rather than popping. `keep` runs 0 at
   `gone` to 1 at `full`; fragments are dropped in HARD TERRACES rather
   than stippled or faded, because a gradient here would be the one
   soft edge in a scene built entirely of hard ones (§4.2 rule 5). The
   slab comes apart into layers and the layers go.

   Opaque, so there is no transparency sorting and no cost: this is a
   discard, not a blend.

   Pick the distances from the CAMERA'S OWN LAG, not by eye. The gate
   the reader is about to fly is further away than the camera's
   trailing distance; the one dissolving is the one already behind the
   figure. Getting that backwards would dissolve gates before they were
   flown, which is a worse bug than the one being fixed.
   ------------------------------------------------------------------ */
/* IT TAKES A CELL, NOT A SCALAR, AND THAT IS THE WHOLE LESSON OF THE
   FIRST VERSION.
   The first one dissolved on one per-object scalar, and Long Air passed
   it the slab's height. That is constant along a gate's LIP — a
   horizontal strip at one height — so every lip fragment shared one
   value and the entire lip appeared and vanished in a single frame
   instead of coming apart. It traded a slab sweeping the lens for a
   bright accent line popping across the frame: measurably better (the
   flash count went 23 to 15) and still a strobe.
   A vec2 cell cannot be constant across a surface unless the caller
   passes something silly, so the mistake is now hard to repeat rather
   than merely documented. */
export const nearFadeGlsl = ({ gone = 4.0, full = 11.0, cell = 0.7 } = {}) => `
  float nearKeep(float dist){
    return clamp((dist - ${gone.toFixed(2)}) /
                 ${(full - gone).toFixed(2)}, 0.0, 1.0);
  }
  // True when this fragment should be dropped. Pass OBJECT-SPACE
  // coordinates that vary in two directions across the surface, so the
  // cells belong to the object and do not crawl in screen space.
  bool nearGone(float dist, vec2 at){
    float keep = nearKeep(dist);
    if(keep <= 0.0) return true;
    if(keep >= 1.0) return false;
    vec2 c = floor(at * ${cell.toFixed(2)});
    return fract(sin(dot(c, vec2(41.3, 289.1))) * 43758.5453) > keep;
  }
`;

/* ------------------------------------------------------------------
   DID EVERY SHADER ACTUALLY LINK?
   ------------------------------------------------------------------
   A shader that fails to link is the worst failure mode in this
   project, and it has now happened three times. Nothing throws. The
   draw call is still issued and still counted by renderer.info. The
   frame still renders. The only symptom is that a layer is MISSING, and
   a layer missing from a scene nobody has seen before looks exactly
   like a scene.

   Long Air shipped a kite with no sail for an afternoon this way. The
   idle background shipped with no fish and no bubbles — two of its five
   layers — and the bench reported five draw calls throughout, because
   three counts the call whether the program is valid or not.

   The console says so plainly and nothing else does. So this makes it
   something a tool call can ask: compile the scene, then interrogate
   the GL link status of every material in it. Chapters hang it on their
   inspection hook, so "is anything silently missing" is one call.
   ------------------------------------------------------------------ */
export function linkReport(renderer, scene, camera){
  const gl = renderer.getContext();
  try { renderer.compile(scene, camera); } catch(e){ /* report what we can */ }
  const out = [];
  scene.traverse(o => {
    const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for(const m of mats){
      let linked = null;
      try {
        const p = renderer.properties.get(m).currentProgram;
        const glp = p && (p.program || p);
        linked = glp ? !!gl.getProgramParameter(glp, gl.LINK_STATUS) : null;
      } catch(e){ linked = null; }
      out.push({ type: m.type, name: m.name || '', visible: o.visible, linked });
    }
  });
  const broken = out.filter(r => r.linked === false).length;
  const unknown = out.filter(r => r.linked === null).length;
  return { materials: out.length, broken, unknown, ok: broken === 0, detail: out };
}

/* ------------------------------------------------------------------
   The endless strip
   ------------------------------------------------------------------ */

/** Every scrolled mesh in a travelling chapter shares this: geometry is
 *  baked once over one strip period and wrapped by a modulo in the
 *  vertex shader, so the world is endless for one draw call per mesh,
 *  with no streaming and no seam.
 *
 *  `behind` is the fraction of the strip that stays behind the lens.
 *  It is baked into the string rather than passed as a uniform because
 *  it is a layout constant the course arithmetic also depends on: a
 *  version of it that could be changed at runtime would be a second
 *  source of truth for where things are.
 *
 *  Declares `uniform float uDist, uPeriod;` and `vec3 scrolled(vec3)`.
 *  Everything the strip bakes must be PERIODIC IN uPeriod or the wrap
 *  leaves a visible step once every twenty-odd seconds.
 */
export const scrollGlsl = (behind) => `
  uniform float uDist, uPeriod;
  vec3 scrolled(vec3 p){
    float s = mod(p.z - uDist, uPeriod);
    p.z = uPeriod * ${behind.toFixed(4)} - s;
    return p;
  }
`;

/* ------------------------------------------------------------------
   Billboards
   ------------------------------------------------------------------ */

/** The shape of every small quantity-item in the kit: all of its vertices
 *  sit at one anchor position, and a per-vertex `aCorner` offsets them in
 *  VIEW space, so the shape always faces the lens without a quaternion
 *  per item and without leaving the one merged mesh.
 *
 *  Pair with BILLBOARD_GLSL in the vertex shader.
 */
export const BILLBOARD_GLSL = `
  // mv is modelViewMatrix * vec4(anchor,1.0); offset in view space so the
  // sprite faces the lens whatever the camera is doing.
  vec4 billboard(vec4 mv, vec2 corner){ mv.xy += corner; return mv; }
`;

/** A closed outline as a centre-fan: one vertex at the anchor, then the
 *  outline, then a fan. Used for the fish bodies. */
export function polyBillboard(b, anchor, outline, attrs, scale = 1){
  const [x, y, z] = anchor;
  b.vertex(x, y, z, { ...attrs, aCorner: [0, 0] });
  for(const [cx, cy] of outline) b.vertex(x, y, z, { ...attrs, aCorner: [cx*scale, cy*scale] });
  b.fan(outline.length);
}

/** Loose triangles from consecutive triples — birds' two strokes, a
 *  tail fin, a speed line's arrowhead. */
export function triBillboard(b, anchor, pts, attrs, scale = 1){
  const [x, y, z] = anchor;
  const base = b.count;
  for(const [cx, cy] of pts) b.vertex(x, y, z, { ...attrs, aCorner: [cx*scale, cy*scale] });
  for(let i = 0; i + 2 < pts.length; i += 3) b.tri(base+i, base+i+1, base+i+2);
}

/* ------------------------------------------------------------------
   A particle pool
   ------------------------------------------------------------------ */

/** One mesh, a fixed ring of slots, positions rewritten each frame.
 *
 *  A dead slot is zero-SIZED, not moved off screen and not removed from
 *  the index: the draw call and the buffer are the same every frame, and
 *  the fragment shader discards on `size <= 0`. Spawning past capacity
 *  overwrites the oldest, which for bubbles and spray is the right
 *  failure — the oldest is the one already leaving the frame.
 *
 *  `step` is given the slot and dt and returns false to retire it.
 */
export function particles(THREE, { n, material, renderOrder = 6, extra = {} }){
  const spec = { aCorner: 2, aSeed: 1, aSize: 1, aKind: 1, ...extra };
  const b = builder(THREE, spec);
  const blank = {};
  for(const k of Object.keys(extra)) blank[k] = extra[k] === 1 ? 0 : new Array(extra[k]).fill(0);
  for(let i = 0; i < n; i++){
    const seed = (i * 1.91) % 6.283;
    const base = b.count;
    for(const [cx, cy] of [[-1,-1],[1,-1],[1,1],[-1,1]]){
      b.vertex(0, 0, 0, { ...blank, aCorner:[cx, cy], aSeed:seed, aSize:0, aKind:0 });
    }
    b.tri(base, base+1, base+2); b.tri(base, base+2, base+3);
  }
  const mesh = new THREE.Mesh(b.geometry(), material);
  mesh.renderOrder = renderOrder;
  mesh.frustumCulled = false;            // the slots move; the box does not

  const aPos  = mesh.geometry.getAttribute('position');
  const aSize = mesh.geometry.getAttribute('aSize');
  const aKind = mesh.geometry.getAttribute('aKind');

  const slots = [];
  for(let i = 0; i < n; i++) slots.push({ x:0,y:0,z:0,r:0,vx:0,vy:0,vz:0,ph:0,kind:0,live:false });
  let cursor = 0;

  return {
    mesh, slots,
    spawn(init){
      const p = slots[cursor]; cursor = (cursor + 1) % n;
      p.live = true; p.ph = Math.random() * 6.283;
      p.vx = p.vy = p.vz = 0;
      init(p);
      return p;
    },
    step(dt, advance){
      for(let i = 0; i < n; i++){
        const p = slots[i];
        let s = 0;
        if(p.live){
          if(advance(p, dt) === false) p.live = false; else s = p.r;
        }
        const o = i*12, so = i*4;
        for(let v = 0; v < 4; v++){
          aPos.array[o+v*3] = p.x; aPos.array[o+v*3+1] = p.y; aPos.array[o+v*3+2] = p.z;
          aSize.array[so+v] = s; aKind.array[so+v] = p.kind;
        }
      }
      aPos.needsUpdate = aSize.needsUpdate = aKind.needsUpdate = true;
    },
    live(){ let c = 0; for(const p of slots) if(p.live) c++; return c; }
  };
}

/* ------------------------------------------------------------------
   Materials
   ------------------------------------------------------------------ */

/** A ShaderMaterial with the posterised prelude injected.
 *
 *  `prelude` is prepended to the fragment shader after the precision
 *  qualifier, so a chapter writes `rampPick`, `fogAmount`, `posterise`,
 *  `grainAt` and `chipAt` without pasting them into every shader — which
 *  is how Deep Light ended up with four hand-copied `fogA` functions that
 *  had to be kept in agreement by hand.
 */
/* The precision qualifier goes on BOTH stages, and it has to.
 *
 * three.js already prepends `precision highp float;` to each shader. This
 * used to add `precision mediump float;` to the FRAGMENT only, which
 * overrode three's line there and left the vertex stage at highp. Any
 * uniform declared in both stages then had two different precisions, and
 * GLSL treats that as a link error — not a warning:
 *
 *   Precisions of uniform 'uFill' differ between VERTEX and FRAGMENT
 *
 * Long Air's sail is the first shader in the project to read the same
 * uniform in both stages, so it was the first to hit it, and it simply
 * did not compile: the kite had no sail. Nothing throws, the draw call
 * is still counted, the frame still renders, and the pump cannot see it
 * because the failure is in the GPU rather than in JavaScript. The
 * console said so plainly; nothing else did.
 *
 * highp rather than mediump, deliberately. The scenes carry coordinates
 * in the hundreds and strip periods in the hundreds, and mediump in a
 * VERTEX shader is a half float — about three decimal digits, which is
 * visible wobble on geometry that size. three's own default is highp and
 * agreeing with it is free.
 */
const PRECISION = 'precision highp float;\n';

export function posterMat(THREE, { uniforms = {}, vertex, fragment, prelude = '', ...opts }){
  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader:   PRECISION + vertex,
    fragmentShader: PRECISION + prelude + '\n' + fragment,
    ...opts
  });
}

/** The full-frame background quad: drawn first, depth off, never culled,
 *  and positioned in clip space so it needs no camera at all. The chapter
 *  supplies only the fragment shader — "what is behind everything" — and
 *  gets `vUv` with 0,0 at the bottom left. */
export function screenQuad(THREE, { uniforms, fragment, prelude = '', order = -10, ...opts }){
  const mat = posterMat(THREE, {
    uniforms, prelude, fragment,
    vertex: `varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = vec4(position.xy, 1.0, 1.0); }`,
    depthTest: false, depthWrite: false, ...opts
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  m.frustumCulled = false;
  m.renderOrder = order;
  return m;
}

/** A clip-space overlay — the meniscus band in Deep Light, a flash in a
 *  storm chapter. Same trick as screenQuad, drawn last instead of first,
 *  transparent, and expected to `discard` most of the frame. */
export function overlayQuad(THREE, opts){
  return screenQuad(THREE, { transparent: true, order: 20, ...opts });
}

/** Scale, place and tilt a primitive in one line. The figures in this
 *  project are assembled out of a dozen stretched spheres and boxes
 *  sharing a handful of MeshBasicMaterials — flat, lineless, no lighting
 *  (§4.2 rule 1) — and this is the whole of that idiom. */
export function part(THREE, geo, mat, sx, sy, sz, px, py, pz, rz){
  const m = new THREE.Mesh(geo, mat);
  m.scale.set(sx, sy, sz);
  m.position.set(px, py, pz);
  if(rz) m.rotation.z = rz;
  return m;
}
