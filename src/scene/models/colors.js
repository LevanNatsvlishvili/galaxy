import gsap from 'gsap';
import * as THREE from 'three';
import gui from '@/utils/gui';
import { models } from '@/store/models';
import { camera, renderer, scene } from '@/utils/renderer';
import { setupWhiteboard, showDrawPanel, revealPen } from './whiteboard';

const REVEAL_DURATION = 2;
const STAGGER = 0.1;
const REVEAL_DELAY = 0.5;
const HOLD_DURATION = 3;

// Card-fan angle by distance from center slot (degrees).
// 1-step: 30deg, 2-step: 50deg, 3-step: 75deg.
const FAN_ANGLE_BY_SLOT = {
  1: 30,
  2: 50,
  3: 75,
};
const FAN_X_PER_SLOT = 0.028;
const FURTHEST_LEFT_X_NUDGE = -0.012;
const LAST_VARIANT_REVEAL_X = -0.058;
const LAYOUT = [-1, 1, -2, 2, -3];

const zStackBehind = (i, total) => -0.008 * (i + 1);
const fanAngleRad = (slot) =>
  THREE.MathUtils.degToRad((FAN_ANGLE_BY_SLOT[Math.abs(slot)] ?? 30) * Math.sign(slot));
const FAN_Y_DROP_PER_SLOT = 0.01;

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

  return heading;
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

function revealColors() {
  const main = models.galaxy;
  if (!main || !models.variants?.length) return;
  const lastVariant = models.variants[models.variants.length - 1];

  const heading = showHeading();

  // Track when the last variant finishes fanning in — used to schedule hide
  let lastArrivalTime = 0;

  models.variants.forEach((variant, i) => {
    variant.rotation.copy(main.rotation);
    variant.position.copy(main.position);
    variant.position.z = main.position.z + zStackBehind(i, models.variants.length);
    variant.position.y = main.position.y;
    variant.scale.copy(main.scale);

    scene.add(variant);

    const deltaAngle = fanAngleRad(LAYOUT[i]);
    const baseTargetX =
      main.position.x + LAYOUT[i] * FAN_X_PER_SLOT + (LAYOUT[i] === -3 ? FURTHEST_LEFT_X_NUDGE : 0);
    const targetX = i === models.variants.length - 1 ? LAST_VARIANT_REVEAL_X : baseTargetX;
    const targetZ = main.position.z + zStackBehind(i, models.variants.length);
    const delay = REVEAL_DELAY;
    const arrival = delay + REVEAL_DURATION;
    if (arrival > lastArrivalTime) lastArrivalTime = arrival;

    gsap.to(variant.position, {
      x: targetX,
      z: targetZ,
      duration: REVEAL_DURATION,
      delay,
      ease: 'power2.out',
    });

    gsap.to(variant.position, {
      y: main.position.y - Math.abs(LAYOUT[i]) * FAN_Y_DROP_PER_SLOT,
      duration: REVEAL_DURATION,
      delay,
      ease: 'power2.out',
    });

    gsap.to(variant.rotation, {
      z: main.rotation.z + deltaAngle,
      duration: REVEAL_DURATION,
      delay,
      ease: 'power2.out',
    });
  });

  // Pre-warm shaders/materials after variants are in scene to avoid first-time
  // compilation hitch on this stage (seen when colors runs after prior stages).
  scene.updateMatrixWorld(true);
  renderer.compile(scene, camera);

  if (lastVariant && !lastVariant.userData.guiXZAdded) {
    lastVariant.userData.guiXZAdded = true;
    const folder = gui.addFolder('Last Variant');
    folder.add(lastVariant.position, 'x').min(-1).max(1).step(0.001).name('x');
    folder.add(lastVariant.position, 'z').min(-1).max(1).step(0.001).name('z');
  }

  // Schedule the hide sequence after all variants arrive + hold
  const hideStart = lastArrivalTime + HOLD_DURATION;
  hideColors({ heading, delay: hideStart });
}

function hideColors({ heading, delay }) {
  const main = models.galaxy;

  // Fade out heading DOM element
  gsap.to(heading, {
    opacity: 0,
    duration: 1,
    delay,
    ease: 'power2.in',
    onComplete: () => heading.remove(),
  });

  // Retract variants in reverse order (outermost first) back behind the main
  const retractStart = delay + 0.8;
  const variants = models.variants;

  const reversed = [...variants].reverse();
  reversed.forEach((variant, revIdx) => {
    const stagger = revIdx * STAGGER;
    const originalIndex = variants.length - 1 - revIdx;
    const isLast = revIdx === reversed.length - 1;
    gsap.to(variant.rotation, {
      z: main.rotation.z,
      duration: REVEAL_DURATION,
      delay: retractStart + stagger,
      ease: 'power2.in',
    });

    gsap.to(variant.position, {
      x: main.position.x,
      y: main.position.y,
      z: main.position.z + zStackBehind(originalIndex, variants.length),
      duration: REVEAL_DURATION,
      delay: retractStart + stagger,
      ease: 'power2.in',
      onComplete: () => {
        scene.remove(variant);
        if (isLast) showWhiteboard();
      },
    });
  });
}

function showWhiteboard() {
  const main = models.galaxy;
  if (!main) return;

  // Install the drawable whiteboard texture + pen before rotating
  setupWhiteboard(main);

  // Rotate the phone 180° to show the whiteboard side
  gsap.to(main.rotation, {
    y: main.rotation.y + Math.PI,
    duration: 2,
    ease: 'power2.inOut',
    onStart: () => revealPen({ delay: 1 }),
    onComplete: () => showDrawPanel(),
  });
}
