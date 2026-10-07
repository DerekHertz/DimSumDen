# 162 qa specify handoff

Branch `tests/162-context-budget-hook` at commit 0d31296. One test file: `scripts/hooks/context-budget.test.mjs` (27 tests, all red: `MODULE_NOT_FOUND` for `scripts/hooks/context-budget.mjs`, the missing feature).

## Contract the developer implements

Hook script: `scripts/hooks/context-budget.mjs` (PreToolUse command hook, same shape as `bash-guard.mjs`).

- Input: PreToolUse JSON on stdin. Fields used: `session_id`, `cwd`, `tool_name`, `tool_input`, `agent_id`, `agent_type`. Unreadable or empty stdin allows (exit 0).
- Cell session: input has `agent_id` (a subagent call). Orchestrator main session (no agent fields, or `agent_type === "orchestrator"`, even with an `agent_id`) is never gated and gets no warning.
- Context reading: the cell's own, as `scripts/context.mjs --self` computes it (subagent transcript under `$HOME/.claude/projects/<slug>/<session_id>/subagents/agent-*.jsonl` whose `cwd` equals the worktree; last assistant usage, input + cache creation + cache read). The tests strip `CLAUDE_CODE_SESSION_ID` from the env and pass the session in `session_id`, so the hook must hand that to context.mjs (child with env set) or use a shared library. Null reading allows silently.
- Thresholds: under 70,000 silent; 70,000 to 79,999 allow with warning; 80,000+ refuse except wrap-up.
- Silent allow: exit 0, empty stdout and stderr.
- Warning: exit 0, stdout JSON `{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"...checkpoint..."}}`, no deny decision.
- Refuse: exit 2, message on stderr (and stdout) matching /WIP commit/i, /handoff/i, /release/i, `outcome: partial`.
- Wrap-up allowed at 80k+ (each a single simple command, no chaining with `&&`, `;`, `|`): `git add ...`, `git commit ...`, `npm run board -- handoff|release|comment ...`, `node scripts/context.mjs [--self]`; Write/Edit whose `file_path` resolves under `.scratch/` (a `.scratch/../apps/..` path is refused). Everything else refused: Read, Grep, Glob, other Bash (`cat`, `npm test`, `npm run board -- claim`), Write/Edit outside `.scratch/`, chained commands starting with a wrap-up call.

## Criterion to test map

- AC1 under 70k silent: "under 70k ..." (2 tests, incl. 69,999)
- AC2 70k-80k warning: "at exactly 70k ...", "at 79,999 ...", plus a test that the three token counters are summed
- AC3 refusals: "at exactly 80k refuses a Read", "refuses a Grep, a Glob and a non-wrap-up Bash", refusal-message test, Write/Edit outside .scratch, `..` escape, chained commands, board claim; allowed: 7 wrap-up Bash tests, Write/Edit under .scratch
- AC4 null context: 2 tests (no transcript, transcript with no usage), plus fail-open on bad stdin and a test that another cell's 95k transcript is ignored
- AC5 orchestrator: 3 tests
- AC6 settings.json edit in the developer handoff: human-verified (`.claude/` is user-gated, not in this branch). The developer's handoff must hold the exact edit: a `PreToolUse` entry (no matcher, so it covers all tools) running `node "$CLAUDE_PROJECT_DIR/scripts/hooks/context-budget.mjs"`.
- AC7 `npm test` passes: whole suite

## Open question for the orchestrator

The handoff skill drafts under /tmp (the scratchpad), and `board handoff` refuses a draft inside a worktree. At 80k the hook as the ticket words it (writes under `.scratch/` only) would refuse that draft Write. I did not add a test or scope for it. Suggest the user decides whether the hook should also allow Write to the cell's scratchpad dir (e.g. `/tmp/claude-*/`); otherwise a partial wrap-up cannot draft a handoff.

Context used: 43k.

```json
{
  "ticket": "organism-infra/162-context-budget-hook",
  "cell": "qa",
  "mode": "specify",
  "current_step": "27 failing tests committed at 0d31296 on tests/162-context-budget-hook; all red with MODULE_NOT_FOUND for the missing hook script",
  "artifacts": [{"path": "scripts/hooks/context-budget.test.mjs", "note": "27 tests, criterion map in file header"}],
  "decisions": [
    {"decision": "Cell session = input has agent_id; orchestrator = no agent fields or agent_type orchestrator", "why": "main-session hook input carries no agent_id; cells run as subagents"},
    {"decision": "Refusal is exit 2 with stderr message; warning is exit 0 with hookSpecificOutput.additionalContext", "why": "matches bash-guard.mjs convention"},
    {"decision": "AC6 settings.json edit marked human-verified", "why": ".claude/ is user-gated"}
  ],
  "failures": [],
  "pending": [
    {"item": "Implement scripts/hooks/context-budget.mjs; put the exact settings.json PreToolUse edit in the handoff", "owner": "developer"},
    {"item": "Decide whether the hook also allows Write to the scratchpad /tmp dir so a partial wrap-up can draft a handoff", "owner": "orchestrator"}
  ]
}
```
