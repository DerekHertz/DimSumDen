// organism-infra/51 scope (c): scripts/usage.mjs prints "run claude /login" on HTTP 401.
// fetch is replaced through a --import preload, so nothing touches the network.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const USAGE = path.join(path.resolve(fileURLToPath(new URL("..", import.meta.url))), "scripts", "usage.mjs");

function runWithStatus(status) {
  const home = mkdtempSync(path.join(tmpdir(), "usage-401-"));
  try {
    mkdirSync(path.join(home, ".claude"));
    writeFileSync(path.join(home, ".claude", ".credentials.json"), JSON.stringify({ claudeAiOauth: { accessToken: "test-token" } }));
    const preload = path.join(home, "preload.mjs");
    writeFileSync(preload, `globalThis.fetch = async () => new Response("{}", { status: ${status} });\n`);
    const env = { ...process.env, HOME: home, USERPROFILE: home };
    delete env.CLAUDE_CODE_REMOTE;
    return spawnSync(process.execPath, ["--import", pathToFileURL(preload).href, USAGE], { encoding: "utf8", env, timeout: 15000 });
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
}

test("HTTP 401 exits 1 and tells the user to run claude /login", () => {
  const r = runWithStatus(401);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /claude \/login/);
  assert.ok(!r.stderr.includes("test-token"), "must never print the token");
});

test("other HTTP errors still exit 1 without the login hint", () => {
  const r = runWithStatus(500);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /500/);
  assert.doesNotMatch(r.stderr, /\/login/);
});
