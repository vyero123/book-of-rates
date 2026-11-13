/* The Book of Rates — SOLIDS WITH NORMALS.
 *
 * The flat chapters built their scenery from ribbons and profiles, which
 * need no normals because nothing lit them. A lit scene needs closed
 * shapes whose normals are RIGHT — smooth across every shared vertex,
 * and still right after the shape has been squashed, displaced and
 * turned. That is this file: an icosphere with shared vertices, and a
 * way to push a lumpy, scaled, rotated copy of it into a merged mesh
 * with normals computed from the faces it actually ends up with.
 *
 * Why not THREE.SphereGeometry: its seam and its poles are duplicated
 * vertices. Leave it round and nobody can tell; displace it and the
 * seam opens into a visible line of light, because the two copies of a
 * vertex get different normals. An icosphere has no seam to open.
 *
 * NO THREE: plain arrays in, plain arrays out, so the geometry a chapter
 * draws can be rebuilt and measured in Node.
 */

/** Unit icosphere, shared vertices. detail 0 = 12 vertices / 20 faces;
 *  each level quadruples the faces. 2 is 162 / 320, which is round
 *  enough for a rock at arm's length and cheap enough to scatter. */
export function icosphere(detail = 2){
  const t = (1 + Math.sqrt(5)) / 2;
  let V = [[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],
           [t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]].map(v => { const m = Math.hypot(...v); return v.map(c => c / m); });
  let F = [[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],
           [3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
  for(let d = 0; d < detail; d++){
    const mid = new Map(), NF = [];
    const m = (a, b) => {
      const k = a < b ? a + ':' + b : b + ':' + a;
      if(mid.has(k)) return mid.get(k);
      const p = [0,1,2].map(i => V[a][i] + V[b][i]); const l = Math.hypot(...p);
      V.push(p.map(c => c / l)); mid.set(k, V.length - 1); return V.length - 1;
    };
    for(const [a, b, c] of F){
      const ab = m(a, b), bc = m(b, c), ca = m(c, a);
      NF.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }
    F = NF;
  }
  return { V, F };
}

/** Area-weighted smooth normals for an indexed triangle soup. */
export function smoothNormals(P, F){
  const N = P.map(() => [0, 0, 0]);
  for(const [a, b, c] of F){
    const ux = P[b][0]-P[a][0], uy = P[b][1]-P[a][1], uz = P[b][2]-P[a][2];
    const vx = P[c][0]-P[a][0], vy = P[c][1]-P[a][1], vz = P[c][2]-P[a][2];
    const n = [uy*vz - uz*vy, uz*vx - ux*vz, ux*vy - uy*vx];
    for(const i of [a, b, c]){ N[i][0] += n[0]; N[i][1] += n[1]; N[i][2] += n[2]; }
  }
  return N.map(n => { const l = Math.hypot(...n) || 1; return [n[0]/l, n[1]/l, n[2]/l]; });
}

/**
 * Push one lumpy solid into a mesh.js builder that declares
 * `normal: 3` and whatever `attrs(v)` returns.
 *
 * Order of operations is the point: displace, scale, tilt, turn, place —
 * and only THEN take normals, from the triangles as they now are. A
 * normal carried through a non-uniform scale by the same matrix as the
 * position is wrong (it needs the inverse transpose), and a normal taken
 * before displacement describes a sphere that is no longer there.
 *
 * @param {object} o
 * @param {number[]} o.at      centre, world
 * @param {number[]} o.scale   radii
 * @param {number}   o.yaw     turn about y, radians
 * @param {number}   o.tiltX   lean about x, then
 * @param {number}   o.tiltZ   lean about z, both applied before the yaw
 * @param {number}   o.rough   0 = an ellipsoid
 * @param {number}   o.seed
 * @param {Function} o.attrs   (unitVertex, index) => the other attributes
 */
export function addBlob(b, ico, { at, scale, yaw = 0, tiltX = 0, tiltZ = 0, rough = 0.25, seed = 0, attrs = () => ({}) }){
  const lump = v => {
    if(!rough) return 1;
    const s = seed * 12.9898;
    return 1 + rough * (
        0.55 * Math.sin(v[0] * 2.3 + s) * Math.sin(v[1] * 2.9 + s * 1.3) * Math.sin(v[2] * 2.1 + s * 0.7)
      + 0.30 * Math.sin(v[0] * 5.1 + v[1] * 3.3 + s * 2.1)
      + 0.15 * Math.sin(v[2] * 7.3 - v[0] * 4.7 + s * 3.7));
  };
  const cx = Math.cos(tiltX), sx = Math.sin(tiltX), cz = Math.cos(tiltZ), sz = Math.sin(tiltZ);
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const P = ico.V.map(v => {
    const d = lump(v);
    let x = v[0] * d * scale[0], y = v[1] * d * scale[1], z = v[2] * d * scale[2];
    let y1 = y * cx - z * sx, z1 = y * sx + z * cx;            // about x
    let x2 = x * cz - y1 * sz, y2 = x * sz + y1 * cz;          // about z
    const x3 = x2 * cy + z1 * sy, z3 = -x2 * sy + z1 * cy;     // about y
    return [x3 + at[0], y2 + at[1], z3 + at[2]];
  });
  const N = smoothNormals(P, ico.F);
  const base = b.count;
  P.forEach((p, i) => b.vertex(p[0], p[1], p[2], { normal: N[i], ...attrs(ico.V[i], i) }));
  for(const [a, c, d] of ico.F) b.tri(base + a, base + c, base + d);
  return P.length;
}
