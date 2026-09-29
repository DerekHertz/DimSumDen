// Camera pan (x only) and zoom (dolly along z) for the banquet market. Pure math; the R3F rig in
// CameraRig.jsx applies it. Zoom is a factor on the base camera distance: smaller is closer.
export const PAN_LIMIT = 5;
export const ZOOM_MIN = 0.55;
export const ZOOM_MAX = 1.2;
export const BASE_Y = 4.2;
export const BASE_Z = 11.5;
const KEY_PAN_STEP = 0.5;
const KEY_ZOOM_STEP = 0.1;
const WHEEL_ZOOM_PER_DELTA = 0.001;
/** World units across the view at zoom 1, for converting a drag in pixels to a pan. */
const VIEW_WIDTH_AT_REST = 12;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export const clampPan = (x) => clamp(x, -PAN_LIMIT, PAN_LIMIT);
export const clampZoom = (z) => clamp(z, ZOOM_MIN, ZOOM_MAX);

export function keyPan(x, key) {
  if (key === "ArrowRight") return clampPan(x + KEY_PAN_STEP);
  if (key === "ArrowLeft") return clampPan(x - KEY_PAN_STEP);
  return x;
}

export function keyZoom(zoom, key) {
  if (key === "+" || key === "=") return clampZoom(zoom - KEY_ZOOM_STEP);
  if (key === "-" || key === "_") return clampZoom(zoom + KEY_ZOOM_STEP);
  return zoom;
}

export const wheelZoom = (zoom, deltaY) => clampZoom(zoom + deltaY * WHEEL_ZOOM_PER_DELTA);

/** Dragging right drags the scene right, so the camera moves left. */
export const dragPan = (x, dxPixels, widthPixels, zoom) =>
  clampPan(x - (dxPixels / widthPixels) * VIEW_WIDTH_AT_REST * zoom);

export const cameraPosition = (pan, zoom) => [pan, BASE_Y, BASE_Z * zoom];
