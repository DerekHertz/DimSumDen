# 115: Classify every incident; retro reports cost per ticket kind

**Type:** feature

**Priority:** P2

**Blocked by:** None

**Status:** ready-for-agent

## What to build

The 66 incident rows in `.scratch/usage.jsonl` since 2026-10-01 have no `class`, so the retro can't say which kinds of friction are rising. And the batching question (do batches save tokens?) took a one-off script to answer: single PRs average ~243k tokens per ticket, batches ~169k, but UI batch #132 cost 1.2M for two tickets.

Make the incident logger require a `class` from a fixed list (e.g. `guardrail`, `environment`, `test-flake`, `spec-gap`, `tool-error`, `dispatch-prompt`, `other`) and reject rows without one. Extend the pipeline retro's data step to report, for its window: tokens per ticket by ticket kind (infra, UI/scene, asset, docs) and by batch vs single, bounces and extra developer rounds per PR, and incident counts by class.

Files: the incident logging script under `scripts/` (+ test), the retro data script (+ test); gated: `.claude/skills/pipeline-retro/SKILL.md` if its steps change (ship as a patch via `npm run apply-gated`).

## Acceptance criteria

- [ ] Logging an incident without a valid `class` fails with a message listing the allowed classes; existing rows still parse
- [ ] The retro data step prints tokens per ticket by kind and by batch vs single for its window
- [ ] It prints bounces and extra developer rounds per PR, and incidents by class (unclassified old rows counted as `unclassified`)
- [ ] When one incident class appears 3+ times in the window, the retro proposes a concrete skill, genome or dispatch-prompt change for it (gated edits as a patch for `npm run apply-gated`); the user approves or declines each
- [ ] `organism-protocol` (via 116's gated patch, or a patch here if 116 has shipped) tells cells to write multi-line scripts with the Write tool and run them as one plain command, instead of heredocs or chained commands the worktree guard refuses (~1 in 4 incidents since 2026-10-01)
- [ ] `npm test` green

## Comments
- **orchestrator, 2026-10-02:** Filed from the batch/throughput review, user yes 2026-10-02 ("ticket B"). Rules 1–2 (batch only same-kind infra, at most three; split tickets expected over ~300k) went into the orchestrator genome the same day; this ticket measures whether they work.
