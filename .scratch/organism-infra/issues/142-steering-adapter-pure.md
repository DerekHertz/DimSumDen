# 142: Steering adapter, pure half (106-D1): argv, env, stream decode

**Type:** feature

**Priority:** P1

**Blocked by:** 138, 140 (and the user's S8/S4b/S6b results recorded on 138)

**Status:** in-review

**Serves:** Den loop steps 3-4: talks to real `claude` children.

Scope source: ADR 0016 (as amended in PR #157) and the split table in `.scratch/organism-infra/handoffs/106-architect.md`. Parent: 106.

## What to build

`claude-adapter.mjs` pure functions: fixed-template `buildClaudeArgs` (content follows S6b), env allowlist, `parseClaudeLine` (size caps, resync), `decodeControlRequest` and its encoder per ADR 0016 6.5 (only `can_use_tool`, ignore `permission_suggestions`, deny duplicate `request_id`), committed scrubbed fixtures from S1-S3 and the S8/S4b/S6b runs.

## Acceptance criteria

- [ ] A whole-argv equality test: the builder cannot produce any permission-broadening flag.
- [ ] `--setting-sources project,local`, `--strict-mcp-config` and the inline deny rule in `--settings` are present.
- [ ] Decoding is tested against the committed fixtures, including a duplicate `request_id` and a non-`can_use_tool` subtype.
- [ ] Committed fixtures contain no home paths or usernames.

## Comments
- **orchestrator, 2026-10-08:** ADR 0016 spike verdicts and amendment 5 merged (PR #185). Spikes round 2 were setup-invalid, but D1 (142) proceeds per the ADR; back to ready-for-agent for qa specify. 143 (D2) waits on a spike re-run.
