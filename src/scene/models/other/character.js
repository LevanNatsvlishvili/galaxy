import * as THREE from 'three';
import gltfLoader from '@/utils/loader/gltfLoader';
import { config as globalConfig } from '@/config/config';
import state from '@/store/state';

const { startingPosition } = globalConfig.character;
export const torchLight = new THREE.PointLight(0xffa733, 1.6, 4, 2);

const BASE_PATH = './models/character';

const character = async () => {
  const gltf = await gltfLoader.loadAsync(`${BASE_PATH}/char-with-slash.glb`);
  const model = gltf.scene;

  model.scale.set(0.1, 0.1, 0.1);
  model.rotation.y = Math.PI * 0.5;
  model.position.set(startingPosition.x, startingPosition.y - 0.1, startingPosition.z);

  torchLight.shadow.mapSize.set(512, 512);
  torchLight.shadow.radius = 2;
  torchLight.intensity = state.isDay ? 0 : 1.5;
  torchLight.distance = 8;
  torchLight.decay = 1;

  const mixer = new THREE.AnimationMixer(model);
  const clips = [];

  const [idleGltf, walkGltf, swordGlb, lanternGlb] = await Promise.all([
    gltfLoader.loadAsync(`${BASE_PATH}/idle.glb`),
    gltfLoader.loadAsync(`${BASE_PATH}/walking.glb`),
    gltfLoader.loadAsync(`${BASE_PATH}/sword.glb`),
    gltfLoader.loadAsync(`${BASE_PATH}/lantern.glb`),
  ]);

  const idleClip = idleGltf.animations.find((c) => c.name === 'Armature|Armature|Idle_3|baselayer');
  const walkClip = walkGltf.animations.find(
    (c) => c.name === 'Armature|Armature|walking_man|baselayer'
  );
  const slashClip = idleGltf.animations.find((c) => c.name === 'mixamo.com');

  if (idleClip) {
    idleClip.name = 'idle';
    clips.push(idleClip);
  }
  if (walkClip) {
    walkClip.name = 'walk';
    clips.push(walkClip);
  }
  if (slashClip) {
    slashClip.name = 'slash';
    clips.push(slashClip);
  }

  const swordScene = swordGlb.scene;
  const lanternScene = lanternGlb.scene;

  // swordPivot origin = hilt; sword mesh is offset inside it so the blade extends away
  const swordPivot = new THREE.Group();
  swordScene.rotation.x = Math.PI * -0.5;
  swordScene.rotation.y = Math.PI * 0.5;
  swordScene.position.y = 20; // shift sword so hilt end sits at pivot origin
  swordScene.position.z = -32; // shift sword so hilt end sits at pivot origin
  swordScene.position.x = 10; // shift sword so hilt end sits at pivot origin
  swordScene.scale.set(50, 50, 50);
  swordPivot.add(swordScene);

  const rightHand = model.getObjectByName('RightHand');
  if (rightHand) {
    swordScene.traverse((child) => {
      if (child.isMesh) child.castShadow = true;
    });
    rightHand.add(swordPivot);
  } else {
    console.warn('Right hand bone not found — sword not attached');
  }

  // lanternPivot origin = hilt; lantern mesh is offset inside it so the blade extends away
  const lanternPivot = new THREE.Group();
  lanternScene.rotation.x = Math.PI * -1;
  lanternScene.rotation.y = Math.PI * 0.5;
  lanternScene.position.y = 40;
  lanternScene.position.x = -5;
  lanternScene.scale.set(25, 25, 25);
  lanternPivot.add(lanternScene);

  const lanternHand = model.getObjectByName('LeftHand');
  if (lanternHand) {
    lanternScene.traverse((child) => {
      if (child.isMesh) child.castShadow = true;
    });
    torchLight.position.set(0, 30, 0);
    lanternPivot.add(torchLight);
    lanternHand.add(lanternPivot);
  } else {
    console.warn('Left hand bone not found — lantern not attached');
  }

  return { model, mixer, clips };
};

export default character;
