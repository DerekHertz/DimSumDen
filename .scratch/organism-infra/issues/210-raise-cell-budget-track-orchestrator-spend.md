# 210: Raise the cell context budget

**Type:** feature

**Priority:** P1

**Blocked by:** None

**Status:** resolved

**Serves:** Testbed friction: partial returns at the 80k cell cap cost runs with no measured benefit (26 partials, ~2.7M tokens; 143 qa specify used two cells without finishing). Orchestrator spend has never been measured, which the user has asked for more than once.

## What to build

1. **Budget.** In `scripts/context-budget.json`, set `developer`, `qa` and `designer` to warn 100k and stop 130k. Leave the orchestrator and the default at 70k/80k. Update every test and doc that pins the cell numbers (`scripts/hooks/context-budget*.test.mjs`, `scripts/cell-start-context-config.test.mjs`, statusline, `docs/agents/`). The 80k cell figures in `.claude/agents/*.md` and in the `organism-protocol` skill are gated files: write the exact edit into the handoff as one command the user runs (see the orchestrator genome on `.claude/` tickets).

## Acceptance criteria

- [ ] developer, qa and designer warn at 100k and stop at 130k; orchestrator and default are unchanged; tests are updated.
- [ ] The gated `.claude/` and skill text edits come in the handoff as one command for the user.

## Comments
- **orchestrator, 2026-10-09:** User 2026-10-09: raise the cell budget (developer, qa, designer) to 100k/130k; the orchestrator stays at 80k. Fold orchestrator spend tracking into this ticket. Data: about 40 cell runs finished past 80k anyway; on 10-08, 9 partials and 409k per resolved ticket. Orchestrator peaks fell from ~300k to ~80k under its gate, so that gate stays. Prior hook tickets: 145, 165, 208.
- **orchestrator, 2026-10-09:** User executive decision 2026-10-09: the orchestrator made the edit itself (6157220 on `feat/210-cell-budget`: JSON plus the organism-protocol text). A developer fixes the tests that pin the old numbers. Spend tracking split out to 211.
- **qa, 2026-10-09:** QA pass at 1ea1ee4: suite 3044/3044 pass, 0 skipped (developer output); AC1 covered by context-budget, tiers, cell-state tests; no assertion weakened. See 210-qa-verify.md.
- **security, 2026-10-09:** Security pass. gitleaks clean (4 commits). Config numbers and doc text only; no deps, CI or network changes. Low: .claude/ files edited on the branch (6157220 SKILL.md, fa65735 orchestrator.md) not via gated patch; user sees it at merge.
