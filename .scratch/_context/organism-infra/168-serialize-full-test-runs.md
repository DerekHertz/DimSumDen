Jevgrep: 3 relevant files.
Symbols use name@start-end. Roles are estimates; locations-only files remain reading leads.
AGENTS.md lookup (root and returned-file ancestors): "AGENTS.md".
- "package.json" — implementation, caller, helper; source below
- "scripts/test-path.mjs" — helper; locations only
- "scripts/test-path.test.mjs" — test, fixture; locations only
End file list. Declaration locations follow source.

Source block "package.json" lines 1-37:
```
{
  "name": "dim-sum-den",
  "private": true,
  "type": "module",
  "bin": {
    "board": "apps/organism-infra/board.mjs"
  },
  "scripts": {
    "pretest": "npm run check:bom",
    "test": "node --test \"apps/**/*.test.mjs\" \"packages/**/*.test.mjs\" \"scripts/**/*.test.mjs\"",
    "test:path": "node scripts/test-path.mjs",
    "dev": "node apps/ci-cd/dev-server.mjs",
    "smoke": "node apps/ci-cd/smoke.mjs",
    "smoke:ui": "node apps/ci-cd/smoke-ui.mjs",
    "risk-check": "node scripts/risk-check.mjs",
    "check:bom": "node scripts/bom-check.mjs",
    "board": "node apps/organism-infra/board.mjs",
    "apply-gated": "node scripts/apply-gated.mjs",
    "next-session": "node scripts/next-session.mjs",
    "session-check": "node scripts/session-check.mjs",
    "bridge": "node apps/bridge/server.mjs",
    "ui": "npm run ui:build && npm run bridge",
    "ui:build": "vite build --config apps/ui/vite.config.mjs",
    "ui:dev": "vite --config apps/ui/vite.config.mjs"
  },
  "devDependencies": {
    "playwright": "1.63.0",
    "vite": "8.3.1"
  },
  "dependencies": {
    "@react-three/fiber": "9.8.1",
    "react": "19.3.0",
    "react-dom": "19.3.0",
    "three": "0.170.0"
  }
}

```

Declaration locations:
- "package.json"
  source@1-36
- "scripts/test-path.mjs"
  source@6-6
  source@7-7
  fail@9-12
  args@23-23
  files@28-28
  source@29-45
  env@49-49
  source@50-50
  r@51-51
  source@52-52
- "scripts/test-path.test.mjs"
  REPO_ROOT@20-20
  runTestPath@22-27
  source@39-51
  source@53-65
  source@67-82
  source@84-97

End context.
