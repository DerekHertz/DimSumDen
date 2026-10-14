// den-mvp/17: mount the v5 kit's koi pond (zone-pond) in the den's scene. Local only: nothing here talks to the bridge.
import * as THREE from 'three';
import { createExpansionZone, animateExpansion, expansionMetadata, triggerExpansionInteraction } from './expansion-assets.mjs';
import { disposeAsset } from './base-assets.mjs';
import { ZONES } from './integration/zone-contract.mjs';

const POND = ZONES.find((z) => z.assetId === 'zone-pond');

/** Mount the pond at its zone-contract position in den.world; its water boxes join den.obstacles.
 *  Residents stay off: the den's actor controller owns the pandas. Call before anything snapshots den.obstacles. */
export function mountExpansionPond(den) {
  const root = new THREE.Group();
  root.name = 'Garden expansion layer';
  root.userData.denExpansion = true;
  const zone = createExpansionZone(POND.id, { includeResidents: false });
  zone.position.set(...POND.position);
  zone.userData.selectable = true;
  root.add(zone);
  den.world.add(root);

  const obstacles = expansionMetadata(root).collisions.filter((c) => c.type === 'box')
    .map(({ x, z, halfX, halfZ, rotation }) => ({ type: 'box', x, z, halfX, halfZ, rotation }));
  den.obstacles.push(...obstacles);

  let disposed = false;
  return {
    root, zone, obstacles,
    /** A click on an interaction root: the local response only. Returns { matched, message, activeUntil }. */
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
