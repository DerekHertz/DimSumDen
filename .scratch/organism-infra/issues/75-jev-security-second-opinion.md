# 75: S7: Security escalate-only second opinion (blocked)

**Type:** feature

**Priority:** P3

**What to build:** A Jev point that may escalate a risk-check-clean ticket to full `security`, never skip. Shadow-first; criteria written when it unblocks.

Source: `.scratch/organism-infra/spec.md`, ADR 0015.

**Blocked by:** at least 15 risk-check-clean tickets with shadow rows, and a security review of the label set

**Status:** blocked

- [ ] Unblock criteria met: at least 15 risk-check-clean tickets have shadow rows; security has reviewed the label set.
- [ ] Acceptance criteria written and approved before dispatch; escalate only, never skip; ships shadow-first.

## Comments

- orchestrator, 2026-09-30: blocked at filing; unblock when: at least 15 risk-check-clean tickets with shadow rows, and a security review of the label set.
