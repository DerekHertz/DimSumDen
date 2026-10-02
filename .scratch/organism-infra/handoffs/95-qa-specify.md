# Handoff: organism-infra/95 qa specify (batch J)

## State

```json
{
  "ticket": "organism-infra/95-context-size-gate-counts-binaries",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Batch J tests committed on tests/context-gate-batchJ (4419779, base 11722e7). 7 new tests fail for the missing feature (3 are 95 tests, all failing with skipped 'root over 5 MB eligible'; 4 are 92 tests, see the 92 handoff). 1 further 95 test and 1 further 92 test are regression guards that pass now and must stay green.",
  "artifacts": [
    "scripts/dispatch-context.test.mjs (appended blocks tagged [95] and [92])",
    "scripts/jg.test.mjs (appended block tagged [92] AC2)"
  ],
  "decisions": [
    "The 95 tests inject NO trackedBytes seam: they drive the default size check against real files in a real tmp git repo, so the developer is free to put binary exclusion in statBytes or in the listing. Binary fixtures hold NUL bytes AND a binary extension (.blend, .png), so either detection the ticket allows (NUL in first 8 KB, or extension list) passes. I did not test the NUL-only or extension-only divergence.",
    "Criterion 3 (binaries never sent to jg) is jg's own filter plus the existing tests staying green; I added one test that a 6 MB binary beside a secret-bearing text file still gives secret-in-root (not skipped on size).",
    "Criterion 4 (run against this repo, measured eligible bytes in the handoff) is human-verified: the developer records the measured bytes. I did not add a real-repo test because text is already about 4.5 of 5 MB and a repo-size canary would break unrelated tickets. The developer should state the headroom (cap 5242880 minus measured text bytes) in the handoff.",
    "Both 95 tickets and 92 share one listing: the 92 M1 listing change (git ls-files --others --exclude-standard) feeds the same size check, so the developer should change both in one pass."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Make the size gate in scripts/dispatch-context.mjs exclude binary files; keep ROOT_CAP 5242880 and the 'root over 5 MB eligible' string; run it against this repo and record measured eligible bytes plus headroom in the developer handoff. Never loosen the tests.",
      "owner": "developer"
    }
  ]
}
```

## Criterion-to-test map

Tests are in `scripts/dispatch-context.test.mjs`.

1. Under 5 MB of text plus over 5 MB of binaries is not skipped and jg is called:
   - "[95] AC1: under 5 MB of text plus over 5 MB of binaries is not skipped and jg is called" (library, 1 MB text + 6 MB binary)
   - "[95] AC1: the same holds end to end through the CLI" (fake jg on PATH, 6 MB .blend)
2. Over 5 MB of tracked text is still skipped with `root over 5 MB eligible`:
   - "[95] AC2: over 5 MB of tracked text is still skipped with the 'root over 5 MB eligible' reason" (passes now; guard)
3. Binaries never sent to jg, secret scan as before:
   - Existing tests stay green (secret-in-root, gitignored-file, size-seam tests).
   - "[95] AC3: a big binary beside a text file holding a secret still falls back with secret-in-root"
4. Run against this repo no longer reports the skip, with measured bytes: human-verified (developer records it in the handoff).
