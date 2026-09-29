```json
{"ticket": "dimsumden-ui-v0/09-panel-queue", "cell": "security", "current_step": "Security pass with one medium (markdown link-regex ReDoS) and two lows; handed to orchestrator", "artifacts": [], "decisions": ["Pass: no critical or high finding. CSP and text-only rendering hold. gitleaks clean on origin/main..43d4077. No dependency or lockfile change."], "failures": [], "pending": [{"item": "Fix or ticket the medium: bound parseInline link regex cost in render-markdown.mjs and memoize parseMarkdown in Detail", "owner": "developer"}, {"item": "Optional: tighten CSP to style-src 'self' plus style-src-attr 'unsafe-inline' if the build allows", "owner": "developer"}]}
```

# security: dimsumden-ui-v0/09 panel queue

## State
Security pass. Branch `feat/dimsumden-ui-v0-09-panel-queue` at 43d4077. Diff reviewed by hand against origin/main (11 files, no dependency, lockfile or workflow change).

## Findings
1. MEDIUM `apps/ui/src/panel/render-markdown.mjs:37` (link regex in parseInline): super-linear backtracking, plus `s.slice(i)` per `[`. Agent-written handoff text of 8 KB (the HANDOFF_CAP in apps/bridge/snapshot.mjs:8) freezes the UI thread: `"[a](b".repeat(1638)` took 3.9 s, `"[a]((".repeat(1638)` 8 s, `"[](".repeat(2730)` 12 s (measured with node). `Detail` (Panel.jsx) calls `parseMarkdown` on every render and re-renders every 30 s via `useNow`, so the freeze repeats while the ticket is selected. Untrusted text (a prompt-injected agent) causes it; impact is UI availability only, local single-user. Fix: scan for the closing `)` with a linear indexOf/depth loop instead of the regex, or cap inline length; wrap parse in `useMemo` keyed on the text.
2. LOW `apps/bridge/server.mjs:18` CSP: `style-src 'self' 'unsafe-inline'`. Acceptable now: script-src is `'self'` with no inline or eval, all agent text renders as React text nodes, and the only inline styles are the meter width (a clamped number) and R3F CSSOM writes. Residual risk is CSS-only injection, and no path from agent text to a style attribute exists. Could narrow to `style-src 'self'; style-src-attr 'unsafe-inline'` if the built CSS is a linked file (index.html has no inline `<style>`). Not blocking.
3. LOW `apps/ui/src/panel/Panel.jsx` Inline link: `href` is agent-controlled `https?://` with `target=_blank rel="noopener noreferrer"`. No javascript:, data: or relative schemes reach it (verified: `[x](javascript:...)` and `[y](data:...)` degrade to text). Quote and attribute characters in the URL are escaped by React. Phishing-by-link only; accepted.

## Checked clean
- Text-only rendering: no `dangerouslySetInnerHTML` or `innerHTML` in panel code (a test greps for it); raw HTML like `<img onerror>` stays literal text. `dev-scene.mjs` innerHTML predates this branch and uses a fixed icon set.
- CSP: sent on every static 200 including SPA fallback; `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `connect-src 'self'`; script-src has no unsafe-inline, unsafe-eval, wildcard or foreign origin. API/JSON routes carry no CSP (not needed). Bridge still binds 127.0.0.1 (server.mjs HOST); unchanged.
- Secrets: `gitleaks detect --log-opts="origin/main..43d4077"`: no leaks.
- Dependencies: none added; `npm ci` reports 0 vulnerabilities.

## Next step
Orchestrator: propose merge; consider dispatching developer for finding 1 (small) now or as a follow-up ticket. Designer still owes the browser check that the CSP produces no console violations (qa forwarded).

## Suggested skills
tdd (add a test with the 8 KB pathological inputs and a time bound).

## Gotchas
- `scripts/board.mjs` does not exist; use `npm run -s board -- ...`.
