# 71: S3: Priority flagging and scope ranking, shadow

**Type:** feature

**Priority:** P2

**What to build:** Add `priority` (mismatch flags only) and `scope` points to `jev.mjs` in shadow (ADR 0015 decision 4). Ordered after 69/70 because they share `jev.mjs` and `jev-report.mjs` (spec: no file overlap with S2).

Source: `.scratch/organism-infra/spec.md`, ADR 0015.

**Blocked by:** 69

**Status:** ready-for-agent

- [ ] Priority: a mismatch flag is emitted only where an explicit line exists and the content disagrees; the explicit line still orders the frontier (tested). No line fills in v1.
- [ ] Scope: labels `small | medium | large | other`; combined order computed in code (P-level, unblock count, scope, age); never crosses a P-level (tested); actual order logged beside the would-have-used order.
- [ ] `jev-report.mjs` computes terciles of weighted tokens, recomputed each run, excluding 0-baseline tickets, and reports flag verdict rate, same-tercile rate, and small-vs-large misses in the last 10.
- [ ] Go-live bars (flagging at least 70% over at least 10 flags; fills at least 80% over at least 20; scope at least 60% same-tercile over at least 20 tickets and no small-was-large in the last 10) are encoded in the report as pass/fail lines.

Note: If 70 is in flight when this is dispatched, sequence after it too (same files).

## Comments
