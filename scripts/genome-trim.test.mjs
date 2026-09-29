// organism-infra/37: genomes stay lean. No genome uses a bare `Agent` tool (it must
// name the cells it dispatches, `Agent(scout)`), and nothing under .claude/agents
// or .claude/skills references the retired debugger cell.
// Red until the orchestrator applies docs/agents/proposed/ (gated .claude/ edits).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const AGENTS = path.join(REPO_ROOT, ".claude", "agents");
const SKILLS = path.join(REPO_ROOT, ".claude", "skills");

function genomes() {
  return readdirSync(AGENTS).filter((f) => f.endsWith(".md")).map((f) => path.join(AGENTS, f));
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (p.endsWith(".md")) out.push(p);
  }
  return out;
}

function toolList(file) {
  const m = readFileSync(file, "utf8").match(/^tools:\s*(.*)$/m);
  if (!m) return [];
  // split on commas outside parentheses so Agent(a, b) stays one entry
  return m[1].split(/,(?![^(]*\))/).map((t) => t.trim()).filter(Boolean);
}

test("no genome has a bare Agent tool", () => {
  for (const g of genomes()) {
    assert.ok(!toolList(g).includes("Agent"), `${path.basename(g)} has a bare Agent; name the cells: Agent(scout)`);
  }
});

test("no genome or skill references debugger", () => {
  assert.ok(!existsSync(path.join(AGENTS, "debugger.md")), "debugger genome still exists");
  for (const f of [...genomes(), ...walk(SKILLS)]) {
    assert.ok(!/debugger/i.test(readFileSync(f, "utf8")), `${path.relative(REPO_ROOT, f)} mentions debugger`);
  }
});
