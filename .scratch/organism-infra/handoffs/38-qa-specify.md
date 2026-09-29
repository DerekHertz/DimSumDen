```json
{"ticket":"organism-infra/38-jev-script","cell":"qa","mode":"specify","current_step":"12 failing tests committed on tests/organism-infra-38-jev-script (ERR_MODULE_NOT_FOUND: scripts/jev.mjs)","artifacts":["scripts/jev.test.mjs"],"decisions":["decide/transport/CLI contract pinned below"],"failures":[],"pending":[{"item":"implement scripts/jev.mjs, export SECRET_PATTERNS from risk-check.mjs","owner":"developer"}]}
```

# Handoff: organism-infra/38, qa specify


## Criterion to test map
- tier/verify return pick/conf and append a jev row: "tier point...", "verify point...", "verify input includes tests", "live mode applies max", CLI no-key row append.
- every fallback reason exits 0 and logs fallback: "every fallback reason..." (no-key, network, http, timeout, unparseable x2, blocked-input), verify-tests secret block, CLI no-key/verify exit 0, CLI exit 2 on bad args.
- cap -> fallback `cap` without a call: "cap reached", "cap counts only kind:jev rows from today's UTC date".
- shadow default: decide without `mode` gives row.mode shadow and actual = fallback default; CLI row mode shadow.
- Also: 16k tail truncation, API key never in row/result.

## Contract I pinned (ADR left it open; developer must match)
- `decide({point, ticket, ticketText, testsText, now, usageRows, env, mode, timeoutMs, transport})` is async, returns `{result, row}`. `ticketText`/`testsText` are already-read strings (the CLI reads files); `env` holds TYPESAFE_API_KEY; `timeoutMs` default 10000.
- `transport({point, text, model, apiKey, signal})` returns `{pick, probs, usage:{cost}}`; pick is the Jev label (standard|hard|other, light|full|other). Mapped: standard->sonnet, hard->opus. `conf = probs[pick]`. `text` is input only, <= 16000 chars, tail-truncated.
- result: `{pick, conf, effective, applied, fallback}`; row per ADR decision 5.
- Fallback reasons: no-key, network, http, timeout, unparseable, blocked-input, cap. Timeout must race a never-resolving transport.
- Fallback effective: tier sonnet, verify full. Live: tier hard -> opus, verify light -> effective/actual `light`.
- CLI: board root = `$ORGANISM_ROOT` else cwd; ticket at `<root>/.scratch/<feature>/issues/<NN-slug>.md`; row appended to `<root>/.scratch/usage.jsonl`; one JSON line on stdout; exit 2 on invalid args (no/unknown point, missing --ticket, bad --mode).
- Secret patterns: reuse `SECRET_PATTERNS` from `scripts/risk-check.mjs` (not exported today; developer must export it).

## Not tested (no primary-doc HTTP transport yet)
The real `fetch` adapter is untested; ticket says check TypeSafe primary docs first, and dependency/key setup need the user's yes. Mark that adapter human-verified.
