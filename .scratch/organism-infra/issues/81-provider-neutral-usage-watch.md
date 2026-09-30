# 81: Provider-neutral usage watch with Codex rate limits

**Type:** task

**Priority:** P1

**Blocked by:** None

**Status:** ready-for-agent

## What to build

User explicitly requested real Codex usage in usage-watch and a model agnostic pipeline. Preserve existing Claude usage behavior and canonical 5-hour/weekly percent/reset output; add explicit provider selection and a Codex adapter using the supported app-server account/rateLimits/read JSON-RPC method. The orchestrator owns the authorized usage-watch skill update. No credential-file extraction/copy, no model execution, no invented readings. Broader role/model registry refactoring is a follow-up.

## Acceptance criteria

- [ ] Explicit --provider claude|codex selects independent adapters; legacy Claude invocation stays compatible.
- [ ] Codex initializes app-server, requests account/rateLimits/read, selects Codex limits, maps 300/10080-minute windows to canonical 5-hour/weekly fields, and converts Unix-second resets to ISO.
- [ ] Invalid/missing windows, RPC/CLI/auth/network errors and bounded timeouts exit nonzero with sanitized diagnostics; child processes and temporary runtime state are cleaned up. No stale/manual/Claude estimate is presented as live Codex usage.
- [ ] Protocol/normalization/failure tests exercise meaningful exchanges, including swapped windows and unrelated product limits. Existing Claude tests continue passing.
- [ ] usage-watch documents provider selection, source attribution, manual unavailable fallback and provider-specific plan assumptions while preserving 80/90-percent thresholds.
- [ ] Live supported Codex invocation is tested and its actual success or environment limitation reported honestly.

## Comments

- Source: user request in current session; expressly authorized alongside finishing design01 at reported120k context/53-percent five-hour usage.
- Verified capability: installed Codex CLI has ChatGPT authentication; supported permission escalation permits app-server initialization and account/rateLimits/read. Fetch failed at https://chatgpt.com/backend-api/wham/usage; do not request duplicate credentials. Runtime initialization needs writable SQLite state and may require the supported filesystem/sandbox permission flow.
- **qa, 2026-09-30:** QA specify: e3df3af, 26 intentional red + 4 green targeted tests; 81-qa-specify.md maps AC1-4. AC5 skill review and AC6 live supported invocation are human-verified by orchestrator.
