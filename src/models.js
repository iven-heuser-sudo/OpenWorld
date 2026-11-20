// Modelle für Bauten (Lagerfeuer, Unterschlupf, Palisade, Falle) und die Gegenstände in der Hand.
import * as THREE from 'three';
import { TEX, pixelMat } from './textures.js';

const WOOD = 0x6b4a2f;
const PLANK = 0x8a6440;
const STONE = 0x8a8780;
const SKIN = 0xd9a77e;

function mesh(geo, color, x, y, z, rx = 0, ry = 0, rz = 0, opts = {}) {
  const mat = opts.basic
    ? new THREE.MeshBasicMaterial({ color, transparent: !!opts.opacity, opacity: opts.opacity ?? 1 })
    : pixelMat(color, opts.tex ?? TEX.NOISE, opts.density ?? 2, { emissive: opts.emissive || 0x000000 });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = !opts.basic;
  m.receiveShadow = !opts.basic;
  return m;
}

export function makeCampfire() {
  const g = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    g.add(mesh(new THREE.DodecahedronGeometry(0.17, 0), STONE, Math.cos(a) * 0.62, 0.1, Math.sin(a) * 0.62, a, a * 2, 0, { tex: TEX.STONE, density: 4 }));
  }
  const logs = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const log = mesh(new THREE.CylinderGeometry(0.065, 0.08, 0.95, 6), 0x5e3f24, Math.cos(a) * 0.18, 0.34, Math.sin(a) * 0.18, 0, 0, 0, { tex: TEX.BARK, density: 4 });
    log.rotation.set(Math.sin(a) * 0.55, 0, -Math.cos(a) * 0.55);
    logs.add(log);
  }
  g.add(logs);
  const flame = new THREE.Group();
  flame.add(mesh(new THREE.ConeGeometry(0.3, 0.9, 7), 0xff7a1a, 0, 0.5, 0, 0, 0, 0, { basic: true, opacity: 0.88 }));
  flame.add(mesh(new THREE.ConeGeometry(0.17, 0.6, 6), 0xffd34a, 0, 0.42, 0, 0, 0.5, 0, { basic: true, opacity: 0.95 }));
  g.add(flame);
  const embers = mesh(new THREE.CircleGeometry(0.42, 10), 0x3a2418, 0, 0.03, 0, -Math.PI / 2, 0, 0, { tex: TEX.DIRT, density: 4 });
  g.add(embers);
  g.userData = { flame, embers, logs };
  return g;
}

export function makeShelter() {
  const g = new THREE.Group();
  const bark = { tex: TEX.BARK, density: 2 };
  g.add(mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.0, 6), WOOD, -1.3, 1.0, 1.0, 0, 0, 0, bark));
  g.add(mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.0, 6), WOOD, 1.3, 1.0, 1.0, 0, 0, 0, bark));
  g.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.0, 6), WOOD, 0, 1.95, 1.0, 0, 0, Math.PI / 2, bark));
  const len = Math.hypot(2.3, 1.95);
  const tilt = Math.atan2(2.3, 1.95);
  for (let i = 0; i < 7; i++) {
    const x = -1.2 + i * 0.4;
    g.add(mesh(new THREE.CylinderGeometry(0.07, 0.08, len, 5), 0x765236, x, 0.98, -0.15, tilt, 0, 0, bark));
  }
  const leaves = mesh(new THREE.BoxGeometry(3.0, 0.18, len), 0x3e6e2e, 0, 0.98, -0.15, -Math.atan2(1.95, 2.3), 0, 0, { tex: TEX.LEAVES, density: 1.5 });
  leaves.translateY(0.12);
  g.add(leaves);
  g.add(mesh(new THREE.BoxGeometry(0.9, 0.1, 1.7), 0x8b6a4a, 0, 0.06, 0.0, 0, 0, 0, { tex: TEX.FUR, density: 2 }));
  g.add(mesh(new THREE.BoxGeometry(0.5, 0.12, 0.3), 0xb59a78, 0, 0.14, -0.6, 0, 0, 0, { tex: TEX.CLOTH, density: 3 }));
  return g;
}

// Holzzaun, 3 m breit entlang der lokalen x-Achse.
export const PALISADE_HALF = 1.5;
export function makePalisade() {
  const g = new THREE.Group();
  const bark = { tex: TEX.BARK, density: 2 };
  for (let i = 0; i < 8; i++) {
    const x = -1.4 + i * 0.4;
    const h = 1.8 + ((i * 37) % 5) * 0.06;
    g.add(mesh(new THREE.CylinderGeometry(0.13, 0.15, h, 6), WOOD, x, h / 2, 0, 0, i, 0, bark));
    g.add(mesh(new THREE.ConeGeometry(0.13, 0.35, 6), 0x7a5536, x, h + 0.17, 0, 0, i, 0, bark));
  }
  g.add(mesh(new THREE.BoxGeometry(3.1, 0.12, 0.08), PLANK, 0, 0.6, 0.17, 0, 0, 0, { tex: TEX.PLANKS, density: 2 }));
  g.add(mesh(new THREE.BoxGeometry(3.1, 0.12, 0.08), PLANK, 0, 1.3, 0.17, 0, 0, 0, { tex: TEX.PLANKS, density: 2 }));
  return g;
}

export function makeTrap() {
  const g = new THREE.Group();
  const plank = { tex: TEX.PLANKS, density: 3 };
  g.add(mesh(new THREE.BoxGeometry(0.8, 0.06, 0.8), PLANK, 0, 0.03, 0, 0, 0, 0, plank));
  g.add(mesh(new THREE.BoxGeometry(0.06, 0.4, 0.8), PLANK, -0.37, 0.23, 0, 0, 0, 0, plank));
  g.add(mesh(new THREE.BoxGeometry(0.06, 0.4, 0.8), PLANK, 0.37, 0.23, 0, 0, 0, 0, plank));
  g.add(mesh(new THREE.BoxGeometry(0.8, 0.4, 0.06), PLANK, 0, 0.23, -0.37, 0, 0, 0, plank));
  const lid = mesh(new THREE.BoxGeometry(0.8, 0.06, 0.06), PLANK, 0, 0.5, 0.37, 0, 0, 0, plank);
  g.add(lid);
  const stick = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4), WOOD, 0, 0.45, 0.3, 0.6, 0, 0, { tex: TEX.BARK, density: 4 });
  g.add(stick);
  const bunny = new THREE.Group();
  bunny.add(mesh(new THREE.BoxGeometry(0.22, 0.2, 0.32), 0x9b8a72, 0, 0.16, 0, 0, 0, 0, { tex: TEX.FUR, density: 4 }));
  bunny.add(mesh(new THREE.BoxGeometry(0.15, 0.15, 0.15), 0x9b8a72, 0, 0.3, 0.14, 0, 0, 0, { tex: TEX.FUR, density: 4 }));
  bunny.add(mesh(new THREE.BoxGeometry(0.04, 0.16, 0.06), 0x9b8a72, 0.04, 0.44, 0.12, 0, 0, 0, { tex: TEX.FUR, density: 4 }));
  bunny.add(mesh(new THREE.BoxGeometry(0.04, 0.16, 0.06), 0x9b8a72, -0.04, 0.44, 0.12, 0, 0, 0, { tex: TEX.FUR, density: 4 }));
  bunny.visible = false;
  g.add(bunny);
  g.userData = { bunny, stick };
  return g;
}

export const STRUCTURE_BUILDERS = { campfire: makeCampfire, shelter: makeShelter, palisade: makePalisade, trap: makeTrap };

export function makeArrow() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.75, 4), 0x8a6440, 0, 0, 0, Math.PI / 2, 0, 0, { tex: TEX.PLANKS, density: 6 }));
  g.add(mesh(new THREE.ConeGeometry(0.035, 0.1, 4), STONE, 0, 0, -0.42, -Math.PI / 2, 0, 0, { tex: TEX.STONE, density: 6 }));
  g.add(mesh(new THREE.BoxGeometry(0.005, 0.07, 0.12), 0xeeeeee, 0, 0, 0.33, 0, 0, 0, { tex: TEX.FLAT }));
  g.add(mesh(new THREE.BoxGeometry(0.07, 0.005, 0.12), 0xeeeeee, 0, 0, 0.33, 0, 0, 0, { tex: TEX.FLAT }));
  return g;
}

export function makeBobber() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.SphereGeometry(0.06, 6, 4), 0xe03030, 0, 0.02, 0, 0, 0, 0, { tex: TEX.FLAT }));
  g.add(mesh(new THREE.SphereGeometry(0.061, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2), 0xffffff, 0, 0.025, 0, 0, 0, 0, { tex: TEX.FLAT }));
  return g;
}

// ---------- Gegenstände in der Hand ----------

export function makeViewModels() {
  const V = {};
  const vm = (tex, density = 6) => ({ tex, density });
  const arm = () => mesh(new THREE.BoxGeometry(0.11, 0.11, 0.5), SKIN, 0, -0.02, 0.2, 0, 0, 0, vm(TEX.SKIN));
  const handle = (len = 0.62, y = 0.22) => mesh(new THREE.CylinderGeometry(0.025, 0.03, len, 6), 0x7a5532, 0, y, -0.05, 0, 0, 0, vm(TEX.BARK, 8));

  V.hand = new THREE.Group();
  V.hand.add(arm());
  V.hand.add(mesh(new THREE.BoxGeometry(0.14, 0.13, 0.14), SKIN, 0, 0, -0.07, 0, 0, 0, vm(TEX.SKIN)));

  V.axe = new THREE.Group();
  V.axe.add(arm(), handle());
  V.axe.add(mesh(new THREE.BoxGeometry(0.05, 0.12, 0.2), 0x8d8b85, 0, 0.46, -0.14, 0, 0, 0, vm(TEX.STONE, 10)));
  V.axe.add(mesh(new THREE.BoxGeometry(0.06, 0.05, 0.08), 0xc2b48c, 0, 0.46, -0.04, 0, 0, 0, vm(TEX.CLOTH, 12)));

  V.pickaxe = new THREE.Group();
  V.pickaxe.add(arm(), handle(0.66, 0.24));
  V.pickaxe.add(mesh(new THREE.BoxGeometry(0.05, 0.07, 0.46), 0x8d8b85, 0, 0.53, -0.05, 0.15, 0, 0, vm(TEX.STONE, 10)));
  V.pickaxe.add(mesh(new THREE.ConeGeometry(0.035, 0.1, 4), 0x8d8b85, 0, 0.5, -0.32, -Math.PI / 2 - 0.4, 0, 0, vm(TEX.STONE, 10)));

  V.club = new THREE.Group();
  V.club.add(arm(), handle(0.4, 0.12));
  V.club.add(mesh(new THREE.CylinderGeometry(0.075, 0.04, 0.38, 6), 0x6b4a2f, 0, 0.48, -0.05, 0, 0, 0, vm(TEX.BARK, 8)));

  V.spear = new THREE.Group();
  V.spear.add(arm());
  V.spear.add(mesh(new THREE.CylinderGeometry(0.022, 0.026, 1.5, 6), 0x7a5532, 0, 0.05, -0.35, Math.PI / 2 - 0.25, 0, 0, vm(TEX.BARK, 8)));
  V.spear.add(mesh(new THREE.ConeGeometry(0.045, 0.22, 4), 0x8d8b85, 0, 0.24, -1.12, -Math.PI / 2 - 0.25, 0, 0, vm(TEX.STONE, 10)));

  V.bow = new THREE.Group();
  V.bow.add(arm());
  const limb = mesh(new THREE.TorusGeometry(0.42, 0.018, 4, 14, Math.PI * 0.75), 0x7a5532, 0.06, 0.1, -0.12, 0, Math.PI / 2, Math.PI * 0.625, vm(TEX.PLANKS, 10));
  V.bow.add(limb);
  V.bow.add(mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.78, 3), 0xeeeeee, -0.09, 0.1, -0.12, 0, 0, 0, vm(TEX.FLAT)));
  const nocked = makeArrow();
  nocked.position.set(-0.08, 0.1, -0.2);
  V.bow.add(nocked);
  V.bow.userData.arrow = nocked;

  V.rod = new THREE.Group();
  V.rod.add(arm());
  V.rod.add(mesh(new THREE.CylinderGeometry(0.012, 0.025, 1.4, 5), 0x7a5532, 0, 0.35, -0.45, -0.9, 0, 0, vm(TEX.BARK, 8)));
  V.rod.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.06, 8), 0x555555, 0.04, 0.02, -0.04, 0, 0, Math.PI / 2, vm(TEX.STONE, 10)));

  V.torch = new THREE.Group();
  V.torch.add(arm());
  V.torch.add(mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.55, 6), 0x5e3f24, 0, 0.2, -0.05, 0, 0, 0, vm(TEX.BARK, 8)));
  V.torch.add(mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.1, 6), 0x3a2418, 0, 0.47, -0.05, 0, 0, 0, vm(TEX.CLOTH, 10)));
  const tf = new THREE.Group();
  tf.add(mesh(new THREE.ConeGeometry(0.07, 0.24, 6), 0xff7a1a, 0, 0.62, -0.05, 0, 0, 0, { basic: true, opacity: 0.9 }));
  tf.add(mesh(new THREE.ConeGeometry(0.04, 0.15, 6), 0xffe070, 0, 0.58, -0.05, 0, 0, 0, { basic: true }));
  V.torch.add(tf);
  V.torch.userData.flame = tf;

  const held = (...parts) => {
    const g = new THREE.Group();
    g.add(arm(), ...parts);
    return g;
  };
  V.berries = held(mesh(new THREE.IcosahedronGeometry(0.09, 1), 0x3a2a7a, 0, 0.08, -0.08, 0, 0, 0, vm(TEX.LEAVES, 10)));
  V.mushroom = held(mesh(new THREE.ConeGeometry(0.1, 0.1, 8), 0x9b5a2e, 0, 0.12, -0.08, 0, 0, 0, vm(TEX.NOISE, 10)),
    mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.1, 6), 0xeee6d0, 0, 0.05, -0.08, 0, 0, 0, vm(TEX.NOISE, 10)));
  V.rawMeat = held(mesh(new THREE.BoxGeometry(0.18, 0.08, 0.14), 0xc0444a, 0, 0.08, -0.08, 0, 0, 0, vm(TEX.NOISE, 10)));
  V.cookedMeat = held(mesh(new THREE.BoxGeometry(0.18, 0.09, 0.14), 0x7a3f1e, 0, 0.08, -0.08, 0, 0, 0, vm(TEX.NOISE, 10)));
  const fish = color => held(
    mesh(new THREE.BoxGeometry(0.06, 0.08, 0.22), color, 0, 0.08, -0.08, 0, 0, 0, vm(TEX.WATER, 12)),
    mesh(new THREE.BoxGeometry(0.02, 0.08, 0.06), color, 0, 0.08, 0.06, 0, 0, 0, vm(TEX.WATER, 12)));
  V.rawFish = fish(0x8aa0b0);
  V.cookedFish = fish(0xb07a40);
  V.soup = held(mesh(new THREE.CylinderGeometry(0.1, 0.07, 0.08, 8), 0x6b4a2f, 0, 0.06, -0.08, 0, 0, 0, vm(TEX.PLANKS, 10)),
    mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.01, 8), 0xa8743a, 0, 0.1, -0.08, 0, 0, 0, vm(TEX.NOISE, 10)));
  V.juice = held(mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.14, 8), 0x8a2a5a, 0, 0.08, -0.08, 0, 0, 0, vm(TEX.NOISE, 10)));
  V.water = held(mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.2, 8), 0x6a5236, 0, 0.08, -0.08, 0, 0, 0, vm(TEX.FUR, 10)));
  V.bandage = held(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 8), 0xf0ece0, 0, 0.08, -0.08, 0, 0, Math.PI / 2, vm(TEX.CLOTH, 12)));

  const mini = (builder, scale) => {
    const g = new THREE.Group();
    g.add(arm());
    const m = builder();
    if (m.userData.flame) m.userData.flame.visible = false;
    m.scale.setScalar(scale);
    m.position.set(0, 0.04, -0.1);
    g.add(m);
    return g;
  };
  V.campfire = mini(makeCampfire, 0.22);
  V.shelter = mini(makeShelter, 0.07);
  V.palisade = mini(makePalisade, 0.08);
  V.trap = mini(makeTrap, 0.25);

  for (const k in V) {
    V[k].traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  }
  return V;
}

// Halbtransparente Vorschau für das Platzieren von Bauten.
export function makeGhost(builder) {
  const g = builder();
  const mat = new THREE.MeshBasicMaterial({ color: 0x80ff80, transparent: true, opacity: 0.4, depthWrite: false });
  g.traverse(o => { if (o.isMesh) { o.material = mat; o.castShadow = false; } });
  g.userData.ghostMat = mat;
  return g;
}
