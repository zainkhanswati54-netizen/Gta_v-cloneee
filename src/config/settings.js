export const SETTINGS = {
  world: {
    fogNear: 70,
    fogFar: 320,
    blockSize: 40,
    worldHalf: 400
  },

  player: {
    walkSpeed: 0.09,
    runSpeed: 0.16,
    turnSpeed: 0.0022,
    eyeHeight: 1.6,
    collisionRadius: 0.4
  },
  car: {
    accel: 0.05,
    reverseAccel: 0.03,
    friction: 0.93,
    brakeFriction: 0.82,
    handbrakeFriction: 0.7,
    steerRate: 0.04,
    minSteerSpeed: 0.05,
    maxSpeed: 0.95,
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
    maxHealth: 3,
    wanderSpeed: 0.045
  },
  camera: {
    views: {
      close: { distance: 6.5, height: 3.0, fov: 70 },
      far: { distance: 13, height: 6.0, fov: 62 }
    },
    lerp: 0.12
  },
  dayNight: {
    cycleSpeed: 0.0015
  }
};
