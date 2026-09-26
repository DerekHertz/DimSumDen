# 05: Travel between perches

**What to build:** Cells move between any two perches without hand-authored routes. The director computes a procedural path between perch anchors. It hops in arcs when the destination is on a different body region (crown, shoulder, knee, grass) and waddles along the surface when it is on the same region. A state change mid-travel reacts immediately. A cell that is airborne mid-hop drops to the nearest surface point on Bao or the grass, plays land-squish, and takes that point as its new perch. With reduced motion, travel becomes a `dur-base` cross-fade at the destination.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] hop, waddle and land-squish clips are in the glb and pass the asset contract check
- [ ] Director tests cover hop vs waddle choice, the mid-hop drop, and the reduced-motion cross-fade
- [ ] In the scene, a cell can be sent to any perch and travels there correctly

## Comments
