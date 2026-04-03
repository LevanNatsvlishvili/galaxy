import gui from '@/utils/gui';
import gltfLoader from '@/utils/loader/gltfLoader';
import loadVideo from '@/utils/loader/videoLoader';
import * as THREE from 'three';

// Background explosion — rendered behind the main scene
export const bgScene = new THREE.Scene();
export const bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

let phoneModel = null;
let screenMesh = null;
let animationStarted = false;

const PHONE_BEHIND_Z = 3;
const PHONE_DELAY = 2;
const ENTRANCE_DURATION = 1.5;
const PHONE_START_Y = -0.3;

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function findScreenMesh(model) {
  const keywords = ['screen', 'display', 'lcd', 'oled', 'panel'];
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

export async function galaxyModel() {
  const gltf = await gltfLoader.loadAsync('./models/black.glb');
  const model = gltf.scene;

  phoneModel = model;
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

  // Phone screen texture (new VideoTexture from same video, flipped to match screen UVs)
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
  // Reduce strength of z position of phone model

  gui.add(phoneModel.position, 'z').min(0).max(PHONE_BEHIND_Z).step(0.001).name('Phone Position Z');

  return model;
}

export function updateGalaxyAnimation(elapsed) {
  if (!phoneModel || elapsed < PHONE_DELAY) return;

  const t = elapsed - PHONE_DELAY;

  if (t < ENTRANCE_DURATION) {
    const p = easeOutCubic(t / ENTRANCE_DURATION);
    phoneModel.position.z = THREE.MathUtils.lerp(PHONE_BEHIND_Z, 0, p);
    // phoneModel.position.y = PHONE_START_Y * (1 - p);
    // phoneModel.scale.setScalar(Math.max(0.001, easeOutBack(t / ENTRANCE_DURATION)));
  } else {
    phoneModel.position.z = 0;
    // phoneModel.position.y = 0;
    // phoneModel.scale.setScalar(1);
  }
}
