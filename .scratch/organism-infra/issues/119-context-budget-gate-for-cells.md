# 119: Context budget enforced by script, for the orchestrator and every cell

**Type:** feature

**Priority:** P1

**Blocked by:** None

**Status:** ready-for-agent

## What to build

The 80k context rule depends on whoever is running remembering `node scripts/context.mjs`, and it gets skipped: on 2026-10-02 the orchestrator logged one reading all session (149k) and was asked to compact at ~130k. Cells have no budget at all: developers have ended at 200–300k tokens, and every call re-reads the whole context.

Make the scripts enforce it:

1. **Orchestrator gate in `scripts/cell-start.mjs`.** A cell runs `cell-start` inside its own worktree, but shares the orchestrator's `CLAUDE_CODE_SESSION_ID`, so `context.mjs` there reads the orchestrator's top-level transcript. Use that: at 70k or more, print a warning that the orchestrator should start no new tickets; at 80k or more, refuse with exit 1 and `orchestrator context <n>k ≥ 80k: write the session handoff and ask the user to /compact`, unless `--force` is passed. Fix rounds and later hops of a ticket already in flight pass `--continue` and get the warning, not the refusal (the relay in flight must finish).
2. **Cell self-check.** Add `node scripts/context.mjs --self`: reads the calling subagent's transcript under `<session>/subagents/agent-*.jsonl`, chosen by the transcript whose `cwd` matches the current worktree (two cells can run at once, so never "newest file"). Prints the same JSON shape plus `"scope":"self"`. If no match, `context_tokens: null`, exit 0.
3. **Cells follow the rule.** `organism-protocol` (gated patch) tells every cell to run `context.mjs --self` at each stage boundary (e.g. tests written, tests green, before review, before commit). At 70k: finish the current stage, no new exploration. At 80k: commit work in progress on the branch, publish a handoff that says exactly what's done and what's left, release, and return `outcome: partial`. The orchestrator then dispatches a fresh cell of the same type on the same branch with that handoff (counts as the same round, not a bounce).
4. **Measure it.** `log-cell.mjs` accepts `--context <n>` (the cell's final self-reading) and the retro reports partial returns and median final cell context.

Files: `scripts/cell-start.mjs`, `scripts/context.mjs`, `scripts/log-cell.mjs` (+ tests); gated: `.claude/skills/organism-protocol/SKILL.md`, `.claude/agents/orchestrator.md` (one patch via `npm run apply-gated`; if 116's trim patch is pending, rebase onto it).

## Acceptance criteria

- [ ] `cell-start` warns at ≥70k and refuses at ≥80k orchestrator context (exit 1, message names `/compact`); `--force` and `--continue` behave as above; a null reading never blocks (test with fixture transcripts)
- [ ] `context.mjs --self` reads the subagent transcript whose `cwd` matches the worktree, ignores other concurrent cells' transcripts, and returns null when none matches (test)
- [ ] Existing `context.mjs` output without `--self` is unchanged
- [ ] Gated patch: organism-protocol stage-boundary checks with the 70k/80k actions and the `partial` return; orchestrator genome handles `partial` by re-dispatching a fresh cell with the handoff
- [ ] `log-cell.mjs --context` stored on the cell row; retro prints partial-return count and median final cell context
- [ ] `npm test` green

## Comments
- **orchestrator, 2026-10-02:** User yes 2026-10-02: "yes add it to cell-start … developers from yesterday spent up to 200-300k tokens … they should also follow the context window rule". Orchestrator side overlaps 99 (auto-compaction design); 99 still owns hooks, `/compact` triggers and the auto-written handoff, this ticket owns the hard stop. Before relying on the shared session id, the developer confirms it in a real subagent (print `CLAUDE_CODE_SESSION_ID` from a cell and compare) and records the result.
