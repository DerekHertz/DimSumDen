# Handoff: character animation spec → orchestrator

**State**: done. The spec is published as ready-for-agent.

## What changed
- Spec: `.scratch/character-animation/spec.md` in the main checkout's board (also copied into this worktree's `.scratch/`).
- Branch `claude/product-design-agent-83b930`, commit `99af94c`: `CONTEXT.md` adds **Bao** and **Perch**; `docs/adr/0006-shared-panda-rig.md` records the shared hand-placed rig, face atlas and baked web fur. Not pushed or merged.

## Decisions made
All are in the spec. The user confirmed each one, including: interrupts cross-fade immediately (drop to the nearest surface if mid-hop), hop across body regions and waddle within one, handoffs never move cells, all 7 modeled types get idle habits, and web fur is baked only (no shells).

## Next step
**orchestrator**: break the spec into tickets with `to-tickets`. Ticket 01 must be the throwaway prototype (rig one panda in Blender, author breathe, paw-raise, hop and waddle, export glTF, cycle every state in a three.js motion test). The user judges feel there before the full clip library is built. Put the architect question from Further Notes (reduced-rate updates for distant cells, where the director lives) on the board as a design-question ticket.

## Suggested skills
`to-tickets`, `prototype`, `organism-protocol`.

## Gotchas
- There is no app code yet, so the prototype ticket also stands up the first three.js scene.
- A worktree hook blocks the Write tool from touching the main checkout, so board writes from worktree cells need another route.
- Blender MCP calls time out on renders over about 30 s; queue them with `bpy.app.timers.register`.
- Motion tokens (`dur-breath`, `dur-heartbeat`, `dur-base`, `dur-fast`) are in the design system artifact's `project/tokens.json` and `project/motion.md`: https://claude.ai/artifact/HBXgYhAzu6YmekpW71WM7j
- `motion.md`'s "Characters (open)" section and `cell-types.md`'s "Now vs. target" note in that artifact are now stale; update them once the prototype confirms the rig.
