# Handoff: organism-infra/134 developer

```json
{
  "ticket": "organism-infra/134-os-agnostic-usage-reading",
  "cell": "developer",
  "current_step": "Implemented and committed on feat/134-os-agnostic-usage-reading (34adb60). scripts/usage-keychain.test.mjs 18/18 green, existing usage-401 and usage-provider tests green. Full npm test 2016/2017: the one failure is an unrelated UI test (see failures). Gated wording edit (AC8) is below for the user to apply.",
  "artifacts": [
    "scripts/usage-token.mjs (new: findToken, describeFailure)",
    "scripts/usage-claude.mjs (uses findToken; output contract and cloud estimate path unchanged)",
    "branch feat/134-os-agnostic-usage-reading @ 34adb60"
  ],
  "decisions": [
    "One function findToken(env) in scripts/usage-token.mjs tries the credentials file, then (darwin only) the Keychain via `security find-generic-password -s 'Claude Code-credentials' -w`, and returns {token, source} or {token:null, platform, reasons}. usage-claude.mjs only calls it; statusline.mjs is untouched (it shells out to usage.mjs).",
    "Env seams as pinned by qa: USAGE_PLATFORM, USAGE_SECURITY_BIN, USAGE_SECURITY_TIMEOUT_MS (default 5000 ms, spawnSync with SIGKILL on timeout, so the child is reaped).",
    "No secret can reach output: the diagnostic is built only from fixed strings and errno names, never from the child's stdout/stderr; the token is only in the Authorization header to api.anthropic.com; argv holds only the service name.",
    "Native Windows is NOT supported (recorded here and in a ticket comment): win32 with no credentials file fails with 'usage: could not read Claude Code credentials on win32 (tried ~/.claude/.credentials.json: not found)', same shape as Linux.",
    "'Reports which source answered': findToken returns `source`; the CLI prints `usage: token from <source>` on stderr only when USAGE_VERBOSE is set, so default stdout/stderr stay unchanged. qa verify to judge.",
    "Small behaviour change: with CLAUDE_CODE_REMOTE set and a credentials file that parses but has no token, the cloud estimate now answers (before: exit 1 'no OAuth access token found'). Cloud sessions have no such file, so this is not reachable in practice."
  ],
  "failures": [
    "npm test: apps/ui/src/overlay/floating-cards.test.mjs 'Ctrl+Enter in the Note sends Deny ... (ruling: m)' fails, also in isolation. It is a UI overlay test with no import of the scripts I changed; not caused by this ticket, not investigated further (out of scope). Orchestrator: confirm it fails on main too."
  ],
  "pending": [
    {
      "item": "User applies the gated wording edit below (AC8); then qa verify, then full security review (the ticket reads a credential)",
      "owner": "user"
    },
    {
      "item": "verify, with USAGE_VERBOSE unset, that nothing changes for existing callers; and judge the optional source line",
      "owner": "qa"
    },
    {
      "item": "Full security review of scripts/usage-token.mjs (credential read, child process, timeout)",
      "owner": "security"
    }
  ]
}
```

## AC8: gated wording edit (not applied; `.claude/` and `CLAUDE.md` are gated)

Only two places say or imply "local means WSL": `CLAUDE.md` line 23 and the `usage-watch` skill (it never says WSL, but it describes the credential path as the only one). Apply with this node script from the repo root:

```js
import fs from "node:fs";
let c = fs.readFileSync("CLAUDE.md", "utf8");
c = c.replace("Locally (WSL) none of it applies.", "Locally (WSL or macOS) none of it applies.");
fs.writeFileSync("CLAUDE.md", c);

const p = ".claude/skills/usage-watch/SKILL.md";
let s = fs.readFileSync(p, "utf8");
s = s.replace(
  "The Claude CLI adapter preserves the existing credential-backed behavior and cloud estimate behavior.",
  "The Claude CLI adapter reads the OAuth token from `~/.claude/.credentials.json` (WSL, Linux) or, on macOS, from the Keychain item `Claude Code-credentials`; native Windows is not supported and exits 1. It keeps the cloud estimate behavior."
);
fs.writeFileSync(p, s);
```

Each `replace` matches exactly one existing string (checked with grep on this branch).

## Environment issues

None.
