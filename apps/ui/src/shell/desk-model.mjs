import { liveActorsFromSnapshot } from '../review/live-actors.mjs';
import { actorBindings } from '../scene/meshy/layout.mjs';

// Presentation metadata only. Agent state and ticket identity always come from the live snapshot.
export const RESIDENTS = Object.freeze([
  ['orchestrator', 'Bao', 'The Pass'], ['product', 'The Planner', 'The Pass'],
  ['architect', 'The Architect', 'The Pass'], ['developer', 'The Maker', 'Steamers'],
  ['scout', 'The Scout', 'Steamers'], ['debugger', 'The Debugger', 'Steamers'],
  ['qa', 'The Taster', 'Tea'], ['security', 'The Guardian', 'Pantry'],
  ['designer', 'The Stylist', 'Front of House'], ['herald', 'The Herald', 'Front of House'],
  ['release-manager', 'The Drummer', 'Festival'], ['knowledge-keeper', 'The Librarian', 'Library'],
  ['docs-writer', 'The Painter', 'Library'], ['stem-cub', 'The Cub', 'Cubs'],
].map(([role, name, station]) => Object.freeze({ role, name, station })));

export function deskResidents(snapshot, options = {}) {
  const bindings = options.bindings ?? actorBindings(liveActorsFromSnapshot(snapshot, options));
  return RESIDENTS.flatMap(resident => {
    const primary = bindings.get(resident.role);
    const visitors = [...bindings].filter(([id, actor]) => actor.role === resident.role && id !== resident.role);
    return [{ ...resident, ...primary, id: resident.role, state: primary?.state ?? 'resident', ref: primary?.ref ?? null, visitor: false },
      ...visitors.map(([id, actor]) => ({ ...resident, ...actor, id, visitor: true }))];
  });
}

export function deskActivity(snapshot, options) {
  const actors = liveActorsFromSnapshot(snapshot, options);
  return {
    working: actors.filter(actor => actor.state === 'working').length,
    waiting: actors.filter(actor => actor.state === 'needs-you').length,
    blocked: actors.filter(actor => actor.state === 'blocked').length,
    resting: RESIDENTS.length - new Set(actors.map(actor => actor.role)).size,
    visitors: actors.filter(actor => actor.split).length,
  };
}
