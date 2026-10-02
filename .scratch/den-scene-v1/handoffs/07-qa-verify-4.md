# den-scene-v1/07 qa light verify, fix round 4 (designer N1)

QA pass. Branch feat/floating-cards07 at f787331. Verdict: pass.

```json
{
  "ticket": "den-scene-v1/07-sidebar-overlays",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify done at f787331: npm test green twice (1696 of 1696), specify tests untouched, N1 covered by the developer's new test. QA pass; designer re-check of 600-709 and 900-959 px next.",
  "artifacts": [
    ".scratch/den-scene-v1/handoffs/07-qa-verify-4.md"
  ],
  "decisions": [
    "QA pass: no escalation needed, all four light-verify steps resolved by rule",
    "The Ctrl+Enter Note flake did not reproduce in two full npm test runs"
  ],
  "failures": [],
  "pending": [
    {
      "item": "designer look at 600 to 709 and 900 to 959 px (the new test measures text fit and boxes, not looks); user's visual verdict on the 3D scene",
      "owner": "designer"
    },
    {
      "item": "risk-check, then orchestrator PR; N2 (Gated chip contrast) rides with den-scene-v1/13 per the developer",
      "owner": "orchestrator"
    }
  ]
}
```

## Steps

1. `npm test` in the worktree at f787331, run twice: 1696 tests, 1696 pass, 0 fail, 0 cancelled, 0 skipped both times. Matches the developer's /tmp/07-tests-n1.txt. "Ctrl+Enter in the Note sends Deny with that note" passed both runs; no flake seen (the developer's single failure is unreproduced, 1 in 3 full runs overall).
2. `git diff b6ca207 HEAD -- apps/ui/src/overlay/floating-cards.test.mjs` (b6ca207 is the last qa specify commit): one hunk, 20 added lines, nothing removed or changed. No assertion removed or loosened.
3. Criterion-to-test map for this round, all in apps/ui/src/overlay/floating-cards.test.mjs and passing:
   - N1 (placeholder fits, no overlap with zoom or timeline, right gutter, 600 to 1440): "the full intent placeholder fits the input at every width from 600 to 1440..." (developer-added, failed first per the developer).
   - Regression guards still passing: "Ctrl K hint hides under 600px and shows from 600px" (F2), "phone 375 with a coarse pointer..." (F2), "bottom overlays never overlap..." (F1).
   - All earlier criteria: map unchanged from 07-qa-verify-3.md.
   - Human-verified: how the left-anchored bar looks at 600 to 709 and 900 to 959 px (the jump from centred at 900 to x 160 at 899), light and dark.
4. Files touched by `git diff a0fea6c HEAD`: apps/ui/src/styles.css, apps/ui/src/overlay/floating-cards.test.mjs. Both in the ticket's scope.

Note: the new test was written by the developer, not qa. It is behaviour-level (measured text width against input room, bounding boxes), not mock-based.

## Failed calls

- None.
