# den-scene-v1/07 qa light verify, round 5 (haze fix, merge of origin/main)

QA pass. Branch feat/floating-cards07 at dd3443a. Verdict: pass.

```json
{
  "ticket": "den-scene-v1/07-sidebar-overlays",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify done at dd3443a: npm test 1744 of 1744 on two of three runs (one run had a single known flake), specify tests untouched, the merge left 07's overlay work byte-identical, the new fog test is sound, haze criteria mapped. QA pass.",
  "artifacts": [
    ".scratch/den-scene-v1/handoffs/07-qa-verify-5.md"
  ],
  "decisions": [
    "QA pass: no escalation needed; all four light-verify steps resolved by rule",
    "Run 1 had one red (the known Ctrl+Enter Note flake); runs 2 and 3 were fully green, so not a bounce, same call as round 4"
  ],
  "failures": [
    "npm test run 1: 1743 of 1744, one fail: 'Ctrl+Enter in the Note sends Deny with that note...' (floating-cards.test.mjs:287, expectPost saw no POST). Same flake the developer and qa saw in earlier rounds; green on runs 2 and 3."
  ],
  "pending": [
    {
      "item": "The Ctrl+Enter Note test is flaky (about 1 full run in 3 now, across three rounds). The code under it is unchanged by this round. Worth a small ticket to deflake (wait for the Note to hold the text and focus before sending the chord).",
      "owner": "orchestrator"
    },
    {
      "item": "risk-check, then PR; den-scene-v1/14 resolves with 07's PR. The developer's pending designer re-look is covered by the user's own haze verdict on the dd3443a renders.",
      "owner": "orchestrator"
    }
  ]
}
```

## Steps

1. `npm test` in the worktree at dd3443a, three runs. 1744 tests each run, 0 cancelled, 0 skipped.
   - Run 1: 1743 pass, 1 fail: the Ctrl+Enter Note test (floating-cards.test.mjs:287, "exactly one POST /requests, got []"). Known flake, seen in earlier rounds.
   - Runs 2 and 3: 1744 of 1744 pass, 0 fail.
   - The developer's two unrelated reds (dev-server-bind, Codex rate-limit) did not appear in any of my runs.
2. `git diff b6ca207 HEAD -- apps/ui/src/overlay/floating-cards.test.mjs` (b6ca207 is the last qa specify commit): one hunk, 20 added lines (the round-4 N1 placeholder-fit test, already verified in 07-qa-verify-4), nothing removed or changed. No assertion removed or loosened.
3. Did the merge leave 07 intact? `git diff f787331 HEAD` over `apps/ui/src/overlay`, `styles.css`, `App.jsx`, `panel/`, `camera-store.mjs`, `CameraRig.jsx`, `camera-rig.mjs` and `apps/ci-cd` is empty (0 lines). The overlay work, camera store and rig are byte-identical to the verified f787331. The only other tests that moved are den-iso-v1/04's scene tests from origin/main (banquet-layout, dressing, pad-chip, horseshoe, grove and so on), which came in with the merge, plus the new fog test.
4. Criterion-to-test map for the haze round (ticket 14, folded into 07):
   - Haze gone, scene renders without it in light and dark: root cause is the old `Fog(18, 40)`. Automated guards: `grove.test.mjs` "fog is grove-mist and starts beyond the market..." (fog.near > farthest market point over the default frame and both zoom ends, two viewports) and the new `fog-zoom-range.test.mjs`. The look itself is human-verified: the user's verdict on the dd3443a renders is "haze gone" (ticket comment, 2026-10-02).
   - Cause found and recorded: human-verified, in 07-developer-5.md (Fog 18/40 on an orthographic camera 40 units out; market 31.7 to 48.2 units away).
   - Pale shape on Bao's head explained: human-verified, in 07-developer-5.md (the orchestrator panda on the Pass perch, fogged; by design per ADR 0013). Nothing to fix or ticket.
   - The `material.fog = false` hack on Bao is gone (grep finds no `material.fog` in apps/ui/src), so Bao and the market share one fog.
   - All earlier 07 criteria: map unchanged from 07-qa-verify-3.md and 07-qa-verify-4.md.
5. Files touched by `git diff f787331 HEAD` outside 07's overlay scope (listed, not judged): the merge brings origin/main's den-iso-v1/04 scene files (`apps/ui/src/scene/` Backdrop.jsx, Den.jsx, banquet-layout.mjs, dressing.mjs, grove.mjs, pad-chip.mjs, market-extent.fixture.mjs and their tests), plus `scripts/` changes (dispatch-context, jg, risk-check and jev tests, test-fixture-secrets) and `.scratch/` board and handoff files. The only commit authored on the branch this round is `fog-zoom-range.test.mjs`.

## Is the new fog test sound

`apps/ui/src/scene/fog-zoom-range.test.mjs` (63 lines, one test). Yes:
- It drives the real camera store (wheel, pinch, + and -, levels 1 to 3, every station pill) and `clampTarget` the way the rig does, over six canvas sizes (320x480 to 2560x1440), then asks `cameraConfig` where the camera sits. No mocks.
- The market points come from the shared fixture (stalls, table, Tally, Bao, pads, bamboo, stones). The expected bound is `FOG_NEAR` imported from grove.mjs, which `groveFog` uses, so the test and the scene read the same constant. The assertion is an inequality with a measured margin (48.18 vs 49), not a recomputation of the code's own value.
- It would have failed on the old branch (Fog near 18, market at 31.7 to 48.2). The developer notes it was green on first run because the merge already fixed the cause; it is a regression guard. I did not run a mutation of grove.mjs (qa writes no product code); the sensitivity follows from the arithmetic above.
- Limit: the margin is under 1 unit, so a future change to the camera distance, market size or pan clamp will trip it first. That is the intent.

## Failed calls

- None.
