#!/usr/bin/env node
// ci-cd/07: split the suite into the browser files (each starts Chromium) and the rest, so CI
// runs them as two parallel jobs. `npm test` still runs everything.
//   node scripts/test-split.mjs browser|rest
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const TOP = ["apps", "packages", "scripts"];

// Browser files that do not carry the .browser.test.mjs suffix.
export const BROWSER_FILES = [
  "apps/ci-cd/smoke.test.mjs",
  "apps/ci-cd/smoke-ui.test.mjs",
  "apps/ui/den-scene-mounted.test.mjs",
  "apps/ui/src/overlay/floating-cards.test.mjs",
  "apps/ui/src/scene/tally-expand.test.mjs",
];

function collect(dir, out) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) collect(p, out);
    else if (e.isFile() && e.name.endsWith(".test.mjs")) out.push(path.relative(ROOT, p).split(path.sep).join("/"));
  }
}

export function allTestFiles() {
  const out = [];
  for (const t of TOP) collect(path.join(ROOT, t), out);
  return out.sort();
}

export const isBrowserFile = (f) => f.endsWith(".browser.test.mjs") || BROWSER_FILES.includes(f);

export function split(files = allTestFiles()) {
  return { browser: files.filter(isBrowserFile), rest: files.filter((f) => !isBrowserFile(f)) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2];
  const groups = split();
  if (!groups[mode]) {
    process.stderr.write("usage: test-split.mjs browser|rest\n");
    process.exit(2);
  }
  const r = spawnSync(process.execPath, ["--test", ...groups[mode]], { cwd: ROOT, stdio: "inherit" });
  process.exit(r.status ?? 1);
}
