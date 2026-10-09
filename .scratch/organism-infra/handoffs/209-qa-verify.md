# 209 qa verify handoff (light verify)

Branch: `feat/209-v1-progress-bar`, HEAD 3eab301 (developer commit 358d5a1, user's settings commit 3eab301). Specify sha c219bcb.
Verify mode: light, as dispatched. Suite result taken from /tmp/209-tests.txt per orchestrator direction; not re-run.

## Verdict

Escalate to full verify. No pass or bounce recorded. Two developer judgement calls need a decision (below). One of them, if full verify agrees, is a bounce at `scripts/north-star.mjs:86`.

## Light steps

1. Suite (saved output /tmp/209-tests.txt): 3043 tests, 3042 pass, 1 fail, 0 skipped. The failure is `apps/bridge/bridge-events.test.mjs:109` "touching a fixture ticket emits a ticket change event within 2s, seq continuing from the snapshot". It is outside this ticket's files. The orchestrator reports it as a timing flake. I did not re-run it. All 209 tests in the saved output pass.
2. Specify tests: `git diff c219bcb HEAD` over `scripts/north-star.test.mjs`, `scripts/statusline-north-star.test.mjs`, `scripts/mods-north-star.test.mjs`, `scripts/north-star-fixture.mjs` and `scripts/statusline.test.mjs` is empty. No assertion was removed or loosened.
3. Criterion to test map (all pass in the saved output):
   - AC1 set is den-v1 plus chain blockers: `scripts/north-star.test.mjs` "AC1 ..." (7).
   - AC2 resolved and closed are done, parked drops out of the total: "AC2 ..." (2).
   - AC3 next is the unblocked ticket with the longest not-done chain: "AC3 ..." (9).
   - AC4 statusline segment with no network call: `scripts/statusline-north-star.test.mjs` "AC4 ..." (6), plus "AC4 the module reads only the board" in `scripts/north-star.test.mjs`.
   - AC5 band renders bar, count and next from the same module: `scripts/mods-north-star.test.mjs` "AC5 ..." (6).
   - AC6 marketplace lists the mod: "AC6 ..." (2). The `.claude/settings.json` enable line is human-verified (gated edit).
   - AC7 existing statusline tests still pass: `scripts/statusline.test.mjs` in the saved run.
   - Human-verified, not checked here: the band drawing in a live terminal `claude` session in WSL.
4. Files outside ticket scope (listed, not judged): `.claude/settings.json` (one line added: `"north-star@dimsumden-mods": true`, committed in 3eab301). All other changed files are in scope: `scripts/north-star.mjs`, `scripts/statusline.mjs`, `mods/north-star/*`, `.claude-plugin/marketplace.json`.

## Developer judgement calls (qa's view)

(a) A parked blocker still blocks `next` (`scripts/north-star.mjs:109`). Acceptable against AC3. "Unblocked" follows the board's ready rule (every `Blocked by` is resolved), and parked is not resolved. Consequence: a den-v1 ticket blocked by a parked ticket never becomes `next`.

(b) A parked ticket's own blockers do not join the set (`scripts/north-star.mjs:86`, the `continue`). Not acceptable as written. AC1 says "followed through the whole chain". Concrete case: D (den-v1, open) is blocked by P (parked), and P is blocked by Q (open). The set is {D, P}, so Q is dropped. The result is total 1, `next: null`, and the bar hides Q, which is the only unblocked work. No test pins a parked ticket in the middle of a chain. Fix: keep parked out of the total, but walk its blockers into the set. Full verify should add a test for this case.

Decision needed on (b). (a) can stand as built.

## Not run (for full verify)

- `claude plugin validate mods/north-star` (developer and specify both asked for it).
- `tsc` on `mods/north-star/hooks/register.tsx`. The file has no automated test and was not loaded.

## State

```json
{
  "ticket": "organism-infra/209-v1-progress-bar",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify run. Suite result from /tmp/209-tests.txt: 3042/3043, the one failure is a bridge timing flake outside scope. Specify tests unchanged. Criteria mapped and passing. Escalated to full verify on judgement call (b), a parked ticket's blockers not joining the set (scripts/north-star.mjs:86). Call (a) is acceptable.",
  "artifacts": [
    "scripts/north-star.mjs",
    "scripts/statusline.mjs",
    "mods/north-star/",
    ".claude-plugin/marketplace.json",
    ".claude/settings.json (out of scope, gated, user commit 3eab301)"
  ],
  "decisions": [
    "Judgement (a) parked blocker still blocks next: acceptable against AC3",
    "Judgement (b) parked ticket's blockers excluded from the set: not acceptable as written against AC1, escalate"
  ],
  "failures": [
    "apps/bridge/bridge-events.test.mjs:109 timing flake in saved suite run, not re-run, orchestrator reports as known"
  ],
  "pending": [
    {
      "item": "Decide judgement (b). Full verify: add a test for a parked ticket in a chain, run claude plugin validate mods/north-star, and tsc on register.tsx",
      "owner": "qa"
    }
  ]
}
```
