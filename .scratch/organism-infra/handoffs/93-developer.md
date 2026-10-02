# Handoff: organism-infra/93 developer

## State

```json
{
  "ticket": "organism-infra/93-batch-groups-script",
  "cell": "developer",
  "current_step": "scripts/batch-groups.mjs implemented and committed on feat/batch-groups93 (ce0845a, on top of qa's a6e68e6). All 27 tests in scripts/batch-groups.test.mjs pass unedited; full npm test is green (1624 pass, 0 fail). Smoke run against the real board exits 0 and prints sensible output. The genome edit is written below for the user to apply.",
  "artifacts": [
    "scripts/batch-groups.mjs (branch feat/batch-groups93, commit ce0845a)"
  ],
  "decisions": [
    "Clustering is one agglomerative pass: pairs of same-class tickets sorted by shared-path count (then same feature, then board order) are merged unless the merged cluster would exceed max. This covers connected components, chains and the split-by-most-shared-paths rule with one mechanism.",
    "Paths are backticked tokens with a slash and a file extension, or a trailing-slash token whose first segment is a known directory (apps, scripts, docs, assets, src, public, tests). Overlap is exact string match, so a directory token only overlaps the same directory token.",
    "A Blocked by piece matches `NN` or `feature/NN` by leading number; any piece that does not parse, or names a ticket not on the board, counts as unresolved (conservative).",
    "Default inFlightFiles: `gh pr list --state open --json headRefName`, then `git diff --name-only origin/main...origin/<branch>` per head (origin/ prefix because a PR head may exist only on the remote). Any gh or git failure rejects, so main reports no in-flight data. 30s timeout on each call.",
    "Default readBoard reads $ORGANISM_ROOT (else cwd) .scratch/<feature>/issues/*.md, skipping _-prefixed dirs; locked = sibling .lock file exists.",
    "Text output: optional 'note: no in-flight data' line, 'Groups:' (one line per group: refs | shares paths | reason), 'Singles:', then 'unknown files: ...' only when non-empty.",
    "Skipped /code-review subagent run to save budget; I reviewed the diff myself against the ticket and the test header."
  ],
  "failures": [],
  "pending": [
    {
      "item": "User applies the orchestrator genome edit below (.claude/ is gated, so the developer did not touch it)",
      "owner": "user"
    },
    {
      "item": "qa verify; real-board smoke showed most open tickets list under 'unknown files' because they name no backticked paths in What to build or Acceptance criteria. That is per spec, but the orchestrator may want to ask product to name paths on new tickets so the script finds batches",
      "owner": "qa"
    }
  ]
}
```

## Orchestrator genome edit (for the user to apply)

File: `.claude/agents/orchestrator.md`, "Batches" section. Insert one bullet after the line starting `- A batch holds tickets whose files overlap each other but no other in-flight branch.`

```diff
 - A batch holds tickets whose files overlap each other but no other in-flight branch. It counts as one cell toward `max_concurrent_cells`.
+- To find candidates, run `node scripts/batch-groups.mjs [--max 3] [--json]`. It reads the board and open PRs, writes nothing, and prints proposed groups (refs, shared paths, reason), then singles, then tickets with `unknown files`. It is advisory: propose a group to the user as above. "No in-flight data" in its output means `gh` failed, so check open branches by hand.
```

## Notes for qa verify

- Criterion 7 (genome edit in this handoff) is the section above; human-verified.
- Not covered by tests: the default gh/git seam (needs a real remote; smoke-run once against the real repo, which returned without the no-in-flight note) and the known-directory path form.
