import gsap from 'gsap';
import loadVideo from '@/utils/loader/videoLoader';
import * as THREE from 'three';
import { models } from '@/store/models';
import { renderer } from '@/utils/renderer';

const bgScene = new THREE.Scene();
const bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

let screenMesh = null;
let active = false;

const PHONE_BEHIND_Z = 1.91;
const PHONE_DELAY = 1.5;
const ENTRANCE_DURATION = 2.5;

function findScreenMesh(model) {
  const keywords = ['display'];
  let found = null;

  model.traverse((child) => {
    if (!child.isMesh) return;
    const name = child.name.toLowerCase();
    if (keywords.some((kw) => name.includes(kw))) {
      found = child;
    }
  });

  return found;
}

export async function setupExplosion() {
  const model = models.galaxy;
  model.position.z = PHONE_BEHIND_Z;

  screenMesh = findScreenMesh(model);

  const video = await loadVideo('/explosion.mp4');
  video.play();
  video.playbackRate = 1;

  const videoTexture = new THREE.VideoTexture(video);
  videoTexture.colorSpace = THREE.SRGBColorSpace;

  // Fullscreen background quad
  const bgMaterial = new THREE.MeshBasicMaterial({
    map: videoTexture,
    depthWrite: false,
  });
  const bgQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMaterial);
  bgScene.add(bgQuad);

  // Phone screen texture
  const screenTexture = new THREE.VideoTexture(video);
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  screenTexture.flipY = !videoTexture.flipY;

  if (screenMesh) {
    screenMesh.material = new THREE.MeshBasicMaterial({
      map: screenTexture,
      toneMapped: false,
    });
  }

  // Black backdrop behind the phone to block the background video
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(0.08, 0.16),
    new THREE.MeshBasicMaterial({ color: 0x000000 })
  );
  backdrop.scale.setScalar(10);
  backdrop.position.z = -0.005;
  model.add(backdrop);

  // GSAP entrance animation after delay
  gsap.to(model.position, {
    z: 0,
    duration: ENTRANCE_DURATION,
    delay: PHONE_DELAY,
    ease: 'power1.out',
    onUpdate: () => {
      if (model.position.z < 1.9 && active) {
        active = false;
      }
    },
  });

  active = true;
}

export function renderExplosion(scene, camera) {
  if (active) {
    renderer.render(bgScene, bgCamera);
    renderer.autoClear = false;
    renderer.clearDepth();
  }

  renderer.render(scene, camera);

  if (!renderer.autoClear) {
    renderer.autoClear = true;
  }
}
