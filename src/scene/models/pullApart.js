import gsap from 'gsap';
import { models } from '@/store/models';
import { scene } from '@/utils/renderer';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import * as THREE from 'three';

const LINE_COLOR = '#C0C8D4';
const DOT_Z_OFFSET = 0.01;
const DISASSEMBLE_DURATION = 2;
const DISASSEMBLE_DELAY = 0;
const ASSEMBLE_DELAY = 3;

// Part groups: meshes that move together + their label + explode direction
const PART_GROUPS = [
  {
    label: 'Aluminum frame',
    meshes: [
      'M2_Backcover_Glass',
      'M2_Backcover_Glass_In',
      'M2_Samsung_Logo',
      'M2_Flash',
      'M2_Flash_Glass',
    ],
    offset: { x: 0, y: -0.008, z: -0.04 },
    labelSide: 'left',
  },
  {
    label: '200MP Camera',
    meshes: [
      'M2_BackCam_Case',
      'M2_BackCam_Case_2',
      'M2_BackCam_Case_3',
      'M2_BackCam_Case_Side',
      'M2_BackCam_Case_Side_2',
      'M2_BackCam_Case_Side_3',
      'M2_BackCam_Glass',
      'M2_BackCam_Ring',
      'M2_BackCam_Lense',
      'M2_BackCam_Frame',
      'M2_BackCam_Frame_2',
      'M2_BackCam_Frame_Edge',
      'M2_BackCam_Frame_Inside',
      'M2_BackCam_Body',
      'M1_BackCam_Glass_AO',
      // 'M2_Blackhole',
    ],
    offset: { x: 0, y: 0.02, z: -0.08 },
    labelSide: 'left',
  },
  {
    label: 'Fast Charging',
    meshes: ['M2_USB_1', 'M2_USB_2'],
    offset: { x: 0, y: -0.04, z: 0 },
    labelSide: 'right',
  },
];

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

function createLabel(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  const padding = 20;
  const fontSize = 42;
  ctx.font = `300 ${fontSize}px Helvetica Neue, Arial, sans-serif`;
  ctx.letterSpacing = '3px';
  const textWidth = ctx.measureText(text).width;

  const boxX = padding / 2;
  const boxY = padding / 2;
  const boxW = textWidth + padding * 2;
  const boxH = fontSize + padding;

  // Black background fill
  ctx.fillStyle = '#000000';
  ctx.roundRect(boxX, boxY, boxW, boxH, 4);
  ctx.fill();

  // Glow border
  ctx.shadowColor = 'rgba(192, 200, 212, 0.4)';
  ctx.shadowBlur = 12;
  ctx.strokeStyle = 'rgba(192, 200, 212, 0.6)';
  ctx.lineWidth = 5;
  ctx.roundRect(boxX, boxY, boxW, boxH, 4);
  ctx.stroke();

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#D2DCE8';
  ctx.font = `300 ${fontSize}px Helvetica Neue, Arial, sans-serif`;
  ctx.letterSpacing = '3px';
  ctx.textAlign = 'left';
  ctx.fillText(text, boxX + padding, boxY + fontSize);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    depthWrite: false,
    transparent: true,
    opacity: 0,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(0.05, 0.0125, 1);
  return sprite;
}

function createAnnotationLine(startPos, endPos) {
  const resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);

  const lineGeo = new LineGeometry();
  lineGeo.setPositions([startPos.x, startPos.y, startPos.z, endPos.x, endPos.y, endPos.z]);

  const lineMat = new LineMaterial({
    color: new THREE.Color(LINE_COLOR).getHex(),
    linewidth: 1.5,
    transparent: true,
    opacity: 0,
    resolution,
  });
  const line = new Line2(lineGeo, lineMat);
  line.computeLineDistances();

  const glowGeo = new LineGeometry();
  glowGeo.setPositions([startPos.x, startPos.y, startPos.z, endPos.x, endPos.y, endPos.z]);

  const glowMat = new LineMaterial({
    color: new THREE.Color(LINE_COLOR).getHex(),
    linewidth: 4,
    transparent: true,
    opacity: 0,
    resolution,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glowLine = new Line2(glowGeo, glowMat);
  glowLine.computeLineDistances();

  const dot = createGlowDot(startPos);
  dot.material.opacity = 0;

  const group = new THREE.Group();
  group.add(line);
  group.add(glowLine);
  group.add(dot);

  return { group, line, glowLine, dot, lineMat, glowMat };
}

const partData = [];
let annotationGroup = null;

export function setupPullApart() {
  annotationGroup = new THREE.Group();
  annotationGroup.visible = false;
  scene.add(annotationGroup);

  window.addEventListener(
    'pullApart:show',
    () => {
      startDisassembly();
    },
    { once: true }
  );
}

function startDisassembly() {
  const model = models.galaxy;
  if (!model) return;

  annotationGroup.visible = true;

  // Log unassigned meshes
  const assignedNames = PART_GROUPS.flatMap((p) => p.meshes);
  model.traverse((child) => {
    if (child.isMesh && !assignedNames.includes(child.name)) {
      console.log('Unassigned mesh:', child.name);
    }
  });

  PART_GROUPS.forEach((partDef, i) => {
    const meshes = [];
    const originalPositions = [];

    partDef.meshes.forEach((name) => {
      const mesh = model.getObjectByName(name);
      if (mesh) {
        meshes.push(mesh);
        originalPositions.push(mesh.position.clone());
      }
    });

    if (meshes.length === 0) return;

    // Calculate center of this part group
    const center = new THREE.Vector3();
    meshes.forEach((m) => {
      const worldPos = new THREE.Vector3();
      m.getWorldPosition(worldPos);
      center.add(worldPos);
    });
    center.divideScalar(meshes.length);

    // Label position
    const labelDir = partDef.labelSide === 'right' ? 1 : -1;
    const labelPos = center.clone();
    labelPos.x += labelDir * 0.06;
    labelPos.y += partDef.offset.y * 0.5;

    const label = createLabel(partDef.label);
    label.position.copy(labelPos);
    annotationGroup.add(label);

    // Annotation line from part center to label
    const lineStart = center.clone();
    lineStart.x += partDef.offset.x;
    lineStart.y += partDef.offset.y;
    lineStart.z += partDef.offset.z;

    const lineEnd = labelPos.clone();
    lineEnd.x -= labelDir * 0.02;

    const annotation = createAnnotationLine(lineStart, lineEnd);
    annotationGroup.add(annotation.group);

    const progress = { value: 0 };
    partData.push({ meshes, originalPositions, label, annotation, partDef, progress });

    // Animate progress 0→1, meshes update in updatePullApart
    gsap.to(progress, {
      value: 1,
      duration: DISASSEMBLE_DURATION,
      delay: DISASSEMBLE_DELAY,
      ease: 'power2.inOut',
    });

    // Fade in line and label after parts move
    const fadeDelay = DISASSEMBLE_DELAY + DISASSEMBLE_DURATION * 0.5;

    gsap.to(annotation.lineMat, {
      opacity: 0.9,
      duration: 1,
      delay: fadeDelay,
      ease: 'power2.out',
    });

    gsap.to(annotation.glowMat, {
      opacity: 0.15,
      duration: 1,
      delay: fadeDelay,
      ease: 'power2.out',
    });

    gsap.to(annotation.dot.material, {
      opacity: 1,
      duration: 1,
      delay: fadeDelay,
      ease: 'power2.out',
    });

    gsap.to(label.material, {
      opacity: 1,
      duration: 1.2,
      delay: fadeDelay + 0.3,
      ease: 'power2.out',
    });
  });

  // Reassemble after delay
  const assembleStart = DISASSEMBLE_DELAY + DISASSEMBLE_DURATION + ASSEMBLE_DELAY;

  PART_GROUPS.forEach((partDef, i) => {
    const data = partData[i];
    if (!data) return;

    const stagger = i * 0.3;

    // Fade out labels and lines first
    gsap.to(data.annotation.lineMat, {
      opacity: 0,
      duration: 0.8,
      delay: assembleStart + stagger,
      ease: 'power2.in',
    });

    gsap.to(data.annotation.glowMat, {
      opacity: 0,
      duration: 0.8,
      delay: assembleStart + stagger,
      ease: 'power2.in',
    });

    gsap.to(data.annotation.dot.material, {
      opacity: 0,
      duration: 0.8,
      delay: assembleStart + stagger,
      ease: 'power2.in',
    });

    gsap.to(data.label.material, {
      opacity: 0,
      duration: 0.8,
      delay: assembleStart + stagger,
      ease: 'power2.in',
    });

    // Animate parts back
    gsap.to(data.progress, {
      value: 0,
      duration: DISASSEMBLE_DURATION,
      delay: assembleStart + stagger + 0.5,
      ease: 'power2.inOut',
    });
  });

  // After reassembly completes, rotate phone to face camera
  const lastStagger = (PART_GROUPS.length - 1) * 0.3;
  const rotateDelay = assembleStart + lastStagger + 0.5 + DISASSEMBLE_DURATION;

  gsap.to(model.rotation, {
    y: Math.PI,
    duration: 2,
    delay: rotateDelay,
    ease: 'power2.inOut',
    onComplete: () => {
      window.dispatchEvent(new Event('colors:show'));
    },
  });
}

export function updatePullApart() {
  if (!annotationGroup || !annotationGroup.visible) return;

  partData.forEach(({ meshes, originalPositions, label, annotation, partDef, progress }) => {
    if (meshes.length === 0) return;

    // Apply offset * progress to mesh positions
    meshes.forEach((mesh, j) => {
      const orig = originalPositions[j];
      mesh.position.set(
        orig.x + partDef.offset.x * progress.value,
        orig.y + partDef.offset.y * progress.value,
        orig.z + partDef.offset.z * progress.value
      );
    });

    // Update line start to follow part center
    const center = new THREE.Vector3();
    meshes.forEach((m) => {
      const worldPos = new THREE.Vector3();
      m.getWorldPosition(worldPos);
      center.add(worldPos);
    });
    center.divideScalar(meshes.length);

    const labelDir = partDef.labelSide === 'right' ? 1 : -1;

    // Line end = offset from center
    const lineEnd = center.clone();
    lineEnd.x += labelDir * 0.04;

    // Label sits at the end of the line
    // Left labels need extra offset to align text start with line end
    const labelOffset = partDef.labelSide === 'left' ? 0.0125 : 0.025;
    label.position.set(
      lineEnd.x + labelDir * labelOffset,
      lineEnd.y - 0.0025,
      lineEnd.z + DOT_Z_OFFSET
    );

    center.z += DOT_Z_OFFSET;

    const positions = [center.x, center.y, center.z, lineEnd.x, lineEnd.y, lineEnd.z];

    annotation.line.geometry.setPositions(positions);
    annotation.line.computeLineDistances();
    annotation.glowLine.geometry.setPositions(positions);
    annotation.glowLine.computeLineDistances();
    annotation.dot.position.copy(center);
  });
}
