# Spec: Mods trial (sleep-chain guard first)

Status: ready-for-agent. Source: mods grill from orchestrator handoff 74 (karanb192/awesome-claude-code-mods).

## Problem Statement

The user wants guardrails and a thin relay view inside the `claude` terminal, without building a parallel dashboard. Today our hooks live in project settings only. We have no tested path for **mods** (plugins), no rule for trusting third-party ones, and no way to decide whether a mod earns its keep.

## Solution

Adopt mods as a project-scope plugin path, proven first with one own guardrail mod: block "sleep N; cmd" Bash chains and point to `gh pr checks --watch` or Monitor. A **mod trial** of 3 orchestrator sessions ends in one keep-or-drop verdict from the user. Trust rule: reviewed third-party mods only for read-only bands; our own mods for anything that blocks commands or edits input.

## User Stories

1. As the user, I want a guardrail mod to block sleep-chain Bash commands, so that cells poll with `gh pr checks --watch` or Monitor and waste no wall time or tokens.
2. As the user, I want the block message to name the correct alternative, so that the cell self-corrects on the next call.
3. As the user, I want the mod installed at project scope, so that every cell session and clone gets identical guardrails and changes are reviewed in a PR.
4. As the user, I want the existing settings hooks (statusline, session-start, context-budget, notify) left untouched, so that the working relay is not put at risk.
5. As the user, I want the mod removable by one uninstall, so that a dropped trial leaves no residue.
6. As the user, I want a time-boxed trial of 3 orchestrator sessions, so that I see real relay traffic and false positives without an open-ended experiment.
7. As the user, I want each blocked event logged, so that the verdict rests on what it caught and what it wrongly blocked.
8. As the user, I want a one-line board record at the end (caught, wrong, token and latency cost), so that the next mod decision has evidence.
9. As the user, I want to give the keep-or-drop verdict myself, so that no mod becomes permanent unattended.
10. As the orchestrator, I want to know the trial is running and when it ends, so that I prompt the user for the verdict at session 3's close.
11. As a cell running as a subagent, `-p` or in the cloud, I want the guard to still enforce (hooks run there), so that the rule holds even where nothing draws.
12. As the user, I want third-party mods reviewed (source read) before install, and limited to read-only bands, so that nothing untrusted can block commands or edit my input.
13. As the user, I want mods documented in the glossary (**Mod**, **Mod trial**), so that the vocabulary stays clear of the Jev **Trial**.
14. As the user, I want the long-term goal noted ("eventually from the den"), so that this terminal work is not mistaken for the final home.

## Implementation Decisions

- Scope: project (checked into the repo). Own blocking mods at project scope. Third-party mods are out of this spec; when one appears, a scout reviews it against a checklist (network calls, file writes, shell execution, input edits, pinned commit), the user approves, and only a pinned version installs. Read-only bands only.
- Marketplace: an in-repo local marketplace plus the plugin directory; installed with project scope, which writes `enabledPlugins` into the committed settings. Each machine runs the install once.
- Hook home: a plugin alongside the existing settings hooks; no migration of those hooks.
- Gated sessions: every session, including the user's own, cells, the orchestrator and subagents.
- First mod: a Bash pre-tool guard. It hard-blocks a `sleep` in command position chained to another command (`;`, `&&`, `||`, pipe, newline) and poll loops (`until`/`while ... do sleep`). A lone `sleep` and the word "sleep" inside a path or argument stay allowed. The deny message names `gh pr checks --watch` or Monitor.
- No override: a cell cannot bypass the guard. The user disables the mod if it misfires.
- Failure mode: fail open. Bad input, crash or timeout allows the command.
- Block log: each block adds a comment, through the existing board `comment` command, on a standing `mods-trial` ticket. The comment carries the cell (if known) and the head of the command. No board-service change and no new event kind.
- Standing trial ticket: the orchestrator opens it when it cuts tickets from this spec. It stays open after the build ticket merges and closes at the verdict.
- Trial clock: starts at merge and ends after 3 new orchestrator handoffs (`*-orchestrator-*.md` in the handoffs folder). The orchestrator surfaces the verdict request after the third.
- Labelling: at each session end the orchestrator lists the blocks with its call (right or false positive); the user confirms or overrules at the verdict.
- Early kill: any block that stops a legitimate command with no workaround ends the trial at once.
- Verdict outcomes: keep (stays installed), drop (uninstall, remove files), or extend (rare, user only).
- Install warning: `session-start.mjs` (orchestrator sessions only) prints one line with the install command when the mod is not enabled. A note goes in the cloud-sessions doc. Other session types get no warning; accepted.
- Coverage spike (acceptance criterion): the developer proves the guard fires in the main session, a subagent and `claude -p`, and records any gap on the trial ticket. A gap is part of the verdict.
- Display limits to note: mods draw in terminal `claude` and the Desktop Code tab, not WSL desktop; subagents, `-p` and cloud sessions run hooks only.
- Trust rule recorded in the glossary; no ADR (easy to reverse, not a major trade-off).

## Testing Decisions

- One seam: the hook entry, fed a tool-call payload on stdin, asserting allow or deny and the message. No separate plugin-load test.
- Test external behaviour only: given a Bash command string, the guard allows or blocks and its message names the alternative.
- Cases: `sleep 30; gh pr checks`, `sleep 5 && npm test`, chains over a pipe or newline, `until ...; do sleep 5; done`, versus allowed commands (`gh pr checks --watch`, a lone `sleep 2`, "sleep" inside a path or argument). Also: malformed stdin allows (fail open).
- The coverage spike (main session, subagent, `claude -p`) is a one-off check, not part of the automated suite.
- Prior art: the node `--test` suites under `scripts/` for existing hook scripts (e.g. context-budget); follow that style. Highest seam: the hook entry invoked with a tool-call payload on stdin and its exit/decision output.
- The plugin manifest is checked by a test that it loads and registers the hook.

## Out of Scope

- The relay band that reads Den data, and any dashboard. It gets its own spec after the guard's verdict.
- A new board event kind or any board-service change.
- Auto-install of the plugin.
- Building mods inside the den UI.
- Third-party mod install.
- Migrating existing settings hooks.
- Claim-before-work and no-edits-on-main guardrails (candidate later mods).
- Drawing on WSL desktop.

## Further Notes

- Hook-based enforcement of the sleep-chain rule currently relies on memory/instructions; the mod makes it mechanical.
- Facts from the scout: plugin hooks run inside subagents; `-p` is unconfirmed (hence the spike). A timed-out hook does not block. Deny is either exit 2 with stderr, or exit 0 with a JSON `permissionDecision: deny`. `scripts/hooks/context-budget.mjs` and its tests are the prior art.
- The seam (hook entry) is confirmed by the user.
