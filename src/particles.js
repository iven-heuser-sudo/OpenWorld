// Kleine Partikel: Holzspäne, Steinsplitter, Blut, Funken.
import * as THREE from 'three';

const MAX = 400;
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _c = new THREE.Color();

export class Particles {
  constructor(scene) {
    this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 0.07, 0.07), new THREE.MeshLambertMaterial(), MAX);
    this.mesh.frustumCulled = false;
    for (let i = 0; i < MAX; i++) this.mesh.setColorAt(i, _c.set(0xffffff));
    this.mesh.count = 0;
    scene.add(this.mesh);
    this.list = [];
  }

  emit(x, y, z, color, count = 8, speed = 3, gravity = 12) {
    for (let i = 0; i < count && this.list.length < MAX; i++) {
      this.list.push({
        x, y, z,
        vx: (Math.random() - 0.5) * speed, vy: Math.random() * speed * 0.9 + 0.5, vz: (Math.random() - 0.5) * speed,
        life: 0.5 + Math.random() * 0.5, max: 1, gravity,
        color: _c.set(color).clone().multiplyScalar(0.8 + Math.random() * 0.4),
      });
    }
  }

  update(dt) {
    const l = this.list;
    for (let i = l.length - 1; i >= 0; i--) {
      const p = l[i];
      p.life -= dt;
      if (p.life <= 0) { l[i] = l[l.length - 1]; l.pop(); continue; }
      p.vy -= p.gravity * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    }
    for (let i = 0; i < l.length; i++) {
      const p = l[i];
      _m.compose(_p.set(p.x, p.y, p.z), _q, _s.setScalar(Math.min(1, p.life * 2)));
      this.mesh.setMatrixAt(i, _m);
      this.mesh.setColorAt(i, p.color);
    }
    this.mesh.count = l.length;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}
