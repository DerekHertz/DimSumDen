Jevgrep: 9 relevant files.
Symbols use name@start-end. Roles are estimates; locations-only files remain reading leads.
AGENTS.md lookup (root and returned-file ancestors): "AGENTS.md".
Source omitted: 1 file(s).
- "apps/ci-cd/smoke.mjs" — implementation, caller, helper; locations only
- "apps/ci-cd/smoke.test.mjs" — test, fixture, helper; source below
- "apps/ci-cd/smoke-ui.test.mjs" — test, fixture, helper; source below
- "apps/ci-cd/smoke-ui.mjs" — implementation, test, fixture, helper; source below
- "package.json" — helper; locations only
- "apps/ci-cd/launch-options.test.mjs" — caller, test, fixture, helper; source below
- "apps/ci-cd/launch-options.mjs" — helper; source below
- "package-lock.json" — relevant; role uncertain; locations only
- "scripts/test-lock.mjs" — relevant; role uncertain; locations only
End file list. Declaration locations follow source.

Source block "apps/ci-cd/smoke.test.mjs" lines 17-118:
```

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
    path.join(REPO_ROOT, "apps/ci-cd/launch-options.mjs"),
    path.join(dir, "launch-options.mjs")
  );
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
```

Source block "apps/ci-cd/smoke.test.mjs" lines 166-326:
```
// ci-cd/04 (qa bounce, round 2): the missing-package branch above is only half of "playwright
// or its Chromium binary" missing. This exercises the other half: playwright the *package* is
// present, but no browser binary is installed for it to launch -- e.g. `npm install` ran but
// `npx playwright install chromium` never did.
//
// launchBrowser() tries system Chrome, then system Edge, then Playwright's own managed Chromium
// before giving up, so pointing PLAYWRIGHT_BROWSERS_PATH at an empty directory alone only forces
// this on a machine with no real Chrome/Edge installed -- on a dev box that has either (this one
// does), those channels resolve to the real system browser and the test would pass for the wrong
// reason. Worse, on Windows the well-known install locations Playwright checks for system
// Chrome/Edge (e.g. %ProgramFiles%) come from OS-level environment variables that a child
// process cannot reliably override -- confirmed empirically, not something this test can route
// around by also setting PROGRAMFILES et al.
//
// So this stubs the "playwright" package itself, the same seam the missing-package test above
// already uses (a fresh directory with its own node_modules), but this time the package is
// *present* -- a fake one whose chromium.launch always fails with Playwright's own
// "Executable doesn't exist" message, regardless of what's actually installed on the host. That
// keeps the test black-box (still only observing smoke.mjs's process exit code and output) while
// making it deterministic everywhere.
function makeWorktreeWithMissingBrowserBinary() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "smoke-missing-browser-"));
  fs.copyFileSync(path.join(REPO_ROOT, "apps/ci-cd/smoke.mjs"), path.join(dir, "smoke.mjs"));
  fs.copyFileSync(
    path.join(REPO_ROOT, "apps/ci-cd/launch-options.mjs"),
    path.join(dir, "launch-options.mjs")
  );
  fs.copyFileSync(
    path.join(REPO_ROOT, "apps/ci-cd/dev-server.mjs"),
    path.join(dir, "dev-server.mjs")
  );

  const fakePlaywrightDir = path.join(dir, "node_modules", "playwright");
  fs.mkdirSync(fakePlaywrightDir, { recursive: true });
  fs.writeFileSync(
    path.join(fakePlaywrightDir, "package.json"),
    JSON.stringify({ name: "playwright", version: "0.0.0-fake", type: "module", main: "index.js" })
  );
  fs.writeFileSync(
    path.join(fakePlaywrightDir, "index.js"),
    [
      "export const chromium = {",
      "  async launch() {",
      "    throw new Error(",
      '      "Executable doesn\'t exist at /fake/chrome-headless-shell\\n" +',
      '      "Looks like Playwright was just installed or updated.\\n" +',
      '      "Please run the following command to download new browsers:\\n" +',
      '      "    npx playwright install"',
      "    );",
      "  },",
      "};",
      "",
    ].join("\n")
  );

  return dir;
}

function runSmokeWithMissingBrowserBinary({ timeoutMs = 10000 } = {}) {
  const dir = makeWorktreeWithMissingBrowserBinary();
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["smoke.mjs", "ok-page.html"], {
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

test("smoke names the real cause with one clear line and no stack trace when the Chromium binary is missing", async () => {
  const { code, stdout, stderr } = await runSmokeWithMissingBrowserBinary();

  assert.notEqual(
    code,
    0,
    `a missing browser binary must fail the smoke check, not pass it.\nstdout: ${stdout}\nstderr: ${stderr}`
  );

  const output = `${stdout}${stderr}`;
  assert.match(
    output,
    /playwright not installed/i,
    `expected the same one-line dependency message as the missing-package case, not a raw Playwright error.\nstdout: ${stdout}\nstderr: ${stderr}`
  );
  assert.match(
    output,
    /npm install/,
    `expected the message to name the fix (npm install && npx playwright install chromium).\nstdout: ${stdout}\nstderr: ${stderr}`
  );

  // Same "no stack trace" bar as the missing-package test: no call frames, no raw Playwright
  // "Executable doesn't exist" dump (with its ASCII-box "<3 Playwright Team" message), and no
  // "is not found" channel-lookup error leaking through unclassified.
  assert.ok(
    !/\bat .+\(.*:\d+:\d+\)/.test(output),
    `expected no stack frames in the failure output.\nstdout: ${stdout}\nstderr: ${stderr}`
  );
  assert.ok(
    !output.includes("Executable doesn't exist"),
    `expected the friendly message, not Playwright's raw executable-missing error.\nstdout: ${stdout}\nstderr: ${stderr}`
  );
  assert.ok(
    !output.toLowerCase().includes("is not found"),
    `expected the friendly message, not Playwright's raw channel-not-found error.\nstdout: ${stdout}\nstderr: ${stderr}`
  );

  const lowerOutput = output.toLowerCase();
  assert.ok(
    !lowerOutput.includes("skip"),
    `expected a reported failure, not a skip, when the browser binary is missing.\nstdout: ${stdout}\nstderr: ${stderr}`
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

```

Source block "apps/ci-cd/smoke-ui.test.mjs" lines 18-52:
```

const REPO_ROOT = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));

function run(args, { timeoutMs }) {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", ...args], {
      cwd: REPO_ROOT,
      shell: true,
      detached: process.platform !== "win32",
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      try {
        process.kill(-child.pid, "SIGTERM");
      } catch {
        child.kill();
      }
      reject(new Error(`npm run ${args.join(" ")} did not finish within ${timeoutMs}ms`));
    }, timeoutMs);
    child.stdout?.on("data", (c) => (stdout += c));
    child.stderr?.on("data", (c) => (stderr += c));
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

async function withFixtureServer(fn) {
  const server = createDevServer(REPO_ROOT);
```

Source block "apps/ci-cd/smoke-ui.test.mjs" lines 95-110:
```
  assert.ok(!/127\.0\.0\.1:\d+\/http/.test(`${stdout}${stderr}`), "URL must be loaded as given");
});

test("npm run smoke:ui passes on main: scene count, queue order, chart and one Approve round trip", async () => {
  const { code, stdout, stderr } = await run(["smoke:ui"], { timeoutMs: 170000 });
  assert.equal(code, 0, `smoke:ui must exit 0.\nstdout: ${stdout}\nstderr: ${stderr}`);
  for (const check of ["scene", "queue", "chart", "approve", "camera fit.*1440x900", "camera fit.*375x667", "camera zoom", "camera pan"]) {
    assert.match(
      stdout,
      new RegExp(`^PASS.*${check}`, "im"),
      `expected a PASS line naming the ${check} check.\nstdout: ${stdout}`
    );
  }
  assert.ok(!/^FAIL/m.test(stdout + stderr), `no FAIL lines expected.\n${stdout}\n${stderr}`);
});

```

Source block "apps/ci-cd/smoke-ui.mjs" lines 26-35:
```
const MERGE_REF = `${FEATURE}/04-review`;

const results = [];
function report(name, ok, detail = "") {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? `: ${detail}` : ""}`);
}
async function check(name, fn) {
  try {
    const detail = await fn();
```

Source block "apps/ci-cd/launch-options.test.mjs" lines 14-20:
```
const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLOUD_CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const { buildLaunchOptions } = await import("./launch-options.mjs");

test("PW_CHROMIUM_PATH set: launches that executable with the swiftshader flags", () => {
  const opts = buildLaunchOptions(undefined, { PW_CHROMIUM_PATH: CLOUD_CHROME });
```

Source block "apps/ci-cd/launch-options.mjs" lines 1-11:
```
// ci-cd/05: launch options shared by the browser launchers (smoke.mjs, smoke-ui.mjs).
// Cloud sessions ship Chromium 1194 while Playwright wants another build, so PW_CHROMIUM_PATH
// points the launchers at the preinstalled binary. Software GL flags because there is no GPU.
export function buildLaunchOptions(channel, env = process.env) {
  const executablePath = env.PW_CHROMIUM_PATH;
  if (executablePath) {
    return { executablePath, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] };
  }
  return channel ? { channel } : {};
}

```

Declaration locations:
- "apps/ci-cd/smoke.mjs"
  source@11-11
  source@12-12
  LAUNCH_CHANNELS@14-14
  DependencyError@21-21
  MISSING_DEPENDENCY_MESSAGE@23-24
  loadChromium@26-36
  launchBrowser@38-56
  startEphemeralServer@58-64
  isBrowserHousekeeping@68-70
  checkPage@78-114
  main@116-166
  source@168-175
- "apps/ci-cd/smoke.test.mjs"
  source@15-15
  source@16-16
  REPO_ROOT@18-18
  runSmoke@20-58
  makeWorktreeWithoutDeps@68-80
  runSmokeWithoutDeps@82-115
  source@117-149
  source@151-164
  makeWorktreeWithMissingBrowserBinary@186-222
  runSmokeWithMissingBrowserBinary@224-257
  source@259-301
  source@303-310
  source@312-325
- "apps/ci-cd/smoke-ui.test.mjs"
  source@16-16
  source@17-17
  REPO_ROOT@19-19
  run@21-49
  withFixtureServer@51-62
  source@64-73
  source@75-86
  source@88-96
  source@98-109
- "apps/ci-cd/smoke-ui.mjs"
  source@9-9
  source@13-13
  source@14-14
  REPO_ROOT@16-16
  EXPECTED_CHIPS@22-22
  EXPECTED_QUEUE_HEAD@25-25
  MERGE_REF@26-26
  results@28-28
  report@29-32
  check@33-40
  expectEqual@41-45
  runCommand@47-56
  launch@58-68
  main@70-290
  source@292-297
  Some source omitted; locations remain available.
- "package.json"
  source@1-36
- "apps/ci-cd/launch-options.test.mjs"
  source@9-9
  source@11-11
  source@12-12
  HERE@14-14
  CLOUD_CHROME@15-15
  { buildLaunchOptions }@17-17
  source@19-23
  source@25-29
  source@31-35
  source@37-40
  source@42-53
  source@55-61
- "apps/ci-cd/launch-options.mjs"
  buildLaunchOptions@4-10
- "package-lock.json"
  source@1-97
  source@98-192
  source@193-283
  source@284-371
  source@372-459
  source@460-550
  source@551-647
  source@648-744
  source@745-837
  source@838-923
- "scripts/test-lock.mjs"
  DEFAULT_TIMEOUT_MS@26-26
  KILL_GRACE_MS@28-28
  sleep@30-30
  numberFromEnv@32-35
  isAlive@37-45
  readOwner@47-55
  main@100-164

End context.
