# 141: Steering approvals (106-C2): approval store and routes

**Type:** feature

**Priority:** P1

**Blocked by:** 140

**Status:** in-review

**Serves:** Den loop step 4 (A/D): the user approves or denies a held permission request.

Scope source: ADR 0016 (as amended in PR #157) and the split table in `.scratch/organism-infra/handoffs/106-architect.md`. Parent: 106.

## What to build

Approval store (minted ids, bound to agent, 10-minute expiry, 20 per agent cap); `GET`/`POST /approvals/:id` with GET-before-allow (409 otherwise); full-input serving; masking and bidi escaping (including `tool.summary` and notes); snapshot `approvals` and the `approval` change; deny on anything undecodable, on expiry, or on shutdown. The fake runtime emits permission requests.

## Acceptance criteria

- [ ] A fake-runtime test holds a permission request and answers it allow and deny.
- [ ] Allow without a prior GET returns 409.
- [ ] Expiry, the per-agent cap and shutdown each deny, tested.
- [ ] Secrets are masked and bidi characters escaped in served input, `tool.summary` and notes.

## Comments
- **developer, 2026-10-08:** Dev correction: full npm test on 4108cbf shows 2 failures of 2467 (names unknown; scout output at /tmp/claude-1000/npmtest.out lacks them). host-approvals 32/32 green. Rerun npm test 2>&1 | grep '^not ok' in the worktree and fix. Suspects: onChange signature, approvals in snapshot, Content-Type skipped for GET. Not a clean in-review.
