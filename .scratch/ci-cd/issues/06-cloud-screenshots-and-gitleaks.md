# 06: Cloud screenshots for the designer, and gitleaks in cloud

**Type:** feature

**Priority:** P2

**What to build:** Cloud sessions have Chromium 1194 at `/opt/pw-browsers` but Playwright 1.63 looks for 1243, so `smoke:ui` and the browser tests fail and the designer can't see UI. Orchestrator probe (2026-09-29): launching `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` via `executablePath` with `--use-angle=swiftshader --enable-unsafe-swiftshader` works and WebGL2 is available.
1. (Moved to 05a.)
2. A screenshot script: starts the UI dev server, opens the default camera, saves PNGs at desktop and mobile widths, both themes, reduced motion, into a given directory.
3. Designer genome (gated `.claude/` edit, user applies): in cloud, review mode uses the script when the browser pane tools are absent.

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] With the env var set in cloud, `npm test` has no browser-launch failures and `npm run smoke:ui` passes
- [ ] Without it, behaviour is unchanged (CI and WSL)
- [ ] Screenshot script produces the image set; documented in `docs/agents/cloud-sessions.md`
- [ ] Designer genome edit written as a diff for the user to apply

## Comments
- **Decision (user, 2026-09-29):** separate ticket; finish showcase-v1/07 first. Touches CI tooling, so security reviews.
- **Retro (user-approved, 2026-09-29):** also install gitleaks in the cloud environment setup (missing twice; security fell back to grep).
- **Rescoped (orchestrator, 2026-09-29):** the screenshot part duplicates organism-infra/56 (headless visual shots) from the local board, so it moves there. This ticket keeps only installing gitleaks in the cloud environment.
