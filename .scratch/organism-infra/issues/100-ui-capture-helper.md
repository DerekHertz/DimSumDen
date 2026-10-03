# 100: Shared UI capture helper for design reviews

**Type:** feature

**Priority:** P2

**Blocked by:** None

**Status:** parked

## What to build

Design reviews drive Playwright from ad-hoc scratchpad scripts. On the 07 review, headless Chromium screenshots timed out at 30s with the full 3D scene; the designer re-discovered a workaround (`lightenScene` with `frameDelayMs: 600`, 120s screenshot timeout) and the run cost 12 minutes and 145k tokens. Add one script (e.g. `npm run capture -- --url <path> --widths 1440,1280,1024,375 --themes light,dark [--reduced-motion]`) that starts or reuses the dev server, applies those settings, falls back to bundled Chromium when `chrome`/`msedge` channels are missing, and writes screenshots to a given output directory outside the repo. Point the designer genome's review mode at it (user-gated edit).

Files: `apps/ci-cd/` (capture script and test), `package.json` (script entry), `.claude/agents/designer.md` (user-gated).

## Acceptance criteria

- [ ] One command produces screenshots for each requested width × theme without timing out on the full scene (test with a stub page; manual run on the den recorded in the handoff)
- [ ] Missing browser channels fall back to bundled Chromium with a one-line note, not a failure (test)
- [ ] Output goes only to the given directory; nothing is written inside the repo (test)
- [ ] The designer genome edit is handed to the user as one apply command

## Comments
- **orchestrator, 2026-10-02:** From the 07 designer review environment issue; user chose "ticket a capture helper" (2026-10-02).
- **orchestrator, 2026-10-03:** Parked: pipeline work not blocking v1 and not a third repeat incident (refocus, docs/refocus/triage-2026-10-02.md)
