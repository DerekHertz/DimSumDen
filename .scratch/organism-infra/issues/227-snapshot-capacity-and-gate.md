# 227: Snapshot reports capacity and the dispatch gate stops depending on locks

**Type:** code

**Priority:** P1

**Status:** resolved

**Source:** architect

**Class:** product

**Origin:** added

**Blocked by:** 226

**Serves:** Den loop steps 3-4 (parent: 154).

Design is in ADR 0011 decision 3 (amended 2026-10-12) and ADR 0016 amendment 14.

## What to build
1. apps/bridge/snapshot.mjs: gate "dispatch" goes to frontier[0] whenever the frontier is non-empty; drop the anyLock condition.
2. The hub (apps/bridge/watch.mjs) adds a top-level capacity object to the snapshot it serves (GET /state and the SSE snapshot), built with capacity() from 226 using the host's live refs and the ticket holders. Additive key; schema stays 1.
3. The POST /requests rule is unchanged: dispatch-* still needs gate == "dispatch", now true for frontier[0] even while another ticket is locked.

## Acceptance criteria
- [ ] With one ticket locked and two ready, frontier[0] of the unlocked tickets has gate "dispatch" (it had none before).
- [ ] No other ticket gets a dispatch gate; merge gates are unchanged.
- [ ] GET /state and the SSE snapshot carry capacity with max, cap, load, live, room, refs; room falls to 0 at the max (tested with max 2 injected: two live agents, or one live agent plus one foreign lock). `refs` tells a live agent from a lock so the UI can show which slots are held by locks.
- [ ] Unknown keys stay ignorable: existing consumer tests pass.
- [ ] The ADR 0011 snapshot example gains the capacity key.

## Comments

- **orchestrator, 2026-10-12:** filed from the 154 architect handoff on the user's approval ("draft is fine"). Priority set to P1: the user's goal is several agents controlled from the interface today. The default max is 8 after 226.
- **orchestrator, 2026-10-12:** batch 226-227: 226 and 227 run as one relay (one tests branch tests/organism-infra-226-227-dispatch-capacity, one PR). User, 2026-10-12: finish the list; relay approved.
- **qa, 2026-10-12:** QA pass (light verify): 4445 pass, 0 fail, 0 skipped; no test changed; every criterion mapped; ADR 0011 example has capacity. See 227-qa-verify.md.
- **security, 2026-10-12:** Security pass (batch 226-227). No blocking findings. See 227-security.md and 226-security.md.
