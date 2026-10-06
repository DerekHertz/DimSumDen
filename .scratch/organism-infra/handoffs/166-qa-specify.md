# 166 qa specify handoff

Branch `tests/166-secret-in-root-names-path`, specify sha `9aada81` (base ec664af). Tests committed, all red for the right reason.

## Criterion-to-test map

| Criterion | Test |
|---|---|
| AC1: row and printed line carry repo-relative path of first matching file, never contents | `scripts/dispatch-context-secret-path.test.mjs`: "the secret-in-root row names the first matching file..." (buildContext row, `secret_path` === "b/leak.mjs" with two matching files; no matched text, no absolute path); "the CLI printed line and the kind:jg usage row carry secret_path..." (printed JSON + usage.jsonl row) |
| AC1 guard against over-adding | same file: "a fallback other than secret-in-root carries no secret_path" (already green; keeps the existing exact 4-key CLI output test in dispatch-context.test.mjs intact) |
| AC3: test fails naming the path when a tracked file trips the scan | `scripts/root-secret-scan.test.mjs` (scans `git ls-files`, same exclusions as dispatch-context: .scratch/, .claude/, binaries; fails listing offender paths) |
| AC2: `dispatch-context --refresh` on fixed branch no longer returns secret-in-root | Covered by the guard test (same file set and `hasSecret`); the developer should also run the command once. Not a separate test (needs real jg/auth). |
| AC4: existing dispatch-context and exposure tests pass | Run `npm test`; I touched no existing test file. |

## Current red

- dispatch-context-secret-path: 2 fail (no `secret_path` yet), 1 passes by design.
- root-secret-scan: fails naming the two current offenders:
  - `apps/bridge/bridge-launch-code.test.mjs` (lines 322, 340: `"preset-token"` literals under TOKEN / token keys)
  - `apps/ui/src/session/session.test.mjs` (line 23: `const TOKEN = "session-token-0123..."`)
  Both are obviously fake test values (hardcoded API key/token/secret pattern, 12+ chars), not real secrets. Fix as 96 did: assemble at runtime (e.g. `"preset" + "-token"`), or change the literal so it is not 12+ chars of [A-Za-z0-9_/+-]. Don't weaken `hasSecret`.

## Notes for the developer

- Implement `secret_path` as an extra key present only on the `secret-in-root` fallback (row and printed line), so the existing CLI test asserting exactly `["bytes","fallback","path","skipped"]` keys for the no-fallback case still passes.
- "First matching file" is the first in `git ls-files` listing order (sorted) outside the board.
- Never put contents or matched text in the row.
- Other secret-pattern hits in the scan are limited to the two files above (scanned the worktree, including untracked).

```json
{
  "ticket": "organism-infra/166-secret-in-root-names-path",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Tests written and committed (9aada81); 3 red for the right reason, 1 guard-green. No product code touched.",
  "artifacts": [
    "scripts/dispatch-context-secret-path.test.mjs",
    "scripts/root-secret-scan.test.mjs"
  ],
  "decisions": [
    "secret_path appears only on secret-in-root fallbacks, keeping the existing 4-key CLI output assertion valid",
    "Guard test is a direct hasSecret scan over git ls-files with dispatch-context's exclusions, not a call through buildContext, so a >5 MB root cannot make it pass silently",
    "AC2 is covered by the guard test plus a manual command run by the developer"
  ],
  "failures": [],
  "pending": [
    {
      "item": "Add secret_path to the secret-in-root fallback in scripts/dispatch-context.mjs (row and printed line); fix the two fixture files so they build fake tokens at runtime; run the --refresh command from AC2",
      "owner": "developer"
    }
  ]
}
```
