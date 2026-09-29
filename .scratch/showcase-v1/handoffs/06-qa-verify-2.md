# Handoff: showcase-v1/06 idle pandas roam: qa verify

```json
{"ticket": "showcase-v1/06", "cell": "qa", "mode": "verify", "current_step": "full verify done: QA pass", "artifacts": ["apps/ui/src/scene/roam.test.mjs"], "decisions": ["pass: 773/778, the 5 failures are all browser smoke (Playwright chromium 1243 missing)", "criterion 3 smoke:ui half is human-verified by the user's WSL browser check"], "failures": ["browser smoke cannot run in cloud"], "pending": [{"item": "run npm run smoke:ui where Chromium works, before merge", "owner": "orchestrator"}]}
```

## State
Verdict: QA pass. Branch showcase-v1/06-idle-roam at 83088ac (detached worktree).

## Results
- `npm test`: 778 tests, 773 pass, 5 fail, 0 skipped. Failures: tests 17, 18, 19, 20, 24, all `browserType.launch: Executable doesn't exist ... chromium_headless_shell-1243`. Environment, not code.
- No specify commit exists, so no weakened-test check applies. Tests came in with the developer's commit (developer noted not strictly red first).
- Diff scope: only Den.jsx, roam.mjs, roam.test.mjs. Nothing outside the ticket.

## Criterion map
1. Pure module: roam.test.mjs tests "stays inside the grass bounds and outside every obstacle", "obstacles cover...", "deterministic per seed", "never exceeds the gentle-walk speed cap".
2. Transitions: "lifecycle: idle, called, walks to the slot, works, released, walks out, idles again" (asserts phase sequence), "walking to the slot is capped...", "released mid-walk turns around".
3. Reduced motion: two reduced-motion tests (hold at home; fade out, appear at slot, fade in, fade back). smoke:ui: not run here; human-verified by the user's WSL browser check.

## Non-blocking notes
- roam.test.mjs:193 mid-walk release asserts only the final phase, not that it turned around.
- "Extra cells of a busy type still appear at the stall" is Den.jsx behavior with no automated test; covered by the user's browser check.
- Developer flagged ROAM_BOUNDS/HOMES as camera-view guesses; user approved the look.
