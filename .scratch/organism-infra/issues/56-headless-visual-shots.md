# 56: npm run shot: headless screenshots and console log for visual review

**Type:** feature

**Priority:** P3

**What to build:** A command that builds the UI, starts the bridge, and saves Playwright screenshots (desktop and mobile widths, both themes) plus the browser console log, so a designer cell in WSL can review without browser tools. Deferred: visual checks cost tokens and the user does visual review for now.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Screenshots and console log written to a scratch dir; the command exits non-zero on console errors

## Comments

- **Created (orchestrator, 2026-09-29):** From the post-UI v0 retro (cause 1: 3 occurrences, 07-09). The user reviews visuals for now and keeps this fix on record for later.
- **Merged scope (orchestrator, 2026-09-29):** also covers the cloud designer-screenshot script from ci-cd/06. Cloud Chromium works through PW_CHROMIUM_PATH (ci-cd/05, PR 72).
