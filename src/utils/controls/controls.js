import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { camera, canvas } from '../renderer';
import { config } from '@/config/config';

export const controls = new OrbitControls(camera, canvas);
controls.enableDamping = config.controls.enableDamping;
controls.maxPolarAngle = config.controls.maxPolarAngle;
controls.minPolarAngle = config.controls.minPolarAngle;
// controls.enableRotate = false;
// controls.enablePan = false;
// controls.enableZoom = false;
