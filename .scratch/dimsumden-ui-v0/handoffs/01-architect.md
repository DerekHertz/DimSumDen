```json
{"ticket": "dimsumden-ui-v0/01-seams-design", "cell": "architect", "current_step": "ADR 0011 written (status: proposed); waiting on the user to accept it and the dependency list",
 "artifacts": ["docs/adr/0011-ui-v0-seams-bridge-snapshot-scene.md"],
 "decisions": ["Bridge lives in new apps/bridge, not daemon/; test runner stays node --test (amends ADR 0007 wording)", "Metrics via GET /metrics plus a payload-free metrics-changed SSE event, not in the snapshot", "Merge and dispatch gates are derived from Board state (dispatch only on frontier[0] when no lock is held); no proposals file", "In-house markdown renderer, no dangerouslySetInnerHTML, to keep injected handoff HTML off a page with gate buttons", "JS not TypeScript"],
 "failures": [],
 "pending": [{"item": "Accept ADR 0011 and approve or trim the dependency list (react, react-dom, three, @react-three/fiber, vite)", "owner": "orchestrator"}, {"item": "Point dispatches of tickets 02 and 03 at the ADR; both are unblocked but their interface and output keys are fixed there", "owner": "orchestrator"}]}
```

## State

Done. Design written as ADR 0011, status `proposed`. Nothing installed, no code written, no `CONTEXT.md` or `.claude/` change.

## What changed

Only `docs/adr/0011-ui-v0-seams-bridge-snapshot-scene.md` (uncommitted, main checkout). It gives JSON examples for the snapshot, SSE events, metrics and scene list, plus route, validation and layout rules.

## Decisions made

See the State block; the ADR has the reasoning and rejected options. Ones that change scope for tickets:
- `gate` is derived (ADR decision 3). The spec says the orchestrator "proposes a dispatch"; v0 instead shows dispatch buttons on `frontier[0]` when nothing is claimed. If the user wants a real proposal record, that is a change to tickets 06 and 12.
- The bridge has zero Board write paths in v0 (no button runs `board`).
- `POST /requests` checks Host and Origin, requires JSON content type, and refuses a kind that doesn't match the ticket's `gate`, or a second pending request.

## Next step

Orchestrator: show the user the ADR, get accept and the dependency yes. Dispatch 02 and 03 (unblocked) with the ADR path; then 04.

## New dependencies (for the user's gate; nothing installed)

runtime: `react`, `react-dom`, `three` (0.170.0), `@react-three/fiber`; dev: `vite`. Exact-pin; the developer checks versions with `npm view` and picks React 18 with R3F 8 or React 19 with R3F 9. Not proposed: drei, typescript, vitest, jsdom, chart or markdown libraries, express, watcher packages. Security reviews the vite tree (esbuild, rollup binaries). The first install happens in ticket 07.

## Suggested skills

organism-protocol, tdd, codebase-design.

## Gotchas

- ADR 0007 names Vitest and `daemon/`; neither exists. The ADR notes the amendment.
- `board-service.list()` has no `subscribe` and returns only feature/ticket/status, so the bridge parses the Board itself.
- `board-fixture.mjs` has no `_handoffs` or `usage.jsonl` support; ticket 04 extends it.
- `apps/ci-cd/smoke.mjs` serves the repo itself; ticket 13 needs a load-this-URL mode.
- Priority age vs day-only orchestrator handoff filenames is imprecise; ticket 02 records its rule.
- The spec's mention of `CONTEXT.md` Gate request is already done (entry exists).
