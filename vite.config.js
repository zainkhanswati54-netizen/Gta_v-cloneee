import { SETTINGS } from '../config/settings.js';

export class CarPhysics {
  constructor() {
    this.vx = 0;
    this.vz = 0;
    this.angle = 0;
    this.speed = 0;
  }

  step(input, collisionCheck, currentX, currentZ) {
    const cfg = SETTINGS.car;
    let accel = 0;
    if (input.forward) accel = cfg.accel;
    if (input.backward) accel = -cfg.reverseAccel;

    this.speed = Math.sqrt(this.vx * this.vx + this.vz * this.vz);
    const steerFactor = Math.min(this.speed / 0.3, 1);

    if (input.left) this.angle += cfg.steerRate * steerFactor;
    if (input.right) this.angle -= cfg.steerRate * steerFactor;

    this.vx += Math.sin(this.angle) * accel;
    this.vz += Math.cos(this.angle) * accel;

    this.vx *= cfg.friction;
    this.vz *= cfg.friction;

    const newSpeed = Math.sqrt(this.vx * this.vx + this.vz * this.vz);
    if (newSpeed > cfg.maxSpeed) {
      const scale = cfg.maxSpeed / newSpeed;
      this.vx *= scale;
      this.vz *= scale;
    }

    const nx = currentX + this.vx;
    const nz = currentZ + this.vz;

    if (collisionCheck(nx, nz, cfg.collisionRadius)) {
      this.vx *= -0.25;
      this.vz *= -0.25;
      return { x: currentX, z: currentZ, collided: true };
    }

    return { x: nx, z: nz, collided: false };
  }
}
