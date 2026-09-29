# 07: UI app shell: package, layout, live connection

**Type:** feature

**Priority:** P0

**What to build:** Create the `apps/ui` app per the 01 ADR: React + React Three Fiber, served by the bridge, desktop layout with the scene left and panel right, subscribed to `/events`. Any new dependency is a brain gate: propose it in the handoff before installing.

**Blocked by:** 01, 05

**Status:** resolved

- [ ] Page loads against a fixture bridge with no console errors (browser smoke)
- [ ] Snapshot updates re-render without reload (test)

## Comments

- **Created (orchestrator, 2026-09-29):** From `.scratch/dimsumden-ui-v0/spec.md`, breakdown approved by the user.
- **orchestrator, 2026-09-29:** Owner decision (orchestrator, 2026-09-29): the client reducer applyEvent (ADR 0011 decision 5) belongs to 07; 05 tests only the server event stream.
- **designer, 2026-09-29:** UI spec for 07-11 written: handoffs/07-designer-spec.md (layout, tokens, states, copy, a11y). 6 open visual questions listed there.
- **orchestrator, 2026-09-29:** User decisions 2026-09-29 on designer spec open questions (07-designer-spec.md): all six recommendations accepted: system font stacks (no Google Fonts), fixed camera, no confirm on Approve merge, one usage meter in 09 (11 drops its tile), panel-first keyboard order, fixed 440px panel.
- **qa, 2026-09-29:** QA pass: 492 tests green, qa tests unchanged, criteria mapped; smoke human-verified. See 07-qa-verify.md
- **designer, 2026-09-29:** Design bounce: layout, landmarks, a11y structure pass; styles.css token values and type scale off-spec (qi green not teal, focus-ring blue, headings 24px/700, pill 14px/400). Real values in handoffs/07-designer-review.md. CSS-only fix.
- **designer, 2026-09-29:** Design bounce: token values and type scale
- **orchestrator, 2026-09-29:** Designer review bounce (recorded by orchestrator; board refuses designer verdicts): colour tokens, title/small/body type scale off-spec in apps/ui/src/styles.css. See handoffs/07-designer-review.md.
- **orchestrator, 2026-09-29:** designer bounce; fix round
- **designer, 2026-09-29:** PASS Design pass (re-review): all 5 token/type findings fixed at 1476012. See handoffs/07-designer-rereview.md
- **security, 2026-09-29:** Security pass. Deps match the approved set, lockfile clean, audit 0, gitleaks clean, traversal probes all blocked, no untrusted text reaches the DOM. 3 low notes (symlink follow in uiDir, vite fs.allow repo root in dev, no CSP). See handoffs/07-security.md.
