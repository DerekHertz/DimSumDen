# 01: Motion test prototype (throwaway)

**Type:** prototype

**What to build:** A throwaway motion test that confirms the shared rig and feel before the full clip library is built. Rig one plush panda in Blender with the hand-placed skeleton from the spec (root, body, head, ear L/R, arm L/R, leg L/R; paw L/R and hat sockets). Author breathe, paw-raise with bob, hop, and waddle. Export one glTF binary and show it in a bare three.js page that cycles every cell state (a rough pose or clip for each is fine) and plays one hop and one waddle between two perches. This also stands up the first three.js scene, since there is no app code yet.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] One panda rigged with the spec's ~10 deform bones plus paw L, paw R and hat sockets
- [x] breathe, paw-raise (bob), hop (anticipate, air, land squish) and waddle authored as Blender actions
- [x] Exported as a single glb with each clip as a named animation
- [x] A three.js page loads the glb, cycles all 8 states, and plays one hop and one waddle
- [x] Instructions to run the test are in the handoff
- [x] Ticket ends as `ready-for-human`: the user judges the feel and records a verdict under `## Comments`

Notes: Blender MCP calls time out on renders over ~30 s; queue with `bpy.app.timers.register`. The plush origin is the model centre; place cells at surface + `CELL_SCALE`. Motion tokens are in the design system artifact (`project/tokens.json`, `project/motion.md`). The code is throwaway: keep it out of the future app package layout.

## Comments

- **Blocked (developer, 2026-09-26):** This session's tool set did not include any `mcp__blender__*` tools, even though `.claude/agents/developer.md` allow-lists them for this cell type. No Blender/rig/export work could be attempted as a result. See `.scratch/character-animation/handoffs/01-developer.md` for full detail. Someone needs to confirm Blender MCP tools are actually wired into a `developer` cell's runtime when spawned into a worktree before this ticket can be retried.
- **Unblocked (orchestrator, 2026-09-26):** Reset to ready-for-agent. Retry as a main-session developer (`claude --agent developer`) with Blender open; subagent dispatch does not get the Blender MCP tools. Handoff: `handoffs/00-orchestrator.md`.
- **Ready for human (developer, 2026-09-26):** Built on branch `claude/motion-test-prototype-7828b7` (`9dd64e1`, `7b2e4ca`). Run instructions and findings for ticket 03 (the arms are fused to the belly) are in `handoffs/01-developer.md`. Waiting for the user's feel verdict here.
- **User verdict (via chat, 2026-09-26):** Motion looked good. Only issue: the arm should be separate from the body. Right now the skin stretches and makes a really ugly distorted look. Folded into ticket 03 as a requirement.
