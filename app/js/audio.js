/* The Book of Rates — music and soundscape layer.
 *
 * EVERYTHING is synthesised at runtime. No samples, nothing downloaded,
 * nothing transcribed from any existing piece.
 *
 * GAIN STAGING. Every layer has an explicit peak budget (BUDGET). Worst
 * case they total ~0.30 linear, so the master sits near -14 dBFS with real
 * headroom. The soft clip is a safety net, not the mixing strategy.
 *
 * SPECTRUM. One layer owns the low end at a time; everything else is
 * high-passed. Phone speakers roll off bass hard, so low energy costs
 * headroom you cannot hear.
 *
 * NO FEEDBACK STRUCTURES. Every voice is a bounded envelope on an
 * oscillator or a noise burst. Nothing can diverge.
 *
 * DIFFERENTIATION. Each theme has its own instrument family, register,
 * rhythmic density AND its own reverb space (applySpace rebuilds the
 * impulse per theme). Themes are not one palette refiltered.
 *
 * LOOP RULES (research/05-loop-music.md): static or modal field, never a
 * cadence at the loop point, only the breath layer strictly periodic,
 * ornaments on coprime bar cycles, stochastic placement, real silence.
 *
 * The music makes no claim about the listener's body. (Design doc 3.1.)
 */

let ctx=null, master=null, dry=null, wet=null, wetLP=null, preDelay=null, verb=null,
    analyser=null, noiseBuf=null, duck=null, statics=null, clip=null;

export function audioContext(){ return ctx; }
export function _internals(){ return { ctx, master, dry, wet, duck, statics, clip }; }

const BUDGET = {
  pad:0.085, low:0.090, bell:0.055, pluck:0.050, bowed:0.050,
  reed:0.055, stab:0.045, wood:0.030, bed:0.035, spark:0.022, boom:0.085
};

export async function initAudio(){
  if (ctx){ if (ctx.state==='suspended') await ctx.resume(); return ctx; }
  const AC = window.AudioContext || window.webkitAudioContext;
  ctx = new AC();
  if (ctx.state==='suspended') await ctx.resume();

  master = ctx.createGain(); master.gain.value = 0;

  verb = ctx.createConvolver(); verb.normalize = false;
  preDelay = ctx.createDelay(0.4); preDelay.delayTime.value = 0.02;

  dry = ctx.createGain(); dry.gain.value = 0.80;
  wet = ctx.createGain(); wet.gain.value = 0.55;
  wetLP = ctx.createBiquadFilter(); wetLP.type='lowpass';  wetLP.frequency.value = 2400;
  const wetHP = ctx.createBiquadFilter(); wetHP.type='highpass'; wetHP.frequency.value = 180;

  duck    = ctx.createGain(); duck.gain.value = 1;
  statics = ctx.createGain(); statics.gain.value = 1;
  duck.connect(dry);    duck.connect(wetHP);
  statics.connect(dry); statics.connect(wetHP);
  wetHP.connect(wetLP); wetLP.connect(wet);
  wet.connect(preDelay); preDelay.connect(verb); verb.connect(master);
  dry.connect(master);

  const subHP = ctx.createBiquadFilter(); subHP.type='highpass'; subHP.frequency.value = 32;
  const air = ctx.createBiquadFilter(); air.type='highshelf'; air.frequency.value=7500; air.gain.value=-6;

  // Stateless soft clip. A compressor was used here and reported impossible
  // reduction figures, so it could not be trusted; a waveshaper has no
  // internal state to corrupt.
  clip = ctx.createWaveShaper();
  const CURVE = new Float32Array(1024);
  for (let i=0;i<CURVE.length;i++){
    const x = (i/(CURVE.length-1))*2-1;
    CURVE[i] = Math.tanh(x*1.6)/Math.tanh(1.6);
  }
  clip.curve = CURVE; clip.oversample = '4x';

  analyser = ctx.createAnalyser(); analyser.fftSize = 1024;

  ctx.onstatechange = () => {
    if (ctx && ctx.state !== 'running'){ try { ctx.resume(); } catch(e){} }
  };

  master.connect(subHP); subHP.connect(air); air.connect(clip);
  clip.connect(analyser); analyser.connect(ctx.destination);

  applySpace({ decay:3.0, tilt:2400, pre:0.02, wet:0.55 });
  return ctx;
}

/** Each theme gets its own room. A convolver sums across every impulse
 *  sample, so the impulse is energy-normalised — without that a sustained
 *  pad integrates and runs away. */
export function applySpace({ decay=3.0, tilt=2400, pre=0.02, wet:wetAmt=0.55, curve=2.8 } = {}){
  if (!ctx) return;
  const n = Math.max(1, Math.floor(ctx.sampleRate*decay));
  const ir = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c=0;c<2;c++){
    const d = ir.getChannelData(c);
    let e = 0;
    for (let i=0;i<n;i++){
      const t = i/n;
      d[i] = (Math.random()*2-1)*Math.pow(1-t, curve)*(1-t*0.25);
      e += d[i]*d[i];
    }
    const k = 0.20/Math.sqrt(e);
    for (let i=0;i<n;i++) d[i] *= k;
  }
  verb.buffer = ir;
  wetLP.frequency.setTargetAtTime(tilt, ctx.currentTime, 0.2);
  preDelay.delayTime.setTargetAtTime(pre, ctx.currentTime, 0.1);
  wet.gain.setTargetAtTime(wetAmt, ctx.currentTime, 0.2);
}

/* Audio plays in the user's actual room. Never leave it running. */
export async function shutdownAudio(){
  if (!ctx) return;
  try { master.gain.cancelScheduledValues(0); master.gain.value = 0; } catch(e){}
  try { await ctx.suspend(); } catch(e){}
}
export async function closeAudio(){
  if (!ctx) return;
  try { await ctx.close(); } catch(e){}
  ctx=null; master=null; dry=null; wet=null; wetLP=null; preDelay=null; verb=null;
  analyser=null; noiseBuf=null; duck=null; statics=null; clip=null;
}

const BASE = 2.4;
let userTrim = 1, muted = false;
const target = () => muted ? 0.0001 : BASE*userTrim;

export function fadeIn(sec=2.0){
  if (!master) return;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), ctx.currentTime);
  master.gain.linearRampToValueAtTime(target(), ctx.currentTime+sec);
}
export function fadeOut(sec=2.5){
  if (!master) return;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), ctx.currentTime);
  master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime+sec);
}
/** Muting silences the soundscape only; the breath engine runs off the
 *  audio clock, not the audio output, so guidance is unaffected. */
export function setMuted(m){
  muted = m;
  if (!master) return;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.linearRampToValueAtTime(target(), ctx.currentTime+0.4);
}
export function isMuted(){ return muted; }
export function setTrim(v){
  userTrim = v;
  if (master) master.gain.linearRampToValueAtTime(target(), ctx.currentTime+0.3);
}

/* Byte time-domain SILENCE is 128, not 0. A failed read leaves a
 * zero-filled buffer, which computes as full scale. `ok` catches that.
 * A level reading says nothing about whether the result sounds good. */
export function meter(){
  if (!analyser) return { ok:false, reason:'no analyser' };
  const b = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(b);
  let sum=0, peak=0, mean=0;
  for (let i=0;i<b.length;i++){
    mean += b[i];
    const v = (b[i]-128)/128; sum += v*v;
    const a = Math.abs(v); if (a>peak) peak=a;
  }
  mean /= b.length;
  if (mean<64 || mean>192) return { ok:false, reason:'suspect read, mean '+mean.toFixed(1) };
  const rms = Math.sqrt(sum/b.length);
  const db = x => x<1e-5 ? -100 : 20*Math.log10(x);
  return { ok:true, peak, rms, peakDb:+db(peak).toFixed(1), rmsDb:+db(rms).toFixed(1), reduction:0 };
}
/* A soft phase marker for eyes-closed use. The research is clear that the
 * envelope should carry the turnaround and an event should be secondary
 * and varied — an identical chime every ten seconds becomes the most
 * irritating thing in the mix. So this is low, slow-attacked, slightly
 * different every time, and only used when the reader cannot see. */
export function marker(when, up){
  if (!ctx || !master) return;
  const t = Math.max(when, ctx.currentTime + 0.01);
  const f0 = up ? 294 : 196;
  const g1 = ctx.createGain(); g1.gain.value = 1;
  const lp = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value = 1400;
  g1.connect(lp); lp.connect(dry);
  const w = ctx.createGain(); w.gain.value = 0.5; lp.connect(w); w.connect(wet);
  [[1,1.0],[2,0.22],[3,0.08]].forEach(([h,a]) => {
    const o = ctx.createOscillator(); o.type='sine';
    const jitter = 1 + (Math.random()*0.012 - 0.006);
    o.frequency.setValueAtTime(f0*h*jitter, t);
    o.frequency.linearRampToValueAtTime(f0*h*jitter*(up?1.045:0.955), t+0.5);
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0, t);
    g2.gain.linearRampToValueAtTime(0.09*a, t+0.09);
    g2.gain.exponentialRampToValueAtTime(0.0001, t+0.95);
    o.connect(g2); g2.connect(g1);
    o.start(t); o.stop(t+1.0);
  });
  setTimeout(() => { try { g1.disconnect(); } catch(e){} },
             Math.max(0, (t - ctx.currentTime + 1.3))*1000);
}

export function waveform(arr){ if (!analyser) return false; analyser.getByteTimeDomainData(arr); return true; }
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
  head.connect(parent); head.connect(w); w.connect(parent);
  return g;
}
function noise(){
  if (noiseBuf) return noiseBuf;
  const n = Math.floor(ctx.sampleRate*6);
  noiseBuf = ctx.createBuffer(1,n,ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  let b0=0,b1=0,b2=0;
  for (let i=0;i<n;i++){
    const w = Math.random()*2-1;
    b0=0.99765*b0+w*0.0990460; b1=0.96300*b1+w*0.2965164; b2=0.57000*b2+w*1.0526913;
    d[i]=(b0+b1+b2+w*0.1848)*0.22;
  }
  return noiseBuf;
}
function nz(loop=true){
  const s = ctx.createBufferSource(); s.buffer = noise(); s.loop = loop;
  s.playbackRate.value = 0.9+Math.random()*0.2;
  return s;
}
function later(t,dur,fn){ setTimeout(fn, Math.max(0,(t-ctx.currentTime+dur))*1000); }
function partials(out, t, freq, dur, vel, ratios, amps, detune=4){
  const mix = ctx.createGain(); mix.gain.value=1; mix.connect(out);
  ratios.forEach((r,i)=>{
    const f = freq*r;
    if (f>11000) return;
    const o = ctx.createOscillator(); o.type='sine';
    o.frequency.value=f; o.detune.value=(Math.random()*2-1)*detune;
    const g = ctx.createGain();
    const a = vel*(amps[i] ?? 0.04);
    const d = Math.max(0.08, dur*Math.pow(0.68,i));
    g.gain.setValueAtTime(0,t);
    g.gain.linearRampToValueAtTime(a, t+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t+d);
    o.connect(g); g.connect(mix);
    o.start(t); o.stop(t+d+0.05);
  });
  later(t, dur+0.4, ()=>{ try{ mix.disconnect(); }catch(e){} });
  return mix;
}
function mallet(out, t, freq, vel, q=1.1, dur=0.045){
  const s = nz(false);
  const bp = ctx.createBiquadFilter(); bp.type='bandpass';
  bp.frequency.value = Math.min(6000, freq*4); bp.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0,t);
  g.gain.linearRampToValueAtTime(vel, t+0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
  s.connect(bp); bp.connect(g); g.connect(out);
  s.start(t); s.stop(t+dur+0.06);
}

/* ================================================================== *
 *  voices — each theme draws on a DIFFERENT family
 * ================================================================== */
const VOICES = {
  /* temple + pool: struck metal, long and inharmonic */
  bowl(out,t,f,o){
    const m = partials(out,t,f,o.dur??5.0,o.vel??0.8,
      o.ratios??[1,2.33,3.91,5.62,7.21],[1,0.36,0.22,0.12,0.07],3);
    // a second copy a few cents off, so it beats slowly like real metal
    partials(out,t,f*1.004,(o.dur??5.0)*0.9,(o.vel??0.8)*0.55,
      o.ratios??[1,2.33,3.91],[1,0.3,0.16],3);
    mallet(out,t,f,(o.vel??0.8)*0.18,1.4);
    return m;
  },
  /* pool: a single water drop, pitch falling away */
  drop(out,t,f,o){
    const g = ctx.createGain(); g.gain.value=1; g.connect(out);
    const osc = ctx.createOscillator(); osc.type='sine';
    osc.frequency.setValueAtTime(f*1.5,t);
    osc.frequency.exponentialRampToValueAtTime(f*0.85, t+0.09);
    const a = ctx.createGain();
    a.gain.setValueAtTime(0,t);
    a.gain.linearRampToValueAtTime(o.vel??0.7, t+0.004);
    a.gain.exponentialRampToValueAtTime(0.0001, t+(o.dur??0.5));
    osc.connect(a); a.connect(g);
    osc.start(t); osc.stop(t+(o.dur??0.5)+0.05);
    later(t,(o.dur??0.5)+0.3,()=>{ try{ g.disconnect(); }catch(e){} });
  },
  /* desert: dry short plucked string with a buzzing formant */
  dryPluck(out,t,f,o){
    const lp = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=o.tone??2600;
    const buzz = ctx.createBiquadFilter(); buzz.type='peaking';
    buzz.frequency.value=f*3.2; buzz.Q.value=4; buzz.gain.value=7;
    lp.connect(buzz); buzz.connect(out);
    partials(lp,t,f,o.dur??0.9,o.vel??0.8,[1,2.01,3.02,4.05,5.1,6.2],[1,0.62,0.4,0.26,0.16,0.09],3);
    mallet(lp,t,f,(o.vel??0.8)*0.3,2.2,0.03);
    later(t,(o.dur??0.9)+0.5,()=>{ try{ lp.disconnect(); buzz.disconnect(); }catch(e){} });
  },
  /* desert + river: breathy pitched reed. Noise IS the tone here. */
  reed(out,t,f,o){
    const dur = o.dur??3.0, vel = o.vel??0.8;
    const mix = ctx.createGain(); mix.gain.value=0; mix.connect(out);
    const s = nz();
    const bp = ctx.createBiquadFilter(); bp.type='bandpass';
    bp.frequency.value=f; bp.Q.value=14;
    const bp2 = ctx.createBiquadFilter(); bp2.type='bandpass';
    bp2.frequency.value=f*3; bp2.Q.value=9;
    const ng = ctx.createGain(); ng.gain.value=2.4;
    const n2 = ctx.createGain(); n2.gain.value=0.7;
    s.connect(bp); bp.connect(ng); ng.connect(mix);
    s.connect(bp2); bp2.connect(n2); n2.connect(mix);
    const o1 = ctx.createOscillator(); o1.type='sine'; o1.frequency.value=f;
    const og = ctx.createGain(); og.gain.value=0.35;
    o1.connect(og); og.connect(mix);
    const vib = ctx.createOscillator(); vib.frequency.value=4.4+Math.random();
    const vg = ctx.createGain(); vg.gain.value=f*0.006;
    vib.connect(vg); vg.connect(o1.frequency); vg.connect(bp.frequency);
    mix.gain.setValueAtTime(0,t);
    mix.gain.linearRampToValueAtTime(vel, t+dur*0.3);
    mix.gain.linearRampToValueAtTime(vel*0.8, t+dur*0.7);
    mix.gain.linearRampToValueAtTime(0.0001, t+dur);
    s.start(t); o1.start(t); vib.start(t);
    s.stop(t+dur+0.1); o1.stop(t+dur+0.1); vib.stop(t+dur+0.1);
    later(t,dur+0.4,()=>{ try{ mix.disconnect(); }catch(e){} });
  },
  /* storm + river: bowed low string, no attack at all */
  bowed(out,t,f,o){
    const dur=o.dur??5.5, vel=o.vel??0.8;
    const mix = ctx.createGain(); mix.gain.value=0; mix.connect(out);
    const lp = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=f*6;
    lp.connect(mix);
    [[1,0.55],[2,0.22],[3,0.10],[4,0.05]].forEach(([h,a])=>{
      [-4,4].forEach(c=>{
        const o2=ctx.createOscillator(); o2.type='sine';
        o2.frequency.value=f*h; o2.detune.value=c;
        const g=ctx.createGain(); g.gain.value=a*0.5;
        o2.connect(g); g.connect(lp);
        o2.start(t); o2.stop(t+dur+0.3);
      });
    });
    mix.gain.setValueAtTime(0,t);
    mix.gain.linearRampToValueAtTime(vel, t+dur*0.40);
    mix.gain.linearRampToValueAtTime(vel*0.72, t+dur*0.72);
    mix.gain.linearRampToValueAtTime(0.0001, t+dur);
    later(t,dur+0.4,()=>{ try{ mix.disconnect(); }catch(e){} });
  },
  /* cliffs: short bright resonant stab — the only hard-edged voice */
  stab(out,t,f,o){
    const dur=o.dur??0.5, vel=o.vel??0.8;
    const lp = ctx.createBiquadFilter(); lp.type='lowpass';
    lp.Q.value=7;
    lp.frequency.setValueAtTime(f*8,t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(200,f*1.6), t+dur);
    lp.connect(out);
    partials(lp,t,f,dur,vel,[1,2,3,4,5],[1,0.5,0.33,0.25,0.2],2);
    later(t,dur+0.4,()=>{ try{ lp.disconnect(); }catch(e){} });
  },
  /* temple: a wooden block. Pitch is almost incidental. */
  wood(out,t,f,o){
    const g = ctx.createGain(); g.gain.value=1; g.connect(out);
    mallet(g,t,f*2,(o.vel??0.8)*0.9,3.5,0.035);
    partials(g,t,f,0.14,(o.vel??0.8)*0.5,[1,2.9],[1,0.4],2);
    later(t,0.5,()=>{ try{ g.disconnect(); }catch(e){} });
  },
  /* generic struck bell, kept for anything that wants it */
  bell(out,t,f,o){
    partials(out,t,f,o.dur??3.0,o.vel??0.8,
      o.ratios??[1,2.0,2.97,4.12,5.43],[1,0.42,0.24,0.13,0.07]);
    mallet(out,t,f,(o.vel??0.8)*0.2);
  },
  /* bounded plucked tone (no feedback loop) */
  pluck(out,t,f,o){
    const lp = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=o.tone??1800;
    lp.connect(out);
    partials(lp,t,f,o.dur??1.9,o.vel??0.8,[1,2.003,3.01,4.02,5.04,6.07],[1,0.5,0.26,0.14,0.08,0.04],3);
    mallet(lp,t,f,(o.vel??0.8)*0.18,1.4,0.05);
    later(t,(o.dur??1.9)+0.5,()=>{ try{ lp.disconnect(); }catch(e){} });
  }
};

/* ================================================================== *
 *  layers
 * ================================================================== */
class Layer {
  constructor({ wet=0.35, hp=150, budget=0.05, low=false } = {}){
    this.out = busTo(low?statics:duck, wet, low?0:hp);
    this.budget = budget; this.level = 1;
    this.out.gain.value = budget;
  }
  setLevel(v, ramp=0.5){
    this.level = v;
    this.out.gain.cancelScheduledValues(ctx.currentTime);
    this.out.gain.setValueAtTime(this.out.gain.value, ctx.currentTime);
    this.out.gain.linearRampToValueAtTime(Math.max(0.00001, this.budget*v), ctx.currentTime+ramp);
  }
  beat(){} breath(){}
  stop(){
    this.out.gain.cancelScheduledValues(ctx.currentTime);
    this.out.gain.setValueAtTime(this.out.gain.value, ctx.currentTime);
    this.out.gain.linearRampToValueAtTime(0.00001, ctx.currentTime+0.6);
    later(ctx.currentTime, 1.4, ()=>{ try{ this.out.disconnect(); }catch(e){} });
  }
}

/** Additive sine pad. `shape` changes its character between themes:
 *  'warm' few partials, 'glass' odd partials only, 'dark' fundamental-heavy. */
class Pad extends Layer {
  constructor(freqs, baseCut, topCut, o={}){
    super({ wet:o.wet??0.5, hp:o.hp??90, budget:o.budget??BUDGET.pad });
    this.baseCut=baseCut; this.topCut=topCut;
    const lp = ctx.createBiquadFilter(); lp.type='lowpass';
    lp.frequency.value=baseCut; lp.Q.value=0.4;
    this.cut = lp.frequency; this.oscs=[];
    const SHAPES = {
      warm:  [[1,1.0],[2,0.34],[3,0.16],[4,0.08]],
      glass: [[1,1.0],[3,0.30],[5,0.16],[7,0.08]],
      dark:  [[1,1.0],[2,0.18],[3,0.05]],
      rich:  [[1,1.0],[2,0.4],[3,0.26],[4,0.16],[5,0.09],[6,0.05]]
    };
    const PART = SHAPES[o.shape||'warm'];
    freqs.forEach((f,idx)=>{
      const w = idx===0 ? 1 : 0.55;
      PART.forEach(([h,a])=>{
        const det = h===1 ? [-4,4] : [0];
        det.forEach(c=>{
          const o2=ctx.createOscillator(); o2.type='sine';
          o2.frequency.value=f*h; o2.detune.value=c+(Math.random()*3-1.5);
          const g=ctx.createGain();
          const base=(a*w)/(freqs.length*det.length)*0.55;
          g.gain.value=base;
          const lfo=ctx.createOscillator(); lfo.frequency.value=0.023+Math.random()*0.06;
          const lg=ctx.createGain(); lg.gain.value=base*0.3;
          lfo.connect(lg); lg.connect(g.gain); lfo.start();
          o2.connect(g); g.connect(lp); o2.start();
          this.oscs.push(o2,lfo);
        });
      });
    });
    lp.connect(this.out);
  }
  breath(t,inSec,outSec){
    this.cut.cancelScheduledValues(t);
    this.cut.setValueAtTime(this.baseCut,t);
    this.cut.linearRampToValueAtTime(this.topCut, t+inSec);
    this.cut.linearRampToValueAtTime(this.baseCut, t+inSec+outSec);
  }
  stop(){ this.oscs.forEach(o=>{ try{ o.stop(ctx.currentTime+0.9); }catch(e){} }); super.stop(); }
}

/* heartbeat: the only layer owning the low end; the rest ducks under it.
 * Fires every two beats, so at 120 BPM it lands at 60 per minute. That is
 * an observation about how it sounds, not a claim about anyone's heart. */
class Heart extends Layer {
  constructor(o={}){
    super({ wet:o.wet??0.05, budget:o.budget??BUDGET.low, low:true });
    this.f1=o.f1??72; this.f2=o.f2??58; this.vel=o.vel??0.85;
    this.everyBeats=o.everyBeats??2; this.duckAmt=o.duck??0.86;
  }
  thump(t,freq,vel,dur){
    const mix=ctx.createGain(); mix.gain.value=1;
    const lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=220;
    mix.connect(lp); lp.connect(this.out);
    [[1,1.0],[2,0.18]].forEach(([h,a])=>{
      const o=ctx.createOscillator(); o.type='sine';
      o.frequency.setValueAtTime(freq*h*1.5,t);
      o.frequency.exponentialRampToValueAtTime(freq*h*0.78, t+dur*0.7);
      const g=ctx.createGain();
      g.gain.setValueAtTime(0,t);
      g.gain.linearRampToValueAtTime(vel*a, t+0.026);
      g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
      o.connect(g); g.connect(mix);
      o.start(t); o.stop(t+dur+0.05);
    });
    later(t,dur+0.3,()=>{ try{ mix.disconnect(); }catch(e){} });
  }
  beat(t,info){
    if (info.beatAbs % this.everyBeats !== 0) return;
    const spb=info.protocol.spb, v=this.vel*(0.8+info.level*0.25);
    this.thump(t,this.f1,v,0.26);
    this.thump(t+spb*0.28,this.f2,v*0.6,0.22);
    if (duck){
      duck.gain.cancelScheduledValues(t);
      duck.gain.setValueAtTime(1,t);
      duck.gain.linearRampToValueAtTime(this.duckAmt, t+0.03);
      duck.gain.linearRampToValueAtTime(1, t+0.34);
    }
  }
}

/* thunder: rare, huge, low. Storm only. */
class Thunder extends Layer {
  constructor(o={}){
    super({ wet:o.wet??0.5, budget:o.budget??BUDGET.boom, low:true });
    this.next=0; this.p=o.p??1;
  }
  beat(t,info){
    if (t < this.next) return;
    this.next = t + 14 + Math.random()*26;          // never regular
    const dur = 4.5+Math.random()*3.5;
    const s = nz();
    const lp = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=90;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001,t);
    g.gain.linearRampToValueAtTime(0.9, t+0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
    lp.frequency.setValueAtTime(220,t);
    lp.frequency.exponentialRampToValueAtTime(55, t+dur);
    s.connect(lp); lp.connect(g); g.connect(this.out);
    s.start(t); s.stop(t+dur+0.2);
  }
}

class Rain extends Layer {
  constructor(o={}){
    super({ wet:o.wet??0.25, budget:o.budget??BUDGET.bed });
    const s=nz();
    const hp=ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=o.hp??450;
    const lp=ctx.createBiquadFilter(); lp.type='lowpass';  lp.frequency.value=o.lp??2400;
    const tilt=ctx.createBiquadFilter(); tilt.type='highshelf';
    tilt.frequency.value=1800; tilt.gain.value=-8;
    const g=ctx.createGain(); g.gain.value=o.bed??0.5;
    s.connect(hp); hp.connect(lp); lp.connect(tilt); tilt.connect(g); g.connect(this.out);
    s.start(); this.src=s; this.drops=o.drops??0.4;
  }
  beat(t,info){
    const n=1+(Math.random()*2|0);
    for (let i=0;i<n;i++){
      if (Math.random()>this.drops) continue;
      const when=t+Math.random()*info.protocol.spb;
      const s=nz(false);
      const bp=ctx.createBiquadFilter(); bp.type='bandpass';
      bp.frequency.value=900+Math.random()*1800; bp.Q.value=4+Math.random()*4;
      const g=ctx.createGain();
      g.gain.setValueAtTime(0,when);
      g.gain.linearRampToValueAtTime(0.25+Math.random()*0.25, when+0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, when+0.08+Math.random()*0.1);
      s.connect(bp); bp.connect(g); g.connect(this.out);
      s.start(when); s.stop(when+0.25);
    }
  }
  stop(){ try{ this.src.stop(ctx.currentTime+0.9); }catch(e){} super.stop(); }
}

class Wind extends Layer {
  constructor(o={}){
    super({ wet:o.wet??0.3, budget:o.budget??BUDGET.bed });
    const s=nz();
    const hp=ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=o.hpf??160;
    const lp=ctx.createBiquadFilter(); lp.type='lowpass';  lp.frequency.value=o.cut??420;
    lp.Q.value=0.5;
    const g=ctx.createGain(); g.gain.value=0.6;
    [[0.019,160],[0.047,90]].forEach(([f,depth])=>{
      const l=ctx.createOscillator(); l.frequency.value=f;
      const lg=ctx.createGain(); lg.gain.value=depth;
      l.connect(lg); lg.connect(lp.frequency); l.start();
    });
    const l2=ctx.createOscillator(); l2.frequency.value=0.027;
    const l2g=ctx.createGain(); l2g.gain.value=0.22;
    l2.connect(l2g); l2g.connect(g.gain); l2.start();
    s.connect(hp); hp.connect(lp); lp.connect(g); g.connect(this.out);
    s.start(); this.src=s; this.bedGain=g;
  }
  breath(t,inSec,outSec){
    this.bedGain.gain.cancelScheduledValues(t);
    this.bedGain.gain.setValueAtTime(0.42,t);
    this.bedGain.gain.linearRampToValueAtTime(0.85, t+inSec);
    this.bedGain.gain.linearRampToValueAtTime(0.42, t+inSec+outSec);
  }
  stop(){ try{ this.src.stop(ctx.currentTime+0.9); }catch(e){} super.stop(); }
}

class Surf extends Layer {
  constructor(o={}){ super({ wet:o.wet??0.35, budget:o.budget??BUDGET.bed }); this.next=0; }
  beat(t){
    if (t<this.next) return;
    const dur=3.4+Math.random()*3.2;
    this.next=t+dur*0.5+Math.random()*2.6;
    const s=nz();
    const hp=ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=170;
    const lp=ctx.createBiquadFilter(); lp.type='lowpass';  lp.frequency.value=260;
    const g=ctx.createGain();
    g.gain.setValueAtTime(0.0001,t);
    g.gain.linearRampToValueAtTime(0.6+Math.random()*0.4, t+dur*0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
    lp.frequency.setValueAtTime(230,t);
    lp.frequency.linearRampToValueAtTime(900, t+dur*0.35);
    lp.frequency.linearRampToValueAtTime(200, t+dur);
    s.connect(hp); hp.connect(lp); lp.connect(g); g.connect(this.out);
    s.start(t); s.stop(t+dur+0.2);
  }
}

class Fire extends Layer {
  constructor(o={}){
    super({ wet:o.wet??0.14, budget:o.budget??BUDGET.bed });
    const s=nz();
    const lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=300;
    const g=ctx.createGain(); g.gain.value=0.55;
    s.connect(lp); lp.connect(g); g.connect(this.out);
    s.start(); this.src=s; this.rate=o.rate??0.3;
  }
  beat(t,info){
    const n=(Math.random()*2)|0;
    for (let i=0;i<n;i++){
      if (Math.random()>this.rate) continue;
      const when=t+Math.random()*info.protocol.spb;
      const s=nz(false);
      const bp=ctx.createBiquadFilter(); bp.type='bandpass';
      bp.frequency.value=700+Math.random()*1500; bp.Q.value=5+Math.random()*6;
      const g=ctx.createGain();
      g.gain.setValueAtTime(0,when);
      g.gain.linearRampToValueAtTime(0.3+Math.random()*0.4, when+0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, when+0.025+Math.random()*0.04);
      s.connect(bp); bp.connect(g); g.connect(this.out);
      s.start(when); s.stop(when+0.12);
    }
  }
  stop(){ try{ this.src.stop(ctx.currentTime+0.9); }catch(e){} super.stop(); }
}

/* dry grit: sand moving. Desert only — fills the gap wind leaves. */
class Grit extends Layer {
  constructor(o={}){
    super({ wet:o.wet??0.1, budget:o.budget??BUDGET.spark });
    this.p=o.p??0.25;
  }
  beat(t,info){
    if (Math.random()>this.p) return;
    const when=t+Math.random()*info.protocol.spb;
    const dur=0.5+Math.random()*1.2;
    const s=nz(false);
    const bp=ctx.createBiquadFilter(); bp.type='bandpass';
    bp.frequency.value=3200+Math.random()*2600; bp.Q.value=0.7;
    const g=ctx.createGain();
    g.gain.setValueAtTime(0,when);
    g.gain.linearRampToValueAtTime(0.35, when+dur*0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, when+dur);
    s.connect(bp); bp.connect(g); g.connect(this.out);
    s.start(when); s.stop(when+dur+0.1);
  }
}

class Birds extends Layer {
  constructor(o={}){
    super({ wet:o.wet??0.7, budget:o.budget??BUDGET.spark });
    this.p=o.p??0.035; this.lo=o.lo??1600; this.hi=o.hi??3000;
  }
  beat(t){
    if (Math.random()>this.p) return;
    const calls=1+(Math.random()*3|0);
    for (let i=0;i<calls;i++){
      const when=t+i*(0.1+Math.random()*0.1);
      const f0=this.lo+Math.random()*(this.hi-this.lo);
      const up=Math.random()<0.6;
      const o=ctx.createOscillator(); o.type='sine';
      o.frequency.setValueAtTime(up?f0*0.82:f0*1.22, when);
      o.frequency.exponentialRampToValueAtTime(up?f0*1.25:f0*0.8, when+0.08);
      const g=ctx.createGain();
      g.gain.setValueAtTime(0,when);
      g.gain.linearRampToValueAtTime(0.55+Math.random()*0.4, when+0.016);
      g.gain.exponentialRampToValueAtTime(0.0001, when+0.12);
      o.connect(g); g.connect(this.out);
      o.start(when); o.stop(when+0.16);
    }
  }
}

class Leaves extends Layer {
  constructor(o={}){
    super({ wet:o.wet??0.3, budget:o.budget??BUDGET.spark });
    this.p=o.p??0.18;
  }
  beat(t,info){
    if (Math.random()>this.p) return;
    const when=t+Math.random()*info.protocol.spb;
    const dur=0.3+Math.random()*0.5;
    const s=nz(false);
    const bp=ctx.createBiquadFilter(); bp.type='bandpass';
    bp.frequency.value=1400+Math.random()*1400; bp.Q.value=0.9;
    const lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=3200;
    const g=ctx.createGain();
    g.gain.setValueAtTime(0,when);
    g.gain.linearRampToValueAtTime(0.6, when+dur*0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, when+dur);
    s.connect(bp); bp.connect(lp); lp.connect(g); g.connect(this.out);
    s.start(when); s.stop(when+dur+0.1);
  }
}

/** A pitched layer. `voice` picks the family; `everyBars` keeps cycles
 *  coprime so the combination takes minutes to come round. */
class Ornament extends Layer {
  constructor(o){
    const kind = BUDGET[o.voice] ? o.voice : 'bell';
    super({ wet:o.wet??0.6, budget:o.budget??BUDGET[kind] });
    Object.assign(this, {
      root:146.83, scale:[0,2,3,5,7,9,10], everyBars:5, p:0.5,
      onBeats:null, voice:'bell', oct:1, vel:0.8, dur:2.6,
      tone:1800, ratios:undefined, breathVel:0.15, spread:0
    }, o);
  }
  beat(t,info){
    if (info.barAbs % this.everyBars !== 0) return;
    const b = info.beatInCycle % info.protocol.beatsPerBar;
    if (this.onBeats && !this.onBeats.includes(b)) return;
    if (Math.random() > this.p) return;
    const fire = (when, degIdx) => {
      const deg = this.scale[degIdx % this.scale.length];
      const f = this.root*this.oct*Math.pow(2, deg/12);
      const v = this.vel*(0.85+info.level*this.breathVel);
      (VOICES[this.voice]||VOICES.bell)(this.out, when, f,
        { dur:this.dur, vel:v, tone:this.tone, ratios:this.ratios });
    };
    const base = (Math.random()*this.scale.length)|0;
    fire(t+Math.random()*0.03, base);
    // a chord or a short figure, where the theme calls for one
    for (let i=1;i<=this.spread;i++) fire(t+i*0.045+Math.random()*0.02, base+i*2);
  }
}

/* ================================================================== *
 *  themes — each with its own instrument family, register and room
 * ================================================================== */
const DORIAN=[0,2,3,5,7,9,10], PENT=[0,3,5,7,10], MAJPENT=[0,2,4,7,9],
      AEOL=[0,2,3,5,7,8,10], LYD=[0,2,4,7,9,11];

export const THEMES = {
  /* DESERT DUSK — dry, wide, hot. Reed flute and a dry buzzing pluck.
     Mid-low register, huge empty top, very sparse, big dry room. */
  'desert-dusk': {
    trim: 1.00,   // measured, matched to ~-13 dBFS peak
    note: 'Reed flute and dry plucked string. Sparse, wide, hot.',
    space: { decay:3.6, tilt:1800, pre:0.045, wet:0.5, curve:3.2 },
    make: () => ({
      pad:   new Pad([73.42,110,146.83], 340, 1000, { shape:'dark' }),
      reed:  new Ornament({ voice:'reed', root:146.83, scale:DORIAN, everyBars:7, p:0.5,
                            onBeats:[0], dur:4.0, vel:0.75 }),
      pluck: new Ornament({ voice:'dryPluck', root:146.83, scale:DORIAN, everyBars:5, p:0.45,
                            onBeats:[0,2], dur:0.9, tone:2600, spread:1 }),
      wind:  new Wind({ cut:400 }),
      grit:  new Grit({ p:0.2 }),
      birds: new Birds({ p:0.025, lo:1500, hi:2600 })
    }),
    mix: { pad:1, reed:0.9, pluck:0.85, wind:0.8, grit:0.6, birds:0.5 }
  },

  /* NIGHT POOL — glassy and resonant. Struck metal and water only, no
     wind, no plucks. Extreme register split: very low gong, high drops,
     nothing in the middle. Longest reverb of any theme. */
  'night-pool': {
    trim: 0.90,   // measured, matched to ~-13 dBFS peak
    note: 'Struck metal and water. Very low, very high, nothing between.',
    space: { decay:6.0, tilt:1500, pre:0.08, wet:0.8, curve:2.2 },
    make: () => ({
      pad:   new Pad([55,110], 240, 620, { shape:'glass' }),
      gong:  new Ornament({ voice:'bowl', root:61.74, scale:[0], everyBars:8, p:1, onBeats:[0],
                            dur:9.0, vel:0.9, ratios:[1,1.52,2.41,3.47,5.11] }),
      bowls: new Ornament({ voice:'bowl', root:220, scale:PENT, everyBars:5, p:0.35,
                            dur:6.0, vel:0.6 }),
      drops: new Ornament({ voice:'drop', root:880, scale:PENT, everyBars:3, p:0.3,
                            dur:0.55, vel:0.6, spread:1 }),
      surf:  new Surf({})
    }),
    mix: { pad:1, gong:0.85, bowls:0.8, drops:0.7, surf:0.8 }
  },

  /* STORM — dense, dark, physically big. Bowed low strings and thunder.
     No bells of any kind. The only theme with continuous dense content. */
  'storm': {
    trim: 1.10,   // measured, matched to ~-13 dBFS peak
    note: 'Bowed low strings and thunder. Dense, dark, no metal at all.',
    space: { decay:4.2, tilt:900, pre:0.03, wet:0.65, curve:3.0 },
    make: () => ({
      pad:    new Pad([49,73.42,98], 200, 520, { shape:'rich' }),
      bowLow: new Ornament({ voice:'bowed', root:49, scale:AEOL, everyBars:5, p:0.6,
                             onBeats:[0], dur:6.5, vel:0.8, spread:1 }),
      bowMid: new Ornament({ voice:'bowed', root:98, scale:AEOL, everyBars:7, p:0.45,
                             onBeats:[2], dur:5.0, vel:0.6 }),
      thunder:new Thunder({}),
      rain:   new Rain({ drops:0.6 }),
      wind:   new Wind({ cut:320 })
    }),
    mix: { pad:1, bowLow:0.9, bowMid:0.75, thunder:0.9, rain:0.9, wind:0.7 }
  },

  /* TEMPLE NOON — bright, hard, dry. Struck metal and wood in open air.
     Short slap reverb, the most RHYTHMIC theme: nested colotomic cycles. */
  'temple-noon': {
    trim: 1.60,   // measured, matched to ~-13 dBFS peak
    note: 'Struck metal and wood, nested cycles, hard dry light.',
    space: { decay:1.4, tilt:4200, pre:0.012, wet:0.38, curve:2.4 },
    make: () => ({
      pad:   new Pad([196,294], 900, 2600, { shape:'glass', budget:0.05 }),
      big:   new Ornament({ voice:'bowl', root:98, scale:[0], everyBars:4, p:1, onBeats:[0],
                            dur:6.0, vel:0.85 }),
      mid:   new Ornament({ voice:'bowl', root:392, scale:MAJPENT, everyBars:3, p:0.7,
                            onBeats:[0,2], dur:2.4, vel:0.5 }),
      wood:  new Ornament({ voice:'wood', root:520, scale:[0,5], everyBars:2, p:0.8,
                            onBeats:[1,3], vel:0.6 }),
      birds: new Birds({ p:0.05, lo:2400, hi:4200 })
    }),
    mix: { pad:0.8, big:0.9, mid:0.8, wood:0.7, birds:0.6 }
  },

  /* CLIFFS MIDDAY — kinetic. Heartbeat, bright stabs, driving. The only
     theme with hard attacks and the only truly dry one. */
  'cliffs-midday': {
    trim: 0.55,   // measured, matched to ~-13 dBFS peak
    note: 'Heartbeat and bright stabs. Dry, fast, hard-edged.',
    space: { decay:1.0, tilt:3200, pre:0.008, wet:0.3, curve:2.6 },
    make: () => ({
      pad:    new Pad([82.41,164.81], 700, 2000, { shape:'warm' }),
      heart:  new Heart({ everyBeats:2 }),
      stabs:  new Ornament({ voice:'stab', root:329.63, scale:LYD, everyBars:3, p:0.55,
                             onBeats:[0,2], dur:0.45, vel:0.8 }),
      low:    new Ornament({ voice:'stab', root:82.41, scale:[0,7], everyBars:4, p:0.7,
                             onBeats:[0], dur:0.7, vel:0.75 }),
      wind:   new Wind({ cut:620, hpf:220 }),
      leaves: new Leaves({ p:0.22 })
    }),
    mix: { pad:0.75, heart:1, stabs:0.85, low:0.8, wind:0.8, leaves:0.5 }
  },

  /* NIGHT RIVER — almost nothing. Breathy low reed, fire, water. No
     struck tones at all. The quietest and darkest theme. */
  'night-river': {
    trim: 2.20,   // measured, matched to ~-13 dBFS peak
    note: 'Low breathy reed, a fire on the bank, water. Almost nothing.',
    space: { decay:4.8, tilt:1100, pre:0.05, wet:0.6, curve:2.6 },
    make: () => ({
      pad:   new Pad([43.65,65.41], 170, 420, { shape:'dark' }),
      reed:  new Ornament({ voice:'reed', root:98, scale:[0,3,5,7,10], everyBars:9, p:0.4,
                            onBeats:[0], dur:7.0, vel:0.7 }),
      bow:   new Ornament({ voice:'bowed', root:65.41, scale:[0,5,7], everyBars:11, p:0.3,
                            onBeats:[0], dur:8.0, vel:0.55 }),
      fire:  new Fire({ rate:0.3 }),
      surf:  new Surf({})
    }),
    mix: { pad:1, reed:0.85, bow:0.8, fire:0.75, surf:0.7 }
  }
};

/* ================================================================== *
 *  conductor
 * ================================================================== */
export class Music {
  constructor(themeId){
    this.id = THEMES[themeId] ? themeId : 'desert-dusk';
    this.def = THEMES[this.id];
    this.layers = null; this.live = false;
  }
  begin(){
    if (this.live) return;
    applySpace(this.def.space || {});
    setTrim(this.def.trim ?? 1);
    this.layers = this.def.make();
    const mix = this.def.mix || {};
    for (const [k,l] of Object.entries(this.layers)) l.setLevel(mix[k] ?? 1, 1.2);
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
      const inSec = inBeats*P.spb, outSec = (P.cycleBeats-inBeats)*P.spb;
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
