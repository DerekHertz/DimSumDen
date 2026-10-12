# Orchestrator handoff 123 (2026-10-12)

Written at the 80k context stop (reading: 90k). No cell is running. Continues handoff 122: the user asked this session to finish the seven-step list as an executive, following the relays.

## Goal (user, 2026-10-12)
Several agents controlled from the Den: 226, 227, 228, then the user's check. Nothing else is to be raised until that works.

## Done this session
- **Batch 226-227 merged as PR #239** (merge commit 0c43782, CI green). Both tickets resolved with `board resolve --pr 239`; `advisory-outcome` logged for 226. Relay: qa specify (41 failing tests), developer (sonnet, 4445 pass, 0 fail), qa verify light (pass), risk-check (3 hits on host code), security (pass). No bounce.
- **228 designer spec is signed off by the user**: `.scratch/organism-infra/handoffs/228-designer-spec.md`, mockups at https://claude.ai/artifact/BqPJ8iBVisEc9TLTiP9vN5. 228 is `ready-for-agent` and now unblocked.
- Worktrees of the four batch cells removed by `worktree-gc --apply`.

## Blocked
- **228 qa specify cannot start**: the orchestrator context is 90k, over the 80k guard. Needs the user's `/compact`.

## Next
1. After the compact: `node scripts/context.mjs` and `node scripts/usage.mjs --provider claude`, then `git rev-parse HEAD` on main for the base. Log `board pick` and `jev.mjs route --mode advisory` for 228.
2. Dispatch qa specify for 228: `node scripts/dispatch-prompt.mjs --ticket organism-infra/228-ui-run-any-frontier-ticket --cell qa --mode specify --base <main sha> --branch tests/organism-infra-228-ui-run-any-frontier-ticket`. Point the cell at the designer spec's "Acceptance for qa" section (pure models `defaultRole`, `ROLE_OPTIONS`, `slotRows`, `runState`, the client `dispatch`, the dispatch prompt absent at room 0). `capacity.refs` is `{ ref, kind: "live" | "lock" }`, one entry per ref.
3. Developer: `jev.mjs tier` first; base is qa's tests commit; a new branch `feature/organism-infra-228-ui-run-any-frontier-ticket` (`cell-start` refuses an existing branch name). Later hops of the same ticket pass `--continue`.
4. qa verify: save `npm test` output, then trim it. The full output is over the 1 MB limit of `--tests`; pass a file with the `not ok` lines plus the summary.
5. Hold 228 at `ready-for-human` for the user's visual verdict (both themes, 375px, reduced motion). Their findings go to one developer fix round. Then risk-check, PR, merge on green, `board resolve`.
6. Step 7 is the user's: restart the bridge and UI, start two or three agents from the Den, check message, approve and transcript on each.

## Known, not filed (the user's rule: nothing new until the Den works)
- `readLocked` in `apps/bridge/cells/host.mjs:204` treats a non-array from `lockedRefs` as no locks (fails open). Security rated it low and not blocking; the fix is one line plus a test. The bridge's own reader always returns an array.
- No test covers the 503 when `lockedRefs` throws (qa verify noted it; the code fails closed).
- The designer's pending item: a "Clear stale lock" action in the Den needs a bridge route and a security look.
- `CLAUDE.md` still says `max_concurrent_cells: 2`. That is the orchestrator's cell limit; the bridge's default max of agents is now 8. Cells may not edit `CLAUDE.md`; the user decides whether the line changes.
- den-v1/15: not needed for 228. A ticket whose den task ended stays in the ready list with Run enabled.

## Left alone
- Worktree `agent-ad76281f4272745e6` holds the 107 tests branch (held by the user).
- The designer's worktree for the 228 spec is already gone.
- queue/08, 107, retro items and the orchestrator-through-the-bridge idea: not raised.
- Usage at the last reading: 5-hour 49% (resets 18:20 PDT), weekly 49%.
