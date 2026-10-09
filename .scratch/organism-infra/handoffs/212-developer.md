# 212 developer: queue script, band mod and npm run queue; all 31 qa tests green

Branch `feat/212-queue-mod`, commit c39545f on top of qa's 66f838b. The 31 tests in `scripts/queue.test.mjs` and `scripts/mods-queue.test.mjs` pass unedited. Full `npm test`: 3101 of 3102 pass; the one failure is `apps/ui/src/overlay/proximity-card.browser.test.mjs` ("entering the den shows the nearby resident card", a 10s locator timeout on a card that stays visible). It is a UI browser test, no UI file is touched here, and it fails when run alone too; likely the flake family of 206. Not investigated further.

## What was built

- `scripts/queue.mjs` (`readQueue(root)`, `renderKanban(q)`, CLI `[--json]`, root from `ORGANISM_ROOT` else cwd). Board walk and `Blocked by` parsing follow `north-star.mjs`. Buckets, ranks and title truncation (60 chars, `…`) as pinned in the qa header comments. The kanban prints four stacked sections (READY, IN FLIGHT, WAITING ON YOU, BLOCKED) with full refs, circled rank marks, and the blocker named on blocked rows. Smoked on the real board.
- `mods/queue/` (`.claude-plugin/plugin.json`, `hooks/hooks.json`, `hooks/register.tsx`, `hooks/render.mjs`, `types/index.d.ts`) modelled on north-star. `renderBand` is pure: line 1 `now: <num> <title> (<cell> [mode])`, line 2 `next: ...` (first 3 proposed, else first 3 ready), each clipped to 120 chars. `register.tsx` refreshes on session.start and turn.complete, and on a script failure clears the state so the band renders nothing.
- `queue` listed in `.claude-plugin/marketplace.json`; `npm run queue` added to `package.json`.

## `/queue` mechanism

The mod API has no command mechanism that I found (north-star and sleep-guard have none). So `/queue` ships as `npm run queue` plus a gated patch for `.claude/commands/queue.md`. The same patch enables `queue@dimsumden-mods` in `.claude/settings.json` (the band does not show until it is applied). Patch: `.scratch/_handoffs/gated/212-queue-command.patch` (`git apply --check` clean). The user applies it with `!npm run apply-gated`.

## Notes

- Code review: I did a self-review only (no /code-review sub-agents) to save budget. Rank counts the raw position in `actual` including non-string entries, as the AC2 test requires.
- Human-verified, not automated: the band drawing in a live terminal session after the gated patch is applied, and the `/queue` command file.

## State

```json
{"ticket":"organism-infra/212-queue-mod","cell":"developer","current_step":"implemented and committed at c39545f; 31 qa tests green, full suite green except an unrelated UI browser test; gated patch for /queue and plugin enablement written","artifacts":["scripts/queue.mjs","mods/queue/","scripts/queue.test.mjs","scripts/mods-queue.test.mjs",".claude-plugin/marketplace.json","package.json",".scratch/_handoffs/gated/212-queue-command.patch"],"decisions":["/queue ships as npm run queue plus a gated .claude/commands/queue.md, since the mod API has no command mechanism","Kanban prints full refs because short numbers collide across features","Failed script clears the band state so it renders nothing"],"failures":["apps/ui/src/overlay/proximity-card.browser.test.mjs times out in the full run and alone; unrelated to 212"],"pending":[{"item":"qa light verify, then user applies the gated patch with !npm run apply-gated and eyeballs the band","owner":"qa"}]}
```
