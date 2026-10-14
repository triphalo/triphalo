import * as THREE from "three";

export type StudyFoliage = {
  group: THREE.Group;
  /** Elapsed seconds; calling with a fixed value produces a static composition. */
  update: (time: number) => void;
  dispose: () => void;
};

type Branch = { curve: THREE.CatmullRomCurve3; radius: number; leafPairs: number };
type Plant = { root: THREE.Group; phase: number; weight: number };

function seededRandom(seed: number) {
  return () => {
    seed |= 0;
    seed = seed + 0x6d2b79f5 | 0;
    let value = Math.imul(seed ^ seed >>> 15, 1 | seed);
    value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

/** A pointed ellipse with a shallow central fold, rather than a flat billboard. */
function leafGeometry() {
  const vertices: number[] = [];
  const indices: number[] = [];
  const rows = 8;
  const columns = 2;
  for (let row = 0; row <= rows; row++) {
    const t = row / rows;
    const width = Math.pow(Math.sin(Math.PI * t), 0.83) * 0.21;
    for (let column = 0; column <= columns; column++) {
      const across = column / columns * 2 - 1;
      const fold = (1 - Math.abs(across)) * 0.045 * Math.sin(Math.PI * t);
      vertices.push(across * width, t, fold - 0.07 * t * t);
      if (row < rows && column < columns) {
        const a = row * (columns + 1) + column;
        indices.push(a, a + 1, a + columns + 1, a + 1, a + columns + 2, a + columns + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * Four compact botanical groupings, eight draw calls in total.
 * Everything is generated locally; no alpha textures, shadow maps, or external assets.
 */
export function createStudyFoliage(): StudyFoliage {
  const group = new THREE.Group();
  group.name = "Conservatory edge foliage";
  const plants: Plant[] = [];
  const meshes: THREE.InstancedMesh[] = [];
  const branchGeometry = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true);
  const leavesGeometry = leafGeometry();
  const branchMaterial = new THREE.MeshStandardMaterial({ color: 0x383326, roughness: 0.92, metalness: 0 });
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x4a5537, roughness: 0.76, metalness: 0, side: THREE.DoubleSide });
  const palette = [0x667151, 0x8d9777, 0x757c56, 0xa17b56, 0x526042].map((hex) => new THREE.Color(hex));
  const up = new THREE.Vector3(0, 1, 0);
  const dummy = new THREE.Object3D();
  const vector = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const colour = new THREE.Color();

  function makePlant({ position, height, lean, seed, shrub = false }: { position: [number, number, number]; height: number; lean: number; seed: number; shrub?: boolean }) {
    const random = seededRandom(seed);
    const root = new THREE.Group();
    root.position.set(...position);
    root.name = shrub ? "Low sage and russet planting" : "Olive canopy";
    group.add(root);
    plants.push({ root, phase: random() * Math.PI * 2, weight: shrub ? 1.3 : 0.7 });

    const branches: Branch[] = [];
    const trunk = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(lean * 0.25, height * 0.3, 0.04),
      new THREE.Vector3(-lean * 0.2, height * 0.65, -0.12),
      new THREE.Vector3(lean, height, -0.18),
    ]);
    branches.push({ curve: trunk, radius: shrub ? 0.025 : 0.083, leafPairs: shrub ? 0 : 9 });

    const branchCount = shrub ? 9 : 14;
    for (let index = 0; index < branchCount; index++) {
      const t = shrub ? 0.07 + index / branchCount * 0.48 : 0.23 + index / branchCount * 0.68;
      const origin = trunk.getPoint(t);
      const side = index % 2 ? -1 : 1;
      const reach = (shrub ? 0.7 : 1.25) * (0.65 + random() * 0.45) * (1 - t * 0.23);
      const depth = (random() - 0.5) * (shrub ? 1.5 : 1.7);
      const rise = height * (shrub ? 0.54 : 0.18) * (0.65 + random() * 0.45);
      const end = origin.clone().add(new THREE.Vector3(side * reach, rise, depth));
      const branch = new THREE.CatmullRomCurve3([
        origin,
        origin.clone().add(new THREE.Vector3(side * reach * 0.25, rise * 0.5, depth * 0.2)),
        origin.clone().add(new THREE.Vector3(side * reach * 0.73, rise * 0.92, depth * 0.65)),
        end,
      ]);
      branches.push({ curve: branch, radius: shrub ? 0.013 : 0.024 * (1 - t * 0.5), leafPairs: shrub ? 7 : 8 });

      // Sparse forked tips keep the outline organic, with breathing room between sprays.
      if (!shrub && index % 2 === 0) {
        const forkOrigin = branch.getPoint(0.6);
        branches.push({
          curve: new THREE.CatmullRomCurve3([
            forkOrigin,
            forkOrigin.clone().add(new THREE.Vector3(side * 0.12, 0.30, -0.16)),
            forkOrigin.clone().add(new THREE.Vector3(side * 0.25, 0.62, -0.35)),
          ]),
          radius: 0.012,
          leafPairs: 4,
        });
      }
    }

    const segments = shrub ? 7 : 10;
    const branchMesh = new THREE.InstancedMesh(branchGeometry, branchMaterial, branches.length * segments);
    const leafCount = branches.reduce((total, branch) => total + branch.leafPairs * 2, 0);
    const leafMesh = new THREE.InstancedMesh(leavesGeometry, leafMaterial, leafCount);
    branchMesh.name = "Organic branch instances";
    leafMesh.name = "Individual folded leaf instances";
    let branchIndex = 0;
    let leafIndex = 0;

    for (const branch of branches) {
      for (let segment = 0; segment < segments; segment++) {
        const a = branch.curve.getPoint(segment / segments);
        const b = branch.curve.getPoint((segment + 1) / segments);
        vector.subVectors(b, a);
        const radius = branch.radius * (1 - segment / segments * 0.72);
        dummy.position.copy(a).add(b).multiplyScalar(0.5);
        dummy.quaternion.setFromUnitVectors(up, direction.copy(vector).normalize());
        dummy.scale.set(radius, vector.length() + 0.006, radius);
        dummy.updateMatrix();
        branchMesh.setMatrixAt(branchIndex++, dummy.matrix);
      }

      for (let pair = 0; pair < branch.leafPairs; pair++) {
        const t = 0.3 + pair / Math.max(1, branch.leafPairs - 1) * 0.68;
        const anchor = branch.curve.getPoint(t);
        const tangent = branch.curve.getTangent(t);
        for (const side of [-1, 1]) {
          const length = (shrub ? 0.51 : 0.40) * (0.7 + random() * 0.6);
          direction.set(side * (0.5 + random() * 0.4), 0.35 + random() * 0.6, (random() - 0.5) * 0.8);
          direction.addScaledVector(tangent, 0.2).normalize();
          dummy.position.copy(anchor).addScaledVector(tangent, side > 0 ? 0.035 : -0.035);
          dummy.quaternion.setFromUnitVectors(up, direction);
          dummy.rotateY((random() - 0.5) * 1.7);
          dummy.scale.set(length * (shrub ? 1.2 : 0.9), length, length);
          dummy.updateMatrix();
          leafMesh.setMatrixAt(leafIndex, dummy.matrix);
          colour.copy(palette[Math.floor(random() * palette.length)]).multiplyScalar(0.9 + random() * 0.18);
          leafMesh.setColorAt(leafIndex++, colour);
        }
      }
    }

    branchMesh.instanceMatrix.needsUpdate = true;
    leafMesh.instanceMatrix.needsUpdate = true;
    if (leafMesh.instanceColor) leafMesh.instanceColor.needsUpdate = true;
    branchMesh.computeBoundingSphere();
    leafMesh.computeBoundingSphere();
    root.add(branchMesh, leafMesh);
    meshes.push(branchMesh, leafMesh);
  }

  makePlant({ position: [-6.0, -2.0, -9.4], height: 6.2, lean: -0.35, seed: 4101 });
  makePlant({ position: [6.1, -2.0, -11.0], height: 5.7, lean: 0.55, seed: 8255 });
  makePlant({ position: [-5.3, -2.0, -7.2], height: 1.7, lean: -0.12, seed: 931, shrub: true });
  makePlant({ position: [5.4, -2.0, -8.2], height: 2.1, lean: 0.18, seed: 218, shrub: true });

  let disposed = false;
  return {
    group,
    update(time) {
      if (disposed || !Number.isFinite(time)) return;
      for (const plant of plants) {
        plant.root.rotation.z = Math.sin(time * 0.37 + plant.phase) * 0.007 * plant.weight;
        plant.root.rotation.x = Math.sin(time * 0.29 + plant.phase + 1) * 0.004 * plant.weight;
        plant.root.rotation.y = Math.sin(time * 0.22 + plant.phase) * 0.005 * plant.weight;
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      group.removeFromParent();
      meshes.forEach((mesh) => mesh.dispose());
      branchGeometry.dispose();
      leavesGeometry.dispose();
      branchMaterial.dispose();
      leafMaterial.dispose();
      group.clear();
    },
  };
}
