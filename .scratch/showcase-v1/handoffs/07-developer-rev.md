# 07 developer (revision): stele beside the Cubs basket

## State
```json
{"ticket": "showcase-v1/07-tally-stele", "cell": "developer", "branch": "showcase-v1/07-tally-stele", "commit": "0dba375", "status": "in-review",
 "current_step": "stele moved beside the Cubs basket; tests pass; in-review",
 "artifacts": ["apps/ui/src/scene/banquet-layout.mjs", "apps/ui/src/scene/roam.mjs", "apps/ui/src/scene/TallyFace.jsx"],
 "decisions": ["roam obstacle rect used raw per spec, not padded again", "chip anchor at tablet top + 0.27 (y about 1.8)"],
 "failures": ["5 playwright smoke failures and board fixture git-signing timeouts in cloud, expected"],
 "pending": [{"item": "qa verify of the revised tests", "owner": "qa"}, {"item": "security review", "owner": "security"}, {"item": "user browser check of look and size (human-verified)", "owner": "user"}, {"item": "Design system Stele entry: change 'on the mound' to 'beside the Cubs basket'", "owner": "designer"}]}
```

- Pushed 0dba375 on top of qa's 418020e. qa's tests untouched.
- banquet-layout.mjs: TALLY now x 1.5, z 3.4, groundY 0, rotationY -atan2(1.5, 8.1), plinth 1.1x0.25x0.4, tablet 0.9x1.3x0.14. MOUND_Q removed.
- roam.mjs: added stele obstacle rect x 0.85..2.15, z 3.1..3.7.
- TallyFace.jsx: group rotated by rotationY, plinth bottom at groundY - 0.02, chip anchor at tablet top + 0.27.
- Tests: tally-stele, roam, banquet-layout: 45/45 pass. Full run: only expected failures.
- Not checked in a browser (cloud cannot).
