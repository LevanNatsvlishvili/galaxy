import textureLoader from '@/utils/loader/textureLoader';
import * as THREE from 'three';
import { assetConfig } from '@/config/assetConfig';
import { config as globalConfig } from '@/config/config';

const galaxy = async () => {
  const galaxyTexture = textureLoader.load('./sprite/galaxy.webp');
  galaxyTexture.colorSpace = THREE.SRGBColorSpace;
  const galaxyMat = new THREE.SpriteMaterial({ map: galaxyTexture, depthWrite: false });
  const sprite = new THREE.Sprite(galaxyMat.clone());
  const scale = blockSide * 1.25;
  sprite.scale.set(scale, scale, scale);
  sprite.position.set(0, 0, 0);
  return sprite;
};

export default galaxy;
