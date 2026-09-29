// Metrics over .scratch/usage.jsonl and events.jsonl (ADR 0011 decision 4).
// computeMetrics is pure over parsed rows; the CLI reads the files and prints text or --json.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const WINDOW_HOURS = 5;
const WINDOW_MS = WINDOW_HOURS * 3600 * 1000;
const MAX_WINDOWS = 24;
// Keep in step with TOOLS in scripts/log-cell.mjs.
const TOOLS = ["bash-guard", "board-claim", "board-release", "board-comment", "board-handoff", "handoff-state", "git", "npm", "write", "ci", "other"];

function mapTool(raw) {
  const t = String(raw ?? "").trim().toLowerCase().replace(/\s+/g, "-");
  if (TOOLS.includes(t)) return t;
  if (/^(git|npm)\b/.test(t)) return t.split(/[-\s]/)[0];
  if (/^(gh|ci)\b/.test(t)) return "ci";
  return "other";
}

const round2 = (n) => Math.round(n * 100) / 100;

export function computeMetrics({ usageLines = [], eventLines = [] } = {}) {
  void eventLines; // reserved: v0 metrics derive from usage rows only
  const rows = usageLines.filter((r) => r && typeof r === "object" && !Array.isArray(r));

  const resolved = rows.filter((r) => r.kind === "resolved");
  const resolvedSet = new Set(resolved.map((r) => r.ticket));

  // throughput: contiguous epoch-aligned 5h windows, newest 24
  const counts = new Map();
  for (const r of resolved) {
    const t = Date.parse(r.ts);
    if (Number.isNaN(t)) continue;
    const s = Math.floor(t / WINDOW_MS) * WINDOW_MS;
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  const windows = [];
  if (counts.size) {
    const starts = [...counts.keys()];
    const lo = Math.min(...starts);
    const hi = Math.max(...starts);
    for (let s = Math.max(lo, hi - (MAX_WINDOWS - 1) * WINDOW_MS); s <= hi; s += WINDOW_MS) {
      windows.push({ start: new Date(s).toISOString(), resolved: counts.get(s) ?? 0 });
    }
  }

  // tokens by cell, resolved tickets only
  const acc = {};
  for (const r of rows) {
    if (r.kind !== "cell" || !resolvedSet.has(r.ticket) || typeof r.tokens !== "number") continue;
    const a = (acc[r.cell] ??= { tickets: new Set(), tokens: 0 });
    a.tickets.add(r.ticket);
    a.tokens += r.tokens;
  }
  const tokensByCell = {};
  for (const [c, a] of Object.entries(acc)) {
    tokensByCell[c] = { tickets: a.tickets.size, tokens: a.tokens, perTicket: Math.round(a.tokens / a.tickets.size) };
  }

  // incidents by tool
  const resolvedTickets = resolved.length;
  const incidentsByTool = {};
  if (resolvedTickets > 0) {
    const inc = {};
    for (const r of rows) if (r.kind === "incident") inc[mapTool(r.tool)] = (inc[mapTool(r.tool)] ?? 0) + 1;
    for (const tool of Object.keys(inc).sort()) {
      incidentsByTool[tool] = { incidents: inc[tool], perTicket: round2(inc[tool] / resolvedTickets) };
    }
  }

  // latest usage
  let usage = null;
  for (const r of rows) {
    if (r.kind !== "usage") continue;
    if (!usage || Date.parse(r.ts) > Date.parse(usage.ts)) usage = r;
  }

  return {
    schema: 1,
    throughput: { windowHours: WINDOW_HOURS, windows },
    tokensByCell,
    resolvedTickets,
    incidentsByTool,
    usage: usage ? { fiveHour: usage.five_hour, weekly: usage.weekly, sampledAt: usage.ts } : null,
  };
}

export function parseJsonl(text) {
  const out = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const v = JSON.parse(line);
      if (v && typeof v === "object" && !Array.isArray(v)) out.push(v);
    } catch {
      // skip malformed line
    }
  }
  return out;
}

function readRows(file) {
  try {
    return parseJsonl(readFileSync(file, "utf8"));
  } catch {
    return [];
  }
}

export function formatText(m) {
  const lines = [`Throughput (resolved per ${m.throughput.windowHours}h window)`];
  for (const w of m.throughput.windows) lines.push(`  ${w.start}  ${w.resolved}`);
  lines.push(`Resolved tickets: ${m.resolvedTickets}`, "Tokens per ticket by cell");
  for (const [c, v] of Object.entries(m.tokensByCell)) lines.push(`  ${c}: ${v.perTicket} (${v.tokens} over ${v.tickets})`);
  lines.push("Incidents per ticket by tool");
  for (const [t, v] of Object.entries(m.incidentsByTool)) lines.push(`  ${t}: ${v.perTicket} (${v.incidents})`);
  lines.push(m.usage ? `Usage: ${m.usage.fiveHour}% 5h, ${m.usage.weekly}% weekly (${m.usage.sampledAt})` : "Usage: no sample");
  return lines.join("\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = process.env.ORGANISM_ROOT || process.cwd();
  const m = computeMetrics({
    usageLines: readRows(path.join(root, ".scratch", "usage.jsonl")),
    eventLines: readRows(path.join(root, ".scratch", "events.jsonl")),
  });
  console.log(process.argv.includes("--json") ? JSON.stringify(m) : formatText(m));
}
