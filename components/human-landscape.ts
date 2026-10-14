import {
  BufferGeometry,
  Color,
  DataTexture,
  Float32BufferAttribute,
  Group,
  LinearFilter,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Points,
  PointsMaterial,
  RGBAFormat,
  SRGBColorSpace,
  Vector3,
} from "three";

type XYZ = readonly [number, number, number];

/** A little certainty keeps the same people and landscape between renders. */
function randomSource(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function radialTexture(size: number, sun = false) {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const radius = Math.hypot((x + 0.5) / size * 2 - 1, (y + 0.5) / size * 2 - 1);
      const index = (y * size + x) * 4;
      const core = Math.max(0, 1 - radius);
      const alpha = sun
        ? Math.exp(-radius * radius * 8) * Math.pow(core, 0.6)
        : Math.min(1, Math.max(0, (1 - radius) * 2.4));
      data[index] = 255;
      data[index + 1] = 255;
      data[index + 2] = 255;
      data[index + 3] = Math.round(alpha * 255);
    }
  }
  const texture = new DataTexture(data, size, size, RGBAFormat);
  texture.colorSpace = SRGBColorSpace;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/**
 * An airy landscape drawn from dust, with three people walking together.
 * Everything is local geometry: no photographs, models or external textures.
 * Material opacity is intentionally stable so the owning scene can fade it.
 */
export function createHumanLandscape(): Group {
  const world = new Group();
  world.name = "Human experience — a shared journey";
  const random = randomSource(14741);
  const dot = radialTexture(32);
  const sunTexture = radialTexture(128, true);
  const graphite = new Color("#524d43");
  const bronze = new Color("#876746");
  const chalk = new Color("#bcb4a2");
  const pale = new Color("#d3cabc");
  const figureGroups: Group[] = [];
  const geometries: BufferGeometry[] = [];
  const materials: (PointsMaterial | LineBasicMaterial | MeshBasicMaterial)[] = [];

  function pointCloud(positions: number[], colours: number[], size: number, opacity: number) {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new Float32BufferAttribute(colours, 3));
    const material = new PointsMaterial({
      size,
      map: dot,
      transparent: true,
      opacity,
      vertexColors: true,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const cloud = new Points(geometry, material);
    cloud.frustumCulled = false;
    geometries.push(geometry);
    materials.push(material);
    return cloud;
  }

  function fineLines(positions: number[], colour: string, opacity: number) {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    const material = new LineBasicMaterial({ color: colour, transparent: true, opacity, depthWrite: false });
    geometries.push(geometry);
    materials.push(material);
    return new LineSegments(geometry, material);
  }

  // The light is a stain in the paper, not a lens flare or an opaque disc.
  const sunMaterial = new MeshBasicMaterial({
    color: "#dfaa69",
    map: sunTexture,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  const sunGeometry = new PlaneGeometry(5.8, 5.8);
  const sun = new Mesh(sunGeometry, sunMaterial);
  sun.position.set(2.9, 1.05, -2.7);
  sun.renderOrder = -3;
  world.add(sun);
  geometries.push(sunGeometry);
  materials.push(sunMaterial);

  // Distant contours suggest a route rising into a very low, warm horizon.
  const ridgeLines: number[] = [];
  for (let ridge = 0; ridge < 22; ridge++) {
    const depth = ridge / 21;
    for (let step = 0; step < 180; step++) {
      const sample = (offset: number): XYZ => {
        const x = -7 + (step + offset) / 180 * 14;
        const fold = Math.sin(x * 0.55 - depth * 1.9) * (0.15 + depth * 0.05)
          + Math.sin(x * 1.12 + depth * 5) * 0.04;
        const y = -0.58 - depth * 1.36 + fold + Math.exp(-((x - 4) ** 2) / 5) * 0.17;
        return [x, y, -2.9 + depth * 4.8];
      };
      if (random() < 0.26) continue;
      ridgeLines.push(...sample(0), ...sample(0.7 + random() * 0.3));
    }
  }
  world.add(fineLines(ridgeLines, "#a99b84", 0.18));

  const landPositions: number[] = [];
  const landColours: number[] = [];
  for (let i = 0; i < 11000; i++) {
    const x = (random() - 0.5) * 14;
    const z = random() * 5.7 - 2.8;
    const depth = (z + 2.8) / 5.7;
    const undulation = Math.sin(x * 0.55 - depth * 1.9) * (0.15 + depth * 0.05)
      + Math.sin(x * 1.12 + depth * 5) * 0.04;
    const y = -0.58 - depth * 1.36 + undulation
      + Math.exp(-((x - 4) ** 2) / 5) * 0.17 + (random() - 0.5) * 0.018;
    // A soft, unmarked path leaves more light between the travellers.
    const pathX = 1.7 + (1 - depth) * 1.75;
    if (Math.abs(x - pathX) < 0.11 + depth * 0.34 && random() < 0.7) continue;
    landPositions.push(x, y, z);
    const colour = pale.clone().lerp(chalk, random() * 0.75);
    landColours.push(colour.r, colour.g, colour.b);
  }
  world.add(pointCloud(landPositions, landColours, 0.014, 0.48));

  // A few longer, incomplete wind marks anchor the foreground.
  const windLines: number[] = [];
  for (let i = 0; i < 90; i++) {
    const x = (random() - 0.5) * 13;
    const z = random() * 2.5 + 0.1;
    const depth = (z + 2.8) / 5.7;
    const y = -0.58 - depth * 1.36
      + Math.sin(x * 0.55 - depth * 1.9) * (0.15 + depth * 0.05)
      + Math.sin(x * 1.12 + depth * 5) * 0.04;
    const length = 0.035 + random() * 0.16;
    windLines.push(x, y, z, x + length, y + length * 0.06, z - length * 0.2);
  }
  world.add(fineLines(windLines, "#a38a68", 0.22));

  function person(height: number, variant: number) {
    const group = new Group();
    const positions: number[] = [];
    const colours: number[] = [];
    const axis = new Vector3();
    const normal = new Vector3();
    const binormal = new Vector3();
    const upward = new Vector3(0, 1, 0);
    const sideward = new Vector3(1, 0, 0);

    function addPoint(x: number, y: number, z: number) {
      positions.push(x * height, y * height, z * height);
      // Bronze gathers toward the sunlight; the shadow stays soft graphite.
      const colour = graphite.clone().lerp(bronze, 0.2 + random() * 0.65 + Math.max(0, x) * 0.5);
      if (random() < 0.12) colour.lerp(chalk, 0.55);
      colours.push(colour.r, colour.g, colour.b);
    }

    function ellipsoid(centre: XYZ, radii: XYZ, count: number, tilt = 0) {
      for (let i = 0; i < count; i++) {
        const angle = random() * Math.PI * 2;
        const vertical = random() * 2 - 1;
        const circumference = Math.sqrt(1 - vertical * vertical);
        const shell = Math.cbrt(random());
        const x = Math.cos(angle) * circumference * radii[0] * shell;
        const y = vertical * radii[1] * shell;
        const z = Math.sin(angle) * circumference * radii[2] * shell;
        addPoint(centre[0] + x * Math.cos(tilt) - y * Math.sin(tilt),
          centre[1] + x * Math.sin(tilt) + y * Math.cos(tilt), centre[2] + z);
      }
    }

    function limb(start: XYZ, end: XYZ, startRadius: number, endRadius: number, count: number) {
      axis.set(end[0] - start[0], end[1] - start[1], end[2] - start[2]);
      const length = axis.length();
      axis.normalize();
      normal.crossVectors(axis, Math.abs(axis.y) > 0.9 ? sideward : upward).normalize();
      binormal.crossVectors(axis, normal).normalize();
      for (let i = 0; i < count; i++) {
        const along = random();
        const radius = (startRadius + (endRadius - startRadius) * along)
          * (0.78 + Math.sin(along * Math.PI) * 0.22) * Math.sqrt(random());
        const angle = random() * Math.PI * 2;
        const nx = Math.cos(angle) * radius;
        const nz = Math.sin(angle) * radius * 0.8;
        addPoint(start[0] + axis.x * length * along + normal.x * nx + binormal.x * nz,
          start[1] + axis.y * length * along + normal.y * nx + binormal.y * nz,
          start[2] + axis.z * length * along + normal.z * nx + binormal.z * nz);
      }
    }

    // A clothed body has volume and asymmetry. There are no visible bone lines.
    ellipsoid([0.023, 0.654, 0], [0.103, 0.163, 0.063], 1400, -0.05);
    ellipsoid([0.024, 0.764, 0], [0.112, 0.055, 0.058], 420, -0.05);
    ellipsoid([-0.002, 0.51, 0], [0.089, 0.083, 0.059], 490, 0.04);
    limb([0.035, 0.791, 0], [0.043, 0.834, 0], 0.032, 0.03, 170);
    const facing = variant === 2 ? -1 : 1;
    ellipsoid([0.048, 0.891, -0.001], [0.057, 0.07, 0.051], 480, variant === 1 ? 0.14 : -0.08);
    // Forehead and cheek are only suggested; nothing is drawn as a face.
    ellipsoid([0.048 + facing * 0.043, 0.887, 0.012], [0.02, 0.022, 0.022], 65, 0.1);

    const phase = variant % 2 ? -1 : 1;
    const leftHip: XYZ = [-0.047, 0.51, 0.025];
    const rightHip: XYZ = [0.048, 0.505, -0.025];
    const leftKnee: XYZ = [-0.075 - phase * 0.045, 0.285, 0.035];
    const rightKnee: XYZ = [0.083 + phase * 0.045, 0.27, -0.024];
    const leftAnkle: XYZ = [-0.135 - phase * 0.045, 0.045, 0.044];
    const rightAnkle: XYZ = [0.15 + phase * 0.025, 0.035, -0.018];
    limb(leftHip, leftKnee, 0.052, 0.035, 520);
    limb(leftKnee, leftAnkle, 0.036, 0.024, 420);
    limb(rightHip, rightKnee, 0.052, 0.035, 520);
    limb(rightKnee, rightAnkle, 0.036, 0.024, 420);
    ellipsoid([leftAnkle[0] + 0.029, 0.026, leftAnkle[2]], [0.051, 0.022, 0.024], 95, -0.1);
    ellipsoid([rightAnkle[0] + 0.036, 0.018, rightAnkle[2]], [0.055, 0.018, 0.025], 95, 0.02);

    const nearShoulder: XYZ = [-0.069, 0.764, 0.037];
    const nearElbow: XYZ = variant === 1 ? [-0.14, 0.686, 0.055]
      : variant === 2 ? [-0.2, 0.63, 0.055] : [-0.12, 0.598, 0.065];
    const nearHand: XYZ = variant === 1 ? [-0.22, 0.63, 0.06]
      : variant === 2 ? [-0.30, 0.54, 0.05] : [-0.072, 0.46, 0.089];
    const farShoulder: XYZ = [0.112, 0.762, -0.032];
    const farElbow: XYZ = variant === 0 ? [0.23, 0.642, -0.022]
      : variant === 1 ? [0.19, 0.69, -0.022] : [0.18, 0.605, -0.022];
    const farHand: XYZ = variant === 0 ? [0.36, 0.53, -0.02]
      : variant === 1 ? [0.27, 0.64, -0.015] : [0.222, 0.475, 0.006];
    limb(nearShoulder, nearElbow, 0.034, 0.026, 300);
    limb(nearElbow, nearHand, 0.025, 0.016, 240);
    limb(farShoulder, farElbow, 0.034, 0.026, 280);
    limb(farElbow, farHand, 0.025, 0.016, 230);
    ellipsoid(nearHand, [0.021, 0.027, 0.017], 70, 0.15);
    ellipsoid(farHand, [0.021, 0.027, 0.017], 65, -0.3);

    const cloud = pointCloud(positions, colours, 0.0155, 0.74);
    group.add(cloud);
    group.rotation.y = -0.22 + variant * 0.12;
    group.rotation.z = variant === 1 ? 0.018 : -0.012;
    return group;
  }

  const placements = [
    { x: 0.92, y: -1.55, z: 0.16, height: 1.4 },
    { x: 1.68, y: -1.53, z: -0.08, height: 1.16 },
    { x: 2.43, y: -1.55, z: -0.28, height: 1.45 },
  ];
  placements.forEach((placement, index) => {
    const figure = person(placement.height, index);
    figure.position.set(placement.x, placement.y, placement.z);
    figure.userData.baseY = placement.y;
    figure.userData.baseRotation = figure.rotation.z;
    figure.name = `Walking figure ${index + 1}`;
    figureGroups.push(figure);
    world.add(figure);
  });

  // Shadows dissolve into terrain instead of pinning people to a graphic line.
  const shadowPositions: number[] = [];
  const shadowColours: number[] = [];
  placements.forEach(placement => {
    for (let i = 0; i < 480; i++) {
      const spread = random();
      const x = placement.x - spread * 0.57 + (random() - 0.5) * 0.14;
      const y = placement.y - 0.022 + (random() - 0.5) * (0.016 + spread * 0.035);
      shadowPositions.push(x, y, placement.z + spread * 0.18);
      const colour = chalk.clone().lerp(pale, spread * 0.7);
      shadowColours.push(colour.r, colour.g, colour.b);
    }
  });
  world.add(pointCloud(shadowPositions, shadowColours, 0.011, 0.22));

  world.userData.update = (time: number, _progress: number, pointerX = 0, pointerY = 0) => {
    figureGroups.forEach((figure, index) => {
      figure.position.y = figure.userData.baseY + Math.sin(time * 0.42 + index * 1.7) * 0.003;
      figure.rotation.z = figure.userData.baseRotation + Math.sin(time * 0.31 + index) * 0.002;
    });
    sun.position.x = 2.9 + pointerX * 0.035;
    sun.position.y = 1.05 + pointerY * 0.025;
  };
  world.userData.dispose = () => {
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
    dot.dispose();
    sunTexture.dispose();
  };
  return world;
}
