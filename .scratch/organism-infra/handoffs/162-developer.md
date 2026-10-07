# 162 developer handoff

Branch `feat/162-context-budget-hook` (from tests 0d31296). The hook is `scripts/hooks/context-budget.mjs`; all 27 qa tests pass, plus 4 added tests for the user's scratchpad scope in `scripts/hooks/context-budget.scratchpad.test.mjs`.

## How it works

- Cell session = input has `agent_id` and `agent_type !== "orchestrator"`. Anything else is allowed silently.
- It runs `node scripts/context.mjs --self` as a child (cwd = input cwd, `CLAUDE_CODE_SESSION_ID` = input `session_id`) and reads `context_tokens`. Null, a failed child or bad stdin allows.
- Under 70k silent. 70k to 79,999 allows and prints `hookSpecificOutput.additionalContext` (checkpoint warning). 80k+ exits 2 with the wrap-up message on stderr and stdout, unless the call is a wrap-up call.
- Wrap-up calls at 80k+: a single simple Bash command (`git add|commit`, `npm run board -- handoff|release|comment`, `node scripts/context.mjs [--self]`; `;`, `&`, `|`, `<`, `>`, parens outside quotes, and `$`, backtick or newline anywhere, make it a chain and refuse it); Write/Edit whose resolved path contains `/.scratch/` or sits under `/tmp/claude-*/<slug>/<session_id>/scratchpad/` (the scratchpad scope added by the user, 2026-10-06). `..` escapes are refused because paths are resolved first.

## AC6: the `.claude/settings.json` edit (user applies; I did not touch `.claude/`)

Add a `PreToolUse` key to `hooks` (no matcher, so it covers every tool). The file has no `PreToolUse` key now. Insert before `"Notification"`:

```diff
   "hooks": {
     "SessionStart": [ ... unchanged ... ],
+    "PreToolUse": [
+      {
+        "hooks": [
+          {
+            "type": "command",
+            "command": "node \"$CLAUDE_PROJECT_DIR/scripts/hooks/context-budget.mjs\"",
+            "timeout": 15
+          }
+        ]
+      }
+    ],
     "Notification": [
```

If the user's `settings.local.json` already registers a `PreToolUse` list, add the same entry object to that list instead of a second key. The orchestrator main session is unaffected (the hook returns early without `agent_id`).

## Notes for qa verify

- Each tool call in a cell spawns one extra `node` (context.mjs) of about 50 ms.
- Not verifiable in this branch: a live run in a real subagent (the hook is not registered until the user applies the edit). Worth one real check after applying: the subagent's PreToolUse input must carry `agent_id` and the parent `session_id`, as qa assumed.
- The scratchpad pattern assumes `/tmp` or `os.tmpdir()` plus `claude-<uid>/<project slug>/<session_id>/scratchpad/`, the layout this environment reports.

```json
{
  "ticket": "organism-infra/162-context-budget-hook",
  "cell": "developer",
  "current_step": "hook implemented, 31 hook tests green, full npm test run by scout; settings.json edit written in this handoff for the user",
  "artifacts": [
    {"path": "scripts/hooks/context-budget.mjs", "note": "the PreToolUse hook"},
    {"path": "scripts/hooks/context-budget.scratchpad.test.mjs", "note": "4 tests for the scratchpad scope"}
  ],
  "decisions": [
    {"decision": "Read the context by spawning context.mjs --self with the input session id", "why": "reuses the one reading logic; the hook env has no CLAUDE_CODE_SESSION_ID"},
    {"decision": "Quoted text may hold ; & | < > ( ) but never $ or backtick", "why": "commit and comment messages need punctuation; double-quote expansion would be a bypass"},
    {"decision": "Scratchpad allowed as /tmp/claude-*/<slug>/<session_id>/scratchpad/ only for Write/Edit", "why": "user scope: the handoff skill drafts there; keeps other sessions and look-alike paths refused"}
  ],
  "failures": [],
  "pending": [
    {"item": "Apply the PreToolUse entry in .claude/settings.json (diff above), then check the hook fires in a real cell", "owner": "user"},
    {"item": "qa verify (light)", "owner": "qa"}
  ]
}
```
