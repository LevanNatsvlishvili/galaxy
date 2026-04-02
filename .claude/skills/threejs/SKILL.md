---
name: threejs
description: >
  Three.js project conventions and coding standards. Use this skill whenever working on any
  Three.js project — scene setup, renderer configuration, animation loops, asset loading,
  GLTF/DRACO model patterns, lighting, camera controls, raycasting, state management,
  textures, responsive resizing, or project folder structure. Also trigger when the user
  mentions WebGL, 3D web development, interactive 3D experiences, product configurators,
  browser-based games, or any work involving the three.js library. Even if the user just
  says "set up a Three.js project" or "add a model to my scene", use this skill.
---

# Three.js Project Conventions

When working on a Three.js project, follow the conventions and patterns below. These are derived from production Three.js codebases and apply to any project type — visualizations, product configurators, interactive experiences, games, etc.

---

## Folder Structure

```
src/
├── config/           # All configuration objects (camera, lights, renderer, assets)
├── scene/            # Three.js scene composition
│   ├── setup.js      # Scene initialization entry point
│   ├── environment/  # Background, fog, skybox, ground
│   ├── lights/       # Light setup
│   └── models/       # 3D objects / sprites organized by category
├── utils/            # Shared utilities
│   ├── renderer.js   # Scene, camera, renderer initialization
│   ├── controls/     # Camera controls
│   └── loader/       # Asset loaders (GLTF, FBX, texture)
├── store/            # Global state and model reference caches
├── ui/               # 2D UI layer (if using Pixi.js or HTML overlay)
├── styles/
└── main.js           # Entry point + animation loop
public/               # Static assets (models, textures, sprites)
```

Organize `models/` by domain category, not by file type:

```
scene/models/
├── characters/
├── structures/
├── plants/
└── environment/
```

---

## Naming Conventions

### Files and Folders
- **camelCase** for all JS source files: `characterAnimation.js`, `placementTool.js`
- **camelCase** for folder names: `monsterAI/`, `spawnTool/`
- Prefix files with their role when clarity helps:
  - `spawn*.js` — functions that instantiate and add objects to the scene
  - `setup*.js` — initialization functions run once on startup
  - `build*.js` — UI component factory functions
  - `update*.js` — per-frame update functions

### Variables and Functions
- **camelCase** for all variables and functions
- **SCREAMING_SNAKE_CASE** for module-level constants: `BASE_RADIUS`, `DRACO_DECODER_PATH`, `CLICK_THRESHOLD`
- Keep names descriptive but concise; avoid generic names like `data`, `obj`, `temp`
- `delta` or `deltaSec` for time elapsed in animation loops

### Classes and Three.js Objects
- **PascalCase** for class definitions
- Three.js built-ins are already PascalCase — follow suit for anything wrapping them
- Name Three.js object variables after what they represent: `groundMesh`, `ambientLight`, `characterGroup`

### State and Config Properties
- Use flat, descriptive keys: `characterCurrentHealth`, `isDay`, `isTutorialFinished`
- Arrays of scene objects: `monsters`, `tomatoes`, `trees` (plural noun)
- Boolean flags: prefix with `is`, `has`, or `can`: `isDay`, `hasAttacked`, `canMove`

---

## Configuration

Centralize all tunable values in `src/config/config.js`. Never hardcode magic numbers in scene or gameplay files.

```js
// config.js
export const config = {
  camera: {
    fov: 10.5,
    position: { x: 10, y: 9, z: 10 },
  },
  controls: {
    enableDamping: true,
    maxPolarAngle: Math.PI / 2,
    minPolarAngle: 0,
  },
  renderer: {
    pixelRatio: Math.min(window.devicePixelRatio, 2),
    shadowMap: true,
  },
  lights: {
    ambient: { color: '#ffffff', intensity: 5 },
    directional: {
      color: '#ffffff',
      intensity: 1,
      position: { x: -1.5, y: 2, z: -8 },
      shadow: {
        mapSize: 1024,
        camera: { top: 8, right: 8, bottom: -8, left: -8, near: 1, far: 15 },
      },
    },
  },
  fps: { limit: 60 },
}
```

For per-asset configuration (size, price, metadata), use a separate `assetConfig.js`:

```js
export const assetConfig = {
  tree: { blockSize: 4 },
  house: { blockSize: 96, xBlocks: 9, yBlocks: 6 },
}
```

---

## Renderer, Scene, and Camera Setup

Keep all Three.js core object creation in `src/utils/renderer.js`. Export `scene`, `camera`, and `renderer` as named exports so every other module can import them directly.

```js
// renderer.js
import * as THREE from 'three'
import { config } from '@/config/config'

export const scene = new THREE.Scene()

const canvas = document.querySelector('canvas.webgl')

export const camera = new THREE.PerspectiveCamera(
  config.camera.fov,
  window.innerWidth / window.innerHeight
)
camera.position.set(
  config.camera.position.x,
  config.camera.position.y,
  config.camera.position.z
)

export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(config.renderer.pixelRatio)
renderer.shadowMap.enabled = config.renderer.shadowMap
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.outputColorSpace = THREE.SRGBColorSpace
```

---

## Animation Loop

The animation loop lives entirely in `main.js`. Use a manual FPS limiter so behavior is consistent across high-refresh displays.

```js
// main.js
import { renderer, scene, camera } from '@/utils/renderer'
import { controls } from '@/utils/controls/controls'
import { config } from '@/config/config'

const frameDuration = 1000 / config.fps.limit
let lastTime = 0

const tick = (now) => {
  requestAnimationFrame(tick)

  const delta = now - lastTime
  if (delta < frameDuration) return
  lastTime = now - (delta % frameDuration)

  const deltaSec = delta / 1000

  // Update systems — each in its own function, imported from their module
  updateSomething(deltaSec)

  controls.update()
  renderer.render(scene, camera)
}

requestAnimationFrame(tick)
```

- Pass `deltaSec` (seconds, not milliseconds) to all update functions
- Each system (animations, physics, AI, etc.) gets its own `update*(deltaSec)` function in its own file
- `main.js` only orchestrates — no business logic

---

## Lights

Create lights in `src/scene/lights/lights.js` and export them for later reference (e.g., to adjust intensity at runtime).

```js
// lights.js
import * as THREE from 'three'
import { scene } from '@/utils/renderer'
import { config } from '@/config/config'

const { ambient, directional } = config.lights

export const ambientLight = new THREE.AmbientLight(ambient.color, ambient.intensity)

export const directionalLight = new THREE.DirectionalLight(
  directional.color,
  directional.intensity
)
directionalLight.position.set(
  directional.position.x,
  directional.position.y,
  directional.position.z
)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.width = directional.shadow.mapSize
directionalLight.shadow.mapSize.height = directional.shadow.mapSize

const { top, right, bottom, left, near, far } = directional.shadow.camera
directionalLight.shadow.camera.top = top
directionalLight.shadow.camera.right = right
directionalLight.shadow.camera.bottom = bottom
directionalLight.shadow.camera.left = left
directionalLight.shadow.camera.near = near
directionalLight.shadow.camera.far = far

scene.add(ambientLight, directionalLight)
```

---

## Camera Controls

```js
// controls/controls.js
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { camera, renderer } from '@/utils/renderer'
import { config } from '@/config/config'

export const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = config.controls.enableDamping
controls.maxPolarAngle = config.controls.maxPolarAngle
controls.minPolarAngle = config.controls.minPolarAngle
```

Call `controls.update()` every frame inside the animation loop.

---

## Asset Loaders

Keep each loader in `src/utils/loader/`. All loaders share a single `LoadingManager` instance for global progress tracking.

```js
// loader/loadingManager.js
import * as THREE from 'three'

export const loadingManager = new THREE.LoadingManager()

export const onLoadProgress = (cb) => {
  loadingManager.onProgress = (_, loaded, total) => cb(loaded, total)
}

export const onLoadComplete = (cb) => {
  loadingManager.onLoad = cb
}
```

```js
// loader/gltfLoader.js
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { loadingManager } from './loadingManager'

const DRACO_DECODER_PATH = 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/'

const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath(DRACO_DECODER_PATH)

export const gltfLoader = new GLTFLoader(loadingManager)
gltfLoader.setDRACOLoader(dracoLoader)
```

```js
// loader/textureLoader.js
import * as THREE from 'three'
import { loadingManager } from './loadingManager'

export const textureLoader = new THREE.TextureLoader(loadingManager)
```

---

## Model / Object Patterns

Model files are factory functions that return Three.js objects. They are async when loading from files.

```js
// scene/models/structures/house.js
import * as THREE from 'three'
import { gltfLoader } from '@/utils/loader/gltfLoader'

export async function house() {
  const gltf = await gltfLoader.loadAsync('./models/house.glb')
  const model = gltf.scene
  model.traverse((child) => {
    if (child.isMesh) child.castShadow = true
  })
  return model
}
```

For sprites:

```js
// scene/models/plants/tomato.js
import * as THREE from 'three'
import { textureLoader } from '@/utils/loader/textureLoader'

const ripeTexture = textureLoader.load('./sprite/tomato/ripe.webp')
ripeTexture.colorSpace = THREE.SRGBColorSpace

const ripeMat = new THREE.SpriteMaterial({ map: ripeTexture, depthWrite: false })

export function tomatoModel(point, status = 'growing') {
  const group = new THREE.Group()

  const ripeSprite = new THREE.Sprite(ripeMat.clone())
  ripeSprite.visible = status === 'ripe'

  group.add(ripeSprite)
  group.position.set(point.x, 0, point.z)
  return group
}
```

Key rules:
- Always `.clone()` materials when reusing them across instances
- Set `colorSpace = THREE.SRGBColorSpace` on all loaded textures
- Set `depthWrite = false` on sprite materials to avoid z-fighting
- Use `renderOrder` on sprites that need explicit layering

---

## Textures

```js
const groundTexture = textureLoader.load('./textures/grass.webp')
groundTexture.colorSpace = THREE.SRGBColorSpace
groundTexture.wrapS = THREE.RepeatWrapping
groundTexture.wrapT = THREE.RepeatWrapping
groundTexture.repeat.set(repeatX, repeatY)
```

- Prefer `.webp` over `.png`/`.jpg` for smaller size
- Prefer DRACO-compressed `.glb` over uncompressed
- Prefer powers of two for texture dimensions (512, 1024, 2048)
- Use `THREE.SRGBColorSpace` for all color textures; do NOT set colorSpace on normal/roughness maps

---

## Global State

Use a single plain object in `src/store/state.js`. No reactive framework needed.

```js
// store/state.js
export const state = {
  isDay: true,
  money: 10,
  plants: [],
  monsters: [],
}
```

Cache loaded model references in a separate `store/models.js` to avoid re-importing across files:

```js
// store/models.js
export const models = {
  character: null,     // Set after load
  houseModel: null,
}
```

---

## Lazy / Deferred Loading

Load critical scene objects first (character, ground, lights), then lazy-load secondary assets after the scene is visible:

```js
// scene/setupRest.js
export async function setupRest() {
  const [tomatoMod, cucumberMod] = await Promise.all([
    import('@/scene/models/plants/tomato'),
    import('@/scene/models/plants/cucumber'),
  ])
  models.tomatoModel = tomatoMod
  models.cucumberModel = cucumberMod
}
```

Call `setupRest()` after hiding the loading screen — never block the first render on non-essential assets.

---

## Responsive Resizing

```js
// utils/windowResizer.js
import { camera, renderer } from '@/utils/renderer'

export function windowResizer() {
  const handleResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }
  window.addEventListener('resize', handleResize)
}
```

---

## Raycasting / Pointer Interaction

```js
import * as THREE from 'three'
import { camera, renderer } from '@/utils/renderer'

const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()

renderer.domElement.addEventListener('pointermove', (e) => {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1
  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObjects(interactiveObjects)
  // handle hits
})
```

For distinguishing clicks from drags, track pointer distance between `pointerdown` and `pointerup` using a `CLICK_THRESHOLD` constant.

---

## Keyboard Input

Track key state in a plain object, updated by event listeners. Never poll `event.key` inside the animation loop.

```js
const keys = { up: false, down: false, left: false, right: false }

window.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.up = true
  if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.down = true
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true
  if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true
})

window.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.up = false
  // ...
})
```

---

## Custom Events

Use native browser events for decoupled communication between systems:

```js
// Dispatch
window.dispatchEvent(new Event('scene:ready'))
window.dispatchEvent(new CustomEvent('object:selected', { detail: { id } }))

// Listen
window.addEventListener('scene:ready', () => { /* ... */ })
```

Use a namespace prefix (`scene:`, `ui:`, `object:`) to avoid collisions.

---

## Animation System (GLTF)

```js
// Load base model + animation clips
const baseGltf = await gltfLoader.loadAsync('./models/character.glb')
const idleGltf = await gltfLoader.loadAsync('./models/idle.glb')

const mixer = new THREE.AnimationMixer(baseGltf.scene)
const actions = {
  idle: mixer.clipAction(idleGltf.animations[0]),
  walk: mixer.clipAction(walkGltf.animations[0]),
}

let currentAction = actions.idle
currentAction.play()

function play(name, fadeDuration = 0.2) {
  const next = actions[name]
  if (!next || next === currentAction) return
  currentAction.fadeOut(fadeDuration)
  next.reset().fadeIn(fadeDuration).play()
  currentAction = next
}

// In animation loop:
function updateAnimations(deltaSec) {
  mixer?.update(deltaSec)
}
```

---

## Build Setup

Use **Vite** with ES modules.

```json
// package.json
{
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "three": "^0.160.0"
  },
  "devDependencies": {
    "lil-gui": "^0.21.0",
    "vite": "^7.0.0"
  }
}
```

```js
// vite.config.js
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

```json
// jsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

Always use `@/` alias imports instead of relative paths when crossing more than one directory level.

---

## Performance Checklist

- Cap pixel ratio: `Math.min(window.devicePixelRatio, 2)`
- Use `PCFSoftShadowMap` — softer and cheaper than `PCFShadowMap`
- Limit shadow `mapSize` to 1024 unless quality demands 2048
- Dispose of geometries and materials when objects are removed from scene
- Reuse geometries across instances; clone only materials when per-instance properties differ
- Use `depthWrite: false` on transparent/sprite materials
- Compress models with DRACO; compress textures to `.webp`
- Lazy-load non-critical assets after first render

---

## Debug Utilities

Use `lil-gui` during development. Gate it behind a dev check and never ship it in production builds.

```js
// utils/gui.js
import GUI from 'lil-gui'

export let gui = null

if (import.meta.env.DEV) {
  gui = new GUI()
}
```

---

## Avoid

- Hardcoding numbers in scene files — put them in `config.js`
- Mutating Three.js objects inside loaders — return them and let the caller add to scene
- Importing `scene` and calling `scene.add()` inside model files — pass scene as parameter or add from the calling module
- Global side effects on import — export functions, not immediate execution
- Skipping `colorSpace` on textures — colors will look washed out in linear space
