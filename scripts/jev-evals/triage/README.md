# Jev eval: CI-failure triage (den-mvp/40)

When a CI job fails, should the den rerun it or send it back for a fix? Jev picks one of four labels: `flake`, `code`, `env` or `other`.

- **Cases:** `cases.jsonl` holds 50 failed jobs, which is every failed CI run of this repo from 2026-09-28 to 2026-10-15. The hand labels and the evidence for each are in `labels.jsonl`. Evidence means what fixed the failure, or, for a flake, a neighbouring run that passed with no change to the test. The split is 22 code, 22 flake, 4 env and 2 other.
- **Text sent:** `triageState` in `scripts/jev.mjs` builds what the den would send. That is the job name, the failing test names, two facts that code knows (the commit's changed files by area, and where the same tests failed in the 14 days before), then every failing test's lines. Only CI output and file paths leave the machine, which is within ADR 0010 decision 9.
- **Rebuild:** `node scripts/jev-evals/triage/build-cases.mjs` (it needs `gh`).
- **Run:** `node scripts/jev-eval.mjs triage --model jev-1.13.0` (or `jev-1.14.0`). It needs `TYPESAFE_API_KEY`.

## Results, 2026-10-15 (each model ran the set 5 times; pooled)

Jev is not deterministic. On the same text, confidence moves by up to about 0.1 between calls, and picks near 0.5 flip. So each report pools 5 runs, 250 calls in all, and a safety miss in any run counts against its floor.

| | accuracy (5 runs) | lowest floor with no safety miss | decided at that floor | right at that floor | cost per case | p95 |
|---|---|---|---|---|---|---|
| log only, jev-1.13.0 | 72.0% (72–72) | 0.9 | 36% | 95.6% | $0.00007 | 143 ms |
| log only, jev-1.14.0 | 71.6% (70–72) | 0.8 | 54% | 88.2% | $0.00007 | 144 ms |
| with facts, jev-1.13.0 | 82.8% (80–84) | **0.8** | **56%** | **97.8%** | $0.00007 | 135 ms |
| with facts, jev-1.14.0 | 84.4% (84–86) | 0.9 | 44% | 100% | $0.00007 | 189 ms |

`log-only/` asks the same question with the log alone. There, the wrong flakes are assertion failures that a slow runner caused, such as "exactly one POST, got 0" or "pinch zooms out: 0.55 to 0.55". In the log these look exactly like real bugs. A person labelling them also reads the history: the commit touched only board files, and the same test failed on unrelated commits. The two facts that code knows add about 12 points on both models.

**Against the bar** (den-mvp/40):
- **Accuracy: fail, narrowly.** The better model, 1.14, scores 84.4% against 85%.
- **Safety: pass.** Each model has a floor with no miss in any of 5 runs: 0.8 on 1.13 and 0.9 on 1.14.
- **Cost: pass.** $0.00007 per case, against a bar of $0.001.
- **Latency: pass.** The p95 is under 200 ms, against 3 s. The first call of a session takes about 2 s.

The floor matters more than the headline accuracy. With a floor, a pick below it goes to today's path, and the developer gets the findings. **jev-1.13.0 at a 0.8 floor decides 56% of failures, is right on 97.8% of them, and calls no real failure a flake.** Its only errors at that floor are one flake (the three-digit test that depended on file timestamps) called `code` in 3 of 5 runs. That is the safe side: a fix round where a rerun would have done.

**Caveats.**
- The two facts and the question's wording were written after the first single run's misses had been seen, and nothing was held out. The next real failures in the den are the test that counts.
- After a security review, the scanner's author lines are dropped from the text. That changed 4 cases, and it was the first sign of the nondeterminism.
