# Handoff: organism-infra/134 qa specify

```json
{
  "ticket": "organism-infra/134-os-agnostic-usage-reading",
  "cell": "qa",
  "mode": "specify",
  "current_step": "Failing tests committed on tests/134-os-agnostic-usage-reading (b1bc6b2): scripts/usage-keychain.test.mjs, 18 tests, 16 red for the right reason (feature missing), 2 green AC1 regression guards.",
  "artifacts": [
    "scripts/usage-keychain.test.mjs",
    "branch tests/134-os-agnostic-usage-reading @ b1bc6b2"
  ],
  "decisions": [
    "Keychain payload shape confirmed (structure only): claudeAiOauth.accessToken is the same path as the credentials file. The item also holds claudeAiOauth.refreshToken and an mcpOAuth map of other servers' accessTokens, so tests assert those are never sent or printed, not just the access token.",
    "Env seams pinned by the tests, developer must use these exact names: USAGE_PLATFORM (overrides process.platform: darwin|linux|win32), USAGE_SECURITY_BIN (the security binary, default 'security'), USAGE_SECURITY_TIMEOUT_MS (bound on the Keychain read, tests use 1000, default under 10 s).",
    "Keychain read must be `security find-generic-password` with the service name 'Claude Code-credentials' in argv (the test checks both, and that no secret is in argv). Payload read from stdout.",
    "Native Windows is pinned as NOT supported: win32 with no credentials file exits 1 with a 'usage:' diagnostic naming win32 and credentials.json, never calling the Keychain. The developer records this on the ticket. If the orchestrator prefers support, that one test changes deliberately.",
    "Failure diagnostics must contain the platform string (darwin/linux/win32), start with 'usage: ', and on darwin name both the credentials file ('credentials.json') and 'keychain'. Hang test also expects /timeout|timed out|deadline/ and the hung child killed.",
    "AC7 (statusline) is tested end to end: statusline.mjs with its default usage script, a fetch preload via NODE_OPTIONS and the fake Keychain must print '5h 53% -> 20:26Z · wk 22%'. This passes only if statusline.mjs needs no change of its own.",
    "Human-verified, no automated test: (a) AC8 the gated-file wording fix (usage-watch skill, CLAUDE.md Cloud sessions), developer writes the edit into its handoff; (b) 'reports which source answered': the output contract is unchanged, so the source name is not observable at the CLI. If the developer exposes it (for example one stderr line on success), qa verify judges it.",
    "Criterion map: AC1 -> 'AC1' tests here plus existing usage-401.test.mjs and usage-provider.test.mjs; AC2 -> 'AC2' tests; AC3 -> HOME and PATH isolation plus fake in every test and the 'AC3' test; AC4 -> 'AC4' tests (missing, denied, non-json, no-token, hang timeout, missing binary, sources named, linux); AC5 -> 'AC5' tests and the leak assertions in every AC4 test; AC6 -> 'AC6' test; AC7 -> 'AC7' test."
  ],
  "failures": [],
  "pending": [
    {
      "item": "Implement the token lookup in scripts/usage-claude.mjs behind one function, make scripts/usage-keychain.test.mjs green, record the Windows decision on the ticket, and write the gated-file wording edit into the handoff",
      "owner": "developer"
    },
    {
      "item": "Full security review (the ticket reads a credential, so it applies whatever risk-check says)",
      "owner": "security"
    }
  ]
}
```

## Keychain read on this Mac

`security find-generic-password -s "Claude Code-credentials" -w` was run once and returned immediately with no hang or denial. Only key names and value types were inspected; no value was printed or stored.

## Environment issues

None.
