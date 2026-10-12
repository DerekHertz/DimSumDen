# 228: Den: Run any frontier ticket with a role choice, disabled when there is no room

**Type:** feature

**Priority:** P1

**Status:** in-review

**Source:** architect

**Class:** product

**Origin:** added

**Blocked by:** 227

**Serves:** Den loop steps 3-4: the user can reach every agent from the Den (parent: 154).

Design is in ADR 0016 amendment 14 (items 4 to 6). UI ticket: the designer specs it with the user (detailed spec plus mockups) before a developer builds, and the user does the visual verdict.

## What to build
1. A Run control on every frontier ticket in the ticket views the den already has (Needs you gate card, tally, kanban card where it fits). It calls POST /agents through createBridgeClient (new dispatch(ref, { role })), which today has no caller anywhere in the UI.
2. A role choice per ticket. Default from the ticket type (feature or bug: orchestrator; design-question: architect; spec work: product; UI or asset work: designer). Offer orchestrator and the non-relay roles; never developer, qa or security.
3. Enabled only while capacity.room > 0. The UI recomputes capacity between snapshots with the shared pure function from 226. When disabled, show why ("<load> of <max> running: <refs>"; max is 8 after 226).
4. Beside Run, show the other running refs (overlap is the user's call).
5. The Needs you dispatch prompt (gate dispatch) is hidden while room is 0.
6. Claimed locks are very visible (user ruling, 2026-10-12): the den always shows every ref holding a slot, and marks which are locks with no live agent, so the user or the orchestrator can clear a stale one.

## Acceptance criteria
- [ ] Run starts an agent for any frontier ticket, not only frontier[0]; the new agent shows up through the existing agent frames.
- [ ] The role menu never lists a relay-hop role; the default follows the ticket type table above.
- [ ] Run is disabled with a visible reason when room is 0, and re-enables when an agent ends, with no reload.
- [ ] Every ref holding a slot is visible without opening anything, and a lock with no live agent is told apart from a running agent.
- [ ] A 409 or 429 from the bridge shows the bridge's error text; nothing is retried automatically.
- [ ] The user has looked at it (visual verdict) before the ticket resolves.

## Comments

- **orchestrator, 2026-10-12:** filed from the 154 architect handoff on the user's approval ("draft is fine"). Priority set to P1: the user's goal is several agents controlled from the interface today. User ruling folded in: lock visibility (item 6). den-v1/15 overlaps: a den task ticket left `ready-for-agent` would get a Run control.
- **designer, 2026-10-12:** UI spec signed off by the user: full spec in .scratch/organism-infra/handoffs/228-designer-spec.md, mockups at https://claude.ai/artifact/BqPJ8iBVisEc9TLTiP9vN5. Rulings: Run and slot strip in the Stations card (all ready rows, scrolling); native role select beside Run; stale lock is shown and named, no Clear button (follow-up ticket needs a bridge route); Needs you dispatch prompt hidden at room 0.
- **qa, 2026-10-12:** QA pass (light verify + code read). Specify tests unchanged; suite 4487/0 fail/0 skipped. Notes for visual check in handoff 228-qa-verify.md.
- **orchestrator, 2026-10-12:** user visual verdict on the 228 build (both themes, 375px, reduced motion)
- **orchestrator, 2026-10-12:** User visual verdict 2026-10-12: pass ("it works!"). Two requests go to a new ticket after the merge, at the user's choice: default role = the first agent needed, and a finish event that wakes the orchestrator to route the next hop. risk-check: 2 hits (Cards.jsx, bridge-client-dispatch.test.mjs); security dispatched.
