import * as THREE from 'three';
import { generateCityLayout } from '../config/cityLayout.js';
import { PALETTE } from '../config/colors.js';
import { STREET_PROP_SPAWNS } from '../config/spawnTables.js';
import { DISTRICT_LAYOUT } from '../config/districtConfig.js';
import { createGround } from './Ground.js';
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
import { NightLighting } from '../lighting/NightLighting.js';
import { DistrictManager } from './DistrictManager.js';
import { pick, randInt, chance } from '../utils/RandomUtils.js';

export class CityBuilder {
  constructor(scene) {
    this.scene = scene;
    this.buildings = [];
    this.streetLamps = [];
    this.trafficLights = [];
    this.windowGrid = new WindowGrid();
    this.nightLighting = new NightLighting();
    this.roadsX = [];
    this.roadsZ = [];
    this.cityBlocks = [];
    this.districts = new DistrictManager(scene, this.windowGrid);
  }

  build() {
    const layout = generateCityLayout();
    this.roadsX = layout.roadsX;
    this.roadsZ = layout.roadsZ;
    this.cityBlocks = layout.blocks;

    this.scene.add(createGround());

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

    // Crosswalks only at intersections within the dense city quadrant, to avoid
    // painting crosswalk geometry across the beach/mountains/suburbs.
    const cityX = layout.roadsX.filter(x => x >= DISTRICT_LAYOUT.cityBounds.xMin && x <= DISTRICT_LAYOUT.cityBounds.xMax);
    const cityZ = layout.roadsZ.filter(z => z >= DISTRICT_LAYOUT.cityBounds.zMin && z <= DISTRICT_LAYOUT.cityBounds.zMax);
    cityX.forEach(x => {
      cityZ.forEach(z => {
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
      this.nightLighting.attachToBuilding(building.group, w, h, d);
      this.scene.add(building.group);
      this.buildings.push({ mesh: building.group, x: block.x, z: block.z, w, d, h });

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

    // Additional street lamps spread across the larger city quadrant.
    for (let i = 0; i < 24; i++) {
      const x = DISTRICT_LAYOUT.cityBounds.xMin + Math.random() * (DISTRICT_LAYOUT.cityBounds.xMax - DISTRICT_LAYOUT.cityBounds.xMin);
      const z = DISTRICT_LAYOUT.cityBounds.zMin + Math.random() * (DISTRICT_LAYOUT.cityBounds.zMax - DISTRICT_LAYOUT.cityBounds.zMin);
      const lamp = new StreetLamp(x, z);
      this.streetLamps.push(lamp);
      this.scene.add(lamp.group);
    }

    cityX.slice(0, 6).forEach((x, i) => {
      const tl = new TrafficLight(x + 5.5, cityZ[i % cityZ.length] + 5.5);
      this.trafficLights.push(tl);
      this.scene.add(tl.group);
    });

    this.scene.add(TrafficSign.stopSign(DISTRICT_LAYOUT.cityBounds.xMax - 10, DISTRICT_LAYOUT.cityBounds.zMax - 10));
    this.scene.add(TrafficSign.speedLimit(DISTRICT_LAYOUT.cityBounds.xMin + 10, DISTRICT_LAYOUT.cityBounds.zMin + 10, 30));

    this.districts.buildBeach();
    this.districts.buildMountains();
    this.districts.buildSuburbs();

    return { half: layout.half, roadsX: layout.roadsX, roadsZ: layout.roadsZ, blocks: layout.blocks };
  }

  update(dt, isNight) {
    this.trafficLights.forEach(tl => tl.update(dt));
    this.streetLamps.forEach(lamp => lamp.setNight(isNight));
    this.nightLighting.setNight(isNight);
    if (isNight) this.nightLighting.flicker(dt);
    this.districts.update(dt);
    if (Math.random() < 0.01) this.windowGrid.flickerRandom();
  }

  checkCollision(x, z, radius) {
    for (const b of this.buildings) {
      const hw = b.w / 2 + radius;
      const hd = b.d / 2 + radius;
      if (Math.abs(x - b.x) < hw && Math.abs(z - b.z) < hd) return true;
    }
    if (this.districts.checkSuburbCollision(x, z, radius)) return true;
    if (this.districts.checkMountainCollision(x, z, radius)) return true;
    return false;
  }

  getDistrict(x, z) {
    return this.districts.getDistrict(x, z);
  }
}
