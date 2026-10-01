// Camera controls for the isometric den: pan (drag, arrow keys) moves the look-at target on the ground and zoom
// (wheel, +/-) is a dolly factor, within the limits in camera-rig.mjs. Keys work when the scene has focus.
// Reduced motion snaps straight to the target; otherwise the camera eases toward it. The orthographic camera
// itself comes from cameraConfig (iso-projection.mjs), applied each frame.
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { TARGET, cameraConfig } from "./iso-projection.mjs";
import { clampTarget, clampZoom, dragPan, keyPan, keyZoom, wheelZoom } from "./camera-rig.mjs";

export function CameraRig() {
  const { camera, gl, size } = useThree();
  // The viewport follows the canvas; kept in a ref for the event handlers.
  const viewport = useRef({ width: size.width, height: size.height });
  viewport.current = { width: size.width, height: size.height };
  const goal = useRef({ target: [...TARGET], zoom: 1 });
  const now = useRef({ target: [...TARGET], zoom: 1 });

  useEffect(() => {
    const el = gl.domElement;
    const host = el.parentElement?.closest("main") ?? el;
    const t = goal.current;
    const view = (zoom = t.zoom) => ({ ...viewport.current, zoom });
    let drag = null;
    const onDown = (e) => { drag = { x: e.clientX, y: e.clientY }; el.setPointerCapture?.(e.pointerId); };
    const onMove = (e) => {
      if (!drag) return;
      t.target = dragPan(t.target, { dx: e.clientX - drag.x, dy: e.clientY - drag.y }, view());
      drag = { x: e.clientX, y: e.clientY };
    };
    const onUp = (e) => { drag = null; el.releasePointerCapture?.(e.pointerId); };
    const onWheel = (e) => { e.preventDefault(); t.zoom = wheelZoom(t.zoom, e.deltaY); };
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!["ArrowLeft", "ArrowRight", "+", "=", "-", "_"].includes(e.key)) return;
      e.preventDefault();
      t.target = keyPan(t.target, e.key, view());
      t.zoom = keyZoom(t.zoom, e.key);
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
  }, [gl]);

  useFrame((_, dt) => {
    const t = goal.current;
    const n = now.current;
    // A zoom-out or a resize can shrink the pan limits under the goal: pull it back in.
    t.target = clampTarget(t.target, { ...viewport.current, zoom: t.zoom });
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      n.target = [...t.target];
      n.zoom = t.zoom;
    } else {
      const k = 1 - Math.exp(-10 * dt);
      n.target = n.target.map((v, i) => v + (t.target[i] - v) * k);
      n.zoom += (t.zoom - n.zoom) * k;
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
