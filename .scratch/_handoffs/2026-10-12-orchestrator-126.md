# Orchestrator handoff 126 (2026-10-12)

Written at the 80k context stop (reading: 86k) and at 5-hour usage 86% (resets 18:20 PDT). No cell is running. Continues handoff 125.

## Goal (user, 2026-10-12)
Several agents controlled from the Den, each run as a conversation, with the relay routed through the bridge. The user approved filing 229 and 230; the other parked items (queue/08, 107, retro items) are still not to be raised.

## Done this session
- **229 designed and accepted.** The architect wrote ADR 0022 (`docs/adr/0022-relay-through-the-bridge.md`) on branch `architect/229`. The user answered all seven "Decisions for the user" with option (a); the answers are recorded at the end of the ADR (commit 128d1ca). PR #241 is open, risk-check clean.
- **Slice 1 tickets filed**: organism-infra/231 (hop planner, pure), 232 (the host starts the planned hop, blocked by 231), 233 (den default role, UI ticket, blocked by 232).
- **230 designer spec signed off by the user**: `.scratch/organism-infra/handoffs/230-designer-spec.md`, mockups https://claude.ai/artifact/VMQNN9qN5w7DQpkasKfuxL. 230 is `ready-for-agent`. It has a bridge part (`says`, `intent` on approvals; `approvalId`, `note`, `answeredAt` on permission transcript entries; a `stop` transcript entry) and a client `stopAgent`.

## The user's answers on ADR 0022 (for dispatch)
1. Bridge code picks the routine hops; an orchestrator session wakes only at a stop.
2. Slice 1 is a click per hop; slice 2 adds a per-ticket "Run relay" switch.
3. A den-started code ticket starts with developer, test-first. The question was asked about den relays only: the terminal relay (qa specify first) is unchanged.
4. The ceilings table is accepted; it ships as slice 3, one reviewed ticket.
5. Board writes keep asking; 233's live check counts them.
6. The relay ends at ready-to-merge; PR and merge stay with the user or an orchestrator session.
7. Designer spec and product are never auto-advanced.

## Next
1. If PR #241 is not merged yet: merge on green (`gh pr merge 241 --merge`), `npm run board -- resolve organism-infra/229-relay-through-the-bridge --pr 241`, `jev.mjs advisory-outcome` (orchestrator architect, jev architect, user architect, bounced false), `worktree-gc`.
2. **230 qa specify** (propose to the user first, after the 18:20 PDT usage reset): `node scripts/dispatch-prompt.mjs --ticket organism-infra/230-den-stop-receipt-and-approval-reason --cell qa --mode specify --base <main sha> --branch tests/organism-infra-230-den-conversation`. Point qa at the spec's "Acceptance for qa" section and its split (bridge tests and UI tests). Then developer (`jev.mjs tier`), qa verify, the user's visual verdict (both themes, 375px, reduced motion), risk-check (expect a hit: it touches `apps/bridge/cells/`), PR.
3. **231** shares no files with 230 and can run beside it. 232 and 233 share `host.mjs`, `server.mjs` and `Cards.jsx` with 230: run them after 230 merges.
4. Slices 2 and 3 of ADR 0022 are named in the ADR and in `229-architect.md`; ticket them after slice 1 is in use.

## Known, not filed
- ADR 0022 proposes two `CONTEXT.md` terms (Relay hop, Relay stop). Not applied; the user decides.
- The first-hop rule differs between ADR 0019 decision 4 (developer test-first) and `CLAUDE.md` plus the orchestrator genome (qa specify first). The user settled it for den relays only.
- Items from handoff 125 still stand (security's two low notes on 228, `agent-os/03-target-project` in-review with no lock, the clear-stale-lock action).

## Left alone
- Worktree `agent-ad76281f4272745e6` holds the 107 tests branch (held by the user).
- `.scratch/_requests/requests.jsonl` is modified by the user's den test and left uncommitted.
