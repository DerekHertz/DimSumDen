# 95: Context step size gate counts binaries, so jg never runs

**Type:** bug

**Priority:** P1

**Blocked by:** None

**Status:** resolved

## What to build

`scripts/dispatch-context.mjs` (ADR 0014, ticket 87) skips the context step when the eligible root is over `ROOT_CAP` (5 MB). The check sums the bytes of every tracked file outside the board, binaries included. The repo is about 182 MB tracked, almost all `.blend`, `.png` and `.glb` under `design/3d/` and `apps/ui/`, which jg never sends. Text-only tracked files total about 4.5 MB. So every dispatch since 87 merged has logged `skipped: "root over 5 MB eligible"` (tickets 94, 02, 07, 04) and no cell has received start-here context.

Make the size gate measure what jg would actually send. Prefer jg's own eligible-byte count if `jg` exposes one; otherwise exclude binary files (a NUL byte in the first 8 KB, or a known binary extension list) from the sum. Keep the 5 MB cap and the `skipped` reason string. The text total is close to the cap, so note in the handoff how much headroom remains.

Files: `scripts/dispatch-context.mjs`, `scripts/dispatch-context.test.mjs`.

## Acceptance criteria

- [ ] A root whose tracked text files are under 5 MB but which also holds over 5 MB of binary files (e.g. a large `.blend` or `.png` fixture) is not skipped, and jg is called (test)
- [ ] A root whose tracked text files are over 5 MB is still skipped with `root over 5 MB eligible` (test)
- [ ] Binary files are still never sent to jg, and the secret scan behaves as before (existing tests stay green)
- [ ] Run against this repo, `node scripts/dispatch-context.mjs --ticket <a code ticket>` no longer reports `root over 5 MB eligible` (recorded in the handoff with the measured eligible bytes)

## Comments
- **orchestrator, 2026-10-02:** Found from the jg rows in usage.jsonl: all four context-step runs since 87 skipped on the size gate. Measured: 181.8 MB tracked total, 4.54 MB excluding binary extensions. Same file as 92 (M1 changes the same listing).
- **orchestrator, 2026-10-02:** batch J = organism-infra/92-dispatch-context-hardening + organism-infra/95-context-size-gate-counts-binaries (same file, same listing). One relay, one branch, one PR (user approved 2026-10-02).
- **qa, 2026-10-02:** QA pass (batch J, full verify, 431728d): 1657/1657, tests unchanged since specify, all criteria mapped. Note: jg still falls back secret-in-root on this repo (fake secrets in 6 test files); see 95-qa-verify handoff.
- **security, 2026-10-02:** Security pass (batch J). No critical/high. Low: dispatch-context.mjs:25-45 binary heuristic vs jg's own; :86-90 untracked symlink to FIFO could hang open. gitleaks clean, tests 53/53. See 95-security.md.
