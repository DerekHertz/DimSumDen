# 216: Trial Claude Code agent teams on one small ticket

**Type:** idea

**Priority:** P3

**Blocked by:** None. Wait for the weekly usage reset (2026-10-12 04:59 PDT) first.

**Status:** needs-triage

**Serves:** The user wants to try Claude Code agent teams (2026-10-08, from a social post). If a lead with peer-messaging teammates finishes a small ticket for fewer tokens or less time than the relay, without losing gates, that is worth knowing.

## What we know (scout, 2026-10-08, Anthropic docs)

- Agent teams are real and experimental: https://code.claude.com/docs/en/agent-teams. Turn them on with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. `teammateMode` can be `in-process` (default), `auto`, `tmux` or `iterm2`. `--teammate-mode` is a hidden CLI flag (local CLI 2.1.293 does not list it).
- Teammates share a task list with file-locking self-claim, message each other directly (mailboxes under `~/.claude/teams/`), and answer to a fixed lead. Documented limits: no resume of in-process teammates, one team per session, no nested teams, task status that lags, slow shutdown. The docs warn the feature uses "significantly more tokens" (https://code.claude.com/docs/en/costs#agent-team-token-costs).
- Our subagents already use `isolation: worktree` and `effort`, which the docs confirm.
- Not backed by the docs: a `/teams` command, "Haiku 5.5 at 340 tok/s", "Jev engineering", and calling this an official Anthropic tip.

## Open questions (grill before any ticket work)

- The post's setup rewrites the global `~/.claude/settings.json` and `CLAUDE.md`. This should be scoped to the repo, or to a single session's environment, instead.
- Peer-to-peer settlement without gates clashes with ADR 0002 (relay, not swarm) and the user-approval gates. Architect decides whether a trial needs an ADR amendment or can run as a one-off experiment.
- The team's `tasks.json` locks overlap the board's `.lock` claims. Which one wins during a trial?
- What to measure against the relay: tokens (`npm run spend`), wall time, bounces, and skipped gates.
- Which ticket to pilot: a small infra single, not UI.

## Comments

- **orchestrator, 2026-10-08:** Filed on the user's choice "Idea ticket, trial after reset". Next: grill in a fresh session after 2026-10-12, then architect on ADR 0002.
