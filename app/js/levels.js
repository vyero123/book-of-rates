/* The Book of Rates — the three interactive levels.
 *
 * THE RULE, which is not negotiable and is also a safety property:
 * THE INTERACTION GUARANTEES SUCCESS. It exists to pace breathing. It
 * cannot be won and it cannot be lost. Nothing is scored, nothing is
 * streaked, nothing is failed.
 *
 * Concretely, every input here is EXPRESSIVE, never CAUSAL. The thing that
 * advances is always on the schedule; the user's input changes how the
 * scene looks and feels. Lift your finger and the level continues. Every
 * documented breathwork death I found in the research involved somebody
 * trying to beat something, so "you cannot fail this" is not kindness
 * alone — it is the design refusing to create the incentive.
 *
 * Scenes receive `c.input`: { down, x, y, slider, left, right }.
 */

import { TAU, hash, smooth, band, cloudLobes, conifer } from './scenes.js';
import { mix, pair } from './art.js';

/* ============================================================ *
 *  KITE LINE — the handedness-switchable slider
 *  Pull up to inhale, hold at the top, down to exhale.
 *  The kite's height is the SCHEDULE. The slider bends the line and
 *  colours the tail. Cloud gaps are generated from the breath, so
 *  following the pacing always clears them — and drifting off pace
 *  WIDENS the gap rather than causing a collision.
 * ============================================================ */
export const kite = {
  id: 'kite', name: 'The Kite Line', theme: 'temple-noon', energy: 'mid',
  needsInput: 'slider',
  pal: {
    skyHi:['#5E86A8','#9FC6D8'], skyMid:['#9FB8C6','#E7E2C4'], skyLo:['#C7C3A4','#F2E9CE'],
    far:'#6E7E8C', mid:'#4A5A68', near:'#2A3A4A', deep:'#17222E',
    kite:'#E4572E', tail:'#F6B04A', line:'rgba(26,34,46,0.55)', cloud:'#FFFFFF'
  },
  draw(c){
    const { g, W, H, t, lv, input } = c;
    const P = this.pal;
    const horizon = H*0.82;

    band(g, W, 0, H*0.30, pair(P.skyHi, lv));
    band(g, W, H*0.30, H*0.56, pair(P.skyMid, lv));
    band(g, W, H*0.56, horizon+2, pair(P.skyLo, lv));

    // layered plateau ridges, far below — this is a level about height
    const ridge = (y, amp, speed, fill, seed) => {
      g.fillStyle = fill;
      g.beginPath(); g.moveTo(-4, H+4); g.lineTo(-4, y);
      for (let x = -4; x <= W+4; x += 10){
        const n = hash(Math.floor((x + t*speed)/28) + seed);
        g.lineTo(x, y - n*amp);
      }
      g.lineTo(W+4, y); g.lineTo(W+4, H+4); g.closePath(); g.fill();
    };
    ridge(horizon,            H*0.035, 7,  P.far,  3);
    ridge(horizon + H*0.055,  H*0.045, 16, P.mid,  31);
    ridge(horizon + H*0.110,  H*0.055, 34, P.near, 77);
    g.fillStyle = P.deep; g.fillRect(-2, H*0.955, W+4, H);

    /* the cloud gaps. Each cloud's gap is placed at the height the breath
       schedule will have the kite at when it arrives — so the kite always
       passes through. There is no collision test anywhere in this file. */
    const kiteX = W*0.34;
    const kiteY = H*0.66 - smooth(lv)*H*0.46;
    for (let i = 0; i < 5; i++){
      const period = 7.5;
      const phase = ((t/period) + i/5) % 1;
      const cx = W + W*0.3 - phase*(W*1.6);
      if (cx < -W*0.4 || cx > W*1.4) continue;
      // where the kite WILL be when this cloud reaches it
      const lead = Math.max(0, (cx - kiteX) / (W*1.6/period));
      const futureLv = 0.5 - 0.5*Math.cos(((t+lead)*TAU)/11);
      const gapY = H*0.66 - futureLv*H*0.46;
      const gapH = H*0.13 + Math.abs(gapY - kiteY)*0.9;   // drifting widens it
      g.fillStyle = `rgba(255,255,255,${0.30 + (i%2)*0.1})`;
      cloudLobes(g, cx, gapY - gapH/2 - H*0.045, H*0.030, `rgba(255,255,255,0.32)`);
      cloudLobes(g, cx, gapY + gapH/2 + H*0.045, H*0.026, `rgba(255,255,255,0.26)`);
    }

    // the line, bent by the slider: pure expression, affects nothing
    const pull = input ? input.slider : lv;
    const anchorX = W*0.5, anchorY = H*0.985;
    g.strokeStyle = P.line; g.lineWidth = Math.max(1, W*0.004);
    g.beginPath();
    g.moveTo(anchorX, anchorY);
    g.quadraticCurveTo(
      anchorX + (kiteX-anchorX)*0.45 - (pull-0.5)*W*0.22,
      (anchorY + kiteY)*0.5 + (1-pull)*H*0.06,
      kiteX, kiteY);
    g.stroke();

    // the kite: a flat diamond, banking with the pull
    const bank = (pull - 0.5)*0.5 + Math.sin(t*0.7)*0.06;
    const s = H*0.030;
    g.save(); g.translate(kiteX, kiteY); g.rotate(bank);
    g.fillStyle = P.kite;
    g.beginPath();
    g.moveTo(0,-s*1.5); g.lineTo(s,0); g.lineTo(0,s*1.5); g.lineTo(-s,0);
    g.closePath(); g.fill();
    g.fillStyle = mix(P.kite, '#1A222E', 0.35);
    g.beginPath(); g.moveTo(0,-s*1.5); g.lineTo(s,0); g.lineTo(0,s*1.5); g.closePath(); g.fill();
    // tail: its liveliness is the one thing the slider really controls
    g.fillStyle = P.tail;
    for (let i = 1; i <= 5; i++){
      const yy = s*1.5 + i*s*0.62;
      const xx = Math.sin(t*3 - i*0.8)*s*0.5*(0.3 + pull);
      g.beginPath(); g.ellipse(xx, yy, s*0.20, s*0.10, 0, 0, TAU); g.fill();
    }
    g.restore();
  }
};

/* ============================================================ *
 *  THE RUN — two buttons, bottom-left and bottom-right
 *  Left is the inhale, right is the exhale. The glider's path is the
 *  SCHEDULE. The buttons change how it flies, never whether it survives.
 *  8 breaths a minute with no holds: brisk, and nowhere near
 *  hyperventilation. The arousal is the speed and the music, honestly.
 * ============================================================ */
export const flight = {
  id: 'flight', name: 'The Run', theme: 'cliffs-midday', energy: 'fast',
  needsInput: 'buttons',
  pal: {
    skyHi:['#2E5A7A','#7FB4C9'], skyLo:['#BFE3B4','#F2E6A0'],
    cliffL:'#1C3A44', cliffLs:'#102730', cliffR:'#173A44', cliffRs:'#0C222A',
    sea:'#173A44', fig:'#0A1418', lit:'#E4572E', speed:'rgba(242,230,160,0.5)'
  },
  draw(c){
    const { g, W, H, t, lv, input } = c;
    const P = this.pal;
    const horizon = H*0.42;
    band(g, W, 0, horizon*0.6, pair(P.skyHi, lv));
    band(g, W, horizon*0.6, horizon+2, pair(P.skyLo, lv));

    const k = H*0.44;
    const py = z => horizon + k/z;
    const px = (xw, z) => W*0.5 + (xw*k)/z;

    g.fillStyle = P.sea; g.fillRect(-2, horizon, W+4, H-horizon+4);

    if (!this.st) this.st = { off:0, last:t };
    const S = this.st;
    const dt = Math.min(0.1, Math.max(0, t - S.last)); S.last = t;
    S.off = (S.off + dt*2.1) % 1;                    // fast: this is the quick level

    // cliff stacks rushing past on both sides
    for (let i = 13; i >= 1; i--){
      const z = (i - S.off)*0.62;
      if (z < 0.3) continue;
      const sc = k/z;
      for (const sgn of [-1, 1]){
        const j = hash(i*9 + (sgn>0?5:23));
        const x = px(sgn*(0.80 + j*0.3), z);
        if (x < -W*0.6 || x > W*1.6) continue;
        const hgt = sc*(0.5 + j*0.6), wid = sc*0.34;
        g.fillStyle = sgn > 0 ? P.cliffR : P.cliffL;
        g.beginPath();
        g.moveTo(x - wid, py(z));
        g.lineTo(x - wid*0.7, py(z) - hgt*0.92);
        g.lineTo(x + wid*0.5, py(z) - hgt);
        g.lineTo(x + wid, py(z));
        g.closePath(); g.fill();
        g.fillStyle = sgn > 0 ? P.cliffRs : P.cliffLs;
        g.beginPath();
        g.moveTo(x + wid*0.5, py(z) - hgt);
        g.lineTo(x + wid, py(z));
        g.lineTo(x + wid*0.1, py(z));
        g.closePath(); g.fill();
      }
    }

    // speed lines: louder when a button is held. Expression only.
    const boost = input && (input.left || input.right) ? 1 : 0.35;
    for (let i = 0; i < 14; i++){
      const p = ((t*1.9 + i/14) % 1);
      const z = 0.35 + (1-p)*5;
      const sgn = i % 2 ? 1 : -1;
      const x = px(sgn*(0.25 + (i%5)*0.09), z);
      g.fillStyle = P.speed;
      g.globalAlpha = 0.10 + p*0.5*boost;
      g.fillRect(x, py(z), Math.max(1, (k/z)*0.012), (k/z)*0.09*(0.4+p));
      g.globalAlpha = 1;
    }

    // the glider follows the schedule, and only the schedule
    const gy = horizon - H*0.01 - smooth(lv)*H*0.17;
    const lean = input ? ((input.right?1:0) - (input.left?1:0))*0.18 : 0;
    const bank = Math.sin(t*0.5)*0.07 + lean;
    const s = H*0.050;
    g.save(); g.translate(W*0.5, gy); g.rotate(bank);
    g.fillStyle = P.fig;
    g.beginPath();
    g.moveTo(-s*1.6,0); g.lineTo(-s*0.2,-s*0.15); g.lineTo(s*0.2,-s*0.15);
    g.lineTo(s*1.6,0); g.lineTo(s*0.2,s*0.08); g.lineTo(-s*0.2,s*0.08);
    g.closePath(); g.fill();
    g.beginPath(); g.ellipse(0, s*0.05, s*0.24, s*0.32, 0, 0, TAU); g.fill();
    g.fillStyle = P.lit;
    g.fillRect(-s*1.6, -s*0.04, s*3.2, s*0.05);
    g.restore();
  }
};

/* ============================================================ *
 *  THE PEARL DIVER — hold a finger on the screen
 *
 *  NO BREATH RETENTION. Decided and recorded in design doc 2.4: the
 *  diver sinks through a long exhale, rests at the bottom of it, and
 *  rises on the inhale. "Underwater" is the bottom of an exhale, not a
 *  hold against the urge to breathe. There is no fast breathing before
 *  it, no timer, no duration shown, no record of any kind.
 *
 *  Lifting your finger surfaces the diver EARLY AND WITH THE PEARL.
 *  There is no shorter-is-worse state. The light indicator counts DOWN
 *  to surfacing, so the pressure the UI creates points up, toward air.
 * ============================================================ */
export const dive = {
  id: 'dive', name: 'The Pearl Diver', theme: 'night-pool', energy: 'slow',
  needsInput: 'hold',
  pal: {
    air:['#8AC6D0','#D8EDE4'],
    shallow:['#2E8E92','#5FB9B0'], mid:['#176A72','#2E8E92'], deepC:['#0A2E3C','#124C56'],
    floor:'#06181F', kelp:'#0B3038', fig:'#061A20', pearl:'#F2E3C8', shaft:'rgba(226,245,240,0.10)'
  },
  draw(c){
    const { g, W, H, t, lv, input } = c;
    const P = this.pal;
    const surf = H*0.13;

    // the world above, seen from below
    band(g, W, 0, surf, pair(P.air, lv));
    band(g, W, surf, H*0.34, pair(P.shallow, lv));
    band(g, W, H*0.34, H*0.62, pair(P.mid, lv));
    band(g, W, H*0.62, H+4, pair(P.deepC, lv));

    // the underside of the surface, rippling
    g.fillStyle = `rgba(226,245,240,${0.22+lv*0.14})`;
    g.beginPath(); g.moveTo(-4, surf);
    for (let x = -4; x <= W+4; x += 7){
      g.lineTo(x, surf + Math.sin(x*0.035 + t*0.9)*H*0.006 + Math.sin(x*0.09 - t*0.6)*H*0.003);
    }
    g.lineTo(W+4, surf - H*0.012); g.lineTo(-4, surf - H*0.012); g.closePath(); g.fill();

    // light shafts from above, slow and independent of the breath
    for (let i = 0; i < 4; i++){
      const x = W*(0.12 + i*0.26) + Math.sin(t*0.16 + i)*W*0.05;
      g.fillStyle = P.shaft;
      g.beginPath();
      g.moveTo(x - W*0.025, surf);
      g.lineTo(x + W*0.025, surf);
      g.lineTo(x + W*0.10, H*0.80);
      g.lineTo(x - W*0.09, H*0.80);
      g.closePath(); g.fill();
    }

    // kelp on the floor, swaying at its own pace
    g.fillStyle = P.floor;
    g.beginPath(); g.moveTo(-4, H+4); g.lineTo(-4, H*0.90);
    for (let x = -4; x <= W+4; x += 14) g.lineTo(x, H*0.90 - hash(Math.floor(x/14))*H*0.022);
    g.lineTo(W+4, H+4); g.closePath(); g.fill();
    for (let i = 0; i < 7; i++){
      const x = W*(0.06 + i*0.145);
      const h = H*(0.10 + hash(i*3)*0.12);
      g.fillStyle = P.kelp;
      g.beginPath(); g.moveTo(x - W*0.012, H*0.90);
      g.quadraticCurveTo(x + Math.sin(t*0.5 + i)*W*0.05, H*0.90 - h*0.6,
                         x + Math.sin(t*0.5 + i)*W*0.08, H*0.90 - h);
      g.quadraticCurveTo(x + Math.sin(t*0.5 + i)*W*0.05, H*0.90 - h*0.6,
                         x + W*0.012, H*0.90);
      g.closePath(); g.fill();
    }

    /* THE BREATH. lv = 1 at the top of the inhale, which is the surface.
       The diver's depth is 1 - lv: she sinks as you breathe out, rests at
       the bottom of the exhale, and rises as you breathe in. */
    const depth = 1 - smooth(lv);
    const dy = surf + H*0.06 + depth*H*0.70;
    const held = input && input.down;
    const sway = Math.sin(t*0.8)*W*0.012;
    const dx = W*0.5 + sway;
    const s = H*0.042;

    g.fillStyle = P.fig;
    g.beginPath(); g.ellipse(dx, dy, s*0.34, s*0.62, Math.sin(t*0.6)*0.14, 0, TAU); g.fill();
    g.beginPath(); g.arc(dx, dy - s*0.80, s*0.26, 0, TAU); g.fill();
    for (const sgn of [-1,1]){
      const k2 = Math.sin(t*1.6 + (sgn>0?0:1.4))*0.5;
      g.beginPath();
      g.moveTo(dx + sgn*s*0.2, dy + s*0.42);
      g.lineTo(dx + sgn*s*0.34 + sgn*k2*s*0.3, dy + s*1.25);
      g.lineTo(dx + sgn*s*0.08 + sgn*k2*s*0.3, dy + s*1.25);
      g.closePath(); g.fill();
    }
    g.beginPath();
    g.moveTo(dx - s*0.3, dy - s*0.3);
    g.lineTo(dx - s*0.9 - (held?s*0.3:0), dy - s*0.55 - depth*s*0.4);
    g.lineTo(dx - s*0.8 - (held?s*0.3:0), dy - s*0.25);
    g.closePath(); g.fill();

    // the pearl: always hers, from the moment she reaches the bottom
    if (depth > 0.72){
      g.fillStyle = P.pearl;
      g.globalAlpha = Math.min(1, (depth-0.72)*6);
      g.beginPath(); g.arc(dx + s*0.55, dy + s*0.2, s*0.17, 0, TAU); g.fill();
      g.globalAlpha = 1;
    }

    // a few bubbles rising, so the water is alive even at the bottom
    for (let i = 0; i < 5; i++){
      const p = ((t*0.22 + i*0.2) % 1);
      g.fillStyle = `rgba(226,245,240,${0.10 + (1-p)*0.14})`;
      g.beginPath();
      g.arc(dx + Math.sin(i*2 + t*0.4)*W*0.05, dy - p*H*0.45, s*0.07*(0.5+i*0.12), 0, TAU);
      g.fill();
    }

    /* The indicator counts DOWN to surfacing. It is the breath's own
       remaining exhale, drawn as light returning — never an elapsed
       timer, and never a number. */
    const toSurface = smooth(lv);
    g.fillStyle = 'rgba(242,227,200,0.16)';
    g.fillRect(W*0.5 - W*0.18, H*0.055, W*0.36, Math.max(2, H*0.004));
    g.fillStyle = 'rgba(242,227,200,0.75)';
    g.fillRect(W*0.5 - W*0.18, H*0.055, W*0.36*toSurface, Math.max(2, H*0.004));
  }
};

export const LEVEL_SCENES = { kite, flight, dive };
