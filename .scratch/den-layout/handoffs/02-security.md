# Security review: den-layout/02-scene-becomes-the-den

Verdict: Security pass. Branch den-layout/02-scene-becomes-the-den at 52aac2c, diff against origin/main (33 files, 4 commits).

```json
{
  "ticket": "den-layout/02-scene-becomes-the-den",
  "cell": "security",
  "current_step": "Security review done, verdict pass, no critical or high findings. Ticket stays in-review for the orchestrator to open the PR.",
  "artifacts": [
    ".scratch/den-layout/handoffs/02-security.md"
  ],
  "decisions": [
    "Pass: no secrets, no new dependencies, no daemon or network exposure change, no untrusted text reaching a shell, file path or HTML sink.",
    "The seven risk-check hits are false positives or benign (see Hits)."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Open the PR and merge on green CI",
      "owner": "orchestrator"
    }
  ]
}
```

## Checks run
- gitleaks detect --log-opts="origin/main..52aac2c": 4 commits scanned, no leaks.
- npm audit: 0 vulnerabilities. Diff touches no package.json, lockfile, .github/workflows or branch protection.
- Grep of the ported scene and review modules (and App.jsx, bindings, controller, camera) for child_process, eval, new Function, innerHTML, dangerouslySetInnerHTML, fetch, WebSocket, listen, readFile/writeFile, process.env, postMessage, window.open, and http URLs: no hits.
- /security-review not run as a skill; reviewed by hand because the diff is client-side scene code.

## Hits (risk-check)
- apps/ui/den-scene-mounted.test.mjs: spawnSync(process.execPath, ["--test", <three fixed repo paths>]) with no untrusted input and a 90 s timeout. The vite dev server in the test binds host 127.0.0.1, port 0. Clean.
- apps/ui/src/scene/procedural/restaurant.mjs: "secret" is the easter-egg helper (static strings). No credential. Clean.
- traditional-props.mjs, RestaurantDen.jsx, headgear.mjs, tally-expand.test.mjs: matched "board/lock/daemon" words only. No board-file I/O, no network in these files.

## Comments (non-blocking)
- apps/ui/src/review/review-data.mjs:16 low: loadReview reads globalThis.__DIM_SUM_REVIEW__ and localStorage key dimsum-local-review-v2. Both go through normalizeReview, which clamps lengths, enums and numbers, and uses Object.create(null) for placements. Same-origin only, not rendered as HTML. No action needed.
- apps/ui/src/review/review-data.mjs:18 low: download() (blob and anchor click) and reviewHtml() are not reached from the live app, since RestaurantDen imports only loadReview. They are dead code from the standalone review build. reviewHtml escapes "<" in the seed JSON. A later cleanup could drop them.
- apps/ui/src/review/construction-pads.mjs:58 low: draws plot-sign text on a canvas texture with fixed strings, so it is not an HTML sink.
- apps/ci-cd/smoke-ui.mjs: only selectors and sign names changed, and the walk check is removed (user-approved, den-layout/04 re-adds it).
