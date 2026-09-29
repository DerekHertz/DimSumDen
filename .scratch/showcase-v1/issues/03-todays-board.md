# 03: Today's board in the grove

**Type:** feature

**Priority:** P1

**What to build:** A pagoda-roofed slate board stands on the grass front right. It shows the three Dashboard charts small (reuse dashboard-model). Clicking it, or pressing Enter when focused, opens the existing Dashboard panel. Label "Today's board"; incidents read as "spills" on the board face only.

**Blocked by:** 01

**Status:** in-review

- [ ] Board is a clickable, keyboard-reachable object with an accessible name
- [ ] Opening it shows the existing Dashboard with its hidden data tables
- [ ] smoke:ui passes

## Comments
- **Showcase sprint (user, 2026-09-29):** ship a demoable v1 tonight. Relay is developer then qa verify; risk-check decides security. Mockups: https://claude.ai/artifact/LQjpimx1jfX5bjZEoTo3za
- **qa, 2026-09-29:** QA pass on unit tests and build. Needs user eye: click and Enter open the Dashboard with tables. smoke:ui not run here.
- **security, 2026-09-29:** Security pass. Risk-check hits are the word board only. BoardFace.jsx draws metrics via canvas fillText, no innerHTML; metrics-state.js is a GET /metrics fetch, no new endpoint. No findings.
- **User browser check (2026-09-29):** npm test 760/760 and smoke:ui pass locally. Fix round: board click scrolls the page away; move Today's board next to Bao; bell floats above head; orchestrator missing from crown (always show); black platforms to wood; label the cub basket.
