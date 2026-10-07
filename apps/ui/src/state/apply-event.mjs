import { compareRefs } from "../../../../packages/board-refs/src/compare-refs.mjs";

// Client reducer for SSE `change` frames (ADR 0011 decision 5). Pure: never mutates its inputs.
// Returns null when the caller must refetch GET /state (no baseline, or seq is not state.seq + 1).
export function applyEvent(state, event) {
  if (!state || !event || event.seq !== state.seq + 1) return null;
  const next = { ...state, seq: event.seq };
  switch (event.type) {
    case "agent": {
      if (!event.agent?.id) return null; // An incomplete agent event requires a fresh snapshot.
      const agents = state.agents ?? [];
      const found = agents.some(agent => agent.id === event.agent.id);
      next.agents = found ? agents.map(agent => agent.id === event.agent.id ? event.agent : agent) : [...agents, event.agent];
      break;
    }
    case "ticket": {
      const rest = state.tickets.filter((t) => t.ref !== event.ref);
      if (event.ticket) rest.push(event.ticket);
      rest.sort((a, b) => compareRefs(a.ref, b.ref));
      next.tickets = rest;
      break;
    }
    case "frontier":
      next.frontier = event.refs;
      break;
    case "usage":
      next.usage = event.usage;
      break;
    case "sessions":
      next.sessions = event.sessions;
      break;
    case "requests":
      next.requests = event.requests;
      break;
    default:
      break; // metrics-changed and unknown types: data untouched, seq advanced
  }
  return next;
}
