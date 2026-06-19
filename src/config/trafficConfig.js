import { DISTRICT_LAYOUT } from './districtConfig.js';

export const TRAFFIC_CAR_COUNT = 14;

export const TRAFFIC_COLOR_INDICES = [0, 1, 2, 3, 4, 5];

// Traffic routes are restricted to the city + suburb half of the map (z >= mountainBounds.zMax-ish
// boundary doesn't apply here; city/suburbs occupy x >= -40, so we filter routes whose fixed
// road coordinate keeps the car's path within city/suburb/beach roads, avoiding the mountain
// quadrant where roads would visually cut through solid terrain).
export function generateTrafficRoutes(roadsX, roadsZ, half) {
  const routes = [];
  const mountainXMax = DISTRICT_LAYOUT.mountainBounds.xMax; // -40

  roadsX.forEach(x => {
    // Skip road lines that fall deep inside the mountain quadrant's x range.
    if (x < mountainXMax - 10) return;
    routes.push({ axis: 'z', fixed: x, min: -half, max: half, lane: 2.6 });
    routes.push({ axis: 'z', fixed: x, min: -half, max: half, lane: -2.6 });
  });
  roadsZ.forEach(z => {
    routes.push({ axis: 'x', fixed: z, min: mountainXMax - 10, max: half, lane: 2.6 });
    routes.push({ axis: 'x', fixed: z, min: mountainXMax - 10, max: half, lane: -2.6 });
  });
  return routes;
}
