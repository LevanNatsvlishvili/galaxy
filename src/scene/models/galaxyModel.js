import gltfLoader from '@/utils/loader/gltfLoader';
import { models } from '@/store/models';
import * as THREE from 'three';

const MODEL_COLORS = {
  'pink-gold': '#D8A6A0',
  black: '#1A1A1A',
  'cobalt-violet': '#6E5AA6',
  'silver-shadow': '#B8BCC3',
  'sky-blue': '#9FC9E8',
  white: '#F5F5F3',
};

const CASE_MESHES = [
  'Backcover_Glass',
  'Backcover_Glass_In',
  'Rearcase',
  'Rearcase_light',
  'Rearcase_hole',
  'Antenna_Plastic',
  'Antenna_Plastic_light',
  'BackCam',
  'BackCam_Case',
  'BackCam_Case_2',
  'BackCam_Case_3',
  'BackCam_Case_Side',
  'BackCam_Case_Side_2',
  'BackCam_Case_Side_3',
];

function applyColor(gltf, hex) {
  const color = new THREE.Color(hex);
  gltf.scene.traverse((child) => {
    if (!child.isMesh) return;
    if (!CASE_MESHES.includes(child.material?.name)) return;
    child.material = child.material.clone();
    child.material.color.set(color);
  });
}

export async function galaxyModel() {
  const pinkGold = await gltfLoader.loadAsync('./models/pink-gold.glb');
  const black = await gltfLoader.loadAsync('./models/black.glb');
  const cobaltViolet = await gltfLoader.loadAsync('./models/cobalt-violet.glb');
  const silverShadow = await gltfLoader.loadAsync('./models/silver-shadow.glb');
  const skyBlue = await gltfLoader.loadAsync('./models/sky-blue.glb');
  const white = await gltfLoader.loadAsync('./models/white.glb');

  applyColor(pinkGold, MODEL_COLORS['pink-gold']);
  applyColor(black, MODEL_COLORS['black']);
  applyColor(cobaltViolet, MODEL_COLORS['cobalt-violet']);
  applyColor(silverShadow, MODEL_COLORS['silver-shadow']);
  applyColor(skyBlue, MODEL_COLORS['sky-blue']);
  applyColor(white, MODEL_COLORS['white']);

  models.galaxy = cobaltViolet.scene;
  // Other variants — hidden until colors animation triggers
  models.variants = [pinkGold.scene, black.scene, silverShadow.scene, skyBlue.scene, white.scene];

  return cobaltViolet.scene;
}
