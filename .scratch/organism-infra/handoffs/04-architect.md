```json
{"ticket":"organism-infra/04-jev-precheck-design","cell":"architect","current_step":"ADR 0010 written; follow-ups proposed in ticket Comments, not published","artifacts":["docs/adr/0010-jev-precheck-tier-and-verify-depth.md"],"decisions":["jev row gains ts, conf, mode, fallback, ms, model beyond the grill's six fields (ts needed for the daily cap)","diff metadata is not an input in shadow mode","fallback = genome model and full verify","tier point picks sonnet|opus only; light verify is the sole dispatch below a genome model","ticket's resolved-ticket and local-model trial is superseded by shadow mode"],"failures":[],"pending":[{"item":"publish follow-ups A-E from the ticket Comments after the user approves; ask the user about the CONTEXT.md terms (minimum tier, shadow mode, verify depth)","owner":"orchestrator"}]}
```

## State

Done. ADR 0010 accepted; implementation gated on the user's yes for a dependency (if needed) and TYPESAFE_API_KEY.

## What changed

Only `docs/adr/0010-jev-precheck-tier-and-verify-depth.md` (uncommitted, main checkout) and a ticket comment. No ADR or genome edited; ADR 0001 is not contradicted (Jev is not the Claude API), stated in the ADR context.

## Decisions made

See the State block. The exit criteria (coverage, safety, value, spend) are in ADR decision 10; thresholds other than the grill's 30% (fallbacks at most 1 in 5, median 2000 ms, jev cost under 1% of ticket usage) are my picks and easy to change.

## Next step

Orchestrator: show the user the follow-ups (ticket Comments), get approval, then publish. Ask about CONTEXT.md terms.

## Suggested skills

organism-protocol, to-tickets.

## Gotchas

- The orchestrator genome and qa genome changes are `.claude/` edits (permission needed).
- Secondary sources say the Jev SDK is Python only; check primary docs before adding a Node dependency.
- Retention and pricing facts are unverified against TypeSafe's primary docs; security should check.

## Tool refusals

none
