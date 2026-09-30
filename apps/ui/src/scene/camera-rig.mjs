// Camera pan (x only) and zoom (dolly along z) for the banquet market. Pure math; the R3F rig in
// CameraRig.jsx applies it. Zoom is a factor on the base camera distance: smaller is closer.
import { WIDEST_STALL_EDGE } from "./banquet-layout.mjs";
import { BASE_Y, BASE_Z, FOV_DEG } from "./camera-default.mjs";
export { BASE_Y, BASE_Z, FOV_DEG } from "./camera-default.mjs";

/** Fallback limit when the viewport is unknown; the rig uses panLimit(aspect, zoom). */
export const PAN_LIMIT = 9;
/** z of the back stalls' row, the depth the pan limit is measured at. */
const STALL_ROW_Z = -1.6;
export const ZOOM_MIN = 0.55;
export const ZOOM_MAX = 1.2;
const KEY_PAN_STEP = 0.5;
const KEY_ZOOM_STEP = 0.1;
const WHEEL_ZOOM_PER_DELTA = 0.001;
/** World units across the view at zoom 1, for converting a drag in pixels to a pan. */
const VIEW_WIDTH_AT_REST = 12;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export const clampPan = (x, limit = PAN_LIMIT) => clamp(x, -limit, limit);

/** World units from the view's centre to its side edge at the stall row (approximate: ignores the slight pitch). */
export const visibleHalfWidth = (aspect, zoom) =>
  (BASE_Z * zoom - STALL_ROW_Z) * Math.tan((FOV_DEG / 2) * (Math.PI / 180)) * aspect;

/** How far the camera may pan: just far enough that the widest stall's outer edge is in view. A wide window needs none. */
export const panLimit = (aspect, zoom) => Math.max(0, WIDEST_STALL_EDGE - visibleHalfWidth(aspect, zoom));
export { WIDEST_STALL_EDGE };
export const clampZoom = (z) => clamp(z, ZOOM_MIN, ZOOM_MAX);

export function keyPan(x, key, limit = PAN_LIMIT) {
  if (key === "ArrowRight") return clampPan(x + KEY_PAN_STEP, limit);
  if (key === "ArrowLeft") return clampPan(x - KEY_PAN_STEP, limit);
  return x;
}

export function keyZoom(zoom, key) {
  if (key === "+" || key === "=") return clampZoom(zoom - KEY_ZOOM_STEP);
  if (key === "-" || key === "_") return clampZoom(zoom + KEY_ZOOM_STEP);
  return zoom;
}

export const wheelZoom = (zoom, deltaY) => clampZoom(zoom + deltaY * WHEEL_ZOOM_PER_DELTA);

/** Dragging right drags the scene right, so the camera moves left. */
export const dragPan = (x, dxPixels, widthPixels, zoom, limit = PAN_LIMIT) =>
  clampPan(x - (dxPixels / widthPixels) * VIEW_WIDTH_AT_REST * zoom, limit);

export const cameraPosition = (pan, zoom) => [pan, BASE_Y, BASE_Z * zoom];
