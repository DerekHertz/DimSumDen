# organism-infra/10: session and report hygiene — developer handoff

**Status:** in-review
**Branch:** `claude/organism-infra-10-session-hygiene`, base `origin/main@88840fd`, commit `a6b4807`
**Worktree:** `.claude/worktrees/agent-a6bf6b8f012434c04`

## What changed

- `.claude/agents/orchestrator.md`
  - Frontmatter: `model: sonnet, effort: medium` -> `model: opus, effort: low` (per the user's scope change: orchestrator makes the most sizing/sequencing decisions).
  - Loop step 7: now checks for leftover processes, locks, stash entries, and worktrees (linking `docs/agents/process-hygiene.md`) before repeating from step 1, and shows the user what it found before clearing anything.
- `.claude/skills/organism-protocol/SKILL.md`
  - New: first-message attribution tag rule, e.g. `[cell: developer | ticket: ci-cd/02]` (pipeline-telemetry attribution).
  - New: model/effort-per-genome rule -- orchestrator Opus/low, designer + debugger Opus, everything else Sonnet or cheaper; a dispatch through a generic agent type (until `05`) passes model/effort explicitly.
  - New: ~300-word report cap for a cell's final report to the orchestrator -- verdict, branch, numbers, pointer to the handoff; claim only results you ran.
  - New: verbose work (full test runs, log reading, merge checks) goes through `scout` or, after `04`, a local model.
  - Apoptosis step 1 now links `docs/agents/process-hygiene.md` and says to use a WIP commit instead of `git stash`.
- `.claude/skills/usage-watch/SKILL.md`
  - States the Pro-plan assumption and warns if `get_usage` reports a different plan (it reported "Max" on 2026-09-27, believed stale).
- Grepped tracked docs/genomes for other places assuming the orchestrator runs on Sonnet or a non-Pro plan: found none besides the ticket's own text and one untracked handoff.
  - Fixed `.scratch/_handoffs/2026-09-27-orchestrator.md` line 26 (Sonnet -> Opus, low effort) directly in the main checkout -- it's untracked, so not part of this branch's diff.

`docs/agents/process-hygiene.md` already existed (added by an earlier ticket); this ticket only links to it, doesn't create it.

## Verification (via scout, in this worktree)

- `npm install`: clean, 0 vulnerabilities (node_modules was missing at the start).
- `npm test`: 62/62 passing.
- `npm run risk-check`: clean (`main...HEAD`).
- No leftover background processes.

## Board

- `.scratch/organism-infra/issues/10-session-and-report-hygiene.md`: all three acceptance boxes checked, `Status: in-review`, `## Comments` entry added with the branch/commit/verification summary.
- No lock to release -- the orchestrator holds ticket 10's lock per this ticket's dispatch note.

## Next

Orchestrator resolves the ticket after reviewing/merging the branch (no qa/security relay -- docs/genome-only ticket per the ticket header). Nothing outstanding; no environment issues.
