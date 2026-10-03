# Refocus: the bridge owns every agent and runs the relay, Jev routes each step and is judged by outcomes, Blender leaves the repo, SWE words replace the biology

**Status:** proposed (decisions settled with the user in the refocus grilling session, 2026-10-02; this text awaits the user's approval). Supersedes ADR 0018. Amends ADR 0006 (asset pipeline), 0010 (decision 10, go-live), 0012 (vocabulary), 0015 (decisions 4 and 5, go-live bars) and 0016 (decision 3, slice 1 dispatch policy). Written in the decision 10 vocabulary; older ADRs keep theirs (CONTEXT.md, Old terms).

**Context.** A week in, the den could not interact with agents, and the plan usage went elsewhere. An audit of `.scratch/usage.jsonl` and the board on 2026-10-02 found:

- 124 of 210 tickets (59%) and 39% of logged agent tokens went to `organism-infra`, the pipeline working on itself. Pipeline tooling was ~7k source and ~19k test lines against 5.4k lines of UI.
- The seven most expensive tickets were all 3D scene or asset work (`den-scene-v1/11` alone 1.4M tokens); scene tickets averaged 93-102k tokens per agent run against ~50k elsewhere.
- A code ticket averaged ~261k tokens over four or five cold agent runs. The orchestrator ran about twelve scripts per relay step, and its own session tokens were not logged at all.
- Jev ran beside the Opus orchestrator as a second opinion, so the orchestrator did the work twice. Shadow data: `verify` picked light 41 times where full ran (live would save); `tier` picked opus 34 times where sonnet ran (live would cost more); `route` logged `actual: orchestrator` on every row (no usable data).
- The deepest drift: relay agents ran as Agent-tool subagents inside the desktop-app orchestrator session, where the UI can never reach them (ADR 0016 Context). The fix, ADR 0016's bridge-owned agents (tickets 105-107), was decided and never built, while ADR 0018 added a third runtime option on paper.
- Day one went art-first: a Blender panda rig before any interaction existed.

**Decision.**

1. **Two goals, one product.** Dim Sum Den is an efficient SDLC multi-agent workflow and a polished interface for working with it. Together they exist to make building *other* products fun, efficient and accurate. Interaction comes first; the diorama is the map you navigate by.

2. **The bridge owns every agent.** Every agent, relay hops included, is a headless `claude -p` stream-json child of the bridge (ADR 0016 decision 2; ADR 0001 holds: unmodified CLI, owner's login). Once ticket 106 lands, relay work stops using the desktop app's Agent tool. **Amends 0016 decision 3:** its slice 1 refusal of `developer`, `qa` and `security` on `POST /cells` (renamed `POST /agents` under decision 10, before it is built) stands, because those hops are started by the relay runner (decision 3 below) and never directly by a route.

3. **The relay runner lives in the bridge** (`apps/bridge/relay/`). It is the relay state machine: it picks the next hop, calls Jev at each routing point, dispatches the agent through the bridge's host module (ADR 0016's `CellHost`, renamed under decision 10), reads the handoff, and stops at every gate, which shows in Needs you and (v1.1) at Bao. The Opus orchestrator wakes only for gates and for conversation with the user. **Supersedes ADR 0018:** agent view (`--bg`) and dynamic workflows are not adopted. The user works from the desktop app, and a workflow script can neither take user input mid-run nor be seen by the den.

4. **Slim relay by default.** A developer working test-first, then a light qa verify. qa `specify` and full `security` run only on a `risk-check` hit or for board locking and security code. Target: at most ~120k tokens for a typical ticket, re-checked after 10 tickets. Hand-written usage, context, incident and advisory rows are dropped; only what scripts and hooks write on their own stays.

5. **Jev routes each step of the relay.** The relay runner, not the orchestrator, calls `tier`, `verify`, `route` and `route-bounce`. ADR 0015 decision 1's authority rules are unchanged: Jev picks only among moves the state machine allows, may raise and never skip, and never bypasses a gate. **Amends 0010 decision 10 and 0015 decisions 4-5:** a point goes live on **outcomes** (bounce rate and tokens per ticket against the 10 tickets before it), not on agreement with the orchestrator. Safe-direction picks go live at once under audit (light verify falls back to full on any red test), and a point rolls back if its bounce rate rises. Now: `verify` live; `tier` stays in shadow; `route` gets its `actual` fixed to the role really dispatched, then runs advisory for 10 tickets. Dropped: `find`, compaction. Parked: `wake` and always-on routines. In v1.1 Jev also routes what the user tells Bao (feature, role, new or existing ticket).

6. **The den is always populated.** Each role has a resident panda at its station. A running agent takes over its role's panda; a second concurrent agent of the same role splits off a panda beside it, which fades when that agent ends. **Bao is the orchestrator's body:** walking up to Bao is talking to the orchestrator (v1.1). Walk mode (first person: walk up to a panda, then act) comes before the brief's Level 4 workspace.

7. **Blender leaves the repo.** Tag `pre-refocus`, then remove the Blender sources (`design/3d`, `apps/ui/assets-src`), the Blender MCP tools in the role files, the `asset-critique` skill and designer `critique` mode. The exported glbs are frozen as they are; any new visual element is procedural three.js. The iso den layout is frozen. **Amends 0006:** the shared rig contract stays; its Blender build pipeline is retired.

8. **Guardrails against drift.** One active feature at a time. Every ticket names the den-loop step or the testbed friction it serves, or it is parked (`board park`). A pipeline ticket is filed only on a third repeat incident or when it blocks the active feature. A ticket expected to cost over ~120k tokens is split before dispatch.

9. **A testbed after v1.** Once the den loop works, the den is pointed at one small real repo. From then on, pipeline changes and new den elements ("growing the den") come from friction found there.

**Considered options.**
- *Remove only Blender and keep the 3D polish going.* Rejected as a plan, accepted as scope: three.js stays because walk mode needs it, but layout and art are frozen, since they were the most expensive tickets.
- *Keep desktop subagents for the relay and bridge agents for the den.* Rejected: the den could never show or steer the work that matters most, so the two goals would stay on separate tracks.
- *Dynamic workflows for the relay (ADR 0018).* Rejected for the reasons in decision 3.
- *Remove Jev.* Rejected by the user: Jev's value is routing at many steps; it failed only because it was wired as a second opinion.
- *Free walk later, Level 3/4 panels first.* Rejected by the user: walk mode first, the workspace after.

10. **SWE words in code, prompts and docs; dim sum words in the UI.** The biology vocabulary goes: organism → project, cell → agent, cell type → role, genome → role file, `organism-protocol` → `agent-protocol`, apoptosis → the agent ends its run, spawn/mitosis → dispatch/split-off, endocrine limits → usage limits, inflammation → alarm. The UI keeps its names (den, panda, recipe card, clocking out, kitchen limits), and kitchen words that are already clear stay everywhere (station, the Pass, pass gate, Bao, handoff, relay). Persisted data keeps its field names (`cell` in handoff State blocks, `usage.jsonl`, `events.jsonl`, lock files) and the board's feature folders keep theirs, so history still parses; ADRs 0001-0018 and past handoffs stay as written. Agents read these words on every run, and terms native to Claude Code (agent, role, dispatch) need no translation. **Amends 0012**, which renamed organ to station inside the biology metaphor. Ticket 90 carries the mapping; ticket 116 applies it to the role files and the protocol skill.

**Consequences.** The orchestrator's role file and the protocol skill shrink and move to the new words (ticket 116, a gated patch); the rest of the rename is ticket 90. Ticket 68 is re-scoped to the outcome bars. The open board went from 78 tickets to 9 (50 parked, 19 closed; `docs/refocus/triage-2026-10-02.md`). Order of work: Jev fixes (102, 68, route logging), slimming and Blender removal, the vocabulary rename (116, 90), then 105 → 106 → 107 (dispatch switches to the bridge), then the `den-v1` tickets.
