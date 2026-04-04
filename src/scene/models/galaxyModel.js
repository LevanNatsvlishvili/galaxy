import gltfLoader from '@/utils/loader/gltfLoader';
import { models } from '@/store/models';

export async function galaxyModel() {
  const gltf = await gltfLoader.loadAsync('./models/black.glb');
  const model = gltf.scene;

  models.galaxy = model;

  return model;
}
