# 87: dispatch-context script (jevgrep context at dispatch)

**Type:** feature

**Priority:** P1

**What to build:** Build `scripts/dispatch-context.mjs` per ADR 0014 decisions 3 and 7 (docs/adr/0014-jevgrep-context-supply-at-dispatch.md): run `jg` once per ticket on its What-to-build text through the `scripts/jg.mjs` wrapper, write a context file, and print only its path for the dispatch prompt. The `.claude` edits (orchestrator relay step, scout pull line if 80's line doesn't already cover it, `jg` usage kind) go in the developer handoff as a diff for the user to apply. Before dispatch, the user runs `jg auth` and `jg doctor` in this environment.

**Blocked by:** none

**Status:** resolved

- [ ] Script behaviour matches ADR 0014 decisions 3 and 7 (tests)
- [ ] A jg failure exits cleanly with no context file, so dispatch proceeds without it (test)
- [ ] `.claude` diff in the developer handoff

## Comments

- **Created (orchestrator, 2026-09-30):** User approved 57's build and trial. After this merges, 57 runs phase 1 replay (10+ resolved tickets) and phase 2 live trial (3+), then goes back to the user for go/no-go.
- **developer, 2026-10-01:** ADR 0014 line 28 deviation (developer): installed jg has no files command, so the 5 MB eligible check sums byte sizes of git ls-files (excluding .scratch/ and .claude/) through an injected trackedBytes seam; skip at 5242881, proceed at 5242880. ADR text left unchanged; the user decides whether to amend it.
- **qa, 2026-10-01:** All tests pass (1425 pass, 0 fail, 0 skipped). All acceptance criteria have passing tests. No tests removed or loosened.
- **security, 2026-10-01:** Security pass. No critical/high. Medium: dispatch-context.mjs:67 root scan uses git ls-files (tracked only), so untracked non-ignored files with secrets are not scanned; add --others --exclude-standard. Medium: ticket What-to-build text goes to jg provider as query (per ADR 0014). Low: jg.mjs:36 trusted-flags denylist (prefer allowlist); dispatch-context.mjs:185 non-atomic cache write; :67 --root runs git in operator-chosen dir. Detail in handoffs/87-security.md.
- **orchestrator, 2026-10-01:** qa light verify pass (48841 tok), security pass (47075 tok; M1/L1/L2 filed as 92, M2 allowed by ADR 0014). PR 119. After merge the user applies the .claude diff in 87-developer.md.
