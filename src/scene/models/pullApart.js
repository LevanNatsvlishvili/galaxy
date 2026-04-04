import gsap from 'gsap';
import { models } from '@/store/models';
import { scene } from '@/utils/renderer';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import * as THREE from 'three';

const LINE_COLOR = '#C0C8D4';
const DISASSEMBLE_DURATION = 2;
const DISASSEMBLE_DELAY = 1;

// Part groups: meshes that move together + their label + explode direction
const PART_GROUPS = [
  {
    label: 'Camera Module',
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
      // 'M2_Flash',
      // 'M2_Flash_Glass',
      // 'M2_Blackhole',
    ],
    offset: { x: 0, y: 0.02, z: -0.04 },
    labelSide: 'right',
  },
  {
    label: 'Back Cover',
    meshes: ['M2_Backcover_Glass', 'M2_Backcover_Glass_In', 'M2_Samsung_Logo'],
    offset: { x: 0, y: -0.008, z: -0.02 },
    labelSide: 'left',
  },
  {
    label: 'Type-C Port',
    meshes: ['M2_USB_1', 'M2_USB_2'],
    offset: { x: 0, y: -0.02, z: 0 },
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

    partData.push({ meshes, originalPositions, label, annotation, partDef });

    // Animate meshes exploding outward
    meshes.forEach((mesh) => {
      console.log(mesh);
      // if(mesh.name.includes('M2_USB_1')) {}
      gsap.to(mesh.position, {
        x: mesh.position.x + partDef.offset.x,
        y: mesh.position.y + partDef.offset.y,
        z: mesh.position.z + partDef.offset.z,
        duration: DISASSEMBLE_DURATION,
        delay: DISASSEMBLE_DELAY + i * 0.3,
        ease: 'power2.inOut',
      });
    });

    // Fade in line and label after parts move
    const fadeDelay = DISASSEMBLE_DELAY + i * 0.3 + DISASSEMBLE_DURATION * 0.5;

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
}

export function updatePullApart() {
  if (!annotationGroup || !annotationGroup.visible) return;

  partData.forEach(({ meshes, annotation, partDef }) => {
    if (meshes.length === 0) return;

    // Update line start to follow part center
    const center = new THREE.Vector3();
    meshes.forEach((m) => {
      const worldPos = new THREE.Vector3();
      m.getWorldPosition(worldPos);
      center.add(worldPos);
    });
    center.divideScalar(meshes.length);

    const labelDir = partDef.labelSide === 'right' ? 1 : -1;
    const labelPos = center.clone();
    labelPos.x += labelDir * 0.06;
    labelPos.y += partDef.offset.y * 0.5;

    const lineEnd = labelPos.clone();
    lineEnd.x -= labelDir * 0.02;

    const positions = [center.x, center.y, center.z, lineEnd.x, lineEnd.y, lineEnd.z];

    annotation.line.geometry.setPositions(positions);
    annotation.line.computeLineDistances();
    annotation.glowLine.geometry.setPositions(positions);
    annotation.glowLine.computeLineDistances();
    annotation.dot.position.copy(center);
  });
}
