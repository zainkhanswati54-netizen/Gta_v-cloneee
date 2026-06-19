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

    // Determine if we're currently moving forward or backward relative to facing angle,
    // so steering feels correct in reverse (turning the wheel left while reversing
    // should swing the rear the opposite way visually, same as real driving).
    const facingX = Math.sin(this.angle);
    const facingZ = Math.cos(this.angle);
    const movingForward = (this.vx * facingX + this.vz * facingZ) >= 0;
    const steerDirection = movingForward ? 1 : -1;

    const steerFactor = Math.min(this.speed / cfg.minSteerSpeed, 1);
    if (input.left) this.angle += cfg.steerRate * steerFactor * steerDirection;
    if (input.right) this.angle -= cfg.steerRate * steerFactor * steerDirection;

    this.vx += Math.sin(this.angle) * accel;
    this.vz += Math.cos(this.angle) * accel;

    let frictionFactor = cfg.friction;
    if (input.handbrake) frictionFactor = cfg.handbrakeFriction;
    else if (!input.forward && !input.backward && this.speed > 0.01) frictionFactor = cfg.brakeFriction;

    this.vx *= frictionFactor;
    this.vz *= frictionFactor;

    const newSpeed = Math.sqrt(this.vx * this.vx + this.vz * this.vz);
    if (newSpeed > cfg.maxSpeed) {
      const scale = cfg.maxSpeed / newSpeed;
      this.vx *= scale;
      this.vz *= scale;
    }

    // Handbrake adds a touch of lateral slide for a more arcade drift feel.
    if (input.handbrake && this.speed > 0.15) {
      const lateralX = Math.cos(this.angle);
      const lateralZ = -Math.sin(this.angle);
      const slideAmount = this.speed * 0.06 * (input.left ? -1 : input.right ? 1 : 0);
      this.vx += lateralX * slideAmount;
      this.vz += lateralZ * slideAmount;
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
