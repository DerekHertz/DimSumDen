```json
{"cell": "qa", "mode": "specify", "ticket": "dimsumden-ui-v0/09-panel-queue", "status": "ready-for-agent", "branch": "tests/dimsumden-ui-v0-09-panel-queue"}
```

# qa specify: dimsumden-ui-v0/09 panel queue

Branch `tests/dimsumden-ui-v0-09-panel-queue` (base b2980aa). Tests only; all fail for missing modules or a missing header.

## Interfaces the developer must create (pinned by the tests; the .jsx stays thin)

- `apps/ui/src/panel/queue-model.mjs`: `queueModel(snapshot)` -> `{frontier, inFlight, empty}`; row `{ref, title, priorityLabel, bumped, bumpLabel, cellType, status, blocked, blockedText, blockedReason}`. `detailModel(snapshot, ref|null)` -> `{kind: "none"|"missing-handoff"|"handoff", message, ref, title, status, holder, handoff}`.
- `apps/ui/src/panel/usage-meter-model.mjs`: `usageMeterModel(usage|null, nowMs)` -> `{label, valueText, level, statusText, fillPercent, ariaValueNow, ariaValueText, secondary}`.
- `apps/ui/src/panel/render-markdown.mjs`: `parseMarkdown(text)` -> block/inline node tree (shapes in the test header). The .jsx maps nodes to React elements.
- `apps/bridge/server.mjs`: static responses add a `Content-Security-Policy` header.

## Criterion to test map

| Criterion | Test file | Tests |
|---|---|---|
| Queue renders in priority order on a fixture | `apps/ui/src/panel/queue-model.test.mjs` | frontier order not array order; in-flight after frontier sorted by ref; effective priority label; bumped "P1 ↑" + "Bumped from P2 after 3 sessions"; blocked text and reason; empty |
| Selecting a ticket shows its latest handoff | `apps/ui/src/panel/queue-model.test.mjs` | detailModel: text/path/mtime, holder, truncated, no handoff, no selection, resolved ref, fresh snapshot updates |
| Usage meter (What to build) | `apps/ui/src/panel/usage-meter-model.test.mjs` | label/value/aria, secondary line, thresholds 80 and 95 with text, not sampled |
| Handoff rendering safe (forward: re-check text-only rendering) | `apps/ui/src/panel/render-markdown.test.mjs` | headings, lists, fenced code, bold, inline code; only http/https links (javascript:, data:, vbscript:, file:, relative, protocol-relative are text); raw HTML stays text; no `dangerouslySetInnerHTML` anywhere in `apps/ui/src` |
| Scope: CSP script-src 'self' on static responses (07 security forward) | `apps/bridge/bridge-csp.test.mjs` | header on /, asset and SPA route; no unsafe-inline/eval/foreign origin; object-src and frame-ancestors 'none'; connect-src or default-src 'self'; 404 and API unaffected |

`render-markdown.test.mjs` "no dangerouslySetInnerHTML" is green today by design (a guard); every other test is red.

## human-verified

- Designer spec section 3 look and feel (pill styling, meter colours, `role="meter"` attributes, `aria-current`, focus ring, row buttons, region `aria-live="off"`): components are unverified by node tests; designer reviews after qa. Also the CSP must not break the built app: the browser smoke (ticket 13) or designer's run confirms the page loads with no console CSP violations (Vite output uses `<script type="module" src>`, which 'self' allows; inline styles need no script-src change).

## Notes for the developer

- The CSP `style-src` is not pinned; React inline `style` attributes may need `style-src 'self' 'unsafe-inline'`.
- Non-frontier ready-for-agent tickets with unresolved blockers are not pinned to a section; the tests only pin the blocked-status row.
- No dependency change needed.
