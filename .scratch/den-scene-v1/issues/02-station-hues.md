# 02: Station hues from design tokens

**Type:** feature

**Priority:** P1

**Blocked by:** None

**Status:** resolved

**Design refs:** `docs/design/den-map.md` (coordinates, constants, checks) and `docs/design/2026-09-29-scene-decisions.md` (the why), on branch `design/scene-decisions-0929` until it merges. Target frame: "Level 1 · Den (target)" on the Zoom levels page of the zoom frames canvas (https://claude.ai/artifact/JsxZ5Vj7DxJQbekA2Ehoot). Design system: https://claude.ai/artifact/HBXgYhAzu6YmekpW71WM7j (Scene, Glossary, Panda roles).

## What to build

Replace the hard-coded `HUE` map in `Market.jsx` (steamers `#e0a458`, front-of-house `#d9707e`, tea `#6fae7a`, pantry `#5f8fbf`) with the `station-*` tokens the design system defines. Pass is wisteria, Steamers porcelain blue, Tea jade, Pantry bamboo green, and Front of House azure.

- Read the values from the app's existing token source (the same place the UI already reads `qi`, `lantern` and so on). If there isn't a JS-side token map yet, add one small module that exports the station hues for light and dark, with the values copied from the design system's `tokens.json`, plus a test that pins them.
- Anything that picks a colour by station goes through this module. That includes stall trim now, and scarves (09), plate rims (04) and sidebar pills (07) later.
- No other visual change.

**Files:** `apps/ui/src/scene/Market.jsx`, a new or existing token module, tests.

## Acceptance criteria

- [ ] `Market.jsx` contains no hex station hue (grep test)
- [ ] Every station maps to the `station-*` token value for the active theme (unit test, both themes)
- [ ] Switching theme updates stall trim colour without reload (if theme switching already exists)

## Comments

- **Created (designer, 2026-09-30):** Filed from the 09-29/30 design session; the user approved every decision in this ticket.
- **orchestrator, 2026-09-30:** Codex orchestration: authoritative light/dark station token values are absent from the checkout. User will paste the approved values; implementation awaits them. Local palette values will not be guessed.
- **orchestrator, 2026-09-30:** Approved token source (user design-system screenshot, 2026-09-30): light/dark pairs: station-pass #674698/#C3A5F9; station-steamers #2759A2/#87B9FF; station-tea #006E54/#56D0AF; station-pantry #326A2D/#8ACB83; station-front #00658B/#55C6F4. Map front-of-house to station-front. Zone pairs supplied: pass #E8DFFC/#322843; steamers #D5E6FF/#1E2E47; tea #CBEEE1/#0C362B; pantry #D6ECD3/#1F341C; front #CAEBFA/#0C3241. Implement approved station colours without inventing a station-front-of-house token.
- **orchestrator, 2026-09-30:** User supplied complete tokens.json. Authoritative source is the attached Pasted text.txt; station-* aliases resolve to the screenshot values recorded above. Plan: foundation batch with 01 and 02 on one review branch because both touch Market.jsx; implementations remain sequential, with a combined QA/design/risk review and PR. Blender asset work deferred by user.
- **orchestrator, 2026-09-30:** Authoritative user-supplied tokens.json archived unchanged at docs/design/tokens.json for the next session. Context is now 120k (5-hour usage 53%, user-reported): finish 01 checkpoint only; do not start 02 this session. Planned foundation batch remains 01+02; no Blender asset work yet.
- **designer, 2026-09-30:** Design spec: preserve the merged station layout, geometry, camera, labels and interactions; change station-driven stall trim only. Use docs/design/tokens.json aliases: pass -> station-pass (#674698 light / #C3A5F9 dark), steamers -> station-steamers (#2759A2 / #87B9FF), tea -> station-tea (#006E54 / #56D0AF), pantry -> station-pantry (#326A2D / #8ACB83), front-of-house -> station-front (#00658B / #55C6F4). Centralize all current station hue selection in one reusable theme-aware module; keep station-zone tokens out of trim. Active theme follows the existing prefers-color-scheme behavior, including live changes without reload. Empty/loading/error views retain current behavior and copy; hue lookup is local and synchronous. Reduced motion adds no animation; palette updates directly. Retain station names/labels as non-colour identifiers and existing keyboard/focus/screen-reader behavior. QA: pin all five mappings in both themes, prohibit station hex literals in Market.jsx, and verify mounted trim updates when the system theme changes. No new theme toggle or future scarves/plate rims/sidebar pills are required.
- **designer, 2026-09-30:** Designer spec handoff: .scratch/den-scene-v1/handoffs/02-designer-spec.md; ready for QA specify.
- **qa, 2026-09-30:** QA specify complete: four feature-red acceptance tests on tests/station-hues02 at 9b51ba1; map and exact failures in .scratch/den-scene-v1/handoffs/02-qa-specify.md. Ready for developer.
- **developer, 2026-10-01:** Developer bf0a5f6: acceptance4/4; full1319/1320 (unrelated Low80 ancestry environment blocker). Handoff: .scratch/den-scene-v1/handoffs/02-developer.md.
- **orchestrator, 2026-10-01:** User approved isolated verification via supported unsandboxed execution and fresh TMPDIR, avoiding platform-injected Git ancestry; no guards or tests changed.
- **qa, 2026-10-01:** QA verify partial at bf0a5f6: suite stopped at user usage limit, no verdict. Tests unchanged vs9b51ba1; scope clean. Handoff: .scratch/den-scene-v1/handoffs/02-qa-verify.md.
- **orchestrator, 2026-10-01:** Wrap-up at user-reported92%used5h; implementation pushed to feat/station-hues02 atbf0a5f6. QA interrupted with no verdict; finish isolated full verify then designer/risk review next session. No product PR or merge yet.
- **qa, 2026-10-01:** QA pass at bf0a5f6: full suite 1320/1320, no failures/skips/cancellations; acceptance 4/4. Tests unchanged vs9b51ba1; scope clean. Completed handoff: .scratch/den-scene-v1/handoffs/02-qa-verify-finish.md (supersedes prior partial report).
- **designer, 2026-10-01:** Design pass at bf0a5f6: approved station hues match tokens; actual UI reviewed desktop/mobile light/dark with reduced motion, no runtime/console errors. Screenshots /tmp/02-{desktop,mobile}-{light,dark}.png; Market.jsx:32,213. Existing styles.css:98 min-width clips mobile; unchanged and outside hue-only scope. Handoff: 02-designer-review.md.
- **designer, 2026-10-01:** Review reference correction: pre-existing mobile minimum width is styles.css:87 (not :98). Hue changes affect decorative 3D trim; text contrast and semantic control paths are unchanged.
- **security, 2026-10-01:** Security pass at bf0a5f6: no findings in five-file diff; live fixture binds loopback/ephemeral port with cleanup, theme subscription unsubscribes, no dependency changes. Commit-pattern secret fallback clear; gitleaks unavailable. Details: handoffs/02-security.md.
- **orchestrator, 2026-09-30:** Design sweep (designer, user-approved 2026-09-30): Scope added: absorbs ca/19 grove-* tokens, and loads the Long Cang font here (den 03's noren sign needs it and 03 is not blocked by 07).
