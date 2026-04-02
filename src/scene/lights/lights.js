import * as THREE from 'three';
import { config } from '@/config/config';

const { ambient, directional } = config.lights;

// Ambient light
export const ambientLight = new THREE.AmbientLight(ambient.color, ambient.intensity);

// Directional light
export const directionalLight = new THREE.DirectionalLight(
  directional.color,
  directional.intensity
);

// Light optimization
const { x, y, z } = directional.position;
directionalLight.position.set(x, y, z);

directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = directional.shadow.mapSize;
directionalLight.shadow.mapSize.height = directional.shadow.mapSize;
directionalLight.shadow.camera.top = directional.shadow.camera.top;
directionalLight.shadow.camera.right = directional.shadow.camera.right;
directionalLight.shadow.camera.bottom = directional.shadow.camera.bottom;
directionalLight.shadow.camera.left = directional.shadow.camera.left;
directionalLight.shadow.camera.near = directional.shadow.camera.near;
directionalLight.shadow.camera.far = directional.shadow.camera.far;
