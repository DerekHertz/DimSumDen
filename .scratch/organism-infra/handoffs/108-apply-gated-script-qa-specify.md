# 108 apply-gated-script: qa specify handoff

```json
{
  "ticket": "organism-infra/108-apply-gated-script",
  "cell": "qa",
  "mode": "specify",
  "current_step": "18 failing tests committed on feat/108-apply-gated at 8382de2; every acceptance criterion except npm test green is mapped to a test. Developer implements scripts/apply-gated.mjs and the package.json script.",
  "artifacts": [
    "branch feat/108-apply-gated @ 8382de2",
    "scripts/apply-gated.test.mjs"
  ],
  "decisions": [
    "Seam: node scripts/apply-gated.mjs [--root <repoRoot>]; answers read from stdin (one line per prompt); only exact 'y' applies; EOF/empty/other skips.",
    "Patches are only *.patch in <root>/.scratch/_handoffs/gated/, sorted by name; .sh/.mjs ignored, applied/ excluded.",
    "Commit only the patch's own paths (main checkout is always dirty); patch queue itself is never committed.",
    "Commit message = format-patch Subject (no [PATCH]) + body; plain diff falls back to a message containing the patch file stem.",
    "Exit code and answer consumption for a failing-check patch are left unspecified; tests accept either."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Implement scripts/apply-gated.mjs and add \"apply-gated\": \"node scripts/apply-gated.mjs\" to package.json; docs/agents note; gated .claude edits go out as the first patch in .scratch/_handoffs/gated/",
      "owner": "developer"
    }
  ]
}
```

## Criterion to test map
Empty x2; stat+target x1; explicit-y x5 (incl. Enter/EOF/other and multi-patch y/n/y); n x1; check-failure x3 (stale, half-applicable two-file, failure does not block a good patch); commit+move x3; no-shell x3; package.json script x1.

## Notes for developer
- Do not weaken or delete tests in scripts/apply-gated.test.mjs; QA light verify diffs them against 8382de2.
- Use execFile (no shell) for every git call. Stage and commit with explicit paths.
- A throwaway stub passed 16/18 of these fixtures, so the tests are satisfiable as written.
