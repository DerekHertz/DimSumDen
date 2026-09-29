// Camera controls for the banquet market: pan along x only (drag, arrow keys) and zoom by dolly
// (wheel, +/-), within the limits in camera-rig.mjs. Keys work when the scene has focus. Reduced
// motion snaps straight to the target; otherwise the camera eases toward it.
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { cameraPosition, clampPan, clampZoom, dragPan, keyPan, keyZoom, wheelZoom } from "./camera-rig.mjs";

export function CameraRig() {
  const { camera, gl } = useThree();
  const target = useRef({ pan: 0, zoom: 1 });
  const now = useRef({ pan: 0, zoom: 1 });

  useEffect(() => {
    const el = gl.domElement;
    const host = el.parentElement?.closest("main") ?? el;
    const t = target.current;
    let drag = null;
    const onDown = (e) => { drag = { x: e.clientX }; el.setPointerCapture?.(e.pointerId); };
    const onMove = (e) => {
      if (!drag) return;
      t.pan = dragPan(t.pan, e.clientX - drag.x, el.clientWidth || 1, t.zoom);
      drag.x = e.clientX;
    };
    const onUp = (e) => { drag = null; el.releasePointerCapture?.(e.pointerId); };
    const onWheel = (e) => { e.preventDefault(); t.zoom = wheelZoom(t.zoom, e.deltaY); };
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const pan = keyPan(t.pan, e.key);
      const zoom = keyZoom(t.zoom, e.key);
      if (pan === t.pan && zoom === t.zoom && !["ArrowLeft", "ArrowRight", "+", "=", "-", "_"].includes(e.key)) return;
      e.preventDefault();
      t.pan = pan;
      t.zoom = zoom;
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
    const t = target.current;
    const n = now.current;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      n.pan = t.pan;
      n.zoom = t.zoom;
    } else {
      const k = 1 - Math.exp(-10 * dt);
      n.pan += (t.pan - n.pan) * k;
      n.zoom += (t.zoom - n.zoom) * k;
    }
    const [x, y, z] = cameraPosition(clampPan(n.pan), clampZoom(n.zoom));
    camera.position.set(x, y, z);
  });
  return null;
}
