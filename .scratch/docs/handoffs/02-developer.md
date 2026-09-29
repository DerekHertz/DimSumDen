# Handoff: docs/02-public-readiness (developer)

Items 1, 3, 4 done on branch `docs/02-public-readiness` (commit c413107, pushed). Item 2 skipped: the user handles it.

```json
{
  "ticket": "docs/02-public-readiness",
  "cell": "developer",
  "current_step": "in-review: items 1, 3, 4 committed and pushed",
  "artifacts": [
    "LICENSE",
    "NOTICE",
    ".gitleaks.toml",
    "package.json",
    "package-lock.json",
    "branch docs/02-public-readiness @ c413107"
  ],
  "decisions": [
    "gitleaks 8.24.2 ignores [[allowlists]] (added in 8.25), so .gitleaks.toml uses the singular [allowlist] with two path regexes, extending the default rules",
    "Only the root package was renamed; workspace package @agent-office/character-director left alone (out of scope, flagged for orchestrator)",
    "Lockfile regenerated with npm install --package-lock-only"
  ],
  "failures": [
    "npm test: 823 tests, 818 pass, 5 fail (smoke --url x3, smoke:ui, smoke), the known cloud browser failures",
    "First .gitleaks.toml used [[allowlists]] and still reported 12 leaks; fixed with [allowlist]"
  ],
  "pending": [
    {"item": "Item 2: remove .scratch/_handoffs/refs/2026-09-27-creator-post.png and creator-office-floor.webp (git rm was denied by the classifier)", "owner": "user"},
    {"item": "Consider renaming @agent-office/character-director scope", "owner": "orchestrator"}
  ]
}
```

gitleaks detect --log-opts=--all --config .gitleaks.toml: 351 commits scanned, no leaks, exit 0. No history rewrite.
