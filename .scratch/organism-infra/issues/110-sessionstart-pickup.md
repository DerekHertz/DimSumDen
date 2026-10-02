# 110: SessionStart hook: start where we left off (batch M)

**Type:** feature

**Priority:** P1

**Blocked by:** 108

**Status:** ready-for-agent

## What to build

Five sessions open with the same instruction: "start as `agent orchestrator` checkout the handoff .scratch/_handoffs/2026-09-28-orchestrator-6.md" (162d8a6a, 038a3fcb, b10e94b8, bfd22390) and "let's continue from where we left off. i have not merged PR#127" (42fefd50). Add `scripts/session-start.mjs` for a `SessionStart` hook (startup, resume, compact): it adds a short context block (under ~400 tokens) with the latest orchestrator handoff path, open PRs with CI state (`gh`, 5 s timeout, skipped on failure), pending gate requests and usage. Only for the orchestrator agent; other cells get nothing. Ship the settings change as a gated patch.

Files: `scripts/session-start.mjs` (+ test); gated: `.claude/settings.json`.

## Acceptance criteria

- [ ] Output names the latest `.scratch/_handoffs/*-orchestrator-*.md`, open PRs with check state, pending requests and usage
- [ ] Output stays under 400 tokens; `gh` or usage failure degrades to "unknown", never blocks the session
- [ ] Non-orchestrator sessions get no output
- [ ] Settings patch in `.scratch/_handoffs/gated/`
- [ ] `npm test` green

## Comments
- **orchestrator, 2026-10-02:** Batch M, audit proposal 2. User: "this is fine".
