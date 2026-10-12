# Orchestrator handoff 116 (2026-10-12)

End-of-session handoff. queue/03 and queue/06 resolved in this session, so the next ticket starts in a fresh one. Replaces the mid-flight handoff 115.

## State
- **queue/06-retire-old-order: resolved.** PR #234 merged on green CI under relay autonomy. Relay: qa specify → developer (sonnet) → qa light verify (haiku, pass) → risk-check (3 hits) → full security (pass) → PR. No bounce. Advisory-outcome row logged.
  - `node scripts/jev.mjs order` now exits 2. The orchestrator genome still calls it in loop step 5 until queue/07 changes the genome: skip that call and log nothing.
  - Security low, not fixed: in `docs/agents/issue-tracker.md` the Claim bullet is glued onto the end of the Frontier line (a missing newline after "by waiting."). Fold it into queue/07, which edits docs and genomes.
- **queue/03-admission-gate: resolved.** PR #235 merged on green CI under relay autonomy, after the branch was updated onto `main` with queue/06 in it and CI ran again on the combined code. Relay: qa specify → developer (sonnet) → qa light verify (haiku; first run no verdict on a scope question, second pass) → risk-check (4 hits) → full security (pass) → PR. No bounce. Advisory-outcome row logged.
  - **User ruling (2026-10-12):** `createTicket` is the accepted write surface; no `board create` CLI subcommand.
  - Security lows, no ticket filed: a `finding:<ref>` Serves line passes by naming any existing ticket, itself included; "same cause" is approximated by "same tool" in the three-incidents rule.
- **PR #233 open, CI green, waiting on the user's yes to merge:** branch `fix/grep-tool-fallback` (worktree `.claude/worktrees/grep-fallback`). Text only: `organism-protocol` skill, `docs/agents/cell-start.md` and the architect genome tell a cell to use `grep -rn` and `find` through Bash when its tool list has no Grep or Glob. The user asked the orchestrator to make this fix directly (2026-10-12) after two qa cells lost a call each. Genome `tools:` lines are unchanged (`scripts/herald-genome.test.mjs` pins herald's).
- `main` is at 29f215d plus this session's board commit.
- No locks held. No cells running. Draft PR #183 untouched.

## For the user, raised but not ruled on
- The real `board gate` dry run refuses all 18 ready tickets (none has a machine-form Serves line), and 0 of 10 ready organism-infra tickets pass the three-incidents rule. Nothing is parked until `--apply` in queue/08, but the backfill there is larger than planned.
- The three-incidents rule is loose: the tool `other` holds 122 of 482 incident rows. Decide whether to tighten it before queue/08. Security raised the same point.
- Developer calls not overruled, now on `main`: the gate checks every ready ticket, blocked or not; `class` and `origin` stay optional on `createTicket`; in `scripts/queue.mjs` a ready ticket that `buildQueue` does not order is ranked after the ordered ones.
- Both qa verify cells noted that light verify step 1 in the qa genome says "run npm test" while the dispatch line says to use the saved run. They followed the dispatch (organism-infra/198 intends that). The genome line could be trimmed.

## Retro (window from 16:11 UTC)
- 3 incidents (Grep tool missing; qa light verify no verdict on a scope question the orchestrator could have asked at the specify return; `dispatch-prompt` called without `--branch` for qa specify). 2 audit items, both carried from handoff 112 (agent-os/03 `in-review` with no lock; the orphan pending item on agent-os/11's qa-specify handoff).
- No cause reached a third repeat. One fix, at the user's direction: the Grep fallback text in PR #233.
- Tickets earlier retros filed: nothing to unpark; no cause in them happened again in this window.
- Watch item carried: `npm run smoke:ui passes on main` failed once in a full run and passed alone and in every later run. A second failure gets a ticket.
- qa writing a wrong test expectation stays at 2 (den-v1/04, queue/02); a third goes to the user.

## Housekeeping
- Worktrees: `worktree-gc` lists `agent-a041d73daa94751c0`, `agent-a49212a92620d50eb`, `agent-a8a511cce1c2504c6` and `agent-aaf39b7bc3252ecb2` as removable. `agent-a8f5fb2dac19a8434` (queue/03 developer) is still marked locked by this session's agent process and should be removable once the session ends. `grep-fallback` stays until PR #233 merges.
- This session's shell cwd sat in `agent-aaf39b7bc3252ecb2`, so that worktree is removed last.

## Next
1. queue/04 (it needs full `security`; it touches `board.mjs` and `frontier-queue.mjs`, both free now).
2. Then queue/05 (after 03 and 04), 07, 08.
3. After queue/08: agent-os/03 as A / B / C, then agent-os/05, then triage of agent-os/06.
