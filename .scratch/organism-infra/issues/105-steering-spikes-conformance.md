# 105: Steering spikes S1 to S7 (`conformance.mjs`)

**Type:** research

**Priority:** P1

**Blocked by:** 90 (the steering code is written in the new vocabulary)

**Status:** ready-for-agent

**Design refs:** `docs/adr/0016-ui-steering-channel.md` decision 7

## What to build

Write the manual conformance script and run spikes S1 to S7 from ADR 0016 against a real `claude` with the owner's login: the stdin message shape, the permission request and response shapes, `--agent` under `-p`, mid-turn messages, and billing facts. Each is a go or no-go recorded in the ticket. The user (or a session with the login) runs it; a cell's sandbox cannot.

## Acceptance criteria

- [ ] `apps/bridge/cells/conformance.mjs` runs each spike and prints go or no-go with evidence
- [ ] Results for S1 to S7 are written into this ticket and ADR 0016's open questions are updated
- [ ] The billing question (separate credit or plan usage) is answered or still marked unconfirmed
- [ ] A go on S1 to S3 unblocks 106; S7 unblocks 107

## Comments

- **orchestrator, 2026-10-01:** Published from the crew-dashboard spec and ADR 0017 after the user approved the breakdown (user, 2026-10-01). Infra tickets first; frontend (P3) waits until the pipeline is where the user wants it.
