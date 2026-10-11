```json
{"ticket": "agent-os/02-grants", "cell": "plain-session", "current_step": "wall spike done (go); grants not started; UI for grants and wall notices needs a design session with the user before any code",
 "artifacts": ["docs/adr/0021-agent-wall-grants-and-the-bridge-as-kernel.md", ".scratch/agent-os/spec.md", ".scratch/agent-os/issues/02-grants.md", ".scratch/agent-os/issues/01-wall-spike.md"],
 "decisions": ["The user runs the design work in its own session, apart from the build session", "Design covers agent-os/02's UI first; the later items below are in scope only if the user asks"],
 "failures": [],
 "pending": [
  {"item": "Start box layout: how a task's role ceiling and its grants are shown before Start", "owner": "designer"},
  {"item": "Wall notices: the refusal mark on an agent's card and in its transcript, and the Needs you request raised after three refusals", "owner": "designer"},
  {"item": "Role ceilings for designer, architect, product and herald; Bao's is proposed, not confirmed", "owner": "product"},
  {"item": "Build agent-os/02 once the layout is signed off", "owner": "developer"}]}
```

# Handoff: design session for agent-os/02 (grants) and ADR 0021's open visuals

**State:** partial. The spike that gates this work is done; no design or build work on grants has started.

## What changed

- PR #214: Den loop v1. The Start box, Needs you and the transcript panel that this design extends are built there.
- PR #215: ADR 0021, the agent-os spec, tickets 01 to 03. Stacked on #214.
- PR #216: the wall spike and ADR 0021 amendment 1. Stacked on #215. It also carries this handoff.
- None is merged yet. Until they are, read the files from the branch of PR #216, which holds all three.

## What the design session has to settle

For agent-os/02 (needed now; the ticket's fourth acceptance box waits on it):

1. **Grants at Start.** ADR 0021 decision 3; spec user stories 1 to 5. The ticket's "Task grants" bullet gives the two kinds of extra a task can carry. Existing Start UI: `apps/ui/src/overlay/ProximityCard.jsx` and `apps/ui/src/overlay/message-composer.mjs`.
2. **Wall notices.** The ticket's "Refusals" bullet, and its section "From the spike", say what the bridge can and cannot detect. Read answers 6 and 7 of ADR 0021 amendment 1 before drawing anything: a refused host can be marked reliably, a refused write only by its text, and the file tools ask through Needs you as they do today.

Named in ADR 0021 ("Proposed, not yet put to the user", UI bullet) for later steps; ask the user whether to take them now:

3. **The Open/Closed sign.** Decision 13 (presence). Step 7 in decision 15's order.
4. **Bao's body.** Step 6.
5. **Den art:** desks, pandas idling at stations, walk speed. Spec, "Out of scope", parked until a design session and target-project friction.

## Decisions made

None beyond the State block. Everything else is in ADR 0021 and the ticket.

## Next step

designer, with the user: mockups for items 1 and 2, then a spec the user signs off, written to the board as agent-os/02's designer spec. The role file is `.claude/agents/designer.md`.

## Suggested skills

`organism-protocol`, `prototype`, `design:ux-copy` for the notice and request wording, `handoff`.

## Gotchas

- The user does all visual critique, and wants mockups approved before any UI code.
- A known wart sits next to this UI: den-v1/15 (a finished task's ticket shows as "Queued" and raises a dispatch gate). Do not design around it; it is a bug with its own ticket.
- A picked panda's card can overlap "Enter the den" (seen in the session that built den-v1/13; not written on a ticket). The Start box grows with grants, so check this in the mockups.
- The ceilings for four roles are undecided, so mock the layout with scout, developer, qa and security, whose ceilings the ticket states.
- One sentence in ADR 0021 decision 16 is marked as the drafting session's reading. It does not affect items 1 and 2.
