# Handoff: three-digit ticket numbers (direct fix, no ticket)

Branch `fix/three-digit-tickets`, commit d036934, pushed. No PR opened. Base f991aeb.

## Summary

Every pattern that assumed a two-digit ticket number now takes two or more digits (`\d{2,}`). Ref sorts that compared strings now use a numeric-aware `compareRefs`, so 99 comes before 100. Two-digit refs order exactly as a plain string compare (tested).

## Changes

- `apps/organism-infra/board-service.mjs`: lines 94, 609, 1151, 1152, 1184, 1292.
- `apps/organism-infra/board-audit.mjs`: REF_RE, REF_IN_TEXT_RE, blockers pattern, issue-name pattern; findings sort uses `compareRefs`.
- `apps/organism-infra/board-fixture.mjs:66`, `scripts/log-cell.mjs:67`.
- New `packages/board-refs/src/compare-refs.mjs` (digit runs compare as numbers, all else by code unit).
- Numeric sort: `apps/bridge/snapshot.mjs`, `apps/ui/src/panel/queue-model.mjs`, `scene/chip-model.mjs`, `scene/handoffs.mjs`, `scene/scene-from-state.mjs`, `state/apply-event.mjs`, `scripts/jev-report.mjs`, `scripts/batch-groups.mjs` (readdir sort of ticket files).
- Date patterns untouched.

Already fine, no change: `apps/bridge/snapshot.mjs` blocker/`nn` parsing (`\d+`), `apps/organism-infra/priority.mjs` ticketNumber (`\d+`), `scripts/jev.mjs` (`\d+`, Number()), `scripts/batch-groups.mjs` blocker parsing (`\d+`).

## Tests

- `apps/organism-infra/board-three-digit.test.mjs`: claim, comment, handoff, release, resolve on `organism-infra/108-apply-gated-script`; wrong three-digit handoff prefix refused; one-digit ticket still refused; audit Blocked by and orphan-pending refs; audit order across 99 and 100; log-cell.
- `packages/board-refs/src/compare-refs.test.mjs`, `apps/bridge/bridge-three-digit.test.mjs` (snapshot order, three-digit blocker, frontier order), plus one test each in `queue-model.test.mjs` and `apply-event.test.mjs`.
- Red first: 7 of 8 new board/ref tests failed before the fix (the one-digit refusal passed, as intended). Final `npm test`: 1807 tests, 1807 pass, 0 fail.

## Notes for the orchestrator

- `compareRefs` differs from a plain string compare only for exotic refs where a digit run meets a hyphen at the same spot (for example `a-1` vs `a--`). Real refs (lowercase, `<feature>/<NN>-<slug>`) are unaffected.
- `board-audit` REF_IN_TEXT_RE now also matches longer numbers (`adr/0008`) in free text, but only counts a match when the feature exists, so no new findings appeared in tests.
- The `npm run smoke:ui` browser check was not run (no browser here). The UI change is an import of a pure `.mjs` from `packages/`, the same pattern as `packages/character-director`.
