import gsap from 'gsap';
import loadVideo from '@/utils/loader/videoLoader';
import * as THREE from 'three';
import { models } from '@/store/models';
import { state } from '@/store/state';
import { renderer } from '@/utils/renderer';

const bgScene = new THREE.Scene();
const bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

let screenMesh = null;
let active = false;
let originalScreenMaterial = null;
let explosionVideo = null;
let bgQuad = null;
let bgMaterial = null;
let bgVideoTexture = null;
let screenVideoTexture = null;
let blackScreenMaterial = null;

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
  if (screenMesh && !originalScreenMaterial) {
    originalScreenMaterial = screenMesh.material;
  }

  const video = await loadVideo('/explosion.mp4');
  video.play();
  video.playbackRate = 1;
  explosionVideo = video;

  const videoTexture = new THREE.VideoTexture(video);
  videoTexture.colorSpace = THREE.SRGBColorSpace;
  bgVideoTexture = videoTexture;

  // Fullscreen background quad
  bgMaterial = new THREE.MeshBasicMaterial({
    map: videoTexture,
    depthWrite: false,
  });
  bgQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMaterial);
  bgScene.add(bgQuad);

  // Phone screen texture
  const screenTexture = new THREE.VideoTexture(video);
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  screenTexture.flipY = !videoTexture.flipY;
  screenVideoTexture = screenTexture;

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
    onComplete: () => {
      state.stage = 'idle';
      showIntroText();
    },
  });

  active = true;
}

function cleanupExplosionMedia() {
  active = false;

  if (bgQuad) {
    bgScene.remove(bgQuad);
    bgQuad.geometry.dispose();
    bgQuad = null;
  }

  if (bgMaterial) {
    bgMaterial.dispose();
    bgMaterial = null;
  }

  if (bgVideoTexture) {
    bgVideoTexture.dispose();
    bgVideoTexture = null;
  }

  if (screenVideoTexture) {
    screenVideoTexture.dispose();
    screenVideoTexture = null;
  }

  if (screenMesh) {
    if (!blackScreenMaterial) {
      blackScreenMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        toneMapped: false,
      });
    }
    screenMesh.material = blackScreenMaterial;
  }

  if (explosionVideo) {
    explosionVideo.pause();
    explosionVideo.removeAttribute('src');
    explosionVideo.load();
    explosionVideo = null;
  }
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

function showIntroText() {
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    bottom: 15%;
    left: 0;
    width: 100%;
    text-align: center;
    pointer-events: none;
    z-index: 10;
  `;

  const intro = document.createElement('p');
  intro.textContent = 'Introducing...';
  intro.style.cssText = `
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 1.2rem;
    font-weight: 300;
    color: #B8B0C8;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin: 0 0 0.5rem 0;
    opacity: 0;
  `;

  const title = document.createElement('h1');
  title.textContent = 'Galaxy S22';
  title.style.cssText = `
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 3rem;
    font-weight: 200;
    color: #ffffff;
    letter-spacing: 0.05em;
    margin: 0;
    opacity: 0;
  `;

  container.appendChild(intro);
  container.appendChild(title);
  document.body.appendChild(container);

  gsap.to(intro, {
    opacity: 1,
    duration: 1,
    ease: 'power2.out',
  });

  const titleTl = gsap.fromTo(
    title,
    { opacity: 0 },
    {
      opacity: 1,
      y: 0,
      duration: 3.5,
      delay: 1,
      ease: 'power1.inOut',
    }
  );

  // After text is fully visible, wait 1.5s then fade out and rotate phone
  titleTl.then(() => {
    gsap.to(container, {
      opacity: 0,
      duration: 1.5,
      delay: 0,
      ease: 'power2.inOut',
      onComplete: () => {
        container.remove();
      },
    });

    gsap.to(models.galaxy.rotation, {
      y: Math.PI - Math.PI / 4,
      duration: 2.5,
      delay: 0.5,
      ease: 'power2.inOut',
      onComplete: () => {
        cleanupExplosionMedia();
        window.dispatchEvent(new Event('pullApart:show'));
      },
    });
  });
}
