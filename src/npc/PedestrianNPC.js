import { NPC } from './NPC.js';
import { NPCAnimator } from './NPCAnimator.js';
import { PALETTE } from '../config/colors.js';
import { pick } from '../utils/RandomUtils.js';

export class PedestrianNPC extends NPC {
  constructor(x, z) {
    super(x, z, pick(PALETTE.skin), pick(PALETTE.pedestrianTones), 0x2a2a2a);
    this.animator = new NPCAnimator(this.parts);
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.wanderTimer = 0;
    this.homeX = x;
    this.homeZ = z;
  }

  update(dt) {
    this.wanderTimer += dt;
    if (this.wanderTimer > 120) {
      this.wanderTimer = 0;
      this.wanderAngle = Math.random() * Math.PI * 2;
    }
    const speed = 0.012;
    this.group.position.x += Math.sin(this.wanderAngle) * speed * dt;
    this.group.position.z += Math.cos(this.wanderAngle) * speed * dt;
    this.group.rotation.y = this.wanderAngle;

    if (Math.abs(this.group.position.x - this.homeX) > 6 || Math.abs(this.group.position.z - this.homeZ) > 6) {
      this.wanderAngle += Math.PI;
    }

    this.animator.update(dt, true);
  }
}
