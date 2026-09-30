# Handoff: showcase-v1/08 self-host font (developer)

Branch showcase-v1/08-self-host-font (pushed). Status: in-review.

- Font: apps/ui/src/fonts/long-cang-latin-400-normal.woff2 (12 KB, from @fontsource/long-cang 5.3.0 via npm pack, latin subset; display text is Latin only) plus OFL.txt beside it. No dependency added.
- styles.css: local @font-face (swap). index.html: Google links removed. bridge/server.mjs CSP: dropped fonts.googleapis.com and fonts.gstatic.com (style-src and font-src now self only).
- Tests: brand.test.mjs and bridge-csp.test.mjs rewritten to assert self-hosting and no Google host; smoke-ui.mjs gained a "font" check that records page requests (0 Google hosts) and confirms Long Cang loaded.
- Results: npm test 874/874 pass; npm run smoke:ui all PASS with PW_CHROMIUM_PATH set.
- Note: Chinese-simplified subsets not bundled; nothing renders CJK in Long Cang.

## State

```json
{
  "ticket": "showcase-v1/08-self-host-font",
  "cell": "developer",
  "current_step": "Implemented, tests and smoke:ui green, pushed; awaiting qa verify",
  "artifacts": ["apps/ui/src/fonts/long-cang-latin-400-normal.woff2", "apps/ui/src/fonts/OFL.txt"],
  "decisions": ["latin subset only", "CSP dropped Google hosts"],
  "failures": [],
  "pending": [{"item": "full verify", "owner": "qa"}]
}
```
