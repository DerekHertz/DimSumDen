# 106 security: pre-build review of ADR 0016 decision 6

```json
{
  "ticket": "organism-infra/106-steering-slice-1",
  "cell": "security",
  "current_step": "Design review of decision 6 done (ADR only, detached main at c05a036, no files changed). Security bounce on 6 as written: one high pending a spike (F1), five medium amendments. Structure is sound.",
  "artifacts": [],
  "decisions": [
    "Reviewed 0016 d6 (6.1-6.11), d2, d3, d7; 0019 d2 and d10; 105 handoffs; spike fixtures and results.json under .scratch/organism-infra/artifacts/105-conformance-2026-10-05/; apps/bridge/server.mjs as it stands.",
    "gitleaks and npm audit not applicable: no branch, no dependency change.",
    "The bounce is a design bounce: it needs ADR amendments (architect) and one spike, not code."
  ],
  "failures": ["First cell-start ran from the main checkout and was refused ('run cell-start only inside a cell worktree'); reran inside the worktree and it claimed."],
  "pending": [
    {"item": "Amend ADR 0016 d6 and d3 for F2-F7 (list below); add spike S8 (F1) and rerun S6 in a trusted worktree under the repo", "owner": "architect"},
    {"item": "Run S8 and the S6 rerun with the owner login (extend conformance.mjs)", "owner": "developer"},
    {"item": "After the amendments and S8, qa specify can write tests for 106 (or its split tickets) with the build requirements below", "owner": "qa"}
  ]
}
```

## State

Partial by design: review complete, verdict is `Security bounce` on decision 6 as written. 6.1, 6.4 (mostly), 6.6, 6.7, 6.9, 6.11 are sound. Ticket left `ready-for-agent` for the architect then qa.

## Findings (ties to 6.x; severity)

- **F1, 6.3 and 6.5, high until S8 passes: the child opens an inbound socket.** Every `system/init` fixture (S1, S3) carries `messaging_socket_path: /tmp/cc-socks/<pid>.sock`, and `capabilities` lists `interrupt_send_now_v1`, `msg_lifecycle_v1`. 6.3 says "no inbound route; only the bridge holds the child's stdin". A pid-named socket in /tmp may let any local process (a cell, or another OS user if the dir is open) inject user messages or interrupts, and possibly answer a permission request. Nothing in S1-S7 checks it. Add spike S8: socket and dir modes, what the protocol accepts (message, interrupt, control_response?), and whether a flag or env var disables it (a narrowing, so allowed). Until S8, 6.3 must not claim "no other process can answer". If it can answer, the approval hold needs another design before the adapter is built.
- **F2, 6.2 and d7, medium: the token can leak to the cells it must defend against.** The launch URL (token in the fragment) lands in the browser history DB and, if the bridge is started from an agent's Bash tool or the desktop app's session, in a transcript under `~/.claude/projects`, both readable by any cell on the account. Required: (a) the printed secret is a one-time launch code, redeemed once by the UI (`POST` with Origin and Host checks) for the in-memory session token, then burned (also expires, e.g. 5 min); a leftover URL is then inert. (b) d7: the user starts the bridge, never an agent's tool call. (c) Token only in the `Authorization` header, never a query string, log or error text. If the architect rejects (a), state the history and transcript residual in 6.2.
- **F3, 6.5 and 6.8, medium: spell out the real `control_request` contract.** Real shape (S3 fixture): `{type, request_id, request:{subtype:"can_use_tool", tool_name, display_name, input, description, permission_suggestions:[{type:"setMode",mode:"acceptEdits",destination:"session"}], tool_use_id}}`. It is nested, not the flat shape in the 105 ticket comment. Decode must: accept only `request.subtype === "can_use_tool"` with string `tool_name` and object `input`; answer deny or an error response to any other subtype or shape (this is 105's low note 1); treat `request_id` as opaque and map it to the bridge-minted approval id; drop or deny a duplicate `request_id`; ignore `permission_suggestions` (the real broadening vehicle; the encoder never emits `updatedPermissions` or a mode). The S3 allow response carried `updatedInput` equal to the original input, so 6.5's echo clause applies: deep-equality test stands.
- **F4, d3 Permissions, medium: "cannot build a broadening flag" must be an allowlist, not a denylist.** The conformance builder has an `extraArgs` escape hatch and an `--allowedTools` option, and `--allowedTools`, `--add-dir`, any `--permission-mode`, `--mcp-config` all widen what runs unattended. The production argument builder is a fixed template with no passthrough: the test asserts the full argv equals a known list and that no input can add a flag. `--settings` is only the bridge's own value.
- **F5, 6.10 and d3, medium: effective permissions are wider than "the repo's allowlist".** S1 shows the child loads the owner's user-scope MCP servers (blender, claude.ai connectors), plugins and user settings via HOME (`mcp_servers`, `plugins` in init). User-level `allow` rules and any user hook apply to unattended cells. Required: the adapter restricts sources (`--setting-sources project,local`, `--strict-mcp-config` with no MCP config unless the role file needs one), checked in the S6 rerun. Pass the deny rule as inline JSON in `--settings`, not a file: no file means no predictable path, no race, nothing a cell can edit. If a file is unavoidable: `mkdtemp` (0700) and `wx`. The bridge never writes `~/.claude.json` or any Claude config (see F8 on trust).
- **F6, d2 Kill and process lifetime, medium: kill and bridge-exit are under-specified.** Kill is "close stdin, then SIGTERM" with no escalation: a hung child survives. Add a bounded grace then SIGKILL, and a shutdown handler (SIGINT, SIGTERM, exit) that stops every child the same way. Claude's Bash tool grandchildren (a dev server, `npm test`) may outlive the SIGTERM; S4 did not check. "The child exits on stdin EOF" was proven idle (S1), not mid-tool-call, so "bridge exit ends its cells" is unverified; a crashed bridge may leave a running unattended child while the registry says `terminated`. Add S4b (EOF during a long tool call; surviving grandchildren after SIGTERM).
- **F7, 6.1 and 6.4, low: ordering and masking.** Auth runs before any route-parameter lookup, so an unauthenticated caller gets 401, never a 404 or 409 that reveals a ticket or approval id. Apply the secret mask and control/bidi escaping to `cells[].tool.summary` as well as `approvals[].summary` (a running Bash tool's summary can hold a token), and to `note` and `reason` text. No env var, flag or request field may disable or preset the token; tests inject it through a `startBridge` option only.
- **F8, 6.10 / S6, low: S6 is unresolved, not failed.** Its no-go stderr says the temp workspace was untrusted so project `permissions.allow` was ignored; it says nothing about `--settings` merge or deny precedence. Do not assert deny-over-allow in 106 until S6 is rerun in a real worktree under the repo (also answers whether `.claude/worktrees/*` inherits trust). If trust must be granted, that is a user action recorded in an ADR, never bridge code (`~/.claude.json` is cell-writable). The untrusted case fails safe (more approvals), so it is not a security hole.

## 105 low notes: build requirements?

- S3 allow phase approves every control_request: yes, as the F3 decode rule in the adapter and its tests (unknown subtype or shape is never allowed). The conformance.mjs fix (allow only Write) is optional, cheap, may ride in the adapter ticket.
- Default `--out` mode: not for the script. Yes for the bridge: `.scratch/_run/` created 0700, `sessions.jsonl` 0600, and any bridge-written temp file under `mkdtemp`. Also, the S1-S3 fixtures to be committed under `apps/bridge/cells/fixtures/` need a scrub step: init holds `cwd`, `memory_paths`, `plugins` paths (home path and username `dhertzell`), `session_id`, `messaging_socket_path`, plugin and MCP lists. Keep only the lines and keys the parser needs.

## What 105 contradicts or leaves unverified

- Contradicts 6.3's "no inbound channel" (F1). The 105 ticket's S3 shape comment is wrong (F3).
- Unverified: subagent activity and whether a subagent's tool call reaches the parent's `control_request` (S2 never started one; an unrouted subagent tool would run without a prompt); timeout behaviour of an unanswered control_request in the CLI; omitting `updatedInput` on allow; `--settings` merge and deny precedence (S6); EOF mid-turn (F6); S5 billing is the user's observation only (no separate charge seen), fine for slice 1, not a security matter.

## Constraints on the split (host+fake+routes / Claude adapter / token and Origin hardening)

- Hardening cannot be last. No mutating route may merge before 6.1 and 6.2 exist, because once the adapter lands any open `POST /agents` spawns a real `claude`. Order: (1) auth gate (Host, Origin required, content-type, Bearer, body cap, default-deny route table, `POST /requests` and the UI sending the token; the existing `bridge-requests.test.mjs` and the Approve/Reject buttons change in the same ticket, per 0016 d7) with the launch-code flow; (2) host, fake runtime and routes behind it; (3) adapter last, after S8 and the S6 rerun. Hardening may merge with (2) as one ticket, never after it.
- Auth tests are table-driven from one route registry so a route added or renamed (0019 d10: `/cells` becomes `/agents`) is covered by default; a mutating route missing from the table fails closed.
- 0019 d2: relay hops are started by the relay runner through the host module, never a route. Keep the 409 on the route path keyed to the entry point, not a flag in the request body; the internal entry must not be reachable from HTTP, and it shares the one synchronous reservation and the caps. Whatever starts a relay later is a token-authenticated route. Unattended developer runs widen the 6.10 gap; F5 matters more then.
- 6.5 (hold, expiry, full-input rule) and F3 decode/encode go with the adapter; the approval store and the `GET`-before-`allow` gate go with the host. They need not land together, but the host must answer deny for anything it cannot decode.

## Next step

Architect amends ADR 0016 d6 and d3 (F1-F8) and orders the split; developer runs S8, S4b and the S6 rerun with the login; then qa `specify`.
