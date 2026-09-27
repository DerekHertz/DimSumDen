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
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));

function runSmoke(pages, { timeoutMs = 30000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", "smoke", "--", ...pages], {
      cwd: REPO_ROOT,
      shell: true,
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
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
