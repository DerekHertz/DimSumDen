```json
{"ticket": "organism-infra/25-shell-and-git-guidance", "current_step": "security review complete, BOM-check criterion only",
 "artifacts": ["scripts/bom-check.mjs", "scripts/bom-check.test.mjs", "package.json"],
 "decisions": [
   "Security pass on the BOM-check acceptance criterion",
   "no shell invocation anywhere: execFileSync used with array args (git ls-files) and standalone node invocation in tests, no shell:true, no string concatenation into a shell command",
   "file paths come from CLI args (trusted local/CI invoker) or git ls-files output (repo-tracked paths); readFileSync on those paths is not a privilege-boundary crossing since the caller already has shell/CI access -- not a path-traversal vector in the security sense",
   "no new dependency: package.json diff only adds two npm scripts (check:bom, pretest), no dependencies/devDependencies change, no lockfile touched",
   "pretest hook cannot be silently bypassed under normal CI invocation: CI's ci.yml runs plain `npm test`, and npm's pretest lifecycle hook fires automatically for any script named test unless --ignore-scripts is passed, which CI does not pass",
   "no secrets found: grepped full `git diff main 3806c14` for key/token/secret/password/AKIA/PRIVATE KEY patterns, no hits; gitleaks not installed in this environment"
 ],
 "failures": [],
 "pending": []}
```

# 25-security

**Cell:** security | **Ticket:** organism-infra/25-shell-and-git-guidance

**Scope:** security review of qa-passed commit `3806c14` on `origin/claude/organism-infra-25-tests` (BOM-check acceptance criterion only, per prior developer/qa handoffs).

## Verdict

**Security pass.**

## What was checked

Diff reviewed: `git diff main 3806c14` — 3 files, +187/-0 (`package.json`, `scripts/bom-check.mjs`, `scripts/bom-check.test.mjs`). No `.github/workflows/` changes.

1. **Shell vs execFile**: `scripts/bom-check.mjs` uses `execFileSync("git", ["ls-files", "*.md", "*.json"], ...)` — array args, no `shell: true`, no string interpolation into a shell command. The glob patterns are git's own pathspec syntax passed as literal argv entries to git, not shell-expanded. `scripts/bom-check.test.mjs` likewise uses `execFileSync` with array args throughout (`node`, `git init`, `git config`, `git add`, `git commit`). No injection surface.

2. **File-path handling**: `hasBom(filePath)` calls `readFileSync(filePath)` directly on paths sourced either from `process.argv` (explicit CLI args, i.e. a trusted local/CI invoker) or from `git ls-files` output (repo-tracked paths only, relative to repo root). No network- or agent-sourced text reaches this path. A caller could in principle pass `../../etc/hosts` as an arg, but that's true of any local CLI tool (`cat`, etc.) and requires the invoker already have shell access — not a privilege-boundary crossing. Extension filter (`/\.(md|json)$/i`) is applied before the read.

3. **pretest hook bypass/CI-break risk**: `package.json` adds `"pretest": "npm run check:bom"`. CI's `.github/workflows/ci.yml` (unchanged) runs `npm test` directly. npm's lifecycle runs `pretest` automatically before `test` for any script literally named `test`, and CI does not pass `--ignore-scripts`, so the check cannot be silently skipped under the current CI invocation. A developer could bypass locally with `node --test ...` directly or `npm test --ignore-scripts`, but that's a local dev choice, not a CI gate weakness. No workflow file was touched, so no CI-owned surface (permissions, pinned actions, pull_request_target) changed — outside this ticket's diff, not reviewed further.

4. **New dependencies**: none. `package.json`'s `dependencies`/`devDependencies` blocks are unchanged; only `scripts` gained two entries. No lockfile diff.

5. **Secrets**: `git diff main 3806c14` grepped for `api[_-]?key|secret|token|password|BEGIN (RSA|PRIVATE)|AKIA[0-9A-Z]{16}` (case-insensitive) — no matches. `gitleaks` is not installed in this worktree/environment (noted under Environment issues). Manually inspected the full diff (small, 187 lines) line by line — no credential-shaped strings anywhere, including in the test fixtures (`{"a":1}`, `# Title`, `test@example.com` is a standard git-config test placeholder, not a live credential).

## Files referenced

- `scripts/bom-check.mjs` (new, developer's implementation)
- `scripts/bom-check.test.mjs` (new, qa's specify commit, unmodified by developer per qa's byte-diff check)
- `package.json` (`check:bom` + `pretest` additions)

## Worktree

`C:\claude_sessions\agent_office\.claude\worktrees\agent-a0ed43e3a0d1b46cc` — detached HEAD at `3806c14`, clean (`git status --porcelain=v1` empty).

## Environment issues

- `gitleaks` not found on PATH in this environment. Worked around with a manual pattern grep over the full diff (see above); recommend installing gitleaks for future secret-scan passes since pattern grep alone is weaker (misses entropy-based detection, e.g. bare high-entropy strings without a recognizable prefix).

## Failed calls

None. `git fetch`, `git checkout --detach 3806c14`, `git diff main 3806c14` (stat and per-file), `git diff main 3806c14 --name-only`, the workflow grep, `git status --porcelain=v1` (both checks), and `npm run board -- comment ...` (short text) all succeeded on first try from inside the worktree.

## Open questions

None new. Carried over from developer/qa (unresolved by this ticket's scope, orchestrator's call): whether a `.git/hooks/pre-commit` should also call `bom-check.mjs` (currently CI-only by design), and items 1-6 (protocol prose) / item 7 (npm ci on worktree creation) remain open on the ticket.
