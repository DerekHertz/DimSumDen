# Handoff: showcase-v1 batch (02, 03, 04, 05): qa verify (full)

```json
{"ticket": "showcase-v1/02-low-poly-grove", "cell": "qa", "current_step": "verify done; verdict pass on all four, with items needing the user's eye",
 "artifacts": [],
 "decisions": ["pass 02-05: unit tests and build green, only browser smoke failures (environment)"],
 "failures": ["5 smoke tests fail: Chromium 1194 vs Playwright 1243, executable missing (environment, not code)"],
 "pending": [{"item": "user browser check and a real smoke:ui run", "owner": "user"}]}
```

## Run (detached at acc2be0, showcase-v1/integration head)
- `npm test`: all pass except 5 browser smoke tests (smoke.test.mjs:295, smoke-ui.test.mjs:68, :80, :92, :98). Cause: Playwright cannot launch its browser here. No skipped tests, no other failures.
- `npm run ui:build`: succeeds (existing node:fs externalized warning from panda-contract.mjs, chunk size warning).
- No qa specify hop, so no specify test files to diff. No deleted or weakened tests seen in the scene tests by name; the only test-side edit outside new tests is smoke-ui.mjs EXPECTED_CHIPS (below).
- Diff touches nothing under .claude, docs, CLAUDE.md, CONTEXT.md, package.json or the lockfile.

## Criterion map
02 grove
- Instanced, layout test: grove.test.mjs "grove is instanced", grove-layout.test.mjs (seed determinism, counts per layer). Pass.
- Frame budget with 30 cells: only a proxy (grove.test.mjs "total triangles stay small"). human-verified needed (frame rate in browser).
- No console errors; smoke:ui: not runnable here. Needs a real run.
- Scope added: slower sway (grove-layout.test.mjs "sway is slower than dur-breath, bounded, still under reduced motion"), wider grove, front stalls closer, pan reach (camera-rig), back stalls raised or front roofs lowered (sight-line test in the batch). Covered by unit tests; visual result is the user's eye.

03 board
- Clickable, keyboard-reachable, accessible name: board-face.test.mjs "labelled Today's board..." and "wiring: keyboard-reachable chip and clickable mesh". Keyboard route is a real button chip (ChipLayer.jsx:71-78), so Enter works. Pass.
- Opens the existing Dashboard with hidden data tables: wiring test plus Dashboard.jsx unchanged in chart/table markup (only metrics now shared via useMetrics). No test opens the panel and finds the tables in a DOM; browser check needed.
- smoke:ui: not runnable.

04 message passing
- Pure derivation with tests for station change, same-station, new, resolved: handoffs.test.mjs lines 16-49. Pass.
- Susan turn, lantern and bell, dev fixture: handoffs.test.mjs (turnAngle, lanternState, wiring), handoff-fixture.test.mjs, `?demo=handoff`. Animation feel and heart bubble are the user's eye.
- Reduced motion jump: handoffs.test.mjs:132. Pass.
- Scope: queued tickets baskets only (scene-from-state tests, handoff-fixture "queued ticket has a basket but no panda"); pan limit for wide stalls (camera-rig tests). Pass.
- smoke:ui: not runnable.

05 name and font
- Title and header: brand.test.mjs. Pass.
- CSP: bridge-csp.test.mjs #8 (style-src fonts.googleapis.com, font-src fonts.gstatic.com, nothing wider). Pass.
- No UI copy or numbers in Long Cang: brand.test.mjs allowlist test. Pass.
- Station labels on pill: station-labels.test.mjs. Visual: user's eye.

## Flagged items from developer handoffs
1. smoke-ui.mjs edit (EXPECTED_CHIPS 6 to 3, selector excludes .chip-board). Justified by the ticket comment (queued tickets have no panda). The assertion count is a literal, not recomputed, and it follows the user's requirement. Acceptable, but it was not run; the number must be confirmed by a real smoke:ui run.
2. External font fetch: smoke.mjs records `requestfailed` and 4xx responses as failures (smoke.mjs:91-97). With no internet, the Google Fonts request will fail smoke and smoke:ui. This is a real CI and offline risk. Suggest a follow-up ticket (self-host Long Cang, or allowlist fonts.googleapis.com/gstatic in smoke). Not a bounce, since the ticket asks for Google Fonts. Orchestrator and user decide.
3. dur-slow = 700 ms: no token exists in the repo (only dur-fast 160 ms in styles.css). The developer invented the value. Ticket cites a token defined only in the design-system artifact. Needs the user or designer to confirm 700 ms.

## Needs the user's eye
Frame rate with 30 cells; grove look and slow sway; back-row Steamers visibility past the front roofs; pan reach to the widest stall; board readable and opens the Dashboard by click and Enter; basket turn, heart bubble, lantern and bell (`?demo=handoff`); Long Cang loads and labels sit on pills; a real `npm run smoke:ui` run online.

## Files outside scope
None beyond the batch. Ticket 01 code was built on, not re-verified.
