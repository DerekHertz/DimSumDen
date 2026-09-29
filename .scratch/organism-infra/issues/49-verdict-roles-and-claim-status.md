# 49: Verdict roles, specify claim keeps in-review, usage-row hardening

**Type:** bug

**What to build:** From 48's security review and a repeat incident on 41 and 48.
- **Verdict roles (MEDIUM):** `board comment --verdict` is accepted only from a `qa`, `security` or `orchestrator` author. A developer or other cell is refused and nothing is written.
- **Specify claim on in-review:** a qa `specify` claim on an `in-review` ticket keeps it `in-review`, as a verify claim does (ADR 0008 decision 10). `--keep-status` then leaves it `in-review`. Today it resets to `claimed`, and only a qa verify release can restore it.
- **Resolved-row loss (LOW):** if the `resolved` row append fails after the release commits, report it on stderr with a non-zero exit, and give a way to write the row again, e.g. `log-cell`-style `scripts/log-resolved.mjs`, or `board release --status resolved` on an already-resolved ticket rewriting only the row.
- **Append hardening (LOW):** `usage.jsonl` appends from `board` and `log-cell.mjs` run the same symlink containment check as other board writes, and cap `--outcome`/`--mode` length.
- **`--pr` (LOW):** refuse `--pr` on a release that isn't `resolved`, instead of ignoring it.

Build any secret-shaped fixtures at runtime (CI gitleaks).

**Blocked by:** None (can start immediately).

**Status:** resolved

- [ ] `--verdict` from a developer is refused, and from qa, security or orchestrator it is accepted (tests)
- [ ] A specify claim then `--keep-status` on an in-review ticket leaves it in-review (test)
- [ ] A failed resolved-row append is reported and can be redone (test)
- [ ] A symlinked usage path is refused; overlong outcome is refused; `--pr` on a non-resolved release is refused (tests)
- [ ] ADR 0008 updated

## Comments

- **Created (orchestrator, 2026-09-29):** From 48's security review and the specify-claim incidents on 41 and 48, published with the user's yes.
- **qa, 2026-09-29:** QA pass: 362/362, 21 specify tests unchanged since 5c7b27c, all 5 criteria mapped. Note: no-lock --as is self-asserted; lock-held --as mismatch is refused.
- **security, 2026-09-29:** Security pass at 86fd86e. No critical/high. Low: no-lock --as verdict self-asserted (recommend follow-up requiring claim lock; telemetry-only impact); log-cell follows a symlinked .scratch dir (log-resolved refuses); log-resolved dup check unlocked. gitleaks clean, no deps. See handoffs/49-security.md.
- **orchestrator, 2026-09-29:** PR #38 merged
