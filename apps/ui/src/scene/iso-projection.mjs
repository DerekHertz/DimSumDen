// The den's isometric projection (den-iso-v1/02). Pure math, no three.js: world to screen and back, the zoom
// range, the pan limits and the default frame. CameraRig.jsx builds the orthographic camera from cameraConfig;
// the numbers are those of docs/design/2026-10-01-iso-den.md section 1.
//
// A view is { width, height, zoom = 1, target = TARGET }: the viewport in px, the dolly factor (smaller is
// closer) and the world point the camera looks at. The target lands at (W / 2, 0.52 H) on screen.
import { WIDEST_STALL_EDGE } from "./banquet-layout.mjs";

/** Heading: the camera looks along -z, as the perspective camera did. */
export const YAW = 0;
/** True isometric pitch, atan(1 / sqrt 2). */
export const PITCH = Math.atan(1 / Math.SQRT2);
const SIN_P = Math.sin(PITCH);
const COS_P = Math.cos(PITCH);
/** Bao's feet. */
export const TARGET = [0, 0, -2.4];
export const ZOOM_MIN = 0.55;
export const ZOOM_MAX = 1.2;
const ANCHOR_Y = 0.52;
const CAMERA_DISTANCE = 40;
const NEAR = 0.1;
const FAR = 120;
/** Half the visible height, in world units, the vertical pan keeps on the den (digest: 3.9). */
const DEN_HALF_HEIGHT = 3.9;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export const clampZoom = (z) => clamp(z, ZOOM_MIN, ZOOM_MAX);

/** Pixels per world unit at the default zoom: fits the kiosk row across (wider on a desktop), or the height. */
const baseScale = ({ width, height }) => Math.min(width / (width < 600 ? 13.0 : 16.4), height / 10.2);

/** Pixels per world unit. Zoom is a dolly factor, so a smaller zoom means more pixels per unit. */
export const pixelsPerUnit = ({ width, height, zoom = 1 }) => baseScale({ width, height }) / zoom;

const targetOf = (view) => view.target ?? TARGET;

/** World [x, y, z] to px from the viewport's top-left. */
export function worldToScreen([x, y, z], view) {
  const k = pixelsPerUnit(view);
  const [tx, ty, tz] = targetOf(view);
  return {
    x: view.width / 2 + k * (x - tx),
    y: view.height * ANCHOR_Y + k * ((z - tz) * SIN_P - (y - ty) * COS_P),
  };
}

/** Screen px back to the world point on the plane y = groundY. */
export function screenToWorld({ x, y }, view, groundY = 0) {
  const k = pixelsPerUnit(view);
  const [tx, ty, tz] = targetOf(view);
  const sy = (y - view.height * ANCHOR_Y) / k;
  return [tx + (x - view.width / 2) / k, groundY, tz + (sy + (groundY - ty) * COS_P) / SIN_P];
}

/** The view at rest: zoom 1 on Bao's feet. */
export const defaultFrame = ({ width, height }) => ({ width, height, zoom: 1, target: [...TARGET] });

/** The orthographic camera that draws the view. Square pixels; the frustum is offset so the target sits at 0.52 H. */
export function cameraConfig(view) {
  const k = pixelsPerUnit(view);
  const [tx, ty, tz] = targetOf(view);
  const above = view.height * ANCHOR_Y;
  return {
    type: "orthographic",
    position: [tx, ty + CAMERA_DISTANCE * SIN_P, tz + CAMERA_DISTANCE * COS_P],
    target: [tx, ty, tz],
    up: [0, 1, 0],
    near: NEAR,
    far: FAR,
    left: -view.width / 2 / k,
    right: view.width / 2 / k,
    top: above / k,
    bottom: -(view.height - above) / k,
    yaw: YAW,
    pitch: PITCH,
  };
}

/** How far the target may move: |tx| <= x, |tz - TARGET z| <= z. Both are zero when the den already fits. */
export function panLimits(view) {
  const k = pixelsPerUnit(view);
  return {
    x: Math.max(0, WIDEST_STALL_EDGE - view.width / 2 / k),
    z: Math.max(0, DEN_HALF_HEIGHT - view.height / 2 / k) / SIN_P,
  };
}
