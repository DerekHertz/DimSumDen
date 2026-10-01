// den-scene-v1/03: the pagoda kiosk model. Pure; one build serves all four stations, only hue, sign text
// and lantern state change. Coordinates are in the kiosk group frame above the platform (front = +z).
import { STALL_CENTERS, stallCenterX, stallRoof, stallWidth, stallYaw } from "./banquet-layout.mjs";
import { lanternState } from "./handoffs.mjs";
import { EAVE_Y, POST_SIZE, UPTURN } from "./stall-roof.mjs";
import { stationHue } from "./station-hues.mjs";
import { NAME } from "./station-labels.mjs";

const DEPTH = 1;
const PANDA_INK = "#1b1d20";
const WOOD = "#b98a55";
const LANTERN_FILL = "#f8bd40";
const SURFACE_200 = { light: "#fffdf7", dark: "#1f252b" };
const NOREN_GAP = 0.02;
const NOREN_TARGET_WIDTH = 0.45;
const LANTERN = { radius: 0.09, height: 0.16, sides: 8, below: 0.12 };

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function norenPanels(station, width) {
  const front = !!stallRoof(station);
  const n = clamp(Math.round(width / NOREN_TARGET_WIDTH), 3, 5);
  const span = width - 2 * POST_SIZE;
  const w = (span - NOREN_GAP * (n - 1)) / n;
  const top = stallRoof(station)?.eave ?? EAVE_Y;
  return Array.from({ length: n }, (_, i) => ({
    x: -span / 2 + w / 2 + i * (w + NOREN_GAP),
    z: DEPTH / 2 + 0.02,
    width: w,
    top,
    drop: front ? 0.22 : 0.28,
  }));
}

// Which front corner is nearer the table, once the kiosk's yaw is applied (the table is at the origin).
function tableSide(station, width) {
  const yaw = stallYaw(station), cx = stallCenterX(station), cz = STALL_CENTERS[station].z;
  const dist = (lx) => Math.hypot(
    cx + lx * Math.cos(yaw) + (DEPTH / 2) * Math.sin(yaw),
    cz - lx * Math.sin(yaw) + (DEPTH / 2) * Math.cos(yaw),
  );
  const x = width / 2 - POST_SIZE / 2;
  return dist(x) < dist(-x) ? 1 : -1;
}

export function kioskModel(station, { width, theme, lit }) {
  const hue = stationHue(station, theme);
  const eave = stallRoof(station)?.eave ?? EAVE_Y;
  const text = SURFACE_200[theme];
  return {
    station,
    width,
    colors: { roof: PANDA_INK, trim: hue, posts: hue, counterBand: hue, counterBody: WOOD },
    noren: { text: NAME[station], cloth: hue, textColor: text, panels: norenPanels(station, width) },
    lantern: {
      name: `lantern:${station}`,
      x: tableSide(station, width) * (width / 2 - POST_SIZE / 2),
      y: eave + UPTURN - LANTERN.below,
      z: DEPTH / 2,
      ...LANTERN,
      lit,
      bodyColor: lit ? LANTERN_FILL : text,
      emissive: lit ? LANTERN_FILL : null,
      capColor: hue,
    },
  };
}

/** @param {{cells: {cellType: string, pose: string}[], counts: Record<string, number>, theme: "light"|"dark"}} args */
export function kiosks({ cells, counts, theme }) {
  const { stalls } = lanternState(cells);
  return Object.keys(STALL_CENTERS).map((station) =>
    kioskModel(station, { width: stallWidth(counts[station] ?? 0), theme, lit: stalls.has(station) }));
}
