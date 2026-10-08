// organism-infra/141 (ADR 0016 decision 4, 6.4, 6.5, 6.7 and the fail-closed rule): the approval store.
// A cell's permission request is held here until the user decides. The store mints the id (the child's own request
// id is an opaque key that never leaves this module), serves the whole sanitised input, refuses an allow until that
// input was served, and answers the child deny on expiry, over the cap, stop, exit and shutdown. It never allows
// on its own. It knows nothing about processes or HTTP: the host injects three small callbacks.
//
//   createApprovalStore({ ttlMs, capPerAgent, canAnswer(agentId), isLive(agentId), answer(agentId, requestId, { allow, reason }),
//                         audit({ approval, decision, note }), onChange(view) })
//   hold(agentId, event, { accepting })   a "permission-request" CellEvent -> nothing returned; denies are answered inside
//   read(id)            -> { ...view, input } | null    marks the approval "seen" (GET /approvals/:id)
//   decide(id, body)    -> Promise<{ ok: true, status: 200, approval } | { ok: false, status, error }>
//   settleAgent(agentId, code)   every pending approval of the agent becomes "expired" (and the child is answered deny)
//   pending(agentId), list(), release(agentId)
import { randomBytes } from "node:crypto";
import { hasSecret, SECRET_PATTERNS } from "../../../scripts/exposure.mjs";
import {
  APPROVAL_CAP_PER_AGENT, APPROVAL_HISTORY_CAP, APPROVAL_ID_RE, APPROVAL_INPUT_MAX, APPROVAL_NOTE_MAX, APPROVAL_TTL_MS,
  REQUEST_ID_MAX, REQUEST_IDS_PER_AGENT,
} from "./policy.mjs";

const MASK = "[masked: possible secret]";
const SUMMARY_MAX = 200;
const TOOL_MAX = 100;
const MAX_DEPTH = 32;
const SUMMARY_KEYS = ["command", "file_path", "path", "pattern", "url", "query", "description"];
// Control characters other than \n and \t, the bidirectional marks and overrides, and zero-width and line-separator
// characters. Written as escapes so the source itself holds none of them.
const UNSAFE = /[\u0000-\u0008\u000b-\u001f\u007f-\u009f\u061c\u200b-\u200f\u2028-\u202e\u2060\u2066-\u2069\ufeff]/g;

const refuse = (status, error) => ({ ok: false, status, error });
const isPlainObject = (v) => v !== null && typeof v === "object" && [Object.prototype, null].includes(Object.getPrototypeOf(v));

// Visible \uXXXX instead of the character, so it cannot reorder or hide text.
export const escapeText = (text) => text.replace(UNSAFE, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);

// Only the span a secret pattern matches is masked, so the rest of a command stays readable and a fake secret-shaped
// token cannot hide it. A private key block is masked through its END line (or to the end of the text), because the
// pattern matches only its header.
const PEM_END_RE = /-----END (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/;
const GLOBAL_PATTERNS = SECRET_PATTERNS.map((p) => ({ name: p.name, re: new RegExp(p.re.source, p.re.flags.includes("g") ? p.re.flags : `${p.re.flags}g`) }));
function maskSecrets(text) {
  const spans = [];
  for (const { name, re } of GLOBAL_PATTERNS) {
    re.lastIndex = 0;
    for (let m = re.exec(text); m; m = re.exec(text)) {
      let end = m.index + m[0].length;
      if (name === "private key block") {
        const tail = PEM_END_RE.exec(text.slice(end));
        end = tail ? end + tail.index + tail[0].length : text.length;
      }
      spans.push([m.index, end]);
      if (m[0].length === 0) re.lastIndex += 1;
    }
  }
  if (!spans.length) return text;
  spans.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [start, end] of spans) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  let out = "";
  let at = 0;
  for (const [start, end] of merged) {
    out += text.slice(at, start) + MASK;
    at = end;
  }
  return out + text.slice(at);
}
export const cleanText = (text) => escapeText(maskSecrets(text));

// A copy of a tool input with every string (and key) cleaned. Throws on anything JSON could not have produced.
function sanitize(value, depth = 0) {
  if (depth > MAX_DEPTH) throw new Error("input nests too deeply");
  if (typeof value === "string") return cleanText(value);
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (Array.isArray(value)) return value.map((v) => sanitize(v, depth + 1));
  if (!isPlainObject(value)) throw new Error("input holds a value JSON cannot carry");
  const out = Object.create(null);
  let n = 0;
  for (const [key, v] of Object.entries(value)) {
    let name = cleanText(key);
    while (name in out) name = `${cleanText(key)}#${(n += 1)}`;
    // A secret can sit across a key and its value (token: "..."), which no single string shows.
    out[name] = typeof v === "string" && hasSecret(`${key}=${JSON.stringify(v)}`) ? MASK : sanitize(v, depth + 1);
  }
  return out;
}

function summarize(input) {
  const key = SUMMARY_KEYS.find((k) => typeof input[k] === "string");
  const text = (key ? input[key] : JSON.stringify(input)).replace(/\s+/g, " ").trim();
  return { summary: text.slice(0, SUMMARY_MAX), truncated: text.length > SUMMARY_MAX || (key !== undefined && Object.keys(input).length > 1) };
}

export function createApprovalStore({
  ttlMs = APPROVAL_TTL_MS, capPerAgent = APPROVAL_CAP_PER_AGENT, canAnswer, isLive, answer, audit, onChange,
}) {
  const approvals = new Map(); // id -> record, insertion order is request order
  const requestIds = new Map(); // agentId -> Set of the child's request ids, held or answered

  const view = (a) => ({
    id: a.id, agentId: a.agentId, tool: a.tool, summary: a.summary, inputLength: a.inputLength, truncated: a.truncated,
    ts: a.ts, expiresAt: a.expiresAt, state: a.state, note: a.note, ...(a.reason ? { reason: a.reason } : {}),
  });

  // The child is told only deny, and only while it can still hear.
  function sendDeny(a, code) {
    if (!canAnswer(a.agentId)) return;
    Promise.resolve(answer(a.agentId, a.requestId, { allow: false, reason: `denied by the bridge: ${code}` })).catch((err) =>
      console.error(`bridge: could not answer ${a.id}: ${err?.message ?? err}`),
    );
  }

  function settle(a, code) {
    if (a.state !== "pending" || a.claimed) return;
    clearTimeout(a.timer);
    a.state = "expired";
    a.reason = code;
    a.input = null;
    sendDeny(a, code);
    onChange(view(a));
  }

  const pendingOf = (agentId) => [...approvals.values()].filter((a) => a.agentId === agentId && a.state === "pending");

  function prune() {
    let settled = [...approvals.values()].filter((a) => a.state !== "pending");
    for (const a of settled) {
      if (settled.length <= APPROVAL_HISTORY_CAP) return;
      approvals.delete(a.id);
      settled = settled.filter((x) => x !== a);
    }
  }

  function denyUnheld(agentId, requestId, code) {
    if (!canAnswer(agentId)) return;
    Promise.resolve(answer(agentId, requestId, { allow: false, reason: `denied by the bridge: ${code}` })).catch((err) =>
      console.error(`bridge: could not answer a request of ${agentId}: ${err?.message ?? err}`),
    );
  }

  function hold(agentId, event, { accepting = true } = {}) {
    const requestId = event?.requestId;
    // No usable request id: nothing can be answered, so the request is dropped (ADR 0016 6.5).
    if (typeof requestId !== "string" || requestId.length < 1 || requestId.length > REQUEST_ID_MAX) return;
    const seen = requestIds.get(agentId) ?? requestIds.set(agentId, new Set()).get(agentId);
    if (seen.size >= REQUEST_IDS_PER_AGENT) return denyUnheld(agentId, requestId, "too many requests");
    if (seen.has(requestId)) return denyUnheld(agentId, requestId, "repeated request id");
    seen.add(requestId);
    if (!accepting) return denyUnheld(agentId, requestId, "agent is stopping");
    const { tool } = event;
    if (typeof tool !== "string" || !tool.trim() || !isPlainObject(event.input)) return denyUnheld(agentId, requestId, "malformed request");
    let input;
    try {
      if (JSON.stringify(event.input).length > APPROVAL_INPUT_MAX) return denyUnheld(agentId, requestId, "input too large");
      input = sanitize(event.input);
    } catch {
      return denyUnheld(agentId, requestId, "undecodable input");
    }
    const mine = pendingOf(agentId);
    if (mine.length >= capPerAgent) settle(mine[0], "cap-exceeded");
    const now = Date.now();
    const { summary, truncated } = summarize(input);
    const a = {
      id: `a-${randomBytes(8).toString("hex")}`, agentId, requestId, tool: cleanText(tool).slice(0, TOOL_MAX), summary, truncated,
      inputLength: JSON.stringify(input).length, ts: new Date(now).toISOString(), expiresAt: new Date(now + ttlMs).toISOString(),
      state: "pending", note: null, reason: null, input, seen: false, claimed: false,
    };
    a.timer = setTimeout(() => settle(a, "expired"), ttlMs);
    a.timer.unref?.();
    approvals.set(a.id, a);
    prune();
    onChange(view(a));
  }

  const find = (id) => (typeof id === "string" && APPROVAL_ID_RE.test(id) ? approvals.get(id) : undefined);

  function read(id) {
    const a = find(id);
    if (!a) return null;
    a.seen = true;
    return { ...view(a), input: a.input };
  }

  async function decide(id, body) {
    const a = find(id);
    if (!a) return refuse(404, "no such approval");
    const { decision, note } = body ?? {};
    if (decision !== "allow" && decision !== "deny") return refuse(400, 'decision must be "allow" or "deny"');
    if (note !== undefined && (typeof note !== "string" || note.length > APPROVAL_NOTE_MAX)) {
      return refuse(400, `note must be a string of at most ${APPROVAL_NOTE_MAX} characters`);
    }
    if (a.state !== "pending" || a.claimed) return refuse(409, "this approval is already decided or has expired");
    if (decision === "allow" && !a.seen) return refuse(409, "fetch GET /approvals/:id and review the full input before allowing");
    if (!isLive(a.agentId)) return refuse(409, "the agent is no longer running");
    // From here to the claim there is no await: of two racing decisions exactly one gets past this line.
    a.claimed = true;
    const cleanNote = note === undefined ? null : cleanText(note);
    let final = decision;
    let failure = null;
    try {
      await audit({ approval: view(a), decision, note: cleanNote });
    } catch (err) {
      console.error(`bridge: could not record the decision on ${a.id}: ${err?.stack ?? err}`);
      final = "deny"; // no audit line, no allow
      failure = refuse(500, "could not record the decision; it was answered deny");
    }
    if (!isLive(a.agentId)) {
      a.claimed = false;
      settle(a, "agent-stopped");
      return refuse(409, "the agent is no longer running");
    }
    try {
      await answer(a.agentId, a.requestId, { allow: final === "allow", ...(cleanNote ? { reason: cleanNote } : final === "deny" ? { reason: "denied by the user" } : {}) });
    } catch (err) {
      console.error(`bridge: could not answer ${a.id}: ${err?.message ?? err}`);
      a.claimed = false;
      settle(a, "answer-failed");
      return refuse(502, "the agent could not be told; the approval was closed");
    }
    clearTimeout(a.timer);
    a.state = final === "allow" ? "allowed" : "denied";
    a.note = cleanNote;
    a.input = null;
    onChange(view(a));
    return failure ?? { ok: true, status: 200, approval: view(a) };
  }

  return {
    hold,
    read,
    decide,
    pending: (agentId) => pendingOf(agentId).length,
    list: () => [...approvals.values()].map(view),
    settleAgent(agentId, code) {
      for (const a of pendingOf(agentId)) settle(a, code);
    },
    release: (agentId) => void requestIds.delete(agentId),
  };
}
