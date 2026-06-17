import * as THREE from 'three';
import { standardMaterial } from '../utils/MaterialFactory.js';
import { PALETTE } from '../config/colors.js';
import { SETTINGS } from '../config/settings.js';
import { applyShadowCasting } from '../lighting/ShadowConfig.js';

export function createGround() {
  const geo = new THREE.PlaneGeometry(SETTINGS.world.groundSize, SETTINGS.world.groundSize, 1, 1);
  const mat = standardMaterial(PALETTE.ground, { roughness: 0.95, metalness: 0 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  applyShadowCasting(mesh, false, true);
  return mesh;
}
