```json
{
  "ticket": "den-scene-v1/02-station-hues",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Four acceptance tests confirmed feature-red; ready for developer",
  "artifacts": [
    "apps/ui/src/scene/station-hues.test.mjs",
    "apps/ui/src/scene/station-hues-live.test.mjs",
    "apps/ui/src/scene/station-hues.fixture.html"
  ],
  "decisions": [
    "Reusable token seam is stationHue(station, theme) exported by scene/station-hues.mjs"
  ],
  "failures": [
    "rg included nonexistent .agents directory",
    "cat included nonexistent apps/ui/package.json",
    "Unconfigured Playwright executable missing; existing launcher configuration supplied by orchestrator",
    "cat scripts/smoke-ui.mjs absent (actual launchers live under apps/ci-cd)",
    "Two default-permission node test calls showed only file-level test failed; supported permissions produced actual assertions",
    "Four intended acceptance feature-reds"
  ],
  "pending": [
    {
      "item": "Implement approved station lookup and live system-theme trim; preserve acceptance tests",
      "owner": "developer"
    }
  ]
}
```

State: done (specify).

What changed: tests/station-hues02, commit 9b51ba1. Three test/fixture files; no product changes.

Criterion map:
- No station hex literals in Market: station-hues.test.mjs / Market has no literal station hue palette. Red: #e0a458 remains.
- All five station mappings for both themes: two all five stations resolve approved station tokens tests. Red: reusable station hue lookup feature missing (explicit feature assertion before import). Values are independent approved literals; pass and front-of-house aliases included.
- Live theme updates: station-hues-live.test.mjs mounts real Market in Canvas, reads actual Three trim materials, switches light-dark-light, requires one Canvas mount and no runtime errors. Red: all phases retain legacy colours.
- Other visual behavior: fixture uses merged empty counts/cells; geometry, layout, labels, accessibility and states remain designer/security review targets. No new theme toggle or future decorative surfaces required.

Validation: timeout 60s node --test station-hues.test.mjs: 0/3 pass, 3 feature-red. Browser run bounded 60s: 0/1 pass, 1 feature-red; scene mounts successfully, no browser runtime errors. Server/browser closed in finally.

Decisions made: public lookup seam above, within the ticket module requirement.

Next step: developer cherry-picks 9b51ba1 and implements ticket.
Suggested skills: organism-protocol, tdd, handoff.
Gotchas: see docs/agents/cloud-sessions.md and apps/ci-cd/launch-options.mjs for established browser setup. Test fixture measures real material colors rather than screenshots.
