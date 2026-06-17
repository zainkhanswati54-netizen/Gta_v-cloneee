import * as THREE from 'three';
import { SETTINGS } from '../config/settings.js';

export class PlayerCamera {
  constructor(camera, input) {
    this.camera = camera;
    this.input = input;
    this.yaw = 0;
    this.pitch = 0;
  }

  updateLook() {
    if (!this.input.locked) return this.yaw;
    this.yaw -= this.input.mouseDX * 0.0022;
    this.pitch = Math.max(-0.45, Math.min(0.45, this.pitch - this.input.mouseDY * 0.0022));
    return this.yaw;
  }

  follow(target) {
    const cfg = SETTINGS.camera;
    const offset = new THREE.Vector3(
      -Math.sin(this.yaw) * Math.cos(this.pitch) * cfg.distance,
      cfg.height + Math.sin(this.pitch) * 5,
      -Math.cos(this.yaw) * Math.cos(this.pitch) * cfg.distance
    );
    const desired = target.clone().add(offset);
    this.camera.position.lerp(desired, cfg.lerp);
    this.camera.lookAt(target.clone().add(new THREE.Vector3(0, 1.4, 0)));
  }
}
