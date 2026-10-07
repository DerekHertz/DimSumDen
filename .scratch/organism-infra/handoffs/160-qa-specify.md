# 160 qa specify handoff

```json
{
  "ticket": "organism-infra/160-jev-verify-baseline",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Failing tests committed on tests/160-jev-verify-baseline (93d323e). 5 of 9 new tests fail for the right reason: shadow verify reports effective full where the relay rule says light.",
  "artifacts": [
    {"path": "scripts/jev-shadow-baseline.test.mjs", "note": "new, 9 tests: decide and CLI against a fixture board"},
    {"path": "scripts/jev.test.mjs", "note": "lines 83 and 141 now pass qaSpecified:false so they keep pinning the unspecified full baseline"}
  ],
  "decisions": [
    "Root cause: scripts/jev.mjs build() sets actual = p.fallback (full) in shadow unless the floor applies; the qaSpecified lookup is already right (CLI reads handoffs/<NN>-qa-specify*.md).",
    "Pinned: shadow verify with qaSpecified true gives effective and row.actual light, even when Jev picks full or falls back (no key); row.pick keeps Jev's real pick; floor null; applied false.",
    "Pinned: shadow verify with qaSpecified false stays full with floor full. Live mode and tier unchanged."
  ],
  "failures": [],
  "pending": [
    {"item": "Fix build() in scripts/jev.mjs so shadow verify uses light when qaSpecified is true. Check scripts/jev-report.mjs reads of row.actual for verify (report counterfactuals) still make sense, and run the full npm test.", "owner": "developer"}
  ]
}
```

## Criterion to test map

Test file: `scripts/jev-shadow-baseline.test.mjs`

- Criterion 1 (shadow verify reports light with a published qa specify handoff, fixture board): "CLI shadow verify with a published qa specify handoff: effective light" (fails now). Supporting decide tests: "shadow verify with qa specify: effective is light, not the fallback", "...stays light when Jev picks full...", "...stays light when Jev falls back (no key)", "...qaSpecified omitted..." (all fail now).
- Criterion 2 (full without one): "CLI shadow verify without a qa specify handoff: effective full", "CLI shadow verify ignores another ticket's qa specify handoff (16- is not 160-)", "shadow verify without qa specify..." (pass now, regression guards).
- Guard: "live verify is unchanged" (passes now).

## Notes for the developer

- Existing tests in `scripts/jev.test.mjs` (lines 83, 141) asserted shadow verify effective full with the default qaSpecified true. They contradict the new rule, so I added `qaSpecified: false` to them. Intent kept, no assertion loosened.
- ADR 0010 line 24 says shadow `effective` is always the fallback default. Ticket overrides that for verify; ADR text may need a note (orchestrator or user, gated).
- No criteria are human-verified.
