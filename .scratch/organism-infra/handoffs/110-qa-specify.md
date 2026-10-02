# qa specify: organism-infra/110-sessionstart-pickup (batch M)

```json
{
  "ticket": "organism-infra/110-sessionstart-pickup",
  "cell": "qa",
  "mode": "specify",
  "current_step": "qa specify done for batch M (109, 110, 111): failing tests committed on feat/batch-m-hooks at 269cc93. All new tests fail because the scripts do not exist yet.",
  "artifacts": [
    "branch feat/batch-m-hooks @ 269cc93",
    "scripts/session-start.test.mjs"
  ],
  "decisions": [
    "Tests are black-box through each script's CLI with injectable stdin, env, paths and fake gh/powershell/usage commands; no test reads or depends on .claude/settings.json.",
    "The 109/110/111 settings patch is one gated patch the developer ships in .scratch/_handoffs/gated/ (human-verified, not tested)."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Implement scripts/statusline.mjs, scripts/session-start.mjs, scripts/notify.mjs and the context.mjs change to pass the tests; ship the settings patch; cite the status-line docs.",
      "owner": "developer"
    },
    {
      "item": "Orchestrator: decide whether merge proposals and 'question to the user' need a board representation; 111 tests cover only ready-for-human tickets as gates.",
      "owner": "orchestrator"
    }
  ]
}
```

Branch `feat/batch-m-hooks` at `269cc93` (one branch for the batch). Test files for this ticket: `scripts/session-start.test.mjs`. Run: `node --test <file>`.

## Criterion to test map

| AC | Test (session-start.test: name prefix) |
|---|---|
| Output names latest orchestrator handoff, open PRs with check state, pending requests, usage | "AC1: for the orchestrator it names...", "AC1: it asks gh for open PRs...", "AC1: the latest handoff is chosen by date then numeric suffix...", "AC1: no orchestrator handoff yet...", "AC1: it runs for startup, resume and compact" |
| Under 400 tokens; gh/usage failure degrades to "unknown", never blocks | "AC2: a gh failure...", "AC2: a missing gh binary...", "AC2: a hanging gh is cut off...", "AC2: a failing usage read...", "AC2: a hanging usage read...", "AC2: malformed stdin exits 0", "AC2: output stays under 400 tokens..." |
| Non-orchestrator sessions get no output | "AC3: other cells get no output and gh is never called", "AC3: a session with no agent_type..." |
| Settings patch in gated/ | human-verified |
| npm test green | the whole suite |

## Seams the developer must implement (all three scripts; tests are black-box through the CLI)

Shared: hooks read JSON on stdin; always exit 0 and never throw on empty or malformed stdin. The board root is `ORGANISM_ROOT` (fallback cwd). Tests scrub `CLAUDE_CODE_SESSION_ID` and set `HOME` to a tmp dir.

**scripts/statusline.mjs (109)**
- stdin: status-line JSON. Context tokens = `context_window.current_usage` input_tokens + cache_creation_input_tokens + cache_read_input_tokens (output_tokens excluded). If `current_usage` is null or absent, fall back to the last assistant usage in `transcript_path` (same sum). Neither: `ctx ?`. I could not fetch the Claude Code docs offline: **the developer must check the status-line docs and cite them in the ticket**; if the real field names differ, say so in the handoff and tell qa (tests would need a matching change, not a loosening).
- Env: `STATUSLINE_USAGE_SCRIPT` (node script printing usage-claude JSON `{"5-hour":{percent,resets_at},"weekly":{...}}`, default scripts/usage.mjs, spawned with `process.execPath`, env inherited); `STATUSLINE_CACHE` (cache file; fresh iff mtime within 60 s, so tests age it with utimes; format is yours); `STATUSLINE_USAGE_TIMEOUT_MS` (bound on the read; hang means `5h ?`).
- Output exactly (after stripping ANSI): `5h 11% → 19:59Z · wk 51% · ctx 64k/80k · 123: qa verify · gates 2\n`. Reset is UTC `HH:MMZ`; ctx is `Math.round(tokens/1000)k`; relay = every `.scratch/*/issues/*.lock` (NOT `*.write-lock.json`, not `.reclaim-` files) rendered `<NN>: <cell> <mode>` (NN without leading zeros, mode omitted when the lock has none), joined by any separator; gates = pending rows via apps/bridge/requests-log.mjs (`foldRequests`), `gates 0` when none. Failed usage: `5h ?` (and `wk ?`), rest of the line intact.
- Colour: ANSI `\x1b[33m` yellow / `\x1b[31m` red wrapping that segment's text, reset `\x1b[0m`. Context yellow >= 70000 tokens, red >= 80000 with `→ /compact` in the stripped line. Usage (5h and wk) yellow >= 80%, red >= 90%. Nothing yellow/red below.
- Warm cache run < 300 ms (best of 5 in the test). The source must not contain `fetch(`, `http(s)://`, `api.anthropic`, `node:http(s)`, `node:net`, or a spawn/exec of `claude`.
- **Context handoff to scripts/context.mjs (AC5):** whenever stdin carries current_usage, statusline.mjs persists the number keyed by `session_id` somewhere under `$HOME/.claude/` (HOME env, same as context.mjs uses). `context.mjs` with `CLAUDE_CODE_SESSION_ID=<id>` then prints `{session:<id>, context_tokens:<n>, percent}` from it, preferring it over that session's transcript; a session with no saved number falls back to the transcript path exactly as today (scripts/context.test.mjs must keep passing).

**scripts/session-start.mjs (110)**
- stdin: `{hook_event_name:"SessionStart", source:"startup|resume|compact", agent_type:"orchestrator"}`. Only `agent_type === "orchestrator"` produces output; anything else (other cell, missing agent_type) prints nothing and must not run gh. **Assumption to verify in the docs:** SessionStart input carries `agent_type` for `claude --agent <name>`.
- Output: plain stdout. Lines: latest handoff path (`.scratch/_handoffs/<name>`, chosen among `*-orchestrator-*.md` by date prefix then numeric suffix, not mtime or string order; none: a handoff line containing "none"); one open PR per line with `#<n>`, and a word matching pass/fail/pend; a PR line containing "PR" and "unknown" on failure; pending request lines naming each pending request's ref; a usage line containing "usage", `11%` and `51%` (or "unknown"). Hard cap 1600 chars (400 tokens): truncate the PR and request lists, never the handoff or usage line.
- Env: `GH_BIN` (default `gh`; run as `gh pr list --json number,title,statusCheckRollup ...`, parse a JSON array; rollup entries `{status,conclusion}`); `SESSION_START_USAGE_SCRIPT` (as above); `SESSION_START_TIMEOUT_MS` (default 5000, applies to gh and the usage read; a timeout or non-zero exit or spawn failure means "unknown").

**scripts/notify.mjs (111)**
- stdin: `{hook_event_name:"Notification", message}` or `{hook_event_name:"Stop"}`; any other event or bad input: no-op, exit 0.
- Env: `NOTIFY_POWERSHELL` (default `powershell.exe`; spawn it with the message however you like: argv, stdin or env; the test searches all three; no separate WSL gate, a toast is attempted whenever the command runs and exits 0); `NOTIFY_BELL_PATH` (default `/dev/tty`, else stderr; fallback writes one `\x07`); `NOTIFY_STATE` (JSON file of already-notified gates; format yours; default must not be inside a tracked repo path).
- Gate = a ticket in `.scratch/*/issues/*.md` whose `**Status:**` is `ready-for-human`. Identity = the ticket ref. Stop toasts (or bells) naming "DimSumDen" and the ticket number only for gates not yet notified; each gate notifies once; gates that cleared are dropped from state so a re-raised gate notifies again; Notification events always toast and do not touch gate state. Delivery by toast or by bell both count as notified.
- Source must not contain a network/model call (same scan as statusline).

## Notes

- Why a few extras: one test per bullet of risk named in the ticket (hang timeouts, malformed stdin, handoff ordering, 400-token cap).
- Open question for the orchestrator (111): the ticket lists merge proposals, ready-for-human and "a question to the user" as gates, but only `ready-for-human` has a board representation. Tests pin only that.
- 109 and 110 each read pending gate requests from `.scratch/_requests/requests.jsonl`; those are the user's UI approvals awaiting the orchestrator, which is what the tickets name.
