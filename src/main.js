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

import { BulletPool } from './weapons/BulletPool.js';
import { MuzzleFlash } from './weapons/MuzzleFlash.js';
import { BulletImpactParticles } from './weapons/BulletImpactParticles.js';
import { WeaponPickup } from './weapons/WeaponPickup.js';
import { WeaponRegistry } from './weapons/WeaponRegistry.js';
import { WeaponSelector } from './weapons/WeaponSelector.js';

import { NPCHealthBar } from './npc/NPCHealthBar.js';
import { CrowdSpawner } from './npc/CrowdSpawner.js';
import { PoliceNPCPool } from './npc/PoliceNPCPool.js';

import { HUD } from './ui/HUD.js';
import { WeaponSelectorUI } from './ui/WeaponSelectorUI.js';
import { TouchControls } from './ui/TouchControls.js';
import { DPadControls } from './ui/DPadControls.js';
import { MobileLayout } from './ui/MobileLayout.js';
import { PauseMenu } from './ui/PauseMenu.js';
import { ButtonFix } from './ui/ButtonFix.js';

import { AudioManager } from './audio/AudioManager.js';
import { ProceduralEngineLayer } from './audio/ProceduralEngineLayer.js';
import { WeaponSoundKit } from './audio/WeaponSoundKit.js';
import { AmbientNatureSound } from './audio/AmbientNatureSound.js';

import { PICKUP_SPAWNS, STREET_PROP_SPAWNS, POLICE_SPAWNS } from './config/spawnTables.js';
import { DISTRICT_LAYOUT } from './config/districtConfig.js';
import { distance2D } from './utils/MathUtils.js';
import { TweenManager } from './utils/Tween.js';

const canvas = document.getElementById('game-canvas');
const hudRoot = document.getElementById('hud-root');

const engine = new Engine(canvas);
const clock = new Clock();
const input = new InputManager(canvas);
const sceneManager = new SceneManager(engine.scene);
const gameState = new GameState();
const perf = new PerformanceManager(engine.renderer, engine.camera);
const mobile = isLikelyMobile();
const tweenManager = new TweenManager();

const sun = createSunLight();
const { hemi, ambient } = createAmbientLights();
engine.scene.add(sun, hemi, ambient);
const dayNight = new DayNightCycle(engine.scene, sun, hemi, ambient);

const city = new CityBuilder(engine.scene);
const { half: worldHalf } = city.build();

// Precomputed once: avoids allocating a new array + new objects every frame for LOD/culling,
// which was a real (if subtle) source of GC churn given hundreds of buildings.
const buildingLODItems = city.buildings.map(b => ({
  mesh: b.mesh,
  x: b.x,
  z: b.z,
  w: b.w,
  d: b.d,
  height: b.h,
  radius: Math.max(b.w, b.d) * 0.7
}));

const cars = CarFactory.spawnAll(engine.scene);
const trafficCars = TrafficCarFactory.spawnAll(engine.scene, city.roadsX, city.roadsZ, worldHalf);
const vehicleEntryAnim = new VehicleEntryAnimation(tweenManager);

const player = new PlayerCharacter();
engine.scene.add(player.group);
// Spawn the player inside the city district, near the origin, regardless of district layout changes.
player.group.position.set(4, 0, 4);

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
const bulletPool = new BulletPool(engine.scene);

const policePool = new PoliceNPCPool(engine.scene);
const police = POLICE_SPAWNS.map(p => policePool.spawn(p.x, p.z));
const { pedestrians, talkingPairs } = CrowdSpawner.spawnAcrossBlocks(engine.scene, city.cityBlocks, 0.38, 2);

const benchPositions = STREET_PROP_SPAWNS.filter(p => p.type === 'bench');
const benchSitters = CrowdSpawner.spawnOnBenches(engine.scene, benchPositions);

const beachCrowd = CrowdSpawner.spawnBeachCrowd(engine.scene, DISTRICT_LAYOUT.beachBounds, 14);

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
const dpadControls = mobile ? new DPadControls(hudRoot) : null;

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

// Scratch vectors reused every shot instead of allocating new THREE.Vector3 instances —
// fireWeapon() can be called many times per second with the automatic rifle, so this matters.
const _fireDir = new THREE.Vector3();
const _fireOrigin = new THREE.Vector3();
const _spreadDir = new THREE.Vector3();
const _muzzlePos = new THREE.Vector3();

function fireWeapon() {
  const active = weaponSelector.active;
  if (!active.instance.canFire()) return;
  if (active.ammo <= 0) return;
  active.instance.triggerCooldown();
  active.ammo--;
  hud.ammoCounter.set(active.ammo);

  engine.camera.getWorldDirection(_fireDir);
  const originGroup = enterExit.inCar ? enterExit.currentCar.group : player.group;
  _fireOrigin.copy(originGroup.position);
  _fireOrigin.y += 1.2;

  const pelletCount = active.def.pellets || 1;
  for (let i = 0; i < pelletCount; i++) {
    const spread = active.def.spread || 0;
    _spreadDir.copy(_fireDir);
    _spreadDir.x += (Math.random() - 0.5) * spread;
    _spreadDir.y += (Math.random() - 0.5) * spread * 0.5;
    _spreadDir.z += (Math.random() - 0.5) * spread;
    _spreadDir.normalize();
    bulletPool.spawn(_fireOrigin, _spreadDir);
  }

  _muzzlePos.copy(_fireOrigin).addScaledVector(_fireDir, 0.6);
  muzzleFlash.spawn(engine.scene, _muzzlePos);
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
      if (dpadControls) dpadControls.hide();
      if (touchControls) touchControls.showOnFootControls();
      // Clear any touch-override state (e.g. joystick held forward) left over from
      // driving, so the player doesn't keep walking on their own right after exiting.
      input.setTouchOverride({});
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
      if (dpadControls) dpadControls.show();
      if (touchControls) touchControls.hideOnFootControls();
      // Same fix in the other direction: a joystick held forward at the exact moment
      // of entering a car would otherwise leave touchOverride.forward stuck true,
      // since applyTouchMovementOnFoot() stops running once inCar becomes true —
      // silently accelerating the car with no actual driving input.
      input.setTouchOverride({});
      vehicleTransitionInProgress = false;
    });
  }
}

const _impactPos = new THREE.Vector3();

function updateBullets(dt) {
  // Iterate backwards so that release() splicing the current index doesn't skip
  // the next element — this avoids needing a snapshot array allocation every frame.
  const active = bulletPool.activeBullets;
  for (let i = active.length - 1; i >= 0; i--) {
    const b = active[i];
    const stillAlive = bulletPool.step(b, dt);
    if (!stillAlive) continue; // step() already released it via life expiry

    let hit = false;
    for (const officer of police) {
      if (!officer.alive) continue;
      const d = distance2D(b.mesh.position.x, b.mesh.position.z, officer.group.position.x, officer.group.position.z);
      if (d < 0.9) {
        officer.takeDamage(weaponSelector.active.instance.damage);
        _impactPos.copy(b.mesh.position);
        impactParticles.spawn(engine.scene, _impactPos);
        gameState.addScore(50);
        hit = true;
        break;
      }
    }

    if (hit) bulletPool.release(b);
  }
}

function cleanupDeadPolice() {
  for (let i = police.length - 1; i >= 0; i--) {
    if (!police[i].alive) {
      // Returned to the pool (hidden + reset) rather than permanently destroyed —
      // Phase 2's wanted-level system will reuse these instances for new chases
      // instead of constructing a brand new PoliceNPC (full mesh hierarchy) each time.
      policePool.despawn(police[i]);
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

function applyTouchButtonFlags() {
  if (!touchControls) return;
  const flags = touchControls.consumePressFlags();
  if (flags.enterExitPressed) handleEnterExit();
  if (flags.weaponCyclePressed) {
    weaponSelector.next();
    refreshAmmoDisplay();
  }
}

function applyTouchMovementOnFoot(dt) {
  if (!touchControls) return;
  const { state } = touchControls;
  const look = touchControls.consumeLook();

  playerCamera.yaw -= look.dx * 0.004;
  playerCamera.pitch = THREE.MathUtils.clamp(playerCamera.pitch - look.dy * 0.004, -0.45, 0.45);

  input.setTouchOverride({
    forward: state.moveY < -0.2,
    backward: state.moveY > 0.2,
    left: state.moveX < -0.2,
    right: state.moveX > 0.2,
    fire: state.firing
  });
}

function getCarControls() {
  if (dpadControls && enterExit.inCar) {
    const d = dpadControls.consume();
    return {
      forward: input.isDown('forward') || d.accel,
      backward: input.isDown('backward') || d.brake,
      left: input.isDown('left') || d.left,
      right: input.isDown('right') || d.right,
      handbrake: input.isDown('handbrake') || d.handbrake
    };
  }
  return {
    forward: input.isDown('forward'),
    backward: input.isDown('backward'),
    left: input.isDown('left'),
    right: input.isDown('right'),
    handbrake: input.isDown('handbrake')
  };
}

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.tick();

  if (buttonFix.isPaused()) {
    engine.render();
    return;
  }

  perf.trackFrame(dt);
  applyTouchButtonFlags();
  if (!enterExit.inCar) applyTouchMovementOnFoot(dt);
  tweenManager.update(dt);

  // Critical fix: without this, Weapon.cooldown is set by triggerCooldown() on every shot
  // but never decremented, so canFire() would permanently return false after the very
  // first bullet fired with any weapon for the rest of the session.
  weaponRegistry.list().forEach(w => w.instance.update(dt));

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
  perf.applyLOD(buildingLODItems, viewerPos.x, viewerPos.z);

  if (enterExit.inCar) {
    const controls = getCarControls();
    enterExit.currentCar.update(controls, buildingCollision, dt, engine.scene);
    enterExit.currentCar.lights.setNight(dayNight.isNight);
    playerCamera.yaw = enterExit.currentCar.physics.angle;
    playerCamera.follow(enterExit.currentCar.group.position);
    engineSound.update(enterExit.currentCar.physics.speed / 0.95);
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
  talkingPairs.forEach(pair => pair.update(dt));
  benchSitters.forEach(s => s.update(dt));
  beachCrowd.forEach(b => b.update(dt));

  updateBullets(dt);
  muzzleFlash.update(dt);
  impactParticles.update(dt);
  updatePickups();

  if (input.wasPressed('enterExitVehicle')) handleEnterExit();
  if (input.wasPressed('toggleCameraView')) playerCamera.toggleView();
  if (input.wasPressed('cycleWeapon')) {
    weaponSelector.next();
    refreshAmmoDisplay();
  }
  if (input.isDown('fire') && !enterExit.inCar) fireWeapon();

  gameState.decayWanted(0.002 * dt);

  input.consumeFrame();
  engine.render();
}

engine.resize();
animate();
