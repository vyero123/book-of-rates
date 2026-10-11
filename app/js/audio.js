/* The Book of Rates — music and soundscape layer.
 *
 * EVERYTHING here is synthesised at runtime from oscillators, filtered
 * noise and a generated impulse response. There are no audio samples in
 * this repository, nothing is downloaded, and nothing is transcribed from
 * any existing piece. Rain, wind, surf and fire are shaped noise; fire
 * crackle and leaves are noise transients; birds are pitched sweeps.
 *
 * Composition rules (design doc 3.4, research/05-loop-music.md):
 *  - static or modal harmonic field; never cadence at the loop point
 *  - only the breath layer is strictly periodic; everything else runs on a
 *    coprime number of bars so the combination takes minutes to come round
 *  - variation of TIMBRE, not of events — density is what makes loops grate
 *  - ornaments placed stochastically, with real silence
 *  - soft attacks, low-passed, long decays, no voice, no hook, no limiter
 *
 * The music makes no claim about the listener's body. It is a design layer
 * over a breathing engine that does make such claims. (Design doc 3.1.)
 */

let ctx = null, master = null, dry = null, wet = null, analyser = null, noiseBuf = null;

export function audioContext(){ return ctx; }

export async function initAudio(){
  if (ctx){ if (ctx.state === 'suspended') await ctx.resume(); return ctx; }
  const AC = window.AudioContext || window.webkitAudioContext;
  ctx = new AC();
  if (ctx.state === 'suspended') await ctx.resume();

  master = ctx.createGain(); master.gain.value = 0;

  const verb = ctx.createConvolver();
  verb.normalize = false;                 // we normalise it ourselves, below
  const n = Math.floor(ctx.sampleRate * 3.4);
  const ir = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++){
    const d = ir.getChannelData(c);
    let energy = 0;
    for (let i = 0; i < n; i++){
      const t = i / n;
      d[i] = (Math.random()*2-1) * Math.pow(1-t, 2.6) * (1 - t*0.25);
      energy += d[i]*d[i];
    }
    // A convolver sums across every sample of the impulse. Over a transient
    // that is harmless; under a SUSTAINED pad it integrates and the output
    // runs away. Scaling by the impulse's own energy fixes the gain for
    // sustained and transient material alike.
    const k = 0.22 / Math.sqrt(energy);
    for (let i = 0; i < n; i++) d[i] *= k;
  }
  verb.buffer = ir;

  dry = ctx.createGain(); dry.gain.value = 0.72;
  wet = ctx.createGain(); wet.gain.value = 0.45;
  const wetLP = ctx.createBiquadFilter(); wetLP.type='lowpass'; wetLP.frequency.value = 2600;

  analyser = ctx.createAnalyser(); analyser.fftSize = 1024;

  // A safety ceiling, not loudness processing. The research says no heavy
  // compression, and there is none: this sits high with a fast attack and
  // only ever acts if a stochastic pile-up would otherwise clip, which is
  // far worse for the ear than the ceiling is.
  const ceiling = ctx.createDynamicsCompressor();
  ceiling.threshold.value = -3; ceiling.knee.value = 0;
  ceiling.ratio.value = 20; ceiling.attack.value = 0.003; ceiling.release.value = 0.25;

  dry.connect(master);
  wet.connect(wetLP); wetLP.connect(verb); verb.connect(master);
  master.connect(ceiling); ceiling.connect(analyser); analyser.connect(ctx.destination);
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
  ctx = null; master = null; dry = null; wet = null; analyser = null; noiseBuf = null;
}

const BASE = 0.9;   // measured against the analyser with all layers summed
let userTrim = 1, muted = false;

export function fadeIn(sec = 2.0){
  if (!master) return;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), ctx.currentTime);
  master.gain.linearRampToValueAtTime(muted ? 0.0001 : BASE*userTrim, ctx.currentTime + sec);
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
  master.gain.linearRampToValueAtTime(m ? 0.0001 : BASE*userTrim, ctx.currentTime + 0.4);
}
export function isMuted(){ return muted; }
export function setTrim(v){ userTrim = v; if (master && !muted) master.gain.linearRampToValueAtTime(BASE*v, ctx.currentTime + 0.3); }
export function rms(){
  if (!analyser) return 0;
  const b = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(b);
  let s = 0; for (let i = 0; i < b.length; i++){ const v = (b[i]-128)/128; s += v*v; }
  return Math.sqrt(s/b.length);
}
/** Fill `arr` (Uint8Array) with the current time-domain waveform. */
export function waveform(arr){
  if (!analyser) return false;
  analyser.getByteTimeDomainData(arr);
  return true;
}
export function fftSize(){ return analyser ? analyser.fftSize : 1024; }
export function peak(){
  if (!analyser) return 0;
  const b = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(b);
  let p = 0; for (let i = 0; i < b.length; i++){ const v = Math.abs((b[i]-128)/128); if (v>p) p=v; }
  return p;
}

/* ================================================================== *
 *  primitives
 * ================================================================== */

function bus(wetAmt){
  const g = ctx.createGain(); g.gain.value = 1;
  g.connect(dry);
  const w = ctx.createGain(); w.gain.value = wetAmt;
  g.connect(w); w.connect(wet);
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
function later(t, dur, fn){
  setTimeout(fn, Math.max(0, (t - ctx.currentTime + dur)) * 1000);
}

/* ---- struck / bell: inharmonic partials, faster decay up the stack ---- */
function struck(out, t, freq, dur, vel, ratios = [1,2.01,3.03,4.22]){
  const mix = ctx.createGain(); mix.connect(out);
  ratios.forEach((r, i) => {
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.value = freq*r;
    o.detune.value = (Math.random()*2-1)*4;
    const g = ctx.createGain();
    const a = vel * Math.pow(0.52, i), d = dur * Math.pow(0.62, i);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(a, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(mix);
    o.start(t); o.stop(t + d + 0.05);
  });
  later(t, dur + 0.4, () => { try { mix.disconnect(); } catch(e){} });
}

/* ---- plucked string: Karplus-Strong. Real body, almost no CPU. ---- */
function pluck(out, t, freq, vel, damp = 0.955, tone = 2600){
  const period = 1/freq;
  const burst = ctx.createBufferSource();
  const len = Math.max(2, Math.ceil(ctx.sampleRate*period));
  const b = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random()*2-1) * (1 - i/len*0.3);
  burst.buffer = b;

  const dly = ctx.createDelay(0.2); dly.delayTime.value = period;
  const fb  = ctx.createGain();     fb.gain.value = Math.min(0.985, damp);
  const lp  = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value = tone;
  const amp = ctx.createGain();     amp.gain.value = vel;

  burst.connect(dly);
  dly.connect(lp); lp.connect(fb); fb.connect(dly);   // the loop
  dly.connect(amp); amp.connect(out);

  burst.start(t); burst.stop(t + period*1.2);
  // fade the loop out so the feedback can never ring forever
  amp.gain.setValueAtTime(vel, t + 0.5);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
  later(t, 3.5, () => { try { fb.gain.value = 0; amp.disconnect(); dly.disconnect(); } catch(e){} });
}

/* ---- bowed: slow swell through a resonant band. Body without attack. ---- */
function bowed(out, t, freq, dur, vel){
  const mix = ctx.createGain(); mix.gain.value = 0; mix.connect(out);
  const bp = ctx.createBiquadFilter(); bp.type='bandpass';
  bp.frequency.value = freq*2.4; bp.Q.value = 1.4;
  bp.connect(mix);
  [0, -7, 7].forEach((cents, i) => {
    const o = ctx.createOscillator();
    o.type = i === 0 ? 'triangle' : 'sawtooth';
    o.frequency.value = freq; o.detune.value = cents;
    const g = ctx.createGain(); g.gain.value = i === 0 ? 0.6 : 0.16;
    o.connect(g); g.connect(bp);
    o.start(t); o.stop(t + dur + 0.3);
  });
  mix.gain.setValueAtTime(0, t);
  mix.gain.linearRampToValueAtTime(vel, t + dur*0.38);     // slow in
  mix.gain.linearRampToValueAtTime(vel*0.75, t + dur*0.7);
  mix.gain.linearRampToValueAtTime(0.0001, t + dur);
  later(t, dur + 0.4, () => { try { mix.disconnect(); } catch(e){} });
}

/* ================================================================== *
 *  layers — each is independently mixable
 * ================================================================== */

class Layer {
  constructor(wetAmt = 0.4){
    this.out = bus(wetAmt);
    this.level = 1;
  }
  setLevel(v, ramp = 0.5){
    this.level = v;
    this.out.gain.cancelScheduledValues(ctx.currentTime);
    this.out.gain.linearRampToValueAtTime(Math.max(0.0001, v), ctx.currentTime + ramp);
  }
  beat(){} breath(){}
  stop(){
    this.out.gain.cancelScheduledValues(ctx.currentTime);
    this.out.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    later(ctx.currentTime, 1.2, () => { try { this.out.disconnect(); } catch(e){} });
  }
}

/* --- pad: wide detuned sustain, filter follows the breath --- */
class Pad extends Layer {
  constructor(freqs, baseCut, topCut, o = {}){
    super(o.wet ?? 0.42);
    this.baseCut = baseCut; this.topCut = topCut;
    const lp = ctx.createBiquadFilter(); lp.type='lowpass';
    lp.frequency.value = baseCut; lp.Q.value = 0.7;
    this.cut = lp.frequency;
    this.oscs = [];
    freqs.forEach((f, i) => {
      [-7, 0, 7].forEach((cents, j) => {
        const o2 = ctx.createOscillator();
        o2.type = i === 0 ? 'sine' : (j === 1 ? 'triangle' : 'sawtooth');
        o2.frequency.value = f; o2.detune.value = cents + (Math.random()*4-2);
        const g = ctx.createGain();
        g.gain.value = (i === 0 ? 0.26 : 0.07) / freqs.length;
        // slow independent drift so no two passes are identical
        const lfo = ctx.createOscillator(); lfo.frequency.value = 0.031 + Math.random()*0.05;
        const lg = ctx.createGain(); lg.gain.value = g.gain.value*0.35;
        lfo.connect(lg); lg.connect(g.gain); lfo.start();
        o2.connect(g); g.connect(lp); o2.start();
        this.oscs.push(o2, lfo);
      });
    });
    const amp = ctx.createGain(); amp.gain.value = o.gain ?? 0.9;
    lp.connect(amp); amp.connect(this.out);
  }
  breath(t, inSec, outSec){
    this.cut.setValueAtTime(this.baseCut, t);
    this.cut.linearRampToValueAtTime(this.topCut, t + inSec);
    this.cut.linearRampToValueAtTime(this.baseCut, t + inSec + outSec);
  }
  stop(){ this.oscs.forEach(o => { try { o.stop(ctx.currentTime + 0.8); } catch(e){} }); super.stop(); }
}

/* --- heartbeat: a soft low lub-dub, felt rather than heard ---
 * Fires once every two beats, so at 128 BPM it lands at 64 per minute and
 * at 120 BPM at 60 — which is part of why the faster levels read as
 * energising. That is a design observation about how it SOUNDS, not a
 * claim that it does anything to the listener's heart. */
class Heart extends Layer {
  constructor(o = {}){
    super(o.wet ?? 0.12);
    this.f1 = o.f1 ?? 54; this.f2 = o.f2 ?? 44;
    this.vel = o.vel ?? 0.20;
    this.everyBeats = o.everyBeats ?? 2;
  }
  thump(t, freq, vel, dur){
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(freq*1.6, t);
    o.frequency.exponentialRampToValueAtTime(freq*0.72, t + dur*0.8);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel, t + 0.022);      // soft, not a kick
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const lp = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value = 160;
    o.connect(g); g.connect(lp); lp.connect(this.out);
    o.start(t); o.stop(t + dur + 0.05);
  }
  beat(t, info){
    if (info.beatAbs % this.everyBeats !== 0) return;
    const spb = info.protocol.spb;
    // breath only sways the volume; the rate stays locked to the tempo
    const v = this.vel * (0.78 + info.level*0.3);
    this.thump(t, this.f1, v, 0.30);
    this.thump(t + spb*0.30, this.f2, v*0.62, 0.26);
  }
}

/* --- rain: a shaped-noise bed plus stochastic droplet transients --- */
class Rain extends Layer {
  constructor(o = {}){
    super(o.wet ?? 0.3);
    const s = noiseSource();
    const hp = ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value = o.hp ?? 700;
    const lp = ctx.createBiquadFilter(); lp.type='lowpass';  lp.frequency.value = o.lp ?? 7000;
    const g = ctx.createGain(); g.gain.value = o.bed ?? 0.09;
    s.connect(hp); hp.connect(lp); lp.connect(g); g.connect(this.out);
    s.start(); this.src = s; this.bedGain = g; this.drops = o.drops ?? 0.5;
  }
  beat(t, info){
    const n = 1 + (Math.random()*3|0);
    for (let i = 0; i < n; i++){
      if (Math.random() > this.drops) continue;
      const when = t + Math.random()*info.protocol.spb;
      const s = noiseSource(false);
      const bp = ctx.createBiquadFilter(); bp.type='bandpass';
      bp.frequency.value = 1400 + Math.random()*3600; bp.Q.value = 3 + Math.random()*5;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(0.05 + Math.random()*0.05, when + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.07 + Math.random()*0.1);
      s.connect(bp); bp.connect(g); g.connect(this.out);
      s.start(when); s.stop(when + 0.25);
    }
  }
  stop(){ try { this.src.stop(ctx.currentTime + 0.8); } catch(e){} super.stop(); }
}

/* --- wind: low noise with a slow, irregular cutoff and gain sway --- */
class Wind extends Layer {
  constructor(o = {}){
    super(o.wet ?? 0.34);
    const s = noiseSource();
    const hp = ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value = 110;
    const lp = ctx.createBiquadFilter(); lp.type='lowpass';  lp.frequency.value = o.cut ?? 650;
    const g  = ctx.createGain(); g.gain.value = o.bed ?? 0.14;
    // two incommensurate LFOs so the gusting never repeats
    [[0.019, 260], [0.047, 140]].forEach(([f, depth]) => {
      const l = ctx.createOscillator(); l.frequency.value = f;
      const lg = ctx.createGain(); lg.gain.value = depth;
      l.connect(lg); lg.connect(lp.frequency); l.start();
    });
    const l2 = ctx.createOscillator(); l2.frequency.value = 0.027;
    const l2g = ctx.createGain(); l2g.gain.value = (o.bed ?? 0.14)*0.45;
    l2.connect(l2g); l2g.connect(g.gain); l2.start();
    s.connect(hp); hp.connect(lp); lp.connect(g); g.connect(this.out);
    s.start();
    this.src = s; this.cut = lp.frequency; this.bedGain = g;
    this.base = o.cut ?? 650; this.top = o.top ?? 1700; this.bed = o.bed ?? 0.14;
  }
  breath(t, inSec, outSec){
    this.bedGain.gain.setValueAtTime(this.bed*0.6, t);
    this.bedGain.gain.linearRampToValueAtTime(this.bed*1.6, t + inSec);
    this.bedGain.gain.linearRampToValueAtTime(this.bed*0.6, t + inSec + outSec);
  }
  stop(){ try { this.src.stop(ctx.currentTime + 0.8); } catch(e){} super.stop(); }
}

/* --- surf: slow noise swells arriving at irregular intervals --- */
class Surf extends Layer {
  constructor(o = {}){
    super(o.wet ?? 0.4);
    this.vel = o.vel ?? 0.16; this.next = 0;
  }
  beat(t, info){
    if (t < this.next) return;
    const dur = 3.2 + Math.random()*3.4;
    this.next = t + dur*0.55 + Math.random()*2.5;        // never a regular interval
    const s = noiseSource();
    const lp = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value = 300;
    const hp = ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value = 140;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(this.vel*(0.7+Math.random()*0.6), t + dur*0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    lp.frequency.setValueAtTime(250, t);
    lp.frequency.linearRampToValueAtTime(1500, t + dur*0.35);
    lp.frequency.linearRampToValueAtTime(220, t + dur);
    s.connect(hp); hp.connect(lp); lp.connect(g); g.connect(this.out);
    s.start(t); s.stop(t + dur + 0.2);
  }
}

/* --- fire: a low bed plus sharp crackle transients --- */
class Fire extends Layer {
  constructor(o = {}){
    super(o.wet ?? 0.18);
    const s = noiseSource();
    const lp = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value = 420;
    const g = ctx.createGain(); g.gain.value = o.bed ?? 0.07;
    s.connect(lp); lp.connect(g); g.connect(this.out);
    s.start(); this.src = s; this.rate = o.rate ?? 0.5;
  }
  beat(t, info){
    const n = (Math.random()*3)|0;
    for (let i = 0; i < n; i++){
      if (Math.random() > this.rate) continue;
      const when = t + Math.random()*info.protocol.spb;
      const s = noiseSource(false);
      const bp = ctx.createBiquadFilter(); bp.type='bandpass';
      bp.frequency.value = 900 + Math.random()*2800; bp.Q.value = 6 + Math.random()*8;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(0.04 + Math.random()*0.07, when + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.03 + Math.random()*0.05);
      s.connect(bp); bp.connect(g); g.connect(this.out);
      s.start(when); s.stop(when + 0.15);
    }
  }
  stop(){ try { this.src.stop(ctx.currentTime + 0.8); } catch(e){} super.stop(); }
}

/* --- birds: sparse pitched sweeps, high and brief --- */
class Birds extends Layer {
  constructor(o = {}){
    super(o.wet ?? 0.62);
    this.p = o.p ?? 0.05; this.lo = o.lo ?? 1800; this.hi = o.hi ?? 3600;
    this.vel = o.vel ?? 0.035;
  }
  beat(t, info){
    if (Math.random() > this.p) return;
    const calls = 1 + (Math.random()*3|0);
    for (let i = 0; i < calls; i++){
      const when = t + i*(0.09 + Math.random()*0.1);
      const f0 = this.lo + Math.random()*(this.hi - this.lo);
      const up = Math.random() < 0.6;
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(up ? f0*0.8 : f0*1.25, when);
      o.frequency.exponentialRampToValueAtTime(up ? f0*1.3 : f0*0.78, when + 0.075);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(this.vel*(0.6+Math.random()*0.7), when + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.1);
      o.connect(g); g.connect(this.out);
      o.start(when); o.stop(when + 0.14);
    }
  }
}

/* --- leaves: short bandpassed noise rustles --- */
class Leaves extends Layer {
  constructor(o = {}){
    super(o.wet ?? 0.3);
    this.p = o.p ?? 0.25; this.vel = o.vel ?? 0.045;
  }
  beat(t, info){
    if (Math.random() > this.p) return;
    const when = t + Math.random()*info.protocol.spb;
    const dur = 0.25 + Math.random()*0.5;
    const s = noiseSource(false);
    const bp = ctx.createBiquadFilter(); bp.type='bandpass';
    bp.frequency.value = 2200 + Math.random()*2200; bp.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(this.vel, when + dur*0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    s.connect(bp); bp.connect(g); g.connect(this.out);
    s.start(when); s.stop(when + dur + 0.1);
  }
}

/* --- ornament layers: the pitched material --- */
class Ornament extends Layer {
  constructor(o){
    super(o.wet ?? 0.55);
    Object.assign(this, {
      root: 146.83, scale: [0,2,3,5,7,9,10],
      everyBars: 5, p: 0.5, onBeats: null, voice: 'bell',
      oct: 1, vel: 0.09, dur: 2.6, damp: 0.955, tone: 2600,
      ratios: [1,2.01,3.03], breathVel: 0.05
    }, o);
  }
  beat(t, info){
    if (info.barAbs % this.everyBars !== 0) return;
    const b = info.beatInCycle % info.protocol.beatsPerBar;
    if (this.onBeats && !this.onBeats.includes(b)) return;
    if (Math.random() > this.p) return;
    const deg = this.scale[(Math.random()*this.scale.length)|0];
    const f = this.root * this.oct * Math.pow(2, deg/12);
    const v = this.vel + info.level*this.breathVel;
    const when = t + (Math.random()*0.03);
    if (this.voice === 'pluck')      pluck(this.out, when, f, v*1.5, this.damp, this.tone);
    else if (this.voice === 'bowed') bowed(this.out, when, f, this.dur, v*0.8);
    else                             struck(this.out, when, f, this.dur, v, this.ratios);
  }
}

/* ================================================================== *
 *  themes — a soundscape per level, matched to its art
 * ================================================================== */

const D = 146.83, DORIAN = [0,2,3,5,7,9,10];
const A = 110,    PENT   = [0,3,5,7,10];
const G = 98,     MAJPENT= [0,2,4,7,9];
const E = 164.81, LYD    = [0,2,4,7,9,11];

export const THEMES = {
  /* Desert dusk — The Long Shore. Wind, distant birds, dorian drone. */
  'desert-dusk': {
    trim: 1.0,
    make: () => ({
      pad:    new Pad([73.42, 110, 146.83], 420, 1500),
      wind:   new Wind({ bed: 0.13, cut: 620, top: 1700 }),
      bells:  new Ornament({ root: D, scale: DORIAN, everyBars: 5, p: 0.5,
                             onBeats: [0,2], voice: 'bell', dur: 2.8, vel: 0.085 }),
      strings:new Ornament({ root: D/2, scale: DORIAN, everyBars: 7, p: 0.42,
                             onBeats: [1], voice: 'pluck', vel: 0.075, damp: 0.962, tone: 2100 }),
      high:   new Ornament({ root: D*4, scale: [0,2,5,7], everyBars: 11, p: 0.3,
                             onBeats: [2], voice: 'bell', dur: 1.6, vel: 0.03,
                             ratios: [1,2.76,5.4] }),
      birds:  new Birds({ p: 0.035, lo: 1700, hi: 3200, vel: 0.028 })
    }),
    mix: { pad: 1, wind: 1, bells: 1, strings: 0.9, high: 0.8, birds: 0.7 }
  },

  /* Night pool — water, low gong, pentatonic drops. */
  'night-pool': {
    trim: 0.95,
    make: () => ({
      pad:    new Pad([55, 110], 300, 900),
      surf:   new Surf({ vel: 0.10 }),
      drops:  new Ornament({ root: A*2, scale: PENT, everyBars: 7, p: 0.3,
                             voice: 'bell', dur: 3.4, vel: 0.055, ratios: [1,2.4,4.1] }),
      strings:new Ornament({ root: A, scale: PENT, everyBars: 8, p: 0.35, onBeats: [0],
                             voice: 'pluck', vel: 0.07, damp: 0.968, tone: 1700 }),
      gong:   new Ornament({ root: 55, scale: [0], everyBars: 8, p: 1, onBeats: [0],
                             voice: 'bell', dur: 7.5, vel: 0.13,
                             ratios: [1,1.52,2.41,3.47,5.11] }),
      leaves: new Leaves({ p: 0.12, vel: 0.03 })
    }),
    mix: { pad: 1, surf: 1, drops: 1, strings: 0.85, gong: 0.9, leaves: 0.6 }
  },

  /* Storm — the rain the user liked, with thunder-weight pad. */
  'storm': {
    trim: 0.9,
    make: () => ({
      pad:    new Pad([49, 73.42, 98], 260, 700),
      rain:   new Rain({ bed: 0.11, drops: 0.7, hp: 600, lp: 8000 }),
      wind:   new Wind({ bed: 0.10, cut: 500, top: 1200 }),
      bowedL: new Ornament({ root: G/2, scale: [0,3,5,7,10], everyBars: 7, p: 0.5,
                             onBeats: [0], voice: 'bowed', dur: 5.5, vel: 0.07 }),
      bells:  new Ornament({ root: G*2, scale: [0,3,5,7,10], everyBars: 5, p: 0.3,
                             onBeats: [2], voice: 'bell', dur: 3.0, vel: 0.05 })
    }),
    mix: { pad: 1, rain: 1, wind: 0.8, bowedL: 0.9, bells: 0.8 }
  },

  /* Mountain temple — high, bright, hard shadows. Struck metal. */
  'temple-noon': {
    trim: 1.05,
    make: () => ({
      pad:    new Pad([98, 147, 196], 600, 2100),
      wind:   new Wind({ bed: 0.09, cut: 800, top: 2200 }),
      bowl:   new Ornament({ root: G, scale: MAJPENT, everyBars: 4, p: 0.55, onBeats: [0],
                             voice: 'bell', dur: 5.0, vel: 0.10, ratios: [1,2.3,3.8,5.9] }),
      pluckL: new Ornament({ root: G*2, scale: MAJPENT, everyBars: 5, p: 0.4,
                             voice: 'pluck', vel: 0.07, damp: 0.95, tone: 3200 }),
      birds:  new Birds({ p: 0.05, lo: 2200, hi: 4200, vel: 0.03 })
    }),
    mix: { pad: 1, wind: 0.8, bowl: 1, pluckL: 0.9, birds: 0.7 }
  },

  /* Cliffside flight — The Run. Heartbeat under everything. */
  'cliffs-midday': {
    trim: 1.25,
    make: () => ({
      pad:    new Pad([82.41, 164.81], 700, 2200),
      heart:  new Heart({ vel: 0.20, everyBeats: 2, f1: 56, f2: 45 }),
      wind:   new Wind({ bed: 0.12, cut: 900, top: 2600 }),
      bass:   new Ornament({ root: E/2, scale: [0,7], everyBars: 3, p: 0.9, onBeats: [0,2],
                             voice: 'pluck', vel: 0.09, damp: 0.93, tone: 1400 }),
      bright: new Ornament({ root: E*2, scale: LYD, everyBars: 4, p: 0.5,
                             voice: 'bell', dur: 1.1, vel: 0.055, ratios: [1,2.76,5.4] }),
      leaves: new Leaves({ p: 0.3, vel: 0.04 })
    }),
    mix: { pad: 0.9, heart: 1, wind: 1, bass: 1, bright: 0.9, leaves: 0.6 }
  },

  /* Night river — sleep. Water, fire on the bank, almost nothing else. */
  'night-river': {
    trim: 0.85,
    make: () => ({
      pad:    new Pad([49, 73.42], 220, 620),
      surf:   new Surf({ vel: 0.07 }),
      fire:   new Fire({ bed: 0.05, rate: 0.35 }),
      bowedL: new Ornament({ root: 98, scale: [0,3,5,7], everyBars: 9, p: 0.35, onBeats: [0],
                             voice: 'bowed', dur: 7.0, vel: 0.055 }),
      drops:  new Ornament({ root: 392, scale: [0,3,7], everyBars: 13, p: 0.25,
                             voice: 'bell', dur: 4.0, vel: 0.025 })
    }),
    mix: { pad: 1, surf: 0.9, fire: 0.8, bowedL: 1, drops: 0.7 }
  }
};

/* ================================================================== *
 *  the conductor
 * ================================================================== */

export class Music {
  constructor(themeId){
    this.id = THEMES[themeId] ? themeId : 'desert-dusk';
    this.def = THEMES[this.id];
    this.layers = null;
    this.live = false;
    this.beatAbs = 0;
  }
  begin(){
    if (this.live) return;
    this.layers = this.def.make();
    const mix = this.def.mix || {};
    for (const [k, l] of Object.entries(this.layers)) l.setLevel(mix[k] ?? 1, 1.5);
    this.live = true;
    this.beatAbs = 0;
    setTrim(this.def.trim || 1);
  }
  /** Dial one layer up or down, 0..1. Lets a level emphasise its own story. */
  setLayer(name, v){ if (this.layers && this.layers[name]) this.layers[name].setLevel(v); }
  layerNames(){ return this.layers ? Object.keys(this.layers) : Object.keys(this.def.make ? {} : {}); }

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
