```json
{"ticket": "organism-infra/58", "cell": "developer", "mode": null, "current_step": "implemented, committed, pushed on organism-infra/58-impl",
 "artifacts": ["scripts/jev.mjs"], "decisions": ["result.applied is false when the floor overrides Jev's pick (live light -> full)", "CLI qaSpecified false when the handoffs dir is missing or the slug has no leading number"],
 "failures": [],
 "pending": [{"item": "qa verify (full or light, qa specified so light allowed)", "owner": "qa"}]}
```

## State
Done: floor implemented; the 10 new jev-floor tests and 13 existing jev tests pass. npm test: 836 pass, 6 fail, all playwright-not-installed smoke tests (tests 24-27, 31, 32), unrelated.

## What changed
scripts/jev.mjs: decide gains qaSpecified (default true); verify with qaSpecified false gives effective/actual full and floor "full" on row and result. CLI reads handoffs/<NN>-qa-specify*.md.

## Next step
qa verify, then risk-check.

## Gotchas
Branch organism-infra/58-impl is ff from organism-infra/58-tests. Smoke failures need PW_CHROMIUM_PATH / playwright in this cloud session.
