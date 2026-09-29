// dimsumden-ui-v0/09: CSP forward from 07 security. The panel starts rendering agent-written text, so the
// bridge's static responses carry a Content-Security-Policy that forbids inline and foreign script.
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { startBridge } from "./server.mjs";
import { makeStateFixture } from "./bridge-fixture.mjs";

function directive(csp, name) {
  return csp.split(";").map((d) => d.trim()).find((d) => d === name || d.startsWith(name + " ")) ?? null;
}

describe("bridge static CSP", () => {
  let fx, uiDir, bridge;
  before(async () => {
    fx = await makeStateFixture();
    uiDir = await mkdtemp(path.join(tmpdir(), "ui-csp-"));
    await mkdir(path.join(uiDir, "assets"));
    await writeFile(path.join(uiDir, "index.html"), "<!doctype html><title>den</title>");
    await writeFile(path.join(uiDir, "assets", "app.js"), "export const x = 1;");
    bridge = await startBridge({ root: fx.root, port: 0, uiDir });
  });
  after(async () => {
    await bridge.close();
    await fx.cleanup();
    await rm(uiDir, { recursive: true, force: true });
  });

  for (const p of ["/", "/assets/app.js", "/some/route"]) {
    test(`static response for ${p} sets script-src 'self'`, async () => {
      const res = await fetch(`${bridge.url}${p}`);
      assert.equal(res.status, 200);
      const csp = res.headers.get("content-security-policy");
      assert.ok(csp, "Content-Security-Policy header present");
      const script = directive(csp, "script-src");
      assert.ok(script, `script-src directive in: ${csp}`);
      assert.match(script, /'self'/);
    });
  }

  test("script-src allows no inline, eval or foreign origin", async () => {
    const csp = (await fetch(`${bridge.url}/`)).headers.get("content-security-policy");
    const script = directive(csp, "script-src");
    assert.doesNotMatch(script, /unsafe-inline|unsafe-eval|https?:|\*|data:/);
  });

  test("objects and framing are shut off", async () => {
    const csp = (await fetch(`${bridge.url}/`)).headers.get("content-security-policy");
    assert.match(directive(csp, "object-src") ?? "", /'none'/);
    const frame = directive(csp, "frame-ancestors");
    assert.match(frame ?? "", /'none'/);
  });

  test("the UI can still reach its own bridge: connect-src permits 'self' (EventSource, fetch)", async () => {
    const csp = (await fetch(`${bridge.url}/`)).headers.get("content-security-policy");
    const connect = directive(csp, "connect-src") ?? directive(csp, "default-src");
    assert.ok(connect, "connect-src or default-src present");
    assert.match(connect, /'self'/);
  });


  test("glb textures load: connect-src and img-src permit blob:, img-src permits data:, script-src stays 'self'", async () => {
    const csp = (await fetch(`${bridge.url}/`)).headers.get("content-security-policy");
    assert.match(directive(csp, "connect-src") ?? "", /blob:/);
    assert.match(directive(csp, "img-src") ?? "", /blob:/);
    assert.match(directive(csp, "img-src") ?? "", /data:/);
    assert.doesNotMatch(directive(csp, "script-src"), /blob:|data:/);
  });

  test("the missing-asset 404 and the API routes keep working", async () => {
    assert.equal((await fetch(`${bridge.url}/assets/missing.js`)).status, 404);
    assert.equal((await fetch(`${bridge.url}/state`)).status, 200);
  });
});
