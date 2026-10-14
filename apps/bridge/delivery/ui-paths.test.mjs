// The tripwire for delivery/plan.mjs UI_PATHS (security review of den-mvp outcome 5, finding 1). The UI build bundles
// every file the UI imports, wherever it lives. A change to such a file that is not counted as UI would merge with no
// security review, no preview and no verdict, and then ship inside the next UI build, in the page that holds the
// user's session. So: every repository file the UI imports is either under UI_PATHS, or a path only the user merges.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { UI_PATHS, isUiPath, isUserMergePath } from "./plan.mjs";

const REPO = fileURLToPath(new URL("../../../", import.meta.url));
const SOURCE = /\.(?:mjs|js|jsx)$/;
const IMPORT = /(?:\bfrom\s*|\bimport\s*\(?\s*)["'](\.{1,2}\/[^"']+)["']/g;

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const file = path.join(dir, name);
  if (name === "node_modules" || name === "dist") return [];
  return statSync(file).isDirectory() ? walk(file) : [file];
});
const isTest = (file) => /\.test\.mjs$/.test(file);

// Every repository file reachable by a relative import from the UI's own sources (tests left out: they are not bundled).
function bundled() {
  const seen = new Set();
  const todo = walk(path.join(REPO, "apps/ui/src")).filter((f) => SOURCE.test(f) && !isTest(f));
  while (todo.length) {
    const file = todo.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    if (!SOURCE.test(file)) continue;
    for (const [, spec] of readFileSync(file, "utf8").matchAll(IMPORT)) {
      const target = path.resolve(path.dirname(file), spec.split("?")[0]);
      if (existsSync(target) && statSync(target).isFile()) todo.push(target);
    }
  }
  return [...seen].map((file) => path.relative(REPO, file).split(path.sep).join("/"));
}

test("every file the UI bundles is a UI path or one only the user merges", () => {
  const files = bundled();
  assert.ok(files.length > 50 && files.some((f) => f.startsWith("apps/ui/src/")), "the walk found the UI's sources");
  const outside = files.filter((f) => !f.startsWith("apps/ui/"));
  assert.ok(outside.some((f) => f.startsWith("packages/")), "the UI does import shared packages (the reason for this test)");
  const uncovered = files.filter((f) => !isUiPath(f) && !isUserMergePath(f));
  assert.deepEqual(uncovered, [], `add the folder of each to UI_PATHS in delivery/plan.mjs (now ${JSON.stringify(UI_PATHS)}), so a change to it is reviewed and previewed`);
});

test("what counts as a UI path", () => {
  for (const file of ["apps/ui/src/App.jsx", "apps/ui/vite.config.mjs", "apps/ui/index.html", "packages/board-refs/src/compare-refs.mjs"]) assert.equal(isUiPath(file), true, file);
  for (const file of ["apps/bridge/server.mjs", "apps/uix/a.mjs", "docs/apps/ui/a.md", "packages", "README.md", undefined, 7]) assert.equal(isUiPath(file), false, String(file));
});
