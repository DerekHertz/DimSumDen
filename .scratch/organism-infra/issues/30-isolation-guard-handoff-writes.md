# 30: `board handoff` publishes a cell's handoff to the main checkout

**Type:** task

**What to build:** Claude Code's built-in worktree guard rejects a cell's Write to the main checkout's handoff path. That guard is part of the harness and outside this repo, so it can't be relaxed. Every relay this session hit it: security on 35, developer and security on 44, and all four cells on 26. Close the gap organism-protocol already names: add `board handoff <ref> --from <file>`. It copies a handoff the cell wrote in its own scratchpad or worktree into `<main checkout>/.scratch/<feature>/handoffs/`, found through the board's main-checkout resolution (no ORGANISM_ROOT). It rejects any destination outside that directory. Also run the handoff gate on `board release --keep-status`: security released that way on 44 before its handoff existed. Then update organism-protocol and the handoff skill: write the handoff locally and publish it with `board handoff`; drop the shell-write exception. The skill edits are `.claude/`, so they need the orchestrator's (user-approved) edit after merge.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] `board handoff <ref> --from <file>` writes `<main>/.scratch/<feature>/handoffs/<name>.md` from a worktree (test)
- [x] a name with path separators or `..`, or a ticket from another feature, is rejected (test)
- [x] `board release --keep-status` without a matching handoff fails without --force (test)
- [x] organism-protocol and handoff skill point at `board handoff` (orchestrator edit, after merge)

## Comments

- **Created (orchestrator, 2026-09-28):** Friction reported by qa, developer and security cells during ticket 26's relay in WSL.
- **Rescoped (orchestrator, 2026-09-28):** The guard is harness-side, so the ticket now adds a `board handoff` command instead of an allow-list. Folded in the `--keep-status` gate gap from 44. User asked to address this friction first.
- **qa, 2026-09-29:** QA pass (light verify at b1b9e35): 283/283 tests pass, tests unchanged since specify, criteria 1-3 covered; 4 is orchestrator edit. Handoff 30-qa-verify.md
- **orchestrator, 2026-09-29:** security (static read, relayed): bounce. MEDIUM: publishHandoff lacks assertWithinRoot on the handoffs dir, so a pre-planted symlink redirects the write. LOW: can overwrite another cell's handoff; no size cap on --from. Fix round next.
- **security, 2026-09-29:** Security pass (re-check b1b9e35..d8124fd). Symlink dir escape (medium), overwrite (low), --from cap (low) all fixed and exercised; fix1 tests 6/6. Detail: handoffs/30-security2.md
