# Handoff: ticket 01 (motion test prototype) → blocked, tool access gap

**State**: blocked before any Blender work started. No app code or Blender assets were changed.

## What happened

I claimed ticket `01-motion-test-prototype.md` (lock held by `developer`, released below) and read the ticket, ADR 0006, ADR 0007, the spec sections on states/clips/travel, and the design handoff (`.scratch/_handoffs/2026-09-26-design.md`).

The ticket requires rigging the panda in Blender via the Blender MCP tools (`mcp__blender__execute_blender_code`, `get_object_detail_summary`, etc. — allow-listed for `developer` in `.claude/agents/developer.md` per the recent "Developer genome: allow Blender MCP tools for asset tickets" commit). **This session's actual tool set does not include any `mcp__blender__*` tools** — only `Read, Grep, Glob, Write, Edit, Bash, Agent, Skill, SubagentHandback` were exposed to me, despite the genome listing the Blender tools. I confirmed there's no way to invoke an undeclared tool, and did not attempt to hand-roll a raw socket connection to Blender's MCP addon port (undocumented protocol, and bypassing the provisioned tool boundary is out of scope for a ticket — it would also violate the "don't reach past your genome's tools" spirit of the protocol).

## What's needed to unblock

Someone (orchestrator, or whoever wires up worktree agent spawning) needs to confirm the `mcp__blender__*` tools are actually attached to a `developer` cell's runtime tool list when spawned into a worktree — the genome's `tools:` frontmatter alone may not be enough if the spawn path doesn't pass MCP server config through to worktree-isolated agents. Once a developer session can actually call `mcp__blender__get_object_detail_summary` etc., ticket 01 can proceed as scoped.

## What I confirmed is ready to use once unblocked

- Scene: "Meshy", base mesh `PlushBase`, test cell `PlushTest` (per ticket notes).
- Rig spec (ADR 0006 / spec.md): ~10 deform bones — root, body, head, ear L/R, arm L/R, leg L/R — plus paw L/R and hat sockets (not deforming).
- Clips to author: breathe (loop), paw-raise with bob (loop), hop (one-shot: anticipate squash, air, land squish), waddle (loop). (Full 14-clip library is out of scope for this throwaway ticket — spec.md line 53 lists all of them, but the ticket only asks for these 4 plus "a rough pose or clip for each" of the 8 cell states in the three.js viewer.)
- 8 cell states to cycle in the three.js page: idle, working, waiting_on_user, blocked, done, failed, throttled, terminated (spec.md line 15). Rough poses/clips are fine per the ticket — e.g. reuse breathe for working/idle, paw-raise for waiting_on_user, a held frame of hop's anticipate pose for blocked/failed/throttled/terminated placeholders.
- Placement: plush origin is model centre; place cells at `surface + CELL_SCALE` (exact `CELL_SCALE` value not yet found — search `project/tokens.json` in the design system artifact, referenced in the ticket notes but not yet located as a repo file; it may only exist in the external Claude artifact linked from `.scratch/_handoffs/2026-09-26-design.md`).
- Motion tokens (`dur-breath`, `dur-heartbeat`, `dur-fast`) also live in that same design-system artifact (`project/tokens.json`, `project/motion.md`) — not yet pulled into the repo. Whoever picks this back up should fetch those values (or ask the user) before authoring clip timings, since the calm rule requires no loop faster than `dur-heartbeat`.
- Export: single `.glb`, each Blender action as a named glTF animation. Ticket says save to a new `.blend` rather than overwriting the open file.
- Three.js page: bare page (throwaway, keep out of future `apps/ui` layout per ADR 0007) that loads the glb, cycles all 8 states, and plays one hop + one waddle between two perches.

## Board state

- Ticket `01-motion-test-prototype.md` status set to `blocked`, reason recorded under `## Comments`.
- Lock file released (deleted) at `.scratch/character-animation/issues/01-motion-test-prototype.lock`.
- No branch commits were made — nothing to commit.
