# Orchestrator handoff 125 (2026-10-12)

Written at 111k context, over the 80k line. No cell is running. Continues handoff 124.

## Goal (user, 2026-10-12)
Several agents controlled from the Den: 226, 227, 228 are merged. The user's own check (step 7) has started: they dispatched an agent on agent-os/05 from the Den and said "it works!".

## Done this session
- **228 merged as PR #240** (merge commit 3c0b622, CI green) and resolved. Relay: qa specify, developer (sonnet), qa verify, the user's visual pass, risk-check (2 hits), security (pass, two low notes). No bounce. `advisory-outcome` logged.
- **organism-infra/229 filed** at the user's choice ("Merge, then design it"): run a ticket's relay through the bridge (direct qa/developer/security dispatch, default role = the first agent needed, a finish event that routes the next hop, ceilings for the five roles with none). Type design-question; proposed cell: architect. Not picked or dispatched yet.
- Worktrees of 228's cells and the den test agent's worktree removed by `worktree-gc --apply`.

## The user's Den feedback from their check (2026-10-12), not filed
- "it's a little difficult to tell why an agent would need me right now ... just seeing the commands is unhelpful." The Needs you cards show the command, not why the agent wants it.
- Bao has no panda to chat with yet.
- "i've told it to stop but i have no clue if it has actually received it and is listening." Facts: the user typed the stop into deny notes; `.scratch/_run/sessions.jsonl` shows no `stop` event for agent c-097779ab7213919f, 7 denies, and `end` state `done` at 23:32:04Z. The bridge has `POST /agents/:id/stop`; no file under `apps/ui/src` calls it, so the Den has no Stop control and shows no receipt for a deny note.
- The user asked whether permissions are being worked on so they need not approve every request. Answer given: scout, developer, qa and security already run behind the wall without prompts (agent-os/04); orchestrator, architect, product, designer and herald have no ceiling, so they ask every time; 229 question 5 covers it.

## Next
1. The user's `/compact` first (context 111k).
2. The Den feedback is filed as organism-infra/230 (the user chose "One ticket, designer"). It needs a designer spec with the user: print its `dispatch-prompt.mjs` output for a terminal run. It can run beside 229.
3. 229: `board pick`, `jev.mjs route --mode advisory`, then propose the architect and wait for the user's approval of the ticket. An architect on a design question may need the user; print its dispatch prompt for a terminal run if it must ask questions.
4. Step 7 remains the user's: restart from main (`npm run ui` in the main checkout), start two or three agents, check message, approve and transcript on each.

## Known, not filed
- Everything under this heading in handoffs 123 and 124 still stands.
- Security's two low notes on 228: the UI imports the pure `capacity()` from `apps/bridge/cells/capacity.mjs` across the app boundary; the bridge's error string is shown verbatim.
- `board audit`: agent-os/03-target-project is `in-review` with no claim lock.
- `.scratch/_requests/requests.jsonl` is modified in the main checkout by the user's den test; left uncommitted.

## Left alone
- Worktree `agent-ad76281f4272745e6` holds the 107 tests branch (held by the user).
- Usage at the last reading: 5-hour 75% (resets 18:19 PDT), weekly 53%.
