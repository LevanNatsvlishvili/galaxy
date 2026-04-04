import * as THREE from 'three';

export const config = {
  camera: {
    fov: 10.5,
    position: { x: 0, y: 0, z: 2 },
  },

  controls: {
    enableDamping: true,
    maxPolarAngle: Math.PI / 2,
    minPolarAngle: -15,
    // maxDistance: 10,
    // minDistance: 5,
  },

  renderer: {
    pixelRatio: Math.min(window.devicePixelRatio, 2),
    shadowMap: true,
    shadowType: THREE.PCFSoftShadowMap,
  },

  lights: {
    ambient: {
      color: '#ffffff',
      intensity: 15,
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

  environment: {
    // background: 0x87ceeb,
  },

  fps: {
    limit: 60,
  },
};
