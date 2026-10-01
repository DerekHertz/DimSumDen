```json
{"ticket": "den-iso-v1/01-iso-digest", "cell": "designer", "mode": "spec",
 "current_step": "Digest page written and committed on design/iso-den-digest01; waiting on the user's sign-off on token gaps and decisions D1 to D3.",
 "artifacts": ["docs/design/2026-10-01-iso-den.md"],
 "decisions": [
  "Camera: orthographic, heading 0, pitch 35.264 deg, k = min(W/16.4, H/10.2) (W/13.0 under 600 px), zoom d 0.55 to 1.2",
  "Only placement moves: Steamers and Front of House x +-3.3 to +-3.0 (card clearance, den-map's own target); Tally yaw 0",
  "New pieces: ring oval 7.3 x 6.3 around Bao (48 stones), Library and Drum pads at (+-2.9, -7.2), 3 bamboo clusters",
  "Frame depth for Bao, susan, Tally, Tea not followed; listed in the differences table"],
 "failures": ["One worktree-guard refusal: a heredoc in a Bash call (used the Write tool instead)"],
 "pending": [
  {"item": "User sign-off: token gaps G1 to G6, nearest-token substitutions (D2), kiosk yaw (D1), kiosk-click rule (D3), camera heading", "owner": "orchestrator"},
  {"item": "After the user's yes, publish G1 to G6 to the design system artifact HBXgYhAzu6YmekpW71WM7j and docs/design/tokens.json", "owner": "designer"}]}
```

## State

Done. One page, 208 lines, no app code, no pasted SVG.

## What changed

Branch `design/iso-den-digest01`, one commit adding `docs/design/2026-10-01-iso-den.md`. `npm test` passes (1624).

## Decisions made

See the State block. The projection numbers were fitted to the frame: kiosk edges at 30 degrees, the 212 px back-to-front row spacing, and symmetric composition. The frame is not a consistent 3D layout (Bao, the susan and the Tally are drawn at different depths than den-map), so the page projects den-map's positions and lists the pixel residuals instead of moving objects.

## Next step

The user answers the gate in section 8 of the page. Then the camera ticket (projection module) can start from section 1, and the layout ticket from section 2.

## Suggested skills

tdd (the projection module's round-trip tests).

## Gotchas

- Source frame errors not to copy: the scene `aria-label` and the id chip use the word "cell"; the Needs you portrait uses the Pantry zone for a Tea panda; the frame draws all four kiosks with the same yaw.
- The designer genome points at the wrong zoom-frames artifact (`JsxZ5Vj7DxJQbekA2Ehoot`); the iso frame is in `AFEGyVKV5s6GbTFraA5U3G`. A `.claude/` edit, the user's call.
- Tea's roof tip sits under the selected-panda card while it is open; the counter and sign do not.
