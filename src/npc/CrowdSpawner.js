import { PedestrianNPC } from './PedestrianNPC.js';
import { TalkingNPCPair } from './TalkingNPCPair.js';
import { SittingNPC } from './SittingNPC.js';
import { BeachNPC } from './BeachNPC.js';
import { chance } from '../utils/RandomUtils.js';

export class CrowdSpawner {
  static spawnAcrossBlocks(scene, blocks, perBlockChance = 0.5, maxPerBlock = 2) {
    const pedestrians = [];
    const talkingPairs = [];

    blocks.forEach(block => {
      if (block.type === 'park') return;
      if (Math.random() > perBlockChance) return;

      if (chance(0.18)) {
        const angle = Math.random() * Math.PI * 2;
        const pair = new TalkingNPCPair(block.x, block.z, angle);
        pair.npcs.forEach(n => scene.add(n.group));
        talkingPairs.push(pair);
        pedestrians.push(...pair.npcs);
        return;
      }

      const count = 1 + Math.floor(Math.random() * maxPerBlock);
      for (let i = 0; i < count; i++) {
        const ox = block.x + (Math.random() - 0.5) * (block.size * 0.6);
        const oz = block.z + (Math.random() - 0.5) * (block.size * 0.6);
        const ped = new PedestrianNPC(ox, oz);
        scene.add(ped.group);
        pedestrians.push(ped);
      }
    });

    return { pedestrians, talkingPairs };
  }

  static spawnOnBenches(scene, benchPositions) {
    const sitters = [];
    benchPositions.forEach(pos => {
      if (!chance(0.6)) return;
      const sitter = new SittingNPC(pos.x, pos.z + 0.3, pos.rotationY || 0);
      scene.add(sitter.group);
      sitters.push(sitter);
    });
    return sitters;
  }

  static spawnBeachCrowd(scene, bounds, count = 14) {
    const npcs = [];
    for (let i = 0; i < count; i++) {
      const x = bounds.xMin + 15 + Math.random() * (bounds.xMax - bounds.xMin - 30);
      const z = bounds.zMax - 10 - Math.random() * 35;
      const npc = new BeachNPC(x, z);
      scene.add(npc.group);
      npcs.push(npc);
    }
    return npcs;
  }
}
