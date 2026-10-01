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
The organism's on-screen body: a large seated plush panda that cells perch on.
_Avoid_: Mascot, avatar

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
Jev's picks are logged next to what actually ran and never applied, until an exit review decides otherwise.
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

## UI names

What each term is called in anything a user sees (UI copy, labels, `aria-label`s, the design system). The terms above stay the names in code, genomes and skills. The full list is the design system's Glossary.

| Term | UI name |
|---|---|
| Organism | the den |
| Station | station (The Pass, Steamers, Tea, Pantry, Front of House, Cubs) |
| Cell | panda |
| Cell type | role |
| Genome | recipe card |
| Apoptosis | clocking out |
| Endocrine limits | plan usage, kitchen limits |
| Pass gate, gate request, permission request | Needs you |
