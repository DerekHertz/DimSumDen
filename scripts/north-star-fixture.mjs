// Test-only helper for organism-infra/209 (den v1 progress bar). Not a test file (no *.test.mjs
// suffix), so `npm test` skips it. Builds a disposable board root with tickets that carry the same
// header lines the real board uses (Priority, Blocked by, Status).
import { mkdtempSync, mkdirSync, writeFileSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export function boardRoot() {
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), "north-star-")));
  mkdirSync(path.join(root, ".scratch"), { recursive: true });
  return root;
}

// ticket(root, "den-v1/01-first", { status, blockedBy, priority })
export function ticket(root, ref, { status = "ready-for-agent", blockedBy = "None (can start immediately)", priority = null } = {}) {
  const [feature, slug] = ref.split("/");
  const dir = path.join(root, ".scratch", feature, "issues");
  mkdirSync(dir, { recursive: true });
  const nn = /^(\d+)/.exec(slug)[1];
  const lines = [`# ${nn}: ${slug}`, "", "**Type:** feature", ""];
  if (priority) lines.push(`**Priority:** ${priority}`, "");
  lines.push(`**Blocked by:** ${blockedBy}`, "", `**Status:** ${status}`, "", "## What to build", "", "Something.", "", "## Comments", "");
  writeFileSync(path.join(dir, `${slug}.md`), lines.join("\n"));
}
