```json
{"ticket": "organism-infra/42-jev-data-exposure-check", "cell": "security",
 "current_step": "Research done: TypeSafe primary docs read; pricing confirmed, training and retention cited; verdict on extending ADR 0010 decision 9 to handoff text and diffs given below.",
 "artifacts": [],
 "decisions": ["Pass for the research ticket. Handoff text and diffs may be added to the Data exposure list only on the conditions under Next step, and only on the user's yes (ADR change is a pass gate)."],
 "failures": ["trust.typesafe.ai/subprocessors is a JS-rendered Vanta page; the subprocessor list could not be read with curl, so it is unverified."],
 "pending": [
  {"item": "User decides: accept TypeSafe's unbounded retention for ticket text, test output, and (if approved) handoffs and diffs, or ask sales@typesafe.ai about zero data retention first.", "owner": "orchestrator"},
  {"item": "After the user's yes: edit ADR 0010 decision 9 and its Open bullet with the cited facts below; record the extension for handoffs and diffs.", "owner": "architect"},
  {"item": "Before any handoff or diff call (shadow included): extend scripts/exposure.mjs SECRET_PATTERNS and add a per-file diff filter (below).", "owner": "developer"}
 ]}
```

## State
Done. Security pass on the research ticket. The ADR text is not edited (gate).

## Findings (primary sources, read 2026-10-07)
Pricing, https://docs.typesafe.ai/models.md: jev-1.13.0 is $0.042 per Mtok ($42 per Btok), charged on input tokens only, output free. Limits 100K tokens/s and 80 req/s, "adjusting dynamically". Context 64k tokens per request, 32k for state plus the longest question. ADR 0010's price is confirmed; its "secondary sources" label can become a primary citation. Credits are prepaid and expire in 12 months (MCA 8.2); auto-refill is opt-in, so leave it off.

Training:
- Privacy policy (updated 2025-11-19): "will not train or fine tune any AI or ML models on your prompts or other Input"; Input is not disclosed to third parties other than service providers.
- MCA 4.1 (updated 2026-09-23): Customer Data will not be put in a dataset used to modify model weights without prior consent.
- models.md: not trained on customer requests or responses; no per-account fine-tuning.
- Caveat (medium): MCA 4.1(c) and the "Telemetry" definition let TypeSafe derive "technical logs, hashes, summary statistics and classifications, metrics, and learnings" from Customer Data in perpetuity and use it "without restriction, including to improve the Services". The no-training promise is about model weights; Telemetry is wider and vague.

Retention (medium): no period is stated anywhere. DPA Schedule I: retained "as long as necessary" for the purpose. Privacy policy: "as long as reasonably necessary ... or otherwise in support of our business or commercial purposes", deleted on request (personal data only). MCA: TypeSafe has no duty to store and may delete at any time; backups may keep Confidential Information; fraud-monitoring use is perpetual. Zero data retention exists for enterprise only, via sales (legal.md). This answers ADR 0010's open retention question: unbounded and unspecified, no self-serve opt-out.

Not verified: subprocessor list (see failures); what terms your account accepted at checkout (the MCA binds the "Customer" named in the order).

## Extension to handoff text and diffs
Context that lowers the risk: the repo is public (gh: PUBLIC) and 865 handoff files are tracked, so merged diffs, tickets and handoffs are already public. The residual exposure is unpushed branch work and anything the scanner misses.
- Handoff text: acceptable, conditions below. Medium.
- Diffs: acceptable for `origin/main..branch` only, conditions below. Medium. Never the working tree, never `git log` metadata (author emails).
Conditions (all before the first call, shadow included):
1. scripts/exposure.mjs:8-33, medium: SECRET_PATTERNS misses a Google API key shape, Slack webhook URLs, a bare PEM body without its header, bare long hex or base64 strings after a key-like word, and prose passwords. Probed with synthetic strings, none blocked. Add them; keep fail-closed (`blocked-input`), scan before truncation as jev.mjs:249 does.
2. scripts/exposure.mjs:40-51, low: DENIED_PATHS is applied to the `--tests` path only. A diff needs it per file: drop denied files' hunks (and binary files), do not send them. The `hidden path` rule also drops `.github/` and `.claude/` hunks; keep that.
3. Diff cut: truncate at file boundaries, not mid-hunk, and scan removed (`-`) lines too, since a deleted secret still sits in the diff.
4. docs/adr/0010 line 79, low: says the SDK is Python only. A JavaScript SDK (`@typesafe-ai/sdk`) exists; still unneeded, `fetch` stays and any dependency stays gated.
5. Re-check the three legal pages when the MCA date moves past 2026-09-23; record the dates in the ADR.

## Gotchas
- gitleaks on `.scratch` (no-git, redacted) found 3 hits: handoffs/38-security.md:13 and issues/08-risk-sized-review.md:32 (twice). Both lines are pattern examples and hasSecret blocks them, so a handoff that quotes a pattern example will fail closed, which is the safe direction.
- Fetched pages were treated as data; extracted text sat under the scratchpad, nothing was written to the repo.

## Suggested skills
domain-modeling (ADR edit).
