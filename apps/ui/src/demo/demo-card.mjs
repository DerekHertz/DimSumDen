// den-v1/09: the proximity card in Demo mode. Pure; the input card is left untouched.
// T, E and Q are greyed (no steering route is reachable in a replay). R is a read-only look at the recorded
// transcript, so it is on only when the replay holds lines for that agent.
const OFF = Object.freeze({ enabled: false, reason: "Demo mode: actions are off" });
const NO_TRANSCRIPT = Object.freeze({ enabled: false, reason: "Demo mode: no transcript recorded" });

export function demoCard(card, { transcripts } = {}) {
  if (!card) return null;
  const recorded = card.agentId && (transcripts?.[card.agentId]?.entries?.length ?? 0) > 0;
  return {
    ...card,
    actions: {
      T: { ...OFF },
      R: recorded ? { enabled: true, reason: null } : { ...NO_TRANSCRIPT },
      E: { ...OFF },
      Q: { ...OFF },
    },
  };
}
