import * as THREE from 'three';

export const config = {
  camera: {
    fov: 10.5,
    position: { x: 10, y: 9, z: 10 },
  },

  controls: {
    enableDamping: true,
    maxPolarAngle: Math.PI / 2,
    minPolarAngle: 0,
    // maxDistance: 10,
    // minDistance: 5,
  },

  character: {
    speed: 0.5,
    startingPosition: { x: -0, y: 0.1, z: -0 },
    attackRange: 0.15,
    attackDamage: 1,
    attackCooldown: 0.5,
    health: 20,
  },

  monster: {
    speed: 0.75,
    attackRange: 0.15,
    attackDamage: 1,
    attackCooldown: 1.5,
    health: 5,
    startingPosition: { x: 1, y: 0.1, z: 0 },
    spawnPoints: [
      {
        x: 4,
        z: 4,
      },
      {
        x: 4,
        z: 0.30000000000000004,
      },
      {
        x: 4.3,
        z: -4.1000000000000005,
      },
    ],
  },

  items: {
    attackIncrease: {
      price: 2,
      increase: 1,
    },
    healthPottion: {
      price: 4,
      healthRestore: 10,
    },
    maxHealthIncrease: {
      price: 2,
      increase: 1,
    },
  },

  renderer: {
    pixelRatio: Math.min(window.devicePixelRatio, 2),
    shadowMap: true,
    shadowType: THREE.PCFSoftShadowMap,
  },

  lights: {
    ambient: {
      color: '#ffffff',
      intensity: 5,
      nightIntensity: 0.4,
    },
    directional: {
      color: '#ffffff',
      intensity: 1,
      nightIntensity: 0,
      position: { x: -1.5, y: 2, z: -8 },
      shadow: {
        mapSize: 1024,
        camera: { top: 8, right: 8, bottom: -8, left: -8, near: 1, far: 15 },
      },
    },
  },

  ground: {
    size: 10,
    color: 'green',
    positionY: -0.5,
  },

  grid: {
    cellSize: 0.1,
    highlightColor: 0xffffff,
    highlightOpacity: 0.3,
    lineColor: 0xffffff,
    lineOpacity: 0.15,
  },

  environment: {
    background: 0x87ceeb,
  },

  fps: {
    limit: 60,
  },
};
