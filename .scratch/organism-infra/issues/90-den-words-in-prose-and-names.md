# 90: Den words in genomes, skills, docs and command names

**Type:** task

**Priority:** P2

**What to build:** The user wants the Dim Sum Den words used across the whole project, not just in the UI (2026-10-01). This reverses the line in `CONTEXT.md`'s "UI names" that says the biology terms stay the names in code, genomes and skills. That table is now the source of truth for the project's words:

| Old | New |
|---|---|
| cell | panda |
| cell type | role |
| genome | recipe card |
| organism | den |
| apoptosis | clocking out |
| spawn, mitosis | call in |
| endocrine, homeostasis | plan usage |
| Agent Office (old project name) | Dim Sum Den |

Scope (user decision: prose and names, but not data fields):
- **Prose:** `.claude/agents/*.md`, `.claude/skills/**`, `CLAUDE.md`, `AGENTS.md`, `CONTEXT.md` (move the glossary into the main terms and drop the "stay the names in code" line), `README.md`, `design-brief.md`, `docs/agents/*`, `docs/design/*`, and code comments and user-facing CLI messages in `scripts/` and `apps/`.
- **Names:** rename these and update every caller, test, `package.json` script and doc reference:
  - `scripts/cell-start.mjs` → `panda-start.mjs`
  - `scripts/log-cell.mjs` → `log-panda.mjs`
  - `docs/agents/cell-start.md` → `panda-start.md`
  - `.claude/skills/organism-protocol/` → `den-protocol/`
  - `apps/organism-infra/` → `apps/den-infra/`
  - the matching test files
  - `design/3d/cell_types*.py` and its renders
  - Use `git mv` so history follows. Check `npm run board` and the bridge still find the board (`ORGANISM_ROOT` becomes `DEN_ROOT`; keep reading the old variable as a fallback).
- **Out of scope (keep as is):** data fields and on-disk formats, so the board history still parses: the handoff State block's `cell` key, usage rows' `kind:"cell"`, `cellType`/`cell_type` identifiers, `.scratch/` feature folder names (`organism-infra` stays as a board feature name), and event names. `.claude/agents/` keeps its name (Claude Code needs it). Don't rewrite ADRs or past handoffs; they are history. Add a short ADR recording the rename, as 53 did.
- UI copy is den-scene-v1/08 and stays there.
- `.claude/` and `CLAUDE.md` edits are gated. As in 53, the developer writes a rename script that does those edits (including the `git mv` of the skill folder) into its handoff, and the user runs and commits it in the developer's worktree before qa verify.

**Blocked by:** den-scene-v1/05, den-scene-v1/09 (both touch files this renames; run after they merge)

**Status:** closed

- [ ] `grep -rniwE "cells?|genomes?|organisms?|apoptosis|mitosis|endocrine|homeostasis|agent office"` over `.claude/agents`, `.claude/skills`, `docs/agents`, `docs/design`, `CLAUDE.md`, `AGENTS.md`, `CONTEXT.md` and `README.md` returns only intentional "was: cell" notes (list them in the handoff)
- [ ] No tracked file or directory outside `.scratch/` and `docs/adr/` has `cell`, `genome` or `organism` in its path (test)
- [ ] `panda-start`, `log-panda`, `npm run board` and the bridge work, and the old `ORGANISM_ROOT` still works as a fallback (tests)
- [ ] Data fields are unchanged: an existing handoff and an existing `usage.jsonl` still parse (fixture test)
- [ ] The full suite passes, and the rename ADR is added

## Comments

- **Created (orchestrator, 2026-10-01):** The user asked for "genome" and "cell" and other leftover terms to fit the dim sum theme; chose prose plus names, not data fields, and to run it after 05 and 09 merge, ahead of 04, 06, 07, 08 and 10. 88 and 89 also touch `log-cell.mjs`; run them after this, or rebase.

- **orchestrator, 2026-10-01:** Priority set for the 10-02 infra day (user): P2 so it runs after the pipeline savers (57, 98, 52, 86, 104); it is a wide rename and must run alone. crew-dashboard/01 is blocked by it.
- **orchestrator, 2026-10-03:** Closed: renaming churn, serves no v1 step (refocus, docs/refocus/triage-2026-10-02.md)
