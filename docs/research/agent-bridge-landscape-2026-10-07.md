# Agent bridge landscape (2026-10-07)

Question from the user: is our way of bridging a single agent to the Den the right one, and are there other agent factories, offices or harnesses worth adapting? Revisit later; nothing here is a decision.

**Confidence:** the survey rests on search snippets and third-party write-ups. Primary READMEs were not read. Treat every mechanism below as a lead to verify. Devin, ChatDev and Roo Code subagents could not be sourced.

## Our approach today

From ADR 0001, 0004, 0016 and 0019:
- The bridge owns every cell as a headless `claude -p` stream-json child (unmodified CLI, owner's login, no API key).
- Observation: child stdout stream-json (`parseClaudeLine`). Transcript tailing is secondary. Hooks rejected (no inbound route). Shared PTY rejected.
- Steering in: Bearer-token routes (dispatch, message, kill). Permissions out: `can_use_tool` control requests, answered by the UI.
- Runtime sits behind the CellRuntime adapter seam (ADR 0004), so the choice is reversible.

Known weaknesses (ADR 0016): headless billing unconfirmed (S5); process-group kill unproven (S4b); children die with the bridge; a child with a background task ignores stdin EOF.

## What others do

| Group | Systems | How they attach | Idea worth a look |
|---|---|---|---|
| Anthropic primitives | Agent SDK; Claude Code hooks; OpenTelemetry | SDK streaming session; hook callbacks or HTTP; OTel metrics and events keyed by `prompt.id` | OTel for cost and usage (could close the headless blind spot); hooks as a read-only feed for sessions we don't own |
| Protocol | Agent Client Protocol (Zed) | JSON-RPC over stdio, LSP-like | A second CellRuntime adapter later |
| Worktree and tmux | Claude Squad, Conductor, Vibe Kanban, Crystal/Nimbalyst, Agent of Empires, Overstory, Gas Town | tmux session or terminal per agent; one worktree and branch per task | Agent of Empires: agents survive UI drops. Gas Town: git-backed work state. Overstory: watchdog for stuck cells, SQLite mailbox. Vibe Kanban: cells move their own tickets over MCP |
| Frameworks | claude-flow/Ruflo, OpenHands SDK, Cline CLI, MetaGPT | event log, `--json` NDJSON, SOP pipelines | OpenHands: append-only typed event log (we have `events.jsonl`). Cline NDJSON: another adapter. MetaGPT's SOP resembles our pass gates |
| Visualisation | AI Town, Smallville paper | sprites by agent state; memory stream | State-driven movement between stations |
| Hook dashboards | agents-observe, disler/claude-code-hooks-multi-agent-observability, hoangsonww/Claude-Code-Agent-Monitor | hooks POST to a local server, SQLite, WebSocket UI | Parent/subagent tree and swim-lanes for parallel cells |

Links: Agent SDK https://code.claude.com/docs/en/agent-sdk/streaming-vs-single-mode.md · hooks https://code.claude.com/docs/en/hooks · OTel https://code.claude.com/docs/en/monitoring-usage · ACP https://agentclientprotocol.com · Claude Squad https://github.com/smtg-ai/claude-squad · Conductor https://www.conductor.build · Vibe Kanban https://github.com/BloopAI/vibe-kanban · Crystal https://github.com/stravu/crystal · Agent of Empires https://github.com/njbrake/agent-of-empires · Overstory https://github.com/jayminwest/overstory · Gas Town https://github.com/steveyegge/gastown · claude-flow https://github.com/ruvnet/claude-flow · OpenHands https://docs.openhands.dev/sdk/arch/events · Cline https://docs.cline.bot/api/sdk-examples · MetaGPT https://github.com/FoundationAgents/MetaGPT · AI Town https://github.com/a16z-infra/ai-town · agents-observe https://github.com/simple10/agents-observe · disler https://github.com/disler/claude-code-hooks-multi-agent-observability · Agent Monitor https://github.com/hoangsonww/Claude-Code-Agent-Monitor

## Assessment (product, 2026-10-07)

- Keep the stream-json child as the primary bridge. It is the only surveyed approach with both inbound control and structured permissions, which the v1 interaction-first path needs. The hook dashboards are observe-only; the tmux tools have no structured permission channel.
- Agent SDK: probably the same CLI protocol underneath, and ADR 0001 chose no API key. Unverified.
- Not now: ACP, Cline, swarm frameworks. The adapter seam keeps them open.

## Candidates to revisit (none started; one-active-feature guardrail)

1. **Bridge restart survival:** can cells outlive the bridge (detached, reattach, or git-backed state)? Read Agent of Empires and Gas Town primary sources.
2. **OpenTelemetry for the usage guard:** does it see headless cells, and can `prompt.id` group events per ticket? Related to ADR 0016 S5.
3. **Hooks as a secondary read-only feed** for sessions the bridge doesn't own; could ride the mods plugin path (spec `.scratch/mods-trial/spec.md`).
4. **Swim-lane view** of parallel cells for the Den UI.
