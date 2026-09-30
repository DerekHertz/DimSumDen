# Handoff: organism-infra/62 qa verify (light)

## State

```json
{
  "ticket": "organism-infra/62-handoff-name-matches-ticket",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify done: QA pass. 877 pass, 1 expected smoke:ui fonts failure, 0 skipped.",
  "artifacts": ["apps/organism-infra/board-handoff-name-prefix.test.mjs"],
  "decisions": ["Test file unchanged since specify a045e24", "Only board-service.mjs touched by impl 2e9debb"],
  "failures": ["smoke:ui load fails on Google Fonts (expected, fixed by f6be2f4 on main)"],
  "pending": []
}
```

## Steps
1. npm test with PW_CHROMIUM_PATH set: 877 pass, 1 fail, 0 skipped. The one failure is smoke:ui "load" (Google Fonts, expected). Without PW_CHROMIUM_PATH, 5 smoke tests fail from missing playwright (env only).
2. git diff a045e24 HEAD on the test file: empty. No assertion removed or loosened.
3. Criteria map, all in apps/organism-infra/board-handoff-name-prefix.test.mjs:
   - different prefix refused, file untouched: line 22
   - error names expected prefix: line 39
   - cross-claim overwrite refused, own draft allowed: line 63
   - (extra) matching prefix still accepted: line 51
4. Files touched by 2e9debb: apps/organism-infra/board-service.mjs only (12 lines added). In scope.
