# 06: Idle pandas roam the grove

**Type:** feature

**Priority:** P1

**What to build:** One panda per cell type is always in the scene (orchestrator stays on Bao's crown). When a type has no active work, its panda roams slowly on the grass around the market: short, calm wanders between random points, pausing often, never faster than a gentle walk, never through stalls, the table, Bao or Tally. When a ticket becomes active for that type, the panda walks to its station slot and starts working; when the work ends it walks back out and roams again. Extra cells of a busy type still appear at the stall as today. Reduced motion: idle pandas stand still at spread-out grass spots and cross-fade to the stall when called.

**Blocked by:** 01, 04

**Status:** in-review

- [ ] A pure roaming module (seed, time, obstacles -> position) with unit tests: stays inside the grass area, avoids obstacle footprints, deterministic for a seed, speed cap
- [ ] Called-to-work and released transitions tested (idle -> walking to slot -> working -> walking out -> idle)
- [ ] Reduced motion holds positions; smoke:ui passes

## Comments
- **Idea (user, 2026-09-29):** "it would be fun to have the idle pandas just roaming around. when an agent of that type gets called then they start working."
