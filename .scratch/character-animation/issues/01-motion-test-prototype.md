# 01: Motion test prototype (throwaway)

**Type:** prototype

**What to build:** A throwaway motion test that confirms the shared rig and feel before the full clip library is built. Rig one plush panda in Blender with the hand-placed skeleton from the spec (root, body, head, ear L/R, arm L/R, leg L/R; paw L/R and hat sockets). Author breathe, paw-raise with bob, hop, and waddle. Export one glTF binary and show it in a bare three.js page that cycles every cell state (a rough pose or clip for each is fine) and plays one hop and one waddle between two perches. This also stands up the first three.js scene, since there is no app code yet.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] One panda rigged with the spec's ~10 deform bones plus paw L, paw R and hat sockets
- [ ] breathe, paw-raise (bob), hop (anticipate, air, land squish) and waddle authored as Blender actions
- [ ] Exported as a single glb with each clip as a named animation
- [ ] A three.js page loads the glb, cycles all 8 states, and plays one hop and one waddle
- [ ] Instructions to run the test are in the handoff
- [ ] Ticket ends as `ready-for-human`: the user judges the feel and records a verdict under `## Comments`

Notes: Blender MCP calls time out on renders over ~30 s; queue with `bpy.app.timers.register`. The plush origin is the model centre; place cells at surface + `CELL_SCALE`. Motion tokens are in the design system artifact (`project/tokens.json`, `project/motion.md`). The code is throwaway: keep it out of the future app package layout.

## Comments
