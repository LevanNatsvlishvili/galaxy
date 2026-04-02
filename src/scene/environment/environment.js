import * as THREE from 'three';
import { scene } from '@/utils/renderer';
import { config } from '@/config/config';

export function setupEnvironment() {
  const { background } = config.environment;

  if (background !== undefined) {
    scene.background = new THREE.Color(background);
  }
}
