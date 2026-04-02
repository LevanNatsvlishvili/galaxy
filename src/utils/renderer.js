import * as THREE from 'three';
import { screenSizes } from './windowResizer';
import { config } from '../config/config';

export const scene = new THREE.Scene();

export const canvas = document.querySelector('canvas.webgl');

export const camera = new THREE.PerspectiveCamera(
  config.camera.fov,
  screenSizes.width / screenSizes.height
);
camera.position.set(config.camera.position.x, config.camera.position.y, config.camera.position.z);

export const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  preserveDrawingBuffer: true,
});
renderer.setSize(screenSizes.width, screenSizes.height);
renderer.setPixelRatio(config.renderer.pixelRatio);
renderer.shadowMap.enabled = config.renderer.shadowMap;
renderer.shadowMap.type = config.renderer.shadowType;
renderer.outputColorSpace = THREE.SRGBColorSpace;
