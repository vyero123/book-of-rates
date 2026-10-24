/* The Book of Rates — THE BREATH-PROTOCOL ENGINE.
 *
 * This is the first and most important piece of the 3-D kit, and the
 * reason it exists is a specific thing that worked in Deep Light: two
 * protocols — box breathing with two holds, and the doc's original
 * no-holds version — drove ONE scene with no special-casing anywhere in
 * the render loop.
 *
 * The trick is that a phase is not just a duration and a label. Each
 * phase descriptor carries everything the scene needs to know about what
 * happens during it:
 *
 *     k      a short kind tag: 'in' | 'out' | 'hold' | 'rest' | ...
 *     d      duration in seconds
 *     label  the big cue word ("breathe in")
 *     sub    the small line under it ("at the surface")
 *     count  if present, the sub line becomes "<count> N" and counts DOWN
 *            towards the next phase instead of showing the sub. Design doc
 *            §2.4: a countdown may point towards air, never at elapsed time.
 *     from   the figure's height (or any one travelled scalar) at phase start
 *     to     ... and at phase end
 *     ease   the curve between them. Defaults to smoothstep.
 *     scalar p => 0..1, the phase's own expressive curve. In Deep Light this
 *            was the grasp: one number driving both the hands closing and
 *            the pearl's position, so they could not disagree.
 *
 * Anything else on the descriptor is passed through untouched, so a
 * chapter can hang its own fields there — `cam`, `aim`, `bubbles` in Deep
 * Light; `tuck`, `lean` in Cliff Run. The engine never looks at them.
 *
 * That is the whole abstraction. A scene reads height from `value(t)`,
 * its one expressive scalar from `scalar(t)`, its camera treatment from
 * `at(t).p.cam`, and its cue from `cue(t)` — and a second protocol with a
 * different number of phases in a different order needs no new branches.
 *
 * NO dependency on three.js and no DOM, deliberately: it is pure arithmetic,
 * so tools/regress.mjs can sample the whole session in Node and diff it
 * against the frozen pre-kit baseline.
 */

export const clamp01 = x => Math.min(1, Math.max(0, x));
export const smooth  = x => x*x*(3-2*x);

/** smoothstep with the input biased first: `bias(0.8)` leaves fast and
 *  settles slowly, which is what a body dropping through a surface does. */
export const bias = e => x => smooth(Math.pow(x, e));

/** The Deep Light descent curve, kept by name because two chapters want it. */
export const drop = bias(0.80);

export const linear = x => x;

/** A ramp that holds, then moves, then holds — for a phase where the thing
 *  should be still at both ends and only travel in the middle. */
export const hold = (a, b) => x => smooth(clamp01((x - a) / Math.max(1e-6, b - a)));

/* ------------------------------------------------------------------
   A protocol
   ------------------------------------------------------------------ */

/** Normalise a protocol literal. Defaults are filled in here rather than
 *  at the call sites so a phase descriptor can stay as short as its own
 *  meaning requires. `cycle` and `session` are derived, never written by
 *  hand: a phase duration edited without the cycle length following it is
 *  a whole class of bug this removes. */
export function protocol({ id, name, cycles, phases }){
  const list = phases.map(p => ({
    ease: smooth,
    scalar: () => 0,
    ...p
  }));
  const cycle = list.reduce((a, q) => a + q.d, 0);
  return { id, name, cycles, phases: list, cycle, session: cycle * cycles };
}

/* ------------------------------------------------------------------
   The engine
   ------------------------------------------------------------------ */

/** A live reading head over a protocol.
 *
 *  It is MUTABLE on purpose: `use()` re-points it in place, so a render
 *  loop that closed over it at startup keeps working when the reader
 *  picks the other protocol from the gate. The alternative — handing the
 *  loop a new object — means every closure in the scene has to be rebuilt,
 *  and in a file this size that is how a stale reference survives.
 */
export function breath(proto){
  const b = {
    proto: null, cycle: 0, session: 0,

    use(p){
      // A raw protocol literal that has not been through protocol() has
      // no defaulted `ease` or `scalar`, and the first thing that
      // happens is `s.p.ease is not a function` from inside value() —
      // three frames deep, with nothing in the message about the real
      // mistake. Say it here instead.
      if(!p || !p.phases) throw new Error('breath(): not a protocol');
      if(p.cycle === undefined || typeof p.phases[0].ease !== 'function'){
        throw new Error('breath(): protocol "' + (p.id || '?') +
          '" has not been through protocol() — pass protocol({...}), not a bare literal');
      }
      b.proto = p; b.cycle = p.cycle; b.session = p.session; return b;
    },

    /** Where in the cycle are we. Returns the phase descriptor, the
     *  progress through it (0..1), the seconds left in it, and its index.
     *  The trailing fallback is not dead code: a protocol whose durations
     *  do not sum to `cycle` exactly — a float that rounds the wrong way —
     *  would otherwise fall off the end of the loop and return undefined. */
    at(t){
      let u = t % b.cycle; if(u < 0) u += b.cycle;
      const ph = b.proto.phases;
      for(let i = 0; i < ph.length; i++){
        if(u < ph[i].d) return { p: ph[i], pr: u / ph[i].d, left: ph[i].d - u, i };
        u -= ph[i].d;
      }
      return { p: ph[ph.length-1], pr: 1, left: 0, i: ph.length-1 };
    },

    /** The travelled scalar — height, altitude, depth, whatever the
     *  chapter anchors per phase. */
    value(t){
      const s = b.at(t);
      return s.p.from + (s.p.to - s.p.from) * s.p.ease(s.pr);
    },

    /** The phase's own expressive curve, clamped. */
    scalar(t){ const s = b.at(t); return clamp01(s.p.scalar(s.pr)); },

    /** Signed travel for the current phase: negative descending, positive
     *  rising, zero stationary. Scenes use this to decide whether the
     *  figure is working or idling without caring which phase it is in. */
    travel(t){ const p = b.at(t).p; return p.to - p.from; },

    /** The two cue lines. §2.4: when a phase carries `count`, the small
     *  line counts down towards the NEXT phase and never shows elapsed
     *  time. Math.max(1, ...) so it never reads "in 0". */
    cue(t){
      const s = b.at(t), p = s.p;
      return {
        label: p.label,
        sub: p.count ? (p.count + ' ' + Math.max(1, Math.ceil(s.left))) : p.sub
      };
    },

    /** Session progress, 0..1, for the thin bar. Clamped: the loop keeps
     *  running past the end of the session rather than stopping dead. */
    progress(t){ return clamp01(t / b.session); }
  };
  return b.use(proto);
}
