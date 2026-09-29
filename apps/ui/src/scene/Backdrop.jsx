// Static paper-cut grove (dimsumden-ui-v0/14). Colours come from the CSS custom properties, so the
// backdrop follows the active theme; a scheme change recolours the same meshes. No animation.
import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { BACKDROP_TOKENS, applyBackdropTheme, backdropFog, buildBackdrop } from "./backdrop.mjs";

const NAMES = [...BACKDROP_TOKENS, "surface-100"];

function readTokens() {
  const style = getComputedStyle(document.documentElement);
  return Object.fromEntries(NAMES.map((n) => [n, style.getPropertyValue(`--${n}`).trim()]));
}

export function Backdrop() {
  const scene = useThree((s) => s.scene);
  const group = useMemo(() => buildBackdrop(readTokens()), []);
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const tokens = readTokens();
      applyBackdropTheme(group, tokens);
      scene.fog = backdropFog(tokens);
      scene.background = new THREE.Color(tokens["surface-100"]);
    };
    apply();
    media.addEventListener("change", apply);
    return () => {
      media.removeEventListener("change", apply);
      scene.fog = null;
      scene.background = null;
    };
  }, [group, scene]);
  return <primitive object={group} />;
}
