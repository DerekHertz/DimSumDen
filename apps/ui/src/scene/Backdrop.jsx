// Low-poly bamboo grove (showcase-v1/02). Colours come from the grove-* CSS tokens. The far, mid and
// near layers sway slowly (period from grove-layout.mjs, much slower than dur-breath); under
// prefers-reduced-motion they stand still.
import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GROVE_TOKENS, applyGroveTheme, buildGrove, groveFog } from "./grove.mjs";
import { swayAngle } from "./grove-layout.mjs";
import { buildDressing, readDressingTokens } from "./dressing.mjs";
import { useSystemTheme } from "./system-theme.js";

function readTokens() {
  const style = getComputedStyle(document.documentElement);
  return Object.fromEntries(GROVE_TOKENS.map((n) => [n, style.getPropertyValue(`--${n}`).trim()]));
}

// Each layer drifts sideways a little (a lean about the origin would lift stalks far from x = 0),
// out of phase with the one in front of it. swayAngle (radians, max 0.03) times SWAY_REACH is world units.
const SWAY_REACH = 6;
const LAYER_PHASE = { "grove-far": 0, "grove-mid": 0.6, "grove-near": 1.2 };

function Dressing() {
  const theme = useSystemTheme();
  const group = useMemo(() => buildDressing(readDressingTokens()), [theme]);
  return <primitive object={group} />;
}

export function Backdrop() {
  const scene = useThree((s) => s.scene);
  const group = useMemo(() => buildGrove(readTokens()), []);
  const reduced = useMemo(() => matchMedia("(prefers-reduced-motion: reduce)"), []);
  useEffect(() => {
    const tokens = readTokens();
    applyGroveTheme(group, tokens);
    scene.fog = groveFog(tokens);
    scene.background = new THREE.Color(tokens["grove-mist"]);
    return () => {
      scene.fog = null;
      scene.background = null;
    };
  }, [group, scene]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (const [name, phase] of Object.entries(LAYER_PHASE)) {
      const layer = group.getObjectByName(name);
      if (layer) layer.position.x = SWAY_REACH * swayAngle(t + phase, reduced.matches);
    }
  });
  return (
    <>
      <primitive object={group} />
      <Dressing />
    </>
  );
}
