# ci-cd/02 developer fix round 1 (security bounce 1 of 2)

**Branch:** claude/ci-cd-02-headless-ui-smoke, commit 8797ce6 (on top of f13b165)
**Worktree:** D:\claude_sessions\agent_office\.claude\worktrees\agent-a9534b00c16e40e26

## What changed

Security found `apps/ci-cd/dev-server.mjs:88` (`main()`) calling `server.listen(port, ...)`
with no host, binding all interfaces (0.0.0.0 / ::) instead of localhost -- the
whole repo tree served to the LAN with no auth.

1. Added `apps/ci-cd/dev-server-bind.test.mjs`: starts the server via `npm run dev`,
   confirms it answers on 127.0.0.1, then attempts a raw TCP connect to the
   machine's LAN IPv4 address (via `os.networkInterfaces()`) on the same port and
   asserts it is refused. Reuses `dev-server.test.mjs`'s win32 `taskkill /pid <pid>
   /t /f` cleanup pattern so the spawned npm/node process tree doesn't orphan.
   (First tried a simpler "can a second server rebind the port on 0.0.0.0"
   probe; it passed even against the unfixed server on this Windows box, so it
   doesn't discriminate here -- switched to a direct reachability check, which
   went red as expected before the fix.)
2. Ran the new test red against the unfixed server (confirmed real failure:
   "accepted a connection on LAN address ...").
3. Fixed `dev-server.mjs:88` to `server.listen(port, "127.0.0.1", ...)`. New test
   goes green.
4. `npm test`: exit 0, 47/47 pass. Note: this worktree had no `node_modules`
   (fresh checkout of the branch); ran `npm install` first, which used the
   already-committed `package-lock.json` (playwright 1.63.0 pinned by the earlier
   commit) -- no new dependency added, no lockfile change.
5. Confirmed via `tasklist //FI "IMAGENAME eq node.exe"` after the run: no
   `node.exe` process remained. (`Get-CimInstance` via powershell was blocked by
   this session's sandbox as "too complex to verify" for a worktree-isolated
   agent; `tasklist` was the fallback and gave a clean answer.)

## Result

- Commit: `8797ce6` -- "ci-cd/02 security fix round 1: bind dev server to 127.0.0.1 only"
- `npm test`: exit 0, 47/47 pass
- No orphaned processes

## Next

Ticket lock is held by the orchestrator (not touched here). Next step per the
ticket: security re-confirms the bind, then merge proposal.
