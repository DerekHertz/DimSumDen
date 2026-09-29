// The banquet market props (ADR 0013), built from simple geometry: round table with a lazy susan
// of steamer baskets (one per frontier ticket), four stalls with panda-ink roofs and station-hue
// trim, and the cub basket. Positions come from banquet-layout.mjs. Only the susan turns.
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CUB_BASKET, STALL_CENTERS, TABLE, stallWidth, susanBaskets } from "./banquet-layout.mjs";

const INK = "#23262b";
const WOOD = "#b98a55";
const BAMBOO = "#d9c08a";
const HUE = { steamers: "#e0a458", "front-of-house": "#d9707e", tea: "#6fae7a", pantry: "#5f8fbf" };

function Stall({ x, z, hue, width }) {
  const depth = 1;
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
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (width / 2), 1.1, -depth / 2 + 0.05]}>
          <boxGeometry args={[0.08, 1.2, 0.08]} />
          <meshStandardMaterial color={hue} />
        </mesh>
      ))}
      <mesh position={[0, 1.95, 0]} rotation={[0, Math.PI / 4, 0]} scale={[width * 0.75, 1, depth * 1.05]}>
        <coneGeometry args={[1, 0.7, 4]} />
        <meshStandardMaterial color={INK} />
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
      <mesh position={[0, TABLE.height + 0.03, 0]}>
        <cylinderGeometry args={[1, 1, 0.05, 32]} />
        <meshStandardMaterial color={INK} />
      </mesh>
      {susanBaskets(frontier.length).map((p, i) => (
        <mesh key={frontier[i]} position={[p.x, p.y - 0.05, p.z]}>
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
      <mesh position={[TABLE.x, TABLE.height / 2, TABLE.z]}>
        <cylinderGeometry args={[TABLE.radius, TABLE.radius * 0.8, TABLE.height, 40]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
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
