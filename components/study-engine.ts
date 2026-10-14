import * as THREE from "three";
import { createStudyFoliage } from "./study-foliage";

type Callbacks = {
  ready: () => void;
  failed: () => void;
  frame: (count: number, progress: number) => void;
};

export type StudyController = {
  setProgress: (progress: number) => void;
  setPaused: (paused: boolean) => void;
  dispose: () => void;
};

const clamp = THREE.MathUtils.clamp;
const mix = THREE.MathUtils.lerp;
const ease = (from: number, to: number, value: number) => {
  const t = clamp((value - from) / (to - from), 0, 1);
  return t * t * (3 - 2 * t);
};

function plasterTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const pixels = context.createImageData(256, 256);
  let seed = 71;
  for (let i = 0; i < pixels.data.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const n = 117 + (seed / 4294967296) * 30;
    pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = n;
    pixels.data[i + 3] = 255;
  }
  context.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.25, 1.25);
  return texture;
}

/** An architectural wall whose opening can be physically crossed by the camera. */
function wallGeometry(radius: number, depth: number) {
  const shape = new THREE.Shape();
  shape.moveTo(-36, -28);
  shape.lineTo(36, -28);
  shape.lineTo(36, 28);
  shape.lineTo(-36, 28);
  shape.closePath();
  const opening = new THREE.Path();
  opening.absellipse(0, 0, radius, radius * 1.045, 0, Math.PI * 2, true, 0);
  shape.holes.push(opening);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    steps: 1,
    curveSegments: 96,
    bevelEnabled: true,
    bevelSize: 0.16,
    bevelThickness: 0.13,
    bevelSegments: 4,
  });
  geometry.translate(0, 0, -depth / 2);
  return geometry;
}

function revealGeometry(radius: number) {
  const shape = new THREE.Shape();
  shape.absellipse(0, 0, radius + 0.045, (radius + 0.045) * 1.045, 0, Math.PI * 2, false, 0);
  const hole = new THREE.Path();
  hole.absellipse(0, 0, radius, radius * 1.045, 0, Math.PI * 2, true, 0);
  shape.holes.push(hole);
  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.72, steps: 1, curveSegments: 96, bevelEnabled: false,
  });
}

export function createStudy(container: HTMLElement, callbacks: Callbacks): StudyController {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setClearColor(0, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 700 ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.setAttribute("aria-hidden", "true");
  renderer.domElement.style.cssText = "display:block;width:100%;height:100%;";
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, 0.05, 120);
  const texture = plasterTexture();
  const colours = [0xd8cfc1, 0xbfa78d, 0x8e927c];
  const layers = colours.map((colour, index) => {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({
      color: colour, roughness: 0.88, metalness: 0.015,
      bumpMap: texture, bumpScale: 0.055,
    });
    const radius = 3.0 + index * 0.03;
    group.add(new THREE.Mesh(wallGeometry(radius, 0.85), material));
    const metal = new THREE.MeshStandardMaterial({
      color: 0x615445, metalness: 0.6, roughness: 0.45, envMapIntensity: 0.6,
    });
    const reveal = new THREE.Mesh(revealGeometry(radius + 0.01), metal);
    reveal.position.z = -0.35;
    group.add(reveal);

    // A narrow warm lip catches the light on the side facing the inhabited room.
    const lip = new THREE.Mesh(
      new THREE.TorusGeometry(radius + 0.025, 0.018, 6, 160),
      new THREE.MeshStandardMaterial({ color: 0xc6a873, metalness: 0.65, roughness: 0.35 }),
    );
    lip.scale.y = 1.045;
    lip.position.z = 0.405;
    group.add(lip);
    scene.add(group);
    return group;
  });

  const foliage = createStudyFoliage();
  scene.add(foliage.group);
  const foliageMaterials = new Set<THREE.Material>();
  foliage.group.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material: THREE.Material) => {
        material.transparent = true;
        foliageMaterials.add(material);
      });
    }
  });
  scene.add(new THREE.HemisphereLight(0xfff8e7, 0x766652, 2.1));
  const key = new THREE.DirectionalLight(0xfff1d4, 3.4);
  key.position.set(-5, 7, 10);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xe1e4d9, 0.8);
  fill.position.set(6, 0, 7);
  scene.add(fill);
  const inside = new THREE.PointLight(0xffc77f, 28, 25, 2);
  inside.position.set(-2, 4, -5);
  scene.add(inside);

  let environment: THREE.DataTexture | null = null;
  const request = new AbortController();
  let disposed = false;
  let prepared = false;
  let ready = false;
  let paused = false;
  let visible = true;
  let target = 0;
  let progress = 0;
  let frame = 0;
  let frameCount = 0;
  let previousTime = 0;
  let ambientTime = 0;
  let lastPaint = 0;

  function positionScene() {
    const alignment = ease(0.015, 0.34, progress);
    const passage = ease(0.34, 0.82, progress);
    const portrait = camera.aspect < 0.85;
    const initialZ = portrait ? 19.5 : 14;
    camera.position.set(
      mix(portrait ? 0 : -2.2, 0, ease(0.08, 0.48, progress)),
      portrait ? 0.28 * (1 - passage) : 0.05,
      mix(mix(initialZ, initialZ - 1.5, alignment), -5.8, passage),
    );
    camera.lookAt(camera.position.x, camera.position.y, -40);
    const offsets = [[-0.40, 0.10, -0.045], [0.78, -0.34, 0.11], [-0.70, 0.42, -0.10]];
    layers.forEach((layer, index) => {
      const [x, y, tilt] = offsets[index];
      const remaining = 1 - ease(index * 0.035, 0.27 + index * 0.035, progress);
      layer.position.set(x * remaining, y * remaining, 3.1 - index * 3.3);
      layer.rotation.set(tilt * 0.35 * remaining, tilt * remaining, 0);
    });
    // Local foliage contributes depth and a breeze after the architecture recedes.
    foliage.group.visible = progress > 0.58;
    const a = camera.aspect;
    const edges = [-(1.283 + 1.373 * a), 1.419 + 2.007 * a, -(1.030 + 0.664 * a), 0.932 + 1.007 * a];
    foliage.group.children.forEach((root, index) => { root.position.x = edges[index]; });
    foliageMaterials.forEach((material) => { material.opacity = ease(0.59, 0.82, progress); });
    // After the last wall is behind us, only close foliage remains in this
    // transparent canvas. A shallow focus softens it without blurring the room.
    renderer.domElement.style.filter = `blur(${ease(0.77, 0.85, progress) * 11}px)`;
    foliage.update(ambientTime);
  }

  function schedule() {
    if (prepared && !frame && !disposed && !paused && visible && !document.hidden) {
      frame = requestAnimationFrame(render);
    }
  }

  function render(time: number) {
    frame = 0;
    if (!prepared || disposed || paused || !visible || document.hidden) return;
    const delta = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 1 / 60;
    previousTime = time;
    const moving = Math.abs(target - progress) > 0.00005;
    progress = moving ? mix(progress, target, 1 - Math.exp(-delta * 13)) : target;
    ambientTime += delta;
    // Camera movement is native-scroll driven. Once settled, only the garden
    // foliage needs a gentle 30fps refresh, and only while visible.
    if (moving || !ready || time - lastPaint >= 32) {
      positionScene();
      try { renderer.render(scene, camera); }
      catch { callbacks.failed(); dispose(); return; }
      lastPaint = time;
      callbacks.frame(++frameCount, progress);
      if (!ready) { ready = true; callbacks.ready(); }
    }
    if (moving || progress > 0.5) schedule();
    else previousTime = 0;
  }

  function resize() {
    if (disposed) return;
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    positionScene();
    if (prepared) {
      try { renderer.render(scene, camera); callbacks.frame(++frameCount, progress); }
      catch { callbacks.failed(); dispose(); return; }
    }
    schedule();
  }

  function visibility() {
    if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0; previousTime = 0; }
    else schedule();
  }
  function contextLost(event: Event) {
    event.preventDefault();
    callbacks.failed();
    dispose();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) schedule();
    else if (frame) { cancelAnimationFrame(frame); frame = 0; previousTime = 0; }
  });
  intersection.observe(container);
  document.addEventListener("visibilitychange", visibility);
  renderer.domElement.addEventListener("webglcontextlost", contextLost);
  resize();

  async function prepare() {
    try {
      const response = await fetch("/studio-environment.bin.gz", { signal: request.signal });
      if (!response.ok) throw new Error("Lighting unavailable");
      let bytes = await response.arrayBuffer();
      if (disposed) return;
      const header = new Uint8Array(bytes, 0, Math.min(2, bytes.byteLength));
      if (header[0] === 0x1f && header[1] === 0x8b) {
        bytes = await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer();
      }
      if (disposed) return;
      if (bytes.byteLength !== 336 * 256 * 4 * 2) throw new Error("Invalid lighting");
      environment = new THREE.DataTexture(new Uint16Array(bytes), 336, 256, THREE.RGBAFormat, THREE.HalfFloatType);
      environment.mapping = THREE.CubeUVReflectionMapping;
      environment.colorSpace = THREE.LinearSRGBColorSpace;
      environment.minFilter = environment.magFilter = THREE.LinearFilter;
      environment.generateMipmaps = false;
      environment.needsUpdate = true;
      scene.environment = environment;
      scene.environmentIntensity = 0.4;
      await renderer.compileAsync(scene, camera);
      if (disposed) return;
      prepared = true;
      schedule();
    } catch {
      if (!disposed) { callbacks.failed(); dispose(); }
    }
  }
  void prepare();

  function dispose() {
    if (disposed) return;
    disposed = true;
    request.abort();
    if (frame) cancelAnimationFrame(frame);
    observer.disconnect();
    intersection.disconnect();
    document.removeEventListener("visibilitychange", visibility);
    renderer.domElement.removeEventListener("webglcontextlost", contextLost);
    foliage.dispose();
    layers.forEach((layer) => layer.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material: THREE.Material) => material.dispose());
      }
    }));
    texture?.dispose();
    environment?.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  }

  return {
    setProgress(value) { target = clamp(value, 0, 1); schedule(); },
    setPaused(value) {
      paused = value;
      if (paused && frame) { cancelAnimationFrame(frame); frame = 0; }
      previousTime = 0;
      if (!paused) schedule();
    },
    dispose,
  };
}
