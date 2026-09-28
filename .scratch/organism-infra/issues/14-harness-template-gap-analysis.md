# 14: Design question: map the harness-creator AGENTS.md template onto our cells

**Type:** design-question

**What to build:** A gap analysis that compares https://github.com/walkinglabs/learn-harness-engineering/blob/main/skills/harness-creator/templates/agents.md with how our cells are defined today: `CLAUDE.md`, `.claude/agents/*.md`, the `organism-protocol` skill, the board and handoffs. It ends with a proposal of concrete edits.

The template's sections are startup workflow, working rules, required artifacts, definition of done, end of session, verification commands, and escalation.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [ ] A table maps each template section to where we already cover it (file and section), or marks it as a gap
- [ ] For each gap, a proposed edit, with a note on the token cost for Pro (keep the preloaded context small)
- [ ] The proposal is written to the handoff. Cells don't edit `.claude/`: the orchestrator applies approved edits with the user's permission (brain gate)
- [ ] It says which parts of the template we deliberately skip and why (for example, `feature_list.json` vs the board)

## Comments

- **Created (orchestrator, 2026-09-28):** At the user's request. The user chose a gap analysis by `architect` over a rewrite. Run it after the organism-infra/05 and ci-cd/03 merges, since only one cell runs at a time.
- **architect, 2026-09-28:** Gap analysis done. Proposal in .scratch/organism-infra/handoffs/14-architect.md: real gaps are (1) no verification-commands doc, (2) no init.sh-equivalent env-health check, (3) no hang/timeout rule -- proposing edits to CLAUDE.md and organism-protocol SKILL.md plus timeout-minutes on the not-yet-applied ci-cd/03 workflow. feature_list.json deliberately skipped in favor of the board (ADR 0003/0008). No ADR needed -- all edits are easily reversible.
- **unknown, 2026-09-28:** User decision, 2026-09-28: apply edits 3 and 4 only. Edit 3, the hang/timeout rule, is now in organism-protocol under 'Timeouts'; the orchestrator applied it with the user's permission. Edit 4, timeout-minutes 15 on test and 5 on security, goes into the ci-cd/03 fix round. Edits 1 and 2 were declined.
