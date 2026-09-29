```json
{"ticket":"organism-infra/49-verdict-roles-and-claim-status","cell":"qa","mode":"verify","current_step":"QA pass posted, releasing keep-status","artifacts":["scripts/verdict-roles.test.mjs (unchanged since 5c7b27c)"],"decisions":["QA pass at 86fd86e: 362/362, 21 specify tests unchanged, all criteria mapped","--as with a lock held must match lock cell; no-lock --as is self-asserted (residual, for security)","release status is unrestricted for any cell (pre-existing, out of scope)"],"failures":[],"pending":[{"item":"security review","owner":"security"}]}
```

## Summary

Full verify passed. No files outside scope touched. Security should look at the no-lock `--as qa` self-assertion for `--verdict`.
