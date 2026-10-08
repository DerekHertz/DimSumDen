# 01: Sleep-chain guard as a project-scope mod, with install warning and coverage spike

**Type:** task

**Priority:** P2

**Blocked by:** None (can start immediately)

**Status:** claimed

**Serves:** Testbed friction: cells poll with `sleep N; cmd` chains, wasting wall time and tokens; the rule exists only as memory. First **mod** and its **mod trial** (spec: `.scratch/mods-trial/spec.md`).

## What to build

A project-scope plugin (a **mod**) whose Bash pre-tool hook hard-blocks sleep chains in every session, shipped through an in-repo local marketplace and installed at project scope. Name the repo paths you touch in backticks as you go; likely `scripts/session-start.mjs`, `docs/agents/cloud-sessions.md`, and a new plugin and marketplace directory.

Behaviour:
- Block a `sleep` in command position chained to another command (`;`, `&&`, `||`, pipe, newline), and poll loops (`until`/`while ... do sleep`). Allow a lone `sleep` and the word "sleep" inside a path or argument.
- The deny message names `gh pr checks --watch` or Monitor.
- No override for cells. Fail open on bad input, crash or timeout.
- Each block adds a comment, through the board `comment` command, on the standing `mods-trial` ticket (the orchestrator opens it at merge; until it exists, the hook does not fail).
- `session-start.mjs` prints one line with the install command when the mod is not enabled (orchestrator sessions only). Add a note to the cloud-sessions doc.
- Coverage spike: prove the guard fires in the main session, a subagent and `claude -p`; record any gap as a comment here.
- Existing settings hooks stay untouched.

Prior art: `scripts/hooks/context-budget.mjs` and its tests. Load `plugin-authoring` for the plugin layout.

## Acceptance criteria

- [ ] One test seam: the hook entry, fed a tool-call payload on stdin, asserts allow or deny and the message. Cases: `sleep 30; gh pr checks`, `sleep 5 && npm test`, chains over a pipe or newline, an `until ... do sleep` loop (all denied); `gh pr checks --watch`, a lone `sleep 2`, "sleep" inside a path or argument (all allowed); malformed stdin allows.
- [ ] The deny message names the alternative.
- [ ] The plugin installs at project scope from the in-repo marketplace; uninstalling removes it cleanly.
- [ ] A block adds a comment on the trial ticket through the board CLI, from a worktree too.
- [ ] The orchestrator session-start line appears when the mod is missing and not when it is enabled.
- [ ] The coverage spike result (main session, subagent, `-p`) is recorded here.
- [ ] `npm test` green.

## Comments
- **product, 2026-10-07:** Handoff: `.scratch/mods-trial/handoffs/01-product.md`. Research that came out of the grill: `docs/research/agent-bridge-landscape-2026-10-07.md` (parked candidates, not part of this ticket).
- **product, 2026-10-07:** Filed from the mods grill. After merge the orchestrator opens the standing `mods-trial` ticket and starts the 3-orchestrator-handoff clock (spec: Implementation Decisions).
- **orchestrator, 2026-10-08:** User 2026-10-08: mods tickets skip qa specify and qa verify; the developer writes the tests. Risk-check and PR on green CI stay. Developer (Sonnet) dispatched on feat/mods-01-sleep-chain-guard from ea999bd.
- **developer, 2026-10-08:** Coverage spike (developer): guard fired under claude --plugin-dir -p for the headless main session and for an Agent-tool subagent (exact deny text returned). Interactive main session and interactive subagent not yet run; need the project-scope install (user step in handoff 01-developer). No gap seen.
- **security, 2026-10-08:** Security pass (eb78b20). No critical/high. gitleaks clean, no deps, 57/57 tests. sleep-guard.mjs:170-187 medium: first 200 chars of a blocked command are logged to the committed board; a secret in the command would reach git history, suggest redaction. sleep-guard.mjs:143-157 low: runs first board.mjs found walking up from project dir. sleep-guard.mjs header low: string check, bash -c/eval bypass accepted. Handoff 01-security.md.
