# 138 security review: Security pass

Branch `feat/138-steering-spike-tooling` at `710bbcc`, diff against `7c2eee1` (two files: `apps/bridge/cells/conformance.mjs`, `apps/bridge/cells/conformance.test.mjs`). Verdict: Security pass. No critical or high findings; one medium and three low, none blocking.

```json
{
  "ticket": "organism-infra/138-steering-spike-tooling",
  "cell": "security",
  "current_step": "Reviewed the diff by hand (shell-outs, file writes and deletes, sockets, env, fixtures); gitleaks clean over origin/main..710bbcc. Security pass.",
  "artifacts": [
    "branch feat/138-steering-spike-tooling @ 710bbcc"
  ],
  "decisions": [
    "Pass. Nothing critical or high. Medium and low findings are listed in the handoff body and ticket comment.",
    "No dependency, lockfile, .github or .claude change, so no dependency or CI review applies."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Optional follow-up (not blocking): fix the S8 group-bit check (medium) and pass the env allowlist to the `claude --help` call (low) in a later ticket or the spike run",
      "owner": "developer"
    }
  ]
}
```

## What I checked

- Shelling out. Every spawn and exec uses an argv array with no shell: `spawn(..., shell: false)` (conformance.mjs Child), `execFile(bin, ["--help"])`, `execFile("ps", ["-axo", "pid=,command="])`, `execFileSync("git", ["-C", repo, ...])`. No string is interpolated into a command line. The `ps` output is parsed to a number before `process.kill`.
- Permission-broadening flags. `--s8-disable-flag` and flags scraped from `claude --help` both pass through `buildArgs`, which throws on `--dangerously-skip-permissions`, `--allow-dangerously-skip-permissions` and `--permission-mode`. A user-named forbidden flag is caught by the `attempt()` wrapper and recorded as not logged in.
- File writes and deletes. S6b builds the worktree path as `<repo>/.claude/worktrees/s6b-<8 random hex>`; nothing untrusted reaches it. The `rmSync(wt, {recursive, force})` fallback only ever targets that fresh leaf. Writes inside the worktree are fixed names. No path traversal.
- Network exposure. No listener in `conformance.mjs`; S8 is a unix-socket client only (`net.createConnection(path)`). The test fake listens on a unix socket in a temp dir, no TCP, so nothing binds a port.
- Untrusted text. Socket bytes and model output go only into evidence strings and fixture files (JSON-stringified, so control characters are escaped), never to a shell, a path, or the UI.
- Test isolation. All `runSpikes` tests use a fake binary; test kills target only pids the test itself spawned.
- Secrets. `gitleaks detect --log-opts="origin/main..710bbcc"`: 5 commits scanned, no leaks.

## Findings

1. `apps/bridge/cells/conformance.mjs:291`, medium. The S8 `open` test is `mode & 0o006` and `dirMode & 0o007`, so group bits are ignored. A socket with mode 0660 or 0770 (group-writable) prints "access for others: none (owner only)", which is wrong. This matters on macOS, where every local account shares the `staff` group. The full mode is also printed, and `open` changes only an evidence line, not the verdict, so the damage is a misleading line, not a wrong go. Suggest `mode & 0o066` for the socket and `dirMode & 0o077` for its directory (connecting needs write on the socket and search on the directory), or reword the line to "world access". qa's test at conformance.test.mjs:857 uses 0666/0777, so a tightened check would not break it.
2. `apps/bridge/cells/conformance.mjs:783`, low. `execFile(bin, ["--help"], { timeout })` passes no `env`, so `claude --help` inherits this process's full environment, bypassing the ENV_ALLOW allowlist (ADR 0016 decision 6.6) that every other child gets. The binary is the owner's own `claude` (or `DEN_CLAUDE_BIN`), so exposure is small. Suggest `env: ctx.childEnv` (pass it into `helpFlags`).
3. `apps/bridge/cells/conformance.mjs:924,980`, low. S4b `reap` and the `finally` SIGKILL every `sleep 61` not in the baseline, regardless of who started it, so an unrelated `sleep 61` begun during the run would be killed (own-user processes only). Accepted for a spike run by the owner; noted so nobody runs it beside something that sleeps 61.
4. `apps/bridge/cells/conformance.mjs` (S4b detached group, S6b worktree), low. There is no SIGINT or SIGTERM handler, so Ctrl-C mid-run can leave a detached child group or an `s6b-*` worktree under `.claude/worktrees/`. The child's stdin closes when this process dies, so it exits by itself; a leftover worktree is cleaned with `git worktree remove --force` and `git worktree prune`.

## Notes for the user

- Fixtures are scrubbed for home paths and a username of 3 or more characters only. Eyeball the fixtures before committing them (qa raised the short-username case; also check the init line for account or machine details).
- `--s8-disable-env NAME=VALUE` is echoed into the evidence (`disable candidate NAME=VALUE`, conformance.mjs:340), so do not pass a real secret value there.
- S6b adds and removes a real worktree in the repo containing the script (default `--repo`), which is the intended production shape per ADR 0016 decision 7.

## Comments

Security pass. Failed calls: none.
