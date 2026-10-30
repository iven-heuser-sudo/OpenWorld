// Tag-/Nachtzyklus: Himmel, Sonne, Mond, Sterne, Licht und Nebel.
import * as THREE from 'three';

const NIGHT_SKY = new THREE.Color(0x070b18);
const DUSK_SKY = new THREE.Color(0xd7845a);
const DAY_SKY = new THREE.Color(0x8cc4ec);
const SUN_DAY = new THREE.Color(0xfff4e0);
const SUN_LOW = new THREE.Color(0xffa860);
const MOON = new THREE.Color(0x9fb4ff);

function smooth(a, b, x) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export class Environment {
  constructor(scene) {
    this.scene = scene;
    this.sky = new THREE.Color();
    scene.background = this.sky;
    scene.fog = new THREE.Fog(this.sky, 40, 180);

    this.hemi = new THREE.HemisphereLight(0xcfe6ff, 0x4a5a32, 1.0);
    scene.add(this.hemi);

    this.sun = new THREE.DirectionalLight(0xffffff, 2.5);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.left = -70; sc.right = 70; sc.top = 70; sc.bottom = -70; sc.near = 1; sc.far = 400;
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.04;
    scene.add(this.sun, this.sun.target);

    this.sunMesh = new THREE.Mesh(new THREE.SphereGeometry(14, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff1b0, fog: false }));
    this.moonMesh = new THREE.Mesh(new THREE.SphereGeometry(9, 16, 12), new THREE.MeshBasicMaterial({ color: 0xe4ecff, fog: false }));
    scene.add(this.sunMesh, this.moonMesh);

    const starGeo = new THREE.BufferGeometry();
    const n = 1400;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      arr[i * 3] = Math.cos(a) * r * 450;
      arr[i * 3 + 1] = Math.abs(u) * 450;
      arr[i * 3 + 2] = Math.sin(a) * r * 450;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    this.stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false,
    }));
    scene.add(this.stars);

    this.sunDir = new THREE.Vector3();
    this.daylight = 1;
  }

  // frac: 0 = Mitternacht, 0.25 = Sonnenaufgang, 0.5 = Mittag, 0.75 = Sonnenuntergang
  update(frac, center) {
    const ang = (frac - 0.25) * Math.PI * 2;
    this.sunDir.set(Math.cos(ang), Math.sin(ang), 0.35).normalize();
    const elev = this.sunDir.y;
    const day = smooth(-0.12, 0.25, elev);
    this.daylight = day;

    const dusk = Math.max(0, 1 - Math.abs(elev) / 0.3) * 0.75;
    this.sky.copy(NIGHT_SKY).lerp(DAY_SKY, day).lerp(DUSK_SKY, dusk * (0.4 + day * 0.6));
    this.scene.fog.color.copy(this.sky);
    this.scene.fog.near = 20 + day * 30;
    this.scene.fog.far = 100 + day * 80;

    const moonUp = elev < 0.05;
    const lightDir = moonUp ? this.sunDir.clone().negate() : this.sunDir;
    this.sun.position.copy(center).addScaledVector(lightDir, 150);
    this.sun.target.position.copy(center);
    if (moonUp) {
      this.sun.color.copy(MOON);
      this.sun.intensity = 0.35 * smooth(0.0, 0.25, -elev);
    } else {
      this.sun.color.copy(SUN_LOW).lerp(SUN_DAY, smooth(0, 0.4, elev));
      this.sun.intensity = 2.6 * smooth(0.0, 0.2, elev);
    }
    this.hemi.intensity = 0.22 + day * 1.0;
    this.hemi.color.setRGB(0.55 + day * 0.3, 0.6 + day * 0.3, 0.85 + day * 0.15);

    this.sunMesh.position.copy(center).addScaledVector(this.sunDir, 420);
    this.moonMesh.position.copy(center).addScaledVector(this.sunDir, -420);
    this.sunMesh.visible = elev > -0.15;
    this.moonMesh.visible = elev < 0.15;
    this.stars.position.copy(center);
    this.stars.material.opacity = Math.max(0, 1 - day * 1.6);
    this.stars.visible = this.stars.material.opacity > 0.01;
  }
}
