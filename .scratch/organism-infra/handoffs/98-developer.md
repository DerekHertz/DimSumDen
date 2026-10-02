```json
{
  "ticket": "organism-infra/98-board-resolve-command",
  "cell": "developer",
  "current_step": "implemented: 14/14 qa tests pass, full npm test 1792 pass 0 fail; committed on feat/98-board-resolve; qa verify next",
  "artifacts": [
    "branch feat/98-board-resolve",
    "apps/organism-infra/board-service.mjs (resolve)",
    "apps/organism-infra/board.mjs (resolve command)",
    "docs/agents/issue-tracker.md (Resolve bullet)"
  ],
  "decisions": [
    "resolve validates every ref (ref syntax, ticket exists, no lock, not already resolved, duplicate refs) and --pr before any write",
    "an already-resolved ticket is refused, so a rerun cannot append a second resolved row",
    "handoff is published as <NN>-orchestrator-resolve[-n].md from a draft under os.tmpdir(), via publishHandoff and release, so all existing gates run unchanged",
    "--note goes into the handoff body and, via release reason, into the ticket comments (sanitized)",
    "a failure mid-batch undoes the failing ref's own claim (forced release back to its prior status) and the error names resolved and not-attempted refs; earlier resolved refs stay resolved"
  ],
  "failures": [],
  "pending": [
    { "item": "Mid-batch failure path (undo claim, partial report) has no test; qa may add one in verify", "owner": "qa" }
  ]
}
```

## Summary

`board resolve <ref>... --pr N [--note "<text>"]` added to the board CLI and service. All 14 qa tests in `apps/organism-infra/board-resolve.test.mjs` pass unedited. Full `npm test`: 1792 pass, 0 fail.

The forced undo release on a mid-run failure logs a `kind:"override"` event, which the orchestrator will see; that is intended (it flags a partial run).
