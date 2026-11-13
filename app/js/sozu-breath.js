/* ============================================================
   BOOK OF RATES — BAMBOO RAIN, the second version: the water-tipper
   13 November 2026. Pure arithmetic: no three, no DOM, so a harness
   can fly it.

   THE THING. A length of bamboo on a pivot in a garden in the rain
   (a sozu — the tipping water-tube of a Japanese garden; a kind of
   object, not anybody's design). Left alone it hangs mouth-down and
   the rain's trickle runs past it. PRESS, anywhere, and the tail goes
   down onto its stone: the mouth comes up under the trickle and the
   tube fills for as long as it is held. LET GO and the water's weight
   tips it: it pours, for a little longer than it took to fill.

   That is one degree of freedom, and the only thing the reader
   chooses is HOW LONG. The breath is in as it fills and out as it
   pours.

   WHAT THE BREATH MOVES, AND RELATIVE TO WHAT — the question this
   book asks first, because Lantern Current could not answer it. The
   tube TURNS about a pivot that is bolted to a post that is bolted to
   the ground, in front of a lens that does not move. Its mouth
   travels a tenth of the frame's height in a third of a second, twice
   a breath, and both turns are caused by the finger at the instant
   the finger moves. The first Bamboo Rain was recorded in the design
   doc as "the weak one" precisely because its breath drove something
   that EASED and never turned. This turns.

   THE LONG EXHALE IS IN THE PLUMBING, NOT IN A RULE. The tube empties
   POUR_RATIO times slower than it filled, because its mouth is
   narrower than the rain is generous. So a reader who breathes with
   the water breathes out longer than in without being told to, at
   whatever rate they chose (design doc 1.7: they set the rate; the
   boundary is in the world).

   WHAT IT WILL NOT DO (design doc 1.6, 1.6b, 2):
   - It never asks for a hold. Held past full it simply overflows; a
     full tube is not worth more than letting go.
   - It caps. T_FULL is five seconds: with the pour that is about
     5 in / 6.5 out, a little over five breaths a minute, and nothing
     in it rewards going slower than that.
   - It cannot be failed. Never pressed, it rains and the storm
     clears on its own schedule in the page; mashed, it dribbles.
   - Nothing is counted. The bowls the pour reaches are lit by the
     water and go out again.
   ============================================================ */

/** seconds of holding to fill it */
export const T_FULL = 5.0;
/** emptying takes this many times as long as that filling took */
export const POUR_RATIO = 1.3;
/** and never less than this, so a tap is a dribble and not a flicker */
export const T_POUR_MIN = 0.9;

/** the tube's tilt, radians; positive is mouth UP (tail on its stone) */
export const UP = 0.16;
export const DOWN = -0.45;
/** within this of UP the mouth is under the trickle and catching it */
export const CATCH = 0.10;
/** within this of DOWN the mouth is low enough to pour */
export const SPILL = 0.25;

/** The chain of bowls the pour runs down. A bowl is reached when this
 *  much of a full tube has been delivered — so about 1.25, 2.5, 3.75
 *  and a little over 4 seconds of filling reach one, two, three and
 *  all four. */
export const BOWL_AT = [0.12, 0.36, 0.60, 0.84];
/** a lit bowl fades with this time constant, seconds */
export const BOWL_FADE = 3.5;

const clamp01 = x => Math.min(1, Math.max(0, x));

export function newSozu(){
  return {
    pressed: false,
    fill: 0,            // 0..1, the water in the tube
    over: 0,            // 0..1, spilling over a full tube
    catching: false,
    pouring: false, pourFrom: 0, pourU: 0, pourDur: 0,
    flow: 0,            // 0..1, how hard it is pouring
    delivered: 0,       // 0..1, how much of a full tube this pour has put down
    lastFill: 0,        // the fill the last pour started from
    angle: DOWN, av: 0,
    knock: 0,           // 1 at the instant the tail meets its stone, decaying
    bowl: [0, 0, 0, 0]  // each bowl's light, 0..1
  };
}

/** How many bowls a pour that started at `fill` will reach. */
export const reachOf = fill => BOWL_AT.filter(a => fill >= a).length;

/** The bowl just past the reader's last reach — the one the garden
 *  offers, by glimmering. -1 when there is nothing to offer: before
 *  the first pour, and once the last bowl has been reached. */
export const offerOf = s => {
  if(s.lastFill <= 0) return -1;
  const r = reachOf(s.lastFill);
  return r < BOWL_AT.length ? r : -1;
};

/** One step. `pressed` is the whole of the input. */
export function step(s, pressed, dt){
  const was = s.pressed;
  s.pressed = !!pressed;

  if(s.pressed && !was){
    /* taking hold again in the middle of a pour keeps what is left */
    s.pouring = false;
  }
  if(!s.pressed && was && s.fill > 0.004){
    s.pouring = true;
    s.pourFrom = s.fill; s.pourU = 0; s.delivered = 0;
    s.pourDur = Math.max(T_POUR_MIN, POUR_RATIO * s.fill * T_FULL);
    s.lastFill = s.fill;
  }

  /* THE TURN. A sprung, slightly underdamped swing, so it arrives with
     a little weight — and the tail cannot go through its stone, which
     is where the knock comes from. */
  const target = s.pressed ? UP : DOWN;
  const W = 13, Z = 0.72;
  s.av += (-2 * Z * W * s.av - W * W * (s.angle - target)) * dt;
  s.angle += s.av * dt;
  if(s.angle > UP){
    s.angle = UP;
    if(s.av > 0){ if(s.av > 0.4) s.knock = 1; s.av = -s.av * 0.18; }
  }
  s.knock = Math.max(0, s.knock - dt * 2.5);

  /* FILLING: only while the mouth is actually under the trickle */
  s.catching = s.pressed && s.angle > UP - CATCH;
  if(s.catching) s.fill = Math.min(1, s.fill + dt / T_FULL);
  const overWant = s.catching && s.fill >= 1 ? 1 : 0;
  s.over += (overWant - s.over) * (1 - Math.exp(-dt * 4));

  /* POURING: fast at first and tailing off, the way a tipped tube
     does. A FUNCTION of how far through the pour it is, not a rate
     proportional to what is left — that shape crawls its last stretch
     for ever, and this file's siblings have paid for it twice. */
  if(s.pouring && s.angle < DOWN + SPILL){
    s.pourU = Math.min(1, s.pourU + dt / s.pourDur);
    const left = s.pourFrom * Math.pow(1 - s.pourU, 1.6);
    s.delivered = s.pourFrom - left;
    s.fill = left;
    s.flow = Math.pow(1 - s.pourU, 0.6);
    if(s.pourU >= 1){ s.pouring = false; s.fill = 0; s.flow = 0; }
  } else {
    s.flow = Math.max(0, s.flow - dt * 6);
  }

  /* THE BOWLS: lit as the water gets to them, fading after */
  for(let k = 0; k < BOWL_AT.length; k++){
    const on = s.pouring && s.delivered >= BOWL_AT[k];
    if(on) s.bowl[k] += (1 - s.bowl[k]) * (1 - Math.exp(-dt * 5));
    else   s.bowl[k] *= Math.exp(-dt / BOWL_FADE);
  }
  return s;
}

/** For a harness: fly a reader who holds for `hold` seconds and then
 *  lets go for long enough, and report what the garden did. */
export function flyOne(hold, dt = 1 / 120){
  const s = newSozu();
  let t = 0, upAt = null, pourEnd = null, peak = 0;
  for(; t < hold; t += dt){ step(s, true, dt); if(upAt === null && s.catching) upAt = t; }
  const filled = s.fill;
  const t0 = t;
  for(; t < hold + 40; t += dt){
    step(s, false, dt);
    peak = Math.max(peak, ...s.bowl);
    if(pourEnd === null && !s.pouring && s.flow === 0){ pourEnd = t - t0; break; }
  }
  return { hold, turnUp: upAt, filled: +filled.toFixed(4), pour: pourEnd === null ? null : +pourEnd.toFixed(3),
           ratio: pourEnd === null ? null : +(pourEnd / hold).toFixed(3), reach: reachOf(filled) };
}

export { clamp01 };
