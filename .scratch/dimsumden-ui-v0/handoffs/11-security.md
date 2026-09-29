```json
{"ticket": "dimsumden-ui-v0/11", "cell": "security", "current_step": "Security review done: pass, no critical or high findings; two low findings noted", "artifacts": [".scratch/dimsumden-ui-v0/handoffs/11-security.md"], "decisions": ["Rated the __proto__ cell-name crash low, not a bounce: input is agent-written usage.jsonl on a loopback-only, Host-checked route, and the failure is a generic 500"], "failures": [], "pending": [{"item": "Propose the merge to the user (brain gate); optionally file a low ticket to harden scripts/metrics.mjs accumulators", "owner": "orchestrator"}]}
```

# 11 security review: PASS

Branch feat/dimsumden-ui-v0-11-dashboard-charts, commit 9ec5bec, diff origin/main..9ec5bec (bridge/server.mjs, ui Dashboard.jsx, dashboard-model.mjs, App.jsx, styles.css, tests). No dependency, lockfile, or workflow changes. `npm ci` reports 0 vulnerabilities. gitleaks over origin/main..9ec5bec: 3 commits scanned, no leaks.

## Findings

- scripts/metrics.mjs:37 (low, pre-existing code, newly reachable over HTTP): `acc[r.cell] ??= ...` on a plain `{}`. A usage row with `cell: "__proto__"` makes `acc[...]` return Object.prototype, so `a.tickets.add` throws (reproduced with a probe). GET /metrics then returns the generic 500 "internal error", and the dashboard shows "Metrics unavailable" until the row is gone. No pollution, no disclosure. Fix: use `Object.create(null)` or a `Map` for `acc`, `tokensByCell`, `inc` and `incidentsByTool`. Not blocking; usage.jsonl is written only by local cells.
- apps/bridge/server.mjs:56-58 (low): each GET /metrics reads all of usage.jsonl and events.jsonl (events is unused by computeMetrics) with no size cap or cache, and the UI refetches on every metricsRevision. Loopback-only, so the exposure is self-inflicted slowness as logs grow. Suggest dropping the events read until it is used, and caching on mtime later.

## Checked

- Exposure: the route sits behind the existing 127.0.0.1 bind and the Host-header allowlist (DNS-rebinding guard). No CORS headers, so a foreign page cannot read the response. `Cache-Control: no-store` is set.
- File access: the paths are fixed (`.scratch/usage.jsonl`, `.scratch/events.jsonl` under root); the request supplies no path or query input, so there is no traversal. There is no write, so no lock race. A missing file gives `[]`. `parseJsonl` skips malformed lines and non-object rows.
- Data disclosed: only aggregate counts, token totals, cell and tool names, and the latest usage percentages. No ticket text, no paths, no secrets.
- Rendering: labels from log data (cell names, tool names) reach SVG only as React text children in `<text>`, `<title>`, `<desc>` and table cells. React escapes them, and the tool list is bounded by `mapTool`. There is no dangerouslySetInnerHTML in the changed files (an existing test enforces this). Chart ids are constants, so the aria-labelledby ids cannot be injected. The CSP (`script-src 'self'`) covers the served page.
- Robustness: `dashboardModel` tolerates missing or wrongly typed fields (`Number()` plus `isFinite` filter, `slice(-12)`). `windowLabel` tolerates an invalid date. A very long cell name could overflow the label column visually (cosmetic only).
- Client fetch: same-origin GET `/metrics` with `cache: "no-store"` and no user input in the URL.

## Next step

Orchestrator proposes the merge to the user. Optionally ticket the low hardening of scripts/metrics.mjs (developer).

## Suggested skills

organism-protocol.

## Gotchas

`gitleaks detect --log-opts` worked as documented. No refused calls except one compound Bash command that the worktree guard rejected; I split it into separate calls.
