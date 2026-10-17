// den-v1/05: pure key and click reducer for the transcript panel. The panel is pinned to its agent id (it stays
// open when the nearby card changes). R opens from walk mode; pinned desk threads
// also open from the shell. Never mutates its input.
export const initialTranscriptState = () => ({ agentId: null, notice: null });
// den-mvp/30: the thread of Bao's desk before Bao has a run there. Its first message starts one (the bridge's
// POST /conversations/orchestrator/message with no runId), and the thread moves to it.
export const DESK_THREAD = "desk";

export function closeTranscript() {
  return initialTranscriptState();
}

// The R rule (the transcript key; it was F until 2026-10-10), shared by the key and the card's button. Returns null when R means nothing (no card, panel closed).
function toggle(state, card) {
  if (state.agentId) return closeTranscript();
  if (!card) return null;
  const f = card.actions?.R;
  // den-mvp outcome 2: a panda whose newest run has ended opens that run's thread (`threadId`), where it can be followed up.
  const id = card.agentId ?? card.threadId ?? null;
  if (f?.enabled && id) return { agentId: id, notice: null };
  return { agentId: null, notice: f?.reason ?? null };
}

export function transcriptToggle(state, card) {
  return toggle(state, card) ?? state;
}

export function transcriptKey(state, { key, card, mode }) {
  if (key === "Escape") return state.agentId ? { state: closeTranscript(), handled: true } : { state, handled: false };
  if (mode !== "walk") return { state, handled: false };
  if (key === "r" || key === "R") {
    const next = toggle(state, card);
    return next ? { state: next, handled: true } : { state, handled: false };
  }
  return { state, handled: false };
}
