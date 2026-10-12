/* The Book of Rates — black box.
 *
 * An iOS tab kill leaves no console and no stack: the app freezes and
 * reloads. This writes a breadcrumb to localStorage as a session runs, so
 * the NEXT launch can say where it died. It also records real exceptions,
 * which a kill does not produce — so "no error recorded, but a session was
 * in progress" is itself the signature of a resource kill rather than a bug.
 */
const KEY = 'bor.blackbox';

export function note(stage, extra){
  try {
    localStorage.setItem(KEY, JSON.stringify({
      stage, extra: extra || null, at: Date.now(),
      dpr: window.devicePixelRatio || 1,
      mem: (performance && performance.memory)
        ? Math.round(performance.memory.usedJSHeapSize/1048576) : null
    }));
  } catch(e){}
}
export function clearNote(){ try { localStorage.removeItem(KEY); } catch(e){} }
export function lastNote(){
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch(e){ return null; }
}
export function install(){
  addEventListener('error', e => note('exception', String(e.message).slice(0,160)));
  addEventListener('unhandledrejection', e => note('rejection', String(e.reason).slice(0,160)));
}
