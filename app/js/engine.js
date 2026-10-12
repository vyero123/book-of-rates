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

/** Build a session from a ladder of rungs: [{ protocol, cycles | 'rest' }].
 *  Each rung may have its own tempo and its own beat count, so a cascade
 *  is just a session whose rungs differ. Stage changes always land on a
 *  breath boundary, which is a whole number of beats, which keeps the
 *  music locked across the change. */
export function buildSession(rungs, totalCycles){
  if (rungs && rungs.stages) rungs = rungs.stages;      // tolerate a level object
  const stages = [];
  let t = 0, beat = 0;

  // 'rest' on the final stage means "whatever is left of the chosen length"
  const fixed = rungs.filter(s => s.cycles !== 'rest')
                     .reduce((a, s) => a + s.cycles, 0);
  for (const s of rungs){
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

  return { stages, duration: t, totalBeats: beat, beatTimes };
}

/** The rate ladder, for drawing and for debugging a cascade. */
export function rateTrack(session){
  return session.stages.map(s => ({
    t0: s.t0, t1: s.t1,
    beats: s.protocol.cycleBeats,
    bpm: s.protocol.bpm,
    rate: s.protocol.breathsPerMin,
    cycles: s.cycles
  }));
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
  /* THE BREATH CLOCK MUST NEVER BE ABLE TO FREEZE.
   *
   * This used to read `ctx.currentTime - startTime` and nothing else. On
   * iOS an AudioContext starts suspended, and WebKit also has an
   * 'interrupted' state that is neither running nor suspended. In either
   * case currentTime stops advancing — and because requestAnimationFrame
   * keeps running, the scene draws perfectly while the breath sits at zero
   * forever. That is a permanent inhale, and it is the worst failure this
   * app can have: a breathing app that stops breathing.
   *
   * So the session clock prefers the audio clock (it is the one that keeps
   * music and breath locked) but watches it, and switches to
   * performance.now() without a seam the moment it stops advancing.
   *
   * Audio scheduling is handled separately: note times are computed as a
   * LEAD from ctx.currentTime, so they stay correct in either mode.
   */
  constructor(ctx){
    this.ctx = ctx;
    this.session = null;
    this.startTime = 0;
    this.state = 'idle';
    this.pausedAt = 0;
    this.nextBeat = 0;
    this.lookahead = 0.25;
    this.onBeat = null;
    this.onEnd = null;
    this.onClockFallback = null;
    this._pump = null;
    this._safety = null;
    this._useAudio = true;
    this._lastPerf = null;
    this._lastAudio = 0;
    this._lastValue = 0;
    this._perfBase = 0;
    this._perfStart = 0;
    this._wdValue = null;
    this._wdAt = 0;
  }

  /** Monotonic session clock, in seconds. Never stalls. */
  _now(){
    const perf = performance.now() / 1000;
    if (this._useAudio && this.ctx){
      const a = this.ctx.currentTime;
      if (this._lastPerf !== null){
        const dp = perf - this._lastPerf;
        const da = a - this._lastAudio;
        if (dp > 0.8 && da < 0.05) this._toPerfClock(perf, 'audio clock stopped');
      }
      if (this._useAudio){
        this._lastPerf = perf; this._lastAudio = a; this._lastValue = a;
        return a;
      }
    }
    const v = this._perfStart + (perf - this._perfBase);
    this._lastValue = v;
    return v;
  }

  _toPerfClock(perf, why){
    if (!this._useAudio) return;
    this._useAudio = false;
    this._perfBase = perf;
    this._perfStart = this._lastValue;   // continue from where we were
    if (this.onClockFallback) this.onClockFallback(why);
  }

  get time(){
    if (this.state === 'running') return this._now() - this.startTime;
    if (this.state === 'paused')  return this.pausedAt;
    if (this.state === 'ended')   return this.session ? this.session.duration : 0;
    return 0;
  }

  async initPump(){
    // The worklet pump is precise and survives a backgrounded tab, but it
    // only runs if the audio thread is running. A timer pump ALWAYS runs
    // as well: tick() is idempotent, so two pumps are harmless, and one
    // of them failing can no longer stop the session.
    if (!this._safety){
      const loop = () => { try { this.tick(); } catch(e){} this._safety = setTimeout(loop, 40); };
      loop();
    }
    if (this._pump) return;
    try {
      const url = URL.createObjectURL(new Blob([PUMP_SRC], {type:'application/javascript'}));
      await Promise.race([
        this.ctx.audioWorklet.addModule(url),
        new Promise((_, rej) => setTimeout(() => rej(new Error('worklet timeout')), 1200))
      ]);
      URL.revokeObjectURL(url);
      const node = new AudioWorkletNode(this.ctx, 'bor-pump');
      const mute = this.ctx.createGain(); mute.gain.value = 0;
      node.connect(mute); mute.connect(this.ctx.destination);
      node.port.onmessage = () => this.tick();
      this._pump = node;
    } catch (e){
      // not fatal: the safety timer is already pumping
    }
  }

  async start(session){
    // Resume inside the gesture that reached here, and wait for it — but
    // never let failure stop the session starting.
    if (this.ctx && this.ctx.state !== 'running'){
      try { await this.ctx.resume(); } catch(e){}
    }
    if (!this.ctx || this.ctx.state !== 'running'){
      this._toPerfClock(performance.now()/1000, 'context not running at start');
    }
    await this.initPump();
    this.session = session;
    this.nextBeat = 0;
    this._lastPerf = null;
    this.startTime = this._now() + 0.18;
    this._wdValue = null;
    this.state = 'running';
  }

  pause(){
    if (this.state !== 'running') return;
    this.pausedAt = this.time;
    this.state = 'paused';
  }

  resume(){
    if (this.state !== 'paused') return;
    this._lastPerf = null;
    this.startTime = this._now() - this.pausedAt;
    this.state = 'running';
    this._wdValue = null;
    const bt = this.session.beatTimes;
    while (this.nextBeat < this.session.totalBeats && bt[this.nextBeat] < this.pausedAt) this.nextBeat++;
  }

  stop(){
    this.state = 'idle';
    this.session = null;
    this.nextBeat = 0;
    if (this._safety){ clearTimeout(this._safety); this._safety = null; }
  }

  /** Has the breath actually moved lately? If not, say so and recover. */
  _watchdog(now, t){
    if (this._wdValue === null){ this._wdValue = t; this._wdAt = now; return; }
    if (Math.abs(t - this._wdValue) > 0.05){ this._wdValue = t; this._wdAt = now; return; }
    if (now - this._wdAt > 2){
      this._toPerfClock(now, 'breath stalled for 2s');
      this._wdValue = null;
      this._wdAt = now;
    }
  }

  tick(){
    if (this.state !== 'running' || !this.session) return;
    const S = this.session, bt = S.beatTimes;
    const sessionTime = this.time;
    this._watchdog(performance.now()/1000, sessionTime);
    const horizon = sessionTime + this.lookahead;
    while (this.nextBeat < S.totalBeats && bt[this.nextBeat] <= horizon){
      const i = this.nextBeat;
      // Lead time from now, mapped onto the AUDIO clock. When the session
      // is on the audio clock this is identical to startTime + bt[i]; when
      // it has fallen back to performance.now() it still schedules notes
      // correctly relative to the audio context.
      const lead = Math.max(0, bt[i] - sessionTime);
      const when = (this.ctx ? this.ctx.currentTime : 0) + lead;
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
