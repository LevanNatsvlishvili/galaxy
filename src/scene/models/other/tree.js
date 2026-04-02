import textureLoader from '@/utils/loader/textureLoader';
import * as THREE from 'three';
import { assetConfig } from '@/config/assetConfig';
import { config as globalConfig } from '@/config/config';

const blockSide = assetConfig.tree.blockSize * globalConfig.grid.cellSize;

const treeTexture = textureLoader.load('./sprite/tree.webp');
treeTexture.colorSpace = THREE.SRGBColorSpace;
const treeMat = new THREE.SpriteMaterial({ map: treeTexture, depthWrite: false });

const tree = async (point) => {
  const { placementMinus } = assetConfig.global;
  const sprite = new THREE.Sprite(treeMat.clone());
  const scale = blockSide * 1.25;
  sprite.renderOrder = point.priority ? 5 : 0;
  sprite.scale.set(scale, scale, scale);
  sprite.position.set(point.x - placementMinus, blockSide * 0.5, point.z - placementMinus);
  return sprite;
};

export default tree;
