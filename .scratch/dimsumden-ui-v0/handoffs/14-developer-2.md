```json
{"ticket": "dimsumden-ui-v0/14", "cell": "developer", "mode": "implement", "current_step": "fix round done: 15/15 backdrop tests and npm test 677/677 pass; glb-failure fixed with an error boundary; frame time measured; ready for qa verify",
 "artifacts": ["apps/ui/src/scene/backdrop.mjs", "apps/ui/src/scene/Backdrop.jsx", "apps/ui/src/scene/Den.jsx"],
 "decisions": ["No backdrop code change needed after qa's test fix (e57494a)", "glb-failure case: with panda.glb blocked, the whole app went blank (useLoader throws, no error boundary, React unmounted the tree, canvas gone). Added FiguresBoundary in Den.jsx around Suspense+DenFigures (fallback null, console.error). Re-run: canvas present, 6 chips, sidebar intact, backdrop rendered (screenshot checked). Only the pageerror for the failed fetch remains", "Boundary verified by playwright, not a unit test: no test seam for a jsx class component exists; qa may want one", "Neutral tokens only (surface-000/300/100, line, line-strong, ink-faint); no decor-bamboo tokens added"],
 "failures": [],
 "measurements": {"method": "playwright chromium headless, SwiftShader software GL (no GPU), 1280x800, fixture board with 6 chips, 6 s warm-up then 6 s rAF sampling, two runs each", "with_backdrop": [{"meanMs": 112.03, "medianMs": 100.1, "p95Ms": 216.7}, {"meanMs": 103.73, "medianMs": 100, "p95Ms": 133.2}], "without_backdrop": [{"meanMs": 102.82, "medianMs": 100, "p95Ms": 199.9}, {"meanMs": 101.69, "medianMs": 100, "p95Ms": 166.6}], "backdrop_only_glb_blocked": {"meanMs": 16.67, "p95Ms": 16.8, "note": "vsync-capped, no figures"}, "reading": "mean of means 107.9 vs 102.3 ms (about 5%), within run-to-run noise (the two with-backdrop runs differ by 8%). Software GL is dominated by the skinned plushes (about 100 ms/frame), so this is not a GPU number. Backdrop alone holds 60 fps. The user's real-GPU check is still the authority for the 5% criterion"},
 "pending": [{"item": "qa verify: consider a test for the error boundary", "owner": "qa"}, {"item": "human-verified: run `npm run ui` from the worktree and check grove behind Bao and plushes, chip legibility, light and dark, click-to-deselect, real-GPU frame rate", "owner": "user"}, {"item": "user visual verdict; designer review afterwards", "owner": "user"}]}
```

**State**: in-review. Branch feature/dimsumden-ui-v0-14-den-backdrop, head 58d84f6. npm test 677/677, 0 skipped.

User check: from /home/dhertzell/dimsumden/.claude/worktrees/agent-a8aabd7c7072a4532 run `npm run ui` (builds, then serves on http://127.0.0.1:4317 from this worktree's dist). Look for:
- Grove sits behind Bao and every plush, never in front of or clipping them.
- Chip text stays legible over the pale bamboo and the tea house.
- Switch the OS between light and dark; the backdrop recolours without a reload.
- Click empty backdrop with a plush selected: it deselects.
- Frame rate feels the same with the backdrop as before.
Fixture screenshots I saw: light mode only; dark was not looked at.

**Suggested skills**: organism-protocol.
**Gotchas**: headless SwiftShader frame times are not GPU times. `npm run ui` needs port 4317 free.
