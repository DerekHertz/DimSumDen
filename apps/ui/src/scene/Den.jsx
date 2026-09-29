// Renderer for the SceneCell list (ADR 0011 decision 7) in the banquet market layout (ADR 0013):
// Bao hosts at the back, one plush per cell at its station slot, a lazy susan of baskets on the
// table (one per frontier ticket). Poses come from the character director; placement is pure
// (banquet-layout.mjs). Only the lazy susan turns.
import { Component, Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import { createCharacterDirector } from "../../../../packages/character-director/src/director.mjs";
import { PROP_ASSETS } from "../assets/panda-contract.mjs";
import { averageAttribute, clusterSimplify, dominantBones } from "./plush-lod.mjs";
import { createAssetCache } from "./asset-cache.mjs";
import { Backdrop } from "./Backdrop.jsx";
import { Market } from "./Market.jsx";
import { BAO, parsePerch, placeCell, stationOf } from "./banquet-layout.mjs";

// Each prop glb is fetched and parsed once, then cloned per plush.
const propGlbs = createAssetCache((url) => new GLTFLoader().loadAsync(url));

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

function Figure({ id, gltf, director, pose, cellType, position, scale, lod, selected, onSelect, stage }) {
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

  useEffect(() => {
    const spec = cellType && PROP_ASSETS[cellType];
    if (!spec) return undefined;
    let added = null;
    let cancelled = false;
    propGlbs.get(`/models/${spec.file}`).then((p) => {
      const socket = object.getObjectByName(spec.socket);
      if (cancelled || !socket) return;
      added = p.scene.clone(true);
      socket.add(added);
    }).catch(() => {});
    return () => {
      cancelled = true;
      added?.parent?.remove(added);
    };
  }, [object, cellType]);

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
    if (s.action) s.action.paused = reducedMotion();
    mixer.update(dt);
    if (atlas) {
      const face = object.getObjectByName("face");
      const i = atlas.frames[cmd.face] ?? atlas.frames[atlas.defaultFrame];
      if (face?.material?.map) face.material.map.offset.set((i % atlas.cols) / atlas.cols, Math.floor(i / atlas.cols) / atlas.rows);
    }
    if (stage && root.current) {
      const top = new THREE.Vector3();
      root.current.getWorldPosition(top);
      top.y += new THREE.Box3().setFromObject(root.current).getSize(new THREE.Vector3()).y * 1.05;
      stage.anchors.set(id, top);
    }
  });

  useEffect(() => () => stage?.anchors.delete(id), [stage, id]);

  return (
    <group
      ref={root}
      position={position}
      scale={scale}
      onClick={onSelect ? (e) => { e.stopPropagation(); onSelect(id); } : undefined}
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
    return n;
  }, [cells]);
  return (
    <>
      <Market baskets={baskets} handoffs={handoffs} cells={cells} counts={counts} />
      <Figure id="bao" gltf={gltf} director={director} pose="idle" position={BAO.position} scale={BAO.scale} stage={null} />
      {cells.map((c) => {
        const { station, slot } = parsePerch(c.perch);
        const at = placeCell(c.cellType, slot, counts[station]);
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
            onSelect={onSelect}
            stage={stage}
          />
        );
      })}
    </>
  );
}
