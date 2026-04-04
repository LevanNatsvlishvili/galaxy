import gui from '@/utils/gui';
import gsap from 'gsap';
import gltfLoader from '@/utils/loader/gltfLoader';
import loadVideo from '@/utils/loader/videoLoader';
import * as THREE from 'three';

// Background explosion — rendered behind the main scene
export const bgScene = new THREE.Scene();
export const bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

let phoneModel = null;
let screenMesh = null;

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

  gui.add(phoneModel.position, 'z').min(0).max(PHONE_BEHIND_Z).step(0.001).name('Phone Position Z');

  // GSAP entrance animation after delay
  gsap.to(model.position, {
    z: 0,
    duration: ENTRANCE_DURATION,
    delay: PHONE_DELAY,
    ease: 'power1.out',
    onUpdate: () => {
      if (model.position.z < 1.9 && bgScene.visible) {
        bgScene.visible = false;
      }
    },
  });

  return model;
}

export function updateGalaxyAnimation() {}
