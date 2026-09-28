# 10: Session and report rules that keep the orchestrator cheap

**Type:** task (it changes docs and genomes: brain gate)

**What to build:** Short, enforceable rules in `organism-protocol`, the genomes and `CLAUDE.md`:
1. **Run cells on their genome's model.** Start the orchestrator with `claude --agent orchestrator` (Sonnet, medium effort), not a default Opus session. Opus is only for the designer and the debugger. Dispatches through a generic agent type (the workaround until `05`) pass the genome's model and effort explicitly.
2. **Cap the report.** A cell's final report to the orchestrator stays under about 300 words: the verdict, the branch, the numbers and a pointer. Details go in the handoff file.
3. **Send verbose work to cheaper models.** Full test runs, log reading and merge checks go through `scout` (Haiku) or, after `04`, a local model.
4. **Keep the plan correct.** The user is on **Pro**. Fix any doc or genome that assumes otherwise, and have `usage-watch` warn when `get_usage` reports a different plan (it reported "Max" on 2026-09-27, likely left over from a gifted Max period).

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Rules 1-3 are in `organism-protocol` or the genomes, each in a sentence or two
- [x] `usage-watch` states the Pro assumption and the plan-mismatch warning
- [x] The edits are proposed to the user before they're made (brain gate)

## Comments

- **Created (orchestrator, 2026-09-27):** At the user's request, to save tokens on the Pro plan. Today's full cells cost 55k-125k subagent tokens each, and every report lands in the orchestrator's context.
- **Scope added (user, 2026-09-27):** Link `docs/agents/process-hygiene.md` from `organism-protocol`'s Apoptosis step 1, and add the orchestrator's post-return check for leftover processes and locks to its genome. The note was drafted on branch `claude/jev-integration-efficiency-d0dc8c`. Why: ci-cd/02's developer and its review subagents left 14 orphaned `dev-server.mjs` and `node --test` processes and an unreleased lock. The user approved killing those PIDs and releasing the lock.
- **Scope added (user, 2026-09-27):** Fold in the pipeline-telemetry attribution tag (approved brain gate): `organism-protocol` has every cell state its cell type and ticket in its first message, e.g. `[cell: developer | ticket: ci-cd/02]`. Why: telemetry attributes sessions from this tag; every untagged session is harder to attribute later. See `.scratch/pipeline-telemetry/spec.md`.
- **Scope changed (user, 2026-09-27):** Rule 1 changes for the orchestrator: it runs on **Opus, low effort**, not Sonnet medium. Why: it makes the most decisions, including sizing tasks for other cells, so a stronger model is more efficient overall. Update `orchestrator.md`'s frontmatter (`model`, `effort`) and rule 1's wording. Opus stays for designer and debugger too.
- **Developer (2026-09-27):** Implemented on branch `claude/organism-infra-10-session-hygiene` (base 88840fd), worktree `.claude/worktrees/agent-a6bf6b8f012434c04`, commit a6b4807. `orchestrator.md` frontmatter set to `model: opus`, `effort: low`; loop step 7 checks leftover processes/locks/stash/worktrees per `docs/agents/process-hygiene.md`. `organism-protocol` gained the cell-attribution first-message rule, the model/effort-per-genome rule, the 300-word report cap, and a link to `process-hygiene.md` from Apoptosis step 1 (WIP commit instead of stash). `usage-watch` states the Pro-plan assumption and the plan-mismatch warning. Grepped tracked docs/genomes for other Sonnet/Max-orchestrator assumptions: none found; fixed one stale reference in the untracked handoff `.scratch/_handoffs/2026-09-27-orchestrator.md`. Verified via scout: `npm install` clean, `npm test` 62/62 passing, `npm run risk-check` clean. No leftover processes. Ending at `in-review` per genome; orchestrator resolves after merge.
- **Resolved (orchestrator, 2026-09-27):** PR #12 merged by the user. Lock released.
