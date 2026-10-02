# 109: Status line: usage, context and relay at a glance (batch M)

**Type:** feature

**Priority:** P1

**Blocked by:** 108

**Status:** ready-for-agent

## What to build

The user checks usage and queue state by asking ("what's the expected cost of the three items in the queue?", 42fefd50; "What's the queue status in detail?", 2a7165e6), and `scripts/context.mjs` returned null context all session on 2026-10-02. Add `scripts/statusline.mjs` for Claude Code's `statusLine` setting: one line such as `5h 11% → 19:59Z · wk 51% · ctx 64k/80k · 98: qa verify · gates 2`. Usage from `scripts/usage.mjs` cached 60 s on disk; context from the status-line input JSON if it carries it (check the docs first and cite), else from the transcript; relay from the board (in-flight tickets with a lock, pending gate requests). Yellow at 70k context or 80% usage, red at 90% or 80k with `→ /compact`. Must finish under ~300 ms and never call a model. Ship the `.claude/settings.json` change as a gated patch (108).

Files: `scripts/statusline.mjs` (+ test); gated: `.claude/settings.json`.

## Acceptance criteria

- [ ] Prints one line with 5-hour %, reset time, weekly %, context tokens vs 80k, in-flight relay and gate count
- [ ] Colour thresholds as above; red context shows `→ /compact`
- [ ] Usage read is cached; a usage failure prints `5h ?` instead of erroring
- [ ] No model or network call besides the cached usage read; runs in under 300 ms on a warm cache
- [ ] If the status-line input carries context numbers, `scripts/context.mjs` uses the same source (fixes null readings)
- [ ] Settings patch in `.scratch/_handoffs/gated/`
- [ ] `npm test` green

## Comments
- **orchestrator, 2026-10-02:** Batch M (109, 110, 111), from the Claude Code usage audit (proposal 1). User: "yes love this".
