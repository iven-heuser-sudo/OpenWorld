// Tiere: Rehe und Hasen (scheu), Wölfe (feindlich, besonders nachts).
import * as THREE from 'three';
import { WATER_LEVEL } from './world.js';

export const ANIMALS = {
  deer:   { name: 'Reh',  hp: 6, walk: 1.6, run: 8.0, drops: { rawMeat: 3, hide: 1 }, radius: 0.6, height: 1.7, passive: true },
  rabbit: { name: 'Hase', hp: 2, walk: 1.3, run: 6.5, drops: { rawMeat: 1 }, radius: 0.3, height: 0.5, passive: true },
  wolf:   { name: 'Wolf', hp: 9, walk: 1.8, run: 6.6, drops: { rawMeat: 2, hide: 2 }, radius: 0.55, height: 1.1, damage: 9 },
};

function box(parent, mats, w, h, d, color, x, y, z, emissive) {
  const mat = new THREE.MeshLambertMaterial({ color, emissive: emissive || 0x000000 });
  mats.push(mat);
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  parent.add(m);
  return m;
}

function leg(parent, mats, w, len, color, x, y, z) {
  const pivot = new THREE.Group();
  pivot.position.set(x, y, z);
  box(pivot, mats, w, len, w, color, 0, -len / 2, 0);
  parent.add(pivot);
  return pivot;
}

function buildModel(type) {
  const g = new THREE.Group();
  const mats = [];
  const legs = [];
  if (type === 'deer') {
    const c = 0x9a6a3f;
    box(g, mats, 0.5, 0.55, 1.25, c, 0, 1.05, 0);
    box(g, mats, 0.44, 0.2, 1.0, 0xc49a6c, 0, 0.82, 0);
    const neck = box(g, mats, 0.22, 0.65, 0.24, c, 0, 1.45, 0.55);
    neck.rotation.x = 0.45;
    box(g, mats, 0.26, 0.28, 0.48, c, 0, 1.78, 0.78);
    box(g, mats, 0.1, 0.1, 0.1, 0x1a1a1a, 0, 1.74, 1.03);
    box(g, mats, 0.06, 0.22, 0.12, c, 0.13, 1.98, 0.68);
    box(g, mats, 0.06, 0.22, 0.12, c, -0.13, 1.98, 0.68);
    box(g, mats, 0.14, 0.16, 0.08, 0xf0ece0, 0, 1.18, -0.66);
    legs.push(leg(g, mats, 0.11, 0.85, 0x7a5230, 0.17, 0.85, 0.48), leg(g, mats, 0.11, 0.85, 0x7a5230, -0.17, 0.85, 0.48));
    legs.push(leg(g, mats, 0.11, 0.85, 0x7a5230, 0.17, 0.85, -0.48), leg(g, mats, 0.11, 0.85, 0x7a5230, -0.17, 0.85, -0.48));
  } else if (type === 'wolf') {
    const c = 0x6c6c70;
    box(g, mats, 0.44, 0.45, 1.1, c, 0, 0.72, 0);
    box(g, mats, 0.5, 0.5, 0.4, 0x7a7a7e, 0, 0.78, 0.35);
    box(g, mats, 0.32, 0.3, 0.36, c, 0, 0.98, 0.68);
    box(g, mats, 0.16, 0.14, 0.24, 0x4e4e52, 0, 0.92, 0.95);
    box(g, mats, 0.06, 0.06, 0.04, 0x111111, 0, 0.97, 1.07);
    box(g, mats, 0.08, 0.16, 0.06, c, 0.1, 1.18, 0.6);
    box(g, mats, 0.08, 0.16, 0.06, c, -0.1, 1.18, 0.6);
    box(g, mats, 0.05, 0.04, 0.02, 0xffd040, 0.09, 1.03, 0.865, 0x806010);
    box(g, mats, 0.05, 0.04, 0.02, 0xffd040, -0.09, 1.03, 0.865, 0x806010);
    const tail = box(g, mats, 0.1, 0.1, 0.55, 0x5a5a5e, 0, 0.75, -0.75);
    tail.rotation.x = 0.6;
    legs.push(leg(g, mats, 0.11, 0.55, 0x5a5a5e, 0.14, 0.55, 0.38), leg(g, mats, 0.11, 0.55, 0x5a5a5e, -0.14, 0.55, 0.38));
    legs.push(leg(g, mats, 0.11, 0.55, 0x5a5a5e, 0.14, 0.55, -0.38), leg(g, mats, 0.11, 0.55, 0x5a5a5e, -0.14, 0.55, -0.38));
  } else {
    const c = 0x9b8a72;
    box(g, mats, 0.26, 0.24, 0.42, c, 0, 0.24, 0);
    box(g, mats, 0.2, 0.2, 0.22, c, 0, 0.38, 0.22);
    box(g, mats, 0.05, 0.22, 0.08, c, 0.05, 0.58, 0.18);
    box(g, mats, 0.05, 0.22, 0.08, c, -0.05, 0.58, 0.18);
    box(g, mats, 0.1, 0.1, 0.08, 0xf5f5f0, 0, 0.3, -0.24);
    legs.push(leg(g, mats, 0.06, 0.14, c, 0.08, 0.14, 0.14), leg(g, mats, 0.06, 0.14, c, -0.08, 0.14, 0.14));
    legs.push(leg(g, mats, 0.08, 0.14, c, 0.08, 0.14, -0.12), leg(g, mats, 0.08, 0.14, c, -0.08, 0.14, -0.12));
  }
  return { group: g, mats, legs };
}

const HURT_COLOR = new THREE.Color(0xff2020);
const BLACK = new THREE.Color(0x000000);

export class Animals {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.list = [];
    this.spawnTimer = 0;
    this.howlTimer = 20;
  }

  clear() {
    for (const a of this.list) this.removeModel(a);
    this.list = [];
  }

  removeModel(a) {
    this.scene.remove(a.group);
    a.group.traverse(o => { if (o.isMesh) o.geometry.dispose(); });
    for (const m of a.mats) m.dispose();
  }

  spawn(type, x, z) {
    const def = ANIMALS[type];
    const { group, mats, legs } = buildModel(type);
    const a = {
      type, def, group, mats, legs, x, z, y: this.world.height(x, z),
      dir: Math.random() * Math.PI * 2, hp: def.hp, timer: 0, tx: null, tz: null,
      hurt: 0, flee: 0, dead: false, deadT: 0, attackCD: 0, phase: 0, speed: 0,
    };
    group.position.set(x, a.y, z);
    this.scene.add(group);
    this.list.push(a);
    return a;
  }

  trySpawn(p, night) {
    const counts = { deer: 0, rabbit: 0, wolf: 0 };
    for (const a of this.list) if (!a.dead) counts[a.type]++;
    const want = { deer: 6, rabbit: 5, wolf: night ? 5 : 1 };
    for (const type in want) {
      if (counts[type] >= want[type]) continue;
      const ang = Math.random() * Math.PI * 2;
      const d = (type === 'wolf' && night ? 45 : 55) + Math.random() * 40;
      const x = p.x + Math.cos(ang) * d, z = p.z + Math.sin(ang) * d;
      const h = this.world.height(x, z);
      if (h < WATER_LEVEL + 0.6 || h > 40) continue;
      this.spawn(type, x, z);
      if (type === 'wolf' && night && counts.wolf + 1 < want.wolf && Math.random() < 0.6) this.spawn('wolf', x + 2, z + 1.5);
      if (type === 'rabbit' && Math.random() < 0.5) this.spawn('rabbit', x + 1.5, z - 1);
      return;
    }
  }

  damage(a, amount, fromX, fromZ) {
    if (a.dead) return null;
    a.hp -= amount;
    a.hurt = 0.25;
    a.flee = 4;
    const dx = a.x - fromX, dz = a.z - fromZ, d = Math.hypot(dx, dz) || 1;
    a.x += (dx / d) * 0.4; a.z += (dz / d) * 0.4;
    if (a.hp <= 0) {
      a.dead = true;
      return a.def.drops;
    }
    return null;
  }

  update(dt, game) {
    const p = game.player.pos;
    const night = game.isNight();
    const w = this.world;

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = 1.5;
      this.trySpawn(p, night);
    }
    if (night) {
      this.howlTimer -= dt;
      if (this.howlTimer <= 0) {
        this.howlTimer = 25 + Math.random() * 40;
        if (this.list.some(a => a.type === 'wolf' && !a.dead)) game.sound.play('howl');
      }
    }

    for (let i = this.list.length - 1; i >= 0; i--) {
      const a = this.list[i];
      const dx = a.x - p.x, dz = a.z - p.z;
      const dist = Math.hypot(dx, dz) || 0.001;
      if (dist > 150) { this.removeModel(a); this.list.splice(i, 1); continue; }

      if (a.dead) {
        a.deadT += dt;
        a.group.rotation.z = Math.min(1, a.deadT * 3) * (Math.PI / 2);
        if (a.deadT > 1.5) a.group.position.y -= dt * 0.8;
        if (a.deadT > 3) { this.removeModel(a); this.list.splice(i, 1); }
        continue;
      }

      if (a.hurt > 0) {
        a.hurt -= dt;
        for (const m of a.mats) m.emissive.copy(a.hurt > 0 ? HURT_COLOR : BLACK);
      }

      let mx = 0, mz = 0, speed = 0;
      const away = () => { mx = dx / dist; mz = dz / dist; };
      const wander = () => {
        a.timer -= dt;
        if (a.timer <= 0) {
          a.timer = 3 + Math.random() * 5;
          if (Math.random() < 0.4) { a.tx = null; }
          else {
            const ang = Math.random() * Math.PI * 2, r = 5 + Math.random() * 12;
            a.tx = a.x + Math.cos(ang) * r; a.tz = a.z + Math.sin(ang) * r;
          }
        }
        if (a.tx !== null) {
          const tx = a.tx - a.x, tz = a.tz - a.z, td = Math.hypot(tx, tz);
          if (td < 0.6) a.tx = null;
          else { mx = tx / td; mz = tz / td; speed = a.def.walk; }
        }
      };

      if (a.def.passive) {
        const fear = (game.player.sprinting ? 24 : 13) * (a.type === 'rabbit' ? 0.6 : 1);
        if (dist < fear) a.flee = Math.max(a.flee, 2.5);
        if (a.flee > 0) { a.flee -= dt; away(); speed = a.def.run; }
        else wander();
      } else {
        a.attackCD -= dt;
        const fire = game.nearestFire(a.x, a.z);
        const playerSafe = game.playerNearFire(7);
        const aggro = night ? 40 : 18;
        if (fire && fire.d < 10) {
          mx = (a.x - fire.x) / fire.d; mz = (a.z - fire.z) / fire.d; speed = a.def.walk * 2;
        } else if (a.hp <= 3 && a.flee > 0) {
          a.flee -= dt; away(); speed = a.def.run;
        } else if (dist < aggro && !game.dead) {
          if (playerSafe && dist < 14) {
            mx = -dz / dist + dx / dist * 0.5; mz = dx / dist + dz / dist * 0.5; speed = a.def.walk;
          } else if (dist > 1.7) {
            mx = -dx / dist; mz = -dz / dist; speed = a.def.run;
          } else {
            mx = -dx / dist * 0.01; mz = -dz / dist * 0.01;
            if (a.attackCD <= 0) {
              a.attackCD = 1.25;
              game.damagePlayer(a.def.damage, 'Von einem Wolf zerrissen');
              game.sound.play('growl');
            }
          }
        } else {
          a.flee = 0;
          wander();
        }
      }

      if (speed > 0) {
        const nx = a.x + mx * speed * dt, nz = a.z + mz * speed * dt;
        const g = w.height(nx, nz);
        if (g < WATER_LEVEL + 0.2 || g - a.y > 1.0) {
          a.tx = null; a.timer = 0;
          const side = Math.random() < 0.5 ? 1 : -1;
          a.x += -mz * side * speed * dt; a.z += mx * side * speed * dt;
        } else {
          a.x = nx; a.z = nz;
        }
        w.collide(a, a.def.radius * 0.6);
      }
      if (mx || mz) {
        const target = Math.atan2(mx, mz);
        let diff = target - a.dir;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        a.dir += diff * Math.min(1, dt * 8);
      }
      a.speed = speed;
      a.y = w.height(a.x, a.z);
      a.phase += speed * dt * 2.4;
      const amp = Math.min(0.75, speed * 0.14);
      a.legs.forEach((l, k) => { l.rotation.x = Math.sin(a.phase + (k === 0 || k === 3 ? 0 : Math.PI)) * amp; });
      a.group.position.set(a.x, a.y, a.z);
      a.group.rotation.y = a.dir;
    }
  }
}
