import gsap from 'gsap';
import loadVideo from '@/utils/loader/videoLoader';
import { models } from '@/store/models';
import { state } from '@/store/state';
import { scene } from '@/utils/renderer';
import * as THREE from 'three';
import gui from '@/utils/gui';

const GROUND_Y = -0.04;
const GROUND_SIZE = 5;
const PHONE_START_Y = -0.12;
const PHONE_END_Y = 0;
const ENTRANCE_DURATION = 2;

let groundMesh = null;

export async function setupLiquidMetal() {
  const model = models.galaxy;
  model.position.y = PHONE_START_Y;

  model.scale.setScalar(0.5);

  gui
    .add(model.position, 'y')
    .min(PHONE_START_Y)
    .max(PHONE_END_Y)
    .step(0.001)
    .name('Phone Position Y');

  const video = await loadVideo('/metal-liquid.mp4', false);
  video.playbackRate = 1;
  video.play();

  const videoTexture = new THREE.VideoTexture(video);
  videoTexture.colorSpace = THREE.SRGBColorSpace;

  const material = new THREE.MeshBasicMaterial({
    map: videoTexture,
    depthWrite: false,
    transparent: true,
  });

  groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE), material);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.y = GROUND_Y;
  scene.add(groundMesh);

  // Phone rises out when liquid metal video ends
  video.addEventListener(
    'ended',
    () => {
      gsap.to(model.position, {
        y: PHONE_END_Y,
        duration: ENTRANCE_DURATION,
        ease: 'power2.out',
        onComplete: () => {
          scene.remove(groundMesh);
          state.stage = 'idle';
        },
      });
    },
    { once: true }
  );
}
