# Handoff: ticket 07, developer fix round 3 (design HIGH-2, props buried in the paw), in-review

**Branch:** `worktree-agent-aad01bd255e8ec60a`, reset onto `a5e42bc` (the round-2 design-reviewed tip of `worktree-agent-a926ab2096132ef97`). Not rebased on the newer `main` (`aa2489d`).
**Worktree:** `D:/claude_sessions/agent_office/.claude/worktrees/agent-aad01bd255e8ec60a`
**Commits:**
- `d6d2a09`: props out of the paw, with world-space placement tests
- `5009afd`: code-review polish (named constants)

## What changed

- `apps/ui/src/assets/prop-placement.mjs` (new, Node-side): parses a glb, computes socket world matrices at rest or at a time in a clip (TRS plus animation sampling), and measures an attached prop: share of its box outside the 0.19 paw sphere, closest point, centre distance and offset, and axes.
- `apps/ui/src/assets/prop-placement.test.mjs` (new, 12 tests): the designer's targets as hard world-space bounds on the exported glbs:
  - every prop: at least 60% of its box is outside the paw
  - every prop: the grip point is on the paw surface (closest point 0.17 to 0.23)
  - every prop: not hidden behind its paw from the front camera, at 9 times through its habit loop
  - fan: thin axis on world Z, blade radius 0.24 to 0.28, rising above the paw
  - scroll: length at most 30% along the forearm, centre 0.22 to 0.26
  - blueprint: thin axis on world Z, centre 0.28 to 0.35
  All 12 were red on `a5e42bc` and are green now.
- `apps/ui/assets-src/panda/build_props.py`: `GRIP_OFFSET` replaced by named placement constants and a comment on the socket-frame axes. Props re-exported from Blender (MCP).
- `apps/ui/assets-src/panda/README.md`: the "Props and hats" paragraph now describes the new placement and the test.

## Numbers (rest pose, from the socket)

| prop | share of box outside paw | closest point | centre | world size (x, y, z) |
|---|---|---|---|---|
| fan | 99% (was 1%) | 0.180 | 0.238 | 0.426 x 0.260 x 0.039 |
| scroll | 100% (was 0%) | 0.195 | 0.240 | 0.300 x 0.090 x 0.090 |
| blueprint | 100% (was 3%) | 0.203 | 0.302 | 0.200 x 0.260 x 0.012 |

## Deviations from the designer's targets (please judge in round 3)

1. **The forearm is not along world X.** The designer assumed it was. At rest, `arm_L` to `paw_L` points forward and down, toward the camera: (0.15, -0.49, 0.86). So:
   - The socket's "outward axis facing the camera" is the direction past the paw tip.
   - The scroll's length along world X was already across the forearm. I kept it along X and moved it out to a 0.24 centre.
2. **Blueprint.** Its targets conflict: "stand up facing the camera" and "centre about 0.32 = 0.19 + 0.13" can't both be met by offsetting along one axis. I reconciled them like this:
   - The sheet plane sits 0.17 in front of the paw centre.
   - Its bottom edge sits 0.12 above the paw centre, so the sheet rises from the paw.
   - Result: closest point 0.203, centre 0.302.
3. **Fan.** The hinge sits 0.18 past the paw tip. The blade now rises instead of hanging down (the old blade pointed down, glTF local -Z).

## Visual check (Blender render, not the browser)

I imported `panda.glb` into three scratch scenes in the open, unsaved Blender session (`PropCheck_orchestrator`, `PropCheck_product` and `PropCheck_architect`). I posed each at 0.6 s into its habit clip and placed the prop with my computed socket matrix.
- Blender's own posed socket bone heads matched my matrices exactly, which cross-checks the math in `prop-placement.mjs`.
- Rendered with the dev-scene camera (glTF (0, 0.3, 7.5), 30 degree fov). Renders are in the session scratchpad and are not committed.
  - Front: the fan shows above the raised right paw, the scroll shows as a lilac rod at the left paw, and the whole blueprint sheet shows above and in front of the left paw.
  - Three-quarter views: the scroll and blueprint read from the near three-quarter. The blueprint is edge-on from the far three-quarter (right-front).
  - Right side view: the fan is edge-on, as any flat fan facing the camera would be. The round-2 design check used this view, so round 3 should use the front or three-quarter view.
- I did not open `dev-scene.html` in a browser (I have no browser tool) and started no dev server. Serve it as in `handoffs/07-designer-2.md`, env issue 1 (`.mjs` MIME type).

## For designer round 3

- **Check first:** `blueprint_unroll`, front view.
- Possible findings I left alone because they are outside the targets:
  - The blueprint sheet is small (0.20 x 0.26) next to the panda.
  - The fan occludes part of the face from the right-front three-quarter view.
  - The fan is edge-on from the side. Yawing it about 30 degrees outward would help there, but it would break "thin axis on world Z".
- The LOW finding (habit distinctness) is still the designer's call.

## Code review

- Standards: no hard violations. I named the glTF float constant and commented the grid size.
- Spec: all five fixes met, with no scope creep. One note: the shared closest-point band (0.17 to 0.23) is looser than per-prop targets. I kept it because it spans the designer's fan hinge (0.18) and grip offsets (0.20 to 0.22).
- `npm test`: 42/42 pass.

## Status

The ticket is at `in-review` for designer round 3, and the lock is released.
