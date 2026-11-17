/* ============================================================
   BOOK OF RATES — the painter
   17 November 2026. Turns a rendered frame into a painting: the
   picture is made of strokes of paint rather than of triangles.

   The author, on the Shepherd: "change its style to painted, with a
   lot of paint smears making the image instead of triangles ... a
   fundamentally different feel." So the scene is still built and lit
   exactly as before — the geometry decides WHAT is there — and then
   it is repainted, in three steps:

   1. The scene is drawn to a texture at HALF resolution. A painting
      does not need the detail, and the passes below cost by the pixel.
   2. FLATTEN INTO DABS (a Kuwahara filter, four quadrants): every pixel
      takes the average of whichever neighbouring quadrant is most
      uniform. Smooth regions become flat patches of colour and edges
      stay sharp, which is what a loaded brush does. Here the
      triangles go: a facet edge inside a flat region is erased.
   3. SMEAR ALONG THE FORM, at full resolution. Each pixel is averaged
      along a short line that follows the contours of the picture (at
      right angles to its gradient) and, where the picture is flat,
      follows a slow swirling field instead — so a sky is laid in with
      long sweeping strokes and a hillside with strokes that run along
      it. On top: bristle streaks in the stroke direction, a little
      impasto (the ridge of a stroke catching light), and the weave of
      the canvas.

   It is post-processing and nothing else: no scene, no chapter logic,
   no breath. Any chapter can be handed to it by replacing
   `renderer.render(scene, camera)` with `painter.render(scene, camera)`.

   Arithmetic hashes only — a sin-hash collapses at mediump, which
   this project has on record.
   ============================================================ */

import { posterMat } from './mesh.js';

const FS_VERT = `varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const HASH = `
  float ph12(vec2 p){
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  float pnoise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(ph12(i), ph12(i + vec2(1.0, 0.0)), f.x),
               mix(ph12(i + vec2(0.0, 1.0)), ph12(i + vec2(1.0, 1.0)), f.x), f.y);
  }
`;

/**
 * @param {object} THREE
 * @param {object} o
 * @param {object} o.renderer
 * @param {number} [o.scale=0.5]  resolution of the painted layers, as a fraction of the drawing buffer
 * @param {number} [o.radius=3]   Kuwahara quadrant size, in half-resolution texels
 * @param {number} [o.stroke=7]   smear length, in drawing-buffer pixels each way
 */
export function painter(THREE, { renderer, scale = 0.5, radius = 3, stroke = 7 } = {}){
  const mk = () => {
    const t = new THREE.WebGLRenderTarget(4, 4, { depthBuffer: true });
    t.texture.minFilter = t.texture.magFilter = THREE.LinearFilter;
    t.texture.generateMipmaps = false;
    return t;
  };
  const scene0 = mk(), dabs = mk();
  dabs.depthBuffer = false;

  const fsScene = new THREE.Scene();
  const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  quad.frustumCulled = false;
  fsScene.add(quad);

  const uTime = { value: 0 };
  const uTexel = { value: new THREE.Vector2(1, 1) };     // half-res texel
  const uPx = { value: new THREE.Vector2(1, 1) };        // full-res pixel, in uv

  /* ---- 2. the dabs ---- */
  const dabMat = posterMat(THREE, {
    uniforms: { uSrc: { value: scene0.texture }, uTexel },
    vertex: FS_VERT,
    fragment: `
      varying vec2 vUv;
      uniform sampler2D uSrc; uniform vec2 uTexel;
      const int R = ${radius | 0};
      void main(){
        vec3 m[4]; vec3 s[4];
        for(int k = 0; k < 4; k++){ m[k] = vec3(0.0); s[k] = vec3(0.0); }
        for(int j = 0; j <= R; j++){
          for(int i = 0; i <= R; i++){
            vec2 o = vec2(float(i), float(j)) * uTexel;
            vec3 c0 = texture2D(uSrc, vUv + vec2(-o.x, -o.y)).rgb;
            vec3 c1 = texture2D(uSrc, vUv + vec2( o.x, -o.y)).rgb;
            vec3 c2 = texture2D(uSrc, vUv + vec2(-o.x,  o.y)).rgb;
            vec3 c3 = texture2D(uSrc, vUv + vec2( o.x,  o.y)).rgb;
            m[0] += c0; s[0] += c0 * c0;
            m[1] += c1; s[1] += c1 * c1;
            m[2] += c2; s[2] += c2 * c2;
            m[3] += c3; s[3] += c3 * c3;
          }
        }
        float n = float((R + 1) * (R + 1));
        vec3 best = m[0] / n; float bv = 1e9;
        for(int k = 0; k < 4; k++){
          vec3 mu = m[k] / n;
          vec3 va = abs(s[k] / n - mu * mu);
          float v = va.r + va.g + va.b;
          if(v < bv){ bv = v; best = mu; }
        }
        gl_FragColor = vec4(best, 1.0);
      }
    `
  });

  /* ---- 3. the strokes ---- */
  const strokeMat = posterMat(THREE, {
    uniforms: { uSrc: { value: dabs.texture }, uTime, uTexel, uPx },
    vertex: FS_VERT,
    fragment: HASH + `
      varying vec2 vUv;
      uniform sampler2D uSrc; uniform vec2 uTexel, uPx; uniform float uTime;
      float lum(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
      void main(){
        /* the form's direction, from the dabbed picture */
        vec2 e = uTexel * 1.5;
        float gx = lum(texture2D(uSrc, vUv + vec2(e.x, 0.0)).rgb) - lum(texture2D(uSrc, vUv - vec2(e.x, 0.0)).rgb);
        float gy = lum(texture2D(uSrc, vUv + vec2(0.0, e.y)).rgb) - lum(texture2D(uSrc, vUv - vec2(0.0, e.y)).rgb);
        vec2 g = vec2(gx, gy);
        float gm = length(g);
        /* where the picture is flat, long strokes laid across it — nearly
           level, leaning a little this way and that. NOT a free swirl:
           a stroke frame that turns all the way round draws its marks in
           rings, and rings read as wood grain rather than paint. */
        vec2 fp = vUv * vec2(2.2, 4.0);
        float a = (pnoise(fp + vec2(0.0, uTime * 0.01)) - 0.5) * 0.9;
        vec2 swirl = vec2(cos(a), sin(a));
        vec2 dir = normalize(mix(normalize(swirl), normalize(vec2(-g.y, g.x) + 1e-6), smoothstep(0.004, 0.03, gm)));

        /* the stroke: a short line integral along it, weighted to the
           middle, with the stroke's length varied per dab */
        /* THE MARKS. A flat field of colour has nothing to smear, so the
           painter puts the paint in: the picture is cut into elongated
           marks laid along the stroke direction, each one a slightly
           different load of the brush (value, and a warm or cool lean),
           and each one picks its colour up from a little way off, so the
           edge between two colours is the ragged edge of the strokes
           that meet there rather than a line. */
        vec2 pp = vUv / uPx;
        vec2 perp = vec2(-dir.y, dir.x);
        vec2 sf = vec2(dot(pp, dir), dot(pp, perp));
        vec2 mc = sf / vec2(46.0, 10.0);
        float mark = pnoise(mc), mark2 = pnoise(mc * 1.7 + 13.0);
        vec2 jit = (vec2(pnoise(mc + 5.0), pnoise(mc + 9.0)) - 0.5) * 9.0 * uPx;

        float len = ${stroke.toFixed(1)} * (0.6 + 0.8 * mark2);
        vec3 acc = vec3(0.0); float wsum = 0.0;
        for(int i = -4; i <= 4; i++){
          float t = float(i) / 4.0;
          float w = 1.0 - 0.6 * abs(t);
          acc += texture2D(uSrc, vUv + jit + dir * t * len * uPx).rgb * w;
          wsum += w;
        }
        vec3 col = acc / wsum;
        col *= 0.90 + 0.20 * mark;
        col += (mark2 - 0.5) * vec3(0.06, 0.02, -0.05);

        /* bristles: streaks along the stroke */
        vec2 q = vec2(sf.x * 0.06, sf.y * 0.85);
        float bristle = pnoise(q) * 0.6 + pnoise(q * 2.3 + 7.0) * 0.4;
        col *= 0.87 + 0.26 * bristle;
        /* impasto: the ridge of a stroke catching a light from the top left */
        float ridge = pnoise(q * vec2(1.0, 0.35) + 31.0);
        float rx = pnoise(q * vec2(1.0, 0.35) + vec2(31.0, 0.0) + vec2(0.0, 0.35)) - ridge;
        col += vec3(1.0, 0.97, 0.9) * clamp(rx, 0.0, 1.0) * 0.10;
        /* a little more pigment: painted colour sits richer than lit colour */
        float l = lum(col);
        col = mix(vec3(l), col, 1.12);
        /* the canvas */
        vec2 cv = pp * 0.5;
        float weave = (sin(cv.x * 3.1416) * sin(cv.y * 3.1416)) * 0.5 + 0.5;
        col *= 0.965 + 0.05 * weave;
        col += (ph12(pp) - 0.5) * 0.02;
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });

  const vSize = new THREE.Vector2();
  let w = 0, h = 0;
  function fit(){
    renderer.getDrawingBufferSize(vSize);
    const W = Math.max(1, vSize.x), H = Math.max(1, vSize.y);
    const sw = Math.max(1, Math.round(W * scale)), sh = Math.max(1, Math.round(H * scale));
    if(sw !== w || sh !== h){
      w = sw; h = sh;
      scene0.setSize(w, h); dabs.setSize(w, h);
      uTexel.value.set(1 / w, 1 / h);
    }
    uPx.value.set(1 / W, 1 / H);
  }

  return {
    /** Draw `scene` through `camera`, painted, to the screen. */
    render(scene, camera, dt = 1 / 60){
      fit();
      uTime.value += dt;
      const prev = renderer.getRenderTarget();
      renderer.setRenderTarget(scene0);
      renderer.render(scene, camera);
      quad.material = dabMat;
      renderer.setRenderTarget(dabs);
      renderer.render(fsScene, fsCam);
      quad.material = strokeMat;
      renderer.setRenderTarget(prev);
      renderer.render(fsScene, fsCam);
    },
    /** Draw it plain, for comparison. */
    plain(scene, camera){ renderer.render(scene, camera); },
    materials: [dabMat, strokeMat],
    dispose(){ scene0.dispose(); dabs.dispose(); dabMat.dispose(); strokeMat.dispose(); }
  };
}
