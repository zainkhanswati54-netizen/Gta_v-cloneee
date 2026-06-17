import { SETTINGS } from './settings.js';

const { blockSize, blocksPerSide } = SETTINGS.world;
const half = (blocksPerSide * blockSize) / 2;

export function generateCityLayout() {
  const blocks = [];
  const roadsX = [];
  const roadsZ = [];

  for (let i = -blocksPerSide / 2; i <= blocksPerSide / 2; i++) {
    roadsX.push(i * blockSize);
    roadsZ.push(i * blockSize);
  }

  let seed = 0;
  for (let bx = -blocksPerSide / 2; bx < blocksPerSide / 2; bx++) {
    for (let bz = -blocksPerSide / 2; bz < blocksPerSide / 2; bz++) {
      const cx = bx * blockSize + blockSize / 2;
      const cz = bz * blockSize + blockSize / 2;
      seed++;
      const isPark = (seed % 7 === 0);
      blocks.push({
        id: `block_${bx}_${bz}`,
        x: cx,
        z: cz,
        size: blockSize - 10,
        type: isPark ? 'park' : 'buildings',
        seed
      });
    }
  }

  return { blocks, roadsX, roadsZ, half, blockSize };
}
