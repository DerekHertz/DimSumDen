# 09: Gated patch: wider queue-admin deny rules and qa genome edits

**Type:** gated edit

**Priority:** P2

**Status:** ready-for-agent

**Source:** orchestrator

**Class:** pipeline

**Origin:** added

**Blocked by:** 07

**Serves:** finding:queue/04-queue-admin-user-entry-point (security medium, `04-security.md`); pipeline-retro 2026-10-12 (two qa genome edits, user approved).

## What to build

Three additions that were first attached to queue/07 as comments. The user ruled on 2026-10-12 that queue/07 keeps its original scope, so they move here. `.claude/` is gated: a cell writes the patch and the user applies it with `!npm run apply-gated`.

- `.claude/settings.json`: the two prefix deny rules from queue/07 miss `npm run --silent queue-admin`, `npm run-script queue-admin`, `node ./scripts/queue-admin.mjs`, an absolute path to the script, and `node -e` importing the module. Add the variants the matcher allows, plus an Edit/Write deny on `.scratch/usage.jsonl`.
- `.claude/agents/qa.md`, light verify step 1: drop the instruction to run `npm test`. The dispatch prompt's `Suite result:` line names the saved run, and qa verify cells on queue/03 and queue/04 reported the two as contradicting each other.
- `.claude/agents/qa.md`, specify mode: add one line: work out each expected value from the fixture rows before asserting it. Cause: four specify tests no implementation could pass (2026-09-29, 2026-10-06, and twice on 2026-10-12: queue/04 planned count, queue/05 decayLeft); each cost a blocked developer and an extra qa hop.
- Write the patch to `.scratch/_handoffs/gated/<NN>-queue-deny-and-qa-genome.patch`.

## Acceptance criteria

- [ ] The patch applies cleanly to current `main` with queue/07's patch already applied (`git apply --check`).
- [ ] It changes only the deny rules in `.claude/settings.json` and the two places in `.claude/agents/qa.md` named above.
- [ ] Each deny variant listed above is covered by a rule, or the handoff says why the matcher cannot express it.
- [ ] The user has applied it, and `!npm run queue-admin ...` typed by the user in the main session still runs with the rules in place (queue/04 criterion 5).

## Comments

- **orchestrator, 2026-10-12:** split out of queue/07 on the user's ruling ("original scope only"). Same files as queue/07's patch, so it runs after queue/07 is applied. It may need the user's `queue-admin admit` once queue/08 turns the gate on.
