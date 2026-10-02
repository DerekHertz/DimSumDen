# qa verify: organism-infra/109-statusline-usage-context-relay (batch M)

```json
{
  "ticket": "organism-infra/109-statusline-usage-context-relay",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify passed: all 1880 tests pass unchanged, gated patch verified, all acceptance criteria mapped to passing tests.",
  "artifacts": [
    "branch feat/batch-m-hooks @ a1e49c4",
    "scripts/statusline.mjs (developer)",
    "scripts/hook-io.mjs (helper, shared with 110/111)",
    "scripts/context-state.mjs (helper, shared with 109/110/111)",
    "scripts/context.mjs (updated to use context-state.mjs)"
  ],
  "decisions": [],
  "failures": [],
  "pending": [
    {
      "item": "Apply the gated patch (.scratch/_handoffs/gated/01-batch-m-settings.patch) with !npm run apply-gated.",
      "owner": "orchestrator"
    }
  ]
}
```

## Light verify results

All tests pass: 1880/1880 (0 failed, 0 skipped). Gated patch touches only `.claude/settings.json` and correctly points to the three scripts. All acceptance criteria have passing tests.

## Acceptance criteria coverage

| AC | Test file: test names |
|---|---|
| Prints one line: 5h %, reset, weekly %, ctx vs 80k, relay, gate count | statusline.test.mjs: "AC1: prints one line...", "AC1: several in-flight...", "AC1: no requests file..." |
| Colour thresholds; red context shows `→ /compact` | statusline.test.mjs: "AC2: below every threshold...", "AC2: context at 70k...", "AC2: 5-hour usage yellow..." |
| Usage cached; failure prints `5h ?` | statusline.test.mjs: "AC3: usage read is cached", "AC3: cache older than 60 s...", "AC3: failing usage read...", "AC3: hanging usage read..." |
| No model/network call; under 300 ms warm | statusline.test.mjs: "AC4: warm-cache run < 300 ms", "AC4: no model or network call" |
| Status-line input → context.mjs | statusline.test.mjs: "AC5-input: ..." (3 tests); context-statusline.test.mjs: "AC5: ..." (3 tests) |
| Settings patch in gated/ | human-verified in .scratch/_handoffs/gated/01-batch-m-settings.patch |
| npm test green | 1880/1880 |

## QA pass
