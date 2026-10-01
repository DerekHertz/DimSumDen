```json
{"ticket":"organism-infra/60-cell-start-claims-ticket","cell":"security","current_step":"Security pass — see 78-security.md for full batch A report","artifacts":["scripts/cell-start.mjs"],"decisions":["spawnSync(process.execPath,[BOARD,\"claim\",opts.ticket,opts.cell,...]) — no shell=true, no untrusted external input; args come from CLI caller (orchestrator)"],"failures":[],"pending":[]}
```

## State
Done. Security pass.

## What changed
Branch `feat/batchA-board-friction`, HEAD `1191686`.

## Decisions made
`cell-start.mjs` board claim shell-out: `spawnSync` with literal `process.execPath`, no `shell:true`. `--ticket`/`--cell`/`--mode` come from orchestrator CLI args, not external or web-sourced input. Low risk.

## Next step
Orchestrator: open PR.

## Suggested skills
organism-protocol
