# 134: usage-watch reads live Claude usage on macOS as well as WSL

**Type:** feature

**Priority:** P1

**Blocked by:** None (can start immediately)

**Status:** resolved

**Serves:** testbed friction (user, 2026-10-04): the user now runs the orchestrator from a MacBook, where `node scripts/usage.mjs --provider claude` exits 1 with "could not read Claude Code credentials". Every dispatch and merge question must state the 5-hour usage, so each one needs a manual reading today.

## What to build

`scripts/usage-claude.mjs` reads the OAuth token only from `~/.claude/.credentials.json`. That file is absent on macOS, where Claude Code keeps the login in the Keychain (a generic-password item with service `Claude Code-credentials` exists on the user's Mac; its payload shape is unconfirmed and is the first thing to check).

Put the token lookup behind one function that tries each source in order and reports which one answered:

1. `~/.claude/.credentials.json` (today's behaviour, unchanged on WSL and Linux).
2. On `darwin`: the Keychain item, read with the `security` command.
3. Otherwise today's failure, with a message that names the platform and the sources tried.

The output contract stays the same: the canonical `{"5-hour":{"percent","resets_at"},"weekly":{...}}` JSON, exit 1 on any failure so `usage-watch` falls back to asking the user. The cloud estimate path (`CLAUDE_CODE_REMOTE`) and the Codex adapter are untouched.

## Acceptance criteria

- [ ] On a machine with the credentials file, behaviour and output are unchanged (existing tests still pass)
- [ ] On `darwin` with no credentials file, the token comes from the Keychain and the same JSON is printed
- [ ] The Keychain command is injectable for tests (an env override, like `NOTIFY_POWERSHELL` in `scripts/notify.mjs`); tests use a fake binary and never touch the real Keychain
- [ ] A missing Keychain item, a denied prompt, a non-JSON payload, or a timeout exits 1 with a `usage:` diagnostic naming the platform; no hang
- [ ] The token is never printed, logged, or passed on a command line, and is sent only to `api.anthropic.com` (test asserts it is absent from stdout and stderr on every failure path)
- [ ] Native Windows is either supported or fails with the same clear message; the ticket records which
- [ ] `scripts/statusline.mjs` shows live usage on macOS through the same path, with no change of its own
- [ ] Wording that says local means WSL (`usage-watch` skill, `CLAUDE.md` "Cloud sessions") is corrected; these are gated files, so the developer writes the edit into its handoff

## Notes

- This reads a credential, so it gets full `security` review whatever `risk-check` says.
- Out of scope: `scripts/notify.mjs` (Windows toast, falls back to a terminal bell on macOS). File separately if the bell is not enough.

## Comments

- **orchestrator, 2026-10-04:** Filed at the user's request ("lets get an OS agnostic usage watch mod"). Not dispatched: the orchestrator session was past its 80k context gate.
- **qa, 2026-10-05:** qa specify done: failing tests committed, ready for developer
- **developer, 2026-10-05:** Windows decision: native Windows is not supported; it fails like Linux with a usage: diagnostic naming win32. Gated wording edit (AC8) is in handoff 134-developer.md for the user to apply.
- **qa, 2026-10-05:** All tests pass; AC1-7 verified; AC8 human-verified (gated edits pending user)
- **security, 2026-10-05:** Security pass. No critical/high. Low: usage-token.mjs:38,42 bare 'security' via PATH + USAGE_SECURITY_BIN override (env control already implies code exec; optional /usr/bin/security). Low: full Keychain item held in memory briefly, only accessToken kept, nothing printed. gitleaks clean, no deps/CI changes. See handoffs/134-security.md.
