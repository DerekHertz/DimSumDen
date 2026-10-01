// den-scene-v1/09: procedural role headgear, props and the shared scarf (user rescope 2026-10-01: Three.js
// lathe/torus/cylinder/box parts, no glb). Spec: handoffs/09-designer-spec.md. Expected hues, sockets and item
// names are worked literals from that spec and docs/design/tokens.json, never recomputed from the module.
//
// Interface under test (new pure module apps/ui/src/scene/headgear.mjs, no three import):
//   ROLES                                  the nine role names
//   headgearSpec(role, {theme, lod})  ->   parts[]   (socket "hat" frame)
//   propSpec(role, {theme, lod})      ->   parts[]   (socket of the role's paw)
//   scarfSpec(role, {theme, lod})     ->   parts[]   (body frame, shared by every role)
//   materialProps(token)              ->   {roughness, metalness, opacity?}
//   part = {name: "<item>:<piece>", kind: lathe|torus|cylinder|box|sphere, params, position: [x,y,z],
//           rotation?: [x,y,z] (Euler radians), scale?: [x,y,z], material: station|cream|ink|wood|glass, color: "#rrggbb"}
//   params use the three.js constructor argument names: lathe {points: [[r,y],...], segments};
//   torus {radius, tube, radialSegments, tubularSegments, arc?}; cylinder {radiusTop, radiusBottom, height,
//   radialSegments, openEnded?}; box {width, height, depth}; sphere {radius, widthSegments, heightSegments,
//   phiStart?, phiLength?, thetaStart?, thetaLength?}.
// Placement lives beside PROP_ASSETS in apps/ui/src/assets/panda-contract.mjs as ROLE_PLACEMENT.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as THREE from "three";
import * as contract from "../assets/panda-contract.mjs"; // namespace: a missing export must fail one test, not the file

const { SOCKETS } = contract;

const mod = () => import("./headgear.mjs");
const read = (f) => readFileSync(new URL(f, import.meta.url), "utf8");
const lc = (s) => String(s).toLowerCase();

const ROLES = ["orchestrator", "product", "architect", "developer", "scout", "debugger", "qa", "security", "designer"];
const THEMES = ["light", "dark"];
// Designer table: station hue key, socket the prop sits on, and the item name each part is prefixed with.
const TABLE = {
  orchestrator: { station: "pass", paw: "paw_R", headgear: "toque", prop: "ladle" },
  product: { station: "pass", paw: "paw_L", headgear: "spectacles", prop: "menu" },
  architect: { station: "pass", paw: "paw_L", headgear: "spectacles", prop: "slips" },
  developer: { station: "steamers", paw: "paw_L", headgear: "headphones", prop: "tablet" },
  scout: { station: "steamers", paw: "paw_R", headgear: "goggles", prop: "magnifier" },
  debugger: { station: "steamers", paw: "paw_R", headgear: "headlamp", prop: "chopsticks" },
  qa: { station: "tea", paw: "paw_R", headgear: "douli", prop: "teacup" },
  security: { station: "pantry", paw: "paw_R", headgear: "cap", prop: "seal" },
  designer: { station: "front-of-house", paw: "paw_L", headgear: "beret", prop: "plate" },
};
const HUES = {
  light: { pass: "#674698", steamers: "#2759A2", tea: "#006E54", pantry: "#326A2D", "front-of-house": "#00658B" },
  dark: { pass: "#C3A5F9", steamers: "#87B9FF", tea: "#56D0AF", pantry: "#8ACB83", "front-of-house": "#55C6F4" },
};
const ALL_HUES = THEMES.flatMap((t) => Object.values(HUES[t])).map(lc);
const NEUTRAL_TOKENS = ["cream", "ink", "wood", "glass"];
const TINTED_HEADGEAR = ["orchestrator", "security", "designer"]; // toque band, cap, beret
const HEAD_WIDTH = 1.3; // the panda head's measured x extent (+-0.66 on panda.glb), in socket units
const CROWD = { lod: "crowd" };

// --- independent geometry measures, built with three itself ---
function geometryOf(part) {
  const p = part.params;
  switch (part.kind) {
    case "lathe": return new THREE.LatheGeometry(p.points.map(([r, y]) => new THREE.Vector2(r, y)), p.segments);
    case "torus": return new THREE.TorusGeometry(p.radius, p.tube, p.radialSegments, p.tubularSegments, p.arc);
    case "cylinder": return new THREE.CylinderGeometry(p.radiusTop, p.radiusBottom, p.height, p.radialSegments, 1, p.openEnded);
    case "box": return new THREE.BoxGeometry(p.width, p.height, p.depth);
    case "sphere": return new THREE.SphereGeometry(p.radius, p.widthSegments, p.heightSegments, p.phiStart, p.phiLength, p.thetaStart, p.thetaLength);
    default: throw new Error(`unknown part kind ${part.kind}`);
  }
}
const triangles = (parts) => parts.reduce((sum, part) => {
  const g = geometryOf(part);
  return sum + (g.index ? g.index.count : g.attributes.position.count) / 3;
}, 0);
function boxOf(parts) {
  const group = new THREE.Group();
  for (const part of parts) {
    const mesh = new THREE.Mesh(geometryOf(part));
    mesh.position.set(...part.position);
    if (part.rotation) mesh.rotation.set(...part.rotation);
    if (part.scale) mesh.scale.set(...part.scale);
    group.add(mesh);
  }
  group.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(group);
}
const gear = async (role, theme = "light", lod = "crowd") => {
  const { headgearSpec, propSpec, scarfSpec } = await mod();
  return { headgear: headgearSpec(role, { theme, lod }), prop: propSpec(role, { theme, lod }), scarf: scarfSpec(role, { theme, lod }) };
};

// ---- criterion: each of the 9 roles has headgear, a prop and a placement entry (spec test 1) ----

test("the module names exactly the nine roles", async () => {
  const { ROLES: roles } = await mod();
  assert.deepEqual([...roles].sort(), [...ROLES].sort());
});

for (const role of ROLES) {
  test(`${role}: headgear and prop specs are non-empty lists of well-formed parts`, async () => {
    const { headgear, prop } = await gear(role);
    for (const [what, parts] of [["headgear", headgear], ["prop", prop]]) {
      assert.ok(Array.isArray(parts) && parts.length > 0, `${role} ${what} is empty`);
      for (const part of parts) {
        assert.equal(typeof part.name, "string", `${role} ${what} part has no name`);
        assert.ok(["lathe", "torus", "cylinder", "box", "sphere"].includes(part.kind), `${part.name}: kind ${part.kind}`);
        assert.equal(part.position?.length, 3, `${part.name}: position is [x, y, z]`);
        assert.ok(part.position.every(Number.isFinite), `${part.name}: position is finite`);
        assert.match(part.color, /^#[0-9a-f]{6}$/i, `${part.name}: color is a hex string`);
        assert.doesNotThrow(() => geometryOf(part), `${part.name}: params build a three.js geometry`);
      }
    }
  });

  test(`${role}: the headgear is a ${TABLE[role].headgear} and the prop is a ${TABLE[role].prop}, by part name`, async () => {
    const { headgear, prop } = await gear(role);
    assert.ok(headgear.some((p) => p.name.startsWith(`${TABLE[role].headgear}:`)), `headgear names: ${headgear.map((p) => p.name)}`);
    assert.ok(prop.some((p) => p.name.startsWith(`${TABLE[role].prop}:`)), `prop names: ${prop.map((p) => p.name)}`);
  });

  test(`${role}: ROLE_PLACEMENT puts the headgear on the hat socket and the prop on ${TABLE[role].paw}`, () => {
    const entry = contract.ROLE_PLACEMENT?.[role];
    assert.ok(entry, `no placement entry for ${role}`);
    assert.equal(entry.headgear.socket, "hat");
    assert.equal(entry.prop.socket, TABLE[role].paw);
    for (const s of [entry.headgear.socket, entry.prop.socket]) assert.ok(SOCKETS.includes(s), `${s} is a panda socket`);
  });
}

test("ROLE_PLACEMENT has an entry for the nine roles and no others", () => {
  assert.deepEqual(Object.keys(contract.ROLE_PLACEMENT ?? {}).sort(), [...ROLES].sort());
});

// ---- criterion: the scarf and tinted headgear take the station hue, live per theme (spec test 2) ----

for (const role of ROLES) for (const theme of THEMES) {
  test(`${role} / ${theme}: every scarf part is station-tinted with the ${TABLE[role].station} hue`, async () => {
    const { scarf } = await gear(role, theme);
    assert.ok(scarf.length > 0, "the scarf has parts");
    for (const part of scarf) {
      assert.equal(part.material, "station", `${part.name} is not a station-tinted part`);
      assert.equal(lc(part.color), lc(HUES[theme][TABLE[role].station]), `${part.name} colour`);
    }
  });

  test(`${role} / ${theme}: every station-tinted part of the headgear and prop wears the ${TABLE[role].station} hue; neutrals never do`, async () => {
    const { headgear, prop } = await gear(role, theme);
    for (const part of [...headgear, ...prop]) {
      if (part.material === "station") assert.equal(lc(part.color), lc(HUES[theme][TABLE[role].station]), `${part.name} colour`);
      else assert.ok(!ALL_HUES.includes(lc(part.color)), `${part.name} is ${part.material} but wears a station hue ${part.color}`);
    }
  });
}

for (const role of TINTED_HEADGEAR) {
  test(`${role}: the ${TABLE[role].headgear} has a station-tinted part (band, cap or beret)`, async () => {
    for (const theme of THEMES) {
      const { headgear } = await gear(role, theme);
      const tinted = headgear.filter((p) => p.material === "station");
      assert.ok(tinted.length > 0, `${role} headgear has no station-tinted part in ${theme}`);
      assert.ok(tinted.every((p) => lc(p.color) === lc(HUES[theme][TABLE[role].station])));
    }
  });
}

test("a theme swap changes the scarf hue and leaves every neutral part's colour alone", async () => {
  for (const role of ROLES) {
    const light = await gear(role, "light");
    const dark = await gear(role, "dark");
    assert.notEqual(lc(light.scarf[0].color), lc(dark.scarf[0].color), `${role} scarf did not change`);
    for (const k of ["headgear", "prop"]) {
      assert.equal(light[k].length, dark[k].length, `${role} ${k} part count differs by theme`);
      light[k].forEach((p, i) => {
        if (p.material !== "station") assert.equal(lc(p.color), lc(dark[k][i].color), `${role} ${p.name} neutral changed with theme`);
      });
    }
  }
});

test("the theme defaults to light when none is given", async () => {
  const { scarfSpec } = await mod();
  assert.equal(lc(scarfSpec("qa")[0].color), lc(HUES.light.tea));
});

// ---- scope: scout carries no lantern (criterion 3) ----

test("scout: the prop is a magnifier (ring and handle) and nothing lantern-like", async () => {
  const { prop, headgear } = await gear("scout");
  assert.ok(prop.some((p) => p.name.startsWith("magnifier:") && p.kind === "torus"), "magnifier ring is a torus part");
  assert.ok(prop.some((p) => p.name.startsWith("magnifier:") && p.kind !== "torus"), "magnifier handle part");
  for (const part of [...prop, ...headgear]) assert.doesNotMatch(part.name, /lantern/i, `${part.name} is a lantern`);
});

test("developer: the prop is the npm test tablet, a slab with a screen plane (user verdict 2026-09-30)", async () => {
  const { prop } = await gear("developer");
  const names = prop.map((p) => p.name);
  assert.ok(names.includes("tablet:slab"), `parts: ${names}`);
  assert.ok(names.includes("tablet:screen"), `parts: ${names}`);
  const slab = prop.find((p) => p.name === "tablet:slab");
  const screen = prop.find((p) => p.name === "tablet:screen");
  assert.equal(slab.kind, "box");
  assert.equal(screen.kind, "box");
  assert.ok(screen.params.depth < slab.params.depth, "the screen is a thin plane on the slab");
});

// ---- criterion 4: <= 400 triangles per panda at crowd LOD (spec test 4) ----

for (const role of ROLES) {
  test(`${role}: headgear + prop + scarf is at most 400 triangles at crowd LOD`, async () => {
    const { headgear, prop, scarf } = await gear(role, "light", "crowd");
    const total = triangles([...headgear, ...prop, ...scarf]);
    assert.ok(total > 0, "counted no triangles");
    assert.ok(total <= 400, `${role}: ${total} triangles`);
  });

  test(`${role}: crowd LOD stays within the segment caps (lathe <= 8, torus <= 8 x 6, cylinder <= 8)`, async () => {
    const { headgear, prop, scarf } = await gear(role, "light", "crowd");
    for (const { name, kind, params: p } of [...headgear, ...prop, ...scarf]) {
      if (kind === "lathe") assert.ok(p.segments <= 8, `${name}: lathe segments ${p.segments}`);
      if (kind === "torus") assert.ok(Math.max(p.radialSegments, p.tubularSegments) <= 8 && Math.min(p.radialSegments, p.tubularSegments) <= 6, `${name}: torus ${p.radialSegments} x ${p.tubularSegments} (want 8 x 6 or less)`);
      if (kind === "cylinder") assert.ok(p.radialSegments <= 8, `${name}: cylinder segments ${p.radialSegments}`);
    }
  });
}

// ---- spec test 5: materials are soft-matte neutrals or the station hue; fur is never tinted ----

test("every part uses a station or neutral token, never a fur material", async () => {
  for (const role of ROLES) {
    const { headgear, prop, scarf } = await gear(role);
    for (const part of [...headgear, ...prop, ...scarf]) {
      // fail/pass: the developer tablet's red and green result lines (09 round 2, L1); never fur.
      assert.ok(["station", ...NEUTRAL_TOKENS, "fail", "pass"].includes(part.material), `${role} ${part.name}: material ${part.material}`);
    }
  }
});

test("materials are soft-matte: roughness >= 0.8, metalness 0; glass is see-through", async () => {
  const { materialProps } = await mod();
  for (const token of ["station", ...NEUTRAL_TOKENS]) {
    const m = materialProps(token);
    assert.ok(m.roughness >= 0.8, `${token} roughness ${m.roughness}`);
    assert.equal(m.metalness, 0, `${token} metalness`);
  }
  assert.ok(materialProps("glass").opacity < 1, "glass has low opacity");
});

test("an unknown role gets no headgear and no prop, a neutral scarf, and never throws", async () => {
  const { headgearSpec, propSpec, scarfSpec } = await mod();
  for (const role of ["gremlin", "", undefined, null, "cub", "__proto__"]) {
    assert.deepEqual(headgearSpec(role, { theme: "light" }), [], `headgear for ${String(role)}`);
    assert.deepEqual(propSpec(role, { theme: "light" }), [], `prop for ${String(role)}`);
    const scarf = scarfSpec(role, { theme: "dark" });
    assert.ok(scarf.length > 0, "the scarf is still drawn");
    for (const part of scarf) {
      assert.equal(part.material, "cream", `${part.name} is the neutral cream`);
      assert.ok(!ALL_HUES.includes(lc(part.color)), "no station hue on an unknown role");
    }
  }
  assert.doesNotThrow(() => headgearSpec("qa", { theme: "sepia" }), "an unknown theme does not throw");
});

// ---- spec test 6: headgear reads at Level 1 without hiding neighbours ----

for (const role of ROLES) {
  test(`${role}: the headgear stays within 1.6 x the head width and rides on the head`, async () => {
    const { headgear } = await gear(role, "light", "crowd");
    const box = boxOf(headgear);
    assert.ok(box.max.x - box.min.x <= 1.6 * HEAD_WIDTH, `width ${(box.max.x - box.min.x).toFixed(2)} of ${(1.6 * HEAD_WIDTH).toFixed(2)}`);
    assert.ok(box.max.z - box.min.z <= 1.6 * HEAD_WIDTH, `depth ${(box.max.z - box.min.z).toFixed(2)} of ${(1.6 * HEAD_WIDTH).toFixed(2)}`);
    assert.ok(box.max.x - box.min.x >= 0.3 * HEAD_WIDTH, "wide enough to read at Level 1");
    // Socket frame: origin on the crown. Nothing hangs below the chin (about 0.86 down) or towers beyond 1.0 up.
    assert.ok(box.min.y >= -0.9 && box.max.y <= 1.0, `vertical extent ${box.min.y.toFixed(2)} to ${box.max.y.toFixed(2)}`);
  });
}

test("the douli is wider than the other hats and the toque is the tallest: silhouettes differ by more than hue", async () => {
  const sizes = {};
  for (const role of ROLES) {
    const box = boxOf((await gear(role)).headgear);
    sizes[role] = { w: box.max.x - box.min.x, h: box.max.y - box.min.y };
  }
  for (const role of ["orchestrator", "security", "designer", "scout", "debugger", "product", "architect"]) assert.ok(sizes.qa.w > sizes[role].w, `douli ${sizes.qa.w.toFixed(2)} vs ${role} ${sizes[role].w.toFixed(2)}`);
  for (const role of ROLES) if (role !== "orchestrator") assert.ok(sizes.orchestrator.h > sizes[role].h, `toque ${sizes.orchestrator.h.toFixed(2)} vs ${role} ${sizes[role].h.toFixed(2)}`);
});

// ---- wiring: the scene attaches by socket name from the specs (R3F cannot render under node --test) ----

test("Den attaches headgear and prop from the specs by socket name, with the shared scarf, and uses ROLE_PLACEMENT", () => {
  const den = read("./Den.jsx");
  assert.match(den, /from "\.\/headgear\.mjs"/);
  assert.match(den, /headgearSpec/);
  assert.match(den, /propSpec/);
  assert.match(den, /scarfSpec/);
  assert.match(den, /ROLE_PLACEMENT/);
  assert.match(den, /getObjectByName/);
});

test("the scene builds gear through the shared asset cache and tints from stationHue on the live theme", () => {
  const files = [read("./Den.jsx"), read("./headgear.mjs")].join("\n");
  assert.match(files, /createAssetCache/);
  const spec = read("./headgear.mjs");
  assert.match(spec, /stationHue/);
  assert.doesNotMatch(spec, /from "three"/, "the part descriptors stay pure (no three import)");
  assert.doesNotMatch(spec, /#(?:674698|2759a2|006e54|326a2d|00658b|c3a5f9|87b9ff|56d0af|8acb83|55c6f4)/i, "hues come from stationHue, not copied literals");
});

// ---- den-scene-v1/09 round 2 (designer review 030c706): fixes H1-H4, M1, M3, L1-L3 ----
// Worked literals are the designer's raycast measurements of panda.glb at sit_still, not recomputed from the module.

const part = (parts, name) => {
  const p = parts.find((q) => q.name === name);
  assert.ok(p, `no part ${name} in ${parts.map((q) => q.name)}`);
  return p;
};
const near = (a, b, eps = 0.011) => Math.abs(a - b) <= eps;

test("H1: every prop is held upright: ROLE_PLACEMENT turns its +y to world up and its face to the camera", () => {
  // Measured paw sockets at sit_still (both paws): socket x -> world -x, socket y -> world +z (at the camera), socket z -> world up.
  const socketToWorld = new THREE.Matrix4().makeBasis(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0));
  for (const role of ROLES) {
    const { rotation, position } = contract.ROLE_PLACEMENT[role].prop;
    assert.equal(rotation?.length, 3, `${role}: prop rotation`);
    assert.equal(position?.length, 3, `${role}: prop position`);
    const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...rotation)).premultiply(socketToWorld);
    const up = new THREE.Vector3(0, 1, 0).transformDirection(m);
    const face = new THREE.Vector3(0, 0, 1).transformDirection(m);
    assert.ok(up.distanceTo(new THREE.Vector3(0, 1, 0)) < 1e-6, `${role}: long axis ${up.toArray()}`);
    assert.ok(face.distanceTo(new THREE.Vector3(0, 0, 1)) < 1e-6, `${role}: face ${face.toArray()}`);
  }
});

test("H1: flat props are held 0.26 toward the camera and 0.22 up; the long props need no offset", () => {
  const FLAT = ["product", "architect", "developer", "security", "qa", "designer"];
  for (const role of ROLES) {
    const [x, y, z] = contract.ROLE_PLACEMENT[role].prop.position;
    if (FLAT.includes(role)) assert.ok(near(y, 0.26) && near(z, 0.22), `${role} offset ${[x, y, z]}`);
    else assert.deepEqual([x, y, z], [0, 0, 0], `${role} is held by the grip`);
  }
});

test("M1: the cream teacup and plate stand 0.18 outward of the belly (paw_R socket +x, paw_L socket -x), ink-rimmed", async () => {
  assert.ok(near(contract.ROLE_PLACEMENT.qa.prop.position[0], 0.18, 0.02), "qa teacup outward");
  assert.ok(near(contract.ROLE_PLACEMENT.designer.prop.position[0], -0.18, 0.02), "designer plate outward");
  const { prop: cup } = await gear("qa");
  const { prop: plate } = await gear("designer");
  assert.equal(part(cup, "teacup:rim").material, "ink");
  assert.equal(part(plate, "plate:rim").material, "ink");
  assert.ok(part(plate, "plate:rim").params.tube <= 0.03 / 2 + 1e-9, "the ink plate rim is 0.03 high");
  assert.equal(part(cup, "teacup:cup").material, "cream", "the cream stays cream");
  assert.equal(part(plate, "plate:dish").material, "cream", "the cream stays cream");
});

test("H4: spectacle rims sit on the face (z 0.27 at x 0.27, y -0.42) and yaw 0.5 rad outward with the surface", async () => {
  for (const role of ["product", "architect"]) {
    const { headgear } = await gear(role);
    const L = part(headgear, "spectacles:rim_L"), R = part(headgear, "spectacles:rim_R");
    assert.deepEqual([L.position[0], L.position[1]], [0.27, -0.42]);
    assert.deepEqual([R.position[0], R.position[1]], [-0.27, -0.42]);
    assert.ok(near(L.position[2], 0.27, 0.03) && near(R.position[2], 0.27, 0.03), `${role} rim z ${L.position[2]}`);
    assert.ok(near(L.rotation[1], 0.5, 0.05) && near(R.rotation[1], -0.5, 0.05), `${role} rim yaw ${L.rotation} ${R.rotation}`);
    assert.ok(near(part(headgear, "spectacles:bridge").position[2], 0.37, 0.03), "bridge z");
  }
});

test("H4: goggles, headlamp and cap touch the brow (designer's surface-z targets), not 0.4 off it", async () => {
  const goggles = (await gear("scout")).headgear;
  for (const side of ["L", "R"]) {
    assert.ok(near(part(goggles, `goggles:rim_${side}`).position[2], 0.21, 0.03), `rim_${side} z`);
    assert.ok(near(part(goggles, `goggles:lens_${side}`).position[2], 0.25, 0.03), `lens_${side} z`);
  }
  assert.ok(near(part(goggles, "goggles:rim_L").position[0], 0.24, 0.02), "rims at x +-0.24");
  assert.ok(part(goggles, "goggles:rim_L").rotation[2] < 0 && part(goggles, "goggles:rim_R").rotation[2] > 0, "lenses yawed to follow the brow");
  const lamp = (await gear("debugger")).headgear;
  assert.ok(near(part(lamp, "headlamp:lamp").position[2], 0.22, 0.03), "lamp z");
  assert.ok(near(part(lamp, "headlamp:lens").position[2], 0.33, 0.03), "lamp lens z");
  const cap = (await gear("security")).headgear;
  assert.ok(near(part(cap, "cap:brim").position[2], 0.38, 0.03), "brim centre z");
  assert.ok(near(part(cap, "cap:brim").rotation[0], 0.15, 0.03), "brim tilts down 0.15 rad");
  assert.ok(near(part(cap, "cap:dome").scale[2], 0.75, 0.03), "dome is shallow in z");
  // Nothing on the face stands further forward than the brim's front edge (0.58).
  for (const role of ["product", "architect", "scout", "debugger", "security"]) {
    const front = boxOf((await gear(role)).headgear).max.z;
    assert.ok(front <= 0.62, `${role} front z ${front}`);
  }
});

test("H4: goggle and headlamp straps are ellipses hugging the head (radius 0.64, z scale 0.62, centre z -0.15)", async () => {
  for (const [role, name] of [["scout", "goggles:strap"], ["debugger", "headlamp:strap"]]) {
    const strap = part((await gear(role)).headgear, name);
    assert.ok(near(strap.params.radiusTop, 0.64, 0.02), `${name} radius`);
    assert.ok(near(strap.scale[2], 0.62, 0.02) && strap.scale[0] === 1, `${name} scale`);
    assert.ok(near(strap.position[2], -0.15, 0.02), `${name} centre z`);
  }
});

test("H4: the toque, douli, beret and headphones sit over the head (centre z -0.15), not over the nose", async () => {
  for (const role of ["orchestrator", "qa", "designer", "developer"]) {
    const box = boxOf((await gear(role)).headgear);
    assert.ok(near((box.max.z + box.min.z) / 2, -0.15, 0.04), `${role} centre z ${((box.max.z + box.min.z) / 2).toFixed(2)}`);
  }
});

test("H2: the architect wears a big pencil behind the left ear; the product does not, so the pair differs at Level 1", async () => {
  const arch = (await gear("architect")).headgear, prod = (await gear("product")).headgear;
  assert.ok(!prod.some((p) => p.name.startsWith("pencil:")), "product has no pencil");
  const parts = arch.filter((p) => p.name.startsWith("pencil:"));
  const body = part(arch, "pencil:body");
  assert.ok(body.params.radiusTop >= 0.09 - 1e-9, `pencil radius ${body.params.radiusTop}`);
  assert.ok(parts.reduce((len, p) => len + p.params.height, 0) >= 0.7 - 1e-9, "pencil is at least 0.7 long");
  assert.ok(near(body.position[0], -0.55, 0.12) && near(body.position[2], -0.42, 0.05), `pencil behind the ear (the ear disc spans z -0.15 to -0.35 on panda.glb; the designer's -0.2 runs through it) ${body.position}`);
  assert.ok(near(body.rotation[2], (25 * Math.PI) / 180, 0.08), `tilted ~25 deg off vertical: ${body.rotation}`);
  assert.equal(body.material, "wood");
  assert.equal(part(arch, "pencil:tip").material, "ink");
  assert.equal(part(arch, "pencil:ferrule").material, "cream");
  const a = boxOf(arch), p = boxOf(prod);
  assert.ok(a.min.x < p.min.x - 0.1, "the pencil widens the silhouette on the ear side");
  assert.ok(a.max.y > p.max.y + 0.2, "the pencil rises above the ear line");
});

test("M3: the headphone band is raised off the black ears", async () => {
  const { headgear } = await gear("developer");
  assert.ok(part(headgear, "headphones:band").position[1] >= -0.42 + 0.05 - 1e-9, "band is 0.05 above the cup centres");
});

test("L1: the developer's tablet reports a red failed line and a green passed line, in semantic colours", async () => {
  const { prop } = await gear("developer");
  const red = lc(part(prop, "tablet:line_1").color), green = lc(part(prop, "tablet:line_2").color);
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [r1, g1, b1] = rgb(red), [r2, g2, b2] = rgb(green);
  assert.ok(r1 > 150 && r1 > g1 * 2 && r1 > b1 * 2, `line_1 ${red} is red`);
  assert.ok(g2 > 120 && g2 > r2 * 1.4 && g2 > b2 * 1.4, `line_2 ${green} is green`);
  for (const c of [red, green]) assert.ok(!ALL_HUES.includes(c), "a result colour is never a station hue");
});

test("L2: the scarf tail sits forward of the belly (z >= 0.56)", async () => {
  assert.ok(part((await gear("qa")).scarf, "scarf:tail").position[2] >= 0.56 - 1e-9);
});

test("L3: the headlamp has no long antenna box over the crown", async () => {
  const { headgear } = await gear("debugger");
  assert.ok(!headgear.some((p) => p.name === "headlamp:over"));
  for (const p of headgear) {
    const b = boxOf([p]);
    assert.ok(b.max.y - b.min.y <= 0.4, `${p.name} stands ${(b.max.y - b.min.y).toFixed(2)} tall`);
  }
});

test("H3: the Den's front-row noren hangs clear of the qa douli and security cap tips (bottom >= 1.55)", async () => {
  const { kiosks } = await import("./kiosk.mjs");
  const { counterTop, stallRoof } = await import("./banquet-layout.mjs");
  const PLUSH = 0.3, FOOT_LIFT = 0.3, HAT_SOCKET_Y = 0.97; // panda-contract measurements, plush scale 0.3 in the Den
  for (const [role, station] of [["qa", "tea"], ["security", "pantry"]]) {
    const tipY = counterTop(station) + FOOT_LIFT + PLUSH * (HAT_SOCKET_Y + boxOf((await gear(role)).headgear).max.y);
    const k = kiosks({ cells: [], counts: {}, theme: "light" }).find((x) => x.station === station);
    assert.ok(stallRoof(station).eave >= 1.77 - 1e-9, `${station} eave ${stallRoof(station).eave}`);
    const bottoms = k.noren.panels.map((p) => p.top - p.drop);
    for (const b of bottoms) assert.ok(b >= 1.55 - 1e-9, `${station} noren bottom ${b} against hat tip ${tipY.toFixed(2)}`);
    assert.ok(Math.min(...bottoms) >= tipY + 0.1, `${station}: the ${role} hat tip ${tipY.toFixed(2)} shows under the noren`);
  }
});

test("Den applies each role's placement rotation and position to its prop, by socket name", () => {
  const den = read("./Den.jsx");
  assert.match(den, /rotation\.set\(\.\.\.rotation\)/);
  assert.match(den, /position\.set\(\.\.\.position\)/);
});
