/* The Book of Rates — protocols and levels.
 *
 * A protocol is defined in BEATS, never in seconds. Seconds are derived.
 * That is the whole point: with one breath cycle spanning a whole number
 * of bars, breaths/min = BPM / (beatsPerBar * bars), so the music and the
 * breath cannot drift apart however long a session runs.
 *
 *   breaths per minute = BPM / (4 * bars per breath)
 */

export function protocol(p){
  const beatsPerBar = p.beatsPerBar ?? 4;
  const cycleBeats  = p.bars * beatsPerBar;
  const sum = p.phases.reduce((a, x) => a + x.beats, 0);
  if (sum !== cycleBeats) {
    throw new Error(`protocol ${p.id}: phases total ${sum} beats, cycle is ${cycleBeats}`);
  }
  const spb = 60 / p.bpm;
  return Object.freeze({
    ...p, beatsPerBar, cycleBeats, spb,
    cycleSec: cycleBeats * spb,
    breathsPerMin: p.bpm / (beatsPerBar * p.bars),
    // cumulative beat offset of each phase start, for fast lookup
    offsets: p.phases.reduce((a, x) => (a.push(a.length ? a[a.length-1] + p.phases[a.length-1].beats : 0), a), [])
  });
}

/* ---- the rates, all with integer tempos (design doc 3.3) ---- */
export const P = {
  // lead-down ladder: the session starts near where the user already is
  // and descends. Leslie 2019 — target ~75% of baseline, don't jump to it.
  lead65: protocol({ id:'lead65', bpm:104, bars:4, phases:[{k:'in',beats:7},{k:'out',beats:9}] }), // 6.5/min
  lead60: protocol({ id:'lead60', bpm:96,  bars:4, phases:[{k:'in',beats:7},{k:'out',beats:9}] }), // 6.0/min

  calm:   protocol({ id:'calm',   bpm:88,  bars:4, phases:[{k:'in',beats:7},{k:'out',beats:9}] }), // 5.5/min  DEFAULT
  ground: protocol({ id:'ground', bpm:88,  bars:4, phases:[{k:'in',beats:8},{k:'out',beats:8}] }), // 5.5/min equal
  soothe: protocol({ id:'soothe', bpm:120, bars:6, phases:[{k:'in',beats:8},{k:'out',beats:16}] }),// 5.0/min exact 1:2
  sleepy: protocol({ id:'sleepy', bpm:72,  bars:4, phases:[{k:'in',beats:6},{k:'out',beats:10}] }),// 4.5/min
  box:    protocol({ id:'box',    bpm:60,  bars:4,                                                 // 3.75/min
            phases:[{k:'in',beats:4},{k:'hold',beats:4},{k:'out',beats:4},{k:'holdout',beats:4}] }),
  alert:  protocol({ id:'alert',  bpm:128, bars:4, phases:[{k:'in',beats:6},{k:'out',beats:10}] }) // 8.0/min
};

/* ---- session lengths, expressed as cycles of the destination rate ---- */
export const LENGTHS = {
  short:    { id:'short',    label:'Short',    note:'about 3 minutes',  cycles:10 },
  standard: { id:'standard', label:'Standard', note:'about 5 minutes',  cycles:21 },
  long:     { id:'long',     label:'Long',     note:'about 10 minutes', cycles:48 }
};

/* ---- levels ----
 * Each level pairs an emotional destination, a protocol, a theme and an
 * interaction. `stages` is the lead-down; the last stage is the destination
 * and is the one whose length the user chooses.
 */
export const LEVELS = [
  {
    id: 'long-shore',
    name: 'The Long Shore',
    state: 'Grounded',
    blurb: 'A desert at dusk, walked at the pace of your breath. The land ahead of you is the breath you are about to take.',
    theme: 'desert-dusk',
    display: 'long-shore',
    interaction: 'none',
    music: 'shore',
    // No fast breathing and no holds, so the screening gate in design doc
    // 2.2 does not apply to this level. The posture and water rules do.
    needsScreening: false,
    stages: [
      { protocol: P.lead65, cycles: 3 },
      { protocol: P.lead60, cycles: 3 },
      { protocol: P.calm,   cycles: 'rest' }
    ]
  }
];

export function levelById(id){ return LEVELS.find(l => l.id === id); }
