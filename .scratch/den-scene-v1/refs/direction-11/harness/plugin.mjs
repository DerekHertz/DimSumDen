import { readFileSync } from "node:fs";

const hook = readFileSync(new URL("./hook.js", import.meta.url), "utf8");

const swap = (code, from, to) => {
  if (!code.includes(from)) throw new Error("plugin: pattern not found: " + from.slice(0, 60));
  return code.replace(from, to);
};

export function designerDirection() {
  return {
    name: "designer-direction",
    enforce: "pre",
    transform(code, id) {
      const file = id.split("?")[0];
      if (file.endsWith("/scene/Den.jsx")) {
        code = swap(code, "mixer.update(dt);", "mixer.update(dt); globalThis.__figPost?.(id, object);");
        code = swap(code, "const i = atlas.frames[cmd.face] ?? atlas.frames[atlas.defaultFrame];", "const i = id === \"bao\" && globalThis.__OPT?.faceFrame ? atlas.frames[globalThis.__OPT.faceFrame] : (atlas.frames[cmd.face] ?? atlas.frames[atlas.defaultFrame]);");
        return code + "\n" + hook;
      }
      if (file.endsWith("/scene/banquet-layout.mjs")) {
        code = swap(code, "export const BAO = { position: [0, 1.4, -2.4], scale: 1.4 };",
          "const __O = globalThis.__OPT ?? {};\nexport const BAO = __O.bao ? { position: [0, __O.bao.s, __O.bao.z], scale: __O.bao.s } : { position: [0, 1.4, -2.4], scale: 1.4 };");
        code = swap(code, "export const RAIL = { x: 0, y: 2.66, z: BAO.position[2], width: 1.3, height: 0.05 };",
          "export const RAIL = __O.rail ? { x: 0, y: __O.rail.y, z: __O.rail.z, width: __O.rail.width, height: 0.05 } : { x: 0, y: 2.66, z: BAO.position[2], width: 1.3, height: 0.05 };");
        code = swap(code, "export const BELL = { x: 0.5, y: RAIL.y + RAIL.height / 2, z: BAO.position[2] };",
          "export const BELL = { x: __O.rail ? __O.rail.bellX : 0.5, y: RAIL.y + RAIL.height / 2, z: RAIL.z };");
        code = swap(code, "  const pass = PASS[cellType];\n  if (pass) {",
          "  const pass = PASS[cellType];\n  if (pass && __O.seats?.[cellType]) { const [sx, sy, sz] = __O.seats[cellType]; return { x: BAO.position[0] + BAO.scale * sx + pass.step * PASS_STEP * slot, y: BAO.position[1] + BAO.scale * sy, z: BAO.position[2] + BAO.scale * sz }; }\n  if (pass) {");
        code = swap(code, "steamers: { x: -3.0, z: -1.4,", "steamers: { x: -3.0 - (__O.kdx ?? 0), z: -1.4,");
        code = swap(code, '"front-of-house": { x: 3.0, z: -1.4,', '"front-of-house": { x: 3.0 + (__O.kdx ?? 0), z: -1.4,');
        return code;
      }
      return null;
    },
  };
}
