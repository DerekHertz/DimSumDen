# 157 qa verify (light)

Ticket: organism-infra/157-usage-reset-local-time
Branch: feat/157-usage-reset-local-time (verified at 9b04b41)
Specify sha: 8414c48
Mode: light verify (qa specified this ticket, so this is the light path)

## Verdict

QA pass on the light-verify checks. Step 4 lists one out-of-scope change for the orchestrator and security to decide (see below).

## Light verify steps

1. Suite: not re-run. The orchestrator said to use the developer's saved output at /tmp/157-tests.txt. That file shows `# tests 2734`, `# pass 2734`, `# fail 0`, `# skipped 0`. The 13 resets_local tests (lines 2213-2225 of that file) are all `ok`. I did not confirm the file was produced at 9b04b41.
2. Test-file diff: `git diff 8414c48 HEAD -- scripts/usage-reset-local.test.mjs scripts/usage-keychain.test.mjs scripts/usage-provider.test.mjs` is empty. No specify assertion was removed or loosened.
3. Criterion-to-test map:
   - AC1 (resets_local in system zone, resets_at unchanged): scripts/usage-reset-local.test.mjs tests "AC1 claude: each window carries resets_local...", "AC1 claude: the ticket example...", "AC1 codex: each window carries...", "AC1 claude: resets_at is passed through byte-for-byte...", "AC1 codex: resets_at stays the canonical UTC ISO string...", "AC1: percent and every other existing key are unchanged...".
   - AC2 (fixed TZ across DST; missing reset time): "AC2 claude: autumn DST change...", "AC2 claude: spring DST change skips 02:00...", "AC2 codex: DST change...", "AC2: the zone is the system zone... (TZ=UTC)", "AC2 claude: a missing reset time stays unknown...", "AC2 claude: an explicit null reset time stays unknown", "AC2 claude: an unparseable reset time stays unknown...".
   - AC3 (existing readers of resets_at still pass): full suite pass, plus the extended usage-keychain and usage-provider tests (diff in 8414c48).
   - AC4 (usage-watch skill edit in the handoff for the user to apply): human-verified (marked in specify).
4. Files touched outside the ticket's scope (listed, not judged):
   - `.claude/skills/usage-watch/SKILL.md`, changed in commit 9b04b41. The ticket asks the developer to write this edit as text in its handoff, and `.claude/` edits are a gated patch under `.scratch/_handoffs/gated/`. The commit edits the file directly. Orchestrator and security to decide.
   - Within the ticket's scope but worth noting: `scripts/usage-local-time.mjs` (new, commit d4ea005), `scripts/usage-claude.mjs` and `scripts/usage-codex.mjs` (commit d4ea005).

## Notes

- Context reading at the stage boundary: 31975 tokens (state ok).
- No test skipped. No test file changed since specify.

```json
{
  "ticket": "organism-infra/157-usage-reset-local-time",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Light verify done. Verdict QA pass. Out-of-scope .claude/ edit listed for orchestrator and security.",
  "artifacts": [
    "branch feat/157-usage-reset-local-time at 9b04b41",
    "/tmp/157-tests.txt (developer suite output, 2734 pass, 0 fail, 0 skipped)"
  ],
  "decisions": [
    "Suite result taken from /tmp/157-tests.txt as the orchestrator instructed; not re-run"
  ],
  "failures": [],
  "pending": [
    {
      "item": "Decide on commit 9b04b41 editing .claude/skills/usage-watch/SKILL.md directly (gated path per ticket)",
      "owner": "orchestrator"
    },
    {
      "item": "Human verdict on AC4: user applies or approves the usage-watch skill edit",
      "owner": "orchestrator"
    }
  ]
}
```
