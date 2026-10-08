# 11: T wired to the live runtime

**Type:** feature

**Priority:** P1

**Blocked by:** organism-infra/107, den-v1/07

**Status:** ready-for-agent

**Serves:** Den loop steps 3-4 and user story 17 (I see that my message was received).

## What to build

Connect den-v1/07's T message box (built against a stub) to organism-infra/107's message route. A message sent to a running cell shows sent, then received when the real acknowledgement event arrives. When the runtime reports it cannot send (queued, cancelled or unsupported), the card greys T out with the runtime's reason.

## Acceptance criteria

- [ ] With the live runtime, a message reaches the running cell and the card shows sent, then received on the real acknowledgement (end-to-end test or recorded smoke).
- [ ] When the runtime cannot send, T is greyed out with the runtime's reason.
- [ ] Every request carries the bridge token (story 23).
- [ ] `npm test` is green.

## Comments
- **orchestrator, 2026-10-08:** Split from den-v1/07 on the user's yes: 07 builds the UI against a stub now; this ticket is the live wiring.
