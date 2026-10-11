/* The Book of Rates — breath engine.
 *
 * The AudioContext clock is the only source of truth for time. Nothing
 * counts frames, nothing accumulates deltas, and nothing trusts setInterval
 * to keep time. Every beat in the session has its absolute time computed
 * once, up front, into a Float64Array — so there is no drift to accumulate
 * even in a ten-minute session, and a stage change lands exactly on a bar.
 *
 * The lookahead pump runs in an AudioWorklet, i.e. on the audio thread, so
 * scheduling survives a backgrounded tab. A timer-based pump exists only as
 * a fallback for browsers without AudioWorklet.
 */

const SMOOTH = x => x * x * (3 - 2 * x);

/* ------------------------------------------------------------------ *
 *  Session plan
 * ------------------------------------------------------------------ */

export function buildSession(level, totalCycles){
  const stages = [];
  let t = 0, beat = 0;

  // 'rest' on the final stage means "whatever is left of the chosen length"
  const fixed = level.stages.filter(s => s.cycles !== 'rest')
                            .reduce((a, s) => a + s.cycles, 0);
  for (const s of level.stages){
    const cycles = s.cycles === 'rest' ? Math.max(1, totalCycles - fixed) : s.cycles;
    const P = s.protocol;
    const beats = P.cycleBeats * cycles;
    stages.push({
      protocol: P, cycles, beats,
      t0: t, t1: t + P.cycleSec * cycles,
      beat0: beat
    });
    t += P.cycleSec * cycles;
    beat += beats;
  }

  // Absolute time of every beat, computed once.
  const beatTimes = new Float64Array(beat + 1);
  let i = 0;
  for (const s of stages){
    for (let b = 0; b < s.beats; b++) beatTimes[i++] = s.t0 + b * s.protocol.spb;
  }
  beatTimes[i] = t;

  return { level, stages, duration: t, totalBeats: beat, beatTimes };
}

/* ------------------------------------------------------------------ *
 *  Pure queries. Safe to call for any t, including the future — which
 *  is what The Long Shore needs in order to draw the breath you have
 *  not taken yet.
 * ------------------------------------------------------------------ */

export function stageAt(session, t){
  const S = session.stages;
  if (t <= 0) return S[0];
  for (let i = 0; i < S.length; i++) if (t < S[i].t1) return S[i];
  return S[S.length - 1];
}

/** 0 = fully exhaled, 1 = fully inhaled. Allocation-free: this is called
 *  once per pixel column, every frame. */
export function levelAt(session, t){
  if (t <= 0) return 0;
  if (t >= session.duration) return 0;
  const s = stageAt(session, t);
  const P = s.protocol;
  let b = ((t - s.t0) / P.spb) % P.cycleBeats;
  const ph = P.phases;
  for (let i = 0; i < ph.length; i++){
    const p = ph[i];
    if (b < p.beats){
      const q = b / p.beats;
      switch (p.k){
        case 'in':      return SMOOTH(q);
        case 'out':     return 1 - SMOOTH(q);
        case 'hold':    return 1;
        default:        return 0;         // holdout
      }
    }
    b -= p.beats;
  }
  return 0;
}

/** Full descriptive state. Allocates — for UI, not for per-pixel work. */
export function query(session, t){
  const clamped = Math.max(0, Math.min(t, session.duration));
  const s = stageAt(session, clamped);
  const P = s.protocol;
  const local = clamped - s.t0;
  const cycleInStage = Math.floor(local / P.cycleSec);
  let b = (local / P.spb) % P.cycleBeats;
  const beatsIn = b;
  let phase = P.phases[0], phaseProgress = 0, secondsLeft = 0;
  for (const p of P.phases){
    if (b < p.beats){
      phase = p; phaseProgress = b / p.beats;
      secondsLeft = (p.beats - b) * P.spb;
      break;
    }
    b -= p.beats;
  }
  return {
    stage: s, protocol: P, cycleInStage, beatsIn,
    phase: phase.k, phaseProgress, secondsLeft,
    level: levelAt(session, clamped),
    progress: clamped / session.duration,
    done: t >= session.duration,
    bar: Math.floor(beatsIn / P.beatsPerBar) + 1,
    cycleOverall: Math.floor(clamped / 1) // placeholder, not shown to users
  };
}

/* ------------------------------------------------------------------ *
 *  Transport
 * ------------------------------------------------------------------ */

const PUMP_SRC = `
class Pump extends AudioWorkletProcessor {
  constructor(){ super(); this.n = 0; }
  process(){
    // ~128 samples per call; every 4th call is roughly 12 ms
    if ((++this.n & 3) === 0) this.port.postMessage(currentTime);
    return true;
  }
}
registerProcessor('bor-pump', Pump);
`;

export class Transport {
  constructor(ctx){
    this.ctx = ctx;
    this.session = null;
    this.startTime = 0;       // ctx time of session t=0
    this.state = 'idle';      // idle | running | paused | ended
    this.pausedAt = 0;        // session time at which we paused
    this.nextBeat = 0;
    this.lookahead = 0.25;
    this.onBeat = null;       // (time, beatIndex, info) => void
    this.onEnd = null;
    this._pump = null;
    this._fallback = null;
  }

  async initPump(){
    if (this._pump || this._fallback) return;
    try {
      const url = URL.createObjectURL(new Blob([PUMP_SRC], {type:'application/javascript'}));
      await this.ctx.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);
      const node = new AudioWorkletNode(this.ctx, 'bor-pump');
      // A worklet only runs while connected. Route it into a silent gain
      // so it pumps without making a sound.
      const mute = this.ctx.createGain(); mute.gain.value = 0;
      node.connect(mute); mute.connect(this.ctx.destination);
      node.port.onmessage = () => this.tick();
      this._pump = node;
    } catch (e){
      console.warn('AudioWorklet unavailable, falling back to a timer pump', e);
      const loop = () => { this.tick(); this._fallback = setTimeout(loop, 25); };
      loop();
    }
  }

  get time(){
    if (this.state === 'running') return this.ctx.currentTime - this.startTime;
    if (this.state === 'paused')  return this.pausedAt;
    if (this.state === 'ended')   return this.session ? this.session.duration : 0;
    return 0;
  }

  async start(session){
    await this.initPump();
    this.session = session;
    this.nextBeat = 0;
    this.startTime = this.ctx.currentTime + 0.18;   // a beat of air before it begins
    this.state = 'running';
  }

  pause(){
    if (this.state !== 'running') return;
    this.pausedAt = this.time;
    this.state = 'paused';
  }

  resume(){
    if (this.state !== 'paused') return;
    this.startTime = this.ctx.currentTime - this.pausedAt;
    this.state = 'running';
    // re-point the scheduler at the first beat we have not played
    const bt = this.session.beatTimes;
    while (this.nextBeat < this.session.totalBeats && bt[this.nextBeat] < this.pausedAt) this.nextBeat++;
  }

  stop(){
    this.state = 'idle';
    this.session = null;
    this.nextBeat = 0;
  }

  tick(){
    if (this.state !== 'running' || !this.session) return;
    const S = this.session, bt = S.beatTimes;
    const horizon = this.time + this.lookahead;
    while (this.nextBeat < S.totalBeats && bt[this.nextBeat] <= horizon){
      const i = this.nextBeat;
      const when = this.startTime + bt[i];
      if (this.onBeat){
        const s = stageAt(S, bt[i] + 1e-6);
        const rel = i - s.beat0;
        this.onBeat(when, i, {
          stage: s,
          protocol: s.protocol,
          beatInCycle: rel % s.protocol.cycleBeats,
          bar: Math.floor((rel % s.protocol.cycleBeats) / s.protocol.beatsPerBar),
          barAbs: Math.floor(rel / s.protocol.beatsPerBar),
          cycle: Math.floor(rel / s.protocol.cycleBeats),
          level: levelAt(S, bt[i])
        });
      }
      this.nextBeat++;
    }
    if (this.time >= S.duration){
      this.state = 'ended';
      if (this.onEnd) this.onEnd();
    }
  }
}
