// Renderer for the SceneCell list (ADR 0011 decision 7) in the banquet market layout (ADR 0013):
// Bao hosts at the back, one plush per cell at its station slot, a lazy susan of baskets on the
// table (one per frontier ticket). Poses come from the character director; placement is pure
// (banquet-layout.mjs). Only the lazy susan turns.
import { Component, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import { createCharacterDirector } from "../../../../packages/character-director/src/director.mjs";
import { ROLE_PLACEMENT, SCARF_SOCKET } from "../assets/panda-contract.mjs";
import { averageAttribute, clusterSimplify, dominantBones } from "./plush-lod.mjs";
import { createAssetCache } from "./asset-cache.mjs";
import { Backdrop } from "./Backdrop.jsx";
import { Market, useSystemTheme } from "./Market.jsx";
import { headgearSpec, propSpec, scarfSpec } from "./headgear.mjs";
import { buildGear } from "./gear-object.mjs";
import { TallyFace } from "./TallyFace.jsx";
import { BAO, parsePerch, placeCell, stationOf } from "./banquet-layout.mjs";
import { ROAMER_TYPES, stepRoamer } from "./roam.mjs";

// Each role's headgear, prop and the scarf are built once per theme and level of detail (key "kind|role|theme|lod"),
// then cloned per plush. The parts come from headgear.mjs; sockets from ROLE_PLACEMENT.
const SPECS = { headgear: headgearSpec, prop: propSpec, scarf: scarfSpec };
const gearBuilds = createAssetCache((key) => {
  const [kind, role, theme, lod] = key.split("|");
  return Promise.resolve(buildGear(SPECS[kind](role, { theme, lod })));
});

const PLUSH_SCALE = 0.3;
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function useDirector() {
  return useMemo(
    () => createCharacterDirector({ reducedMotion: reducedMotion() }),
    [],
  );
}

// One clustered copy of each skinned mesh's geometry, shared by every plush (plush-lod.mjs). The
// face decal is small, so only meshes above LOD_MIN_VERTICES are simplified.
const LOD_MIN_VERTICES = 10000;

function simplifyGeometry(geometry) {
  const pos = geometry.getAttribute("position");
  const joints = geometry.getAttribute("skinIndex");
  const weights = geometry.getAttribute("skinWeight");
  const groups = joints && weights ? dominantBones(joints.array, weights.array) : undefined;
  const { keep, remap, index } = clusterSimplify({ positions: pos.array, index: geometry.index.array, groups });
  const out = new THREE.BufferGeometry();
  for (const [name, attr] of Object.entries(geometry.attributes)) {
    const size = attr.itemSize;
    let array;
    if (name === "position" || name === "normal") {
      array = averageAttribute(attr.array, size, remap, keep.length);
    } else if (name === "color") {
      // Averaged, so the fur colour does not turn speckled; an integer source type is rounded back.
      const mean = averageAttribute(attr.array, size, remap, keep.length);
      array = attr.array instanceof Float32Array ? mean : attr.array.constructor.from(mean, Math.round);
    } else {
      array = new attr.array.constructor(keep.length * size);
      for (let j = 0; j < keep.length; j++) for (let k = 0; k < size; k++) array[j * size + k] = attr.array[keep[j] * size + k];
    }
    out.setAttribute(name, new THREE.BufferAttribute(array, size, attr.normalized));
  }
  if (out.getAttribute("normal")) {
    const n = out.getAttribute("normal");
    for (let j = 0; j < n.count; j++) {
      const v = new THREE.Vector3().fromBufferAttribute(n, j).normalize();
      n.setXYZ(j, v.x, v.y, v.z);
    }
  }
  out.setIndex(new THREE.BufferAttribute(index, 1));
  return out;
}

const plushGeometries = new WeakMap();
function plushGeometryFor(geometry) {
  // Morph targets and interleaved buffers are not carried over; such a mesh stays at full detail.
  const plain = Object.values(geometry.attributes).every((a) => a.isBufferAttribute && !a.isInterleavedBufferAttribute);
  if (!plain || Object.keys(geometry.morphAttributes).length || !geometry.index) return geometry;
  if (geometry.getAttribute("position").count < LOD_MIN_VERTICES) return geometry;
  let g = plushGeometries.get(geometry);
  if (!g) {
    g = simplifyGeometry(geometry);
    plushGeometries.set(geometry, g);
  }
  return g;
}

// `anchorId` names the figure for chips and selection (default: its id); null hides it from both, as for an idle roamer.
// `fadeRef.current` is an opacity in 0..1, read every frame (the reduced-motion cross-fade).
function Figure({ id, gltf, director, pose, cellType, position, scale, lod, selected, onSelect, stage, anchorId = id, fadeRef }) {
  const root = useRef();
  const object = useMemo(() => {
    const o = cloneSkinned(gltf.scene);
    o.traverse((n) => {
      if (lod && n.isSkinnedMesh) n.geometry = plushGeometryFor(n.geometry);
      if (n.material) {
        n.material = n.material.clone();
        // Bao sits far back; the backdrop fog would grey him out, so he ignores it.
        if (id === "bao") n.material.fog = false;
        if (n.material.map) n.material.map = n.material.map.clone();
      }
    });
    return o;
  }, [gltf, lod, id]);
  const mixer = useMemo(() => new THREE.AnimationMixer(object), [object]);
  const state = useRef({ clip: null, loop: null, action: null, pose: null });
  const atlas = useMemo(() => gltf.parser.json.nodes.find((n) => n.name === "face")?.extras?.faceAtlas, [gltf]);

  useEffect(() => {
    director.setCellType(id, cellType);
    const s = state.current;
    if (s.pose !== pose) {
      director.setState(id, pose, performance.now() / 1000);
      s.pose = pose;
    }
  }, [director, id, pose, cellType]);

  const theme = useSystemTheme();
  // Headgear on the hat socket, the prop on the role's paw, the shared scarf on the body bone, all attached by
  // socket name. Rigid on the socket, so reduced motion adds nothing. Rebuilt when the theme swaps.
  useEffect(() => {
    const placement = cellType && Object.hasOwn(ROLE_PLACEMENT, cellType) ? ROLE_PLACEMENT[cellType] : null;
    if (!placement) return undefined;
    const detail = lod ? "crowd" : "hero";
    const attached = [];
    let cancelled = false;
    const attach = (kind, socketName) => gearBuilds.get(`${kind}|${cellType}|${theme}|${detail}`).then((built) => {
      const socket = object.getObjectByName(socketName);
      if (cancelled || !socket) return;
      const gear = built.clone(true);
      gear.traverse((n) => { if (n.material) n.material = n.material.clone(); });
      socket.add(gear);
      attached.push(gear);
    }).catch(() => {});
    attach("headgear", placement.headgear.socket);
    attach("prop", placement.prop.socket);
    attach("scarf", SCARF_SOCKET);
    return () => {
      cancelled = true;
      for (const g of attached) g.parent?.remove(g);
    };
  }, [object, cellType, theme, lod]);

  useFrame((_, dt) => {
    const now = performance.now() / 1000;
    const cmd = director.tick(id, now);
    const s = state.current;
    if (cmd.clip !== s.clip || cmd.loop !== s.loop) {
      const clip = gltf.animations.find((c) => c.name === cmd.clip);
      if (clip) {
        const next = mixer.clipAction(clip);
        next.reset();
        next.setLoop(cmd.loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
        next.clampWhenFinished = !cmd.loop;
        if (s.action && s.action !== next) {
          if (cmd.crossFade > 0) next.crossFadeFrom(s.action, cmd.crossFade, false);
          else s.action.stop();
        }
        next.play();
        s.action = next;
      }
      s.clip = cmd.clip;
      s.loop = cmd.loop;
    }
    if (fadeRef && fadeRef.current !== s.opacity) {
      const v = fadeRef.current;
      object.traverse((n) => {
        if (!n.material) return;
        n.material.userData.baseTransparent ??= n.material.transparent;
        n.material.transparent = n.material.userData.baseTransparent || v < 1;
        n.material.opacity = v;
        n.material.needsUpdate = true;
      });
      s.opacity = v;
    }
    if (s.action) s.action.paused = reducedMotion();
    mixer.update(dt);
    if (atlas) {
      const face = object.getObjectByName("face");
      const i = atlas.frames[cmd.face] ?? atlas.frames[atlas.defaultFrame];
      if (face?.material?.map) face.material.map.offset.set((i % atlas.cols) / atlas.cols, Math.floor(i / atlas.cols) / atlas.rows);
    }
    if (stage && anchorId && root.current) {
      const top = new THREE.Vector3();
      root.current.getWorldPosition(top);
      top.y += new THREE.Box3().setFromObject(root.current).getSize(new THREE.Vector3()).y * 1.05;
      stage.anchors.set(anchorId, top);
    }
  });

  useEffect(() => () => { if (anchorId) stage?.anchors.delete(anchorId); }, [stage, anchorId]);

  return (
    <group
      ref={root}
      position={position}
      scale={scale}
      onClick={onSelect ? (e) => { e.stopPropagation(); onSelect(anchorId); } : undefined}
      onPointerOver={onSelect ? () => { document.body.style.cursor = "pointer"; } : undefined}
      onPointerOut={onSelect ? () => { document.body.style.cursor = ""; } : undefined}
      userData={{ selected }}
    >
      <primitive object={object} />
    </group>
  );
}

/** Lives inside <Canvas>. `stage` is a shared mutable {anchors, camera, size} the chip layer reads.
 *  The backdrop is procedural, so it sits outside the Suspense that waits for panda.glb. */
export function Den(props) {
  return (
    <>
      <Backdrop />
      <TallyFace face={props.tallyFace} onOpen={props.onOpenTally} stage={props.stage} />
      <FiguresBoundary>
        <Suspense fallback={null}>
          <DenFigures {...props} />
        </Suspense>
      </FiguresBoundary>
    </>
  );
}

// A failed panda.glb load throws from useLoader; without a boundary React unmounts the whole app.
// The figures drop out and the backdrop stays.
class FiguresBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err) {
    console.error("Den figures failed to load:", err);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function DenFigures({ cells, baskets, handoffs, selected, onSelect, stage }) {
  const gltf = useLoader(GLTFLoader, "/models/panda.glb");
  const director = useDirector();
  const { camera, size } = useThree();
  useEffect(() => {
    stage.camera = camera;
    stage.size = size;
  }, [stage, camera, size]);
  // Bao's rest-pose feet sit at his box minimum; a plush's origin is its centre, so lift by its half height.
  const footLift = useMemo(() => -new THREE.Box3().setFromObject(gltf.scene).min.y * PLUSH_SCALE, [gltf]);
  const counts = useMemo(() => {
    const n = {};
    for (const c of cells) n[stationOf(c.cellType)] = (n[stationOf(c.cellType)] ?? 0) + 1;
    for (const type of ROAMER_TYPES) {
      if (cells.some((c) => c.cellType === type)) continue;
      const station = stationOf(type);
      n[station] = (n[station] ?? 0) + 1;
    }
    return n;
  }, [cells]);
  // One panda per type remains at its station even without active work. Further cells stand at
  // their normal slots. Idle types take an unused slot, so Developer and Scout never stack up.
  const firstOf = {};
  for (const c of cells) if (ROAMER_TYPES.includes(c.cellType) && !firstOf[c.cellType]) firstOf[c.cellType] = c;
  const placed = (c) => {
    const { station, slot } = parsePerch(c.perch);
    const at = placeCell(c.cellType, slot, counts[station]);
    return { at, station };
  };
  const occupied = {};
  for (const c of cells) {
    const { station, slot } = parsePerch(c.perch);
    (occupied[station] ??= new Set()).add(slot);
  }
  const idlePlaces = {};
  for (const type of ROAMER_TYPES) {
    if (firstOf[type]) continue;
    const station = stationOf(type);
    const taken = occupied[station] ??= new Set();
    let slot = 0;
    while (taken.has(slot)) slot++;
    taken.add(slot);
    idlePlaces[type] = { station, at: placeCell(type, slot, counts[station]) };
  }
  return (
    <>
      <Market baskets={baskets} handoffs={handoffs} cells={cells} counts={counts} />
      <Figure id="bao" gltf={gltf} director={director} pose="idle" position={BAO.position} scale={BAO.scale} stage={null} />
      {ROAMER_TYPES.map((type) => (
        <RoamFigure
          key={type}
          type={type}
          cell={firstOf[type]}
          place={firstOf[type] ? placed(firstOf[type]) : idlePlaces[type]}
          handoffs={handoffs}
          gltf={gltf}
          director={director}
          footLift={footLift}
          selected={selected}
          onSelect={onSelect}
          stage={stage}
        />
      ))}
      {cells.filter((c) => firstOf[c.cellType] !== c).map((c) => {
        const { at } = placed(c);
        const p = [at.x, at.y + footLift, at.z];
        return (
          <Figure
            key={c.ref}
            id={c.ref}
            gltf={gltf}
            director={director}
            pose={c.pose}
            cellType={c.cellType}
            position={p}
            scale={PLUSH_SCALE}
            lod
            selected={selected === c.ref}
            onSelect={c.synthetic ? undefined : onSelect}
            stage={stage}
          />
        );
      })}
    </>
  );
}

// Idle and working pandas stay at their slots. A source panda leaves only for a handoff and returns.
function RoamFigure({ type, cell, place, handoffs, gltf, director, footLift, selected, onSelect, stage }) {
  const outer = useRef();
  const cargo = useRef();
  const fade = useRef(1);
  const motion = useRef(undefined);
  const [pose, setPose] = useState("idle");
  const inputs = useRef({});
  inputs.current = { cell, place, handoffs };
  useFrame((state, dt) => {
    const { cell: c, place: pl, handoffs: events } = inputs.current;
    const now = performance.now() / 1000;
    const slot = pl ? { x: pl.at.x, y: pl.at.y, z: pl.at.z } : null;
    const next = stepRoamer(motion.current, {
      seed: type, slot, working: Boolean(c), handoffs: events,
      now, dt: Math.min(dt, 0.1), reduced: reducedMotion(),
    });
    motion.current = next;
    fade.current = next.opacity;
    if (cargo.current) cargo.current.visible = next.phase === "handoff";
    const bob = next.moving && next.y === 0 ? Math.abs(Math.sin(now * 7)) * 0.04 : 0;
    if (outer.current) {
      outer.current.position.set(next.x, next.y + bob, next.z);
      outer.current.rotation.y = next.heading;
      outer.current.userData.motion = { phase: next.phase, moving: next.moving, handoff: next.handoff?.ref };
    }
    const want = next.phase === "working" && c ? c.pose : "idle";
    setPose((p) => (p === want ? p : want));
  });
  return (
    <group ref={outer} name={`station-panda:${type}`}>
      <mesh ref={cargo} visible={false} position={[0, footLift + 0.1, 0.3]}>
        <cylinderGeometry args={[0.13, 0.11, 0.12, 12]} />
        <meshStandardMaterial color="#d9c08a" />
      </mesh>
      <Figure
        id={`roam:${type}`}
        anchorId={cell?.ref ?? null}
        gltf={gltf}
        director={director}
        pose={pose}
        cellType={type}
        position={[0, footLift, 0]}
        scale={PLUSH_SCALE}
        lod
        selected={Boolean(cell) && selected === cell.ref}
        onSelect={cell && !cell.synthetic ? onSelect : undefined}
        stage={stage}
        fadeRef={fade}
      />
    </group>
  );
}
