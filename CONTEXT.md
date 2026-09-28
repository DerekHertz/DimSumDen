# Dim Sum Den

Formerly Agent Office. A personal control room for observing and steering AI agents across the software development life cycle. The team is modeled as an organism.

## Structure

**Organism**:
One project (one git repo) and every cell working on it.
_Avoid_: Office, workspace, swarm

**Organ**:
A group of cell types that owns one SDLC outcome (Brain, Muscles, Skin, Immune, Liver, Heart, Endocrine, Memory, Nervous system).
_Avoid_: Team, department, squad

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

**Brain gate**:
A point where a cell must stop and get the user's explicit approval.
_Avoid_: Checkpoint, approval step

**Autonomy**:
How many brain gates apply: supervised, gated, or autopilot. It is set per organism, organ, or cell.

**Apoptosis**:
A cell ending on purpose once its ticket is done, it is blocked, or its context grows long.
_Avoid_: Shutdown, kill (kill is the user force-stopping a cell)

**Endocrine limits**:
The organism-wide caps on concurrent cells and plan usage.
_Avoid_: Rate limiting, quotas

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
