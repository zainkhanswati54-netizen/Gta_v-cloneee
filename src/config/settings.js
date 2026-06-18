export const SETTINGS = {
  world: {
    groundSize: 900,
    fogNear: 60,
    fogFar: 280,
    blockSize: 40,
    blocksPerSide: 10
  },

  player: {
    walkSpeed: 0.09,
    runSpeed: 0.16,
    turnSpeed: 0.0022,
    eyeHeight: 1.6,
    collisionRadius: 0.4
  },
  car: {
    accel: 0.045,
    reverseAccel: 0.028,
    friction: 0.9,
    steerRate: 0.045,
    maxSpeed: 0.85,
    collisionRadius: 1.6
  },
  weapons: {
    pistolDamage: 1,
    pistolFireDelay: 10,
    bulletSpeed: 1.4,
    bulletLife: 50,
    maxAmmo: 99,
    startAmmo: 30
  },
  npc: {
    detectRadius: 26,
    attackRadius: 16,
    fireCooldown: 85,
    chaseSpeed: 0.05,
    maxHealth: 3
  },
  camera: {
    distance: 9,
    height: 4.2,
    lerp: 0.12,
    fov: 68
  },
  dayNight: {
    cycleSpeed: 0.0015
  }
};
