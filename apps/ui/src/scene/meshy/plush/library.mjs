/** Review study: does the walk-in library establish the den's bright plush-garden look?
 * Standalone asset, +Y up / +Z entrance. No scene, renderer, lights, or pandas are owned here.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const LIBRARY_PALETTE = {
  plaster: '#fff2d9', jade: '#71a68a', jadeDeep: '#397761', jadeLight: '#a5c7a0',
  timber: '#b78151', honey: '#dbad72', paleWood: '#eac998', cream: '#fff8e8',
  coral: '#d87962', gold: '#e2b65c', ink: '#31584b', lavender: '#b0a0c7',
};

export function createLibrary() {
  const root = new THREE.Group(); root.name = 'Walk-in library — garden study 01';
  root.userData = { assetId: 'walk-in-library-study', entrance: '+Z', reviewOnly: false };
  const palette = Object.fromEntries(Object.entries(LIBRARY_PALETTE).map(([key, color]) => [key,
    new THREE.MeshStandardMaterial({ color, roughness: .87, metalness: 0 })]));
  const grainCanvas = document.createElement('canvas'); grainCanvas.width = grainCanvas.height = 256;
  const grain = grainCanvas.getContext('2d'); grain.fillStyle = '#fffdf5'; grain.fillRect(0, 0, 256, 256);
  for (let line = 0; line < 72; line++) {
    grain.fillStyle = `rgba(97,70,42,${.025 + line % 4 * .012})`;
    for (let segment = 0; segment < 32; segment++) {
      const x = line * 3.7 + Math.sin(segment * .3 + line * .7) * 1.6;
      grain.fillRect(x, segment * 8, line % 3 === 0 ? 1.1 : .55, 8.5);
    }
  }
  const woodGrain = new THREE.CanvasTexture(grainCanvas); woodGrain.colorSpace = THREE.SRGBColorSpace;
  woodGrain.wrapS = woodGrain.wrapT = THREE.RepeatWrapping;
  for (const key of ['timber', 'honey', 'paleWood']) palette[key].map = woodGrain;
  const material = (value) => palette[value] ?? value;
  const group = (name, parent = root, position = [0, 0, 0]) => {
    const object = new THREE.Group(); object.name = name; object.position.set(...position); parent.add(object); return object;
  };
  const mesh = (parent, geometry, color, position = [0, 0, 0]) => {
    const object = new THREE.Mesh(geometry, material(color)); object.position.set(...position);
    object.castShadow = true; object.receiveShadow = true; parent.add(object); return object;
  };
  const box = (parent, size, position, color, radius = .07) => mesh(parent,
    new RoundedBoxGeometry(...size, 3, Math.min(radius, ...size.map(v => v * .24))), color, position);
  const cylinder = (parent, radius, height, position, color, top = radius) => mesh(parent,
    new THREE.CylinderGeometry(top, radius, height, 24), color, position);
  const ball = (parent, radius, position, color, scale = [1, 1, 1]) => {
    const object = mesh(parent, new THREE.SphereGeometry(radius, 24, 16), color, position); object.scale.set(...scale); return object;
  };
  const tube = (parent, points, radius, color) => mesh(parent,
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(v => new THREE.Vector3(...v))), 40, radius, 8, false), color);
  const beam = (parent, a, b, radius, color) => {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
    const object = cylinder(parent, radius, start.distanceTo(end), start.clone().add(end).multiplyScalar(.5).toArray(), color);
    object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize()); return object;
  };
  const ring = (parent, radius, thickness, position, color) => mesh(parent,
    new THREE.TorusGeometry(radius, thickness, 8, 40), color, position);
  function label(parent, text, position, width, height, background = 'jadeDeep', foreground = 'cream') {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = Math.round(1024 * height / width);
    const context = canvas.getContext('2d'); context.fillStyle = LIBRARY_PALETTE[background]; context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = LIBRARY_PALETTE[foreground]; context.font = `600 ${canvas.height * .49}px sans-serif`;
    context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(text, 512, canvas.height * .54, 950);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const object = mesh(parent, new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture }), position);
    object.castShadow = false; return object;
  }
  function scroll(parent, position, color = 'coral', scale = 1) {
    const object = group('Ribbon-bound recipe scroll', parent, position); object.scale.setScalar(scale);
    const roll = cylinder(object, .12, .47, [0, 0, 0], 'cream'); roll.rotation.x = Math.PI / 2;
    for (const z of [-.25, .25]) {
      const cap = cylinder(object, .145, .04, [0, 0, z], 'honey'); cap.rotation.x = Math.PI / 2;
    }
    const ribbon = cylinder(object, .124, .065, [0, 0, 0], color); ribbon.rotation.x = Math.PI / 2;
    ball(object, .033, [0, .13, .02], color);
  }
  function drawer(parent, position, width = .67, color = 'paleWood') {
    box(parent, [width, .32, .53], position, color, .035);
    box(parent, [.21, .1, .025], [position[0], position[1] + .035, position[2] + .275], 'cream', .01);
    const pull = ring(parent, .045, .013, [position[0], position[1] - .04, position[2] + .293], 'gold'); pull.rotation.x = -.2;
  }
  function lantern(parent, position, color = 'cream', scale = 1) {
    const object = group('Soft paper lantern', parent, position); object.scale.setScalar(scale);
    beam(object, [0, 0, 0], [0, -.28, 0], .015, 'timber');
    ball(object, .26, [0, -.59, 0], color, [1, 1.18, 1]);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      tube(object, [[Math.cos(a) * .1, -.3, Math.sin(a) * .1], [Math.cos(a) * .262, -.59, Math.sin(a) * .262],
        [Math.cos(a) * .1, -.88, Math.sin(a) * .1]], .008, 'paleWood');
    }
    for (const y of [-.29, -.9]) cylinder(object, .12, .045, [0, y, 0], 'honey');
    beam(object, [0, -.92, 0], [0, -1.11, 0], .025, 'coral');
  }
  function bamboo(parent, position, scale = 1) {
    const object = group('Potted bamboo', parent, position); object.scale.setScalar(scale);
    cylinder(object, .38, .55, [0, .275, 0], 'cream', .46);
    const rim = ring(object, .45, .035, [0, .55, 0], 'paleWood'); rim.rotation.x = Math.PI / 2;
    cylinder(object, .39, .025, [0, .56, 0], 'timber');
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * .19, z = i % 2 * .13, h = [2.2, 2.75, 2.4][i];
      beam(object, [x, .56, z], [x, h, z], .047, 'jade');
      for (let y = .9; y < h; y += .39) cylinder(object, .058, .035, [x, y, z], 'jadeDeep');
      for (let j = 0; j < 4; j++) {
        const a = i * 2.7 + j * 1.9, y = h - .2 - j * .23;
        const end = [x + Math.cos(a) * .48, y + .16, z + Math.sin(a) * .48];
        beam(object, [x, y, z], end, .014, 'jadeDeep');
        const leaf = ball(object, .24, end, 'jade', [.28, .13, 1.25]); leaf.rotation.y = a + Math.PI / 2;
      }
    }
  }

  // A small diorama foundation; its edge makes the standalone footprint readable.
  const foundation = group('Timber foundation and entrance steps');
  box(foundation, [9.5, .32, 7.6], [0, .05, 0], 'timber', .14);
  box(foundation, [9.35, .16, 7.45], [0, .25, 0], 'honey');
  for (let i = 0; i < 23; i++) {
    const x = -4.4 + i * .4;
    box(foundation, [.39, .08, 7.25], [x, .37, 0], i % 4 === 0 ? 'paleWood' : 'honey', .018);
    for (const z of [-3.35, 3.35]) cylinder(foundation, .012, .006, [x, .413, z], 'timber');
  }
  for (const [z, w, y] of [[4.16, 3.65, .13], [3.85, 3.3, .25]]) box(foundation, [w, .18, .7], [0, y, z], 'paleWood');
  const shell = group('Permanent rear shell');
  const cutaway = group('Front and right walls — hide for the dollhouse view');
  box(shell, [8.7, 3.95, .18], [0, 2.39, -3.25], 'plaster');
  box(shell, [.18, 3.95, 6.5], [-4.3, 2.39, 0], 'plaster');
  box(cutaway, [.18, 3.95, 6.5], [4.3, 2.39, 0], 'plaster');
  for (const x of [-3, 3]) box(cutaway, [2.55, 3.95, .19], [x, 2.39, 3.25], 'plaster');
  for (const x of [-4.32, 4.32]) {
    const wall = x < 0 ? shell : cutaway;
    box(wall, [.24, .65, 6.55], [x, .74, 0], 'jadeLight');
    for (const z of [-3.25, 0, 3.25]) cylinder(wall, .12, 4.12, [x, 2.45, z], 'timber');
    // Circular bamboo lattice windows, visible from the outside.
    const window = group('Round lattice window', wall, [x + Math.sign(x) * .13, 2.55, .8]); window.rotation.y = Math.sign(x) * Math.PI / 2;
    const disk = cylinder(window, .73, .045, [0, 0, 0], 'jadeDeep'); disk.rotation.x = Math.PI / 2;
    ring(window, .74, .075, [0, 0, .035], 'honey');
    for (const v of [-.35, 0, .35]) {
      const half = Math.sqrt(.68 ** 2 - v ** 2);
      beam(window, [v, -half, .06], [v, half, .06], .025, 'paleWood');
      beam(window, [-half, v, .07], [half, v, .07], .025, 'paleWood');
    }
  }
  for (const z of [-3.25, 3.25]) box(z > 0 ? cutaway : shell, [8.9, .17, .24], [0, 4.44, z], 'timber');
  for (const z of [-3.25, 3.25]) for (const sign of [-1, 1]) {
    const frame = z > 0 ? cutaway : shell, x = sign * 4.3;
    box(frame, [.4, .16, .38], [x, 4.28, z], 'honey');
    tube(frame, [[x - sign * .72, 4.33, z], [x - sign * .48, 4.22, z], [x - sign * .17, 3.94, z], [x, 3.9, z]], .065, 'timber');
    const peg = cylinder(frame, .04, .025, [x, 4.12, z + Math.sign(z) * .13], 'gold'); peg.rotation.x = Math.PI / 2;
  }
  const entry = group('Rounded welcoming entrance', cutaway);
  for (const x of [-1.66, 1.66]) {
    cylinder(entry, .14, 2.15, [x, 1.48, 3.27], 'honey');
    cylinder(entry, .22, .15, [x, .49, 3.27], 'paleWood');
  }
  mesh(entry, new THREE.TorusGeometry(1.66, .14, 12, 56, Math.PI), 'honey', [0, 2.55, 3.27]);
  for (const x of [-3.0, 3.0]) {
    const plaque = group('Bamboo relief', entry, [x, 2.2, 3.38]);
    box(plaque, [.95, 1.7, .07], [0, 0, 0], 'jadeLight');
    for (const dx of [-.2, .15]) {
      beam(plaque, [dx, -.65, .07], [dx, .65, .07], .026, 'jadeDeep');
      for (let i = 0; i < 3; i++) {
        const leaf = ball(plaque, .13, [dx + (i % 2 ? -.14 : .14), -.3 + i * .32, .08], 'jade', [.45, 1.2, .22]); leaf.rotation.z = i % 2 ? -.6 : .6;
      }
    }
  }
  const signage = group('Library entrance sign', cutaway);
  box(signage, [3.15, .63, .16], [0, 4.24, 3.49], 'jadeDeep');
  box(signage, [2.98, .49, .02], [0, 4.24, 3.581], 'gold');
  label(signage, 'THE LIBRARY', [0, 4.24, 3.6], 2.87, .4);
  lantern(entry, [-1.95, 4.28, 3.65], 'cream', .86); lantern(entry, [1.95, 4.28, 3.65], 'cream', .86);

  const roof = group('Lift-off jade roof');
  const roofY = (x, z) => 4.58 + .98 * (1 - Math.abs(z) / 4.05) + .34 * (Math.abs(x) / 5.05) ** 6 + .28 * (Math.abs(z) / 4.05) ** 8;
  // Flat wall tops need fitted infill beneath the curved roof, including both gable ends.
  for (const side of [-1, 1]) for (const gable of [false, true]) {
    const half = gable ? 3.25 : 4.3, fixed = side * (gable ? 4.3 : 3.25);
    const height = u => gable ? roofY(fixed, u) : roofY(u, fixed);
    const profile = new THREE.Shape(); profile.moveTo(-half, 4.33); profile.lineTo(half, 4.33);
    for (let i = 32; i >= 0; i--) { const u = -half + i / 32 * half * 2; profile.lineTo(u, height(u) - .035); }
    profile.closePath();
    const infill = mesh(roof, new THREE.ExtrudeGeometry(profile, { depth: .2, bevelEnabled: false }), 'plaster');
    infill.name = gable ? 'Fitted plaster gable' : 'Fitted eave infill';
    if (gable) { infill.rotation.y = Math.PI / 2; infill.position.x = fixed - .1; }
    else infill.position.z = fixed - .1;
    const edge = Array.from({ length: 33 }, (_, i) => {
      const u = -half + i / 32 * half * 2;
      return gable ? [fixed, height(u) - .055, u] : [u, height(u) - .055, fixed];
    });
    tube(roof, edge, .075, 'honey');
  }
  const positions = [], indices = [], nx = 56, nz = 40;
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const x = (i / nx - .5) * 10.1, z = (j / nz - .5) * 8.1;
    positions.push(x, roofY(x, z), z);
    if (i < nx && j < nz) { const k = j * (nx + 1) + i; indices.push(k, k + nx + 1, k + 1, k + 1, k + nx + 1, k + nx + 2); }
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setIndex(indices); geometry.computeVertexNormals();
  const roofMaterial = palette.jade.clone(); roofMaterial.side = THREE.DoubleSide;
  const roofSkin = mesh(roof, geometry, roofMaterial); roofSkin.name = 'Continuous jade roof skin';
  // Lapped, gently barrel-shaped ceramic tiles retain the curved silhouette.
  const tileMaterials = [palette.jade.clone(), palette.jade.clone(), palette.jade.clone()];
  tileMaterials[0].color.lerp(new THREE.Color('#c7dfba'), .13);
  tileMaterials[2].color.lerp(new THREE.Color('#397761'), .14);
  for (const material of tileMaterials) material.side = THREE.DoubleSide;
  const tiles = tileMaterials.map(() => []), rows = 9, columns = 34;
  for (const sign of [-1, 1]) for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
    const tone = (row * 7 + column * 3) % 17, vertices = tiles[tone < 2 ? 0 : tone === 4 ? 2 : 1];
    const x0 = -5.05 + column / columns * 10.1 + .005, x1 = -5.05 + (column + 1) / columns * 10.1 - .005;
    const z0 = row / rows * 4.05, z1 = Math.min(4.05, (row + 1) / rows * 4.05 + .035);
    const at = (i, j) => {
      const x = THREE.MathUtils.lerp(x0, x1, j / 2), z = sign * THREE.MathUtils.lerp(z0, z1, i / 2);
      return [x, roofY(x, z) + .025 + Math.sin(j / 2 * Math.PI) * .032 + i * .007, z];
    };
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
      vertices.push(...a, ...b, ...d, ...b, ...c, ...d);
    }
  }
  for (let i = 0; i < tiles.length; i++) {
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(tiles[i], 3)); geometry.computeVertexNormals();
    mesh(roof, geometry, tileMaterials[i]).name = 'Overlapping ceramic roof tiles';
  }
  for (const z of [-4.05, 4.05]) tube(roof, Array.from({ length: 33 }, (_, i) => {
    const x = (i / 32 - .5) * 10.1; return [x, roofY(x, z) - .035, z];
  }), .12, 'jadeDeep');
  for (let x = -4.9; x < 5; x += .29) tube(roof, Array.from({ length: 25 }, (_, i) => {
    const z = (i / 24 - .5) * 8.1; return [x, roofY(x, z) + .025, z];
  }), .025, 'jadeLight');
  for (const x of [-5.05, 5.05]) tube(roof, Array.from({ length: 25 }, (_, i) => {
    const z = (i / 24 - .5) * 8.1; return [x, roofY(x, z), z];
  }), .1, 'jadeDeep');
  tube(roof, [[-5.1, 5.98, 0], [-3.8, 5.66, 0], [0, 5.6, 0], [3.8, 5.66, 0], [5.1, 5.98, 0]], .14, 'jadeDeep');
  for (let x = -4.8; x < 4.85; x += .3) {
    const cap = cylinder(roof, .15, .04, [x, roofY(x, 0) + .035, 0], 'jade'); cap.rotation.z = Math.PI / 2;
  }
  for (const x of [-4.25, 0, 4.25]) box(roof, [.15, .2, 6.6], [x, 4.48, 0], 'honey');
  for (const z of [-2.1, 2.1]) box(roof, [8.55, .18, .18], [0, 4.42, z], 'paleWood');

  const interior = group('Library furnishings');
  box(interior, [1.95, .025, 4.05], [0, .425, 1.05], 'jadeLight', .01);
  for (const x of [-.89, .89]) box(interior, [.027, .008, 3.9], [x, .444, 1.05], 'cream', .002);
  // Side bays face the central aisle, just as the server racks did in the reference.
  function sideBay(name, x, yaw, contents) {
    const bay = group(name, interior, [x, .42, -.1]); bay.rotation.y = yaw;
    box(bay, [3.7, 2.95, .73], [0, 1.48, 0], 'timber');
    box(bay, [3.46, 2.7, .06], [0, 1.52, .405], 'jadeDeep');
    for (const y of [.22, .94, 1.66, 2.38]) box(bay, [3.65, .11, .83], [0, y, .28], 'paleWood');
    for (const xx of [-1.78, 0, 1.78]) box(bay, [.11, 2.77, .83], [xx, 1.47, .28], 'honey');
    box(bay, [3.88, .19, .95], [0, 2.95, .1], 'honey');
    label(bay, name.toUpperCase(), [0, 2.69, .48], 2.95, .3);
    for (let row = 0; row < 3; row++) for (let col = 0; col < 8; col++) {
      const xx = -1.48 + col * .42, yy = .43 + row * .72;
      if (contents === 'scrolls') scroll(bay, [xx, yy, .55], ['coral', 'jade', 'lavender'][(col + row) % 3], .95);
      else {
        const h = .36 + (col % 3) * .055;
        box(bay, [.24, h, .38], [xx, yy + .02, .5], ['jade', 'coral', 'cream', 'lavender'][col % 4], .025);
        box(bay, [.13, .025, .012], [xx, yy + .1, .7], 'gold', .003);
      }
    }
    for (let i = 0; i < 5; i++) drawer(bay, [-1.4 + i * .7, .11, .59], .64, i % 2 ? 'honey' : 'paleWood');
    return bay;
  }
  sideBay('Recipes', -3.64, Math.PI / 2, 'scrolls');
  sideBay('Skills', 3.64, -Math.PI / 2, 'books');
  const cabinets = group('Connections catalog — illustrative lantern indicators', interior, [0, .42, -2.76]);
  for (const x of [-2.5, 0, 2.5]) {
    box(cabinets, [2.18, 2.92, .65], [x, 1.46, 0], 'jade');
    box(cabinets, [1.94, 2.53, .04], [x, 1.52, .35], 'jadeDeep');
    for (let row = 0; row < 5; row++) {
      drawer(cabinets, [x - .43, .54 + row * .41, .36], .78);
      drawer(cabinets, [x + .43, .54 + row * .41, .36], .78, 'honey');
      ball(cabinets, .055, [x - .86, .57 + row * .41, .67], row === 3 && x === 0 ? 'gold' : 'jadeLight');
    }
    label(cabinets, x < 0 ? 'TOOLS' : x > 0 ? 'CONNECTIONS' : 'CATALOG', [x, 2.67, .38], 1.8, .3);
    box(cabinets, [2.31, .16, .81], [x, 2.96, 0], 'honey');
  }
  // Reading desk at the end of the aisle; the entrance and side bays remain approachable.
  const desk = group('Reading desk and open recipe book', interior, [0, .42, -1.13]);
  box(desk, [2.32, .16, 1.05], [0, .95, 0], 'paleWood');
  for (const x of [-.94, .94]) for (const z of [-.34, .34]) cylinder(desk, .065, .89, [x, .45, z], 'timber');
  box(desk, [.98, .075, .68], [-.23, 1.065, .03], 'jadeDeep');
  for (const x of [-.47, .01]) {
    const page = box(desk, [.46, .045, .6], [x, 1.115, .03], 'cream', .008); page.rotation.z = x < -.1 ? -.08 : .08;
    for (let row = 0; row < 5; row++) box(desk, [.29, .007, .014], [x, 1.145, -.15 + row * .085], 'honey', .001);
  }
  cylinder(desk, .115, .15, [.83, 1.1, .05], 'jade', .14);
  cylinder(desk, .118, .01, [.83, 1.18, .05], 'timber');
  ring(desk, .075, .025, [.96, 1.11, .05], 'jade');
  cylinder(interior, .39, .12, [0, .95, -2.0], 'timber');
  box(interior, [.66, .18, .62], [0, 1.075, -2.0], 'jadeLight', .09);
  for (const x of [-.24, .24]) for (const z of [-2.24, -1.76]) beam(interior, [x, .42, z], [x * .8, .9, z], .05, 'timber');
  const ladder = group('Little rolling library ladder', interior, [-2.08, .42, -1.22]); ladder.rotation.z = -.08;
  for (const x of [-.3, .3]) beam(ladder, [x, .08, .24], [x, 2.68, -.2], .045, 'honey');
  for (let i = 0; i < 7; i++) beam(ladder, [-.34, .3 + i * .33, .2 - i * .055], [.34, .3 + i * .33, .2 - i * .055], .035, 'paleWood');
  for (const x of [-.3, .3]) {
    const wheel = cylinder(ladder, .08, .04, [x, .08, .24], 'jadeDeep'); wheel.rotation.z = Math.PI / 2;
  }
  lantern(interior, [-1.55, 4.26, -.9], 'cream', .74); lantern(interior, [1.55, 4.26, -.9], 'cream', .74);
  bamboo(root, [-3.45, .4, 2.63], .75); bamboo(root, [3.45, .4, 2.63], .75);
  const secret = group('A very well-read lucky bao', interior, [-3.18, 2.38, .72]);
  ball(secret, .17, [0, 0, 0], 'cream', [1, .8, 1]);
  for (const x of [-.055, .055]) ball(secret, .014, [x, .015, .153], 'ink');
  tube(secret, [[-.04, -.04, .156], [0, -.057, .165], [.04, -.04, .156]], .008, 'ink');
  for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; beam(secret, [Math.sin(a) * .08, .1, Math.cos(a) * .08], [0, .15, 0], .009, 'paleWood'); }

  function dispose() {
    const geometries = new Set(), materials = new Set(Object.values(palette)), textures = new Set();
    root.traverse(object => { if (object.geometry) geometries.add(object.geometry); if (object.material) materials.add(object.material); });
    for (const m of materials) { if (m.map) textures.add(m.map); m.dispose(); }
    for (const t of textures) t.dispose(); for (const g of geometries) g.dispose();
    root.removeFromParent();
  }
  return { root, roof, cutaway, interior, dispose,
    setRoofVisible(visible) { roof.visible = visible; },
    setCutaway(enabled) { cutaway.visible = !enabled; },
  };
}
