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
      assert.ok(["station", ...NEUTRAL_TOKENS].includes(part.material), `${role} ${part.name}: material ${part.material}`);
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
