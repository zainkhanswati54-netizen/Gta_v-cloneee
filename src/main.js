import * as THREE from 'three';
import { Engine } from './core/Engine.js';
import { Clock } from './core/Clock.js';
import { InputManager } from './core/InputManager.js';
import { SceneManager } from './core/SceneManager.js';
import { GameState } from './core/GameState.js';
import { PerformanceManager } from './core/PerformanceManager.js';
import { isLikelyMobile } from './core/PlatformDetect.js';

import { createSunLight } from './lighting/SunLight.js';
import { createAmbientLights } from './lighting/AmbientLight.js';
import { DayNightCycle } from './lighting/DayNightCycle.js';

import { CityBuilder } from './world/CityBuilder.js';
import { CarFactory } from './vehicles/CarFactory.js';
import { TrafficCarFactory } from './vehicles/TrafficCarFactory.js';
import { VehicleEntryAnimation } from './vehicles/VehicleEntryAnimation.js';

import { PlayerCharacter } from './player/PlayerCharacter.js';
import { PlayerAnimator } from './player/PlayerAnimator.js';
import { PlayerController } from './player/PlayerController.js';
import { PlayerCamera } from './player/PlayerCamera.js';
import { EnterExitVehicle } from './player/EnterExitVehicle.js';
import { PlayerStats } from './player/PlayerStats.js';
import { FootstepDust } from './player/FootstepDust.js';

import { Bullet } from './weapons/Bullet.js';
import { MuzzleFlash } from './weapons/MuzzleFlash.js';
import { BulletImpactParticles } from './weapons/BulletImpactParticles.js';
import { WeaponPickup } from './weapons/WeaponPickup.js';
import { WeaponRegistry } from './weapons/WeaponRegistry.js';
import { WeaponSelector } from './weapons/WeaponSelector.js';

import { NPCSpawner } from './npc/NPCSpawner.js';
import { NPCHealthBar } from './npc/NPCHealthBar.js';
import { CrowdSpawner } from './npc/CrowdSpawner.js';

import { HUD } from './ui/HUD.js';
import { WeaponSelectorUI } from './ui/WeaponSelectorUI.js';
import { TouchControls } from './ui/TouchControls.js';
import { MobileLayout } from './ui/MobileLayout.js';
import { PauseMenu } from './ui/PauseMenu.js';
import { ButtonFix } from './ui/ButtonFix.js';

import { AudioManager } from './audio/AudioManager.js';
import { ProceduralEngineLayer } from './audio/ProceduralEngineLayer.js';
import { WeaponSoundKit } from './audio/WeaponSoundKit.js';
import { AmbientNatureSound } from './audio/AmbientNatureSound.js';

import { PICKUP_SPAWNS } from './config/spawnTables.js';
import { distance2D } from './utils/MathUtils.js';
import { TweenManager } from './utils/Tween.js';

const canvas = document.getElementById('game-canvas');
const hudRoot = document.getElementById('hud-root');

const engine = new Engine(canvas);
const clock = new Clock();
const input = new InputManager(canvas);
const sceneManager = new SceneManager(engine.scene);
const gameState = new GameState();
const perf = new PerformanceManager(engine.renderer);
const mobile = isLikelyMobile();
const tweenManager = new TweenManager();

const sun = createSunLight();
const { hemi, ambient } = createAmbientLights();
engine.scene.add(sun, hemi, ambient);
const dayNight = new DayNightCycle(engine.scene, sun, hemi, ambient);

const city = new CityBuilder(engine.scene);
const { half: worldHalf } = city.build();

const cars = CarFactory.spawnAll(engine.scene);
const trafficCars = TrafficCarFactory.spawnAll(engine.scene, city.roadsX || [], city.roadsZ || [], worldHalf);
const vehicleEntryAnim = new VehicleEntryAnimation(tweenManager);

const player = new PlayerCharacter();
engine.scene.add(player.group);
const playerAnimator = new PlayerAnimator(player.parts);
const playerController = new PlayerController(player.group, input);
const playerCamera = new PlayerCamera(engine.camera, input);
const enterExit = new EnterExitVehicle(player.group, cars);
const playerStats = new PlayerStats(gameState);
const footstepDust = new FootstepDust();

const weaponRegistry = new WeaponRegistry();
const weaponSelector = new WeaponSelector(weaponRegistry);
const muzzleFlash = new MuzzleFlash();
const impactParticles = new BulletImpactParticles();
const bullets = [];

const police = NPCSpawner.spawnPolice(engine.scene);
const pedestrians = NPCSpawner.spawnPedestrians(engine.scene);
const crowd = CrowdSpawner.spawnAcrossBlocks(engine.scene, city.cityBlocks || [], 0.35, 2);
const policeHealthBars = police.map(p => new NPCHealthBar(p.group));

const pickups = PICKUP_SPAWNS.map(p => new WeaponPickup(p.x, p.z));
pickups.forEach(p => engine.scene.add(p.mesh));

const hud = new HUD(hudRoot, gameState);
hud.ammoCounter.set(weaponRegistry.get('pistol').ammo);

const weaponSelectorUI = new WeaponSelectorUI(hudRoot, id => {
  weaponSelector.selectById(id);
  refreshAmmoDisplay();
});
weaponSelectorUI.render(weaponRegistry.list(), weaponSelector.activeIndex);

const pauseMenu = new PauseMenu(hudRoot, () => {
  canvas.requestPointerLock();
});
const buttonFix = new ButtonFix(pauseMenu, input);

MobileLayout.applyIfNeeded(hudRoot, mobile || MobileLayout.isSmallScreen());
const touchControls = mobile ? new TouchControls(hudRoot) : null;

const audio = new AudioManager();
const engineSound = new ProceduralEngineLayer(audio);
const weaponSoundKit = new WeaponSoundKit(audio);
const ambientSound = new AmbientNatureSound(audio);

let audioStarted = false;
canvas.addEventListener('click', () => {
  if (!audioStarted) {
    audio.init();
    ambientSound.start();
    audioStarted = true;
  }
  audio.resume();
});

function refreshAmmoDisplay() {
  const active = weaponSelector.active;
  hud.ammoCounter.set(active.ammo);
  weaponSelectorUI.render(weaponRegistry.list(), weaponSelector.activeIndex);
}

function buildingCollision(x, z, radius) {
  return city.checkCollision(x, z, radius);
}

function fireWeapon() {
  const active = weaponSelector.active;
  if (!active.instance.canFire()) return;
  if (active.ammo <= 0) return;
  active.instance.triggerCooldown();
  active.ammo--;
  hud.ammoCounter.set(active.ammo);

  const dir = new THREE.Vector3();
  engine.camera.getWorldDirection(dir);
  const originGroup = enterExit.inCar ? enterExit.currentCar.group : player.group;
  const origin = originGroup.position.clone();
  origin.y += 1.2;

  const pelletCount = active.def.pellets || 1;
  for (let i = 0; i < pelletCount; i++) {
    const spread = active.def.spread || 0;
    const spreadDir = dir.clone();
    spreadDir.x += (Math.random() - 0.5) * spread;
    spreadDir.y += (Math.random() - 0.5) * spread * 0.5;
    spreadDir.z += (Math.random() - 0.5) * spread;
    spreadDir.normalize();
    bullets.push(Bullet.spawn(engine.scene, origin, spreadDir));
  }

  muzzleFlash.spawn(engine.scene, origin.clone().addScaledVector(dir, 0.6));
  if (audioStarted) weaponSoundKit.play(active.def.soundType);
  gameState.addScore(5);
}

let vehicleTransitionInProgress = false;

function handleEnterExit() {
  if (vehicleTransitionInProgress) return;
  if (enterExit.inCar) {
    vehicleTransitionInProgress = true;
    const car = enterExit.currentCar;
    vehicleEntryAnim.playExit(car.driverDoor, () => {
      enterExit.tryToggle();
      hud.setMode(false);
      engineSound.stop();
      vehicleTransitionInProgress = false;
    });
  } else {
    const nearCar = enterExit.nearestCar();
    if (!nearCar) return;
    vehicleTransitionInProgress = true;
    vehicleEntryAnim.playEnter(nearCar.driverDoor, () => {
      enterExit.tryToggle();
      hud.setMode(true);
      engineSound.start();
      vehicleTransitionInProgress = false;
    });
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
        officer.takeDamage(weaponSelector.active.instance.damage);
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
      weaponRegistry.addAmmo(weaponSelector.active.id, weaponSelector.active.def.ammoPerPickup);
      refreshAmmoDisplay();
      gameState.addScore(25);
    }
  });
}

function applyTouchInput(dt) {
  if (!touchControls) return;
  const { state } = touchControls;
  const flags = touchControls.consumePressFlags();
  const look = touchControls.consumeLook();

  if (!enterExit.inCar) {
    playerCamera.yaw -= look.dx * 0.004;
    playerCamera.pitch = THREE.MathUtils.clamp(playerCamera.pitch - look.dy * 0.004, -0.45, 0.45);
  }

  input.setTouchOverride({
    forward: state.moveY < -0.2,
    backward: state.moveY > 0.2,
    left: state.moveX < -0.2,
    right: state.moveX > 0.2,
    fire: state.firing
  });

  if (flags.enterExitPressed) handleEnterExit();
  if (flags.weaponCyclePressed) {
    weaponSelector.next();
    refreshAmmoDisplay();
  }
}

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.tick();

  if (buttonFix.isPaused()) {
    engine.render();
    return;
  }

  perf.trackFrame(dt);
  applyTouchInput(dt);
  tweenManager.update(dt);

  dayNight.update(dt);
  city.update(dt, dayNight.isNight);

  cars.forEach(car => {
    if (car.inUse) return;
    car.lights.setNight(dayNight.isNight);
  });

  trafficCars.forEach(tc => {
    tc.updateTraffic(dt);
    tc.lights.setNight(dayNight.isNight);
  });

  const viewerPos = enterExit.inCar ? enterExit.currentCar.group.position : player.group.position;
  perf.applyLOD(
    city.buildings.map(b => ({ mesh: b.mesh, x: b.x, z: b.z })),
    viewerPos.x, viewerPos.z
  );

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
    playerCamera.updateLook();
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
  crowd.forEach(ped => ped.update(dt));

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
