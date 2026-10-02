# 111: Desktop notification when a gate needs the user (batch M)

**Type:** feature

**Priority:** P1

**Blocked by:** 108

**Status:** ready-for-agent

## What to build

The user waits and asks ("show me the 07 screenshots when ready", 42fefd50); 29 of 238 recent messages are a bare "yes" to a gate they first had to notice. Add `scripts/notify.mjs` for `Notification` and `Stop` hooks: under WSL it raises a Windows toast via `powershell.exe` (fallback: terminal bell), for example "DimSumDen: PR #136 ready to merge (98)". On `Stop` it fires only when the board has a pending gate (merge proposal, `ready-for-human`, a question to the user) since the last notify, so ordinary turns stay quiet. Ship the settings change as a gated patch.

Files: `scripts/notify.mjs` (+ test); gated: `.claude/settings.json`.

## Acceptance criteria

- [ ] `Notification` events raise a toast with the event message
- [ ] `Stop` raises a toast only when a new gate is waiting; the same gate never notifies twice
- [ ] No WSL/powershell: falls back to a bell, exits 0
- [ ] No model call
- [ ] Settings patch in `.scratch/_handoffs/gated/`
- [ ] `npm test` green

## Comments
- **orchestrator, 2026-10-02:** Batch M, audit proposal 3. User: "yes notifs are good".
