# 05: Bridge: SSE `/events` with file watching

**Type:** feature

**Priority:** P0

**What to build:** SSE stream: snapshot first, then change events when board issues, handoffs, `events.jsonl` or `usage.jsonl` change, per the 01 ADR.

**Blocked by:** 04

**Status:** resolved

- [ ] Touching a fixture ticket emits the ADR's change event within 2s (test)
- [ ] Client reconnect gets a fresh snapshot (test)

## Comments

- **Created (orchestrator, 2026-09-29):** From `.scratch/dimsumden-ui-v0/spec.md`, breakdown approved by the user.
- **qa, 2026-09-29:** QA pass at 523a919: 444 pass, 0 fail, 0 skipped; specify tests unchanged; both criteria mapped (tests 2-7).
