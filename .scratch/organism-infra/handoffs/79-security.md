```json
{
  "ticket": "organism-infra/79-route-advisory-live",
  "cell": "security",
  "mode": "review",
  "current_step": "Security pass — 3 Low findings, no blockers.",
  "artifacts": [
    "scripts/jev.mjs",
    "scripts/jev-report.mjs",
    "scripts/jev-advisory.test.mjs",
    "scripts/jev-advisory-report.test.mjs",
    "scripts/jev-advisory-cli.test.mjs",
    "docs/adr/0015-jev-routing-priority-scope-and-wake-gate.md",
    ".claude/agents/orchestrator.md"
  ],
  "decisions": [],
  "failures": [],
  "pending": [
    { "item": "orchestrator merges feat/79-route-advisory-live to main", "owner": "orchestrator" }
  ]
}
```

# 79 Security review — pass

**Verdict: Security pass**

Branch: `feat/79-route-advisory-live` at `d233885`

---

## Checks run

| Check | Result |
|---|---|
| gitleaks secret scan (6 commits) | No leaks found |
| npm audit | 0 vulnerabilities |
| CI/CD workflow changes | None (`.github/workflows/ci.yml` diff empty) |
| New / upgraded dependencies | None |
| Path traversal (board reads) | Guarded — see findings |
| Shell injection | Not present — see findings |
| Localhost binding | No new network exposure |
| sk-style strings in diff | Fake placeholders — see findings |

---

## Findings

### Low — `scripts/jev-advisory.test.mjs:29`, `scripts/jev-advisory-cli.test.mjs:15` — sk-test placeholder strings

Two test-file constants hold `sk-test-KEYVALUE-advisory-79-123` and `sk-test-KEYVALUE-advisory-79-456`. The naming pattern (`sk-test-KEYVALUE-<ticket>-<suffix>`) matches the established placeholder convention documented as Low in ticket 72's security review. gitleaks scanned all 6 commits and found no leaks. These are not real credentials.

### Low — `scripts/jev-advisory.test.mjs:59`, `scripts/jev-advisory-report.test.mjs:196`, `scripts/jev-advisory-cli.test.mjs:27` — spawnSync in test files

All three call `spawnSync(process.execPath, [SCRIPT, ...argv], { cwd: root, env, encoding: "utf8", timeout: 20000 })`. No `shell: true`. `process.execPath` is the current Node interpreter. `SCRIPT` is a hardcoded `fileURLToPath(new URL("./jev.mjs", ...))`. Args are test-controlled arrays — no user input reaches the command vector. Standard CLI testing pattern, no injection vector.

### Low — `scripts/jev.mjs` `frontierTickets()` board reads

The new `order` CLI reads `.scratch/<feature>/issues/*.md`. Input validated by `validRef = (r) => /^[\w.-]+\/[\w.-]+$/.test(r) && !r.includes("..")`, which blocks `..` traversal. `feature` is the left half of a validated ref, so `path.join(root, ".scratch", feature, "issues")` cannot escape `.scratch`. File list comes from `readdirSync` — no user-supplied filenames in subsequent `readFileSync` calls. `readOr` catches all errors and returns empty string. No new traversal vector beyond what prior reviews covered.

---

## Notes (no action required)

- `advisory-outcome` and `priority-verdict` write JSON rows to `usage.jsonl` from CLI args. All fields are whitelist-validated (`LABEL = /^[\w-]+$/`, enum checks, `validRef`). JSON serialization of validated scalars carries no injection risk.
- No changes to `.github/workflows/ci.yml`.
- No new or changed npm dependencies; lockfile unchanged.
- Orchestrator genome change (`orchestrator.md`) is behavioral text only; no code or config risk.
- ADR 0015 amendment is documentation only.

---

## Worktree receipt

Path: `/home/dhertzell/dsd-79-sec` — clean (detached HEAD, no uncommitted changes).

## Environment issues

None.
