# Security review: organism-infra/87 dispatch-context script

Branch feat/dispatch-context87 at e7dfb64, diff against origin/main (4 files, no dependency or lockfile change). Verdict: **Security pass**.

```json
{
  "ticket": "organism-infra/87-dispatch-context-script",
  "cell": "security",
  "current_step": "Review done: Security pass. No critical or high findings; two medium and three low noted for follow-up, none blocking.",
  "artifacts": [
    "scripts/dispatch-context.mjs",
    "scripts/jg.mjs",
    ".scratch/organism-infra/handoffs/87-security.md"
  ],
  "decisions": [
    "Pass: ticket ref, path, shell, and CLI-flag attack paths are closed; both secret fallbacks block as designed.",
    "Untracked-but-not-ignored files are outside the secret-in-root scan (medium, non-blocking)."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Optional follow-up ticket: scan untracked non-ignored files (git ls-files -z --cached --others --exclude-standard) and swap checkTrustedFlags denylist for an allowlist",
      "owner": "orchestrator"
    }
  ]
}
```

## Checks run
- gitleaks detect origin/main..e7dfb64: 2 commits, no leaks.
- node --test scripts/dispatch-context.test.mjs scripts/jg.test.mjs: 44 pass, 0 fail.
- No package.json or lockfile change, so no dependency gate. Both child processes use spawn/execFile argv arrays; no shell anywhere.
- Probes: `--ticket ../../etc/passwd` and `organism-infra/..%2f87` exit 2 (bad ticket ref). `node scripts/jg.mjs "q" . --max-source-bytes 10` exits 2 (caller flags refused).
- /security-review not run; reviewed by hand.

## Focus items
1. **Injection via ticket ref or paths**: closed. `parseArgs` (dispatch-context.mjs:156) allows only `[\w.-]+/[\w.-]+` (ASCII), and no segment may start with `.`, so `..`, `%2f`, absolute paths and extra slashes are rejected before any path join. The ref reaches only `path.join(boardRoot, ".scratch", ...)`. `git` and `jg` are spawned with argv arrays (spawnRun:127), never a shell. The query is one argv element and begins with the fixed QUESTION, so it cannot read as a flag.
2. **secret-in-root blocks**: yes. Every tracked non-board file is read and run through `hasSecret` (dispatch-context.mjs:74-82), before jg is spawned. A hit returns before `run("jg")`. A tracked symlink to a secret is read through and also blocks. Unreadable files are skipped, which is safe (nothing readable to send). Caveat in M1.
3. **secret-in-output blocks**: yes. `hasSecret(out.stdout)` (line 107) returns with `file` undefined, so no file is written. The row carries only counts and the reason, never the text.
4. **Context-file path traversal**: closed. outFile is `<boardRoot>/.scratch/_context/<feature>/<slug>.md` from the validated ref only. `--root` affects only what is searched, never where output is written.
5. **runJg `flags` unreachable from the CLI**: yes. `main` in jg.mjs destructures `[query, root, ...extraArgs]` and passes only `extraArgs` to `checkFlags`, which rejects any extra arg. `flags` is never populated from argv. The only caller is dispatch-context.mjs with a constant `--max-source-bytes <const>`. `checkTrustedFlags` also rejects the four forbidden flags and `--exclude`, and flags land after the fixed excludes.

## Findings
- scripts/dispatch-context.mjs:67 **medium**: the root scan uses `git ls-files` (tracked only), so an untracked, non-ignored file holding a secret is not scanned, yet jg searches it. ADR 0014 decision 5 says "outside gitignored paths", which untracked files are not. Test 22 covers only the gitignored case. Most exposed in a developer worktree. The secret-in-output check is a partial backstop. Fix: add `--others --exclude-standard`.
- scripts/dispatch-context.mjs:25-27,98 **medium**: the ticket's "What to build" text (up to 1,500 chars) is sent to the jg provider as the query. It is board content, only pattern-scanned by `checkQuery`. This is as the ADR says ("the question text"), so it is a note for the user's go/no-go, not a defect.
- scripts/jg.mjs:36-41 **low**: `checkTrustedFlags` is a denylist (the four forbidden flags plus `--exclude`). A future caller could pass another filter-widening flag. Prefer an allowlist of `--max-source-bytes`.
- scripts/dispatch-context.mjs:185 **low**: `writeFileSync` is non-atomic and has no lock, so a concurrent `dispatch-context` for the same ticket could read a half-written cache file on the `existsSync` fast path (line 176). Write to a temp file and rename.
- scripts/dispatch-context.mjs:67 **low**: `--root` is a local operator argument, and `git ls-files` runs in that directory before `runJg`'s root checks. A hostile repo's `.git/config` could run commands there. Not reachable from ticket text.
- scripts/dispatch-context.mjs:176 **low**: the context file holds repo source excerpts that cells read into their prompts. Cells should treat them as data, per jg's own note.
