/* FROZEN BASELINE — do not refactor this file, do not tidy it, do not
 * "fix" it. It is a verbatim copy of the breath mapping that was inlined
 * in app/deep-light.html at commit time on 23 October 2026, immediately
 * before the shared kit was extracted.
 *
 * Its only job is to be the thing the refactored page is diffed against,
 * by tools/regress.mjs, which runs inside tools/check.sh. If this file is
 * edited to agree with a changed kit, the regression test stops testing
 * anything — which is the same failure as a gate that is not in the push
 * chain.
 *
 * Copied unmodified from deep-light.html lines 170-258. The only additions
 * are the `export` keywords.
 */

/* ---------- the dive, in height terms. Above zero is out of the water. */
const Y_AIR    =  0.52;
const Y_FLOAT  = -0.42;
const Y_BOTTOM = -14.4;
const clamp01 = x => Math.min(1, Math.max(0, x));
const smooth  = x => x*x*(3-2*x);
/* drops through the surface fast, then glides the rest of the way down */
const drop    = x => smooth(Math.pow(x, 0.80));

const PROTOCOLS = {
  box: {
    id:'box', name:'Box breathing · 4-4-4-4 · 3.75 breaths a minute', cycles:10,
    phases:[
      { k:'in',   d:4, label:'breathe in',  sub:'at the surface',
        from:Y_AIR, to:Y_AIR, cam:'air', aim:-0.15,
        grip:p => 1 - smooth(clamp01(p / 0.50)) },
      { k:'hold', d:4, label:'hold',        sub:'going down',
        from:Y_AIR, to:Y_BOTTOM, cam:'down', ease:drop, aim:0.60,
        count:'breathe out in', grip:() => 0 },
      { k:'out',  d:4, label:'breathe out', sub:'on the seabed',
        from:Y_BOTTOM, to:Y_BOTTOM, cam:'floor', aim:0.10, bubbles:true,
        grip:p => smooth(clamp01((p - 0.45) / 0.40)) },
      { k:'hold', d:4, label:'hold',        sub:'rising with it',
        from:Y_BOTTOM, to:Y_AIR, cam:'up', aim:-0.45,
        count:'surfacing in', grip:() => 1 }
    ]
  },
  open: {
    id:'open', name:'No holds · 4 out / 2 at empty / 5 in · 5.45 breaths a minute', cycles:14,
    phases:[
      { k:'out',  d:4, label:'breathe out', sub:'she sinks',
        from:Y_AIR, to:Y_BOTTOM, cam:'down', ease:drop, bubbles:true,
        grip:p => 1 - smooth(clamp01(p / 0.35)) },
      { k:'rest', d:2, label:'rest',        sub:'drifting at the bottom',
        from:Y_BOTTOM, to:Y_BOTTOM, cam:'down', count:'rising in',
        grip:p => smooth(clamp01((p - 0.15) / 0.75)) },
      { k:'in',   d:5, label:'breathe in',  sub:'rising into the air',
        from:Y_BOTTOM, to:Y_AIR, cam:'up2air', grip:() => 1 }
    ]
  }
};

let PROTO = PROTOCOLS.box, CYCLE = 16, SESSION = 160;
function useProtocol(p){
  PROTO = p;
  CYCLE = PROTO.phases.reduce((a, q) => a + q.d, 0);
  SESSION = CYCLE * PROTO.cycles;
}
useProtocol(PROTOCOLS.box);

function phaseAt(t){
  let u = t % CYCLE; if(u < 0) u += CYCLE;
  for(const p of PROTO.phases){ if(u < p.d) return { p, pr:u/p.d, left:p.d - u }; u -= p.d; }
  const p = PROTO.phases[PROTO.phases.length-1]; return { p, pr:1, left:0 };
}
function diverY(t){
  const s = phaseAt(t);
  return s.p.from + (s.p.to - s.p.from) * (s.p.ease || smooth)(s.pr);
}
function gripAmount(t){ const s = phaseAt(t); return clamp01(s.p.grip(s.pr)); }

/* The cue line, lifted from the frame loop of the same file:
 *     const sub = ph.count ? (ph.count + ' ' + Math.max(1, Math.ceil(st.left))) : ph.sub;
 */
function cueAt(t){
  const st = phaseAt(t), ph = st.p;
  return {
    label: ph.label,
    sub: ph.count ? (ph.count + ' ' + Math.max(1, Math.ceil(st.left))) : ph.sub
  };
}

export { PROTOCOLS, useProtocol, phaseAt, diverY, gripAmount, cueAt };
export const state = () => ({ id: PROTO.id, name: PROTO.name, cycle: CYCLE, session: SESSION });
