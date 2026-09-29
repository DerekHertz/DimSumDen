import { stationOf } from "./banquet-layout.mjs";

// ADR 0011 decision 7: sceneFromState(snapshot) -> SceneCell[]. Pure; no three, React or DOM.
export const MAX_PLUSH = 12;

const ACTIVE_STATUSES = new Set(["claimed", "in-review", "blocked", "ready-for-human"]);
const ARCHITECT_TYPES = new Set(["design", "design-question", "design-direction", "decision", "prototype"]);

function cellTypeOf(t) {
  if (t.holder?.cell) return t.holder.cell;
  if (t.lastCell) return t.lastCell;
  if (ARCHITECT_TYPES.has(t.type)) return "architect";
  if (t.type === "research") return "scout";
  return "developer";
}

function poseOf(t) {
  if (t.gate) return "waiting_on_user";
  if (t.status === "ready-for-human") return "waiting_on_user";
  if (t.status === "claimed") return "working";
  if (t.status === "in-review") return t.holder ? "working" : "done";
  if (t.status === "blocked") return "blocked";
  return "idle";
}

/** @param {{tickets: object[], frontier: string[]}} snapshot */
export function sceneFromState(snapshot) {
  const tickets = snapshot?.tickets ?? [];
  const frontier = snapshot?.frontier ?? [];
  const byRef = new Map(tickets.map((t) => [t.ref, t]));
  const active = tickets
    .filter((t) => ACTIVE_STATUSES.has(t.status))
    .sort((a, b) => (a.ref < b.ref ? -1 : a.ref > b.ref ? 1 : 0));
  const seen = new Set(active.map((t) => t.ref));
  const queued = [];
  for (const ref of frontier) {
    const t = byRef.get(ref);
    if (t && !seen.has(ref)) {
      seen.add(ref);
      queued.push(t);
    }
  }
  const slots = {};
  return [...active, ...queued].slice(0, MAX_PLUSH).map((t) => {
    const cellType = cellTypeOf(t);
    const station = stationOf(cellType); // ADR 0013: perch is "<station>#<slot>"
    const slot = slots[station] ?? 0;
    slots[station] = slot + 1;
    return { ref: t.ref, cellType, status: t.status, perch: `${station}#${slot}`, pose: poseOf(t) };
  });
}
