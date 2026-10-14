// den-mvp/22: the v5 kit's repair bench (zone-repair) and archive (zone-archive), mounted in the den's scene.
// They only show: marks come from the den's own live state (viewFromBridge over useLiveState's snapshot), and a click
// is routed to an existing card or thread. Nothing here talks to the bridge.
import * as THREE from 'three';
import { createExpansionZone, applyExpansionView, animateExpansion, expansionMetadata, triggerExpansionInteraction } from './expansion-assets.mjs';
import { disposeAsset } from './base-assets.mjs';
import { ZONES, INTERACTIONS } from './integration/zone-contract.mjs';
import { interactionIntent } from './integration/bridge-adapter.mjs';

export const WORK_ZONE_IDS = Object.freeze(['repair', 'archive']);
const WORK = WORK_ZONE_IDS.map((id) => ZONES.find((z) => z.id === id));

/** Intents a work-zone click may carry: each only opens a card or a thread. */
export const OPEN_INTENTS = Object.freeze(['open-ticket', 'open-role', 'open-library']);

/** Mount both work zones at their zone-contract positions in den.world; their walk boxes join den.obstacles.
 *  Residents stay off: the den's actor controller owns the pandas. Call before anything snapshots den.obstacles. */
export function mountWorkZones(den) {
  const root = new THREE.Group();
  root.name = 'Garden work zones';
  root.userData.denExpansion = true;
  const zones = new Map();
  for (const z of WORK) {
    const zone = createExpansionZone(z.id, { includeResidents: false });
    zone.position.set(...z.position);
    zone.userData.selectable = true;
    root.add(zone);
    zones.set(z.id, zone);
  }
  den.world.add(root);
  const obstacles = expansionMetadata(root).collisions.filter((c) => c.type === 'box')
    .map(({ x, z, halfX, halfZ, rotation }) => ({ type: 'box', x, z, halfX, halfZ, rotation }));
  den.obstacles.push(...obstacles);

  let disposed = false;
  return {
    root, zones, obstacles,
    /** Show the den's live state on the marks (a view from bridge-adapter's viewFromBridge). */
    apply: (view) => applyExpansionView(root, view),
    /** A local-only response (the lucky bao): it sends nothing. */
    interact: (id) => triggerExpansionInteraction(root, id),
    update: (seconds, reducedMotion) => animateExpansion(root, seconds, !reducedMotion),
    dispose() {
      if (disposed) return; disposed = true;
      for (const o of obstacles) { const i = den.obstacles.indexOf(o); if (i >= 0) den.obstacles.splice(i, 1); }
      root.removeFromParent();
      disposeAsset(root);
    },
  };
}

/** The interaction of a raycast hit's ancestor chain, or null: the first `denInteraction` found walking up. */
export function interactionOf(object) {
  for (let o = object; o; o = o.parent) if (o.userData?.denInteraction) return o.userData.denInteraction;
  return null;
}

/** Route one work-zone click. Handlers: onOpenTicket(intent), onOpenRole(intent), onOpenLibrary(intent), onUnavailable(intent).
 *  It never calls a command: a click opens a card or a thread, never Deliver, Run or Approve. Returns the intent, or null. */
export function routeWorkClick(id, view, handlers = {}) {
  const action = INTERACTIONS.find((a) => a.id === id);
  if (!action || !WORK_ZONE_IDS.includes(action.zone)) return null;
  const intent = interactionIntent(id, view);
  if (!intent) return null;
  if (!intent.available) { handlers.onUnavailable?.(intent); return intent; }
  const handler = { 'open-ticket': 'onOpenTicket', 'open-role': 'onOpenRole', 'open-library': 'onOpenLibrary' }[intent.intent];
  if (handler) handlers[handler]?.(intent);
  return intent;
}

/** Why a work-zone action is off, in words, from the connection phase. */
export function unavailableReason(phase) {
  if (phase === 'reconnecting') return 'The bridge connection dropped; the repair bench and archive wait for it to come back.';
  if (phase === 'offline') return 'The bridge is offline: run npm run ui. The repair bench and archive are off until it is back.';
  return 'Connecting to the bridge; the repair bench and archive wake when it is live.';
}
