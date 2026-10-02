# Handoff: organism-infra/92 developer (batch J)

## State

```json
{
  "ticket": "organism-infra/92-dispatch-context-hardening",
  "cell": "developer",
  "current_step": "Done on feat/context-gate-batchJ (431728d, one commit shared with 95). M1, L1, L2 implemented; all [92] tests green; full npm test 1657 pass, 0 fail.",
  "artifacts": [
    "scripts/dispatch-context.mjs (git ls-files -z --cached --others --exclude-standard; temp file plus renameSync)",
    "scripts/jg.mjs (TRUSTED_FLAGS allowlist in checkTrustedFlags)"
  ],
  "decisions": [
    "M1: one listing change (--cached --others --exclude-standard); .scratch/ and .claude/ stay filtered out after the listing, so the size check and secret scan share it as before.",
    "L1: allowlist is exactly --max-source-bytes. The value token (or the =N form) must be digits, otherwise refused with kind 'flag'. A bare --max-source-bytes with no value is refused. The existing '--exclude' and '--no-ignore' refusals still hold since neither is allowlisted. FORBIDDEN_FLAGS stays for the CLI-path checkFlags.",
    "L2: temp file is .<name>.<pid>.tmp in the same directory, then renameSync; the temp is removed if the write or rename throws."
  ],
  "failures": [],
  "pending": [
    {
      "item": "qa verify. Note for the batch: see the 95 handoff for the secret-in-root finding (six test files with fake secrets make this repo still fall back).",
      "owner": "qa"
    }
  ]
}
```

## Criterion map

1. Untracked, non-ignored secret: "[92] AC1" tests (3) pass.
2. Allowlist: "[92] AC2" in scripts/jg.test.mjs passes.
3. Rename write: "[92] AC3" passes.
