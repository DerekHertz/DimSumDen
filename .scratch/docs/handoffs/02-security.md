# Handoff: docs/02-public-readiness (security + light qa verify)

Verdict: Security pass. Branch docs/02-public-readiness @ c413107, reviewed against origin/main. No critical or high findings.

```json
{
  "ticket": "docs/02-public-readiness",
  "cell": "security",
  "current_step": "review complete: security pass, qa verify light checks pass",
  "artifacts": [
    ".gitleaks.toml",
    "LICENSE",
    "NOTICE",
    "package.json",
    "package-lock.json",
    "branch docs/02-public-readiness @ c413107"
  ],
  "decisions": [
    "Allowlist scope verified by probe: a synthetic key in the two named paths is ignored; the same key in scripts/other.mjs, sub/scripts/risk-check.test.mjs, scripts/risk-check.test.mjs.bak, .scratch/other/issues/08-risk-sized-review.md and apps/x/risk-check.test.mjs is caught (exit 1). The anchored regexes cannot hide a secret elsewhere.",
    "Default rules only, full history (359 commits): 12 findings, all in the two allowlisted files (4 private-key + 4 stripe in 08-risk-sized-review.md, 4 stripe in risk-check.test.mjs). With .gitleaks.toml: no leaks, exit 0. Branch commits origin/main..c413107: no leaks.",
    "Note for future runs: gitleaks auto-loads .gitleaks.toml from the repo root, so a 'without config' run needs an explicit --config pointing at a default-only file",
    "Lockfile diff is two lines, both the name field (root and packages['']); package.json diff is the name only. No dependency version drift. npm audit: 0 vulnerabilities. No new or upgraded dependencies.",
    "LICENSE is the standard MIT text (SPDX wording), Copyright (c) 2026 Derek Hertzell. NOTICE references .claude/skills/MATTPOCOCK-LICENSE and VENDORED.md, both exist.",
    "No history rewrite: origin/main is an ancestor of c413107; one commit on the branch."
  ],
  "failures": [
    "npm test: 823 tests, 818 pass, 5 fail (smoke --url x3, smoke:ui, smoke): the known cloud browser failures, identical to the developer's count"
  ],
  "pending": [
    {"item": "Ticket item 2: git rm .scratch/_handoffs/refs/2026-09-27-creator-post.png and creator-office-floor.webp (third-party content still on main; not in this branch, and the ticket's checkboxes don't cover it)", "owner": "user"},
    {"item": "Tick the four acceptance checkboxes (all verified) and decide on the @agent-office/character-director workspace scope rename", "owner": "orchestrator"},
    {"item": "Merge proposal for user approval; merging is a pass gate", "owner": "orchestrator"}
  ]
}
```

## Acceptance checkboxes (light qa verify)

- LICENSE and NOTICE present: pass.
- gitleaks detect --log-opts=--all exits 0 with the config: pass (359 commits, no leaks; exit 1 with default rules alone, 12 findings, all in the two allowlisted files).
- npm test unchanged apart from known cloud browser failures: pass (818/823, same 5 failures).
- No history rewrite: pass.

## Findings

- .gitleaks.toml:8 low: the allowlist exempts the two whole files, so a real secret later pasted into either file would go unseen. The risk is small (a test file and a closed ticket); a content-level regex allowlist would be tighter. Not blocking.
- .gitleaks.toml:7 low: singular `[allowlist]` is deprecated in gitleaks 8.25+ in favour of `[[allowlists]]`, but the developer's reason is sound (8.24.2 ignores the new form) and newer versions still read it. Revisit when gitleaks is upgraded.
