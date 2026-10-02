# Handoff: organism-infra/94 developer

## State

```json
{
  "ticket": "organism-infra/94-ci-flaky-browser-tests",
  "cell": "developer",
  "current_step": "Fix committed on fix/ci-flaky-browser-tests94 (108a61b, base dca2797). New apps/ci-cd/light-scene.mjs (+ unit test) is used by tally-expand.test.mjs and smoke-ui.mjs. Full npm test green (1633 pass, 0 fail, 46 s on 8 cores). No .github/workflows change was needed. Criterion 3 (ten CI runs) is met by a documented local equivalent; a real ten-run CI check is left for after the PR opens.",
  "artifacts": [
    "apps/ci-cd/light-scene.mjs (new)",
    "apps/ci-cd/light-scene.test.mjs (new, 9 tests)",
    "apps/ci-cd/smoke-ui.mjs (3 lines)",
    "apps/ui/src/scene/tally-expand.test.mjs (import + 2 lines in openApp; no assertion touched)"
  ],
  "decisions": [
    "Skip draw calls and delay rAF 100 ms in the page (init script), rather than touching the app or the tests' assertions.",
    "smoke:ui gets the same helper; smoke --url (clean load) and station-hues-live keep real rendering, so real-draw coverage stays.",
    "No workflow change: the speed-up makes a separate job unnecessary, so the security gate is not triggered.",
    "Rejected: larger rAF delay (500 ms failed the abacus test under load), sharing one page across tests (loosens isolation), --test-concurrency (CI runner is 2 vCPU, so node already runs one file at a time)."
  ],
  "failures": [],
  "pending": [
    {
      "item": "After the PR opens, rerun CI ten times (gh run rerun) or watch ten pushes; confirm no 'Timeout 8000ms/10000ms exceeded' and no cancellation. The local equivalent is below.",
      "owner": "orchestrator"
    },
    {
      "item": "qa verify; note the fidelity trade: tally-expand and smoke:ui no longer rasterise pixels (draws are no-ops). Nothing in them reads pixels.",
      "owner": "qa"
    }
  ]
}
```

## Finding: the measured cause

**Cause: the scene is rasterised on the CPU, and that starves the browser test.** Headless Chromium on the runner has no GPU, so WebGL runs on SwiftShader (the page reports `ANGLE (... SwiftShader driver)`). The scene issues about 230 draw calls per frame (counted by wrapping `drawElements`/`drawArrays`: 456-472 per two frames). A frame blocks the page's main thread for 100-200 ms even at a 640x400 viewport (same 5 fps as at 1280x800, so it is per-draw cost, not fill rate). CDP metrics over 2 s: TaskDuration 2.28 s, ScriptDuration 0.02 s, so the main thread is 100% busy inside GL calls, not in JS.

Measured on 2 pinned cores (`taskset -c 0,1`), one boot: 5 fps; pill visible 3.3 s after load; click to dialog 3.7-4.7 s. On 8 cores it is still 9 fps and a click takes 1.4-1.6 s. So the 8 s (tally-expand) and 10 s (smoke:ui) click timeouts sit within 2x of the unloaded cost on a 2-core box, and any extra load tips them over. Playwright's click needs the element stable across two frames, and every frame is a 200+ ms stall.

**Why it got slow after Tally 05 and flaky:** each of the 18 tests boots its own page and pays that cost (about 8-10 s each locally on 2 cores, 13-42 s on CI). The repo is private, so the runner is 2 vCPU and `node --test` concurrency is 1; files run one after another, so there was no cross-file contention. The hypothesis in the ticket (parallel files competing) is not the cause. The contention is inside one test: Chromium's main thread, its SwiftShader threads, the Vite dev server, Playwright's driver and the test runner all share 2 cores.

**CI timings (logs of runs 36890740628 pass, 36892672737 fail, 36899639408 fail):**

- Run list: before 15:41 UTC today CI took 2.5-5 min; from the first run after the Tally expand tests landed (15:46) it takes 6-10 min, and 11-25 min on the bad ones.
- 36890740628 (pass, 8.2 min = 490.7 s): the 18 tally-expand tests took 348 s together (12.7-41.8 s each), smoke:ui 30.1 s, smoke --url 11.8 s. That is 391 s of 491 s (80%); the other 1,400 tests take about 100 s.
- 36892672737 (main, fail): smoke:ui failed at 26.7 s; the first tally test ("click on the pill opens the card in place") failed after 28.4 s; the other 17 took 13.9-46.6 s each.
- 36899639408 (main, fail, a fourth failure after the three in the ticket): smoke:ui failed at 26.2 s with `chart: ... locator.click: Timeout 10000ms exceeded` on `.chip-tally`, element "not visible" while retrying. The tally file ran 17:30:58 to 17:37:36 = 398 s; the two slowest tests took 53 s and 46 s.
- Both flaky tests are the first browser boot in their process (first tally test; smoke:ui), the most expensive one. 36894900261 was cancelled by the 15-minute limit with no test failing: the suite simply ran past 15 min on a slow runner.

**Reproduction.** On 2 pinned cores with 2 busy loops added, unfixed, the two browser files take 438 s, matching CI (about 430 s). That is the load I used for every "under load" number below. (Locally I did not reproduce an actual click timeout, only the same per-test durations, 11-35 s; the fix removes the cause, so it was never needed.)

## The fix

`apps/ci-cd/light-scene.mjs` exports `lightenScene(context, options)`, a page init script with two levers:

1. `skipDraws` (default on): the five WebGL draw calls become no-ops on both context versions. The scene graph, React tree, CPU raycasting (the abacus click test still passes) and the DOM are unchanged; only pixels are never rasterised. This is the big win: a boot plus click drops from about 10.5 s to 2.3-2.9 s on 2 cores, and from about 10 s to 3-4 s under load.
2. `frameDelayMs` (default 100): each rAF callback is held 100 ms, so the render loop's JS leaves the thread idle. Playwright's own rAF checks run in its utility world and are not delayed.

Used by `tally-expand.test.mjs` (in `openApp`) and `smoke-ui.mjs`. Not used by `smoke --url` (clean-load check) or `station-hues-live`, which keep real rendering. No assertion, timeout or test was changed or removed; the diff to `tally-expand.test.mjs` is one import and two lines.

## Results (2 pinned cores + 2 busy loops, the CI-like load; both browser files)

| Config | Time |
|---|---|
| Unfixed | 438 s (CI: about 430 s) |
| rAF delay 250 only | 239 s |
| rAF delay 500 only | 225 s and the abacus test failed |
| Draws skipped + 100 ms delay (shipped) | 68 s (0.16x) |

Unloaded 2 cores: 257 s before, 69-105 s with delay-only variants. Shipped config under load: **10 consecutive runs of tally-expand + smoke:ui + light-scene tests: 10/10 exit 0, 31/31 tests each, 0 click timeouts, wall 61-97 s each.** (Another session was also running these tests on the machine during the loop, so the load was heavier than planned.)

## Acceptance criteria

- [x] Written finding with CI log timings: above.
- [x] Browser tests under half their time: 438 s to 68 s under CI-like load (0.16x); 257 s to about 70-100 s unloaded. No separate job needed.
- [~] Ten consecutive runs: local equivalent done (above). A ten-run CI check needs the PR to exist; see pending.
- [x] No test removed or loosened: same 18 tally tests and same smoke:ui checks, assertions untouched. Full `npm test`: 1633 pass.
- [x] No `.github/workflows` change, so nothing for the security cell.

## Notes for qa and the orchestrator

- Fidelity trade: with draws skipped, a regression that only shows as a GL error at draw time would not surface in tally-expand or smoke:ui; `smoke --url` and `station-hues-live` still render for real. Shader compile errors would still surface at link time.
- Observation, not acted on: the first test in each process costs 2x the others on CI (28-33 s vs 15 s). Opening the card once inside `before()` (the warm-up only loads the page) would move that one-time cost out of the first test. Out of scope here; worth a small ticket if it flakes again.
- Possible follow-up if CI is still slow: the floor is now page boot (about 2 s per test, 20 boots).
- Running 7+ minute browser suites left a stray process from another session on this machine (`node --test --test-concurrency=4 ... smoke-ui.test.mjs tally-expand.test.mjs smoke.test.mjs`); it is not mine.
