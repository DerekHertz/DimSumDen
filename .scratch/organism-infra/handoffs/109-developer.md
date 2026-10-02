# developer: organism-infra/109-statusline-usage-context-relay (batch M: 109, 110, 111)

```json
{
  "ticket": "organism-infra/109-statusline-usage-context-relay",
  "cell": "developer",
  "current_step": "Batch M implemented on feat/batch-m-hooks at a1e49c4. qa's four test files pass unchanged; full npm test 1880/1880 green. Gated settings patch written.",
  "artifacts": [
    "branch feat/batch-m-hooks @ a1e49c4",
    "scripts/statusline.mjs",
    "scripts/session-start.mjs",
    "scripts/notify.mjs",
    "scripts/hook-io.mjs",
    "scripts/context-state.mjs",
    "scripts/context.mjs",
    ".scratch/_handoffs/gated/01-batch-m-settings.patch"
  ],
  "decisions": [
    "Field names verified against the official docs (scout fetch): context_window.current_usage with input_tokens, output_tokens, cache_creation_input_tokens, cache_read_input_tokens; current_usage is null before the first API call and after /compact until the next call; session_id and transcript_path are top-level. SessionStart input carries agent_type (set for claude --agent <name>) and source. qa's tests needed no change. Sources: https://code.claude.com/docs/en/statusline.md and https://code.claude.com/docs/en/hooks.md.",
    "Shared helpers: hook-io.mjs (stdin JSON that never throws, bounded usage read via child node) and context-state.mjs (one file per session at $HOME/.claude/statusline-context/<session_id>.json). context.mjs prefers that file for CLAUDE_CODE_SESSION_ID, else the old transcript path.",
    "statusline: usage cache default $HOME/.claude/statusline-usage.json, 60 s by mtime, default usage timeout 4000 ms. A failed read prints '5h ?' and 'wk ?' (stale cache is not reused). Relay segment is omitted when no locks.",
    "notify: toast via powershell.exe with the message and title in env vars (NOTIFY_TITLE, NOTIFY_MESSAGE, forwarded with WSLENV) read through CreateTextNode, so quotes and $(...) in a message are inert. Gate state default $HOME/.claude/dimsumden-notify-state.json. An undelivered gate (no toast and no bell) stays un-notified.",
    "session-start: required lines (handoff, usage) are never cut; PR and request lines fill the remaining budget of the 1600-char cap and a '... N more lines omitted' marker is added.",
    "111: only ready-for-human tickets count as gates; no new board markers."
  ],
  "failures": [],
  "pending": [
    {
      "item": "User applies the gated patch with !npm run apply-gated (.scratch/_handoffs/gated/01-batch-m-settings.patch; git apply --check against main passes).",
      "owner": "orchestrator"
    },
    {
      "item": "qa verify on batch M.",
      "owner": "qa"
    },
    {
      "item": "Human check after the patch is applied: the real Windows toast, and that the SessionStart hook's plain stdout reaches the orchestrator's context (the hooks docs page confirms plain text becomes context only for some events and the scout could not confirm SessionStart explicitly; if it does not, switch session-start.mjs to JSON hookSpecificOutput.additionalContext).",
      "owner": "orchestrator"
    }
  ]
}
```

## Verification

- `node --test` on statusline, context-statusline, context, session-start, notify tests: all pass, tests untouched.
- Full `npm test`: 1880 pass, 0 fail, 0 cancelled (run by scout).
- A real powershell.exe exists in this WSL (`/mnt/c/.../powershell.exe`); running notify.mjs against it with a probe message exited 0 with no bell, so the toast call itself succeeded. Whether the toast is visibly shown was not observed.

## Patch

`.scratch/_handoffs/gated/01-batch-m-settings.patch` (format-patch style, one subject line). Adds `statusLine` (command `node "$CLAUDE_PROJECT_DIR/scripts/statusline.mjs"`), `hooks.SessionStart` (matcher `startup|resume|compact`, timeout 20), `hooks.Notification` and `hooks.Stop` (notify.mjs, timeout 15). Hook timeouts are in seconds per the docs. I did not set statusLine `refreshInterval` since the docs fetch did not confirm it.

## Notes for the orchestrator

- 110 and 111 need no further detail: see this handoff.
- Open from qa: merge proposals and "question to the user" still have no board representation, so notify.mjs gates only on ready-for-human.
