import * as THREE from 'three';
import { emissiveMaterial } from '../utils/MaterialFactory.js';

export class BulletImpactParticles {
  constructor() {
    this.mat = emissiveMaterial(0xffd27a, 1.5);
    this.active = [];
  }

  spawn(scene, position) {
    for (let i = 0; i < 5; i++) {
      const geo = new THREE.SphereGeometry(0.04, 4, 4);
      const mesh = new THREE.Mesh(geo, this.mat);
      mesh.position.copy(position);
      const dir = new THREE.Vector3((Math.random() - 0.5), Math.random() * 0.6, (Math.random() - 0.5)).normalize();
      scene.add(mesh);
      this.active.push({ mesh, vel: dir.multiplyScalar(0.08), life: 18 });
    }
  }

  update(dt, scene) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      p.mesh.position.addScaledVector(p.vel, dt);
      p.vel.y -= 0.004 * dt;
      p.life -= dt;
      if (p.life <= 0) {
        scene.remove(p.mesh);
        this.active.splice(i, 1);
      }
    }
  }
}
