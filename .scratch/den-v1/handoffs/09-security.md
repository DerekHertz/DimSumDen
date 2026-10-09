# Handoff: den-v1/09 security review

```json
{
  "ticket": "den-v1/09-demo-mode",
  "cell": "security",
  "current_step": "Security pass at 1168db0. No critical, high or medium findings; one low note.",
  "artifacts": [],
  "decisions": [
    "Pass: demo code is pure client-side, no fetch/token/EventSource in apps/ui/src/demo, no HTML sinks.",
    "gitleaks origin/main..1168db0: 2 commits, no leaks. npm audit: 0 vulnerabilities. No package.json, lockfile or workflow changes."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Orchestrator: open PR and merge on green CI.",
      "owner": "orchestrator"
    }
  ]
}
```

## Review

- Fixture text and ticket titles render through React text nodes only (no innerHTML, dangerouslySetInnerHTML, eval).
- `?demo=den` is compared to the exact value "den"; URL rewrite uses URLSearchParams and `history.replaceState` on the same origin path. No open redirect.
- Steering gates: `inDemo` is passed as `demo` to the approval review and message composer, which refuse to open. `demoCard` greys T, A, D. No bridge call path from the demo modules.
- Reachability test exemption is a single README path; harmless.

## Low

- apps/ui/src/App.jsx:51 (low, pre-existing): `useSession()` still runs on mount in Demo mode, so `session.start()` may redeem a launch code if one is in the URL. The demo logic itself never reads the token or calls the bridge. Not caused by this branch (same for `?demo=handoff`); consider skipping session start in demo later.
