// queue/02: the Queue, the frontier in its computed order (ADR 0015 Amendment 3, decisions 1, 2, 4, 5, 9, 12, 14).
//
// Two exports:
//   loadSnapshot(root)    the one reader: tickets, the active-feature row, resolved rows, picks (async, read only)
//   buildQueue(snapshot)  a pure function of a plain snapshot object, no I/O, no clock
//
// Snapshot shape:
//   { active: "<feature>" | null, activeSince?: "<ts>",
//     tickets: [{ ref, feature, num, status, priority: 0..3, blockedBy: [full refs],
//                 origin: "spec" | "added" | null, p0Reason: string | null, readySince?: "<ts>" }],
//     resolved?: [{ ts }], picks?: [{ ts, picked }] }
//
// Order: tier (P0 with a reason, then the active feature, then the rest); inside a tier, unblock count (most first),
// then the P line (lowest first), then the lowest ticket number. Scope is not used.
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { readStatus } from "./board-service.mjs";
import { parsePriority } from "./priority.mjs";
import { compareRefs } from "../../packages/board-refs/src/compare-refs.mjs";

const DECAY_LIMIT = 5;
const TIER_RANK = { p0: 0, active: 1, rest: 2 };
const FEATURE_RE = /^[a-z0-9-]+$/;
const TICKET_FILE_RE = /^(\d{2,})-[a-z0-9-]+\.md$/;

function tierOf(ticket, active) {
  if (ticket.priority === 0 && ticket.p0Reason) return "p0";
  if (active && ticket.feature === active) return "active";
  return "rest";
}

function tsMs(ts) {
  const ms = Date.parse(ts);
  return Number.isNaN(ms) ? -Infinity : ms;
}

// Decay count left (Amendment 3 decision 9 and Consequences): 5 minus the resolved rows after the ticket's readySince
// or its last pick, whichever is later. A ticket in the active feature never decays (null).
function decayLeftFor(ticket, snapshot) {
  if (snapshot.active && ticket.feature === snapshot.active) return null;
  let since = ticket.readySince === undefined ? -Infinity : tsMs(ticket.readySince);
  for (const pick of snapshot.picks ?? []) {
    if (pick.picked === ticket.ref) since = Math.max(since, tsMs(pick.ts));
  }
  const resolvedSince = (snapshot.resolved ?? []).filter((r) => tsMs(r.ts) > since).length;
  return Math.max(0, DECAY_LIMIT - resolvedSince);
}

function whyLine(tier, ticket, unblock, decayLeft) {
  const tierText = tier === "p0" ? `p0 tier (${ticket.p0Reason})` : `${tier} tier`;
  const decayText = decayLeft === null ? "never decays" : `decay in ${decayLeft} resolved`;
  return `${tierText}, unblocks ${unblock}, P${ticket.priority}, ${decayText}`;
}

export function buildQueue(snapshot) {
  const tickets = snapshot.tickets ?? [];
  const active = snapshot.active ?? null;
  const resolvedRefs = new Set(tickets.filter((t) => t.status === "resolved").map((t) => t.ref));

  // Unblock count: tickets still open that name this one in Blocked by.
  const unblockCount = new Map();
  for (const t of tickets) {
    if (t.status === "resolved" || t.status === "closed") continue;
    for (const dep of new Set(t.blockedBy ?? [])) unblockCount.set(dep, (unblockCount.get(dep) ?? 0) + 1);
  }

  const ordered = tickets
    .filter((t) => t.status === "ready-for-agent" && (t.blockedBy ?? []).every((dep) => resolvedRefs.has(dep)))
    .map((t) => {
      const tier = tierOf(t, active);
      const unblock = unblockCount.get(t.ref) ?? 0;
      const decayLeft = decayLeftFor(t, { ...snapshot, active });
      return { ref: t.ref, tier, unblock, p: t.priority, decayLeft, why: whyLine(tier, t, unblock, decayLeft), num: t.num };
    })
    .sort(
      (a, b) =>
        TIER_RANK[a.tier] - TIER_RANK[b.tier] ||
        b.unblock - a.unblock ||
        a.p - b.p ||
        a.num - b.num ||
        compareRefs(a.ref, b.ref)
    )
    .map(({ num, ...item }) => item);

  const unplanned = {};
  for (const t of tickets) {
    const row = (unplanned[t.feature] ??= { planned: 0, added: 0 });
    if (t.origin === "added") row.added += 1;
    else row.planned += 1;
  }

  // gated and expired stay empty until the admission gate and decay parking exist (queue/03, queue/05).
  return { ordered, gated: [], expired: [], unplanned };
}

// --- the reader ------------------------------------------------------------------------------------------------

function header(markdown) {
  const section = /^## /m.exec(markdown);
  return section ? markdown.slice(0, section.index) : markdown;
}

// "Blocked by" text to refs. Reads `feature/NN` (optionally with a slug) and bare `NN` (same feature). A number with no
// ticket behind it stays as `feature/NN`, which is never resolved, so the ticket stays blocked.
function parseBlockedBy(text, feature, byNum) {
  const refs = [];
  const link = (f, nn) => refs.push(byNum.get(`${f}/${Number(nn)}`) ?? `${f}/${nn}`);
  const rest = text.replace(/([a-z0-9][a-z0-9-]*)\/(\d{2,})(?:-[a-z0-9-]*)?/g, (_m, f, nn) => {
    link(f, nn);
    return " ";
  });
  for (const m of rest.matchAll(/(?<![\w.-])(\d{1,})(?![\w-])/g)) link(feature, m[1]);
  return refs;
}

async function readJsonLines(file) {
  const raw = await readFile(file, "utf8").catch(() => "");
  const rows = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line);
      if (row && typeof row === "object") rows.push(row);
    } catch {
      // a junk line is skipped
    }
  }
  return rows;
}

export async function loadSnapshot(root) {
  const scratch = path.join(root, ".scratch");
  const usage = await readJsonLines(path.join(scratch, "usage.jsonl"));
  const events = await readJsonLines(path.join(scratch, "events.jsonl"));

  let active = null;
  let activeSince;
  for (const row of usage) {
    if (row.kind === "config" && typeof row.queue_active === "string" && FEATURE_RE.test(row.queue_active)) {
      active = row.queue_active;
      activeSince = row.ts;
    }
  }
  const resolved = usage.filter((r) => r.kind === "resolved" && typeof r.ts === "string").map((r) => ({ ts: r.ts }));
  const picks = usage
    .filter((r) => r.kind === "queue-pick" && typeof r.ts === "string" && typeof r.picked === "string")
    .map((r) => ({ ts: r.ts, picked: r.picked }));

  // The last time each ticket went to ready-for-agent (create, unpark, reopen or release back to ready).
  const readyAt = new Map();
  for (const e of events) {
    if (e.to_status === "ready-for-agent" && typeof e.ts === "string") readyAt.set(`${e.feature}/${e.ticket}`, e.ts);
  }

  const raw = [];
  const entries = await readdir(scratch, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (!entry.isDirectory() || !FEATURE_RE.test(entry.name)) continue;
    const dir = path.join(scratch, entry.name, "issues");
    for (const file of (await readdir(dir).catch(() => [])).sort()) {
      const m = TICKET_FILE_RE.exec(file);
      if (!m) continue;
      const markdown = await readFile(path.join(dir, file), "utf8").catch(() => null);
      if (markdown === null) continue;
      raw.push({ feature: entry.name, slug: file.slice(0, -3), num: Number(m[1]), markdown, file: path.join(dir, file) });
    }
  }
  const byNum = new Map(raw.map((r) => [`${r.feature}/${r.num}`, `${r.feature}/${r.slug}`]));

  const tickets = [];
  for (const r of raw) {
    const head = header(r.markdown);
    const ref = `${r.feature}/${r.slug}`;
    const status = readStatus(r.markdown);
    const blockedText = /^\*\*Blocked by:\*\*(.*)$/m.exec(head)?.[1] ?? "";
    const origin = /^\*\*Origin:\*\*[ \t]*(spec|added)\b/m.exec(head)?.[1] ?? null;
    const p0Reason = /^\*\*P0-reason:\*\*[ \t]*(\S.*?)[ \t]*$/m.exec(head)?.[1] ?? null;
    const ticket = {
      ref,
      feature: r.feature,
      num: r.num,
      status,
      priority: Number(parsePriority(head).slice(1)),
      blockedBy: parseBlockedBy(blockedText, r.feature, byNum),
      origin,
      p0Reason,
    };
    if (status === "ready-for-agent") {
      ticket.readySince = readyAt.get(ref) ?? new Date((await stat(r.file)).mtimeMs).toISOString();
    }
    tickets.push(ticket);
  }

  return { active, activeSince, tickets, resolved, picks };
}

// --- the printed form ------------------------------------------------------------------------------------------

export function formatQueue(queue, snapshot = {}) {
  const lines = [];
  lines.push(
    snapshot.active
      ? `Queue (active feature: ${snapshot.active}${snapshot.activeSince ? `, set ${snapshot.activeSince}` : ""})`
      : "Queue (no active feature)"
  );
  if (!queue.ordered.length) lines.push("  (nothing ready)");
  queue.ordered.forEach((item, i) => lines.push(`${i + 1}. ${item.ref}  ${item.why}`));
  lines.push("");
  lines.push("Planned and added per feature:");
  for (const feature of Object.keys(queue.unplanned).sort()) {
    const { planned, added } = queue.unplanned[feature];
    lines.push(`  ${feature}: ${planned} planned, ${added} added`);
  }
  lines.push("");
  lines.push("Parked by gate:");
  if (!queue.gated.length) lines.push("  (none)");
  for (const g of queue.gated) lines.push(`  ${g.ref}: ${g.reasons.join("; ")}`);
  return lines.join("\n");
}
