# Handoff: queue/04-queue-admin-user-entry-point (security)

```json
{
  "ticket": "queue/04-queue-admin-user-entry-point",
  "cell": "security",
  "current_step": "Full security review done at 8864f42: Security pass. No critical or high finding; 1 medium and 3 low go in Comments. gitleaks clean over origin/main..8864f42 (3 commits). No dependency change. Relevant tests (queue-admin, queue, frontier-queue, admission-gate) 103 pass, 0 fail.",
  "artifacts": [
    "branch tests/queue-04-queue-admin-user-entry-point @ 8864f42",
    "scripts/queue-admin.mjs",
    "apps/organism-infra/frontier-queue.mjs"
  ],
  "decisions": [
    "Pass: the by:user convention plus deny rules is the model ADR 0015 Amendment 3 B accepts (no identity check, ADR 0008 decision 7), and the code matches it",
    "The medium finding is about ticket 07, not this branch: until the deny patch is applied, an agent can run queue-admin with piped y or append a by:user row by hand"
  ],
  "failures": [],
  "pending": [
    { "item": "Ticket 07: apply the deny patch from 04-developer.md and consider the hardening in finding 1 (more deny variants, Edit/Write deny on .scratch/usage.jsonl); then test in the main session that '!npm run queue-admin -- active <feature>' runs under the rules", "owner": "orchestrator" },
    { "item": "Optional low fixes (printable() on root, reason length cap) can ride with any later queue ticket", "owner": "developer" }
  ]
}
```

## Scope reviewed

Diff `origin/main..8864f42` code files: `scripts/queue-admin.mjs` (new), `apps/organism-infra/frontier-queue.mjs`, `package.json` (one script line), tests. No `.github/`, no new dependency (npm ci: 0 vulnerabilities, lockfile untouched).

## What I checked and found sound

- **Shell-out:** `queue-admin.mjs` spawns nothing besides board-service `resolveRoot` (`execFileSync("git", [...])`, argv array, no shell). Tests spawn via `spawnSync(process.execPath, [SCRIPT, ...args])`, no shell, temp dirs under `tmpdir()`.
- **Confirmation:** one stdin line, trimmed, exactly `y`; EOF, empty or any other answer exits 1 with nothing written. Unknown flags (`--yes`, `-y`, `--force`) exit 2. No bypass flag.
- **Path traversal:** `ref` must match `^([a-z0-9-]+)/(\d{2,}-[a-z0-9-]+)$` and be a plain file via `lstat`; `feature` is `^[a-z0-9-]+$`. Nothing user-supplied reaches a path except `--root`, which is the user's own.
- **Append:** goes through `appendUsageLine` (`O_APPEND|O_NOFOLLOW`), one write per row, rows JSON-encoded (reason with quotes, newlines or unicode cannot break the line).
- **Reader (ruling 2):** `loadSnapshot` skips `queue_active` and `queue-admit` rows without `by === "user"`; only `frontier-queue` and tests read those kinds.
- **Terminal output:** feature, ref and reason pass through `printable()` (control characters become `?`).
- **Network:** nothing here touches a daemon or socket.

## Findings

1. **medium, `scripts/queue-admin.mjs:136-152` / `.claude/settings.json` (unapplied):** `by:"user"` is a plain string and the stdin `y` is not an identity check. Until ticket 07 applies the deny patch, an agent's `echo y | npm run queue-admin -- active x`, or a hand-appended `{"by":"user"}` row, takes effect. ADR 0015 Amendment 3 B accepts this (convention plus permission rule), so no bounce. For ticket 07: the patch's two prefix rules do not match `npm run --silent queue-admin`, `npm run-script queue-admin`, `npm exec`, `node ./scripts/queue-admin.mjs`, an absolute path, `cd scripts && node queue-admin.mjs`, or `node -e` importing the module. Add variants where the matcher allows, and a deny on Edit/Write of `.scratch/usage.jsonl` (the board writes it as a process, not a tool call). The Queue prints the active row's `ts`, which keeps a forged row visible in `git diff`.
2. **low, `scripts/queue-admin.mjs:119,131`:** `root` prints raw in the prompt. It comes from `--root` or `$ORGANISM_ROOT` (user-controlled), so low; wrap in `printable()`.
3. **low, `scripts/queue-admin.mjs:131-132`:** `--reason` has no length cap. `board-service` has `checkArgLength`/`MAX_ARG_LEN`; reuse it so a runaway reason cannot bloat `usage.jsonl`.
4. **low, `scripts/queue-admin.mjs:99-102`:** `endsCleanly` then append is a check-then-write race with another appender. The worst case is one extra or missing newline, and the reader skips blank and junk lines.

## Deny-rule test (acceptance criterion 5)

Not tested by me either: the rules are not applied, and I run as a worktree subagent. It stays with ticket 07.
