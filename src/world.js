// Endlose, prozedural erzeugte Waldwelt in Chunks.
import * as THREE from 'three';
import { Simplex, mulberry32, hashSeed } from './noise.js';
import { TEX, pixelate } from './textures.js';

export const CHUNK = 64;
export const SEG = 32;
export const VIEW_RADIUS = 3;
export const WATER_LEVEL = 0;

// kind: tree (Axt), rock (Spitzhacke), bush (Beeren), pickup (E zum Aufheben)
export const OBJ = {
  pine:     { name: 'Kiefer', kind: 'tree', hp: 6, col: 0.42, top: 7, r: 0.4, regrow: 3, castShadow: true },
  oak:      { name: 'Eiche', kind: 'tree', hp: 8, col: 0.48, top: 5, r: 0.45, regrow: 4, castShadow: true },
  birch:    { name: 'Birke', kind: 'tree', hp: 4, col: 0.28, top: 5, r: 0.3, regrow: 2, castShadow: true },
  rock:     { name: 'Felsen', kind: 'rock', hp: 6, col: 0.95, top: 1.2, r: 1.0, regrow: 5, castShadow: true },
  bush:     { name: 'Beerenstrauch', kind: 'bush', col: 0, top: 1.0, r: 0.8, regrow: 1, castShadow: true },
  stick:    { name: 'Ast', kind: 'pickup', give: { wood: 1 }, col: 0, top: 0.2, r: 0.55, regrow: 1 },
  stone:    { name: 'Stein', kind: 'pickup', give: { stone: 1 }, col: 0, top: 0.25, r: 0.35, regrow: 1.5 },
  fern:     { name: 'Farn', kind: 'pickup', give: { fiber: 2 }, col: 0, top: 0.7, r: 0.5, regrow: 1 },
  mushroom: { name: 'Pilz', kind: 'pickup', give: { mushroom: 1 }, col: 0, top: 0.35, r: 0.3, regrow: 1 },
};

// ---------- Low-Poly-Geometrie-Bibliothek ----------

function xf(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  return new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    new THREE.Vector3(sx, sy, sz),
  );
}

let partSeed = 1;
function part(geo, color, matrix, tex = TEX.NOISE) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  if (matrix) g.applyMatrix4(matrix);
  const base = new THREE.Color(color);
  const n = g.attributes.position.count;
  const cols = new Float32Array(n * 3);
  const rand = mulberry32(partSeed++);
  for (let i = 0; i < n; i += 3) {
    const f = 0.88 + rand() * 0.24;
    for (let k = 0; k < 3; k++) {
      cols[(i + k) * 3] = base.r * f;
      cols[(i + k) * 3 + 1] = base.g * f;
      cols[(i + k) * 3 + 2] = base.b * f;
    }
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  g.setAttribute('texId', new THREE.BufferAttribute(new Float32Array(n).fill(tex), 1));
  return g;
}

export function mergeParts(parts) {
  let total = 0;
  for (const p of parts) total += p.attributes.position.count;
  const pos = new Float32Array(total * 3);
  const col = new Float32Array(total * 3);
  const tid = new Float32Array(total);
  let off = 0;
  for (const p of parts) {
    pos.set(p.attributes.position.array, off * 3);
    col.set(p.attributes.color.array, off * 3);
    tid.set(p.attributes.texId.array, off);
    off += p.attributes.position.count;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('texId', new THREE.BufferAttribute(tid, 1));
  g.computeVertexNormals();
  return g;
}

function buildLibrary() {
  const trunk = 0x6b4a2f;
  const L = {};
  L.pine = mergeParts([
    part(new THREE.CylinderGeometry(0.2, 0.32, 3.4, 6), trunk, xf(0, 1.6, 0), TEX.BARK),
    part(new THREE.ConeGeometry(1.9, 2.8, 7), 0x2c5a33, xf(0, 3.7, 0), TEX.NEEDLES),
    part(new THREE.ConeGeometry(1.5, 2.4, 7), 0x326638, xf(0, 5.1, 0, 0, 0.4), TEX.NEEDLES),
    part(new THREE.ConeGeometry(1.0, 2.0, 7), 0x38713e, xf(0, 6.4, 0, 0, 0.8), TEX.NEEDLES),
  ]);
  L.oak = mergeParts([
    part(new THREE.CylinderGeometry(0.26, 0.4, 3.2, 7), trunk, xf(0, 1.5, 0), TEX.BARK),
    part(new THREE.CylinderGeometry(0.1, 0.14, 1.4, 5), trunk, xf(0.5, 2.9, 0, 0, 0, -0.8), TEX.BARK),
    part(new THREE.IcosahedronGeometry(2.0, 0), 0x4c8638, xf(0, 4.2, 0), TEX.LEAVES),
    part(new THREE.IcosahedronGeometry(1.5, 0), 0x579540, xf(1.3, 4.0, 0.4), TEX.LEAVES),
    part(new THREE.IcosahedronGeometry(1.4, 0), 0x447c33, xf(-1.1, 4.1, -0.6), TEX.LEAVES),
  ]);
  L.birch = mergeParts([
    part(new THREE.CylinderGeometry(0.15, 0.21, 4.6, 6), 0xe6e2d6, xf(0, 2.3, 0), TEX.BIRCH),
    part(new THREE.BoxGeometry(0.43, 0.08, 0.43), 0x2b2b2b, xf(0, 1.3, 0, 0, 0.3), TEX.BIRCH),
    part(new THREE.BoxGeometry(0.38, 0.07, 0.38), 0x2b2b2b, xf(0, 2.4, 0, 0, 1.1), TEX.BIRCH),
    part(new THREE.IcosahedronGeometry(1.4, 0), 0x8db548, xf(0, 4.7, 0), TEX.LEAVES),
    part(new THREE.IcosahedronGeometry(1.0, 0), 0x9cc455, xf(0.5, 5.6, 0.2), TEX.LEAVES),
  ]);
  L.rock = part(new THREE.DodecahedronGeometry(1, 0), 0x86847e, xf(0, 0.25, 0), TEX.STONE);
  L.bush = mergeParts([
    part(new THREE.IcosahedronGeometry(0.75, 0), 0x2d6a2a, xf(0, 0.55, 0), TEX.LEAVES),
    part(new THREE.IcosahedronGeometry(0.55, 0), 0x36762e, xf(0.45, 0.45, 0.2), TEX.LEAVES),
    part(new THREE.IcosahedronGeometry(0.5, 0), 0x2f6e2b, xf(-0.4, 0.42, -0.25), TEX.LEAVES),
  ]);
  const berryParts = [];
  const br = mulberry32(77);
  for (let i = 0; i < 12; i++) {
    const a = br() * Math.PI * 2, e = br() * 1.1;
    const r = 0.74;
    berryParts.push(part(new THREE.IcosahedronGeometry(0.09, 0), 0xc01f45,
      xf(Math.cos(a) * Math.cos(e) * r, 0.55 + Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r)));
  }
  L.berries = mergeParts(berryParts);
  L.stick = mergeParts([
    part(new THREE.CylinderGeometry(0.045, 0.06, 1.3, 5), 0x7a5532, xf(0, 0.06, 0, 0, 0, Math.PI / 2), TEX.BARK),
    part(new THREE.CylinderGeometry(0.03, 0.035, 0.45, 4), 0x7a5532, xf(0.2, 0.06, 0.15, 0, 0.8, Math.PI / 2), TEX.BARK),
  ]);
  L.stone = part(new THREE.DodecahedronGeometry(0.22, 0), 0x9a9893, xf(0, 0.1, 0, 0, 0, 0, 1, 0.7, 1), TEX.STONE);
  const fern = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    fern.push(part(new THREE.ConeGeometry(0.11, 0.95, 4), 0x3f7f35,
      xf(Math.cos(a) * 0.3, 0.32, -Math.sin(a) * 0.3, 0, a, -1.0, 1, 1, 0.35), TEX.LEAVES));
  }
  L.fern = mergeParts(fern);
  L.mushroom = mergeParts([
    part(new THREE.CylinderGeometry(0.05, 0.07, 0.22, 6), 0xeee6d0, xf(0, 0.11, 0)),
    part(new THREE.ConeGeometry(0.2, 0.14, 8), 0x9b5a2e, xf(0, 0.27, 0)),
    part(new THREE.CylinderGeometry(0.035, 0.05, 0.15, 6), 0xeee6d0, xf(0.18, 0.07, 0.08)),
    part(new THREE.ConeGeometry(0.13, 0.1, 8), 0x8a4d26, xf(0.18, 0.18, 0.08)),
  ]);
  L.grass = mergeParts([
    part(new THREE.ConeGeometry(0.05, 0.6, 3), 0x5b8f3a, xf(0, 0.3, 0, 0.15, 0, 0.1), TEX.GRASS),
    part(new THREE.ConeGeometry(0.05, 0.5, 3), 0x66a043, xf(0.1, 0.25, 0.05, -0.2, 0, -0.25), TEX.GRASS),
    part(new THREE.ConeGeometry(0.05, 0.45, 3), 0x4f8234, xf(-0.08, 0.22, -0.06, 0.25, 0, 0.3), TEX.GRASS),
  ]);
  L.flower = mergeParts([
    part(new THREE.CylinderGeometry(0.015, 0.015, 0.35, 3), 0x4f8234, xf(0, 0.17, 0), TEX.GRASS),
    part(new THREE.IcosahedronGeometry(0.07, 0), 0xffffff, xf(0, 0.37, 0), TEX.FLAT),
  ]);
  return L;
}

// ---------- Welt ----------

const _m4 = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _e = new THREE.Euler();
const _c = new THREE.Color();
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);

const SAND = new THREE.Color(0xcdbb86);
const MUD = new THREE.Color(0x6e6248);
const GRASS1 = new THREE.Color(0x5a8a36);
const GRASS2 = new THREE.Color(0x46702b);
const FOREST = new THREE.Color(0x3b5524);
const DIRT = new THREE.Color(0x6b5a42);
const ROCK = new THREE.Color(0x7c7a73);
const SNOW = new THREE.Color(0xeef2f5);

export class World {
  constructor(scene, seed) {
    this.scene = scene;
    this.seed = seed;
    this.nBase = new Simplex(seed);
    this.nHill = new Simplex(seed + 1);
    this.nDetail = new Simplex(seed + 2);
    this.nMount = new Simplex(seed + 3);
    this.nForest = new Simplex(seed + 4);
    this.nBiome = new Simplex(seed + 5);
    this.chunks = new Map();
    this.queue = [];
    this.removed = new Map();
    this.day = 0;
    this.structures = []; // {x, z, col}
    this.falling = [];
    this.lib = buildLibrary();
    this.objMat = pixelate(new THREE.MeshLambertMaterial({ vertexColors: true }), null, 1.6);
    this.terrainMat = pixelate(new THREE.MeshLambertMaterial({ vertexColors: true }), null, 1);
    this.lastCx = null;

    const wg = new THREE.PlaneGeometry(1200, 1200, 1, 1);
    wg.rotateX(-Math.PI / 2);
    this.water = new THREE.Mesh(wg, new THREE.MeshPhongMaterial({
      color: 0x2b6a86, transparent: true, opacity: 0.78, shininess: 90, specular: 0x88aacc, depthWrite: false,
    }));
    pixelate(this.water.material, TEX.WATER, 0.5);
    this.water.position.y = WATER_LEVEL;
    this.water.renderOrder = 1;
    scene.add(this.water);
  }

  height(x, z) {
    const base = this.nBase.fbm(x * 0.0035, z * 0.0035, 4);
    const hills = this.nHill.fbm(x * 0.012, z * 0.012, 3);
    const detail = this.nDetail.noise(x * 0.07, z * 0.07);
    let h = 6 + base * 22 + hills * 5 + detail * 0.45;
    const m = this.nMount.fbm(x * 0.0017, z * 0.0017, 3);
    if (m > 0.12) {
      const k = m - 0.12;
      h += k * k * 420 + Math.abs(this.nHill.noise(x * 0.03, z * 0.03)) * k * 30;
    }
    return h;
  }

  forest(x, z) {
    const f = 0.5 + this.nForest.fbm(x * 0.007, z * 0.007, 2) * 1.1;
    return Math.min(1, Math.max(0, f));
  }

  slopeAt(x, z) {
    const e = 0.8;
    const nx = this.height(x - e, z) - this.height(x + e, z);
    const nz = this.height(x, z - e) - this.height(x, z + e);
    const ny = 2 * e;
    const l = Math.hypot(nx, ny, nz);
    return { nx: nx / l, ny: ny / l, nz: nz / l };
  }

  groundColor(x, z, h, ny, out) {
    const f = this.forest(x, z);
    const v = this.nDetail.noise(x * 0.05, z * 0.05) * 0.5 + 0.5;
    if (h < WATER_LEVEL - 0.5) {
      out.copy(MUD).lerp(SAND, Math.max(0, Math.min(1, (h + 4) / 4)));
    } else if (h < 1.3) {
      out.copy(SAND);
    } else {
      out.copy(GRASS1).lerp(GRASS2, v);
      out.lerp(FOREST, f * 0.75);
      if (h < 2.2) out.lerp(SAND, (2.2 - h) / 0.9);
      const rockT = Math.max(0, Math.min(1, (h - 26) / 10));
      out.lerp(ROCK, rockT);
      if (ny < 0.78) out.lerp(ny < 0.62 ? ROCK : DIRT, 0.8);
      if (h > 46 + v * 6) out.copy(SNOW);
    }
    return out;
  }

  groundTex(x, z, h, ny) {
    if (h < 1.3) return h < WATER_LEVEL - 2.5 ? TEX.DIRT : TEX.SAND;
    const v = this.nDetail.noise(x * 0.05, z * 0.05) * 0.5 + 0.5;
    if (h > 46 + v * 6) return TEX.SNOW;
    if (ny < 0.62 || h > 31) return TEX.STONE;
    if (ny < 0.78) return TEX.DIRT;
    return TEX.GRASS;
  }

  mapColor(x, z) {
    const h = this.height(x, z);
    if (h < WATER_LEVEL) {
      const d = Math.min(1, -h / 6);
      return [60 - d * 30, 120 - d * 40, 160 - d * 30];
    }
    this.groundColor(x, z, h, 1, _c);
    const f = this.forest(x, z);
    let r = _c.r, g = _c.g, b = _c.b;
    if (h > 2 && h < 34) { const k = f * 0.45; r *= 1 - k; g *= 1 - k * 0.5; b *= 1 - k; }
    _c.setRGB(r, g, b).convertLinearToSRGB();
    const shade = 0.85 + Math.min(0.3, h / 120);
    return [_c.r * 255 * shade, _c.g * 255 * shade, _c.b * 255 * shade];
  }

  // ---------- Objektgenerierung ----------

  generateObjects(cx, cz) {
    const rand = mulberry32(hashSeed(this.seed, cx, cz));
    const objs = [];
    const cell = 4;
    const n = CHUNK / cell;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const x = cx * CHUNK + i * cell + rand() * cell;
        const z = cz * CHUNK + j * cell + rand() * cell;
        const r = rand(), r2 = rand(), r3 = rand(), r4 = rand();
        const h = this.height(x, z);
        if (h < WATER_LEVEL + 0.8) continue;
        const f = this.forest(x, z);
        const alpine = Math.max(0, Math.min(1, (h - 24) / 14));
        const treeP = (0.08 + f * 0.5) * (1 - alpine * 0.85);
        let type = null, s = 1;
        let acc = treeP;
        if (r < acc) {
          const birchy = this.nBiome.noise(x * 0.01, z * 0.01);
          if (h > 20 || r2 < 0.45 - birchy * 0.3) type = 'pine';
          else if (birchy > 0.25 && r2 < 0.85) type = 'birch';
          else type = 'oak';
          s = 0.8 + r3 * 0.6;
        } else if (r < (acc += 0.035 + alpine * 0.12)) { type = 'rock'; s = 0.7 + r3 * 1.3; }
        else if (r < (acc += 0.025 * (1 - alpine))) type = 'bush';
        else if (r < (acc += 0.035 * (0.4 + f))) type = 'stick';
        else if (r < (acc += 0.03)) type = 'stone';
        else if (r < (acc += 0.04 * (1 - alpine))) type = 'fern';
        else if (r < (acc += 0.014 * f)) type = 'mushroom';
        if (!type) continue;
        if (type !== 'rock' && type !== 'pine' && this.slopeAt(x, z).ny < 0.7) continue;
        const sink = OBJ[type].kind === 'tree' ? 0.25 : type === 'rock' ? 0.3 * s : 0;
        objs.push({
          type, x, z, y: h - sink, s, rot: r4 * Math.PI * 2,
          sy: type === 'rock' ? 0.55 + r2 * 0.4 : 1,
          hp: OBJ[type].hp || 0, hidden: false, berries: type === 'bush',
          key: `${cx},${cz},${objs.length}`,
        });
      }
    }
    return objs;
  }

  composeObj(o, out) {
    _p.set(o.x, o.y, o.z);
    _q.setFromEuler(_e.set(0, o.rot, 0));
    _s.set(o.s, o.s * o.sy, o.s);
    return out.compose(_p, _q, _s);
  }

  buildChunk(cx, cz) {
    const ox = cx * CHUNK, oz = cz * CHUNK;
    const geo = new THREE.PlaneGeometry(CHUNK, CHUNK, SEG, SEG);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const nor = geo.attributes.normal;
    const col = new Float32Array(pos.count * 3);
    const tid = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + ox + CHUNK / 2;
      const z = pos.getZ(i) + oz + CHUNK / 2;
      const h = this.height(x, z);
      pos.setY(i, h);
      const n = this.slopeAt(x, z);
      nor.setXYZ(i, n.nx, n.ny, n.nz);
      this.groundColor(x, z, h, n.ny, _c);
      col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b;
      tid[i] = this.groundTex(x, z, h, n.ny);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('texId', new THREE.BufferAttribute(tid, 1));
    geo.computeBoundingSphere();
    geo.computeBoundingBox();
    const terrain = new THREE.Mesh(geo, this.terrainMat);
    terrain.position.set(ox + CHUNK / 2, 0, oz + CHUNK / 2);
    terrain.receiveShadow = true;

    const group = new THREE.Group();
    group.add(terrain);

    const objs = this.generateObjects(cx, cz);
    const byType = {};
    for (const o of objs) (byType[o.type] ||= []).push(o);
    const crand = mulberry32(hashSeed(this.seed, cx, cz, 99));
    for (const type in byType) {
      const list = byType[type];
      const im = new THREE.InstancedMesh(this.lib[type], this.objMat, list.length);
      let bm = null;
      if (type === 'bush') bm = new THREE.InstancedMesh(this.lib.berries, this.objMat, list.length);
      list.forEach((o, k) => {
        o.inst = k; o.im = im;
        this.composeObj(o, _m4);
        im.setMatrixAt(k, _m4);
        const v = 0.85 + crand() * 0.3;
        im.setColorAt(k, _c.setRGB(v, v * (0.95 + crand() * 0.1), v));
        if (bm) { bm.setMatrixAt(k, _m4); o.bm = bm; }
      });
      im.castShadow = !!OBJ[type].castShadow;
      im.receiveShadow = true;
      group.add(im);
      if (bm) group.add(bm);
    }

    for (const o of objs) {
      const r = this.removed.get(o.key);
      if (r === undefined) continue;
      if (this.day - r >= OBJ[o.type].regrow) { this.removed.delete(o.key); continue; }
      if (o.type === 'bush') this.takeBerries(o, true);
      else this.hideObject(o, true);
    }

    // Deko: Gras und Blumen
    const drand = mulberry32(hashSeed(this.seed, cx, cz, 7));
    const grass = [], flowers = [];
    for (let i = 0; i < 160; i++) {
      const x = ox + drand() * CHUNK, z = oz + drand() * CHUNK;
      const h = this.height(x, z);
      const fl = drand() < 0.12;
      if (h < 1.8 || h > 30) continue;
      (fl ? flowers : grass).push([x, h, z, drand()]);
    }
    const FLOWER_COLORS = [0xf5f0e0, 0xf2d140, 0xb070e0, 0xe85a6a];
    for (const [list, geoKey] of [[grass, 'grass'], [flowers, 'flower']]) {
      if (!list.length) continue;
      const im = new THREE.InstancedMesh(this.lib[geoKey], this.objMat, list.length);
      list.forEach(([x, h, z, r], k) => {
        _m4.compose(_p.set(x, h - 0.05, z), _q.setFromEuler(_e.set(0, r * 6.28, 0)), _s.setScalar(0.7 + r * 0.8));
        im.setMatrixAt(k, _m4);
        if (geoKey === 'flower') im.setColorAt(k, _c.set(FLOWER_COLORS[Math.floor(r * 4)]));
        else im.setColorAt(k, _c.setRGB(0.8 + r * 0.4, 0.9 + r * 0.2, 0.8));
      });
      im.receiveShadow = true;
      group.add(im);
    }

    this.scene.add(group);
    const chunk = { cx, cz, group, objs, geo };
    this.chunks.set(`${cx},${cz}`, chunk);
    return chunk;
  }

  unloadChunk(key, ch) {
    this.scene.remove(ch.group);
    ch.geo.dispose();
    ch.group.traverse(o => { if (o.isInstancedMesh) o.dispose(); });
    this.chunks.delete(key);
  }

  update(px, pz, maxBuilds = 1) {
    const pcx = Math.floor(px / CHUNK), pcz = Math.floor(pz / CHUNK);
    if (pcx !== this.lastCx || pcz !== this.lastCz) {
      this.lastCx = pcx; this.lastCz = pcz;
      for (const [k, ch] of this.chunks) {
        if (Math.abs(ch.cx - pcx) > VIEW_RADIUS + 1 || Math.abs(ch.cz - pcz) > VIEW_RADIUS + 1) this.unloadChunk(k, ch);
      }
      this.queue = [];
      for (let dx = -VIEW_RADIUS; dx <= VIEW_RADIUS; dx++) {
        for (let dz = -VIEW_RADIUS; dz <= VIEW_RADIUS; dz++) {
          const cx = pcx + dx, cz = pcz + dz;
          if (!this.chunks.has(`${cx},${cz}`)) this.queue.push([cx, cz, dx * dx + dz * dz]);
        }
      }
      this.queue.sort((a, b) => a[2] - b[2]);
    }
    for (let i = 0; i < maxBuilds && this.queue.length; i++) {
      const [cx, cz] = this.queue.shift();
      if (!this.chunks.has(`${cx},${cz}`)) this.buildChunk(cx, cz);
    }
    this.water.position.x = Math.round(px / 50) * 50;
    this.water.position.z = Math.round(pz / 50) * 50;
  }

  loadAround(px, pz) {
    this.lastCx = null;
    this.update(px, pz, 999);
  }

  dispose() {
    for (const [k, ch] of this.chunks) this.unloadChunk(k, ch);
    for (const f of this.falling) this.scene.remove(f.group);
    this.scene.remove(this.water);
    this.water.geometry.dispose();
    for (const k in this.lib) this.lib[k].dispose();
  }

  // ---------- Abfragen ----------

  forEachNear(x, z, fn) {
    const pcx = Math.floor(x / CHUNK), pcz = Math.floor(z / CHUNK);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const ch = this.chunks.get(`${pcx + dx},${pcz + dz}`);
        if (!ch) continue;
        for (const o of ch.objs) if (!o.hidden) fn(o);
      }
    }
  }

  // Schiebt ein Objekt mit {x, z} aus Baumstämmen, Felsen und Bauten heraus.
  collide(p, radius) {
    const push = (ox, oz, r) => {
      const dx = p.x - ox, dz = p.z - oz;
      const min = r + radius;
      const d2 = dx * dx + dz * dz;
      if (d2 < min * min && d2 > 1e-8) {
        const d = Math.sqrt(d2);
        p.x = ox + (dx / d) * min;
        p.z = oz + (dz / d) * min;
      }
    };
    this.forEachNear(p.x, p.z, o => {
      const c = OBJ[o.type].col;
      if (c > 0) push(o.x, o.z, c * o.s);
    });
    for (const s of this.structures) {
      if (s.seg) {
        const [ax, az, bx, bz] = s.seg;
        const ex = bx - ax, ez = bz - az;
        const t = Math.max(0, Math.min(1, ((p.x - ax) * ex + (p.z - az) * ez) / (ex * ex + ez * ez)));
        push(ax + ex * t, az + ez * t, s.col);
      } else if (s.col > 0) {
        push(s.x, s.z, s.col);
      }
    }
  }

  setInstance(im, k, matrix) {
    im.setMatrixAt(k, matrix);
    im.instanceMatrix.needsUpdate = true;
  }

  hideObject(o, silent = false) {
    o.hidden = true;
    this.setInstance(o.im, o.inst, ZERO);
    if (o.bm) this.setInstance(o.bm, o.inst, ZERO);
    if (!silent) this.removed.set(o.key, this.day);
  }

  takeBerries(o, silent = false) {
    o.berries = false;
    this.setInstance(o.bm, o.inst, ZERO);
    if (!silent) this.removed.set(o.key, this.day);
  }

  fellTree(o, fromX, fromZ) {
    this.hideObject(o);
    const pivot = new THREE.Group();
    pivot.position.set(o.x, o.y, o.z);
    const mesh = new THREE.Mesh(this.lib[o.type], this.objMat);
    mesh.scale.set(o.s, o.s, o.s);
    mesh.rotation.y = o.rot;
    mesh.castShadow = true;
    pivot.add(mesh);
    const dir = new THREE.Vector3(o.x - fromX, 0, o.z - fromZ).normalize();
    const axis = new THREE.Vector3(0, 1, 0).cross(dir).normalize();
    this.scene.add(pivot);
    this.falling.push({ group: pivot, axis, t: 0 });
  }

  updateEffects(dt) {
    for (let i = this.falling.length - 1; i >= 0; i--) {
      const f = this.falling[i];
      f.t += dt;
      const k = Math.min(1, f.t / 1.4);
      const angle = (Math.PI / 2 - 0.08) * k * k;
      f.group.quaternion.setFromAxisAngle(f.axis, angle);
      if (f.t > 2.2) f.group.position.y -= dt * 2;
      if (f.t > 3.5) {
        this.scene.remove(f.group);
        this.falling.splice(i, 1);
      }
    }
  }

  findSpawn(nearX = 0, nearZ = 0) {
    for (let r = 0; r < 2000; r += 8) {
      for (let a = 0; a < Math.PI * 2; a += 0.5) {
        const x = nearX + Math.cos(a) * r, z = nearZ + Math.sin(a) * r;
        const h = this.height(x, z);
        if (h > 2.5 && h < 14 && this.slopeAt(x, z).ny > 0.9) return { x, z };
      }
    }
    return { x: nearX, z: nearZ };
  }
}
