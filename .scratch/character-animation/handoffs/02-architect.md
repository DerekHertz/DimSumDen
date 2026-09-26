# Handoff: 02 director placement and distant-cell rate → next cell

**State**: resolved. ADR written, ticket 02 closed.

## What changed
- `docs/adr/0007-character-director-seam-and-package-layout.md` (new ADR) answers all three parts of ticket 02.
- `.scratch/character-animation/issues/02-director-placement-design.md`: `Status: resolved`, checklist checked, decision summarized in `## Comments`.
- No code, no `CONTEXT.md` change (no new domain terms — see reasoning below), no dependency added.

## Decisions (full detail in ADR 0007)
1. **Seam**: `packages/character-director` is a renderer-free package (no `three`, `@react-three/fiber`, no DOM/WebGL). Interface: push cell-state-changed/handoff events + perch anchors + reduced-motion flag in; call `tick(cellId, now)` to sample `{ clip, faceFrame, rootTransform }` out. `apps/ui` is the adapter: it owns the R3F scene graph, camera, `AnimationMixer`, and applies sampled commands to meshes. Every director test runs in plain Vitest, no renderer needed (satisfies user story 31).
2. **First package layout**:
   ```
   apps/ui/                       React + R3F app: camera, scene graph, mesh/mixer adapters, dev tools
   packages/character-director/   the seam above; ships a StateSource contract + mock adapter
   daemon/                        Node daemon (not built yet)
   ```
   Only one shared package for now — no `domain-types` or `ui-kit` pre-built ahead of a second consumer.
3. **Mock state source**: `character-director` exports `createMockStateSource()` implementing a `StateSource` contract shaped like the daemon's eventual event envelope (`design-brief.md` §10, trimmed to `cell_id`/`state`/`ts`). Ticket 01's prototype and ticket 04's dev control use it. When the daemon exists, a `daemonStateSource` adapter in `apps/ui` (via ADR-0004's runtime adapter) drops in behind the same interface; the mock survives afterward as Demo mode's synthetic feed.
4. **Distant-cell rate (Level 1, up to 30 cells)**: not "none." A director-owned, still-pure tiered tick rate: `focused` cells tick every frame, `distant` cells tick at a fixed low rate (default **8 Hz, provisional**). `apps/ui` classifies each cell's on-screen size into the tier every frame (a camera/viewport concern) and passes only the tier into the director — the director's five inputs stay unchanged; it never sees the camera. Ticket 10 must measure real 30-cell frame cost and is free to set the interval to 0 (i.e., no throttling) if a 10-bone mixer at 60 Hz × 30 turns out to be cheap enough. The mechanism and its location are fixed by this ADR; the number (8 Hz) is not.

## For the next cells
- **Ticket 03** ("production rig, face atlas and asset contract") was blocked on "02 (package layout)" — that's now resolved, so 03 is unblocked (still also needs 01's verdict).
- **Ticket 01** (throwaway prototype) can ignore package boundaries per its own note ("keep it out of the future app package layout"), but if it wants to preview the mock-driven approach early, `createMockStateSource()`'s shape (decision 3) is the pattern to prototype against.
- **Ticket 04** ("one cell shows its state"): build `packages/character-director` for real here — this is where the seam from decision 1 gets its first implementation and test suite (every state's clip/face-frame/held-pose mapping, immediate interrupts, calm rule).
- **Ticket 10** ("plush look at 30 cells"): implement and measure decision 4's tiering. Record the chosen interval (or "0, no throttling needed") and how frame rate was measured, per its own checklist.
- No brain gate was triggered: no ADR was changed (0007 is new), no dependency was added, and no new domain term went into `CONTEXT.md` (the ADR explains why: "character director," `StateSource`, "tick tier" are architecture vocabulary, not domain vocabulary).

## Gotchas
- The director's `tick(cellId, now)` is a **sampling** call (given a timestamp, return the commands for that instant), not a per-frame delta integrator. That's what makes the distant-cell throttle safe (skipping calls doesn't accumulate error) — don't redesign it as `tick(dt)` without revisiting decision 4.
- Camera/viewport concepts (on-screen size, distance) must not leak into `character-director`'s public interface — that classification belongs in `apps/ui`. If a future ticket wants to pass a `Camera` object into the director, treat that as a conflict with ADR 0007 and flag it rather than quietly doing it.
