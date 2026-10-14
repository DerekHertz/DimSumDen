// den-mvp/31: behind the wall node_modules is read-only, and Vite's default config loader writes node_modules/.vite-temp.
// Every Vite server a test starts, and the UI build, must load the config natively.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

test("every test's Vite server loads its config natively", () => {
  const files = execFileSync("git", ["grep", "-l", "createServer({ configFile:", "--", "*.mjs", ":!scripts/vite-native-config.test.mjs"], { encoding: "utf8" }).trim().split("\n");
  assert.ok(files.length > 0);
  for (const f of files) {
    for (const line of readFileSync(f, "utf8").split("\n").filter((l) => l.includes("createServer({ configFile:"))) {
      assert.match(line, /configLoader: ['"]native['"]/, `${f}: ${line.trim()}`);
    }
  }
});

test("ui:build loads the Vite config natively", () => {
  const { scripts } = JSON.parse(readFileSync("package.json", "utf8"));
  assert.match(scripts["ui:build"], /--configLoader native/);
});
