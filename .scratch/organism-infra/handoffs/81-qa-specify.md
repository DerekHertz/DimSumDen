```json
{
  "ticket": "organism-infra/81-provider-neutral-usage-watch",
  "cell": "qa",
  "mode": "specify",
  "current_step": "specify complete: 26 intentional red tests, 2 new green tests, existing 2 Claude tests green",
  "artifacts": [
    "scripts/usage-provider.test.mjs"
  ],
  "decisions": [
    "Public CLI tested with genuine PATH-injected fake app-server; no module import seam.",
    "USAGE_CODEX_TIMEOUT_MS internal seam approved by orchestrator: default 10000ms, tests 1000ms; validate positive finite bounded input.",
    "Canonical output may add metadata; five-hour/weekly objects remain compatible."
  ],
  "failures": [
    "Three targeted test commands exited 1 intentionally because provider routing/adapter are absent; final run 30 tests: 4 pass, 26 fail, none skipped."
  ],
  "pending": [
    {
      "item": "Implement provider-neutral usage CLI and Codex app-server adapter against acceptance tests",
      "owner": "developer"
    },
    {
      "item": "Apply usage-watch provider/source/manual-fallback documentation and assess live invocation limitation",
      "owner": "orchestrator"
    }
  ]
}
```

State: specify done.

What changed: branch `tests/provider-neutral-usage-watch`, commit `e3df3afcf3555a9baaad29af44fcfd885238db2d`; tests only.

Criterion map:
- AC1: legacy + explicit Claude golden output; unknown/missing provider and unexpected-option rejection; Codex uses no Claude fetch.
- AC2: initialization/initialized/read exchange, unrelated IDs and notifications, duration-swapped windows, Codex-map selection, Unix-second ISO conversion.
- AC3: 10 malformed/missing/unrelated window cases; sanitized RPC/CLI/malformed JSON errors; initialization/read timeouts; missing executable; invalid timeout bounds; no estimate fallback.
- AC3 cleanup: fake writes synthetic SQLite state to supported sqlite_home CLI override (or dedicated child TMPDIR); all Codex paths assert temporary-state cleanup and child reaping. Fixture cleanup kills leaked fake children after recording failure.
- AC4: 28 new tests (26 red, fixture self-validation and Claude backcompat green), existing usage-401 tests both green. Final combined run: 30 tests, 4 pass, 26 fail, 0 skips. Red failures are missing CLI routing/protocol behavior, not setup/import errors.
- AC5: human-verified by orchestrator review of usage-watch skill; no QA .claude edits.
- AC6: human-verified supported live invocation report by orchestrator; real auth/network/session unavailable to unit tests and not used.

Next step: developer implements on this tests branch.
Suggested skills: organism-protocol, implement, tdd, handoff.
Gotchas: fixture PATH contains only fake executable, which uses absolute Node shebang; supported sqlite_home config arguments may precede app-server. Preserve default/explicit Claude behavior. Tests allow additional top-level provider/source metadata.

Failed calls:
- node --test usage-provider + usage-401 (first): exit 1, 21 missing-feature assertions; expected red. Literal reset dates independently checked and corrected before commit.
- node --test --test-reporter=dot usage-provider + usage-401 (second): exit 1, 21 missing-feature assertions; expected red after fixture self-validation.
- node --test --test-reporter=spec usage-provider + usage-401 (final): exit 1, 26 missing-feature assertions; expected red after missing-CLI and timeout validation coverage.
No environment blockers or guardrail refusals.

Worktree receipt: `/workspace/dimsumden-qa81`, clean after committing sole test file.
