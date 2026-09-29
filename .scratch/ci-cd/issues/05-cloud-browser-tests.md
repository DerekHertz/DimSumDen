# 05: Browser tests pass in cloud on the preinstalled Chromium

**Type:** feature

**Priority:** P1

**What to build:** Cloud sessions have Chromium 1194 at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, but Playwright 1.63 looks for 1243, so 5 browser smoke tests always fail in cloud `npm test` (smoke --url x3, smoke:ui, smoke). Add an environment variable (for example `PW_CHROMIUM_PATH`) that `apps/ci-cd/smoke-ui.mjs` and the other browser launchers honour: set, it launches that executable with `--use-angle=swiftshader --enable-unsafe-swiftshader`; unset, behaviour is unchanged. Document the one line for the cloud environment setup in `docs/agents/cloud-sessions.md`.

**Blocked by:** None

**Status:** ready-for-agent

- [ ] With the variable set in cloud, `npm test` has no browser-launch failures
- [ ] Unset, launch options are unchanged (unit test on the launch-options builder)
- [ ] Setup line documented

## Comments
- **Probe (orchestrator, 2026-09-29):** Playwright 1.63 launched chromium-1194 by `executablePath` with the swiftshader flags, and WebGL2 was available.
- **Decision (user, 2026-09-29):** split the old 05; run this one first (renamed from 05a: the board needs two-digit ticket numbers).
