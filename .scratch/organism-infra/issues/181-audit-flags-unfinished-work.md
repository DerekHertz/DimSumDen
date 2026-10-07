# 181: `board audit` flags pushed work the board doesn't know about, and session start shows it

**Type:** task

**Priority:** P2

**Blocked by:** None (can start immediately)

**Status:** parked

**Serves:** Picking up where the last session stopped. On 2026-10-07, batch D's developer pushed `10ccc9a` to `feat/batch-d-126-177` and the session ended: no claim, no handoff, no board event, and both tickets still read `ready-for-agent`. Nothing on the board showed the work existed; the user had to ask "where did we leave off" and a session found it by comparing branches with `events.jsonl` by hand. This gets worse when sessions run on more than one machine (WSL, MacBook, cloud), and it applies to all of them.

## What to build

A new finding kind, `unfinished`, in `apps/organism-infra/board-audit.mjs`. It stays read-only, like the rest of `board audit`.

- For each remote branch (`refs/remotes/origin/*`, not `main` or `HEAD`) that is not merged into `origin/main`, find the tickets it serves. Use the same matching `lockBacked` uses (ticket slug, `<feature>-<NN>`, `(^|/)<NN>-`), plus each number in a batch name such as `feat/batch-d-126-177`. A bare number that matches tickets in more than one feature is ambiguous: report the branch once with the candidates, and don't guess.
- Flag a matched ticket as `unfinished` when its branch tip's commit time is later than the ticket's last board event (the same `lastEvents` timestamps `stale` uses), and no handoff on that ticket was written after the tip commit. The detail names the branch, the short SHA, the commit time and the last board event.
- Skip resolved tickets whose PR is merged, and skip branches whose tip is already in `origin/main`.
- Read local refs only; the audit does not fetch. When git or `origin` is unavailable, emit no `unfinished` findings, the same way the `no-branch` check degrades today.

Then add `unfinished` findings to `scripts/session-start.mjs`'s orchestrator pickup, under its existing cap and degrade-to-"unknown" rules. Before auditing, it runs one bounded `git fetch origin --prune` (short timeout, failure ignored), so a session on one machine sees what another machine pushed.

Files: `apps/organism-infra/board-audit.mjs`, `scripts/session-start.mjs`, and their tests. Use the git fixtures already in the audit and session-start tests; no network.

## Acceptance criteria

- [ ] A branch whose tip is newer than its ticket's last event, with no later handoff, is reported as `unfinished` with branch, SHA and both times (test)
- [ ] A batch branch name (`feat/batch-x-126-177`) reports each matched ticket (test)
- [ ] The same branch with a handoff written after the tip is not reported; nor is a branch whose tip is in `origin/main` (tests)
- [ ] A number shared by two features is reported once as ambiguous, with both candidates (test)
- [ ] Without git or an `origin` remote, the audit still runs and emits no `unfinished` findings (test)
- [ ] The orchestrator session-start output lists `unfinished` findings within the 1600-char cap. A failed or timed-out fetch doesn't block the hook or change its exit code (tests)
- [ ] Existing `board audit` and session-start tests still pass

## Comments

- **main session, 2026-10-07:** Filed at the user's request after the batch D developer push was found without a board trace. The user chose this over setting up cloud sessions for now. Cloud would make sessions visible but would not catch a session that ends mid-relay.
- **orchestrator, 2026-10-07:** Parked: User 2026-10-07: north star first (den v1 loop). Pipeline work waits; unpark after den-v1/07 or on a 3rd repeat incident that blocks the relay.
