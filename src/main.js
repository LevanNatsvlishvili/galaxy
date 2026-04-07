import { camera, renderer, scene } from './utils/renderer';
import windowResizer from '@/utils/windowResizer';
import { config } from '@/config/config';
// import { controls } from '@/utils/controls/controls';
import { ambientLight, directionalLight } from '@/scene/lights/lights';
import { galaxyModel } from '@/scene/models/galaxyModel';
import { setupExplosion, renderExplosion } from '@/scene/models/explosionAnimation';
import { setupPullApart, updatePullApart } from '@/scene/models/pullApart';
import { setupColors } from '@/scene/models/colors';
import { setupScene } from './scene';
import '@/styles/style.css';
import { state } from './store/state';

// DEBUG: skip explosion → intro → pullApart and jump straight to colors.
// Set to true only when iterating on colors stage.
const SKIP_TO_COLORS = false;

async function init() {
  scene.add(camera);
  scene.add(ambientLight, directionalLight);
  windowResizer(camera, renderer);

  const model = await galaxyModel();
  scene.add(model);

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

  setupScene();

  renderer.compile(scene, camera);

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
