// Approved station-* aliases from docs/design/tokens.json; front-of-house uses station-front.
// Keep this palette shared by station-coloured scene surfaces.
const STATION_HUES = {
  light: { pass: "#674698", steamers: "#2759A2", tea: "#006E54", pantry: "#326A2D", "front-of-house": "#00658B" },
  dark: { pass: "#C3A5F9", steamers: "#87B9FF", tea: "#56D0AF", pantry: "#8ACB83", "front-of-house": "#55C6F4" },
};

export function stationHue(station, theme) {
  return STATION_HUES[theme]?.[station];
}
