import textureLoader from '@/utils/loader/textureLoader';
import * as THREE from 'three';
import { assetConfig } from '@/config/assetConfig';
import { config as globalConfig } from '@/config/config';

const blockSide = Math.sqrt(assetConfig.well.blockSize) * globalConfig.grid.cellSize;

const wellTexture = textureLoader.load('./sprite/well.webp');
wellTexture.colorSpace = THREE.SRGBColorSpace;
const wellMat = new THREE.SpriteMaterial({ map: wellTexture, depthWrite: false });

const well = async (point) => {
  const sprite = new THREE.Sprite(wellMat.clone());
  const scale = blockSide * 1.25;
  sprite.scale.set(scale, scale, scale);
  sprite.position.set(point.x + 0.05, blockSide * 0.5, point.z + 0.05);
  return sprite;
};

export default well;
