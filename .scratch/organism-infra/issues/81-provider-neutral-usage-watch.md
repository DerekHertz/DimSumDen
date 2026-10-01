# 81: Provider-neutral usage watch with Codex rate limits

**Type:** task

**Priority:** P1

**Blocked by:** None

**Status:** resolved

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
- **developer, 2026-10-01:** Developer implementation4fcf134: targeted30/30; full1343/1344 with existing Low-80 environment ancestry failure. Handoff81-developer.md; live Codex RPC unavailable(error-32603), no invented readings.
- **orchestrator, 2026-10-01:** User approved isolated verification via supported unsandboxed execution and fresh TMPDIR, avoiding platform-injected Git ancestry; no guards or tests changed.
- **qa, 2026-10-01:** QA partial: full suite stopped on user usage-limit wrap-up; no verdict. Tests unchanged, AC5/6 reviewed. See81-qa-verify.md; complete full verify next.
- **orchestrator, 2026-10-01:** Wrap-up at user-reported92%used5h; implementation pushed to feat/provider-neutral-usage-watch81 at4fcf134. QA interrupted with no verdict; finish isolated full verify then risk/security next session. No product PR or merge yet.
- **qa, 2026-10-01:** QA pass: isolated full suite1344/1344, zero failures/skips; saved tests unchanged; AC1-4 tests and AC5/6 human review covered. Handoff81-qa-verify-finish.md; security next.
- **scout, 2026-10-01:** Scout handoff: .scratch/organism-infra/handoffs/81-scout-risk.md; risk-check failed with spawnSync git EPERM, merge-tree succeeded.
- **scout, 2026-10-01:** Scout risk-check hit; full security review required. Details: .scratch/organism-infra/handoffs/81-scout-risk-finish.md
- **security, 2026-10-01:** Security pass: no actionable findings. scripts/usage-codex.mjs:38 fixed argv spawn, bounded RPC and kill/reap cleanup; scripts/usage-provider.test.mjs:12,82,97 synthetic secret/credential/spawn fixtures, no real credentials. Four-commit redacted pattern/manual secret scan clean (gitleaks missing); Claude unchanged; no dependency/CI changes. See handoffs/81-security.md.
