// den-v1/05: bounded per-agent transcript buffers. Pure: never mutates its inputs.
// buffers = { [agentId]: { entries, dropped } }, oldest first; each entry carries n, its 1-based arrival number.
export const TRANSCRIPT_CAP = 200;

const KINDS = new Set(["message", "tool", "permission", "ended"]);

export function appendTranscript(buffers, agentId, entry, cap = TRANSCRIPT_CAP) {
  const previous = buffers[agentId] ?? { entries: [], dropped: 0 };
  const n = previous.dropped + previous.entries.length + 1;
  const entries = [...previous.entries, { ...entry, n }];
  const overflow = Math.max(0, entries.length - cap);
  return {
    ...buffers,
    [agentId]: { entries: overflow ? entries.slice(overflow) : entries, dropped: previous.dropped + overflow },
  };
}

// The one place the SSE frame shape lives: { seq, type: "transcript", agentId, entry }.
// organism-infra/106 has not landed, so this is the fixture shape; 106 changes only this function.
export function entryFromFrame(frame) {
  if (!frame || frame.type !== "transcript" || typeof frame.agentId !== "string") return null;
  const entry = frame.entry;
  const known = entry && typeof entry === "object" && !Array.isArray(entry) && KINDS.has(entry.kind);
  const type = entry && typeof entry === "object" && !Array.isArray(entry) && typeof entry.kind === "string" ? entry.kind : "unknown";
  return { agentId: frame.agentId, entry: known ? entry : { kind: "unreadable", type } };
}
