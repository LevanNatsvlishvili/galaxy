import * as THREE from 'three';
import gsap from 'gsap';
import { camera } from '@/utils/renderer';

const CANVAS_SIZE = 1024;
const STROKE_COLOR = '#1f2937';
const STROKE_WIDTH = 6;

let canvas = null;
let ctx = null;
let canvasTexture = null;
let displayMesh = null;
let penMesh = null;
let phoneModel = null;

let writingMode = false;
let isDrawing = false;
let lastUV = null;
let penIdlePos = null;
// Offset (in pen-parent local space) from the pen group's origin to its tip.
// Captured once after the pen is placed so we know how to offset the pen so
// that the *tip* lands on the cursor hit point, not the pen's center.
const penTipLocalOffset = new THREE.Vector3();

const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();
const tmpWorld = new THREE.Vector3();
const tmpLocal = new THREE.Vector3();

function createBoardCanvas() {
  canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = STROKE_COLOR;
  ctx.lineWidth = STROKE_WIDTH;

  canvasTexture = new THREE.CanvasTexture(canvas);
  canvasTexture.colorSpace = THREE.SRGBColorSpace;
  canvasTexture.flipY = false;
}

function createPen() {
  const group = new THREE.Group();

  // Body
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.4,
    roughness: 0.35,
  });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.08, 24), bodyMat);

  // Tip
  const tipMat = new THREE.MeshStandardMaterial({
    color: 0xc0c8d4,
    metalness: 0.9,
    roughness: 0.2,
  });
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.0035, 0.01, 24), tipMat);
  tip.position.y = -0.045;
  tip.rotation.x = Math.PI;

  // Cap accent
  const capMat = new THREE.MeshStandardMaterial({
    color: 0x6e5aa6,
    metalness: 0.6,
    roughness: 0.3,
  });
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0036, 0.0036, 0.012, 24), capMat);
  cap.position.y = 0.04;

  group.add(body);
  group.add(tip);
  group.add(cap);

  // Lay pen horizontally
  group.rotation.z = Math.PI / 2;

  group.userData.isPen = true;
  return group;
}

function setWritingMode(enabled) {
  writingMode = enabled;

  // Visual cue: glow/scale pen slightly when active
  if (penMesh) {
    penMesh.rotation.y = enabled ? Math.PI - Math.PI / 3 : Math.PI / 2;
    penMesh.rotation.x = enabled ? -Math.PI / 2 + Math.PI / 18 : -Math.PI / 2;
    penMesh.rotation.z = enabled ? Math.PI / 2 : Math.PI / 2;
    gsap.to(penMesh.scale, {
      x: enabled ? 1.15 : 1,
      y: enabled ? 1.15 : 1,
      z: enabled ? 1.15 : 1,
      duration: 0.3,
      ease: 'power2.out',
    });

    // Restore the idle position when leaving writing mode
    if (!enabled && penIdlePos) {
      gsap.to(penMesh.position, {
        x: penIdlePos.x,
        y: penIdlePos.y,
        z: penIdlePos.z,
        duration: 0.4,
        ease: 'power2.out',
      });
    }
  }

  document.body.style.cursor = enabled ? 'crosshair' : 'default';
}

export function revealPen({ delay = 0 } = {}) {
  if (!penMesh) return;
  penMesh.visible = true;
  gsap.to(penMesh.scale, {
    x: 1,
    y: 1,
    z: 1,
    duration: 0.8,
    delay,
    ease: 'back.out(1.6)',
  });
}

export function showDrawPanel() {
  if (document.getElementById('draw-panel')) return;

  const panel = document.createElement('div');
  panel.id = 'draw-panel';
  panel.style.cssText = `
    position: fixed;
    bottom: 8%;
    left: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    font-family: 'Helvetica Neue', Arial, sans-serif;
    color: #D2DCE8;
    text-align: center;
    pointer-events: none;
    opacity: 0;
    z-index: 10;
  `;

  const instructions = document.createElement('p');
  instructions.textContent = 'Click Draw, then click and drag on the screen to write.';
  instructions.style.cssText = `
    margin: 0;
    font-size: 1rem;
    font-weight: 300;
    letter-spacing: 0.05em;
    color: #B8B0C8;
  `;

  const button = document.createElement('button');
  button.textContent = 'Draw';
  button.style.cssText = `
    pointer-events: auto;
    padding: 0.6rem 2rem;
    font-family: inherit;
    font-size: 0.95rem;
    font-weight: 300;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #D2DCE8;
    background: transparent;
    border: 1px solid rgba(192, 200, 212, 0.6);
    border-radius: 999px;
    cursor: pointer;
    transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  `;

  button.addEventListener('mouseenter', () => {
    button.style.background = 'rgba(192, 200, 212, 0.12)';
    button.style.boxShadow = '0 0 18px rgba(192, 200, 212, 0.3)';
  });
  button.addEventListener('mouseleave', () => {
    button.style.background = 'transparent';
    button.style.boxShadow = 'none';
  });

  button.addEventListener('click', () => {
    const next = !writingMode;
    setWritingMode(next);
    button.textContent = next ? 'Stop' : 'Draw';
  });

  panel.appendChild(instructions);
  panel.appendChild(button);
  document.body.appendChild(panel);

  gsap.to(panel, {
    opacity: 1,
    duration: 1,
    ease: 'power2.out',
  });
}

// Move the pen so its tip lands on a world-space point, keeping rotation
// unchanged. The tip offset is recomputed from the current rotation so the
// user can re-orient the pen freely.
function movePenTipTo(worldPoint) {
  const parent = penMesh.parent;
  parent.updateWorldMatrix(true, false);
  penMesh.updateWorldMatrix(true, true);

  // Current tip offset in parent-local space (recomputed every call to pick
  // up any changes to penMesh.rotation).
  const tipChild = penMesh.children.find((c) => c.geometry?.type === 'ConeGeometry');
  if (tipChild) {
    tipChild.getWorldPosition(tmpWorld);
    parent.worldToLocal(tmpWorld);
    penTipLocalOffset.copy(tmpWorld).sub(penMesh.position);
  }

  // Convert the target world point into the pen parent's local space
  tmpLocal.copy(worldPoint);
  parent.worldToLocal(tmpLocal);

  // Pen position is its origin; offset so the *tip* lands on the target
  penMesh.position.set(
    tmpLocal.x - penTipLocalOffset.x,
    tmpLocal.y - penTipLocalOffset.y,
    tmpLocal.z - penTipLocalOffset.z
  );
}

function updatePointerNdc(event) {
  pointerNdc.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointerNdc.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function getBoardUV() {
  raycaster.setFromCamera(pointerNdc, camera);
  const hits = raycaster.intersectObject(displayMesh, false);
  if (hits.length === 0) return null;
  return hits[0].uv;
}

function drawTo(uv) {
  if (!uv) return;
  const x = uv.x * CANVAS_SIZE;
  const y = uv.y * CANVAS_SIZE;

  if (lastUV) {
    const lx = lastUV.x * CANVAS_SIZE;
    const ly = lastUV.y * CANVAS_SIZE;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(x, y);
    ctx.stroke();
  } else {
    // Start a dot so single clicks leave a mark
    ctx.beginPath();
    ctx.arc(x, y, STROKE_WIDTH / 2, 0, Math.PI * 2);
    ctx.fillStyle = STROKE_COLOR;
    ctx.fill();
  }

  lastUV = uv.clone();
  canvasTexture.needsUpdate = true;
}

function onPointerDown(event) {
  if (!writingMode) return;
  updatePointerNdc(event);

  // Start a stroke if we hit the board
  const uv = getBoardUV();
  if (uv) {
    isDrawing = true;
    lastUV = null;
    drawTo(uv);
  }
}

function onPointerMove(event) {
  if (!writingMode) return;
  updatePointerNdc(event);

  // Raycast board once for both aiming + drawing
  raycaster.setFromCamera(pointerNdc, camera);
  const hits = raycaster.intersectObject(displayMesh, false);

  if (hits.length > 0) {
    // Slide the pen so its tip sits on the cursor's hit point
    movePenTipTo(hits[0].point);

    if (isDrawing) drawTo(hits[0].uv);
  } else if (isDrawing) {
    lastUV = null; // pointer left the board — break the stroke
  }
}

function onPointerUp() {
  isDrawing = false;
  lastUV = null;
}

export function setupWhiteboard(model) {
  phoneModel = model;
  displayMesh = phoneModel.getObjectByName('M2_Display_Activearea');
  if (!displayMesh) return;

  createBoardCanvas();

  // Swap display material for the drawable canvas
  displayMesh.material = new THREE.MeshBasicMaterial({
    map: canvasTexture,
    toneMapped: false,
  });

  // Pen sits next to the phone, parented to the model so it follows rotation
  penMesh = createPen();
  penMesh.position.set(-0.05, 0, 0);
  penMesh.rotation.y = Math.PI / 2;
  penMesh.rotation.x = -Math.PI / 2;

  phoneModel.add(penMesh);

  // Start hidden — revealPen() brings it in after the rotation starts.
  penMesh.visible = false;
  penMesh.scale.setScalar(0.001);

  // Snapshot the idle position so we can restore it when leaving writing mode.
  penIdlePos = penMesh.position.clone();

  // Compute tip offset in pen-parent local space. The tip child sits at
  // local (0, -0.045, 0) inside the pen group, but the group has its own
  // rotation applied, so we need the world position of the tip converted
  // back into the parent's local frame.
  phoneModel.updateWorldMatrix(true, true);
  const tipChild = penMesh.children.find((c) => c.geometry?.type === 'ConeGeometry');
  if (tipChild) {
    tipChild.getWorldPosition(tmpWorld);
    penMesh.parent.worldToLocal(tmpWorld);
    penTipLocalOffset.copy(tmpWorld).sub(penMesh.position);
  }

  window.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
}
