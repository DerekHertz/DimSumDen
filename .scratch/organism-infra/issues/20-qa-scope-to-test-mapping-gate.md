# 20: qa gate: every Comments scope item maps to a named test

**Type:** task

**Priority:** P2

**What to build:** A small check script `qa` runs on itself at the end of `specify` mode, per ADR 0009 decision 2's ranked #4 rule. It reads a ticket's `## Comments` for "Scope added" bullets (organism-protocol already treats these as acceptance criteria) and the test file `qa` just wrote, and fails if a bullet has no matching test (by close paraphrase match or an explicit `// scope: <ticket>#<n>` comment near the relevant test). This is the mechanical form of the incident where three scope items (deadline after self-reclaim, EPERM/EBUSY retry, `NODE_ENV` gate on `organism-infra/12`) got no tests and no code, and `security` had to catch it downstream.

Override: a human marks a Comments bullet `(descoped)`, which the script skips.

**Blocked by:** None (can start immediately)

**Status:** parked

- [ ] Given a ticket with N "Scope added" bullets and a test file covering N-1 of them, the check names the uncovered bullet and fails (test)
- [ ] Given full coverage, the check passes (test)
- [ ] A bullet marked `(descoped)` in Comments is skipped, not counted as uncovered (test)
- [ ] The `qa` genome's `specify` step runs this check before reporting "done", and its report cites the check's result

## Comments

- **Created (architect, 2026-09-28):** Split from `organism-infra/15` per ADR 0009 decision 2. Evidence: `usage.jsonl` incident on `organism-infra/12`, 2026-09-28T06:05:00Z.
- **orchestrator, 2026-10-03:** Parked: pipeline work not blocking v1 and not a third repeat incident (refocus, docs/refocus/triage-2026-10-02.md)
