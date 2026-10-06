# 106 architect: ADR 0016 amended for security round 2, spikes defined, split drafted

```json
{
  "ticket": "organism-infra/106-steering-slice-1",
  "cell": "architect",
  "current_step": "ADR 0016 amended in place on branch docs/106-adr-0016-amend (commit 4e46550, one file, not pushed). F1-F8 resolved or gated; spikes S8, S4b, S6b, S3b specified; six-ticket split drafted below for user approval. No tickets published, no product code.",
  "artifacts": ["docs/adr/0016-ui-steering-channel.md (branch docs/106-adr-0016-amend @ 4e46550)"],
  "decisions": [
    "F1: 6.3 withdraws 'no other process can answer'; four outcomes (a-d) keyed to spike S8; adapter not built until S8 has a verdict; outcome (d) means slice 1 ships without the approval inbox.",
    "F2: accepted security's option (a): one-time launch code (#code=, 5 min TTL, burned on first redemption or five failures) redeemed at POST /session for an in-memory session token (up to 4); header-only token; user starts the bridge; residual stated.",
    "F3: 6.5 decode contract with the real nested control_request shape; permission_suggestions ignored; duplicate request_id denied; encoder bare decision only.",
    "F4: production argv is a fixed template with a whole-argv equality test; no extraArgs or allowedTools passthrough.",
    "F5: --setting-sources project,local, --strict-mcp-config, deny rule as inline --settings JSON (no file); _run 0700/sessions 0600; fixture scrub step.",
    "F6: kill = stdin close, 5 s grace, SIGTERM, grace, SIGKILL; shutdown handler on SIGINT/SIGTERM/SIGHUP/uncaught + sync SIGKILL on exit; process-group kill only if S4b shows grandchildren survive; restart marks cells terminated/bridge-restart-unverified.",
    "F7: one route registry with default deny, auth before any id lookup, table-driven auth tests, nothing disables or presets the token (startBridge option only), masking extended to cells[].tool.summary, note and reason.",
    "F8: S6 reclassified unresolved; S6b reruns in a real worktree; trust is a user action recorded in an ADR, never bridge code.",
    "Not changed: decision 7 'how the bridge is started' stays open, now with a fresh-launch-code requirement after reload."
  ],
  "failures": [],
  "pending": [
    {"item": "User approves or edits the split below; then the orchestrator publishes tickets A, B, C1, C2, D1, D2 via to-tickets and closes 106 as superseded by them", "owner": "orchestrator"},
    {"item": "User runs S8, S4b, S6b (S3b optional) with their own login after ticket A merges; copies output to .scratch/organism-infra/artifacts/106-conformance-<date>/", "owner": "user"},
    {"item": "Record the spike verdicts in ADR 0016 (S8 outcome other than a or b needs security re-review and user acceptance)", "owner": "architect"},
    {"item": "User merges this ADR branch (docs only; ADR change is a pass gate)", "owner": "user"}
  ]
}
```

## State

Design pass complete. ADR amendment committed on `docs/106-adr-0016-amend`; it needs the user's approval to merge (ADR gate). Security should re-review the amended decision 6 together with the S8 result before the adapter builds.

## Draft split (names use ADR 0019 decision 10 vocabulary: agent, role, `/agents`)

Order: B before C1 before C2 and D1; A runs in parallel; D1 and D2 wait for the spike verdicts. Estimates are rough; every ticket must serve a den-loop step (ADR 0019 decision 8): steps 3-4.

| # | Ticket | Scope | Blocked by | Est. | Notes |
|---|---|---|---|---|---|
| A | Spike tooling | Extend `apps/bridge/cells/conformance.mjs` with S8, S4b, S6b, S3b (ids accepted case-insensitively; SPIKES keys uppercase), pure evaluators plus tests against a scripted fake `claude`, fixture scrub on save, `--repo`, `--s8-disable-flag/-env`, `--s3b-wait`; fix S3 allow phase to answer only Write; make the evaluator report the nested `request.subtype` shape. Files: `conformance.mjs`, `conformance.test.mjs` only. | none | 60-80k | No security gate beyond qa (probe tooling, no bridge code); a leftover-process cleanup (`sleep 61` pids, worktree removal) must be tested with the fake. User runs it afterwards. |
| B | Auth gate | Route registry with default deny; Host, required Origin, Content-Type, 4 KB cap, Bearer (sha256 + timingSafeEqual), auth before id lookup; `POST /session` and launch code (TTL, burn, 5 failures, 4 sessions); `startBridge` `auth` option; console prints the launch URL (code only, never logged); `POST /requests` retrofitted; UI reads `#code`, redeems, sends Bearer; existing `bridge-requests.test.mjs` and Approve/Reject buttons (`gates-model.mjs`, `floating-cards.test.mjs`) updated in the same ticket; table-driven auth tests. | none | 100-120k (largest; if it nears 80k the developer stops partial per protocol) | Full qa specify + full security (auth code). Non-visual UI wiring, but the "no session / code already used" state needs one line of copy: designer glance or orchestrator call. |
| C1 | Host core | `runtime.mjs` interface plus fake runtime; `host.mjs`: dispatch policy (one synchronous reservation, `max_concurrent_cells`, 8-session cap, usage gate), 409 for relay-hop roles on the route path, internal `start()` entry not reachable from HTTP; kill with escalation and shutdown handler; `policy.mjs` constants; `sessions.jsonl` (0700/0600, replay validation, `bridge-restart-unverified`); `POST /agents`, `POST /agents/:id/stop` via the registry; snapshot `agents` + `agent` change; `.gitignore`; `risk-check` pattern for `.claude/**`. | B | 90-110k | Fake runtime only; no real `claude`. Concurrent-dispatch race test. |
| C2 | Approvals | Approval store (minted ids, bound to agent, 10 min expiry, 20 per agent cap), `GET`/`POST /approvals/:id` with GET-before-allow 409, full-input serving, masking and bidi escaping (also `tool.summary`, notes), snapshot `approvals` + `approval` change, deny on anything undecodable, expiry or shutdown. Fake runtime emits permission requests. | C1 | 70-90k | |
| D1 | Adapter, pure half | `claude-adapter.mjs` pure functions: fixed `buildClaudeArgs` (whole-argv test), env allowlist, `parseClaudeLine` (caps, resync), `decodeControlRequest`/encoder per 6.5, committed scrubbed fixtures from S1-S3 and the S8/S4b/S6b runs. | C1, spike verdicts | 60-80k | Argv content follows S6b. |
| D2 | Adapter, process half | Child wrapper over real pipes (stub script speaks the stream), kill/group handling per S4b, shutdown wiring, default runtime, `DEN_CLAUDE_BIN`, `capabilities` from S8/S3 outcomes (inbox off if S8 is (d)). | D1, C2, spike verdicts | 70-90k | Manual conformance run by the user after merge. |

Relay shape per ADR 0019 decision 4: B, C1, C2, D1, D2 are security-sensitive code, so qa specify and full security run on each; A is a normal slim relay.

## Open items for the user

1. Approve the split (or merge B's UI half differently; I kept it whole because the buttons break otherwise).
2. How the bridge is started and how a fresh launch code is obtained after reload (ADR 0016 decision 7) is still open; B assumes the code is printed on the console and a reload needs a new one.
3. Merge approval for the ADR branch.
4. Spike results are the user's to run; if S8 shows outcome (c) the user must accept the injection residual; if (d) the approval inbox leaves slice 1.
