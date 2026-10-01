```json
{"ticket": "organism-infra/72", "cell": "developer", "current_step": "Fix round 2: the user's 80% usage verdict is implemented on feat/72-wake-gate-prelude (314bd8a); ready for qa verify.",
 "artifacts": ["scripts/jev-wake-prelude.mjs", "scripts/jev-wake-prelude.test.mjs", "scripts/jev-wake-prelude-cli.test.mjs"],
 "decisions": ["Usage alone never wakes; at 80%+ the frontier wake is suppressed and the no-wake reason says so", "New input inFlightCount (tickets with a claim lock) wakes at any usage level", "qa's pinned 'usage at 80% wakes' test replaced to match the verdict", "Ambiguous cell comments still go to Jev at 80%+; needs-claude, other or a fallback still wake"],
 "failures": ["Grep tool with a worktree path searched the main checkout instead; switched to rg in the shell"],
 "pending": [{"item": "qa verify of feat/72-wake-gate-prelude at 314bd8a, including the replaced 80% test", "owner": "qa"}, {"item": "security review: risk-check hits from round 1 (gh shell-out, board code, fake sk- key in a test)", "owner": "security"}, {"item": "confirm ambiguous cell comments should still wake at 80%+ if Jev labels them needs-claude", "owner": "orchestrator"}, {"item": "apply the orchestrator genome edit proposed in handoffs/72-developer.md, with the user's permission", "owner": "orchestrator"}]}
```

**cell:** developer | **branch:** feat/72-wake-gate-prelude | **commits:** 5f6c91b (qa tests), 97b02c7 (implementation), 314bd8a (this fix)

## State
Done. `npm test` 1160/1160, 0 skipped. The prelude's two test files pass 38/38.

## What changed
- `scripts/jev-wake-prelude.mjs`, `codeDecides`:
  - Usage is no longer a wake reason.
  - Order: CI red, merge conflict, CI unreadable, pending gate request, cells in flight, then the frontier.
  - The frontier wakes only when usage is under 80%. At 80% or more it returns `wake:false` with reason `usage at N%: frontier wake suppressed`.
  - `runPrelude` adds that reason to its no-wake reason.
- New `inFlightCount` input. The CLI counts unresolved tickets with a claim lock (the snapshot's `holder`).
- User-authored, `Scope added` and `--verdict` comments still wake through `codeWakes` without calling Jev, at any usage.

## qa's pinned test changed (per the verdict)
`scripts/jev-wake-prelude.test.mjs`: I replaced qa's test `codeDecides: usage at 80% wakes; 79% does not` with tests for the verdict:
- usage alone never wakes;
- at 80%+ the frontier is suppressed, and at 79.9% it still wakes;
- each wind-down item wakes at 90%;
- a cell in flight wakes;
- at 80%+, a frontier-only run gives no wake and names the suppression;
- at 95%, user, `Scope added` and verdict comments wake without Jev.

I also updated the header contract to match. Two CLI tests were added in `jev-wake-prelude-cli.test.mjs`: a cell in flight wakes at 85%, and the frontier wakes at 79%. qa should check that these replacements match its intent.

## For the orchestrator
- Open question: the verdict doesn't mention ambiguous cell comments. They still go to Jev at 80% or more, and a `needs-claude`, `other` or fallback label still wakes. If the user wants them suppressed at 80%+ too, that's one extra line in `runPrelude`.
- In-flight cells wake below 80% as well. Before this change they never woke. I made that call so wind-down items behave the same at every usage level.
- At 80%+ with only a frontier, the CLI now reads `gh`. If `gh` can't be read, "CI state unreadable" wakes. That's by design, since unknown CI could be red.
- The genome edit proposed in `handoffs/72-developer.md` still applies. Its wording doesn't depend on the 80% rule.

## Next step
qa, verify mode, on feat/72-wake-gate-prelude at 314bd8a. After that, security, because `risk-check` hits.

## Gotchas
- Don't run the CLI against the real board during a review. It can call Jev and append rows to `usage.jsonl`.
