import * as THREE from 'three';

const rounded = n => Math.round(n * 1000) / 1000;
const pointBoxDistance = (x, z, b) => Math.hypot(
  Math.max(b.min.x - x, x - b.max.x, 0),
  Math.max(b.min.z - z, z - b.max.z, 0),
);

// Keep the loaded Meshy geometry and materials shared. The extra border needs
// only one instanced draw per source primitive, rather than one per plant.
function describeTemplate(template) {
  template.updateWorldMatrix(true, true);
  const inverse = template.matrixWorld.clone().invert(), primitives = [];
  const bounds = new THREE.Box3(), point = new THREE.Vector3();
  template.traverse(object => {
    if (!object.isMesh || !object.geometry?.attributes.position) return;
    const matrix = new THREE.Matrix4().multiplyMatrices(inverse, object.matrixWorld);
    object.geometry.computeBoundingBox();
    bounds.union(object.geometry.boundingBox.clone().applyMatrix4(matrix));
    primitives.push({geometry: object.geometry, material: object.material, matrix});
  });
  const height = bounds.max.y - bounds.min.y, cutoff = bounds.min.y + height * .12;
  let radius = 0;
  for (const primitive of primitives) {
    const positions = primitive.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      point.fromBufferAttribute(positions, i).applyMatrix4(primitive.matrix);
      if (point.y <= cutoff) radius = Math.max(radius, Math.hypot(point.x, point.z));
    }
  }
  return {primitives, bounds, height, radius};
}

export function addPerimeterBamboo(den) {
  if (den.world.userData.bambooBorder) return den.world.userData.bambooBorder;
  const bamboo = den.vegetation.children.find(group => group.userData.assetId === 'bamboo');
  if (!bamboo?.children.length) throw new Error('Load the Meshy bamboo before extending the border.');
  den.world.updateMatrixWorld(true);
  const worldInverse = den.world.matrixWorld.clone().invert();
  const template = describeTemplate(bamboo.children[0]);
  if (!template.primitives.length || template.height <= 0) throw new Error('The bamboo template has no measurable geometry.');

  const occupied = [];
  for (const group of den.vegetation.children) {
    if (!['bamboo', 'grove'].includes(group.userData.assetId) || !group.children.length) continue;
    const source = group === bamboo ? template : describeTemplate(group.children[0]);
    for (const plant of group.children) {
      const position = plant.getWorldPosition(new THREE.Vector3()).applyMatrix4(worldInverse);
      occupied.push({x: position.x, z: position.z, radius: source.radius * Math.max(plant.scale.x, plant.scale.z)});
    }
  }
  const originalCount = bamboo.children.length;
  // Include the reading house, which is added before this adapter, and ignore
  // optional presentation pads and paths when measuring building footprints.
  const zoneBounds = [...den.zones.entries()].map(([id, group]) => ({
    id, bounds: new THREE.Box3().setFromObject(group.children[0] || group).applyMatrix4(worldInverse),
  }));
  const placements = [], buildingMargin = .65, rootMargin = .30;
  const valid = (x, z, radius) => {
    if (Math.hypot(x, z + 1) + radius > 28.65) return false;
    // A generous arrival opening keeps the foreground from becoming a wall.
    if (z > 13 && Math.abs(x) < 7.5 + radius) return false;
    if (zoneBounds.some(zone => pointBoxDistance(x, z, zone.bounds) < radius + buildingMargin)) return false;
    return occupied.every(plant => Math.hypot(x - plant.x, z - plant.z) >= radius + plant.radius + rootMargin);
  };

  // Interleave angles rather than filling one side first. Two staggered rows
  // produce a deeper grove at the back, with fewer shorter plants near arrival.
  for (let i = 0; i < 29; i++) {
    const wanted = (44 + (i * 137.508) % 272) * Math.PI / 180;
    const height = 4.2 + ((i * 7) % 10) / 5;
    const scale = height / template.height, radius = template.radius * scale;
    const outer = 28.65 - radius, candidates = [];
    for (let step = 0; step <= 85; step++) {
      for (const direction of step ? [-1, 1] : [1]) {
        const angle = wanted + direction * step * Math.PI / 90;
        for (const row of [0, 2.25, 4.5]) {
          const r = outer - row, x = Math.sin(angle) * r, z = Math.cos(angle) * r - 1;
          // Keep the added layer on the perimeter and reserve low, sparse side
          // clusters for the front of the garden.
          if (r < 22 || (z > 12 && placements.filter(p => p.z > 12).length >= 6)) continue;
          if (valid(x, z, radius)) candidates.push({x, z, row, angle, cost: step + row * 1.9});
        }
      }
      if (candidates.length && step >= 5) break;
    }
    candidates.sort((a, b) => a.cost - b.cost);
    const selected = candidates[0];
    if (!selected) continue;
    // Lower foreground silhouettes retain a view into the whole courtyard.
    const fittedHeight = selected.z > 11 ? Math.min(height, 4.65) : height;
    const fittedScale = fittedHeight / template.height, fittedRadius = template.radius * fittedScale;
    const plant = {
      x: selected.x, y: -.035 - template.bounds.min.y * fittedScale, z: selected.z,
      height: fittedHeight, scale: fittedScale, radius: fittedRadius,
      turn: selected.angle + i * .73,
    };
    occupied.push(plant); placements.push(plant);
  }

  const border = new THREE.Group();
  border.name = 'Bamboo perimeter · shared instanced Meshy plants';
  border.userData = {assetId: 'perimeter-bamboo', source: 'Existing Meshy bamboo', count: placements.length};
  const transform = new THREE.Object3D(), matrix = new THREE.Matrix4();
  for (const [index, primitive] of template.primitives.entries()) {
    const instances = new THREE.InstancedMesh(primitive.geometry, primitive.material, placements.length);
    instances.name = `Perimeter bamboo primitive ${index + 1}`;
    instances.castShadow = instances.receiveShadow = true;
    placements.forEach((plant, i) => {
      transform.position.set(plant.x, plant.y, plant.z);
      transform.rotation.set(0, plant.turn, 0); transform.scale.setScalar(plant.scale); transform.updateMatrix();
      matrix.multiplyMatrices(transform.matrix, primitive.matrix); instances.setMatrixAt(i, matrix);
    });
    instances.instanceMatrix.needsUpdate = true;
    instances.computeBoundingBox(); instances.computeBoundingSphere(); border.add(instances);
  }
  den.world.add(border); den.world.updateMatrixWorld(true);
  const buildingClearance = placements.length ? Math.min(...placements.flatMap(plant => zoneBounds.map(zone => pointBoxDistance(plant.x, plant.z, zone.bounds) - plant.radius))) : null;
  let rootClearance = Infinity;
  placements.forEach((plant, i) => {
    for (const other of occupied) {
      if (other === plant) continue;
      rootClearance = Math.min(rootClearance, Math.hypot(plant.x - other.x, plant.z - other.z) - plant.radius - other.radius);
    }
  });
  const metadata = {
    count: placements.length, originalCount, total: originalCount + placements.length,
    instancedPrimitives: template.primitives.length, sharedGeometry: true, groundRadius: 29,
    placements: placements.map(({x, z, height, radius, turn}) => ({x: rounded(x), z: rounded(z), height: rounded(height), rootRadius: rounded(radius), turn: rounded(turn)})),
    clearances: {minimumBuilding: buildingClearance === null ? null : rounded(buildingClearance), minimumRoot: Number.isFinite(rootClearance) ? rounded(rootClearance) : null, arrivalOpeningHalfWidth: 7.5},
    notes: 'Reuses the existing bamboo geometry and materials. Root bases stay inside the island and clear of structures, grove roots and other bamboo. Leaf canopies may overlap naturally.',
  };
  den.world.userData.bambooBorder = metadata; den.renderer.shadowMap.needsUpdate = true;
  return metadata;
}
