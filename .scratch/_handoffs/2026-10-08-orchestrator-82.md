# Orchestrator handoff 82 (2026-10-08)

## State
- **den-v1/06 (P1) in flight, `ready-for-human`.** Branch `feat/06-approve-deny` at `fc53171`, qa verify pass (handoffs 06-qa-verify.md). Design spec signed off and copied into the ticket.
  - **Next step (user approved):** dispatch one developer round on the branch (`--continue`, model from `jev.mjs tier`; it said sonnet). It adds a dev-only `?demo=approval` mode that seeds one pending approval through the stub bridge so the user can critique in `npm run ui` (http://localhost:4317). Must not collide with den-v1/09's demo mode, which disables A/D. Then qa light verify (save `npm test` to `/tmp/06-tests.txt`, pass `--tests`), then the user's visual critique, any one fix round, risk-check, PR.
  - Open for security / risk-check: `bridge-client.test.mjs:19` builds a fake token at runtime to pass `root-secret-scan`. qa flagged it; decide at risk-check whether that's acceptable.
  - For the critique: the spec's `alarm-zone` token doesn't exist; the banner uses `--surface-200` + `--alarm`.
  - Advisory log owed at resolve: route pick orchestrator `designer`, Jev `qa-specify`, user `designer`, bounced false.
- **Worktrees:** qa-specify (`agent-a33f…`, 23f45be) and dev round 1 (`agent-a465…`, 030fc10) are detached and clean; clear them with worktree-gc after the merge. Dev round 2 (`agent-a782…`, fc53171) is detached and clean; `~/den-06` is a symlink to it (has node_modules). Remove the symlink after the merge.
- **New tickets:** organism-infra/206 (P3, standalone browser test hang; until fixed, run browser tests via `npm test`) and organism-infra/207 (P2, dispatch-prompt prints the qa verify mode; second Haiku light-verify-ran-full incident).
- **Incidents logged:** Write `\u` escapes, worktree guard refusing heredoc scripts (twice), developer `git stash`, browser test hang, verify-mode misread.
- **qa specify ran at 101k and developer round 1 hit 116k (partial):** UI tickets are heavy for cells; check at the next retro.
- **Gated patches still pending, user said "later":** `136-jev-go-live-genome.patch`, `198-orchestrator-genome.patch` in `.scratch/_handoffs/gated/`. Ask when 06 resolves.
- **User preference:** commands for the user to paste stay under ~70 chars (memory saved).

## Next
1. Dispatch the den-v1/06 demo-fixture developer round (above).
2. After merge: `board resolve`, advisory-outcome row, worktree-gc, `pipeline-retro` (due), then a fresh session per ticket: den-v1/07 next, then 09.
