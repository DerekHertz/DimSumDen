// ci-cd/02: the headless UI smoke check. `npm run smoke` serves the repo, loads
// each listed dev page in a headless browser, and fails on a console error, a
// failed module import, or a failed asset load. Ticket 07's node:fs bug (a
// browser page importing a node: built-in) is the case it must catch.
//
// This needs a headless browser (Playwright, per the ci-cd/02 dependency
// decision). Until the developer adds that dependency these tests are
// expected to fail on the missing `smoke` script, and then later on the
// Playwright import, not on a bug in this test file.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));

function runSmoke(pages, { timeoutMs = 30000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", "smoke", "--", ...pages], {
      cwd: REPO_ROOT,
      shell: true,
      // POSIX only: own process group, so the timeout below can signal the whole
      // tree (sh -> npm -> node -> the browser it launches), not just the shell.
      // See dev-server.test.mjs's stopServer for the same fix and why it matters:
      // child.kill() alone leaves the real process running and its stdio pipes
      // open, which hangs `node --test` even after this promise settles.
      detached: process.platform !== "win32",
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
      } else {
        try {
          process.kill(-child.pid, "SIGTERM");
        } catch {
          child.kill();
        }
      }
      reject(new Error(`npm run smoke did not finish within ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout?.on("data", (chunk) => (stdout += chunk));
    child.stderr?.on("data", (chunk) => (stderr += chunk));
    child.once("exit", (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
    child.once("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

// ci-cd/04: fresh agent worktrees never have node_modules, so `playwright` genuinely can't be
// resolved there -- not a broken test, not "pre-existing/unrelated", but the exact scenario
// this ticket names. To exercise that deterministically (independent of whether *this* checkout
// happens to have run `npm ci`), copy smoke.mjs + dev-server.mjs to a fresh temp directory with
// no node_modules of its own anywhere in its ancestry, and run it from there. Node's ESM resolver
// walks up from the importing file's real path, so a bare `import "playwright"` fails there
// exactly as it does in a fresh worktree, regardless of whether the repo's own node_modules has
// it installed.
function makeWorktreeWithoutDeps() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "smoke-missing-deps-"));
  fs.copyFileSync(path.join(REPO_ROOT, "apps/ci-cd/smoke.mjs"), path.join(dir, "smoke.mjs"));
  fs.copyFileSync(
    path.join(REPO_ROOT, "apps/ci-cd/dev-server.mjs"),
    path.join(dir, "dev-server.mjs")
  );
  return dir;
}

function runSmokeWithoutDeps({ timeoutMs = 10000 } = {}) {
  const dir = makeWorktreeWithoutDeps();
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["smoke.mjs", "irrelevant-page.html"], {
      cwd: dir,
      detached: process.platform !== "win32",
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
      } else {
        try {
          process.kill(-child.pid, "SIGTERM");
        } catch {
          child.kill();
        }
      }
      reject(new Error(`smoke.mjs did not finish within ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout?.on("data", (chunk) => (stdout += chunk));
    child.stderr?.on("data", (chunk) => (stderr += chunk));
    child.once("exit", (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
    child.once("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

test("smoke names the real cause with one clear line and no stack trace when playwright is not installed", async () => {
  const { code, stdout, stderr } = await runSmokeWithoutDeps();

  assert.notEqual(
    code,
    0,
    `a missing dependency must fail the smoke check, not pass it.\nstdout: ${stdout}\nstderr: ${stderr}`
  );

  const output = `${stdout}${stderr}`;
  assert.match(
    output,
    /playwright not installed/i,
    `expected a one-line message naming playwright as the cause, not a raw import error.\nstdout: ${stdout}\nstderr: ${stderr}`
  );
  assert.match(
    output,
    /npm install/,
    `expected the message to name the fix (npm install && npx playwright install chromium).\nstdout: ${stdout}\nstderr: ${stderr}`
  );

  // "No stack trace": none of the tell-tale lines a raw Node stack or ERR_MODULE_NOT_FOUND
  // dump prints -- "at " call frames, the internal error code, or a second file:line pointing
  // back into node's module loader.
  assert.ok(
    !/\bat .+\(.*:\d+:\d+\)/.test(output),
    `expected no stack frames in the failure output.\nstdout: ${stdout}\nstderr: ${stderr}`
  );
  assert.ok(
    !output.includes("ERR_MODULE_NOT_FOUND"),
    `expected the friendly message, not the raw Node error code.\nstdout: ${stdout}\nstderr: ${stderr}`
  );
});

test("smoke does not silently skip when a dependency is missing -- it still counts as a failure", async () => {
  const { code, stdout, stderr } = await runSmokeWithoutDeps();

  assert.notEqual(
    code,
    0,
    `a missing dependency must produce a non-zero exit so CI can't go green without it.\nstdout: ${stdout}\nstderr: ${stderr}`
  );
  const output = `${stdout}${stderr}`.toLowerCase();
  assert.ok(
    !output.includes("skip"),
    `expected a reported failure, not a skip, when playwright is missing.\nstdout: ${stdout}\nstderr: ${stderr}`
  );
});

test("npm run smoke passes a dev page with no console errors, import failures, or asset failures", async () => {
  const { code, stdout, stderr } = await runSmoke(["apps/ci-cd/fixtures/ok-page.html"]);
  assert.equal(
    code,
    0,
    `expected a clean dev page to pass the smoke check.\nstdout: ${stdout}\nstderr: ${stderr}`
  );
});

test("npm run smoke fails when a dev page imports a node: built-in", async () => {
  const { code, stdout, stderr } = await runSmoke(["apps/ci-cd/fixtures/node-import.html"]);
  assert.notEqual(
    code,
    0,
    `smoke must fail a page that imports a node: built-in.\nstdout: ${stdout}\nstderr: ${stderr}`
  );

  const output = `${stdout}\n${stderr}`.toLowerCase();
  assert.ok(
    output.includes("node-import") || output.includes("node:fs") || output.includes("import"),
    `expected the failure report to point at the failed import.\nstdout: ${stdout}\nstderr: ${stderr}`
  );
});
