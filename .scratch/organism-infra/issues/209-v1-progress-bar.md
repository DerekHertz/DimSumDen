# 209: Den v1 progress bar in the statusline and a band mod

**Type:** feature

**Priority:** P1

**Blocked by:** organism-infra/167 (both edit `scripts/statusline.mjs`)

**Status:** in-review

**Serves:** Drift guardrail from the refocus (ADR 0019): keep the v1 den loop in view. The user asked for a countdown to the north star (2026-10-08) and settled the choices below in a grilling the same day.

## Why

Progress toward den v1 is only visible by reading the board by hand. On 2026-10-08 the orchestrator left the P1 critical-path ticket 143 out of a proposed order because nothing surfaced it.

## What to build

1. A small module (for example `scripts/north-star.mjs`) that reads the board and returns den v1 progress:
   - **Ticket set (derived):** every ticket under `.scratch/den-v1/issues/`, plus every ticket those name in `Blocked by`, followed through the whole chain. It is recomputed from the board on every read, so new den-v1 tickets and blockers join on their own.
   - **Done:** `resolved` or `closed`. `parked` tickets drop out of the total.
   - **Output:** done count, total, remaining count, and the next critical-path ticket (the unblocked, not-done ticket in the set with the longest chain of not-done tickets depending on it; ties go to frontier order).
   - It reads only the board. It makes no network call and does not touch the usage API.
2. **Statusline segment** in `scripts/statusline.mjs`, for example `v1 ████░░ 8/12 · 7 to go`.
3. **Band mod** at `mods/north-star/`, packaged like `mods/sleep-guard` and listed in `.claude-plugin/marketplace.json`: a thin band such as `████████░░░░ v1 8/12 · next: 143`. Follow the `plugin-authoring` skill.
4. Enabling the plugin in `.claude/settings.json` is a gated edit: write the exact edit into the handoff for the user to apply (the developer can't edit `.claude/`).

Files: `scripts/north-star.mjs` (new), `scripts/statusline.mjs`, `mods/north-star/` (new), `.claude-plugin/marketplace.json`, and their tests. `.claude/settings.json` is a gated edit.

## Acceptance criteria

- [ ] The ticket set includes den-v1 tickets and their blockers, followed through the chain (test with a fixture board: a den-v1 ticket blocked by A, which is blocked by B, counts A and B)
- [ ] `resolved` and `closed` count as done, and `parked` drops out of the total (test)
- [ ] The next critical-path ticket is the unblocked, not-done ticket with the longest not-done chain depending on it (test)
- [ ] The statusline shows the v1 segment and makes no network call for it (test)
- [ ] The band mod renders the bar, the count and the next ticket from the same module (test on its render function)
- [ ] The marketplace lists the mod, and the handoff carries the exact `.claude/settings.json` edit to enable it
- [ ] Existing statusline tests still pass

## Comments
- **orchestrator, 2026-10-08:** User decisions: the countdown is to den v1 done; shown in the statusline and as a band mod (not the den UI); the ticket set is derived; resolved or closed counts as done; priority "do it now", so it goes first in the next session, after 167 merges. Mods draw only in terminal `claude` in WSL (not the desktop app in WSL).
- **orchestrator, 2026-10-08:** Environment: the plugin-authoring skill says ~/.claude/dev-mods/; the user ruled the repo convention mods/<name>/ (as sleep-guard) wins. Gated .claude/settings.json edit is pending; qa verify waits on it.
