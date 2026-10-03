# Dim Sum Den

Formerly Agent Office. A personal control room for observing and steering AI agents across the software development life cycle. The team is modeled as an organism.

## Structure

**Organism**:
One project (one git repo) and every cell working on it.
_Avoid_: Office, workspace, swarm

**Station**:
A group of cell types that owns one SDLC outcome, drawn as a place on Bao: the Pass (orchestrator, product, architect), Steamers (developer, scout), Tea & Pantry (qa, security), Front of House (designer), Service, Meter, Recipe book, Order rail. See the table in `design-brief.md` §4.2.
_Avoid_: Organ (the old name, renamed in organism-infra/53), team, department, squad

**Cell type**:
A reusable role definition: prompt, tools, model, skills, gates, done criteria.
_Avoid_: Agent type, persona

**Genome**:
The file that defines a cell type: `.claude/agents/<cell-type>.md`.
_Avoid_: Agent config, role file

**Cell**:
One running agent instance of a cell type, working one ticket, usually in its own git worktree.
_Avoid_: Agent, worker, bot

**Bao**:
The orchestrator's on-screen body: a large seated plush panda at the heart of the den. Walking up to Bao is talking to the orchestrator (ADR 0019).
_Avoid_: Mascot, avatar

**Resident panda**:
The one panda per role that is always in the den at its station, whether or not an agent of that role is running.
_Avoid_: Idle placeholder, NPC

**Take over**:
What an agent does to its role's resident panda when it starts: the panda now shows that agent's state, ticket and tool calls, and returns to resident when the agent ends. A second concurrent agent of the same role splits off a panda of its own that fades when it ends.
_Avoid_: Possess, inhabit

**Walk mode**:
The first-person view of the den: you walk up to a panda and act on it from its card.
_Avoid_: FPS mode, free cam

**Perch**:
The spot on Bao or the grass where a cell sits. Cells hop or waddle between perches.
_Avoid_: Slot, seat, position

**Runtime**:
The agent program that runs a cell (Claude Code, Codex CLI, Gemini CLI, OpenCode, local model).
_Avoid_: Provider, engine

## Work

**Board**:
The local-markdown issue tracker under `.scratch/` in the main checkout, and the single source of truth for work.
_Avoid_: Backlog, queue, kanban (the kanban is a view of the board)

**Board service**:
The module behind the `board` CLI; the single writer of the board.
_Avoid_: Board server, board API

**Board event**:
One line in the board's `events.jsonl`, recording a single board change. Cells and the UI subscribe to these lines.
_Avoid_: Board message, notification

**Ticket**:
One tracer-bullet slice of work on the board, sized for one cell.
_Avoid_: Issue, task, story

**Frontier**:
The tickets that are ready, unblocked, and unclaimed right now.

**Parked**:
A ticket taken off the relay because it serves no den-loop step or testbed friction yet. It comes back with `board unpark`.
_Avoid_: Backlog, icebox

**Closed**:
A ticket that will not be done, with the reason in its comments.
_Avoid_: Won't fix, cancelled

**Testbed**:
The small real repo the den is pointed at once the den loop works. Friction found there drives pipeline changes and new den elements.
_Avoid_: Demo repo, sandbox

**Claim**:
The exclusive lock a cell takes on a ticket before working it.

**Handoff**:
The short document a cell writes at the end of its work so the next cell can continue without its conversation.
_Avoid_: Summary, progress note

## Control

**Pass gate**:
A point where a cell must stop and get the user's explicit approval.
_Avoid_: Checkpoint, approval step

**Gate request**:
The user's approve or reject on a pass gate, made in the UI and recorded as one line in `.scratch/_requests/requests.jsonl`. The line is an audit record and proves nothing about who wrote it; it runs nothing. The orchestrator reads it, acts, and marks it handled. A cell starts from the UI only through a token-authenticated dispatch (a steering command), never because a line appeared.
_Avoid_: Command, action (for a gate request; see steering command)

**Steering command**:
A UI-originated action on a live cell (dispatch, answer a permission request, send a message, kill) that the bridge executes and logs. It is authorized only by the UI's per-run token, never by a line in a file.
_Avoid_: Command (alone), gate request (a gate request only records and runs nothing)

**Permission request**:
A live cell asking to use a tool, held by the bridge until the user allows or denies it in the UI, where it appears under Needs you beside the pass gates. No answer, or an expired one, means deny. Allow is possible only after the full tool input has been shown.

**Autonomy**:
How many pass gates apply: supervised, gated, or autopilot. It is set per organism, station, or cell.

**Apoptosis**:
A cell ending on purpose once its ticket is done, it is blocked, or its context grows long.
_Avoid_: Shutdown, kill (kill is the user force-stopping a cell)

**Endocrine limits**:
The organism-wide caps on concurrent cells and plan usage.
_Avoid_: Rate limiting, quotas

**Minimum tier**:
The lowest model a cell type may run on. It is the cell's genome model, except qa light verify, whose minimum is haiku. A Jev pick can raise a tier above the minimum, never lower it.
_Avoid_: Floor model, base tier

**Verify depth**:
How hard qa verify looks at a developer's branch: `light` (run the tests, check the acceptance criteria) or `full`.
_Avoid_: Review level

**Shadow mode**:
Jev's picks are logged next to what actually ran and never applied. A point leaves shadow on outcomes (bounce rate and tokens per ticket), not on agreement with the orchestrator (ADR 0019).
_Avoid_: Dry run, trial

## Observation

**Telemetry**:
Aggregates derived from the organism's own transcripts: tokens, tool calls, and errors, attributed to cell type and ticket. It can always be rebuilt from the transcripts.
_Avoid_: Logs, metrics, analytics

**Error cluster**:
A group of tool errors that share one normalized signature (paths, numbers, hashes and positions stripped), grouped by tool.
_Avoid_: Error bucket, error type

**Savings proposal**:
A suggested change that cuts token use at a telemetry hotspot, such as an index, a helper script, or delegating to scout. It becomes a ticket only after the user approves it.
_Avoid_: Optimization, recommendation

## Communication

**Herald**:
The cell type that drafts public posts about the organism and what it builds. It writes a draft and never publishes.
_Avoid_: Marketer, publisher, PR bot

**Draft**:
One herald output, 1 to 3 paragraphs plus a source header, for the user to edit and post. A post is what the user publishes.
_Avoid_: Article

**Post series**:
An ordered set of related drafts, such as the first four.
_Avoid_: Campaign

## Crew and meetings

**Crew**:
The view listing every cell type as a role card. It is the same data as the den and the Board, never a copy.
_Avoid_: Roster (the den's list of live pandas), team page

**Role card**:
One cell type in the Crew view: station, nickname, responsibility, triggers, last run, totals, and Details and Talk buttons. Details opens the recipe card.
_Avoid_: Profile, agent card

**Outcome**:
How a cell's run ends: `done`, `noop` (nothing to do, with a reason), `clarify` (a question for the user, shown under Needs you), `blocked` or `failed`. It is recorded in the handoff State block.
_Avoid_: Result, status (status is the ticket's)

**Meeting**:
A ticket-scoped, bounded gathering of up to six cells on one topic, run in sequence by default, ending in a decision brief. It is stored on the board and can be rejoined for 24 hours after it closes. See ADR 0017.
_Avoid_: Swarm, standup, chat

**Take**:
One participant's short answer in a meeting: claim, evidence, confidence, what it would keep or change, and at most one question for the user. A role may return `noop` instead.
_Avoid_: Opinion, vote

**Decision brief**:
The chair's artifact: the question, two or three options with one recommended, the benefit, cost and task count of each, and what only the user can answer. It is a pass gate, and the chosen option becomes tickets.
_Avoid_: Report, summary (the summary is kept after 24 hours)

**Chair**:
The cell that runs a meeting and writes its decision brief: the orchestrator by default, the architect for design questions.
_Avoid_: Host, moderator

## UI names

What each term is called in anything a user sees (UI copy, labels, `aria-label`s, the design system). The terms above stay the names in code, genomes and skills. The full list is the design system's Glossary.

| Term | UI name |
|---|---|
| Organism | the den |
| Station | station (The Pass, Steamers, Tea, Pantry, Front of House, Cubs) |
| Cell | panda |
| Walk mode | enter the den |
| Cell type | role |
| Genome | recipe card |
| Apoptosis | clocking out |
| Endocrine limits | plan usage, kitchen limits |
| Pass gate, gate request, permission request | Needs you |
| Crew | the Crew |
| Role card | role card |
| Meeting | round table (candidate; the design session decides) |
| Decision brief | decision brief |
