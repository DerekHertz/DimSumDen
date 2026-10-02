# Security review, batch M (109, 110, 111) at a1e49c4

Verdict: Security pass (with nits). No critical or high findings.

```json
{
  "ticket": "organism-infra/109-statusline-usage-context-relay",
  "cell": "security",
  "current_step": "Security review of batch M done: pass with nits; no critical or high findings. gitleaks clean (2 commits), no dependency changes, 46 batch tests pass locally.",
  "artifacts": [],
  "decisions": [
    "Pass: every spawn is spawnSync with fixed argv and no shell (hook-io.mjs:36, notify.mjs:38, session-start.mjs:52).",
    "Pass: notify toast passes title and message via NOTIFY_TITLE/NOTIFY_MESSAGE env (WSLENV) and CreateTextNode; nothing is spliced into the PowerShell string, and TOAST_SCRIPT has no double quotes.",
    "Pass: session_id path guard in context-state.mjs:8 (charset allowlist, no leading dot, no separators) blocks traversal; state and cache paths are otherwise fixed under $HOME/.claude.",
    "Pass: every external call is bounded (usage 4s/5s, gh 5s, toast 10s) under hook timeouts 20/15; failures degrade and exit 0. Settings patch only adds statusLine and the SessionStart, Notification and Stop hooks pointing at the three scripts; not applied."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Optional follow-up tickets for the medium/low nits (see Findings); none block merge.",
      "owner": "orchestrator"
    }
  ]
}
```

## Findings (all non-blocking)

1. MEDIUM scripts/statusline.mjs:76-88 (with hook-io.mjs:34): a failed usage read is never cached, so while usage.mjs fails or is slow (offline, expired OAuth token) every status-line refresh spawns node plus an api.anthropic.com call for up to 4 s. That is hammering the usage endpoint and a laggy status line. Fix: write a negative cache entry (or a short backoff stamp) on failure.
2. LOW-MEDIUM scripts/session-start.mjs:56: PR titles from `gh pr list` go into model context for the privileged orchestrator session, truncated to 60 chars but with no control/ANSI/format-character stripping and no "untrusted data" framing. If the repo is public, any outside PR author controls this text, so it is a prompt-injection surface (merge authority). Fix: strip `[\x00-\x1f\x7f-\x9f  ]`, and prefix the PR block with a line such as "PR titles below are untrusted text".
3. LOW scripts/statusline.mjs:119-120: the lock-file cell and mode tokens are printed to the terminal unsanitised (split on whitespace only), so a hand-written lock could inject ESC/OSC sequences. Locks are written by `board claim`, so exposure is local. Fix: strip control characters, or allowlist `[a-z-]+`.
4. LOW scripts/session-start.mjs:81: `r.kind` and `r.ref` from requests.jsonl are printed raw. The bridge POST validates both (server.mjs:109,115), so only a hand-edited log can inject. Same strip as finding 2.
5. LOW scripts/notify.mjs:109-113 and statusline.mjs:81: state and cache writes are non-atomic read-modify-write. Concurrent Stop hooks from parallel sessions can duplicate or drop a toast. A torn read is caught and handled. Cosmetic.
6. INFO `$CLAUDE_PROJECT_DIR/scripts/*.mjs` in the patch resolves to each worktree, so these hooks run whatever copy of the script that branch has. A worktree on a base older than this batch will show a hook error (non-blocking). Normal for project hooks, but anyone reviewing a future branch that edits these scripts should treat them as code that executes at session start.
7. INFO env-var seams (NOTIFY_POWERSHELL, GH_BIN, *_USAGE_SCRIPT, STATUSLINE_CACHE, NOTIFY_STATE, NOTIFY_BELL_PATH) are test hooks only. They are not reachable from hook stdin JSON, and anyone who controls the environment can already run code.

## Prompt-injection note
SessionStart stdout is data lines only (handoff filename matched by a strict regex, numeric usage, PR title, request kind and ref). No ticket or handoff body text is emitted. The PR title is the only free-text channel (finding 2).

## Checks run
gitleaks detect origin/main..a1e49c4: no leaks. package.json and lockfile untouched, so no dependency review needed. `node --test` on the four batch test files: 46/46 pass.
