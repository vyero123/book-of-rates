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

export const TAU = Math.PI*2;
export const hash = i => { const x = Math.sin(i*127.1)*43758.5453; return x - Math.floor(x); };
export const smooth = x => x*x*(3-2*x);

/* ---------- shared flat primitives ---------- */
export function band(g, W, y0, y1, fill){ g.fillStyle = fill; g.fillRect(-2, y0, W+4, y1-y0+2); }

export function cloudLobes(g, cx, cy, s, fill){
  g.fillStyle = fill; g.beginPath();
  for (const [dx,dy,r] of [[-1.5,.15,.55],[-.6,-.25,.78],[.35,-.42,.95],[1.2,-.1,.62],[1.9,.2,.42]]){
    g.moveTo(cx+dx*s, cy+dy*s); g.arc(cx+dx*s, cy+dy*s, r*s, 0, TAU);
  }
  g.rect(cx-2.1*s, cy+0.05*s, 4.3*s, 0.42*s);
  g.fill();
}

/* A conifer as a stack of flat triangles — no outline, no gradient. */
export function conifer(g, x, baseY, h, w, fill){
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
/* The horse, seen from the saddle. A side-on silhouette demands anatomy
 * to be right and reads as a blob when it is not; from up here the animal
 * is carried by two ears and the crest of a neck, which is both far more
 * legible and far more immersive. Original, generic, no tack detail. */
function neckAndEars(g, W, H, cx, poll, bob, fill, mane){
  const baseW = W*0.215, pollW = W*0.060;
  const lean = Math.sin(bob*0.5)*W*0.012;

  // the neck: a tapering wedge from the bottom edge up to the poll
  g.fillStyle = fill;
  g.beginPath();
  g.moveTo(cx - baseW, H + 6);
  g.bezierCurveTo(cx - baseW*0.78, poll + (H-poll)*0.45,
                  cx - pollW*1.5 + lean, poll + (H-poll)*0.16,
                  cx - pollW + lean, poll);
  g.lineTo(cx + pollW + lean, poll);
  g.bezierCurveTo(cx + pollW*1.5 + lean, poll + (H-poll)*0.16,
                  cx + baseW*0.78, poll + (H-poll)*0.45,
                  cx + baseW, H + 6);
  g.closePath(); g.fill();

  // mane along the crest: flat tapering flicks, lagging the bob
  g.fillStyle = mane;
  for (let i = 0; i < 9; i++){
    const f = i/8;
    const y = poll + (H - poll)*f*0.72;
    const w = pollW + (baseW - pollW)*f*0.8;
    const flick = Math.sin(bob*0.5 - f*1.8)*W*0.013*(0.4 + f);
    g.beginPath();
    g.moveTo(cx - w + lean*(1-f), y);
    g.lineTo(cx - w - W*0.030 + flick, y + H*0.016);
    g.lineTo(cx - w + lean*(1-f), y + H*0.022);
    g.closePath(); g.fill();
  }

  // ears: two flat triangles at the poll, angled apart and twitching
  g.fillStyle = fill;
  [-1, 1].forEach(sgn => {
    const tw = Math.sin(bob*0.37 + (sgn>0?1.3:0))*0.10;
    const bx = cx + lean + sgn*pollW*0.62;
    const h = H*0.040;
    g.save(); g.translate(bx, poll); g.rotate(sgn*(0.17 + tw));
    g.beginPath();
    g.moveTo(-W*0.016, 0);
    g.lineTo(0, -h);
    g.lineTo(W*0.015, 0);
    g.closePath(); g.fill();
    g.restore();
  });
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
    far:'#2A4436', mid:'#1C3328', near:'#122018',
    road:['#3A3326','#6B5A37'], fig:'#0B1410', mane:'#060C08',
    dust:'rgba(201,217,138,0.14)'
  },
  draw(c){
    const { g, W, H, t, lv } = c;
    const P = this.pal;

    // the gallop bob is fast; the breath moves the whole camera slowly
    const stride = t*7.6;
    const breathLift = smooth(lv)*H*0.030;
    const horizon = H*0.40 + breathLift + Math.sin(stride)*H*0.006;

    band(g, W, 0, horizon*0.50, pair(P.skyHi, lv));
    band(g, W, horizon*0.50, horizon*0.74, mix(pair(P.skyHi, lv), pair(P.skyLo, lv), 0.5));
    band(g, W, horizon*0.74, horizon+2, pair(P.skyLo, lv));

    // flat cloud bars drifting, so the sky band is not an empty slab
    for (let i = 0; i < 4; i++){
      const cw = W*(0.38 + (i%3)*0.16);
      const cx = ((i*W*0.7 - t*9) % (W + cw*2)) - cw;
      g.fillStyle = `rgba(243,234,215,${0.07 + (i%2)*0.04})`;
      g.fillRect(cx, horizon*(0.20 + i*0.11), cw, H*0.012);
      g.fillRect(cx + cw*0.22, horizon*(0.20 + i*0.11) + H*0.012, cw*0.55, H*0.008);
    }

    const sx = W*0.70, sy = horizon*0.40;
    g.fillStyle = `rgba(255,243,196,${0.45+lv*0.3})`;
    g.beginPath(); g.arc(sx, sy, H*0.042, 0, TAU); g.fill();

    // distant tree line, so the horizon band is not an empty slab
    g.fillStyle = P.far;
    g.beginPath(); g.moveTo(-4, horizon+2);
    for (let x = -4; x <= W+4; x += 9){
      const hh = (0.5 + hash(Math.floor(x/9)+5)*0.5) * H*0.030;
      g.lineTo(x, horizon - hh);
      g.lineTo(x+4.5, horizon - hh*0.45);
    }
    g.lineTo(W+4, horizon+2); g.closePath(); g.fill();

    g.fillStyle = pair(P.road, lv*0.5);
    g.fillRect(-2, horizon, W+4, H-horizon+4);

    // perspective: the road and the trees recede to the vanishing point,
    // so the world comes AT the viewer rather than sliding past
    const k = H*0.40;
    const py = z => horizon + k/z;
    const px = (xw, z) => W*0.5 + (xw*k)/z;

    if (!this.st) this.st = { off:0, last:t };
    const S = this.st;
    const dt = Math.min(0.1, Math.max(0, t - S.last)); S.last = t;
    S.off = (S.off + dt*1.35) % 1;

    // the road: a lit surface between two darker verges, with ruts that
    // converge on the vanishing point so the ground reads as ground
    g.fillStyle = mix(pair(P.road, lv*0.8), '#8A7549', 0.35);
    g.beginPath();
    g.moveTo(px(-0.42, 9), py(9));
    g.lineTo(px(0.42, 9), py(9));
    g.lineTo(px(0.95, 0.45), H+8);
    g.lineTo(px(-0.95, 0.45), H+8);
    g.closePath(); g.fill();

    for (const rx of [-0.17, 0.17]){
      g.fillStyle = 'rgba(40,32,20,0.30)';
      g.beginPath();
      g.moveTo(px(rx-0.012, 9), py(9));
      g.lineTo(px(rx+0.012, 9), py(9));
      g.lineTo(px(rx*2.1+0.055, 0.45), H+8);
      g.lineTo(px(rx*2.1-0.055, 0.45), H+8);
      g.closePath(); g.fill();
    }
    // stones and ruts rushing past, tied to the same marching offset
    for (let i = 14; i >= 1; i--){
      const z = (i - S.off)*0.72;
      if (z < 0.35) continue;
      const jx = (hash(i*13)*2-1)*0.36;
      g.fillStyle = `rgba(28,22,14,${(0.05 + 0.18/z).toFixed(3)})`;
      const w = (k/z)*0.045, h2 = Math.max(1, (k/z)*0.012);
      g.fillRect(px(jx, z) - w/2, py(z), w, h2);
    }

    // trees both sides, marching toward the viewer
    const N = 13;
    for (let i = N; i >= 1; i--){
      const z = (i - S.off)*0.72;
      if (z < 0.32) continue;
      const scale = k/z;
      for (const sgn of [-1, 1]){
        const jitter = hash(i*5 + (sgn>0?17:41) + Math.floor(S.off*0 ));
        const xw = sgn*(0.62 + jitter*0.55);
        const x = px(xw, z);
        if (x < -W*0.5 || x > W*1.5) continue;
        const fill = z > 5 ? P.far : z > 2.2 ? P.mid : P.near;
        conifer(g, x, py(z), scale*(0.55 + jitter*0.45), scale*0.11, fill);
      }
    }

    // dust thrown up beside the road, faster than the breath
    for (let i = 0; i < 6; i++){
      const p = ((t*1.3 + i/6) % 1);
      const z = 0.5 + p*1.6;
      g.fillStyle = P.dust;
      const dz = z, dx = px((i%2?-1:1)*(0.48+p*0.3), dz), dy = py(dz);
      g.beginPath();
      g.ellipse(dx, dy, (k/dz)*0.055*(0.3+p), (k/dz)*0.016*(0.3+p), 0, 0, TAU);
      g.fill();
    }

    // THE BREATH: the neck lengthens and lifts on the inhale
    const poll = H*0.695 - breathLift*1.3 - Math.sin(stride)*H*0.010;
    neckAndEars(g, W, H, W*0.5, poll, stride, P.fig, P.mane);
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
    wallL: '#4A2A52', wallLs: '#331B3B', wallR: '#2A1733', wallRs: '#1C0F24',
    wallLit: '#8A4A5E', talus: '#5A3048', floor: ['#4A2440','#7A4A48'],
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

    // floor in discrete depth bands: lighter far, darker near
    g.fillStyle = mix(pair(P.floor, lv*0.5), '#3A1A30', 0.35);
    g.fillRect(-2, horizon, W+4, H-horizon+4);
    for (let i = 0; i < 5; i++){
      const z0 = 0.45 + i*1.6, z1 = 0.45 + (i+1)*1.6;
      const y0 = Math.max(horizon, py(z1)), y1 = py(z0);
      g.fillStyle = mix(pair(P.floor, lv*0.5), '#4A2440', i/7);
      g.fillRect(-2, y0, W+4, Math.max(1, y1-y0)+1);
    }
    g.fillStyle = mix(pair(P.floor, lv*0.5), '#3A1A30', 5/7);
    g.fillRect(-2, py(0.45), W+4, H);

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

    // Valley walls. Each wall is ONE flat wedge: from the vanishing point,
    // out along a rising ridge to the screen edge, down to the bottom
    // corner, then back along the bottom only as far as the floor's edge —
    // which leaves a corridor of valley floor down the middle.
    //
    // Two earlier attempts failed in opposite directions: closing the
    // polygon upward filled the sky, and building it as a ridge-to-floor
    // strip collapsed to nothing at depth. A wedge cannot do either.
    const FLOOR_HALF = 0.34;        // how much floor is left in the middle
    const wedge = (sign, hw, fill, shadeFill) => {
      const edgeX = sign > 0 ? W + 12 : -12;
      const pts = [[W*0.5, horizon]];
      for (let i = 1; i <= 12; i++){
        const z = 0.45 + i*0.55;
        const r = 0.34 + hash(i*7 + (sign>0?11:23))*0.5;
        const x = px(sign*hw, z);
        pts.push([x, py(z) - (k/z)*r*0.5]);
        if (sign > 0 ? x > W + 10 : x < -10) break;
      }
      g.fillStyle = fill;
      g.beginPath();
      pts.forEach(([x,y], i) => i ? g.lineTo(x,y) : g.moveTo(x,y));
      g.lineTo(edgeX, pts[pts.length-1][1]);
      g.lineTo(edgeX, H + 12);
      g.lineTo(px(sign*FLOOR_HALF, 0.42), H + 12);
      g.closePath(); g.fill();

      // the lower slope of the wall, one value darker, meeting the floor
      g.fillStyle = shadeFill;
      g.beginPath();
      g.moveTo(W*0.5, horizon);
      for (let i = 1; i <= 12; i++){
        const z = 0.45 + i*0.55;
        g.lineTo(px(sign*hw*0.55, z), py(z) - (k/z)*0.07);
        if ((sign>0 ? px(sign*hw*0.55, z) : -px(sign*hw*0.55, z)) > W) break;
      }
      g.lineTo(edgeX, H + 12);
      g.lineTo(px(sign*FLOOR_HALF, 0.42), H + 12);
      g.closePath(); g.fill();
    };
    wedge(-1, 0.88, P.wallL, P.wallLs);
    wedge( 1, 1.00, P.wallR, P.wallRs);

    // a lit rim on the sunward ridge: one hard shape, no gradient
    g.fillStyle = P.wallLit;
    g.beginPath();
    g.moveTo(W*0.5, horizon);
    for (let i = 1; i <= 12; i++){
      const z = 0.45 + i*0.55;
      const r = 0.34 + hash(i*7 + 11)*0.5;
      const x = px(-0.88, z);
      g.lineTo(x, py(z) - (k/z)*r*0.5);
      if (x < -10) break;
    }
    for (let i = 12; i >= 1; i--){
      const z = 0.45 + i*0.55;
      const r = 0.34 + hash(i*7 + 11)*0.5;
      const x = px(-0.88, z);
      if (x < -10) continue;
      g.lineTo(x + W*0.010, py(z) - (k/z)*r*0.5 + (k/z)*0.05);
    }
    g.closePath(); g.fill();

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
