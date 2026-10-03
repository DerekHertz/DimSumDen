# 119: Context budget enforced by script, for the orchestrator and every cell

**Type:** feature

**Priority:** P1

**Blocked by:** None

**Status:** resolved

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
- **qa, 2026-10-02:** qa specify: 30 tests in 3 files on tests/119-context-budget-gate (9984524). Human-verified: gated patch criterion (read the patch) and npm test green (verify runs it). Map in handoff 119-qa-specify.md.
- **developer, 2026-10-02:** developer: shared session id confirmed in a real subagent: CLAUDE_CODE_SESSION_ID in the cell equals the orchestrator session id; context.mjs without --self returned the orchestrator reading (70k) and --self returned the cell's own transcript (73k), matched by cwd. Caveat: existing cell-start tests inherit the live session env, so with the orchestrator at 80k+ they would be refused; CI has no session id.
- **qa, 2026-10-02:** QA pass (light verify): npm test 1910 pass, 0 fail, 0 skipped; specify tests unchanged since 9984524; AC4 patch read, human-verified. See 119-qa-verify.md.
- **security, 2026-10-02:** Security pass @ c1c33dd. gitleaks clean, no dep/CI changes, no shell injection or path traversal reachable. 3 low findings (context.mjs:107 session id unchecked in path, context.mjs:72 full-file read, cell-start.mjs:37 advisory flags). See 119-security.md.
