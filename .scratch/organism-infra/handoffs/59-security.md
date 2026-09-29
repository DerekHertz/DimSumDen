# Handoff: security review, organism-infra/30

Verdict: **Security pass**. No critical or high findings.

```json
{
  "ticket": "organism-infra/59-handoff-error-shows-skeleton",
  "cell": "security",
  "current_step": "Security review of ad43f95 done: release gate and skeleton output reviewed, verdict pass, two low findings for the developer's discretion.",
  "artifacts": [
    "branch organism-infra/30-handoff-skeleton at ad43f95 (2 commits over c3e3a0e)",
    "apps/organism-infra/board-service.mjs",
    "apps/organism-infra/board-handoff-skeleton.test.mjs"
  ],
  "decisions": [
    "Release gate: `newStatus !== \"blocked\"` also covers --keep-status (newStatus is undefined there), so no non-blocked path skips the gate; --force is still the only bypass and it logs a kind:override event with the reason.",
    "The blocked exemption is what the ticket asks for; it does not let a cell reach resolved (resolved still needs an orchestrator claim, and --force does not bypass that).",
    "Skeleton content is ticket ref (validated by parseTicketRef), cell and mode taken from the claim lock. It does not print the lock timestamp, the lock path, or any filesystem content. Lock is written by board claim from allow-listed cell/mode values, so nothing untrusted reaches the output in normal use.",
    "JSON.stringify escapes newlines and quotes in the skeleton, so a hostile lock token cannot break out of the fenced block.",
    "12/12 tests in board-handoff-skeleton.test.mjs pass when run by security."
  ],
  "failures": [
    "gitleaks is not installed (not on PATH, not in ~/.local/bin). Fell back to a pattern grep for keys, tokens and private keys over board-*.mjs; no matches. Not a substitute for gitleaks history scan of both commits."
  ],
  "pending": [
    {"item": "Optional (low): validate lock-derived cell against known cells and mode against CLAIM_MODES before printing in stateSkeleton, as defense in depth against a hand-edited or symlinked lock file", "owner": "developer"},
    {"item": "Install gitleaks at ~/.local/bin so the commit-range secret scan can run", "owner": "user"},
    {"item": "Propose merge of organism-infra/30-handoff-skeleton", "owner": "orchestrator"}
  ]
}
```

## Findings

- `apps/organism-infra/board-service.mjs:911-919` (claimSkeleton) and `:892-903` (stateSkeleton), low: cell and mode are echoed from the lock file's first and third whitespace tokens with no check against the known-cell list or `CLAIM_MODES`. Only a local actor who can already edit `.scratch/**/*.lock` (or symlink one to another file) could make it print a token from elsewhere, and only one token. Suggest validating both before printing, falling back to `<cell>` and omitting `mode`.
- `apps/organism-infra/board-service.mjs:958`, low (behavior, not a vulnerability): `ready-for-human` and `ready-for-agent` releases now need a handoff or `--force --reason`. A cell stuck mid-task must write a handoff first, which apoptosis already requires. Matches the ticket.
- `apps/organism-infra/board-service.mjs:973-994`, informational: `--force` with no claim lock skips the no-lock refusal as well as the handoff check. Logged as an override with cell `unknown`. Pre-existing for in-review/resolved, now widened to the other non-blocked statuses. It cannot resolve a ticket.

## Comments

Security pass.

- **Renumbered (orchestrator, 2026-09-29):** was cloud organism-infra/30; the local board used that number for a different ticket.
