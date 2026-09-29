// The banquet market props (ADR 0013), built from simple geometry: round table with a lazy susan
// of steamer baskets (one per queued or active ticket, turned toward its station), four stalls with
// panda-ink roofs and station-hue trim, roof lanterns that light when a cell there waits on the user,
// the service bell on Bao's crown, and the cub basket. Positions come from banquet-layout.mjs. The
// susan does not spin; a basket turns only on a handoff (handoffs.mjs), and jumps under reduced motion.
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  BELL, CUB_BASKET, CUB_BASKET_RADIUS, STALL_CENTERS, TABLE, stallCenterX, stallPlatform, stallRoof, stallWidth,
} from "./banquet-layout.mjs";
import { DUR_SLOW_MS, lanternState, susanLayout, turnAngle } from "./handoffs.mjs";
import { POST_BASE, POST_SIZE, postHeight, postPositions, roofTriangles } from "./stall-roof.mjs";

const TOP_RADIUS = 1.8;
const TOP_THICKNESS = 0.1;
const LEG_RING = 1.3;
const INK = "#23262b";
const WOOD = "#b98a55";
const BAMBOO = "#d9c08a";
const HUE = { steamers: "#e0a458", "front-of-house": "#d9707e", tea: "#6fae7a", pantry: "#5f8fbf" };
// The lantern token (fill) and its unlit look.
const LANTERN_LIT = "#f8bd40";
const LANTERN_OFF = "#7a6a4a";
const SUSAN_Y = 0.75;

const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function Lantern({ lit, position, radius = 0.14 }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[radius, 12, 8]} />
      <meshStandardMaterial
        color={lit ? LANTERN_LIT : LANTERN_OFF}
        emissive={lit ? LANTERN_LIT : "#000000"}
        emissiveIntensity={lit ? 1.4 : 0}
      />
    </mesh>
  );
}

function Stall({ station, x, z, hue, width, lit }) {
  const depth = 1;
  const roofSpec = stallRoof(station);
  const platform = stallPlatform(station);
  const roof = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(roofTriangles(width, depth, roofSpec), 3));
    g.computeVertexNormals();
    return g;
  }, [width, roofSpec]);
  const eave = roofSpec ? roofSpec.eave : 1.7;
  return (
    <group position={[x, 0, z]}>
      {platform > 0 ? (
        <mesh position={[0, platform / 2, 0]}>
          <boxGeometry args={[width + 0.3, platform, depth + 0.3]} />
          <meshStandardMaterial color={INK} />
        </mesh>
      ) : null}
      <group position={[0, platform, 0]}>
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[width, 0.5, depth]} />
          <meshStandardMaterial color={WOOD} />
        </mesh>
        <mesh position={[0, 0.52, depth / 2]}>
          <boxGeometry args={[width + 0.1, 0.06, 0.1]} />
          <meshStandardMaterial color={hue} />
        </mesh>
        {postPositions(width, depth).map(([px, pz]) => (
          <mesh key={`${px}:${pz}`} position={[px, POST_BASE + postHeight(roofSpec) / 2, pz]}>
            <boxGeometry args={[POST_SIZE, postHeight(roofSpec), POST_SIZE]} />
            <meshStandardMaterial color={hue} />
          </mesh>
        ))}
        <mesh geometry={roof}>
          <meshStandardMaterial color={INK} side={THREE.DoubleSide} />
        </mesh>
        <Lantern lit={lit} position={[0, eave - 0.2, depth / 2 - 0.05]} />
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
  );
}

export function Market({ baskets, handoffs, cells, counts }) {
  const lanterns = useMemo(() => lanternState(cells), [cells]);
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
      {Object.entries(STALL_CENTERS).map(([station, c]) => (
        <Stall
          key={station}
          station={station}
          x={stallCenterX(station, counts[station] ?? 0)}
          z={c.z}
          hue={HUE[station]}
          width={stallWidth(counts[station] ?? 0)}
          lit={lanterns.stalls.has(station)}
        />
      ))}
      <mesh position={[CUB_BASKET.x, 0.2, CUB_BASKET.z]}>
        <cylinderGeometry args={[CUB_BASKET_RADIUS, 0.45, 0.4, 20]} />
        <meshStandardMaterial color={BAMBOO} />
      </mesh>
    </group>
  );
}
