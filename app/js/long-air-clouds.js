/* Long Air — THE CLOUDS, AS A SPARSE FIELD.
 *
 * 6 November 2026. The reader: the band should be wider and more
 * sparse, fluffy, dynamic and unpredictable — more cloud-like. And
 * the counterweight, which matters as much: the clouds should not
 * overwhelm the experience, they just happen to be clouds on an
 * otherwise sunny and beautiful day.
 *
 * WHAT WAS THERE. One bank per gate, every gate, at the gate's own
 * upper lip: a regular corrugation at the breath's own rhythm. It
 * could be made lumpier and whiter — it was — but it could never be
 * sparse, because it was the same object as the gate's upper lip.
 * Appearance and mechanic were one thing and the mechanic is regular
 * by construction.
 *
 * THE ARCHITECTURAL DECISION, since the brief asked for it to be
 * settled and stated: THE MECHANIC FOLLOWS THE APPEARANCE. The gates
 * lose their upper half entirely — there is no drawn ceiling and no
 * invisible one either — and the buoyancy exists only where a cloud
 * actually is. Where there is no cloud there is nothing above you at
 * all, which is the honest reading of "no hard upper boundary" and is
 * what makes the sky read as open. The alternative, keeping a regular
 * invisible ceiling under irregular visible clouds, would have the
 * world pushing back at nothing, which is worse than either.
 *
 * HOW THE INVARIANT SURVIVES. On-pace play must never NEED to enter a
 * cloud. Every cloud's underside is derived from the SCHEDULE at its
 * own position — the altitude the course wants a reader to be at
 * there — plus the gate's own half-opening plus a clearance. So a
 * reader following the cue passes under every cloud with the same
 * margin the opening gives them, by construction rather than by
 * measurement, and tools/regress.mjs checks it anyway. A reader who
 * is high while the schedule is low is above the clouds there, which
 * is how entering one stays possible and stays a choice.
 *
 * SPARSE IN z, IRREGULAR IN EVERYTHING ELSE. Clouds sit in evenly
 * sized slots along the strip and are jittered within them, which
 * keeps the strip exactly periodic — a requirement, or the world
 * jolts once a lap — while making the spacing irregular. Extent,
 * lateral offset, depth, puffiness, billow rate and phase are all
 * hashed per instance.
 *
 * HOW LONG BEFORE A READER COULD NOTICE A REPEAT. The strip is 672 m
 * and the course runs at 14 m/s, so the LAYOUT comes round every 48
 * seconds — three times in a box session. That is unavoidable: the
 * strip is what makes an endless world one draw call. What is not
 * unavoidable is that the same cloud looks the same, and it does not:
 * the billow runs on the wall clock, not on the strip, so a cloud met
 * at 48 s and again at 96 s is at a different point in its own
 * evolution with a period that shares no factor with the lap. The
 * layout recurs; the picture does not.
 *
 * No three.js and no DOM: numbers only, so both samplers drive this
 * and not a replica of it.
 */

import { GATE_HALF, MAG_V, ceilAt } from './long-air-breath.js';

/* ------------------------------------------------------------------
   THE FIELD
   ------------------------------------------------------------------ */

/** How many clouds over one strip. 34 across 672 m is one every 20 m
 *  of slot, jittered — but each is only 24 to 80 m wide and most are
 *  off to one side, so the sky over the lane is mostly open. This is
 *  the number to turn DOWN if they ever start to overwhelm; it is the
 *  only one that changes how much sky is covered. */
/* 16, DOWN FROM 34, AND THE NUMBER THAT SETTLED IT IS MEASURED. The
   sampler reports what fraction of the strip has a cloud somewhere
   over the lane, which is the only honest reading of "sparse", and at
   34 it was 14% OPEN — the reverse of what the reader asked for, and
   invisible from the code, where 34 clouds over 672 m sounds thin.
   Each cloud covers its own width plus the force's reach, so they
   were overlapping nearly three deep. */
export const CLOUD_N = 16;

/** How far above the schedule a cloud's underside sits, before the
 *  per-cloud variation. GATE_HALF is the opening the reader is given
 *  at every gate, so clearing the cloud by at least that much is the
 *  same promise the course already makes; the extra is what keeps it
 *  a promise rather than a coincidence when a cloud billows down. */
export const CLOUD_CLEAR = 5.0 * MAG_V;

/** The most a cloud's underside can billow DOWNWARD from where it was
 *  built. The buoyancy is computed from base minus this, so the force
 *  boundary is the lowest the cloud ever reaches rather than where it
 *  happens to be this frame — the mechanic cannot be ahead of the
 *  picture, which is the fault cloudBaseOffset() was added to fix. */
export const CLOUD_BILLOW = 1.6 * MAG_V;

/** Columns across one cloud. The silhouette is the whole point and
 *  the pixel bar is what decides this; tools/continuity.mjs projects
 *  it. 61 across a cloud 24 to 80 m wide is 0.4 to 1.3 m a column. */
/* 65, UP FROM 45. The silhouette is the whole point and it measured
   2.84 px against a 2 px bar; sagitta goes as the square of the
   column spacing, so this takes it to about 1.3. The reader has said
   not to be stingy. */
export const CLOUD_COLS = 81;

/** The z-stations a cloud is swept through, as a fraction of its
 *  lateral scale. Zero at both ends so the body CLOSES rather than
 *  being a cross-section hanging in the air — a cloud seen from
 *  beside the lane has to have a front and a back. Five is the
 *  fewest that gives a rounded body instead of a lozenge. */
export const CLOUD_STATIONS = [0.0, 0.60, 1.0, 0.60, 0.0];
/** How deep in z, as a fraction of the cloud's own half-width. */
export const CLOUD_Z_FRAC = 0.55;

const h01 = (i, k) => (((i * k) % 9973) / 9973);

/** The schedule's altitude at a point on the strip, read off the
 *  course the chapter actually flies rather than re-derived from the
 *  breath. courseOf() lays a gate every SPACING seconds and each
 *  gate's centre IS the altitude wanted there, so this interpolates
 *  between the two nearest — one definition of where the reader is
 *  meant to be, shared by the gates and the clouds. */
export function scheduleAt(course, zb){
  const { period, dz, gates } = course;
  const z = ((zb % period) + period) % period;
  const f = z / dz;
  const i = Math.floor(f) % gates.length;
  const j = (i + 1) % gates.length;
  const t = f - Math.floor(f);
  return gates[i].centre * (1 - t) + gates[j].centre * t;
}

/** Build the field for one course. Deterministic: no Math.random
 *  anywhere, so the samplers measure the clouds the page draws. */
export function cloudsFor(course){
  const period = course.period;
  const slot = period / CLOUD_N;
  const out = [];
  for(let i = 0; i < CLOUD_N; i++){
    /* jittered inside its own slot, so the spacing is irregular and
       the strip stays exactly periodic. Both matter: without the
       jitter the clouds are a comb at the slot rate, and without the
       slot they would not close at the wrap. */
    const zb = (i + 0.5 + (h01(i, 7919) - 0.5) * 0.8) * slot;
    const halfW = 12 + h01(i, 6367) * 28;
    /* most of them are off the lane. The reader flies at x = 0, so a
       cloud centred at 40 m with a 20 m half-width is scenery they
       pass beside rather than weather they go through. */
    const x = (h01(i, 5281) - 0.5) * 300;
    const base = scheduleAt(course, zb) + GATE_HALF
               + CLOUD_CLEAR * (0.55 + 0.9 * h01(i, 4409));
    /* DEPTH IS PROPORTIONAL TO WIDTH, and it was not: it was 17 to
       62 m regardless, so a 24 m cloud could be a 62 m tower. That
       is not a cloud, and it was also the silhouette fault — the
       ends CLOSE, so the underside has to climb the whole depth over
       the shoulder, and 62 m over 15 m of x is a slope of four. The
       lobes were never the problem; reducing them made the
       measurement worse, which is how I know. */
    const depth = halfW * (0.40 + 0.45 * h01(i, 3779));
    out.push({
      i, zb, x, halfW, base, depth,
      /* how lumpy, how fast it evolves, and where in its own cycle it
         starts. The rate is deliberately an irrational-ish spread so
         no two clouds beat together and none of them shares a period
         with the strip. */
      puff: 0.45 + h01(i, 2749) * 0.75,
      rate: 0.045 + h01(i, 2411) * 0.055,
      phase: (i * 2.399) % 6.283,
      /* the top may not push past the ceiling the chapter says the
         weather sits under */
      cap: ceilAt(zb, period) + 2.0
    });
  }
  return out;
}

/* ------------------------------------------------------------------
   THE SHAPE OF ONE CLOUD
   ------------------------------------------------------------------
   Three scales of cauliflower on the underside and three more on the
   crown, each written as (1 - cos)/2 so it is non-negative by
   construction: the underside only ever bulges DOWN and the crown
   only ever bulges UP, so a cloud can never turn itself inside out
   however the hashes land. The wavelengths are fractions of the
   cloud's own width, so a small cloud is not a large one scaled down
   — it has fewer, coarser lobes, which is what actually distinguishes
   a puff from a bank.

   `u` is -1..1 across the cloud. The ends close: the underside rises
   to meet the crown through a quintic, so each end is a rounded
   shoulder and there is clear sky past it.
   ------------------------------------------------------------------ */

/* THE WAVELENGTHS ARE IN METRES, NOT IN WAVE COUNTS, and the first
   version had it backwards. Counting waves across the cloud means a
   narrow cloud gets the SAME number of lobes in a shorter span — the
   small ones end up finer than the large ones, which is the reverse
   of what the comment above claimed and of how cloud works. It is
   also what put the silhouette at 4.19 px against a 2 px bar, since
   curvature goes as the square of the wavenumber.

   In metres, a 24 m cloud gets about one big lobe and a 78 m one gets
   three, which is both right to look at and bounded: the worst
   curvature is now the same for every cloud instead of being worst on
   the smallest. The amplitudes are then derived against the bar —
   sum of A k^2 under about 0.15 before the puff and MAG scaling, from
   a 1.5 px budget at the 40 m a cloud is nearest read at. */
const lobe = (amp, waveM, x, ph) => amp * 0.5 * (1 - Math.cos(x * (2 * Math.PI / waveM) + ph));

/** Metres the underside hangs below the cloud's base, at -1..1 across. */
export function puffUnder(c, u){
  const p = c.phase, x = u * c.halfW;
  return (lobe(0.90, 26.0, x, p) + lobe(0.18, 11.0, x, p * 1.7)
        + lobe(0.025, 5.0, x, p * 2.9)) * c.puff * MAG_V;
}

/** Metres the crown stands above base + depth. Different wave counts
 *  and phases from the underside: a cloud whose top echoed its bottom
 *  would read as an extruded shape. */
export function puffCrown(c, u){
  const p = c.phase * 1.37 + 2.1, x = u * c.halfW;
  return (lobe(1.50, 34.0, x, p) + lobe(0.30, 15.0, x, p * 1.6)
        + lobe(0.05, 7.0, x, p * 2.7)) * c.puff * MAG_V;
}

/** 0 across the body, 1 where the cloud has closed. */
/* THE SHOULDER STARTS AT 0.45, NOT 0.62, and the bar is what says
   so. For a rise R over a span of f·halfW at 65 columns the sagitta
   at the 40 m a cloud is nearest read at works out at about R/(f²·
   4650) px, so f = 0.38 allowed a 16 m cloud and f = 0.55 allows 34.
   With depth now at most 0.85·halfW that is inside it for every
   cloud in the field. The base stays flat across the middle half,
   which is what it is for. */
export function puffEnd(u){
  const t = Math.min(1, Math.max(0, (Math.abs(u) - 0.45) / 0.55));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** The drawn underside at -1..1 across, which is the curve the page
 *  draws and therefore the curve the sampler measures. */
export function cloudUnderY(c, u){
  const crown = Math.min(c.cap, c.base + c.depth) + puffCrown(c, u);
  const under = c.base - puffUnder(c, u);
  return under + (crown - under) * puffEnd(u);
}
export function cloudCrownY(c, u){
  return Math.min(c.cap, c.base + c.depth) + puffCrown(c, u);
}

/* ------------------------------------------------------------------
   THE FORCE
   ------------------------------------------------------------------
   The buoyancy now belongs to the clouds rather than to the gates, so
   this is where it is decided whether the reader is inside one.

   THE FORCES SUM, THEY ARE NOT MAXED. Taking the nearest cloud would
   be a max() over instances, which is C0 wherever two of them are
   equally near — a derivative discontinuity of exactly the kind the
   cubic exists to avoid. A sum of smooth envelopes is smooth, and
   with clouds this sparse the overlap is rare enough that it changes
   nothing except that it cannot bite.

   The envelope is a quintic in how far the kite is from the cloud's
   footprint, in both axes, so it is C2 in each. The base used is the
   LOWEST the underside ever reaches — base minus the billow's own
   bound — so the force boundary can never be above the drawn cloud,
   which was the fault that made the reader feel a push under visibly
   clear air.
   ------------------------------------------------------------------ */

const quint = t => { const c = Math.min(1, Math.max(0, t));
                     return 1 - c * c * c * (c * (c * 6 - 15) + 10); };

/** How far along the strip the force reaches past a cloud's own body,
 *  and how far to the side. In metres. */
export const CLOUD_REACH_Z = 10.0;
export const CLOUD_REACH_X = 10.0;

/** Every cloud's contribution at a point, as { base, env } pairs.
 *  `kiteZb` is the kite's own strip coordinate — dist + period*BEHIND,
 *  the same inversion the shadow uses. */
export function cloudsAt(clouds, period, kiteZb, kiteX){
  const out = [];
  for(const c of clouds){
    let dz = (c.zb - kiteZb) % period;
    if(dz >  period / 2) dz -= period;
    if(dz < -period / 2) dz += period;
    const ez = quint((Math.abs(dz) - 2.0) / CLOUD_REACH_Z);
    if(ez <= 0) continue;
    const dx = Math.abs(kiteX - c.x);
    const ex = quint((dx - c.halfW) / CLOUD_REACH_X);
    if(ex <= 0) continue;
    out.push({ c, env: ez * ex, base: c.base - CLOUD_BILLOW });
  }
  return out;
}
