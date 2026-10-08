// den-v1/05: pure key and click reducer for the transcript panel. The panel is pinned to its agent id (it stays
// open when the nearby card changes) and opens from walk mode only. Never mutates its input.
export const initialTranscriptState = () => ({ agentId: null, notice: null });

export function closeTranscript() {
  return initialTranscriptState();
}

// The F rule, shared by the key and the card's button. Returns null when F means nothing (no card, panel closed).
function toggle(state, card) {
  if (state.agentId) return closeTranscript();
  if (!card) return null;
  const f = card.actions?.F;
  if (f?.enabled && card.agentId) return { agentId: card.agentId, notice: null };
  return { agentId: null, notice: f?.reason ?? null };
}

export function transcriptToggle(state, card) {
  return toggle(state, card) ?? state;
}

export function transcriptKey(state, { key, card, mode }) {
  if (mode !== "walk") return { state, handled: false };
  if (key === "Escape") return state.agentId ? { state: closeTranscript(), handled: true } : { state, handled: false };
  if (key === "f" || key === "F") {
    const next = toggle(state, card);
    return next ? { state: next, handled: true } : { state, handled: false };
  }
  return { state, handled: false };
}
