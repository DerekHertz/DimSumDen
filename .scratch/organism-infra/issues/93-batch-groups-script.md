# 93: batch-groups script (propose 2-3 ticket batches)

**Type:** feature

**Priority:** P1

**Blocked by:** None

**Status:** resolved

## What to build

The orchestrator genome's "Batches" section says a batch is small tickets in one area whose files overlap each other but no other in-flight branch. Today the orchestrator finds candidates by reading tickets by hand. Each batch saves a full relay (one qa specify, developer, qa verify, risk-check, PR for several tickets), which matters while the 5-hour window is tight. Add a script that proposes them.

`node scripts/batch-groups.mjs [--max 3] [--json]`:

- Reads every ticket on the board that is `ready-for-agent`, unblocked (every `Blocked by` ref resolved) and has no `.lock`.
- Extracts each ticket's file paths: repo-relative paths in backticks (a `/` and a file extension, or a known directory) in "What to build" and "Acceptance criteria". Ignore `.scratch/` and `.claude/` paths. A ticket with no paths is listed as `unknown files` and never grouped.
- Collects in-flight files from open branches through an injected seam (default: `git diff --name-only origin/main...<branch>` for each open PR's head from `gh pr list`; a failure of `gh` means no in-flight data, and the output says so).
- Groups tickets into connected components of shared paths, each group capped at `--max` (default 3; split a larger component by most shared paths). A group is dropped to singles if any of its paths overlaps an in-flight branch. Tickets of one group share a feature unless a path overlap says otherwise; code tickets and asset/visual tickets are not mixed (type `feature|task|fix|bug|chore|refactor` versus the rest).
- Output: per group, the ticket refs, the shared paths and a one-line reason; then singles, then `unknown files`. `--json` prints the same as one JSON object. Exit 0 always except bad arguments (2).
- Advisory only: it changes nothing on the board. The orchestrator proposes a group to the user as it does today.

The orchestrator genome should name the command in the "Batches" section. Changing `.claude/` is gated: the developer writes the exact edit into its handoff for the user to apply.

## Acceptance criteria

- [ ] Two tickets that share a path are grouped; two that share none are not (fixture board)
- [ ] A group is capped at `--max` and split by shared paths (test)
- [ ] A ticket whose path overlaps an in-flight branch's files is left single (injected seam test); with the seam failing, groups are still printed and the output notes no in-flight data
- [ ] A ticket with no paths appears under `unknown files` only; blocked, locked and non-ready tickets are skipped
- [ ] Code and asset tickets are never grouped together
- [ ] `--json` output parses and matches the text grouping; bad arguments exit 2
- [ ] The orchestrator genome edit is written into the developer's handoff for the user to apply

## Comments

- **orchestrator, 2026-10-01:** Filed on the user's yes (2026-10-01), to run next because the 5-hour window is tight. Small by design: pure grouping function plus a thin CLI, no board writes.
- **qa, 2026-10-01:** qa specify: 27 failing tests in scripts/batch-groups.test.mjs (feat/batch-groups93). Criterion 7 (genome edit in developer handoff) is human-verified. See handoffs/93-qa-specify.md.
- **qa, 2026-10-01:** All 27 tests pass; criteria fully covered; no scope drift. See handoff for full mapping.
- **security, 2026-10-01:** Security pass. execFile with argv arrays, no shell; board read-only; no leaks (gitleaks clean). Two low notes in handoff 93-security.md.
- **orchestrator, 2026-10-01:** qa light verify pass (41047 tok), security pass (27177 tok). PR 121. Genome edit in 93-developer.md for the user. Finding: ~35 open tickets name no file paths, so few batches until tickets list files.
