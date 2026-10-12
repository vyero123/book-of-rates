/* The Book of Rates — canvas sizing, with a budget.
 *
 * WHY THIS EXISTS. iOS Safari caps the TOTAL canvas backing-store area a
 * tab may hold and kills the tab when it is exceeded — the symptom is a
 * freeze then a reload, with no JS exception to find. An iPhone reports
 * devicePixelRatio 3, so a naive full-screen canvas is 9x the CSS-pixel
 * area, and every extra surface multiplies that again.
 *
 * So: never multiply blindly by devicePixelRatio. Ask for a scale, and
 * get back the largest one that keeps this surface inside its area
 * budget. Everything that allocates a canvas goes through here, and
 * everything is registered so the total can be measured rather than
 * assumed.
 */

const REG = new Set();

/** Largest device-pixel scale for a CSS-pixel surface within `budget`. */
export function scaleFor(cssW, cssH, budget = 1_300_000, cap = 2){
  const want = Math.min(window.devicePixelRatio || 1, cap);
  const cssArea = Math.max(1, cssW * cssH);
  if (cssArea * want * want <= budget) return want;
  return Math.max(1, Math.sqrt(budget / cssArea));
}

/** Size a canvas to its CSS box within a budget, and set the transform. */
export function sizeCanvas(cv, ctx, budget = 1_300_000, cap = 2){
  const W = cv.clientWidth || cv.width, H = cv.clientHeight || cv.height;
  const s = scaleFor(W, H, budget, cap);
  const w = Math.max(1, Math.round(W * s)), h = Math.max(1, Math.round(H * s));
  if (cv.width !== w || cv.height !== h){ cv.width = w; cv.height = h; }
  if (ctx) ctx.setTransform(s, 0, 0, s, 0, 0);
  REG.add(cv);
  return { W, H, scale: s };
}

/** Make an offscreen canvas that is tracked and can be released. */
export function offscreen(w, h){
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  REG.add(c);
  return c;
}

/** Hand the memory back. Setting width to 0 is what actually frees the
 *  backing store; dropping the reference alone waits for a GC that may
 *  not come before the tab is killed. */
export function release(cv){
  if (!cv) return;
  try { cv.width = 0; cv.height = 0; } catch(e){}
  REG.delete(cv);
}

/** Release every tracked canvas — used on pagehide so a backgrounded
 *  document is not still holding surfaces while the next page allocates. */
export function releaseAll(){
  for (const c of [...REG]) release(c);
  REG.clear();
}

/** What are we actually holding? For diagnosis, not decoration. */
export function diag(){
  let area = 0, n = 0;
  const live = document.querySelectorAll('canvas');
  for (const c of live){ area += c.width * c.height; n++; }
  let tracked = 0;
  for (const c of REG) tracked += c.width * c.height;
  const mem = (performance && performance.memory)
    ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null;
  return {
    canvasesInDom: n,
    trackedCanvases: REG.size,
    domAreaPx: area,
    trackedAreaPx: tracked,
    estMB: +((area * 4) / 1048576).toFixed(1),
    jsHeapMB: mem,
    dpr: window.devicePixelRatio || 1
  };
}

/** A resize handler that does not reallocate on every URL-bar twitch.
 *  iOS fires resize continuously while the bar hides and shows; each one
 *  would otherwise rebuild the backing store and the grain pattern. */
export function onResizeDebounced(fn, ms = 250){
  let t = null, lastW = innerWidth, lastH = innerHeight;
  addEventListener('resize', () => {
    // ignore pure height twitches below a threshold: that is the URL bar
    if (Math.abs(innerWidth - lastW) < 2 && Math.abs(innerHeight - lastH) < 90) return;
    lastW = innerWidth; lastH = innerHeight;
    clearTimeout(t); t = setTimeout(fn, ms);
  });
}
