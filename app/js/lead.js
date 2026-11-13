/* The Book of Rates — THE READER LEADS.
 *
 * Design doc §1.7, 12 November 2026: "They set the rate, not us."
 *
 * Until this module, nothing in the book had ever looked at the reader's
 * timing. Every chapter read a finger as a POSITION in a band and chased
 * an app-owned schedule; there was no period tracker, no turning-point
 * detector, not so much as a previous sample. This is the missing half,
 * in two parts that are deliberately separate things:
 *
 *   leader()          measures. What rhythm is the reader actually
 *                     making, right now, with whatever they are doing?
 *   superstructure()  offers. A second rhythm that belongs to the WORLD,
 *                     coupled to the reader's so that it finds them, and
 *                     tuned a fraction slower so that falling in with it
 *                     is a slower breath.
 *
 * NO DOM, NO THREE, NO CLOCK OF ITS OWN: pure arithmetic stepped by the
 * caller's dt, so tools/lead.mjs can fly it in Node against traces with
 * known answers. This is the piece that can be wrong quietly, so it is
 * the piece with the harness.
 *
 * ------------------------------------------------------------------
 * WHY TURNING POINTS AND NOT A DERIVATIVE
 * ------------------------------------------------------------------
 * dx/dt on a finger is noise. A direction taken from it chatters at
 * every turn and — worse — at every moment the reader holds still,
 * which is exactly when a hold most needs to be read as a hold.
 *
 * So direction comes from HYSTERESIS: follow the running extremum, and
 * only call it a turn once the signal has come back from that extremum
 * by more than `hyst` of the band. A tremor smaller than that is not a
 * breath and never registers; a real reversal registers once, and it is
 * timestamped at the moment of the EXTREMUM rather than the moment it
 * was noticed, so the hysteresis costs latency and not accuracy.
 *
 * A period is the time between two turns OF THE SAME KIND. Top to top,
 * or bottom to bottom — never top to bottom, because a cycle with a
 * long rest at one end has two very different halves and each is half
 * of nothing in particular.
 *
 * AND RATES ARE SMOOTHED AS RATIOS. The running estimate is a one-pole
 * on log(period): going from eight seconds to four is the same size of
 * step as going from four to two, which is how it is heard and how
 * §3.3's cascade table already counts.
 */

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const clamp01 = x => clamp(x, 0, 1);
const smooth = x => x * x * (3 - 2 * x);
const TAU = Math.PI * 2;

/** Where "hurried" starts and where it is complete, as PERIODS in
 *  seconds. Eight seconds a cycle is 7.5 a minute — unremarkable, and
 *  nothing should simplify for it. Two seconds a cycle is thirty a
 *  minute, which is the author's own example taken literally: a
 *  4-4-4-4 figure that has become roughly a 0.5-0.5 one. */
export const CALM_PERIOD  = 8.0;
export const PANIC_PERIOD = 2.0;

/** 0 at CALM_PERIOD and slower, 1 at PANIC_PERIOD and faster, smooth
 *  between and measured in octaves. */
export function hasteOf(period){
  if(!(period > 0)) return 0;
  const x = Math.log(CALM_PERIOD / period) / Math.log(CALM_PERIOD / PANIC_PERIOD);
  return smooth(clamp01(x));
}

/**
 * The reader's own rhythm, measured from one scalar in 0..1.
 *
 * @param {object} o
 * @param {number} o.hyst    retrace, as a fraction of the band, that
 *                           makes a reversal a turn. 0.10 is about the
 *                           jitter of a hand at rest on glass.
 * @param {number} o.blend   how far each new period moves the estimate,
 *                           in the log domain. 0.5 settles in about
 *                           three cycles and cannot ring: it is a
 *                           one-pole, and a one-pole has no overshoot.
 * @param {number} o.tMin    periods outside these are not believed
 * @param {number} o.tMax    (a twitch, or somebody who put the phone down)
 */
export function leader({ hyst = 0.10, blend = 0.5, tMin = 0.35, tMax = 60 } = {}){
  let t = 0;
  let dir = 0;                 // +1 rising, -1 falling, 0 not yet known
  let ext = 0, extT = 0;       // the running extremum and when it happened
  let lo = 0, hi = 0, loT = 0, hiT = 0;   // before a direction exists
  let lastTop = null, lastBot = null;      // times of the last turn of each kind
  let topV = 1, botV = 0;      // values at them, for the phase
  let logT = null;             // the estimate, log seconds; null = no cycle seen yet
  let seedT = null;            // the guess before a cycle has completed
  let speed = 0;               // smoothed |dx/dt|, for the seed only
  let prev = null;
  let turns = 0;

  function take(period){
    if(period < tMin || period > tMax) return;
    const l = Math.log(period);
    logT = logT === null ? l : logT + (l - logT) * blend;
  }

  function turn(kind, when, value){
    turns++;
    if(kind > 0){ if(lastTop !== null) take(when - lastTop); lastTop = when; topV = value; }
    else        { if(lastBot !== null) take(when - lastBot); lastBot = when; botV = value; }
    /* BEFORE A WHOLE CYCLE EXISTS there is still one honest thing to
       say: the time between this turn and the opposite one before it
       is half of SOMETHING, and twice that is a better first guess than
       a default. It is never blended into the real estimate — see the
       note at the top on why halves are not halves. */
    if(logT === null && lastTop !== null && lastBot !== null){
      const half = Math.abs(lastTop - lastBot);
      if(half * 2 >= tMin && half * 2 <= tMax) seedT = half * 2;
    }
  }

  const api = {
    /** Feed one sample. `x` is the reader's scalar, 0..1. */
    step(dt, x){
      t += dt;
      if(prev === null){ prev = x; ext = lo = hi = x; extT = loT = hiT = t; return api; }
      const inst = Math.abs(x - prev) / Math.max(1e-4, dt);
      speed += (inst - speed) * (1 - Math.exp(-dt / 0.30));
      prev = x;

      if(dir === 0){
        /* no direction yet: watch both ways and take whichever leaves
           its extremum by a turn's worth first */
        if(x < lo){ lo = x; loT = t; }
        if(x > hi){ hi = x; hiT = t; }
        if(x - lo > hyst){ dir = +1; ext = x; extT = t; botV = lo; lastBot = loT; }
        else if(hi - x > hyst){ dir = -1; ext = x; extT = t; topV = hi; lastTop = hiT; }
      } else if(dir > 0){
        if(x >= ext){ ext = x; extT = t; }
        else if(ext - x > hyst){ turn(+1, extT, ext); dir = -1; ext = x; extT = t; }
      } else {
        if(x <= ext){ ext = x; extT = t; }
        else if(x - ext > hyst){ turn(-1, extT, ext); dir = +1; ext = x; extT = t; }
      }

      /* the seed from speed alone, for the first second of the first
         excursion: a reader who is crossing the band in 0.4 s is not
         breathing at 16. There and back at this speed. */
      if(logT === null && seedT === null && dir !== 0 && speed > 1e-3){
        api._speedSeed = clamp(2 / speed, tMin, tMax);
      }
      return api;
    },

    /** Seconds per cycle, or null if the reader has not yet done
     *  anything that could be called one.
     *
     *  IT SLOWS DOWN WHEN THEY DO, WITHOUT WAITING FOR THE NEXT TURN.
     *  If more time has passed since the last turn of a kind than the
     *  estimate itself, the cycle in progress is ALREADY longer than
     *  the estimate, and saying otherwise would be reporting a rate the
     *  reader has demonstrably left. So a reader who simply stops is
     *  read as slowing, continuously, from the first moment it is
     *  true — which is what lets the world settle with them. */
    get period(){
      let T = logT !== null ? Math.exp(logT)
            : seedT !== null ? seedT
            : (api._speedSeed !== undefined ? api._speedSeed : null);
      if(T === null) return null;
      const since = Math.min(
        lastTop !== null ? t - lastTop : Infinity,
        lastBot !== null ? t - lastBot : Infinity);
      if(since !== Infinity && since > T) T = Math.min(tMax, since);
      return T;
    },
    get rate(){ const T = api.period; return T ? 1 / T : null; },

    /** Has a whole cycle actually been measured, as against guessed? */
    get measured(){ return logT !== null; },

    /** 0..1 round the cycle: 0 at the bottom turn, 0.5 at the top.
     *  Taken from POSITION between the last two extremes, not from
     *  time, so a reader who pauses half way up is half way up. */
    get phase(){
      const span = Math.max(hyst, topV - botV);
      const u = clamp01(((prev === null ? 0 : prev) - botV) / span);
      if(dir >= 0) return 0.5 * u;
      return 0.5 + 0.5 * (1 - u);
    },

    get direction(){ return dir; },
    get haste(){ return hasteOf(api.period); },
    get turns(){ return turns; },
    get time(){ return t; },

    reset(){
      t = 0; dir = 0; prev = null; lastTop = lastBot = null; logT = seedT = null;
      speed = 0; turns = 0; topV = 1; botV = 0; delete api._speedSeed;
    }
  };
  return api;
}

/* ------------------------------------------------------------------
   THE SUPERSTRUCTURE
   ------------------------------------------------------------------
   The author's definition names its own failure mode: rates superimposed
   on smaller, more erratic structures "in order to normalise or
   stabilise them closer to a particular rhythm WITHOUT CAUSING THEM TO
   VANISH."

   That rules out the two obvious things. A low-pass on a hurried input
   deletes the hurry: the output is smooth and the reader's rhythm is
   gone. A quantiser snaps it into a grid, which is the same deletion
   with corners. Neither superimposes anything.

   What stabilises without erasing is COUPLING BETWEEN TWO OSCILLATORS.
   The reader is one. The world carries the other, with a frequency of
   its own, and the only connection between them is a pull on the
   world's phase towards the reader's:

       dphi/dt = f + K * f * sin(2 pi (phi_reader - phi))

   Every property the principle asks for is a textbook property of that
   line. Inside the locking range (detuning smaller than K) the world
   falls into step with the reader — it adapts to their rate. Outside
   it, it does not chase: a reader far from anything the world can
   follow is left alone rather than fought. And when it is locked it
   runs at the READER's frequency but a steady angle BEHIND them,
   asin(detune / K) — because its own preferred frequency is `detune`
   slower. That standing lag is the whole invitation: the swell arrives
   a fraction after you do, every time, and slowing by that fraction is
   what closes it.

   `detune` is §3.3's number. The cascade table there says a step in
   rate should be 6 to 11 percent and never more than about 12; this is
   the same step, offered continuously instead of in rungs.
   ------------------------------------------------------------------ */

/**
 * @param {object} o
 * @param {number} o.rest    the world's own period when nobody is leading
 * @param {number} o.detune  how much slower than the reader it would like to be
 * @param {number} o.K       coupling, as a fraction of frequency. The lock
 *                           range is |detuning| < K, so it must exceed
 *                           `detune` or the world can never find anyone.
 * @param {number} o.follow  how fast its preferred period moves towards
 *                           (reader's period / (1 - detune)), per second,
 *                           in the log domain
 * @param {number} o.tLo     it will not go faster than this,
 * @param {number} o.tHi     or slower than this
 */
export function superstructure({ rest = 16, detune = 0.08, K = 0.30,
                                 follow = 0.35, tLo = 1.6, tHi = 20 } = {}){
  if(!(K > detune)) throw new Error('superstructure: K must exceed detune or it can never lock');
  let phi = 0;                    // cycles
  let logT = Math.log(rest);      // its own preferred period
  let pull = 0;                   // the last coupling term, for inspection

  const api = {
    /**
     * @param {number} dt
     * @param {object|null} lead  a leader(), or null for nobody
     */
    step(dt, lead){
      const Tr = lead ? lead.period : null;
      const want = Tr ? clamp(Tr / (1 - detune), tLo, tHi) : rest;
      /* slower to come back to rest than to follow a reader: when they
         stop, the world should keep the rhythm they left it for a while */
      const k = Tr ? follow : follow * 0.12;
      logT += (Math.log(want) - logT) * (1 - Math.exp(-k * dt));
      const f = 1 / Math.exp(logT);
      pull = 0;
      if(Tr && lead.measured){
        /* couple ONLY to a rhythm that has actually been measured. A
           guess is good enough to set a tempo by; it is not good enough
           to pull a phase towards. */
        pull = K * f * Math.sin(TAU * (lead.phase - phi));
      }
      phi += (f + pull) * dt;
      phi -= Math.floor(phi);
      return api;
    },
    get phase(){ return phi; },
    get period(){ return Math.exp(logT); },
    /** 0..1 and back: a raised cosine, 0 at phase 0, 1 at phase 0.5 —
     *  the same convention as leader.phase, so "in step" means the two
     *  numbers agree. */
    get wave(){ return 0.5 - 0.5 * Math.cos(TAU * phi); },
    get sin(){ return Math.sin(TAU * phi); },
    get cos(){ return Math.cos(TAU * phi); },
    get pull(){ return pull; },
    reset(){ phi = 0; logT = Math.log(rest); pull = 0; }
  };
  return api;
}

/** Signed phase difference a - b, in cycles, wrapped to (-0.5, 0.5]. */
export function phaseGap(a, b){
  let d = a - b; d -= Math.round(d); return d;
}
