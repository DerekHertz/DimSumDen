// den-scene-v1/03: the pagoda kiosk model (new pure module kiosk.mjs). One build serves all four stations;
// only hue, sign text and lantern state change. Expected values are worked literals from the designer spec
// (ticket comment) and docs/design/tokens.json, never recomputed from the module.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PerspectiveCamera, Vector3 } from "three";
import { cameraPosition, FOV_DEG } from "./camera-rig.mjs";
import { STALL_CENTERS, TABLE, stallCenterX, stallPlatform, stallRoof, stallWidth, stallYaw } from "./banquet-layout.mjs";
import { stationLabels } from "./station-labels.mjs";

const STATIONS = ["steamers", "front-of-house", "tea", "pantry"];
const HUES = {
  light: { steamers: "#2759A2", tea: "#006E54", pantry: "#326A2D", "front-of-house": "#00658B" },
  dark: { steamers: "#87B9FF", tea: "#56D0AF", pantry: "#8ACB83", "front-of-house": "#55C6F4" },
};
const SURFACE_200 = { light: "#fffdf7", dark: "#1f252b" };
const PANDA_INK = "#1b1d20", LANTERN_FILL = "#f8bd40", WOOD = "#b98a55";
const lc = (s) => String(s).toLowerCase();
const near = (a, b) => Math.abs(a - b) < 1e-9;
const mod = () => import("./kiosk.mjs");
const waiting = (cellType) => ({ cellType, pose: "waiting_on_user" });

test("kiosks() yields exactly one kiosk per stall, each with exactly one lantern named lantern:<station>", async () => {
  const { kiosks } = await mod();
  const list = kiosks({ cells: [], counts: {}, theme: "light" });
  assert.deepEqual(list.map((k) => k.station), STATIONS);
  for (const k of list) {
    assert.equal(k.lantern.name, `lantern:${k.station}`);
    assert.ok(k.lantern && !Array.isArray(k.lantern), "one lantern, not a list");
  }
});

test("kiosk width follows the stall count", async () => {
  const { kiosks } = await mod();
  const list = kiosks({ cells: [], counts: { steamers: 7 }, theme: "light" });
  assert.ok(near(list.find((k) => k.station === "steamers").width, stallWidth(7)));
  assert.ok(near(list.find((k) => k.station === "tea").width, stallWidth(0)));
});

test("lantern body is 8-sided paper, radius 0.09, height 0.16", async () => {
  const { kiosks } = await mod();
  for (const k of kiosks({ cells: [], counts: {}, theme: "light" })) {
    assert.equal(k.lantern.sides, 8);
    assert.equal(k.lantern.radius, 0.09);
    assert.equal(k.lantern.height, 0.16);
  }
});

for (const theme of ["light", "dark"]) {
  test(`${theme}: with no waiting panda no lantern uses lantern-fill or emissive`, async () => {
    const { kiosks } = await mod();
    for (const cells of [[], [{ cellType: "qa", pose: "working" }], [{ cellType: "developer", pose: "idle" }]]) {
      for (const k of kiosks({ cells, counts: {}, theme })) {
        assert.equal(k.lantern.lit, false, k.station);
        assert.notEqual(lc(k.lantern.bodyColor), LANTERN_FILL);
        assert.equal(lc(k.lantern.bodyColor), SURFACE_200[theme], "unlit lantern is surface-200");
        assert.ok(!k.lantern.emissive, "unlit lantern has no emissive");
      }
    }
  });

  test(`${theme}: one waiting panda at Tea lights exactly Tea's lantern, in lantern-fill with emissive`, async () => {
    const { kiosks } = await mod();
    const list = kiosks({ cells: [waiting("qa")], counts: {}, theme });
    assert.deepEqual(list.filter((k) => k.lantern.lit).map((k) => k.station), ["tea"]);
    const tea = list.find((k) => k.station === "tea");
    assert.equal(lc(tea.lantern.bodyColor), LANTERN_FILL);
    assert.equal(lc(tea.lantern.emissive), LANTERN_FILL);
    for (const k of list.filter((x) => x.station !== "tea")) assert.notEqual(lc(k.lantern.bodyColor), LANTERN_FILL);
  });

  test(`${theme}: hues, noren cloth, noren text and counter colours follow the tokens`, async () => {
    const { kiosks } = await mod();
    for (const k of kiosks({ cells: [], counts: {}, theme })) {
      const hue = HUES[theme][k.station];
      assert.equal(lc(k.colors.roof), PANDA_INK, "roof is panda-ink in both themes");
      for (const part of ["trim", "posts", "counterBand"]) assert.equal(lc(k.colors[part]), lc(hue), `${k.station} ${part}`);
      assert.equal(lc(k.colors.counterBody), WOOD);
      assert.equal(lc(k.noren.cloth), lc(hue));
      assert.equal(lc(k.noren.textColor), SURFACE_200[theme]);
      assert.equal(lc(k.lantern.capColor), lc(hue), "lantern caps carry the station hue (user-approved)");
    }
  });
}

test("a theme change recolours the same kiosks live (hue, text and unlit lantern all differ)", async () => {
  const { kiosks } = await mod();
  const a = kiosks({ cells: [], counts: {}, theme: "light" })[0];
  const b = kiosks({ cells: [], counts: {}, theme: "dark" })[0];
  assert.notEqual(lc(a.colors.trim), lc(b.colors.trim));
  assert.notEqual(lc(a.noren.textColor), lc(b.noren.textColor));
  assert.notEqual(lc(a.lantern.bodyColor), lc(b.lantern.bodyColor));
});

test("lantern state: each waiting panda lights only its own station; Pass and Cubs light no kiosk lantern", async () => {
  const { kiosks } = await mod();
  const lit = (cells) => kiosks({ cells, counts: {}, theme: "light" }).filter((k) => k.lantern.lit).map((k) => k.station).sort();
  assert.deepEqual(lit([waiting("security")]), ["pantry"]);
  assert.deepEqual(lit([waiting("developer"), waiting("designer")]), ["front-of-house", "steamers"]);
  assert.deepEqual(lit([waiting("orchestrator"), waiting("product")]), []);
});

test("no lantern yellow or alarm red on a kiosk except the lit lantern (values read from tokens.json)", async () => {
  const { kiosks } = await mod();
  const tokens = JSON.parse(readFileSync(new URL("../../../../docs/design/tokens.json", import.meta.url), "utf8")).color.tokens;
  const banned = tokens.filter((t) => ["lantern", "lantern-fill", "alarm", "alarm-fill", "alarm-zone"].includes(t.name))
    .flatMap((t) => Object.values(t.value)).map(lc);
  assert.ok(banned.includes(LANTERN_FILL));
  const flat = (o) => Object.values(o).flatMap((v) => (v && typeof v === "object" && !Array.isArray(v) ? flat(v) : [v]));
  for (const theme of ["light", "dark"]) {
    for (const k of kiosks({ cells: [], counts: {}, theme })) {
      const colours = [...flat(k.colors), k.noren.cloth, k.noren.textColor, k.lantern.bodyColor, k.lantern.capColor]
        .filter((c) => typeof c === "string").map(lc);
      for (const c of colours) assert.ok(!banned.includes(c), `${k.station}/${theme} uses reserved ${c}`);
    }
    // lit: only the lantern body (and its emissive) may use lantern-fill; the caps stay station hue.
    const tea = kiosks({ cells: [waiting("qa")], counts: {}, theme }).find((k) => k.station === "tea");
    const others = [...flat(tea.colors), tea.noren.cloth, tea.noren.textColor, tea.lantern.capColor].map(lc);
    for (const c of others) assert.ok(!banned.includes(c), `lit tea/${theme} leaks ${c}`);
  }
});

test("noren text equals the station name for each kiosk", async () => {
  const { kiosks } = await mod();
  const names = { steamers: "Steamers", "front-of-house": "Front of House", tea: "Tea", pantry: "Pantry" };
  const labels = Object.fromEntries(stationLabels({}).map((l) => [l.station, l.text]));
  for (const k of kiosks({ cells: [], counts: {}, theme: "light" })) {
    assert.equal(k.noren.text, names[k.station]);
    assert.equal(k.noren.text, labels[k.station], "sign and ChipLayer anchor read the same name");
  }
});

test("noren panel count is clamp(round(width/0.45), 3, 5)", async () => {
  const { kioskModel } = await mod();
  const n = (width) => kioskModel("steamers", { width, theme: "light", lit: false }).noren.panels.length;
  assert.equal(n(0.5), 3);
  assert.equal(n(1.35), 3);
  assert.equal(n(1.8), 4);
  assert.equal(n(2.25), 5);
  assert.equal(n(9), 5);
});

test("noren panels hang at the front eave line: z depth/2+0.02, gap 0.02, drop 0.28 back row and 0.22 front row", async () => {
  const { kiosks } = await mod();
  for (const k of kiosks({ cells: [], counts: {}, theme: "light" })) {
    const front = !!stallRoof(k.station);
    const eave = front ? 1.4 : 1.7;
    const ps = k.noren.panels;
    assert.ok(ps.length >= 3 && ps.length <= 5);
    for (const p of ps) {
      assert.ok(near(p.z, 0.52), `${k.station} z ${p.z}`);
      assert.ok(near(p.drop, front ? 0.22 : 0.28), `${k.station} drop ${p.drop}`);
      assert.ok(near(p.top, eave), `${k.station} top ${p.top}`);
      assert.ok(p.width > 0);
    }
    for (let i = 1; i < ps.length; i++) assert.ok(near(ps[i].x - ps[i].width / 2 - (ps[i - 1].x + ps[i - 1].width / 2), 0.02), "0.02 gap");
    const left = ps[0].x - ps[0].width / 2, right = ps.at(-1).x + ps.at(-1).width / 2;
    assert.ok(near(left, -right), "curtain is centred");
    assert.ok(right - left <= k.width + 1e-9 && right - left >= k.width / 2, "curtain spans the front, inside the stall");
  }
});

test("noren bottom and lantern stay inside the roof height budget (under the upturned eave, clear of the counter)", async () => {
  const { kiosks } = await mod();
  for (const k of kiosks({ cells: [], counts: {}, theme: "light" })) {
    const eave = stallRoof(k.station)?.eave ?? 1.7;
    for (const p of k.noren.panels) {
      assert.ok(p.top - p.drop >= eave - 0.3, "noren drops no more than 0.3");
      assert.ok(p.top - p.drop > 1.1, "pandas keep headroom above the counter top");
    }
    const { y, height } = k.lantern;
    assert.ok(y + height / 2 <= eave + 0.1 + 1e-9, "lantern top is at or under the upturned corner");
    assert.ok(y - height / 2 >= eave - 0.4, "lantern hangs no more than 0.4 under the eave");
  }
});

test("lantern hangs 0.12 below the front eave corner nearest the table", async () => {
  const { kiosks } = await mod();
  for (const k of kiosks({ cells: [], counts: {}, theme: "light" })) {
    const eave = stallRoof(k.station)?.eave ?? 1.7;
    const { x, y, z } = k.lantern;
    assert.ok(near(z, 0.5), `${k.station} z`);
    assert.ok(near(Math.abs(x), k.width / 2 - 0.04), `${k.station} |x| ${x}`);
    assert.ok(near(y, eave + 0.1 - 0.12), `${k.station} y ${y}`);
    // World check: of the two front corners, the lantern is the one nearer the table (yaw included).
    const yaw = stallYaw(k.station), cx = stallCenterX(k.station, 3), cz = STALL_CENTERS[k.station].z;
    const world = (lx) => [cx + lx * Math.cos(yaw) + 0.5 * Math.sin(yaw), cz - lx * Math.sin(yaw) + 0.5 * Math.cos(yaw)];
    const d = (lx) => Math.hypot(world(lx)[0] - TABLE.x, world(lx)[1] - TABLE.z);
    assert.ok(d(x) < d(-x), `${k.station}: lantern not on the table side`);
  }
});

test("noren and lantern fit the default camera frame, default and widened Steamers", async () => {
  const { kiosks } = await mod();
  const cam = new PerspectiveCamera(FOV_DEG, 1160 / 900, 0.1, 100);
  cam.position.set(...cameraPosition(0, 1));
  cam.rotation.set(-0.2, 0, 0);
  cam.updateMatrixWorld();
  for (const counts of [{}, { steamers: 7 }]) {
    for (const k of kiosks({ cells: [], counts, theme: "light" })) {
      const yaw = stallYaw(k.station), cx = stallCenterX(k.station, counts[k.station] ?? 3);
      const cz = STALL_CENTERS[k.station].z, plat = stallPlatform(k.station);
      const pts = k.noren.panels.flatMap((p) => [-1, 1].flatMap((sx) => [p.top, p.top - p.drop].map((y) => [p.x + sx * p.width / 2, y, p.z])));
      pts.push([k.lantern.x, k.lantern.y - k.lantern.height / 2, k.lantern.z], [k.lantern.x, k.lantern.y + k.lantern.height / 2, k.lantern.z]);
      for (const [x, y, z] of pts) {
        const v = new Vector3(cx + x * Math.cos(yaw) + z * Math.sin(yaw), y + plat, cz - x * Math.sin(yaw) + z * Math.cos(yaw)).project(cam);
        assert.ok(Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1, `${k.station} ${JSON.stringify(counts)} off-frame at ${v.x.toFixed(2)},${v.y.toFixed(2)}`);
      }
    }
  }
});
