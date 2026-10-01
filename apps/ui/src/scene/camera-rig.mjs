// Camera input math for the orthographic den: zoom (a dolly factor) and pan (the look-at target on the
// ground). Pure; the R3F rig in CameraRig.jsx applies it, and iso-projection.mjs owns the projection.
// view = { width, height, zoom }, target = [x, y, z].
import { WIDEST_STALL_EDGE } from "./banquet-layout.mjs";
import { PITCH, ZOOM_MAX, ZOOM_MIN, TARGET, clampZoom, panLimits, pixelsPerUnit } from "./iso-projection.mjs";

export { ZOOM_MIN, ZOOM_MAX, clampZoom, WIDEST_STALL_EDGE };

const KEY_PAN_STEP = 0.5;
const KEY_ZOOM_STEP = 0.1;
const WHEEL_ZOOM_PER_DELTA = 0.001;
const SIN_PITCH = Math.sin(PITCH);

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Pull a target back inside the pan limits at this view's zoom and size. */
export function clampTarget([x, y, z], view) {
  const lim = panLimits(view);
  return [clamp(x, -lim.x, lim.x), y, clamp(z, TARGET[2] - lim.z, TARGET[2] + lim.z)];
}

export function keyPan(target, key, view) {
  if (key === "ArrowRight") return clampTarget([target[0] + KEY_PAN_STEP, target[1], target[2]], view);
  if (key === "ArrowLeft") return clampTarget([target[0] - KEY_PAN_STEP, target[1], target[2]], view);
  return target;
}

export function keyZoom(zoom, key) {
  if (key === "+" || key === "=") return clampZoom(zoom - KEY_ZOOM_STEP);
  if (key === "-" || key === "_") return clampZoom(zoom + KEY_ZOOM_STEP);
  return zoom;
}

export const wheelZoom = (zoom, deltaY) => clampZoom(zoom + deltaY * WHEEL_ZOOM_PER_DELTA);

/** Pinch: the fingers moving apart (dist grows) dolly in, so the factor scales by startDist / dist from where the gesture began. */
export function pinchZoom(startZoom, startDist, dist) {
  if (!(startDist > 0) || !(dist > 0)) return clampZoom(startZoom);
  return clampZoom((startZoom * startDist) / dist);
}

/** Dragging drags the ground with the pointer, so the target moves the other way. */
export function dragPan(target, { dx, dy }, view) {
  const k = pixelsPerUnit(view);
  return clampTarget([target[0] - dx / k, target[1], target[2] - dy / (k * SIN_PITCH)], view);
}
