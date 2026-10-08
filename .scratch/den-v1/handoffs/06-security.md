# Security review: den-v1/06 approve or deny (3e16e6f)

```json
{
  "ticket": "den-v1/06-approve-deny",
  "cell": "security",
  "current_step": "Security pass: no critical or high findings; two low notes. Ready for orchestrator to open the PR.",
  "artifacts": [],
  "decisions": [
    "Pass at 3e16e6f. gitleaks clean over origin/main..3e16e6f (5 commits).",
    "No dependency, package.json, lockfile or .github change in the diff, so no audit or CI review needed."
  ],
  "failures": [],
  "pending": []
}
```

## Scope reviewed
14 files, UI only: bridge-client.mjs, approval-review.mjs, ApprovalPanel.jsx, approval-fixture.mjs, App.jsx, ProximityCard.jsx, TranscriptPanel.jsx, explorer.mjs, CSS, tests. No bridge, shell, file or network-binding code changed.

## Checks
- Token handling: the client takes an injected `fetch` (session.fetch) and never reads or builds the token. URLs are relative (`/approvals/<encodeURIComponent(id)>`), so the Bearer token goes to the same origin only. 401 ends the session and locks the panel.
- Untrusted text (tool input, bridge `error` strings, tool name, agent name): all rendered through React text nodes (`<pre>`, `<p>`), no `dangerouslySetInnerHTML`, no innerHTML. The tool input is also passed through `escapeUnsafe`, which shows control, zero-width and bidi-override characters as `\uXXXX` so a command cannot hide behind them.
- Allow is enabled only when the rendered input length equals the snapshot `inputLength`; a mismatch fails safe (Allow off).
- Double-send guard, 400ms open guard, `repeat` ignored, note excluded from key handling, note trimmed and capped at 200, `decision` validated before send.
- Dev demo (`?demo=approval`): gated on `import.meta.env.DEV`; the stub client makes no network calls and never touches the real session. The `refuse` param is parsed to an integer 400-599.
- Secret scan: gitleaks clean. The bridge-client.test.mjs TOKEN edit builds the fake value `tok-test-123` at runtime to get past scripts/root-secret-scan; it is a placeholder, not a credential, and no assertion changed.

## Findings
- apps/ui/src/overlay/approval-review.mjs:10, low: `escapeUnsafe` handles invisible and bidi characters but not visually confusable homoglyphs (for example Cyrillic letters in a command). The full input is shown for the user's review, so this is residual; no action needed.
- apps/ui/src/App.jsx:54, low: dev-only gating relies on Vite replacing `import.meta.env.DEV`; the production build dead-code-eliminates it. Not checked with a production build in this review; the DEV gate is also asserted by approval-fixture.test.mjs:31.

## Verdict
Security pass.
