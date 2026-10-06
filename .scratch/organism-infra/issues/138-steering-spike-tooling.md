# 138: Steering spike tooling (106-A): S8, S4b, S6b, S3b in conformance.mjs

**Type:** feature

**Priority:** P1

**Blocked by:** none

**Status:** ready-for-agent

**Serves:** Den loop steps 3-4: the spike verdicts gate the adapter (142, 143).

Scope source: ADR 0016 (as amended in PR #157) and the split table in `.scratch/organism-infra/handoffs/106-architect.md`. Parent: 106.

## What to build

Extend `apps/bridge/cells/conformance.mjs` (and only it and `conformance.test.mjs`) with spikes S8, S4b, S6b and S3b as specified in ADR 0016 decision 7: ids accepted case-insensitively, pure evaluators, fixture scrub on save, `--repo`, `--s8-disable-flag/-env`, `--s3b-wait`. Fix the S3 allow phase to answer only Write, and make the evaluator report the nested `request.subtype` shape. The user runs the spikes afterwards with their own login.

## Acceptance criteria

- [ ] Each new spike's evaluator is a pure function with tests against a scripted fake `claude`.
- [ ] Saved fixtures are scrubbed (no home paths, no username).
- [ ] Leftover-process cleanup (`sleep 61` pids, worktree removal) is tested with the fake.
- [ ] S3 allow phase answers only Write; the evaluator reports the nested `request.subtype`.
- [ ] No real `claude` runs in `npm test`.

## Comments
