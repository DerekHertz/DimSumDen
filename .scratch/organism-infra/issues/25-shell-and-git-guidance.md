# 25: Shell and git guidance so cells stop tripping on the same friction

**Type:** task

**What to build:** A short "Shell and git" section in organism-protocol, plus mechanical checks where cheap. It comes from the 2026-09-28 incident analysis (`.scratch/usage.jsonl`): 5 shell incidents and 3 git slips, all fixable friction.

1. Don't write prose with shell heredocs, because quotes and backticks break parsing. Use the Write tool, or node `fs.writeFileSync`.
2. PowerShell 5.1: never use `Set-Content -Encoding utf8`, which writes a BOM. Pass `[string[]]` to `AppendAllLines`. Prefer node for file writes.
3. `rm` may prompt for y/n in the sandbox, so use `rm -f`, or better, `fs.rmSync`.
4. Read ticket status with `board status <ref>`, never grep the markdown.
5. Never run `git commit -a` in the main checkout; stage explicit paths. Bound every `git push` with a timeout.
6. Worktree cells use plain single commands. No `cd <main> && git …` or git in pipes, because the isolation guard rejects them (a real guardrail).
7. Consider running `npm ci` automatically when a worktree is created, so cells don't hit missing node_modules. It may belong with 16.

**Blocked by:** None. The protocol edits are in `.claude/`, so the orchestrator makes them with the user's permission.

**Status:** resolved

- [ ] organism-protocol has a Shell and git section covering items 1–6
- [ ] A pre-commit or CI check rejects a BOM in `.md` and `.json` files (test)
- [ ] Decision recorded on item 7 (here or in 16)

## Comments

- **Created (orchestrator, 2026-09-28):** At the user's request, from the scout's incident analysis. Genuine guardrails to keep: worktree isolation for git and shared writes, and the auto-mode classifier on auto-merge and PR monitor switches (the user toggles those in the app).
- **qa, 2026-09-28:** QA specify (only the BOM-check criterion): branch claude/organism-infra-25-tests, tests at scripts/bom-check.test.mjs (6 node --test cases against scripts/bom-check.mjs, not yet implemented). All 6 fail now on MODULE_NOT_FOUND for the missing script. Seam: scripts/*.mjs + *.test.mjs picked up by npm test / CI, same pattern as scripts/risk-check.mjs. Handoff: .scratch/organism-infra/handoffs/25-qa-specify.md
- **qa, 2026-09-28:** qa specify done for BOM-check criterion; tests on claude/organism-infra-25-tests ready for developer
- **qa, 2026-09-28:** QA pass on BOM-check criterion, see handoff for details
- **unknown, 2026-09-28:** Security pass on BOM-check criterion (3806c14). No shell exec, no new deps, no secrets found. See 25-security handoff.
