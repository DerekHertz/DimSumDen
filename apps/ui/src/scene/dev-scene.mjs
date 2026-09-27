// Ticket 04: wires the character director to one cell in a running three.js scene. The director
// (packages/character-director) is renderer-free; this module is the thin adapter ADR 0007
// assigns to apps/ui — it owns the R3F/three scene graph, the AnimationMixer and applying the
// director's sampled commands to the mesh. A mock state source's dev control switches the cell's
// state; the state's icon and word are always shown alongside the pose.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { STATES, createCharacterDirector } from "../../../../packages/character-director/src/director.mjs";
import { createMockStateSource } from "../../../../packages/character-director/src/mock-state-source.mjs";

// Icon + word for each state (spec.md story 28: state is never shown by motion alone).
const STATE_LABEL = {
  idle: { icon: "💤", word: "idle" },
  working: { icon: "🛠️", word: "working" },
  waiting_on_user: { icon: "✋", word: "waiting on user" },
  blocked: { icon: "🚧", word: "blocked" },
  done: { icon: "✅", word: "done" },
  failed: { icon: "❌", word: "failed" },
  throttled: { icon: "⏳", word: "throttled" },
  terminated: { icon: "👋", word: "terminated" },
};

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
const cellEmoji = document.getElementById("cell-emoji");
const showStateLabel = (state) => {
  const label = STATE_LABEL[state];
  stateIcon.textContent = label.icon;
  stateWord.textContent = label.word;
  cellEmoji.textContent = label.icon;
};

for (const state of STATES) {
  button("states", state, STATE_LABEL[state].word, () => {
    source.setState(CELL_ID, state);
    mark("states", state);
    showStateLabel(state);
  });
}
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

// The floating emoji sits just above the head: projected from the panda's rest-pose bounding box
// each frame, so it stays put as the camera orbits.
const emojiAnchor = new THREE.Vector3(0, new THREE.Box3().setFromObject(panda).max.y + 0.08, 0);
const projected = new THREE.Vector3();
const placeCellEmoji = () => {
  projected.copy(emojiAnchor).project(camera);
  cellEmoji.style.left = `${((projected.x + 1) / 2) * innerWidth}px`;
  cellEmoji.style.top = `${((1 - projected.y) / 2) * innerHeight}px`;
};

const faceNode = panda.getObjectByName("face");
const atlas = gltf.parser.json.nodes.find((n) => n.name === "face").extras.faceAtlas;
const faceMap = faceNode.material.map;
const showFace = (name) => {
  const i = atlas.frames[name] ?? atlas.frames[atlas.defaultFrame];
  faceMap.offset.set((i % atlas.cols) / atlas.cols, Math.floor(i / atlas.cols) / atlas.rows);
};

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
  placeCellEmoji();
  renderer.render(scene, camera);
});
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
