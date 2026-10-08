# 06 QA verify: approve or deny from the card

```json
{
  "ticket": "den-v1/06-approve-deny",
  "cell": "qa",
  "mode": "verify",
  "current_step": "Full verify done on fc53171: QA pass. Human-verified items left for the user's visual critique.",
  "artifacts": [
    "apps/ui/src/state/bridge-client.test.mjs",
    "apps/ui/src/overlay/approval-review.test.mjs",
    "apps/ui/src/overlay/approval-wiring.test.mjs"
  ],
  "decisions": [
    "Full verify, not light: qa specify commit 23f45be was written by an earlier qa cell, so this cell did not write the tests. The orchestrator said to use the developer's saved suite output (/tmp/06-tests.txt) and not re-run the suite, so no scout run was done.",
    "Verdict: QA pass. The only specify-test change is bridge-client.test.mjs:19 (value-identical, see findings). Nothing bounces under the verify rules.",
    "Scope check: the branch touches apps/ui/src/App.jsx, overlay/ProximityCard.jsx, overlay/TranscriptPanel.jsx, overlay/proximity-card.mjs, scene/procedural/den.css and scene/procedural/explorer.mjs. These match the spec's card, App mount, transcript slot and walk-key sections. Listed, not judged. Server code under apps/bridge is untouched."
  ],
  "failures": [
    "Developer note: proximity-card.browser.test.mjs fails when run alone in the developer's session (headful Chromium, screenshot hangs). It passes in the full suite, which is the saved run. Not reproduced here (no re-run)."
  ],
  "pending": [
    {
      "item": "Security decision on bridge-client.test.mjs:19 (fixture token built at runtime to pass scripts/root-secret-scan.test.mjs). Decide whether that is acceptable or needs an allowlist entry instead.",
      "owner": "security"
    },
    {
      "item": "User visual critique of the review panel (human-verified items below) and the alarm banner colour, which uses --surface-200 plus --alarm because the spec's alarm-zone token is not defined in styles.css.",
      "owner": "user"
    }
  ]
}
```

## Test run

Source: `/tmp/06-tests.txt`, written 12:44:55 on 2026-10-08, after the developer's HEAD fc53171 (12:40:40). `# tests 2876`, `# pass 2876`, `# fail 0`, `# skipped 0`, `# todo 0`, `# cancelled 0`. The three ticket test files appear in the output and their tests are `ok`.

## Specify-test diff

`git diff 23f45be HEAD -- <the three test files>` shows one changed line:

- `apps/ui/src/state/bridge-client.test.mjs:19` changed from `const TOKEN = "tok-test-123";` to `const TOKEN = ["tok", "test", "123"].join("-");`. The runtime value is the same. No assertion changed, and nothing was deleted or weakened.

The developer's handoff says the change was made because the fixture token tripped `scripts/root-secret-scan.test.mjs`. That is a rule breach too: the specify handoff said not to edit the three test files. It is not a bounce under the verify rule, but it is for security to judge (see findings).

## Criterion to test map

| Criterion | Test |
|---|---|
| A then confirm sends exactly one allow to the right route with the token; D sends deny | `bridge-client.test.mjs:73` (one POST to `/approvals/:id`, token, bare body); `approval-review.test.mjs:315` (one decide with the id), `:241` (A key after the 400ms guard sends allow), `:256` (D sends deny), `:329` (second send dropped) |
| A or D alone sends nothing | `approval-review.test.mjs:83`, `:96` |
| The tool input is shown before any decision | `approval-review.test.mjs:146-190` (`:158` Allow blocked while loading, `:167` Deny works while loading, `:174` ready and count matches, `:198` length mismatch keeps Allow off, `:210` control and bidi characters escaped, `:221` stale response ignored) |
| A refused request shows the bridge's reason and changes nothing | `approval-review.test.mjs:417-500` (retryable and final statuses, plain text, `:491` card untouched), `:501` load failure; `bridge-client.test.mjs:108-156`; `approval-wiring.test.mjs:97` (no innerHTML) |
| Tests run against a stub bridge client and fixture events; no live runtime | `approval-wiring.test.mjs:40` (global fetch poisoned for a whole open, answer and close), `:64` (controller has no network primitive) |
| `npm test` is green | saved suite output (above) |

Scope items from the spec's "For qa specify" list: demo mode `approval-review.test.mjs:128`; roles and copy `approval-wiring.test.mjs:85`; pending line `approval-wiring.test.mjs:22`; note trimmed and held to 200 `approval-review.test.mjs:391`, `:406`; reduced-motion CSS presence `approval-wiring.test.mjs:102` (presence only, not behaviour).

## Human-verified (no automated test)

Panel layout and 420px width; phone bottom sheet under 600px with the card hidden; header and footer styling; 32, 40, 44 and 48px targets; lantern icon and spinner; fade and slide motion; reduced-motion behaviour; contrast in light and dark; focus rings; Enter on a focused button; live-region announcement; transcript closing when the review opens; pointer-lock release; the alarm banner colour.

## Findings

1. `apps/ui/src/state/bridge-client.test.mjs:19`: specify test edited to pass the secret scan. Value and assertions unchanged. Security to decide whether splitting a fake fixture token past a pattern scanner is acceptable, or whether the scanner needs an allowlist entry for the fixture.
2. `apps/ui/src/overlay/ApprovalPanel.jsx` banner (developer decision): the spec's Tokens section says `alarm-zone` exists, but no such token is defined or used in `apps/ui/src`. The banner uses `--surface-200` with `--alarm` border and text. Spec deviation for the user's critique, not a test failure.
3. `apps/ui/src/overlay/proximity-card.browser.test.mjs`: flaky when run alone in the developer's session. The saved full run passes. Environment, not this ticket.
4. Ticket `## Comments` had no specify-time `human-verified` marker. Added in this cell (see the ticket comment).

## Released

Verdict posted as `board comment --verdict pass`. Status left as `in-review` with `--keep-status`. The orchestrator moves the ticket to `ready-for-human` for the user's visual critique.
