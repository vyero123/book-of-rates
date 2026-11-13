/* tools/dryrun.mjs — a chapter, run WITHOUT a GPU and without a deploy.
 *
 *     mkdir /tmp/dry && cd /tmp/dry && npm i three@0.186.1 @webgpu/glslang
 *     node /path/to/repo/tools/dryrun.mjs /path/to/repo free-dive
 *
 * WHY IT EXISTS. The project's rule is push -> Netlify -> look, and on
 * 12 November the push was refused from the session that had just
 * written a whole lit chapter: 19 materials, 38 shader stages, none of
 * which had ever met a compiler. A shader that fails to link is this
 * project's worst failure mode — nothing throws, the frame still draws,
 * the layer is simply absent — and there was no way to find out.
 *
 * So this does the two things that CAN be done blind:
 *
 *   1. EXECUTES THE PAGE'S REAL MODULE against the real three.js, with
 *      only the renderer, the DOM and the clock stubbed. Every line of
 *      scene construction runs, every frame-body branch can be pumped,
 *      and the chapter's own inspection hook is driven through a whole
 *      dive. A typo, a TDZ, a NaN or a missing attribute throws here.
 *   2. COMPILES EVERY SHADER the page constructed with glslang, after
 *      rewriting it the way three does for WebGL2 — and proves first
 *      that the validator rejects a shader with an undeclared name.
 *      It also checks every fragment varying is written by its vertex
 *      stage with the same type, which is the link error a per-stage
 *      compile cannot see.
 *
 * WHAT IT IS NOT. It is not a picture. It cannot say whether the scene
 * is any good, whether the exposure is right, or whether a driver
 * disagrees with glslang. It is not in the gate, because it needs npm
 * packages the repo does not carry. It turns "never compiled" into
 * "compiles, runs, and has not been looked at" — which is a smaller
 * unknown and still an unknown.
 *
 * It needs to be run from a directory whose node_modules has `three`
 * and `@webgpu/glslang`; the repo is only read.
 */
import fs from 'fs'; import os from 'os'; import path from 'path';
import { pathToFileURL } from 'url'; import { createRequire } from 'module';

const REPO = path.resolve(process.argv[2] || '.');
const PAGE = process.argv[3] || 'free-dive';
const APP = path.join(REPO, 'app');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'bor-dry-'));
const require = createRequire(path.join(process.cwd(), 'x.js'));
/* the ES build, by path: require.resolve() lands on three.cjs, whose
   namespace import is a single default and has no ShaderMaterial on it */
const threeUrl = pathToFileURL(path.join(path.dirname(require.resolve('three')), 'three.module.js')).href;

fs.writeFileSync(path.join(TMP, 'stage.mjs'), `
import * as THREE0 from '${threeUrl}';
export const ALL = [];
class SM extends THREE0.ShaderMaterial{ constructor(o){ super(o); ALL.push(this); } }
const THREE = { ...THREE0, ShaderMaterial: SM };
export const DPR_CAP = 1.5;
export async function boot({ start }){ start(THREE); }
export function stage(T, { fov }){
  const size = { W:375, H:812 };
  const camera = new T.PerspectiveCamera(typeof fov === 'function' ? fov(375/812) : fov, 375/812, 0.3, 170);
  const renderer = { getPixelRatio:()=>1.5, render(){}, setRenderTarget(){}, getRenderTarget:()=>null, clear(){},
    getContext:()=>({ finish(){} }), info:{ render:{ calls:0, triangles:0 } }, compile(){}, properties:{ get:()=>({}) } };
  return { renderer, scene:new T.Scene(), camera, size, resize(){}, onFit(cb){ cb(size, camera); } };
}
export function clock(frame){ return { pump(dt=1/60,n=1){ for(let i=0;i<n;i++) frame(dt, performance.now(), true); return n; },
  resync(){}, start(){}, stop(){}, running:true }; }
export function contextGuard(){} export function enter(req, next){ next(); }
export function soloReport(){ return {}; } export function fps(){ return () => {}; }
export function choice(){ return { read:()=>null, write(){}, clear(){} }; } export function flashMeter(){ return {}; }
`);
fs.writeFileSync(path.join(TMP, 'misc.mjs'), `export function requireScroll(){ return false; } export function wireExits(){ return 1; }`);

const el = () => ({ classList:{ add(){}, remove(){} }, style:{ setProperty(){} }, addEventListener(){}, textContent:'' });
globalThis.document = { getElementById: () => el(), querySelectorAll: () => [], addEventListener(){} };
globalThis.window = { innerWidth:375, innerHeight:812, devicePixelRatio:2, addEventListener(){} };

let src = fs.readFileSync(path.join(APP, PAGE + '.html'), 'utf8').match(/<script type="module">([\s\S]*?)<\/script>/)[1];
src = src.replace(/from '\.\/js\/stage\.js'/g, `from '${pathToFileURL(path.join(TMP, 'stage.mjs'))}'`)
         .replace(/from '\.\/js\/(scroll|bookframe)\.js'/g, `from '${pathToFileURL(path.join(TMP, 'misc.mjs'))}'`)
         .replace(/from '\.\/js\/([\w-]+)\.js'/g, (m, n) => `from '${pathToFileURL(path.join(APP, 'js', n + '.js'))}'`);
fs.writeFileSync(path.join(TMP, 'page.mjs'), src);

let fails = 0;
const ok = (name, cond, detail = '') => { console.log((cond ? '  ok    ' : '  FAIL  ') + name + (detail ? '  — ' + detail : '')); if(!cond) fails++; };

console.log('1. the page runs');
await import(pathToFileURL(path.join(TMP, 'page.mjs')).href);
await new Promise(r => setTimeout(r, 50));
/* three itself leaves window.__THREE__ behind; the chapter's hook is the
   one with a scene on it */
const hook = Object.keys(window).find(k => k.startsWith('__') && window[k] && window[k].scene);
const D = window[hook];
ok('start() ran to the end and left its hook', !!D, hook);
const { ALL } = await import(pathToFileURL(path.join(TMP, 'stage.mjs')).href);
let tris = 0, meshes = 0;
D.scene.traverse(o => { if(o.isMesh || o.isPoints){ meshes++; const g = o.geometry;
  if(o.isMesh) tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
  for(const k in g.attributes){ const a = g.attributes[k].array; for(let i = 0; i < a.length; i++) if(!Number.isFinite(a[i])){ fails++; console.log('  FAIL  non-finite', k); break; } } } });
console.log(`        ${ALL.length} materials, ${meshes} drawables, ${tris} triangles`);

if(PAGE === 'free-dive'){
  D.pump(1/60, 120); let s = D.now();
  ok('it opens in stillness: floating, breathing, no rhythm claimed', s.body.speed === 0 && s.inhale === 1 && s.reader.period === null);
  D.go(s.pearl.x, -30);
  let arrived = null, carrying = null, viol = 0;
  for(let i = 0; i < 60 * 14 && carrying === null; i++){ D.pump(1/60, 1); const n = D.now();
    if(n.pearl.at && arrived === null) arrived = i / 60; if(n.pearl.carrying) carrying = i / 60;
    if(n.inhale > 0 && n.headY <= 0) viol++; }
  ok('a dive reaches the pearl', arrived !== null, arrived + ' s');
  ok('and four seconds at it picks it up', carrying !== null && Math.abs(carrying - arrived - 4) < 0.1, (carrying - arrived).toFixed(2) + ' s');
  D.go(null); let next = null;
  for(let i = 0; i < 60 * 20 && next === null; i++){ D.pump(1/60, 1); const n = D.now(); if(n.pearl.site === 1) next = i / 60; if(n.inhale > 0 && n.headY <= 0) viol++; }
  ok('let go, she surfaces, it is released and the next oyster wakes', next !== null, next + ' s');
  s = D.now();
  for(let k = 0; k < 8; k++){ D.go(s.body.x, -5); D.pump(1/60, 50); D.go(s.body.x, 0); D.pump(1/60, 50); }
  s = D.now();
  ok('quick shallow dips are measured, and read as hurried', s.reader.measured && s.reader.period < 2.2 && s.haste > 0.9, JSON.stringify(s.reader));
  ok('the world has come to them, and prefers to be slower', s.world.period > s.reader.period, s.world.period + ' s against ' + s.reader.period);
  D.touch(0.2, -0.6); D.pump(1/60, 30);
  ok('a finger on the glass steers her through the lens', D.now().body.speed > 0.2);
  ok('no inhale under water in any frame of it', viol === 0);
  s = D.now(); ok('nothing went non-finite', [s.body.x, s.body.y, s.cam.x, s.cam.y, s.focusPx[0]].every(Number.isFinite));
}

console.log('2. every shader compiles');
const glslang = await new Promise(res => { require('@webgpu/glslang/dist/node-devel/glslang.js')().then(g => { delete g.then; res(g); }); });
function prep(s, stage, names){
  s = s.replace(/precision highp float;\n/, '');
  let bind = 0, loc = 0;
  s = (stage === 'vertex'
    ? 'uniform mat4 modelMatrix; uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix; uniform mat4 viewMatrix;\nuniform mat3 normalMatrix; uniform vec3 cameraPosition;\nattribute vec3 position; attribute vec3 normal; attribute vec2 uv;\n'
    : 'uniform mat4 viewMatrix; uniform vec3 cameraPosition;\nlayout(location=0) out highp vec4 pc_fragColor;\n') + s;
  s = s.replace(/\bgl_FragColor\b/g, 'pc_fragColor').replace(/\btexture2D\b/g, 'texture');
  s = s.replace(/\bvarying\s+(\w+)\s+(\w+)\s*;/g, (m, t, n) => `layout(location=${10 + names.indexOf(n)}) ${stage === 'vertex' ? 'out' : 'in'} ${t} ${n};`);
  s = s.replace(/\battribute\s+(\w+)\s+(\w+)\s*;/g, (m, t, n) => `layout(location=${loc++}) in ${t} ${n};`);
  s = s.replace(/\buniform\s+(sampler\w+)\s+(\w+)\s*;/g, (m, t, n) => `layout(set=0,binding=${bind++}) uniform ${t} ${n};`);
  s = s.replace(/\buniform\s+(?!sampler)/g, '');     // Vulkan rules forbid loose non-opaque uniforms; a global parses the same
  return '#version 310 es\nprecision highp float; precision highp int; precision highp sampler2D;\n' + s;
}
const quiet = fn => { const e = console.error, l = console.log, w = process.stderr.write; let out;
  process.stderr.write = () => true; try { out = fn(); } finally { process.stderr.write = w; } return out; };
let control = false;
try { quiet(() => glslang.compileGLSL(prep('void main(){ gl_FragColor = vec4(noSuchThing, 1.0); }', 'fragment', []), 'fragment', false)); } catch(e){ control = true; }
ok('control: the validator rejects an undeclared name', control);
let bad = 0, mism = 0;
ALL.forEach((m, i) => {
  const names = [...new Set([...(m.vertexShader + m.fragmentShader).matchAll(/\bvarying\s+\w+\s+(\w+)\s*;/g)].map(x => x[1]))].sort();
  for(const [stage, s] of [['vertex', m.vertexShader], ['fragment', m.fragmentShader]]){
    try { quiet(() => glslang.compileGLSL(prep(s, stage, names), stage, false)); }
    catch(e){ bad++; console.log(`  FAIL  material #${i} ${stage}: ` + String(e.message || e).split('\n').filter(l => /ERROR/.test(l)).slice(0, 3).join(' | ')); }
  }
  const vv = new Map([...m.vertexShader.matchAll(/\bvarying\s+(\w+)\s+(\w+)\s*;/g)].map(x => [x[2], x[1]]));
  for(const x of m.fragmentShader.matchAll(/\bvarying\s+(\w+)\s+(\w+)\s*;/g)) if(vv.get(x[2]) !== x[1]){ mism++; console.log(`  FAIL  material #${i}: fragment reads ${x[1]} ${x[2]}, vertex writes ${vv.get(x[2])}`); }
});
ok(`${ALL.length * 2} shader stages compile`, bad === 0);
ok('every fragment varying is written by its vertex stage', mism === 0);

console.log(fails ? `\nDRY RUN FAILED — ${fails}` : '\ndry run: it runs and it compiles. It has NOT been looked at.');
process.exit(fails ? 1 : 0);
