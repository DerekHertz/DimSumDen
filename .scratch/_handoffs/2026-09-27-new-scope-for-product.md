# Handoff: new scope for a product cell (2026-09-27)

**First job (user, 2026-09-27): define a minimal demo-able first version before anything below.** It's the smallest thing worth opening: the live board and cell state on the isometric floor, one panda per cell. Grill the user on it, write the spec, and then the orchestrator breaks it into tickets. The new-scope items below come after.

The user approved all four for a `product` cell to grill and fold into the spec. Source: a post by the creator who inspired Agent Office, describing their own harness (Svelte + Claude Agent SDK + Three.js). Screenshots: `refs/2026-09-27-creator-post.png` (the post) and `refs/2026-09-27-creator-office-floor.webp` (the isometric floor with the agent list). Editing `design-brief.md`, `CONTEXT.md` or ADRs stays a brain gate.

1. **Always-on routines.** Cells wake on a schedule and look for tasks and improvements, with a daily budget cap per cell and routines spaced apart. Today we only have `usage-watch` wind-down. Relates to the Endocrine organ and ADR 0001 (subscription CLI cells).
2. **Voice in and out.** Talk to cells and hear replies through local TTS (the creator uses Kokoro). Not in the brief.
3. **Front-desk agent.** A "Chief of Staff" cell you walk up to in the 3D office (wave / talk / open session) that answers for the whole team with speech bubbles. The creator's subagents also show as a mini version of the parent character (compare Mitosis).
4. **Per-cell MCP and skills.** Each cell type declares its MCP servers and repo skills, and the UI shows them. Genomes cover skills; MCP isn't modelled.

Related: the user asked to evaluate **Jev** (TypeSafe's typed-decision model) for efficiency. It fits best as a cheap pre-check inside always-on routines (see item 1). It is ticketed as `organism-infra/issues/04-jev-precheck-design.md`.

Run as a main session (`claude --agent product`) so it can grill the user. Wait until ticket 07 fix round 3 is back (max one cell at a time).

## More from the user (2026-09-27): notes on the creator's demo video

The creator is Ado Kukic, and his office is built with Svelte, the Claude Agent SDK and Three.js. The user took these notes from his video.

**What the video shows**
- **Two views.** A zoomed-out isometric view of the whole floor with a list of agents on the side, and a first-person walk-around mode ("Step inside").
- **Idle time has flavour text.** Every agent in the list shows what it's doing, even when idle, e.g. "toasting marshmallows" or "playing Bug Blaster" instead of a grey "idle". There are a few made-up personalities too ("The night editor", "The streak keeper"). The status bar reads "52/52 up · live".
- **Rooms stand for system concepts.** Lobby, Bullpen, Corner office, Archive, Skills, War room, MCP exchange, Lounge, Chill zone, Clubhouse, The yard. The MCP exchange is a server rack with a green light per service, so the room doubles as an infrastructure health check.
- **Walk up to an agent to interact.** A card shows its name and state, with hotkeys: E waves, T talks or gives it a task, F opens its session.
- **Tool calls float over the agent's head** as fading bubbles (`Read CLAUDE.md`). Thinking shows as a thought cloud, and a mail icon marks an agent waiting on you.
- **Meetings.** "Call the meeting" with a chosen group; the agents walk to the table during a countdown. The result is a written decision in a side panel: options with +/- lists, each agent's vote, and a "Why A:" explanation.
- **Art style.** Soft pastel low-poly with round blob characters. A "Clawd" mascot at the entrance starts a Claude Code session when you wave at it.

**What the user wants to borrow**
1. **Movement shows state.** Where an agent stands tells you what it's doing, with no panel needed. For us, cells moving between organs could do this. Compare tickets 05 (travel between perches) and 06 (handoff choreography).
2. **Tool calls as short-lived bubbles.** Listen to tool-use events and give each bubble a time-to-live. This is the best effort-to-payoff idea. Compare the emote bubble in ticket 04.
3. **The same three controls on every agent:** acknowledge, give a task, open the transcript. Brain approval gates could plug into the same pattern.
4. **Infrastructure as scenery.** An organ whose look reflects whether it's healthy, like the MCP rack. This joins scope item 4 (per-cell MCP).
5. **Meetings that end in a decision.** Several cells discuss, then produce options, votes and reasoning for the user to review. This is the most substantive product idea. It interacts with ADR 0002 (relay, not swarm) and the one-cell-at-a-time limit, so grill that tension.

**Where to stand apart.** He maps job titles onto a workplace. We keep the organism model: space arranged by process, work flowing through organs. We also keep our own look (anime/donghua, Bao the panda). Borrow the interactions (bubbles, three controls, decision meetings), not the structure or the look, or it reads as "that office demo, but a body".
