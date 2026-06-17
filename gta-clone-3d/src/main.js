import * as THREE from 'three';
import { Engine } from './core/Engine.js';
import { Clock } from './core/Clock.js';
import { InputManager } from './core/InputManager.js';
import { SceneManager } from './core/SceneManager.js';
import { GameState } from './core/GameState.js';

import { createSunLight } from './lighting/SunLight.js';
import { createAmbientLights } from './lighting/AmbientLight.js';
import { DayNightCycle } from './lighting/DayNightCycle.js';

import { CityBuilder } from './world/CityBuilder.js';
import { CarFactory } from './vehicles/CarFactory.js';
import { PlayerCharacter } from './player/PlayerCharacter.js';
import { PlayerAnimator } from './player/PlayerAnimator.js';
import { PlayerController } from './player/PlayerController.js';
import { PlayerCamera } from './player/PlayerCamera.js';
import { EnterExitVehicle } from './player/EnterExitVehicle.js';
import { PlayerStats } from './player/PlayerStats.js';
import { FootstepDust } from './player/FootstepDust.js';

import { Pistol } from './weapons/Pistol.js';
import { Bullet } from './weapons/Bullet.js';
import { MuzzleFlash } from './weapons/MuzzleFlash.js';
import { BulletImpactParticles } from './weapons/BulletImpactParticles.js';
import { WeaponPickup } from './weapons/WeaponPickup.js';

import { NPCSpawner } from './npc/NPCSpawner.js';
import { NPCHealthBar } from './npc/NPCHealthBar.js';

import { HUD } from './ui/HUD.js';

import { AudioManager } from './audio/AudioManager.js';
import { EngineSound } from './audio/EngineSound.js';
import { GunshotSound } from './audio/GunshotSound.js';
import { AmbientCitySound } from './audio/AmbientCitySound.js';

import { PICKUP_SPAWNS } from './config/spawnTables.js';
import { distance2D } from './utils/MathUtils.js';

const canvas = document.getElementById('game-canvas');
const hudRoot = document.getElementById('hud-root');

const engine = new Engine(canvas);
const clock = new Clock();
const input = new InputManager(canvas);
const sceneManager = new SceneManager(engine.scene);
const gameState = new GameState();

const sun = createSunLight();
const { hemi, ambient } = createAmbientLights();
engine.scene.add(sun, hemi, ambient);
const dayNight = new DayNightCycle(engine.scene, sun, hemi, ambient);

const city = new CityBuilder(engine.scene);
const { half: worldHalf } = city.build();

const cars = CarFactory.spawnAll(engine.scene);

const player = new PlayerCharacter();
engine.scene.add(player.group);
const playerAnimator = new PlayerAnimator(player.parts);
const playerController = new PlayerController(player.group, input);
const playerCamera = new PlayerCamera(engine.camera, input);
const enterExit = new EnterExitVehicle(player.group, cars);
const playerStats = new PlayerStats(gameState);
const footstepDust = new FootstepDust();

const pistol = new Pistol();
const muzzleFlash = new MuzzleFlash();
const impactParticles = new BulletImpactParticles();
const bullets = [];

const police = NPCSpawner.spawnPolice(engine.scene);
const pedestrians = NPCSpawner.spawnPedestrians(engine.scene);
const policeHealthBars = police.map(p => new NPCHealthBar(p.group));

const pickups = PICKUP_SPAWNS.map(p => new WeaponPickup(p.x, p.z));
pickups.forEach(p => engine.scene.add(p.mesh));

const hud = new HUD(hudRoot, gameState);

const audio = new AudioManager();
const engineSound = new EngineSound(audio);
const gunshotSound = new GunshotSound(audio);
const ambientSound = new AmbientCitySound(audio);

let audioStarted = false;
canvas.addEventListener('click', () => {
  if (!audioStarted) {
    audio.init();
    ambientSound.start();
    audioStarted = true;
  }
  audio.resume();
});

function buildingCollision(x, z, radius) {
  return city.checkCollision(x, z, radius);
}

function fireWeapon() {
  if (!pistol.canFire()) return;
  if (!gameState.useAmmo()) return;
  pistol.triggerCooldown();

  const dir = new THREE.Vector3();
  engine.camera.getWorldDirection(dir);
  const originGroup = enterExit.inCar ? enterExit.currentCar.group : player.group;
  const origin = originGroup.position.clone();
  origin.y += 1.2;

  bullets.push(Bullet.spawn(engine.scene, origin, dir));
  muzzleFlash.spawn(engine.scene, origin.clone().addScaledVector(dir, 0.6));
  if (audioStarted) gunshotSound.play();
  gameState.addScore(5);
}

input.canvas = canvas;

function handleEnterExit() {
  const result = enterExit.tryToggle();
  hud.setMode(enterExit.inCar);
  if (enterExit.inCar) {
    engineSound.start();
  } else {
    engineSound.stop();
  }
}

function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    const alive = Bullet.step(b, dt);

    let hit = false;
    for (const officer of police) {
      if (!officer.alive) continue;
      const d = distance2D(b.mesh.position.x, b.mesh.position.z, officer.group.position.x, officer.group.position.z);
      if (d < 0.9) {
        officer.takeDamage(pistol.damage);
        impactParticles.spawn(engine.scene, b.mesh.position.clone());
        gameState.addScore(50);
        hit = true;
        break;
      }
    }

    if (!alive || hit) {
      engine.scene.remove(b.mesh);
      bullets.splice(i, 1);
    }
  }
}

function cleanupDeadPolice() {
  for (let i = police.length - 1; i >= 0; i--) {
    if (!police[i].alive) {
      engine.scene.remove(police[i].group);
      police.splice(i, 1);
      policeHealthBars.splice(i, 1);
    }
  }
}

function updatePickups() {
  const pos = enterExit.inCar ? enterExit.currentCar.group.position : player.group.position;
  pickups.forEach(p => {
    p.update(clock.delta);
    if (p.checkCollect(pos.x, pos.z)) {
      engine.scene.remove(p.mesh);
      gameState.addAmmo(15);
      gameState.addScore(25);
    }
  });
}

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.tick();

  dayNight.update(dt);
  city.update(dt, dayNight.isNight);

  cars.forEach(car => {
    if (car.inUse) return;
    car.lights.setNight(dayNight.isNight);
  });

  if (enterExit.inCar) {
    const controls = {
      forward: input.isDown('forward'),
      backward: input.isDown('backward'),
      left: input.isDown('left'),
      right: input.isDown('right')
    };
    enterExit.currentCar.update(controls, buildingCollision, dt, engine.scene);
    enterExit.currentCar.lights.setNight(dayNight.isNight);
    playerCamera.yaw = enterExit.currentCar.physics.angle;
    playerCamera.updateLook();
    playerCamera.follow(enterExit.currentCar.group.position);
    engineSound.update(enterExit.currentCar.physics.speed / 0.85);
  } else {
    playerCamera.yaw = playerCamera.updateLook() ?? playerCamera.yaw;
    playerController.yaw = playerCamera.yaw;
    const { moved, running } = playerController.update(dt, buildingCollision, worldHalf);
    playerAnimator.update(dt, moved, running);
    footstepDust.update(dt, engine.scene, player.group.position.x, player.group.position.z, moved && running);
    playerCamera.follow(player.group.position);
  }

  const targetPos = enterExit.inCar ? enterExit.currentCar.group.position : player.group.position;
  police.forEach((officer, idx) => {
    if (!officer.alive) return;
    const result = officer.ai.update(officer.group, targetPos, dt);
    officer.animator.update(dt, result.moving);
    policeHealthBars[idx].setHealth(officer.hp);
    policeHealthBars[idx].faceCamera(engine.camera);
    if (result.shouldFire) {
      gameState.damage(8);
      gameState.raiseWanted(0.3);
    }
  });
  cleanupDeadPolice();

  pedestrians.forEach(ped => ped.update(dt));

  updateBullets(dt);
  muzzleFlash.update(dt, engine.scene);
  impactParticles.update(dt, engine.scene);
  updatePickups();

  if (input.wasPressed('enterExitVehicle')) handleEnterExit();
  if (input.isDown('fire')) fireWeapon();

  gameState.decayWanted(0.002 * dt);

  input.consumeFrame();
  engine.render();
}

engine.resize();
animate();
