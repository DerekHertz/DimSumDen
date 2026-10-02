```json
{
  "ticket": "organism-infra/93-batch-groups-script",
  "cell": "orchestrator",
  "current_step": "Resolved. Relay done: qa specify, developer, qa light verify (pass), security (pass). PR 121 merged green after one CI rerun (runner timeout, see ticket 94).",
  "artifacts": ["PR 121", ".scratch/organism-infra/handoffs/93-security.md", ".scratch/organism-infra/issues/94-ci-flaky-browser-tests.md"],
  "decisions": ["User asked to run 93 first because the 5-hour window is tight; ran at 88-94% usage.", "Ticket templates to name touched paths (user yes); patch in .scratch/_handoffs/to-tickets-files.patch."],
  "failures": ["First CI run cancelled at the 15-minute timeout; rerun passed."],
  "pending": [{"item": "User runs .scratch/_handoffs/apply-93-and-files.sh (genome bullet + to-tickets wording); orchestrator opens and merges that PR", "owner": "user"}]
}
```

# Handoff: orchestrator, 93
PR 121 merged. About 35 open tickets name no paths, so batch-groups finds few batches until they do.
