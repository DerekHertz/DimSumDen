# 105: Steering spikes S1 to S7 (`conformance.mjs`)

**Type:** research

**Priority:** P1

**Blocked by:** none

**Status:** resolved

**Serves:** Den loop steps 3-4 (go/no-go on the runtime shapes that T and A/D depend on; unblocks 106 and 107).

**Design refs:** `docs/adr/0016-ui-steering-channel.md` decision 7

## What to build

Write the manual conformance script and run spikes S1 to S7 from ADR 0016 against a real `claude` with the owner's login: the stdin message shape, the permission request and response shapes, `--agent` under `-p`, mid-turn messages, and billing facts. Each is a go or no-go recorded in the ticket. The user (or a session with the login) runs it; a cell's sandbox cannot.

## Acceptance criteria

- [ ] `apps/bridge/cells/conformance.mjs` runs each spike and prints go or no-go with evidence
- [ ] Results for S1 to S7 are written into this ticket and ADR 0016's open questions are updated
- [ ] The billing question (separate credit or plan usage) is answered or still marked unconfirmed
- [ ] A go on S1 to S3 unblocks 106; S7 unblocks 107

## Comments

- **orchestrator, 2026-10-01:** Published from the crew-dashboard spec and ADR 0017 after the user approved the breakdown (user, 2026-10-01). Infra tickets first; frontend (P3) waits until the pipeline is where the user wants it.
- **orchestrator, 2026-10-05:** Dropped the `Blocked by` edge to 90 (user, 2026-10-05: working den-v1 loop tonight). New steering code uses the new vocabulary (agent, role, `/agents` routes per ADR 0019 decision 10) from the start; 90 renames older code later. The orchestrator session runs the spikes against the real `claude` login with the user's yes.
- **developer, 2026-10-06:** script and unit tests done; real run pending with owner login
- **orchestrator, 2026-10-05:** Spikes run live on the user's yes (WSL, claude 2.1.287, Haiku probe role, branch feat/105-steering-spikes at 63e66db). Fixtures and results.json: `.scratch/organism-infra/artifacts/105-conformance-2026-10-05/`.
  - **S1 GO:** child logs in under the env allowlist; init session_id matches `--session-id`; `--agent` honoured under `-p`; canary env absent; exits on stdin EOF.
  - **S2 GO:** tool_use arrives before its tool_result (streamed live). Subagent activity not exercised (the model never started one).
  - **S3 GO:** `--permission-prompt-tool stdio` works although `--help` omits it. Shape: `{"type":"control_request","request_id","subtype":"can_use_tool","tool_name","input"}` with the full input; allow and deny both honoured.
  - **S4 GO:** SIGTERM ends the child in about 1.1 s (code 143); transcript kept; `--resume` reopens the same session_id.
  - **S5 UNCONFIRMED:** the 5-hour window rolled over between readings. The result line reports `total_cost_usd` 0.0068. The user must check the account usage page (billing stays unconfirmed in ADR 0016).
  - **S6 NO-GO, but inconclusive:** stderr says the project's `permissions.allow` was ignored because the temp workspace was not trusted. It does not show that `--settings` replaces rather than merges. Rerun in a trusted directory before deciding.
  - **S7 GO:** a message written mid-turn was merged into the running turn (`merged-into-running-turn`).
  - S1-S3 go unblocks 106; S7 go unblocks 107. Still open for 105: ADR 0016 open questions update, S1/S3 fixtures copied into the adapter tests (106 can take that), S5 billing check, S6 rerun.
- **orchestrator, 2026-10-05:** S5 billing: the user checked the account billing page after the run and saw no separate credit charge, so headless runs appear to draw on plan usage (user, 2026-10-05). Mark S5 GO (plan usage) in ADR 0016 when it is updated.
- **security, 2026-10-06:** Security pass. No critical or high. Low: conformance.mjs:447-451 S3 allow phase approves every tool request (fixed prompt, temp cwd); conformance.mjs:633 default out dir in tmpdir without 0700. gitleaks clean, no dependency change. See handoffs/105-security.md.
