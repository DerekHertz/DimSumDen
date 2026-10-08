# 209 qa specify handoff

Branch: `tests/209-v1-progress-bar` (specify sha c219bcb, base b243a8c). Only tests and a test fixture are committed.

Test files (run with `node --test <file>`):
- `scripts/north-star.test.mjs` (module, 19 tests)
- `scripts/statusline-north-star.test.mjs` (statusline segment, 6 tests)
- `scripts/mods-north-star.test.mjs` (band render and packaging, 8 tests)
- `scripts/north-star-fixture.mjs` (test helper: builds a fixture board root)

Red check: 32 of the 33 tests fail because the feature is missing (module not found, no `v1` segment, no mod folder, not in marketplace). The one that passes already ("segment omitted with no den-v1 tickets") is a guard that keeps the existing exact-line statusline tests green.

## Interface the tests pin (developer must match)

- `scripts/north-star.mjs`: `export function readNorthStar(root)` (sync or async) returns `{ done, total, remaining, next }`. `root` holds `.scratch/`. `next` is the ref string `<feature>/<NN-slug>` or `null`.
- Same file as a CLI: `node scripts/north-star.mjs --json` with `ORGANISM_ROOT` set prints that object as JSON (the band mod shells out to it).
- Set: all `den-v1` tickets plus transitive `Blocked by` refs (`NN` = same feature, `feature/NN`, ignore prose like "(merged)"/"None", ignore refs with no ticket, cycle-safe). Dependents of set tickets are not pulled in. Done = resolved or closed. Parked drops out of the total (and does not lengthen chains).
- Next = unblocked (every blocker done) and not done (claimed counts), longest chain of not-done, non-parked dependents (longest path); ties: priority (missing = P2), then lower number.
- Statusline: segment `v1 <█/░ bar> <done>/<total> · <remaining> to go`, omitted when total is 0 (so existing statusline tests stay unchanged). Independent of the usage read; no fetch or socket connect (trapped in a test).
- Band: `mods/north-star/hooks/render.mjs` exports pure, Node-free `renderBand(progress)` giving `<bar> v1 8/12 · next: 143` (leading zeros trimmed; no `next:` when null; empty string when total is 0; bar fill within 0.1 of done/total). Also `mods/north-star/.claude-plugin/plugin.json` (name north-star, semver, description), `mods/north-star/hooks/hooks.json` with `{ "modules": ["./register.tsx"] }` (one path that exists under hooks/), and a `north-star` entry in `.claude-plugin/marketplace.json` with source `./mods/north-star` (sleep-guard stays).

## Criterion to test map

1. Set includes den-v1 plus chain blockers: north-star.test.mjs "AC1 ..." (7 tests).
2. resolved/closed done, parked dropped: "AC2 ..." (2).
3. Next critical-path ticket: "AC3 ..." (9).
4. Statusline segment, no network: statusline-north-star.test.mjs "AC4 ..." (6) plus "AC4 the module reads only the board" in north-star.test.mjs.
5. Band renders bar, count, next from the same module: mods-north-star.test.mjs "AC5 ..." (6).
6. Marketplace lists the mod: "AC6 ..." (2). The exact `.claude/settings.json` edit in the developer handoff is human-verified (gated edit).
7. Existing statusline tests still pass: unchanged `scripts/statusline.test.mjs` (run in `npm test`).

Human-verified: the band drawing correctly in a live terminal `claude` session in WSL; the settings.json edit text.

## Notes for the developer

`register.tsx` has no automated test (the mod runtime has no Node); it should run `node scripts/north-star.mjs --json` via `$.process` and pass the result to `renderBand`. Run `claude plugin validate mods/north-star`. I ran out of context budget before running the full `npm test`; verify should do that.

```json
{
  "ticket": "organism-infra/209-v1-progress-bar",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Failing tests committed on tests/209-v1-progress-bar (c219bcb); 32 of 33 red for the missing feature, one guard passes",
  "artifacts": [
    "scripts/north-star.test.mjs",
    "scripts/statusline-north-star.test.mjs",
    "scripts/mods-north-star.test.mjs",
    "scripts/north-star-fixture.mjs"
  ],
  "decisions": [
    "Pinned readNorthStar(root) -> {done,total,remaining,next}, next as a ref string",
    "Statusline segment omitted when the set is empty so existing exact-line tests stay green",
    "Band render is pure renderBand(progress) in mods/north-star/hooks/render.mjs"
  ],
  "failures": [],
  "pending": [
    { "item": "Implement scripts/north-star.mjs, the statusline segment, mods/north-star and the marketplace entry; write the .claude/settings.json enable edit into the developer handoff", "owner": "developer" }
  ]
}
```
