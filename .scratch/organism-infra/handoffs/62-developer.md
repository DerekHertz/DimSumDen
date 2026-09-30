```json
{"ticket":"organism-infra/62-handoff-name-matches-ticket","cell":"developer","current_step":"implemented, pushed, in-review","artifacts":["apps/organism-infra/board-service.mjs","branch organism-infra/62-impl"],"decisions":["publishHandoff refuses a --name with an NN- prefix differing from the ticket's, error names the expected prefix.","With a claim lock, an existing dest older than the lock is refused regardless of cell/mode; no-lock behavior unchanged."],"failures":[],"pending":[{"item":"qa verify","owner":"qa"}]}
```

## Summary

Two guards added in publishHandoff. qa's 4 tests pass, unmodified. Full npm test: 877/878; the one failure is smoke:ui, caused by net::ERR_CERT_AUTHORITY_INVALID fetching Google Fonts in the sandbox (environmental, unrelated).
