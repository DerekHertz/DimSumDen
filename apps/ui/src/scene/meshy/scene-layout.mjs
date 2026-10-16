import * as THREE from 'three';

// Presentation adapter for the existing detailed garden. Source assets stay untouched.
const LOCATIONS = {
  center: [0, 0], steamers: [-9.5, -8.7], front: [9.5, -8.7],
  tea: [-12.4, .3], pantry: [12.4, .3], pavilion: [-20, 10.2],
  games: [-20, -10.7], training: [21, 10], festival: [20, -12.2],
  dining: [-8.5, 17], dragon: [9, 17],
};
const HOMES = {
  Host: [0, -1.25], Product: [-3.6, -6.3], Architect: [3.6, -6.3],
  Developer: [-11.2, -4.9], Scout: [-8.2, -4.9], Debugger: [-14, -6.5],
  QA: [-12.4, 4], Security: [12.4, 4], Designer: [8, -4.9],
  Herald: [10.8, -4.9], 'Docs writer': [14.1, -6.6],
  'Release manager': [18, -6.2], 'Knowledge keeper': [0, -15], 'Stem cub': [0, 7.4],
};
const TAU = Math.PI * 2;
const pointBoxDistance = (x, z, b) => Math.hypot(Math.max(b.min.x - x, x - b.max.x, 0), Math.max(b.min.z - z, z - b.max.z, 0));
const boxGap = (a, b) => Math.hypot(Math.max(a.min.x - b.max.x, b.min.x - a.max.x, 0), Math.max(a.min.z - b.max.z, b.min.z - a.max.z, 0));
const rounded = n => Math.round(n * 100) / 100;

export function applyGardenLayout(den) {
  if (den.world.userData.presentationLayout) return den.world.userData.presentationLayout;
  const {world, zones, plan, residents, vegetation} = den;
  const terrain = world.getObjectByName('Garden landscape');
  if (!terrain) throw new Error('The detailed garden landscape has not loaded.');
  const ground = terrain.children.find(o => o.isMesh && o.geometry?.parameters?.radiusTop === 25);
  if (ground) { ground.scale.x = ground.scale.z = 29 / 25; ground.name = 'Roomier garden ground'; }
  // The baked radial paving is a separate child in the original assembly.
  const oldPaths = terrain.children[3];
  if (oldPaths?.isGroup && oldPaths.name !== 'Handmade pond and bridge') oldPaths.visible = false;
  const reserved = world.getObjectByName('Three reserved construction plots');
  if (reserved) reserved.visible = false;
  const gate = terrain.children.find(o => {
    if (!o.isGroup || o.name) return false;
    const b = new THREE.Box3().setFromObject(o), s = b.getSize(new THREE.Vector3());
    return b.min.z > 18 && b.max.z < 23 && s.y > 3;
  });
  if (gate) { gate.position.z += 4; gate.name = 'Arrival gate'; }

  const zoneBounds = new Map();
  for (const item of plan) {
    const position = LOCATIONS[item.id], group = zones.get(item.id);
    if (!position || !group) continue;
    [item.x, item.z] = position;
    group.position.x = item.x; group.position.z = item.z;
    group.updateMatrixWorld(true);
    // First child is the asset. Ignore optional circular presentation pads.
    zoneBounds.set(item.id, new THREE.Box3().setFromObject(group.children[0] || group));
  }

  const peopleMoves = [];
  for (const person of residents.children) {
    const next = HOMES[person.name];
    if (!next) continue;
    peopleMoves.push({name: person.name, old: person.position.clone(), next: next.slice()});
    person.position.x = next[0]; person.position.z = next[1];
  }
  // Optional source prop sets may be loaded later by the original scene controls.
  function syncRoleTools() {
    for (const prop of den.roleTools.children) {
      if (prop.userData.layoutAdjusted) continue;
      const move = peopleMoves.reduce((best, p) => {
        const d = Math.hypot(prop.position.x - p.old.x, prop.position.z - p.old.z);
        return !best || d < best.d ? {p, d} : best;
      }, null);
      if (move && move.d < 2) {
        prop.position.x += move.p.next[0] - move.p.old.x;
        prop.position.z += move.p.next[1] - move.p.old.z;
        prop.userData.layoutAdjusted = true;
      }
    }
  }
  syncRoleTools();

  // One low contrast promenade replaces the visually busy wheel of paving spokes.
  const stone = terrain.children[1]?.material?.clone() || new THREE.MeshStandardMaterial({color: '#c2bda4', roughness: 1});
  stone.name = 'Quiet stone promenade';
  stone.color.lerp(new THREE.Color('#abb29a'), .16);
  const paths = new THREE.Group(); paths.name = 'Garden promenade and short approaches';
  const loop = new THREE.Mesh(new THREE.RingGeometry(8.35, 9.2, 128), stone);
  loop.rotation.x = -Math.PI / 2; loop.position.y = .024; loop.receiveShadow = true; paths.add(loop);
  const vertices = [], indices = [];
  function walkway(points, width = .88) {
    const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, .025, z)));
    const samples = Math.max(12, Math.ceil(curve.getLength() * 2)), offset = vertices.length / 3;
    for (let i = 0; i <= samples; i++) {
      const p = curve.getPoint(i / samples), t = curve.getTangent(i / samples), x = -t.z * width / 2, z = t.x * width / 2;
      vertices.push(p.x + x, p.y, p.z + z, p.x - x, p.y, p.z - z);
      if (i < samples) { const k = offset + i * 2; indices.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
    }
  }
  for (const sign of [-1, 1]) {
    walkway([[sign * 7.55, -4.4], [sign * 9.5, -5.6]]);
    walkway([[sign * 8.35, 2.4], [sign * 10.2, 3.6], [sign * 12.4, 3.8]]);
    walkway([[sign * 7.5, 4.6], [sign * 12.4, 7], [sign * 16.5, 10.2]]);
    walkway([[sign * 4.2, 7.7], [sign * 6.8, 11.8], [sign * 8.5, 14.5]]);
  }
  walkway([[-8.5, -2.8], [-15, -3.6], [-19.5, -7.6]]);
  walkway([[8.5, -2.8], [15, -3.6], [19.6, -8.4]]);
  walkway([[0, 9.1], [0, 17], [0, 24.5]], 1.2);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geo.setIndex(indices); geo.computeVertexNormals();
  const approaches = new THREE.Mesh(geo, stone); approaches.receiveShadow = true; paths.add(approaches); world.add(paths);

  // Preserve every planted model, while keeping its root base on the ground and
  // away from building footprints. Canopies may naturally overhang grass paths.
  const preferred = {
    grove: [[-25, 3.2], [-14.6, -21], [0, -24], [25, -2.3], [-12, 22], [14, 21]],
    bamboo: [[-27, -5], [27, -5], [-25, -15], [25, -15], [-18, -23], [18, -23], [-9, -27], [9, -27], [0, -28], [-28, 6], [28, 6]],
  };
  const occupied = [], plantRecords = [];
  const groups = [...vegetation.children].sort((a, b) => (a.userData.assetId === 'grove' ? -1 : 1) - (b.userData.assetId === 'grove' ? -1 : 1));
  for (const group of groups) {
    const kind = group.userData.assetId;
    for (const [index, plant] of group.children.entries()) {
      const radius = (group.userData.baseRadius || .45) * plant.scale.y;
      const wanted = preferred[kind]?.[index] || [plant.position.x, plant.position.z];
      const limit = 28.65 - radius;
      function valid(x, z) {
        if (Math.hypot(x, z + 1) > limit || (z > 19 && Math.abs(x) < 5.3 + radius)) return false;
        if ([...zoneBounds.values()].some(b => pointBoxDistance(x, z, b) < radius + .8)) return false;
        return occupied.every(p => Math.hypot(x - p.x, z - p.z) > radius + p.radius + .3);
      }
      const angle = Math.atan2(wanted[0], wanted[1] + 1), candidates = [];
      // Search nearest angles first, then a second inner border row if necessary.
      const distance = Math.min(Math.hypot(wanted[0], wanted[1] + 1), limit);
      candidates.push([Math.sin(angle) * distance, Math.cos(angle) * distance - 1]);
      for (const r of [limit, limit - 2.2, limit - 4.4]) for (let n = 0; n <= 90; n++) for (const sign of n ? [-1, 1] : [1]) {
        const a = angle + sign * n * TAU / 180;
        candidates.push([Math.sin(a) * r, Math.cos(a) * r - 1]);
      }
      const destination = candidates.find(([x, z]) => valid(x, z));
      if (destination) { plant.position.x = destination[0]; plant.position.z = destination[1]; }
      occupied.push({x: plant.position.x, z: plant.position.z, radius});
      const record = {kind, index, x: rounded(plant.position.x), z: rounded(plant.position.z), rootRadius: rounded(radius), clear: Boolean(destination)};
      plantRecords.push(record);
      const original = den.plantingLayout[kind]?.[index];
      if (original) { original.x = plant.position.x; original.z = plant.position.z; }
    }
  }
  world.updateMatrixWorld(true);
  const gaps = [['tea', 'pavilion'], ['pantry', 'training'], ['front', 'festival']].map(([a, b]) => ({a, b, gap: rounded(boxGap(zoneBounds.get(a), zoneBounds.get(b)))}));
  const metadata = {
    name: 'Open garden arrangement', groundRadius: 29, locations: LOCATIONS,
    gaps, plants: plantRecords, syncRoleTools,
    notes: 'All supplied scenery and plants preserved. Placeholder reserve pads and old radial paving hidden. Root clearances use the loaded plant footprint radius; canopy overhang is allowed.',
  };
  world.userData.presentationLayout = metadata;
  den.renderer.shadowMap.needsUpdate = true;
  return metadata;
}
