# 202 developer handoff

Branch `feat/202-conformance-spikes-round-4-fixes`, head 5fbe6cf (pushed). Continues the WIP commit d1e9afe from the previous developer cell.

## What this cell did

- Ran the round-4 tests against the WIP: S4b, S8, socket-dir and setup-guard work was already green (35/38); only S6b tests 17-19 failed.
- S6b control check in `apps/bridge/cells/conformance.mjs`: when the control run (no `--settings`) leaves `allowed.txt` absent, the control's stderr is saved to `<out>/S6b-control.stderr.txt` (scrubbed), and two comparison probes run: (1) the worktree with `Write(//<realpath wt>/allowed.txt)` in its settings.local.json, (2) `--repo` itself as the cwd, no `--agent`, with `Write(allowed.txt)` merged into its `.claude/settings.local.json`. The checkout's file is restored byte for byte (or removed), and any `allowed.txt`/`denied.txt` the probe made there is deleted. Comparison captures go to `S6b-compare-abs.jsonl` / `S6b-compare-repo.jsonl` as evidence only (not setup-checked: the main checkout has its own hooks). `runSpikes` then replaces the S6b result with `setup-invalid`, naming "project allow did not apply in the control", saying decision 6.10 stays unverified, listing the comparison lines and keeping the spike's own evidence as "not scored".
- `ctx.scrub` now lives in `makeCtx` (runSpikes reuses it).
- New test `apps/bridge/cells/conformance-s6b-restore.test.mjs`: an owner's existing settings.local.json in the repo comes back byte for byte. No qa test was edited.
- HELP and the file header describe the new S4b, S8, S6b and setup-guard behaviour.

Tests: round-4 file 38/38 (S6b subset re-run after the change; the other 35 ran green before it and share no code path with the S6b edit except runSpikes/runControl), old `conformance.test.mjs` 114/114, restore test 1/1, full `npm test` 2629/2629 (`/tmp/202-tests.txt`).

Not done: the `/code-review` sub-agent pass was skipped for context budget; qa verify should do the full review.

## Run instructions (for the user)

From the main checkout, logged in to `claude`, on this branch merged (or checked out):

```
node apps/bridge/cells/conformance.mjs --spike S4b,S8,S6b --out .scratch/organism-infra/artifacts/106-conformance-<date>
```

- Cost: about 6 user turns on haiku, a few minutes. `--dry-run` prints the plan first.
- S6b adds a throwaway worktree under `.claude/worktrees/` and, only if the control's allow fails, runs one probe in the main checkout itself with a temporary allow in `.claude/settings.local.json` (restored after). Check `git status` is clean afterwards.
- Exit code 1 means a no-go or SETUP-INVALID somewhere; that is a result, not a crash.
- Hand the `--out` directory (`results.json`, the `*.jsonl` fixtures, `S6b-control.stderr.txt` if present) to the orchestrator; an architect records the verdicts in ADR 0016. Per the user's cap, an inconclusive S4b or S8 here keeps ADR 0016's safe choices for good.

```json
{
  "ticket": "organism-infra/202-conformance-spikes-round-4-fixes",
  "cell": "developer",
  "current_step": "All criteria implemented; round-4, old conformance and full suites green; pushed at 5fbe6cf; ready for qa verify.",
  "artifacts": [
    {"path": "apps/bridge/cells/conformance.mjs", "note": "S4b, S8, socket dir, setup guard (previous cell) and S6b control check, HELP text (this cell)"},
    {"path": "apps/bridge/cells/conformance-s6b-restore.test.mjs", "note": "new: the main checkout's settings.local.json is restored byte for byte"},
    {"path": "/tmp/202-tests.txt", "note": "full npm test output, 2629 pass, 0 fail"}
  ],
  "decisions": [
    {"decision": "The repo-cwd comparison merges Write(allowed.txt) into an existing settings.local.json instead of replacing it, then restores the original bytes."},
    {"decision": "Comparison captures are saved as evidence but not setup-checked, since the main checkout's own hooks and settings would always trip the guard."},
    {"decision": "The control-allow-absent rule applies whenever the S6b control did not write allowed.txt, regardless of the spike run's own verdict."}
  ],
  "failures": [],
  "pending": [
    {"item": "qa verify (full, including the code review this cell skipped for context), then risk-check, PR and merge; then the user runs the instructions above.", "owner": "qa"}
  ]
}
```
