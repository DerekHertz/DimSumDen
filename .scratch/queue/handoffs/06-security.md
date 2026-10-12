# Handoff: queue/06-retire-old-order (security)

```json
{
  "ticket": "queue/06-retire-old-order",
  "cell": "security",
  "current_step": "Security pass on 6d1098f. Reviewed the diff against origin/main, gitleaks clean, no dependency changes.",
  "artifacts": ["/home/dhertzell/dimsumden/.scratch/queue/handoffs/06-security.md"],
  "decisions": ["Pass: no critical or high findings. Two low notes below."],
  "failures": [],
  "pending": [
    {
      "item": "Low: docs/agents/issue-tracker.md Frontier line now runs into the Claim bullet on one line (missing newline after 'by waiting.'). Fix in a follow-up or by the orchestrator.",
      "owner": "developer"
    }
  ]
}
```

## Review

- Diff: 15 files, mostly deletions. Net removal of attack surface in `scripts/jev.mjs` (the `order` CLI read `--actual` refs and board files; now gone).
- `scripts/queue.mjs`: `readQueue` is now async and calls `buildQueue(await loadSnapshot(root))`. `loadSnapshot` only reads files under `<root>/.scratch` (feature dirs filtered by FEATURE_RE, ticket files by TICKET_FILE_RE). No shell-out, no network, no path built from ticket text. Root comes from ORGANISM_ROOT or cwd as before.
- `apps/organism-infra/priority.mjs`: aging removed; pure function, no I/O.
- `scripts/retire-old-order.test.mjs`: spawns `process.execPath` and `git ls-files` with fixed argv arrays (no shell), in a mkdtemp root, with the API key deleted from the env. Reads tracked files only. Fine.
- `scripts/queue-fixture.mjs` `headers` option writes test fixtures only.
- Secrets: `gitleaks detect --log-opts="origin/main..6d1098f"`: 2 commits, no leaks.
- Dependencies: none added; no package.json or lockfile change.
- No workflow or CI changes.

## Findings

- docs/agents/issue-tracker.md (Frontier line), low: the Claim bullet was glued onto the Frontier line. Docs-only, not a security issue.
- scripts/queue.mjs, low: a ready ticket that `buildQueue` does not order falls back to board order (documented in the header). No safety impact.

## Readers of jev-order rows (full-repo grep, for AC4 context)

Remaining mentions of `jev-order` outside history rows: `.claude/agents/orchestrator.md` and `.codex/agents/orchestrator.toml` (genome text, ticket 07), ADR 0015, `.scratch/` handoffs, specs and old tickets, and `scripts/queue.test.mjs` (plants a row to show it is ignored). No tracked source file under scripts, apps, packages or mods reads the rows.

Security pass.
