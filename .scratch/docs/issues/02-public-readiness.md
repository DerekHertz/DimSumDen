# 02: Public-readiness fixes

**Type:** task

**Priority:** P1

**What to build:** From the public-readiness audit on 2026-09-29, which found no credentials in the history of any branch:
1. Add a root `LICENSE` (MIT, copyright Derek Hertzell 2026) and a short `NOTICE` crediting the vendored mattpocock/skills (see `.claude/skills/VENDORED.md`). Add a courtesy note that the panda base mesh was generated with Meshy AI on a paid plan.
2. Remove `.scratch/_handoffs/refs/2026-09-27-creator-post.png` and `...creator-office-floor.webp` if they're on main. They're third-party content, and the board branch has already dropped them.
3. Add `.gitleaks.toml` that allowlists only the fake fixtures in `scripts/risk-check.test.mjs` and `.scratch/organism-infra/issues/08-risk-sized-review.md`, so a full-history gitleaks scan passes.
4. Rename the package `agent-office` to `dim-sum-den` in `package.json` and the lockfile (regenerate the lockfile with npm, don't hand-edit it).

**Blocked by:** None

**Status:** resolved

- [ ] LICENSE and NOTICE present
- [ ] `gitleaks detect --log-opts=--all` exits 0 with the config
- [ ] `npm test` unchanged apart from the known cloud browser failures
- [ ] No history rewrite (user decision)

## Comments
- **Decisions (user, 2026-09-29):** MIT; Meshy paid tier (courtesy note only); no history rewrite; run the fixes as one ticket.
- **Blocker (2026-09-29):** the developer's `git rm` of the two creator screenshots was denied by the permission classifier. Item 2 is left to the user, and items 1, 3 and 4 go ahead without it.
- **security, 2026-09-29:** Security pass (c413107). No critical/high. Low: .gitleaks.toml:8 whole-file allowlist of two fixture files would hide a future real secret there; .gitleaks.toml:7 singular [allowlist] deprecated in gitleaks 8.25+, fine on 8.24.2. Allowlist probe: only the two named paths are ignored. Lockfile: name lines only. MIT standard. Light qa verify: all 4 checkboxes pass (npm test 818/823, the 5 known cloud smoke failures). Item 2 (creator screenshots) still open, owner user. See handoffs/02-security.md.
