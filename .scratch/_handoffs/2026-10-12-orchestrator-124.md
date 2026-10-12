# Orchestrator handoff 124 (2026-10-12)

Written at the 80k context line (reading: 82k). No cell is running. Continues handoff 123.

## Goal (user, 2026-10-12)
Several agents controlled from the Den: 226, 227 (done), 228, then the user's check. Nothing else is to be raised until that works.

## Done this session
- 228 relay through qa verify, no bounce: qa specify (42 failing tests, 054e0fa), developer on sonnet (b0f959c, 4487 pass, 0 fail, re-run by the orchestrator), qa verify light (pass).
- Branch `feature/organism-infra-228-ui-run-any-frontier-ticket` @ b0f959c is pushed. Developer worktree: `.claude/worktrees/agent-afa28be0f022f9a65` (UI built there; `npm run ui` serves it on 4317 against the main board).
- 228 is held at `ready-for-human` for the user's visual verdict. Hold handoff: `.scratch/organism-infra/handoffs/228-orchestrator-visual-hold.md`. qa's 8 notes: `228-qa-verify.md`.
- `board pick` logged; Jev advisory route was `other` (0.5), the orchestrator picked `qa-specify`.

## Waiting on the user
- The visual verdict on 228 (both themes, 375px, reduced motion).

## Next
1. Findings from the user: one developer fix round. `dispatch-prompt.mjs --cell developer --base b0f959c --branch <a new name, e.g. feature/organism-infra-228-fix-1>`; the cell-start line needs `--continue` added if the context is at 80k or more (a ticket in flight). `jev.mjs tier` first. Then a light qa verify of the fix.
2. The user's yes: `npm run risk-check` against the branch; a hit dispatches security (`--base <tip> --detach`, `--continue`).
3. PR from the feature branch, merge on green (`gh pr merge <n> --merge`), `board resolve organism-infra/228-ui-run-any-frontier-ticket --pr <n>`, `jev.mjs advisory-outcome --ticket ... --orchestrator qa-specify --jev other --user qa-specify --bounced false`, then `worktree-gc`.
4. Step 7 is the user's: restart the bridge and UI from main, start two or three agents from the Den, check message, approve and transcript on each.

## Known, not filed (the user's rule: nothing new until the Den works)
- Everything under this heading in handoff 123 still stands.
- qa verify notes on 228 that the user may or may not want changed: a refusal shows in both cards when a ref is in both; a refusal on one row stays when Run is pressed on another; with a stale snapshot and the bridge offline the strip keeps the old slots; ticket type `design` defaults to orchestrator.

## Left alone
- Worktree `agent-ad76281f4272745e6` holds the 107 tests branch (held by the user).
- Worktrees of 228's three cells stay until the merge.
- Usage at the last reading: 5-hour 69% (resets 18:20 PDT), weekly 52%.
