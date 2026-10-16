// den-v1/07: the message composer controller. Pure and DOM-free, like approval-review.mjs: the client, the clock and the
// open hook are injected, so every state in the design spec is testable without a browser. React renders getState()
// and forwards keys, clicks and each new snapshot (MessageComposer.jsx). This module never touches the network.
// den-v1 loop S1: opened on a resident the bridge can start (card.start), the same box starts a task for that panda's
// role through client.startTask(role, { text }). COPY holds what differs between the two uses.
export const MESSAGE_MAX_BYTES = 2048;
export const ACK_WAIT_MS = 20000;
const PREVIEW_CHARS = 40;
const FINAL_STATUSES = new Set([401, 404, 409]);
const ENDED = new Set(["done", "failed", "terminated"]);
const MAX_LABEL = "2,048"; // MESSAGE_MAX_BYTES as the spec writes it
const DEMO_REASON = "Demo mode: actions are off";
const COPY = {
  message: {
    overline: (name) => `Message ${name}`, placeholder: (name) => `Tell ${name} what to do next`,
    note: "One message, sent to this agent only", sendLabel: "Send", busyLabel: "Sending",
  },
  start: {
    overline: (name) => `New task for ${name}`, placeholder: (name) => `Tell ${name} what to do`,
    note: "One task, started as a new agent", sendLabel: "Start", busyLabel: "Starting",
  },
};
const encoder = new TextEncoder();
export const GRANTS_MAX = 6;
const HOST_RE = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{0,61}[a-z0-9]$/;
const IPV6_LIKE = /:/;
const HOST_HINT = "Use a host name. IP addresses and localhost can't be granted.";
const PATH_HINT = "Use a full path, or one starting with ~/.";

// The box checks an entry before adding it (designer spec A). The bridge checks it again; this only saves a round trip.
export function checkGrant({ kind, value }, existing = []) {
  const v = typeof value === "string" ? value.trim() : "";
  if (kind === "host") {
    const lower = v.toLowerCase();
    if (!HOST_RE.test(lower) || IPV6_LIKE.test(lower) || /^\d+(\.\d+)*$/.test(lower) || lower === "localhost" || lower.startsWith("localhost.")) return { ok: false, reason: HOST_HINT };
    return existing.some((g) => g.kind === "host" && g.value === lower) ? { ok: false, reason: "Already granted." } : { ok: true, grant: { kind: "host", value: lower } };
  }
  if (kind === "path") {
    if (!(v.startsWith("/") || v.startsWith("~/")) || v.split("/").includes("..")) return { ok: false, reason: PATH_HINT };
    return existing.some((g) => g.kind === "path" && g.value === v) ? { ok: false, reason: "Already granted." } : { ok: true, grant: { kind: "path", value: v } };
  }
  return { ok: false, reason: HOST_HINT };
}

// The wall table for a role: the bridge's lines, with the right side worded for the grants given.
function tableOf(spec, grants) {
  if (!spec) return null;
  const hosts = grants.filter((g) => g.kind === "host");
  const paths = grants.filter((g) => g.kind === "path");
  const asks = spec.asks.map((line) => (hosts.length && line === "Any host" ? "Any other host" : paths.length && line === "Any path outside" ? "Any other path outside" : line));
  return {
    label: "What this agent may do", runsHeading: "Runs without asking", asksHeading: "Asks you first",
    runs: spec.runs, granted: grants.map((g) => ({ ...g, text: `+ ${g.value}`, label: `Granted, ${g.kind} ${g.value}`, removeLabel: `Remove ${g.value}` })),
    asks, canAdd: spec.takesGrants === true, atMax: grants.length >= GRANTS_MAX, addDisabledReason: grants.length >= GRANTS_MAX ? "Six grants at most" : null,
  };
}

const bytesOf = (text) => encoder.encode(text).length;
const fmt = (n) => n.toLocaleString("en-US");
const reasonOf = (err) => (typeof err?.reason === "string" && err.reason.trim() ? err.reason : "The bridge did not answer.");
const statusOf = (err) => (Number.isInteger(err?.status) ? err.status : 0);

// The card line shows the first 40 characters of the message as plain text, quoted, with an ellipsis if longer.
function previewOf(text) {
  const chars = Array.from(text.replace(/\s+/g, " "));
  const head = chars.slice(0, PREVIEW_CHARS).join("");
  return `“${head}${chars.length > PREVIEW_CHARS ? "…" : ""}”`;
}

export function createMessageComposer({ client, now = Date.now, hooks = {} }) {
  const listeners = new Set();
  const drafts = new Map();
  let seqCounter = 0;
  let focusSeq = 0;
  let early = new Set(); // acks that arrive before the send's own 200 does
  let s = { open: false };
  let line = null; // { agentId, name, messageId, preview, kind, sentAt }
  let leaving = { focusReturn: null, announcement: null };
  let view = null;
  let wall = null; // the bridge's per-role table lines, from the snapshot
  const grantDrafts = new Map();

  const trimmed = () => s.text.trim();

  function build() {
    const status = line ? { agentId: line.agentId, kind: line.kind, label: LABELS[line.kind], preview: line.preview } : null;
    if (!s.open) {
      return {
        open: false, table: null, row: null, foldCard: false, phase: "closed", overline: "", ariaLabel: "", placeholder: "", text: "", counter: `0 / ${MAX_LABEL} bytes`,
        overLimit: false, readOnly: false, sendEnabled: false, banner: null, focus: null, focusSeq,
        note: "", sendLabel: COPY.message.sendLabel, busyLabel: COPY.message.busyLabel,
        focusReturn: leaving.focusReturn, announcement: leaving.announcement, status,
      };
    }
    const copy = COPY[s.card.start ? "start" : "message"];
    const used = bytesOf(trimmed());
    const over = used > MESSAGE_MAX_BYTES;
    const tooLong = over ? `Too long. ${fmt(used)} of ${MAX_LABEL} bytes. Shorten it by ${fmt(used - MESSAGE_MAX_BYTES)} ${used - MESSAGE_MAX_BYTES === 1 ? "byte" : "bytes"} to send.` : null;
    const editable = s.phase === "ready" || s.phase === "refused";
    return {
      open: true, phase: s.phase,
      table: s.card.start ? tableOf(wall?.[s.card.role], s.grants) : null, row: s.card.start ? s.row : null, foldCard: s.card.start,
      overline: copy.overline(s.card.name), ariaLabel: copy.overline(s.card.name), placeholder: copy.placeholder(s.card.name),
      note: copy.note, sendLabel: copy.sendLabel, busyLabel: copy.busyLabel,
      text: s.text, counter: `${fmt(bytesOf(s.text))} / ${MAX_LABEL} bytes`,
      overLimit: over, readOnly: !editable, sendEnabled: editable && used > 0 && !over,
      banner: s.final ?? s.refusal ?? tooLong,
      focus: s.focus, focusSeq, focusReturn: null, announcement: leaving.announcement, status,
    };
  }

  const getState = () => (view ??= build());
  function emit() {
    view = null;
    const state = getState();
    for (const fn of [...listeners]) fn(state);
  }
  const setFocus = (target) => { s.focus = target; focusSeq += 1; };

  function open(card, { mode = "walk", demo = false } = {}) {
    if (s.open) return { opened: true, reason: null };
    if (demo) return { opened: false, reason: DEMO_REASON };
    const t = card?.actions?.T;
    const start = !card?.agentId && card?.start === true;
    if (!card || !t?.enabled || !(card.agentId || start)) return { opened: false, reason: t?.reason ?? "no agent running" };
    const draftKey = start ? `start:${card.id}` : card.agentId; // a draft belongs to one agent, or to one resident panda
    s = {
      open: true, seq: ++seqCounter, mode, phase: "ready", focus: "box",
      card: { agentId: card.agentId, name: card.name || card.role || "agent", start, role: card.role, draftKey },
      text: drafts.get(draftKey) ?? "", refusal: null, final: null,
      grants: start ? [...(grantDrafts.get(draftKey) ?? [])] : [], row: { open: false, kind: "host", value: "", error: null },
    };
    focusSeq += 1;
    hooks.onOpen?.();
    emit();
    return { opened: true, reason: null };
  }

  function leave(announcement) {
    leaving = { focusReturn: s.mode === "walk" ? "scene" : "card-button", announcement: announcement ?? leaving.announcement };
    s = { open: false };
    focusSeq += 1;
  }

  function close() {
    if (!s.open) return;
    leave();
    emit();
  }

  const grantsEditable = () => s.open && s.card.start && (s.phase === "ready" || s.phase === "refused");
  function saveGrants() {
    if (s.grants.length) grantDrafts.set(s.card.draftKey, [...s.grants]);
    else grantDrafts.delete(s.card.draftKey);
  }
  const announce = (text) => { leaving = { ...leaving, announcement: text }; };
  function openRow() {
    if (!grantsEditable() || !tableOf(wall?.[s.card.role], s.grants)?.canAdd || s.grants.length >= GRANTS_MAX) return;
    s.row = { ...s.row, open: true, error: null };
    setFocus("row-kind");
    emit();
  }
  function closeRow() {
    if (!s.open || !s.row.open) return;
    s.row = { ...s.row, open: false, value: "", error: null };
    setFocus("add-grant");
    emit();
  }
  function setRow(patch) {
    if (!s.open || !s.row.open) return;
    s.row = { ...s.row, ...patch, error: null };
    emit();
  }
  // Enter in the row adds the grant, clears the value and keeps the row open.
  function addGrant() {
    if (!grantsEditable() || !s.row.open) return false;
    if (s.grants.length >= GRANTS_MAX) { s.row = { ...s.row, error: "Six grants at most" }; emit(); return false; }
    const checked = checkGrant({ kind: s.row.kind, value: s.row.value }, s.grants);
    if (!checked.ok) { s.row = { ...s.row, error: checked.reason }; emit(); return false; }
    s.grants = [...s.grants, checked.grant];
    s.row = { ...s.row, value: "", error: null };
    s.refusal = null;
    saveGrants();
    announce(`Grant added: ${checked.grant.value}.`);
    emit();
    return true;
  }
  function removeGrant(value) {
    if (!grantsEditable()) return;
    const before = s.grants.length;
    s.grants = s.grants.filter((g) => g.value !== value);
    if (s.grants.length === before) return;
    saveGrants();
    announce(`Grant removed: ${value}.`);
    emit();
  }

  function setFinal(banner) {
    s.final = banner;
    s.refusal = null;
    s.phase = "final";
    setFocus("close");
    emit();
  }

  function setText(text) {
    if (!s.open || (s.phase !== "ready" && s.phase !== "refused")) return;
    s.text = String(text ?? "");
    s.refusal = null;
    s.phase = "ready";
    if (s.text) drafts.set(s.card.draftKey, s.text);
    else drafts.delete(s.card.draftKey);
    emit();
  }

  async function send() {
    if (!s.open || !getState().sendEnabled) return;
    const seq = s.seq;
    const { agentId, name } = s.card;
    if (s.card.start) return startTask(seq);
    const text = trimmed();
    s.phase = "sending";
    s.refusal = null;
    early = new Set();
    emit();
    let res;
    try {
      res = await client.sendMessage(agentId, { text });
    } catch (err) {
      if (!(s.open && s.seq === seq)) return;
      const status = statusOf(err);
      if (status === 401) setFinal("Session ended. Restart the bridge and open the launch link it prints.");
      else if (FINAL_STATUSES.has(status)) setFinal(`Too late. ${reasonOf(err)}`);
      else {
        s.phase = "refused";
        s.refusal = `Not sent. ${reasonOf(err)} Nothing changed. Press Enter to try again.`;
        setFocus("box");
        emit();
      }
      return;
    }
    const messageId = res?.messageId ?? null;
    drafts.delete(agentId);
    line = { agentId, name, messageId, preview: previewOf(text), kind: "sent", sentAt: now() };
    let announcement = `Message sent to ${name}.`;
    if (messageId !== null && early.has(messageId)) {
      line.kind = "received";
      announcement = `Message received by ${name}.`;
    }
    if (s.open && s.seq === seq) leave(announcement);
    else leaving = { ...leaving, announcement };
    emit();
  }

  // den-v1 loop S1: the box was opened on a resident. The bridge writes the ticket and starts the role; the card's
  // status line then follows the new agent. Only an ended session is final: any other refusal may be retried.
  async function startTask(seq) {
    const { name, role, draftKey } = s.card;
    const text = trimmed();
    const grants = s.grants.map((g) => ({ kind: g.kind, value: g.value }));
    s.phase = "sending";
    s.refusal = null;
    emit();
    let res;
    try {
      res = await client.startTask(role, grants.length ? { text, grants } : { text });
    } catch (err) {
      if (!(s.open && s.seq === seq)) return;
      if (statusOf(err) === 401) return setFinal("Session ended. Restart the bridge and open the launch link it prints.");
      s.phase = "refused";
      s.refusal = grants.length && statusOf(err) === 400
        ? `Not started. The bridge refused the grant${grants.length > 1 ? "s" : ` "${grants[0].value}"`}: ${reasonOf(err)} Remove ${grants.length > 1 ? "it" : "it"}, then press Enter to try again.`
        : `Not started. ${reasonOf(err)} Press Enter to try again.`;
      setFocus("box");
      emit();
      return;
    }
    drafts.delete(draftKey);
    grantDrafts.delete(draftKey);
    const agentId = res?.agent?.id ?? null;
    line = agentId ? { agentId, name, messageId: null, preview: previewOf(text), kind: "started", sentAt: now() } : null;
    const announcement = `Task started for ${name}.`;
    if (s.open && s.seq === seq) leave(announcement);
    else leaving = { ...leaving, announcement };
    emit();
  }

  function observe(event) {
    if (event?.type !== "message-ack" || typeof event.messageId !== "string") return;
    early.add(event.messageId);
    if (!line || line.kind === "received" || line.messageId !== event.messageId) return;
    if (event.agentId != null && event.agentId !== line.agentId) return;
    line.kind = "received";
    leaving = { ...leaving, announcement: `Message received by ${line.name}.` };
    emit();
  }

  // den-v1 loop S5: the bridge reports a taken message on the agent's transcript, as the entry's status.
  const applied = (transcripts, { agentId, messageId }) => {
    const entries = transcripts?.[agentId]?.entries;
    return Array.isArray(entries) && entries.some((e) => e?.kind === "message" && e.role === "user" && e.messageId === messageId && e.status === "applied");
  };

  function sync({ agents = [], transcripts, wall: tables } = {}) {
    if (tables !== undefined && tables !== wall) { wall = tables; if (s.open) emit(); }
    const stateOf = (id) => agents.find((a) => a.id === id)?.state;
    if (line && line.kind !== "received" && line.messageId !== null && applied(transcripts, line)) observe({ type: "message-ack", agentId: line.agentId, messageId: line.messageId });
    if (line && ENDED.has(stateOf(line.agentId))) {
      line = null;
      emit();
    }
    if (s.open && s.phase !== "final" && s.phase !== "sending") {
      const ended = stateOf(s.card.agentId);
      if (ENDED.has(ended)) setFinal(`Agent ended: ${ended}.`);
    }
  }

  function tick() {
    if (line?.kind !== "sent" || now() - line.sentAt < ACK_WAIT_MS) return;
    line.kind = "stalled";
    leaving = { ...leaving, announcement: "Message sent, not yet received." };
    emit();
  }

  const statusFor = (card) => {
    const status = getState().status;
    return status && card?.agentId === status.agentId ? status : null;
  };

  function key(event, { card = null, mode = "walk", demo = false } = {}) {
    const { key: k, shiftKey = false, isComposing = false, repeat = false, inBox = false, inRow = false } = event ?? {};
    if (s.open) {
      if (k === "Escape") { if (s.row?.open) closeRow(); else close(); return { handled: true, walk: false }; }
      if (inRow) {
        if (k === "Enter" && !isComposing) { addGrant(); return { handled: true, walk: false }; }
        return { handled: false, walk: false };
      }
      if (k === "Enter" && inBox && !shiftKey && !isComposing) { send(); return { handled: true, walk: false }; }
      return { handled: false, walk: false };
    }
    if ((k === "t" || k === "T") && !inBox && !repeat && mode === "walk" && card) {
      const { opened } = open(card, { mode, demo });
      return { handled: opened, walk: !opened };
    }
    return { handled: false, walk: true };
  }

  return {
    getState,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    open, key, setText, send, close, openRow, closeRow, setRow, addGrant, removeGrant, observe, sync, tick, statusFor,
  };
}

const LABELS = { sent: "Message sent", received: "Message received", stalled: "Sent, not yet received", started: "Task started" };
