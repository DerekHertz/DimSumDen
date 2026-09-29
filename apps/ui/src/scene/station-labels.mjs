// showcase-v1/05: where the station labels float. Pure. One label per stall, above its roof apex,
// following the stall as it widens. ChipLayer projects the anchors and draws each on a rice-paper pill.
import { STALL_CENTERS, stallCenterX, stallPlatform, stallRoof } from "./banquet-layout.mjs";
import { EAVE_Y, RISE } from "./stall-roof.mjs";

const NAME = { steamers: "Steamers", "front-of-house": "Front of House", tea: "Tea", pantry: "Pantry" };
const ABOVE_APEX = 0.2;

/** @param {Record<string, number>} counts cells per station */
export function stationLabels(counts) {
  return Object.keys(STALL_CENTERS).map((station) => {
    const roof = stallRoof(station) ?? { eave: EAVE_Y, rise: RISE };
    return {
      id: `station:${station}`,
      station,
      text: NAME[station],
      x: stallCenterX(station, counts[station] ?? 0),
      y: stallPlatform(station) + roof.eave + roof.rise + ABOVE_APEX,
      z: STALL_CENTERS[station].z,
    };
  });
}
