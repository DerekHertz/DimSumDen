# 230: The den shows why an agent needs the user, and stops an agent with a receipt

**Type:** feature

**Priority:** P1

**Class:** product

**Blocked by:** none

**Status:** claimed

**Serves:** Den loop: the user can tell what a running agent wants and can stop it from the Den.

## What to build

Raised by the user on 2026-10-12 while checking organism-infra/228 with a real agent on agent-os/05. In their words:
- "it's a little difficult to tell why an agent would need me right now ... just seeing the commands is unhelpful."
- "i've told it to stop but i have no clue if it has actually received it and is listening."

This is a UI ticket: the designer specs it with the user (a detailed spec plus mockups) before qa specify, and the user gives the visual verdict before the PR.

What exists today:
- The bridge has `POST /agents/:id/stop` (`apps/bridge/server.mjs`). Nothing under `apps/ui/src` calls it, so the Den has no Stop control.
- In the user's test the stop request went in as notes on denied approvals. `.scratch/_run/sessions.jsonl` shows 7 `deny` decisions, no `stop` event, and the agent ending by itself as `done` about five minutes after the first note. The Den showed no sign that a note reached the agent.
- A Needs you approval card shows the command the agent wants to run, not the reason it wants it.

To build:
- **Stop.** A Stop control on a running agent that calls the existing stop route, with the agent's state shown through to ended.
- **Receipt.** A visible confirmation that a stop, or a deny with a note, was sent and reached the agent, and what the agent did next.
- **Reason.** Each approval card says why the agent is asking, in plain words, beside the command. The designer and the user settle where that text comes from; if the bridge must carry more than it does today, say so in the spec and the ticket gets a bridge part.

Out of scope: a chat with Bao (the panda), and the relay through the bridge (organism-infra/229).

## Acceptance criteria

- [ ] The designer's spec and mockups are signed off by the user.
- [ ] Failing tests first for the pure models and the client's stop call.
- [ ] A running agent can be stopped from the Den, and the Den shows it ended.
- [ ] A stop or a deny note shows a receipt.
- [ ] An approval card shows a reason beside the command.
- [ ] The user has critiqued the build and said yes.

## Comments

- 2026-10-12, orchestrator: filed at the user's choice ("One ticket, designer"). Can run beside 229. The designer spec runs in a terminal with the user, never through the Agent tool.
- **orchestrator, 2026-10-12:** User direction for the designer, 2026-10-12, in their words: "it should be as if i'm talking directly to the agent not just seeing a list of commands with no context". Read this as the goal for the whole ticket: the agent's requests, the user's replies, stop and deny notes read as one conversation with that agent, with the command as detail under what the agent says it is doing.
