# den-v1: walk up to a panda and steer it

Status: draft (for the user's approval; publishes to `.scratch/den-v1/spec.md`). Source: the refocus grilling session, 2026-10-02, and ADR 0019.

## Problem Statement

A week in, I can watch a diorama of the den but cannot do anything to the agents in it. The agents run as subagents inside my desktop-app session, where the den cannot reach them. When an agent is waiting on me, I find out in chat, not in the den. The den also goes empty whenever nothing is running, which makes it feel lonely instead of alive.

## Solution

The den is always populated: every role has a resident panda at its station. A running agent takes over its role's panda, so the panda shows what that agent is doing, with its latest tool call floating above it. I can enter the den in walk mode, walk up to any panda and get its card: name, state, ticket and current tool call. On the card, **T** sends the agent a message, **F** opens its live transcript, and **A** / **D** answers a pending permission request. The agent receives my answer and carries on. Everything runs through the bridge, which owns every agent (ADR 0016, ADR 0019).

## User Stories

1. As the user, I want one resident panda per role always at its station, so that the den never looks empty.
2. As the user, I want a resident panda to look calm when no agent of its role is running, so that I can tell at a glance who is working.
3. As the user, I want a starting agent to take over its role's panda, so that the panda I see is the agent doing the work.
4. As the user, I want a panda that an agent has taken over to show the agent's state (working, waiting on me, blocked, failed, done), with shape or icon as well as colour, so that I can read it without relying on hue.
5. As the user, I want the agent's latest tool call to float above its panda as a short bubble that fades, so that I can see what it is doing right now.
6. As the user, I want a second running agent of the same role to split off its own panda beside the resident one, so that two developers never share one body.
7. As the user, I want a split-off panda to fade out when its agent ends, so that the den returns to its resident crew.
8. As the user, I want a panda waiting on me to stand out from the far diorama view, so that I know where to go.
9. As the user, I want an "Enter the den" control (and a key) in the diorama view, so that I can drop into walk mode from anywhere.
10. As the user, I want to walk with WASD (and arrow keys) and look with the mouse, so that walking feels like a normal first-person game.
11. As the user, I want to stay inside the den's floor and not pass through stalls or pandas, so that the world feels solid.
12. As the user, I want Esc to leave walk mode and return to the diorama at the same spot, so that I never get lost.
13. As the user, I want a card to appear when I come close to a panda and face it, so that I don't have to click anything to see who it is.
14. As the user, I want the card to show the role, the ticket, the state and the current tool call, so that I know what I'm about to steer.
15. As the user, I want the card for a resident panda with no running agent to say so plainly, so that I don't send messages into the void.
16. As the user, I want **T** on the card to open a text box and send my message to that agent, so that I can steer it mid-task.
17. As the user, I want to see that my message was received by the agent, so that I know it heard me.
18. As the user, I want **F** to open the agent's live transcript (messages and tool calls, newest at the bottom), so that I can read what it has been doing.
19. As the user, I want the transcript to keep streaming while it is open, so that I can watch the agent work.
20. As the user, I want **A** and **D** to allow or deny the agent's pending permission request, showing the tool and its input first, so that I approve what I can see.
21. As the user, I want controls the agent's runtime cannot do to be greyed out with the reason, so that I'm never offered a dead key.
22. As the user, I want the agent to continue after I answer it, and its panda to show that, so that I can see the loop close.
23. As the user, I want every action from the card to need the bridge's token, as the steering routes already do, so that no other local process can steer my agents.
24. As the user, I want walk mode and the card to work with the keyboard alone, so that I can drive it without the mouse when I want.
25. As the user, I want Demo mode to play walk mode and the card against recorded fixture events with actions disabled, so that I can show the den to others.

## Implementation Decisions

- **Depends on organism-infra 105, 106 and 107** (ADR 0016's spikes, slice 1 and slice 2). Approve/deny needs 106; message needs 107. Cards and transcript read the snapshot and SSE stream that 106 adds (`agents` and `approvals`; ADR 0016's not-yet-built `cells` key is named `agents` under ADR 0019 decision 10).
- **Resident pandas and take-over live in the existing scene seam** (`sceneFromState(snapshot)`, ADR 0011 decision 7, which today returns `SceneCell[]` and is renamed by organism-infra/90). It gains: one resident entry per role, always present; a live agent from `agents` binds to its role's resident entry; a second live agent of that role becomes a split-off entry; ended agents drop their binding. Pure, no three.
- **Tool-call bubbles** take the agent's latest `tool` from the snapshot and live for a fixed time-to-live in the renderer. Mapping a tool call to a pose stays code (no Jev).
- **Walk mode is a new pure module**: `walk(state, input, dt, obstacles) -> state`, where `state` is position and yaw/pitch, `input` the held keys and mouse delta, and `obstacles` the existing `roamObstacles` boxes plus the floor boundary. A thin R3F component swaps the orthographic iso camera for a perspective camera at eye height and applies `walk` each frame. The iso layout is not changed (ADR 0019 decision 7).
- **The card is a pure model**: `cardFor(scenePandas, approvals, viewer) -> Card | null` picks the nearest panda within a reach radius and a facing cone, and returns its role, ticket, state, tool, pending approval, and the capability flags for T/F/A/D. The overlay renders it.
- **Actions use ADR 0016's routes unchanged:** `POST /agents/:id/message` (T), `GET /approvals/:id` then `POST /approvals/:id` (A/D). F reads the agent's events from the SSE stream into a per-agent ring buffer in the live store; no new bridge route.
- **Art:** existing frozen glbs only; anything new (bubble, split-off fade, reach ring) is procedural three.js.
- **Size:** each ticket stays under ~120k tokens. The scene, walk, card and action slices are separate tickets.

## Testing Decisions

- Test external behaviour at the highest seam: the pure modules (`sceneFromState`, `walk`, `cardFor`) through their inputs and outputs, and the actions through the bridge test fixture (prior art: `apps/bridge/*.test.mjs`, `scene-from-state.test.mjs`, `roam.mjs` tests).
- `walk`: moving into a stall box or the floor boundary stops at its edge; yaw/pitch clamps; dt-independence within tolerance.
- `cardFor`: nearest-in-reach wins; out of reach or facing away gives null; resident-only panda gives a card with actions disabled and a reason; capability flags follow the runtime.
- Actions: a card action sends exactly one request to the right route with the token; a refusal shows its reason.
- One browser smoke (existing `smoke:ui`) enters walk mode, walks to a fixture panda, sees the card, and exits with Esc. No pixel or layout-measurement tests: the layout is frozen.

## Out of Scope

- Talking to Bao (the orchestrator) in the den (v1.1), and Jev routing what the user says.
- The Level 4 workspace (diff viewer, file tree, take over the session).
- New art, rigging, layout changes, lanterns and other scene dressing.
- Meetings, the Crew view, herald posts, voice, always-on routines.
- Phone layout for walk mode (the diorama keeps its current phone behaviour).

## Further Notes

Proposed tickets, in order (blocking edges in brackets):
1. Resident pandas, take-over and split-off in `sceneFromState` (none).
2. Tool-call bubble on a taken-over panda (1).
3. Walk mode: `walk`, perspective camera, Enter/Esc (none).
4. Proximity card: `cardFor` and the overlay, read-only (1, 3).
5. F: live transcript panel from the SSE ring buffer (4, organism-infra/106).
6. A/D: approve and deny from the card (4, organism-infra/106).
7. T: message from the card, with received state (4, organism-infra/107).

Each names the den-loop step it serves, per ADR 0019 decision 8. Routes follow ADR 0016's table with `/cells` named `/agents` (ADR 0019 decision 10).
