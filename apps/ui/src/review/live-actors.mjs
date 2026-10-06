import { compareRefs } from "../../../../packages/board-refs/src/compare-refs.mjs";

// den-layout/03 (absorbs den-v1/02): the pure adapter from a live-store snapshot to the actor state
// PR #162's role pandas take at createReviewAgents(...).applyLive. No three, React or DOM.
//
// A live agent is a ticket with a holder lock whose cells[] entry (when the bridge reports one) is not
// ended. Only the 9 cell types bind; the scenery roles (release-manager, knowledge-keeper, docs-writer,
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

/**
 * @param {{tickets?: object[], cells?: object[]} | null} snapshot
 * @param {{now?: number}} [opts]
 * @returns {{role: string, ref: string, split: boolean, state: string, activity: string, bubble: string, task: string}[]}
 */
export function liveActorsFromSnapshot(snapshot, { now = Date.now() } = {}) {
  const tickets = snapshot?.tickets ?? [];
  const cells = snapshot?.cells ?? [];
  const bound = [];
  for (const t of tickets) {
    const role = t.holder?.cell;
    if (!role || !BOUND.has(role)) continue;
    const cell = cellFor(cells, t.ref, role);
    if (cell && ENDED.has(cell.state)) continue;
    bound.push({ role, t, cell });
  }
  bound.sort((a, b) => compareRefs(a.t.ref, b.t.ref));
  const seen = new Set();
  return bound.map(({ role, t, cell }) => {
    const split = seen.has(role);
    seen.add(role);
    const state = stateOf(t);
    return {
      role,
      ref: t.ref,
      split,
      state,
      activity: ACTIVITY[state],
      bubble: bubbleOf(cell, now),
      task: t.title ? `${t.ref} · ${t.title}` : t.ref,
    };
  });
}
