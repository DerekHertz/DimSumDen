```json
{"ticket": "organism-infra (Jev routing + batch A)", "cell": "orchestrator", "mode": "session",
 "current_step": "session end at ~80k of a 99.7k Cursor window; main at 4a012b7 (72 merged as PR 97); batch A developer running",
 "artifacts": ["https://github.com/DerekHertz/DimSumDen/pull/97", "/tmp/design-sweep.md", "/tmp/batchA-qa-specify.md"],
 "decisions": ["user: 72 usage >= 80% suppresses frontier wakes; wind-down items and Jev-labelled ambiguous comments still wake", "user: batching adopted (one relay per batch of same-area tickets); batch A = organism-infra 78, 66, 60, 32, 54, 81, 82", "user: new tickets 81 (board audit script, called from pipeline-retro) and 82 (batch relay rules)", "user: design sweep applied: ca/05, 11, 16, 19 resolved as superseded/merged; rewrite notes on ca/06, 08, 09; scope comments on den-scene-v1 01-06, 08, 09 (low-poly first, Long Cang in 02); new ca/20 resize fix", "user: keep the developer's npm test tablet prop (den 09)", "user: priority is infra first, frontend connection next (organism-infra/11 architect), low-poly scene skeleton only in a free slot", "Sonnet tier dispatches as Sonnet 5.5; Haiku is 4.5 only", "Cursor usage has no 5-hour reading; user reports Cursor % (44% at last reading)"],
 "failures": ["qa: release --verdict unknown flag, forced release (incident logged; batch A developer told to fix)", "Grep tool ignores worktree paths (recurring; cells use rg)", "context.mjs reads a stale session in Cursor; use the user's reading"],
 "pending": [
  {"item": "batch A: developer done, all 7 at in-review on feat/batchA-board-friction head f39c18c (1208/1208). User applies `node /tmp/batchA-claude-edits.mjs /home/dhertzell/dsd-batchA-dev` (8 edits, 4 files, commits). Then save npm test output, jev verify per ticket, qa verify (one pass for the batch), risk-check, one PR resolving all 7. Handoffs: handoffs/<NN>-developer.md", "owner": "orchestrator"},
  {"item": "board audit (81) flags in-review-without-lock, which is also the normal state while waiting for qa verify; decide whether to narrow it (e.g. only when no activity for N hours) as a batch A fix round or follow-up", "owner": "user"},
  {"item": "board audit finding: organism-infra/03 is blocked though its blockers 01 and 02 are resolved; it now waits on the architect's answer to 11", "owner": "orchestrator"},
  {"item": "79 route advisory-live: next single ticket; genome and ADR 0015 edits need user yes", "owner": "orchestrator"},
  {"item": "batch B after 79 (jev-report/jev.mjs): 68 criterion 2, 47, 70 Low, 80 Lows, 72 security Lows (ticketTextOf path normalize, sk-shaped test placeholder)", "owner": "orchestrator"},
  {"item": "batch C: 52 compound-Bash hook, 31 isolation guard (.claude settings gated)", "owner": "orchestrator"},
  {"item": "organism-infra/11 architect design question (daemon/UI/live cell channel), when a slot is free", "owner": "orchestrator"},
  {"item": "57 in-review with no lock: likely just waiting for review, not stuck; check its latest handoff for what it needs", "owner": "orchestrator"},
  {"item": "design follow-ups not filed: Levels 2-4 den re-skin session; role portrait re-render after den 09; fix stale zoom labels, stele text and cell words in docs/design/2026-09-29-scene-decisions.md on design/scene-decisions-0929", "owner": "designer"},
  {"item": "pipeline-retro not run this session (context budget); run it at next session start", "owner": "orchestrator"}]}
```

# Handoff: orchestrator session 13 (Cursor on WSL)

Merged 72 (PR 97). Started batching: batch A (78, 66, 60, 32, 54, 81, 82) has tests at f7be419 and a developer running in `/home/dhertzell/dsd-batchA-dev` on `feat/batchA-board-friction`. Next: finish batch A's relay, then 79, then batch B. Design sweep is on the board (see decisions). Cursor tips from session 12 still apply: detached worktree per cell under `/home/dhertzell/dsd-<NN>-<hop>`, handoff drafts under `/tmp`, handoff `--name` needs the `.md` suffix, `board claim <ref> <cell>` (positional cell), `board comment <ref> --as <cell> "text"`.
