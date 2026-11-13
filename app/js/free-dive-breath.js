/* The Book of Rates — THE FREE DIVE: the world and the body, as arithmetic.
 *
 * The first chapter built on design doc §1.7. There is no protocol in
 * this file and no schedule anywhere in the chapter: the diver goes
 * where the reader's finger is, down, up and sideways, whenever they
 * like. What is here instead is everything about the scene that a
 * harness should be able to check without a GPU — the shape of the
 * seabed, how the body moves, where the pearls are, and the one rule
 * that binds every water chapter.
 *
 * NO THREE, NO DOM. tools/lead.mjs imports this directly.
 *
 * ------------------------------------------------------------------
 * §1.6a, WHEN THE READER LEADS
 * ------------------------------------------------------------------
 * "An inhale is never depicted underwater." In every earlier water
 * chapter that was a property of a PHASE: the inhale was a stretch of
 * the schedule, and regress.mjs sampled it. Here there is no phase to
 * sample — the reader can do anything at any depth — so the rule has to
 * hold as a property of the DEPICTION ITSELF, at every instant.
 *
 * It is done the way §1.6a says to do it: by the shape of the mapping
 * and not by a number tuned to clear a line. Everything in the picture
 * that reads as breathing in — the chest filling, the lift on the swell
 * — is multiplied by `inhaleAt(headY)`, and that function is exactly
 * zero for a head at or below the waterline. There is no state in which
 * the term is non-zero under water, because there is no path to one.
 * Underwater the only breath drawn is bubbles going UP.
 * ------------------------------------------------------------------ */

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const clamp01 = x => clamp(x, 0, 1);
const smoothstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

/* ---------- the water ---------- */
export const SURFACE_Y = 0;
/** where her centre rests when she is floating: head and shoulders out */
export const Y_FLOAT = -0.34;
/** centre to the top of the head, along the body */
export const HEAD_REACH = 0.66;

/* ---------- the play space ---------- */
export const X_MIN = -11.5, X_MAX = 11.5;
/** how close her centre may come to the sand */
export const BED_CLEAR = 0.55;

/** The seabed, y at (x, z). Smooth by construction — sums of sines and
 *  one smoothstep — so its normal is its analytic gradient and the mesh
 *  can be lit without a single faceted band.
 *
 *  Three things are folded in besides relief: it FALLS AWAY towards the
 *  lens (z > 2), so the camera can follow her to the bottom without the
 *  floor coming up through it; it RISES into a reef wall behind (z far
 *  negative), so there is always something for the light to land on
 *  behind her and she is never a figure against nothing — the
 *  Murmuration's lesson; and it is gentle along z = 0, where she swims. */
export function bedAt(x, z){
  const relief = 1.25 * Math.sin(x * 0.21 + 0.6) + 0.55 * Math.sin(x * 0.53 + 2.1)
               + 0.80 * Math.sin(z * 0.17 + 1.3) + 0.45 * Math.sin(x * 0.31 - z * 0.27 + 0.4);
  const fall = -5.5 * smoothstep(2.0, 13.0, z);
  const reef =  7.0 * smoothstep(-16.0, -44.0, z) + 1.6 * smoothstep(-5.0, -16.0, z);
  return -12.6 + relief + fall + reef;
}
/** the same, along the plane she swims in */
export const bedY = x => bedAt(x, 0);

/** The lowest her centre can go at this x. */
export const floorY = x => bedY(x) + BED_CLEAR;

/* ---------- the body ---------- */
/** metres a second. Ten metres of water in about four seconds, which is
 *  the old chapter's descent — so a reader who WANTS the 4-4-4-4 shape
 *  (down four, four at the pearl, up four, four at the surface) can have
 *  it exactly, and nothing makes them. */
export const V_MAX = 2.7;
/** how hard she leans towards the finger, per second */
export const PURSUE = 2.4;
/** how quickly her velocity becomes the one she wants, per second */
export const AGILITY = 5.0;
/** left alone, she drifts up. Slowly: letting go is not a penalty and
 *  not a rescue, it is just what a body full of air does — and it means
 *  the direction of doing nothing is towards air (§2.4, restated as
 *  physics instead of as a countdown). */
export const BUOY_V = 0.9;

/**
 * One step of the body. `target` is where the finger is in the world,
 * or null when nobody is steering. Mutates and returns `s`:
 * { x, y, vx, vy }.
 *
 * The velocity is eased towards a wanted velocity that is itself
 * proportional to distance and capped — so she arrives without
 * overshooting (the wanted speed goes to zero with the distance) and
 * without a dead zone (there is no threshold anywhere in it).
 */
export function swim(s, target, dt){
  let wx, wy;
  if(target){
    const dx = clamp(target.x, X_MIN, X_MAX) - s.x;
    const ty = clamp(target.y, floorY(clamp(target.x, X_MIN, X_MAX)), Y_FLOAT);
    const dy = ty - s.y;
    wx = dx * PURSUE; wy = dy * PURSUE;
    const m = Math.hypot(wx, wy);
    if(m > V_MAX){ wx *= V_MAX / m; wy *= V_MAX / m; }
  } else {
    wx = 0;
    wy = Math.min(BUOY_V, (Y_FLOAT - s.y) * PURSUE);
  }
  const e = 1 - Math.exp(-AGILITY * dt);
  s.vx += (wx - s.vx) * e;
  s.vy += (wy - s.vy) * e;
  s.x += s.vx * dt;
  s.y += s.vy * dt;
  /* the world's edges, as positions and not as forces: she cannot be
     above her float line or inside the sand, whatever the finger says */
  if(s.x < X_MIN){ s.x = X_MIN; if(s.vx < 0) s.vx = 0; }
  if(s.x > X_MAX){ s.x = X_MAX; if(s.vx > 0) s.vx = 0; }
  if(s.y > Y_FLOAT){ s.y = Y_FLOAT; if(s.vy > 0) s.vy = 0; }
  const f = floorY(s.x);
  if(s.y < f){ s.y = f; if(s.vy < 0) s.vy = 0; }
  return s;
}

/** The top of her head, given her centre and how upright she is
 *  (`up` is the y component of her unit body axis: 1 standing in the
 *  water, 0 lying along it, -1 head down). */
export const headY = (y, up) => y + HEAD_REACH * up;

/** §1.6a AS A FUNCTION. How much of an inhale the picture may show for
 *  a head at this height: exactly 0 at and below the waterline, rising
 *  to 1 once the head is clear of it. EVERY inhale term in the chapter
 *  is multiplied by this and by nothing that can undo it. */
export function inhaleAt(head){
  return smoothstep(SURFACE_Y + 0.02, SURFACE_Y + 0.16, head);
}

/** The reader's scalar for the rhythm estimator: how far down she is,
 *  0 at the float line and 1 ten metres under it. */
export const DEPTH_SPAN = 10.0;
export const depthFrac = y => clamp01((Y_FLOAT - y) / DEPTH_SPAN);

/* ---------- the pearl ---------- */
/** "It takes four seconds to pick up once you get to it." */
export const PICK_SECS = 4.0;
/** how near her centre has to be to the oyster's mouth to be at it */
export const PICK_REACH = 1.05;

/** Where the oysters are, in order. Each is within 3.6 m of the last, so
 *  the next one's light is inside or at the edge of the frame from
 *  wherever she surfaces — a pearl the reader has to hunt for off screen
 *  would be a search task, and this is a breathing one. */
export const SITES = [1.6, -2.0, 1.4, 5.0, 8.2, 4.8, 1.2, -2.4, -6.0, -8.6, -5.2, -1.8];
/** the point she has to reach: just above the shell, on the sand */
export const siteAt = i => {
  const x = SITES[((i % SITES.length) + SITES.length) % SITES.length];
  return { x, y: bedY(x) + 0.42, bed: bedY(x) };
};

/**
 * The pearl's whole state machine, as a pure step. Mutates and returns
 * `p`: { site, progress, carrying, deliver }.
 *
 *   progress  0..1, rises while she is at the oyster, and IS KEPT when
 *             she leaves. Coming up for air half way through is not a
 *             failure and costs nothing (§1.6b): the shell stays as open
 *             as she left it. It also means there is never a reason to
 *             stay down longer than is comfortable, which is the one
 *             incentive a diving game must not create (§2.4).
 *   carrying  she has it
 *   deliver   0..1 once she has surfaced with it: it is let go into the
 *             light, and the next oyster wakes
 *
 * Nothing is counted. There is no number of pearls anywhere.
 */
export function pearlStep(p, body, head, dt){
  if(p.deliver > 0){
    p.at = false;
    p.deliver += dt / 1.6;
    if(p.deliver >= 1){ p.deliver = 0; p.carrying = false; p.progress = 0; p.site += 1; }
    return p;
  }
  if(p.carrying){
    p.at = false;
    if(inhaleAt(head) > 0.5) p.deliver = 1e-6;
    return p;
  }
  const s = siteAt(p.site);
  const near = Math.hypot(body.x - s.x, body.y - s.y) < PICK_REACH;
  p.at = near;
  if(near){
    p.progress = Math.min(1, p.progress + dt / PICK_SECS);
    if(p.progress >= 1) p.carrying = true;
  }
  return p;
}
export const newPearl = () => ({ site: 0, progress: 0, carrying: false, deliver: 0, at: false });

/* ---------- the lens ---------- */
/** How far back, and how much of her vertical travel it follows. It
 *  follows PART of the way and never all of it: Lantern Current's lens
 *  rode the thing the breath moved and the motion cancelled out. At 0.62
 *  a twelve-metre dive is still four and a half metres of travel down a
 *  twelve-metre frame, past kelp and rock and falling snow that do not
 *  move with her. */
export const CAM_BACK = 13.0;
export const CAM_FOLLOW_Y = 0.62;
export const CAM_REST_Y = -3.3;
export const camYFor = y => CAM_REST_Y + CAM_FOLLOW_Y * (y - Y_FLOAT);
