import * as THREE from 'three';
import { standardMaterial } from '../utils/MaterialFactory.js';

export class ExhaustParticles {
  constructor(carGroup) {
    this.carGroup = carGroup;
    this.particles = [];
    this.mat = standardMaterial(0xaaaaaa, { roughness: 1, transparent: true, opacity: 0.4 });
    this.timer = 0;
  }

  update(dt, emitting) {
    this.timer += dt;
    if (emitting && this.timer > 6) {
      this.timer = 0;
      const geo = new THREE.SphereGeometry(0.1, 6, 6);
      const mesh = new THREE.Mesh(geo, this.mat.clone());
      const worldPos = new THREE.Vector3();
      this.carGroup.getWorldPosition(worldPos);
      const rearOffset = new THREE.Vector3(0, 0.3, -2.1).applyQuaternion(this.carGroup.quaternion);
      mesh.position.copy(worldPos).add(rearOffset);
      this.carGroup.parent.add(mesh);
      this.particles.push({ mesh, life: 40 });
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.mesh.position.y += 0.01 * dt;
      p.mesh.scale.multiplyScalar(1.02);
      p.mesh.material.opacity *= 0.95;
      p.life -= dt;
      if (p.life <= 0) {
        this.carGroup.parent.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }
}
