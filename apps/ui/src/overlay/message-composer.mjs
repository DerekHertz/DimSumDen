// den-v1/07: the message composer controller. Pure and DOM-free, like approval-review.mjs: the client, the clock and the
// open hook are injected, so every state in the design spec is testable without a browser. React renders getState()
// and forwards keys, clicks and each new snapshot (MessageComposer.jsx). This module never touches the network.
export const MESSAGE_MAX_BYTES = 2048;
export const ACK_WAIT_MS = 20000;
const PREVIEW_CHARS = 40;
const FINAL_STATUSES = new Set([401, 404, 409]);
const ENDED = new Set(["done", "failed", "terminated"]);
const MAX_LABEL = "2,048"; // MESSAGE_MAX_BYTES as the spec writes it
const DEMO_REASON = "Demo mode: actions are off";
const encoder = new TextEncoder();

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

  const trimmed = () => s.text.trim();

  function build() {
    const status = line ? { agentId: line.agentId, kind: line.kind, label: LABELS[line.kind], preview: line.preview } : null;
    if (!s.open) {
      return {
        open: false, phase: "closed", overline: "", ariaLabel: "", placeholder: "", text: "", counter: `0 / ${MAX_LABEL} bytes`,
        overLimit: false, readOnly: false, sendEnabled: false, banner: null, focus: null, focusSeq,
        focusReturn: leaving.focusReturn, announcement: leaving.announcement, status,
      };
    }
    const used = bytesOf(trimmed());
    const over = used > MESSAGE_MAX_BYTES;
    const tooLong = over ? `Too long. ${fmt(used)} of ${MAX_LABEL} bytes. Shorten it by ${fmt(used - MESSAGE_MAX_BYTES)} ${used - MESSAGE_MAX_BYTES === 1 ? "byte" : "bytes"} to send.` : null;
    const editable = s.phase === "ready" || s.phase === "refused";
    return {
      open: true, phase: s.phase,
      overline: `Message ${s.card.name}`, ariaLabel: `Message ${s.card.name}`, placeholder: `Tell ${s.card.name} what to do next`,
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
    if (!card || !t?.enabled || !card.agentId) return { opened: false, reason: t?.reason ?? "no agent running" };
    s = {
      open: true, seq: ++seqCounter, mode, phase: "ready", focus: "box",
      card: { agentId: card.agentId, name: card.name || card.role || "agent" },
      text: drafts.get(card.agentId) ?? "", refusal: null, final: null,
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
    if (s.text) drafts.set(s.card.agentId, s.text);
    else drafts.delete(s.card.agentId);
    emit();
  }

  async function send() {
    if (!s.open || !getState().sendEnabled) return;
    const seq = s.seq;
    const { agentId, name } = s.card;
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
      if (status === 401) setFinal("Session ended: restart the bridge and reload.");
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

  function observe(event) {
    if (event?.type !== "message-ack" || typeof event.messageId !== "string") return;
    early.add(event.messageId);
    if (!line || line.kind === "received" || line.messageId !== event.messageId) return;
    if (event.agentId != null && event.agentId !== line.agentId) return;
    line.kind = "received";
    leaving = { ...leaving, announcement: `Message received by ${line.name}.` };
    emit();
  }

  function sync({ agents = [] } = {}) {
    const stateOf = (id) => agents.find((a) => a.id === id)?.state;
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
    const { key: k, shiftKey = false, isComposing = false, repeat = false, inBox = false } = event ?? {};
    if (s.open) {
      if (k === "Escape") { close(); return { handled: true, walk: false }; }
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
    open, key, setText, send, close, observe, sync, tick, statusFor,
  };
}

const LABELS = { sent: "Message sent", received: "Message received", stalled: "Sent, not yet received" };
