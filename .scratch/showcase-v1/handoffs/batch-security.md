# Handoff: showcase-v1 batch (02, 03, 04, 05): security review

```json
{"ticket": "showcase-v1/05-name-and-font", "cell": "security", "current_step": "review done; Security pass on 02, 03, 04, 05 (no critical or high findings)",
 "artifacts": [],
 "decisions": ["risk-check's 12 hits are the word 'board' (Today's board), not the org board, lock or daemon code", "Google Fonts load accepted: CSP widened by exactly two origins, tested", "no dependency, lockfile, CI or .claude changes"],
 "failures": ["gitleaks not installed (not on PATH, not in ~/.local/bin); used pattern grep and git pickaxe instead. Found nothing."],
 "pending": [{"item": "user decides whether to self-host Long Cang later", "owner": "user"}]}
```

Reviewed `origin/main...acc2be0` (4 commits, 37 files) by hand. `/security-review` was not run. Browser tests not run (Chromium mismatch).

## Risk-check hits
All 12 are the string "board" from the Today's board feature (BoardFace, board-face, ChipLayer, Dashboard, metrics-state, styles.css, and so on). None touches apps/organism-infra, lock files, .scratch, or the daemon. Confirmed by grepping apps/ui/src for organism-infra, .scratch, child_process, and node:fs (only a pre-existing, dynamic import in panda-contract.mjs). The bridge server.mjs change (the CSP) was not in the hit list, but I reviewed it anyway.

## Findings
1. apps/bridge/server.mjs:19 (CSP), LOW. style-src gains `https://fonts.googleapis.com` and a new `font-src 'self' https://fonts.gstatic.com`. Nothing else widened: script-src stays 'self', connect-src stays 'self' blob:, img-src unchanged, no wildcard. bridge-csp.test.mjs asserts this per directive. HOST stays 127.0.0.1 (line 16, unchanged). Google-served CSS cannot run script under this policy.
2. apps/ui/index.html:8-10, LOW. Third-party stylesheet, no SRI (Google's CSS is dynamic, so SRI is not workable). Residual risks: the app phones home to Google on every page load (IP and user agent leak), and the UI depends on Google's availability. It also reverses the earlier "no external fetch" decision noted in the old styles.css comment (2026-09-29); the ticket 05 spec explicitly asks for Google Fonts, so I treat it as user-approved. Suggest a follow-up: self-host Long Cang (also fixes the offline smoke.mjs requestfailed risk qa flagged).
3. apps/ui/src/handoff-state.js:27 (`?demo=handoff`), LOW. Strict equality on one constant value, no other param reaches code, DOM, or a path. The fixture is static data. Only effect: a crafted link shows scripted fake state instead of the live snapshot (UI spoofing on a localhost-only app, needs a user click). Not worth blocking. Optional: a visible "demo" indicator.
4. apps/ui/src/scene/CameraRig.jsx and camera-rig.mjs (pan/zoom keys), INFO. Keys are matched by exact name, modifier combos ignored, and pan and zoom are clamped (panLimit >= 0, clampZoom). No text input, no injection surface. preventDefault only on handled keys.
5. apps/ci-cd/smoke-ui.mjs, INFO. Only EXPECTED_CHIPS 6 to 3 and a `:not(.chip-board)` selector. The change follows the ticket scope (queued tickets have no panda). It does not weaken a security or console-error check. Value still needs a real run (qa already flagged).
6. Untrusted text: ticket titles and refs go through React text nodes (chips) and Map keys only. Board face text is drawn with canvas fillText from numeric or constant metrics labels (no HTML, no innerHTML). Station labels are constants. No dangerouslySetInnerHTML added (existing test guards it). The only innerHTML is pre-existing dev-scene.mjs with static icons, not in this diff. No path, shell, or fs use added in the UI. `/metrics` and `/state` are GET fetches; no new endpoints.

## Dependencies and secrets
- package.json, package-lock.json, .github/, apps/ui/package.json: unchanged. No new dependency. `npm ci` reported 0 vulnerabilities.
- gitleaks is missing. Fallback: pattern grep over apps/ (AWS, GitHub, OpenAI-style, Slack, Google keys, private key blocks, key/secret assignments) and `git log -G` over the 4 commits for the same key formats. No hits, no added .env or binary files. Say so: this is weaker than gitleaks.

## Verdict
Security pass on showcase-v1/02, 03, 04, 05. No critical or high findings. Ticket 02 has no security-relevant surface beyond static geometry.
