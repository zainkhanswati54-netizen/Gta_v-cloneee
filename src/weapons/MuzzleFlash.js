import * as THREE from 'three';
import { emissiveMaterial } from '../utils/MaterialFactory.js';
import { PALETTE } from '../config/colors.js';

export class MuzzleFlash {
  constructor() {
    this.mat = emissiveMaterial(PALETTE.muzzleFlash, 3);
    this.active = [];
  }

  spawn(scene, position) {
    const geo = new THREE.SphereGeometry(0.18, 8, 8);
    const mesh = new THREE.Mesh(geo, this.mat);
    mesh.position.copy(position);
    scene.add(mesh);
    this.active.push({ mesh, life: 4 });
  }

  update(dt, scene) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const f = this.active[i];
      f.life -= dt;
      f.mesh.scale.multiplyScalar(0.85);
      if (f.life <= 0) {
        scene.remove(f.mesh);
        this.active.splice(i, 1);
      }
    }
  }
}
