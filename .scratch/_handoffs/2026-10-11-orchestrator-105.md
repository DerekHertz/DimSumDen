# Orchestrator handoff 105 (2026-10-11)

Mid-flight handoff at the 80k context gate. agent-os/07 is **blocked** on a design question. `session-check` is **not clean**: see "Unpushed" below.

## State
- **agent-os/07-grant-hardening: blocked, relay stopped at stage 2.**
  - qa specify done: `apps/bridge/cells/grants-hardening.test.mjs`, 191 tests, 180 red, branch `tests/agent-os-07-grant-hardening` @ c68ddad. Handoff `07-qa-specify.md`.
  - Developer (Sonnet) ran the live probe first, as the ticket says, and stopped because writes succeeded. It wrote no code; the branch is still c68ddad. Handoff `07-developer.md` holds the full table; the result is also a ticket comment. Returned `outcome: partial`.
  - **Probe result (agent-os/02 code, bare task, no grants, real haiku child in a throwaway repo):** from a worktree, the sandboxed shell wrote `<main>/.git/refs/heads/*` and overwrote `<main>/.git/HEAD`; `git update-ref` and `git branch` both created refs in the main repo. The Write tool on `.git/refs` asked for permission (denied by the probe); Write on `HEAD` is unproven (failed on "File has not been read yet"). Write and Edit on the worktree's `.git` pointer file are already denied.
  - Developer's guess at the cause, unverified: the sandbox `denyWrite` on the main `.git` is added only when a path grant passes `root`, so a bare task has none.
  - Design question: a blanket deny on the main `.git` breaks the developer's own `git commit` in a worktree (it writes `.git/objects`, `.git/worktrees/<own>` and its own branch ref). It needs an allow for those and a deny for the rest.
  - User decisions this session (2026-10-11), on the ticket: refused list is security's list (`~/.ssh`, `~/.claude`, `~/.config`, `~/.local`, `~/.git*`, shell rc files, `/etc`, `/usr`).
  - qa's reading, stated to the user and not objected to: a grant on or under a governed path is a 400; a grant above one stays allowed.
  - Jev: route pick `qa-specify` 0.95 (same as mine); tier pick `opus` 0.99, effective `sonnet` (shadow). `advisory-outcome` row logged.
  - Both cell worktrees are clean and detached at c68ddad: `agent-ac0516f0023739c49` (qa), `agent-ad9410102d2b5eee7` (developer). No locks.
- **Retro run** (row at about 01:31Z). Filed organism-infra/221 (dev-server test flake). Unparked organism-infra/214, closed 170 as its duplicate.
- **Retro skill change:** the user applied gated patch `221-retro-review-step` (commit 1bcb932 on local `main`): step 1b reviews unbuilt tickets earlier retros filed, step 3b adds three checks. **PR #224** carries it (branch `retro-review-step`); CI not checked yet, merge not yet proposed.
- **agent-os/08-closed-den-retro** filed at `needs-triage`: the closed-den janitorial slot (ADR 0021) runs the retro. Open points are on the ticket.
- Of 64 tickets filed by retros, 28 are parked. Duplicates seen: 201 with 219 (scout context hook), 156 with 215 (Grep tool missing).

## Unpushed (session-check red)
- Local `main` is 1 commit ahead of origin: 1bcb932, the `.claude/` skill commit. It is code, so it must not be pushed straight to `main`.
- Held uncommitted so they do not stack on that commit: `.scratch/agent-os/issues/07-grant-hardening.md`, `.scratch/agent-os/handoffs/07-developer.md`, `.scratch/_handoffs/gated/applied/221-retro-review-step.patch`, `.scratch/usage.jsonl`, `.scratch/events.jsonl`, this handoff.
- To clear: with the user's yes, merge PR #224 on green with a merge commit, `git pull --ff-only origin main`, then commit and push the board files.

## Mistakes this session
- Logged the developer's `log-cell` row with `--model claude-sonnet-5`; the Agent `model` passed was `sonnet`. The qa row says `sonnet`.
- Did not log the scout run (retro skill comparison, 16k tokens) with `log-cell`.
- Incident row logged: a gated patch applied on `main` mid-relay blocks board pushes.

## Next
1. PR #224: check `gh pr checks 224`, propose the merge, then clear the unpushed list.
2. agent-os/07: propose `architect` for the main-`.git` deny design (ADR 0021; run `jev route-bounce`? no: this is not a bounce, the ticket is blocked on design). After the design is recorded, unblock and re-dispatch a developer with `--continue` on the same branch (handoff name `07-developer-2.md`).
3. The probe shows a live hole in merged agent-os/02 code. Ask the user whether den agents should stay off real work until 07 lands.
4. Then, one ticket per session: agent-os/03, organism-infra/214, 219, 107, den-v1/15.

Usage: 5h 71% (resets 19:49 PDT), weekly 21%.
