/* The Book of Rates — rates, cascades and levels.
 *
 * THE ARITHMETIC. A breath cycle spans a whole number of BEATS, so
 *
 *     breaths per minute = BPM / beats per breath
 *
 * (The earlier rule, breaths/min = BPM / (4 x bars), is the special case
 * where the beat count is a multiple of four.)
 *
 * CASCADES. A session starts near where the user already is and steps down
 * to its destination, rather than dropping them cold into a target rate.
 * Because rate = BPM / beats, a descending cascade needs NO TEMPO CHANGE
 * AT ALL: hold the tempo and simply let the breath span two more beats at
 * each rung. The music keeps running, unbroken, while the breathing slows.
 * That is the whole payoff of counting in beats.
 *
 * At 120 BPM, stepping by two beats:
 *
 *   beats  16    18    20    22    24    26    28    30    32
 *   br/min 7.50  6.67  6.00  5.45  5.00  4.62  4.29  4.00  3.75
 *   step         -11%  -10%  -9.1% -8.3% -7.7% -7.1% -6.7% -6.2%
 *
 * The steps get gentler as the rate falls, which is the right shape: the
 * slower you are already breathing, the more a given proportional change
 * is felt.
 *
 * EVIDENCE NOTE. Cascading is a design judgement, not a physiological
 * claim. The resonance literature is all fixed-rate. The nearest real
 * support is Leslie et al. 2019, where an audio envelope slowed breathing
 * best when it targeted about 75% of the listener's own baseline rather
 * than jumping to a destination. We may say a cascade is easier to follow.
 * We may not say it does more to the body. (Design doc 3.1.)
 */

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** One rung of a cascade, or a whole fixed-rate protocol. */
export function protocol({ id, bpm, beats, beatsPerBar = 4, ratio = 0.44, phases = null }){
  const spb = 60 / bpm;
  let ph = phases;
  if (!ph){
    const inB = clamp(Math.round(beats * ratio), 2, beats - 2);
    ph = [{ k:'in', beats: inB }, { k:'out', beats: beats - inB }];
  }
  const sum = ph.reduce((a, x) => a + x.beats, 0);
  if (sum !== beats) throw new Error(`protocol ${id}: phases total ${sum}, cycle is ${beats}`);
  return Object.freeze({
    id, bpm, beatsPerBar, phases: ph,
    cycleBeats: beats, spb, cycleSec: beats * spb,
    bars: beats / beatsPerBar,
    breathsPerMin: bpm / beats
  });
}

/* ---- the cascade tempo ----
 * One tempo for every calming journey means a cascade is seamless. 120 BPM
 * also lands four of our six named rates on exact integer beat counts. */
export const CASCADE_BPM = 120;

/** Build a ladder of rungs between two beat counts. */
export function cascade({
  bpm = CASCADE_BPM, from, to, step = 2, ratio = 0.44,
  leadCycles = 3, rungCycles = 2, id = 'cascade'
} = {}){
  const rungs = [];
  const dir = to > from ? step : -step;
  let b = from, i = 0;
  while ((dir > 0 && b < to) || (dir < 0 && b > to)){
    rungs.push({
      protocol: protocol({ id: `${id}-${b}`, bpm, beats: b, ratio }),
      cycles: i === 0 ? leadCycles : rungCycles
    });
    b += dir; i++;
  }
  rungs.push({ protocol: protocol({ id: `${id}-dest`, bpm, beats: to, ratio }), cycles: 'rest' });
  return rungs;
}

/** The rungs for one session. If the user already breathes slower than the
 *  destination there is nothing to cascade down from, so it is a single
 *  rung at the destination — never a cascade that goes the wrong way. */
export function plan({ fromBeats, toBeats, bpm = CASCADE_BPM, step = 2, ratio = 0.44 }){
  if (fromBeats >= toBeats){
    return [{ protocol: protocol({ id:'dest', bpm, beats: toBeats, ratio }), cycles: 'rest' }];
  }
  return cascade({ bpm, from: fromBeats, to: toBeats, step, ratio });
}

/* ---- named destinations, for reference and for fixed-rate levels ---- */
export const RATES = {
  brisk:    { beats: 16, label: '7.5 / min' },
  coherent: { beats: 20, label: '6.0 / min' },
  calm:     { beats: 22, label: '5.45 / min' },
  soothed:  { beats: 24, label: '5.0 / min' },
  slow:     { beats: 28, label: '4.3 / min' },
  deep:     { beats: 32, label: '3.75 / min' }
};

/* Box breathing keeps its own shape: four equal phases, and at 60 BPM one
 * beat is one second, so each side of the box is exactly four beats. */
export const BOX = protocol({
  id: 'box', bpm: 60, beats: 16,
  phases: [{k:'in',beats:4},{k:'hold',beats:4},{k:'out',beats:4},{k:'holdout',beats:4}]
});

/* Energising cascades DO change tempo, because faster music is part of
 * what makes them read as energising (design doc 3.2, arousal is the
 * strong axis). The breath still spans whole beats at every rung. */
export function ascend({ id = 'ascend', fromBeats = 24, toBeats = 15, ratio = 0.40,
                         bpmFrom = 120, bpmTo = 128, rungCycles = 2 } = {}){
  const rungs = [];
  const n = Math.max(1, Math.ceil((fromBeats - toBeats) / 3));
  for (let i = 0, b = fromBeats; b > toBeats; b -= 3, i++){
    const bpm = Math.round(bpmFrom + (bpmTo - bpmFrom) * (i / n));
    rungs.push({ protocol: protocol({ id:`${id}-${b}`, bpm, beats: b, ratio }), cycles: rungCycles });
  }
  rungs.push({ protocol: protocol({ id:`${id}-dest`, bpm: bpmTo, beats: toBeats, ratio }), cycles: 'rest' });
  return rungs;
}

/* ---- how wound up are you ----
 * Three choices, no numbers, no slider. The answer picks the top of the
 * cascade. Remembered as a preference, never shown back as a score. */
export const ENTRY = {
  wired:  { id:'wired',  label:'Wound up',  note:'start quick, come down a long way', beats: 16 },
  busy:   { id:'busy',   label:'Busy',      note:'the usual starting point',          beats: 20 },
  settled:{ id:'settled',label:'Already calm', note:'start near the destination',     beats: 22 }
};

export const LENGTHS = {
  short:    { id:'short',    label:'Short',    note:'about 3 minutes',  cycles: 14 },
  standard: { id:'standard', label:'Standard', note:'about 5 minutes',  cycles: 25 },
  long:     { id:'long',     label:'Long',     note:'about 10 minutes', cycles: 50 }
};

/* ================================================================== *
 *  journeys
 *
 *  A journey declares its OWN starting rate. That is part of its
 *  identity, not something derived from a self-report — so a reader who
 *  wants the full three-scene descent can choose one without having to
 *  claim to be more wound up than they are.
 * ================================================================== */
export const JOURNEYS = [
  {
    id: 'long-descent', chapter: 'Chapter one', title: 'The Long Descent',
    blurb: 'A ride through the forest, a crossing, and a long glide down.',
    fromBeats: 16, toBeats: 22, preview: 'gallop', needsScreening: false
  },
  {
    id: 'the-crossing', chapter: 'Chapter two', title: 'The Crossing',
    blurb: 'Open water, and the slow settling that comes after it.',
    fromBeats: 20, toBeats: 24, preview: 'swell', needsScreening: false
  },
  {
    id: 'high-valley', chapter: 'Chapter three', title: 'The High Valley',
    blurb: 'Already quiet. One long glide, and nothing to do but follow it.',
    fromBeats: 22, toBeats: 26, preview: 'glide', needsScreening: false
  },
  {
    id: 'deep-water', chapter: 'Chapter four', title: 'Deep Water',
    blurb: 'The slowest passage in the book. For the end of a day.',
    fromBeats: 24, toBeats: 32, preview: 'glide', needsScreening: false
  }
];

export function journeyById(id){ return JOURNEYS.find(j => j.id === id) || JOURNEYS[0]; }

/** Rungs for a journey. An explicit entry override is honoured only if the
 *  reader has deliberately chosen one; otherwise the journey's own
 *  starting rate is used. */
export function journeyPlan(journey, entryOverride){
  const from = (entryOverride && ENTRY[entryOverride]) ? ENTRY[entryOverride].beats : journey.fromBeats;
  return plan({ fromBeats: from, toBeats: journey.toBeats });
}

/* ================================================================== *
 *  levels
 * ================================================================== */
export const LEVELS = [
  {
    id: 'long-shore',
    name: 'The Long Shore',
    state: 'Grounded',
    blurb: 'A desert at dusk, walked at the pace of your breath. The land ahead of you is the breath you are about to take.',
    theme: 'desert-dusk',
    display: 'long-shore',
    interaction: 'none',
    music: 'desert-dusk',
    // No fast breathing and no holds, so the screening gate (design doc
    // 2.2) does not apply to this level. The posture and water rules do.
    needsScreening: false,
    cascadeTo: RATES.calm.beats,
    build: (entryBeats, totalCycles) =>
      cascade({ from: entryBeats, to: RATES.calm.beats, step: 2 })
  }
];

export function levelById(id){ return LEVELS.find(l => l.id === id); }
