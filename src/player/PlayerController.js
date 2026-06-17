import * as THREE from 'three';
import { SETTINGS } from '../config/settings.js';

export class PlayerController {
  constructor(playerGroup, input) {
    this.playerGroup = playerGroup;
    this.input = input;
    this.yaw = 0;
  }

  update(dt, collisionCheck, worldHalf) {
    const cfg = SETTINGS.player;
    const running = this.input.isDown('run');
    const speed = (running ? cfg.runSpeed : cfg.walkSpeed) * dt;

    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    let nx = this.playerGroup.position.x;
    let nz = this.playerGroup.position.z;
    let moved = false;

    if (this.input.isDown('forward')) { nx += forward.x * speed; nz += forward.z * speed; moved = true; }
    if (this.input.isDown('backward')) { nx -= forward.x * speed; nz -= forward.z * speed; moved = true; }
    if (this.input.isDown('left')) { nx -= right.x * speed; nz -= right.z * speed; moved = true; }
    if (this.input.isDown('right')) { nx += right.x * speed; nz += right.z * speed; moved = true; }

    nx = Math.max(-worldHalf + 2, Math.min(worldHalf - 2, nx));
    nz = Math.max(-worldHalf + 2, Math.min(worldHalf - 2, nz));

    if (!collisionCheck(nx, nz, cfg.collisionRadius)) {
      this.playerGroup.position.x = nx;
      this.playerGroup.position.z = nz;
    }

    this.playerGroup.rotation.y = this.yaw;
    return { moved, running };
  }
}
