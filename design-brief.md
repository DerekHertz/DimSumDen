# Agent Office — Design Brief

> Handoff document for a design agent. Source of truth for product decisions is the "Agent Office — Organism Design Grill" doc; this brief turns those decisions into design requirements. Status: **draft v0.1, 2026-09-25**. Anything marked **[OPEN]** is not decided yet — propose options, don't assume.

---

## 1. Product in one paragraph

Agent Office is a **local web app** for one developer to watch and steer a full software-development team of AI agents. The team is modeled as a **living organism**: each agent is a **cell**, cells of the same role are a **cell type**, and cell types that share an SDLC outcome form an **organ** (e.g., the Immune System does security). The user is the organism's **brain**: they set intent, approve risky actions at gates, and resolve conflicts. The UI's core idea is a **spatial, zoomable world**: an **isometric overview** of the whole organism that zooms smoothly down to a **third-person** view of one cell and finally a **first-person** view inside that cell's workspace (terminal, diff, files).

## 2. User

- **One person**: a software developer running many agents in parallel on their own machine. Agents are only ever run by the owner.
- **Secondary audience:** people the owner shows the front end to, through Demo mode (§6). This is a portfolio-grade showcase, so visual polish matters.
- Goals: see *at a glance* what every agent is doing, what is blocked, what it costs, and act quickly on approvals and alarms.
- Context: long sessions (hours), often glancing at the UI while doing other work. May check from a phone on the LAN.
- Expertise: high. Prefers density and keyboard shortcuts over hand-holding.

## 3. Design principles

1. **Biology is structure, not decoration.** Organs and cells drive layout, grouping, and naming. The organism is drawn as a **giant, fat, cute panda** whose body regions are the organs (§9). No gore and no internal anatomy: organs are *regions of a cute character*, not illustrations of body parts.
2. **Glanceable first, detailed on demand.** Every zoom level must answer "is anything wrong / waiting on me?" within 2 seconds.
3. **Practical at the leaves.** Once you're inside a cell, the views are real developer tools: logs, diffs, file trees, task boards. No metaphor in the way of work.
4. **The user is always in control.** Approvals, pause, and kill are reachable from every level in one click or keystroke.
5. **Calm by default, loud when needed.** Motion signals activity subtly; alarms are the only thing that shouts.
6. **Platform agnostic.** Runs in any modern desktop browser on Windows/macOS/Linux; usable (read + approve) on a phone.

## 4. Domain model the UI represents

### 4.1 Hierarchy

```
Organism (one project / repo)
 └─ Organ (SDLC function)
     └─ Cell type (role definition)
         └─ Cell (one running agent instance, one git worktree)
             └─ Task (unit of work) → Events (tool calls, messages, file edits)
```

### 4.2 Organs (draft — design for all, MVP ships a subset)

| Organ | Cell types (roles) | Owns | Suggested visual identity |
|---|---|---|---|
| **Brain** | User, orchestrator, product/PM, architect | Intent, planning, decomposition, approvals | Central, highest elevation in the isometric map |
| **Nervous system** | Router/dispatcher, event bus, task board | Signals and handoffs between cells | Rendered as the *pathways* connecting organs, not a zone |
| **Muscles** | Feature dev, frontend, backend, infra dev | Writing code | Largest zone; most cells live here |
| **Skin** | UX/UI designer, accessibility, docs writer | User-facing surface | Outer perimeter of the map |
| **Immune system** | Security reviewer, dependency scanner, secrets scanner | Detecting and rejecting threats | Distinct patrol behavior; cells can move to hot spots |
| **Liver / kidneys** | QA/test writer, code reviewer, static analysis | Filtering defects | Sits between Muscles and Heart ("everything passes through") |
| **Heart** | Release manager, CI/CD, changelog | Shipping verified work | Rhythmic pulse tied to CI/release cadence |
| **Endocrine** | Cost/usage governor, rate-limit monitor | Budgets and throttling | Global HUD element rather than a zone |
| **Memory** | Knowledge keeper, ADR keeper | Long-term decisions and context | Archive-like zone near the Brain |
| **Stem cells** | Generalist template | Becoming any role on demand | Pool/reservoir; cells visibly "differentiate" when assigned |

MVP organs **(decided)**: Brain + Muscles. Liver, Immune, and Heart come next. Design all zones, but render organs that haven't shipped yet as **dormant** (visible, inactive, labeled "coming online").

### 4.3 Biological behaviors that need visual treatment

| Behavior | Meaning in the system | Design need |
|---|---|---|
| **Mitosis** | A cell splits work into child cells (parallel subtasks, new worktrees) | Spawn animation; parent-child linkage visible |
| **Apoptosis** | A cell finishes or exceeds budget and self-terminates | Graceful fade/collapse; stays in history |
| **Differentiation** | Stem cell takes on a role | Color/shape morph into cell type identity |
| **Signaling** | Event/handoff between cells or organs | Particle/pulse traveling along nervous pathways |
| **Inflammation** | Failed test or security finding raises a local alarm | Area glows/warms; reviewer cells converge |
| **Homeostasis** | Endocrine keeps concurrency and spend in limits | Global gauge; throttled cells visibly slowed/dimmed |

### 4.4 Cell states (must be distinguishable without color alone)

| State | Meaning | Suggested treatment |
|---|---|---|
| `idle` | Spawned, waiting for a task | Dim, still |
| `working` | Actively running tools / generating | Gentle pulse |
| `waiting_on_user` | Blocked on an approval gate or question | Strong attention state + badge; appears in Approval Inbox |
| `blocked` | Waiting on another cell / dependency | Muted with link to the blocker |
| `done` | Task complete, awaiting cleanup/merge | Check mark, settled |
| `failed` | Error, crash, or failed verification | Alarm state + icon |
| `throttled` | Paused by endocrine (limits) | Desaturated, hourglass |
| `terminated` | Apoptosis — historical only | Ghosted in history views |

Pair each state with **shape/icon + label**, not only hue (accessibility).

## 5. Zoom levels (the core experience)

Continuous zoom (scroll / pinch / keys `+` `-`), with snap points at four levels. Camera transitions should feel like one continuous world, not page changes.

### Level 1 — Organism (isometric, far)

- **Shows:** all organs as zones on an isometric plane; cells as small tiles/units inside zones; nervous pathways between organs with signal particles; global HUD.
- **Answers:** What's running? Where are the problems? What's waiting on me? How much budget is left?
- **Actions:** set/edit intent (the "prompt to the organism"), change global autonomy, pause/resume everything, open Approval Inbox, spawn a cell.
- **Also:** a **mini-map** persists at every deeper level showing current position.

### Level 2 — Organ (isometric, near)

- **Shows:** cells in one organ with task labels, queue depth, per-organ alarms, the organ's task board summary.
- **Actions:** spawn/kill cells, change organ autonomy, rebalance tasks, open full task board, filter by state.

### Level 3 — Cell (third person, over-the-shoulder)

- **Shows:** the cell's role, model/runtime badge (e.g., `claude-code · sonnet`, `codex · gpt`), current task, live feed of recent tool calls, files touched, token/cost meter, parent/children links, worktree branch.
- **Actions:** approve/deny pending gate, send a message, reassign task, change cell autonomy, kill, "enter" (go first person).

### Level 4 — Workspace (first person, inside the cell)

- **Shows:** practical dev tooling in a split layout:
  - Live transcript / terminal stream (tool calls collapsible)
  - Diff viewer for the cell's worktree
  - File tree of the worktree
  - Task + progress notes (`progress.md`)
- **Actions:** take over (attach to the session), pair (send guidance mid-task), edit files directly, approve/deny inline, exit back to third person.
- **Metaphor:** minimal. A subtle frame or vignette that says "you're inside this cell" is enough.

### Alternate view (not a zoom level)

- **Board view:** a conventional kanban (Backlog / In progress / Review / Security / Ready to release / Done) for users who want lists. Toggle from any level. Must be equally complete, not second-class.

## 6. Always-available surfaces

| Surface | Purpose | Notes |
|---|---|---|
| **Approval Inbox** (Brain gates) | All pending decisions: plan approval, tool permission, merge, release, security finding | Badge count visible at all zoom levels; each item shows cell, action, diff/command preview, approve / deny / deny-with-message; keyboard: `a` / `d` / `j` / `k` |
| **Alarm Feed** (Immune + Liver) | Failed tests, security findings, crashes | Click jumps camera to the source cell |
| **Endocrine HUD** | Usage vs 5-hour window and weekly cap, active cell count vs max, spend by organ | Warn at thresholds; show what gets throttled |
| **Command palette** | `Ctrl/Cmd+K`: jump to cell, spawn, set autonomy, search events | Primary power-user entry point |
| **Timeline / replay** | Scrub through organism history | **In MVP (basic).** One scrubber over the append-only event log, and the same component powers Demo mode |
| **Demo mode** | Show off the UI to others with no live agents | Plays back a recorded or synthetic event stream through the same UI. It needs a clear "DEMO" indicator and no credentials, real repo paths, or approval actions that do anything. It is also the fixture the design and frontend are built against. |

## 7. Autonomy controls

Autonomy is **configurable at three scopes** (organism → organ → cell; narrower overrides wider):

- **Supervised:** approve most tool actions.
- **Gated (default):** approve at plan, merge, release, and any security finding.
- **Autopilot:** alarms only.

Design needs: a clear control at each scope, visible inheritance ("inherited from Organ: Gated"), and an indicator on each cell of its effective mode.

## 8. Key user flows to design

1. **Kick off work:** User types intent at Organism level → Brain proposes plan → plan appears in Approval Inbox → approve → cells spawn (mitosis) into organs.
2. **Handle an approval:** Badge appears → open inbox from any level → see preview → approve/deny with keyboard → cell resumes.
3. **Respond to an alarm:** Immune finds a secret in a diff → inflammation on Muscles zone → alarm feed item → click → camera flies to cell → first-person diff with highlighted line → deny merge + message.
4. **Dive in and pair:** Notice a slow cell → zoom to third person → read recent tool calls → enter first person → send guidance or take over.
5. **Hit limits:** Endocrine HUD turns amber at 80% of window → shows which cells will throttle → user pauses low-priority organ.
6. **Release:** Heart shows a verified batch → release gate in inbox → approve → pulse travels out of the organism.
7. **Mobile check-in:** Phone shows Approval Inbox + Alarm Feed + organism status list (no isometric required).

## 9. Visual direction

> **Revised 2026-09-26.** Replaces the earlier "bioluminescent lab instrument" direction. Mascot concept files live in `design/3d/`.

- **Mood:** cozy, warm, alive. A **donghua**-flavored (Chinese 3D animation) world: a fat, cute panda asleep in a bamboo grove. Think of a stylized, painterly character piece, not a sci-fi HUD.
- **The organism is a giant panda.** At Level 1 the isometric map *is* one giant panda lying on its back, head propped up. Organs are regions of its body; cells are little pandas working on it.

  | Organ | Region on the giant panda |
  |---|---|
  | Brain | Head (raised on a pillow, highest point) |
  | Memory | Scroll pavilion beside the head |
  | Heart | Chest (rhythmic pulse) |
  | Liver / kidneys | Belly (everything passes through) |
  | Muscles | Arms and legs (largest area; each limb is a work lane) |
  | Immune | Patrols the fur outline and ground around the body |
  | Skin | The grove ground and path around the perimeter |
  | Nervous system | Silk ribbons / 祥云 cloud trails between regions, carrying signal pulses |
  | Stem cells | Bamboo basket of undifferentiated cubs |
  | Endocrine | HUD; optionally a bamboo-stalk gauge in the scene |

- **Mascots:** little pandas appear throughout the web app: as cells in the scene, and in empty states, loading, the Approval Inbox, and errors. A cell's role is shown by a prop (headphones, scroll, brush, shield, lantern). Its state is shown by pose + emote bubble + icon (e.g., the heart bubble in the inspo), never by color alone.
- **Modeling:** organic, single-surface character meshes sculpted in Blender and exported as glTF. **No primitives visibly stitched together.** Keep a web budget of about 5–15k tris per character, with LODs for crowds.
- **Rendering (revised 2026-09-26):** **plush**. Pandas use the chubby "Snorlax" panda model (`/mnt/d/web_downloads/panda` from WSL, cleaned in `design/3d/plush.py`) with fuzzy fur shells, sleepy half-lidded eyes, a small smile, and toe-bean paw pads. Lighting is soft, with no ink outlines, and props are soft-matte. Giant Bao **sits upright** in the grove, and cells perch on its crown, shoulders and knees. Warm cream / charcoal panda, bamboo greens, and accents in vermilion 朱红, jade, and gold.
- **Color:** each organ gets a hue family drawn from the grove palette; **state colors are reserved** and must not collide with organ hues (e.g., alarm red is never an organ color; the vermilion accent is used only in decoration, never for state). Light (bamboo grove) theme is primary. The dark theme is **lantern dusk**: qi glows along the pathways, and paper lanterns light up only for cells waiting on you (lantern = the reserved waiting hue). Tokens, type, and components live in the "Agent Office" design system artifact; cell personalities are in its Cell types section.
- **Motion:** idle ambient motion ≤ subtle; signal particles along pathways; respect `prefers-reduced-motion` (replace with static indicators).
- **Typography:** a legible UI sans and a monospace for logs/diffs/code.
- **Density:** high information density at Levels 3–4; generous whitespace at Levels 1–2.

## 10. Data the UI receives (for realistic mockups)

Each cell emits events to the local daemon. Design against this shape:

```json
{
  "ts": "2026-09-25T14:03:11Z",
  "organism": "agent-office",
  "organ": "immune",
  "cell_id": "sec-02",
  "cell_type": "security-reviewer",
  "runtime": "claude-code",
  "model": "sonnet",
  "state": "waiting_on_user",
  "task": { "id": "T-114", "title": "Review auth middleware PR" },
  "event": {
    "kind": "permission_request",
    "tool": "Bash",
    "summary": "npm audit --production",
    "detail": "..."
  },
  "usage": { "input_tokens": 18234, "output_tokens": 2210, "cost_estimate_usd": 0.14 },
  "worktree": { "branch": "cell/sec-02/T-114", "files_changed": 3 }
}
```

Event kinds: `spawned`, `task_assigned`, `tool_call`, `tool_result`, `message`, `permission_request`, `permission_resolved`, `file_changed`, `test_result`, `security_finding`, `handoff`, `state_changed`, `terminated`.

Sample scale for mockups: **1 organism, 6 organs, 12–20 cells defined**. The owner is on the **Pro plan**, so the default is **1 active cell** (configurable), plus short-lived subagents. Most cells are shown **dormant or terminated**, and the relay of handoffs between cells is the main motion story. Also show ~3 pending approvals, 1 active alarm, and usage at ~62% of the 5-hour window. Also design a "stress" frame with 8 active cells for demo mode.

## 11. Technical constraints for design

- **Web only**, served locally; must run in current Chrome, Edge, Firefox, Safari.
- Rendering **(decided)**: **3D with Three.js / React Three Fiber**. The whole zoom happens in one scene: an orthographic camera gives true isometric at Levels 1–2, and it transitions to a perspective camera for third- and first-person at Levels 3–4. Level 4's dev tooling (terminal, diff, file tree) is DOM overlaid on or framed by the scene. Design low-poly, performant assets.
- Scope **(decided)**: one organism (repo) per screen in the MVP. The data model already supports several, so leave room for a future "colony" view above Level 1.
- Task board **(decided)**: local files in the repo, which is the data behind the Board view.
- Must stay smooth with **~30 live cells** and a continuous event stream.
- Desktop-first (≥1280px); mobile (≥360px) gets the reduced status/inbox layout from Flow 7.
- Keyboard-navigable throughout; WCAG 2.2 AA contrast; screen-reader labels for cells and states.

## 12. Deliverables requested from the design agent

1. **Concept directions** (2–3) for the isometric organism map, each with one hero frame at Level 1.
2. **Zoom sequence:** Level 1 → 2 → 3 → 4 frames for one chosen direction, plus notes on camera transitions.
3. **Components:** cell tile (all 8 states), organ zone, signal pathway, approval card, alarm item, endocrine HUD, autonomy control, runtime/model badge, mini-map, command palette.
4. **Flows 1–3 and 7** from §8 as frame sequences.
5. **Board view** equivalent of the same data.
6. **Design tokens:** color (organ hues, state colors, light/dark), type scale, spacing, motion durations/easings, as a JSON or CSS variables file.
7. **Motion spec** for mitosis, apoptosis, signaling, inflammation, throttling (plus reduced-motion fallbacks).

## 13. Open design questions

- [x] How literal should organ zones look? → Regions of one giant cute panda (§9).
- [ ] How are cells of different runtimes/models distinguished (badge only, or shape/material)?
- [ ] Where does the intent/prompt input live: always visible, or summoned?

## 14. Glossary

| Term | Meaning |
|---|---|
| Organism | One project/repo and all agents working on it |
| Organ | Group of cell types owning one SDLC outcome |
| Cell type | Reusable agent role definition (prompt, tools, model) |
| Cell | One running agent instance with its own git worktree |
| Brain gate | A point where the user must approve before work continues |
| Runtime | The agent program running a cell (Claude Code, Codex CLI, Gemini CLI, OpenCode, local model) |
| Worktree | Isolated git checkout a cell works in |
