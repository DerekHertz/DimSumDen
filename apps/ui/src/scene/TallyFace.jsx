// Tally (den-scene-v1/05): a low-poly wooden suanpan abacus on two short legs, on the floor beside the
// Cubs basket. Five rods, ten beads each; counted beads rest right in the rod's token colour, uncounted
// beads stay wood. `tally` is the tallyRods view-model (rods, caption), so the abacus, the card rows and
// the hidden meter twins always agree. A bead slides over 240 ms only when its rod's count changes
// (beadSlide); under prefers-reduced-motion it jumps. Clicking any part opens the Tally card; the keyboard
// route is the "Tally" pill in ChipLayer.
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { TALLY } from "./banquet-layout.mjs";
import { abacusLayout, beadSlide, TALLY_LABEL } from "./tally-face.mjs";
import { stationHue } from "./station-hues.mjs";
import { useSystemTheme } from "./system-theme.js";

// Wood has no design token yet (proposed: wood, wood-deep); scene literals, like the stalls' wood.
const WOOD = "#8A5A34";
const WOOD_DEEP = "#4A2E1C";
const INK = "#1d2124"; // light-theme ink: the paper backing stays rice-paper in both themes
const BEAD_R = 0.035;
const ROD_R = 0.012;
const PAPER_Z = -0.04;
const PAPER_PX = { w: 512, h: 675 }; // 0.94 x 1.24 inner area
const L = abacusLayout();
const F = TALLY.frame;
const FRAME_CY = TALLY.groundY + TALLY.leg.height + F.height / 2; // group-local frame centre height
const INNER_W = F.width - 2 * F.bar;
const INNER_H = F.height - 2 * F.bar;

const cssVar = (name, fallback) =>
  (typeof document === "undefined" ? "" : getComputedStyle(document.documentElement).getPropertyValue(name).trim()) || fallback;
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// Design-token names from the view-model to hex, following the live theme (the CSS tokens switch with it).
function tokenColors(theme) {
  return {
    qi: cssVar("--qi", "#006c71"),
    alarm: cssVar("--alarm", "#c1291b"),
    "station-steamers": stationHue("steamers", theme),
    "lantern-fill": cssVar("--lantern-fill", "#f8bd40"),
    paper: cssVar("--rice-paper", "#f6efdc"),
  };
}

// The paper backing: rice paper, the "Tally" heading in the display face, and a sans label at each rod's left end.
function drawPaper(ctx, tally, paper) {
  const { w, h } = PAPER_PX;
  const ppu = w / INNER_W;
  const yPx = (y) => (INNER_H / 2 - y) * ppu;
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = INK;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.font = "56px 'Long Cang', cursive";
  ctx.fillText(TALLY_LABEL, w / 2, yPx(L.headingY));
  ctx.textAlign = "left";
  ctx.font = "600 34px Nunito, sans-serif";
  tally.rods.forEach((rod, i) => ctx.fillText(rod.label, 0.03 * ppu, yPx(L.rodYs[i])));
}

function Rod({ rod, y, colors }) {
  const meshes = useRef([]);
  const current = useRef(L.beadX(rod.counted));
  const prevCounted = useRef(null);
  const anim = useRef(null);
  const counted = rod.counted;

  const apply = () => meshes.current.forEach((m, i) => m && (m.position.x = current.current[i]));
  useLayoutEffect(() => {
    const target = L.beadX(counted);
    const slide = beadSlide(prevCounted.current, counted, { reducedMotion: reducedMotion() });
    prevCounted.current = counted;
    if (slide.animate) {
      anim.current = { from: [...current.current], to: target, start: performance.now(), ms: slide.durationMs };
    } else {
      anim.current = null;
      current.current = target;
      apply();
    }
  }, [counted]);
  useFrame(() => {
    const a = anim.current;
    if (!a) return;
    const k = Math.min(1, (performance.now() - a.start) / a.ms);
    const ease = 1 - (1 - k) ** 3;
    current.current = a.to.map((x, i) => a.from[i] + (x - a.from[i]) * ease);
    apply();
    if (k >= 1) anim.current = null;
  });

  const beadColor = colors[rod.color];
  return (
    <group position={[0, y, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[ROD_R, ROD_R, INNER_W, 8]} />
        <meshStandardMaterial color={WOOD_DEEP} />
      </mesh>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} ref={(m) => (meshes.current[i] = m)} scale={[(L.beadHalfWidth / BEAD_R) * 0.95, 1, 1]}>
          <sphereGeometry args={[BEAD_R, 8, 6]} />
          <meshStandardMaterial color={i >= 10 - counted ? beadColor : WOOD} />
        </mesh>
      ))}
      {rod.mark80 ? (
        <mesh position={[L.mark80X, 0, 0.005]}>
          <boxGeometry args={[0.012, 0.1, 0.02]} />
          <meshStandardMaterial color={colors["lantern-fill"]} />
        </mesh>
      ) : null}
    </group>
  );
}

export function TallyFace({ tally, onOpen, stage }) {
  const theme = useSystemTheme();
  const colors = useMemo(() => tokenColors(theme), [theme]);
  const canvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = PAPER_PX.w;
    c.height = PAPER_PX.h;
    return c;
  }, []);
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [canvas]);

  const labels = tally.rods.map((r) => r.label).join("|");
  useEffect(() => {
    const draw = () => {
      drawPaper(canvas.getContext("2d"), tally, colors.paper);
      texture.needsUpdate = true;
    };
    draw();
    // Redraw once Long Cang arrives, so the heading does not stay in the fallback face.
    let live = true;
    document.fonts?.load("56px 'Long Cang'").then(() => live && draw()).catch(() => {});
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labels, canvas, texture, colors.paper]);

  const barY = F.height / 2 - F.bar / 2;
  return (
    <group
      name="tally"
      position={[TALLY.x, 0, TALLY.z]}
      rotation={[0, TALLY.rotationY, 0]}
      onPointerDown={() => { if (stage) stage.tallyHit = true; }}
      onClick={onOpen ? (e) => { e.stopPropagation(); onOpen(); } : undefined}
      onPointerOver={onOpen ? () => { document.body.style.cursor = "pointer"; } : undefined}
      onPointerOut={onOpen ? () => { document.body.style.cursor = ""; } : undefined}
    >
      {[-1, 1].map((s) => (
        <mesh key={`leg${s}`} position={[s * (F.width / 2 - 0.15), TALLY.groundY + TALLY.leg.height / 2, 0]}>
          <boxGeometry args={[TALLY.leg.width, TALLY.leg.height, TALLY.leg.width]} />
          <meshStandardMaterial color={WOOD_DEEP} />
        </mesh>
      ))}
      <group position={[0, FRAME_CY, 0]}>
        {[-1, 1].map((s) => (
          <mesh key={`bar${s}`} position={[0, s * barY, 0]}>
            <boxGeometry args={[F.width, F.bar, F.depth]} />
            <meshStandardMaterial color={WOOD} />
          </mesh>
        ))}
        {[-1, 1].map((s) => (
          <mesh key={`side${s}`} position={[s * (F.width / 2 - F.bar / 2), 0, 0]}>
            <boxGeometry args={[F.bar, INNER_H, F.depth]} />
            <meshStandardMaterial color={WOOD} />
          </mesh>
        ))}
        <mesh position={[0, 0, PAPER_Z]}>
          <planeGeometry args={[INNER_W, INNER_H]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
        {tally.rods.map((rod, i) => (
          <Rod key={rod.id} rod={rod} y={L.rodYs[i]} colors={colors} />
        ))}
      </group>
    </group>
  );
}
