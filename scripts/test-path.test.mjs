// Acceptance tests for organism-infra/54: `npm run test:path -- <file|dir>`.
//
// Pinned contract (QA's reading of the ticket):
//   - `npm run test:path -- <dir>` expands the directory to its *.test.mjs
//     files and runs `node --test` on them.
//   - Exit code is non-zero when any discovered test fails.
//   - Exit code is 0 when all discovered tests pass.
//   - The script is defined in package.json under "test:path".
//
// Criterion map:
//   2 test:path runs dir tests and exits non-zero on failure -> all tests below
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

function runTestPath(args, { cwd = REPO_ROOT } = {}) {
  return spawnSync("npm", ["run", "test:path", "--", ...args], {
    cwd,
    encoding: "utf8",
  });
}

// --- Criterion 2: test:path script defined and works ---

test("package.json defines a test:path script", () => {
  const pkg = JSON.parse(readFileSync(path.join(REPO_ROOT, "package.json"), "utf8"));
  assert.ok(
    pkg.scripts && pkg.scripts["test:path"],
    "package.json must define a 'test:path' script"
  );
});

test("test:path runs passing tests in a directory and exits 0", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "test-path-pass-"));
  try {
    writeFileSync(
      path.join(dir, "passing.test.mjs"),
      "import { test } from 'node:test';\nimport assert from 'node:assert/strict';\ntest('passes', () => assert.ok(true));\n"
    );
    const r = runTestPath([dir]);
    assert.equal(r.status, 0, `test:path should exit 0 for passing tests:\n${r.stderr}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("test:path exits non-zero when a test in the directory fails", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "test-path-fail-"));
  try {
    writeFileSync(
      path.join(dir, "failing.test.mjs"),
      "import { test } from 'node:test';\nimport assert from 'node:assert/strict';\ntest('fails', () => assert.fail('intentional'));\n"
    );
    const r = runTestPath([dir]);
    assert.notEqual(r.status, 0, "test:path should exit non-zero when a test fails");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("test:path expands directories to *.test.mjs files, skipping non-test files", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "test-path-expand-"));
  try {
    writeFileSync(
      path.join(dir, "a.test.mjs"),
      "import { test } from 'node:test';\nimport assert from 'node:assert/strict';\ntest('a', () => assert.ok(true));\n"
    );
    // A non-test file that should NOT be run (it would cause a syntax error if run).
    writeFileSync(path.join(dir, "helper.mjs"), "export const x = 1;\n");
    // Running the directory should succeed (helper is not picked up).
    const r = runTestPath([dir]);
    assert.equal(r.status, 0, `non-test files should not be picked up:\n${r.stderr}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("test:path accepts a direct file path as well as a directory", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "test-path-file-"));
  try {
    const file = path.join(dir, "single.test.mjs");
    writeFileSync(
      file,
      "import { test } from 'node:test';\nimport assert from 'node:assert/strict';\ntest('single', () => assert.ok(true));\n"
    );
    const r = runTestPath([file]);
    assert.equal(r.status, 0, `direct file path should work:\n${r.stderr}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
