# 02: Design question: director placement and distant-cell rate

**Type:** design-question

**What to build:** An architecture decision, recorded as an ADR, that answers: where the character director (a pure module: state changes, handoff events, perch anchors, reduced-motion flag and time in; clip, face-frame and root-transform commands out) lives relative to the scene renderer; what the first UI package layout is in the planned TypeScript monorepo; and whether distant cells (Level 1, up to 30) update animation at a reduced rate, and how.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] ADR in `docs/adr/` records the director's seam and its home in the package layout
- [x] ADR states the distant-cell update policy (rate, thresholds or "none") with its reasoning
- [x] ADR names how a mock state source feeds the director until the daemon exists
- [x] Any new domain terms are added to `CONTEXT.md` (brain gate: ask first)

## Comments

Resolved by architect: see `docs/adr/0007-character-director-seam-and-package-layout.md`.

- Seam: `packages/character-director`, a renderer-free package (no `three`/`@react-three/fiber`). Interface: push state/handoff events + perch anchors + reduced-motion flag in, call `tick(cellId, now)` to sample clip/face-frame/root-transform commands out. `apps/ui` adapts commands onto the R3F scene/`AnimationMixer`.
- Package layout: `apps/ui/` (React + R3F app) and `packages/character-director/` (the seam) to start; `daemon/` is a later ticket. No `domain-types` or `ui-kit` package yet - one shared package until a second consumer needs one.
- Mock state source: `character-director` exports `createMockStateSource()` satisfying the same `StateSource` contract the eventual `daemonStateSource` adapter (in `apps/ui`) will satisfy. Tickets 01 and 04 drive the scene with it; it later doubles as Demo mode's synthetic feed.
- Distant-cell rate: not "none" - a director-owned, still-pure tiered tick rate (`focused` = every frame, `distant` = fixed low rate, default 8 Hz, tunable). Classification (on-screen size to tier) stays in `apps/ui`, since it needs the camera; the director never takes camera/distance as an input. Ticket 10 measures real 30-cell frame cost and may set the interval to zero.
- New domain terms: none. "Character director," `StateSource` and "tick tier" are architecture vocabulary, not user-facing domain concepts, so `CONTEXT.md` is unchanged (no gate triggered).

Ticket 03 (blocked by "02 (package layout)") is now unblocked.
