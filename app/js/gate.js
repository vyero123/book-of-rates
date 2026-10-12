/* The Book of Rates — first-run orientation and screening.
 *
 * Two different things, deliberately kept apart (design doc 2.1 / 2.2):
 *
 *  1. THE RULES. Posture, water, driving, and how to stop. These apply to
 *     every breathing practice including the gentle ones, so they are
 *     shown once before the first session and are never skippable.
 *
 *  2. THE SCREENING. Conditions that make fast breathing or breath-holds
 *     unsafe. NOTHING in this edition involves either, so these answers
 *     restrict nothing here — and the copy says so rather than implying a
 *     gate that is not operating. They are recorded so that the locked
 *     chapter stays locked if it ever arrives.
 *
 * ONE acknowledgement, not three taps. That is defensible for THIS
 * edition specifically, because v1 contains no fast breathing and no
 * retention: the rules here are posture, water and how to stop, and the
 * thin caution line stays at the foot of the app. The FULL briefing —
 * unskippable, with a comprehension check — returns as part of unlocking
 * "The Breath Held", which is where the real risk sits. (Design doc 2.4a.)
 */

const KEY = 'bor.gate';

export function gateState(){
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch(e){ return null; }
}
export function gatePassed(){ const s = gateState(); return !!(s && s.rules); }
export function retentionAllowed(){
  const s = gateState();
  return !!(s && s.rules && s.screened && !s.anyFlag);
}
function save(v){ try { localStorage.setItem(KEY, JSON.stringify(v)); } catch(e){} }

const RULES = [
  { id:'posture', t:'Sit down or lie down.',
    d:'Not standing, not walking, not in a vehicle. If you feel faint you should already be somewhere safe to be faint.' },
  { id:'water', t:'Never in or near water.',
    d:'No bath, pool, sea or hot tub — and never before swimming or diving. Breath-holding after fast breathing causes blackout with no warning at all, and it has killed strong swimmers in shallow, supervised pools.' },
  { id:'stop', t:'Stop whenever you want.',
    d:'The stop control is on screen for the whole session and always works. Light-headedness or tingling means ease off, not push through. Chest pain, fainting, or losing your vision means stop and seek help.' }
];

const SCREEN = [
  'Epilepsy, seizures, or unexplained blackouts',
  'Pregnancy',
  'Heart disease, an irregular heartbeat, or fainting spells',
  'Stroke, aneurysm, or sickle cell',
  'High blood pressure that is not controlled',
  'Glaucoma or recent eye surgery',
  'Asthma or another lung condition that is not stable',
  'Panic disorder or PTSD',
  'Under 18'
];

const CSS = `
#bor-gate{position:fixed;inset:0;z-index:200;overflow:auto;background:#0C0716;
  color:#F3EAD7;font-family:ui-sans-serif,-apple-system,"Avenir Next",Segoe UI,sans-serif;
  -webkit-font-smoothing:antialiased}
#bor-gate .wrap{max-width:430px;margin:0 auto;padding:max(26px,env(safe-area-inset-top)) 20px 50px}
#bor-gate .of{font:400 8.5px/1 ui-serif,Georgia,serif;letter-spacing:.34em;
  text-transform:uppercase;opacity:.5}
#bor-gate h1{font:300 26px/1.15 ui-serif,Georgia,serif;margin:6px 0 10px}
#bor-gate .lede{font:400 13px/1.65 ui-sans-serif;color:rgba(243,234,215,.7);margin:0 0 20px}
#bor-gate .rule{border:1px solid rgba(243,234,215,.16);border-radius:12px;padding:14px 15px;
  margin-bottom:10px;background:rgba(243,234,215,.03)}
#bor-gate .rule{border-color:rgba(243,234,215,.2)}
#bor-gate .rule .hd{display:flex;align-items:center;gap:10px}
#bor-gate .rule .tick{width:19px;height:19px;flex:0 0 19px;border-radius:50%;
  background:#46D6C8;display:grid;place-items:center;
  font:700 10px/1 ui-sans-serif;color:#0C0716}
#bor-gate .rule h3{margin:0;font:400 16px/1.25 ui-serif,Georgia,serif}
#bor-gate .rule p{margin:9px 0 0 29px;font:400 12px/1.6 ui-sans-serif;color:rgba(243,234,215,.6)}
#bor-gate h2{font:600 8.5px/1 ui-sans-serif;letter-spacing:.24em;text-transform:uppercase;
  color:rgba(243,234,215,.4);margin:26px 0 8px}
#bor-gate .screennote{font:400 11.5px/1.6 ui-sans-serif;color:rgba(243,234,215,.5);margin:0 0 12px}
#bor-gate .screennote b{color:rgba(243,234,215,.78);font-weight:600}
#bor-gate label{display:flex;gap:10px;align-items:flex-start;padding:9px 2px;
  font:400 12.5px/1.45 ui-sans-serif;color:rgba(243,234,215,.78);
  border-bottom:1px solid rgba(243,234,215,.08)}
#bor-gate input{appearance:none;width:17px;height:17px;flex:0 0 17px;margin-top:1px;
  border:1.5px solid rgba(243,234,215,.35);border-radius:4px;background:transparent}
#bor-gate input:checked{background:#E8473C;border-color:#E8473C}
#bor-gate .go{width:100%;appearance:none;border:0;border-radius:11px;padding:16px 0;margin-top:22px;
  background:rgba(243,234,215,.14);color:rgba(243,234,215,.4);
  font:700 11px/1 ui-sans-serif;letter-spacing:.22em}
#bor-gate .go.ready{background:#F3EAD7;color:#14183F}
#bor-gate .foot{margin-top:16px;font:400 10px/1.6 ui-sans-serif;color:rgba(243,234,215,.3)}
`;

export function openGate(onDone){
  const st = document.createElement('style'); st.textContent = CSS;
  document.head.appendChild(st);

  const el = document.createElement('div');
  el.id = 'bor-gate';
  el.innerHTML = `<div class="wrap">
    <div class="of">The Book of Rates</div>
    <h1>Before you begin</h1>
    <p class="lede">Three rules. They are short, and they are the part of this that
      actually matters.</p>
    ${RULES.map(r => `<div class="rule" data-r="${r.id}">
        <div class="hd"><div class="tick">✓</div><h3>${r.t}</h3></div>
        <p>${r.d}</p>
      </div>`).join('')}

    <h2>One more thing</h2>
    <p class="screennote">Some conditions make <b>fast breathing and breath-holding</b> unsafe.
      <b>Nothing in this edition uses either</b> — every journey here is slow breathing with no
      holds — so ticking a box below will not take anything away from you now. It is recorded
      so that the one locked chapter stays locked if it is ever written.</p>
    ${SCREEN.map((s,i) => `<label><input type="checkbox" data-s="${i}"><span>${s}</span></label>`).join('')}

    <button class="go ready" id="bor-gate-go">I UNDERSTAND — BEGIN</button>
    <p class="foot">This is not medical advice. If you are unsure whether breathing exercises
      are right for you, ask a doctor.</p>
  </div>`;
  document.body.appendChild(el);

  const go = el.querySelector('#bor-gate-go');
  go.onclick = () => {
    const flags = [...el.querySelectorAll('input[data-s]')]
      .map((c,i) => c.checked ? SCREEN[i] : null).filter(Boolean);
    save({ rules:true, screened:true, anyFlag: flags.length > 0, flags, at: Date.now() });
    el.remove(); st.remove();
    if (onDone) onDone();
  };
}

/** Run the gate if it has never been passed; otherwise call straight through. */
export function requireGate(onReady){
  if (gatePassed()){ onReady(); return false; }
  openGate(onReady);
  return true;
}
