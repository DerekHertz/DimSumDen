```json
{
  "cell": "security",
  "ticket": "dimsumden-ui-v0/04-bridge-state",
  "current_step": "security review: pass (1 medium, 2 low)",
  "artifacts": [
    "feature/dimsumden-ui-v0-04-bridge-state @ 0be900abd7c73a1167711e627c9471938194a2e8"
  ],
  "decisions": [
    "Security pass: no critical/high findings",
    "Medium finding (unhandled Invalid URL crash) is non-blocking per genome but the fix is two lines; recommend the orchestrator ask the developer to fold it in before ticket 05 adds SSE"
  ],
  "failures": [],
  "pending": [
    {
      "item": "propose merge (brain gate)",
      "owner": "orchestrator"
    },
    {
      "item": "fix apps/bridge/server.mjs:19 crash (medium) in this ticket or 05",
      "owner": "orchestrator"
    }
  ]
}
```

# 04 security review

Diff: origin/main..0be900a (5 files: server.mjs, snapshot.mjs, bridge-fixture.mjs, bridge-state.test.mjs, package.json). Security pass.

Checks run: gitleaks over origin/main..0be900a (2 commits, no leaks); npm audit (0 vulnerabilities); package.json diff is one added `bridge` script, no dependency or lockfile change.

## Findings

- apps/bridge/server.mjs:19, medium. `new URL(req.url, "http://x")` throws Invalid URL for request targets like `//` or `http://[`, inside an async handler with no catch. Verified: a raw `GET // HTTP/1.1` with a correct Host header kills a bare Node 22 server (exit 1), and against startBridge it produced an unhandled rejection and no response. Any web page the user visits can send this (`fetch("http://127.0.0.1:4317//", {mode:"no-cors"})`; the Host header passes the allowlist), so a page can repeatedly kill the daemon. Availability only: no data read or written. Fix: wrap the handler body in try/catch, or parse the URL in the try and return 400. Add a test with a `//` target.
- apps/bridge/server.mjs:27, low. The 500 response echoes `err.message`, which can include filesystem paths. Loopback and Host-checked, so minor; return a generic message and log the detail.
- apps/bridge/snapshot.mjs:231 (handoff text), low, forward-looking. Handoff text (capped at 8 KB) and ticket titles/blockedReason are untrusted agent text sent to the UI. Not exploitable here (JSON, `application/json`). Ticket 07's UI must render them as text, never innerHTML, and never into a shell or path.

## What I checked and found sound

- Binding: `server.listen(port, "127.0.0.1")` only, loopback IPv4. Not 0.0.0.0.
- DNS rebinding: Host header must equal `127.0.0.1:<port>` or `localhost:<port>`; a missing Host is rejected 403. `actualPort` is updated after listen, so port 0 works.
- No CORS headers are sent, so cross-origin pages cannot read /state. The route is GET-only, and there are no write routes in this ticket. When 05/06 add POST /requests, they need an Origin check and a JSON content-type requirement, because a simple cross-origin POST passes the Host check.
- Path traversal: every path in snapshot.mjs is built from `readdir` names under `.scratch/` or from the ticket file name; nothing is taken from the request. Read-only: no write path, no shell-out. Handoff lookups stay within `<feature>/handoffs/`. A symlink planted inside `.scratch/` would be followed (local trust, accepted).
- Lock reads are plain reads, so there are no lock races or writes. Malformed jsonl lines and ticket files are skipped or caught. Header regexes are linear (no ReDoS).
- Secrets: none.
