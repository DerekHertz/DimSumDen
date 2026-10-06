# 139 developer fix round 2 (ADR text only)

Commit 4d363da on feat/139-steering-auth-gate. Only `docs/adr/0016-ui-steering-channel.md` changed, decision 7. No code touched; tests not rerun (the only test-adjacent check: nothing in the repo references the ADR file by name).

Edits:
1. Removed "needs the user's yes" from the reload bullet heading.
2. "How the bridge is started" bullet: a fresh launch code is needed after a closed tab without restarting the bridge; a page reload does not need one, and a bridge restart prints a new code at start.
3. Reload bullet now states the M1 residual (sessionStorage may persist to the browser profile, readable by same-account processes; no token expiry; bridge restart kills stale copies) and points to organism-infra/152.

Left alone: decision 6 item 2 still says the new-code path "is part of 'How the bridge is started', which is still open". That remains true, so I did not touch it.

```json
{
  "ticket": "organism-infra/139-steering-auth-gate",
  "cell": "developer",
  "current_step": "ADR 0016 decision 7 wording fixes committed at 4d363da; ticket ready for in-review",
  "artifacts": ["docs/adr/0016-ui-steering-channel.md"],
  "decisions": ["Reworded the closed-tab/reload/bridge-restart launch-code case in one parenthetical rather than a new bullet"],
  "failures": [],
  "pending": []
}
```
