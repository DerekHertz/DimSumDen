import { compareRefs } from "../../../../packages/board-refs/src/compare-refs.mjs";

// den-layout/03 (absorbs den-v1/02): the pure adapter from a live-store snapshot to the actor state
// PR #162's role pandas take at createReviewAgents(...).applyLive. No three, React or DOM.
//
// A live agent is a ticket with a holder lock whose cells[] entry (when the bridge reports one) is not
// ended, or an agent the bridge itself runs (agents[]), claimed or not. Only the 9 cell types bind; the scenery roles (release-manager, knowledge-keeper, docs-writer,
// stem-cub) stay simulated.

export const TOOL_BUBBLE_TTL_MS = 8000;

export const LIVE_ROLES = Object.freeze([
  "orchestrator", "product", "architect", "developer", "scout", "qa", "security", "designer", "herald",
]);
const BOUND = new Set(LIVE_ROLES);
const ENDED = new Set(["terminated", "done", "failed"]);

// The cell row for this ticket and role: the one with the newest event wins.
function cellFor(cells, ref, role) {
  let best = null;
  for (const c of cells) {
    if (c?.ref !== ref || (c.cellType && c.cellType !== role)) continue;
    if (!best || Date.parse(c.lastEventAt) > Date.parse(best.lastEventAt)) best = c;
  }
  return best;
}

function stateOf(t) {
  if (t.gate || t.status === "ready-for-human") return "needs-you";
  if (t.status === "blocked") return "blocked";
  return "working";
}
const ACTIVITY = { working: "Working", "needs-you": "Needs your answer", blocked: "Blocked" };

function bubbleOf(cell, now) {
  const tool = cell?.tool;
  if (!tool?.name) return "";
  const at = Date.parse(cell.lastEventAt);
  if (Number.isFinite(at) && now - at > TOOL_BUBBLE_TTL_MS) return "";
  return tool.summary ? `${tool.name}: ${tool.summary}` : tool.name;
}

// den-v1 loop (live den run, 2026-10-10): the agent the bridge runs for this ticket and role, if it has not ended.
// It comes from snapshot.agents[] (the steering host), not from the board, so it exists before any claim.
function agentFor(agents, ref, role) {
  return agents.findLast((a) => a?.id && a.ref === ref && a.role === role && !ENDED.has(a.state)) ?? null;
}

/**
 * A live agent is a ticket with a holder lock, or an agent the bridge is running (claimed or not: a den-started
 * agent runs, and may wait on the user, before it claims). A held permission request shows as needs-you.
 * @param {{tickets?: object[], cells?: object[], agents?: object[]} | null} snapshot
 * @param {{now?: number}} [opts]
 * @returns {{role: string, ref: string, split: boolean, state: string, activity: string, bubble: string, task: string}[]}
 */
export function liveActorsFromSnapshot(snapshot, { now = Date.now() } = {}) {
  const tickets = snapshot?.tickets ?? [];
  const cells = snapshot?.cells ?? [];
  const agents = Array.isArray(snapshot?.agents) ? snapshot.agents : [];
  const bound = [];
  const shown = new Set();
  for (const t of tickets) {
    const role = t.holder?.cell;
    if (!role || !BOUND.has(role)) continue;
    const cell = cellFor(cells, t.ref, role);
    if (cell && ENDED.has(cell.state)) continue;
    bound.push({ role, t, cell, agent: agentFor(agents, t.ref, role) });
    shown.add(`${role}|${t.ref}`);
  }
  for (const agent of agents) {
    if (!agent?.id || typeof agent.ref !== "string" || !BOUND.has(agent.role) || ENDED.has(agent.state)) continue;
    const key = `${agent.role}|${agent.ref}`;
    if (shown.has(key)) continue;
    shown.add(key);
    bound.push({ role: agent.role, t: tickets.find((t) => t.ref === agent.ref) ?? { ref: agent.ref }, cell: null, agent: agentFor(agents, agent.ref, agent.role), unclaimed: true });
  }
  bound.sort((a, b) => compareRefs(a.t.ref, b.t.ref));
  const seen = new Set();
  return bound.map(({ role, t, cell, agent, unclaimed }) => {
    const split = seen.has(role);
    seen.add(role);
    // An unclaimed ticket's own status says nothing about this agent (it is ready-for-agent until the claim).
    const state = agent?.state === "waiting_on_user" ? "needs-you" : unclaimed ? "working" : stateOf(t);
    return {
      role,
      ref: t.ref,
      split,
      state,
      activity: ACTIVITY[state],
      bubble: bubbleOf(cell, now) || bubbleOf(agent, now),
      task: t.title ? `${t.ref} · ${t.title}` : t.ref,
    };
  });
}
