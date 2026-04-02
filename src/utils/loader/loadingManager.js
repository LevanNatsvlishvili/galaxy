import * as THREE from 'three';

const loadInfo = new Map();
let startTimeAll = null;
let _onProgress = null;
let _onComplete = null;

export function onLoadProgress(cb) {
  _onProgress = cb;
}
export function onLoadComplete(cb) {
  _onComplete = cb;
}

export const loadingManager = new THREE.LoadingManager();

// When an item starts loading
loadingManager.onStart = (url, loaded, total) => {
  if (!startTimeAll) startTimeAll = performance.now();
  loadInfo.set(url, {
    start: performance.now(),
    end: null,
    size: null,
  });
  // console.log(`⏳ Start: ${url}`);
};

loadingManager.onLoad = () => {
  _onComplete?.();
};

loadingManager.onProgress = (url, loaded, total) => {
  const entry = loadInfo.get(url);
  if (entry) entry.end = performance.now();
  _onProgress?.(loaded, total);
};

// If loading fails
loadingManager.onError = (url) => {
  console.error(`❌ Error loading: ${url}`);
};

export default loadingManager;
