// The banquet market props (ADR 0013), built from simple geometry: round table with a lazy susan
// of steamer baskets (one per frontier ticket), four stalls with panda-ink roofs and station-hue
// trim, and the cub basket. Positions come from banquet-layout.mjs. Only the susan turns.
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { CUB_BASKET, STALL_CENTERS, TABLE, stallWidth, susanBaskets } from "./banquet-layout.mjs";
import { POST_BASE, postHeight, postPositions, roofTriangles } from "./stall-roof.mjs";

const TOP_RADIUS = 1.8;
const TOP_THICKNESS = 0.1;
const LEG_RING = 1.3;
const INK = "#23262b";
const WOOD = "#b98a55";
const BAMBOO = "#d9c08a";
const HUE = { steamers: "#e0a458", "front-of-house": "#d9707e", tea: "#6fae7a", pantry: "#5f8fbf" };

function Stall({ x, z, hue, width }) {
  const depth = 1;
  const roof = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(roofTriangles(width, depth), 3));
    g.computeVertexNormals();
    return g;
  }, [width]);
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[width, 0.5, depth]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
      <mesh position={[0, 0.52, depth / 2]}>
        <boxGeometry args={[width + 0.1, 0.06, 0.1]} />
        <meshStandardMaterial color={hue} />
      </mesh>
      {postPositions(width, depth).map(([px, pz]) => (
        <mesh key={`${px}:${pz}`} position={[px, POST_BASE + postHeight() / 2, pz]}>
          <boxGeometry args={[0.08, postHeight(), 0.08]} />
          <meshStandardMaterial color={hue} />
        </mesh>
      ))}
      <mesh geometry={roof}>
        <meshStandardMaterial color={INK} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Susan({ frontier }) {
  const spin = useRef();
  useFrame((_, dt) => {
    if (spin.current && !matchMedia("(prefers-reduced-motion: reduce)").matches) spin.current.rotation.y += dt * 0.15;
  });
  return (
    <group ref={spin} position={[TABLE.x, 0, TABLE.z]}>
      <mesh position={[0, TABLE.height + 0.015, 0]}>
        <cylinderGeometry args={[1.15, 1.15, 0.03, 40]} />
        <meshStandardMaterial color={INK} />
      </mesh>
      {susanBaskets(frontier.length).map((p, i) => (
        <mesh key={frontier[i]} position={[p.x, p.y + 0.06, p.z]}>
          <cylinderGeometry args={[0.24, 0.2, 0.2, 16]} />
          <meshStandardMaterial color={BAMBOO} />
        </mesh>
      ))}
    </group>
  );
}

export function Market({ frontier, counts }) {
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
      <Susan frontier={frontier} />
      {Object.entries(STALL_CENTERS).map(([station, c]) => (
        <Stall key={station} x={c.x} z={c.z} hue={HUE[station]} width={stallWidth(counts[station] ?? 0)} />
      ))}
      <mesh position={[CUB_BASKET.x, 0.2, CUB_BASKET.z]}>
        <cylinderGeometry args={[0.55, 0.45, 0.4, 20]} />
        <meshStandardMaterial color={BAMBOO} />
      </mesh>
    </group>
  );
}
