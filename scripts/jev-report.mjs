#!/usr/bin/env node
// Jev shadow report (ADR 0010, decision 10): joins jev rows with cell and resolved rows in
// usage.jsonl, projects counterfactual tokens per ticket and prints the exit-criteria table.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TIER_WEIGHT = { haiku: 0.5, sonnet: 1, opus: 2 };
const VERIFY_WEIGHT = { light: 0.5, full: 1 };
const POINTS = ["tier", "verify"];

function keyOf(ref) {
  const m = /^([^/]+)\/(\d+)/.exec(String(ref ?? ""));
  return m ? `${m[1]}/${m[2]}` : null;
}

function median(xs) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function buildReport(rows) {
  const info = new Map(); // key -> { cells, bounces }
  const get = (k) => {
    if (!info.has(k)) info.set(k, { cells: [], bounces: 0, resolved: false });
    return info.get(k);
  };
  const latest = new Map(); // `${key}|${point}` -> jev row
  for (const r of rows) {
    const k = keyOf(r.ticket);
    if (!k) continue;
    if (r.kind === "cell") get(k).cells.push(r);
    else if (r.kind === "resolved") { get(k).bounces = Number(r.bounces) || 0; get(k).resolved = true; }
    else if (r.kind === "jev" && POINTS.includes(r.point)) {
      const id = `${k}|${r.point}`;
      const prev = latest.get(id);
      if (!prev || String(r.ts ?? "") >= String(prev.ts ?? "")) latest.set(id, r);
    }
  }

  const tickets = [];
  for (const [ticket, { cells, bounces, resolved }] of [...info].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    const tok = (c) => Number(c.tokens) || 0;
    const baseline = cells.reduce((s, c) => s + tok(c), 0);
    const tierRow = latest.get(`${ticket}|tier`);
    const verifyRow = latest.get(`${ticket}|verify`);
    const tierW = !tierRow?.fallback && TIER_WEIGHT[tierRow?.pick] !== undefined ? TIER_WEIGHT[tierRow.pick] : 1;
    const verifyW = !verifyRow?.fallback && VERIFY_WEIGHT[verifyRow?.pick] !== undefined ? VERIFY_WEIGHT[verifyRow.pick] : 1;
    let tier = 0;
    let verify = 0;
    let both = 0;
    for (const c of cells) {
      const isDev = c.cell === "developer";
      const isVerify = c.cell === "qa" && String(c.mode ?? "").startsWith("verify");
      tier += tok(c) * (isDev ? tierW : 1);
      verify += tok(c) * (isVerify ? verifyW : 1);
      both += tok(c) * (isDev ? tierW : isVerify ? verifyW : 1);
    }
    tickets.push({ ticket, resolved, baseline, projected: { tier, verify, both }, bounces });
  }

  const byKey = Object.fromEntries(tickets.map((t) => [t.ticket, t]));
  const points = {};
  for (const point of POINTS) {
    const jr = [...latest].filter(([id]) => byKey[id.split("|")[0]]?.baseline > 0 && id.endsWith(`|${point}`)).map(([id, r]) => [id.split("|")[0], r]);
    const rv = jr.filter(([k]) => byKey[k].resolved); // value counts resolved tickets only (ADR 0010)
    const baseline = rv.reduce((s, [k]) => s + byKey[k].baseline, 0);
    const projected = rv.reduce((s, [k]) => s + byKey[k].projected[point], 0);
    points[point] = {
      tickets: jr.length,
      fallbacks: jr.filter(([, r]) => r.fallback && r.fallback !== "cap").length,
      capFired: jr.filter(([, r]) => r.fallback === "cap").length,
      medianMs: median(jr.map(([, r]) => Number(r.ms) || 0)),
      jevCost: jr.reduce((s, [, r]) => s + (Number(r.cost) || 0), 0),
      baseline,
      projected,
      savedPct: baseline ? ((baseline - projected) / baseline) * 100 : 0,
      bounces: rv.reduce((s, [k]) => s + byKey[k].bounces, 0),
    };
  }
  return { tickets, points };
}

const pct = (n) => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;

export function formatReport(report) {
  const lines = ["Jev shadow report (ADR 0010)", ""];
  lines.push("Exit criteria per point");
  lines.push("point   | coverage (tickets, fallbacks, cap) | safety (bounces) | value (projected change vs baseline) | spend (jev cost, median ms)");
  for (const p of POINTS) {
    const x = report.points[p];
    const change = x.baseline ? ((x.projected - x.baseline) / x.baseline) * 100 : 0;
    lines.push(
      `${p.padEnd(7)} | ${x.tickets} tickets, ${x.fallbacks} fallbacks, ${x.capFired} cap | ${x.bounces} bounces | ` +
        `savings ${pct(x.savedPct)} (projected ${x.projected} vs baseline ${x.baseline} tokens; positive = fewer tokens, ` +
        `token change ${pct(change)}) | $${x.jevCost.toFixed(4)}, ${x.medianMs} ms`,
    );
  }
  lines.push("", "Per ticket (weighted tokens: baseline, projected tier / verify / both)");
  for (const t of report.tickets) {
    lines.push(`${t.ticket}: baseline ${t.baseline}, tier ${t.projected.tier}, verify ${t.projected.verify}, both ${t.projected.both}, bounces ${t.bounces}`);
  }
  return lines.join("\n") + "\n";
}

function main(argv) {
  let usage = path.join(process.env.ORGANISM_ROOT || process.cwd(), ".scratch", "usage.jsonl");
  let json = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--usage") usage = argv[++i];
    else if (argv[i] === "--json") json = true;
  }
  let text;
  try {
    text = readFileSync(usage, "utf8");
  } catch (e) {
    process.stderr.write(`jev-report: cannot read ${usage}: ${e.message}\n`);
    return 1;
  }
  const rows = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try {
      rows.push(JSON.parse(line));
    } catch {
      // skip malformed lines
    }
  }
  const report = buildReport(rows);
  process.stdout.write(json ? JSON.stringify(report, null, 2) + "\n" : formatReport(report));
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
