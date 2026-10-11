/* The Book of Rates — music and soundscape layer.
 *
 * EVERYTHING is synthesised at runtime. No samples, nothing downloaded,
 * nothing transcribed from any existing piece. Rain, wind, surf and fire
 * are shaped noise; fire crackle and leaves are noise transients; birds
 * are pitched sweeps; strings are Karplus-Strong.
 *
 * GAIN STAGING — rewritten 11 Oct after the first version clipped badly.
 * Every layer has an explicit peak budget in BUDGET below. Budgets are set
 * deliberately rather than being whatever the voices happened to sum to,
 * and worst case they total about 0.30 linear (~ -10 dBFS), so the master
 * sits near -14 dBFS in normal play with real headroom. The limiter is a
 * safety net, NOT the mixing strategy: with correct staging it should
 * never engage.
 *
 * SPECTRUM. Only ONE layer owns the low end at a time; everything else is
 * high-passed at 150 Hz. Phone and laptop speakers roll off bass hard, so
 * low-frequency energy costs headroom you cannot even hear — and the
 * heartbeat is the most expensive thing in the mix. The rest of the mix
 * ducks slightly under it rather than fighting it.
 *
 * TIMBRE. No raw sawtooths anywhere: pads are additive sine stacks, which
 * cannot buzz or alias. Struck tones get a short filtered-noise mallet so
 * the onset has a body instead of a bare sine. Noise beds are low-passed
 * far harder than looks necessary on paper, because noise that measures
 * fine hisses in a room.
 *
 * The music makes no claim about the listener's body. It is a design layer
 * over a breathing engine that does make such claims. (Design doc 3.1.)
 */

let ctx = null, master = null, dry = null, wet = null, analyser = null,
    noiseBuf = null, duck = null, statics = null, limiter = null;

export function audioContext(){ return ctx; }

/** Debug only: lets a diagnostic page tap intermediate nodes so a runaway
 *  can be located upstream of the master gain — i.e. while muted, in
 *  silence. The user can hear anything that reaches the speakers. */
export function _internals(){ return { ctx, master, dry, wet, duck, statics, limiter }; }

/* Peak budget per layer kind, linear. */
const BUDGET = {
  pad: 0.085, low: 0.090, bell: 0.055, pluck: 0.050, bowed: 0.050,
  bed: 0.035, spark: 0.022
};

export async function initAudio(){
  if (ctx){ if (ctx.state === 'suspended') await ctx.resume(); return ctx; }
  const AC = window.AudioContext || window.webkitAudioContext;
  ctx = new AC();
  if (ctx.state === 'suspended') await ctx.resume();

  master = ctx.createGain(); master.gain.value = 0;

  /* reverb: generated impulse, energy-normalised.
   * A convolver sums across every sample of the impulse. Over a transient
   * that is harmless; under a SUSTAINED pad it integrates and runs away.
   * Normalising by the impulse's own energy fixes both cases. */
  const verb = ctx.createConvolver();
  verb.normalize = false;
  const n = Math.floor(ctx.sampleRate * 3.0);
  const ir = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++){
    const d = ir.getChannelData(c);
    let energy = 0;
    for (let i = 0; i < n; i++){
      const t = i / n;
      d[i] = (Math.random()*2-1) * Math.pow(1-t, 2.8) * (1 - t*0.25);
      energy += d[i]*d[i];
    }
    const k = 0.20 / Math.sqrt(energy);
    for (let i = 0; i < n; i++) d[i] *= k;
  }
  verb.buffer = ir;

  dry = ctx.createGain(); dry.gain.value = 0.80;
  wet = ctx.createGain(); wet.gain.value = 0.55;
  const wetLP = ctx.createBiquadFilter(); wetLP.type='lowpass';  wetLP.frequency.value = 2400;
  const wetHP = ctx.createBiquadFilter(); wetHP.type='highpass'; wetHP.frequency.value = 180;

  /* two sub-mixes so the low layer can duck everything else */
  duck    = ctx.createGain(); duck.gain.value = 1;
  statics = ctx.createGain(); statics.gain.value = 1;
  duck.connect(dry);    duck.connect(wetHP);
  statics.connect(dry); statics.connect(wetHP);
  wetHP.connect(wetLP); wetLP.connect(wet);
  wet.connect(verb); verb.connect(master);
  dry.connect(master);

  const subHP = ctx.createBiquadFilter(); subHP.type='highpass'; subHP.frequency.value = 32;
  const air = ctx.createBiquadFilter(); air.type='highshelf'; air.frequency.value = 7500; air.gain.value = -6;

  limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -6; limiter.knee.value = 0;
  limiter.ratio.value = 20; limiter.attack.value = 0.002; limiter.release.value = 0.2;

  analyser = ctx.createAnalyser(); analyser.fftSize = 1024;

  master.connect(subHP); subHP.connect(air); air.connect(limiter);
  limiter.connect(analyser); analyser.connect(ctx.destination);
  return ctx;
}

/* Audio plays in the user's actual room. Never leave it running. (CLAUDE.md) */
export async function shutdownAudio(){
  if (!ctx) return;
  try { master.gain.cancelScheduledValues(0); master.gain.value = 0; } catch(e){}
  try { await ctx.suspend(); } catch(e){}
}
export async function closeAudio(){
  if (!ctx) return;
  try { await ctx.close(); } catch(e){}
  ctx = null; master = null; dry = null; wet = null; analyser = null;
  noiseBuf = null; duck = null; statics = null; limiter = null;
}

const BASE = 1.0;
let userTrim = 1, muted = false;
const target = () => muted ? 0.0001 : BASE * userTrim;

export function fadeIn(sec = 2.0){
  if (!master) return;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), ctx.currentTime);
  master.gain.linearRampToValueAtTime(target(), ctx.currentTime + sec);
}
export function fadeOut(sec = 2.5){
  if (!master) return;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), ctx.currentTime);
  master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + sec);
}
/** Muting silences the soundscape only. The breath engine runs off the
 *  audio clock, not the audio output, so guidance is unaffected. */
export function setMuted(m){
  muted = m;
  if (!master) return;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.linearRampToValueAtTime(target(), ctx.currentTime + 0.4);
}
export function isMuted(){ return muted; }
export function setTrim(v){
  userTrim = v;
  if (master) master.gain.linearRampToValueAtTime(target(), ctx.currentTime + 0.3);
}

/* ---- metering -----------------------------------------------------
 * Byte time-domain SILENCE is 128, not 0. A failed read leaves a
 * zero-filled buffer, which computes as full scale — indistinguishable
 * from clipping unless you check. `ok` below does that check. I got this
 * wrong once and chased a phantom runaway for half an hour.
 *
 * And a level reading only says a signal exists and how big it is. It
 * says nothing whatsoever about whether the result sounds good. */
export function meter(){
  if (!analyser) return { ok:false, reason:'no analyser' };
  const b = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(b);
  let sum = 0, peak = 0, mean = 0;
  for (let i = 0; i < b.length; i++){
    mean += b[i];
    const v = (b[i]-128)/128;
    sum += v*v;
    const a = Math.abs(v); if (a > peak) peak = a;
  }
  mean /= b.length;
  if (mean < 64 || mean > 192) return { ok:false, reason:'suspect read, mean '+mean.toFixed(1) };
  const rms = Math.sqrt(sum/b.length);
  const db = x => x < 1e-5 ? -100 : 20*Math.log10(x);
  return { ok:true, peak, rms, peakDb:+db(peak).toFixed(1), rmsDb:+db(rms).toFixed(1),
           reduction: limiter ? +limiter.reduction.toFixed(2) : 0 };
}
export function waveform(arr){
  if (!analyser) return false;
  analyser.getByteTimeDomainData(arr);
  return true;
}
export function fftSize(){ return analyser ? analyser.fftSize : 1024; }

/* ================================================================== *
 *  primitives
 * ================================================================== */

function busTo(parent, wetAmt, hpFreq){
  const g = ctx.createGain(); g.gain.value = 1;
  let head = g;
  if (hpFreq){
    const hp = ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value = hpFreq;
    g.connect(hp); head = hp;
  }
  const w = ctx.createGain(); w.gain.value = wetAmt;
  head.connect(parent);
  head.connect(w); w.connect(parent);
  return g;
}
function noise(){
  if (noiseBuf) return noiseBuf;
  const n = Math.floor(ctx.sampleRate * 6);
  noiseBuf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  let b0=0,b1=0,b2=0;
  for (let i = 0; i < n; i++){
    const w = Math.random()*2-1;
    b0 = 0.99765*b0 + w*0.0990460;
    b1 = 0.96300*b1 + w*0.2965164;
    b2 = 0.57000*b2 + w*1.0526913;
    d[i] = (b0+b1+b2+w*0.1848)*0.22;
  }
  return noiseBuf;
}
function noiseSource(loop = true){
  const s = ctx.createBufferSource(); s.buffer = noise(); s.loop = loop;
  s.playbackRate.value = 0.9 + Math.random()*0.2;
  return s;
}
function later(t, dur, fn){ setTimeout(fn, Math.max(0, (t - ctx.currentTime + dur))*1000); }

/* struck tone: mild inharmonicity plus a short filtered-noise mallet, so
 * the onset has a body rather than being a bare sine. */
function struck(out, t, freq, dur, vel, ratios){
  const R = ratios || [1, 2.0, 2.97, 4.12, 5.43];
  const amps = [1, 0.42, 0.24, 0.13, 0.07];
  const mix = ctx.createGain(); mix.gain.value = 1; mix.connect(out);
  R.forEach((r, i) => {
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.value = freq*r;
    o.detune.value = (Math.random()*2-1)*5;
    const g = ctx.createGain();
    const a = vel*(amps[i] ?? 0.05), d = Math.max(0.09, dur*Math.pow(0.68, i));
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(a, t + 0.014);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(mix);
    o.start(t); o.stop(t + d + 0.05);
  });
  const s = noiseSource(false);
  const bp = ctx.createBiquadFilter(); bp.type='bandpass';
  bp.frequency.value = Math.min(5000, freq*4); bp.Q.value = 1.1;
  const mg = ctx.createGain();
  mg.gain.setValueAtTime(0, t);
  mg.gain.linearRampToValueAtTime(vel*0.2, t + 0.003);
  mg.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
  s.connect(bp); bp.connect(mg); mg.connect(mix);
  s.start(t); s.stop(t + 0.1);
  later(t, dur + 0.4, () => { try { mix.disconnect(); } catch(e){} });
}

function pluck(out, t, freq, vel, damp = 0.95, tone = 1800){
  const period = 1/freq;
  if (period < 0.004) return;
  const burst = ctx.createBufferSource();
  const len = Math.max(2, Math.ceil(ctx.sampleRate*period));
  const b = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random()*2-1)*(1 - i/len*0.4);
  burst.buffer = b;
  const dly = ctx.createDelay(0.2); dly.delayTime.value = period;
  const fb = ctx.createGain(); fb.gain.value = Math.min(0.96, damp);
  const lp = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value = tone;
  const outLP = ctx.createBiquadFilter(); outLP.type='lowpass'; outLP.frequency.value = tone*1.4;
  const amp = ctx.createGain(); amp.gain.value = vel;
  burst.connect(dly);
  dly.connect(lp); lp.connect(fb); fb.connect(dly);
  dly.connect(outLP); outLP.connect(amp); amp.connect(out);
  burst.start(t); burst.stop(t + period*1.2);
  amp.gain.setValueAtTime(vel, t + 0.4);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);
  later(t, 3.1, () => { try { fb.gain.value = 0; amp.disconnect(); dly.disconnect(); } catch(e){} });
}

function bowed(out, t, freq, dur, vel){
  const mix = ctx.createGain(); mix.gain.value = 0; mix.connect(out);
  const lp = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value = freq*6;
  lp.connect(mix);
  [[1,0.55],[2,0.22],[3,0.10],[4,0.05]].forEach(([h, a]) => {
    [-4, 4].forEach(cents => {
      const o = ctx.createOscillator(); o.type='sine';
      o.frequency.value = freq*h; o.detune.value = cents;
      const g = ctx.createGain(); g.gain.value = a*0.5;
      o.connect(g); g.connect(lp);
      o.start(t); o.stop(t + dur + 0.3);
    });
  });
  mix.gain.setValueAtTime(0, t);
  mix.gain.linearRampToValueAtTime(vel, t + dur*0.40);
  mix.gain.linearRampToValueAtTime(vel*0.72, t + dur*0.72);
  mix.gain.linearRampToValueAtTime(0.0001, t + dur);
  later(t, dur + 0.4, () => { try { mix.disconnect(); } catch(e){} });
}

/* ================================================================== *
 *  layers
 * ================================================================== */

class Layer {
  constructor({ wet = 0.35, hp = 150, budget = 0.05, low = false } = {}){
    this.out = busTo(low ? statics : duck, wet, low ? 0 : hp);
    this.budget = budget;
    this.level = 1;
    this.out.gain.value = budget;
  }
  setLevel(v, ramp = 0.5){
    this.level = v;
    this.out.gain.cancelScheduledValues(ctx.currentTime);
    this.out.gain.setValueAtTime(this.out.gain.value, ctx.currentTime);
    this.out.gain.linearRampToValueAtTime(Math.max(0.00001, this.budget*v), ctx.currentTime + ramp);
  }
  beat(){} breath(){}
  stop(){
    this.out.gain.cancelScheduledValues(ctx.currentTime);
    this.out.gain.setValueAtTime(this.out.gain.value, ctx.currentTime);
    this.out.gain.linearRampToValueAtTime(0.00001, ctx.currentTime + 0.6);
    later(ctx.currentTime, 1.4, () => { try { this.out.disconnect(); } catch(e){} });
  }
}

/* pad: additive sine stack. Cannot buzz, cannot alias. */
class Pad extends Layer {
  constructor(freqs, baseCut, topCut, o = {}){
    super({ wet: o.wet ?? 0.5, hp: o.hp ?? 90, budget: o.budget ?? BUDGET.pad });
    this.baseCut = baseCut; this.topCut = topCut;
    const lp = ctx.createBiquadFilter(); lp.type='lowpass';
    lp.frequency.value = baseCut; lp.Q.value = 0.4;
    this.cut = lp.frequency;
    this.oscs = [];
    const PART = [[1,1.0],[2,0.34],[3,0.16],[4,0.08],[5,0.04]];
    freqs.forEach((f, idx) => {
      const w = idx === 0 ? 1 : 0.55;
      PART.forEach(([h, a]) => {
        const det = h === 1 ? [-4, 4] : [0];
        det.forEach(cents => {
          const o2 = ctx.createOscillator(); o2.type='sine';
          o2.frequency.value = f*h; o2.detune.value = cents + (Math.random()*3-1.5);
          const g = ctx.createGain();
          const base = (a*w)/(freqs.length*det.length)*0.55;
          g.gain.value = base;
          const lfo = ctx.createOscillator(); lfo.frequency.value = 0.023 + Math.random()*0.06;
          const lg = ctx.createGain(); lg.gain.value = base*0.3;
          lfo.connect(lg); lg.connect(g.gain); lfo.start();
          o2.connect(g); g.connect(lp); o2.start();
          this.oscs.push(o2, lfo);
        });
      });
    });
    lp.connect(this.out);
  }
  breath(t, inSec, outSec){
    this.cut.cancelScheduledValues(t);
    this.cut.setValueAtTime(this.baseCut, t);
    this.cut.linearRampToValueAtTime(this.topCut, t + inSec);
    this.cut.linearRampToValueAtTime(this.baseCut, t + inSec + outSec);
  }
  stop(){ this.oscs.forEach(o => { try { o.stop(ctx.currentTime + 0.9); } catch(e){} }); super.stop(); }
}

/* heartbeat: the only layer that owns the low end, and the rest of the
 * mix ducks under it rather than fighting it.
 * Fires every two beats, so at 128 BPM it lands at 64 per minute and at
 * 120 BPM at 60. That is an observation about how it SOUNDS, not a claim
 * that it does anything to the listener's heart. */
class Heart extends Layer {
  constructor(o = {}){
    super({ wet: o.wet ?? 0.05, budget: o.budget ?? BUDGET.low, low: true });
    this.f1 = o.f1 ?? 72; this.f2 = o.f2 ?? 58;   // high enough to survive a phone speaker
    this.vel = o.vel ?? 0.85;
    this.everyBeats = o.everyBeats ?? 2;
    this.duckAmt = o.duck ?? 0.86;
  }
  thump(t, freq, vel, dur){
    const mix = ctx.createGain(); mix.gain.value = 1;
    const lp = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value = 220;
    mix.connect(lp); lp.connect(this.out);
    [[1,1.0],[2,0.18]].forEach(([h, a]) => {
      const o = ctx.createOscillator(); o.type='sine';
      o.frequency.setValueAtTime(freq*h*1.5, t);
      o.frequency.exponentialRampToValueAtTime(freq*h*0.78, t + dur*0.7);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vel*a, t + 0.026);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(mix);
      o.start(t); o.stop(t + dur + 0.05);
    });
    later(t, dur + 0.3, () => { try { mix.disconnect(); } catch(e){} });
  }
  beat(t, info){
    if (info.beatAbs % this.everyBeats !== 0) return;
    const spb = info.protocol.spb;
    const v = this.vel*(0.8 + info.level*0.25);
    this.thump(t, this.f1, v, 0.26);
    this.thump(t + spb*0.28, this.f2, v*0.6, 0.22);
    if (duck){
      duck.gain.cancelScheduledValues(t);
      duck.gain.setValueAtTime(1, t);
      duck.gain.linearRampToValueAtTime(this.duckAmt, t + 0.03);
      duck.gain.linearRampToValueAtTime(1, t + 0.34);
    }
  }
}

/* nature: all heavily low-passed. Noise that measures fine hisses. */
class Rain extends Layer {
  constructor(o = {}){
    super({ wet: o.wet ?? 0.25, budget: o.budget ?? BUDGET.bed });
    const s = noiseSource();
    const hp = ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value = o.hp ?? 450;
    const lp = ctx.createBiquadFilter(); lp.type='lowpass';  lp.frequency.value = o.lp ?? 2400;
    const tilt = ctx.createBiquadFilter(); tilt.type='highshelf';
    tilt.frequency.value = 1800; tilt.gain.value = -8;
    const g = ctx.createGain(); g.gain.value = o.bed ?? 0.5;
    s.connect(hp); hp.connect(lp); lp.connect(tilt); tilt.connect(g); g.connect(this.out);
    s.start(); this.src = s; this.drops = o.drops ?? 0.4;
  }
  beat(t, info){
    const n = 1 + (Math.random()*2|0);
    for (let i = 0; i < n; i++){
      if (Math.random() > this.drops) continue;
      const when = t + Math.random()*info.protocol.spb;
      const s = noiseSource(false);
      const bp = ctx.createBiquadFilter(); bp.type='bandpass';
      bp.frequency.value = 900 + Math.random()*1800; bp.Q.value = 4 + Math.random()*4;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(0.25 + Math.random()*0.25, when + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.08 + Math.random()*0.1);
      s.connect(bp); bp.connect(g); g.connect(this.out);
      s.start(when); s.stop(when + 0.25);
    }
  }
  stop(){ try { this.src.stop(ctx.currentTime + 0.9); } catch(e){} super.stop(); }
}

class Wind extends Layer {
  constructor(o = {}){
    super({ wet: o.wet ?? 0.3, budget: o.budget ?? BUDGET.bed });
    const s = noiseSource();
    const hp = ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value = 160;
    const lp = ctx.createBiquadFilter(); lp.type='lowpass';  lp.frequency.value = o.cut ?? 420;
    lp.Q.value = 0.5;
    const g = ctx.createGain(); g.gain.value = 0.6;
    [[0.019,160],[0.047,90]].forEach(([f, depth]) => {
      const l = ctx.createOscillator(); l.frequency.value = f;
      const lg = ctx.createGain(); lg.gain.value = depth;
      l.connect(lg); lg.connect(lp.frequency); l.start();
    });
    const l2 = ctx.createOscillator(); l2.frequency.value = 0.027;
    const l2g = ctx.createGain(); l2g.gain.value = 0.22;
    l2.connect(l2g); l2g.connect(g.gain); l2.start();
    s.connect(hp); hp.connect(lp); lp.connect(g); g.connect(this.out);
    s.start(); this.src = s; this.bedGain = g;
  }
  breath(t, inSec, outSec){
    this.bedGain.gain.cancelScheduledValues(t);
    this.bedGain.gain.setValueAtTime(0.42, t);
    this.bedGain.gain.linearRampToValueAtTime(0.85, t + inSec);
    this.bedGain.gain.linearRampToValueAtTime(0.42, t + inSec + outSec);
  }
  stop(){ try { this.src.stop(ctx.currentTime + 0.9); } catch(e){} super.stop(); }
}

class Surf extends Layer {
  constructor(o = {}){
    super({ wet: o.wet ?? 0.35, budget: o.budget ?? BUDGET.bed });
    this.next = 0;
  }
  beat(t, info){
    if (t < this.next) return;
    const dur = 3.4 + Math.random()*3.2;
    this.next = t + dur*0.5 + Math.random()*2.6;
    const s = noiseSource();
    const hp = ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value = 170;
    const lp = ctx.createBiquadFilter(); lp.type='lowpass';  lp.frequency.value = 260;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.6 + Math.random()*0.4, t + dur*0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    lp.frequency.setValueAtTime(230, t);
    lp.frequency.linearRampToValueAtTime(900, t + dur*0.35);
    lp.frequency.linearRampToValueAtTime(200, t + dur);
    s.connect(hp); hp.connect(lp); lp.connect(g); g.connect(this.out);
    s.start(t); s.stop(t + dur + 0.2);
  }
}

class Fire extends Layer {
  constructor(o = {}){
    super({ wet: o.wet ?? 0.14, budget: o.budget ?? BUDGET.bed });
    const s = noiseSource();
    const lp = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value = 300;
    const g = ctx.createGain(); g.gain.value = 0.55;
    s.connect(lp); lp.connect(g); g.connect(this.out);
    s.start(); this.src = s; this.rate = o.rate ?? 0.3;
  }
  beat(t, info){
    const n = (Math.random()*2)|0;
    for (let i = 0; i < n; i++){
      if (Math.random() > this.rate) continue;
      const when = t + Math.random()*info.protocol.spb;
      const s = noiseSource(false);
      const bp = ctx.createBiquadFilter(); bp.type='bandpass';
      bp.frequency.value = 700 + Math.random()*1500; bp.Q.value = 5 + Math.random()*6;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(0.3 + Math.random()*0.4, when + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.025 + Math.random()*0.04);
      s.connect(bp); bp.connect(g); g.connect(this.out);
      s.start(when); s.stop(when + 0.12);
    }
  }
  stop(){ try { this.src.stop(ctx.currentTime + 0.9); } catch(e){} super.stop(); }
}

class Birds extends Layer {
  constructor(o = {}){
    super({ wet: o.wet ?? 0.7, budget: o.budget ?? BUDGET.spark });
    this.p = o.p ?? 0.035; this.lo = o.lo ?? 1600; this.hi = o.hi ?? 3000;
  }
  beat(t, info){
    if (Math.random() > this.p) return;
    const calls = 1 + (Math.random()*3|0);
    for (let i = 0; i < calls; i++){
      const when = t + i*(0.1 + Math.random()*0.1);
      const f0 = this.lo + Math.random()*(this.hi - this.lo);
      const up = Math.random() < 0.6;
      const o = ctx.createOscillator(); o.type='sine';
      o.frequency.setValueAtTime(up ? f0*0.82 : f0*1.22, when);
      o.frequency.exponentialRampToValueAtTime(up ? f0*1.25 : f0*0.8, when + 0.08);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(0.55 + Math.random()*0.4, when + 0.016);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.12);
      o.connect(g); g.connect(this.out);
      o.start(when); o.stop(when + 0.16);
    }
  }
}

class Leaves extends Layer {
  constructor(o = {}){
    super({ wet: o.wet ?? 0.3, budget: o.budget ?? BUDGET.spark });
    this.p = o.p ?? 0.18;
  }
  beat(t, info){
    if (Math.random() > this.p) return;
    const when = t + Math.random()*info.protocol.spb;
    const dur = 0.3 + Math.random()*0.5;
    const s = noiseSource(false);
    const bp = ctx.createBiquadFilter(); bp.type='bandpass';
    bp.frequency.value = 1400 + Math.random()*1400; bp.Q.value = 0.9;
    const lp = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value = 3200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(0.6, when + dur*0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    s.connect(bp); bp.connect(lp); lp.connect(g); g.connect(this.out);
    s.start(when); s.stop(when + dur + 0.1);
  }
}

class Ornament extends Layer {
  constructor(o){
    const kind = o.voice === 'pluck' ? 'pluck' : o.voice === 'bowed' ? 'bowed' : 'bell';
    super({ wet: o.wet ?? 0.6, budget: o.budget ?? BUDGET[kind] });
    Object.assign(this, {
      root: 146.83, scale: [0,2,3,5,7,9,10],
      everyBars: 5, p: 0.5, onBeats: null, voice: 'bell',
      oct: 1, vel: 0.8, dur: 2.6, damp: 0.95, tone: 1800,
      ratios: undefined, breathVel: 0.15
    }, o);
  }
  beat(t, info){
    if (info.barAbs % this.everyBars !== 0) return;
    const b = info.beatInCycle % info.protocol.beatsPerBar;
    if (this.onBeats && !this.onBeats.includes(b)) return;
    if (Math.random() > this.p) return;
    const deg = this.scale[(Math.random()*this.scale.length)|0];
    const f = this.root*this.oct*Math.pow(2, deg/12);
    const v = this.vel*(0.85 + info.level*this.breathVel);
    const when = t + Math.random()*0.03;
    if (this.voice === 'pluck')      pluck(this.out, when, f, v, this.damp, this.tone);
    else if (this.voice === 'bowed') bowed(this.out, when, f, this.dur, v);
    else                             struck(this.out, when, f, this.dur, v, this.ratios);
  }
}

/* ================================================================== *
 *  themes
 * ================================================================== */
const D = 146.83, DORIAN = [0,2,3,5,7,9,10];
const A = 110,    PENT   = [0,3,5,7,10];
const G = 98,     MAJPENT= [0,2,4,7,9];
const E = 164.81, LYD    = [0,2,4,7,9,11];

export const THEMES = {
  'desert-dusk': {
    note: 'The Long Shore — wind, far birds, dorian drone',
    make: () => ({
      pad:     new Pad([73.42, 110, 146.83], 380, 1200),
      wind:    new Wind({ cut: 400 }),
      bells:   new Ornament({ root: D, scale: DORIAN, everyBars: 5, p: 0.45,
                              onBeats: [0,2], voice: 'bell', dur: 3.0 }),
      strings: new Ornament({ root: D/2, scale: DORIAN, everyBars: 7, p: 0.4,
                              onBeats: [1], voice: 'pluck', damp: 0.955, tone: 1500 }),
      birds:   new Birds({ p: 0.03, lo: 1500, hi: 2800 })
    }),
    mix: { pad: 1, wind: 0.8, bells: 0.9, strings: 0.85, birds: 0.6 }
  },
  'night-pool': {
    note: 'Still water — gong, drops, plucked low strings',
    make: () => ({
      pad:     new Pad([55, 110], 260, 760),
      surf:    new Surf({}),
      drops:   new Ornament({ root: A*2, scale: PENT, everyBars: 7, p: 0.28,
                              voice: 'bell', dur: 3.6, ratios: [1, 2.4, 4.1, 6.0] }),
      strings: new Ornament({ root: A, scale: PENT, everyBars: 8, p: 0.32, onBeats: [0],
                              voice: 'pluck', damp: 0.958, tone: 1300 }),
      gong:    new Ornament({ root: 82.41, scale: [0], everyBars: 8, p: 1, onBeats: [0],
                              voice: 'bell', dur: 7.0, vel: 0.9,
                              ratios: [1, 1.52, 2.41, 3.47, 5.11] })
    }),
    mix: { pad: 1, surf: 0.9, drops: 0.85, strings: 0.8, gong: 0.8 }
  },
  'storm': {
    note: 'Rain and bowed weight. Distress, passing',
    make: () => ({
      pad:    new Pad([49, 73.42, 98], 230, 620),
      rain:   new Rain({ drops: 0.55 }),
      wind:   new Wind({ cut: 340 }),
      bowedL: new Ornament({ root: G/2, scale: [0,3,5,7,10], everyBars: 7, p: 0.45,
                             onBeats: [0], voice: 'bowed', dur: 5.5 }),
      bells:  new Ornament({ root: G*2, scale: [0,3,5,7,10], everyBars: 5, p: 0.25,
                             onBeats: [2], voice: 'bell', dur: 3.0, vel: 0.7 })
    }),
    mix: { pad: 1, rain: 0.9, wind: 0.7, bowedL: 0.9, bells: 0.7 }
  },
  'temple-noon': {
    note: 'Hard light, struck metal, thin air',
    make: () => ({
      pad:    new Pad([98, 147, 196], 520, 1700),
      wind:   new Wind({ cut: 520 }),
      bowl:   new Ornament({ root: G, scale: MAJPENT, everyBars: 4, p: 0.5, onBeats: [0],
                             voice: 'bell', dur: 5.2, ratios: [1, 2.3, 3.8, 5.9, 7.2] }),
      pluckL: new Ornament({ root: G*2, scale: MAJPENT, everyBars: 5, p: 0.35,
                             voice: 'pluck', damp: 0.945, tone: 2200 }),
      birds:  new Birds({ p: 0.04, lo: 2000, hi: 3600 })
    }),
    mix: { pad: 1, wind: 0.7, bowl: 0.9, pluckL: 0.85, birds: 0.6 }
  },
  'cliffs-midday': {
    note: 'The Run — heartbeat under everything',
    make: () => ({
      pad:    new Pad([82.41, 164.81], 600, 1800),
      heart:  new Heart({ everyBeats: 2 }),
      wind:   new Wind({ cut: 560 }),
      bass:   new Ornament({ root: E/2, scale: [0,7], everyBars: 3, p: 0.85, onBeats: [0,2],
                             voice: 'pluck', damp: 0.93, tone: 1100 }),
      bright: new Ornament({ root: E*2, scale: LYD, everyBars: 4, p: 0.4,
                             voice: 'bell', dur: 1.3, vel: 0.65 }),
      leaves: new Leaves({ p: 0.2 })
    }),
    mix: { pad: 0.8, heart: 1, wind: 0.8, bass: 0.9, bright: 0.8, leaves: 0.5 }
  },
  'night-river': {
    note: 'Sleep. Water and a fire on the bank',
    make: () => ({
      pad:    new Pad([49, 73.42], 200, 520),
      surf:   new Surf({}),
      fire:   new Fire({ rate: 0.25 }),
      bowedL: new Ornament({ root: 98, scale: [0,3,5,7], everyBars: 9, p: 0.3, onBeats: [0],
                             voice: 'bowed', dur: 7.0, vel: 0.7 }),
      drops:  new Ornament({ root: 294, scale: [0,3,7], everyBars: 13, p: 0.22,
                             voice: 'bell', dur: 4.0, vel: 0.55 })
    }),
    mix: { pad: 1, surf: 0.8, fire: 0.7, bowedL: 0.9, drops: 0.6 }
  }
};

/* ================================================================== *
 *  conductor
 * ================================================================== */
export class Music {
  constructor(themeId){
    this.id = THEMES[themeId] ? themeId : 'desert-dusk';
    this.def = THEMES[this.id];
    this.layers = null;
    this.live = false;
  }
  begin(){
    if (this.live) return;
    this.layers = this.def.make();
    const mix = this.def.mix || {};
    for (const [k, l] of Object.entries(this.layers)) l.setLevel(mix[k] ?? 1, 1.2);
    this.live = true;
  }
  setLayer(name, v){ if (this.layers && this.layers[name]) this.layers[name].setLevel(v); }
  names(){ return this.layers ? Object.keys(this.layers) : []; }
  beat(when, index, info){
    if (!this.live) return;
    const inf = { ...info, beatAbs: index };
    if (info.beatInCycle === 0){
      const P = info.protocol;
      const inBeats = P.phases[0].beats;
      const inSec = inBeats*P.spb, outSec = (P.cycleBeats - inBeats)*P.spb;
      for (const l of Object.values(this.layers)) l.breath(when, inSec, outSec);
    }
    for (const l of Object.values(this.layers)) l.beat(when, inf);
  }
  end(){
    if (!this.live) return;
    this.live = false;
    for (const l of Object.values(this.layers)) l.stop();
    this.layers = null;
  }
}
