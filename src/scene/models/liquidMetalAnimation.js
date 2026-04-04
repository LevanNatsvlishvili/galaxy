import gsap from 'gsap';
import loadVideo from '@/utils/loader/videoLoader';
import { models } from '@/store/models';
import * as THREE from 'three';

const GROUND_Y = -0.04;
const GROUND_SIZE = 1;
const PHONE_START_Y = -0.12;
const PHONE_END_Y = 0;
const ENTRANCE_DURATION = 2;

let video = null;

export async function setupLiquidMetal() {
  video = await loadVideo('/metal-liquid.mp4', false);
  video.playbackRate = 1;

  const videoTexture = new THREE.VideoTexture(video);
  videoTexture.colorSpace = THREE.SRGBColorSpace;

  const material = new THREE.MeshBasicMaterial({
    map: videoTexture,
    depthWrite: false,
    transparent: true,
  });

  const groundMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE),
    material
  );
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.y = GROUND_Y;

  // Phone starts below ground, rises when liquid metal ends
  if (models.galaxy) {
    models.galaxy.position.y = PHONE_START_Y;
  }

  video.addEventListener('ended', () => {
    if (!models.galaxy) return;

    gsap.to(models.galaxy.position, {
      y: PHONE_END_Y,
      duration: ENTRANCE_DURATION,
      ease: 'power2.out',
    });
  }, { once: true });

  return groundMesh;
}

export function playLiquidMetal() {
  video.play();
}
