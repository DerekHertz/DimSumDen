// ci-cd/02 security fix round 1: `npm run dev` must bind to 127.0.0.1 only, not all
// interfaces. Security found `server.listen(port, ...)` (no host) binds 0.0.0.0/[::],
// serving the whole repo tree to anyone on the LAN with no auth.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer, connect } from "node:net";
import { networkInterfaces } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));

function lanAddress() {
  for (const addrs of Object.values(networkInterfaces())) {
    for (const addr of addrs ?? []) {
      if (addr.family === "IPv4" && !addr.internal) return addr.address;
    }
  }
  return null;
}

// Attempts a raw TCP connect to `address:port` and resolves with whether it succeeded.
// Used instead of fetch() because a refused/unreachable connection should fail fast and
// cleanly report "not listening there", rather than surface as a generic fetch error.
function canConnect(address, port, timeoutMs = 2000) {
  return new Promise((resolve) => {
    const socket = connect({ host: address, port, timeout: timeoutMs });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => resolve(false));
  });
}

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
    // POSIX only: makes this child the leader of its own process group, so
    // stopServer can signal the whole tree (sh -> npm -> node) at once. See
    // stopServer for why the plain, non-detached child.kill() below isn't enough.
    detached: process.platform !== "win32",
  });
}

// organism-infra/104: 30 s, not 10 s; npm + vite startup can take longer than 10 s on a busy machine.
async function waitForServer(url, child, timeoutMs = 30000) {
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
    if (process.platform === "win32") {
      // See dev-server.test.mjs: npm re-spawns the real node process through its own
      // shell layer on Windows, so child.kill() would only kill the outer cmd.exe and
      // orphan the server. Kill the whole tree by pid instead.
      spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
    } else {
      // See dev-server.test.mjs: child.kill() only signals the immediate shell, not
      // npm's node child, so the real server survives and keeps stdio pipes open --
      // that's what hung the test job for 36+ min in CI run 36376905451. Signal the
      // whole process group (startDevServer spawns detached) via the negative pid.
      try {
        process.kill(-child.pid, "SIGTERM");
      } catch {
        child.kill();
      }
    }
  });
}

test("npm run dev listens on 127.0.0.1 only, not all interfaces", async () => {
  const port = await findFreePort();
  const child = startDevServer(port);
  let stderr = "";
  child.stderr?.on("data", (chunk) => (stderr += chunk));

  try {
    // Reachable via 127.0.0.1.
    const res = await waitForServer(
      `http://127.0.0.1:${port}/apps/ui/index.html`,
      child
    );
    assert.equal(
      res.status,
      200,
      `dev server did not answer on 127.0.0.1:${port}. stderr: ${stderr}`
    );

    // Not reachable via the machine's LAN address: proves it is bound to 127.0.0.1 only,
    // not 0.0.0.0/::, which would expose the whole repo tree to the LAN with no auth.
    const address = lanAddress();
    if (address) {
      const reachable = await canConnect(address, port);
      assert.equal(
        reachable,
        false,
        `dev server must bind 127.0.0.1 only, but it accepted a connection on LAN address ${address}:${port}`
      );
    }
  } finally {
    await stopServer(child);
  }
});
