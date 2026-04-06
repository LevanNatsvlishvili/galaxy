import gsap from 'gsap';
import * as THREE from 'three';
import { models } from '@/store/models';
import { scene } from '@/utils/renderer';

const SPACING = 0.1;
const REVEAL_DURATION = 1.4;
const STAGGER = 0.5;
const LABEL_Y_OFFSET = -0.09;

// Layout: 3 to the left, main in center, 2 to the right
// Index in models.variants → slot offset (in spacing units)
// Order matches stagger sequence — innermost slots emerge first so each
// outer variant comes out from behind the previous one.
const LAYOUT = [-1, 1, -2, 2, -3];

// Main model is cobalt-violet. Variants order in models.variants:
// [pinkGold, black, silverShadow, skyBlue, white]
const MAIN_LABEL = 'Cobalt Violet';
const VARIANT_LABELS = ['Pink Gold', 'Phantom Black', 'Silver Shadow', 'Sky Blue', 'White'];

function createLabelSprite(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');

  const fontSize = 40;
  ctx.font = `300 ${fontSize}px Helvetica Neue, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#D2DCE8';
  ctx.shadowColor = 'rgba(192, 200, 212, 0.35)';
  ctx.shadowBlur = 10;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    opacity: 0,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.08, 0.015, 1);
  return sprite;
}

function showHeading() {
  const heading = document.createElement('div');
  heading.style.cssText = `
    position: fixed;
    top: 12%;
    left: 0;
    width: 100%;
    text-align: center;
    pointer-events: none;
    z-index: 10;
    font-family: 'Helvetica Neue', Arial, sans-serif;
    color: #ffffff;
    opacity: 0;
  `;

  const eyebrow = document.createElement('p');
  eyebrow.textContent = 'Galaxy S22';
  eyebrow.style.cssText = `
    font-size: 0.9rem;
    font-weight: 300;
    color: #B8B0C8;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    margin: 0 0 0.5rem 0;
  `;

  const title = document.createElement('h2');
  title.textContent = 'All this. In six colors.';
  title.style.cssText = `
    font-size: 2.2rem;
    font-weight: 200;
    letter-spacing: 0.02em;
    margin: 0;
  `;

  heading.appendChild(eyebrow);
  heading.appendChild(title);
  document.body.appendChild(heading);

  gsap.to(heading, {
    opacity: 1,
    duration: 1.4,
    ease: 'power2.out',
  });
}

export function setupColors() {
  window.addEventListener(
    'colors:show',
    () => {
      revealColors();
    },
    { once: true }
  );
}

function attachLabel(phone, text, worldX, worldY, delay) {
  const sprite = createLabelSprite(text);
  sprite.position.set(worldX, worldY + LABEL_Y_OFFSET, phone.position.z);
  scene.add(sprite);

  gsap.to(sprite.material, {
    opacity: 1,
    duration: 1,
    delay,
    ease: 'power2.out',
  });

  return sprite;
}

function revealColors() {
  const main = models.galaxy;
  if (!main || !models.variants?.length) return;

  showHeading();

  // Label for the main (center) phone
  attachLabel(main, MAIN_LABEL, main.position.x, main.position.y, STAGGER * LAYOUT.length + 0.2);

  models.variants.forEach((variant, i) => {
    // Match main model orientation and start hidden behind it
    variant.rotation.copy(main.rotation);
    variant.position.copy(main.position);
    variant.position.z = -0.01 * (i + 1);
    variant.scale.copy(main.scale);

    scene.add(variant);

    const targetX = main.position.x + LAYOUT[i] * SPACING;
    const targetZ = main.position.z;
    const delay = i * STAGGER;

    gsap.to(variant.position, {
      x: targetX,
      z: targetZ,
      duration: REVEAL_DURATION,
      delay,
      ease: 'power2.out',
    });

    // Label fades in just after this phone reaches its slot
    attachLabel(variant, VARIANT_LABELS[i], targetX, main.position.y, delay + REVEAL_DURATION * 0.6);
  });
}
