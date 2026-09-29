```json
{"ticket": "showcase-v1/01-banquet-layout", "cell": "orchestrator", "current_step": "merged as PR 61 (48eba5a)",
 "artifacts": ["apps/ui/src/scene/banquet-layout.mjs", "apps/ui/src/scene/Market.jsx", "apps/ui/src/scene/camera-rig.mjs", "docs/adr/0013-banquet-market-layout.md"],
 "decisions": ["user browser-verified in WSL over three fix rounds", "qa verify folded into the batched verify at the end of the sprint (user)", "risk-check clean; full security skipped"],
 "failures": ["cloud Chromium 1194 vs Playwright 1243: smoke tests cannot launch in the cloud session"],
 "pending": [{"item": "PAN_LIMIT 5 is short of an 8-cell stall (|x| 9.3)", "owner": "showcase-v1/04"}]}
```

# Handoff: orchestrator, showcase-v1/01

Merged PR 61 after CI went green and the user's third browser check. The next step is the batched developer run on 02, 04, 03 and 05 from main.
