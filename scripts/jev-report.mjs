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

// ADR 0015 decisions 3 and 5: each route half is scored against the next board claim that maps to one of
// its labels, with its own coverage floor and safety rule.
const ROUTE_VARIANTS = {
  new: {
    labelOf: { product: "product", architect: "architect", designer: "designer", qa: "qa-specify", developer: "developer-direct" },
    minRows: 15,
    // developer-direct on a ticket that got qa tests would have skipped qa specify.
    isMiss: (u, claims) => u.r.pick === "developer-direct" && claims.some((c) => c.key === u.key && c.cell === "qa"),
  },
  bounce: {
    labelOf: { developer: "developer", qa: "qa", architect: "architect", user: "user" },
    minRows: 8,
    // A developer pick is a miss when the ticket resolved with no qa claim (verify) after the route row.
    isMiss: (u, claims, releases) => {
      if (u.r.pick !== "developer") return false;
      const ts = String(u.r.ts ?? "");
      const done = releases.find((e) => e.key === u.key && e.toStatus === "resolved" && e.ts > ts);
      return Boolean(done) && !claims.some((c) => c.key === u.key && c.cell === "qa" && c.ts > ts && c.ts < done.ts);
    },
  },
};

function boardEvents(events, op) {
  return events
    .filter((e) => e && e.op === op && e.feature && keyOf(`${e.feature}/${e.ticket}`))
    .map((e) => ({ key: keyOf(`${e.feature}/${e.ticket}`), cell: e.cell, toStatus: e.to_status, ts: String(e.ts ?? "") }))
    .sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));
}

function routeReport(rows, events, variant) {
  const { labelOf, minRows, isMiss } = ROUTE_VARIANTS[variant];
  const latest = new Map();
  for (const r of rows) {
    if (r.kind !== "jev" || r.point !== "route" || (r.variant ?? "new") !== variant) continue;
    const k = keyOf(r.ticket);
    if (!k) continue;
    const prev = latest.get(k);
    if (!prev || String(r.ts ?? "") >= String(prev.ts ?? "")) latest.set(k, r);
  }
  const claims = boardEvents(events, "claim");
  const releases = boardEvents(events, "release");

  const used = [];
  for (const [key, r] of latest) {
    const first = claims.find((c) => c.key === key && c.ts > String(r.ts ?? "") && labelOf[c.cell]);
    if (first) used.push({ key, r, actual: labelOf[first.cell] });
  }
  const picked = used.filter((u) => u.r.pick);
  const nonOther = picked.filter((u) => u.r.pick !== "other");
  const agreed = nonOther.filter((u) => u.r.pick === u.actual);
  const byLabel = {};
  for (const u of nonOther) {
    const b = (byLabel[u.r.pick] ??= { picks: 0, agreed: 0 });
    b.picks++;
    if (u.r.pick === u.actual) b.agreed++;
  }
  const n = used.length;
  const fallbacks = used.filter((u) => u.r.fallback && u.r.fallback !== "cap").length;
  const capFired = used.filter((u) => u.r.fallback === "cap").length;
  const medianMs = median(used.map((u) => Number(u.r.ms) || 0));
  const other = picked.length - nonOther.length;
  const agreementPct = nonOther.length ? (agreed.length / nonOther.length) * 100 : 0;
  const otherPct = n ? (other / n) * 100 : 0;
  const safetyMisses = used.filter((u) => isMiss(u, claims, releases)).map((u) => u.key);
  return {
    rows: n, fallbacks, capFired, medianMs, other, otherPct, nonOther: nonOther.length, agreed: agreed.length, agreementPct, byLabel,
    disagreements: nonOther.filter((u) => u.r.pick !== u.actual).map((u) => ({ ticket: u.key, pick: u.r.pick, actual: u.actual })),
    safetyMisses,
    checks: {
      coverage: n >= minRows && fallbacks * 5 <= n && medianMs < 2000,
      agreement: nonOther.length > 0 && agreementPct >= 85 && otherPct <= 35,
      safety: safetyMisses.length === 0,
      spend: capFired === 0,
    },
  };
}

export function buildReport(rows, events = []) {
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
  return { tickets, points, route: { newTicket: routeReport(rows, events, "new"), bounce: routeReport(rows, events, "bounce") } };
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
  const r = report.route?.newTicket;
  if (r) {
    lines.push("", "Route (new ticket, shadow; ADR 0015)");
    for (const [label, b] of Object.entries(r.byLabel)) lines.push(`route agreement ${label}: ${b.agreed}/${b.picks} agreed`);
    lines.push(...goLiveLines("route new-ticket", r, ROUTE_VARIANTS.new.minRows));
    for (const d of r.disagreements) lines.push(`route disagreement ${d.ticket}: pick ${d.pick}, actual ${d.actual}`);
  }
  const b = report.route?.bounce;
  if (b) {
    lines.push("", "Route (bounce, shadow; ADR 0015)");
    for (const [label, x] of Object.entries(b.byLabel)) lines.push(`route bounce agreement ${label}: ${x.agreed}/${x.picks} agreed`);
    lines.push(...goLiveLines("route bounce", b, ROUTE_VARIANTS.bounce.minRows));
    for (const d of b.disagreements) lines.push(`route bounce disagreement ${d.ticket}: pick ${d.pick}, actual ${d.actual}`);
  }
  return lines.join("\n") + "\n";
}

function goLiveLines(name, r, minRows) {
  const ok = (b) => (b ? "PASS" : "FAIL");
  return [
    `${name} coverage: ${ok(r.checks.coverage)} (${r.rows} rows of ${minRows}, ${r.fallbacks} fallbacks, ${r.capFired} cap, median ${r.medianMs} ms)`,
    `${name} agreement: ${ok(r.checks.agreement)} (${r.agreed}/${r.nonOther} = ${r.agreementPct.toFixed(1)}% of non-other, other ${r.otherPct.toFixed(1)}%)`,
    `${name} safety: ${ok(r.checks.safety)} (${r.safetyMisses.length} misses${r.safetyMisses.length ? ": " + r.safetyMisses.join(", ") : ""})`,
    `${name} spend: ${ok(r.checks.spend)} (${r.capFired} cap hits)`,
  ];
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
  const events = [];
  try {
    for (const line of readFileSync(path.join(path.dirname(usage), "events.jsonl"), "utf8").split("\n")) {
      if (!line.trim()) continue;
      try { events.push(JSON.parse(line)); } catch {}
    }
  } catch {}
  const report = buildReport(rows, events);
  process.stdout.write(json ? JSON.stringify(report, null, 2) + "\n" : formatReport(report));
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
