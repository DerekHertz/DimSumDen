// Ticket 04: wires the character director to one cell in a running three.js scene. The director
// (packages/character-director) is renderer-free; this module is the thin adapter ADR 0007
// assigns to apps/ui — it owns the R3F/three scene graph, the AnimationMixer and applying the
// director's sampled commands to the mesh. A mock state source's dev control switches the cell's
// state; the state's icon and word are always shown alongside the pose.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { STATES, HABIT_LOOPS, createCharacterDirector } from "../../../../packages/character-director/src/director.mjs";
import { createMockStateSource } from "../../../../packages/character-director/src/mock-state-source.mjs";
import { PROP_ASSETS } from "../assets/panda-contract.mjs";

// Icon + word for each state (spec.md story 28: state is never shown by motion alone). Icons are
// line glyphs on a 24 grid (round caps, currentColor; the design system rules out emoji), drawn
// from grove motifs: lotus (still), ink brush (at work), paper lantern (waiting on you), shut
// door with knockers (blocked), seal chop 成 (done), cracked bowl (failed), incense burner
// (throttled), willow sprig, the farewell gift (terminated).
const STATE_LABEL = {
  idle: {
    word: "idle",
    icon: '<path d="M12 5.5c2 2.5 2 7.5 0 10.5-2-3-2-8 0-10.5z"/><path d="M12 16c-3.2 0-6-2.2-7-6 3.2 0 5.8 2.2 7 6z"/><path d="M12 16c3.2 0 6-2.2 7-6-3.2 0-5.8 2.2-7 6z"/><path d="M5 19.5h14"/>',
  },
  working: {
    word: "working",
    icon: '<path d="M17 2.5l3.5 3.5-5 5-3.5-3.5z"/><path d="M12 7.5l3.5 3.5-3.3 3.3c-1.9 1.9-4.8 2.6-7.7 3.2.6-2.9 1.3-5.8 3.2-7.7z"/><path d="M9.5 10l3.5 3.5"/><path d="M3.5 21.5c2.5-.9 5.5-1 8-.3"/>',
  },
  waiting_on_user: {
    word: "waiting on user",
    icon: '<path d="M12 2v2.5"/><path d="M8 5.5h8c2.2 1.6 3.2 3.8 3.2 6.25S18.2 16.4 16 18H8c-2.2-1.6-3.2-3.8-3.2-6.25S5.8 7.1 8 5.5z"/><path d="M12 5.5V18"/><path d="M9 6c-1.2 3.4-1.2 8.6 0 12M15 6c1.2 3.4 1.2 8.6 0 12"/><path d="M10.5 18v1.5h3V18M12 19.5V22"/>',
  },
  blocked: {
    word: "blocked",
    icon: '<path d="M5.5 20.5V11a6.5 6.5 0 0 1 13 0v9.5"/><path d="M3.5 20.5h17"/><path d="M12 4.5v16"/><circle cx="9.8" cy="13" r="1.2"/><circle cx="14.2" cy="13" r="1.2"/>',
  },
  done: {
    word: "done",
    icon: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><text x="12" y="16.6" text-anchor="middle" font-size="12" stroke="none" fill="currentColor" font-family="\'ZCOOL KuaiLe\', \'Noto Sans SC\', \'Microsoft YaHei\', sans-serif">成</text>',
  },
  failed: {
    word: "failed",
    icon: '<path d="M3.5 10.5h17c0 5-3.8 8.5-8.5 8.5s-8.5-3.5-8.5-8.5z"/><path d="M9 21h6"/><path d="M12.5 10.5l-1.6 2.6 2 1.6-1.2 2.8"/><path d="M18 5.5l2.5 1.5-2 1.5z"/>',
  },
  throttled: {
    word: "throttled",
    icon: '<path d="M12 14.5V6"/><path d="M12 4c-1-1 .8-1.6 0-2.5"/><path d="M5.5 14.5h13l-1.6 4.5H7.1z"/><path d="M8.5 19l-.8 2.5M15.5 19l.8 2.5"/>',
  },
  terminated: {
    word: "terminated",
    icon: '<path d="M4.5 3.5c5.5.8 9.5 5.2 10.5 12.5"/><path d="M8 4.8c.3 2.2-.4 4-1.6 5.2"/><path d="M11 7.2c.4 2.3-.3 4.3-1.5 5.6"/><path d="M13.4 10.4c.5 2.3 0 4.4-1.1 5.8"/><path d="M15 16c.9 1.8.9 3.8.2 5.3"/>',
  },
};
const iconSvg = (state) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${STATE_LABEL[state].icon}</svg>`;

const CELL_ID = "cell-1";

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(getComputedStyle(document.body).backgroundColor);
const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.1, 100);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.1, 0);
camera.position.set(0, 0.3, 7.5);
controls.update();
scene.add(new THREE.HemisphereLight(0xfff6e8, 0x6b7a5a, 2.0));
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(3, 6, 6);
scene.add(sun);

const mark = (group, name) => {
  for (const b of document.querySelectorAll(`#${group} button`)) b.setAttribute("aria-pressed", String(b.dataset.value === name));
};
const button = (group, value, label, onClick) => {
  const b = document.createElement("button");
  b.textContent = label;
  b.dataset.value = value;
  b.setAttribute("aria-pressed", "false");
  b.addEventListener("click", onClick);
  document.getElementById(group).appendChild(b);
};

const source = createMockStateSource();
const director = createCharacterDirector();
source.subscribe((event) => director.setState(event.cell_id, event.state, performance.now() / 1000));

const stateWord = document.getElementById("state-word");
const stateIcon = document.getElementById("state-icon");
const emoteBubble = document.getElementById("emote-bubble");
const showStateLabel = (state) => {
  stateIcon.innerHTML = iconSvg(state);
  stateWord.textContent = STATE_LABEL[state].word;
  emoteBubble.innerHTML = iconSvg(state);
  emoteBubble.dataset.state = state;
  document.getElementById("state-badge").dataset.state = state;
};

for (const state of STATES) {
  button("states", state, STATE_LABEL[state].word, () => {
    source.setState(CELL_ID, state);
    mark("states", state);
    showStateLabel(state);
  });
}

// Ticket 07: a working Brain-type cell loops its own habit clip with its prop, held at the prop's
// socket (spec.md "Per-type idle habits", "Props and hats are separate assets attached to sockets
// by name"). "generic" carries no prop and just breathes, matching every type without a habit yet.
let cellType = null;
for (const type of ["generic", ...Object.keys(HABIT_LOOPS)]) {
  button("cell-types", type, type, () => {
    cellType = type === "generic" ? undefined : type;
    director.setCellType(CELL_ID, cellType);
    mark("cell-types", type);
    applyProp(cellType);
    // The habit only shows while working (mappingFor only substitutes it for that state), so
    // switching type jumps straight to "working" — otherwise picking a type is a no-op until the
    // tester separately clicks "working", and the point of this control is to show the habit.
    source.setState(CELL_ID, "working");
    mark("states", "working");
    showStateLabel("working");
  });
}
mark("cell-types", "generic");

let reducedMotionOn = false;
button("reduced-motion", "on", "reduced motion", () => {
  reducedMotionOn = !reducedMotionOn;
  director.setReducedMotion(reducedMotionOn);
  mark("reduced-motion", reducedMotionOn ? "on" : "");
});

const gltf = await new GLTFLoader().loadAsync("../../public/models/panda.glb");
const panda = gltf.scene;
scene.add(panda);
const mixer = new THREE.AnimationMixer(panda);

// The emote bubble (design system, cell-types.md "Emote bubbles") sits just above the head:
// projected from the panda's rest-pose bounding box each frame, so it follows the camera orbit.
const bubbleAnchor = new THREE.Vector3(0, new THREE.Box3().setFromObject(panda).max.y + 0.08, 0);
const projected = new THREE.Vector3();
const placeEmoteBubble = () => {
  projected.copy(bubbleAnchor).project(camera);
  emoteBubble.style.left = `${((projected.x + 1) / 2) * innerWidth}px`;
  emoteBubble.style.top = `${((1 - projected.y) / 2) * innerHeight}px`;
};

const faceNode = panda.getObjectByName("face");
const atlas = gltf.parser.json.nodes.find((n) => n.name === "face").extras.faceAtlas;
const faceMap = faceNode.material.map;
const showFace = (name) => {
  const i = atlas.frames[name] ?? atlas.frames[atlas.defaultFrame];
  faceMap.offset.set((i % atlas.cols) / atlas.cols, Math.floor(i / atlas.cols) / atlas.rows);
};

// Ticket 07: props/hats are separate assets (spec.md "Export"), attached to a socket bone by name
// so they follow the paw or head through every clip instead of being baked into panda.glb. Loaded
// lazily and cached, since a cell may never wear one.
const propLoader = new GLTFLoader();
const propCache = new Map();
let attachedProp = null;
async function applyProp(type) {
  const spec = type && PROP_ASSETS[type];
  if (attachedProp) {
    attachedProp.parent?.remove(attachedProp);
    attachedProp = null;
  }
  if (!spec) return;
  let propScene = propCache.get(spec.file);
  if (!propScene) {
    const propGltf = await propLoader.loadAsync(`../../public/models/${spec.file}`);
    propScene = propGltf.scene;
    propCache.set(spec.file, propScene);
  }
  const socket = panda.getObjectByName(spec.socket);
  if (!socket) throw new Error(`socket "${spec.socket}" not found on the panda rig`);
  const instance = propScene.clone(true);
  socket.add(instance);
  attachedProp = instance;
}

const clipsByName = new Map(gltf.animations.map((c) => [c.name, c]));
let currentAction = null;
let currentClipName = null;
let currentlyLooping = null;

// Applies one tick's command to the mixer: switches clip on change (cross-fading for dur-fast, per
// the director's immediate-interrupt rule), and holds the first frame when reduced motion is on
// (a loop clip and its held pose can be the same clip name, so a loop-flag flip alone must also
// re-apply, not just a clip-name change).
function applyCommand(cmd) {
  if (cmd.clip !== currentClipName || cmd.loop !== currentlyLooping) {
    const clip = clipsByName.get(cmd.clip);
    const next = mixer.clipAction(clip);
    next.reset();
    next.setLoop(cmd.loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
    next.clampWhenFinished = !cmd.loop;
    if (currentAction && currentAction !== next) {
      // Without a cross-fade (reduced motion, or an entry settling into its loop) the old action must
      // stop, or it stays blended under the new pose.
      if (cmd.crossFade > 0) next.crossFadeFrom(currentAction, cmd.crossFade, false);
      else currentAction.stop();
    }
    next.play();
    next.paused = reducedMotionOn; // reduced motion: a still held pose; otherwise clips play (one-shot or loop)
    currentAction = next;
    currentClipName = cmd.clip;
    currentlyLooping = cmd.loop;
  }
  showFace(cmd.face);
}

// Idle is the director's default state before any dev control click; reflect it in the HUD too.
mark("states", "idle");
showStateLabel("idle");

const status = document.getElementById("status");
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const now = performance.now() / 1000;
  mixer.update(clock.getDelta());
  const cmd = director.tick(CELL_ID, now);
  applyCommand(cmd);
  status.textContent = `clip=${cmd.clip}  face=${cmd.face}  loop=${cmd.loop}  crossFade=${cmd.crossFade}`;
  controls.update();
  placeEmoteBubble();
  renderer.render(scene, camera);
});
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
