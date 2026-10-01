#!/usr/bin/env node
// Plan-quota cost per resolved ticket, from .scratch/usage.jsonl.
// Usage: node scripts/usage-per-ticket.mjs [--since <iso>] [--until <iso>]
//        [--exclude <from>..<to>]... [--file <path>] [--json]
// A 5-hour window starts where a reading drops 8 or more points below the one before, or
// more than 5 hours after it.
// Per window: peak 5-hour %, tickets resolved within 5 hours of its start (and before the next window), peak % per ticket. A peak is a
// lower bound (rows are logged only at dispatches and returns). Weekly points per ticket
// sum the increases between consecutive weekly readings (a drop is a reset and adds 0). Rows whose provider, source or note
// mentions codex are skipped (a different quota); use --exclude for other stretches.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RESET_DROP = 8;
const WINDOW_MS = 5 * 60 * 60 * 1000;
const CODEX = /codex/i;

export function parseRows(text) {
  const rows = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try {
      rows.push(JSON.parse(line));
    } catch {
      continue;
    }
  }
  return rows;
}

function inRange(ts, { since, until, exclude = [] }) {
  if (since && ts < since) return false;
  if (until && ts > until) return false;
  return !exclude.some(([from, to]) => ts >= from && ts <= to);
}

const isCodex = (r) => CODEX.test(`${r.provider ?? ""} ${r.source ?? ""} ${r.note ?? ""}`);

function nextStart(windows, w) {
  const next = windows[windows.indexOf(w) + 1];
  return next ? Date.parse(next.start) : Infinity;
}

export function perTicket(rows, range = {}) {
  const byTs = (a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0);
  const usage = rows
    .filter((r) => r.kind === "usage" && r.ts && Number.isFinite(r.five_hour) && !isCodex(r) && inRange(r.ts, range))
    .sort(byTs);
  const resolved = rows.filter((r) => r.kind === "resolved" && r.ts && inRange(r.ts, range)).sort(byTs);

  const windows = [];
  let cur = null;
  let prev = null;
  for (const r of usage) {
    const gap = prev ? Date.parse(r.ts) - Date.parse(prev.ts) : 0;
    if (!cur || r.five_hour < prev.five_hour - RESET_DROP || gap > WINDOW_MS) {
      cur = { start: r.ts, end: r.ts, peak: r.five_hour };
      windows.push(cur);
    }
    cur.end = r.ts;
    cur.peak = Math.max(cur.peak, r.five_hour);
    prev = r;
  }
  for (const w of windows) {
    const until = Math.min(Date.parse(w.start) + WINDOW_MS, nextStart(windows, w));
    w.resolved = resolved.filter((x) => Date.parse(x.ts) >= Date.parse(w.start) && Date.parse(x.ts) < until).length;
    w.pctPerTicket = w.resolved ? w.peak / w.resolved : null;
  }

  const counted = windows.filter((w) => w.resolved > 0);
  const peakSum = counted.reduce((s, w) => s + w.peak, 0);
  const tickets = counted.reduce((s, w) => s + w.resolved, 0);

  const weekly = usage.filter((r) => Number.isFinite(r.weekly));
  let weeklyPoints = 0;
  for (let i = 1; i < weekly.length; i++) weeklyPoints += Math.max(0, weekly[i].weekly - weekly[i - 1].weekly);
  const weeklyTickets = weekly.length >= 2
    ? resolved.filter((x) => x.ts >= weekly[0].ts && x.ts <= weekly.at(-1).ts).length
    : 0;
  const weeklyPerTicket = weeklyTickets ? weeklyPoints / weeklyTickets : null;

  return {
    windows,
    fiveHourPerTicket: tickets ? peakSum / tickets : null,
    tickets,
    weeklyPerTicket,
  };
}

function parseArgs(argv) {
  const opts = { exclude: [], file: null, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") opts.json = true;
    else if (a === "--since" || a === "--until" || a === "--file") opts[a.slice(2)] = argv[++i];
    else if (a === "--exclude") {
      const [from, to] = (argv[++i] ?? "").split("..");
      if (!from || !to) throw new Error("--exclude needs <from>..<to>");
      opts.exclude.push([from, to]);
    } else throw new Error(`unknown argument: ${a}`);
  }
  return opts;
}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const file = opts.file ?? path.join(root, ".scratch", "usage.jsonl");
  const result = perTicket(parseRows(readFileSync(file, "utf8")), opts);
  if (opts.json) {
    console.log(JSON.stringify(result));
    return;
  }
  console.log("window start      end               peak5h  resolved  %/ticket");
  for (const w of result.windows) {
    const per = w.pctPerTicket === null ? "-" : w.pctPerTicket.toFixed(1);
    console.log(`${w.start.slice(5, 16)}  ${w.end.slice(5, 16)}  ${String(w.peak).padStart(6)}  ${String(w.resolved).padStart(8)}  ${per.padStart(8)}`);
  }
  const f = (n) => (n === null ? "n/a" : n.toFixed(2));
  console.log(`5-hour % per ticket: ${f(result.fiveHourPerTicket)} over ${result.tickets} tickets`);
  console.log(`weekly points per ticket: ${f(result.weeklyPerTicket)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
