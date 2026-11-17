/* ============================================================
   BOOK OF RATES — the finish
   17 November 2026. A last pass over a rendered frame that does what
   a lens and a print do and a rasteriser does not: light SPILLS.

   The author asked for Long Air at "a higher quality ... the same way
   we did for the Free Dive". The Free Dive's quality is mostly light:
   shafts falling through the water, a soft glow round anything
   bright, a display curve that rolls highlights off instead of
   clipping them. Long Air's geometry is fine and expensive to change
   (CLAUDE.md, the LOE note); its light is where the gain is cheap.

   One extra full-frame pass, plus one small one:
   1. the scene is drawn to a texture at full resolution;
   2. a QUARTER-resolution layer holds the frame's light: what is
      brighter than the threshold, blurred, plus shafts — each pixel
      walks towards the light's place on the glass and gathers the
      bright sky it passes through, so the light falls in rays through
      gaps in cloud and past the glider;
   3. the composite adds that light back, rolls the highlights off,
      warms the light and cools the shade a little, darkens the corners
      and lays a fine grain over it.

   Cost is per pixel and small: the heavy part is at a sixteenth of the
   pixels. Arithmetic hashes only.
   ============================================================ */

import { posterMat } from './mesh.js';

const FS_VERT = `varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

/**
 * @param {object} THREE
 * @param {object} o
 * @param {object} o.renderer
 * @param {number} [o.threshold=0.72] luminance above which a pixel gives off light
 * @param {number} [o.shafts=0.55]    strength of the rays
 * @param {number} [o.bloom=0.35]     strength of the glow
 */
export function finisher(THREE, { renderer, threshold = 0.72, shafts = 0.55, bloom = 0.35 } = {}){
  const mk = (depth) => {
    const t = new THREE.WebGLRenderTarget(4, 4, { depthBuffer: depth, samples: depth ? 4 : 0 });
    t.texture.minFilter = t.texture.magFilter = THREE.LinearFilter;
    t.texture.generateMipmaps = false;
    return t;
  };
  const frame = mk(true), light = mk(false);

  const fsScene = new THREE.Scene();
  const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  quad.frustumCulled = false;
  fsScene.add(quad);

  const uSun = { value: new THREE.Vector2(0.3, 0.8) };
  const uTexel = { value: new THREE.Vector2(1, 1) };
  const uTime = { value: 0 };

  const lightMat = posterMat(THREE, {
    uniforms: { uSrc: { value: frame.texture }, uSun, uTexel },
    vertex: FS_VERT,
    fragment: `
      varying vec2 vUv;
      uniform sampler2D uSrc; uniform vec2 uSun, uTexel;
      vec3 bright(vec2 uv){
        vec3 c = texture2D(uSrc, uv).rgb;
        float l = dot(c, vec3(0.299, 0.587, 0.114));
        return c * smoothstep(${threshold.toFixed(3)}, ${Math.min(1, threshold + 0.22).toFixed(3)}, l);
      }
      void main(){
        /* the glow: a small blurred bright-pass */
        vec3 g = vec3(0.0);
        for(int j = -1; j <= 1; j++) for(int i = -1; i <= 1; i++)
          g += bright(vUv + vec2(float(i), float(j)) * uTexel * 2.0);
        g /= 9.0;
        /* the shafts: walk towards the light, gathering bright sky */
        vec2 d = (uSun - vUv) / 22.0;
        vec2 p = vUv;
        vec3 s = vec3(0.0);
        float w = 1.0;
        for(int k = 0; k < 22; k++){
          p += d;
          s += bright(p) * w;
          w *= 0.94;
        }
        s /= 9.0;
        float near = 1.0 - smoothstep(0.0, 0.9, length((vUv - uSun) * vec2(1.0, 1.6)));
        gl_FragColor = vec4(g * ${bloom.toFixed(3)} + s * ${shafts.toFixed(3)} * (0.35 + 0.65 * near), 1.0);
      }
    `
  });

  const compMat = posterMat(THREE, {
    uniforms: { uSrc: { value: frame.texture }, uLight: { value: light.texture }, uTime },
    vertex: FS_VERT,
    fragment: `
      varying vec2 vUv;
      uniform sampler2D uSrc, uLight; uniform float uTime;
      float fh(vec2 p){
        vec3 p3 = fract(vec3(p.xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }
      void main(){
        vec3 c = texture2D(uSrc, vUv).rgb;
        vec3 L = texture2D(uLight, vUv).rgb;
        /* light added, warmed: spilled light is the colour of the sun */
        c += L * vec3(1.0, 0.92, 0.74);
        /* roll off only what the added light pushed past white — a white
           cloud stays white (a shoulder starting lower turned them grey) */
        c = c / (1.0 + max(c - 1.0, 0.0));
        /* light a touch warm, shade a touch cool */
        float l = dot(c, vec3(0.299, 0.587, 0.114));
        c = mix(c * vec3(0.95, 0.98, 1.06), c * vec3(1.04, 1.01, 0.95), smoothstep(0.25, 0.75, l));
        /* a little more contrast in the mid-tones */
        c = mix(c, c * c * (3.0 - 2.0 * c), 0.18);
        /* the corners */
        vec2 v = (vUv - 0.5) * vec2(1.0, 1.25);
        c *= 1.0 - 0.28 * smoothstep(0.35, 0.85, length(v));
        c += (fh(gl_FragCoord.xy + fract(uTime) * 97.0) - 0.5) * 0.022;
        gl_FragColor = vec4(c, 1.0);
      }
    `
  });

  const vSize = new THREE.Vector2();
  let W = 0, H = 0;
  function fit(){
    renderer.getDrawingBufferSize(vSize);
    const w = Math.max(1, vSize.x), h = Math.max(1, vSize.y);
    if(w !== W || h !== H){
      W = w; H = h;
      frame.setSize(W, H);
      const lw = Math.max(1, Math.round(W / 4)), lh = Math.max(1, Math.round(H / 4));
      light.setSize(lw, lh);
      uTexel.value.set(1 / lw, 1 / lh);
    }
  }

  return {
    /** the light's place on the glass, 0..1 with y up */
    sun: uSun.value,
    render(scene, camera, dt = 1 / 60){
      fit();
      uTime.value += dt;
      const prev = renderer.getRenderTarget();
      renderer.setRenderTarget(frame);
      renderer.render(scene, camera);
      quad.material = lightMat;
      renderer.setRenderTarget(light);
      renderer.render(fsScene, fsCam);
      quad.material = compMat;
      renderer.setRenderTarget(prev);
      renderer.render(fsScene, fsCam);
    },
    materials: [lightMat, compMat],
    dispose(){ frame.dispose(); light.dispose(); lightMat.dispose(); compMat.dispose(); }
  };
}
