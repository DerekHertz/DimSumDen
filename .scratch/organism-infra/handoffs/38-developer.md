```json
{"ticket":"organism-infra/38-jev-script","cell":"developer","mode":"implement","current_step":"done, in-review","artifacts":["scripts/jev.mjs","scripts/risk-check.mjs"],"decisions":["real transport = Node fetch to POST https://api.typesafe.ai/v1/systemone (Bearer key), per https://docs.typesafe.ai/api.md; no dependency","cost = usage.input_tokens * 0.042/1e6 (API returns tokens, not cost)","risk-check.mjs exports SECRET_PATTERNS and runs main only when invoked directly","CLI board root: ORGANISM_ROOT, else first entry of git worktree list, else cwd"],"failures":[],"pending":[{"item":"human-verify the fetch adapter with a real TYPESAFE_API_KEY (untested; needs the user's key)","owner":"user"}]}
```

# Handoff: organism-infra/38, developer

- 12 qa tests pass; full `npm test` 302/302.
- Transport finding: plain HTTP suffices. `POST https://api.typesafe.ai/v1/systemone`, `Authorization: Bearer <key>`, body `{state, model, questions:{<point>:{type:"choice", instructions, criteria}}}`; response `answers.<point>.{choice, probabilities, confidence}` and `usage.{input_tokens,output_tokens}`. Source: https://docs.typesafe.ai/api.md. No SDK, no dependency.
- Unverified: the real fetch adapter (no key used), and whether the API accepts the pinned name `jev-1.13.0` as a request model (docs show `jev-latest`; the response echoes `jev-1.13.0`).
- Only the scope of the ticket touched; risk-check change is the export/main-guard needed by the pinned contract.
