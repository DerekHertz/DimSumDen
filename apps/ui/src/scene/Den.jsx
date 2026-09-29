// Renderer for the SceneCell list (ADR 0011 decision 7): Bao seated at the centre, one plush per
// cell at its perch. Poses come from the character director; nothing new is animated.
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import { createCharacterDirector } from "../../../../packages/character-director/src/director.mjs";
import { PROP_ASSETS } from "../assets/panda-contract.mjs";
import { averageAttribute, clusterSimplify } from "./plush-lod.mjs";
import { createAssetCache } from "./asset-cache.mjs";

// Each prop glb is fetched and parsed once, then cloned per plush.
const props = createAssetCache((url) => new GLTFLoader().loadAsync(url));

const PLUSH_SCALE = 0.3;
// Perch anchors as fractions of Bao's bounding box (x of width, y of height, z of depth).
const ANCHORS = {
  crown: [[0, 1.02, 0], [-0.4, 0.96, 0], [0.4, 0.96, 0]],
  shoulder: [[-0.55, 0.72, 0.1], [0.55, 0.72, 0.1], [-0.7, 0.62, 0.1]],
  knee: [[-0.4, 0.3, 0.6], [0.4, 0.3, 0.6]],
  grass: [[-1.1, 0, 0.7], [-0.75, 0, 0.9], [0.75, 0, 0.9], [1.1, 0, 0.7], [-1.4, 0, 0.4], [1.4, 0, 0.4]],
};

export function anchorFor(perch, bbox) {
  const [region, slotText] = perch.split("#");
  let list = ANCHORS[region] ?? ANCHORS.grass;
  let slot = Number(slotText);
  if (slot >= list.length) {
    slot -= list.length;
    list = ANCHORS.grass;
  }
  const [fx, fy, fz] = list[slot % list.length];
  const size = bbox.getSize(new THREE.Vector3());
  const c = bbox.getCenter(new THREE.Vector3());
  return new THREE.Vector3(c.x + fx * size.x, bbox.min.y + fy * size.y, c.z + fz * size.z);
}

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
  const groups = new Int32Array(pos.count);
  if (joints && weights) {
    for (let v = 0; v < pos.count; v++) {
      let best = 0;
      for (let k = 1; k < 4; k++) if (weights.getComponent(v, k) > weights.getComponent(v, best)) best = k;
      groups[v] = joints.getComponent(v, best);
    }
  }
  const { keep, remap, index } = clusterSimplify({ positions: pos.array, index: geometry.index.array, groups });
  const out = new THREE.BufferGeometry();
  for (const [name, attr] of Object.entries(geometry.attributes)) {
    const size = attr.itemSize;
    let array;
    if (name === "position" || name === "normal") {
      array = averageAttribute(attr.array, size, remap, keep.length);
    } else if (name === "color") {
      // Averaged, so the fur colour does not turn speckled; stored back in the source's integer type.
      array = attr.array.constructor.from(averageAttribute(attr.array, size, remap, keep.length), Math.round);
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
  if (geometry.getAttribute("position").count < LOD_MIN_VERTICES || !geometry.index) return geometry;
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
        if (n.material.map) n.material.map = n.material.map.clone();
      }
    });
    return o;
  }, [gltf, lod]);
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
    props.get(`/models/${spec.file}`).then((p) => {
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

/** Lives inside <Canvas>. `stage` is a shared mutable {anchors, camera, size} the chip layer reads. */
export function Den({ cells, selected, onSelect, stage }) {
  const gltf = useLoader(GLTFLoader, "/models/panda.glb");
  const director = useDirector();
  const { camera, size } = useThree();
  useEffect(() => {
    stage.camera = camera;
    stage.size = size;
  }, [stage, camera, size]);
  const bbox = useMemo(() => new THREE.Box3().setFromObject(gltf.scene), [gltf]);
  return (
    <>
      <Figure id="bao" gltf={gltf} director={director} pose="idle" position={[0, 0, 0]} scale={1} stage={null} />
      {cells.map((c) => {
        const p = anchorFor(c.perch, bbox);
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
