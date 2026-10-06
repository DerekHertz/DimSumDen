# 162: Context budget hook enforces the 80k stop in cells

**Type:** feature

**Priority:** P1

**Blocked by:** none

**Status:** ready-for-agent

**Serves:** Retro 2026-10-06: the organism-infra/119 context budget is wording only, and it failed 3 times on den-layout/02 (qa specify 110k, developer 106k, developer 89k), all while reading PR #162's large sources.

## What to build

A Claude Code hook that enforces the cell context budget with code instead of wording. Before each tool call in a cell session it reads the cell's own context (`scripts/context.mjs --self`, or its library). At 70k it lets the call through and injects a warning to checkpoint. At 80k it refuses every call except the ones needed to wrap up: `git add`/`git commit` on the branch, `npm run board -- handoff|release|comment`, `node scripts/context.mjs`, and writes under `.scratch/`. The refusal message says what to do: WIP commit, handoff, release, `outcome: partial`.

The hook logic lives in a tested script under `scripts/`. The hook registration in `.claude/settings.json` is user-gated: the developer writes the exact edit into its handoff, and the user applies it (see the orchestrator genome on `.claude/` tickets). It must not affect the orchestrator main session, which has its own gate in `cell-start`.

## Acceptance criteria

- [ ] Under 70k the hook allows every call silently (test)
- [ ] From 70k to under 80k it allows the call and returns a checkpoint warning (test)
- [ ] At 80k or more it refuses a Read, Grep or non-wrap-up Bash call, and allows the listed wrap-up calls (tests for each)
- [ ] A null context reading allows the call (test)
- [ ] It does not apply in the orchestrator session (test)
- [ ] The `.claude/settings.json` hook entry is in the developer handoff as an exact edit
- [ ] `npm test` passes

## Comments

- **orchestrator, 2026-10-06:** Filed from the pipeline retro (user yes, 2026-10-06). Code fix because the 119 wording already failed; incidents logged with tool `Read`.
- **orchestrator, 2026-10-06:** Retro: recurred on den-layout/04 (qa specify ended at 108k without a partial return). First in the infra queue, ahead of 145/147 (user, 2026-10-06).
- **qa, 2026-10-06:** qa specify done: tests committed on tests/162-context-budget-hook
- **orchestrator, 2026-10-06:** User 2026-10-06: at 80k+ the hook also allows Write/Edit under the session scratchpad dir (the handoff skill drafts there). Developer adds a test for it (and a test that a path escaping the scratchpad is still refused).
