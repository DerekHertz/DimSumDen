# den-scene-v1/07 qa light verify, fix round 2

QA pass. Branch feat/floating-cards07 at a0fea6c. Verdict: pass.

```json
{
  "ticket": "den-scene-v1/07-sidebar-overlays",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify done at a0fea6c: npm test all green, test file unchanged since specify b6ca207, every round criterion mapped. QA pass; designer re-review next.",
  "artifacts": [
    ".scratch/den-scene-v1/handoffs/07-qa-verify-3.md"
  ],
  "decisions": [
    "QA pass: no escalation needed, all four light-verify steps resolved by rule"
  ],
  "failures": [],
  "pending": [
    {
      "item": "designer re-review at 1440, 1280, 1024, 900 and 375 (visual: stacked switcher, m chip placement, autonomy tooltip, light and dark)",
      "owner": "designer"
    },
    {
      "item": "risk-check, then orchestrator PR; ticket 'What to build' item 4 still says 'next 8'; AUTONOMY_MODES export in overlay-model.mjs now unused (developer note)",
      "owner": "orchestrator"
    }
  ]
}
```

## Steps

1. `npm test` in the worktree at a0fea6c: 1695 tests, 1695 pass, 0 fail, 0 cancelled, 0 skipped (matches the developer's /tmp/07-tests.txt).
2. `git diff b6ca207 HEAD -- apps/ui/src/overlay/floating-cards.test.mjs`: empty. No assertion removed or loosened.
3. Criterion-to-test map (from 07-qa-specify-fix2.md, all in apps/ui/src/overlay/floating-cards.test.mjs, all passing):
   - accessibility basics (organ regex fix)
   - "deny with message: the Note label carries an 'm' chip..."
   - "Ctrl+Enter in the Note sends Deny with that note..."
   - "'j' and 'k' are announced..." (F7)
   - "autonomy chip shows the mode and is disabled..." (F3)
   - "bottom overlays never overlap..." (F1)
   - "Ctrl K hint hides under 600px..." (F2)
   - "phone 375 with a coarse pointer..." (F2)
   - Human-verified (per specify): visual look of the stacked switcher, m chip and helper placement, j/k reader quality, autonomy tooltip, light and dark, designer re-review.
4. Files touched by `git diff b6ca207 HEAD`: apps/ui/src/overlay/Bottom.jsx, apps/ui/src/overlay/Cards.jsx, apps/ui/src/styles.css. All are overlay UI; none outside the ticket's apparent scope.

## Failed calls

- None.
