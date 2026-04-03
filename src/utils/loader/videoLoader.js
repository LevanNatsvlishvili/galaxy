import loadingManager from './loadingManager';

export async function loadVideo(url, loop = true) {
  loadingManager.itemStart(url);

  const video = document.createElement('video');
  video.src = url;
  video.loop = loop;
  video.muted = true;
  video.playsInline = true;

  return new Promise((resolve, reject) => {
    video.addEventListener(
      'canplaythrough',
      () => {
        loadingManager.itemEnd(url);
        resolve(video);
      },
      { once: true }
    );

    video.addEventListener(
      'error',
      () => {
        loadingManager.itemError(url);
        loadingManager.itemEnd(url);
        reject(new Error(`Failed to load video: ${url}`));
      },
      { once: true }
    );

    video.load();
  });
}

export default loadVideo;
