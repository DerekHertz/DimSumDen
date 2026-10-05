# Handoff: organism-infra/134 qa verify

```json
{
  "ticket": "organism-infra/134-os-agnostic-usage-reading",
  "cell": "qa",
  "mode": "verify",
  "current_step": "QA pass: all 2017 tests green; AC1-7 mapped to tests and passing; AC8 human-verified (gated edits pending user); no test assertions loosened.",
  "artifacts": ["scripts/usage-token.mjs (new)", "scripts/usage-claude.mjs (modified)", "scripts/usage-keychain.test.mjs unchanged"],
  "decisions": ["findToken returns {token, source} or {token: null, platform, reasons}; env seams (USAGE_PLATFORM, USAGE_SECURITY_BIN, USAGE_SECURITY_TIMEOUT_MS) are pinned by tests and implemented"],
  "failures": [],
  "pending": [
    {"item": "User applies AC8 gated wording edits (CLAUDE.md, usage-watch SKILL.md) documented in 134-developer.md handoff", "owner": "user"},
    {"item": "Full security review (credential read, child process, timeout handling)", "owner": "security"}
  ]
}
```

## State

QA pass: all 2017 tests pass with no skips or failures; no test assertions removed or loosened between specify (b1bc6b2) and developer (34adb60).

## What changed

Branch `feat/134-os-agnostic-usage-reading` @ 34adb60 (developer commit). Files: scripts/usage-token.mjs (new, 79 lines), scripts/usage-claude.mjs (modified, 6 lines changed). Gated files (CLAUDE.md, usage-watch SKILL.md) at f36d038 (user's commit, awaiting edits).

## Acceptance criteria mapping

- AC1: credentials file unchanged → usage-401.test.mjs, usage-provider.test.mjs green; AC1 tests in keychain suite
- AC2: darwin Keychain token → AC2 tests (token read, legacy/explicit invocations)
- AC3: injectable fake binary → HOME/PATH isolation; fake in every test
- AC4: failure paths (missing, denied, non-JSON, timeout, missing binary) → AC4 tests all pass; diagnostics name platform
- AC5: token never leaks → AC5 tests; leak assertions in every AC4 test
- AC6: native Windows → AC6 test confirms fails with clear message, never calls Keychain
- AC7: statusline.mjs live usage → AC7 test passes (statusline unchanged, shells out to usage.mjs)
- AC8: gated wording fix → human-verified (developer wrote edits into 134-developer.md)

## Gotchas

None. Clean verify: tests were well-specified, developer implemented exactly to spec, all tests pass unmodified. One unrelated UI test failure exists on main (apps/ui overlay) but does not affect this ticket.
