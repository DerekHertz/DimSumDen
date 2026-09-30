```json
{"ticket": "organism-infra/80-jg-guard-and-scout-opt-in", "cell": "security",
 "current_step": "Security pass — no critical or high findings; two residual Low noted.",
 "artifacts": ["scripts/jg.mjs", "scripts/hooks/bash-guard.mjs", "scripts/jg.test.mjs", "scripts/hooks/bash-guard.jg.test.mjs", "scripts/jg-wrapper.test.mjs"],
 "decisions": [
   "gitleaks scan on 05c1240..43881f1: no leaks found",
   "npm audit: 0 vulnerabilities (no new dependencies added)",
   "spawn uses array argv without shell:true — no shell/argument injection",
   "usage row logs queryLen only, never query text — no data leak",
   "67's jg control is fully implemented: excludes, flag refusal, dot-root refusal, secret check"
 ],
 "failures": [],
 "pending": [{"item": "user applies scout genome line from 80-developer.md", "owner": "user"}, {"item": "orchestrator opens PR", "owner": "orchestrator"}]}
```

## State
Done. Security pass. Two Low findings noted below; neither blocks.

## Gitleaks

```
gitleaks detect --log-opts="05c1240..43881f1" --no-banner
10:28AM INF 2 commits scanned.
10:28AM INF no leaks found
```

## npm audit

0 vulnerabilities, no new dependencies added in this branch.

## Finding 1: Checkout-boundary check skipped when `checkout` param is omitted (Low)

**scripts/jg.mjs:57–61.** `checkRoot` skips the out-of-checkout boundary check when both (a) the `checkout` param is omitted and (b) `checkoutOf(abs)` returns null (i.e., the root has no `.git` ancestor). In that case `top = null`, the `if (top && ...)` guard is false, and a root outside the checkout is accepted. The hidden-segment check still runs, so `.scratch/`, `.claude/`, etc. are caught. The CLI (`main()`) always passes `checkout: gitTop()`, so all normal scout usage is safe. The library call without `checkout` on a temp dir (as used in specify tests) is the gap. No realistic exploit path today; Low.

**Recommendation (non-blocking):** Add a final fallback in `checkRoot`: if `top` is still null after `checkoutOf`, throw `Refused("root", "refused root: could not determine checkout boundary")`. This makes untethered library calls fail-safe without breaking the CLI or worktree paths.

## Finding 2: Bash-guard bypassable by shell indirection (Low, documented)

**scripts/hooks/bash-guard.mjs:3–4, 9.** The jg guard is a string check. Shell indirection bypasses it: `eval "jg q ."`, `cmd=jg; $cmd q .`, a script file that wraps jg, or `\jg` (backslash bypasses the look-around character class). The code comment already names this as residual Low. The guard is also inert until ticket 52 registers it as a PreToolUse hook. No action needed; Low residual, by design.

## 67-security.md control verification

| Control (67-security Q2) | Implementation | Verdict |
|---|---|---|
| Always excludes `.scratch/` | `EXCLUDES = [".scratch/", ".claude/"]` → `["--exclude", ".scratch/", "--exclude", ".claude/"]` always prepended to argv | ✅ |
| Always excludes `.claude/` | Same | ✅ |
| Refuses `--hidden`, `--no-ignore`, `--include-sensitive`, `--include-dependencies` | `checkFlags`: FORBIDDEN_FLAGS list + any caller flag rejected | ✅ |
| Refuses hidden roots | `checkRoot`: `rel.split(sep).find(s => s.startsWith("."))` below checkout | ✅ |
| Secret-checks query before run() | `checkQuery`: `hasSecret(query)` from `exposure.mjs` called at line 38, before `run` at line 111 | ✅ |
| Fallback not an error (scout keeps working) | Non-zero exit, throw, no-files: returns `{ row }`, no stdout, exit 0 | ✅ |
| jg version floor ≥ 0.6.0 | `versionOk` at line 66–71; < 0.6.0 → fallback `jg-version` | ✅ |

## Spawn injection analysis

`spawn("jg", argv, { stdio: ["ignore", "pipe", "inherit"] })` — no `shell: true`. `argv` is an array literal; query is last-checked against startsWith("-"); absRoot is `realpathSync(root)` (always starts with `/`). No injection surface.

## Usage row privacy analysis

Row shape: `{ kind:"jg", ts, queryLen, filesReturned, fallback, ms }` + optional `reason` or `refused`. `queryLen` is `String(query).length` — the count of characters, not the text. Query text never reaches usage.jsonl. ✅

## Scout genome line (80-developer.md) assessment

Proposed line for `.claude/agents/scout.md`:
> `node scripts/jg.mjs "<question>" [root]`, where root is your checkout or a non-hidden subdirectory of it, with no flags. If it prints `jg: no result`, exits non-zero, or returns nothing useful, fall back to `rg` and say so in one line. Never run `jg` directly.

Assessment: well-scoped. Names the wrapper explicitly. Forbids flags (matching the wrapper's zero-caller-flags policy). Instructs fallback to rg. The `"<question>"` quoting hint is correct for the Bash tool invocation; if the question contains double quotes, scout should use single quotes or escape them — a general shell usage concern, not a vulnerability. The bash-guard will block any attempt to call raw `jg` directly. ✅ Approved for user to apply.

## Comments

Security pass. No critical or high findings. Two Lows:
- `scripts/jg.mjs:57–61` (Low): checkout boundary skipped when `checkout` param omitted and no `.git` ancestor; CLI always sets it; non-blocking.
- `scripts/hooks/bash-guard.mjs:9` (Low): string-check guard bypassable by shell indirection; documented in code; inert until ticket 52; non-blocking.

gitleaks clean, npm audit clean, spawn safe, no query text in usage rows, all 67 controls verified present.

Scout genome line approved for user to apply to `.claude/agents/scout.md`.

## Next step

Orchestrator: open the PR. User: apply the scout genome line from 80-developer.md.

## Failed calls

- None.

## Worktree receipt

- Path: `/home/dhertzell/dsd-80-verify`
- Clean: yes (read-only review; no files modified in this session)
