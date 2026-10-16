import * as T from 'three';
import {box, cyl, orb, line, bake, lantern, dragon} from './garden.mjs';

// Author directly in walking-world units. +Z is the public/front approach;
// kiosks also have an unobstructed entrance on their right (+X) side.
export const STYLIZED_STRUCTURE_IDS = Object.freeze([
  'center', 'steamers', 'front', 'tea', 'pantry', 'pavilion', 'games',
  'training', 'festival', 'dining', 'dragon', 'library', 'gate',
]);

function palette() {
  const mat = color => new T.MeshStandardMaterial({color, roughness: .87});
  return {
    wood: mat('#bc9262'), darkwood: mat('#806144'), bamboo: mat('#d5b779'),
    stone: mat('#d9d6bc'), ivory: mat('#f3ead4'), jade: mat('#83aaa0'),
    slate: mat('#6f8589'), blue: mat('#7898ac'), red: mat('#bc7360'),
    gold: mat('#d6b56b'), pink: mat('#d5aca0'), leaf: mat('#71947b'),
    amber: new T.MeshStandardMaterial({color: '#ffe7ab', emissive: '#ffd693', emissiveIntensity: .23, roughness: .85}),
    water: new T.MeshStandardMaterial({color: '#83b7af', roughness: .36, transparent: true, opacity: .84}),
  };
}

const bounds = (min, max) => ({min, max});
function platform(g, m, w, d, y) {
  box(g, [w, y, d], m.stone, [0, y / 2, 0]);
  box(g, [w - .05, .035, d - .05], m.wood, [0, y - .0175, 0]);
}

function step(g, m, meta, size, at) {
  box(g, size, m.stone, at);
  meta.steps.push({...bounds(at.map((v, i) => v - size[i] / 2), at.map((v, i) => v + size[i] / 2)), top: at[1] + size[1] / 2});
}

function frontSteps(g, m, meta, edge, width, rise = meta.floorY) {
  const count = Math.ceil(rise / .2);
  // Broad, flat treads overlap the platform edge so there is no tiny gap.
  for (let i = 1; i < count; i++) {
    const top = rise * (count - i) / count;
    step(g, m, meta, [width, top, .55], [0, top / 2, edge + (i - .5) * .5]);
  }
}

function post(g, m, x, z, floor, top) {
  box(g, [.19, top - floor, .19], m.wood, [x, (floor + top) / 2, z]);
  box(g, [.28, .12, .28], m.stone, [x, floor + .06, z]);
  box(g, [.29, .09, .29], m.bamboo, [x, top - .11, z]);
}

function roof(g, m, width, depth, eave, rise, color = 'slate') {
  const hw = width / 2, hd = depth / 2;
  const ring = [[-hw, eave + .13, -hd], [0, eave, -hd], [hw, eave + .13, -hd],
    [hw, eave, 0], [hw, eave + .13, hd], [0, eave, hd], [-hw, eave + .13, hd], [-hw, eave, 0]];
  const ridge = Math.max(0, (width - depth) * .31);
  const topFor = p => [p[0] === 0 ? 0 : Math.sign(p[0]) * ridge, eave + rise, 0];
  const mid = ring.map(p => [p[0] * .73, eave + rise * .27, p[2] * .73]);
  const vertices = [];
  const triangle = (a, b, c) => vertices.push(...a, ...b, ...c);
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length, a = topFor(ring[i]), b = topFor(ring[j]);
    triangle(ring[i], mid[i], ring[j]); triangle(ring[j], mid[i], mid[j]);
    triangle(mid[i], a, mid[j]);
    if (a[0] !== b[0]) triangle(mid[j], a, b);
    line(g, [ring[i], ring[j]], .045, m[color]);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  const material = m[color].clone(); material.side = T.DoubleSide;
  const mesh = new T.Mesh(geometry, material); mesh.castShadow = mesh.receiveShadow = true; g.add(mesh);
  // Eave trim and the raised ridge keep a clean silhouette at garden scale.
  line(g, [[-ridge - .22, eave + rise + .12, 0], [-ridge, eave + rise + .035, 0],
    [ridge, eave + rise + .035, 0], [ridge + .22, eave + rise + .12, 0]], .055, m[color]);
}

function teaSet(g, m, x, y, z, scale = 1) {
  const set = new T.Group(); set.position.set(x, y, z); set.scale.setScalar(scale); g.add(set);
  cyl(set, .23, .035, m.bamboo, [0, .0175, 0], 20);
  orb(set, .12, m.jade, [0, .13, 0], [1, .8, 1]);
  cyl(set, .085, .025, m.jade, [0, .235, 0], 16);
  line(set, [[.1, .15, 0], [.19, .19, 0]], .035, m.jade);
  for (const dx of [-.29, .29]) cyl(set, .065, .06, m.ivory, [dx, .05, .08], 14);
}

function stool(g, m, x, z, seatY = .48) {
  cyl(g, .26, .09, m.wood, [x, seatY - .045, z], 20);
  for (const [dx, dz] of [[-.12, -.12], [.12, -.12], [-.12, .12], [.12, .12]])
    box(g, [.055, seatY - .09, .055], m.darkwood, [x + dx, (seatY - .09) / 2, z + dz]);
}

function roundTable(g, m, width, depth, height) {
  const top = cyl(g, width / 2, .10, m.wood, [0, height - .05, 0], 48); top.scale.z = depth / width;
  const edge = cyl(g, width / 2 - .08, .04, m.bamboo, [0, height + .02, 0], 48); edge.scale.z = depth / width;
  for (const [x, z] of [[-.26, -.24], [.26, -.24], [-.26, .24], [.26, .24]])
    box(g, [.13, height - .10, .13], m.darkwood, [x * width / 2, (height - .10) / 2, z * depth / 2]);
}

function kiosk(g, m, meta, id) {
  const color = {steamers: 'blue', front: 'jade', tea: 'jade', pantry: 'slate'}[id];
  meta.floorY = .36; meta.footprint = {width: 5.6, depth: 4.6};
  platform(g, m, 4.8, 3.7, meta.floorY);
  for (const x of [-2.18, 2.18]) for (const z of [-1.58, 1.58]) post(g, m, x, z, .36, 3.32);
  box(g, [4.45, 2.58, .1], m.ivory, [0, 1.65, -1.62]);
  box(g, [4.5, .13, .15], m.wood, [0, 2.95, -1.53]);
  // The service counter remains intact. Access is through the side frame.
  box(g, [4.35, .89, .40], m.wood, [0, .805, 1.37]);
  box(g, [4.65, .12, .74], m.bamboo, [0, 1.31, 1.37]);
  for (const x of [-1.9, -1.4, -.9, -.4, .1, .6, 1.1, 1.6])
    box(g, [.045, .72, .025], m.darkwood, [x, .79, 1.585]);
  for (const y of [1.28, 2.05]) {
    box(g, [4.1, .075, .45], m.wood, [0, y, -1.32]);
    for (let i = 0; i < 6; i++) {
      const x = -1.7 + i * .68;
      cyl(g, .105, .22, m[i % 2 ? 'ivory' : color], [x, y + .15, -1.32], 14);
      cyl(g, .115, .035, m.bamboo, [x, y + .2775, -1.32], 14);
    }
  }
  roof(g, m, 5.6, 4.6, 3.32, .72, color);
  for (const x of [-1.93, 1.93]) lantern(g, m, [x, 2.75, 1.63]);
  box(g, [1.55, .35, .065], m.ivory, [0, 2.96, 1.63]);
  if (id === 'steamers') {
    for (const x of [-1.45, 1.45]) for (let i = 0; i < 2; i++)
      cyl(g, .23, .13, m.bamboo, [x, 1.435 + i * .14, 1.37], 24);
  } else if (id === 'tea') teaSet(g, m, -.8, 1.37, 1.37);
  else box(g, [.42, .025, .35], m.ivory, [-1.1, 1.385, 1.38]);
  meta.doors.push({side: 'right', ...bounds([2.04, .36, -1.20], [2.5, 2.96, .65])});
  step(g, m, meta, [.45, .24, 1.70], [2.60, .12, -.32]);
  step(g, m, meta, [.45, .12, 1.70], [3.03, .06, -.32]);
}

function library(g, m, meta) {
  meta.floorY = .4; meta.footprint = {width: 8.5, depth: 6};
  platform(g, m, 7.45, 4.9, .4);
  for (const x of [-3.4, 3.4]) for (const z of [-2.17, 2.17]) post(g, m, x, z, .4, 3.50);
  box(g, [6.9, 2.95, .12], m.ivory, [0, 1.875, -2.2]);
  for (const x of [-3.4, 3.4]) box(g, [.12, 2.95, 4.35], m.ivory, [x, 1.875, 0]);
  // Front wing panels leave a 2.6 m opening, with no sill or bar across it.
  for (const x of [-2.37, 2.37]) {
    box(g, [2.0, 2.8, .12], m.ivory, [x, 1.8, 2.17]);
    box(g, [1.55, 1.2, .045], m.jade, [x, 2.0, 2.245]);
    for (const dx of [-.52, 0, .52]) box(g, [.045, 1.20, .035], m.wood, [x + dx, 2.0, 2.28]);
  }
  for (const x of [-2.27, 2.27]) {
    box(g, [1.65, 2.1, .16], m.wood, [x, 1.45, -1.88]);
    for (const y of [.67, 1.28, 1.89, 2.5]) {
      box(g, [1.65, .07, .43], m.wood, [x, y, -1.70]);
      if (y < 2.5) for (let i = 0; i < 6; i++)
        box(g, [.12 + (i % 2) * .025, .35 + (i % 3) * .025, .22], m[['jade', 'ivory', 'blue', 'bamboo'][i % 4]], [x - .62 + i * .24, y + .23, -1.68]);
    }
  }
  box(g, [2.2, .36, .1], m.wood, [0, 3.08, 2.25]);
  box(g, [1.94, .23, .035], m.ivory, [0, 3.08, 2.32]);
  roof(g, m, 8.5, 6, 3.5, .8, 'jade');
  for (const x of [-1.7, 1.7]) lantern(g, m, [x, 2.9, 2.40]);
  meta.doors.push({side: 'front', ...bounds([-1.30, .4, 2.05], [1.30, 2.9, 2.55])});
  frontSteps(g, m, meta, 2.45, 2.5);
}

function pavilion(g, m, meta) {
  meta.floorY = .6; meta.footprint = {width: 7.7, depth: 6};
  platform(g, m, 6.3, 4.6, .6);
  for (const x of [-2.83, 2.83]) for (const z of [-1.98, 1.98]) post(g, m, x, z, .6, 3.55);
  roof(g, m, 7.7, 6, 3.55, .85, 'jade');
  for (const x of [-2.80, 2.80]) {
    box(g, [.10, .10, 3.5], m.bamboo, [x, 1.25, 0]);
    for (const z of [-1.6, -.8, 0, .8, 1.6]) box(g, [.065, .60, .065], m.wood, [x, .95, z]);
    lantern(g, m, [x, 2.98, 1.95]);
    box(g, [.4, .10, 2.3], m.wood, [x - Math.sign(x) * .40, 1.06, -.15]);
  }
  const table = new T.Group(); table.position.set(0, .6, -.8); g.add(table);
  roundTable(table, m, 1.25, 1.25, .78); teaSet(table, m, 0, .82, 0);
  // The pale pond and bamboo bridge remain part of the pavilion arrival.
  const pond = cyl(g, 1, .035, m.water, [0, .0225, 4.03], 48); pond.scale.set(3.8, 1, 1.62);
  for (const [x, z] of [[-2.4, 3.4], [1.9, 4.6], [-1.6, 4.7]])
    cyl(g, .18, .025, m.leaf, [x, .055, z], 16);
  box(g, [1.5, .10, 3.12], m.wood, [0, .55, 3.78]);
  for (let i = 0; i < 16; i++) box(g, [1.5, .025, .18], m.bamboo, [0, .5875, 2.30 + i * .195]);
  for (const x of [-.82, .82]) {
    box(g, [.055, .065, 3.18], m.bamboo, [x, 1.25, 3.80]);
    for (const z of [2.3, 3.8, 5.3]) box(g, [.07, .70, .07], m.wood, [x, .95, z]);
  }
  step(g, m, meta, [1.5, .4, .50], [0, .20, 5.55]);
  step(g, m, meta, [1.5, .2, .50], [0, .10, 6.03]);
  meta.doors.push({side: 'front', ...bounds([-.75, .6, 1.85], [.75, 3.2, 2.5])});
  meta.bridge = {...bounds([-.75, .5, 2.22], [.75, .6, 5.34]), top: .6};
}

function festival(g, m, meta) {
  meta.floorY = .6; meta.footprint = {width: 6.7, depth: 4.8};
  platform(g, m, 5.75, 3.7, .6);
  for (const x of [-2.55, 2.55]) for (const z of [-1.55, 1.55]) post(g, m, x, z, .6, 3.48);
  roof(g, m, 6.7, 4.8, 3.48, .76, 'blue');
  box(g, [4.9, 2.55, .08], m.ivory, [0, 1.875, -1.6]);
  for (const x of [-1.65, 1.65]) {
    box(g, [.13, .56, .13], m.wood, [x, .88, -.65]);
    const drum = cyl(g, .36, .45, m.red, [x, 1.35, -.65], 24); drum.rotation.x = Math.PI / 2;
    const head = cyl(g, .365, .025, m.ivory, [x, 1.35, -.41], 24); head.rotation.x = Math.PI / 2;
    lantern(g, m, [x, 2.9, 1.6], true);
  }
  frontSteps(g, m, meta, 1.85, 2.7);
  meta.doors.push({side: 'front', ...bounds([-1.35, .6, 1.45], [1.35, 3.1, 2.25])});
}

function furniture(g, m, meta, id) {
  meta.floorY = 0;
  if (id === 'center' || id === 'dining') {
    const big = id === 'center', height = big ? 1.1 : .9;
    meta.footprint = {width: big ? 5 : 3.7, depth: big ? 3.1 : 3.7};
    meta.table = {width: big ? 5 : 2, depth: big ? 3.1 : 2, top: height + .04};
    roundTable(g, m, meta.table.width, meta.table.depth, height);
    teaSet(g, m, big ? -1.4 : -.3, height + .04, big ? -.6 : -.2);
    for (const [x, z] of big ? [[-.6, .3], [.3, -.3], [1.15, .35]] : [[.32, .22]]) {
      cyl(g, .22, .12, m.bamboo, [x, height + .10, z], 24);
      for (const dx of [-.08, .08]) orb(g, .075, m.ivory, [x + dx, height + .19, z], [1, .7, 1]);
    }
    if (!big) for (const [x, z] of [[-1.5, 0], [1.5, 0], [0, -1.5], [0, 1.5]]) stool(g, m, x, z);
  } else if (id === 'games') {
    meta.footprint = {width: 3.6, depth: 3.6};
    box(g, [1.65, .11, 1.65], m.wood, [0, .845, 0]);
    box(g, [1.42, .035, 1.42], m.jade, [0, .9175, 0]);
    for (const x of [-.62, .62]) for (const z of [-.62, .62]) box(g, [.10, .79, .10], m.darkwood, [x, .395, z]);
    for (let i = 0; i < 6; i++) {
      box(g, [.11, .09, .075], m.ivory, [-.39 + i * .15, .98, -.46]);
      box(g, [.075, .09, .11], m.ivory, [.46, .98, -.39 + i * .15]);
    }
    for (const [x, z] of [[-1.4, 0], [1.4, 0], [0, -1.4], [0, 1.4]]) stool(g, m, x, z);
    meta.table = {width: 1.65, depth: 1.65, top: .935};
  }
}

function training(g, m, meta) {
  meta.floorY = .12; meta.footprint = {width: 6.3, depth: 5.5};
  cyl(g, 2.75, .12, m.stone, [0, .06, 0], 48);
  for (const x of [-1.05, 1.05]) post(g, m, x, -1.3, .12, 2.7);
  box(g, [2.7, .16, .22], m.wood, [0, 2.62, -1.3]);
  const gong = cyl(g, .69, .07, m.gold, [0, 1.62, -1.3], 40); gong.rotation.x = Math.PI / 2;
  orb(g, .16, m.bamboo, [0, 1.62, -1.24], [1, 1, .3]);
  for (const x of [-.38, .38]) line(g, [[x, 2.55, -1.3], [x, 2.18, -1.3]], .018, m.darkwood);
  cyl(g, .13, 1.6, m.wood, [1.8, .92, .6], 12);
  for (const y of [.9, 1.2, 1.5]) {
    const arm = cyl(g, .045, .54, m.bamboo, [1.8, y, .85], 10); arm.rotation.x = Math.PI / 2;
  }
}

function gate(g, m, meta) {
  meta.floorY = 0; meta.footprint = {width: 6.5, depth: 2.1};
  for (const x of [-2.38, 2.38]) {
    post(g, m, x, 0, 0, 3.28);
    lantern(g, m, [x, 2.65, .36], true);
  }
  box(g, [5.6, .2, .32], m.wood, [0, 3.12, 0]);
  box(g, [1.70, .41, .12], m.ivory, [0, 2.95, .22]);
  roof(g, m, 6.5, 2.1, 3.28, .72, 'slate');
  meta.doors.push({side: 'front', ...bounds([-2.15, 0, -.6], [2.15, 2.70, .6])});
}

/** No DOM, textures, asset fetches or WebGL context are required. */
export function createStylizedStructure(id) {
  if (!STYLIZED_STRUCTURE_IDS.includes(id)) throw new Error('Unknown stylized structure: ' + id);
  const source = new T.Group(), m = palette();
  const meta = {id, floorY: 0, footprint: null, doors: [], steps: [], bridge: null};
  if (['steamers', 'front', 'tea', 'pantry'].includes(id)) kiosk(source, m, meta, id);
  else if (id === 'library') library(source, m, meta);
  else if (id === 'pavilion') pavilion(source, m, meta);
  else if (id === 'festival') festival(source, m, meta);
  else if (id === 'gate') gate(source, m, meta);
  else if (id === 'training') training(source, m, meta);
  else if (id === 'dragon') {
    const display = dragon(m);
    display.position.y = .025; // The reused support poles extend .025 below their old origin.
    source.add(display); meta.footprint = {width: 8.4, depth: 1.1};
  } else furniture(source, m, meta, id);
  const group = bake(source);
  // bake clones the transformed geometry; dispose the temporary source buffers.
  source.traverse(o => { if (o.isMesh) o.geometry.dispose(); });
  group.name = id + ' · stylized timber structure';
  group.userData = {source: 'Procedural Three.js', stylizedStructure: true, structure: meta};
  return group;
}
