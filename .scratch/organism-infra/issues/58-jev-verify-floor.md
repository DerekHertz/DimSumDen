# 58: jev.mjs verify floors to full when qa never ran specify

**Type:** feature

**Priority:** P0

**What to build:** In live mode, `node scripts/jev.mjs verify` picked `light` (conf 0.71) for dimsumden-ui-v0/15, which had no qa specify hop. The orchestrator genome allows light verify only when qa ran specify. Make the script apply `minimum = full` when no `<NN>-qa-specify*.md` handoff exists for the ticket, and log the floor in the jev row.

**Blocked by:** none

**Status:** in-review

- [ ] No qa-specify handoff: `effective` is `full` whatever Jev picks, in shadow and live
- [ ] With a qa-specify handoff: current behaviour unchanged
- [ ] The jev row records that the floor applied

## Comments

- **Created (orchestrator, 2026-09-29):** Retro fix; incident 2026-09-29T17:04:35Z.
- **orchestrator, 2026-09-29:** Raised to P0; it gates verify going live (43 decision). Runs in parallel with 51.
- **qa, 2026-09-29:** QA pass (light). Specify tests untouched; all criteria mapped; only smoke:ui fails, environmental (google fonts cert via proxy), not this branch.
- **security, 2026-09-29:** Security pass. No critical/high. Low: scripts/jev-floor.test.mjs:113 temp dirs not cleaned up. Spawn at :130 is benign (no shell, fixed argv). New handoffs readdir at scripts/jev.mjs:175 cannot traverse. gitleaks missing, pattern grep clean. See handoffs/58-security.md.
