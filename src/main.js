import { camera, renderer, scene } from './utils/renderer';
import windowResizer from '@/utils/windowResizer';
import { config } from '@/config/config';
// import { controls } from '@/utils/controls/controls';
import { ambientLight, directionalLight } from '@/scene/lights/lights';
import { galaxyModel } from '@/scene/models/galaxyModel';
import { preloadExplosionAssets, setupExplosion, renderExplosion } from '@/scene/models/explosionAnimation';
import { setupPullApart, updatePullApart } from '@/scene/models/pullApart';
import { setupColors } from '@/scene/models/colors';
import { setupScene } from './scene';
import '@/styles/style.css';
import { state } from './store/state';
import { onLoadProgress } from '@/utils/loader/loadingManager';

// DEBUG: skip explosion → intro → pullApart and jump straight to colors.
// Set to true only when iterating on colors stage.
const SKIP_TO_COLORS = false;

function createLoaderUI() {
  const overlay = document.createElement('div');
  overlay.className = 'loader-overlay';
  overlay.innerHTML = `
    <div class="loader-content">
      <p class="loader-progress">0%</p>
      <button class="loader-start" disabled>Start</button>
    </div>
  `;
  document.body.appendChild(overlay);

  const progressEl = overlay.querySelector('.loader-progress');
  const startBtn = overlay.querySelector('.loader-start');

  return {
    setProgress(loaded, total) {
      const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;
      progressEl.textContent = `${percent}%`;
    },
    setReady() {
      progressEl.textContent = '100%';
      startBtn.disabled = false;
      startBtn.textContent = 'Start';
    },
    waitForStart() {
      return new Promise((resolve) => {
        startBtn.addEventListener(
          'click',
          () => {
            overlay.classList.add('is-hidden');
            window.setTimeout(() => overlay.remove(), 400);
            resolve();
          },
          { once: true }
        );
      });
    },
  };
}

async function init() {
  const loader = createLoaderUI();
  onLoadProgress((loaded, total) => loader.setProgress(loaded, total));

  scene.add(camera);
  scene.add(ambientLight, directionalLight);
  windowResizer(camera, renderer);

  const model = await galaxyModel();
  scene.add(model);

  setupScene();

  renderer.compile(scene, camera);

  if (!SKIP_TO_COLORS) {
    await preloadExplosionAssets();
  }

  loader.setReady();

  await loader.waitForStart();

  if (SKIP_TO_COLORS) {
    state.stage = 'idle';
    model.position.z = 0;
    model.rotation.y = Math.PI;
    setupColors();
    requestAnimationFrame(() => window.dispatchEvent(new Event('colors:show')));
  } else {
    await setupExplosion();
    setupPullApart();
    setupColors();
  }

  const frameDuration = 1000 / config.fps.limit;
  let lastTime = 0;

  const tick = (now) => {
    window.requestAnimationFrame(tick);

    if (!lastTime) lastTime = now;

    const delta = now - lastTime;
    if (delta < frameDuration) return;

    lastTime = now - (delta % frameDuration);

    // controls.update();
    updatePullApart();

    if (state.stage === 'explosion') {
      renderExplosion(scene, camera);
    } else {
      renderer.render(scene, camera);
    }
  };
  window.requestAnimationFrame(tick);
}

init().catch((err) => {
  console.error(
    'An error occurred during loading, please restart the webpage and start again:',
    err
  );
});
