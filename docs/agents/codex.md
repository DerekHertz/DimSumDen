# Codex sessions

Use the existing cell relay and board protocol. Read `.claude/agents/<cell>.md` for the role and `.claude/skills/<skill>/SKILL.md` for its workflow; `.codex/agents/` supplies Codex model settings and translated instructions. Invoke a referenced skill by reading its file, rather than assuming a Claude slash command exists.

## WSL setup

Open the actual Linux checkout in the desktop app. For this machine it is `/home/dhertzell/dimsumden`; the Windows `OneDrive/Documents/ChatGPT/DimSumDen` folder is a different, empty repository. Use the project picker through `\\wsl$\` and select the distro and Linux checkout. Existing chats retain their original workspace, so continue from the correct project.

The agent environment and integrated terminal shell are separate settings. Select WSL for the agent and restart after changing it. Install the distribution's sandbox dependency with `sudo apt install bubblewrap`. Keep sandboxing enabled; verify a normal sandboxed `pwd` before dispatching cells.

Use a login shell so the existing nvm setup loads Node 22. Check `node --version`, `npm --version`, and `codex --version` in the agent environment before running the relay.

The desktop app and WSL CLI can have different Codex homes. For CLI quota reads using this machine's desktop sign-in, invoke `CODEX_HOME=/mnt/c/Users/Derek/.codex node scripts/usage.mjs --provider codex`. Set the same Codex home when starting a WSL CLI session if it should share the desktop account. This is a machine-local setting, not a repository-wide shell override. Keep credentials out of prompts and logs; configuration probes print environment variable names, never values.

The shared Codex user config must trust `/home/dhertzell/dimsumden` before its project config and agents load. Worktrees inherit trust from that main checkout. Use `config/read` with `includeLayers` to verify the project layer has no `disabledReason` before claiming the settings are active.

If shell tools fail before starting, report the exact launcher error. A missing `bwrap` needs the distribution package. A missing app-managed `tmp/arg0` launcher needs a fresh app session; do not treat either failure as a repository bug. The desktop-managed Windows Node REPL bridge is separate from the Linux shell: verify its filesystem tools after opening the correct project, and report URI failures rather than claiming they passed.

## Models and dispatch

| Work | Codex agent | Model | Effort |
| --- | --- | --- | --- |
| Orchestration and scoped implementation/review | Matching cell name | `gpt-6.1-sol` | high |
| Narrow searches, log summaries, test execution | `scout` | `gpt-6-luna` | low |
| Mechanical verification after QA specify | `qa-light` | `gpt-6-luna` | high |

These are starting assignments, not a claim of benchmark or price equivalence to Opus, Sonnet, or Haiku. Use the named Codex agents so their TOML configuration applies. If dispatch uses a generic agent, supply the table's model and effort explicitly. Use `qa` for specify and full verify; use `qa-light` only for light verify, with board cell `qa` and mode `verify`. Escalate a light verification that needs broader judgment to full `qa`.

Claude tier labels from Jev remain advisory until the dispatch code has a provider-aware model mapping. Never pass `haiku`, `sonnet`, or `opus` as a Codex model ID. Keep the existing shadow/advisory behavior and relay gates.

Project config permits two concurrent child threads, excluding the main orchestrator. Preserve the relay's existing two-cell limit across nested dispatches, and keep successive stages of one ticket sequential. A scout counts as a cell; do not dispatch it while both slots are occupied. Keep reports under 300 words and read narrowly. Reserve Astra for difficult architecture or unresolved blockers after a Sol attempt, and record the escalation.

## Usage and context

Use `node scripts/usage.mjs --provider codex` at dispatch and merge decisions. The adapter reports Codex account limits through `account/rateLimits/read`. The Claude Pro assumption and Claude weighted-token estimator do not describe Codex allowance or cost. Apply the shared usage-watch thresholds to the actual Codex readings; unknown stays unknown.

`scripts/context.mjs` currently reads Claude transcripts and status-line state. In Codex, treat its output as unavailable for this session even if it finds another Claude session. Use the app's context usage display until a Codex adapter exists; record unknown when an exact token reading is unavailable. Retain the shared context budget targets and compact or hand off before starting another stage when the available reading reaches a threshold.

Compare allowance or credits consumed per completed ticket, including retries and every relay stage, on similar tickets with the same acceptance checks. Track model, effort, input, cached input, and output/reasoning tokens separately when available. Do not promise equal economics from matching effort labels or raw token counts.

The copied `.codex/hooks.json` still uses Claude environment names and hook input assumptions. It is not proof that Claude's session-start, guard, notification, or telemetry behavior runs in Codex. Verify each hook before relying on it; continue the required board and usage commands explicitly.

References: [WSL](https://learn.chatgpt.com/docs/windows/wsl), [sandboxing](https://learn.chatgpt.com/docs/sandboxing), [custom agents](https://learn.chatgpt.com/docs/agent-configuration/subagents), [configuration](https://learn.chatgpt.com/docs/config-file/config-reference).
