# 73: S5: Jev find (blocked; may be dropped or re-scoped)

**Type:** feature

**Priority:** P3

**What to build:** `jev.mjs find --file <path> --ask "<need>"`. ADR 0015 decision 9 recommends NOT building this as specified: keep it blocked on the jg trial verdict (ADR 0014 decision 8), and if jg is go, drop it or re-scope it to in-file lookups only, judged on the decision 9 evidence. If jg is no-go, re-argue from scratch rather than unblocking automatically.

Source: `.scratch/organism-infra/spec.md`, ADR 0015.

**Blocked by:** jg trial verdict (ADR 0014 decision 8), then the ADR 0015 decision 9 evidence

**Status:** blocked

- [ ] `jev.mjs find --file <path> --ask "<need>"` returns exact line ranges chosen by code from Jev-selected chunk IDs; at most 255 options and about 64K tokens per call.
- [ ] Denied paths and secret-pattern chunks are never sent (dropped, tested); capped at $0.15 per day. Reuses the jg wrapper's denied-path list and secret rule (ADR 0015 decision 8).
- [ ] Low confidence or failure returns "no result".
- [ ] Shadow logs pointers versus what the cell read or grepped.

Note: Criteria are the spec's; re-check them against the re-scope decision before unblocking.

## Comments

- orchestrator, 2026-09-30: blocked at filing; unblock when: jg trial verdict (ADR 0014 decision 8), then the ADR 0015 decision 9 evidence.
