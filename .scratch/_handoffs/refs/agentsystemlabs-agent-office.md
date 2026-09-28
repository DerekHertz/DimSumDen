# Reference: AgentSystemLabs/agent-office (MIT)

https://github.com/AgentSystemLabs/agent-office: a 3D office where Claude Code, OpenCode and Codex workers sit at desks. It's also named "Agent Office"; mind the naming overlap before anything goes public. MIT-licensed: code may be borrowed with attribution.

Discussed with the user on 2026-09-28. **Adopted ideas:**

1. **Cells act out tool calls** (character-animation, Bao). Reading = flipping papers. Editing = hunched typing. Tests or build = leaning back, hands behind head. Web search = a spinning globe. Tests failing twice = head in hands. Waiting on the user = a jump, then arms crossed and a foot tap. Done = a spin and confetti.
2. **Cost and limits from transcripts** (efficiency board, telemetry spec). Tail `~/.claude/projects/<dir>/<session>.jsonl` and the subagent transcripts next to it: each assistant message carries token usage and the model. Price it from a table, and snap to Claude Code's `cost-state` tally at session end. A plan-limits meter polls `claude` about every 2 minutes; this starts no conversation and costs nothing. This replaces the hand-logged `cell` lines in `.scratch/usage.jsonl` over time.
3. **Bounded meetings and attention routing** (ticket 15):
   - Meeting patterns (debate, lead & team, map-reduce, red/blue, review panel), each with a round limit, a token budget for the table, and a declared output file. The meeting ends when that file is written.
   - Board agents launched with `--disallowedTools Edit Write NotebookEdit`: the permission is enforced outside the model.
   - "Next worker that needs you" (oldest waiting first), plus desktop and webhook notifications.

**Decided: the event source.** One transcript tailer feeds both the animation tool events and the cost data; there are no Claude Code hooks for now (user, 2026-09-28). About 1-2 s of latency is fine for animation. Their hook design is the fallback if exact status is ever needed: `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest`, `Notification`, `Stop`, `SessionStart`, calling a loopback-only server with a per-worker token.

**Not adopted for now:** the hook-driven status, shared PTYs, voice, multi-floor, and the leisure features.
