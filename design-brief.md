# DimSumDen — Design Brief

> Handoff document for a design agent. Source of truth for product decisions is the "Agent Office — Organism Design Grill" doc; this brief turns those decisions into design requirements. Status: **draft v0.2, 2026-09-29** (stations renamed to stations; see `.scratch/character-animation/design/dim-sum-direction.md`). Anything marked **[OPEN]** is not decided yet — propose options, don't assume.

---

## 1. Product in one paragraph

DimSumDen (formerly Agent Office) is a **local web app** for one developer to watch and steer a full software-development team of AI agents. The team is modeled as a **living organism**: each agent is a **cell**, cells of the same role are a **cell type**, and cell types that share an SDLC outcome work at a **station** of the dim sum house (e.g., Tea & Pantry tastes and guards the work). The organism's body is **Bao**, a giant plush panda the teahouse is built on. The user is the **head chef** at the Pass: they set intent, approve risky actions at gates, and resolve conflicts. The UI's core idea is a **spatial, zoomable world**: an **isometric overview** of the whole organism that zooms smoothly down to a **third-person** view of one cell and finally a **first-person** view inside that cell's workspace (terminal, diff, files).

## 2. User

- **One person**: a software developer running many agents in parallel on their own machine. Agents are only ever run by the owner.
- **Secondary audience:** people the owner shows the front end to, through Demo mode (§6). This is a portfolio-grade showcase, so visual polish matters.
- Goals: see *at a glance* what every agent is doing, what is blocked, what it costs, and act quickly on approvals and alarms.
- Context: long sessions (hours), often glancing at the UI while doing other work. May check from a phone on the LAN.
- Expertise: high. Prefers density and keyboard shortcuts over hand-holding.

## 3. Design principles

1. **The den is structure, not decoration.** Stations and cells drive layout, grouping, and naming. The organism is drawn as **Bao**, a giant, fat, cute plush panda with a small teahouse built on and around it; each body region is a station (§9). No anatomy: stations are *places on a cute character*, not body parts.
2. **Glanceable first, detailed on demand.** Every zoom level must answer "is anything wrong / waiting on me?" within 2 seconds.
3. **Practical at the leaves.** Once you're inside a cell, the views are real developer tools: logs, diffs, file trees, task boards. No metaphor in the way of work.
4. **The user is always in control.** Approvals, pause, and kill are reachable from every level in one click or keystroke.
5. **Calm by default, loud when needed.** Motion signals activity subtly; alarms are the only thing that shouts.
6. **Platform agnostic.** Runs in any modern desktop browser on Windows/macOS/Linux; usable (read + approve) on a phone.

## 4. Domain model the UI represents

### 4.1 Hierarchy

```
Organism (one project / repo)
 └─ Station (SDLC function)
     └─ Cell type (role definition)
         └─ Cell (one running agent instance, one git worktree)
             └─ Task (unit of work) → Events (tool calls, messages, file edits)
```

### 4.2 Stations (draft — design for all, MVP ships a subset)

| Station | Was (organ) | Cell types (roles) | Owns | Place on Bao and dressing |
|---|---|---|---|---|
| **The Pass** | Brain | User (head chef), orchestrator, product, architect | Intent, planning, decomposition, approvals | Crown: lacquered pass rail, ticket rail of order slips, the service bell |
| **Order rail** | Nervous system | Dispatcher, event bus, task board | Signals and handoffs between cells | The *paths* slips travel between stations, not a zone |
| **Steamers** | Muscles | Developer, scout, debugger | Writing code | Shoulders and arms: bamboo steamer stacks; the scout's lantern is the pantry run. Largest station |
| **Tea & Pantry** | Immune + Liver/kidneys | QA (tea master, tastes), security (door warden, checks the pantry seal), static analysis | Filtering defects and rejecting threats | Knees and lap: tea tray, and a small pantry door by the knee |
| **Front of House** | Skin | Designer, accessibility, docs | User-facing surface | Grass in front: serving cart and menu stand |
| **Service** | Heart | Release, CI/CD, changelog | Shipping verified work | [OPEN] Where plated dishes leave the Pass; rhythm follows CI cadence |
| **Meter** | Endocrine | Usage and rate-limit governor | Budgets and throttling | Global HUD element, not a zone |
| **Recipe book** | Memory | Knowledge and ADR keeper | Long-term decisions and context | [OPEN] A shelf near the Pass |
| **Apprentices** | Stem cells | Generalist template | Becoming any role on demand | [OPEN] A bench on the grass; they put on a station's apron when assigned |

MVP stations **(decided)**: The Pass and Steamers, with Tea & Pantry and Front of House already staffed (qa, security, designer). Service comes next. Design all stations, but render stations that haven't shipped yet as **dormant** (visible, inactive, labeled "coming online").

### 4.3 Biological behaviors that need visual treatment

| Behavior | Meaning in the system | Design need |
|---|---|---|
| **Mitosis** | A cell splits work into child cells (parallel subtasks, new worktrees) | Spawn animation; parent-child linkage visible |
| **Apoptosis** | A cell finishes or exceeds budget and self-terminates | Graceful fade/collapse; stays in history |
| **Differentiation** | Stem cell takes on a role | Color/shape morph into cell type identity |
| **Signaling** | Event/handoff between cells or stations | Particle/pulse traveling along order-rail paths |
| **Inflammation** | Failed test or security finding raises a local alarm | Area glows/warms; reviewer cells converge |
| **Homeostasis** | The Meter keeps concurrency and spend in limits | Global gauge; throttled cells visibly slowed/dimmed |

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

- **Shows:** all stations as zones on an isometric plane; cells as small tiles/units inside zones; order-rail paths between stations with signal particles; global HUD.
- **Answers:** What's running? Where are the problems? What's waiting on me? How much budget is left?
- **Actions:** set/edit intent (the "prompt to the organism"), change global autonomy, pause/resume everything, open Approval Inbox, spawn a cell.
- **Also:** a **mini-map** persists at every deeper level showing current position.

### Level 2 — Station (isometric, near)

- **Shows:** cells in one station with task labels, queue depth, per-station alarms, the station's task board summary.
- **Actions:** spawn/kill cells, change station autonomy, rebalance tasks, open full task board, filter by state.

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
| **Alarm Feed** (Tea & Pantry) | Failed tests, security findings, crashes | Click jumps camera to the source cell |
| **Meter HUD** | Usage vs 5-hour window and weekly cap, active cell count vs max, spend by station | Warn at thresholds; show what gets throttled |
| **Command palette** | `Ctrl/Cmd+K`: jump to cell, spawn, set autonomy, search events | Primary power-user entry point |
| **Timeline / replay** | Scrub through organism history | **In MVP (basic).** One scrubber over the append-only event log, and the same component powers Demo mode |
| **Demo mode** | Show off the UI to others with no live agents | Plays back a recorded or synthetic event stream through the same UI. It needs a clear "DEMO" indicator and no credentials, real repo paths, or approval actions that do anything. It is also the fixture the design and frontend are built against. |

## 7. Autonomy controls

Autonomy is **configurable at three scopes** (organism → station → cell; narrower overrides wider):

- **Supervised:** approve most tool actions.
- **Gated (default):** approve at plan, merge, release, and any security finding.
- **Autopilot:** alarms only.

Design needs: a clear control at each scope, visible inheritance ("inherited from Station: Gated"), and an indicator on each cell of its effective mode.

## 8. Key user flows to design

1. **Kick off work:** User types intent at Organism level → the Pass proposes a plan → plan appears in Approval Inbox → approve → cells spawn (mitosis) into stations.
2. **Handle an approval:** Badge appears → open inbox from any level → see preview → approve/deny with keyboard → cell resumes.
3. **Respond to an alarm:** security (Tea & Pantry) finds a secret in a diff → inflammation at the Steamers → alarm feed item → click → camera flies to cell → first-person diff with highlighted line → deny merge + message.
4. **Dive in and pair:** Notice a slow cell → zoom to third person → read recent tool calls → enter first person → send guidance or take over.
5. **Hit limits:** Meter HUD turns amber at 80% of window → shows which cells will throttle → user pauses low-priority station.
6. **Release:** Service shows a verified batch → release gate in inbox → approve → pulse travels out of the organism.
7. **Mobile check-in:** Phone shows Approval Inbox + Alarm Feed + organism status list (no isometric required).

## 9. Visual direction

> **Revised 2026-09-26.** Replaces the earlier "bioluminescent lab instrument" direction. Mascot concept files live in `design/3d/`.

- **Mood:** cozy, warm, alive. A **donghua**-flavored (Chinese 3D animation) world: a fat, cute panda asleep in a bamboo grove. Think of a stylized, painterly character piece, not a sci-fi HUD.
- **The organism is Bao.** Bao is a giant plush panda sitting in the grove, with a small teahouse built on and around it (revised 2026-09-29, see `.scratch/character-animation/design/dim-sum-direction.md`). Stations are places on Bao; cells are little plush pandas working at them, and they perch on crown, shoulder, knee and grass regions. The station-to-region map is the table in §4.2.
- **Boards in the scene:** issues are order slips on the pass rail, PRs are plated dishes waiting on the Pass, the queue is the steamer stack (top basket is next), and the Approval Inbox is the service bell.

- **Mascots:** little pandas appear throughout the web app: as cells in the scene, and in empty states, loading, the Approval Inbox, and errors. A cell's role is shown by a prop (headphones, scroll, brush, shield, lantern). Its state is shown by pose + emote bubble + icon (e.g., the heart bubble in the inspo), never by color alone.
- **Modeling:** organic, single-surface character meshes sculpted in Blender and exported as glTF. **No primitives visibly stitched together.** Keep a web budget of about 5–15k tris per character, with LODs for crowds.
- **Rendering (revised 2026-09-26):** **plush**. Pandas use the chubby "Snorlax" panda model (`/mnt/d/web_downloads/panda` from WSL, cleaned in `design/3d/plush.py`) with fuzzy fur shells, sleepy half-lidded eyes, a small smile, and toe-bean paw pads. Lighting is soft, with no ink outlines, and props are soft-matte. Giant Bao **sits upright** in the grove, and cells perch on its crown, shoulders and knees. Warm cream / charcoal panda, bamboo greens, and accents in vermilion 朱红, jade, and gold.
- **Color:** each station gets a hue family drawn from the grove palette; **state colors are reserved** and must not collide with station hues (e.g., alarm red is never an station color; the vermilion accent is used only in decoration, never for state). Light (bamboo grove) theme is primary. The dark theme is **lantern dusk**: qi glows along the pathways, and paper lanterns light up only for cells waiting on you (lantern = the reserved waiting hue). Tokens, type, and components live in the "Agent Office" design system artifact; cell personalities are in its Cell types section.
- **Motion:** idle ambient motion ≤ subtle; signal particles along pathways; respect `prefers-reduced-motion` (replace with static indicators).
- **Typography:** a legible UI sans and a monospace for logs/diffs/code.
- **Density:** high information density at Levels 3–4; generous whitespace at Levels 1–2.

## 10. Data the UI receives (for realistic mockups)

Each cell emits events to the local daemon. Design against this shape:

```json
{
  "ts": "2026-09-25T14:03:11Z",
  "organism": "dimsumden",
  "station": "tea-pantry",
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

Sample scale for mockups: **1 organism, 6 stations, 12–20 cells defined**. The owner is on the **Pro plan**, so the default is **1 active cell** (configurable), plus short-lived subagents. Most cells are shown **dormant or terminated**, and the relay of handoffs between cells is the main motion story. Also show ~3 pending approvals, 1 active alarm, and usage at ~62% of the 5-hour window. Also design a "stress" frame with 8 active cells for demo mode.

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
3. **Components:** cell tile (all 8 states), station zone, signal pathway, approval card, alarm item, endocrine HUD, autonomy control, runtime/model badge, mini-map, command palette.
4. **Flows 1–3 and 7** from §8 as frame sequences.
5. **Board view** equivalent of the same data.
6. **Design tokens:** color (station hues, state colors, light/dark), type scale, spacing, motion durations/easings, as a JSON or CSS variables file.
7. **Motion spec** for mitosis, apoptosis, signaling, inflammation, throttling (plus reduced-motion fallbacks).

## 13. Open design questions

- [x] How literal should station zones look? → Places on Bao, the seated plush panda with a teahouse on it (§4.2, §9).
- [ ] How are cells of different runtimes/models distinguished (badge only, or shape/material)?
- [ ] Where does the intent/prompt input live: always visible, or summoned?

## 14. Glossary

| Term | Meaning |
|---|---|
| Organism | One project/repo and all agents working on it |
| Station | Group of cell types owning one SDLC outcome; a place on Bao (was: station) |
| Cell type | Reusable agent role definition (prompt, tools, model) |
| Cell | One running agent instance with its own git worktree |
| Brain gate | A point where the user must approve before work continues |
| Runtime | The agent program running a cell (Claude Code, Codex CLI, Gemini CLI, OpenCode, local model) |
| Worktree | Isolated git checkout a cell works in |
