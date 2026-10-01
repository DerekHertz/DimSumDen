// den-scene-v1/09: buildGear turns spec parts into one named, tinted, soft-matte mesh per part.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ROLES, headgearSpec, propSpec, scarfSpec } from "./headgear.mjs";
import { buildGear } from "./gear-object.mjs";

test("every role builds a mesh per part, named by the part, tinted by the part colour", () => {
  for (const role of ROLES) for (const theme of ["light", "dark"]) {
    const parts = [...headgearSpec(role, { theme }), ...propSpec(role, { theme }), ...scarfSpec(role, { theme })];
    const group = buildGear(parts);
    assert.equal(group.children.length, parts.length, role);
    parts.forEach((p, i) => {
      const mesh = group.children[i];
      assert.equal(mesh.name, p.name);
      assert.equal("#" + mesh.material.color.getHexString(), p.color.toLowerCase(), p.name);
      assert.equal(mesh.material.metalness, 0);
      assert.ok(mesh.material.roughness >= 0.8);
    });
  }
});

test("glass parts are translucent, opaque parts are not", () => {
  const goggles = buildGear(headgearSpec("scout"));
  assert.equal(goggles.getObjectByName("goggles:lens_L").material.transparent, true);
  assert.equal(goggles.getObjectByName("goggles:strap").material.transparent, false);
});
