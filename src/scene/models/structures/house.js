import textureLoader from '@/utils/loader/textureLoader';
import * as THREE from 'three';
import { assetConfig } from '@/config/assetConfig';
import { config as globalConfig } from '@/config/config';

const { xBlocks, yBlocks } = assetConfig.house;
const { cellSize } = globalConfig.grid;

const width = xBlocks * cellSize * 2.5;
const height = yBlocks * cellSize * 2.5;

const houseTexture = textureLoader.load('./sprite/house.png');
houseTexture.colorSpace = THREE.SRGBColorSpace;
const houseMat = new THREE.SpriteMaterial({ map: houseTexture, depthWrite: false });

const house = async (point) => {
  const sprite = new THREE.Sprite(houseMat.clone());
  // sprite.renderOrder = 1;
  sprite.scale.set(width, height, 1);
  sprite.position.set(point.x + 0.075, height * 0.25, point.z + 0.15);
  return sprite;
};

export default house;
