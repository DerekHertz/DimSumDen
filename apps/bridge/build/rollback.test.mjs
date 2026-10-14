// den-mvp/11 (ADR 0026 decisions 7 and 8): roll back, the snapshot's `build` key, the `build` frame, and the recovery page.
//   POST /build/rollback { to }   (token-gated) -> 200 { build } | 409 { error } when `to` is not the previous release
//   snapshot key `build`: { live: { sha, at }, previous: { sha } | null, rolledBack: { sha, at } | null } | null
//   change frame { type: "build", build } on every switch
//   GET /recover, GET /recover/script: the bridge's own page, not a file of the UI build
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { mkdtemp, readlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { startBridge } from "../server.mjs";
import { makeStateFixture } from "../bridge-fixture.mjs";
import { CODE, authed, login, send } from "../bridge-auth-helpers.mjs";
import { STORAGE_KEY } from "../../ui/src/session/session.mjs";
import { RECOVER_HTML, RECOVER_SCRIPT } from "./recover.mjs";
import { SHA_A, SHA_B, SHA_C, liveReleases, putRelease } from "./release-test-helpers.mjs";

let fx, denState, bridge, token;
const start = async (options = {}) => {
  bridge = await startBridge({ root: fx.root, port: 0, auth: { launchCode: CODE }, ...options });
  token = await login(bridge);
};
beforeEach(async () => {
  fx = await makeStateFixture();
  denState = await mkdtemp(path.join(tmpdir(), "den-rollback-"));
});
afterEach(async () => {
  await bridge?.close();
  bridge = null;
  await fx.cleanup();
  await rm(denState, { recursive: true, force: true });
});

const rollback = (to, headers = authed(bridge, token)) => send(bridge, { method: "POST", path: "/build/rollback", headers, body: { to } });
const build = async () => (await send(bridge, { path: "/state" })).body.build;
const links = () => Promise.all(["current", "previous"].map((name) => readlink(path.join(denState, "ui", name)).catch(() => null)));
// The change frames of one event stream, collected until `stop()`.
const frames = () => new Promise((resolve, reject) => {
  const seen = [];
  const req = http.get({ host: "127.0.0.1", port: bridge.port, path: "/events" }, (res) => {
    let text = "";
    res.on("data", (chunk) => {
      text += chunk;
      for (let at; (at = text.indexOf("\n\n")) >= 0; text = text.slice(at + 2)) {
        const [event, data] = text.slice(0, at).split("\n");
        if (event === "event: change") seen.push(JSON.parse(data.slice(6)));
        if (event === "event: snapshot") resolve({ seen, stop: () => req.destroy() });
      }
    });
  });
  req.on("error", reject);
});

describe("with no release folders (the den run from the checkout)", () => {
  test("`build` is null and a roll back is a 409 that says why, with a state folder and without one", async () => {
    for (const options of [{}, { denState }]) {
      await start(options);
      assert.equal(await build(), null);
      const res = await rollback(SHA_A);
      assert.equal(res.status, 409);
      assert.match(res.body.error, /runs from the checkout/);
      await bridge.close();
    }
    bridge = null;
  });
});

describe("with two releases", () => {
  beforeEach(async () => {
    await liveReleases(denState, [SHA_A, SHA_B]);
    await start({ denState });
  });

  test("the snapshot names the live build, when it went live, and the previous one", async () => {
    const b = await build();
    assert.equal(b.live.sha, SHA_B);
    assert.ok(Date.now() - Date.parse(b.live.at) < 60_000, "live since the switch, not since it was built");
    assert.deepEqual([b.previous, b.rolledBack], [{ sha: SHA_A }, null]);
  });

  test("without the token a roll back is refused and nothing changes", async () => {
    const before = await links();
    assert.equal((await rollback(SHA_A, { Origin: `http://127.0.0.1:${bridge.port}` })).status, 401);
    assert.deepEqual(await links(), before);
  });

  test("`to` naming anything but the previous release is a 409 and nothing changes", async () => {
    await putRelease(denState, SHA_C); // a complete release no link points to
    const before = [await links(), await build()];
    for (const to of [SHA_B, SHA_C, SHA_B.slice(0, 12), "d4".repeat(20), "previous", "../releases/x", ""]) {
      const res = await rollback(to);
      assert.equal(res.status, 409, `to: ${to}`);
      assert.equal(typeof res.body.error, "string");
    }
    assert.equal((await send(bridge, { method: "POST", path: "/build/rollback", headers: authed(bridge, token), body: { to: 7 } })).status, 400);
    assert.equal((await send(bridge, { method: "POST", path: "/build/rollback", headers: authed(bridge, token), body: {} })).status, 400);
    assert.deepEqual([await links(), await build()], before);
  });

  test("a roll back switches the links, serves the previous build, names what was undone, and sends a build frame", async () => {
    const stream = await frames();
    const res = await rollback(SHA_A);
    assert.equal(res.status, 200);
    assert.equal(res.body.build.live.sha, SHA_A);
    assert.deepEqual(res.body.build.previous, { sha: SHA_B });
    assert.equal(res.body.build.rolledBack.sha, SHA_B);
    assert.deepEqual(await links(), [`../releases/${SHA_A.slice(0, 12)}`, `../releases/${SHA_B.slice(0, 12)}`]);
    assert.match((await send(bridge, { path: "/" })).text, new RegExp(`den ${SHA_A.slice(0, 12)}`));
    assert.deepEqual(await build(), res.body.build);
    stream.stop();
    const sent = stream.seen.filter((f) => f.type === "build");
    assert.equal(sent.length, 1);
    assert.deepEqual(sent[0].build, res.body.build);
  });

  test("rolling back twice returns to the start, and nothing is rolled back any more", async () => {
    assert.equal((await rollback(SHA_A)).status, 200);
    assert.equal((await rollback(SHA_A)).status, 409, "the same button pressed again: the previous release is the other one now");
    const again = await rollback(SHA_B.slice(0, 12)); // the 12 characters the den shows are enough
    assert.equal(again.status, 200);
    assert.equal(again.body.build.live.sha, SHA_B);
    assert.deepEqual([again.body.build.previous, again.body.build.rolledBack], [{ sha: SHA_A }, null]);
  });

  test("`rolledBack` stays until a later build goes live", async () => {
    await rollback(SHA_A);
    assert.equal((await build()).rolledBack.sha, SHA_B);
    await liveReleases(denState, [SHA_C]); // what a go-live does: a new release, then the switch
    const b = await build();
    assert.equal(b.live.sha, SHA_C);
    assert.deepEqual([b.previous, b.rolledBack], [{ sha: SHA_A }, null]);
  });
});

describe("the recovery page", () => {
  test("it is served from the bridge's own code, with the den's policy, and names nothing but its own script", async () => {
    await start();
    const page = await send(bridge, { path: "/recover" });
    assert.equal(page.status, 200);
    assert.match(page.headers["content-type"], /text\/html/);
    assert.match(page.headers["content-security-policy"], /script-src 'self'/);
    assert.equal(page.text, String(RECOVER_HTML));
    const loads = [...page.text.matchAll(/\b(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(loads.sort(), ["/", "/recover/script", "data:,"]);
    assert.doesNotMatch(page.text, /assets\/|<script(?![^>]*src=)/);
    const script = await send(bridge, { path: "/recover/script" });
    assert.equal(script.status, 200);
    assert.match(script.headers["content-type"], /javascript/);
    assert.equal(script.text, String(RECOVER_SCRIPT));
    assert.doesNotMatch(script.text, /\bimport\b[^.]|innerHTML/);
  });

  test("it keeps its token where the den's page does", () => {
    assert.ok(String(RECOVER_SCRIPT).includes(`const KEY = "${STORAGE_KEY}";`));
  });

  test("it is served when the live release has no index.html, and when there is no UI build at all", async () => {
    await liveReleases(denState, [SHA_A, SHA_B], { [SHA_B]: { index: false } });
    await start({ denState, uiDir: path.join(denState, "no-such-build") });
    assert.equal((await send(bridge, { path: "/" })).status, 404);
    assert.equal((await send(bridge, { path: "/recover" })).status, 200);
    assert.equal((await send(bridge, { path: "/recover/script" })).status, 200);
    assert.equal((await send(bridge, { method: "POST", path: "/recover", headers: authed(bridge, token), body: {} })).status, 404);
  });
});
