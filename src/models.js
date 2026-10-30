// Modelle für Bauten (Lagerfeuer, Unterschlupf) und die Gegenstände in der Hand.
import * as THREE from 'three';

function mesh(geo, color, x, y, z, rx = 0, ry = 0, rz = 0, opts = {}) {
  const mat = opts.basic
    ? new THREE.MeshBasicMaterial({ color, transparent: !!opts.opacity, opacity: opts.opacity ?? 1 })
    : new THREE.MeshLambertMaterial({ color, emissive: opts.emissive || 0x000000, flatShading: true });
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
    g.add(mesh(new THREE.DodecahedronGeometry(0.17, 0), 0x8a8780, Math.cos(a) * 0.62, 0.1, Math.sin(a) * 0.62, a, a * 2, 0));
  }
  const logs = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const log = mesh(new THREE.CylinderGeometry(0.065, 0.08, 0.95, 6), 0x5e3f24, Math.cos(a) * 0.18, 0.34, Math.sin(a) * 0.18, 0, 0, 0);
    log.rotation.set(Math.sin(a) * 0.55, 0, -Math.cos(a) * 0.55);
    logs.add(log);
  }
  g.add(logs);
  const flame = new THREE.Group();
  flame.add(mesh(new THREE.ConeGeometry(0.3, 0.9, 7), 0xff7a1a, 0, 0.5, 0, 0, 0, 0, { basic: true, opacity: 0.88 }));
  flame.add(mesh(new THREE.ConeGeometry(0.17, 0.6, 6), 0xffd34a, 0, 0.42, 0, 0, 0.5, 0, { basic: true, opacity: 0.95 }));
  g.add(flame);
  const embers = mesh(new THREE.CircleGeometry(0.42, 10), 0x3a2418, 0, 0.03, 0, -Math.PI / 2, 0, 0, { emissive: 0x000000 });
  g.add(embers);
  g.userData = { flame, embers, logs };
  return g;
}

export function makeShelter() {
  const g = new THREE.Group();
  const wood = 0x6b4a2f;
  g.add(mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.0, 6), wood, -1.3, 1.0, 1.0));
  g.add(mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.0, 6), wood, 1.3, 1.0, 1.0));
  g.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.0, 6), wood, 0, 1.95, 1.0, 0, 0, Math.PI / 2));
  const len = Math.hypot(2.3, 1.95);
  const tilt = Math.atan2(2.3, 1.95);
  for (let i = 0; i < 7; i++) {
    const x = -1.2 + i * 0.4;
    g.add(mesh(new THREE.CylinderGeometry(0.07, 0.08, len, 5), 0x765236, x, 0.98, -0.15, tilt, 0, 0));
  }
  const leaves = mesh(new THREE.BoxGeometry(3.0, 0.18, len), 0x3e6e2e, 0, 0.98, -0.15, -Math.atan2(1.95, 2.3), 0, 0);
  leaves.translateY(0.12);
  g.add(leaves);
  g.add(mesh(new THREE.BoxGeometry(0.9, 0.1, 1.7), 0x8b6a4a, 0, 0.06, 0.0));
  g.add(mesh(new THREE.BoxGeometry(0.5, 0.12, 0.3), 0xb59a78, 0, 0.14, -0.6));
  return g;
}

// ---------- Gegenstände in der Hand ----------

export function makeViewModels() {
  const skin = 0xd9a77e;
  const V = {};

  const arm = () => mesh(new THREE.BoxGeometry(0.11, 0.11, 0.5), skin, 0, -0.02, 0.2);

  V.hand = new THREE.Group();
  V.hand.add(arm());
  V.hand.add(mesh(new THREE.BoxGeometry(0.14, 0.13, 0.14), skin, 0, 0, -0.07));

  V.axe = new THREE.Group();
  V.axe.add(arm());
  V.axe.add(mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.62, 6), 0x7a5532, 0, 0.22, -0.05));
  V.axe.add(mesh(new THREE.BoxGeometry(0.05, 0.12, 0.2), 0x8d8b85, 0, 0.46, -0.14));
  V.axe.add(mesh(new THREE.BoxGeometry(0.06, 0.05, 0.08), 0xc2b48c, 0, 0.46, -0.04));

  V.pickaxe = new THREE.Group();
  V.pickaxe.add(arm());
  V.pickaxe.add(mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.66, 6), 0x7a5532, 0, 0.24, -0.05));
  V.pickaxe.add(mesh(new THREE.BoxGeometry(0.05, 0.07, 0.46), 0x8d8b85, 0, 0.53, -0.05, 0.15));
  V.pickaxe.add(mesh(new THREE.ConeGeometry(0.035, 0.1, 4), 0x8d8b85, 0, 0.5, -0.32, -Math.PI / 2 - 0.4));

  V.spear = new THREE.Group();
  V.spear.add(arm());
  V.spear.add(mesh(new THREE.CylinderGeometry(0.022, 0.026, 1.5, 6), 0x7a5532, 0, 0.05, -0.35, Math.PI / 2 - 0.25));
  V.spear.add(mesh(new THREE.ConeGeometry(0.045, 0.22, 4), 0x8d8b85, 0, 0.24, -1.12, -Math.PI / 2 - 0.25));

  V.torch = new THREE.Group();
  V.torch.add(arm());
  V.torch.add(mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.55, 6), 0x5e3f24, 0, 0.2, -0.05));
  V.torch.add(mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.1, 6), 0x3a2418, 0, 0.47, -0.05));
  const tf = new THREE.Group();
  tf.add(mesh(new THREE.ConeGeometry(0.07, 0.24, 6), 0xff7a1a, 0, 0.62, -0.05, 0, 0, 0, { basic: true, opacity: 0.9 }));
  tf.add(mesh(new THREE.ConeGeometry(0.04, 0.15, 6), 0xffe070, 0, 0.58, -0.05, 0, 0, 0, { basic: true }));
  V.torch.add(tf);
  V.torch.userData.flame = tf;

  const food = (color, geo) => {
    const g = new THREE.Group();
    g.add(arm());
    g.add(mesh(geo, color, 0, 0.08, -0.08));
    return g;
  };
  V.berries = food(0x3a2a7a, new THREE.IcosahedronGeometry(0.09, 1));
  V.mushroom = food(0x9b5a2e, new THREE.ConeGeometry(0.1, 0.1, 8));
  V.rawMeat = food(0xc0444a, new THREE.BoxGeometry(0.18, 0.08, 0.14));
  V.cookedMeat = food(0x7a3f1e, new THREE.BoxGeometry(0.18, 0.09, 0.14));
  V.water = food(0x6a5236, new THREE.CylinderGeometry(0.06, 0.07, 0.2, 8));

  V.campfire = new THREE.Group();
  V.campfire.add(arm());
  const mini = makeCampfire();
  mini.userData.flame.visible = false;
  mini.scale.setScalar(0.22);
  mini.position.set(0, 0.04, -0.1);
  V.campfire.add(mini);

  V.shelter = new THREE.Group();
  V.shelter.add(arm());
  const sm = makeShelter();
  sm.scale.setScalar(0.07);
  sm.position.set(0, 0.04, -0.1);
  V.shelter.add(sm);

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
