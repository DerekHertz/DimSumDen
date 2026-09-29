---
name: usage-watch
description: Check plan usage and wind work down before the limit hits. Use at every dispatch decision, when a cell returns, and every 30 minutes or so in a long session. If the 5-hour window is at or above 80%, start wrapping up.
---

Read usage with `mcp__ccd_session_mgmt__get_usage` (main session only; the `5-hour limit` window's `percentUsed`). The desktop app doesn't provide that tool to WSL sessions, so there run `node scripts/usage.mjs`: it prints `{"5-hour":{"percent","resets_at"},"weekly":{...}}` and exits 1 on any failure (if it reports no token, the user needs to log in to `claude` in WSL). If both fail, or you're a subagent, ask the main session or the user for the number rather than guessing.

In a cloud session (`CLAUDE_CODE_REMOTE` set) there is no credentials file, so `node scripts/usage.mjs` prints an estimate instead: `{"source":"estimate","weighted_tokens",...,"credits_left_est"}`. It is calibrated from the user's manual `cloud_credits` readings in `.scratch/usage.jsonl`. Treat `100 - credits_left_est` as percent used, and log it as `cloud_credits_est`. When it is null (fewer than two manual readings), use `weighted_tokens` for the trend only. Near 80% used, ask the user for a real reading; each new reading recalibrates the estimate.

The user is on the **Pro** plan. If `get_usage` reports a different plan (e.g. it reported "Max" on 2026-09-27, likely stale), warn the user rather than silently trusting it.

| 5-hour usage | Action |
|---|---|
| under 80% | Carry on. Check again at the next dispatch or cell return. |
| 80–89% | **Wrap up.** Start no new cells. Let a running cell finish or reach a clean stopping point, then stop. Record the agreed next steps in each open ticket's `## Comments`, write handoffs, stop any dev servers you started, and commit and push finished work (pushing is still a pass gate). Tell the user the percentage and when it resets. |
| 90% or more | **Stop now.** Nothing new at all. Write a one-paragraph handoff with what is in flight and where, and end. |

Also check the weekly window. At 80% or more, tell the user before dispatching anything expensive (Opus cells, the full relay).
