// dimsumden-ui-v0/07: the bridge serves the built UI (ADR 0011 decision 2, last route row).
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import http from "node:http";
import { startBridge } from "./server.mjs";
import { makeStateFixture } from "./bridge-fixture.mjs";

// fetch() normalises "/../" away, so traversal needs a raw request.
function raw(port, target) {
  return new Promise((resolve, reject) => {
    http.get({ host: "127.0.0.1", port, path: target }, (res) => {
      res.resume();
      res.on("end", () => resolve(res.statusCode));
    }).on("error", reject);
  });
}

describe("bridge static files", () => {
  let fx, uiDir, bridge;
  before(async () => {
    fx = await makeStateFixture();
    uiDir = await mkdtemp(path.join(tmpdir(), "ui-dist-"));
    await mkdir(path.join(uiDir, "assets"));
    await writeFile(path.join(uiDir, "index.html"), "<!doctype html><title>den</title>");
    await writeFile(path.join(uiDir, "assets", "app.js"), "export const x = 1;");
    await writeFile(path.join(path.dirname(uiDir), "secret.txt"), "nope");
    bridge = await startBridge({ root: fx.root, port: 0, uiDir });
  });
  after(async () => {
    await bridge.close();
    await fx.cleanup();
    await rm(uiDir, { recursive: true, force: true });
  });

  test("/ serves index.html as text/html", async () => {
    const res = await fetch(`${bridge.url}/`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type"), /text\/html/);
    assert.match(await res.text(), /<title>den<\/title>/);
  });

  test("assets get a JavaScript MIME type", async () => {
    const res = await fetch(`${bridge.url}/assets/app.js`);
    assert.match(res.headers.get("content-type"), /text\/javascript/);
  });

  test("an unknown extensionless path serves index.html; a missing asset is 404", async () => {
    assert.match(await (await fetch(`${bridge.url}/some/route`)).text(), /<title>den<\/title>/);
    assert.equal((await fetch(`${bridge.url}/assets/missing.js`)).status, 404);
  });

  test("path traversal is a 403", async () => {
    assert.equal(await raw(bridge.port, "/../secret.txt"), 403);
    assert.equal(await raw(bridge.port, "/%2e%2e/secret.txt"), 403);
  });

  test("API routes still win over static files", async () => {
    assert.equal((await fetch(`${bridge.url}/state`)).headers.get("content-type"), "application/json");
  });
});
