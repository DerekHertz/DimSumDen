```json
{"ticket": "organism-infra/44-orchestrator-context-watch", "cell": "qa", "mode": "specify",
 "current_step": "failing tests committed on tests/organism-infra-44-context-watch at 88a656f (3 red)",
 "artifacts": ["scripts/context.test.mjs"],
 "decisions": ["Seam: run with HOME=<fixture>, cwd=<fixture project>; transcripts dir = HOME/.claude/projects/<cwd with non-alphanumerics -> \"-\">", "subagent transcripts are in <session>/subagents/ subdirs; only top-level *.jsonl count; newest by mtime", "session = filename minus .jsonl; tokens = input+cache_creation_input+cache_read_input of last assistant usage, output excluded", "percent only asserted numeric in (0,100]; window size is developer choice"],
 "failures": [],
 "pending": [{"item": "write scripts/context.mjs; genome/usage-watch wiring is orchestrator/.claude work", "owner": "developer"}]}
```

## Summary

Branch tests/organism-infra-44-context-watch, commit 88a656f, base fcd7e62. All 3 tests fail with module-not-found (missing feature).
Map: criterion 1 -> test 1; criterion 2 -> test 2; criterion 3 -> test 3 (empty dir and missing dir).
Note: the ticket did not say how to point the script at a fixture; I chose HOME + cwd (see decisions). Logging the usage.jsonl row is orchestrator behavior, human-verified.
