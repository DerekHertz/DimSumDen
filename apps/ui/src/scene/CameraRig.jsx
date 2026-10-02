// Camera controls for the isometric den: pan (drag, arrow keys) moves the look-at target on the ground and zoom
// (wheel, two-finger pinch, +/-) is a dolly factor, within the limits in camera-rig.mjs. Keys work when the scene
// has focus. The goal (zoom and target) lives in the camera store, so the zoom switcher and the station pills move
// the same camera; this rig only eases toward it. Reduced motion snaps straight to the goal; otherwise the camera
// eases toward it. The orthographic camera itself comes from cameraConfig (iso-projection.mjs), applied each frame.
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { cameraConfig } from "./iso-projection.mjs";
import { clampTarget, clampZoom, dragPan, keyPan, pinchZoom, wheelZoom } from "./camera-rig.mjs";

export function CameraRig({ store }) {
  const { camera, gl, size } = useThree();
  // The viewport follows the canvas (the whole scene box: the cards float over it); kept in a ref for the handlers.
  const viewport = useRef({ width: size.width, height: size.height });
  viewport.current = { width: size.width, height: size.height };
  const now = useRef({ target: [...store.getTarget()], zoom: store.getZoom() });

  useEffect(() => {
    const el = gl.domElement;
    const host = el.parentElement?.closest("main") ?? el;
    const view = (zoom = store.getZoom()) => ({ ...viewport.current, zoom });
    // One finger drags the ground; two fingers pinch the zoom (the gesture's own start is the reference).
    const pointers = new Map();
    let drag = null;
    let pinch = null;
    const spread = () => {
      const [a, b] = [...pointers.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };
    const onDown = (e) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        drag = null;
        pinch = { dist: spread(), zoom: store.getZoom() };
      } else if (pointers.size === 1) {
        drag = { x: e.clientX, y: e.clientY };
      }
      el.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && pointers.size === 2) {
        store.setZoom(pinchZoom(pinch.zoom, pinch.dist, spread()));
        return;
      }
      if (!drag) return;
      store.setTarget(dragPan(store.getTarget(), { dx: e.clientX - drag.x, dy: e.clientY - drag.y }, view()));
      drag = { x: e.clientX, y: e.clientY };
    };
    const onUp = (e) => {
      pointers.delete(e.pointerId);
      el.releasePointerCapture?.(e.pointerId);
      if (pointers.size < 2) pinch = null;
      // The finger left behind carries on as a drag from where it stands.
      drag = pointers.size === 1 ? { ...[...pointers.values()][0] } : null;
    };
    const onWheel = (e) => { e.preventDefault(); store.setZoom(wheelZoom(store.getZoom(), e.deltaY)); };
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!["ArrowLeft", "ArrowRight", "+", "=", "-", "_"].includes(e.key)) return;
      e.preventDefault();
      store.setTarget(keyPan(store.getTarget(), e.key, view()));
      store.stepZoom(e.key);
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    host.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", onWheel);
      host.removeEventListener("keydown", onKey);
    };
  }, [gl, store]);

  useFrame((_, dt) => {
    const n = now.current;
    // A zoom-out or a resize can shrink the pan limits under the goal: pull it back in.
    store.setTarget(clampTarget(store.getTarget(), { ...viewport.current, zoom: store.getZoom() }));
    const goal = { target: store.getTarget(), zoom: store.getZoom() };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      n.target = [...goal.target];
      n.zoom = goal.zoom;
    } else {
      const k = 1 - Math.exp(-10 * dt);
      n.target = n.target.map((v, i) => v + (goal.target[i] - v) * k);
      n.zoom += (goal.zoom - n.zoom) * k;
    }
    const zoom = clampZoom(n.zoom);
    const { width, height } = viewport.current;
    const c = cameraConfig({ width, height, zoom, target: n.target });
    camera.userData.viewport = { width, height }; // the size this frustum was built for; ChipLayer projects with it
    camera.manual = true; // R3F would otherwise reset the frustum to pixel units on resize
    camera.zoom = 1;
    camera.near = c.near;
    camera.far = c.far;
    camera.left = c.left;
    camera.right = c.right;
    camera.top = c.top;
    camera.bottom = c.bottom;
    camera.position.set(...c.position);
    camera.up.set(...c.up);
    camera.lookAt(...c.target);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  });
  return null;
}
