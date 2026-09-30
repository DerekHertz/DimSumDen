# Handoff: showcase-v1/08 qa full verify

Verdict: QA pass. Branch showcase-v1/08-self-host-font @ d906082.

- npm test with PW_CHROMIUM_PATH set: 874 tests, 874 pass, 0 fail, 0 skipped. (Without the variable, smoke.test.mjs:303 fails with "playwright not installed"; environmental.)
- npm run smoke:ui: all PASS, including new "font" check (0 Google requests, Long Cang loaded).
- Criteria map: no Google request -> brand.test.mjs:16 (source), bridge-csp.test.mjs (CSP), smoke-ui.mjs font check (runtime). Renders from woff2 -> @font-face in styles.css, smoke-ui font check; title/Tally face use the same family. OFL + no dependency -> brand.test.mjs asserts OFL.txt; package.json not in diff. smoke:ui green -> run above.
- Grep for googleapis/gstatic: only remaining hits are the negative assertions in tests and smoke-ui, plus old board handoffs.
- CSP change (apps/bridge/server.mjs:19) is in scope: removes the two Google hosts only; script-src, connect-src, img-src untouched. Test rewritten to be stricter (no https: in any directive).
- Old tests rewritten (Google-loading assertions replaced), not weakened.
- Files outside scope: none. Diff vs cec01ba touches only the 8 files: bridge-csp.test.mjs, server.mjs, smoke-ui.mjs, index.html, brand.test.mjs, fonts/OFL.txt, fonts/*.woff2, styles.css.
- Not covered: visual sameness of glyphs (latin subset, same font) is human-verifiable only; low risk.

## State

```json
{"ticket":"showcase-v1/08-self-host-font","cell":"qa","current_step":"Full verify done, QA pass","artifacts":[],"decisions":["QA pass"],"failures":[],"pending":[],"mode":"verify"}
```
