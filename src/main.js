import { camera, renderer, scene } from './utils/renderer';
import windowResizer from '@/utils/windowResizer';
import { config } from '@/config/config';
import { controls } from '@/utils/controls/controls';
import { ambientLight, directionalLight } from '@/scene/lights/lights';
import { galaxyModel } from '@/scene/models/galaxyModel';
import { setupExplosion, renderExplosion } from '@/scene/models/explosionAnimation';
import { setupScene } from './scene';
import '@/styles/style.css';

async function init() {
  scene.add(camera);
  scene.add(ambientLight, directionalLight);
  windowResizer(camera, renderer);

  const model = await galaxyModel();
  scene.add(model);

  await setupExplosion();

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

    controls.update();

    renderExplosion(scene, camera);
  };
  window.requestAnimationFrame(tick);
}

init().catch((err) => {
  console.error(
    'An error occurred during loading, please restart the webpage and start again:',
    err
  );
});
