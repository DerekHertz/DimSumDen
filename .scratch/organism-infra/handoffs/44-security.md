```json
{"ticket":"organism-infra/44-orchestrator-context-watch","cell":"security","current_step":"full security review complete: Security pass at 5fd6993","artifacts":["scripts/context.mjs","scripts/context.test.mjs"],"decisions":["Security pass; no findings at medium or above"],"failures":[],"pending":[{"item":"merge proposal; genome and usage-watch wiring (under .claude/, brain gate)","owner":"orchestrator"}]}
```

## Summary

Security pass on feature/organism-infra-44-context-watch at 5fd6993 (diff vs origin/main: scripts/context.mjs, scripts/context.test.mjs; no package.json, lockfile or workflow changes; npm audit 0 vulnerabilities).

- Output: context.mjs prints only {session, context_tokens, percent} via JSON.stringify. session is the transcript filename minus .jsonl; tokens are summed from message.usage numeric fields. No transcript text, paths or content is echoed. No file writes, no network, no child processes.
- Path handling: projects dir is $HOME/.claude/projects/<cwd with non-alphanumerics replaced by "-">, so no separators or ".." can enter the segment. Symlinks are skipped (Dirent.isFile() is false for them); subdirectories (subagents) are ignored.
- Test shelling: spawnSync("node", [SCRIPT], ...) with an argv array, no shell, fixed script path; fixtures live in mkdtemp dirs under tmpdir.
- Secrets: pattern grep of the diff found nothing (gitleaks not installed). Tests: 3 of 3 pass.

## Comments (non-blocking)

- LOW, scripts/context.mjs:41: usage fields are not type-checked; a string or object in input_tokens would concatenate and be echoed in context_tokens. Transcripts are written locally by Claude Code, so exposure is nil; wrap each field in Number(...) || 0 to be strict.
- LOW, scripts/context.mjs:30: readFileSync loads the whole transcript into memory; cost only.
- LOW, scripts/context.mjs:23: statSync can throw if a transcript is deleted between readdir and stat. Crash only.

## Next step

Orchestrator proposes the merge (brain gate). Genome and usage-watch wiring is under .claude/ (orchestrator, with user permission).
