import { camera, renderer, scene } from './utils/renderer';
import windowResizer from '@/utils/windowResizer';
import { config } from '@/config/config';
import { controls } from '@/utils/controls/controls';
import { ambientLight, directionalLight } from '@/scene/lights/lights';
import {
  galaxyModel,
  bgScene,
  bgCamera,
  updateGalaxyAnimation,
} from '@/scene/models/galaxyModel';
import { setupScene } from './scene';
import '@/styles/style.css';

async function init() {
  scene.add(camera);
  scene.add(ambientLight, directionalLight);
  windowResizer(camera, renderer);

  const model = await galaxyModel();
  scene.add(model);

  setupScene();

  // Pre-compile all shaders/materials so the phone entrance doesn't stutter
  renderer.compile(scene, camera);

  const frameDuration = 1000 / config.fps.limit;
  let lastTime = 0;
  let startTime = 0;

  const tick = (now) => {
    window.requestAnimationFrame(tick);

    if (!startTime) startTime = now;
    if (!lastTime) lastTime = now;

    const delta = now - lastTime;
    if (delta < frameDuration) return;

    lastTime = now - (delta % frameDuration);

    const elapsed = (now - startTime) / 1000;

    controls.update();
    updateGalaxyAnimation(elapsed);

    // Background explosion first, then phone scene on top
    renderer.render(bgScene, bgCamera);
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(scene, camera);
    renderer.autoClear = true;
  };
  window.requestAnimationFrame(tick);
}

init().catch((err) => {
  console.error(
    'An error occurred during loading, please restart the webpage and start again:',
    err
  );
});
