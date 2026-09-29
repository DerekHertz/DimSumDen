#!/usr/bin/env node
// organism-infra/48: append one validated kind:"cell" row to .scratch/usage.jsonl (ADR 0008).
// Usage: node scripts/log-cell.mjs --ticket <feature>/<NN-slug> --cell <type> [--mode <m>] [--model <id>]
//          --tokens <int> --ms <int> --outcome "<text>"
//          [--allow-no-handoff "<reason>"]   (skip the recent-handoff check; reason is logged in the row)
// Root is $ORGANISM_ROOT, else the current directory. Any rejection exits 1 and writes nothing.
import { closeSync, constants, existsSync, lstatSync, mkdirSync, openSync, readdirSync, readFileSync, statSync, writeSync } from "node:fs";
import path from "node:path";

const CELLS = ["product", "architect", "orchestrator", "developer", "scout", "qa", "security", "designer"];
const REF_RE = /^([a-z0-9-]+)\/([A-Za-z0-9][A-Za-z0-9._-]*)$/;
const FLAGS = ["ticket", "cell", "mode", "model", "tokens", "ms", "outcome", "failures", "allow-no-handoff"];
const TOOLS = ["bash-guard", "board-claim", "board-release", "board-comment", "board-handoff", "handoff-state", "git", "npm", "write", "ci", "other"];

function fail(msg) {
  console.error(`log-cell: ${msg}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const f = {};
for (let i = 0; i < args.length; i += 2) {
  const name = args[i].startsWith("--") ? args[i].slice(2) : null;
  if (!name || !FLAGS.includes(name)) fail(`unrecognized argument: ${args[i]}`);
  if (args[i + 1] === undefined) fail(`--${name} requires a value`);
  f[name] = args[i + 1];
}

const m = REF_RE.exec(f.ticket ?? "");
if (!m || m[2] === ".." || m[2].includes("..")) fail(`--ticket must be <feature>/<NN-slug>, got ${JSON.stringify(f.ticket)}`);
if (!CELLS.includes(f.cell)) fail(`--cell must be one of ${CELLS.join(", ")}`);
for (const n of ["tokens", "ms"]) {
  if (!/^[0-9]{1,15}$/.test(f[n] ?? "")) fail(`--${n} must be a non-negative integer`);
}
if (!f.outcome || !f.outcome.trim()) fail("--outcome must be non-empty");
if (f.mode !== undefined && !f.mode.trim()) fail("--mode must be non-empty when given");
if (f.model !== undefined && !f.model.trim()) fail("--model must be non-empty when given");
if (f.model !== undefined && f.model.length > 64) fail("--model must be at most 64 characters");
if (f.outcome.length > 500) fail("--outcome must be at most 500 characters");
if (f.mode !== undefined && f.mode.length > 32) fail("--mode must be at most 32 characters");

// --failures "<tool>:<what>;..." (organism-infra/50): validated before anything is written.
const incidents = [];
if (f.failures !== undefined) {
  for (const item of f.failures.split(";")) {
    const i = item.indexOf(":");
    if (i < 0) fail(`--failures item needs <tool>:<what>, got ${JSON.stringify(item)}`);
    const tool = item.slice(0, i).trim();
    const what = item.slice(i + 1);
    if (!TOOLS.includes(tool)) fail(`--failures tool must be one of ${TOOLS.join(", ")}, got ${JSON.stringify(tool)}`);
    if (!what.trim()) fail("--failures what must be non-empty");
    if (what.length > 300) fail("--failures what must be at most 300 characters");
    incidents.push({ tool, what });
  }
}

const root = path.resolve(process.env.ORGANISM_ROOT || process.cwd());
if (!existsSync(path.join(root, ".scratch", m[1], "issues", `${m[2]}.md`))) fail(`ticket not found: ${f.ticket}`);

// organism-infra/51: a cell row needs a recent handoff from that cell/mode, else
// the cell finished without handing off. --allow-no-handoff "<reason>" is the logged escape.
if (f["allow-no-handoff"] !== undefined) {
  if (!f["allow-no-handoff"].trim()) fail("--allow-no-handoff needs a non-empty reason");
  if (f["allow-no-handoff"].length > 300) fail("--allow-no-handoff reason must be at most 300 characters");
} else {
  const dir = path.join(root, ".scratch", m[1], "handoffs");
  const nn = /^(\d{2})-/.exec(m[2])?.[1];
  const refs = new Set([f.ticket, nn && `${m[1]}/${nn}`]);
  const maxAgeMs = 24 * 3600_000;
  let found = false;
  for (const name of existsSync(dir) ? readdirSync(dir) : []) {
    if (!nn || !name.startsWith(`${nn}-`) || !name.endsWith(".md")) continue;
    const p = path.join(dir, name);
    let st, state;
    try {
      st = statSync(p);
      state = JSON.parse(/```json\s*([\s\S]*?)```/.exec(readFileSync(p, "utf8"))?.[1]);
    } catch {
      continue;
    }
    if (!st.isFile() || !state || !refs.has(state.ticket)) continue;
    if (state.cell !== f.cell || state.mode !== f.mode) continue;
    if (Date.now() - st.mtimeMs > maxAgeMs) continue;
    found = true;
    break;
  }
  if (!found) {
    fail(
      `no handoff for ${f.ticket} from ${f.cell}${f.mode !== undefined ? ` (mode ${f.mode})` : ""} published in the last 24 hours; ` +
        `the cell did not hand off. Send it back, or pass --allow-no-handoff "<reason>"`,
    );
  }
}

const row = {
  kind: "cell",
  ts: new Date().toISOString(),
  ticket: f.ticket,
  cell: f.cell,
  ...(f.mode !== undefined ? { mode: f.mode } : {}),
  ...(f.model !== undefined ? { model: f.model } : {}),
  tokens: Number(f.tokens),
  ms: Number(f.ms),
  outcome: f.outcome,
  ...(f["allow-no-handoff"] !== undefined ? { allow_no_handoff: f["allow-no-handoff"] } : {}),
};
const scratch = path.join(root, ".scratch");
if (existsSync(scratch) && lstatSync(scratch).isSymbolicLink()) fail(".scratch is a symlink; refusing to write through it");
mkdirSync(scratch, { recursive: true });
const incidentRows = incidents.map(({ tool, what }) => ({
  kind: "incident", ts: row.ts, ticket: f.ticket, cell: f.cell, tool, what, cost: null, fix: null, rule_change: null, source: "cell-report",
}));
// O_NOFOLLOW: a symlinked usage.jsonl is refused (organism-infra/49).
let fd;
try {
  fd = openSync(path.join(root, ".scratch", "usage.jsonl"), constants.O_WRONLY | constants.O_APPEND | constants.O_CREAT | constants.O_NOFOLLOW, 0o644);
} catch (err) {
  fail(`cannot open usage.jsonl (${err.code}); symlinks are refused`);
}
try {
  writeSync(fd, [row, ...incidentRows].map((r) => JSON.stringify(r) + "\n").join(""));
} finally {
  closeSync(fd);
}
