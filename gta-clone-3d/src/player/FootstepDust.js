import * as THREE from 'three';
import { standardMaterial } from '../utils/MaterialFactory.js';

export class FootstepDust {
  constructor() {
    this.mat = standardMaterial(0xc9c2a8, { transparent: true, opacity: 0.35, roughness: 1 });
    this.particles = [];
    this.timer = 0;
  }

  update(dt, scene, x, z, running) {
    this.timer += dt;
    if (running && this.timer > 8) {
      this.timer = 0;
      const geo = new THREE.CircleGeometry(0.18, 6);
      const mesh = new THREE.Mesh(geo, this.mat.clone());
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, 0.03, z);
      scene.add(mesh);
      this.particles.push({ mesh, life: 25 });
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.mesh.scale.multiplyScalar(1.03);
      p.mesh.material.opacity *= 0.92;
      p.life -= dt;
      if (p.life <= 0) {
        scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }
}
