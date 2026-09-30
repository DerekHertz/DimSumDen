```json
{"ticket":"organism-infra/51-handoff-validates-at-publish","cell":"qa","mode":"specify","current_step":"fix round done: release-gate test now claims as developer","artifacts":["apps/organism-infra/board-handoff-validate.test.mjs","branch organism-infra/51-wip @ 2093a79"],"decisions":[{"decision":"test 'a filled-in handoff satisfies the release gate' claims as developer, since qa may not release at in-review (board-service.mjs:967)","why":"keeps the criterion (a filled handoff passes the release gate) without violating the role rule"}],"failures":[],"pending":[{"item":"light verify or full verify of branch","owner":"qa"}]}
```

## Summary

Fixed the defect at board-handoff-validate.test.mjs:145. The test now claims as developer, publishes a valid State block, and releases at in-review. No product code changed. All 15 tests in that file pass (0 skipped). Criterion-to-test map is unchanged. Commit 2093a79 pushed to origin/organism-infra/51-wip.
