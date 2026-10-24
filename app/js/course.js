/* The Book of Rates — THE CORRIDOR, THE COURSE, AND THE BODY IN IT.
 *
 * Long Air invented four things that are not about kites:
 *
 *   1. A CORRIDOR. A band the schedule sweeps, sitting inside a wider
 *      band the body is clamped into, so the body has somewhere to
 *      overshoot into instead of hitting a hard stop — and so clipping
 *      through the world is unreachable by construction rather than
 *      unlikely.
 *   2. A RATE CAP DERIVED FROM THE PROTOCOL. The player's own breath is
 *      integrated from a control at exactly the protocol's own rates, so
 *      breathing twice as fast buys half the swing. Derived, never tuned,
 *      so it cannot drift away from the thing it is capping when a
 *      duration is edited.
 *   3. THE FILL / POSITION SPLIT. The control fills a scalar; the body
 *      springs towards it with mass. The lag is the whole reason the
 *      figure's own motion is legible separately from its travel — the
 *      sail fills before the kite lifts.
 *   4. A COURSE LAID ON THE SCHEDULE. Obstacles baked at build time whose
 *      opening, at the moment the body reaches them, is where the
 *      protocol wants the body to be. Flying it well and breathing on
 *      pace become the same act.
 *
 * None of that is kite-shaped, and the third chapter would have copied
 * all of it. So it lives here, with the chapter's own numbers passed in.
 * The travelled scalar has no name in this file on purpose: it is an
 * altitude in Long Air, a rain front's distance in Bamboo Rain and a
 * hull's height above the waterline in Lantern Current, and the
 * arithmetic does not care which.
 *
 * NO three.js and NO DOM, like breath.js and for the same reason: every
 * quantity here is a pure function, so tools/regress.mjs can fly a whole
 * session in node and check the claims instead of eyeballing a screenshot
 * through a throttled pane.
 *
 * ONE RULE ABOUT THE HARNESS, learned the hard way four times over. The
 * controller below is the REAL one — the page and tools/regress.mjs both
 * drive this object. The harness used to carry its own copy of the
 * integrate-spring-clamp loop, which meant the thing it proved and the
 * thing that shipped were two pieces of code that merely agreed today.
 */

import { clamp01 } from './breath.js';

export const clampTo = (x, a, b) => Math.min(b, Math.max(a, x));

/* ------------------------------------------------------------------
   The corridor
   ------------------------------------------------------------------ */

/** `lo`/`hi` are the hard walls the body is clamped into; `low`/`high`
 *  are the narrower band the SCHEDULE sweeps. They must be nested, and
 *  that is checked here rather than in a comment, because the whole
 *  guarantee — a figure that cannot clip the world — rests on the
 *  schedule never asking for a position outside the walls. */
export function corridor({ lo, hi, low, high }){
  if(!(lo < low && low < high && high < hi)){
    throw new Error('corridor(): need lo < low < high < hi, got ' +
                    [lo, low, high, hi].join(' < '));
  }
  const range = high - low;
  return {
    lo, hi, low, high, range,
    /** position -> 0..1 within the swept band */
    normOf: v => clamp01((v - low) / range),
    /** 0..1 -> position */
    atOf:   n => low + clamp01(n) * range,
    /** clamp to the hard walls */
    hold:   v => clampTo(v, lo, hi)
  };
}

/* ------------------------------------------------------------------
   The rate cap
   ------------------------------------------------------------------ */

/** How fast the control may fill and empty the scalar, as fractions of
 *  the swept band per second, taken from the protocol's own inhale and
 *  exhale durations.
 *
 *  SUMMED, not found. Long Air's version used `phases.find(k === 'in')`,
 *  which is right for a protocol with one inhale and wrong for a double
 *  nasal inhale — it would have taken the rate from the first sip alone
 *  and filled the scalar in a third of the time the cue asks for, which
 *  is a rate cap that does not cap. Summing is correct for both.
 *
 *  Holds and rests count towards neither, which is what makes them come
 *  out as stationary stretches with both controls off.
 */
export function ratesOf(proto){
  let din = 0, dout = 0;
  for(const p of proto.phases){
    if(p.k === 'in')  din  += p.d;
    if(p.k === 'out') dout += p.d;
  }
  if(!din || !dout){
    throw new Error('ratesOf(): protocol "' + (proto.id || '?') +
                    '" needs at least one in phase and one out phase');
  }
  return { fillPerSec: 1 / din, emptyPerSec: 1 / dout, din, dout };
}

/* ------------------------------------------------------------------
   The body: fill, position, and soft contact
   ------------------------------------------------------------------ */

/** The control integrates `fill`; `value` springs towards it with mass.
 *
 *  `k` is the spring constant and `zeta` the damping ratio. The lag
 *  behind a ramp of slope v is about 2v/sqrt(k), which is the number
 *  that actually matters: it has to be comfortably smaller than whatever
 *  opening the body has to fit through. Long Air found this out by
 *  shipping k=26, a 2.2 m lag and an on-pace player clipping lips.
 *
 *  `drive(dt, up, down)` takes the two controls. Both at once cancels,
 *  which is the honest reading of pressing both.
 *
 *  A chapter where the SCHEDULE drives the body rather than the player
 *  passes the current phase's kind to `follow()` instead. Same spring,
 *  same clamp, same lag — the only difference is who is holding the
 *  control, and a chapter with no control at all still wants a body with
 *  mass.
 */
/** `vMax` caps how fast the body may travel, in its own units a second.
 *
 *  Optional, and Long Air is why it exists. Its avoidance pushes a
 *  figure away from a surface it is near, which is exactly right for a
 *  reader drifting towards a lip and much too strong for one who is not
 *  breathing at all: that reader sits at the bottom of the corridor
 *  while the schedule sweeps the whole of it, so they are ALWAYS
 *  against a lip and always being herded. Measured on the page, the
 *  kite reached 27.5 m/s. Being gathered back towards the opening is
 *  the right behaviour; being snapped there is not.
 *
 *  A chapter should derive the cap from its own schedule — the figure
 *  has no reason to move faster than the breath could ever ask it to,
 *  with some margin for the spring's lead-in — rather than pick a
 *  number that looks calm.
 */
export function body({ corridor: C, rates, k = 64.0, zeta = 0.9, fill = 0, vMax = Infinity }){
  const damp = 2.0 * Math.sqrt(k) * zeta;
  const b = {
    fill: 0, value: 0, v: 0,

    /* THE SPRING'S OWN NUMBERS, exposed rather than hidden, because the
       lag they produce is the quantity a chapter actually has to reason
       about: it has to be comfortably smaller than whatever opening the
       body must fit through, and a harness checking "does the body track
       the schedule" needs to know how much error the mass alone
       explains. Guessing a tolerance instead is how a check becomes a
       magic number nobody can defend. */
    k, damp, zeta,
    /** Steady-state lag behind a ramp of the given slope, in the
     *  chapter's own units per second.
     *
     *  2·zeta·v/sqrt(k), not 2·v/sqrt(k). The damping ratio is in there
     *  and leaving it out silently assumed critical damping — which was
     *  within 10% while every chapter used the default 0.9, and stopped
     *  being within anything once a chapter wanted an underdamped front
     *  that deliberately overshoots. A harness deriving its tolerance
     *  from this needs it to be the real formula. */
    lag: slope => 2 * zeta * Math.abs(slope) / Math.sqrt(k),

    reset(f = fill){ b.fill = clamp01(f); b.value = C.atOf(b.fill); b.v = 0; return b; },

    /** integrate the control, then spring, then clamp. In that order. */
    drive(dt, up, down){
      if(up && !down)      b.fill = Math.min(1, b.fill + rates.fillPerSec * dt);
      else if(down && !up) b.fill = Math.max(0, b.fill - rates.emptyPerSec * dt);
      return b.settle(dt);
    },

    /** the same, driven by a phase kind instead of a pair of controls */
    follow(dt, kind){ return b.drive(dt, kind === 'in', kind === 'out'); },

    settle(dt){
      const want = C.atOf(b.fill);
      b.v += ((want - b.value) * k - b.v * damp) * dt;
      if(b.v >  vMax) b.v =  vMax;
      if(b.v < -vMax) b.v = -vMax;
      b.value += b.v * dt;
      if(b.value < C.lo){ b.value = C.lo; b.v = Math.max(0, b.v); }
      if(b.value > C.hi){ b.value = C.hi; b.v = Math.min(0, b.v); }
      return b;
    },

    /** SOFT CONTACT. §6.1 decided this before anybody built it: the world
     *  yields rather than the figure crashing, and contact that happens
     *  anyway is a push back towards the opening. Never a stop, never a
     *  bounce, never counted. Returns how far past the lip the body was,
     *  in the chapter's own units, so the caller can throw a little grit
     *  — and 0 when there was no contact at all. */
    touch({ centre, half, bodyHalf = 0, dt, push = 26, kick = 9 }){
      const off = b.value - centre;
      const over = Math.abs(off) - (half - bodyHalf);
      if(over <= 0) return 0;
      const s = Math.sign(off);
      b.value -= s * Math.min(over, push * dt);
      b.v     += -s * kick * dt;
      return over;
    },

    /** THE FIGURE STEERS AWAY FROM A SURFACE BY ITSELF.
     *
     *  This is what makes crashing unreachable, and it is a TENDENCY
     *  rather than a rule: inside `margin` of a lip the body takes an
     *  acceleration away from it, growing as it gets closer, so it
     *  bends off before it ever arrives. Nothing is forbidden and
     *  nothing is corrected after the fact — it simply does not go
     *  there, which is what "it naturally moves in a direction that
     *  avoids it" means.
     *
     *  Returns 0..1, how hard it is avoiding, for a chapter that wants
     *  to show the figure leaning away.
     */
    avoid({ centre, half, bodyHalf = 0, dt, margin = 3.0, strength = 26 }){
      const off = b.value - centre;
      const room = (half - bodyHalf) - Math.abs(off);   // distance to the lip
      if(room >= margin) return 0;
      const near = clamp01(1 - Math.max(0, room) / margin);
      b.v -= Math.sign(off || 1) * near * near * strength * dt;
      if(b.v >  vMax) b.v =  vMax;
      if(b.v < -vMax) b.v = -vMax;
      return near;
    },

    /** SKIMMING, which replaces touch() in Long Air.
     *
     *  Past the lip the body RIDES THE SURFACE: it is placed exactly on
     *  it and any velocity into it is removed, so it travels along
     *  rather than through. No push back towards the opening and no
     *  kick — those two were what made contact a vibration rather than
     *  a graze, and a figure held against a lip was being shoved,
     *  kicked and shoved again at twenty-five metres a second.
     *
     *  What contact costs is not position. It is forward speed, and
     *  that is drag()'s job, not this one's.
     *
     *  Returns how far past the lip it would have been, so a chapter
     *  can throw a little grit, and 0 when it is clear.
     */
    skim({ centre, half, bodyHalf = 0 }){
      const off = b.value - centre;
      const lip = half - bodyHalf;
      const over = Math.abs(off) - lip;
      if(over <= 0) return 0;
      const s = Math.sign(off || 1);
      b.value = centre + s * lip;              // placed ON the surface
      if(s * b.v > 0) b.v = 0;                 // no velocity into it
      return over;
    }
  };
  return b.reset();
}

/* ------------------------------------------------------------------
   SKIM AND DRAG — contact costs speed, and breath is what returns it
   ------------------------------------------------------------------
   The soft push-back this replaces was the wrong shape. It treated
   contact as a correction applied TO the figure: the world shoved it
   back towards the opening and added a velocity kick, so a figure held
   against a lip got shoved, kicked, shoved again, and the result was a
   figure vibrating against a surface at twenty-five metres a second
   with the whole grit pool saturated. That is not "it cannot crash", it
   is "it cannot crash, visibly and continuously".

   The model here is the one the author described, and it has exactly
   two forces in it:

     THE FIGURE'S OWN DIRECTION. It steers away from a surface it is
       near, by itself, before contact. That is what makes crashing
       unreachable — not a rule that forbids it, a tendency that avoids
       it. See body.avoid().
     FRICTION WITH THE SURFACE. Contact is a SKIM: the figure rides
       along the surface, loses no height authority and takes no kick,
       and what it loses is FORWARD SPEED. Breath is the only thing that
       takes the friction off again.

   GRAVITY IS NOT IN HERE AT ALL, deliberately and by instruction. There
   is no falling term, no weight, no lift. A reader who stops breathing
   does not sink; they slow down. The whole interplay is those two
   forces and nothing else, and adding a third "for realism" would be
   adding a way to lose to a chapter that does not have one.

   NOTHING HERE IS COUNTED. drag is a physical state, not a score: it
   has no history, no best, no total, and it is gone the moment the
   reader breathes.
   ------------------------------------------------------------------ */

/** @param maxLoss  the most speed friction can take, as a fraction
 *  @param gain     drag gained per second of continuous skimming
 *  @param clear    drag removed per second of breathing on the cue */
export function drag({ maxLoss = 0.55, gain = 1.4, clear = 0.9 } = {}){
  const d = {
    value: 0,

    reset(){ d.value = 0; return d; },

    /** riding along a surface */
    skim(dt){ d.value = Math.min(1, d.value + gain * dt); return d; },

    /** THE RECOVERY, and the only one. `working` is true when the
     *  reader is doing what the cue asks — filling on an inhale,
     *  emptying on an exhale, holding still on a hold. Nothing else
     *  clears drag: there is no passive decay, because "the breath is
     *  what removes the friction" means the breath and not time. */
    breathe(dt, working){
      if(working) d.value = Math.max(0, d.value - clear * dt);
      return d;
    },

    /** multiply the nominal speed by this */
    get speedFactor(){ return 1 - maxLoss * d.value; },

    /** how long, in seconds, from fully stuck to fully clear if the
     *  reader breathes on the cue throughout. Derived, so a harness can
     *  state the recovery guarantee in seconds rather than assert it. */
    get recoverySeconds(){ return 1 / clear; },
    maxLoss, gain, clear
  };
  return d;
}

/* ------------------------------------------------------------------
   Forgiveness
   ------------------------------------------------------------------ */

/** How far off pace the body is, 0 (on it) to 1 (hopeless), and the
 *  extra opening that earns. Quantised into steps so the world does not
 *  breathe in and out continuously with every wobble — it should feel
 *  like the world making room, not like rubber.
 *
 *  `target` is the centre of the obstacle the body is ABOUT TO REACH,
 *  not the schedule right now. Those differ during a turnaround by
 *  enough to matter: measured against the instantaneous schedule it
 *  opened the wrong gate by the wrong amount, and Long Air's kite went
 *  1.47 m past a lip the numbers said was wide open.
 */
export function forgiveness({ value, target, range, max, span = 0.55, steps = 4 }){
  const err = Math.abs(value - target) / range;
  const stepped = Math.floor(clamp01(err / span) * steps) / (steps - 1);
  return { err: clamp01(err), extra: Math.min(1, stepped) * max };
}

/* ------------------------------------------------------------------
   The course
   ------------------------------------------------------------------
   Baked once per protocol, scrolled for ever by a modulo in a vertex
   shader: one draw call, no streaming, no seam.

   THE ARITHMETIC THAT MAKES IT PREDICTIVE. A thing built at z = zb shows
   up at world z = behind·P − mod(zb − dist, P), so its distance ahead is
   d = mod(zb − speed·t, P) − behind·P and the body reaches it in
   d/speed seconds. Because the schedule is periodic and P is a whole
   number of its cycles, that arrival TIME collapses to
   zb/speed − behind·P/speed — a function of zb alone, with t cancelled.
   So the whole course can be baked at build time and is still exactly
   the schedule laid out in space.

   Everything else in the strip must be periodic in P too, or the wrap
   leaves a step. The breath-derived parts are periodic for free; the
   decorative ones are not, and have to be built from harmonics of P.
   ------------------------------------------------------------------ */

/** The strip's length in metres. `cycles` is how many breath cycles long
 *  it is — more than one, so the SCENERY does not repeat every breath
 *  even though the obstacles, correctly, do. */
export const periodOf = ({ speed, cycle, cycles }) => speed * cycle * cycles;

/** Obstacles roughly every `spacing` seconds of schedule, rounded so a
 *  whole number fits in a cycle. A fraction of a gate per cycle would
 *  break the strip's periodicity and put the course out of step with the
 *  breath — which still looks completely fine, which is why it is
 *  arithmetic here and a check in the harness. */
export const gatesPerCycle = ({ cycle, spacing }) => Math.round(cycle / spacing);

/** Build the obstacle list. `schedule(t)` is the protocol's own curve —
 *  pass `breath(proto).value`. */
export function courseOf({ proto, schedule, speed, stripCycles, behind, half, spacing }){
  const period = periodOf({ speed, cycle: proto.cycle, cycles: stripCycles });
  const back = period * behind;
  const perCycle = gatesPerCycle({ cycle: proto.cycle, spacing });
  const n = perCycle * stripCycles;
  const dz = period / n;
  const gates = [];
  for(let i = 0; i < n; i++){
    const zb = i * dz;
    const ta = zb / speed - back / speed;      // see the derivation above
    gates.push({ i, zb, ta, centre: schedule(ta), half });
  }
  return { period, back, dz, perCycle, speed, behind, gates };
}

/** Which obstacle is nearest the body right now, given distance
 *  travelled. The inverse of the layout above, so the collision test and
 *  the drawn geometry cannot disagree about where a gate is. */
export function gateAt(course, dist){
  const { period, back, dz, gates } = course;
  const zb = ((dist + back) % period + period) % period;
  const i = Math.round(zb / dz) % gates.length;
  const g = gates[i];
  // signed distance from the body to that gate's plane, +ve = still ahead
  let ahead = g.zb - zb;
  if(ahead >  period / 2) ahead -= period;
  if(ahead < -period / 2) ahead += period;
  return { gate: g, ahead };
}
