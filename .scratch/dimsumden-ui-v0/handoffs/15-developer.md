```json
{"ticket": "dimsumden-ui-v0/15", "cell": "developer", "current_step": "Plush LOD and prop cache committed on feature/dimsumden-ui-v0-15-ui-performance; awaiting the user's frame-rate target and visual verdict",
 "artifacts": ["apps/ui/src/scene/Den.jsx", "apps/ui/src/scene/plush-lod.mjs", "apps/ui/src/scene/plush-lod.test.mjs", "apps/ui/src/scene/asset-cache.mjs", "apps/ui/src/scene/asset-cache.test.mjs"],
 "decisions": ["Biggest cost was triangles, not JS or draw calls: plushes now draw a vertex-clustered copy of the panda body (PLUSH_GRID 40, 22 k of 130 k tris), built once and shared; Bao stays full detail", "Clusters never cross dominant bones; position, normal and colour are cluster means, skin weights come from one kept vertex", "Prop glbs load once through createAssetCache; panda.glb was already loaded once by useLoader", "Seams tested: clusterSimplify/averageAttribute/dominantBones (pure) and createAssetCache; the three.js adapter in Den.jsx is covered only by smoke:ui and the profile"],
 "failures": ["Bash: auto-mode classifier gave no verdict 7 times (transient), retried or switched to Edit", "No hardware GPU in this environment: both headless (SwiftShader) and headed WSLg (llvmpipe) are software GL, so GPU time is not measurable here"],
 "pending": [{"item": "User agrees the frame-rate target (proposed below) and gives the visual verdict on the plushes", "owner": "orchestrator"}, {"item": "qa verify, then security review", "owner": "qa"}]}
```

## State
Done, pending the user's verdict. Branch `feature/dimsumden-ui-v0-15-ui-performance`, commits 2e9f3e2 and 1bfd6a8 on base d03271b.

## Profile (live board: main checkout's .scratch, 12 plushes, 1160x900 canvas, dpr 1, 5 s idle window)
The harness is a Playwright + CDP script in the dev scratchpad and is not committed. It wraps drawElements/drawArrays, samples rAF deltas, reads Performance.getMetrics and the CPU profiler.

| metric | before | after |
| --- | --- | --- |
| triangles per frame | 1.90 M | 0.43 M (4.4x fewer) |
| draw calls per frame | 30 | 28 |
| frame time, SwiftShader headless (mean / p95) | 524 / 567 ms (1.9 fps) | 161 / 183 ms (6.2 fps) |
| frame time, llvmpipe headed WSLg | 572 ms (1.7 fps) | 171 ms (5.9 fps) |
| JS per frame (ScriptDuration) | 2.4 ms headless, 8.7 ms headed | 1.2 ms both |
| JS per frame while the pointer moves (raycasts) | 5.4 ms | 1.8 ms |
| GPU | not measurable: no hardware GPU here (see Environment) | same |

- The CPU profile is 99% "(program)", which is GL raster. Suspects ruled out: stackChips and projection are under 0.1% of samples. There are no shadows and no fur shells: the "fur" is the dense 130 k-triangle mesh with vertex colours. Draw calls were never the cost.
- What remains after the fix: Bao is 130 k of the 433 k triangles. Follow-up option: a Bao LOD at grid 64 (48 k tris), which needs its own visual review.

## Proposed frame-rate target (user to agree)
- 60 fps (p95 frame time 20 ms or less) with 12 plushes in a hardware-accelerated browser, e.g. Chrome on the Windows host at http://localhost:4317.
- Software GL (a WSLg Linux browser) tops out around 6 fps even after this fix. If the user has been viewing the den in a WSLg browser, that alone explains "pretty slow". Ask which browser they use.

## User visual review
- From the worktree: `npm --prefix /home/dhertzell/dimsumden/.claude/worktrees/agent-a38465c554c667431 run ui`, then open http://localhost:4317 (the bridge reads the board root it resolves from cwd, see apps/bridge/server.mjs).
- What to check:
  - Plush silhouettes and ears.
  - Face patches on the plushes: the atlas decal is untouched.
  - Fur colour: slightly softer is expected.
  - Arms raising cleanly in habit clips, with no torn seams at the shoulder.
  - Props still in the paws.
  - Bao is unchanged.
  - The page stays smooth while you move the mouse over the plushes.

## Next step
The orchestrator relays the target and the visual review to the user, then qa verify.

## Suggested skills
organism-protocol, code-review.

## Gotchas
- vite warns that "node:fs externalized ... panda-contract.mjs". This is pre-existing and not from this ticket.
