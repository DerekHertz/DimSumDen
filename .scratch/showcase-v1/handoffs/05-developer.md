# Handoff: showcase-v1/05 name and font: developer

```json
{"ticket": "showcase-v1/05", "cell": "developer", "current_step": "implemented and pushed; awaiting browser check and qa verify",
 "artifacts": ["apps/ui/index.html", "apps/ui/src/styles.css", "apps/ui/src/brand.test.mjs", "apps/ui/src/scene/station-labels.mjs", "apps/ui/src/scene/station-labels.test.mjs", "apps/ui/src/scene/ChipLayer.jsx", "apps/ui/src/scene/BoardFace.jsx", "apps/bridge/server.mjs", "apps/bridge/bridge-csp.test.mjs"],
 "decisions": ["only Long Cang is loaded from Google Fonts; Nunito stays a named stack entry with system fallbacks, as before", "display font used by .panel-header h1, .station-label, .chip-board and the board face heading only"],
 "failures": ["browser smoke cannot run here (Chromium 1194 vs Playwright 1243)"],
 "pending": [{"item": "browser check: fonts load, labels sit on pills, and smoke/smoke:ui tolerate the external font request (offline CI may log a failed request)", "owner": "qa"}]}
```

## State
Done, in-review. Branch `showcase-v1/integration`.

## What changed
- Title and header already read Dim Sum Den; `brand.test.mjs` now locks both.
- `index.html`: preconnect plus the Google Fonts stylesheet for Long Cang.
- `styles.css`: `--font-display`, `--rice-paper`; the display font applies only to `.panel-header h1`, `.station-label`, `.chip-board` (a test enforces the allowlist and that number and data selectors do not use it). The header comment about "no external fetch" was updated.
- Bridge CSP: `style-src` adds `https://fonts.googleapis.com`, new `font-src 'self' https://fonts.gstatic.com`; `bridge-csp.test.mjs` checks nothing wider (script-src and connect-src untouched).
- `station-labels.mjs` (pure) plus `ChipLayer.jsx`: one label per stall above its roof apex, on a rice-paper pill (non-interactive, follows the stall as it widens).
- `BoardFace.jsx`: heading in Long Cang, redrawn when the font loads.

## Gotchas
- This reverses the earlier "no external fetch" decision, as the ticket asks. A `smoke`/`smoke:ui` run without internet may report a failed font request as an asset failure; I could not run them.
- Full `npm test`: 755 pass, 5 fail (the browser smoke tests only).
