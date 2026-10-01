# 87: dispatch-context script (jevgrep context at dispatch)

**Type:** feature

**Priority:** P1

**What to build:** Build `scripts/dispatch-context.mjs` per ADR 0014 decisions 3 and 7 (docs/adr/0014-jevgrep-context-supply-at-dispatch.md): run `jg` once per ticket on its What-to-build text through the `scripts/jg.mjs` wrapper, write a context file, and print only its path for the dispatch prompt. The `.claude` edits (orchestrator relay step, scout pull line if 80's line doesn't already cover it, `jg` usage kind) go in the developer handoff as a diff for the user to apply. Before dispatch, the user runs `jg auth` and `jg doctor` in this environment.

**Blocked by:** none

**Status:** ready-for-agent

- [ ] Script behaviour matches ADR 0014 decisions 3 and 7 (tests)
- [ ] A jg failure exits cleanly with no context file, so dispatch proceeds without it (test)
- [ ] `.claude` diff in the developer handoff

## Comments

- **Created (orchestrator, 2026-09-30):** User approved 57's build and trial. After this merges, 57 runs phase 1 replay (10+ resolved tickets) and phase 2 live trial (3+), then goes back to the user for go/no-go.
