import { PedestrianNPC } from './PedestrianNPC.js';

export class CrowdSpawner {
  static spawnAcrossBlocks(scene, blocks, perBlockChance = 0.5, maxPerBlock = 2) {
    const pedestrians = [];
    blocks.forEach(block => {
      if (block.type === 'park') return;
      if (Math.random() > perBlockChance) return;
      const count = 1 + Math.floor(Math.random() * maxPerBlock);
      for (let i = 0; i < count; i++) {
        const ox = block.x + (Math.random() - 0.5) * (block.size * 0.6);
        const oz = block.z + (Math.random() - 0.5) * (block.size * 0.6);
        const ped = new PedestrianNPC(ox, oz);
        scene.add(ped.group);
        pedestrians.push(ped);
      }
    });
    return pedestrians;
  }
}
