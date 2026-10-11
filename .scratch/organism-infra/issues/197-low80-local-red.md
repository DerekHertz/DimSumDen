# 197: jev-hardening "Low-80" test fails locally but passes in CI

**Type:** task

**Priority:** P2

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Serves:** Relay hygiene. A main that is red locally makes every qa verify report an out-of-scope failure (142 bounced on it).

## What to build

`scripts/jev-hardening.test.mjs:230` ("Low-80: runJg is refused when checkout param is omitted and root has no .git ancestor") fails in the WSL main checkout at 5b9b0a4, with "Missing expected rejection". The same test passes in CI on that commit. Find what in the local environment makes `runJg` resolve instead of refusing, then make the test hermetic or fix `runJg`, whichever is actually wrong.

Also in scope: full-suite runs in two worktrees at once contend for the machine-wide test lock, and 141's qa saw 4 browser and smoke timeouts. Make contention fail clearly, or not at all, rather than flake.

History: the 2026-10-07 retro closed a similar `.git`-ancestor fixture issue as "nothing", and it came back here, so it needs a code fix.

## Acceptance criteria

- [ ] `node --test scripts/jev-hardening.test.mjs` passes in the WSL main checkout and in CI.
- [ ] The handoff names the environmental cause.
- [ ] Two concurrent `npm test` runs from different worktrees both finish without timeouts, or one waits with a clear message.
- [ ] No other test regresses (`npm test` green).

## Comments
- **orchestrator, 2026-10-08:** Filed on the user's yes. The user waived this red for 142.
- **orchestrator, 2026-10-09:** Cause found 2026-10-08: empty /tmp/.git, /tmp/.agents and /tmp/.codex were all created at 21:26:32.50 within 4 ms, while Codex wrote its state DB. Those three names are the Codex Linux sandbox protected paths, so a Codex run with /tmp as a writable root most likely made empty mountpoint dirs. No repo code creates them. /tmp/.git was removed on the user's yes. The fix stays: make Low-80 hermetic (do not assume tmpdir has no .git ancestor).
- **orchestrator, 2026-10-08:** `/tmp/.git` came back at 22:49:04 PDT after it had been removed. Codex's `codex-linux-sandbox`/bwrap was running in this repo at the time, so it is most likely a sandbox protected path. User: don't remove it. The fix belongs in the Low-80 test (it shouldn't depend on `/tmp` having no `.git` ancestor), not in cleaning up `/tmp`.
