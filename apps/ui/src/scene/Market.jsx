// The banquet market props (ADR 0013), built from simple geometry: round table with a lazy susan
// of steamer baskets (one per queued or active ticket, turned toward its station), four stalls with
// panda-ink roofs and station-hue trim, roof lanterns that light when a cell there waits on the user,
// the service bell on Bao's crown, and the cub basket. Positions come from banquet-layout.mjs. The
// susan does not spin; a basket turns only on a handoff (handoffs.mjs), and jumps under reduced motion.
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  BELL, RAIL, CUB_BASKET, CUB_BASKET_RADIUS, STALL_CENTERS, TABLE, stallCenterX, stallPlatform, stallRoof, stallWidth, stallYaw,
} from "./banquet-layout.mjs";
import { DUR_SLOW_MS, lanternState, susanLayout, turnAngle } from "./handoffs.mjs";
import { POST_BASE, POST_SIZE, eaveTrimTriangles, postHeight, postPositions, roofTriangles } from "./stall-roof.mjs";
import { kiosks } from "./kiosk.mjs";
import { useSystemTheme } from "./system-theme.js";

const TOP_RADIUS = 1.8;
const TOP_THICKNESS = 0.1;
const LEG_RING = 1.3;
const INK = "#23262b";
const WOOD = "#b98a55";
const BAMBOO = "#d9c08a";
// Platforms under the back stalls: station-neutral stone, not panda ink.
const STONE = "#b3a892";
// The lantern token (fill) and its unlit look.
const LANTERN_LIT = "#f8bd40";
const LANTERN_OFF = "#7a6a4a";
const SUSAN_Y = 0.75;

const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

const trianglesGeometry = (flat) => {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(flat, 3));
  g.computeVertexNormals();
  return g;
};

// The noren sign: the station name drawn once on a canvas, spanning the curtain panels (decorative; the
// ChipLayer anchor keeps the accessible name). Drawn with the fallback face first, redrawn once Long Cang loads.
function useNorenTexture(noren) {
  const { cloth, text, textColor } = noren;
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 256;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
  useEffect(() => {
    let live = true;
    const draw = () => {
      const canvas = texture.image;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = cloth;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = textColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      let size = 160;
      const face = (s) => `${s}px "Long Cang", "Nunito", cursive`;
      ctx.font = face(size);
      const fit = (canvas.width * 0.8) / Math.max(1, ctx.measureText(text).width);
      if (fit < 1) { size = Math.floor(size * fit); ctx.font = face(size); }
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);
      texture.needsUpdate = true;
    };
    draw();
    document.fonts.load(`48px "Long Cang"`).then(() => { if (live) draw(); }, () => {});
    return () => { live = false; };
  }, [texture, cloth, text, textColor]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function Noren({ noren }) {
  const texture = useNorenTexture(noren);
  const { panels } = noren;
  const left = panels[0].x - panels[0].width / 2;
  const span = panels.at(-1).x + panels.at(-1).width / 2 - left;
  const geometries = useMemo(() => panels.map((p) => {
    const g = new THREE.PlaneGeometry(p.width, p.drop);
    const u0 = (p.x - p.width / 2 - left) / span, u1 = (p.x + p.width / 2 - left) / span;
    const uv = g.getAttribute("uv");
    for (let i = 0; i < uv.count; i++) uv.setX(i, u0 + uv.getX(i) * (u1 - u0));
    return g;
  }), [panels, left, span]);
  return (
    <group name="noren">
      {panels.map((p, i) => (
        <mesh key={i} geometry={geometries[i]} position={[p.x, p.top - p.drop / 2, p.z]}>
          <meshStandardMaterial map={texture} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

// One 8-sided rice-paper lantern with thin caps; lit only from lanternState.
function KioskLantern({ lantern }) {
  const { name, x, y, z, radius, height, sides, lit, bodyColor, emissive, capColor } = lantern;
  const cap = 0.02;
  return (
    <group name={name} position={[x, y, z]}>
      <mesh>
        <cylinderGeometry args={[radius, radius, height, sides]} />
        <meshStandardMaterial color={bodyColor} emissive={emissive ?? "#000000"} emissiveIntensity={lit ? 1.4 : 0} />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[0, (s * (height + cap)) / 2, 0]}>
          <cylinderGeometry args={[radius * 0.9, radius * 0.9, cap, sides]} />
          <meshStandardMaterial color={capColor} />
        </mesh>
      ))}
    </group>
  );
}

function Stall({ kiosk, x, z }) {
  const { station, width, colors } = kiosk;
  const depth = 1;
  const roofSpec = stallRoof(station);
  const platform = stallPlatform(station);
  const roof = useMemo(() => trianglesGeometry(roofTriangles(width, depth, roofSpec)), [width, roofSpec]);
  const trim = useMemo(() => trianglesGeometry(eaveTrimTriangles(width, depth, roofSpec)), [width, roofSpec]);
  return (
    <group name={`kiosk:${station}`} position={[x, 0, z]} rotation={[0, stallYaw(station), 0]}>
      {platform > 0 ? (
        <mesh position={[0, platform / 2, 0]}>
          <boxGeometry args={[width + 0.3, platform, depth + 0.3]} />
          <meshStandardMaterial color={STONE} />
        </mesh>
      ) : null}
      <group position={[0, platform, 0]}>
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[width, 0.5, depth]} />
          <meshStandardMaterial color={colors.counterBody} />
        </mesh>
        <mesh position={[0, 0.52, depth / 2]}>
          <boxGeometry args={[width + 0.1, 0.06, 0.1]} />
          <meshStandardMaterial color={colors.counterBand} />
        </mesh>
        {postPositions(width, depth).map(([px, pz]) => (
          <mesh key={`${px}:${pz}`} position={[px, POST_BASE + postHeight(roofSpec) / 2, pz]}>
            <boxGeometry args={[POST_SIZE, postHeight(roofSpec), POST_SIZE]} />
            <meshStandardMaterial color={colors.posts} />
          </mesh>
        ))}
        <mesh geometry={roof}>
          <meshStandardMaterial color={colors.roof} side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={trim}>
          <meshStandardMaterial color={colors.trim} side={THREE.DoubleSide} />
        </mesh>
        <Noren noren={kiosk.noren} />
        <KioskLantern lantern={kiosk.lantern} />
      </group>
    </group>
  );
}

const polar = (angle, radius) => [TABLE.x + radius * Math.sin(angle), TABLE.z + radius * Math.cos(angle)];

// One basket per ticket. Each sits at its station's bearing; on a handoff its basket turns to the
// new bearing over dur-slow (turnAngle), or jumps when reduced motion is on.
function Susan({ baskets, handoffs }) {
  const layout = useMemo(() => susanLayout(baskets), [baskets]);
  const meshes = useRef(new Map());
  const angles = useRef(new Map());
  const turns = useRef(new Map());
  const seen = useRef(new Set());

  useEffect(() => {
    for (const h of handoffs) {
      if (seen.current.has(h.id)) continue;
      seen.current.add(h.id);
      const target = layout.find((b) => b.ref === h.ref);
      if (!target) continue;
      const from = angles.current.get(h.ref) ?? target.angle;
      turns.current.set(h.ref, { from, to: target.angle, t0: performance.now() });
    }
  }, [handoffs, layout]);

  useFrame(() => {
    const now = performance.now();
    const reduced = reducedMotion();
    for (const b of layout) {
      const turn = turns.current.get(b.ref);
      let angle = b.angle;
      if (turn) {
        angle = turnAngle(turn.from, turn.to, now - turn.t0, reduced);
        if (reduced || now - turn.t0 >= DUR_SLOW_MS) turns.current.delete(b.ref);
      }
      angles.current.set(b.ref, angle);
      const mesh = meshes.current.get(b.ref);
      if (mesh) {
        const [px, pz] = polar(angle, b.radius);
        mesh.position.set(px, SUSAN_Y + 0.14, pz);
      }
    }
  });

  return (
    <group>
      <mesh position={[TABLE.x, TABLE.height + 0.015, TABLE.z]}>
        <cylinderGeometry args={[1.15, 1.15, 0.03, 40]} />
        <meshStandardMaterial color={INK} />
      </mesh>
      {layout.map((b) => {
        const [px, pz] = polar(b.angle, b.radius);
        return (
          <mesh
            key={b.ref}
            ref={(m) => (m ? meshes.current.set(b.ref, m) : meshes.current.delete(b.ref))}
            position={[px, SUSAN_Y + 0.14, pz]}
          >
            <cylinderGeometry args={[0.18, 0.15, 0.2, 16]} />
            <meshStandardMaterial color={BAMBOO} />
          </mesh>
        );
      })}
    </group>
  );
}

function ServiceBell({ lit }) {
  return (
    <group>
      <mesh position={[RAIL.x, RAIL.y, RAIL.z]}>
        <boxGeometry args={[RAIL.width, RAIL.height, 0.12]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
      <group position={[BELL.x, BELL.y, BELL.z]}>
      <mesh>
        <sphereGeometry args={[0.16, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={lit ? LANTERN_LIT : LANTERN_OFF}
          emissive={lit ? LANTERN_LIT : "#000000"}
          emissiveIntensity={lit ? 1.6 : 0}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.17, 0]}>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshStandardMaterial color={INK} />
      </mesh>
      </group>
    </group>
  );
}

export function Market({ baskets, handoffs, cells, counts }) {
  const theme = useSystemTheme();
  const lanterns = useMemo(() => lanternState(cells), [cells]);
  const kioskList = useMemo(() => kiosks({ cells, counts, theme }), [cells, counts, theme]);
  return (
    <group name="banquet-market">
      {/* Flat round tabletop, larger than the anchor radius, on four short legs. */}
      <mesh position={[TABLE.x, TABLE.height - TOP_THICKNESS / 2, TABLE.z]}>
        <cylinderGeometry args={[TOP_RADIUS, TOP_RADIUS, TOP_THICKNESS, 48]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = Math.PI / 4 + (i * Math.PI) / 2;
        return (
          <mesh key={i} position={[TABLE.x + LEG_RING * Math.cos(a), (TABLE.height - TOP_THICKNESS) / 2, TABLE.z + LEG_RING * Math.sin(a)]}>
            <boxGeometry args={[0.16, TABLE.height - TOP_THICKNESS, 0.16]} />
            <meshStandardMaterial color={WOOD} />
          </mesh>
        );
      })}
      <Susan baskets={baskets} handoffs={handoffs} />
      <ServiceBell lit={lanterns.bell} />
      {kioskList.map((kiosk) => (
        <Stall
          key={kiosk.station}
          kiosk={kiosk}
          x={stallCenterX(kiosk.station, counts[kiosk.station] ?? 0)}
          z={STALL_CENTERS[kiosk.station].z}
        />
      ))}
      <mesh position={[CUB_BASKET.x, 0.2, CUB_BASKET.z]}>
        <cylinderGeometry args={[CUB_BASKET_RADIUS, 0.45, 0.4, 20]} />
        <meshStandardMaterial color={BAMBOO} />
      </mesh>
    </group>
  );
}
