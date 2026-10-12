# 107: Steering slice 2: message and hand over

**Type:** feature

**Priority:** P1

**Class:** product

**Blocked by:** 106

**Status:** ready-for-agent

**Serves:** Den loop steps 3-4 (T: the agent receives a message from the card).

**Design refs:** `docs/adr/0016-ui-steering-channel.md` decision 7, slice 2

## What to build

Build ADR 0016 slice 2: `POST /cells/:id/message`, queued, acknowledged and applied reporting, cancel while queued, and the stop-then-resume hand-over. Wording follows spike S7.

## Acceptance criteria

- [ ] A message sent during a running turn is reported queued, then acknowledged, then applied (fake runtime)
- [ ] Cancel is accepted only while queued
- [ ] The resume string is shown, never run by the bridge

## Comments

- **orchestrator, 2026-10-01:** Published from the crew-dashboard spec and ADR 0017 after the user approved the breakdown (user, 2026-10-01). Infra tickets first; frontend (P3) waits until the pipeline is where the user wants it.
- **orchestrator, 2026-10-11:** 2026-10-10, plain session: den-v1/13 S5 (PR #214) built the message route (queued, then received). Still open here: cancel while queued, and the stop-then-resume hand-over.
- **orchestrator, 2026-10-12:** qa specify done (25 red tests, `tests/organism-infra-107-steering-slice-2` at 5c34b38, handoff `107-qa-specify.md`). **Held by the user** before the developer: today goes to multi-agent dispatch (154, drafts 226 to 228). qa flags: "acknowledged" is read as the 202 `{ messageId }` answer; the real Claude runtime has no cancel, so cancel answers 409 on a real agent until a spike says otherwise. Its worktree still holds the tests branch; detach it before the developer starts.
