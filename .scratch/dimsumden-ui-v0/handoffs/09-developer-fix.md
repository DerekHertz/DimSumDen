```json
{"ticket": "dimsumden-ui-v0/09-panel-queue", "cell": "developer", "mode": "fix", "current_step": "Fixed security medium (link ReDoS) and memoized Markdown parse; in-review", "artifacts": ["apps/ui/src/panel/render-markdown.mjs", "apps/ui/src/panel/Panel.jsx", "apps/ui/src/panel/render-markdown.test.mjs"], "decisions": ["Replaced the link regex with a linear matchLink scan (indexOf, no slice). Wrapped parseMarkdown in useMemo keyed on text.", "Low #2 (CSP style-src-attr) skipped: optional and needs a browser check the designer owes."], "failures": [], "pending": [{"item": "Optional CSP narrowing (security low 2)", "owner": "orchestrator"}]}
```

# developer fix: 09 panel queue

## State
Security medium fixed. 8 KB pathological inputs (`[a](b`, `[a]((`, `[](` repeated) now parse in under 500 ms (test bound). Balanced-paren URLs now parse fully (a test was added; the old regex truncated `A_(b)_c`). Full `npm test` 615/615 pass; UI build clean.

## Next step
qa verify or security re-check, then merge.

## Gotchas
- Quadratic worst case remains across many `[` on one line but at the 8 KB cap is milliseconds.
