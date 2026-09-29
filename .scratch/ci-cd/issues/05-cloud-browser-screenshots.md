# 05: Cloud browser: smoke:ui and designer screenshots on the preinstalled Chromium

**Type:** feature

**Priority:** P2

**What to build:** Cloud sessions have Chromium 1194 at `/opt/pw-browsers` but Playwright 1.63 looks for 1243, so `smoke:ui` and the browser tests fail and the designer can't see UI. Orchestrator probe (2026-09-29): launching `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` via `executablePath` with `--use-angle=swiftshader --enable-unsafe-swiftshader` works and WebGL2 is available.
1. `apps/ci-cd/smoke-ui.mjs` (and the browser tests' launcher) honours an env var naming a Chromium executable, adding the swiftshader flags; unchanged when unset.
2. A screenshot script: starts the UI dev server, opens the default camera, saves PNGs at desktop and mobile widths, both themes, reduced motion, into a given directory.
3. Designer genome (gated `.claude/` edit, user applies): in cloud, review mode uses the script when the browser pane tools are absent.

**Blocked by:** None

**Status:** ready-for-agent

- [ ] With the env var set in cloud, `npm test` has no browser-launch failures and `npm run smoke:ui` passes
- [ ] Without it, behaviour is unchanged (CI and WSL)
- [ ] Screenshot script produces the image set; documented in `docs/agents/cloud-sessions.md`
- [ ] Designer genome edit written as a diff for the user to apply

## Comments
- **Decision (user, 2026-09-29):** separate ticket; finish showcase-v1/07 first. Touches CI tooling, so security reviews.
