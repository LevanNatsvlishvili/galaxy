export const screenSizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const windowResizer = (camera, renderer) => {
  window.addEventListener('resize', () => {
    // Update sizes
    screenSizes.width = window.innerWidth;
    screenSizes.height = window.innerHeight;

    // Update camera
    camera.aspect = screenSizes.width / screenSizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(screenSizes.width, screenSizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });
};

export default windowResizer;
