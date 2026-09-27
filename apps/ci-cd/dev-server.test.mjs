// ci-cd/02: the committed dev server. `npm run dev` serves the repo so cells and
// the smoke check share one server that gets MIME types and caching right --
// ticket 07's designer hit Python's http.server serving .mjs as text/plain on
// Windows, and a reused port serving a stale module graph.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));

async function findFreePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

function startDevServer(port) {
  return spawn("npm", ["run", "dev", "--", String(port)], {
    cwd: REPO_ROOT,
    shell: true,
  });
}

async function waitForServer(url, child, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  let exited = false;
  let exitInfo = null;
  child.once("exit", (code, signal) => {
    exited = true;
    exitInfo = { code, signal };
  });

  while (Date.now() < deadline) {
    if (exited) {
      throw new Error(
        `dev server exited before it answered ${url} (code=${exitInfo.code}, signal=${exitInfo.signal})`
      );
    }
    try {
      return await fetch(url);
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }
  throw new Error(`dev server never answered ${url} within ${timeoutMs}ms`);
}

function stopServer(child) {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) return resolve();
    child.once("exit", () => resolve());
    child.kill();
  });
}

test("npm run dev serves a .mjs file as text/javascript with Cache-Control: no-store", async () => {
  const port = await findFreePort();
  const child = startDevServer(port);
  let stderr = "";
  child.stderr?.on("data", (chunk) => (stderr += chunk));

  try {
    const res = await waitForServer(
      `http://localhost:${port}/apps/ui/src/scene/dev-scene.mjs`,
      child
    );
    assert.equal(res.status, 200, `expected 200 for dev-scene.mjs, got ${res.status}. stderr: ${stderr}`);

    const contentType = res.headers.get("content-type") || "";
    assert.ok(
      contentType.includes("text/javascript"),
      `.mjs must be served as text/javascript so browsers accept the module; got "${contentType}"`
    );

    assert.equal(
      res.headers.get("cache-control"),
      "no-store",
      "dev server must send Cache-Control: no-store so a reused port never serves a stale module graph"
    );
  } finally {
    await stopServer(child);
  }
});

test("npm run dev takes a port argument and listens on the requested port", async () => {
  const port = await findFreePort();
  const child = startDevServer(port);

  try {
    const res = await waitForServer(
      `http://localhost:${port}/apps/ui/src/scene/dev-scene.html`,
      child
    );
    assert.equal(
      res.status,
      200,
      `dev server did not serve dev-scene.html on the requested port ${port}`
    );
  } finally {
    await stopServer(child);
  }
});
