# Jev eval: CI-failure triage (den-mvp/40)

When a CI job fails, should the den rerun it or send it back for a fix? Jev picks one of four labels: `flake`, `code`, `env` or `other`.

- **Cases:** `cases.jsonl` holds 50 failed jobs, which is every failed CI run of this repo from 2026-09-28 to 2026-10-15. The hand labels and the evidence for each are in `labels.jsonl`. Evidence means what fixed the failure, or, for a flake, a neighbouring run that passed with no change to the test. The split is 22 code, 22 flake, 4 env and 2 other.
- **Text sent:** `triageState` in `scripts/jev.mjs` builds what the den would send. That is the job name, the failing test names, two facts that code knows (the commit's changed files by area, and where the same tests failed in the 14 days before), then every failing test's lines. Only CI output and file paths leave the machine, which is within ADR 0010 decision 9.
- **Rebuild:** `node scripts/jev-evals/triage/build-cases.mjs` (it needs `gh`).
- **Run:** `node scripts/jev-eval.mjs triage --model jev-1.13.0` (or `jev-1.14.0`). It needs `TYPESAFE_API_KEY`.

## Results, 2026-10-15

| | accuracy | safety misses (code called flake) | lowest floor with none | picks at that floor | right at that floor | cost per case | p95 |
|---|---|---|---|---|---|---|---|
| log only, jev-1.13.0 | 68% | 2 | 0.7 | 46 of 50 | 72% | $0.000067 | 128 ms |
| log only, jev-1.14.0 | 70% | 1 | 0.6 | 47 of 50 | 70% | $0.000067 | 112 ms |
| with facts, jev-1.13.0 | 84% | 3 | 0.7 | 36 of 50 | 97% | $0.000072 | 147 ms |
| with facts, jev-1.14.0 | **86%** | 3 | 0.9 | 25 of 50 | 100% | $0.000072 | 151 ms |

`log-only/` holds the first run's reports. In that run, every wrong `flake` was an assertion failure that a slow runner caused, such as "exactly one POST, got 0" or "pinch zooms out: 0.55 to 0.55". From the log, these look exactly like real bugs. A person who labels them also reads the history: the commit touched only board files, and the same test failed on unrelated commits. Adding those two facts raised accuracy by 16 points on both models.

**Against the bar** (den-mvp/40):
- Accuracy is 86% on 1.14, against a bar of 85%.
- Each model has a floor with zero safety misses: 0.9 on 1.14 and 0.7 on 1.13.
- Cost is $0.00007 per case, against a bar of $0.001.
- p95 latency is 151 ms, against a bar of 3 s. The first call of a run took about 2 s, which is a cold start.

So it passes. For the den, the useful operating point is **jev-1.13.0 at a 0.7 floor**. It decides 72% of failures, it is right on 97% of those, and it has no safety misses. A pick below the floor goes to today's path: the developer gets the findings.

**Caveat.** The two facts and the wording of the question were written after the first run's misses had been seen. Nothing was held out, so these numbers are optimistic. The den's next real failures are the test that counts: run triage in shadow on them before it acts.
