# 138 qa verify (light): QA pass

Branch `feat/138-steering-spike-tooling` at `710bbcc`. Verdict: QA pass.

```json
{
  "ticket": "organism-infra/138-steering-spike-tooling",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify done on 710bbcc: full npm test 1879/1879, 0 skipped; no loosened assertion; every criterion mapped; diff touches only the two ticket files. Four spec-review points judged acceptable. QA pass.",
  "artifacts": [
    "branch feat/138-steering-spike-tooling @ 710bbcc"
  ],
  "decisions": [
    "S4b step (4): one detached run with group SIGTERM, a survivor count, then group SIGKILL and a survivor count. Accepted. The ADR says repeat (2) and (3) detached; the spec-time evaluator contract (group.term, group.kill) was one run, it mirrors the adapter's SIGTERM-then-SIGKILL escalation, and no-go still fires if survivors outlive the group SIGKILL. Difference: group SIGKILL is not measured alone. The trigger is a superset of the ADR (it also fires when the child did not exit on SIGTERM).",
    "S8 socket mode check ignores group bits. Accepted. conformance.mjs:291 flags open if mode & 0o006 or dirMode & 0o007, which is the ADR's 'others' test; the full mode is printed in evidence so security can read group bits. Note for security: a group-writable socket would not be flagged.",
    "S8 interrupt probes in sequence. Accepted. Tool_use plus 2 s unsolicited wait plus three 2 s probe windows ends about 8 s after the sleep 15 starts, so all probes land on a live sleep unless an earlier probe already killed it, in which case the verdict is already residual or worse. The later probe could then read effect false, which cannot lower the verdict.",
    "scrubText skips usernames under 3 chars (conformance.mjs:100). Accepted as a tradeoff: replacing a 1 or 2 character name would corrupt unrelated text. Home paths are still scrubbed, so the name is removed from every path. A short username elsewhere in a fixture would survive; the user should eyeball fixtures before committing them if their username is that short.",
    "The one change to the specify tests (4a1bf82, my own fix: realpathSync on a removed worktree always threw) is not a loosening: the same intent is asserted through realpath of the parent equal to <repo>/.claude/worktrees plus basename /^s6b-/."
  ],
  "failures": [],
  "pending": []
}
```

## Light verify steps

1. `npm test` in the qa worktree: 1879 tests, 1879 pass, 0 fail, 0 skipped. The orchestrator's earlier run had one floating-cards.test.mjs Playwright failure (Ctrl+Enter Note, outside 138's files); it passed in this run, consistent with a load flake.
2. `git diff 95ecff6 HEAD -- apps/bridge/cells/conformance.test.mjs`: one hunk, the S6b worktree-location assert (qa's own fix 4a1bf82, see above). No removed or loosened assertion.
3. Criterion to test (from 138-qa-specify.md; nothing is human-verified):
   - Evaluators pure, tested against a scripted fake: the `S8 ...`, `S4b ...`, `S6b ...`, `S3b ...` evaluator and fake-runner tests.
   - Fixtures scrubbed: `scrubText removes home paths...`, `runSpikes saves scrubbed fixtures: no home path, no username`.
   - Leftover cleanup: the three `runSpikes S4b ...` tests (sleep 61 and child pids dead) and the `runSpikes S6b ...` worktree-removal tests.
   - S3 allow only Write and nested subtype: `runSpikes S3: the allow phase answers only Write...` and the `S3 evaluator ...` nested-subtype tests.
   - No real claude in `npm test`: every `runSpikes` test passes `claudeBin: <fake>` (9 uses); the dry-run test sets `DEN_CLAUDE_BIN=/nonexistent/claude`. In conformance.mjs the only spawn of the binary is Child (line 451, from `opts.claudeBin`) plus `execFile(bin, ["--help"])` (line 783, same bin).
4. Files outside scope: none. `git diff 95ecff6 HEAD --stat` lists only apps/bridge/cells/conformance.mjs and apps/bridge/cells/conformance.test.mjs.

## Comments

Failed calls: none.
