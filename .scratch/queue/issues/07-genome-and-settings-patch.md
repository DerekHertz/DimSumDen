# 07: Orchestrator genome and settings patch (gated)

**Type:** gated edit

**Priority:** P1

**Class:** product

**Origin:** spec

**Blocked by:** 02, 03, 04, 05, 06

**Status:** ready-for-agent

**Serves:** `.scratch/queue/spec.md` decision 11 (the orchestrator proposes the top of the Queue; a deviation is logged); ADR 0015 Amendment 3.

## What to build

The orchestrator follows the Queue. `.claude/` is gated, so a cell writes the patch and the user applies it. Source: the diff and the settings rules in `.scratch/queue/handoffs/01-architect.md` ("Orchestrator genome edit").

- Regenerate the diff for loop steps 5 and 6 of `.claude/agents/orchestrator.md` against current `main` (the architect's was made at d0aa6fa).
- In the genome's Rules paragraph, remove the `order` and `jev-order` mentions as the handoff describes.
- Add the two `permissions.deny` rules for `queue-admin` to `.claude/settings.json`.
- Write the patch to `.scratch/_handoffs/gated/<NN>-queue-genome.patch`. The user applies it with `!npm run apply-gated`.

## Acceptance criteria

- [ ] The patch applies cleanly to current `main` (`git apply --check`).
- [ ] It changes only loop steps 5 and 6, the Rules paragraph's `order` mentions, and the two deny rules.
- [ ] Every command the new genome text names (`board gate`, `board queue`, `board pick`, `npm run queue-admin`) exists on `main`.
- [ ] The user has applied it, and `board queue` runs in an orchestrator session afterwards.

## Comments

- **orchestrator, 2026-10-12:** published from the architect's breakdown (Q6) on the user's approval.
- **orchestrator, 2026-10-12:** from the queue/04 security review (medium, `04-security.md`): the two prefix deny rules in the queue/04 patch miss `npm run --silent queue-admin`, `npm run-script queue-admin`, `node ./scripts/queue-admin.mjs`, an absolute path to the script, and `node -e` importing the module. Add the variants the matcher allows, plus an Edit/Write deny on `.scratch/usage.jsonl`. Then test queue/04 criterion 5 in the main session: does the user's `!npm run queue-admin ...` still run with the rules in place.
- **orchestrator, 2026-10-12:** Retro 2026-10-12 (user yes): this ticket's gated patch also edits the qa genome. In light verify step 1, drop the instruction to run npm test: the dispatch prompt's Suite result line names the saved run, and qa verify cells on queue/03 and queue/04 reported the two as contradicting each other.
- **orchestrator, 2026-10-12:** Retro 2026-10-12, user approved: the gated qa genome patch also adds one line to specify mode: work out each expected value from the fixture rows before asserting it. Cause: four specify tests no implementation could pass (2026-09-29, 2026-10-06, and twice on 2026-10-12: queue/04 planned count, queue/05 decayLeft); each cost a blocked developer and an extra qa hop.
