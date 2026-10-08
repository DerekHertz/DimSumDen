// den-v1/05: pure view model for the transcript panel. Never mutates its input and never throws on a bad entry.
// transcriptView(buffer, { expanded, atBottom, seenThrough, connection }) -> { empty, emptyText, droppedNotice,
// droppedText, rows, atBottom, unread, jumpLabel, banner }. Rows keep arrival order: the newest is last.
export const RESULT_BYTES = 4096;

const unreadable = (n, type) => ({ kind: "unreadable", n, type, label: "Unreadable event" });
const text = (value) => (typeof value === "string" ? value : value == null ? "" : String(value));

function clipResult(result) {
  if (result == null) return null;
  const full = typeof result === "string" ? result : JSON.stringify(result) ?? String(result);
  const bytes = new TextEncoder().encode(full);
  if (bytes.length <= RESULT_BYTES) return { text: full, truncatedBytes: 0 };
  const head = new TextDecoder().decode(bytes.slice(0, RESULT_BYTES)).replace(/�+$/, "");
  return { text: head, truncatedBytes: bytes.length - RESULT_BYTES };
}

function inputText(input) {
  if (input === undefined) return "";
  try {
    return JSON.stringify(input, null, 2) ?? "";
  } catch {
    return String(input);
  }
}

function rowFor(entry, n, expanded) {
  if (!entry || typeof entry !== "object") return unreadable(n, "unknown");
  switch (entry.kind) {
    case "message":
      return { kind: "message", n, speaker: entry.role === "user" ? "You" : "Agent", text: text(entry.text), at: entry.at };
    case "tool": {
      const open = expanded.has(n);
      const row = { kind: "tool", n, name: text(entry.name), summary: text(entry.summary), status: entry.status, expanded: open, toggleLabel: open ? "Hide details" : "Show details" };
      if (open) {
        row.inputText = inputText(entry.input);
        row.result = clipResult(entry.result);
      }
      return row;
    }
    case "permission":
      return { kind: "permission", n, name: text(entry.name), label: "Waiting on you" };
    case "ended":
      return { kind: "ended", n, state: text(entry.state), label: `Agent ended: ${text(entry.state)}` };
    case "unreadable":
      return unreadable(n, typeof entry.type === "string" ? entry.type : "unknown");
    default:
      return unreadable(n, typeof entry.kind === "string" ? entry.kind : "unknown");
  }
}

function bannerFor(phase) {
  if (phase === "connecting" || phase === "reconnecting") return "Reconnecting...";
  if (phase === "offline") return "Bridge offline: run npm run ui";
  return null;
}

export function transcriptView(buffer, ui = {}) {
  const entries = Array.isArray(buffer?.entries) ? buffer.entries : [];
  const dropped = buffer?.dropped > 0 ? buffer.dropped : 0;
  const expanded = new Set(ui.expanded ?? []);
  const numbers = entries.map((entry, i) => (Number.isFinite(entry?.n) ? entry.n : dropped + i + 1));
  const rows = entries.map((entry, i) => rowFor(entry, numbers[i], expanded));
  const atBottom = ui.atBottom !== false;
  const seen = Number.isFinite(ui.seenThrough) ? ui.seenThrough : 0;
  const unread = atBottom ? 0 : numbers.filter((n) => n > seen).length;
  return {
    empty: rows.length === 0,
    emptyText: "Waiting for the agent's first message.",
    droppedNotice: dropped > 0,
    droppedText: "Earlier entries were dropped",
    rows,
    atBottom,
    unread,
    jumpLabel: atBottom ? null : unread > 0 ? `Jump to latest (${unread})` : "Jump to latest",
    banner: bannerFor(ui.connection?.phase),
  };
}
