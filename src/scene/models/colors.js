import gsap from 'gsap';
import { models } from '@/store/models';
import { scene } from '@/utils/renderer';

const SPACING = 0.1;
const REVEAL_DURATION = 1.4;
const STAGGER = 0.5;

// Layout: 3 to the left, main in center, 2 to the right
// Index in models.variants → slot offset (in spacing units)
// Order matches stagger sequence — innermost slots emerge first so each
// outer variant comes out from behind the previous one.
const LAYOUT = [-1, 1, -2, 2, -3];

export function setupColors() {
  window.addEventListener(
    'colors:show',
    () => {
      revealColors();
    },
    { once: true }
  );
}

function revealColors() {
  const main = models.galaxy;
  if (!main || !models.variants?.length) return;

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

    // Move on x axis
    gsap.to(variant.position, {
      x: targetX,
      z: targetZ,
      duration: REVEAL_DURATION,
      delay,
      ease: 'power2.out',
    });
  });
}
