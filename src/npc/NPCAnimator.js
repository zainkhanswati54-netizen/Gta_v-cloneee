export class NPCAnimator {
  constructor(parts) {
    this.parts = parts;
    this.phase = Math.random() * 10;
  }

  update(dt, moving) {
    if (!moving) return;
    this.phase += 0.18 * dt;
    const swing = Math.sin(this.phase) * 0.5;
    this.parts.leftLeg.rotation.x = swing;
    this.parts.rightLeg.rotation.x = -swing;
    this.parts.leftArm.rotation.x = -swing * 0.7;
    this.parts.rightArm.rotation.x = swing * 0.7;
  }
}
