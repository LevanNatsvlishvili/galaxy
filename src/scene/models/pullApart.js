import { models } from '@/store/models';
import { scene } from '@/utils/renderer';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import * as THREE from 'three';
import gui from '@/utils/gui';

const START_Z_OFFSET = 0.005;
const START_X_OFFSET = 0.008;
const START_Y_OFFSET = 0.0225;
const DIAGONAL_OFFSET = { x: 0.02, y: 0.04, z: 0 };
const HORIZONTAL_LENGTH = 0.04;
const LINE_COLOR = '#C0C8D4';

function createGlowDot(position) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(210, 220, 235, 1)');
  gradient.addColorStop(0.3, 'rgba(192, 200, 212, 0.6)');
  gradient.addColorStop(1, 'rgba(192, 200, 212, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.006, 0.006, 1);
  sprite.position.copy(position);
  return sprite;
}

function createAnnotation(targetMeshName, labelText) {
  const model = models.galaxy;
  const targetMesh = model.getObjectByName(targetMeshName);
  if (!targetMesh) return null;

  const targetPos = new THREE.Vector3();
  targetMesh.getWorldPosition(targetPos);
  // targetPos.z += START_Z_OFFSET;
  // targetPos.y += START_Y_OFFSET;
  gui.add(targetPos, 'y').min(0).max(1).step(0.01).name('targetPos.y');
  gui.add(targetPos, 'z').min(0).max(1).step(0.01).name('targetPos.z');

  const midPos = new THREE.Vector3(
    targetPos.x + DIAGONAL_OFFSET.x,
    targetPos.y + DIAGONAL_OFFSET.y,
    targetPos.z + DIAGONAL_OFFSET.z
  );

  const endPos = new THREE.Vector3(midPos.x + HORIZONTAL_LENGTH, midPos.y, midPos.z);

  // Thick line using Line2
  const lineGeo = new LineGeometry();
  lineGeo.setPositions([
    targetPos.x + START_X_OFFSET,
    targetPos.y + START_Y_OFFSET,
    targetPos.z + START_Z_OFFSET,
    midPos.x,
    midPos.y,
    midPos.z,
    endPos.x,
    endPos.y,
    endPos.z,
  ]);

  const lineMat = new LineMaterial({
    color: new THREE.Color(LINE_COLOR).getHex(),
    linewidth: 1.5,
    transparent: true,
    opacity: 0.9,
    resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
  });
  const line = new Line2(lineGeo, lineMat);
  line.computeLineDistances();

  // Soft glow line behind
  const glowGeo = new LineGeometry();
  glowGeo.setPositions([
    targetPos.x,
    targetPos.y,
    targetPos.z,
    midPos.x,
    midPos.y,
    midPos.z,
    endPos.x,
    endPos.y,
    endPos.z,
  ]);

  const glowMat = new LineMaterial({
    color: new THREE.Color(LINE_COLOR).getHex(),
    linewidth: 4,
    transparent: true,
    opacity: 0.15,
    resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glowLine = new Line2(glowGeo, glowMat);
  glowLine.computeLineDistances();

  // Glow dots at start and bend
  const diagonalDot = createGlowDot(DIAGONAL_OFFSET);

  const startDot = createGlowDot(targetPos);
  const midDot = createGlowDot(midPos);

  // Text label
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#D2DCE8';
  ctx.font = '300 32px Helvetica Neue, Arial, sans-serif';
  ctx.letterSpacing = '3px';
  ctx.textAlign = 'left';
  ctx.fillText(labelText, 0, 40);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    depthWrite: false,
    transparent: true,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(0.04, 0.005, 1);
  sprite.position.copy(endPos);
  sprite.position.x += 0.02;

  const group = new THREE.Group();
  group.add(glowLine);
  group.add(line);
  group.add(startDot);
  // group.add(midDot);
  // group.add(diagonalDot);
  group.add(sprite);

  return { group, line, glowLine, startDot, midDot, sprite, targetMesh };
}

function updateAnnotation(annotation) {
  if (!annotation) return;
  const { line, glowLine, startDot, midDot, sprite, targetMesh } = annotation;

  const targetPos = new THREE.Vector3();
  targetMesh.getWorldPosition(targetPos);
  targetPos.y += START_Y_OFFSET;
  targetPos.z += START_Z_OFFSET;
  targetPos.x += START_X_OFFSET;

  const midPos = new THREE.Vector3(
    targetPos.x + DIAGONAL_OFFSET.x,
    targetPos.y + DIAGONAL_OFFSET.y,
    targetPos.z + DIAGONAL_OFFSET.z
  );

  const endPos = new THREE.Vector3(midPos.x + HORIZONTAL_LENGTH, midPos.y, midPos.z);

  const positions = [
    targetPos.x,
    targetPos.y,
    targetPos.z,
    midPos.x,
    midPos.y,
    midPos.z,
    endPos.x,
    endPos.y,
    endPos.z,
  ];

  line.geometry.setPositions(positions);
  line.computeLineDistances();
  glowLine.geometry.setPositions(positions);
  glowLine.computeLineDistances();

  startDot.position.copy(targetPos);
  midDot.position.copy(midPos);

  sprite.position.copy(endPos);
  sprite.position.x += 0.02;
}

let cameraAnnotation = null;

export function setupPullApart() {
  cameraAnnotation = createAnnotation('M2_BackCam_Case', 'Camera');
  if (cameraAnnotation) {
    cameraAnnotation.group.visible = false;
    scene.add(cameraAnnotation.group);
  }

  window.addEventListener(
    'pullApart:show',
    () => {
      if (cameraAnnotation) {
        cameraAnnotation.group.visible = true;
      }
    },
    { once: true }
  );
}

export function updatePullApart() {
  if (!cameraAnnotation || !cameraAnnotation.group.visible) return;
  updateAnnotation(cameraAnnotation);
}
