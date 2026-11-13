/* The Book of Rates — LIGHT.
 *
 * 12 November 2026. Until this file the book had no lighting model at
 * all: no light vector, normals on three objects, three hand-placed
 * shadow discs, and not one texture sample anywhere. That was a rule
 * (design doc §4.2, rules 1 and 2) and the author has withdrawn it —
 * "more structure is generally better, as long as the pieces work well
 * together" — so this is the structure, as one kit that every surface
 * of a chapter shares, so that the pieces DO work together:
 *
 *   ONE SUN.       A world-space direction and colour, in uniforms, read
 *                  by every lit surface. The sun's azimuth problem in
 *                  Long Air (a shadow thrown one way under a sky lit
 *                  from the other) existed because there was no such
 *                  thing; with one vector there is nothing to disagree.
 *   ONE SKY.       Hemisphere ambient — one colour from above, one from
 *                  below, picked by the normal — so the side of a thing
 *                  that the sun misses is not black, it is the colour of
 *                  what it faces.
 *   ONE SHADOW.    A real depth map from the sun's point of view, so
 *                  anything can shade anything and nobody places a disc
 *                  by hand. Filtered soft; the figure stands ON the
 *                  ground because the ground knows it is there.
 *   TEXTURES.      A tileable noise and a gradient map. One fetch in
 *                  place of a dozen sines or a five-riser ramp: the
 *                  measured cost in this book is per-fragment arithmetic
 *                  on whatever fills the frame, and a texture fetch is
 *                  the cheapest arithmetic a GPU has.
 *   A PERIPHERY.   For §1.7: how much detail a fragment keeps, as a
 *                  function of how far it is from the thing the reader
 *                  is looking at and how hurried they are.
 *
 * WHAT IS KEPT FROM THE OLD IDIOM is not a rule but a habit, and it is
 * in the colours a chapter hands to this kit rather than in the kit:
 * few hues, a designed value structure, a sky that carries the mood.
 * Light now MODELS the shapes; the palette still DESIGNS them.
 *
 * EVERYTHING IS IN LINEAR LIGHT until toDisplay() at the very end of a
 * fragment. three's Color already converts a hex to linear on the way
 * in; the old flat chapters wrote those straight back out, which was
 * harmless when nothing was multiplied by anything. Lighting multiplies,
 * so here the conversion is done on the way out as well.
 */

const PRECISION = 'precision highp float;\n';

/* ------------------------------------------------------------------
   The sun and the sky
   ------------------------------------------------------------------ */

/** Fragment-stage lighting. Declares the uniforms; a chapter supplies
 *  them once, by reference, to every material (see `sunUniforms`). */
export const LIGHT_GLSL = `
  uniform vec3 uSunDir;      // unit, pointing FROM the surface TOWARDS the sun
  uniform vec3 uSunCol;      // linear
  uniform vec3 uAmbSky;      // what a face turned up is lit by
  uniform vec3 uAmbGround;   // what a face turned down is lit by

  /* Half-Lambert-ish: the terminator sits a little past ninety degrees,
     which is what light in a scattering medium (haze, water) does, and
     it keeps round things round instead of half-black. */
  float sunDiffuse(vec3 N, float wrap){
    return clamp((dot(N, uSunDir) + wrap) / (1.0 + wrap), 0.0, 1.0);
  }
  vec3 skyAmbient(vec3 N){
    return mix(uAmbGround, uAmbSky, N.y * 0.5 + 0.5);
  }
  /* Blinn-Phong. V points from the surface to the eye. */
  float sunSpecular(vec3 N, vec3 V, float power){
    vec3 H = normalize(uSunDir + V);
    return pow(max(dot(N, H), 0.0), power);
  }
  /* A gentle shoulder and then the display curve. Not ACES: the scenes
     are low in contrast by design and a filmic toe would muddy the
     darks the palette chose on purpose. */
  vec3 toDisplay(vec3 c){
    c = c / (1.0 + c * 0.35);
    return pow(max(c, 0.0), vec3(1.0 / 2.2));
  }
`;

/** World position and a correct world normal, for a vertex shader.
 *
 *  normalMatrix is the inverse transpose of modelView, so it is right
 *  under the non-uniform scales the figures are built from — the thing
 *  the Shepherd's fleece had to bake by hand. Multiplying a row vector
 *  by viewMatrix takes it back from view space to world space. */
export const WORLD_VERT_GLSL = `
  varying vec3 vWorld; varying vec3 vN;
  void worldOut(vec3 p, vec3 n){
    vec4 wp = modelMatrix * vec4(p, 1.0);
    vWorld = wp.xyz;
    vN = normalize((vec4(normalMatrix * n, 0.0) * viewMatrix).xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

/* ------------------------------------------------------------------
   The shadow
   ------------------------------------------------------------------ */

/** Receiver side. Five taps on a rotated cross, which on a 4 cm texel
 *  is a penumbra of about a hand's width — soft enough to read as light
 *  through a medium, cheap enough to put on the surface that fills the
 *  frame.
 *
 *  The bias is along the NORMAL, in world units, rather than a constant
 *  in depth: a depth bias has to be large enough for the steepest slope
 *  in the scene and is then visibly too large everywhere else (the
 *  shadow detaches from the thing casting it). A normal offset is the
 *  same size on every slope. */
export const SHADOW_GLSL = `
  uniform sampler2D uShadowMap;
  uniform mat4 uShadowMat;
  uniform float uShadowTexel;
  float shadowCmp(vec3 c, vec2 uv){
    return step(c.z - 0.0012, texture2D(uShadowMap, uv).r);
  }
  /* One tap is FOUR comparisons, blended by where the point sits between
     the texel centres. A single nearest comparison is a step function of
     position, and on sand a few metres from the lens a texel is a dozen
     pixels across: first seen on 12 November, the kelp's shadow was a
     staircase. Blending the comparisons (never the depths) makes every
     tap a ramp one texel wide, so the edge has no grid in it. */
  float shadowTap(vec3 c, vec2 o){
    vec2 st = c.xy / uShadowTexel + o - 0.5;
    vec2 f = fract(st);
    vec2 b = (floor(st) + 0.5) * uShadowTexel;
    float t = uShadowTexel;
    return mix(mix(shadowCmp(c, b),               shadowCmp(c, b + vec2(t, 0.0)), f.x),
               mix(shadowCmp(c, b + vec2(0.0, t)), shadowCmp(c, b + vec2(t, t)),   f.x), f.y);
  }
  float shadowAt(vec3 P, vec3 N){
    vec4 s = uShadowMat * vec4(P + N * 0.07, 1.0);
    vec3 c = s.xyz / s.w * 0.5 + 0.5;
    if(c.x < 0.0 || c.x > 1.0 || c.y < 0.0 || c.y > 1.0 || c.z > 1.0) return 1.0;
    float a = shadowTap(c, vec2(0.0));
    a += shadowTap(c, vec2( 1.2,  0.5));
    a += shadowTap(c, vec2(-0.5,  1.2));
    a += shadowTap(c, vec2(-1.2, -0.5));
    a += shadowTap(c, vec2( 0.5, -1.2));
    return a * 0.2;
  }
`;

/**
 * The sun's own view of the scene.
 *
 * The frustum is FIXED IN THE WORLD, deliberately. A shadow frustum
 * that follows the camera has to be snapped to its own texel grid or
 * every shadow edge swims as it moves, and the chapters here play in a
 * bounded space small enough to cover outright.
 *
 * Casters are REGISTERED, never discovered. During the pass everything
 * that is not a caster is hidden and every caster wears its depth
 * material; afterwards both are put back. A full-frame background quad
 * left visible in this pass would write its depth over the whole map —
 * the kind of thing that produces a scene with no shadows and no error.
 *
 * @returns {{ uniforms, add, render, depthMat, camera, target, matrix }}
 */
export function shadowRig(THREE, { renderer, sunDir, centre, half = 20,
                                   distance = 45, near = 2, far = 95, size = 1024 }){
  const target = new THREE.WebGLRenderTarget(size, size, { depthBuffer: true });
  target.texture.minFilter = target.texture.magFilter = THREE.NearestFilter;
  target.texture.generateMipmaps = false;
  target.depthTexture = new THREE.DepthTexture(size, size);
  target.depthTexture.minFilter = target.depthTexture.magFilter = THREE.NearestFilter;

  const camera = new THREE.OrthographicCamera(-half, half, half, -half, near, far);
  const matrix = new THREE.Matrix4();
  function aim(){
    camera.position.copy(centre).addScaledVector(sunDir, distance);
    /* a sun near the zenith is parallel to the default up, and lookAt
       with a parallel up is a degenerate basis */
    camera.up.set(0, 0, -1);
    camera.lookAt(centre);
    camera.updateMatrixWorld(true);
    camera.updateProjectionMatrix();
    matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  }
  aim();

  const uniforms = {
    uShadowMap:   { value: target.depthTexture },
    uShadowMat:   { value: matrix },
    uShadowTexel: { value: 1 / size }
  };

  /** The plain depth material, for anything whose vertices are where
   *  its geometry says. A surface that MOVES in its vertex shader passes
   *  its own (see `depthMat`), or its shadow stays behind when it sways. */
  const plain = depthMat(THREE);
  const casters = [];

  return {
    uniforms, camera, target, matrix, aim,
    add(mesh, mat = plain){ casters.push({ mesh, mat }); return mesh; },
    get casters(){ return casters.length; },
    render(scene){
      const hidden = [];
      const cast = new Set(casters.map(c => c.mesh));
      scene.traverse(o => {
        if((o.isMesh || o.isPoints || o.isLine) && o.visible && !cast.has(o)){ o.visible = false; hidden.push(o); }
      });
      const worn = casters.map(c => c.mesh.material);
      casters.forEach(c => { c.mesh.material = c.mat; });
      const prev = renderer.getRenderTarget();
      renderer.setRenderTarget(target);
      renderer.clear();
      renderer.render(scene, camera);
      renderer.setRenderTarget(prev);
      casters.forEach((c, i) => { c.mesh.material = worn[i]; });
      for(const o of hidden) o.visible = true;
    }
  };
}

/** A depth-only material. `vertex` may be a chapter's own main() — it
 *  must write gl_Position exactly as the visible material does, or the
 *  shadow and the thing part company. */
export function depthMat(THREE, { vertex, uniforms = {} } = {}){
  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: PRECISION + (vertex ||
      'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }'),
    fragmentShader: PRECISION + 'void main(){ gl_FragColor = vec4(1.0); }',
    side: THREE.DoubleSide
  });
}

/* ------------------------------------------------------------------
   Textures
   ------------------------------------------------------------------ */

/** Tileable value noise, four octaves in the four channels: r is the
 *  broadest (4 cells across the tile), a the finest (32). A shader takes
 *  what it wants — `.r` for a slow mottle, a weighted sum for something
 *  cloudier — for ONE fetch. Deterministic: a 32-bit LCG, the same on
 *  every device, and none of the sin-hash precision cliffs the
 *  Murmuration found. */
export function noiseTexture(THREE, n = 128){
  let x = 0x2545F491;
  const rnd = () => { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x / 4294967296; };
  const data = new Uint8Array(n * n * 4);
  [4, 8, 16, 32].forEach((cells, ch) => {
    const g = new Float32Array(cells * cells);
    for(let i = 0; i < g.length; i++) g[i] = rnd();
    const at = (i, j) => g[((j % cells) + cells) % cells * cells + ((i % cells) + cells) % cells];
    const q = t => t * t * t * (t * (t * 6 - 15) + 10);
    for(let py = 0; py < n; py++) for(let px = 0; px < n; px++){
      const u = px / n * cells, v = py / n * cells;
      const i = Math.floor(u), j = Math.floor(v), fu = q(u - i), fv = q(v - j);
      const a = at(i, j) + (at(i + 1, j) - at(i, j)) * fu;
      const b = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * fu;
      data[(py * n + px) * 4 + ch] = Math.round((a + (b - a) * fv) * 255);
    }
  });
  const t = new THREE.DataTexture(data, n, n, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

/** A gradient map: any number of colours, laid along a 64-texel strip,
 *  filtered. `texture2D(uGrade, vec2(x, 0.5)).rgb` is then a continuous
 *  ramp through all of them for one fetch — the continuous counterpart
 *  of palette.js's six-step rampPick, and what `rampPickAA` would cost
 *  if the risers did not have to be resolved by hand. */
export function gradeTexture(THREE, hexes, n = 64){
  const cols = hexes.map(h => [(h >> 16) & 255, (h >> 8) & 255, h & 255]);
  const data = new Uint8Array(n * 4);
  for(let i = 0; i < n; i++){
    const u = i / (n - 1) * (cols.length - 1);
    const k = Math.min(cols.length - 2, Math.floor(u)), f = u - k;
    for(let c = 0; c < 3; c++) data[i * 4 + c] = Math.round(cols[k][c] + (cols[k + 1][c] - cols[k][c]) * f);
    data[i * 4 + 3] = 255;
  }
  const t = new THREE.DataTexture(data, n, 1, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace;      // sampled as linear
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.minFilter = t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}

/* ------------------------------------------------------------------
   The periphery — design doc §1.7
   ------------------------------------------------------------------
   "Simplify the imagery as though we were in a panicked state —
   periphery fuzzy and less detailed at higher speeds, centre remains
   locked and steady."

   `periphKeep()` is how much detail THIS fragment keeps: 1 everywhere
   when the reader is calm, and falling towards 0 away from the focus as
   uHaste rises. The focus is wherever the chapter says the reader is
   looking (the figure), in pixels, not the middle of the frame.

   WHAT A SHADER DOES WITH IT IS DROP TERMS, NOT DISSOLVE THE SURFACE.
   Long Air tried a per-cell discard on an opaque surface at two cell
   sizes and recorded that it is a dither at any size. Fewer octaves,
   weaker fine detail and thicker haze are all "less detailed", none of
   them is noise, and all of them are CHEAPER — so the frame costs least
   exactly when the reader is moving fastest.
   ------------------------------------------------------------------ */
export const PERIPH_GLSL = `
  uniform vec2 uRes;        // drawing buffer, pixels
  uniform vec2 uFocus;      // where the reader is looking, same pixels
  uniform float uHaste;     // 0 calm .. 1 hurried
  float periphKeep(){
    float r = length(gl_FragCoord.xy - uFocus) / (0.5 * uRes.y);
    return 1.0 - uHaste * smoothstep(0.16, 0.72, r);
  }
`;

/** A ShaderMaterial with a prelude, precision on both stages (see the
 *  long note in mesh.js on why both). */
export function litMat(THREE, { uniforms = {}, vertex, fragment, prelude = '', vprelude = '', ...opts }){
  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader:   PRECISION + vprelude + '\n' + vertex,
    fragmentShader: PRECISION + prelude + '\n' + fragment,
    ...opts
  });
}
