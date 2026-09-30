# 76: S8: Compaction filtering (blocked)

**Type:** feature

**Priority:** P3

**What to build:** Jev filtering in the handoff/scout step only. Shadow-first; criteria written when it unblocks.

Source: `.scratch/organism-infra/spec.md`, ADR 0015.

**Blocked by:** security review of transcript exposure, and Jev shadow results on chunk selection: 73's if re-scoped, otherwise the jg trial verdict plus a shadow design reusing jg's chunks (ADR 0015 decision 10)

**Status:** blocked

- [ ] Unblock criteria met (both halves above).
- [ ] Acceptance criteria written and approved before dispatch; runs only in the handoff/scout step; ships shadow-first.

## Comments

- orchestrator, 2026-09-30: blocked at filing; unblock when: security review of transcript exposure, and Jev shadow results on chunk selection: 73's if re-scoped, otherwise the jg trial verdict plus a shadow design reusing jg's chunks (ADR 0015 decision 10).
