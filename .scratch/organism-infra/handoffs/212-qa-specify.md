# 212 qa specify: queue script, band mod and kanban tests written, red for the right reason

Branch `feat/212-queue-mod`, tests commit 66f838b (base 81f9763). Three files, all new:
`scripts/queue-fixture.mjs` (helper, not a test), `scripts/queue.test.mjs` (17 tests), `scripts/mods-queue.test.mjs` (14 tests). Run: `node --test scripts/queue.test.mjs scripts/mods-queue.test.mjs`. All 31 fail today: `scripts/queue.mjs`, `mods/queue/` and the `queue` npm script do not exist (module not found), not setup errors. Light verify applies (qa specified).

## Pinned interfaces (the header comment of each test file has the detail)

- `scripts/queue.mjs [--json]`, board root from `ORGANISM_ROOT` (tests run it from an unrelated cwd). JSON `{inFlight, ready, waitingOnUser, blocked, proposed}`. Row: `ref`, `title` (heading after `NN: `, max 60 chars, longer ones end in `…`), `priority` (number, missing Priority = 2). inFlight adds `cell` (lock's first token, null with no lock) and `mode` (lock's third token if specify/verify). A lock file or status claimed/in-review means in flight, so a qa-specify lock on a ready-for-agent ticket is in flight, not ready. blocked adds `blockedBy` (unresolved blocker refs, full refs; `[]` for plain status blocked). Resolved, closed and parked tickets appear nowhere.
- Ranks: latest `jev-order` row (last in the file; non-JSON lines and other kinds skipped). Ready rows get `rank` = 1-based position in `actual` (counting non-ready entries). `proposed` = `[{ref, title, rank}]` of the `actual` entries that are ready now, in list order. Missing file, missing/non-array `actual`: `proposed: []`, no `rank` keys, exit 0. Non-string entries in `actual` are skipped.
- Plain output: headings READY, IN FLIGHT, WAITING ON YOU, BLOCKED in that order, always printed; ranked tickets marked ①②③…. `package.json` `scripts.queue` runs `scripts/queue.mjs`.
- `mods/queue/hooks/render.mjs` exports pure, Node-free `renderBand(queue)`: 1 or 2 lines, each at most 120 chars; line 1 in flight (ticket number without leading zeros, title, cell), line 2 the first 3 `proposed` (or first 3 `ready` when `proposed` is empty). Anything that is not a queue, or an empty queue, gives `""` without throwing.
- `mods/queue/` is packaged like `mods/north-star/` (plugin.json, hooks/hooks.json with one module, `register.tsx`), and `.claude-plugin/marketplace.json` lists `queue`. `register.tsx` must shell out to `scripts/queue.mjs --json` on session.start and turn.complete, draw in AbovePrompt, and catch failures (source-level check).

## Criterion to test map

- AC1 buckets: queue.test.mjs "AC1 ..." (6 tests: ready order, in flight cell and mode, waiting on user, blocked names blocker, gone statuses, empty board).
- AC2 proposed order: "AC2 ..." (4 tests: latest row and ranks, no file, malformed actual variants, missing key and bad entries).
- AC3 titles: "AC3 ..." (2 tests: heading not slug; truncation to 60 with ellipsis).
- AC4 band: mods-queue.test.mjs "AC4 ..." (in flight shown, next 3 proposed, proposed beats ready, fallback to ready top 3, two-line 120-char cap, single-line cases, empty, non-queue inputs render nothing, CLI JSON feeds renderBand, Node-free, register.tsx source check) plus marketplace and manifest tests.
- AC5 `/queue` or `npm run queue`: "AC5 ..." (4 plain-output tests and the package.json script test).
- human-verified: the band drawing in a live terminal claude session; fail-quiet in the live mod (only the source check and `renderBand` of non-queues are automated); the `/queue` slash command file.

## Notes for the developer

- I found no command mechanism in the mod API (north-star and sleep-guard have none, and the mods-trial spec mentions none), so the tests cover `npm run queue` only. If you do not find one either, write `.claude/commands/queue.md` as a gated patch (`.scratch/_handoffs/gated/212-queue-command.patch`) and say so in your handoff.
- Lock line format is `<cell> <iso> [<mode>] [<prior status>]`, e.g. `qa 2026-10-09T01:25:07.351Z specify ready-for-agent`.
- Blocked-by parsing and the board walk can follow `scripts/north-star.mjs` (`loadBoard`, `blockerRefs`); `Blocked by` forms to handle: `None (...)`, `302`, `301 (shipped)`, `beta/301, alpha/301`.

## State

```json
{"ticket":"organism-infra/212-queue-mod","cell":"qa","mode":"specify","current_step":"qa specify done: 31 failing tests committed at 66f838b on feat/212-queue-mod; all fail for missing queue.mjs, mods/queue and npm script","artifacts":["scripts/queue-fixture.mjs","scripts/queue.test.mjs","scripts/mods-queue.test.mjs"],"decisions":["Row shape, rank semantics and band format pinned in test header comments","proposed lists only currently-ready entries of the latest jev-order actual list, rank = 1-based position in that list","Titles truncated to 60 chars in the JSON; band lines capped at 120","/queue command file is human-verified; tests pin npm run queue only"],"failures":[],"pending":[{"item":"Make the 31 tests pass: scripts/queue.mjs, mods/queue/, marketplace entry, queue npm script; gated patch for .claude/commands/queue.md if the mod API has no command mechanism","owner":"developer"}]}
```
