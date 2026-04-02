import textureLoader from '@/utils/loader/textureLoader';
import * as THREE from 'three';
import { assetConfig } from '@/config/assetConfig';
import { config as globalConfig } from '@/config/config';

const blockSide = assetConfig.vine.blockSize * globalConfig.grid.cellSize;
const { placementMinus } = assetConfig.global;

const ripeTexture = textureLoader.load('./sprite/vine/ripe.webp');
ripeTexture.colorSpace = THREE.SRGBColorSpace;
const ripeMat = new THREE.SpriteMaterial({ map: ripeTexture, depthWrite: false });

const growingTexture = textureLoader.load('./sprite/vine/growing.webp');
growingTexture.colorSpace = THREE.SRGBColorSpace;
const growingMat = new THREE.SpriteMaterial({ map: growingTexture, depthWrite: false });

const vine = async (point) => {
  const group = new THREE.Group();

  const ripeSprite = new THREE.Sprite(ripeMat.clone());
  ripeSprite.scale.set(blockSide, blockSide, blockSide);
  ripeSprite.position.set(point.x + placementMinus, blockSide * 0.25, point.z + placementMinus);
  ripeSprite.rotation.y = Math.PI * -0.5;
  ripeSprite.visible = false;

  const growingSprite = new THREE.Sprite(growingMat.clone());
  growingSprite.scale.set(blockSide, blockSide, blockSide);
  growingSprite.position.set(point.x + placementMinus, blockSide * 0.25, point.z + placementMinus);

  group.add(ripeSprite);
  group.add(growingSprite);
  return group;
};

export default vine;
