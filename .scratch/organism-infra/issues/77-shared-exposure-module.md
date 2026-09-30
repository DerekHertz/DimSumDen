# 77: Shared exposure module for everything that leaves the machine

**Type:** task

**Priority:** P1

**What to build:** From 67's security review (`handoffs/67-security.md`, "Required new ticket"). Add `scripts/exposure.mjs` exporting `DENIED_PATHS`, `isDenied(path)` and `hasSecret(text)`. `hasSecret` wraps `SECRET_PATTERNS` (`scripts/risk-check.mjs`) and adds the missing shapes: unquoted `NAME_KEY=value` env lines, `Authorization: Bearer`, JWT, `sk_live_`, `github_pat_`, `gho_`/`ghs_`, `npm_`, URL credentials, `aws_secret_access_key = ...`. Folds in ticket 46's pattern gaps (`gh*_`, Slack) and its dead release-gate cleanup.

`jev.mjs` and the jg wrapper import it. Each Jev point sends only its allowlisted inputs: tier = ticket; verify = ticket + `--tests`; route-new = ticket; route-bounce = ticket + bounce comment; wake = ticket header + new comment.

`--tests` must realpath to a regular non-symlink file of at most 1 MB, and not be `.env*`, `credentials*`, `*.pem`/`*.key`, inside a dot-directory or `.git/`, `.scratch/**/handoffs`, `_handoffs`, `_requests`, `*.lock`, or `usage.jsonl`. The secret check runs on the whole assembled text before the 16k truncation.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [ ] `exposure.mjs` exports `DENIED_PATHS`, `isDenied`, `hasSecret`; `risk-check.mjs` and `jev.mjs` share one pattern source (tests)
- [ ] Each listed secret shape, and 46's shapes, is caught by `hasSecret` using synthetic values (tests)
- [ ] `jev.mjs --tests` rejects each denied path, a symlink, a directory, and a file over 1 MB, with no row sent or logged (tests)
- [ ] Each Jev point's request contains only its allowlisted inputs, checked through `decide` with an injected transport and a temp board (tests)
- [ ] 46's dead release-gate code is removed or its ticket comment says why it stays

## Comments

- **Created (orchestrator, 2026-09-30):** From 67's security review, published with the user's yes. Takes in ticket 46; blocks 70 and 72.
- **qa, 2026-09-30:** qa specify done: 39 failing tests on tests/77-shared-exposure-module (f05777f). See handoffs/77-qa-specify.md.
- **developer, 2026-09-30:** developer done: 62ace3b on dev/77-shared-exposure-module; qa's 39 tests pass, npm test 968/968; 46's dead ternary removed. jg wrapper not built yet (nothing to import). See handoffs/77-developer.md.
- **qa, 2026-09-30:** QA pass: 968/968 tests pass, 0 fail, 0 skip; test file unchanged from f05777f; all 5 ACs covered (AC5 human-verified). Security note: wake point omits author-undefined guard — flagged in handoff for security cell. See handoffs/77-qa-verify.md.
- **security, 2026-09-30:** Security bounce: jev.mjs:108 codeWakes returns false when author===undefined, sending untrusted comment text to Jev. 67 policy: unknown/absent author must code-wake. Fix: author==null||!CELL_TYPES.includes(author). Update ok 652 to pass author field. Q1 ruled: decide() is last line of defense. Q2 ruled: exit 2 for refused --tests is correct; genome wording needs user-permissioned update. See handoffs/77-security.md.
- **developer, 2026-09-30:** security-bounce fix 9314bd6; npm test 969/969; see handoffs/77-developer-2.md
- **qa, 2026-09-30:** QA pass re-verify: 969/969 pass, jev.mjs:108 fix confirmed (author==null||!CELL_TYPES), test edits are security-required strengthening. Ready for security re-review.
- **security, 2026-09-30:** Security pass. HIGH (jev.mjs:108 author=undefined bypass) closed. Regression tests added. gitleaks clean 190902c..9314bd6. npm audit 0. No new deps or CI changes.
