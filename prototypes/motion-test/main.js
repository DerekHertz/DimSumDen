// PROTOTYPE (ticket 01, throwaway). Bare three.js motion test: loads the rigged panda,
// maps each cell state to a rough clip, and plays hop and waddle travel between perches.
// The real mapping belongs in packages/character-director (ADR 0007); this is inline on purpose.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const DUR = { fast: 0.16, base: 0.24, heartbeat: 1.2, breath: 2.8 }; // design tokens, seconds
const CELL_SCALE = 1.0; // model half-height: the plush origin is its centre, so cells sit at surface + CELL_SCALE
const HOP_AIR = [8 / 30, 24 / 30]; // seconds into the hop clip where the feet leave and touch down
const WADDLE_SPEED = 0.6; // units per second, about two steps per waddle loop
const TURN = 0.3; // seconds to turn toward or away from the travel direction
const DWELL = 1.2; // seconds the demo rests on each perch before the next move

// Rough state → clip map. Every state is also shown by its word and glyph (never motion alone).
const STATES = [
  { id: "idle", glyph: "○", clip: "sit_still", opacity: 0.55 },
  { id: "working", glyph: "◠", clip: "breathe" },
  { id: "waiting_on_user", glyph: "🔔", clip: "paw_raise" },
  { id: "blocked", glyph: "⛔", clip: "arms_folded" },
  { id: "done", glyph: "✓", clip: "lean_back" },
  { id: "failed", glyph: "⚠", clip: "slump" },
  { id: "throttled", glyph: "⌛", clip: "doze" },
  { id: "terminated", glyph: "⋯", clip: "wave", once: true, then: "sit_still", opacity: 0.28 },
];

const PERCHES = {
  A: { pos: new THREE.Vector3(-2.6, 0, 0.8), region: "grass" },
  B: { pos: new THREE.Vector3(-0.4, 0, 0.8), region: "grass" },
  C: { pos: new THREE.Vector3(2.4, 0.9, -0.2), region: "knee" },
};

// ---------- scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const dark = matchMedia("(prefers-color-scheme: dark)").matches;
scene.background = new THREE.Color(dark ? 0x111418 : 0xefe8d8);
const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0.5, 3.2, 10);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.9, 0);
controls.update();

scene.add(new THREE.HemisphereLight(0xfff6e8, 0x6b7a5a, 1.6));
const sun = new THREE.DirectionalLight(0xffffff, 1.8);
sun.position.set(3, 8, 5);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 });
scene.add(sun);

const ground = new THREE.Mesh(new THREE.CircleGeometry(9, 48), new THREE.MeshStandardMaterial({ color: 0x9fbf7f, roughness: 1 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);
const stump = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, 0.9, 32), new THREE.MeshStandardMaterial({ color: 0xc9b48f, roughness: 1 }));
stump.position.set(PERCHES.C.pos.x, 0.45, PERCHES.C.pos.z);
stump.castShadow = stump.receiveShadow = true;
scene.add(stump);
for (const [key, p] of Object.entries(PERCHES)) {
  const pad = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.62, 40), new THREE.MeshBasicMaterial({ color: 0x006c71 }));
  pad.rotation.x = -Math.PI / 2;
  pad.position.copy(p.pos).y += 0.01;
  scene.add(pad);
  p.key = key;
}

// ---------- panda ----------
const hud = document.getElementById("status");
const gltf = await new GLTFLoader().loadAsync("./panda-motion-test.glb");
const panda = gltf.scene;
scene.add(panda);
const materials = [];
const depthPrepasses = []; // when faded, draw depth first so only the front surface of the one-piece mesh shows
panda.traverse((o) => {
  if (o.isSkinnedMesh && !o.userData.prepass) {
    o.castShadow = true;
    o.frustumCulled = false; // skinned bounds don't follow the pose
    o.material.roughness = 0.9;
    materials.push(o.material);
    const pre = o.clone();
    pre.userData.prepass = true;
    pre.material = new THREE.MeshBasicMaterial({ colorWrite: false });
    pre.renderOrder = 1; // after the other opaque objects, so the scene behind still shows through
    pre.castShadow = false;
    pre.visible = false;
    depthPrepasses.push([o, pre]);
  }
});
for (const [o, pre] of depthPrepasses) o.parent.add(pre);
const skeleton = new THREE.SkeletonHelper(panda);
skeleton.visible = false;
scene.add(skeleton);

const mixer = new THREE.AnimationMixer(panda);
const actions = Object.fromEntries(gltf.animations.map((c) => [c.name, mixer.clipAction(c)]));
let current = null;

function play(name, { once = false, fade = DUR.fast } = {}) {
  const next = actions[name];
  next.reset();
  next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
  next.clampWhenFinished = once;
  next.play();
  if (current && current !== next) current.crossFadeTo(next, fade, false);
  current = next;
}

// ---------- state ----------
let state = STATES[0];
let perch = PERCHES.A;
let travel = null;
const queue = [];
let dwell = 0;
let opacity = 1;

function setState(s) {
  state = s;
  if (!travel) playState();
  renderButtons();
}

function playState(fade = DUR.fast) {
  play(state.clip, { once: !!state.once, fade });
}

mixer.addEventListener("finished", (e) => {
  if (!travel && state.once && e.action === actions[state.clip]) play(state.then, { fade: DUR.base });
});

// ---------- travel (procedural root motion over in-place clips) ----------
const yawToward = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
const smooth = (t) => t * t * (3 - 2 * t);
const clamp01 = (t) => Math.min(1, Math.max(0, t));

function travelTo(key) {
  const to = PERCHES[key];
  if (travel || to === perch) return;
  const mode = to.region === perch.region ? "waddle" : "hop";
  const dist = Math.hypot(to.pos.x - perch.pos.x, to.pos.z - perch.pos.z);
  travel = { mode, from: perch, to, t: 0, yaw: yawToward(perch.pos, to.pos), walk: dist / WADDLE_SPEED };
  play(mode, { once: mode === "hop", fade: DUR.fast });
  renderButtons();
}

function updateTravel(dt) {
  const tr = travel;
  tr.t += dt;
  const a = tr.from.pos, b = tr.to.pos;
  const pos = new THREE.Vector3();
  let yaw = 0;
  let done = false;
  if (tr.mode === "waddle") {
    const walkEnd = TURN + tr.walk;
    yaw = tr.yaw * (tr.t < TURN ? smooth(tr.t / TURN) : tr.t < walkEnd ? 1 : 1 - smooth(clamp01((tr.t - walkEnd) / TURN)));
    pos.lerpVectors(a, b, clamp01((tr.t - TURN) / tr.walk));
    done = tr.t >= walkEnd + TURN;
  } else {
    const hopLen = actions.hop.getClip().duration;
    const p = smooth(clamp01((tr.t - HOP_AIR[0]) / (HOP_AIR[1] - HOP_AIR[0])));
    const h = 0.6 + Math.abs(b.y - a.y) * 0.6;
    pos.lerpVectors(a, b, p);
    pos.y += h * 4 * p * (1 - p);
    yaw = tr.yaw * (tr.t < HOP_AIR[0] ? smooth(tr.t / HOP_AIR[0]) : tr.t < hopLen ? 1 : 1 - smooth(clamp01((tr.t - hopLen) / TURN)));
    if (tr.t >= hopLen && current === actions.hop) playState(DUR.base);
    done = tr.t >= hopLen + TURN;
  }
  panda.position.set(pos.x, pos.y + CELL_SCALE, pos.z);
  panda.rotation.y = yaw;
  if (done) {
    perch = tr.to;
    travel = null;
    if (current !== actions[state.clip]) playState(DUR.base);
    renderButtons();
    dwell = DWELL;
  }
}

// ---------- UI ----------
const stateRow = document.getElementById("states");
const stateButtons = STATES.map((s) => {
  const b = document.createElement("button");
  b.textContent = `${s.glyph} ${s.id}`;
  b.onclick = () => { stopCycle(); setState(s); };
  stateRow.appendChild(b);
  return b;
});
const cycleBtn = document.getElementById("cycle");
let cycleTimer = null;
function stopCycle() { clearInterval(cycleTimer); cycleTimer = null; renderButtons(); }
cycleBtn.onclick = () => {
  if (cycleTimer) return stopCycle();
  cycleTimer = setInterval(() => { if (!travel) setState(STATES[(STATES.indexOf(state) + 1) % STATES.length]); }, 4000 / speed());
  renderButtons();
};
document.getElementById("waddle").onclick = () => travelTo(perch === PERCHES.A ? "B" : "A");
document.getElementById("hop").onclick = () => travelTo(perch === PERCHES.C ? "B" : "C");
document.getElementById("demo").onclick = () => {
  const route = { A: ["B", "C", "B", "A"], B: ["C", "B", "A"], C: ["B", "A"] }[perch.key];
  queue.push(...route.slice(1));
  travelTo(route[0]);
};
const speedInput = document.getElementById("speed");
const speed = () => Number(speedInput.value);
document.getElementById("bones").onchange = (e) => { skeleton.visible = e.target.checked; };

function renderButtons() {
  stateButtons.forEach((b, i) => b.setAttribute("aria-pressed", String(STATES[i] === state)));
  cycleBtn.setAttribute("aria-pressed", String(!!cycleTimer));
}

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ---------- loop ----------
panda.position.copy(PERCHES.A.pos).y += CELL_SCALE;
setState(STATES[0]);
const clock = new THREE.Clock();
function frame(dt) {
  mixer.update(dt);
  if (travel) updateTravel(dt);
  else if (queue.length && (dwell -= dt) <= 0) travelTo(queue.shift());
  const target = state.opacity ?? 1;
  const next = opacity + (target - opacity) * clamp01(dt / DUR.base);
  if (next !== opacity) {
    opacity = next;
    const faded = opacity < 0.999;
    for (const m of materials) {
      if (m.transparent !== faded) { m.transparent = faded; m.needsUpdate = true; }
      m.opacity = opacity;
    }
    for (const [, pre] of depthPrepasses) pre.visible = faded;
  }
  const clip = travel ? travel.mode : current?.getClip().name;
  hud.textContent = `state  ${state.glyph} ${state.id}\nclip   ${clip}\nperch  ${travel ? `${travel.from.key} → ${travel.to.key}` : perch.key}`;
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(() => frame(Math.min(clock.getDelta(), 0.1) * speed()));
// Debug hook: advance the whole scene by fixed steps (for screenshots when rAF is throttled).
window.motionTest = { camera, controls, advance: (s, step = 1 / 60) => { for (let t = 0; t < s; t += step) frame(step); } };
