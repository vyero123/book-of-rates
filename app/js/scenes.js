/* The Book of Rates — scenes.
 *
 * A cascade rung IS a scene. The descent through rates becomes a journey,
 * and the breathing rate is expressed as the ENERGY OF THE MOTION rather
 * than as a number the user has to read.
 *
 *   fast  7.5 - 6.7 /min   GALLOP  horse through forest, grounded, rhythmic
 *   mid   6.0 - 5.4 /min   SWELL   boat on open water, swaying
 *   slow  5.0 and under    GLIDE   glider over a valley, floating
 *
 * In every scene the motion's rhythm IS the breath, never decoration:
 * the rider rises on the inhale, the hull lifts on the swell, the glider
 * climbs. Legs, foam and birds move faster, but nothing that reads as the
 * primary motion is off the breath.
 *
 * DEPTH. Pseudo-3D: flat unstroked shapes, discrete desaturating bands,
 * parallax and scale. The one piece of real perspective is the valley
 * floor in GLIDE, which uses screenY = horizon + k/z so it converges
 * properly. That is ten lines of maths, not a 3D engine — and the flat
 * idiom is exactly how this style renders space anyway.
 *
 * All artwork original. No characters, no reproduced frames.
 */

import { mix, pair } from './art.js';

const TAU = Math.PI*2;
const hash = i => { const x = Math.sin(i*127.1)*43758.5453; return x - Math.floor(x); };
const smooth = x => x*x*(3-2*x);

/* ---------- shared flat primitives ---------- */
function band(g, W, y0, y1, fill){ g.fillStyle = fill; g.fillRect(-2, y0, W+4, y1-y0+2); }

function cloudLobes(g, cx, cy, s, fill){
  g.fillStyle = fill; g.beginPath();
  for (const [dx,dy,r] of [[-1.5,.15,.55],[-.6,-.25,.78],[.35,-.42,.95],[1.2,-.1,.62],[1.9,.2,.42]]){
    g.moveTo(cx+dx*s, cy+dy*s); g.arc(cx+dx*s, cy+dy*s, r*s, 0, TAU);
  }
  g.rect(cx-2.1*s, cy+0.05*s, 4.3*s, 0.42*s);
  g.fill();
}

/* A conifer as a stack of flat triangles — no outline, no gradient. */
function conifer(g, x, baseY, h, w, fill){
  g.fillStyle = fill;
  const tiers = 4;
  for (let i = 0; i < tiers; i++){
    const f = i/tiers;
    const ty = baseY - h*(0.18 + f*0.78);
    const tw = w*(1 - f*0.62);
    g.beginPath();
    g.moveTo(x - tw, ty + h*0.20);
    g.lineTo(x, ty - h*0.10);
    g.lineTo(x + tw, ty + h*0.20);
    g.closePath(); g.fill();
  }
  g.fillRect(x - w*0.09, baseY - h*0.2, w*0.18, h*0.2);
}

/* Original horse-and-rider silhouette. Deliberately generic: no tack
   detail, no costume, nothing that reads as any particular character. */
function horseAndRider(g, x, y, s, legPhase, fill){
  g.fillStyle = fill;
  // barrel
  g.beginPath();
  g.ellipse(x, y - s*0.52, s*0.52, s*0.26, -0.06, 0, TAU);
  g.fill();
  // neck + head
  g.beginPath();
  g.moveTo(x + s*0.34, y - s*0.68);
  g.lineTo(x + s*0.80, y - s*1.02);
  g.lineTo(x + s*0.98, y - s*0.96);
  g.lineTo(x + s*0.86, y - s*0.78);
  g.lineTo(x + s*0.46, y - s*0.50);
  g.closePath(); g.fill();
  // tail
  g.beginPath();
  g.moveTo(x - s*0.50, y - s*0.66);
  g.lineTo(x - s*0.92, y - s*0.52);
  g.lineTo(x - s*0.88, y - s*0.30);
  g.lineTo(x - s*0.46, y - s*0.52);
  g.closePath(); g.fill();
  // four legs, two phase pairs — faster than the breath, as a gallop is
  for (let i = 0; i < 4; i++){
    const front = i < 2;
    const ph = legPhase + (front ? 0 : Math.PI) + (i%2)*0.7;
    const lx = x + (front ? s*0.34 : -s*0.34);
    const sw = Math.sin(ph), lift = Math.max(0, Math.cos(ph));
    g.beginPath();
    g.moveTo(lx - s*0.07, y - s*0.46);
    g.lineTo(lx + s*0.07, y - s*0.46);
    g.lineTo(lx + s*0.10 + sw*s*0.30, y - lift*s*0.16);
    g.lineTo(lx - s*0.02 + sw*s*0.30, y - lift*s*0.16);
    g.closePath(); g.fill();
  }
  // rider
  g.beginPath();
  g.moveTo(x - s*0.10, y - s*0.72);
  g.lineTo(x + s*0.14, y - s*0.72);
  g.lineTo(x + s*0.09, y - s*1.16);
  g.lineTo(x - s*0.07, y - s*1.16);
  g.closePath(); g.fill();
  g.beginPath(); g.arc(x + s*0.02, y - s*1.26, s*0.11, 0, TAU); g.fill();
}

/* Original small boat: hull, mast, sail. */
function boat(g, x, y, s, tilt, fill, sail){
  g.save(); g.translate(x, y); g.rotate(tilt);
  g.fillStyle = fill;
  g.beginPath();
  g.moveTo(-s*0.86, 0);
  g.lineTo(s*0.90, 0);
  g.lineTo(s*0.62, s*0.26);
  g.lineTo(-s*0.58, s*0.26);
  g.closePath(); g.fill();
  g.fillRect(-s*0.04, -s*1.05, s*0.07, s*1.05);
  g.fillStyle = sail;
  g.beginPath();
  g.moveTo(s*0.02, -s*1.02);
  g.lineTo(s*0.02, -s*0.10);
  g.lineTo(s*0.70, -s*0.16);
  g.closePath(); g.fill();
  g.restore();
}

/* Original glider seen from behind and slightly above. */
function glider(g, x, y, s, bank, fill, lit){
  g.save(); g.translate(x, y); g.rotate(bank);
  g.fillStyle = fill;
  g.beginPath();                       // wing
  g.moveTo(-s*1.5, 0);
  g.lineTo(-s*0.18, -s*0.14);
  g.lineTo(s*0.18, -s*0.14);
  g.lineTo(s*1.5, 0);
  g.lineTo(s*0.18, s*0.07);
  g.lineTo(-s*0.18, s*0.07);
  g.closePath(); g.fill();
  g.beginPath();                       // fuselage
  g.ellipse(0, s*0.04, s*0.22, s*0.30, 0, 0, TAU);
  g.fill();
  g.fillStyle = lit;                   // lit upper wing edge: one hard shape
  g.beginPath();
  g.moveTo(-s*1.5, 0); g.lineTo(-s*0.18, -s*0.14);
  g.lineTo(s*0.18, -s*0.14); g.lineTo(s*1.5, 0);
  g.lineTo(s*0.9, -s*0.03); g.lineTo(-s*0.9, -s*0.03);
  g.closePath(); g.fill();
  g.restore();
}

/* ================================================================== *
 *  scenes
 * ================================================================== */

/* --- GALLOP: forest, fast, grounded. The rider rises on the inhale
   (which is what a rider actually does), while the legs run faster. --- */
const gallop = {
  id: 'gallop',
  name: 'The Forest Road',
  theme: 'cliffs-midday',
  energy: 'fast',
  pal: {
    skyHi: ['#2E4A3C','#4E7A52'], skyLo: ['#6E9A5E','#C9D98A'],
    far:'#2A4436', mid:'#1C3328', near:'#122018', ground:['#3A3326','#6B5A37'],
    fig:'#0B1410', dust:'rgba(201,217,138,0.16)'
  },
  draw(c){
    const { g, W, H, t, lv } = c;
    const P = this.pal;
    const horizon = H*0.52;
    band(g, W, 0, horizon*0.55, pair(P.skyHi, lv));
    band(g, W, horizon*0.55, horizon+2, pair(P.skyLo, lv));

    const sx = W*0.70, sy = horizon*0.40 - lv*H*0.02;
    g.fillStyle = `rgba(255,243,196,${0.5+lv*0.3})`;
    g.beginPath(); g.arc(sx, sy, H*0.045, 0, TAU); g.fill();

    g.fillStyle = P.ground[0]; g.fillRect(-2, horizon, W+4, H-horizon+4);

    // three depths of trees at different parallax speeds
    const layers = [
      { sp: 60,  y: horizon+H*0.010, h: H*0.16, w: W*0.030, fill: P.far,  n: 9,  seed: 3 },
      { sp: 130, y: horizon+H*0.055, h: H*0.24, w: W*0.045, fill: P.mid,  n: 7,  seed: 31 },
      { sp: 320, y: horizon+H*0.160, h: H*0.40, w: W*0.075, fill: P.near, n: 5,  seed: 77 }
    ];
    for (const L of layers){
      const span = W/L.n*1.6;
      const first = Math.floor((t*L.sp)/span);
      for (let i = first-1; i <= first + L.n + 1; i++){
        const x = i*span - t*L.sp % (span*1e6);
        const xx = ((x % (span*(L.n+2))) + span*(L.n+2)) % (span*(L.n+2)) - span;
        const jitter = hash(i+L.seed);
        conifer(g, xx, L.y + jitter*H*0.012, L.h*(0.8+jitter*0.45), L.w*(0.8+jitter*0.4), L.fill);
      }
    }

    // road
    const roadY = H*0.80;
    g.fillStyle = pair(P.ground, lv*0.6);
    g.beginPath();
    g.moveTo(-4, H+4); g.lineTo(-4, roadY+H*0.02);
    g.lineTo(W*0.5, roadY-H*0.01); g.lineTo(W+4, roadY+H*0.03); g.lineTo(W+4, H+4);
    g.closePath(); g.fill();

    // dust kicked up behind, independent of the breath
    for (let i = 0; i < 7; i++){
      const p = ((t*0.9 + i/7) % 1);
      const dx = W*0.30 - p*W*0.42, dy = roadY - p*H*0.04;
      g.fillStyle = P.dust;
      g.beginPath(); g.arc(dx, dy, H*0.012*(0.4+p*1.6), 0, TAU); g.fill();
    }

    // THE BREATH: the rider rises on the inhale and settles on the exhale
    const rise = smooth(lv)*H*0.055;
    horseAndRider(g, W*0.40, roadY - rise, H*0.085, t*9.0, P.fig);
  }
};

/* --- SWELL: open water, medium energy, swaying. The hull lifts on the
   inhale. The boat's tilt follows the RATE OF CHANGE of the breath, so
   it leans into the turnarounds the way a hull actually does. --- */
const swell = {
  id: 'swell',
  name: 'The Open Water',
  theme: 'night-pool',
  energy: 'mid',
  pal: {
    skyHi: ['#1E2A55','#4A5C94'], skyLo: ['#5E6FA8','#C98B6B'],
    seaFar: ['#20305E','#3C5186'], seaNear: ['#16224A','#2C3F72'],
    foam: '#DCE4F2', isle: '#141C3C', fig:'#0A0F22', sail:'#E8DCC4'
  },
  draw(c){
    const { g, W, H, t, lv, dlv } = c;
    const P = this.pal;
    const horizon = H*0.44;
    band(g, W, 0, horizon*0.58, pair(P.skyHi, lv));
    band(g, W, horizon*0.58, horizon+2, pair(P.skyLo, lv));

    for (let i = 0; i < 3; i++){
      const cw = W*2.2;
      const x = ((W*0.2 + i*cw/3) - t*7) % cw;
      cloudLobes(g, (x<0?x+cw:x) - W*0.2, horizon*0.26 + (i%2)*H*0.04,
                 H*0.018, `rgba(232,220,196,${0.13+lv*0.08})`);
    }

    // a distant island so the horizon is not empty
    g.fillStyle = P.isle;
    g.beginPath();
    g.moveTo(W*0.06, horizon); g.lineTo(W*0.14, horizon-H*0.035);
    g.lineTo(W*0.21, horizon-H*0.012); g.lineTo(W*0.28, horizon);
    g.closePath(); g.fill();

    band(g, W, horizon, horizon+H*0.06, pair(P.seaFar, lv));
    band(g, W, horizon+H*0.06, H+4, pair(P.seaNear, lv));

    // swell bands: closer together near the horizon, so the sea recedes
    for (let i = 0; i < 9; i++){
      const f = i/9;
      const z = 1 - f;
      const baseY = horizon + H*0.06 + Math.pow(f, 1.7)*H*0.62;
      const drift = (t*0.22 + i*0.37) % 1;
      const y = baseY + drift*H*0.02;
      const amp = H*0.006 + f*H*0.016;
      g.fillStyle = `rgba(220,228,242,${0.05 + f*0.14})`;
      g.beginPath(); g.moveTo(-4, y);
      for (let x = -4; x <= W+4; x += 8){
        g.lineTo(x, y + Math.sin(x*0.018 + t*0.9 + i)*amp);
      }
      g.lineTo(W+4, y + H*0.008); g.lineTo(-4, y + H*0.008);
      g.closePath(); g.fill();
    }

    // THE BREATH: the hull rises with the swell
    const bx = W*0.46;
    const by = H*0.74 - smooth(lv)*H*0.085;
    const tilt = -(dlv||0)*0.75;          // leans into the turnarounds
    boat(g, bx, by, H*0.075, tilt, P.fig, P.sail);

    // foam at the waterline of the hull
    g.fillStyle = P.foam;
    g.globalAlpha = 0.5 + lv*0.3;
    g.beginPath();
    g.ellipse(bx, by + H*0.014, H*0.085, H*0.008, tilt, 0, TAU);
    g.fill(); g.globalAlpha = 1;
  }
};

/* --- GLIDE: a valley seen INTO the phone. The one place with real
   perspective: the floor uses screenY = horizon + k/z, so transverse
   ridges converge properly as they recede. The glider climbs on the
   inhale and sinks on the exhale. --- */
const glide = {
  id: 'glide',
  name: 'The High Valley',
  theme: 'desert-dusk',
  energy: 'slow',
  pal: {
    skyHi: ['#2B1B4E','#5B3A6E'], skyMid: ['#8A3B63','#D86B52'], skyLo: ['#C9663F','#F6B04A'],
    wallL: '#3A1F43', wallR: '#2A1733', floor: ['#4A2440','#7A4A48'],
    rib: 'rgba(246,176,74,0.16)', fig: '#160C1A', lit: '#F6D9A8'
  },
  state: null,
  draw(c){
    const { g, W, H, t, lv } = c;
    const P = this.pal;
    const horizon = H*0.46;

    band(g, W, 0, horizon*0.42, pair(P.skyHi, lv));
    band(g, W, horizon*0.42, horizon*0.76, pair(P.skyMid, lv));
    band(g, W, horizon*0.76, horizon+2, pair(P.skyLo, lv));

    const sy = horizon - H*0.02 - lv*H*0.03;
    g.fillStyle = `rgba(255,232,176,${0.6+lv*0.3})`;
    g.beginPath(); g.arc(W*0.5, sy, H*0.05, 0, TAU); g.fill();

    // --- perspective projection: the only real 3D maths in the project ---
    const k = H*0.42;                   // focal length in screen units
    const py = z => horizon + k/z;      // ground plane at unit depth below eye
    const px = (xw, z) => W*0.5 + (xw*k)/z;

    g.fillStyle = pair(P.floor, lv*0.5);
    g.fillRect(-2, horizon, W+4, H-horizon+4);

    // transverse ribs on the valley floor, marching toward the viewer
    if (!this.state) this.state = { off: 0, last: t };
    const S = this.state;
    const dt = Math.min(0.1, Math.max(0, t - S.last)); S.last = t;
    S.off = (S.off + dt*0.55) % 1;

    const RIBS = 16;
    for (let i = RIBS; i >= 1; i--){
      const z = (i - S.off) * 0.52;
      if (z < 0.35) continue;
      const y = py(z);
      if (y > H+8) continue;
      const half = 2.6;
      g.fillStyle = `rgba(246,176,74,${(0.03 + 0.14/z).toFixed(3)})`;
      g.fillRect(px(-half, z), y, px(half, z) - px(-half, z), Math.max(1, k/(z*z)*0.05));
    }

    // Valley walls. Built from the vanishing point outward, following the
    // ridge, then DOWN the screen edge and back along the bottom — a wall
    // closed upward instead fills the sky, which is what it did at first.
    const wall = (sign, fill, hw) => {
      g.fillStyle = fill;
      g.beginPath();
      g.moveTo(W*0.5, horizon);
      let lastX = W*0.5, lastY = horizon;
      for (let i = 1; i <= 9; i++){
        const z = 0.55 + i*0.75;
        const ridge = 0.42 + hash(i*7 + (sign>0?11:23))*0.55;
        const x = px(sign*hw, z);
        const y = py(z) - (k/z)*ridge*0.5;
        g.lineTo(x, y);
        lastX = x; lastY = y;
        if (sign > 0 ? x > W + 8 : x < -8) break;
      }
      g.lineTo(sign > 0 ? W+8 : -8, lastY);
      g.lineTo(sign > 0 ? W+8 : -8, H+8);
      g.lineTo(W*0.5, H+8);
      g.closePath(); g.fill();
    };
    wall(-1, P.wallL, 0.95);
    wall( 1, P.wallR, 1.05);

    // THE BREATH: the glider climbs on the inhale, sinks on the exhale
    const gy = horizon - H*0.02 - smooth(lv)*H*0.20;
    const bank = Math.sin(t*0.31)*0.10;
    glider(g, W*0.5, gy, H*0.055, bank, P.fig, P.lit);

    // its shadow on the floor, tying it to the ground plane
    const shz = 3.2 - smooth(lv)*1.1;
    g.fillStyle = 'rgba(22,12,26,0.26)';
    g.beginPath();
    g.ellipse(W*0.5, py(shz), (k/shz)*0.10, (k/shz)*0.022, 0, 0, TAU);
    g.fill();
  }
};

export const SCENES = { gallop, swell, glide };

/** Which scene a rung gets. Motion energy maps to rate: the faster the
 *  breathing, the more active the world. */
export function sceneForBeats(beats){
  if (beats <= 18) return gallop;   // 7.5 - 6.7 /min
  if (beats <= 20) return swell;    // 6.0 /min
  return glide;                     // 5.45 /min and slower
}

/** The scene list a whole session will pass through, in order. */
export function sceneRun(session){
  const out = [];
  for (const s of session.stages){
    const sc = sceneForBeats(s.protocol.cycleBeats);
    if (!out.length || out[out.length-1].scene !== sc){
      out.push({ scene: sc, t0: s.t0, t1: s.t1 });
    } else {
      out[out.length-1].t1 = s.t1;
    }
  }
  return out;
}
