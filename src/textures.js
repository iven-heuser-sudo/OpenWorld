// 16×16-Pixeltexturen: prozedural erzeugte Helligkeitsmuster, die die Grundfarbe
// jedes Materials überlagern (Gras, Rinde, Blätter, Stein, Bretter, Fell …).
import * as THREE from 'three';
import { mulberry32 } from './noise.js';

export const TEX = {
  FLAT: 0, GRASS: 1, DIRT: 2, SAND: 3, STONE: 4, SNOW: 5, BARK: 6, BIRCH: 7,
  LEAVES: 8, NEEDLES: 9, PLANKS: 10, FUR: 11, SKIN: 12, WATER: 13, NOISE: 14, CLOTH: 15,
};

const N = 16;
const LAYERS = 16;
const RANGE = 1.4; // Texelwerte 0..RANGE, 1 = Grundfarbe unverändert

function pattern(id, rand) {
  const v = new Float32Array(N * N).fill(1);
  const set = (x, y, val) => { v[(((y % N) + N) % N) * N + (((x % N) + N) % N)] = val; };
  const each = fn => { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) set(x, y, fn(x, y)); };
  const jitter = a => 1 + (rand() * 2 - 1) * a;

  switch (id) {
    case TEX.GRASS:
      each(() => {
        const r = rand();
        return r < 0.14 ? 0.78 : r < 0.24 ? 1.16 : jitter(0.08);
      });
      break;
    case TEX.DIRT:
      each(() => {
        const r = rand();
        return r < 0.1 ? 0.7 : r < 0.18 ? 1.18 : jitter(0.12) * 0.97;
      });
      break;
    case TEX.SAND:
      each(() => (rand() < 0.08 ? 0.86 : jitter(0.05)));
      break;
    case TEX.SNOW:
      each(() => (rand() < 0.06 ? 0.9 : jitter(0.03) * 1.03));
      break;
    case TEX.STONE: {
      // Pflasterartige Zellen mit dunklen Fugen (kachelbar)
      const pts = [];
      for (let i = 0; i < 6; i++) pts.push([rand() * N, rand() * N, jitter(0.1)]);
      each((x, y) => {
        let d1 = 1e9, d2 = 1e9, shade = 1;
        for (const [px, py, s] of pts) {
          for (let ox = -N; ox <= N; ox += N) for (let oy = -N; oy <= N; oy += N) {
            const d = Math.hypot(x + 0.5 - px - ox, y + 0.5 - py - oy);
            if (d < d1) { d2 = d1; d1 = d; shade = s; } else if (d < d2) d2 = d;
          }
        }
        if (d2 - d1 < 1.1) return 0.66;
        return shade * jitter(0.05);
      });
      break;
    }
    case TEX.BARK: {
      const cols = [];
      for (let x = 0; x < N; x++) cols.push(rand() < 0.25 ? 0.68 : jitter(0.1));
      each((x, y) => cols[x] * (rand() < 0.08 ? 0.85 : 1) * (y % 5 === 0 && rand() < 0.3 ? 0.85 : 1));
      break;
    }
    case TEX.BIRCH:
      each(() => jitter(0.04) * 1.05);
      for (let i = 0; i < 6; i++) {
        const y = Math.floor(rand() * N), x = Math.floor(rand() * N), len = 2 + Math.floor(rand() * 4);
        for (let k = 0; k < len; k++) set(x + k, y, 0.3);
      }
      break;
    case TEX.LEAVES:
      each(() => {
        const r = rand();
        return r < 0.12 ? 0.58 : r < 0.3 ? 1.2 : jitter(0.1);
      });
      break;
    case TEX.NEEDLES:
      each((x, y) => ((x + y) % 3 === 0 ? 1.15 : (x - y + 32) % 4 === 0 ? 0.72 : jitter(0.08)));
      break;
    case TEX.PLANKS: {
      const offs = [0, 7, 3, 11];
      each((x, y) => {
        const row = Math.floor(y / 4);
        if (y % 4 === 3) return 0.62;
        if ((x + offs[row]) % N === 0) return 0.7;
        return (1 + (row % 2) * 0.06) * (rand() < 0.15 ? 0.9 : 1) * jitter(0.03);
      });
      break;
    }
    case TEX.FUR:
      each(() => jitter(0.1));
      for (let i = 0; i < 26; i++) {
        const x = Math.floor(rand() * N), y = Math.floor(rand() * N), dark = rand() < 0.5;
        set(x, y, dark ? 0.75 : 1.15);
        set(x, y + 1, dark ? 0.8 : 1.1);
      }
      break;
    case TEX.SKIN:
      each(() => jitter(0.03));
      break;
    case TEX.WATER:
      each(() => jitter(0.03) * 0.96);
      for (let i = 0; i < 7; i++) {
        const y = Math.floor(rand() * N), x = Math.floor(rand() * N), len = 2 + Math.floor(rand() * 4);
        for (let k = 0; k < len; k++) set(x + k, y, 1.3);
      }
      break;
    case TEX.NOISE:
      each(() => jitter(0.1));
      break;
    case TEX.CLOTH:
      each((x, y) => ((x + y) % 2 === 0 ? 1.05 : 0.92) * jitter(0.03));
      break;
    default:
      break;
  }
  return v;
}

function buildTexture() {
  const data = new Uint8Array(N * N * LAYERS);
  for (let l = 0; l < LAYERS; l++) {
    const v = pattern(l, mulberry32(1000 + l * 77));
    for (let i = 0; i < N * N; i++) data[l * N * N + i] = Math.max(0, Math.min(255, Math.round((v[i] / RANGE) * 255)));
  }
  const tex = new THREE.DataArrayTexture(data, N, N, LAYERS);
  tex.format = THREE.RedFormat;
  tex.type = THREE.UnsignedByteType;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

const texture = buildTexture();

// Erweitert ein Lambert-/Phong-Material um die Pixeltextur.
// tex: feste Textur-ID für das ganze Material, oder null = ID aus dem Vertex-Attribut "texId".
// density: Texturkacheln pro Meter (1 = 16 Pixel pro Meter).
export function pixelate(material, tex = null, density = 1) {
  const useAttr = tex === null;
  material.onBeforeCompile = shader => {
    shader.uniforms.pxTex = { value: texture };
    shader.uniforms.pxDensity = { value: density };
    shader.uniforms.pxId = { value: tex ?? 0 };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
${useAttr ? 'attribute float texId;' : ''}
uniform float pxId;
varying vec3 vPxPos;
varying vec3 vPxNormal;
flat varying float vPxId;`)
      .replace('#include <project_vertex>', `#include <project_vertex>
vPxPos = transformed;
vPxNormal = objectNormal;
vPxId = ${useAttr ? 'texId' : 'pxId'};`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
uniform highp sampler2DArray pxTex;
uniform float pxDensity;
varying vec3 vPxPos;
varying vec3 vPxNormal;
flat varying float vPxId;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
{
  vec3 an = abs(vPxNormal);
  vec2 puv = (an.y >= an.x && an.y >= an.z) ? vPxPos.xz : (an.x >= an.z ? vPxPos.zy : vPxPos.xy);
  diffuseColor.rgb *= texture(pxTex, vec3(puv * pxDensity, vPxId)).r * ${RANGE.toFixed(2)};
}`);
  };
  material.customProgramCacheKey = () => `px-${useAttr}`;
  return material;
}

export function pixelMat(color, tex, density = 1.5, extra = {}) {
  return pixelate(new THREE.MeshLambertMaterial({ color, ...extra }), tex, density);
}
