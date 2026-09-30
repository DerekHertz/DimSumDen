# 71: S3: Priority flagging and scope ranking, shadow

**Type:** feature

**Priority:** P2

**What to build:** Add `priority` (mismatch flags only) and `scope` points to `jev.mjs` in shadow (ADR 0015 decision 4). Ordered after 69/70 because they share `jev.mjs` and `jev-report.mjs` (spec: no file overlap with S2).

Source: `.scratch/organism-infra/spec.md`, ADR 0015.

**Blocked by:** 69

**Status:** resolved

- [ ] Priority: a mismatch flag is emitted only where an explicit line exists and the content disagrees; the explicit line still orders the frontier (tested). No line fills in v1.
- [ ] Scope: labels `small | medium | large | other`; combined order computed in code (P-level, unblock count, scope, age); never crosses a P-level (tested); actual order logged beside the would-have-used order.
- [ ] `jev-report.mjs` computes terciles of weighted tokens, recomputed each run, excluding 0-baseline tickets, and reports flag verdict rate, same-tercile rate, and small-vs-large misses in the last 10.
- [ ] Go-live bars (flagging at least 70% over at least 10 flags; fills at least 80% over at least 20; scope at least 60% same-tercile over at least 20 tickets and no small-was-large in the last 10) are encoded in the report as pass/fail lines.

Note: If 70 is in flight when this is dispatched, sequence after it too (same files).

## Comments
- **developer, 2026-09-30:** Developer done at 987d10d: qa 47/47, npm test 1073/1073. Out of scope for orchestrator: orderRow is not yet called by anything that appends jev-order rows, and nothing writes jev-priority-verdict rows. See handoffs/71-developer.md.
- **qa, 2026-09-30:** QA pass. 1073/1073, 0 skipped. Specify tests unchanged (8bfcb8f→987d10d empty diff). All 4 ACs covered. Ruling: tercile edge is Math.round(n/3) (tests win over handoff comment). orderRow and jev-priority-verdict rows not required by any AC in this ticket. No out-of-scope files. Details: handoffs/71-qa-verify.md.
- **security, 2026-09-30:** Security pass. Gitleaks: clean (2 commits, 42 KB). 4 risk-check hits all low/false-positive. (1) jev-order.test.mjs:65 — spawnSync(process.execPath, hardcoded args) in test only; no user input, no shell expansion. (2) jev-priority.test.mjs:139 — split PEM string tests blocked-input guard; correct security testing practice. (3) jev-scope.test.mjs:102 — same. (4) jev.mjs rankFrontier matched board/lock pattern; pure sort, no I/O. Core checks: priority and scope route only ticketText through INPUTS[point] and hasSecret (jev.mjs:128-129,241); cap enforced (no reservation, --.35 shared pool, --.50 total CAP at line 247); shadow enforced (closedSet deletes pick/conf at line 230, default mode=shadow at line 362). No new dependencies. No path traversal, shell injection, or network exposure.
