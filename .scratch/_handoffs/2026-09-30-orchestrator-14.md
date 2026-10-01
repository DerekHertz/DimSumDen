```json
{"ticket": "organism-infra (batch A + 79)", "cell": "orchestrator", "mode": "session",
 "current_step": "session end at ~90k context, Cursor 66%; main at cf348ee; batch A merged as PR 98, 79 merged as PR 99",
 "artifacts": ["https://github.com/DerekHertz/DimSumDen/pull/98", "https://github.com/DerekHertz/DimSumDen/pull/99"],
 "decisions": ["user: Cursor sessions wrap up at 90% of the Cursor limit, not 80% (config row logged)", "user: orchestrator ends every relay-step reply with a Status block (in genome via PR 99)", "user: board-audit in-review staleness is follow-up ticket 83 (24h no activity)", "user: 79 shadow route report excludes advisory rows; bounces keep auto re-dispatch, showing and logging the route-bounce pick", "user: herald post about the Jev pipeline experience once advisory data exists (comment on 79)", "route is now advisory-live: at every new-ticket dispatch run `jev.mjs route --mode advisory`, show pick and conf, log the outcome with `jev.mjs advisory-outcome` (see genome step 6)"],
 "failures": ["orchestrator: ls|grep ticket lookup matched .lock files and hid release errors behind tail -1 (incident logged); use `ls issues/NN-*.md` and check exit codes", "worktree-gc.mjs does not see /home/dhertzell/dsd-* worktrees, only .claude/worktrees; merged dsd worktrees need manual removal with the user's yes", "reviewer cells dispatched with --detach have no claim, so security skipped board release; orchestrator claims to resolve"],
 "pending": [
  {"item": "remove merged worktree /home/dhertzell/dsd-79-dev and branch feat/79-route-advisory-live (local and remote) after the user's yes", "owner": "orchestrator"},
  {"item": "batch B (jev-report/jev.mjs): 68 criterion 2, 47, 70 Low, 80 Lows, 72 security Lows; first batch dispatched with advisory route", "owner": "orchestrator"},
  {"item": "batch C: 52 compound-Bash hook, 31 isolation guard (.claude settings gated)", "owner": "orchestrator"},
  {"item": "ticket 83 board-audit in-review staleness (P3)", "owner": "orchestrator"},
  {"item": "organism-infra/03 blocked though blockers resolved; waits on architect answer to 11", "owner": "orchestrator"},
  {"item": "organism-infra/11 architect design question, when a slot is free", "owner": "orchestrator"},
  {"item": "57 in-review with no lock: check its latest handoff", "owner": "orchestrator"},
  {"item": "herald post on Jev once 79 advisory rows exist from a few dispatches", "owner": "orchestrator"},
  {"item": "pipeline-retro not run again this session (carry: run at next session start; 8 tickets resolved since last run)", "owner": "orchestrator"},
  {"item": "design follow-ups from session 13 still unfiled (Levels 2-4 re-skin, portrait re-render, scene-decisions doc fixes)", "owner": "designer"}]}
```

# Handoff: orchestrator session 14 (Cursor on WSL)

Merged batch A (78, 66, 60, 32, 54, 81, 82) as PR 98 and 79 (route advisory-live) as PR 99. Filed 83. Next session: run pipeline-retro first, then batch B, the first dispatch where Jev's route pick shows at the gate. Shadow data so far: Jev picked light verify on all 8 tickets (0.62 to 0.72) and full verify found nothing; on 79's tier Jev picked opus (0.86) while sonnet shipped it with one scope-add fix round.
