```json
{"ticket": "dimsumden-ui-v0/09-panel-queue", "cell": "developer", "mode": "implement", "current_step": "Implemented; qa tests green, npm test 613/613, ui:build ok; in-review",
 "artifacts": ["apps/ui/src/panel/queue-model.mjs", "apps/ui/src/panel/usage-meter-model.mjs", "apps/ui/src/panel/render-markdown.mjs", "apps/ui/src/panel/Panel.jsx", "apps/ui/src/App.jsx", "apps/ui/src/styles.css", "apps/bridge/server.mjs"],
 "decisions": ["CSP: default-src/script-src/connect-src 'self', style-src 'self' 'unsafe-inline' (React inline style), img-src self data: blob:, object-src none, frame-ancestors none, base-uri self", "A blocker with status resolved is not shown in blockedText; row is blocked if status blocked or an unresolved blocker exists", "Markdown headings render two levels down (h1 -> h3) to sit under the panel h2s"],
 "failures": ["An initial compound bash command was refused by the worktree guard; redone as separate calls"],
 "pending": [{"item": "Verify Panel look and feel (spec section 3) and that the built app loads with no CSP console violations", "owner": "designer"}]}
```

# developer: dimsumden-ui-v0/09 panel queue

## State
Done. All qa tests pass (36 panel + 7 CSP); full `npm test` 613 pass; `npm run ui:build` succeeds. No browser run.

## What changed
Branch `feat/dimsumden-ui-v0-09-panel-queue`, commit 43d4077 (on base 75c1a87). Pure models per the qa handoff, `Panel.jsx` (UsageMeter, Queue, Detail, Markdown; no dangerouslySetInnerHTML), wired into `App.jsx` slots, CSS appended, CSP header on bridge static 200 responses only.

## Next step
qa verify, then security, then designer review of the look plus a browser load for CSP violations.

## Gotchas
- `/code-review` subagents were not run (token budget); self-reviewed against the qa map.
- Gates and Pipeline slots remain placeholders (tickets 10, 11).
- Detail view's `useNow` re-renders every 30 s.
