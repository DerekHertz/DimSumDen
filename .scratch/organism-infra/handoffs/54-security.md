```json
{"ticket":"organism-infra/54-cli-ergonomics","cell":"security","current_step":"Security pass — see 78-security.md for full batch A report","artifacts":["scripts/board.mjs","scripts/test-path.mjs"],"decisions":["scripts/board.mjs shim is a one-line import — no security surface","test-path.mjs: spawnSync(process.execPath,[\"--test\",...files]) no shell=true; collect() skips node_modules and dotfiles; no unbounded symlink traversal risk for a local dev tool"],"failures":[],"pending":[]}
```

## State
Done. Security pass.

## What changed
Branch `feat/batchA-board-friction`, HEAD `1191686`.

## Decisions made
- `scripts/board.mjs` shim: one-line `import` — no attack surface.
- `scripts/test-path.mjs`: file-collection via `readdirSync`+`statSync`; skips `node_modules` and dotfiles; resolves with `path.resolve`. `spawnSync` uses no `shell:true`. Dev-tool only; no external input.

## Next step
Orchestrator: open PR.

## Suggested skills
organism-protocol
