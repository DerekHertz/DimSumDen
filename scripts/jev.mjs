#!/usr/bin/env node
// organism-infra/38: Jev pre-check script (ADR 0010).
// Usage: node scripts/jev.mjs <tier|verify|route> --ticket <feature>/<NN-slug> [--tests <path>] [--mode shadow|live]
// Always exits 0 (fallback on any failure) except invalid arguments, including a refused --tests path (exit 2).
// Transport: plain HTTP per https://docs.typesafe.ai/api.md (POST /v1/systemone, Bearer key).
import {
  appendFileSync, closeSync, constants, fstatSync, lstatSync, openSync, readdirSync, readFileSync, realpathSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { hasSecret, isDenied } from "./exposure.mjs";

const MODEL = "jev-1.13.0";
const MAX_CHARS = 16000;
const MAX_TESTS_BYTES = 1024 * 1024;
const BOUNCE_CAP = 2000;
const WAKE_CAP = 4000;
const CELL_TYPES = ["product", "architect", "orchestrator", "developer", "scout", "qa", "security", "designer", "herald"];
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
  // organism-infra/77: bounce half of route (ADR 0015 decision 3; ticket 70 wires the CLI).
  "route-bounce": {
    labels: ["developer", "qa", "architect", "user", "other"],
    fallback: "orchestrator",
    instructions:
      "This ticket bounced at review. Which cell should take it next? Pick the one the bounce verdict asks for; pick other when the text does not say.",
    criteria: {
      developer: "The code must change to meet the criteria",
      qa: "The tests or the verification must change",
      architect: "The bounce raises a design or decision question",
      user: "Needs a decision or verdict from the user",
      other: "Cannot tell from this text",
    },
  },
  // organism-infra/77: wake-up gate's one Jev question (ADR 0015 decision 6; ticket 72 wires the prelude).
  wake: {
    labels: ["needs-claude", "informational", "other"],
    map: { "needs-claude": "needs-claude", informational: "informational" },
    fallback: "needs-claude",
    instructions:
      "Does this new ticket comment need the orchestrator to act? Pick informational only when it asks for nothing and changes nothing; otherwise needs-claude.",
    criteria: {
      "needs-claude": "Asks for an action, a decision, or changes what the ticket needs",
      informational: "A status note that asks for nothing",
      other: "Cannot tell from this text",
    },
  },
};

// organism-infra/77: each point sends only its allowlisted inputs (security review 67). Handoff text is never an input.
const ticketHeader = (t) =>
  [t.match(/^#\s.*$/m)?.[0], t.match(/^\*\*Status:\*\*.*$/m)?.[0]].filter(Boolean).join("\n");
const INPUTS = {
  tier: (a) => a.ticketText,
  verify: (a) => `${a.ticketText}\n\n--- test output ---\n${a.testsText}`,
  route: (a) => a.ticketText,
  "route-bounce": (a) => `${a.ticketText}\n\n--- bounce verdict ---\n${a.bounceComment.slice(0, BOUNCE_CAP)}`,
  wake: (a) => `${ticketHeader(a.ticketText).slice(0, WAKE_CAP)}\n\n--- new comment ---\n${a.newComment.slice(0, WAKE_CAP)}`,
};

// ADR 0015 decision 6: code, not Jev, wakes on these comments.
function codeWakes({ newComment, author, verdict }) {
  if (verdict || !newComment || /scope added/i.test(newComment)) return true;
  return author == null || !CELL_TYPES.includes(author);
}

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
  const criteria = labels
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
  codeTicket = true, forbid = [], status, bounceComment = "", newComment = "", author, verdict,
}) {
  const p = POINTS[point];
  const t0 = Date.now();
  const isBounce = point === "route-bounce";
  const isRoute = point === "route" || isBounce;
  // Both route halves log as point "route" and share its reservation; the row's variant tells them apart.
  const rowPoint = isRoute ? "route" : point;
  const labels = isBounce
    ? p.labels.filter((l) => l === "other" || !forbid.includes(l))
    : isRoute ? offeredLabels({ codeTicket, forbid }) : null;
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
      kind: "jev", ts: now.toISOString(), ticket, point: rowPoint, pick, actual, cost, conf,
      mode, fallback: fb, floor, ms: Date.now() - t0, model: MODEL,
    };
    if (isRoute) row.variant = isBounce ? "bounce" : "new";
    const result = { pick, conf, effective: actual, applied: Boolean(live) && actual === pick, fallback: fb, floor };
    // ADR 0015 decision 3: a shadow route result must not show the pick, only the row carries it.
    if (isRoute && !live) { delete result.pick; delete result.conf; }
    return { result, row };
  };
  const fail = (reason) => build({ fallback: reason });

  // The state machine dictates the next cell unless the ticket is fresh: no call.
  if (point === "route" && status && status !== "ready-for-agent") return fail("state-machine");
  if (point === "wake" && codeWakes({ newComment, author, verdict })) return fail("code-wake");
  let text = INPUTS[point]({ ticketText, testsText, bounceComment, newComment });
  if (hasSecret(text)) return fail("blocked-input");
  if (text.length > MAX_CHARS) text = text.slice(text.length - MAX_CHARS);
  const apiKey = env.TYPESAFE_API_KEY;
  if (!apiKey) return fail("no-key");
  const spent = todaysSpend(usageRows, now, rowPoint);
  const reserve = RESERVED[rowPoint] ?? 0;
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

// organism-infra/77: --tests must be a regular, non-symlink file of at most 1 MB, and neither its path
// nor its realpath may be denied. Returns the text, or an error message.
function readTests(p) {
  let fd;
  try {
    if (lstatSync(p).isSymbolicLink()) return { error: "--tests must not be a symlink" };
    if (isDenied(p) || isDenied(realpathSync(p))) return { error: "--tests path is denied" };
    fd = openSync(p, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
    const st = fstatSync(fd);
    if (!st.isFile()) return { error: "--tests must be a regular file" };
    if (st.size > MAX_TESTS_BYTES) return { error: "--tests file is over 1 MB" };
    return { text: readFileSync(fd, "utf8") };
  } catch (e) {
    return { error: `--tests unreadable (${e.code ?? "error"})` };
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

async function main(argv) {
  const point = argv[0];
  if (!["tier", "verify", "route"].includes(point)) return usage("point must be tier, verify or route");
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
  let testsText = "";
  if (opts.tests !== undefined) {
    const t = readTests(opts.tests);
    if (t.error) return usage(t.error);
    testsText = t.text;
  }

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
    testsText, usageRows, mode: opts.mode,
  });
  appendFileSync(usagePath, JSON.stringify(row) + "\n");
  process.stdout.write(JSON.stringify({ ...result, point, ticket: opts.ticket, mode: opts.mode }) + "\n");
  return 0;
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2)).then((c) => process.exit(c));
}
