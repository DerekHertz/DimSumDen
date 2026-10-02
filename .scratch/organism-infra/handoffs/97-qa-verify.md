# Handoff: organism-infra/97 qa light verify (batch K)

## State

```json
{
  "ticket": "organism-infra/97-jg-resource-limit-full-root",
  "cell": "qa",
  "mode": "verify",
  "current_step": "QA pass for 97 at 97275b0 (feat/jg-limit-batchK, detached worktree). Light verify: npm test 1729/1729 pass, 0 skipped (second run); no qa test file changed since 20afbaf; every criterion mapped; developer's countFiles change judged sound.",
  "artifacts": [
    "scripts/jg.mjs",
    "scripts/dispatch-context.mjs",
    "scripts/jg-output-format.test.mjs"
  ],
  "decisions": [
    "Step 1: first full npm test run gave 1727 pass, 2 fail (apps/organism-infra/board-cli.test.mjs 'a fresh write lock with a dead pid is not reclaimed before the age floor', and board-status-and-lock.test.mjs 'a taken claim lock fails fast even while the write lock is held', which took 2012 ms). Both are timing-based board lock tests and the machine was busy with other sessions. The two files rerun alone: 31/31. A second full npm test: 1729 tests, 1729 pass, 0 fail, 0 skipped. Neither file is in the batch diff. Treated as load flakes, not a bounce; the orchestrator may want a flaky-test ticket.",
    "Step 2: git diff 20afbaf HEAD on scripts/dispatch-context-limit.test.mjs and scripts/dispatch-context.test.mjs: empty. Nothing removed or loosened. (c2aec2a..HEAD on those files shows only the round-2 re-specify in 20afbaf, mine.)",
    "Step 3 criterion map. AC1 (live run, non-null path, no fallback): human-verified by the developer stage; the developer recorded the live run in 97-developer-2.md (path non-null, bytes 24567, fallback null, jg 0.8.0). I did not re-run it (never run jg live from qa). Seam stand-ins pass: the 6 '[97] fix' tests and the CLI 0.8.0 test in scripts/dispatch-context-limit.test.mjs. Scope 'per-call excludes': '[97] fix: every file over 16 MiB is excluded by an anchored pattern...', 'a file name with glob or escape characters...', and the two '[97] jg.mjs' excludes tests. Scope '--max-output-bytes in the allowlist': the two '[97] jg.mjs: --max-output-bytes' tests. Scope 'version check wired in': '[97] fix: CLI with jg 0.4.4 ... falls back jg-version' and the unreadable --version test. AC2: the 6 '[97] AC2' tests. AC3: the 2 '[97] AC3' tests, the secret-in-output test, 'no file over 16 MiB adds no excludes', 'the command line still refuses --exclude', and the unchanged dispatch-context.test.mjs and jg.test.mjs.",
    "Step 4 files outside the ticket's scope, listed not judged: scripts/jg-output-format.test.mjs (new, developer's own tests, not qa's) and the countFiles change in scripts/jg.mjs. Both are under scripts/, named in the developer handoff. Nothing outside scripts/ is in the batch diff (git diff --stat 0a7198d HEAD: 9 files, all under scripts/).",
    "Developer's countFiles change checked by reading the diff and the four new tests: countFiles = max('## ' header count, N from '^Jevgrep: N relevant files'). Sound. Exit code is still checked first (jg-exit-N), so an incomplete-discovery run with a nonzero exit is not turned into success; 'Jevgrep: 0 relevant files.' with no headers is still no-files (tested); '## ' fakes still count (tested); the 'End context.' check in dispatch-context.mjs still catches truncated output. The new tests assert behavior at runJg's public interface with a fake run, with the real 0.8.0 header as the fixture literal (an independent source, not recomputed). A real-format gap in the original specify (the fakes used '## ' headers) is what let this through; the developer fixed it correctly inside the ticket. Residual and minor: a source line that begins 'Jevgrep: N relevant files' inside a returned block would inflate the count, which only affects the no-files label, never the secret scan.",
    "Observations for security and the orchestrator, not bounces: the allowlist widening (--max-output-bytes) and the excludes option are the reviewed surface (excludes validated, anchored, escaped, never from the CLI, per the developer and my tests). The developer's separate finding stands: parseTicket matches only a bold '**What to build:**' line, real tickets use a '## What to build' heading, so live queries carry no ticket text. Worth a ticket."
  ],
  "failures": [],
  "pending": [
    {
      "item": "npm run risk-check; the allowlist change in scripts/jg.mjs means full security review. Then PR and merge of batch K.",
      "owner": "orchestrator"
    }
  ]
}
```

## Verdict

QA pass (97). Light verify steps 1 to 4 done; no judgment call needed beyond the countFiles read, which the orchestrator asked for explicitly.
