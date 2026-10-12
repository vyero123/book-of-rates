/* The Book of Rates — the page turn.
 *
 * A cascade step and a page turn are the same event: the book turns a
 * page, the world changes, the rate drops. Using one transition for both
 * gives continuity instead of a jump cut.
 *
 * The turn always begins on a rung boundary, which is the start of a
 * breath cycle, which is the end of an exhale — the quietest moment
 * available.
 *
 * It is drawn as paper, not as a crossfade: a curved leading edge sweeps
 * right to left carrying the old world on its face, with a warm paper
 * highlight along the curl and a soft shadow falling on the new page
 * underneath.
 */

import { offscreen, release } from './surface.js';

const PAPER  = '#F3EAD7';
const INK    = 'rgba(20,12,26,0.30)';

const ease   = x => x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x+2, 3)/2;

export class PageTurn {
  constructor(duration = 1.25){
    this.duration = duration;
    this.active = false;
    this.p = 0;
    this.snap = null;      // allocated only while a turn is running
    this.sg = null;
  }

  /** Capture the frame currently on screen as the face of the page. */
  begin(canvas){
    // Half resolution. The page is in motion for the whole turn, so the
    // loss is invisible — and it is a quarter of the backing store. On an
    // iPhone a full-size snapshot is several megabytes held permanently.
    this.release();
    this.snap = offscreen(Math.max(1, canvas.width >> 1), Math.max(1, canvas.height >> 1));
    this.sg = this.snap.getContext('2d');
    this.sg.drawImage(canvas, 0, 0, this.snap.width, this.snap.height);
    this.active = true;
    this.p = 0;
    this.t0 = performance.now()/1000;
  }

  /** Draw over the freshly rendered new scene. Returns true while turning. */
  draw(g, W, H, now){
    if (!this.active) return false;
    this.p = Math.min(1, (now - this.t0) / this.duration);
    const e = ease(this.p);
    if (this.p >= 1){ this.active = false; this.release(); return false; }

    // leading edge: a bowed vertical line travelling right to left
    const curl = W*0.16;
    const edgeX = W + curl - e*(W + curl*2);
    const edge = y => edgeX + Math.sin(Math.PI * (y/H)) * curl * (1 - Math.abs(e-0.5)*0.9);

    const path = new Path2D();
    path.moveTo(-4, -4);
    path.lineTo(edge(0), -4);
    for (let y = 0; y <= H; y += 12) path.lineTo(edge(y), y);
    path.lineTo(edge(H), H+4);
    path.lineTo(-4, H+4);
    path.closePath();

    // the old world, still on the page that is turning
    if (!this.snap){ this.active = false; return false; }
    g.save();
    g.clip(path);
    g.drawImage(this.snap, 0, 0, W, H);
    // the page lifts and darkens slightly as it rotates away
    g.fillStyle = `rgba(20,12,26,${(0.26*e).toFixed(3)})`;
    g.fillRect(-4,-4,W+8,H+8);
    g.restore();

    // paper highlight along the curl: a thin warm band, hard-edged
    g.save();
    g.beginPath();
    for (let y = 0; y <= H; y += 8){
      const x = edge(y);
      y === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.lineWidth = Math.max(1.5, W*0.012);
    g.strokeStyle = PAPER;
    g.globalAlpha = 0.55 + 0.35*Math.sin(Math.PI*e);
    g.stroke();
    g.restore();

    // shadow cast by the lifted page onto the new one
    const shw = W*0.09*Math.sin(Math.PI*e);
    if (shw > 1){
      const gr = g.createLinearGradient(edgeX, 0, edgeX + shw, 0);
      gr.addColorStop(0, INK);
      gr.addColorStop(1, 'rgba(20,12,26,0)');
      g.fillStyle = gr;
      g.fillRect(edgeX, -4, shw, H+8);
    }
    return true;
  }

  /** Give the snapshot memory back immediately, rather than waiting for a
   *  garbage collection that may not come before the tab is killed. */
  release(){
    if (this.snap){ release(this.snap); this.snap = null; this.sg = null; }
  }
}
