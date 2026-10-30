// Ego-Perspektive: Bewegung, Springen, Schwimmen, Kollision.
import * as THREE from 'three';
import { WATER_LEVEL } from './world.js';

export const EYE_HEIGHT = 1.65;

export class Player {
  constructor(camera, world) {
    this.camera = camera;
    this.world = world;
    this.pos = new THREE.Vector3();
    this.vy = 0;
    this.yaw = 0;
    this.pitch = 0;
    this.onGround = false;
    this.swimming = false;
    this.wading = false;
    this.sprinting = false;
    this.moving = false;
    this.bob = 0;
    this.radius = 0.35;
  }

  look(dx, dy) {
    this.yaw -= dx * 0.0022;
    this.pitch -= dy * 0.0022;
    this.pitch = Math.max(-1.5, Math.min(1.5, this.pitch));
  }

  // Liefert die Aufprallgeschwindigkeit bei einer Landung (für Fallschaden).
  update(dt, keys, canSprint) {
    const w = this.world;
    let fx = 0, fz = 0;
    if (keys.KeyW || keys.ArrowUp) fz += 1;
    if (keys.KeyS || keys.ArrowDown) fz -= 1;
    if (keys.KeyA || keys.ArrowLeft) fx -= 1;
    if (keys.KeyD || keys.ArrowRight) fx += 1;
    if (keys.axisX || keys.axisY) { fx += keys.axisX; fz += keys.axisY; }
    let len = Math.hypot(fx, fz);
    this.moving = len > 0;
    this.sprinting = this.moving && (keys.ShiftLeft || keys.ShiftRight) && canSprint && !this.swimming && fz > 0;

    let speed = 4.3;
    if (this.sprinting) speed = 7.4;
    if (this.swimming) speed = 2.4;
    else if (this.wading) speed *= 0.65;

    if (len > 0) {
      if (len > 1) { fx /= len; fz /= len; }
      const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
      const dx = (-sin * fz + cos * fx) * speed * dt;
      const dz = (-cos * fz - sin * fx) * speed * dt;
      const cur = w.height(this.pos.x, this.pos.z);
      const tooSteep = (nx, nz) => {
        if (this.swimming || !this.onGround) return false;
        const d = Math.hypot(nx - this.pos.x, nz - this.pos.z) || 1e-4;
        return (w.height(nx, nz) - cur) / d > 1.6;
      };
      if (!tooSteep(this.pos.x + dx, this.pos.z + dz)) {
        this.pos.x += dx; this.pos.z += dz;
      } else if (!tooSteep(this.pos.x + dx, this.pos.z)) {
        this.pos.x += dx;
      } else if (!tooSteep(this.pos.x, this.pos.z + dz)) {
        this.pos.z += dz;
      }
      w.collide(this.pos, this.radius);
    }

    let landing = 0;
    const ground = w.height(this.pos.x, this.pos.z);
    const depth = WATER_LEVEL - ground;
    this.wading = depth > 0.4 && depth <= 1.4;
    if (depth > 1.4 && this.pos.y < WATER_LEVEL - 1.0) {
      this.swimming = true;
      const target = WATER_LEVEL - 1.45 + Math.sin(performance.now() / 600) * 0.05;
      this.pos.y += (target - this.pos.y) * Math.min(1, dt * 4);
      this.vy = 0;
      this.onGround = false;
    } else {
      this.swimming = false;
      this.vy -= 24 * dt;
      if (keys.Space && this.onGround) {
        this.vy = 7.8;
        this.onGround = false;
      }
      this.pos.y += this.vy * dt;
      if (this.pos.y <= ground) {
        if (!this.onGround) landing = -this.vy;
        this.pos.y = ground;
        this.vy = 0;
        this.onGround = true;
      } else if (this.onGround && this.vy <= 0 && this.pos.y - ground < 0.7) {
        this.pos.y = ground;
        this.vy = 0;
      } else {
        this.onGround = false;
      }
    }

    if (this.moving && (this.onGround || this.swimming)) this.bob += dt * speed * 1.7;
    const bobY = this.moving && this.onGround ? Math.sin(this.bob * 2) * 0.045 : 0;
    this.camera.position.set(this.pos.x, this.pos.y + EYE_HEIGHT + bobY, this.pos.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    return landing;
  }
}
