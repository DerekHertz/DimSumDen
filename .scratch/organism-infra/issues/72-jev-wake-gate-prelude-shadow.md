# 72: S4: Wake-up gate prelude, shadow

**Type:** feature

**Priority:** P2

**What to build:** A session-start prelude script for the orchestrator that decides every code-decidable wake condition itself and calls Jev's `wake` point only for ambiguous new inputs (ADR 0015 decision 6). Held until security (67) rules on sending comment and gate-request text.

Source: `.scratch/organism-infra/spec.md`, ADR 0015.

**Blocked by:** 67, 71, 77

**Status:** ready-for-agent

- [ ] A session-start prelude script decides every code-decidable condition without calling Jev (frontier non-empty, usage under 80%, CI red or merge conflict, open user-verdict gate request).
- [ ] Code, not Jev, wakes on any user-authored comment, any `Scope added` comment and any `--verdict` comment (ADR 0015 decision 6).
- [ ] Only ambiguous new inputs call Jev; labels `needs-claude | informational | other`; `other` and any failure wake the orchestrator.
- [ ] Shadow logs the label and whether the orchestrator then acted; no daemon, no timer.
- [ ] The wake go-live bar (ADR 0015 decision 6, now accepted) is encoded in `jev-report.mjs` as pass/fail lines.
- [ ] Input sent is exactly what ticket 67 allowed.

## Comments
- **orchestrator, 2026-09-30:** Now blocked by 77 per 67's security verdict.
