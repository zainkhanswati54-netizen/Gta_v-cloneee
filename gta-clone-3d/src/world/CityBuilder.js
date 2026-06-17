import * as THREE from 'three';
import { generateCityLayout } from '../config/cityLayout.js';
import { PALETTE } from '../config/colors.js';
import { STREET_PROP_SPAWNS } from '../config/spawnTables.js';
import { createGround } from './Ground.js';
import { createSkybox } from './Skybox.js';
import { RoadNetwork } from './RoadNetwork.js';
import { RoadMarkings } from './RoadMarkings.js';
import { Sidewalk } from './Sidewalk.js';
import { Intersection } from './Intersection.js';
import { Building } from './Building.js';
import { addFacadeDetails } from './BuildingFacade.js';
import { WindowGrid } from './WindowGrid.js';
import { Tree } from './Tree.js';
import { StreetProp } from './StreetProp.js';
import { TrafficLight } from './TrafficLight.js';
import { TrafficSign } from './TrafficSign.js';
import { Curb } from './Curb.js';
import { StreetLamp } from '../lighting/StreetLamp.js';
import { pick, randInt, chance } from '../utils/RandomUtils.js';

export class CityBuilder {
  constructor(scene) {
    this.scene = scene;
    this.buildings = [];
    this.streetLamps = [];
    this.trafficLights = [];
    this.windowGrid = new WindowGrid();
  }

  build() {
    const layout = generateCityLayout();

    this.scene.add(createGround());
    this.scene.add(createSkybox());

    const roads = new RoadNetwork();
    const markings = new RoadMarkings();
    const sidewalks = new Sidewalk();
    const intersections = new Intersection();
    const curbs = new Curb();

    layout.roadsX.forEach(x => {
      roads.addRoad(x, 0, 10, layout.half * 2, 0);
      markings.addDashedLine(x, 0, layout.half * 2, 0);
      sidewalks.addStrip(x - 6.5, 0, 2, layout.half * 2, 0);
      sidewalks.addStrip(x + 6.5, 0, 2, layout.half * 2, 0);
      curbs.addCurbLine(x - 5.1, 0, layout.half * 2, 0);
      curbs.addCurbLine(x + 5.1, 0, layout.half * 2, 0);
    });
    layout.roadsZ.forEach(z => {
      roads.addRoad(0, z, 10, layout.half * 2, Math.PI / 2);
      markings.addDashedLine(0, z, layout.half * 2, Math.PI / 2);
      sidewalks.addStrip(0, z - 6.5, 2, layout.half * 2, Math.PI / 2);
      sidewalks.addStrip(0, z + 6.5, 2, layout.half * 2, Math.PI / 2);
      curbs.addCurbLine(0, z - 5.1, layout.half * 2, Math.PI / 2);
      curbs.addCurbLine(0, z + 5.1, layout.half * 2, Math.PI / 2);
    });

    layout.roadsX.forEach(x => {
      layout.roadsZ.forEach(z => {
        intersections.addCrosswalk(x, z, 9, 0);
      });
    });

    this.scene.add(roads.group, markings.group, sidewalks.group, intersections.group, curbs.group);

    layout.blocks.forEach(block => {
      if (block.type === 'park') {
        for (let i = 0; i < 5; i++) {
          const tx = block.x + (Math.random() - 0.5) * block.size * 0.7;
          const tz = block.z + (Math.random() - 0.5) * block.size * 0.7;
          const tree = new Tree(tx, tz);
          this.scene.add(tree.group);
        }
        return;
      }

      const w = randInt(8, 14);
      const d = randInt(8, 14);
      const h = randInt(10, 32);
      const color = pick(PALETTE.buildingPalette);
      const building = new Building(block.x, block.z, w, h, d, color);
      addFacadeDetails(building.group, w, h, d, building.color);
      this.windowGrid.applyToFace(building.group, w, h, d, d / 2 + 0.02, 'z');
      this.windowGrid.applyToFace(building.group, d, h, w, w / 2 + 0.02, 'x');
      this.scene.add(building.group);
      this.buildings.push({ mesh: building.group, x: block.x, z: block.z, w, d });

      if (chance(0.4)) {
        const tree = new Tree(block.x + w / 2 + 2, block.z - d / 2 - 2);
        this.scene.add(tree.group);
      }
    });

    STREET_PROP_SPAWNS.forEach(p => {
      let obj;
      if (p.type === 'lamp') {
        const lamp = new StreetLamp(p.x, p.z);
        this.streetLamps.push(lamp);
        this.scene.add(lamp.group);
        return;
      }
      if (p.type === 'bench') obj = StreetProp.bench(p.x, p.z);
      else if (p.type === 'trashcan') obj = StreetProp.trashcan(p.x, p.z);
      else if (p.type === 'hydrant') obj = StreetProp.hydrant(p.x, p.z);
      if (obj) this.scene.add(obj);
    });

    layout.roadsX.slice(0, 3).forEach((x, i) => {
      const tl = new TrafficLight(x + 5.5, layout.roadsZ[0] + 5.5 + i);
      this.trafficLights.push(tl);
      this.scene.add(tl.group);
    });

    this.scene.add(TrafficSign.stopSign(layout.half - 6, layout.half - 6));
    this.scene.add(TrafficSign.speedLimit(-layout.half + 6, -layout.half + 6, 30));

    return { half: layout.half };
  }

  update(dt, isNight) {
    this.trafficLights.forEach(tl => tl.update(dt));
    this.streetLamps.forEach(lamp => lamp.setNight(isNight));
    if (Math.random() < 0.01) this.windowGrid.flickerRandom();
  }

  checkCollision(x, z, radius) {
    for (const b of this.buildings) {
      const hw = b.w / 2 + radius;
      const hd = b.d / 2 + radius;
      if (Math.abs(x - b.x) < hw && Math.abs(z - b.z) < hd) return true;
    }
    return false;
  }
}
