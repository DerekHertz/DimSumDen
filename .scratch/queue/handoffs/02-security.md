# Handoff: queue/02 security

Verdict: Security pass (branch tests/queue-02-order-module-and-board-queue, head e8aa3dd).

```json
{
  "ticket": "queue/02-order-module-and-board-queue",
  "cell": "security",
  "current_step": "Security review done: pass, no critical or high findings",
  "artifacts": [],
  "decisions": [
    {"decision": "Security pass; two low notes, non-blocking"}
  ],
  "failures": [],
  "pending": []
}
```

## Scope reviewed

Diff origin/main...e8aa3dd: apps/organism-infra/board.mjs (+9), frontier-queue.mjs (new), frontier-queue.test.mjs (new).

## Checks

- gitleaks over origin/main..e8aa3dd: 3 commits, no leaks.
- No package.json, lockfile or .github changes; no new dependency.
- The module is read only: no shell, child_process, network, env use, or writes. The tests write only under mkdtemp dirs in the OS tmpdir.
- Path traversal: feature dir names must match /^[a-z0-9-]+$/ and are listed from readdir with isDirectory (symlinked dirs skipped); ticket files must match /^\d{2,}-[a-z0-9-]+\.md$/. No ticket text reaches a file path.
- Regexes (Blocked by, P0-reason, header) are linear; no ReDoS shape.
- Lock races: none, as the reader takes no locks and tolerates a file vanishing between readdir and readFile (returns null, skipped).

## Findings

- frontier-queue.mjs:219 area (formatQueue) and :177, low: p0Reason is ticket text printed verbatim to the terminal, so control or escape characters in a ticket could reach the terminal. Local board, authors are cells and the user. Strip control characters if this output is ever surfaced in the UI or logs.
- frontier-queue.mjs:158-164, low: a symlinked ticket .md file inside issues/ would be read (ticket file symlinks are not filtered). Needs write access to the board already; not exploitable beyond that.
