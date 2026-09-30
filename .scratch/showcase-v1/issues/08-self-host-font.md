# 08: Self-host the Long Cang font

**Type:** fix

**Priority:** P0

**What to build:** The UI loads Long Cang from Google Fonts (`apps/ui/index.html`, `apps/ui/src/styles.css`, `apps/ui/src/scene/TallyFace.jsx`). Offline or behind the cloud proxy that request fails, and `smoke:ui` "load" goes red. Bundle the font as a `.woff2` under `apps/ui` and load it with a local `@font-face`. The page must make no request to `fonts.googleapis.com` or `fonts.gstatic.com`. The font must look the same. Google Fonts is unreachable from the cloud container; `registry.npmjs.org` is reachable, so the woff2 can be taken from the `@fontsource/long-cang` tarball (`npm pack`) and committed as a file, not added as a dependency. Keep the OFL license file next to it.

**Blocked by:** None

**Status:** resolved

- [ ] No request to any Google Fonts host at page load (a test asserts it)
- [ ] Long Cang renders from the bundled woff2 wherever it rendered before (title, Tally face)
- [ ] OFL license committed beside the font; no new package dependency
- [ ] `npm run smoke:ui` passes fully in a cloud session with `PW_CHROMIUM_PATH` set

## Comments
- **Decision (user, 2026-09-30):** self-host the font; it's the last MVP fix, and Jev stays paused until smoke is green.
- **qa, 2026-09-30:** QA pass: 874/874, smoke:ui green, no Google Fonts refs, CSP change in scope. Detail: handoffs/08-qa-verify.md
