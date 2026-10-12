# 154 architect: any frontier ticket may be dispatched from the den, under one shared capacity rule

```json
{
  "ticket": "organism-infra/154-ui-dispatch-every-agent",
  "cell": "architect",
  "current_step": "Design done and recorded as ADR 0011 decision 3 (amended) and ADR 0016 amendment 14, committed 1e4c73d on architect/154-ui-dispatch-every-agent (base 33fdd08). AC 1 met. AC 2 not met: this cell may not write into the main checkout and the board has no create command, so three implementation tickets are drafted below for the orchestrator to file. Released at in-review.",
  "artifacts": [
    "docs/adr/0016-ui-steering-channel.md (architect/154-ui-dispatch-every-agent @ 1e4c73d)",
    "docs/adr/0011-ui-v0-seams-bridge-snapshot-scene.md (same commit)"
  ],
  "decisions": [
    "Eligibility to dispatch is membership of the snapshot frontier (ready, unblocked, unlocked, no live agent), not gate == dispatch. The user may start any frontier ticket; priority order is advice.",
    "The dispatch gate stays on frontier[0] only, and the 'no ticket holds a lock' condition is dropped. A gate on every frontier ticket would put one prompt per ticket in Needs you, and the gate still drives the orchestrator-facing dispatch-approve request.",
    "One pure capacity module (apps/bridge/cells/capacity.mjs): load = distinct refs that are live in the host or hold a board claim lock; room = max(0, min(max - load, cap - live)). The host and the snapshot use the same function, so Run buttons and the 429 cannot disagree. Foreign locks (terminal or desktop cells) count, so 'two cells at once' holds when the bridge is not the only starter.",
    "The host reads locks through an injected lockedRefs() before its synchronous step; an outside claim between read and reservation can overshoot by one, accepted because the board claim is atomic per ticket.",
    "The UI recomputes capacity between snapshots with the shared function; no new SSE frame type. The snapshot carries capacity (additive, schema 1).",
    "Role per ticket defaults from ticket type; relay-hop roles are never offered (route 409 stays). File overlap between two running tickets stays the user's call; per-agent worktrees (ADR 0016 amendment 7) make overlap a merge conflict, not a shared tree.",
    "Alternatives rejected: (a) gate on every frontier ticket (floods Needs you); (b) count locks only in the board-only snapshot (misses host agents in the claim window and the live count); (c) raise max_concurrent_cells (ADR 0002, Pro plan)."
  ],
  "failures": [],
  "pending": [
    {"item": "File tickets 226, 227, 228 from the drafts below (class product, origin added; they may need queue-admin admit if queue/08's gate is on). 226 blocked by 154, 227 by 226, 228 by 227.", "owner": "orchestrator"},
    {"item": "Resolve 154 once the tickets are filed and the user accepts the ADR amendments at merge of architect/154-ui-dispatch-every-agent (docs-only PR).", "owner": "orchestrator"},
    {"item": "228 is a UI ticket: designer specs it with the user before a developer builds; the user gives the visual verdict.", "owner": "designer"},
    {"item": "Conflict noted with den-v1/15: a den task ticket left ready-for-agent appears in the frontier and would get a Run control. 15 owns the status fix; 228 does not special-case it.", "owner": "orchestrator"}
  ]
}
```

## State

Branch `architect/154-ui-dispatch-every-agent`, one docs-only commit `1e4c73d` on 33fdd08; not pushed by me (release pushes the branch). No code, no tests run; ADR edits only. Facts the design rests on, all read in code: `snapshot.mjs` gives `gate: "dispatch"` to `frontier[0]` only when no ticket holds a lock; `host.mjs` `admit()` refuses with 409 unless that gate is set, then caps on `liveByRef.size`; `server.mjs` `checkGate` reads the gate from the hub snapshot; the hub merges host agents after the board snapshot is built, so the board-only builder cannot know live agents (hence `capacity` is added in the hub). The UI has no caller of `POST /agents` today: `bridge-client.mjs` has only `decide`, `sendMessage` and `startTask`, and the gate card sends a `dispatch-approve` request line. So 228 is new UI, not a widening.

## ADR conflicts surfaced

- ADR 0011 decision 3 (gate needs no lock; "widen later" in its rejected alternatives): amended in place, dated 2026-10-12.
- ADR 0016 decision 3 (precondition `gate == dispatch`; 409 and 429 table rows): amended in place as amendment 14.
- ADR 0002 and CLAUDE.md (cap of 2, non-overlapping files): cap kept and now counts foreign locks; the overlap rule cannot be checked by the route and is left to the user.
- CONTEXT.md's Frontier definition differs from ADR 0011's ordering; not touched here.

## Open for the user

Whether a stale lock from a dead holder should cost a slot (design says yes, with the refusal naming the ref so it can be reclaimed). If you would rather the cap ignore locks, 226 item 1 and the `lockedRefs` parameter drop out.

## Ticket drafts (orchestrator files these under `.scratch/organism-infra/issues/`)

### 226-dispatch-capacity-rule.md

```
# 226: Dispatch any frontier ticket within one shared capacity rule

**Type:** code
**Priority:** P2
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

## Acceptance criteria
- [ ] POST /agents for the second and third frontier ticket starts an agent while room > 0; the first ticket no longer has to hold the gate.
- [ ] With one agent live and one other ticket locked by a cell the bridge did not start, a dispatch gets 429 and the text names both refs; with two live host agents it gets 429.
- [ ] A host agent that has claimed its own ticket counts once, not twice.
- [ ] A ref outside the frontier gets 409 ("not in the frontier"); an unknown ref 404; a ref with a live agent 409; developer, qa and security on the route still 409.
- [ ] Two dispatches fired at one free slot start one agent (the existing atomicity test still passes).
- [ ] The 8-session cap still applies when a policy override raises max above it.
- [ ] capacity has table tests; the existing 409-for-no-gate tests are updated to the new rule.
```

### 227-snapshot-capacity-and-gate.md

```
# 227: Snapshot reports capacity and the dispatch gate stops depending on locks

**Type:** code
**Priority:** P2
**Status:** ready-for-agent
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
- [ ] GET /state and the SSE snapshot carry capacity with max, cap, load, live, room, refs; room falls to 0 with two live agents, or one live agent plus one foreign lock.
- [ ] Unknown keys stay ignorable: existing consumer tests pass.
- [ ] The ADR 0011 snapshot example gains the capacity key.
```

### 228-ui-run-any-frontier-ticket.md

```
# 228: Den: Run any frontier ticket with a role choice, disabled when there is no room

**Type:** feature
**Priority:** P2
**Status:** ready-for-agent
**Source:** architect
**Class:** product
**Origin:** added
**Blocked by:** 227
**Serves:** Den loop steps 3-4: the user can reach every agent from the Den (parent: 154).

Design is in ADR 0016 amendment 14 (items 4 to 6). UI ticket: the designer specs it with the user (detailed spec plus mockups) before a developer builds, and the user does the visual verdict.

## What to build
1. A Run control on every frontier ticket in the ticket views the den already has (Needs you gate card, tally, kanban card where it fits). It calls POST /agents through createBridgeClient (new dispatch(ref, { role })), which today has no caller anywhere in the UI.
2. A role choice per ticket. Default from the ticket type (feature or bug: orchestrator; design-question: architect; spec work: product; UI or asset work: designer). Offer orchestrator and the non-relay roles; never developer, qa or security.
3. Enabled only while capacity.room > 0. The UI recomputes capacity between snapshots with the shared pure function from 226. When disabled, show why ("2 of 2 running: <refs>").
4. Beside Run, show the other running refs (overlap is the user's call).
5. The Needs you dispatch prompt (gate dispatch) is hidden while room is 0.

## Acceptance criteria
- [ ] Run starts an agent for any frontier ticket, not only frontier[0]; the new agent shows up through the existing agent frames.
- [ ] The role menu never lists a relay-hop role; the default follows the ticket type table above.
- [ ] Run is disabled with a visible reason when room is 0, and re-enables when an agent ends, with no reload.
- [ ] A 409 or 429 from the bridge shows the bridge's error text; nothing is retried automatically.
- [ ] The user has looked at it (visual verdict) before the ticket resolves.
```

## Failed calls

- Write, `.scratch/organism-infra/issues/226-...md` (and 227, 228) in the main checkout: "This agent is isolated in the worktree ... Edit the worktree copy of this file instead of the shared-checkout path." Drafted the tickets in this handoff instead, since `board` has no create command (203 is unbuilt). Genuine guardrail; fixable friction in that an architect cannot file the tickets its own AC asks for.
- Bash, `cd <main checkout> && git log ...`: refused by the worktree isolation guard. Dropped the command; it was only a nicety. Genuine guardrail.
- `board help` / `board --help`: "unknown command". Read `board.mjs` instead. Fixable friction (ticket 179 covers it).
- Grep tool: not available in this session; used `grep` through Bash. Fixable friction (ticket 156).
