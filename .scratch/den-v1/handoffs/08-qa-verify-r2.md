# 08 qa verify r2 handoff

```json
{
  "ticket": "den-v1/08-remove-market-scene",
  "cell": "qa",
  "mode": "verify",
  "current_step": "QA pass on feat/08-remove-market-scene @ 29875f1 (full verify, fix round 1). The one npm test failure is an unrelated flake in apps/organism-infra.",
  "artifacts": ["feat/08-remove-market-scene @ 29875f1"],
  "decisions": [
    "Own npm test at 29875f1: 1797 tests, 1796 pass, 1 fail, 0 skipped. The failure is apps/organism-infra/board-status-and-lock.test.mjs:159 'a write lock released mid-wait lets the waiting command succeed' (write-lock wait gave up after 2500ms, exit 75 not 0). Same single failure as the orchestrator's run.",
    "Flake judgment: that file passes 12/12 when run alone; the branch diff against c689902 touches nothing under apps/organism-infra; the test is timing-based (lock released mid-wait under a 2500ms budget) and fails under full-suite load. Not caused by this branch.",
    "git diff 1884c12 HEAD for apps/ui/reachability.test.mjs is empty (no weakened assertions). apps/ui/src/overlay/floating-cards.test.mjs is byte-identical to 3df1033 (git diff empty). reachability + floating-cards: 40/40 pass, 0 skipped.",
    "ui:build builds (chunk-size warning only). smoke:ui exit 0, 11 PASS, no FAIL.",
    "Branch diff outside apps/ui: apps/ci-cd/dev-server-bind.test.mjs, apps/ci-cd/dev-server.test.mjs (served-file fixture retargets), packages/character-director/src/director.mjs (comment) and director.test.mjs (frozen copy). Listed, not judged; accepted in verify r1."
  ],
  "failures": [],
  "pending": [
    {"item": "Risk-check, then PR and merge on green CI per relay. If CI hits the board-status-and-lock.test.mjs:159 flake, rerun CI; consider a ticket to widen that test's wait budget.", "owner": "orchestrator"},
    {"item": "Decide on packages/character-director, stale prose mentions, 125 (carried from developer handoffs).", "owner": "orchestrator"}
  ]
}
```

## Criterion to test map (verify r2)

| Criterion | Covered by | Result |
|---|---|---|
| No file unreachable from main.jsx except tests of reachable modules | apps/ui/reachability.test.mjs "no file under apps/ui/src or apps/ui/public is unreachable ..." plus restored floating-cards.test.mjs (33 tests) | pass |
| Live-App browser tests survive the removal | reachability.test.mjs "browser tests that mount the live App survive the removal ..." | pass |
| No .glb outside .scratch/ | "no .glb remains in the repo outside .scratch/" | pass |
| ui:build, npm test, smoke:ui green, count drop listed | human-verified; qa ran all three | build and smoke green; npm test green except the unrelated flake; drop listed in developer handoff (2037 to 1797 with the restored test) |
