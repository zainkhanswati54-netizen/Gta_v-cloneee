export const TRAFFIC_CAR_COUNT = 10;

export const TRAFFIC_COLOR_INDICES = [0, 1, 2, 3, 4, 5];

export function generateTrafficRoutes(roadsX, roadsZ, half) {
  const routes = [];
  roadsX.forEach(x => {
    routes.push({ axis: 'z', fixed: x, min: -half, max: half, lane: 2.6 });
    routes.push({ axis: 'z', fixed: x, min: -half, max: half, lane: -2.6 });
  });
  roadsZ.forEach(z => {
    routes.push({ axis: 'x', fixed: z, min: -half, max: half, lane: 2.6 });
    routes.push({ axis: 'x', fixed: z, min: -half, max: half, lane: -2.6 });
  });
  return routes;
}
