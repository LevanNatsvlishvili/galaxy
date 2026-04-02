import * as THREE from 'three';
import gltfLoader from '@/utils/loader/gltfLoader';

const fence = async () => {
  const fenceSprite = await gltfLoader.loadAsync('./models/fence.glb');
  const model = fenceSprite.scene;
  model.scale.set(0.25, 0.15, 0.25);
  model.position.y = 0.125;
  model.position.x = 2;
  model.position.z = 2;
  return model;
};
export default fence;
