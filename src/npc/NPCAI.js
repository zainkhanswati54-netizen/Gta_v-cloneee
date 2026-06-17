import { distance2D, angleTo } from '../utils/MathUtils.js';
import { SETTINGS } from '../config/settings.js';

export class NPCAI {
  constructor() {
    this.fireTimer = 0;
  }

  update(npcGroup, targetPos, dt) {
    const dist = distance2D(npcGroup.position.x, npcGroup.position.z, targetPos.x, targetPos.z);
    const cfg = SETTINGS.npc;
    let moving = false;
    let shouldFire = false;

    if (dist < cfg.detectRadius && dist > cfg.attackRadius * 0.4) {
      const angle = angleTo(npcGroup.position.x, npcGroup.position.z, targetPos.x, targetPos.z);
      npcGroup.rotation.y = angle;
      npcGroup.position.x += Math.sin(angle) * cfg.chaseSpeed * dt;
      npcGroup.position.z += Math.cos(angle) * cfg.chaseSpeed * dt;
      moving = true;
    } else if (dist <= cfg.attackRadius * 0.4) {
      const angle = angleTo(npcGroup.position.x, npcGroup.position.z, targetPos.x, targetPos.z);
      npcGroup.rotation.y = angle;
    }

    this.fireTimer += dt;
    if (dist < cfg.attackRadius && this.fireTimer > cfg.fireCooldown) {
      this.fireTimer = 0;
      shouldFire = true;
    }

    return { moving, shouldFire, dist };
  }
}
