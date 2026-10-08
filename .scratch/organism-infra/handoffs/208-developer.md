# 208 developer

Branch `feat/208-cell-context-hook` (base 83d3e27, qa tests). Full `npm test`: 2997 pass, 0 fail. The 13 qa tests in `scripts/hooks/context-budget.208.test.mjs` pass unedited.

## What changed

- `scripts/hooks/context-budget.mjs`: (1) the 70k-80k warning is once per cell, keyed by session and agent in a marker file under `~/.claude/context-budget-warned/` (HOME is the test seam; if the marker can't be written the warning is sent again); (2) `node scripts/log-cell.mjs ...` joins the wrap-up Bash list (still one simple command, no chaining); (3) Write/Edit under `/tmp` (not `/tmp` itself, and not inside the call's cwd or HOME) is a wrap-up write; the refusal text names log-cell and /tmp.
- `scripts/context-budget.json`: developer and qa lowered from 100k/120k to 70k/80k (scope decided by the user).
- Tests updated for the new numbers and behavior: `context-budget.test.mjs` (repeat warning now silent), `.tiers`, `.handback`, `.scratchpad` (look-alike and `..` cases moved off `/tmp`, since `/tmp` writes are now allowed), `scripts/context-budget.test.mjs`, `scripts/context-cell-state.test.mjs`.

## AC6: settings.json diff

None needed. The PreToolUse registration of the hook is already in `.claude/settings.json` (line 68-73, from 162). Orchestrator is never gated (existing `isCellSession`).

## Gated patch (user applies)

`.scratch/_handoffs/gated/208-context-budget-80k.patch`: `.claude/skills/organism-protocol/SKILL.md` "Context budget" paragraph still says developer and qa stop at 120k; the patch makes it 70k/80k for every cell. Run `!npm run apply-gated`.

## Notes

- /code-review sub-agents were skipped: my context hit the 70k warn line at the end of the work (71.6k), so I did a self-review only.
- Live probe (orchestrator comment): the hook reads real context in a worktree cell; no live-firing fix was needed.

## State

```json
{
  "ticket": "organism-infra/208-cell-context-hook",
  "cell": "developer",
  "current_step": "implemented and committed on feat/208-cell-context-hook; npm test 2997/2997 green; releasing at in-review",
  "artifacts": [
    {"path": "scripts/hooks/context-budget.mjs", "note": "one-time warning, log-cell wrap-up, /tmp draft writes"},
    {"path": "scripts/context-budget.json", "note": "developer and qa now 70k/80k"},
    {"path": ".scratch/_handoffs/gated/208-context-budget-80k.patch", "note": "organism-protocol SKILL wording; user applies"}
  ],
  "decisions": [
    {"decision": "warned-once marker lives under ~/.claude/context-budget-warned", "why": "tests set HOME to a fixture, so state stays isolated; failure to write falls back to warning again"},
    {"decision": "/tmp writes allowed except inside the call's cwd or HOME", "why": "qa tests put fixture worktrees under /tmp and require those refused"},
    {"decision": "edited four older hook tests that pinned 100k/120k, repeat warnings or /tmp refusal", "why": "they contradicted the settled 208 scope"}
  ],
  "failures": [],
  "pending": [
    {"item": "apply gated patch 208-context-budget-80k.patch with !npm run apply-gated", "owner": "orchestrator"},
    {"item": "qa verify (light), then risk-check", "owner": "qa"}
  ]
}
```
