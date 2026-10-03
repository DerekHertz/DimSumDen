# 90: Drop the biology vocabulary: SWE terms in code and docs, dim sum in the UI

**Type:** task

**Priority:** P1

**Status:** ready-for-agent

**Serves:** ADR 0019 decision 10 (refocus vocabulary); runs before organism-infra/105 so the steering code is written in the new terms.

**What to build:** The user wants the genome/bio/cell vocabulary gone (2026-10-02, refocus session; supersedes the 2026-10-01 all-dim-sum plan). Code, prompts and docs use standard SWE terms; the UI keeps its dim sum names (CONTEXT.md "UI names"). Mapping:

| Old | Code, prompts, docs | UI |
|---|---|---|
| organism | project | the den |
| cell | agent | panda |
| cell type | role | role |
| genome | role file (`.claude/agents/<role>.md`) | recipe card |
| `organism-protocol` skill | `agent-protocol` | |
| apoptosis | the agent ends its run | clocking out |
| spawn, mitosis | dispatch, split-off | call in |
| endocrine limits, homeostasis | usage limits | kitchen limits |
| inflammation | alarm | alarm |
| Agent Office (old project name) | Dim Sum Den | Dim Sum Den |

Unchanged (already kitchen or SWE words): station, the Pass, Steamers, Tea & Pantry, Front of House, pass gate, Bao, resident panda, take over, handoff, relay, board, ticket.

Split with organism-infra/116: **116** rewrites the role files (`.claude/agents/*.md`) and the protocol skill in the new terms as part of its trim (one gated patch). **This ticket** does everything else:
- **Prose:** `.claude/skills/**` other than the protocol, `CLAUDE.md`, `AGENTS.md`, `CONTEXT.md` (the main terms become the SWE words; add an "Old terms" table mapping old to new; keep "UI names"), `README.md`, `design-brief.md`, `docs/agents/*`, `docs/design/*`, `.codex/agents/*`, code comments and user-facing CLI messages in `scripts/`, `apps/` and `packages/`.
- **Names** (`git mv`, update every caller, test, `package.json` script and doc reference):
  - `scripts/cell-start.mjs` → `agent-start.mjs`, `scripts/log-cell.mjs` → `log-agent.mjs`, `docs/agents/cell-start.md` → `agent-start.md`, and their tests
  - `.claude/skills/organism-protocol/` → `agent-protocol/` (every `skills:` preload too)
  - `apps/organism-infra/` → `apps/board/`
  - `ORGANISM_ROOT` → `BOARD_ROOT`, still reading the old variable as a fallback
- **Identifiers:** rename code identifiers where cheap (`cellType` → `role`, `cell` params and locals → `agent`), and CLI flags with the old flag still accepted as an alias.
- **Out of scope (persisted data, so history still parses):** the handoff State block's `cell` key, `usage.jsonl` row fields (`kind:"cell"`, `cell`), lock-file and `events.jsonl` fields, and `.scratch/` feature folder names (`organism-infra` stays). ADRs 0001-0018 and past handoffs stay as written.
- `.claude/` and `CLAUDE.md` edits are gated: the developer writes the edit script into its handoff and the user applies it (`npm run apply-gated`) before qa verify.

- [ ] `grep -rniwE "cells?|cell types?|genomes?|organisms?|apoptosis|mitosis|endocrine|homeostasis|agent office"` over `.claude/skills`, `docs/agents`, `docs/design`, `CLAUDE.md`, `AGENTS.md`, `CONTEXT.md` (outside "Old terms") and `README.md` returns nothing, or only intentional notes listed in the handoff
- [ ] No tracked path outside `.scratch/` and `docs/adr/` contains `cell`, `genome` or `organism` (test)
- [ ] `agent-start`, `log-agent`, `npm run board` and the bridge work; `ORGANISM_ROOT` and old CLI flags still work as fallbacks (tests)
- [ ] Persisted data unchanged: an existing handoff, `usage.jsonl` and `events.jsonl` still parse (fixture test)
- [ ] The full suite passes

## Comments

- **Created (orchestrator, 2026-10-01):** The user asked for "genome" and "cell" and other leftover terms to fit the dim sum theme; chose prose plus names, not data fields, and to run it after 05 and 09 merge, ahead of 04, 06, 07, 08 and 10. 88 and 89 also touch `log-cell.mjs`; run them after this, or rebase.

- **orchestrator, 2026-10-01:** Priority set for the 10-02 infra day (user): P2 so it runs after the pipeline savers (57, 98, 52, 86, 104); it is a wide rename and must run alone. crew-dashboard/01 is blocked by it.
- **orchestrator, 2026-10-03:** Closed: renaming churn, serves no v1 step (refocus, docs/refocus/triage-2026-10-02.md)
- **orchestrator, 2026-10-03:** Reopened: user wants the bio vocabulary gone after all; re-scoped to ADR 0019 decision 10 (SWE terms in code/prompts/docs, dim sum in the UI)
