# 224: dispatch-prompt derives the tests branch for qa specify

**Type:** code

**Priority:** P2

**Status:** ready-for-agent

**Source:** orchestrator

**Class:** pipeline

**Origin:** added

**Serves:** finding:queue/05-decay-pick-and-unplanned-cap (pipeline-retro 2026-10-12; four exit-2 retries since 2026-10-11)

## What to build

`node scripts/dispatch-prompt.mjs --cell qa --mode specify` exits 2 with "qa specify needs --branch <name>" when `--branch` is absent. The orchestrator has called it that way four times since 2026-10-11 (incident rows 2026-10-11T23:01, 2026-10-12T16:10, 2026-10-12T17:05, and once more on queue/05), each a wasted call and a retry.

When `--branch` is absent for qa `specify`, derive the branch as `tests/<feature>-<NN-slug>` from `--ticket` (for example `tests/queue-05-decay-pick-and-unplanned-cap`) and print the `cell-start` line with it. An explicit `--branch` still wins. Batches keep requiring `--branch`, because a batch has no single ticket to name it from.

## Acceptance criteria

- [ ] qa `specify` with no `--branch` and no `--batch` exits 0 and prints `--branch tests/<feature>-<NN-slug>` in the `cell-start` line.
- [ ] An explicit `--branch` is printed unchanged.
- [ ] qa `specify` with `--batch` and no `--branch` still exits 2 with the current message.
- [ ] The usage text in `scripts/dispatch-prompt.mjs` says the branch is derived when absent.

## Comments

- **orchestrator, 2026-10-12:** filed from pipeline-retro on the user's yes (third-repeat rule met: four incidents).
