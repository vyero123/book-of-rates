/* The Book of Rates — shared drawing language.
 *
 * Mid-century cartoon modern with ukiyo-e influence (design doc 4):
 *  - flat fills, never a stroke on scenery
 *  - form from value and hue, not line; every shadow is its own hard polygon
 *  - depth as discrete bands, never a continuous gradient
 *  - one dominant hue family per scene, sky chosen first and loudest
 *  - extreme negative space
 *
 * Everything drawn here is original. No existing character, frame or
 * composition is reproduced.
 */

export const PALETTES = {
  'desert-dusk': {
    skyHi:  ['#4B2355', '#E8553A'],      // exhaled -> inhaled
    skyLo:  ['#C9553F', '#F6B04A'],
    range3: '#6E2F4E', range3s: '#5A2543',
    range2: '#52234A', range2s: '#431C3E',
    range1: '#3A1739',
    near:   '#2A1026', nearLo: '#1C0A1C',
    sand:   ['#8E3A46', '#C06A43'],
    sandSh: 'rgba(74,26,51,0.5)',
    figure: '#140A16',
    vignette: '12,7,22',
    ink: '#F6E7C9'
  }
};

const hex = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
export function mix(a, b, t){
  const A = hex(a), B = hex(b);
  return `rgb(${A[0]+(B[0]-A[0])*t|0},${A[1]+(B[1]-A[1])*t|0},${A[2]+(B[2]-A[2])*t|0})`;
}
export const pair = (p, t) => mix(p[0], p[1], t);

/* ---- canvas plumbing ---- */
export class Surface {
  constructor(canvas){
    this.cv = canvas;
    this.g = canvas.getContext('2d');
    this.grain = null;
    this.fit();
  }
  fit(){
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.W = this.cv.clientWidth; this.H = this.cv.clientHeight;
    this.cv.width = Math.round(this.W * dpr);
    this.cv.height = Math.round(this.H * dpr);
    this.g.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.buildGrain();
  }
  buildGrain(){
    const n = 140, t = document.createElement('canvas'); t.width = t.height = n;
    const tg = t.getContext('2d'), d = tg.createImageData(n, n);
    for (let i = 0; i < n*n; i++){
      const v = 118 + (Math.random()*76|0);
      d.data[i*4] = d.data[i*4+1] = d.data[i*4+2] = v;
      d.data[i*4+3] = 26 + (Math.random()*30|0);
    }
    tg.putImageData(d, 0, 0);
    this.grain = this.g.createPattern(t, 'repeat');
  }
  /** Paint grain over the scenery, then a vignette. Keep both off the UI. */
  finish(vignetteRGB, alpha = 0.46){
    const { g, W, H } = this;
    if (this.grain){ g.save(); g.globalAlpha = alpha; g.fillStyle = this.grain; g.fillRect(0,0,W,H); g.restore(); }
    const vg = g.createRadialGradient(W*0.5, H*0.46, H*0.18, W*0.5, H*0.5, H*0.80);
    vg.addColorStop(0, `rgba(${vignetteRGB},0)`);
    vg.addColorStop(1, `rgba(${vignetteRGB},0.42)`);
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
}

/* ---- scenery primitives ---- */

/** Hard-edged stacked lobes with a flat underside. The flat base is the move. */
export function cloud(g, cx, cy, s, fill){
  g.fillStyle = fill; g.beginPath();
  for (const [dx, dy, r] of [[-1.5,.15,.55],[-.6,-.25,.78],[.35,-.42,.95],[1.2,-.1,.62],[1.9,.2,.42]]){
    g.moveTo(cx+dx*s, cy+dy*s); g.arc(cx+dx*s, cy+dy*s, r*s, 0, 6.2832);
  }
  g.rect(cx-2.1*s, cy+0.05*s, 4.3*s, 0.42*s);
  g.fill();
}

/** Sheaves of tapering triangles — grass without a single stroke. */
export function grass(g, x, y, s, lean, fill){
  g.fillStyle = fill;
  for (let i = 0; i < 7; i++){
    const o = (i-3)*s*0.16, h = s*(0.65 + ((i*37)%10)/14), b = s*0.055;
    g.beginPath(); g.moveTo(x+o-b, y); g.lineTo(x+o+b, y);
    g.lineTo(x+o+lean*h*0.5, y-h); g.closePath(); g.fill();
  }
}

/** Angular facets with one hard shadow split. No soft shading anywhere. */
export function rock(g, x, y, s, lit, sh){
  g.fillStyle = lit; g.beginPath();
  g.moveTo(x-s, y); g.lineTo(x-s*0.55, y-s*0.82); g.lineTo(x+s*0.1, y-s*1.0);
  g.lineTo(x+s*0.78, y-s*0.5); g.lineTo(x+s, y); g.closePath(); g.fill();
  g.fillStyle = sh; g.beginPath();
  g.moveTo(x+s*0.1, y-s*1.0); g.lineTo(x+s*0.78, y-s*0.5);
  g.lineTo(x+s, y); g.lineTo(x+s*0.12, y); g.closePath(); g.fill();
}

const RNG = i => { const x = Math.sin(i*127.1)*43758.5453; return x - Math.floor(x); };

/** A distant range: fixed geology drifting past at parallax speed, NOT
 *  driven by the breath. Putting the breath curve on every layer makes the
 *  frame read as noise. */
export function range(g, W, t, baseY, hMax, span, speed, lit, sh, seed){
  const first = Math.floor((t*speed - W*0.2) / span);
  for (let i = first-1; i < first + Math.ceil(W/span) + 2; i++){
    const cx = i*span - t*speed + W*0.2;
    if (cx < -span || cx > W + span) continue;
    const w = span*(0.56 + RNG(i+seed)*0.42), h = hMax*(0.48 + RNG(i+seed+99)*0.60);
    g.fillStyle = lit; g.beginPath();
    g.moveTo(cx-w, baseY);
    g.lineTo(cx-w*0.34, baseY-h*0.74);
    g.lineTo(cx-w*0.04, baseY-h);
    g.lineTo(cx+w*0.46, baseY-h*0.46);
    g.lineTo(cx+w, baseY);
    g.closePath(); g.fill();
    g.fillStyle = sh; g.beginPath();
    g.moveTo(cx-w*0.04, baseY-h);
    g.lineTo(cx+w*0.46, baseY-h*0.46);
    g.lineTo(cx+w, baseY);
    g.lineTo(cx-w*0.02, baseY);
    g.closePath(); g.fill();
  }
  g.fillStyle = sh; g.fillRect(-2, baseY-1, W+4, 3);
}

/** An original walking figure. Silhouette only, deliberately generic:
 *  no costume, no topknot, no weapons, nothing that reads as anybody. */
export function walker(g, x, y, s, t, fill){
  const sw = Math.sin(t*2.0), bob = Math.abs(Math.cos(t*2.0))*s*0.05;
  y -= bob;
  g.fillStyle = fill;
  g.beginPath();
  g.moveTo(x-s*0.10, y-s*0.52); g.lineTo(x+s*0.10, y-s*0.52);
  g.lineTo(x+s*0.07+sw*s*0.20, y); g.lineTo(x-s*0.02+sw*s*0.20, y); g.closePath(); g.fill();
  g.beginPath();
  g.moveTo(x-s*0.10, y-s*0.52); g.lineTo(x+s*0.10, y-s*0.52);
  g.lineTo(x+s*0.04-sw*s*0.20, y); g.lineTo(x-s*0.05-sw*s*0.20, y); g.closePath(); g.fill();
  g.beginPath();
  g.moveTo(x-s*0.17, y-s*0.50); g.lineTo(x+s*0.17, y-s*0.50);
  g.lineTo(x+s*0.12, y-s*1.00); g.lineTo(x-s*0.12, y-s*1.00); g.closePath(); g.fill();
  g.beginPath(); g.arc(x, y-s*1.12, s*0.13, 0, 6.2832); g.fill();
  g.beginPath();
  g.moveTo(x-s*0.30, y-s*0.94); g.lineTo(x+s*0.30, y-s*0.94);
  g.lineTo(x+s*0.17, y-s*0.80); g.lineTo(x-s*0.17, y-s*0.80); g.closePath(); g.fill();
  g.fillRect(x+s*0.17, y-s*1.26, s*0.035, s*1.26);
}
