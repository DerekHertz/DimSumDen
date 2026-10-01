# The UI steers live cells through the bridge: SSE down, authenticated POST up, a `CellRuntime` adapter whose Claude implementation drives `claude --bg` sessions, with a four-slice path from "dispatch, watch, kill" to full steering

**Status:** accepted (user, 2026-09-30, in chat; drafted by the architect, 2026-10-01). It touches `apps/bridge`, `scripts/` and docs, so it crosses packages (an architect gate). **Still open:** a `security` review of decision 6 must pass before slice 1 builds the auth code; the billing facts (does `claude --bg` count against plan usage; the `claude -p` credit change) are unconfirmed; and the proposed domain terms and the Gate request rewording are not in `CONTEXT.md` until the user rules on them (brain gate).

**Context.** Ticket `organism-infra/11` asks for the channel that lets the UI watch and steer live cells: an inbox for tool-permission requests, taking over or pairing, a message mid-task, kill, and sub-second live state. ADR 0008 decision 8 left it open; ADR 0004 fixed only the adapter's verbs (spawn, stream events, send message, approve/deny, stop). The user's goal (2026-09-30) is to drive agent work from the UI within a day, so this ADR also names the thinnest first slice. Facts that shape the design:

- Today the UI cannot reach a cell. Cells are subagents the orchestrator launches with its Agent tool inside an interactive desktop-app session; nothing outside that session holds a handle to them.
- The bridge (ADR 0011) already serves `GET /state`, an SSE `GET /events`, and `POST /requests`, behind a loopback bind and Host/Origin/Content-Type checks. The bridge has no Board write path, and a Gate request "never runs anything itself" (`CONTEXT.md`).
- The user decided on 2026-09-28 that the event source is transcript tailing (`~/.claude/projects/<cwd>/<session>.jsonl` plus the subagent transcripts beside it), one reader for tool-call animation and cost, with the hook design as a fallback.
- ADR 0001: cells are unmodified `claude` CLI processes on the owner's login; no model API, no Agent SDK.
- The installed CLI (2.1.284, checked with `--help` for this ADR) has first-class background sessions: `claude --bg [--resume <id>] "<prompt>"`, `claude agents --json`, `claude attach <id>`, `claude logs <id>`, `claude stop <id>`. It also has headless `claude -p --input-format stream-json --output-format stream-json`.
- Evidence gathered (a throwaway probe in the architect's scratchpad, plus a `scout` read of the official docs; not committed). Proved: the binary accepts the stream-json flags and `--permission-prompt-tool stdio`, and emits `system/init` with `session_id` in about 0.5 s. Not proved: any model-backed behaviour. A `claude` spawned from the architect's sandbox answers "Not logged in", so permission requests, mid-turn messages and `--bg` behaviour are unverified here. From the docs: HTTP hooks (`"type": "http"`) exist; a `PermissionRequest` hook exists but needs v2.1.x; `--permission-prompt-tool`'s request/response shape is undocumented; SIGTERM leaves a turn unfinished; `--resume <id>` reopens a session. The same support article (as read by `scout`, 2026-10-01) says `claude -p` usage has drawn from a separate monthly credit instead of plan usage since 2026-06-15. That is unconfirmed and, if true, undermines ADR 0001 for headless mode (see decision 2 and Conflicts).

**Decision.**

### 1. Transport: the bridge grows in place; SSE down, POST up

The UI talks to the existing bridge process over its existing localhost HTTP surface. There is no separate daemon process and no second port. ADR 0011 said the daemon would later replace `apps/bridge` behind the same surface; this decision makes that literal: `apps/bridge` gains a `cells/` module and stays the one process the user starts. `organism-infra/03` (board IPC) stays parked under ADR 0008 decision 5; this ADR does not revive it.

- **Down (cell state to the UI):** the same SSE stream (`GET /events`). New additive snapshot keys and `change` types (decision 4). Sub-second delivery needs no polling: a cell event reaches the stream as soon as the tailer or hook handler sees it.
- **Up (commands to the daemon):** `POST` JSON routes (decision 3), each one command, each answered with 200/201 or a 4xx that names the refusal.

Why not a WebSocket: the traffic is low-rate commands up and a firehose down, which SSE plus POST already model. A WebSocket handshake is not covered by CORS, so it would need its own Origin enforcement, and framing needs a dependency (`ws`) or hand-rolled code. SSE plus POST reuses ADR 0011's tested hardening (Host check, Content-Type, Origin, body caps, SSE back-pressure destroy) unchanged and adds no dependency. Why not a named pipe or Unix socket: a browser cannot open one (ADR 0008 decision 8). Why not a second "daemon" port: it would double the exposure surface for no capability.

### 2. How a steering command reaches a live cell: `CellRuntime` (refines ADR 0004)

One module interface, `apps/bridge/cells/runtime.mjs`. ADR 0004's verbs, made concrete, plus a capability set so a runtime that cannot do something says so (the lowest-common-denominator rule):

```
CellRuntime = {
  id: "claude",
  capabilities: { spawn, stop, approve, send, attach },        // booleans; the UI greys out what is false
  spawn({ cellType, mode?, ref, cwd, prompt, model?, sessionId, env }) -> Promise<{ handle }>   // handle: opaque string
  stop(handle) -> Promise<void>
  send?(handle, text) -> Promise<void>
  attachCommand?(handle) -> string                 // shown to the user; the daemon never runs it
  list() -> Promise<{ handle, sessionId, state }[]>   // reconcile after a daemon restart
  events(handle) -> AsyncIterable<CellEvent>        // tool start/end, message, usage, permission-request, state, done
  decide?(requestId, { allow, reason? }) -> Promise<void>   // answers a held permission request
  http?(req, res) -> boolean                        // optional inbound routes, mounted at /hooks/<id>/
}
```

`startBridge({ root, port, uiDir, runtime })` takes the runtime as a parameter, defaulting to the Claude adapter. Tests pass a fake runtime. Two adapters (Claude, fake) make this a real seam.

How the **Claude adapter** carries each command (the answer to "hooks, stdin, signals"):

| Command | Mechanism | Slice |
|---|---|---|
| Dispatch | create a worktree, then `claude --bg --agent <cell> --session-id <uuid> -n den-<id> "<prompt>"` with cwd in it; the daemon mints the session id so it knows the transcript path | 1 |
| Watch | tail the session transcript and its sibling subagent transcripts into `CellEvent`s; `claude agents --json` reconciles after a restart | 1 |
| Kill | `claude stop <id>` (the conversation is kept); fall back to SIGTERM on the recorded pid; never a pid from the client | 1 |
| Approve or deny a tool permission | a `PermissionRequest` hook of `type: "http"` posting to the bridge's `/hooks/claude/permission`; the handler holds the response open until the UI decides, then returns the hook's allow or deny JSON | 2 |
| Message mid-task | stop at idle, then `claude --bg --resume <sessionId> "<text>"` (same session id); not a live keystroke into the TUI | 3 |
| Take over or pair | the UI shows `claude attach <id>`; the user runs it in a terminal. The daemon takes no action and marks the cell `attached` only if the CLI reports it | 3 |

Headless `claude -p --input-format stream-json` would give true in-process `send` and a `control_request` approval channel. It is **not** adopted now, for two reasons. If the credit-pool statement above holds, headless runs would not run on the owner's plan the way ADR 0001 assumes. And its permission protocol is undocumented. It stays available as a second Claude adapter mode behind the same interface, adopted only after the user confirms the billing facts. Nothing outside `cells/claude-adapter.mjs` may name a Claude flag or hook shape.

Fail-closed rule for every adapter: a permission request with no decision (timeout, daemon down, token mismatch) returns no decision, so the CLI falls back to its own prompt. The bridge never auto-allows.

**One line parser, two feeders.** Transcript lines and stream-json lines share the message shape (`message.content` blocks, `message.usage`). The tailer and any future stdout reader both feed one `parseClaudeLine(line) -> CellEvent[]`. That keeps the user's "one reader feeds animation and cost" decision. Latency: an `fs.watch`-triggered incremental read delivers a line within tens of milliseconds of Claude flushing it (the 1 to 2 s in the reference was polling). Unverified; slice 1 measures it. Permission requests do not depend on this path, since the hook delivers them directly.

### 3. Routes and the `CellHost` module

Behind the routes sits one deep module, `CellHost` (`apps/bridge/cells/host.mjs`). The routes are thin; the module owns the policy, the registry and the event merge.

| Route | Body | Does |
|---|---|---|
| `POST /cells` | `{ ref, cellType, mode? }` | dispatch (below) |
| `POST /cells/:id/stop` | none | kill |
| `POST /cells/:id/message` | `{ text }` (at most 2 KB) | send (slice 3) |
| `POST /approvals/:id` | `{ decision: "allow" \| "deny", note? }` | answer a permission request (slice 2) |
| `GET /approvals/:id` | none | the full tool input for a pending request, token required |
| `POST /hooks/claude/permission` | Claude's hook JSON | held until decided; per-session hook token |

**Dispatch policy** (all refusals write nothing and start nothing):
- `ref` names a ticket in the snapshot with `gate == "dispatch"` (ADR 0011 decision 3), and the matching `dispatch-approve` Gate request is recorded first. The click is the user's consent; it lives in `requests.jsonl`, not in a prompt. Handled marks use ADR 0011 decision 6's separate append-only lines (`outcome: "dispatched <cellId>"`).
- `cellType` is one of the nine known cells. **Slice 1 dispatches only `orchestrator` and the non-relay cells (`architect`, `product`, `designer`, `scout`).** Relay-hop cells (`developer`, `qa`, `security`) are refused with 409 "dispatch the orchestrator": the orchestrator owns the hop SHA, the Jev tier and the verify depth, and re-implementing that in the bridge would fork the relay.
- `orchestrator` runs in the main checkout (as it does today) with a daemon-built prompt that cites the request id and says to read it with `scripts/requests.mjs --list`. Non-relay cells get a detached worktree under `.claude/worktrees/<cell>-<NN>-<shortid>` at the main `HEAD`, and a prompt whose first command is the same `node scripts/cell-start.mjs --base <sha> --branch <cell>/<NN>-<slug> --ticket <ref> --cell <cell>` line the orchestrator writes today. The prompt is a fixed template filled only with validated fields (`ref` matches `^[a-z0-9-]+/\d{2}-[a-z0-9-]+$`, `cellType` from the allowlist); no client string reaches it.
- Concurrency: refuse when running daemon-spawned cells would exceed `max_concurrent_cells` (2 per CLAUDE.md, ADR 0002; one constant in `cells/policy.mjs`). Usage: refuse at a five-hour reading of 90% or more (ADR 0002's auto-pause). A `null` reading allows the dispatch and says so in the response.
- Permissions: the daemon passes **no** permission-broadening flag, ever (`--dangerously-skip-permissions`, `--permission-mode bypassPermissions` and `--allow-dangerously-skip-permissions` are not constructible by the adapter; a test asserts the argument builder). Spawned cells use the repo's own `.claude/settings.json` allowlist. In slice 1 an unlisted tool leaves the session waiting; the UI shows `waiting_on_user` plus the attach command. Slice 2 turns that into the inbox.
- Board: the bridge still has zero Board write paths (ADR 0011). The spawned cell claims, comments and releases through `board`, as today.

### 4. State the UI sees (additive keys on ADR 0011's snapshot)

```json
{
  "cells": [{
    "id": "c-7f3a", "ref": "organism-infra/11-daemon-ui-cell-channel-design", "cellType": "architect",
    "mode": null, "runtime": "claude", "sessionId": "08376463-453a-4135-a7df-4ee921c22e86",
    "state": "working", "startedAt": "2026-10-01T09:00:00.000Z", "lastEventAt": "2026-10-01T09:03:12.410Z",
    "tool": { "name": "Read", "summary": "docs/adr/0011-..." },
    "tokens": { "input": 41200, "output": 3100 },
    "capabilities": { "stop": true, "approve": false, "send": false, "attach": true },
    "attach": "claude attach 3f2a"
  }],
  "approvals": [{
    "id": "a-91d0", "cellId": "c-7f3a", "tool": "Bash", "summary": "npm test (first 200 chars, secrets masked)",
    "ts": "2026-10-01T09:03:12.410Z", "expiresAt": "2026-10-01T09:13:12.410Z", "state": "pending"
  }]
}
```

- `state` is one of the director's `STATES` (ADR 0007): `working`, `waiting_on_user` (a permission is pending or the session is idle awaiting input), `blocked`, `done`, `failed`, `throttled`, `terminated` (killed by the user), `idle`. `snapshotStateSource` (ADR 0011 decision 7) can key off it directly, so nothing new is animated.
- `change` types added: `cell` (full object, or `null` when it leaves), `approval` (full object). Same `seq` rules as ADR 0011 decision 5; unknown types stay ignored.
- `tool` and `tokens` come from the transcript line parser. Cost-pricing and the telemetry reader are a separate ticket; this ADR only fixes that the same parser feeds them.
- Registry persistence: an append-only `.scratch/_run/sessions.jsonl` (spawn, decision, stop; one line each, with `ts`, `cellId`, `ref` and, for decisions, the request id and who). On start the host replays it and reconciles against `runtime.list()`. `.scratch/_run/` should be git-ignored; the developer adds that line to `.gitignore`.

### 5. Test seams

Two, at the highest points:

1. **`startBridge` over HTTP, with a fake `runtime` injected.** Dispatch validation and refusals, concurrency and usage limits, auth rejections, kill, the permission round-trip (hook POST blocks, `POST /approvals/:id` releases it with the right JSON, timeout returns no decision), the SSE `cell` and `approval` events, restart reconciliation. The existing `bridge-*.test.mjs` fixtures extend.
2. **`claude-adapter.mjs` as pure functions:** the argument builder (including the "no permission-broadening flag" assertion), `parseClaudeLine` over recorded transcript lines, and the hook-JSON encode and decode. Fixtures are real captured lines, committed under `apps/bridge/cells/fixtures/`.

The adapter against a real `claude` is a manual conformance script (`apps/bridge/cells/conformance.mjs`), not a CI test, because it needs the user's login. Slice 1's first task is to run it (spikes below).

### 6. Auth and exposure (`security` reviews this section)

Threat model, in order of likelihood: (a) a web page in the user's browser firing requests at localhost (CSRF, DNS rebinding); (b) **a cell itself** (an agent, possibly prompt-injected) running `curl` against the bridge to approve its own permission request, dispatch, or kill another cell; (c) another local OS user on a shared machine; (d) a hostile or malformed hook payload.

1. **Bind and Host/Origin.** Loopback `127.0.0.1` only, not configurable (ADR 0011). Every route keeps the Host check. Every mutating route additionally **requires** an `Origin` header equal to `http://127.0.0.1:<port>` or `http://localhost:<port>` (a browser always sends one on a cross-site POST; ADR 0011 only checked it when present), `Content-Type: application/json`, and the 4 KB body cap (hook route: 256 KB, because tool inputs are large). Failures return 403 and write nothing.
2. **Per-run UI token.** The bridge generates 32 random bytes at start, keeps them **in memory only** (not on disk, not in the environment of anything it spawns), and prints one launch URL with the token in the fragment: `http://127.0.0.1:4317/#token=<...>`. The UI reads the fragment, removes it from the address bar, keeps the token in memory, and sends `Authorization: Bearer <token>` on every mutating route and on `GET /approvals/:id`. A custom header also forces a CORS preflight the bridge never answers, which stops cross-origin scripts even if the Origin check had a hole. Compared with `crypto.timingSafeEqual`. Why not write the token to a file: a cell runs as the same OS user and can read any 0600 file the user can, which defeats threat (b). A cell also cannot find it in the bridge's environment because there is none.
3. **Per-session hook token, a different privilege.** Each spawned session gets its own random token, passed to the child in its environment (`DEN_HOOK_TOKEN`) and named in the session's settings by `allowedEnvVars`, never on the command line (argv is visible in `ps`). It authorizes exactly one thing: submitting permission requests for that session and receiving the decision. It cannot approve, dispatch, kill or read state. A cell that reads its own environment gains nothing it did not have.
4. **Reads stay as ADR 0011 left them** (`/state`, `/events`, `/metrics` unauthenticated on loopback), with one narrowing: the snapshot carries only a tool name and a 200-character summary with secret-pattern matches masked (reuse the risk-check patterns); the full tool input is served only by the token-authenticated `GET /approvals/:id`. Residual risk, stated plainly: any local process or user can read the snapshot, including handoff text, as today. This design assumes a single-user machine.
5. **Approval binding.** An approval id is minted by the bridge, one-shot, bound to one cell and one request, and expires (default 10 minutes, shorter than the hook's own timeout). A second decision on the same id returns 409. The UI renders tool input as text only, never HTML (React escaping plus ADR 0011's CSP).
6. **Spawn safety.** The spawned cell's environment is an allowlist (PATH, HOME, locale, the hook token, `DEN_CLAUDE_BIN` if set), not a copy of the bridge's. The binary comes from `DEN_CLAUDE_BIN` or `claude` on PATH, never from a request. Worktree paths and branch names are derived server-side from validated `ref` and `cellType`. Kill and message act only on cells in the registry, by `cellId`.
7. **Caps.** At most 8 live daemon-spawned sessions regardless of policy; at most 20 pending approvals per cell (older ones expire first); SSE keeps its 5 s back-pressure destroy. A flood of hook posts past the caps gets 429 and no decision.
8. **Audit.** Every dispatch, decision and kill appends one line to `sessions.jsonl` with the acting channel (`ui`), so a self-approval by a cell would show up as a decision with no UI token session.

### 7. The thinnest first slice, and what follows

"Drive agent work from the UI" is reachable on day one with **slice 1 = dispatch + watch + kill**, where "approve" is the Gate request the UI already records (`dispatch-approve`), now starting the work:

- **Spikes first, each a go or no-go before building** (run by the developer with the user's login, via `conformance.mjs`): S1 `claude --bg --session-id <uuid>` accepts the id and writes `~/.claude/projects/<encoded-cwd>/<uuid>.jsonl`. S2 `claude agents --json` lists the session with a usable id, cwd and state. S3 the transcript tail delivers a tool event in under one second. S4 `claude stop <id>` ends a running session and keeps its transcript. If S1 fails, the adapter maps the `--bg` short id to the session through `claude agents --json`; if S2 also fails, slice 1 falls back to the pid from `ps` and transcript discovery by newest file in the worktree's project directory.
- **Slice 1 build:** `runtime.mjs` plus a fake; `claude-adapter.mjs` (spawn, stop, list, events); `host.mjs` with dispatch policy and kill; the token and Origin hardening; `POST /cells`, `POST /cells/:id/stop`; snapshot `cells` and the `cell` change type; `sessions.jsonl`. The UI work (a "Run" button on the dispatch gate, a stop button, cell tiles reading `cells[]`) belongs to the UI orchestrator; it needs only this ADR's JSON.
- **Slice 2: the permission inbox.** Spikes S5 (a `PermissionRequest` hook of `type: "http"` fires in a `--bg` session and blocks until the server replies) and S6 (the allow and deny response JSON). Then `/hooks/claude/permission`, `/approvals/:id`, the `approvals` key. If S5 fails, a `PreToolUse` http hook is the fallback (it can also return a permission decision); if both fail, the inbox waits on the headless adapter mode.
- **Slice 3: message and takeover.** Spike S7 (`claude --bg --resume <id> "<text>"` continues the same session). The attach command string.
- **Slice 4 (optional): direct relay-hop dispatch** of `developer`, `qa` and `security`, once the orchestrator's hop logic (SHA, Jev tier, verify depth) is a callable module rather than genome prose. Until then the orchestrator runs relays.

**Considered options (designed twice).**

- *A. Daemon-owned headless processes: `claude -p` stream-json, in-process `send`, approvals over the stream (`control_request`).* The strongest control: a real `send` and an approval channel with no hooks. Rejected as the first choice: its permission protocol is undocumented; it may bill against a separate credit pool (unconfirmed, and decisive if true); and it needs the user's login inside a long-lived daemon child (nothing from a sandboxed cell could even start it in the probe). Kept as an adapter mode behind the same interface.
- *B. Wake the orchestrator only; never spawn cells from the UI.* The thinnest possible, and what slice 1 does for relay tickets. Insufficient alone: the UI could not start a design or product cell, and could not kill one cell without ending the whole relay. Slice 1 therefore also spawns non-relay cells directly.
- *C (chosen). `CellRuntime` over `claude --bg`, hooks for approvals, transcript tailing for state.* Stays on the interactive CLI and the owner's login (ADR 0001), reuses the user's 2026-09-28 event-source decision, and uses only documented surfaces (`--bg`, `stop`, `attach`, HTTP hooks). Costs: `send` is "stop then resume", not a live keystroke, and pairing is attach in a terminal; the permission hook's exact shape is a spike.
- *Interactive cells in a shared PTY with the daemon injecting keystrokes.* Rejected, as in the reference notes ("shared PTYs not adopted"): brittle against TUI changes and unsafe for approvals.
- *A WebSocket, a separate daemon port, a named pipe, or loopback HTTP with a token file.* Rejected in decisions 1 and 6.

**Conflicts with existing decisions (surfaced for the user).**

- **`CONTEXT.md` Gate request and ADR 0011 decision 6** say the UI does not execute and a Gate request never runs anything. This ADR has the bridge start a cell when a `dispatch-approve` request lands, and execute kill, message and permission decisions. The request line itself still runs nothing; the bridge's executor reacts to it. Proposed rewording is in the Comments; `CONTEXT.md` is not touched.
- **ADR 0011 decision 1** says the daemon replaces `apps/bridge`. Amended: the bridge grows in place and no separate daemon exists. Decision 2's "zero Board write paths" is unchanged.
- **ADR 0001** is consistent for `--bg` (CLI only, no SDK, no API key). The headless mode would need the user to confirm the billing facts first.
- **ADR 0004** is refined, not changed: the verbs stay; `approve` becomes `decide` over an event, and `capabilities` is added.
- **ADR 0008 decision 8** is fulfilled by this ADR. **ADR 0007**'s `daemonStateSource` is this ADR's `cells[]` plus `cell` events, consumed by `snapshotStateSource`.
- **ADR 0002 and CLAUDE.md** disagree on the limit (one by default, `max_concurrent_cells: 2` now). This ADR reads the constant from `policy.mjs` and cites CLAUDE.md.

**Consequences.**

- Four implementation tickets follow, in slice order. The orchestrator writes them (`to-tickets`); slice 1 needs the spike results before its qa specify, so the first ticket is the conformance script and S1 to S4.
- The user starts the bridge from their own terminal, not from inside a cell: spawned cells need the owner's login (the probe showed a sandboxed child is not logged in). On this machine `claude` is not on PATH, so `DEN_CLAUDE_BIN` points at the desktop app's bundled binary.
- Nothing here edits `.claude/` or the orchestrator genome. When the orchestrator should read the UI-woken prompt as approval, the existing "dispatch-approve acts as if the user answered in chat" step already covers it; slice 4 would need a genome change, which only the orchestrator makes with the user's permission.
- No new dependency. `.gitignore` gains `.scratch/_run/`.
- Open facts the user should confirm: whether `claude --bg` sessions count against plan usage the way interactive sessions do, and what the 2026-06-15 `claude -p` credit change means for ADR 0001.

## Comments

- **Created (architect, 2026-10-01):** Resolves ticket `organism-infra/11`. Proposed domain terms, **not added** (pass gate): **Steering command**, a UI-originated action on a live cell (dispatch, answer a permission request, send a message, kill) that the bridge executes and logs; **Permission request**, a live cell asking to use a tool, held until the user answers, shown in the UI under Needs you with Pass gates (UI name for both: Needs you). Proposed rewording of Gate request: "The user's approve or reject on a pass gate, made in the UI and recorded as one line in `.scratch/_requests/requests.jsonl`. The line itself runs nothing; for `dispatch-approve` the bridge then starts the cell, and the orchestrator reads, acts and marks handled for every other kind."
