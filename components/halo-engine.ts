import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export type HaloController = {
  setPaused: (paused: boolean) => void;
  dispose: () => void;
};

type Callbacks = { ready: () => void; failed: () => void; frame: (count: number) => void };
type ProfilePoint = readonly [radius: number, depth: number];

const TAU = Math.PI * 2;
const START = Math.PI * 0.38;
const GAP = 0.032;

/**
 * A closed cross-section swept around a gently irregular architectural aperture.
 * The asymmetric profile creates a broad face, deep outer wall, and sloping inner
 * reveal. It is deliberately unlike the circular section of a torus.
 */
function apertureGeometry(profile: readonly ProfilePoint[], options: { segments?: number; start?: number; length?: number; radius?: number; deform?: boolean } = {}) {
  const segments = options.segments ?? 160;
  const start = options.start ?? START;
  const length = options.length ?? TAU - GAP;
  const radius = options.radius ?? 1.54;
  const positions: number[] = [];
  const indices: number[] = [];
  const count = profile.length;

  for (let step = 0; step <= segments; step++) {
    const angle = start + length * step / segments;
    const silhouette = options.deform === false ? 0 : 0.033 * Math.cos(angle * 3 + 0.4) + 0.025 * Math.sin(angle * 2);
    const fullness = options.deform === false ? 1 : 1 - 0.13 * Math.sin(angle - 0.5);
    for (const [r, z] of profile) {
      const localRadius = radius + silhouette + r * fullness;
      positions.push(Math.cos(angle) * localRadius * 1.015, Math.sin(angle) * localRadius * 1.045, z + 0.035 * Math.cos(angle + 0.5));
    }
  }

  for (let step = 0; step < segments; step++) {
    for (let side = 0; side < count; side++) {
      const a = step * count + side;
      const b = step * count + (side + 1) % count;
      const c = (step + 1) * count + side;
      const d = (step + 1) * count + (side + 1) % count;
      indices.push(a, b, c, b, d, c);
    }
  }

  // End caps are separate vertices so the precision-cut seam stays crisp.
  for (const end of [0, 1]) {
    const angle = start + length * end;
    const silhouette = options.deform === false ? 0 : 0.033 * Math.cos(angle * 3 + 0.4) + 0.025 * Math.sin(angle * 2);
    const fullness = options.deform === false ? 1 : 1 - 0.13 * Math.sin(angle - 0.5);
    const first = positions.length / 3;
    for (const [r, z] of profile) {
      const localRadius = radius + silhouette + r * fullness;
      positions.push(Math.cos(angle) * localRadius * 1.015, Math.sin(angle) * localRadius * 1.045, z + 0.035 * Math.cos(angle + 0.5));
    }
    for (let side = 1; side < count - 1; side++) {
      if (end === 0) indices.push(first, first + side + 1, first + side);
      else indices.push(first, first + side, first + side + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function roundedProfile(points: readonly ProfilePoint[], rounds = 2): ProfilePoint[] {
  let result = [...points];
  for (let round = 0; round < rounds; round++) {
    const next: ProfilePoint[] = [];
    result.forEach((point, i) => {
      const following = result[(i + 1) % result.length];
      next.push([point[0] * 0.87 + following[0] * 0.13, point[1] * 0.87 + following[1] * 0.13]);
      next.push([point[0] * 0.13 + following[0] * 0.87, point[1] * 0.13 + following[1] * 0.87]);
    });
    result = next;
  }
  return result;
}

function createShadow() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const gradient = context.createRadialGradient(64, 64, 5, 64, 64, 62);
  gradient.addColorStop(0, "rgba(39, 31, 20, 0.20)");
  gradient.addColorStop(0.36, "rgba(39, 31, 20, 0.12)");
  gradient.addColorStop(0.72, "rgba(39, 31, 20, 0.035)");
  gradient.addColorStop(1, "rgba(39, 31, 20, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 1.16), material);
  shadow.position.set(0.1, -2.43, -0.4);
  return shadow;
}

function createLightWell() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const gradient = context.createRadialGradient(146, 138, 8, 128, 128, 126);
  gradient.addColorStop(0, "rgba(255, 191, 101, 0.34)");
  gradient.addColorStop(0.35, "rgba(255, 192, 108, 0.26)");
  gradient.addColorStop(0.7, "rgba(255, 203, 133, 0.13)");
  gradient.addColorStop(1, "rgba(255, 215, 164, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false });
  const well = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), material);
  well.position.set(0, 0.03, -0.34);
  return well;
}

export function createHalo(container: HTMLElement, callbacks: Callbacks): HaloController {
  gsap.registerPlugin(ScrollTrigger);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 700 ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  renderer.domElement.style.cssText = "display:block;width:100%;height:100%;";
  renderer.domElement.setAttribute("aria-hidden", "true");
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 40);
  camera.position.set(0, 0.12, 8.65);
  camera.lookAt(0, -0.06, 0);

  // RoomEnvironment's diffuse and specular levels are baked once, locally.
  // CubeUV mapping uses these directly, without runtime cubemap/PMREM passes.
  let environmentTexture: THREE.DataTexture | null = null;
  scene.environmentIntensity = 0.85;

  const instrument = new THREE.Group();
  instrument.position.y = 0.12;
  scene.add(instrument);

  const ceramic = new THREE.MeshPhysicalMaterial({
    color: 0xcac5b6,
    metalness: 0.055,
    roughness: 0.33,
    clearcoat: 0.25,
    clearcoatRoughness: 0.3,
    envMapIntensity: 0.65,
  });
  const bronze = new THREE.MeshStandardMaterial({ color: 0x57483a, metalness: 0.92, roughness: 0.28, envMapIntensity: 1.5 });
  const edgeMetal = new THREE.MeshStandardMaterial({ color: 0xa39376, metalness: 0.85, roughness: 0.24 });
  const lightMaterial = new THREE.MeshStandardMaterial({ color: 0xffcf7d, emissive: 0xffab35, emissiveIntensity: 2.1, metalness: 0.08, roughness: 0.35 });

  const shellProfile = roundedProfile([
    [-0.29, -0.37], [-0.395, -0.19], [-0.402, 0.09], [-0.27, 0.37],
    [-0.10, 0.46], [0.20, 0.43], [0.40, 0.27], [0.44, 0.08],
    [0.37, -0.30], [0.20, -0.42],
  ], 1);
  instrument.add(new THREE.Mesh(apertureGeometry(shellProfile), ceramic));

  // A deep, smoked bronze reveal sits inside the ceramic opening.
  const sleeveProfile = roundedProfile([[-0.418, -0.25], [-0.435, -0.23], [-0.435, 0.05], [-0.41, 0.09], [-0.391, 0.055], [-0.391, -0.22]], 1);
  instrument.add(new THREE.Mesh(apertureGeometry(sleeveProfile, { length: TAU, start: 0 }), bronze));

  const trimProfile = roundedProfile([[-0.419, 0.086], [-0.432, 0.087], [-0.432, 0.112], [-0.407, 0.12], [-0.401, 0.109]], 1);
  instrument.add(new THREE.Mesh(apertureGeometry(trimProfile, { length: TAU, start: 0 }), edgeMetal));

  const glowProfile = roundedProfile([[-0.415, 0.124], [-0.431, 0.12], [-0.437, 0.139], [-0.417, 0.16], [-0.401, 0.15]], 1);
  instrument.add(new THREE.Mesh(apertureGeometry(glowProfile, { length: TAU, start: 0 }), lightMaterial));

  // Fine radial ribs provide a small point of engineering detail within the reveal.
  for (let index = 0; index < 9; index++) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.018, 0.17), edgeMetal);
    const angle = Math.PI * 1.47 + index * 0.029;
    const radius = 1.1 + 0.033 * Math.cos(angle * 3 + 0.4) + 0.025 * Math.sin(angle * 2);
    rib.position.set(Math.cos(angle) * radius * 1.015, Math.sin(angle) * radius * 1.045, -0.10);
    rib.rotation.z = angle;
    instrument.add(rib);
  }

  // A restrained inset in the cut reads as a join, rather than a missing piece.
  const join = new THREE.Mesh(apertureGeometry(roundedProfile([[-0.29, -0.29], [-0.29, 0.29], [0.30, 0.29], [0.33, -0.27]], 1), { start: START - GAP, length: GAP * 0.84, segments: 3 }), bronze);
  instrument.add(join);

  // A softly illuminated volume in the opening, behind the metal reveal.
  // This local texture adds optical depth without a full-screen bloom pass.
  const lightWell = createLightWell();
  if (lightWell) instrument.add(lightWell);

  const shadow = createShadow();
  if (shadow) scene.add(shadow);
  scene.add(new THREE.HemisphereLight(0xfaf7ef, 0x80715c, 1.4));
  const key = new THREE.DirectionalLight(0xfffbf2, 3.0);
  key.position.set(-3, 5, 6);
  scene.add(key);
  const coolFill = new THREE.DirectionalLight(0xe2e8ed, 1.0);
  coolFill.position.set(4, 0, -2);
  scene.add(coolFill);
  const warm = new THREE.PointLight(0xffc277, 4, 5, 2);
  warm.position.set(0, 0.25, 0.75);
  instrument.add(warm);

  let frame = 0;
  let frameCount = 0;
  let disposed = false;
  let paused = false;
  let visible = true;
  let ready = false;
  let prepared = false;
  const environmentRequest = new AbortController();
  let progress = 0;
  let currentProgress = 0;
  let pointerX = 0;
  let pointerY = 0;
  let currentPointerX = 0;
  let currentPointerY = 0;
  let previousTime = 0;

  function schedule() {
    if (prepared && !frame && !disposed && visible && !document.hidden && !paused) frame = requestAnimationFrame(render);
  }

  function render(time: number) {
    frame = 0;
    if (!prepared || disposed || !visible || document.hidden || paused) return;
    const elapsed = previousTime ? Math.min((time - previousTime) / 16.67, 3) : 1;
    previousTime = time;
    const blend = 1 - Math.pow(0.89, elapsed);
    currentProgress += (progress - currentProgress) * blend;
    currentPointerX += (pointerX - currentPointerX) * blend;
    currentPointerY += (pointerY - currentPointerY) * blend;

    instrument.rotation.set(-0.18 + currentProgress * 0.24 + currentPointerY, -0.46 + currentProgress * 0.43 + currentPointerX, -0.17 + currentProgress * 0.20);
    instrument.position.y = 0.12 + currentProgress * 0.12;
    lightMaterial.emissiveIntensity = 1.7 + currentProgress * 1.55;
    warm.intensity = 3.2 + currentProgress * 3;
    if (lightWell) lightWell.material.opacity = 0.75 + currentProgress * 0.25;
    if (shadow) shadow.scale.setScalar(1 - currentProgress * 0.035);
    try {
      renderer.render(scene, camera);
    } catch {
      callbacks.failed();
      dispose();
      return;
    }
    callbacks.frame(++frameCount);
    if (!ready) { ready = true; callbacks.ready(); }

    if (Math.abs(progress - currentProgress) + Math.abs(pointerX - currentPointerX) + Math.abs(pointerY - currentPointerY) > 0.00012) schedule();
    else previousTime = 0;
  }

  function resize() {
    if (disposed) return;
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = camera.aspect < 0.85 ? 10.0 : camera.aspect < 1.05 ? 9.2 : 8.65;
    camera.updateProjectionMatrix();
    if (paused && prepared) {
      try { renderer.render(scene, camera); callbacks.frame(++frameCount); }
      catch { callbacks.failed(); dispose(); }
    }
    else schedule();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) schedule();
    else if (frame) { cancelAnimationFrame(frame); frame = 0; previousTime = 0; }
  }, { rootMargin: "80px 0px" });
  intersection.observe(container);

  const opening = document.querySelector("#opening");
  const trigger = opening ? ScrollTrigger.create({
    trigger: opening,
    start: "top top",
    end: "bottom top",
    onUpdate: (self) => { progress = self.progress; schedule(); },
  }) : null;
  progress = trigger?.progress ?? 0;

  function onPointer(event: PointerEvent) {
    if (event.pointerType === "touch" || paused || !visible) return;
    pointerX = (event.clientX / window.innerWidth - 0.5) * 0.15;
    pointerY = (event.clientY / window.innerHeight - 0.5) * 0.09;
    schedule();
  }
  function onPointerLeave() { pointerX = pointerY = 0; schedule(); }
  function onVisibility() {
    if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0; previousTime = 0; }
    else schedule();
  }
  function onContextLost(event: Event) {
    event.preventDefault();
    callbacks.failed();
    dispose();
  }

  window.addEventListener("pointermove", onPointer, { passive: true });
  document.documentElement.addEventListener("pointerleave", onPointerLeave);
  document.addEventListener("visibilitychange", onVisibility);
  renderer.domElement.addEventListener("webglcontextlost", onContextLost);
  resize();

  async function prepare() {
    try {
      const response = await fetch("/studio-environment.bin.gz", { signal: environmentRequest.signal });
      if (!response.ok) throw new Error("Studio environment unavailable");
      let bytes = await response.arrayBuffer();
      if (disposed) return;
      // Some static hosts may send Content-Encoding; fetch then decompresses it.
      // Check the file header so the same asset works in either serving mode.
      const header = new Uint8Array(bytes, 0, Math.min(2, bytes.byteLength));
      if (header[0] === 0x1f && header[1] === 0x8b) {
        const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
        bytes = await new Response(stream).arrayBuffer();
      }
      if (disposed) return;
      if (bytes.byteLength !== 336 * 256 * 4 * 2) throw new Error("Invalid studio environment");
      environmentTexture = new THREE.DataTexture(new Uint16Array(bytes), 336, 256, THREE.RGBAFormat, THREE.HalfFloatType);
      environmentTexture.mapping = THREE.CubeUVReflectionMapping;
      environmentTexture.colorSpace = THREE.LinearSRGBColorSpace;
      environmentTexture.minFilter = THREE.LinearFilter;
      environmentTexture.magFilter = THREE.LinearFilter;
      environmentTexture.generateMipmaps = false;
      environmentTexture.needsUpdate = true;
      scene.environment = environmentTexture;
      // KHR_parallel_shader_compile avoids blocking the first interactive paint.
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
    environmentRequest.abort();
    if (frame) cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    intersection.disconnect();
    trigger?.kill();
    window.removeEventListener("pointermove", onPointer);
    document.documentElement.removeEventListener("pointerleave", onPointerLeave);
    document.removeEventListener("visibilitychange", onVisibility);
    renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const entries = Array.isArray(object.material) ? object.material : [object.material];
        entries.forEach((material) => {
          materials.add(material);
          if ("map" in material && material.map instanceof THREE.Texture) textures.add(material.map);
        });
      }
    });
    materials.forEach((material) => material.dispose());
    textures.forEach((texture) => texture.dispose());
    environmentTexture?.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  }

  return {
    setPaused(value) {
      paused = value;
      if (paused && frame) { cancelAnimationFrame(frame); frame = 0; previousTime = 0; }
      if (!paused) { progress = trigger?.progress ?? 0; schedule(); }
    },
    dispose,
  };
}
