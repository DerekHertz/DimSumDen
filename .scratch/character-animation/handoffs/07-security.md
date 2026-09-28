# 07 security review

**Verdict: Security pass.**

Reviewed `worktree-agent-aad01bd255e8ec60a` @ `5009afd`, full ticket-07 diff `04b3e66~1..5009afd` (17 files, 636 insertions / 17 deletions -- the wider `aa2489d...` range also shows unrelated files because this branch is behind today's `main`; those are not ticket 07's changes).

## Findings

None critical or high. No medium or low findings either -- the change is self-contained.

- No new or upgraded npm dependency (no `package.json`/lockfile touched); no `npm audit` needed.
- No `.github/workflows/` or branch-protection change.
- No secrets, keys, or tokens in the diff or commit history (pattern-scanned `git diff 04b3e66~1..worktree-agent-aad01bd255e8ec60a`; the one `token` hit is a `tokens.json` colour-hex comment, not a credential).
- No shelling out to CLIs, no board/lock-file code, no daemon network-exposure code touched.
- `apps/ui/src/assets/panda-contract.mjs`: the fix moving `readFileSync` behind a lazy `await import("node:fs")` inside `readGlbFile` is sound -- `readGlbFile` is Node-test-only, and the browser-loaded constants (`PROP_ASSETS`, `CLIPS`, etc.) carry no Node dependency. A regression test (`panda-contract.test.mjs`, "does not import a Node built-in at the top level") guards this going forward.
- `PROP_ASSETS` / `HABIT_LOOPS` are static, hardcoded maps (prop file paths, socket names, clip names) -- no path-traversal or injection surface. `cellType` values reaching `HABIT_LOOPS[cellType]` come only from a fixed local enum in `dev-scene.mjs`'s button loop and from tests, never from untrusted/remote input; no production wiring to an external source exists yet.
- `apps/ui/assets-src/panda/build_props.py` is an offline Blender-authoring script (run manually in Blender's Python console), not part of the shipped app or its runtime -- same trust boundary as the existing `build_clips.py`/`export_glb.py`.
- `apps/ui/src/assets/prop-placement.mjs` is pure math (glb byte parsing + linear algebra), Node-test-only, no I/O beyond reading local asset files already covered by the contract test.

## CI/CD and dependencies

Not applicable to this ticket -- no pipeline or dependency changes to review.
