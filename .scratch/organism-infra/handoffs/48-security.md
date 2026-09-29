```json
{"ticket": "organism-infra/48-scripted-usage-rows", "cell": "security", "current_step": "Security pass at 52d7b6b", "artifacts": [],
 "decisions": ["Security pass: no critical or high findings", "gitleaks origin/main..52d7b6b: 4 commits, no leaks", "events and usage rows are built with JSON.stringify, so newline, quote and U+2028 in comment text, --as, ticket, cell, mode and outcome cannot add lines or fields (probed log-cell with newline/quote/U+2028 payloads: one row, kind cell)"],
 "failures": [],
 "pending": [{"item": "medium: --verdict is not role-gated (see State); consider restricting to qa, security, orchestrator", "owner": "orchestrator"}, {"item": "low: resolved row append failure after commit leaves ticket resolved with no row and no retry path", "owner": "orchestrator"}]}
```

## State

Security pass. No new dependencies, no package.json or lockfile change, no network code.

## What changed

Nothing; review only.

## Findings

- medium, apps/organism-infra/board-service.mjs comment() (verdict at the event append): `--verdict bounce|pass` is accepted from any cell. With a claim lock the author is the lock's cell (developer can post `--verdict bounce` on its own ticket); with no lock `--as <any known cell>` is accepted (existing ADR 0008 decision 9 trust model). So bounce counts are advisory telemetry, forgeable by any local cell. Not a memory or file injection: value is enum-checked and stored as a JSON field. Suggest restricting verdicts to qa/security/orchestrator authors.
- low, board-service.mjs appendResolvedRow (call after commitWithEvent in release()): the append runs after the ticket write and lock unlink. If it throws (disk full, .scratch/usage.jsonl unwritable), the ticket is already resolved and the claim is gone, so the CLI exits non-zero but a retry is impossible and the row is lost. Board state stays consistent. The bounce read happens under the per-ticket write lock, so no concurrent comment on the same ticket can race it; events.jsonl is replaced by rename so the read is never torn.
- low, board-service.mjs release(): `--pr` is silently ignored on non-resolved releases, and the Type check (`^**Type:** (feature|bug)`) treats a ticket with no Type line as non-code, so --pr becomes optional there. Orchestrator-only path.
- low, board-service.mjs appendResolvedRow and scripts/log-cell.mjs: the usage.jsonl append does not run assertWithinRoot, so a symlinked .scratch or usage.jsonl is followed. log-cell has no lock and no length cap on --outcome or --mode (JSON-escaped, so no injection, but a very large single line could interleave with a concurrent appender). Local single-user, so low.
- info, --pr: /^[1-9][0-9]{0,8}$/ after parseFlags; leading zeros, signs, "--" values, `--pr=5`, and floats are all refused. Fine.
- info, scripts/usage-rows.test.mjs: spawnSync with an argv array, no shell.

## Next step

orchestrator proposes the merge (brain gate).

## Suggested skills

none

## Gotchas

Bounces are keyed on the exact feature/ticket slug (qa already noted this).
