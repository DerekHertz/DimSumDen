# 226: Dispatch any frontier ticket within one shared capacity rule

**Type:** code

**Priority:** P1

**Status:** ready-for-agent

**Source:** architect

**Class:** product

**Origin:** added

**Blocked by:** 154

**Serves:** Den loop steps 3-4: the user can start every agent the caps allow from the Den (parent: 154).

Design is in ADR 0016 decision 3, amendment 14 ("Who may be dispatched, and how many"). Read it first.

## What to build
1. apps/bridge/cells/capacity.mjs: a pure capacity({ liveRefs, lockedRefs, max, cap }) -> { max, cap, load, live, room, refs }. load counts distinct refs that are live in the host or hold a claim lock; room = max(0, min(max - load, cap - live)).
2. Host admission: createHost takes lockedRefs: () => Promise<string[]>, read in admit() beside the usage reading and before the synchronous step; the reservation uses capacity. All three entries (dispatch, start, direct) use it. The 429 text names the refs filling the slots.
3. Replace checkGate in apps/bridge/server.mjs with an eligibility check: the ref is in the snapshot's frontier (404 unknown, 409 "not in the frontier"). The gate == "dispatch" test goes. The relay-hop 409 stays.
4. The server passes lockedRefs from the hub snapshot's ticket holders.
5. Raise the default max from 2 to 8 (user ruling, 2026-10-12: "just raise it to max 8"): `MAX_CONCURRENT_AGENTS` in apps/bridge/cells/policy.mjs. Amend ADR 0002 and the "max 2" wording of ADR 0016 amendment 14 and ADR 0011 decision 3 to say 8. Do not edit `CLAUDE.md` or `.claude/`.

## Acceptance criteria
- [ ] POST /agents for the second and third frontier ticket starts an agent while room > 0; the first ticket no longer has to hold the gate.
- [ ] With one agent live and one other ticket locked by a cell the bridge did not start, a dispatch gets 429 and the text names both refs; with two live host agents it gets 429.
- [ ] A host agent that has claimed its own ticket counts once, not twice.
- [ ] A ref outside the frontier gets 409 ("not in the frontier"); an unknown ref 404; a ref with a live agent 409; developer, qa and security on the route still 409.
- [ ] Two dispatches fired at one free slot start one agent (the existing atomicity test still passes).
- [ ] The 8-session cap still applies when a policy override raises max above it.
- [ ] The default max is 8, and ADR 0002, ADR 0011 decision 3 and ADR 0016 amendment 14 say 8. Tests that need a full house inject a smaller max (the criteria above that say "two live" assume max 2 injected).
- [ ] capacity has table tests; the existing 409-for-no-gate tests are updated to the new rule.

## Comments

- **orchestrator, 2026-10-12:** filed from the 154 architect handoff on the user's approval ("draft is fine"). Priority set to P1: the user's goal is several agents controlled from the interface today. User rulings folded in: cap raised to 8 (item 5); a stale lock from a dead holder counts toward the cap, as designed.
