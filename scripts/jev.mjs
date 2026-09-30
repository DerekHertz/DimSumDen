#!/usr/bin/env node
// organism-infra/38: Jev pre-check script (ADR 0010).
// Usage: node scripts/jev.mjs <tier|verify> --ticket <feature>/<NN-slug> [--tests <path>] [--mode shadow|live]
// Always exits 0 (fallback on any failure) except invalid arguments (exit 2).
// Transport: plain HTTP per https://docs.typesafe.ai/api.md (POST /v1/systemone, Bearer key).
import { appendFileSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { SECRET_PATTERNS } from "./risk-check.mjs";

const MODEL = "jev-1.13.0";
const MAX_CHARS = 16000;
const CAP = 0.5;
const PRICE_PER_INPUT_TOKEN = 0.042 / 1e6; // output is free (ADR 0010)
const ENDPOINT = "https://api.typesafe.ai/v1/systemone";

const POINTS = {
  tier: {
    labels: ["standard", "hard", "other"],
    map: { standard: "sonnet", hard: "opus" },
    fallback: "sonnet",
    instructions:
      "Which developer model tier does this ticket need? Pick hard when it spans several modules, has a lock, race or migration concern, or its spec is ambiguous; otherwise standard.",
    criteria: {
      standard: "Small or well-specified change in one area",
      hard: "Spans several modules, or a lock, race or migration concern, or an ambiguous spec",
      other: "Cannot tell from this text",
    },
  },
  verify: {
    labels: ["light", "full", "other"],
    map: { light: "light", full: "full" },
    fallback: "full",
    instructions:
      "How deep must qa verification look? Pick light only when the test output shows every test passing with none skipped and the ticket adds no new behavior beyond its listed criteria; otherwise full.",
    criteria: {
      light: "All tests pass, none skipped, no behavior beyond the listed criteria",
      full: "Any failure, skip, or behavior beyond the listed criteria",
      other: "Cannot tell from this text",
    },
  },
  // organism-infra/69: new-ticket route, shadow only (ADR 0015 decision 3). The offered labels vary per ticket.
  route: {
    labels: ["product", "architect", "designer", "qa-specify", "developer-direct", "user", "other"],
    fallback: "orchestrator",
    instructions:
      "Which cell should take this new ticket first? Pick the one whose work the ticket needs next; pick other when the text does not say.",
    criteria: {
      product: "Needs a spec, scope or acceptance criteria before anyone builds",
      architect: "Needs a design or decision before anyone builds",
      designer: "Needs a UI or visual spec, or is a UI or asset ticket",
      "qa-specify": "Well specified code change: failing tests come first",
      "developer-direct": "Non-code ticket that a developer can start without qa tests",
      user: "Needs a decision or verdict from the user first",
      other: "Cannot tell from this text",
    },
  },
};

// Reserved budget (ADR 0015 decision 7): each point may always spend its own reservation inside CAP.
const RESERVED = { tier: 0.05, verify: 0.05, route: 0.05 };
const SHARED = 0.35;
const EPS = 1e-9;

const NON_CODE_TYPES = ["asset", "research", "review", "grilling", "design", "design-direction", "design-question", "decision", "prototype"];

export function offeredLabels({ codeTicket = true, forbid = [] } = {}) {
  return POINTS.route.labels.filter(
    (l) => l === "other" || (!forbid.includes(l) && (l !== "developer-direct" || !codeTicket)),
  );
}

export async function fetchTransport({ point, text, model, apiKey, signal, labels }) {
  const p = POINTS[point];
  const criteria = point === "route" && labels
    ? Object.fromEntries(Object.entries(p.criteria).filter(([l]) => labels.includes(l)))
    : p.criteria;
  const res = await fetch(ENDPOINT, {
    method: "POST",
    signal,
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      state: text,
      model,
      questions: { [point]: { type: "choice", instructions: p.instructions, criteria } },
    }),
  });
  if (!res.ok) {
    const e = new Error(`HTTP ${res.status}`);
    e.status = res.status;
    throw e;
  }
  const body = await res.json();
  const a = body?.answers?.[point];
  return {
    pick: a?.choice,
    probs: a?.probabilities,
    usage: { cost: (body?.usage?.input_tokens ?? 0) * PRICE_PER_INPUT_TOKEN },
  };
}

// Today's jev spend: total, and the draw on the shared remainder (each point's spend above its reservation).
function todaysSpend(rows, now, point) {
  const day = now.toISOString().slice(0, 10);
  const byPoint = {};
  let total = 0;
  for (const r of rows) {
    if (r && r.kind === "jev" && typeof r.ts === "string" && r.ts.slice(0, 10) === day) {
      const c = Number(r.cost) || 0;
      total += c;
      byPoint[r.point] = (byPoint[r.point] ?? 0) + c;
    }
  }
  const shared = Object.entries(byPoint).reduce((s, [k, v]) => s + Math.max(0, v - (RESERVED[k] ?? 0)), 0);
  return { total, own: byPoint[point] ?? 0, shared };
}

export async function decide({
  point, ticket, ticketText = "", testsText = "", now = new Date(), usageRows = [],
  env = process.env, mode = "shadow", timeoutMs = 10000, transport = fetchTransport, qaSpecified = true,
  codeTicket = true, forbid = [], status,
}) {
  const p = POINTS[point];
  const t0 = Date.now();
  const isRoute = point === "route";
  const labels = isRoute ? offeredLabels({ codeTicket, forbid }) : null;
  const build = (fields) => {
    const fb = fields.fallback ?? null;
    const pick = fb ? null : fields.pick;
    const live = mode === "live" && !fb && pick && pick !== "other";
    // organism-infra/58: verify floors to full when qa never ran specify.
    const floor = point === "verify" && qaSpecified === false ? "full" : null;
    const actual = floor ? floor : live ? pick : p.fallback;
    const conf = fb ? null : fields.conf;
    const cost = fb ? 0 : fields.cost;
    const row = {
      kind: "jev", ts: now.toISOString(), ticket, point, pick, actual, cost, conf,
      mode, fallback: fb, floor, ms: Date.now() - t0, model: MODEL,
    };
    if (isRoute) row.variant = "new";
    const result = { pick, conf, effective: actual, applied: Boolean(live) && actual === pick, fallback: fb, floor };
    // ADR 0015 decision 3: a shadow route result must not show the pick, only the row carries it.
    if (isRoute && !live) { delete result.pick; delete result.conf; }
    return { result, row };
  };
  const fail = (reason) => build({ fallback: reason });

  // The state machine dictates the next cell unless the ticket is fresh: no call.
  if (isRoute && status && status !== "ready-for-agent") return fail("state-machine");
  let text = point === "verify" ? `${ticketText}\n\n--- test output ---\n${testsText}` : ticketText;
  if (SECRET_PATTERNS.some((s) => s.re.test(text))) return fail("blocked-input");
  if (text.length > MAX_CHARS) text = text.slice(text.length - MAX_CHARS);
  const apiKey = env.TYPESAFE_API_KEY;
  if (!apiKey) return fail("no-key");
  const spent = todaysSpend(usageRows, now, point);
  const reserve = RESERVED[point] ?? 0;
  if (spent.total >= CAP || (spent.own >= reserve - EPS && spent.shared >= SHARED - EPS)) return fail("cap");

  const ctl = new AbortController();
  let timer;
  let answer;
  try {
    answer = await Promise.race([
      Promise.resolve().then(() => transport({ point, text, model: MODEL, apiKey, signal: ctl.signal, ...(isRoute ? { labels } : {}) })),
      new Promise((_, rej) => {
        timer = setTimeout(() => {
          ctl.abort();
          const e = new Error("timeout");
          e.timeout = true;
          rej(e);
        }, timeoutMs);
      }),
    ]);
  } catch (e) {
    if (e?.timeout) return fail("timeout");
    return fail(e && e.status ? "http" : "network");
  } finally {
    clearTimeout(timer);
  }

  const label = answer?.pick;
  const prob = answer?.probs?.[label];
  const cost = Number(answer?.usage?.cost);
  const c = Number.isFinite(cost) ? cost : 0;
  if (isRoute) {
    // Anything outside the offered set (unknown or forbidden) is other, not a fallback.
    const ok = labels.includes(label);
    return build({ pick: ok ? label : "other", conf: ok && typeof prob === "number" ? prob : null, cost: c });
  }
  if (!p.labels.includes(label) || typeof prob !== "number") return fail("unparseable");
  return build({ pick: p.map[label] ?? "other", conf: prob, cost: c });
}

function boardRoot() {
  if (process.env.ORGANISM_ROOT) return process.env.ORGANISM_ROOT;
  try {
    const out = execFileSync("git", ["worktree", "list", "--porcelain"], { encoding: "utf8" });
    const m = out.match(/^worktree (.+)$/m);
    if (m) return m[1];
  } catch {}
  return process.cwd();
}

function usage(msg) {
  process.stderr.write(`jev: ${msg}\nusage: node scripts/jev.mjs <tier|verify|route> --ticket <feature>/<NN-slug> [--tests <path>] [--mode shadow|live]\n`);
  return 2;
}

async function main(argv) {
  const point = argv[0];
  if (!POINTS[point]) return usage("point must be tier, verify or route");
  const opts = { mode: "shadow" };
  for (let i = 1; i < argv.length; i += 2) {
    const k = argv[i];
    const v = argv[i + 1];
    if (!["--ticket", "--tests", "--mode"].includes(k) || v === undefined) return usage(`bad argument ${k}`);
    opts[k.slice(2)] = v;
  }
  if (!opts.ticket) return usage("--ticket is required");
  if (!/^[\w.-]+\/[\w.-]+$/.test(opts.ticket) || opts.ticket.includes("..")) return usage("bad --ticket");
  if (!["shadow", "live"].includes(opts.mode)) return usage("--mode must be shadow or live");

  const root = boardRoot();
  const [feature, slug] = opts.ticket.split("/");
  const ticketPath = path.join(root, ".scratch", feature, "issues", `${slug}.md`);
  const usagePath = path.join(root, ".scratch", "usage.jsonl");
  const readOr = (f) => { try { return readFileSync(f, "utf8"); } catch { return ""; } };
  const usageRows = readOr(usagePath).split("\n").filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });

  const nn = slug.match(/^\d+/)?.[0];
  let qaSpecified = false;
  if (nn) {
    try {
      qaSpecified = readdirSync(path.join(root, ".scratch", feature, "handoffs"))
        .some((f) => f.startsWith(`${nn}-qa-specify`) && f.endsWith(".md"));
    } catch {}
  }

  // Route: Status comes from the ticket; a ticket is non-code only when its **Type:** says so (else code, the safe side).
  const ticketText = readOr(ticketPath);
  const status = ticketText.match(/^\*\*Status:\*\*\s*(\S+)/m)?.[1];
  const type = ticketText.match(/^\*\*Type:\*\*\s*([\w-]+)/m)?.[1]?.toLowerCase();
  const codeTicket = !NON_CODE_TYPES.includes(type);

  const { result, row } = await decide({
    point, ticket: opts.ticket, ticketText, qaSpecified, status, codeTicket,
    testsText: opts.tests ? readOr(opts.tests) : "", usageRows, mode: opts.mode,
  });
  appendFileSync(usagePath, JSON.stringify(row) + "\n");
  process.stdout.write(JSON.stringify({ ...result, point, ticket: opts.ticket, mode: opts.mode }) + "\n");
  return 0;
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2)).then((c) => process.exit(c));
}
