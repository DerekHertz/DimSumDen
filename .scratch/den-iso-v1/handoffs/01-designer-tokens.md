```json
{"ticket": "den-iso-v1/01-iso-digest", "cell": "designer", "mode": "spec",
 "current_step": "User signed off the gate; tokens G1 to G6 added to docs/design/tokens.json with dark values; section 8 records the decisions. Design system artifact not touched.",
 "artifacts": ["docs/design/2026-10-01-iso-den.md", "docs/design/tokens.json"],
 "decisions": [
  "Camera: orthographic, heading 0, pitch 35.264 deg, k = min(W/16.4, H/10.2) (W/13.0 under 600 px), zoom d 0.55 to 1.2",
  "Placement moves: Steamers and Front of House x +-3.3 to +-3.0; Tally yaw 0. D1 mirrored +-0.52 kept; D3 kiosk click selects the most urgent panda; D2 substitutions accepted",
  "Dark values: ground-shadow and paver same as light (scenery); surface-glass dark #1f252bf0; link-hover dark #7fe3e7; cost and diff-add are aliases"],
 "failures": ["Worktree guard refused a heredoc Bash call earlier (used Write); a node script was run before its input file existed (re-run after writing it)"],
 "pending": [
  {"item": "User syncs the six tokens to the design system artifact HBXgYhAzu6YmekpW71WM7j (list below); designer did not publish", "owner": "orchestrator"}]}
```

## State

Done, branch `design/iso-den-digest01`, commits `be09b54` (digest) and `e62086c` (tokens plus section 8). `npm test` 1624 pass.

## Six tokens for the artifact (name: light / dark)

- `ground-shadow`: #0000001f / #0000001f
- `paver`: #f3ead4 / #f3ead4
- `surface-glass`: #fffdf7f0 / #1f252bf0
- `cost`: {organ-endocrine} / {organ-endocrine}
- `link-hover`: #004f53 / #7fe3e7
- `diff-add`: {station-pantry} / {station-pantry}

Usage notes are in `docs/design/tokens.json`. The file uses CRLF line endings; entries were appended after `stone-deep` in that style. G7 (petals) stays deferred.

## Next step

The user syncs the artifact. Then the camera ticket reads section 1 and the layout ticket section 2.

## Gotchas

- No test checks tokens.json against the artifact; the sync is manual.
