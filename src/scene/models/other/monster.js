import * as THREE from 'three';
import gltfLoader from '@/utils/loader/gltfLoader';

const BAR_WIDTH = 0.25;
const BAR_HEIGHT = 0.04;
export const BAR_Y_OFFSET = 0.3;

export function createHealthBar() {
  const bgMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(BAR_WIDTH, BAR_HEIGHT),
    new THREE.MeshBasicMaterial({ color: 0x333333, depthTest: false })
  );

  const fgMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(BAR_WIDTH, BAR_HEIGHT),
    new THREE.MeshBasicMaterial({ color: 0x00cc44, depthTest: false })
  );
  fgMesh.position.z = 0.001;
  fgMesh.renderOrder = 1;

  const group = new THREE.Group();
  group.add(bgMesh);
  group.add(fgMesh);
  group.renderOrder = 1;

  // Fixed rotation toward camera (always at 10, 9, 10)
  group.lookAt(new THREE.Vector3(10, 9, 10));

  return { group, fgMesh, barWidth: BAR_WIDTH };
}

const monster = async (position = { x: 1, y: 0.1, z: 0 }) => {
  const [walkGltf, slashGltf] = await Promise.all([
    gltfLoader.loadAsync('./models/monster/walking.glb'),
    gltfLoader.loadAsync('./models/monster/slash.glb'),
  ]);

  // Use walking GLB as the base model since it contains the skeleton
  const model = walkGltf.scene;

  model.scale.set(0.05, 0.05, 0.05);
  model.rotation.y = Math.PI * -0.5;
  model.position.set(position.x, position.y - 0.1, position.z);
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
    }
  });

  const mixer = new THREE.AnimationMixer(model);
  const actions = {};

  for (const clip of walkGltf.animations) {
    clip.name = 'walk';
    actions['walk'] = mixer.clipAction(clip);
  }
  for (const clip of slashGltf.animations) {
    clip.name = 'attack';
    actions['attack'] = mixer.clipAction(clip);
  }

  let currentAction = null;

  function play(name) {
    const next = actions[name];
    if (!next || next === currentAction) return;
    if (currentAction) currentAction.fadeOut(0.2);
    next.reset().fadeIn(0.2).play();
    currentAction = next;
  }

  play('walk');

  return { model, mixer, play };
};
export default monster;
