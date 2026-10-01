// organism-infra/94: lightenScene turns draw calls into no-ops and paces animation frames, nothing else.
// The init script is evaluated against a fake window, so this needs no browser.
import { test } from "node:test";
import assert from "node:assert/strict";
import { installLightScene, lightenScene, LIGHT_SCENE_DEFAULTS } from "./light-scene.mjs";

const DRAWS = ["drawArrays", "drawElements", "drawArraysInstanced", "drawElementsInstanced", "drawRangeElements"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function fakeWindow() {
  const frames = new Map();
  let next = 100;
  const gl = (extra) => {
    const calls = [];
    class Ctx {}
    for (const name of [...extra, "clear", "useProgram"]) Ctx.prototype[name] = function (...a) { calls.push([name, ...a]); };
    return { Ctx, calls };
  };
  const gl1 = gl(["drawArrays", "drawElements"]);
  const gl2 = gl(DRAWS);
  return {
    frames,
    gl1,
    gl2,
    WebGLRenderingContext: gl1.Ctx,
    WebGL2RenderingContext: gl2.Ctx,
    requestAnimationFrame(cb) { const id = next++; frames.set(id, cb); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
    flushFrames(time = 1) { for (const [id, cb] of [...frames]) { frames.delete(id); cb(time); } },
  };
}

function install(win, options) {
  globalThis.window = win;
  try { installLightScene({ skipDraws: false, frameDelayMs: 0, ...options }); } finally { delete globalThis.window; }
}

test("skipDraws makes every draw call a no-op on both WebGL versions and leaves other GL calls working", () => {
  const win = fakeWindow();
  install(win, { skipDraws: true });
  const g1 = new win.WebGLRenderingContext();
  const g2 = new win.WebGL2RenderingContext();
  for (const call of ["drawArrays", "drawElements"]) g1[call](4, 0, 3);
  for (const call of DRAWS) g2[call](4, 0, 3);
  g1.clear(16384);
  g2.useProgram({});
  assert.deepEqual(win.gl1.calls, [["clear", 16384]], "WebGL1: only the non-draw call went through");
  assert.deepEqual(win.gl2.calls, [["useProgram", {}]], "WebGL2: only the non-draw call went through");
});

test("without skipDraws the draw calls still reach the browser", () => {
  const win = fakeWindow();
  install(win, { skipDraws: false });
  new win.WebGL2RenderingContext().drawElements(4, 6, 5123, 0);
  assert.deepEqual(win.gl2.calls, [["drawElements", 4, 6, 5123, 0]]);
});

test("a window without WebGL is left alone", () => {
  const win = fakeWindow();
  delete win.WebGLRenderingContext;
  delete win.WebGL2RenderingContext;
  assert.doesNotThrow(() => install(win, { skipDraws: true }));
});

test("a frame request is held back for the delay, then reaches the browser's own rAF once", async () => {
  const win = fakeWindow();
  install(win, { frameDelayMs: 30 });
  const seen = [];
  win.requestAnimationFrame((t) => seen.push(t));
  assert.equal(win.frames.size, 0, "nothing is handed to the real rAF before the delay");
  await sleep(70);
  assert.equal(win.frames.size, 1, "after the delay the real rAF holds the callback");
  win.flushFrames(42);
  assert.deepEqual(seen, [42], "the callback runs once with the frame timestamp");
});

test("frameDelayMs 0 leaves requestAnimationFrame untouched", () => {
  const win = fakeWindow();
  const original = win.requestAnimationFrame;
  install(win, { frameDelayMs: 0 });
  assert.equal(win.requestAnimationFrame, original);
});

test("cancelAnimationFrame works both before the delay ends and after the real rAF was queued", async () => {
  const win = fakeWindow();
  install(win, { frameDelayMs: 30 });
  const ran = [];
  const early = win.requestAnimationFrame(() => ran.push("early"));
  win.cancelAnimationFrame(early);
  const late = win.requestAnimationFrame(() => ran.push("late"));
  await sleep(70);
  win.cancelAnimationFrame(late);
  win.flushFrames();
  await sleep(70);
  win.flushFrames();
  assert.deepEqual(ran, []);
  assert.equal(win.frames.size, 0);
});

test("ids are unique and callbacks keep their request order", async () => {
  const win = fakeWindow();
  install(win, { frameDelayMs: 10 });
  const order = [];
  const a = win.requestAnimationFrame(() => order.push("a"));
  const b = win.requestAnimationFrame(() => order.push("b"));
  assert.notEqual(a, b);
  await sleep(50);
  win.flushFrames();
  assert.deepEqual(order, ["a", "b"]);
});

test("a callback that requests the next frame keeps the loop going", async () => {
  const win = fakeWindow();
  install(win, { frameDelayMs: 10 });
  let count = 0;
  const loop = () => { count++; if (count < 3) win.requestAnimationFrame(loop); };
  win.requestAnimationFrame(loop);
  for (let i = 0; i < 3; i++) { await sleep(50); win.flushFrames(); }
  assert.equal(count, 3);
});

test("lightenScene installs the script on a context or page with the defaults, and options override them", async () => {
  const calls = [];
  const target = { addInitScript: async (fn, arg) => calls.push([fn, arg]) };
  await lightenScene(target);
  assert.equal(calls[0][0], installLightScene);
  assert.deepEqual(calls[0][1], LIGHT_SCENE_DEFAULTS);
  assert.deepEqual(LIGHT_SCENE_DEFAULTS, { skipDraws: true, frameDelayMs: 100 });
  await lightenScene(target, { skipDraws: false });
  assert.deepEqual(calls[1][1], { skipDraws: false, frameDelayMs: 100 });
});
