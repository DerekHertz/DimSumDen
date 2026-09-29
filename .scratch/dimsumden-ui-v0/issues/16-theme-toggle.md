# 16: Light/dark theme switch in the page

**Type:** feature

**Priority:** P3

**What to build:** The page follows `prefers-color-scheme` only. Add an in-page switch (system / light / dark) that sets `data-theme` on the root, remembered per viewer, and recolours the 3D scene without a remount.

**Blocked by:** none

**Status:** ready-for-agent

- [ ] Switch cycles system, light, dark; choice persists across reloads
- [ ] CSS tokens and scene materials follow the choice
- [ ] User visual verdict

## Comments

- **Created (orchestrator, 2026-09-29):** User asked why the page is dark; it follows the OS setting. User approved a switch ticket.
- **Designer follow-up (orchestrator, 2026-09-29):** The backdrop only follows prefers-color-scheme; when this switch lands, Backdrop.jsx must also watch data-theme (handoffs/14-designer-review.md).
