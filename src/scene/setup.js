import { scene } from '../utils/renderer';
import ground from './environment/ground';
import { ambientLight, directionalLight } from './lights/lights';
import { setupEnvironment } from './environment/environment';

const loadStarterModels = async () => {
  // scene.add();
};

export async function setupScene() {
  setupEnvironment();

  await loadStarterModels();

  scene.add(ground);
  scene.add(ambientLight);
  scene.add(directionalLight);
}

export default setupScene;
